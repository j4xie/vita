"""
数据库操作抽象接口
当前提供JSON文件实现,后续可替换为MySQL/PostgreSQL实现
"""
from typing import Optional, List, Dict, Any
from models.feedback import FeedbackRecord
from models.knowledge import KnowledgeEntry


class DatabaseInterface:
    """
    数据库操作抽象接口
    所有数据库实现必须继承此类并实现所有方法
    """

    # ==================== 反馈记录操作 ====================

    def create_feedback(self, feedback: FeedbackRecord) -> bool:
        """
        创建反馈记录

        Args:
            feedback: 反馈记录对象

        Returns:
            成功返回 True, 失败返回 False
        """
        raise NotImplementedError

    def get_feedback_by_id(self, feedback_id: str) -> Optional[FeedbackRecord]:
        """
        根据ID获取反馈记录

        Args:
            feedback_id: 反馈ID

        Returns:
            反馈记录对象, 不存在返回 None
        """
        raise NotImplementedError

    def update_feedback_status(
        self,
        feedback_id: str,
        status: str,
        confidence_score: Optional[float] = None
    ) -> bool:
        """
        更新反馈状态

        Args:
            feedback_id: 反馈ID
            status: 新状态
            confidence_score: 置信度分数(可选)

        Returns:
            成功返回 True
        """
        raise NotImplementedError

    def get_pending_feedbacks(
        self,
        dept_id: Optional[int] = None,
        limit: int = 50
    ) -> List[FeedbackRecord]:
        """
        获取待审核的反馈列表

        Args:
            dept_id: 部门ID (可选, 不传则返回所有部门)
            limit: 数量限制

        Returns:
            反馈记录列表
        """
        raise NotImplementedError

    def get_positive_feedbacks(
        self,
        dept_id: int,
        days: int = 30
    ) -> List[FeedbackRecord]:
        """
        获取最近N天的正面反馈

        Args:
            dept_id: 部门ID
            days: 天数

        Returns:
            反馈记录列表
        """
        raise NotImplementedError

    def get_feedback_stats(self, dept_id: Optional[int] = None) -> Dict[str, int]:
        """
        获取反馈统计信息

        Args:
            dept_id: 部门ID (可选)

        Returns:
            统计字典 {
                'total': 总数,
                'positive': 正面反馈数,
                'negative': 负面反馈数,
                'pending': 待审核数,
                ...
            }
        """
        raise NotImplementedError

    # ==================== 知识库操作 ====================

    def create_knowledge(self, knowledge: KnowledgeEntry) -> bool:
        """
        创建知识库条目

        Args:
            knowledge: 知识库条目对象

        Returns:
            成功返回 True
        """
        raise NotImplementedError

    def get_knowledge_by_id(self, kb_id: str) -> Optional[KnowledgeEntry]:
        """
        根据ID获取知识库条目

        Args:
            kb_id: 知识库ID

        Returns:
            知识库条目对象, 不存在返回 None
        """
        raise NotImplementedError

    def update_knowledge(self, kb_id: str, updates: Dict[str, Any]) -> bool:
        """
        更新知识库条目

        Args:
            kb_id: 知识库ID
            updates: 要更新的字段字典

        Returns:
            成功返回 True
        """
        raise NotImplementedError

    def delete_knowledge(self, kb_id: str) -> bool:
        """
        删除知识库条目

        Args:
            kb_id: 知识库ID

        Returns:
            成功返回 True
        """
        raise NotImplementedError

    def get_knowledge_by_dept(
        self,
        dept_id: int,
        indexed: Optional[bool] = None,
        enabled_only: bool = True
    ) -> List[KnowledgeEntry]:
        """
        获取指定部门的知识库条目

        Args:
            dept_id: 部门ID
            indexed: True=仅已归档, False=仅未归档, None=全部
            enabled_only: 是否仅返回启用的条目

        Returns:
            知识库条目列表
        """
        raise NotImplementedError

    def get_unindexed_knowledge(self, dept_id: int) -> List[KnowledgeEntry]:
        """
        获取指定部门未归档的知识库条目

        Args:
            dept_id: 部门ID

        Returns:
            知识库条目列表
        """
        raise NotImplementedError

    def bulk_delete_knowledge(self, kb_ids: List[str]) -> int:
        """
        批量删除知识库条目(归档后清理)

        Args:
            kb_ids: 要删除的知识库ID列表

        Returns:
            实际删除的数量
        """
        raise NotImplementedError

    def get_depts_with_unindexed_knowledge(self) -> List[int]:
        """
        获取有未归档知识的部门列表

        Returns:
            部门ID列表
        """
        raise NotImplementedError

    # ==================== 聊天会话操作 ====================

    def create_chat_session(
        self,
        session_id: str,
        user_id: int,
        dept_id: int,
        title: str = "新对话"
    ) -> bool:
        """
        创建聊天会话

        Args:
            session_id: 会话唯一标识
            user_id: 用户ID
            dept_id: 部门ID
            title: 对话标题

        Returns:
            成功返回 True
        """
        raise NotImplementedError

    def get_user_chat_sessions(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        获取用户的聊天会话列表

        Args:
            user_id: 用户ID
            offset: 偏移量
            limit: 数量限制

        Returns:
            会话列表
        """
        raise NotImplementedError

    def update_chat_session_title(
        self,
        session_id: str,
        title: str
    ) -> bool:
        """
        更新会话标题

        Args:
            session_id: 会话ID
            title: 新标题

        Returns:
            成功返回 True
        """
        raise NotImplementedError

    def delete_chat_session(
        self,
        session_id: str,
        user_id: int
    ) -> bool:
        """
        删除会话(软删除)

        Args:
            session_id: 会话ID
            user_id: 用户ID (验证所有权)

        Returns:
            成功返回 True
        """
        raise NotImplementedError

    # ==================== 聊天消息操作 ====================

    def save_chat_message(
        self,
        message_id: str,
        session_id: str,
        user_id: int,
        role: str,
        content: str,
        rag_score: Optional[float] = None,
        source_type: Optional[str] = None
    ) -> bool:
        """
        保存聊天消息

        Args:
            message_id: 消息唯一标识
            session_id: 会话ID
            user_id: 用户ID
            role: 角色 (user/assistant/system)
            content: 消息内容
            rag_score: RAG检索分数
            source_type: 来源类型

        Returns:
            成功返回 True
        """
        raise NotImplementedError

    def get_chat_messages(
        self,
        session_id: str,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """
        获取会话消息列表

        Args:
            session_id: 会话ID
            user_id: 用户ID (验证所有权)

        Returns:
            消息列表
        """
        raise NotImplementedError
