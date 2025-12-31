"""
JSON 文件数据库实现 (临时开发用)
生产环境请使用 MySQL/PostgreSQL 实现
"""
import json
import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from threading import Lock

from .interface import DatabaseInterface
from models.feedback import FeedbackRecord, FeedbackStatus
from models.knowledge import KnowledgeEntry


class JSONDatabase(DatabaseInterface):
    """
    基于 JSON 文件的数据库实现
    用于开发和测试,生产环境应使用真实数据库
    """

    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.feedback_file = os.path.join(data_dir, "ai_feedback.json")
        self.knowledge_file = os.path.join(data_dir, "ai_knowledge_base.json")

        # 文件锁,防止并发写入冲突
        self._feedback_lock = Lock()
        self._knowledge_lock = Lock()

        # 确保数据目录和文件存在
        self._init_files()

    def _init_files(self):
        """初始化数据文件"""
        os.makedirs(self.data_dir, exist_ok=True)

        for filepath in [self.feedback_file, self.knowledge_file]:
            if not os.path.exists(filepath):
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump([], f)

    def _load_feedbacks(self) -> List[Dict]:
        """加载反馈数据"""
        try:
            with open(self.feedback_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"加载反馈数据失败: {e}")
            return []

    def _save_feedbacks(self, feedbacks: List[Dict]) -> bool:
        """保存反馈数据"""
        try:
            with self._feedback_lock:
                with open(self.feedback_file, 'w', encoding='utf-8') as f:
                    json.dump(feedbacks, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"保存反馈数据失败: {e}")
            return False

    def _load_knowledge(self) -> List[Dict]:
        """加载知识库数据"""
        try:
            with open(self.knowledge_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"加载知识库数据失败: {e}")
            return []

    def _save_knowledge(self, knowledge_list: List[Dict]) -> bool:
        """保存知识库数据"""
        try:
            with self._knowledge_lock:
                with open(self.knowledge_file, 'w', encoding='utf-8') as f:
                    json.dump(knowledge_list, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"保存知识库数据失败: {e}")
            return False

    # ==================== 反馈记录操作 ====================

    def create_feedback(self, feedback: FeedbackRecord) -> bool:
        """创建反馈记录"""
        feedbacks = self._load_feedbacks()
        feedbacks.append(feedback.to_dict())
        return self._save_feedbacks(feedbacks)

    def get_feedback_by_id(self, feedback_id: str) -> Optional[FeedbackRecord]:
        """根据ID获取反馈记录"""
        feedbacks = self._load_feedbacks()
        for fb_dict in feedbacks:
            if fb_dict.get('feedback_id') == feedback_id:
                return FeedbackRecord.from_dict(fb_dict)
        return None

    def update_feedback_status(
        self,
        feedback_id: str,
        status: str,
        confidence_score: Optional[float] = None
    ) -> bool:
        """更新反馈状态"""
        feedbacks = self._load_feedbacks()
        updated = False

        for fb_dict in feedbacks:
            if fb_dict.get('feedback_id') == feedback_id:
                fb_dict['status'] = status
                fb_dict['updated_at'] = datetime.now().isoformat()
                if confidence_score is not None:
                    fb_dict['confidence_score'] = confidence_score
                updated = True
                break

        if updated:
            return self._save_feedbacks(feedbacks)
        return False

    def get_pending_feedbacks(
        self,
        school_id: Optional[str] = None,
        limit: int = 50
    ) -> List[FeedbackRecord]:
        """获取待审核的反馈列表"""
        feedbacks = self._load_feedbacks()
        result = []

        for fb_dict in feedbacks:
            if fb_dict.get('status') == FeedbackStatus.PENDING.value:
                if school_id is None or fb_dict.get('school_id') == school_id:
                    result.append(FeedbackRecord.from_dict(fb_dict))

        # 按创建时间倒序排序
        result.sort(key=lambda x: x.created_at, reverse=True)
        return result[:limit]

    def get_positive_feedbacks(
        self,
        school_id: str,
        days: int = 30
    ) -> List[FeedbackRecord]:
        """获取最近N天的正面反馈"""
        feedbacks = self._load_feedbacks()
        cutoff_date = datetime.now() - timedelta(days=days)
        result = []

        for fb_dict in feedbacks:
            if fb_dict.get('school_id') != school_id:
                continue
            if fb_dict.get('rating') != 1:
                continue

            # 检查时间
            created_at = fb_dict.get('created_at')
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)

            if created_at >= cutoff_date:
                result.append(FeedbackRecord.from_dict(fb_dict))

        return result

    def get_feedback_stats(self, school_id: Optional[str] = None) -> Dict[str, int]:
        """获取反馈统计信息"""
        feedbacks = self._load_feedbacks()

        stats = {
            'total': 0,
            'positive': 0,
            'negative': 0,
            'pending': 0,
            'auto_approved': 0,
            'approved': 0,
            'rejected': 0,
            'recorded': 0
        }

        for fb_dict in feedbacks:
            if school_id and fb_dict.get('school_id') != school_id:
                continue

            stats['total'] += 1

            rating = fb_dict.get('rating')
            if rating == 1:
                stats['positive'] += 1
            elif rating == -1:
                stats['negative'] += 1

            status = fb_dict.get('status')
            if status in stats:
                stats[status] += 1

        return stats

    # ==================== 知识库操作 ====================

    def create_knowledge(self, knowledge: KnowledgeEntry) -> bool:
        """创建知识库条目"""
        knowledge_list = self._load_knowledge()
        knowledge_list.append(knowledge.to_dict())
        return self._save_knowledge(knowledge_list)

    def get_knowledge_by_id(self, kb_id: str) -> Optional[KnowledgeEntry]:
        """根据ID获取知识库条目"""
        knowledge_list = self._load_knowledge()
        for kb_dict in knowledge_list:
            if kb_dict.get('kb_id') == kb_id:
                return KnowledgeEntry.from_dict(kb_dict)
        return None

    def update_knowledge(self, kb_id: str, updates: Dict[str, Any]) -> bool:
        """更新知识库条目"""
        knowledge_list = self._load_knowledge()
        updated = False

        for kb_dict in knowledge_list:
            if kb_dict.get('kb_id') == kb_id:
                kb_dict.update(updates)
                kb_dict['updated_at'] = datetime.now().isoformat()
                updated = True
                break

        if updated:
            return self._save_knowledge(knowledge_list)
        return False

    def delete_knowledge(self, kb_id: str) -> bool:
        """删除知识库条目"""
        knowledge_list = self._load_knowledge()
        original_len = len(knowledge_list)

        knowledge_list = [kb for kb in knowledge_list if kb.get('kb_id') != kb_id]

        if len(knowledge_list) < original_len:
            return self._save_knowledge(knowledge_list)
        return False

    def get_knowledge_by_school(
        self,
        school_id: str,
        indexed: Optional[bool] = None,
        enabled_only: bool = True
    ) -> List[KnowledgeEntry]:
        """获取指定学校的知识库条目"""
        knowledge_list = self._load_knowledge()
        result = []

        for kb_dict in knowledge_list:
            # 学校过滤
            if kb_dict.get('school_id') != school_id:
                continue

            # 启用状态过滤
            if enabled_only and not kb_dict.get('enabled', True):
                continue

            # 归档状态过滤
            if indexed is not None:
                if kb_dict.get('indexed', False) != indexed:
                    continue

            result.append(KnowledgeEntry.from_dict(kb_dict))

        return result

    def get_unindexed_knowledge(self, school_id: str) -> List[KnowledgeEntry]:
        """获取指定学校未归档的知识库条目"""
        return self.get_knowledge_by_school(
            school_id=school_id,
            indexed=False,
            enabled_only=True
        )

    def bulk_delete_knowledge(self, kb_ids: List[str]) -> int:
        """批量删除知识库条目"""
        knowledge_list = self._load_knowledge()
        original_len = len(knowledge_list)

        kb_ids_set = set(kb_ids)
        knowledge_list = [kb for kb in knowledge_list if kb.get('kb_id') not in kb_ids_set]

        deleted_count = original_len - len(knowledge_list)

        if deleted_count > 0:
            self._save_knowledge(knowledge_list)

        return deleted_count

    def get_schools_with_unindexed_knowledge(self) -> List[str]:
        """获取有未归档知识的学校列表"""
        knowledge_list = self._load_knowledge()
        schools = set()

        for kb_dict in knowledge_list:
            if not kb_dict.get('indexed', False) and kb_dict.get('enabled', True):
                school_id = kb_dict.get('school_id')
                if school_id:
                    schools.add(school_id)

        return list(schools)
