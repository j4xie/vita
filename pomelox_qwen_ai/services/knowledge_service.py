"""
知识库管理服务
提供知识库的增删改查功能
"""
from typing import List, Dict, Any, Optional

from database.interface import DatabaseInterface
from models.knowledge import KnowledgeEntry


class KnowledgeService:
    """
    知识库管理服务
    """

    def __init__(self, db: DatabaseInterface):
        self.db = db

    def get_knowledge_list(
        self,
        school_id: str,
        indexed: Optional[bool] = None,
        enabled_only: bool = True,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        获取知识库列表

        Args:
            school_id: 学校ID
            indexed: True=仅已归档, False=仅未归档, None=全部
            enabled_only: 是否仅返回启用的条目
            limit: 数量限制

        Returns:
            知识库条目列表
        """
        knowledge_list = self.db.get_knowledge_by_school(
            school_id=school_id,
            indexed=indexed,
            enabled_only=enabled_only
        )

        # 转换为字典并限制数量
        result = [kb.to_dict() for kb in knowledge_list[:limit]]

        return result

    def get_knowledge_detail(self, kb_id: str) -> Optional[Dict[str, Any]]:
        """
        获取知识库条目详情

        Args:
            kb_id: 知识库ID

        Returns:
            知识库条目字典, 不存在返回 None
        """
        knowledge = self.db.get_knowledge_by_id(kb_id)
        return knowledge.to_dict() if knowledge else None

    def update_knowledge(self, kb_id: str, updates: Dict[str, Any]) -> bool:
        """
        更新知识库条目

        Args:
            kb_id: 知识库ID
            updates: 要更新的字段

        Returns:
            成功返回 True
        """
        # 允许更新的字段
        allowed_fields = [
            'question', 'answer', 'category',
            'quality_score', 'enabled'
        ]

        # 过滤非法字段
        filtered_updates = {
            k: v for k, v in updates.items()
            if k in allowed_fields
        }

        if not filtered_updates:
            return False

        return self.db.update_knowledge(kb_id, filtered_updates)

    def delete_knowledge(self, kb_id: str) -> bool:
        """
        删除知识库条目

        Args:
            kb_id: 知识库ID

        Returns:
            成功返回 True
        """
        return self.db.delete_knowledge(kb_id)

    def toggle_knowledge(self, kb_id: str, enabled: bool) -> bool:
        """
        启用/禁用知识库条目

        Args:
            kb_id: 知识库ID
            enabled: True=启用, False=禁用

        Returns:
            成功返回 True
        """
        return self.db.update_knowledge(kb_id, {'enabled': enabled})

    def get_unindexed_count(self, school_id: str = None) -> int:
        """
        获取未归档的知识库条目数量

        Args:
            school_id: 学校ID (可选, 不传则统计所有学校)

        Returns:
            数量
        """
        if school_id:
            unindexed = self.db.get_unindexed_knowledge(school_id)
            return len(unindexed)
        else:
            schools = self.db.get_schools_with_unindexed_knowledge()
            total = 0
            for sid in schools:
                unindexed = self.db.get_unindexed_knowledge(sid)
                total += len(unindexed)
            return total
