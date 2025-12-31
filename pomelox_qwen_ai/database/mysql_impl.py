"""
MySQL数据库实现 (支持SSH隧道)
支持直连和SSH隧道两种方式连接MySQL
"""
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
import pymysql
from sshtunnel import SSHTunnelForwarder
from contextlib import contextmanager

from .interface import DatabaseInterface
from models.feedback import FeedbackRecord
from models.knowledge import KnowledgeEntry


class MySQLDatabase(DatabaseInterface):
    """
    MySQL数据库实现

    支持两种连接方式:
    1. 直连模式 (USE_SSH_TUNNEL=false)
    2. SSH隧道模式 (USE_SSH_TUNNEL=true)
    """

    def __init__(self):
        """初始化MySQL连接配置"""
        # SSH隧道配置
        self.use_ssh = os.getenv('USE_SSH_TUNNEL', 'false').lower() == 'true'
        self.ssh_host = os.getenv('SSH_HOST', 'your-server.com')
        self.ssh_port = int(os.getenv('SSH_PORT', '22'))
        self.ssh_user = os.getenv('SSH_USER', 'root')
        self.ssh_password = os.getenv('SSH_PASSWORD', '')
        self.ssh_key_file = os.getenv('SSH_KEY_FILE', '')  # 私钥文件路径

        # MySQL配置
        self.mysql_host = os.getenv('MYSQL_HOST', 'localhost')
        self.mysql_port = int(os.getenv('MYSQL_PORT', '3306'))
        self.mysql_user = os.getenv('MYSQL_USER', 'root')
        self.mysql_password = os.getenv('MYSQL_PASSWORD', '')
        self.mysql_database = os.getenv('MYSQL_DATABASE', 'pomelox_ai')

        # SSH隧道对象
        self.ssh_tunnel = None

        # 如果使用SSH隧道,启动隧道
        if self.use_ssh:
            self._start_ssh_tunnel()

    def _start_ssh_tunnel(self):
        """启动SSH隧道"""
        try:
            import paramiko

            # 准备SSH认证参数
            ssh_auth = {}
            if self.ssh_key_file and os.path.exists(self.ssh_key_file):
                # 使用私钥认证 - 加载私钥对象
                try:
                    pkey = paramiko.Ed25519Key.from_private_key_file(self.ssh_key_file)
                except:
                    try:
                        pkey = paramiko.RSAKey.from_private_key_file(self.ssh_key_file)
                    except:
                        pkey = paramiko.ECDSAKey.from_private_key_file(self.ssh_key_file)

                ssh_auth['ssh_pkey'] = pkey
            elif self.ssh_password:
                # 使用密码认证
                ssh_auth['ssh_password'] = self.ssh_password
            else:
                raise ValueError("SSH authentication requires either SSH_PASSWORD or SSH_KEY_FILE")

            # 创建SSH隧道
            self.ssh_tunnel = SSHTunnelForwarder(
                (self.ssh_host, self.ssh_port),
                ssh_username=self.ssh_user,
                **ssh_auth,
                remote_bind_address=(self.mysql_host, self.mysql_port),
                local_bind_address=('127.0.0.1', 0)  # 自动分配本地端口
            )

            self.ssh_tunnel.start()
            print(f"[MySQL] SSH tunnel started: localhost:{self.ssh_tunnel.local_bind_port} -> {self.ssh_host}:{self.mysql_port}")

        except Exception as e:
            print(f"[MySQL] Failed to start SSH tunnel: {e}")
            raise

    @contextmanager
    def _get_connection(self):
        """
        获取MySQL连接 (上下文管理器)

        用法:
            with db._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM table")
        """
        # 确定连接参数
        if self.use_ssh and self.ssh_tunnel:
            # 通过SSH隧道连接
            connect_host = '127.0.0.1'
            connect_port = self.ssh_tunnel.local_bind_port
        else:
            # 直连
            connect_host = self.mysql_host
            connect_port = self.mysql_port

        connection = None
        try:
            connection = pymysql.connect(
                host=connect_host,
                port=connect_port,
                user=self.mysql_user,
                password=self.mysql_password,
                database=self.mysql_database,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            yield connection
            connection.commit()
        except Exception as e:
            if connection:
                connection.rollback()
            raise e
        finally:
            if connection:
                connection.close()

    def _row_to_feedback(self, row: Dict) -> FeedbackRecord:
        """将数据库行转换为FeedbackRecord对象"""
        return FeedbackRecord(
            feedback_id=row['feedback_id'],
            session_id=row['session_id'],
            message_id=row.get('message_id', ''),
            question=row['question'],
            answer=row['answer'],
            rating=row['rating'],
            source_type=row['source_type'],
            rag_score=row['rag_score'],
            dept_id=row['dept_id'],
            user_id=row.get('user_id'),
            status=row['status'],
            confidence_score=row.get('confidence_score'),
            created_at=row['create_time'] if isinstance(row['create_time'], datetime) else datetime.fromisoformat(row['create_time']) if row.get('create_time') else None,
            updated_at=row.get('reviewed_time') if isinstance(row.get('reviewed_time'), datetime) else datetime.fromisoformat(row['reviewed_time']) if row.get('reviewed_time') else None
        )

    def _row_to_knowledge(self, row: Dict) -> KnowledgeEntry:
        """将数据库行转换为KnowledgeEntry对象"""
        # 将数据库的CHAR(1)字段转换为布尔值
        enabled = row.get('enabled') == '1' if isinstance(row.get('enabled'), str) else bool(row.get('enabled', True))
        indexed = row.get('indexed') == '1' if isinstance(row.get('indexed'), str) else bool(row.get('indexed', False))

        return KnowledgeEntry(
            kb_id=row['kb_id'],
            question=row['question'],
            answer=row['answer'],
            dept_id=row['dept_id'],
            category=row.get('category'),
            source=row['source'],
            feedback_id=row.get('feedback_id'),
            quality_score=row.get('quality_score', 0.7),
            enabled=enabled,
            indexed=indexed,
            created_at=row['create_time'] if isinstance(row['create_time'], datetime) else row['create_time'],
            updated_at=row['update_time'] if isinstance(row['update_time'], datetime) else row['update_time']
        )

    # ==================== Feedback 相关方法 ====================

    def create_feedback(self, feedback: FeedbackRecord) -> bool:
        """创建反馈记录"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO ai_feedback
                    (feedback_id, session_id, message_id, user_id, dept_id, question, answer, rating,
                     rag_score, source_type, status, confidence_score, create_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    feedback.feedback_id, feedback.session_id, feedback.message_id,
                    feedback.user_id, feedback.dept_id, feedback.question, feedback.answer, feedback.rating,
                    feedback.rag_score, feedback.source_type, feedback.status,
                    feedback.confidence_score, feedback.created_at
                ))
            return True
        except Exception as e:
            print(f"[MySQL] Failed to create feedback: {e}")
            return False

    def get_feedback_by_id(self, feedback_id: str) -> Optional[FeedbackRecord]:
        """根据ID获取反馈记录"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ai_feedback WHERE feedback_id = %s", (feedback_id,))
            row = cursor.fetchone()
            return self._row_to_feedback(row) if row else None

    def get_pending_feedbacks(self, dept_id: Optional[int] = None, limit: int = 50) -> List[FeedbackRecord]:
        """获取待审核的反馈列表"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if dept_id is not None:
                cursor.execute("""
                    SELECT * FROM ai_feedback
                    WHERE status IN ('pending', 'auto_approved') AND dept_id = %s
                    ORDER BY create_time DESC
                    LIMIT %s
                """, (dept_id, limit))
            else:
                cursor.execute("""
                    SELECT * FROM ai_feedback
                    WHERE status IN ('pending', 'auto_approved')
                    ORDER BY create_time DESC
                    LIMIT %s
                """, (limit,))
            return [self._row_to_feedback(row) for row in cursor.fetchall()]

    def update_feedback_status(self, feedback_id: str, status: str, confidence_score: Optional[float] = None) -> bool:
        """更新反馈状态"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                if confidence_score is not None:
                    cursor.execute("""
                        UPDATE ai_feedback
                        SET status = %s, confidence_score = %s, reviewed_time = NOW()
                        WHERE feedback_id = %s
                    """, (status, confidence_score, feedback_id))
                else:
                    cursor.execute("""
                        UPDATE ai_feedback
                        SET status = %s, reviewed_time = NOW()
                        WHERE feedback_id = %s
                    """, (status, feedback_id))
            return True
        except Exception as e:
            print(f"[MySQL] Failed to update feedback status: {e}")
            return False

    def get_positive_feedbacks(self, dept_id: int, days: int = 30) -> List[FeedbackRecord]:
        """获取最近N天的正面反馈"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM ai_feedback
                WHERE dept_id = %s AND rating = 1
                AND create_time >= DATE_SUB(NOW(), INTERVAL %s DAY)
                ORDER BY create_time DESC
            """, (dept_id, days))
            return [self._row_to_feedback(row) for row in cursor.fetchall()]

    def get_feedback_stats(self, dept_id: Optional[int] = None) -> Dict[str, int]:
        """获取反馈统计信息"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if dept_id is not None:
                cursor.execute("""
                    SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as positive,
                        SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) as negative,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
                    FROM ai_feedback
                    WHERE dept_id = %s
                """, (dept_id,))
            else:
                cursor.execute("""
                    SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as positive,
                        SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) as negative,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
                    FROM ai_feedback
                """)
            row = cursor.fetchone()
            return row if row else {'total': 0, 'positive': 0, 'negative': 0, 'pending': 0}

    # ==================== Knowledge 相关方法 ====================

    def create_knowledge(self, knowledge: KnowledgeEntry) -> bool:
        """创建知识库条目"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                # 将布尔值转换为CHAR(1)格式
                enabled_val = '1' if knowledge.enabled else '0'
                indexed_val = '1' if knowledge.indexed else '0'

                cursor.execute("""
                    INSERT INTO ai_knowledge_base
                    (kb_id, question, answer, dept_id, category, source, feedback_id,
                     quality_score, enabled, indexed, create_time, update_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    knowledge.kb_id, knowledge.question, knowledge.answer, knowledge.dept_id,
                    knowledge.category, knowledge.source, knowledge.feedback_id,
                    knowledge.quality_score, enabled_val, indexed_val,
                    knowledge.created_at, knowledge.updated_at
                ))
            return True
        except Exception as e:
            print(f"[MySQL] Failed to create knowledge: {e}")
            return False

    def get_knowledge_by_id(self, kb_id: str) -> Optional[KnowledgeEntry]:
        """根据ID获取知识库条目"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ai_knowledge_base WHERE kb_id = %s", (kb_id,))
            row = cursor.fetchone()
            return self._row_to_knowledge(row) if row else None

    def get_knowledge_by_dept(
        self,
        dept_id: int,
        indexed: Optional[bool] = None,
        enabled_only: bool = True
    ) -> List[KnowledgeEntry]:
        """获取指定部门的知识库"""
        with self._get_connection() as conn:
            cursor = conn.cursor()

            query = "SELECT * FROM ai_knowledge_base WHERE dept_id = %s"
            params = [dept_id]

            if indexed is not None:
                # 将布尔值转换为CHAR(1)
                indexed_val = '1' if indexed else '0'
                query += " AND indexed = %s"
                params.append(indexed_val)

            if enabled_only:
                query += " AND enabled = '1'"

            query += " ORDER BY create_time DESC"

            cursor.execute(query, params)
            return [self._row_to_knowledge(row) for row in cursor.fetchall()]

    def update_knowledge(self, kb_id: str, updates: Dict[str, Any]) -> bool:
        """更新知识库条目"""
        if not updates:
            return False

        # 转换布尔值为CHAR(1)
        if 'enabled' in updates:
            updates['enabled'] = '1' if updates['enabled'] else '0'
        if 'indexed' in updates:
            updates['indexed'] = '1' if updates['indexed'] else '0'

        # 总是更新 update_time
        updates['update_time'] = datetime.now()

        set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
        values = list(updates.values()) + [kb_id]

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE ai_knowledge_base SET {set_clause} WHERE kb_id = %s",
                values
            )
            return cursor.rowcount > 0

    def delete_knowledge(self, kb_id: str) -> bool:
        """删除知识库条目"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM ai_knowledge_base WHERE kb_id = %s", (kb_id,))
            return cursor.rowcount > 0

    def get_unindexed_knowledge(self, dept_id: int) -> List[KnowledgeEntry]:
        """获取未归档的知识"""
        return self.get_knowledge_by_dept(dept_id, indexed=False, enabled_only=True)

    def bulk_delete_knowledge(self, kb_ids: List[str]) -> int:
        """批量删除知识库条目(归档后清理)"""
        if not kb_ids:
            return 0

        placeholders = ", ".join(["%s"] * len(kb_ids))

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"DELETE FROM ai_knowledge_base WHERE kb_id IN ({placeholders})",
                kb_ids
            )
            return cursor.rowcount

    def get_depts_with_unindexed_knowledge(self) -> List[int]:
        """获取有未归档知识的部门列表"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT dept_id
                FROM ai_knowledge_base
                WHERE indexed = '0' AND enabled = '1'
            """)
            return [row['dept_id'] for row in cursor.fetchall()]

    # ==================== 聊天会话操作 ====================

    def create_chat_session(
        self,
        session_id: str,
        user_id: int,
        dept_id: int,
        title: str = "新对话"
    ) -> bool:
        """创建聊天会话"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO ai_chat_session
                    (session_id, user_id, dept_id, title, create_time, update_time, del_flag)
                    VALUES (%s, %s, %s, %s, NOW(), NOW(), '0')
                    ON DUPLICATE KEY UPDATE update_time = NOW()
                """, (session_id, user_id, dept_id, title))
            return True
        except Exception as e:
            print(f"[MySQL] Failed to create chat session: {e}")
            return False

    def get_user_chat_sessions(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """获取用户的聊天会话列表"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT session_id, user_id, dept_id, title, create_time, update_time
                FROM ai_chat_session
                WHERE user_id = %s AND del_flag = '0'
                ORDER BY update_time DESC
                LIMIT %s OFFSET %s
            """, (user_id, limit, offset))
            return cursor.fetchall()

    def update_chat_session_title(
        self,
        session_id: str,
        title: str
    ) -> bool:
        """更新会话标题"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE ai_chat_session
                    SET title = %s, update_time = NOW()
                    WHERE session_id = %s
                """, (title, session_id))
            return True
        except Exception as e:
            print(f"[MySQL] Failed to update chat session title: {e}")
            return False

    def delete_chat_session(
        self,
        session_id: str,
        user_id: int
    ) -> bool:
        """删除会话(软删除)"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE ai_chat_session
                    SET del_flag = '2'
                    WHERE session_id = %s AND user_id = %s
                """, (session_id, user_id))
            return True
        except Exception as e:
            print(f"[MySQL] Failed to delete chat session: {e}")
            return False

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
        """保存聊天消息"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO ai_chat_message
                    (message_id, session_id, user_id, role, content, rag_score, source_type, create_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                """, (message_id, session_id, user_id, role, content, rag_score, source_type))
            return True
        except Exception as e:
            print(f"[MySQL] Failed to save chat message: {e}")
            return False

    def get_chat_messages(
        self,
        session_id: str,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """获取会话消息列表"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT message_id, session_id, user_id, role, content, rag_score, source_type, create_time
                FROM ai_chat_message
                WHERE session_id = %s AND user_id = %s
                ORDER BY create_time ASC
            """, (session_id, user_id))
            return cursor.fetchall()

    def __del__(self):
        """清理资源"""
        if self.ssh_tunnel:
            try:
                self.ssh_tunnel.stop()
                print("[MySQL] SSH tunnel stopped")
            except:
                pass
