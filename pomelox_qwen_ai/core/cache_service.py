"""
Redis Cache Service for AI Chat responses.
Two-tier caching: exact-match (0ms) + semantic similarity (50-100ms).
Persistent cache (no TTL) — cleared only when knowledge base is updated.
Keys use dept_id prefix for per-school cache invalidation.
"""
import hashlib
import json
import logging
import re
import time
import numpy as np

logger = logging.getLogger(__name__)

_redis_client = None
_redis_available = False
CACHE_PREFIX = "pomelo:chat:"
SEMANTIC_PREFIX = "pomelo:semcache:"  # Stores embeddings for semantic lookup
STATS_PREFIX = "pomelo:stats:"

# Cache TTL config — "hit-refresh" strategy:
# Popular entries stay alive indefinitely, unused ones expire after CACHE_TTL
CACHE_TTL = 30 * 24 * 3600  # 30 days base TTL, refreshed on every hit

# Semantic cache config
SEMANTIC_SIMILARITY_THRESHOLD = 0.90  # Balanced threshold: quality + hit rate
SEMANTIC_CACHE_ENABLED = True


def _get_redis():
    """Lazy-init Redis connection."""
    global _redis_client, _redis_available
    if _redis_client is not None:
        return _redis_client if _redis_available else None

    try:
        import redis
        _redis_client = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True,
                                     socket_connect_timeout=2, socket_timeout=2)
        _redis_client.ping()
        _redis_available = True
        logger.info("[Cache] Redis connected")
        return _redis_client
    except Exception as e:
        _redis_available = False
        logger.warning("[Cache] Redis unavailable: %s", e)
        return None


def normalize_question(q):
    """Normalize question text to improve exact-match hit rate."""
    q = q.strip().lower()
    # Punctuation and whitespace normalization
    q = re.sub(r'[？?！!。.，,、；;：:\s]+', ' ', q)
    q = re.sub(r'\s+', ' ', q).strip()
    # Remove common filler words (Chinese)
    for word in ['请问', '想问一下', '想问', '你好', '请', '呢', '吗', '啊', '哦', '嗯']:
        q = q.replace(word, '')
    return q.strip()


def _cache_key(question, dept_id):
    """Generate deterministic cache key with dept_id prefix for targeted invalidation."""
    normalized = normalize_question(question)
    h = hashlib.md5(normalized.encode('utf-8')).hexdigest()
    return "%s%s:%s" % (CACHE_PREFIX, dept_id, h)


def _semantic_key(dept_id, cache_hash):
    """Key for storing embedding alongside a cached response."""
    return "%s%s:%s" % (SEMANTIC_PREFIX, dept_id, cache_hash)


def _record_stats(r, hit_type="miss"):
    """Increment hit/miss counters for monitoring."""
    try:
        if hit_type == "exact":
            r.incr(STATS_PREFIX + "hits")
            r.incr(STATS_PREFIX + "hits_exact")
        elif hit_type == "semantic":
            r.incr(STATS_PREFIX + "hits")
            r.incr(STATS_PREFIX + "hits_semantic")
        else:
            r.incr(STATS_PREFIX + "misses")
    except Exception:
        pass


def _cosine_similarity(v1, v2):
    """Fast cosine similarity using numpy."""
    v1_arr = np.array(v1, dtype=np.float32)
    v2_arr = np.array(v2, dtype=np.float32)
    dot = np.dot(v1_arr, v2_arr)
    norm1 = np.linalg.norm(v1_arr)
    norm2 = np.linalg.norm(v2_arr)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))


def _get_query_embedding(question):
    """Compute query embedding using the RAG service's embed model."""
    try:
        from core.rag_service import _init_llama_index
        _, _, Settings, _, _ = _init_llama_index()
        if Settings is None or not hasattr(Settings, 'embed_model'):
            return None
        return Settings.embed_model.get_text_embedding(question)
    except Exception as e:
        logger.warning("[Semantic Cache] Embedding failed: %s", e)
        return None


def _semantic_lookup(question, dept_id, r):
    """
    Scan cached embeddings for this dept and find the most similar one.
    Returns the cached response dict if similarity >= threshold, else None.
    """
    if not SEMANTIC_CACHE_ENABLED:
        return None

    t0 = time.time()
    query_embedding = _get_query_embedding(normalize_question(question))
    if query_embedding is None:
        return None

    # Scan all semantic keys for this dept
    pattern = "%s%s:*" % (SEMANTIC_PREFIX, dept_id)
    best_score = 0.0
    best_cache_key = None

    try:
        for sem_key in r.scan_iter(match=pattern, count=200):
            emb_json = r.get(sem_key)
            if not emb_json:
                continue
            sem_data = json.loads(emb_json)
            cached_embedding = sem_data.get('embedding')
            if not cached_embedding:
                continue

            sim = _cosine_similarity(query_embedding, cached_embedding)
            if sim > best_score:
                best_score = sim
                best_cache_key = sem_data.get('cache_key')

        elapsed = time.time() - t0

        if best_score >= SEMANTIC_SIMILARITY_THRESHOLD and best_cache_key:
            # Fetch the actual cached response
            cached_data = r.get(best_cache_key)
            if cached_data:
                result = json.loads(cached_data)
                # Refresh TTL on semantic hit — popular entries stay alive
                r.expire(best_cache_key, CACHE_TTL)
                print("[Cache] SEMANTIC HIT for dept=%s score=%.3f time=%.3fs" % (
                    dept_id, best_score, elapsed), flush=True)
                return result

        if best_score > 0:
            print("[Cache] SEMANTIC MISS for dept=%s best=%.3f (threshold=%.2f) time=%.3fs" % (
                dept_id, best_score, SEMANTIC_SIMILARITY_THRESHOLD, elapsed), flush=True)
            # Record best_score for threshold tuning analysis
            # View with: redis-cli LRANGE pomelo:score_log 0 -1
            try:
                r.lpush(STATS_PREFIX + "score_log", "%.4f:%s:%s" % (best_score, dept_id, time.strftime("%m%d")))
                r.ltrim(STATS_PREFIX + "score_log", 0, 999)  # Keep last 1000 entries
            except Exception:
                pass

    except Exception as e:
        logger.warning("[Semantic Cache] Lookup error: %s", e)

    return None


def get_cached_response(question, dept_id):
    """
    Two-tier cache lookup:
    1. Exact match (0ms) — normalized question hash
    2. Semantic match (50-100ms) — embedding cosine similarity ≥ 0.93
    Returns dict with 'answer', 'rag_score', 'source_type' or None on miss.
    """
    r = _get_redis()
    if r is None:
        return None

    try:
        # Tier 1: Exact match
        key = _cache_key(question, dept_id)
        data = r.get(key)
        if data:
            result = json.loads(data)
            # Refresh TTL on hit — popular entries stay alive
            r.expire(key, CACHE_TTL)
            _record_stats(r, "exact")
            print("[Cache] EXACT HIT for dept=%s key=%s" % (dept_id, key[-8:]), flush=True)
            return result

        # Tier 2: Semantic match
        result = _semantic_lookup(question, dept_id, r)
        if result:
            _record_stats(r, "semantic")
            return result

        _record_stats(r, "miss")
    except Exception as e:
        logger.warning("[Cache] Get error: %s", e)
    return None


def set_cached_response(question, dept_id, answer,
                         rag_score=0.0, source_type="knowledge_base"):
    """Cache a response permanently with embedding for semantic lookup."""
    if not answer or len(answer) < 20:
        return

    r = _get_redis()
    if r is None:
        return

    try:
        key = _cache_key(question, dept_id)
        data = json.dumps({
            'answer': answer,
            'rag_score': rag_score,
            'source_type': source_type,
            'cached_at': time.time()
        }, ensure_ascii=False)
        r.set(key, data, ex=CACHE_TTL)  # 30-day TTL, refreshed on every hit
        print("[Cache] SET for dept=%s key=%s (ttl=%dd)" % (dept_id, key[-8:], CACHE_TTL // 86400), flush=True)

        # Store embedding for semantic cache
        if SEMANTIC_CACHE_ENABLED:
            try:
                normalized = normalize_question(question)
                embedding = _get_query_embedding(normalized)
                if embedding:
                    cache_hash = hashlib.md5(normalized.encode('utf-8')).hexdigest()
                    sem_key = _semantic_key(dept_id, cache_hash)
                    sem_data = json.dumps({
                        'cache_key': key,
                        'question': normalized,
                        'embedding': embedding,
                    })
                    r.set(sem_key, sem_data, ex=CACHE_TTL)
                    print("[Cache] SEMANTIC SET for dept=%s key=%s (ttl=%dd)" % (dept_id, sem_key[-8:], CACHE_TTL // 86400), flush=True)
            except Exception as e:
                logger.warning("[Semantic Cache] Set embedding error: %s", e)

    except Exception as e:
        logger.warning("[Cache] Set error: %s", e)


def clear_cache_by_dept(dept_id):
    """Clear all cached responses and semantic entries for a specific school."""
    r = _get_redis()
    if r is None:
        return 0

    try:
        deleted = 0
        for pattern in ["%s%s:*" % (CACHE_PREFIX, dept_id),
                        "%s%s:*" % (SEMANTIC_PREFIX, dept_id)]:
            for key in r.scan_iter(match=pattern, count=100):
                r.delete(key)
                deleted += 1
        if deleted:
            print("[Cache] Cleared %d entries for dept=%s" % (deleted, dept_id), flush=True)
        return deleted
    except Exception as e:
        logger.warning("[Cache] Clear by dept error: %s", e)
        return 0


def clear_all_cache():
    """Clear entire chat cache including semantic entries."""
    r = _get_redis()
    if r is None:
        return 0

    try:
        deleted = 0
        for pattern in [CACHE_PREFIX + "*", SEMANTIC_PREFIX + "*"]:
            for key in r.scan_iter(match=pattern, count=100):
                r.delete(key)
                deleted += 1
        if deleted:
            print("[Cache] Cleared ALL %d cached entries" % deleted, flush=True)
        return deleted
    except Exception as e:
        logger.warning("[Cache] Clear all error: %s", e)
        return 0


def get_cache_stats():
    """Return cache stats including hit/miss rates and semantic breakdown."""
    r = _get_redis()
    if r is None:
        return {"available": False}

    try:
        # Count exact-match entries
        exact_count = 0
        for _ in r.scan_iter(match=CACHE_PREFIX + "*", count=100):
            exact_count += 1

        # Count semantic entries
        semantic_count = 0
        for _ in r.scan_iter(match=SEMANTIC_PREFIX + "*", count=100):
            semantic_count += 1

        hits = int(r.get(STATS_PREFIX + "hits") or 0)
        hits_exact = int(r.get(STATS_PREFIX + "hits_exact") or 0)
        hits_semantic = int(r.get(STATS_PREFIX + "hits_semantic") or 0)
        misses = int(r.get(STATS_PREFIX + "misses") or 0)
        total = hits + misses
        hit_rate = round(hits / total * 100, 1) if total > 0 else 0

        # Score distribution from semantic MISS logs
        score_log = r.lrange(STATS_PREFIX + "score_log", 0, -1) or []
        scores = []
        for entry in score_log:
            try:
                scores.append(float(entry.split(":")[0]))
            except Exception:
                pass

        score_dist = {}
        if scores:
            score_dist = {
                "count": len(scores),
                "avg": round(sum(scores) / len(scores), 4),
                "max": round(max(scores), 4),
                "min": round(min(scores), 4),
                "above_085": sum(1 for s in scores if s >= 0.85),
                "above_090": sum(1 for s in scores if s >= 0.90),
            }

        return {
            "available": True,
            "cached_entries": exact_count,
            "semantic_entries": semantic_count,
            "hits": hits,
            "hits_exact": hits_exact,
            "hits_semantic": hits_semantic,
            "misses": misses,
            "hit_rate_pct": hit_rate,
            "semantic_threshold": SEMANTIC_SIMILARITY_THRESHOLD,
            "score_distribution": score_dist
        }
    except Exception:
        return {"available": False}


def reset_stats():
    """Reset hit/miss counters."""
    r = _get_redis()
    if r is None:
        return
    try:
        r.delete(STATS_PREFIX + "hits", STATS_PREFIX + "misses",
                 STATS_PREFIX + "hits_exact", STATS_PREFIX + "hits_semantic")
    except Exception:
        pass
