"""
知识库条目数据模型
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class KnowledgeSource(Enum):
    """知识来源"""
    MANUAL = "manual"                # 手动录入
    USER_FEEDBACK = "user_feedback"  # 用户反馈
    AUTO_IMPORT = "auto_import"      # 自动导入


class KnowledgeEntry:
    """知识库条目数据模型"""

    def __init__(
        self,
        kb_id: str,
        question: str,
        answer: str,
        dept_id: int,  # 学校ID(部门ID) - 必需字段
        category: Optional[str] = None,
        source: str = KnowledgeSource.MANUAL.value,
        feedback_id: Optional[str] = None,
        quality_score: float = 1.0,
        enabled: bool = True,
        indexed: bool = False,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.kb_id = kb_id
        self.question = question
        self.answer = answer
        self.dept_id = dept_id
        self.category = category
        self.source = source
        self.feedback_id = feedback_id
        self.quality_score = quality_score
        self.enabled = enabled
        self.indexed = indexed
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'kb_id': self.kb_id,
            'question': self.question,
            'answer': self.answer,
            'dept_id': self.dept_id,
            'category': self.category,
            'source': self.source,
            'feedback_id': self.feedback_id,
            'quality_score': self.quality_score,
            'enabled': self.enabled,
            'indexed': self.indexed,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'KnowledgeEntry':
        """从字典创建对象"""
        # 转换时间字符串为 datetime 对象
        if isinstance(data.get('created_at'), str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if isinstance(data.get('updated_at'), str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'])

        return cls(**data)

    def __repr__(self):
        return f"KnowledgeEntry(id={self.kb_id}, dept={self.dept_id}, indexed={self.indexed})"
