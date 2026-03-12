"""
RAG Service Module with Hybrid Retrieval
Provides Retrieval-Augmented Generation functionality based on school knowledge base
Supports hybrid retrieval: vector index (indexed=true) + database (indexed=false)
"""
# import torch  # Disabled on Linux servers (no torch installed)
import os
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from config import Config

logger = logging.getLogger(__name__)

# ==================== Singleton Cache ====================
_llama_index_cache = None
_doc_embed_model = None  # Separate document embedding model (TEXT_TYPE_DOCUMENT)


def _init_llama_index():
    """Initialize LlamaIndex components on demand (singleton pattern)"""
    global _llama_index_cache, _doc_embed_model
    if _llama_index_cache is not None:
        return _llama_index_cache

    try:
        from llama_index.core import StorageContext, load_index_from_storage, Settings
        from llama_index.embeddings.dashscope import (
            DashScopeEmbedding,
            DashScopeTextEmbeddingModels,
            DashScopeTextEmbeddingType,
        )
        # Try to import rerank for newer versions
        HAS_RERANK = False
        DashScopeRerank = None
        try:
            from llama_index.postprocessor.dashscope_rerank import DashScopeRerank
            HAS_RERANK = True
        except ImportError:
            # For newer versions that might have different import path
            try:
                from llama_index.core.postprocessor import DashScopeRerank
                HAS_RERANK = True
            except ImportError:
                HAS_RERANK = False
                logger.warning("[Init] DashScope Rerank module not available - reranking will be disabled")

        # Configure embedding models
        try:
            # Query embedding model (TEXT_TYPE_QUERY for asymmetric retrieval)
            # DashScope V2 is asymmetric: queries and documents use different embeddings
            QUERY_EMBED_MODEL = DashScopeEmbedding(
                model_name=DashScopeTextEmbeddingModels.TEXT_EMBEDDING_V2,
                text_type=DashScopeTextEmbeddingType.TEXT_TYPE_QUERY,
            )
            Settings.embed_model = QUERY_EMBED_MODEL

            # Document embedding model for pre-computing KB entry embeddings
            _doc_embed_model = DashScopeEmbedding(
                model_name=DashScopeTextEmbeddingModels.TEXT_EMBEDDING_V2,
                text_type=DashScopeTextEmbeddingType.TEXT_TYPE_DOCUMENT,
            )
            logger.info("[Init] Embedding models initialized (query=TEXT_TYPE_QUERY, doc=TEXT_TYPE_DOCUMENT)")
        except Exception as e:
            logger.error(f"[Init] CRITICAL: Embedding model initialization failed: {e}. AI retrieval will not work!")

        _llama_index_cache = (StorageContext, load_index_from_storage, Settings, DashScopeRerank, HAS_RERANK)
        return _llama_index_cache
    except (ImportError, MemoryError, Exception) as e:
        logger.error(f"[Init] LlamaIndex initialization failed: {e}")
        _llama_index_cache = (None, None, None, None, False)
        return _llama_index_cache


from database import get_database

# Index cache to avoid repeated loading
_index_cache = {}


def load_index(dept_id: int):
    """
    Load department vector index (with caching)

    Args:
        dept_id: Department ID, e.g., 211, 216, etc.

    Returns:
        VectorStoreIndex or None (if knowledge base doesn't exist)
    """
    StorageContext, load_index_from_storage, Settings, _, _ = _init_llama_index()
    if StorageContext is None or load_index_from_storage is None:
        print("[Vector Index] LlamaIndex not available, skipping vector retrieval")
        return None

    if dept_id in _index_cache:
        return _index_cache[dept_id]

    index_path = os.path.join(Config.VECTOR_STORE_PATH, str(dept_id))

    if not os.path.exists(index_path):
        print(f"[Vector Index] Knowledge base does not exist: {index_path}")
        return None

    try:
        storage_context = StorageContext.from_defaults(persist_dir=index_path)
        index = load_index_from_storage(storage_context)
        _index_cache[dept_id] = index
        print(f"[Vector Index] Knowledge base loaded: {dept_id}")
        return index
    except Exception as e:
        print(f"[Vector Index] Failed to load [{dept_id}]: {e}")
        return None


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """
    Calculate cosine similarity

    Args:
        v1: Vector 1
        v2: Vector 2

    Returns:
        Similarity score (0.0 ~ 1.0)
    """
    try:
        v1_arr = np.array(v1)
        v2_arr = np.array(v2)

        dot_product = np.dot(v1_arr, v2_arr)
        norm_v1 = np.linalg.norm(v1_arr)
        norm_v2 = np.linalg.norm(v2_arr)

        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0

        similarity = dot_product / (norm_v1 * norm_v2)
        return max(0.0, min(1.0, similarity))

    except Exception as e:
        print(f"[Similarity] Calculation failed: {e}")
        return 0.0


def _compute_and_store_embeddings(entries, Settings, db):
    """
    Batch compute embeddings for entries missing them, and persist to DB.
    Uses TEXT_TYPE_DOCUMENT embedding model for knowledge base entries.
    Returns a dict mapping kb_id -> embedding.
    """
    global _doc_embed_model

    need_embedding = [e for e in entries if e.question_embedding is None]
    if not need_embedding:
        return {}

    questions = [e.question for e in need_embedding]
    computed = {}

    # Use document embedding model (TEXT_TYPE_DOCUMENT) for KB entries
    embed_model = _doc_embed_model or (Settings.embed_model if Settings else None)
    if embed_model is None:
        logger.warning("[Database Retrieval] No embedding model available for document embedding")
        return {}

    try:
        # Use batch API if available (DashScope supports batch embedding)
        if hasattr(embed_model, 'get_text_embedding_batch'):
            embeddings = embed_model.get_text_embedding_batch(questions)
        else:
            # Fallback: single API call per question
            embeddings = [embed_model.get_text_embedding(q) for q in questions]

        for entry, emb in zip(need_embedding, embeddings):
            computed[entry.kb_id] = emb
            # Persist embedding to DB for future queries
            try:
                db.update_knowledge(entry.kb_id, {'question_embedding': emb})
            except Exception:
                pass  # Non-critical: will recompute next time

        print(f"[Database Retrieval] Batch computed {len(computed)} embeddings (TEXT_TYPE_DOCUMENT)")
    except Exception as e:
        logger.error(f"[Database Retrieval] Batch embedding failed: {e}")

    return computed


def retrieve_from_database_kb(
    dept_id: int,
    query: str,
    similarity_threshold: float = 0.2
) -> List[Dict[str, Any]]:
    """
    Retrieve unindexed knowledge entries from database.
    Uses pre-computed embeddings stored in DB to avoid per-entry API calls.
    Falls back to batch computation for entries missing embeddings.

    Args:
        dept_id: Department ID
        query: User question
        similarity_threshold: Similarity threshold

    Returns:
        List of retrieval results [{
            'content': str,
            'score': float,
            'source': 'database_kb',
            'kb_id': str
        }]
    """
    db = get_database()

    knowledge_entries = db.get_knowledge_by_dept(
        dept_id=dept_id,
        indexed=False,
        enabled_only=True
    )

    if not knowledge_entries:
        return []

    # Vectorize query (1 API call, uses TEXT_TYPE_QUERY via Settings.embed_model)
    try:
        StorageContext, load_index_from_storage, Settings, _, _ = _init_llama_index()
        if Settings is None or not hasattr(Settings, 'embed_model'):
            print("[Database Retrieval] Embedding model not available, skipping vector retrieval")
            return []
        query_embedding = Settings.embed_model.get_text_embedding(query)
    except Exception as e:
        print(f"[Database Retrieval] Query vectorization failed: {e}")
        return []

    # Batch compute any missing embeddings (0 API calls if all cached)
    computed = _compute_and_store_embeddings(knowledge_entries, Settings, db)

    results = []

    for entry in knowledge_entries:
        try:
            # Use pre-computed embedding (from DB or freshly computed)
            kb_embedding = entry.question_embedding or computed.get(entry.kb_id)
            if kb_embedding is None:
                continue

            similarity = cosine_similarity(query_embedding, kb_embedding)

            if similarity >= similarity_threshold:
                content = f"[Database Knowledge-{entry.kb_id}]\nQuestion: {entry.question}\nAnswer: {entry.answer}"
                results.append({
                    'content': content,
                    'score': similarity,
                    'source': 'database_kb',
                    'kb_id': entry.kb_id
                })

        except Exception as e:
            print(f"[Database Retrieval] Failed to process entry {entry.kb_id}: {e}")
            continue

    results.sort(key=lambda x: x['score'], reverse=True)

    if results:
        print(f"[Database Retrieval] Retrieved {len(results)} unindexed knowledge entries")

    return results


def _normalize_mixed_scores(all_results: List[Dict[str, Any]]) -> None:
    """
    Normalize scores from different sources to make them comparable in-place.
    Rerank scores and cosine similarity scores have different distributions.
    Uses min-max normalization per source group to [0.3, 1.0] range.
    """
    if len(all_results) <= 1:
        return

    # Group by source
    by_source: Dict[str, List[Dict]] = {}
    for r in all_results:
        by_source.setdefault(r['source'], []).append(r)

    # If only one source, no normalization needed
    if len(by_source) <= 1:
        return

    # Normalize each group independently
    for source, group in by_source.items():
        scores = [r['score'] for r in group]
        min_s, max_s = min(scores), max(scores)
        score_range = max_s - min_s

        for r in group:
            r['raw_score'] = r['score']
            if score_range > 0:
                # Normalize to [0.3, 1.0] to preserve relative ordering
                r['score'] = 0.3 + 0.7 * (r['score'] - min_s) / score_range
            # If all same score, keep original

    logger.debug(f"[Score Normalization] Normalized {len(all_results)} results across {len(by_source)} sources")


def retrieve(dept_id: int, query: str, chunk_count: int = None, similarity_threshold: float = None) -> tuple:
    """
    Hybrid retrieval: vector index + database knowledge base

    Args:
        dept_id: Department ID
        query: User question
        chunk_count: Number of chunks to retrieve (defaults to config value)
        similarity_threshold: Similarity threshold (defaults to config value)

    Returns:
        tuple: (retrieved text content, highest relevance score, whether has high quality results)
    """
    chunk_count = chunk_count or Config.RAG_CHUNK_COUNT
    similarity_threshold = similarity_threshold or Config.RAG_SIMILARITY_THRESHOLD
    # High quality threshold (used to determine if web search is needed)
    high_quality_threshold = getattr(Config, 'RAG_HIGH_QUALITY_THRESHOLD', 0.5)

    all_results = []
    max_score = 0.0

    # ==================== Part 1: Vector Index Retrieval ====================
    StorageContext, load_index_from_storage, Settings, DashScopeRerank, HAS_RERANK = _init_llama_index()
    if StorageContext is not None:
        index = load_index(dept_id)
        if index is not None:
            try:
                # Create retriever (reduced from 20 to 10 for faster reranking)
                retriever = index.as_retriever(similarity_top_k=10)
                nodes = retriever.retrieve(query)

                if nodes:
                    # Use DashScope Rerank for reranking if available
                    if HAS_RERANK and DashScopeRerank:
                        try:
                            reranker = DashScopeRerank(top_n=chunk_count, return_documents=True)
                            reranked_nodes = reranker.postprocess_nodes(nodes, query_str=query)
                        except Exception as e:
                            logger.warning(f"[Vector Rerank] Rerank failed, falling back to cosine ordering: {e}")
                            reranked_nodes = nodes[:chunk_count]
                    else:
                        # Skip reranking if not available
                        print("[Vector Rerank] Rerank not available, using original results")
                        reranked_nodes = nodes[:chunk_count]

                    # Convert to unified format
                    for node in reranked_nodes:
                        score = getattr(node, 'score', 0.7)
                        if score >= similarity_threshold:
                            all_results.append({
                                'content': node.text,
                                'score': score,
                                'source': 'vector_index'
                            })
                            max_score = max(max_score, score)

            except Exception as e:
                logger.error(f"[Vector Retrieval] Failed [{dept_id}]: {e}")
    else:
        print("[Vector Retrieval] LlamaIndex not available, skipping vector retrieval")

    # ==================== Part 2: Database Retrieval (Unindexed Knowledge) ====================
    db_results = retrieve_from_database_kb(dept_id, query, similarity_threshold)
    for db_result in db_results:
        all_results.append(db_result)
        max_score = max(max_score, db_result['score'])

    # ==================== Part 3: Normalize and Merge Results ====================
    if not all_results:
        return "", 0.0, False

    # Normalize scores from different sources before merging
    _normalize_mixed_scores(all_results)

    # Sort all results by normalized score
    all_results.sort(key=lambda x: x['score'], reverse=True)

    # Take top chunk_count results
    top_results = all_results[:chunk_count]

    # Format as text
    chunk_texts = []
    for i, result in enumerate(top_results):
        source_label = "Vector Index" if result['source'] == 'vector_index' else "Database (Unindexed)"
        raw_score = result.get('raw_score', result['score'])
        chunk_texts.append(f"[Reference {i+1} - {source_label} (score: {raw_score:.3f})]\n{result['content']}")

    retrieved_content = "\n\n".join(chunk_texts)
    has_high_quality = max_score >= high_quality_threshold and len(chunk_texts) > 0

    print(f"[Hybrid Retrieval] Total results: {len(all_results)}, Vector: {len([r for r in all_results if r['source'] == 'vector_index'])}, Database: {len([r for r in all_results if r['source'] == 'database_kb'])}, Max score: {max_score:.3f}")

    return retrieved_content, max_score, has_high_quality


def retrieve_simple(dept_id: int, query: str) -> str:
    """
    Simplified retrieval function, returns only text content (backward compatible)
    """
    content, _, _ = retrieve(dept_id, query)
    return content


def get_system_prompt(dept_id: int, retrieved_content: str, use_web_search: bool = False) -> str:
    """
    Generate department-specific system prompt with role definition, CoT guidance,
    and few-shot examples for high-quality responses.

    Args:
        dept_id: Department ID
        retrieved_content: Content retrieved by RAG
        use_web_search: Whether to use web search mode

    Returns:
        Complete system prompt
    """
    dept_info = Config.DEPARTMENTS.get(dept_id, {})
    school_name = dept_info.get('name') or Config.ALL_SCHOOL_NAMES.get(dept_id, f'Department {dept_id}')

    if retrieved_content:
        # RAG mode: content retrieved from knowledge base
        prompt = f"""You are PomeloX AI Assistant, an expert advisor dedicated to {school_name}. You help Chinese international students with questions about campus life, academics, housing, visa, activities, and local information.

## Your Role
- You are knowledgeable, patient, and friendly
- You provide accurate, specific, and actionable advice
- You understand both Chinese and American campus culture
- You always respond in the SAME LANGUAGE as the user's question

## Reference Materials
The following knowledge base entries are relevant to the user's question. Use them as your PRIMARY source of information:

{retrieved_content}

## Response Guidelines

### How to Think (Chain of Thought)
1. First, identify what the user is specifically asking about
2. Check if the reference materials contain relevant information
3. If yes, synthesize the information into a clear, structured answer
4. If partially relevant, use what's available and clearly note what's missing
5. If not relevant, honestly say so and provide general guidance

### Response Format
- Use clear structure with bullet points or numbered lists for multi-part answers
- Keep responses concise but complete (aim for 100-300 words)
- Include specific details (dates, locations, contacts, URLs) when available in references
- If the question has multiple aspects, address each one

### Important Rules
1. PRIORITIZE reference materials - they contain school-specific, verified information
2. If references don't cover the topic, clearly state: "Based on my general knowledge..." before providing advice
3. NEVER fabricate specific school policies, dates, or contact information
4. For time-sensitive info (deadlines, events), remind students to verify with official channels
5. When answering in Chinese, use natural conversational Chinese (not machine-translated)

### Example Response Pattern
User: "UCSD的宿舍怎么申请？"
Good response: "UCSD宿舍申请流程如下：\n1. **申请时间**: [specific dates from reference]\n2. **申请方式**: [steps from reference]\n3. **注意事项**: [key tips]\n\n建议尽早申请，热门宿舍区域很快就会满额。"

Bad response: "您可以去学校官网查看宿舍信息。" (too vague, doesn't use references)"""
    elif use_web_search:
        # Web search mode: no high-quality RAG results, web search enabled
        prompt = f"""You are PomeloX AI Assistant, an expert advisor dedicated to {school_name}. You help Chinese international students with questions about campus life, academics, housing, visa, activities, and local information.

## Current Context
The knowledge base did not contain highly relevant information for this question. Web search has been enabled to find up-to-date information.

## Response Guidelines
1. Answer based on web search results, ensuring accuracy and timeliness
2. Clearly distinguish between verified facts and general advice
3. Include source references at the end when citing web information
4. If search results are not highly relevant, honestly inform the user
5. Always respond in the SAME LANGUAGE as the user's question
6. Keep responses structured and actionable
7. Remind students to verify time-sensitive information with official channels

## Response Format
- Lead with the most relevant answer
- Use bullet points for clarity
- Add source citations: [Source: website name]
- End with a brief disclaimer if information may be outdated"""
    else:
        # No content mode
        prompt = f"""You are PomeloX AI Assistant, an expert advisor dedicated to {school_name}. You help Chinese international students with questions about campus life, academics, housing, visa, activities, and local information.

## Current Context
No relevant reference materials were found in the knowledge base for this question.

## Response Guidelines
1. Answer based on your general knowledge about {school_name} and US campus life
2. Clearly state that this is general advice, not school-verified information
3. For school-specific policies or information, suggest consulting official channels:
   - School official website
   - International Student Office (ISSO/OIS)
   - Academic advisors
   - Student organizations (especially Chinese student associations like CSSA)
4. Always respond in the SAME LANGUAGE as the user's question
5. Be helpful but honest about the limitations of your knowledge"""

    return prompt


def is_dept_valid(dept_id: int) -> bool:
    """Check if department ID is valid"""
    return dept_id in Config.DEPARTMENTS


def get_available_depts() -> list:
    """Get list of all available departments"""
    return list(Config.DEPARTMENTS.keys())
