"""
RAG Service Module with Hybrid Retrieval
Provides Retrieval-Augmented Generation functionality based on school knowledge base
Supports hybrid retrieval: vector index (indexed=true) + database (indexed=false)
"""
import os
import numpy as np
from typing import List, Dict, Any
from config import Config
from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.embeddings.dashscope import (
    DashScopeEmbedding,
    DashScopeTextEmbeddingModels,
    DashScopeTextEmbeddingType,
)
from llama_index.postprocessor.dashscope_rerank import DashScopeRerank
from database import get_database

# ==================== 生产环境 MySQL 版本 (注释掉) ====================
# from database.mysql_impl import MySQLDatabase
# db = MySQLDatabase()
# ========================================================================

# Configure embedding model
EMBED_MODEL = DashScopeEmbedding(
    model_name=DashScopeTextEmbeddingModels.TEXT_EMBEDDING_V2,
    text_type=DashScopeTextEmbeddingType.TEXT_TYPE_DOCUMENT,
)
Settings.embed_model = EMBED_MODEL

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


def retrieve_from_database_kb(
    dept_id: int,
    query: str,
    similarity_threshold: float = 0.2
) -> List[Dict[str, Any]]:
    """
    Retrieve unindexed knowledge entries from database

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
    # Get database instance (JSON for development, MySQL for production)
    db = get_database()

    # ==================== 生产环境 MySQL 版本 (注释掉) ====================
    # from database.mysql_impl import MySQLDatabase
    # db = MySQLDatabase()
    # ========================================================================

    # Query unindexed knowledge entries
    knowledge_entries = db.get_knowledge_by_dept(
        dept_id=dept_id,
        indexed=False,  # Only query unindexed entries
        enabled_only=True
    )

    if not knowledge_entries:
        return []

    # Vectorize query
    try:
        query_embedding = Settings.embed_model.get_text_embedding(query)
    except Exception as e:
        print(f"[Database Retrieval] Query vectorization failed: {e}")
        return []

    results = []

    # Calculate similarity for each knowledge entry
    for entry in knowledge_entries:
        try:
            # Vectorize knowledge base question
            kb_embedding = Settings.embed_model.get_text_embedding(entry.question)

            # Calculate cosine similarity
            similarity = cosine_similarity(query_embedding, kb_embedding)

            if similarity >= similarity_threshold:
                # Format as retrieval result
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

    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)

    if results:
        print(f"[Database Retrieval] Retrieved {len(results)} unindexed knowledge entries")

    return results


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
    index = load_index(dept_id)
    if index is not None:
        try:
            # Create retriever, get more results for reranking
            retriever = index.as_retriever(similarity_top_k=20)
            nodes = retriever.retrieve(query)

            if nodes:
                # Use DashScope Rerank for reranking
                try:
                    reranker = DashScopeRerank(top_n=chunk_count, return_documents=True)
                    reranked_nodes = reranker.postprocess_nodes(nodes, query_str=query)
                except Exception as e:
                    print(f"[Vector Rerank] Failed, using original results: {e}")
                    reranked_nodes = nodes[:chunk_count]

                # Convert to unified format
                for node in reranked_nodes:
                    if node.score >= similarity_threshold:
                        all_results.append({
                            'content': node.text,
                            'score': node.score,
                            'source': 'vector_index'
                        })
                        max_score = max(max_score, node.score)

        except Exception as e:
            print(f"[Vector Retrieval] Failed [{dept_id}]: {e}")

    # ==================== Part 2: Database Retrieval (Unindexed Knowledge) ====================
    db_results = retrieve_from_database_kb(dept_id, query, similarity_threshold)
    for db_result in db_results:
        all_results.append(db_result)
        max_score = max(max_score, db_result['score'])

    # ==================== Part 3: Merge and Sort Results ====================
    if not all_results:
        return "", 0.0, False

    # Sort all results by score
    all_results.sort(key=lambda x: x['score'], reverse=True)

    # Take top chunk_count results
    top_results = all_results[:chunk_count]

    # Format as text
    chunk_texts = []
    for i, result in enumerate(top_results):
        source_label = "Vector Index" if result['source'] == 'vector_index' else "Database (Unindexed)"
        chunk_texts.append(f"[Reference {i+1} - {source_label}]\n{result['content']}")

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
    Generate department-specific system prompt

    Args:
        dept_id: Department ID
        retrieved_content: Content retrieved by RAG
        use_web_search: Whether to use web search mode

    Returns:
        Complete system prompt
    """
    dept_info = Config.DEPARTMENTS.get(dept_id, {})
    school_name = dept_info.get('name', f'Department {dept_id}')

    if retrieved_content:
        # RAG mode: content retrieved from knowledge base
        prompt = f"""You are an AI assistant dedicated to {school_name}.

Please answer the student's question based on the following reference materials:

{retrieved_content}

Response requirements:
1. Prioritize using information from the reference materials to answer questions
2. If the reference materials don't contain relevant information, honestly inform the user and try to provide general advice
3. Responses should be accurate, friendly, and helpful
4. Always respond in the same language as the user's question (Chinese for Chinese questions, English for English questions)
5. When searching the web, prefer English language sources and results"""
    elif use_web_search:
        # Web search mode: no high-quality RAG results, web search enabled
        prompt = f"""You are an AI assistant dedicated to {school_name}.

The current question did not find highly relevant information in the knowledge base. The system has enabled web search to obtain the latest information.

Response requirements:
1. Answer questions based on web search results, ensuring accuracy and timeliness
2. If search results are not highly relevant to the question, clearly inform the user
3. Responses should be accurate, friendly, and helpful
4. Always respond in the same language as the user's question (Chinese for Chinese questions, English for English questions)
5. When citing web information, include source references at the end of your response
6. Prefer English language web sources and results"""
    else:
        # No content mode
        prompt = f"""You are an AI assistant dedicated to {school_name}.

No relevant reference materials were retrieved. Please answer the student's question based on your knowledge.
If the question involves specific school policies or information, suggest that students consult official school channels.

Response requirements:
1. Responses should be accurate, friendly, and helpful
2. Always respond in the same language as the user's question (Chinese for Chinese questions, English for English questions)"""

    return prompt


def is_dept_valid(dept_id: int) -> bool:
    """Check if department ID is valid"""
    return dept_id in Config.DEPARTMENTS


def get_available_depts() -> list:
    """Get list of all available departments"""
    return list(Config.DEPARTMENTS.keys())
