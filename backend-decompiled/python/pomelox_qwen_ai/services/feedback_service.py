"""
反馈处理服务
处理用户反馈,计算置信度,自动或待审核入库
"""
import uuid
from typing import Dict, Any

from database.interface import DatabaseInterface
from models.feedback import FeedbackRecord, FeedbackStatus
from models.knowledge import KnowledgeEntry, KnowledgeSource
from services.confidence_calculator import calculate_confidence
from services.vector_similarity import VectorSimilarityService


def generate_id(prefix: str = "") -> str:
    """生成唯一ID"""
    return f"{prefix}{uuid.uuid4().hex[:16]}"


class FeedbackService:
    """
    反馈处理服务
    """

    def __init__(self, db: DatabaseInterface):
        self.db = db
        self.similarity_service = VectorSimilarityService(db)

    def process_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        处理用户反馈

        流程:
        1. 创建反馈记录
        2. 仅处理正面反馈(rating=1)
        3. 检测相似问题
        4. 计算置信度
        5. 根据置信度决定: 自动入库 / 待审核 / 仅记录

        Args:
            feedback_data: 反馈数据字典

        Returns:
            处理结果 {
                'feedback_id': str,
                'status': str,
                'confidence_score': float,
                'kb_id': str (如果自动入库)
            }
        """
        from config import Config

        # 1. 创建反馈记录
        feedback = FeedbackRecord(
            feedback_id=generate_id("fb_"),
            session_id=feedback_data['session_id'],
            message_id=feedback_data['message_id'],
            user_id=feedback_data.get('user_id'),
            question=feedback_data['question'],
            answer=feedback_data['answer'],
            rating=feedback_data['rating'],
            comment=feedback_data.get('comment'),
            source_type=feedback_data['source_type'],
            rag_score=feedback_data['rag_score'],
            school_id=feedback_data['school_id']
        )

        # 2. 仅处理正面反馈
        if feedback.rating != 1:
            feedback.status = FeedbackStatus.RECORDED.value
            self.db.create_feedback(feedback)
            return {
                'feedback_id': feedback.feedback_id,
                'status': 'recorded',
                'message': '负面反馈已记录'
            }

        print(f"[反馈处理] 处理正面反馈: {feedback.question[:50]}...")

        # 3. 检测相似问题
        try:
            similar_count = self.similarity_service.find_similar_questions(
                feedback.question,
                feedback.school_id,
                days=30,
                threshold=getattr(Config, 'SIMILAR_QUESTION_THRESHOLD', 0.85)
            )
            print(f"[反馈处理] 发现 {similar_count} 个相似问题")
        except Exception as e:
            print(f"[反馈处理] 相似度检测失败: {e}")
            similar_count = 0

        # 4. 计算置信度
        confidence = calculate_confidence(feedback, similar_count)
        feedback.confidence_score = confidence

        print(f"[反馈处理] 置信度分数: {confidence:.3f}")

        # 5. 决定处理策略
        threshold_auto = getattr(Config, 'CONFIDENCE_THRESHOLD_AUTO', 0.8)
        threshold_review = getattr(Config, 'CONFIDENCE_THRESHOLD_REVIEW', 0.5)

        if confidence >= threshold_auto:
            # 自动入库
            feedback.status = FeedbackStatus.AUTO_APPROVED.value
            self.db.create_feedback(feedback)

            kb_id = self._create_knowledge_from_feedback(feedback)
            print(f"[反馈处理] ✅ 自动入库,创建知识条目: {kb_id}")

            return {
                'feedback_id': feedback.feedback_id,
                'status': 'auto_approved',
                'confidence_score': confidence,
                'kb_id': kb_id,
                'message': f'置信度 {confidence:.2f} >= {threshold_auto},已自动加入知识库'
            }

        elif confidence >= threshold_review:
            # 待审核
            feedback.status = FeedbackStatus.PENDING.value
            self.db.create_feedback(feedback)
            print(f"[反馈处理] ⏸️  待审核队列")

            return {
                'feedback_id': feedback.feedback_id,
                'status': 'pending',
                'confidence_score': confidence,
                'message': f'置信度 {confidence:.2f},需要人工审核'
            }

        else:
            # 仅记录
            feedback.status = FeedbackStatus.RECORDED.value
            self.db.create_feedback(feedback)
            print(f"[反馈处理] 📝 仅记录,置信度过低")

            return {
                'feedback_id': feedback.feedback_id,
                'status': 'recorded',
                'confidence_score': confidence,
                'message': f'置信度 {confidence:.2f} 过低,仅记录'
            }

    def _create_knowledge_from_feedback(self, feedback: FeedbackRecord) -> str:
        """
        从反馈创建知识库条目

        Args:
            feedback: 反馈记录

        Returns:
            知识库条目ID
        """
        knowledge = KnowledgeEntry(
            kb_id=generate_id("kb_"),
            question=feedback.question,
            answer=feedback.answer,
            school_id=feedback.school_id,
            source=KnowledgeSource.USER_FEEDBACK.value,
            feedback_id=feedback.feedback_id,
            quality_score=feedback.confidence_score or 1.0,
            indexed=False  # 未归档到向量库
        )

        self.db.create_knowledge(knowledge)
        return knowledge.kb_id

    def approve_feedback(self, feedback_id: str, reviewer_id: str = None) -> str:
        """
        管理员审核通过

        Args:
            feedback_id: 反馈ID
            reviewer_id: 审核人ID (可选)

        Returns:
            创建的知识库条目ID

        Raises:
            ValueError: 反馈不存在或状态不正确
        """
        feedback = self.db.get_feedback_by_id(feedback_id)
        if not feedback:
            raise ValueError(f"反馈记录不存在: {feedback_id}")

        if feedback.status != FeedbackStatus.PENDING.value:
            raise ValueError(f"反馈状态不是待审核: {feedback.status}")

        # 更新状态
        self.db.update_feedback_status(
            feedback_id,
            FeedbackStatus.APPROVED.value,
            feedback.confidence_score
        )

        # 创建知识库条目
        kb_id = self._create_knowledge_from_feedback(feedback)

        print(f"[审核] ✅ 反馈 {feedback_id} 审核通过,创建知识条目: {kb_id}")

        return kb_id

    def reject_feedback(self, feedback_id: str, reason: str = None) -> bool:
        """
        管理员审核拒绝

        Args:
            feedback_id: 反馈ID
            reason: 拒绝原因 (可选)

        Returns:
            成功返回 True

        Raises:
            ValueError: 反馈不存在
        """
        feedback = self.db.get_feedback_by_id(feedback_id)
        if not feedback:
            raise ValueError(f"反馈记录不存在: {feedback_id}")

        result = self.db.update_feedback_status(
            feedback_id,
            FeedbackStatus.REJECTED.value
        )

        if result:
            print(f"[审核] ❌ 反馈 {feedback_id} 审核拒绝")

        return result

    def get_pending_list(self, school_id: str = None, limit: int = 50) -> list:
        """
        获取待审核列表

        Args:
            school_id: 学校ID (可选)
            limit: 数量限制

        Returns:
            待审核的反馈列表
        """
        feedbacks = self.db.get_pending_feedbacks(school_id, limit)
        return [fb.to_dict() for fb in feedbacks]

    def get_stats(self, school_id: str = None) -> Dict[str, int]:
        """
        获取反馈统计信息

        Args:
            school_id: 学校ID (可选)

        Returns:
            统计字典
        """
        stats = self.db.get_feedback_stats(school_id)

        # 添加知识库统计
        if school_id:
            knowledge_list = self.db.get_knowledge_by_school(
                school_id,
                indexed=None,
                enabled_only=True
            )
            stats['knowledge_base_count'] = len(knowledge_list)
        else:
            # 所有学校的知识库条目
            stats['knowledge_base_count'] = 0

        return stats
