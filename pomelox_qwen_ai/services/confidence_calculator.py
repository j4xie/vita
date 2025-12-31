"""
置信度计算器
根据多个因素计算反馈的置信度分数,决定是否自动入库
"""
from models.feedback import FeedbackRecord


def calculate_confidence(
    feedback: FeedbackRecord,
    similar_question_count: int
) -> float:
    """
    计算置信度分数

    评分因素:
    1. RAG分数低(知识库缺失) - 权重 0.3
    2. 相似问题数量(常见问题) - 权重 0.3
    3. 答案质量(长度) - 权重 0.2
    4. 来源类型(网络搜索) - 权重 0.2

    Args:
        feedback: 反馈记录对象
        similar_question_count: 相似问题数量

    Returns:
        置信度分数 (0.0 ~ 1.0)
    """
    score = 0.0

    # 因素1: RAG分数 (分数越低,说明知识库越缺少此类内容)
    if feedback.rag_score < 0.5:
        score += 0.3  # 知识库严重缺失
    elif feedback.rag_score < 0.7:
        score += 0.15  # 知识库部分缺失

    # 因素2: 相似问题数量 (多人问过说明是常见问题)
    if similar_question_count >= 3:
        score += 0.3  # 高频问题
    elif similar_question_count >= 1:
        score += 0.15  # 有人问过

    # 因素3: 答案长度质量
    answer_length = len(feedback.answer)
    if 100 <= answer_length <= 2000:
        score += 0.2  # 优质长度
    elif answer_length > 2000:
        score += 0.1  # 过长但仍有价值
    elif answer_length >= 50:
        score += 0.05  # 较短

    # 因素4: 来源类型 (网络搜索说明知识库没有)
    if feedback.source_type == 'web_search':
        score += 0.2
    elif feedback.source_type == 'knowledge_base' and feedback.rag_score < 0.6:
        score += 0.1  # 知识库回答但分数低

    # 确保分数在 0-1 范围内
    return min(score, 1.0)


def explain_confidence(
    feedback: FeedbackRecord,
    similar_question_count: int,
    confidence_score: float
) -> str:
    """
    解释置信度分数的计算依据

    Args:
        feedback: 反馈记录对象
        similar_question_count: 相似问题数量
        confidence_score: 计算得到的置信度分数

    Returns:
        可读的解释文本
    """
    reasons = []

    # 分析 RAG 分数
    if feedback.rag_score < 0.5:
        reasons.append(f"RAG分数极低({feedback.rag_score:.2f}),知识库严重缺失相关内容")
    elif feedback.rag_score < 0.7:
        reasons.append(f"RAG分数较低({feedback.rag_score:.2f}),知识库部分缺失相关内容")

    # 分析相似问题
    if similar_question_count >= 3:
        reasons.append(f"发现{similar_question_count}个相似问题,是高频问题")
    elif similar_question_count >= 1:
        reasons.append(f"发现{similar_question_count}个相似问题")

    # 分析答案长度
    answer_length = len(feedback.answer)
    if 100 <= answer_length <= 2000:
        reasons.append(f"答案长度适中({answer_length}字),质量较好")
    elif answer_length > 2000:
        reasons.append(f"答案较长({answer_length}字),信息丰富")
    elif answer_length >= 50:
        reasons.append(f"答案较短({answer_length}字)")

    # 分析来源
    if feedback.source_type == 'web_search':
        reasons.append("来源为网络搜索,知识库无相关内容")

    # 组合解释
    explanation = f"置信度分数: {confidence_score:.2f}\n\n原因:\n"
    for i, reason in enumerate(reasons, 1):
        explanation += f"{i}. {reason}\n"

    return explanation
