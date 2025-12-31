"""
向量相似度服务
用于检测相似问题,辅助置信度计算
"""
from typing import List
import numpy as np

from llama_index.embeddings.dashscope import (
    DashScopeEmbedding,
    DashScopeTextEmbeddingModels,
    DashScopeTextEmbeddingType,
)
from database.interface import DatabaseInterface


class VectorSimilarityService:
    """
    向量相似度服务
    使用 DashScope Embedding 模型计算问题相似度
    """

    def __init__(self, db: DatabaseInterface):
        self.db = db

        # 初始化 embedding 模型
        self.embed_model = DashScopeEmbedding(
            model_name=DashScopeTextEmbeddingModels.TEXT_EMBEDDING_V2,
            text_type=DashScopeTextEmbeddingType.TEXT_TYPE_QUERY,
        )

        # 向量缓存,避免重复计算
        self._vector_cache = {}

    def encode_question(self, question: str) -> List[float]:
        """
        将问题转为向量

        Args:
            question: 问题文本

        Returns:
            向量数组 (1536维)
        """
        # 检查缓存
        if question in self._vector_cache:
            return self._vector_cache[question]

        # 调用 embedding 模型
        try:
            vector = self.embed_model.get_text_embedding(question)
            self._vector_cache[question] = vector
            return vector
        except Exception as e:
            print(f"向量化失败: {e}")
            return []

    def find_similar_questions(
        self,
        question: str,
        school_id: str,
        days: int = 30,
        threshold: float = 0.85
    ) -> int:
        """
        查找相似问题数量

        流程:
        1. 将当前问题向量化
        2. 从数据库获取最近N天的正面反馈
        3. 计算余弦相似度
        4. 统计相似度 > threshold 的数量

        Args:
            question: 当前问题
            school_id: 学校ID
            days: 查询最近几天的数据
            threshold: 相似度阈值 (0.85 表示85%相似)

        Returns:
            相似问题数量
        """
        # 向量化当前问题
        query_vector = self.encode_question(question)
        if not query_vector:
            return 0

        # 获取历史正面反馈
        recent_feedbacks = self.db.get_positive_feedbacks(school_id, days)

        if not recent_feedbacks:
            return 0

        # 计算相似度
        similar_count = 0
        for feedback in recent_feedbacks:
            # 跳过完全相同的问题(可能是重复提交)
            if feedback.question == question:
                continue

            fb_vector = self.encode_question(feedback.question)
            if not fb_vector:
                continue

            similarity = self.cosine_similarity(query_vector, fb_vector)

            if similarity >= threshold:
                similar_count += 1
                print(f"  发现相似问题 (相似度: {similarity:.3f}): {feedback.question[:50]}...")

        return similar_count

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """
        计算余弦相似度

        Args:
            v1: 向量1
            v2: 向量2

        Returns:
            相似度 (0.0 ~ 1.0)
        """
        try:
            v1_arr = np.array(v1)
            v2_arr = np.array(v2)

            # 余弦相似度公式: cos(θ) = (A·B) / (||A|| * ||B||)
            dot_product = np.dot(v1_arr, v2_arr)
            norm_v1 = np.linalg.norm(v1_arr)
            norm_v2 = np.linalg.norm(v2_arr)

            if norm_v1 == 0 or norm_v2 == 0:
                return 0.0

            similarity = dot_product / (norm_v1 * norm_v2)

            # 确保在 0-1 范围内
            return max(0.0, min(1.0, similarity))

        except Exception as e:
            print(f"计算相似度失败: {e}")
            return 0.0

    def clear_cache(self):
        """清空向量缓存"""
        self._vector_cache.clear()
