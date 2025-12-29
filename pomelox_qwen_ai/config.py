import os
from dotenv import load_dotenv

# 加载.env文件中的环境变量
load_dotenv()

class Config:
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # 千问API配置
    DASHSCOPE_API_KEY = os.environ.get('DASHSCOPE_API_KEY') or 'your-api-key-here'

    # 服务器配置
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 8087))
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

    # 学校配置 (file 字段对应 school_data/ 目录下的实际文件名，不含扩展名)
    # deptId 是后端系统中用户所属部门ID，用于自动匹配学校
    SCHOOLS = {
        'UCI': {'name': 'UC Irvine', 'name_cn': '加州大学尔湾分校', 'file': 'UCI', 'deptId': None},
        'UCSD': {'name': 'UC San Diego', 'name_cn': '加州大学圣地亚哥分校', 'file': 'UCSD', 'deptId': 216},
        'NYU': {'name': 'New York University', 'name_cn': '纽约大学', 'file': 'NYUCU', 'deptId': 226},
        'OSU': {'name': 'Ohio State University', 'name_cn': '俄亥俄州立大学', 'file': 'OSUCU', 'deptId': None},
        'UCB': {'name': 'UC Berkeley', 'name_cn': '加州大学伯克利分校', 'file': 'UCBCU', 'deptId': 211},
        'UCLA': {'name': 'UC Los Angeles', 'name_cn': '加州大学洛杉矶分校', 'file': 'UCLACU', 'deptId': 214},
        'UPenn': {'name': 'University of Pennsylvania', 'name_cn': '宾夕法尼亚大学', 'file': 'UPennCU', 'deptId': None},
        'USC': {'name': 'University of Southern California', 'name_cn': '南加州大学', 'file': 'USCCU', 'deptId': 213},
        'UW': {'name': 'University of Washington', 'name_cn': '华盛顿大学', 'file': 'UWCU', 'deptId': 218},
    }

    # deptId 到 school_id 的反向映射（用于根据用户部门ID快速查找学校）
    DEPT_TO_SCHOOL = {
        211: 'UCB',   # 加州大学伯克利分校
        213: 'USC',   # 南加州大学
        214: 'UCLA',  # 加州大学洛杉矶分校
        216: 'UCSD',  # 加州大学圣地亚哥分校
        218: 'UW',    # 华盛顿大学
        226: 'NYU',   # 纽约大学
    }

    # RAG 配置
    SCHOOL_DATA_PATH = os.path.join(os.path.dirname(__file__), 'school_data')
    VECTOR_STORE_PATH = os.path.join(os.path.dirname(__file__), 'vector_store')
    RAG_SIMILARITY_THRESHOLD = 0.2      # 最低相似度阈值
    RAG_HIGH_QUALITY_THRESHOLD = 0.5    # 高质量结果阈值（低于此值触发联网搜索）
    RAG_CHUNK_COUNT = 5

    # 联网搜索配置
    ENABLE_WEB_SEARCH_FALLBACK = True   # 是否启用联网搜索兜底
    WEB_SEARCH_STRATEGY = 'standard'    # 搜索策略: standard, pro (pro会返回更多来源)

# 设置千问API密钥
import dashscope
dashscope.api_key = Config.DASHSCOPE_API_KEY