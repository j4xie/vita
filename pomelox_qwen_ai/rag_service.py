"""
RAG 服务模块
提供基于学校知识库的检索增强生成功能
"""
import os
from config import Config
from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.embeddings.dashscope import (
    DashScopeEmbedding,
    DashScopeTextEmbeddingModels,
    DashScopeTextEmbeddingType,
)
from llama_index.postprocessor.dashscope_rerank import DashScopeRerank

# 配置嵌入模型
EMBED_MODEL = DashScopeEmbedding(
    model_name=DashScopeTextEmbeddingModels.TEXT_EMBEDDING_V2,
    text_type=DashScopeTextEmbeddingType.TEXT_TYPE_DOCUMENT,
)
Settings.embed_model = EMBED_MODEL

# 索引缓存，避免重复加载
_index_cache = {}


def load_index(school_id: str):
    """
    加载学校的向量索引（带缓存）

    Args:
        school_id: 学校ID，如 'UCI', 'UCSD' 等

    Returns:
        VectorStoreIndex 或 None（如果知识库不存在）
    """
    if school_id in _index_cache:
        return _index_cache[school_id]

    index_path = os.path.join(Config.VECTOR_STORE_PATH, school_id)

    if not os.path.exists(index_path):
        print(f"知识库不存在: {index_path}")
        return None

    try:
        storage_context = StorageContext.from_defaults(persist_dir=index_path)
        index = load_index_from_storage(storage_context)
        _index_cache[school_id] = index
        print(f"已加载知识库: {school_id}")
        return index
    except Exception as e:
        print(f"加载知识库失败 [{school_id}]: {e}")
        return None


def retrieve(school_id: str, query: str, chunk_count: int = None, similarity_threshold: float = None) -> tuple:
    """
    从学校知识库中检索相关内容

    Args:
        school_id: 学校ID
        query: 用户问题
        chunk_count: 检索片段数量（默认使用配置值）
        similarity_threshold: 相似度阈值（默认使用配置值）

    Returns:
        tuple: (检索到的文本内容, 最高相关性分数, 是否有高质量结果)
    """
    chunk_count = chunk_count or Config.RAG_CHUNK_COUNT
    similarity_threshold = similarity_threshold or Config.RAG_SIMILARITY_THRESHOLD
    # 高质量结果的阈值（用于判断是否需要联网搜索）
    high_quality_threshold = getattr(Config, 'RAG_HIGH_QUALITY_THRESHOLD', 0.5)

    index = load_index(school_id)
    if index is None:
        return "", 0.0, False

    try:
        # 创建检索器，先获取较多结果用于重排序
        retriever = index.as_retriever(similarity_top_k=20)
        nodes = retriever.retrieve(query)

        if not nodes:
            return "", 0.0, False

        # 使用 DashScope Rerank 进行重排序
        try:
            reranker = DashScopeRerank(top_n=chunk_count, return_documents=True)
            reranked_nodes = reranker.postprocess_nodes(nodes, query_str=query)
        except Exception as e:
            print(f"Rerank 失败，使用原始结果: {e}")
            reranked_nodes = nodes[:chunk_count]

        # 获取最高分数
        max_score = max([node.score for node in reranked_nodes]) if reranked_nodes else 0.0

        # 根据相似度阈值筛选并组装文本
        chunk_texts = []
        for i, node in enumerate(reranked_nodes):
            if node.score >= similarity_threshold:
                chunk_texts.append(f"【参考{i+1}】\n{node.text}")

        retrieved_content = "\n\n".join(chunk_texts)
        has_high_quality = max_score >= high_quality_threshold and len(chunk_texts) > 0

        return retrieved_content, max_score, has_high_quality

    except Exception as e:
        print(f"检索失败 [{school_id}]: {e}")
        return "", 0.0, False


def retrieve_simple(school_id: str, query: str) -> str:
    """
    简化版检索函数，只返回文本内容（保持向后兼容）
    """
    content, _, _ = retrieve(school_id, query)
    return content


def get_system_prompt(school_id: str, retrieved_content: str, use_web_search: bool = False) -> str:
    """
    生成学校特定的 system prompt

    Args:
        school_id: 学校ID
        retrieved_content: RAG 检索到的内容
        use_web_search: 是否使用联网搜索模式

    Returns:
        完整的 system prompt
    """
    school_info = Config.SCHOOLS.get(school_id, {})
    school_name = school_info.get('name', school_id)
    school_name_cn = school_info.get('name_cn', school_id)

    if retrieved_content:
        # RAG 模式：有检索到内容
        prompt = f"""你是{school_name_cn}（{school_name}）的专属AI助手。

请基于以下参考资料回答学生的问题：

{retrieved_content}

回答要求：
1. 优先使用参考资料中的信息回答问题
2. 如果参考资料中没有相关信息，请诚实告知并尽力提供一般性建议
3. 回答要准确、友好、有帮助
4. 使用中文回答"""
    elif use_web_search:
        # 联网搜索模式：没有高质量RAG结果，启用联网搜索
        prompt = f"""你是{school_name_cn}（{school_name}）的专属AI助手。

当前问题在知识库中没有找到高度相关的信息，系统已启用联网搜索功能来获取最新信息。

回答要求：
1. 基于联网搜索结果回答问题，确保信息的准确性和时效性
2. 如果搜索结果与问题相关性不高，请明确告知用户
3. 回答要准确、友好、有帮助
4. 使用中文回答
5. 如果引用了网络信息，请在回答末尾标注信息来源"""
    else:
        # 无内容模式
        prompt = f"""你是{school_name_cn}（{school_name}）的专属AI助手。

当前没有检索到相关的参考资料。请根据你的知识尽力回答学生的问题。
如果问题涉及学校的具体政策或信息，请建议学生咨询学校官方渠道。

回答要求：
1. 回答要准确、友好、有帮助
2. 使用中文回答"""

    return prompt


def is_school_valid(school_id: str) -> bool:
    """检查学校ID是否有效"""
    return school_id in Config.SCHOOLS


def get_available_schools() -> list:
    """获取所有可用的学校列表"""
    return list(Config.SCHOOLS.keys())
