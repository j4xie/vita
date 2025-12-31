import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # Qwen API configuration
    DASHSCOPE_API_KEY = os.environ.get('DASHSCOPE_API_KEY') or 'your-api-key-here'

    # Server configuration
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 8087))
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

    # Department (School) configuration - 直接使用 dept_id 作为主键
    # dept_id 对应数据库 sys_dept 表的 dept_id 字段
    DEPARTMENTS = {
        211: {'name': 'UC Berkeley', 'name_cn': '加州大学伯克利分校', 'file': 'UCBCU'},
        213: {'name': 'University of Southern California', 'name_cn': '南加州大学', 'file': 'USCCU'},
        214: {'name': 'UC Los Angeles', 'name_cn': '加州大学洛杉矶分校', 'file': 'UCLACU'},
        216: {'name': 'UC San Diego', 'name_cn': '加州大学圣地亚哥分校', 'file': 'UCSD'},
        218: {'name': 'University of Washington', 'name_cn': '华盛顿大学', 'file': 'UWCU'},
        226: {'name': 'New York University', 'name_cn': '纽约大学', 'file': 'NYUCU'},
    }

    # 所有有效的 dept_id 列表(用于验证)
    VALID_DEPT_IDS = list(DEPARTMENTS.keys())

    # RAG configuration
    SCHOOL_DATA_PATH = os.path.join(os.path.dirname(__file__), 'school_data')
    VECTOR_STORE_PATH = os.path.join(os.path.dirname(__file__), 'vector_store')
    RAG_SIMILARITY_THRESHOLD = 0.2      # Minimum similarity threshold
    RAG_HIGH_QUALITY_THRESHOLD = 0.5    # High quality result threshold (web search triggered below this value)
    RAG_CHUNK_COUNT = 5

    # Web search configuration
    ENABLE_WEB_SEARCH_FALLBACK = True   # Whether to enable web search fallback
    WEB_SEARCH_STRATEGY = 'standard'    # Search strategy: standard, pro (pro returns more sources)

    # ==================== 反馈系统配置 ====================
    # 数据库配置 (从环境变量读取,默认json)
    DATABASE_TYPE = os.environ.get('DATABASE_TYPE', 'json')  # 'json' (开发/测试) 或 'mysql' (生产)

    # MySQL 配置 (生产环境使用时取消注释并配置)
    # MYSQL_CONFIG = {
    #     'host': 'localhost',
    #     'port': 3306,
    #     'user': 'your_user',
    #     'password': 'your_password',
    #     'database': 'pomelox_ai'
    #}

    # PostgreSQL 配置 (可选)
    # POSTGRESQL_CONFIG = {
    #     'host': 'localhost',
    #     'port': 5432,
    #     'user': 'your_user',
    #     'password': 'your_password',
    #     'database': 'pomelox_ai'
    # }

    # 置信度阈值配置
    CONFIDENCE_THRESHOLD_AUTO = 0.8     # 自动入库阈值 (>= 此值自动加入知识库)
    CONFIDENCE_THRESHOLD_REVIEW = 0.5   # 待审核阈值 (>= 此值进入待审核队列)

    # 相似问题检测配置
    SIMILAR_QUESTION_THRESHOLD = 0.85   # 相似度阈值 (85%以上认为是相似问题)
    SIMILAR_QUESTION_COUNT_THRESHOLD = 3  # 相似问题数量阈值
    SIMILAR_QUESTION_DAYS = 30          # 查询最近N天的反馈

    # 归档配置
    ARCHIVE_ENABLED = True              # 是否启用定时归档
    ARCHIVE_DELETE_AFTER_INDEX = False  # 归档后是否从数据库删除 (False=保留,标记为已归档)

# Set Qwen API key
import dashscope
dashscope.api_key = Config.DASHSCOPE_API_KEY