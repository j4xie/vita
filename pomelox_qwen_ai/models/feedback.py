"""
反馈记录数据模型
"""
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum


class FeedbackStatus(Enum):
    """反馈处理状态"""
    PENDING = "pending"              # 待处理
    AUTO_APPROVED = "auto_approved"  # 自动通过入库
    APPROVED = "approved"            # 人工审核通过
    REJECTED = "rejected"            # 审核拒绝
    RECORDED = "recorded"            # 仅记录(置信度过低)


class FeedbackRecord:
    """反馈记录数据模型"""

    def __init__(
        self,
        feedback_id: str,
        session_id: str,
        message_id: str,
        question: str,
        answer: str,
        rating: int,  # 1=有帮助, -1=没帮助
        source_type: str,  # 'web_search' or 'knowledge_base'
        rag_score: float,
        dept_id: int,  # 学校ID(部门ID) - 必需字段
        user_id: Optional[int] = None,
        comment: Optional[str] = None,
        status: str = FeedbackStatus.PENDING.value,
        confidence_score: Optional[float] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.feedback_id = feedback_id
        self.session_id = session_id
        self.message_id = message_id
        self.user_id = user_id
        self.dept_id = dept_id
        self.question = question
        self.answer = answer
        self.rating = rating
        self.comment = comment
        self.source_type = source_type
        self.rag_score = rag_score
        self.status = status
        self.confidence_score = confidence_score
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'feedback_id': self.feedback_id,
            'session_id': self.session_id,
            'message_id': self.message_id,
            'user_id': self.user_id,
            'dept_id': self.dept_id,
            'question': self.question,
            'answer': self.answer,
            'rating': self.rating,
            'comment': self.comment,
            'source_type': self.source_type,
            'rag_score': self.rag_score,
            'status': self.status,
            'confidence_score': self.confidence_score,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FeedbackRecord':
        """从字典创建对象"""
        # 转换时间字符串为 datetime 对象
        if isinstance(data.get('created_at'), str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if isinstance(data.get('updated_at'), str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'])

        return cls(**data)

    def __repr__(self):
        return f"FeedbackRecord(id={self.feedback_id}, dept={self.dept_id}, status={self.status})"
