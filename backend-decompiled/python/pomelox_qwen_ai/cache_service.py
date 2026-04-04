"""
Redis Cache Service for AI Chat responses.
Exact-match caching: hash(question + dept_id) -> cached response.
Persistent cache (no TTL) — cleared only when knowledge base is updated.
"""
import hashlib
import json
import logging
import time

logger = logging.getLogger(__name__)

_redis_client = None
_redis_available = False
CACHE_PREFIX = "pomelo:chat:"


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
        logger.warning(f"[Cache] Redis unavailable: {e}")
        return None


def _cache_key(question: str, dept_id: int) -> str:
    """Generate deterministic cache key from question + dept_id."""
    raw = f"{dept_id}:{question.strip().lower()}"
    return CACHE_PREFIX + hashlib.md5(raw.encode('utf-8')).hexdigest()


def get_cached_response(question: str, dept_id: int):
    """
    Look up cached response. Returns dict with 'answer', 'rag_score', 'source_type'
    or None on miss.
    """
    r = _get_redis()
    if r is None:
        return None

    try:
        key = _cache_key(question, dept_id)
        data = r.get(key)
        if data:
            result = json.loads(data)
            print(f"[Cache] HIT for dept={dept_id} key={key[-8:]}", flush=True)
            return result
    except Exception as e:
        logger.warning(f"[Cache] Get error: {e}")
    return None


def set_cached_response(question: str, dept_id: int, answer: str,
                         rag_score: float = 0.0, source_type: str = "knowledge_base"):
    """Cache a response permanently. Only cache if answer is non-empty."""
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
        r.set(key, data)  # No TTL — persistent until explicitly cleared
        print(f"[Cache] SET for dept={dept_id} key={key[-8:]} (permanent)", flush=True)
    except Exception as e:
        logger.warning(f"[Cache] Set error: {e}")


def clear_cache_by_dept(dept_id: int) -> int:
    """Clear all cached responses for a specific school. Call after updating knowledge base."""
    r = _get_redis()
    if r is None:
        return 0

    try:
        # Since keys are hashed, we need to scan all and check
        # But we can use a dept-specific prefix pattern via a secondary index
        # For now, clear ALL chat cache (simple and safe)
        keys = r.keys(CACHE_PREFIX + "*")
        if keys:
            deleted = r.delete(*keys)
            print(f"[Cache] Cleared {deleted} entries (dept={dept_id} triggered)", flush=True)
            return deleted
        return 0
    except Exception as e:
        logger.warning(f"[Cache] Clear error: {e}")
        return 0


def clear_all_cache() -> int:
    """Clear entire chat cache. Call after major knowledge base updates."""
    r = _get_redis()
    if r is None:
        return 0

    try:
        keys = r.keys(CACHE_PREFIX + "*")
        if keys:
            deleted = r.delete(*keys)
            print(f"[Cache] Cleared ALL {deleted} cached entries", flush=True)
            return deleted
        return 0
    except Exception as e:
        logger.warning(f"[Cache] Clear error: {e}")
        return 0


def get_cache_stats():
    """Return basic cache stats."""
    r = _get_redis()
    if r is None:
        return {"available": False}

    try:
        keys = r.keys(CACHE_PREFIX + "*")
        return {"available": True, "cached_entries": len(keys)}
    except Exception:
        return {"available": False}
