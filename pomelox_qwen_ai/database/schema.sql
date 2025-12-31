-- ==================== pomelox_ai 数据库表结构 ====================
-- 创建数据库
CREATE DATABASE IF NOT EXISTS pomelox_ai DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pomelox_ai;

-- ==================== 反馈表 ====================
CREATE TABLE IF NOT EXISTS ai_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    feedback_id VARCHAR(50) NOT NULL UNIQUE COMMENT '反馈ID',
    session_id VARCHAR(100) NOT NULL COMMENT '会话ID',
    school_id VARCHAR(20) NOT NULL COMMENT '学校ID',
    question TEXT NOT NULL COMMENT '用户问题',
    answer TEXT NOT NULL COMMENT 'AI回答',
    rating TINYINT NOT NULL COMMENT '评分: 1=有帮助, 0=无帮助',
    rag_score DECIMAL(4,3) DEFAULT 0.000 COMMENT 'RAG检索分数',
    source_type VARCHAR(20) DEFAULT 'knowledge_base' COMMENT '来源类型: knowledge_base/web_search',
    status VARCHAR(20) NOT NULL DEFAULT 'recorded' COMMENT '状态: recorded/pending_review/auto_approved/approved/rejected',
    confidence_score DECIMAL(4,3) DEFAULT NULL COMMENT '置信度分数',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    reviewed_at DATETIME DEFAULT NULL COMMENT '审核时间',

    INDEX idx_session (session_id),
    INDEX idx_school (school_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI反馈表';

-- ==================== 知识库表 ====================
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    kb_id VARCHAR(50) NOT NULL UNIQUE COMMENT '知识库ID',
    question TEXT NOT NULL COMMENT '问题',
    answer TEXT NOT NULL COMMENT '答案',
    school_id VARCHAR(20) NOT NULL COMMENT '学校ID',
    category VARCHAR(50) DEFAULT NULL COMMENT '分类',
    source VARCHAR(30) NOT NULL DEFAULT 'user_feedback' COMMENT '来源: user_feedback/manual/import',
    feedback_id VARCHAR(50) DEFAULT NULL COMMENT '关联的反馈ID',
    quality_score DECIMAL(4,3) DEFAULT 0.700 COMMENT '质量分数',
    enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    indexed BOOLEAN DEFAULT FALSE COMMENT '是否已归档到向量索引',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_school (school_id),
    INDEX idx_indexed (indexed),
    INDEX idx_enabled (enabled),
    INDEX idx_source (source),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (feedback_id) REFERENCES ai_feedback(feedback_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI知识库表';

-- ==================== 示例数据 (可选) ====================
-- 插入示例反馈数据
-- INSERT INTO ai_feedback (feedback_id, session_id, school_id, question, answer, rating, rag_score, source_type, status, confidence_score)
-- VALUES ('fb_example_001', 'session_123', 'UCSD', '学费是多少?', '学费约为...', 1, 0.85, 'knowledge_base', 'auto_approved', 0.82);

-- 插入示例知识库数据
-- INSERT INTO ai_knowledge_base (kb_id, question, answer, school_id, source, feedback_id, quality_score, indexed)
-- VALUES ('kb_example_001', '学费是多少?', '学费约为...', 'UCSD', 'user_feedback', 'fb_example_001', 0.80, FALSE);
