"""
数据库初始化脚本

用途:
1. JSON模式: 创建数据目录和空数据文件
2. MySQL模式: 执行建表SQL脚本

使用方法:
    python scripts/init_database.py
"""
import os
import sys
import json

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import Config


def init_json_database():
    """初始化 JSON 文件数据库"""
    print("=" * 60)
    print("初始化 JSON 数据库")
    print("=" * 60)

    # 创建数据目录
    data_dir = "data"
    os.makedirs(data_dir, exist_ok=True)
    print(f"✓ 创建目录: {data_dir}/")

    # 创建日志目录
    logs_dir = "logs"
    os.makedirs(logs_dir, exist_ok=True)
    print(f"✓ 创建目录: {logs_dir}/")

    # 创建空数据文件
    files = {
        'ai_feedback.json': [],
        'ai_knowledge_base.json': []
    }

    for filename, initial_data in files.items():
        filepath = os.path.join(data_dir, filename)

        if os.path.exists(filepath):
            print(f"⚠ 文件已存在,跳过: {filepath}")
        else:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, ensure_ascii=False, indent=2)
            print(f"✓ 创建文件: {filepath}")

    print("\n" + "=" * 60)
    print("JSON 数据库初始化完成!")
    print("=" * 60)


def init_mysql_database():
    """初始化 MySQL 数据库"""
    print("=" * 60)
    print("初始化 MySQL 数据库")
    print("=" * 60)

    print("\n请手动执行以下 SQL 脚本:\n")

    sql_script = """
-- 创建反馈记录表
CREATE TABLE IF NOT EXISTS ai_feedback (
    feedback_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    message_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    rating TINYINT NOT NULL COMMENT '1=有帮助, -1=没帮助',
    comment TEXT,
    source_type VARCHAR(32) NOT NULL COMMENT 'web_search 或 knowledge_base',
    rag_score FLOAT NOT NULL COMMENT 'RAG相关性分数',
    school_id VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    confidence_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_school_status (school_id, status),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建知识库表
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    kb_id VARCHAR(64) PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    school_id VARCHAR(32) COMMENT 'NULL表示通用知识',
    category VARCHAR(64),
    source VARCHAR(32) NOT NULL DEFAULT 'manual',
    feedback_id VARCHAR(64),
    quality_score FLOAT DEFAULT 1.0,
    enabled BOOLEAN DEFAULT TRUE,
    indexed BOOLEAN DEFAULT FALSE COMMENT '是否已归档到向量库',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_school_enabled (school_id, enabled),
    INDEX idx_indexed (indexed, school_id),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (feedback_id) REFERENCES ai_feedback(feedback_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

    print(sql_script)
    print("\n" + "=" * 60)
    print("请将上述 SQL 复制到 MySQL 客户端执行")
    print("=" * 60)


def main():
    """主函数"""
    db_type = getattr(Config, 'DATABASE_TYPE', 'json')

    if db_type == 'json':
        init_json_database()
    elif db_type == 'mysql':
        init_mysql_database()
    else:
        print(f"不支持的数据库类型: {db_type}")
        sys.exit(1)


if __name__ == '__main__':
    main()
