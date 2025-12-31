-- ==================== inter_stu_center 数据库 AI模块表结构 ====================
-- 用于现有数据库的AI功能扩展
-- 遵循若依框架命名规范
-- ==================================================================================

-- ==================== 1. AI聊天会话表 ====================
CREATE TABLE IF NOT EXISTS ai_chat_session (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
    session_id VARCHAR(100) NOT NULL UNIQUE COMMENT '会话唯一标识(UUID)',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    dept_id BIGINT NOT NULL COMMENT '学校ID(部门ID)',
    title VARCHAR(200) DEFAULT '新对话' COMMENT '对话标题',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    del_flag CHAR(1) DEFAULT '0' COMMENT '删除标志(0存在 2删除)',

    INDEX idx_user (user_id),
    INDEX idx_dept (dept_id),
    INDEX idx_session (session_id),
    INDEX idx_create_time (create_time),
    INDEX idx_del_flag (del_flag),
    FOREIGN KEY (user_id) REFERENCES sys_user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES sys_dept(dept_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI聊天会话表';

-- ==================== 2. AI聊天消息表 ====================
CREATE TABLE IF NOT EXISTS ai_chat_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
    message_id VARCHAR(100) NOT NULL UNIQUE COMMENT '消息唯一标识',
    session_id VARCHAR(100) NOT NULL COMMENT '会话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role VARCHAR(20) NOT NULL COMMENT '角色: user/assistant/system',
    content TEXT NOT NULL COMMENT '消息内容',
    rag_score DECIMAL(5,3) DEFAULT NULL COMMENT 'RAG检索分数',
    source_type VARCHAR(30) DEFAULT 'knowledge_base' COMMENT '来源: knowledge_base/web_search',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_session (session_id),
    INDEX idx_user (user_id),
    INDEX idx_role (role),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (user_id) REFERENCES sys_user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES ai_chat_session(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI聊天消息表';

-- ==================== 3. AI反馈表 ====================
CREATE TABLE IF NOT EXISTS ai_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '反馈ID',
    feedback_id VARCHAR(50) NOT NULL UNIQUE COMMENT '反馈唯一标识',
    session_id VARCHAR(100) NOT NULL COMMENT '会话ID',
    message_id VARCHAR(100) NOT NULL COMMENT '消息ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    dept_id BIGINT NOT NULL COMMENT '学校ID',
    question TEXT NOT NULL COMMENT '用户问题',
    answer TEXT NOT NULL COMMENT 'AI回答',
    rating TINYINT NOT NULL COMMENT '评分: 1=有帮助, -1=没帮助',
    rag_score DECIMAL(5,3) DEFAULT 0.000 COMMENT 'RAG检索分数',
    source_type VARCHAR(30) DEFAULT 'knowledge_base' COMMENT '来源类型',
    status VARCHAR(20) NOT NULL DEFAULT 'recorded' COMMENT '状态: recorded/pending/auto_approved/approved/rejected',
    confidence_score DECIMAL(5,3) DEFAULT NULL COMMENT '置信度分数',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    reviewed_time DATETIME DEFAULT NULL COMMENT '审核时间',

    INDEX idx_session (session_id),
    INDEX idx_user (user_id),
    INDEX idx_dept (dept_id),
    INDEX idx_status (status),
    INDEX idx_rating (rating),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (user_id) REFERENCES sys_user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES sys_dept(dept_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES ai_chat_session(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI反馈表';

-- ==================== 4. AI知识库表 ====================
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '知识库ID',
    kb_id VARCHAR(50) NOT NULL UNIQUE COMMENT '知识库唯一标识',
    question TEXT NOT NULL COMMENT '问题',
    answer TEXT NOT NULL COMMENT '答案',
    dept_id BIGINT NOT NULL COMMENT '学校ID',
    category VARCHAR(50) DEFAULT NULL COMMENT '分类',
    source VARCHAR(30) NOT NULL DEFAULT 'user_feedback' COMMENT '来源: user_feedback/manual/import',
    feedback_id VARCHAR(50) DEFAULT NULL COMMENT '关联的反馈ID',
    quality_score DECIMAL(5,3) DEFAULT 0.700 COMMENT '质量分数',
    enabled CHAR(1) DEFAULT '1' COMMENT '是否启用(0否 1是)',
    indexed CHAR(1) DEFAULT '0' COMMENT '是否已归档到向量索引(0否 1是)',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_dept (dept_id),
    INDEX idx_indexed (indexed),
    INDEX idx_enabled (enabled),
    INDEX idx_source (source),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (dept_id) REFERENCES sys_dept(dept_id) ON DELETE CASCADE,
    FOREIGN KEY (feedback_id) REFERENCES ai_feedback(feedback_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI知识库表';

-- ==================== 示例查询语句 ====================

-- 1. 查询用户的聊天会话列表
-- SELECT * FROM ai_chat_session
-- WHERE user_id = ? AND del_flag = '0'
-- ORDER BY update_time DESC
-- LIMIT 20 OFFSET 0;

-- 2. 查询会话的所有消息
-- SELECT * FROM ai_chat_message
-- WHERE session_id = ? AND user_id = ?
-- ORDER BY create_time ASC;

-- 3. 查询待审核的反馈
-- SELECT * FROM ai_feedback
-- WHERE status = 'pending'
-- ORDER BY create_time DESC;

-- 4. 查询未向量化的知识库条目
-- SELECT * FROM ai_knowledge_base
-- WHERE indexed = '0' AND enabled = '1'
-- ORDER BY create_time ASC;

-- ==================== 统计查询 ====================

-- 1. 统计每个学校的对话数量
-- SELECT dept_id, COUNT(*) as session_count
-- FROM ai_chat_session
-- WHERE del_flag = '0'
-- GROUP BY dept_id;

-- 2. 统计反馈评分分布
-- SELECT dept_id, rating, COUNT(*) as count
-- FROM ai_feedback
-- GROUP BY dept_id, rating;

-- 3. 统计知识库条目数量
-- SELECT dept_id,
--        SUM(CASE WHEN indexed = '1' THEN 1 ELSE 0 END) as indexed_count,
--        SUM(CASE WHEN indexed = '0' THEN 1 ELSE 0 END) as pending_count
-- FROM ai_knowledge_base
-- WHERE enabled = '1'
-- GROUP BY dept_id;
