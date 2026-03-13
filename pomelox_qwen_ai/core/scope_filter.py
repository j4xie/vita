"""
Lightweight scope filter for AI chat.
Rejects off-topic questions BEFORE RAG/LLM to save time and cost.
"""
import re

# In-scope keywords (if ANY match, question is in-scope)
_IN_SCOPE_KEYWORDS = [
    # Academics
    '学费', '学分', '课程', '选课', 'GPA', '成绩', '专业', '转学', '申请', '录取',
    '毕业', '学位', '导师', 'advisor', '实习', 'internship', 'research',
    # Campus life
    '宿舍', '住宿', '租房', '校园', '食堂', '图书馆', '健身房', '社团', '活动',
    '迎新', '开学', 'orientation', 'campus',
    # Visa & immigration
    '签证', 'visa', 'I-20', 'OPT', 'CPT', 'SEVIS', '护照', '出入境', '海关',
    'immigration', 'F-1', 'F1',
    # Finance
    '奖学金', 'scholarship', '助学金', '缴费', '学费', '保险', 'insurance',
    # Transportation & local
    '交通', '出行', '租车', '公交', '地铁', '机场', '接机', '打车', 'uber',
    '超市', '购物', '中餐', '餐厅', '美食', '银行', '手机卡', 'SIM',
    # Housing
    '公寓', 'apartment', '房租', '合租', '室友', 'roommate',
    # Safety & health
    '安全', '医院', '看病', '急诊', '心理', '咨询',
    # School names (allow questions about specific schools)
    'UCSD', 'UCLA', 'UCB', 'USC', 'UCI', 'UCSB', 'UCSC', 'UW', 'NYU', 'OSU',
    'UPenn', 'UMN', '大学', '学校', 'university', 'college',
    # General study abroad
    '留学', '出国', '新生', '学长', '学姐',
    # Volunteer & activities
    '志愿', 'volunteer', '义工', '服务', '小时',
    # Cards & rewards
    '优惠', '折扣', '会员', '积分',
]

# Off-topic patterns (if matched AND no in-scope keyword, reject)
_OFF_TOPIC_PATTERNS = [
    r'写.{0,4}(诗|歌|文章|小说|故事|代码|程序|作文)',
    r'帮我(写|编|创作|翻译|画)',
    r'(讲个|说个|来个).{0,4}(笑话|故事|段子)',
    r'(今天|明天|昨天).{0,4}(天气|温度|气温)',
    r'(你是谁|你叫什么|你多大)',
    r'(股票|比特币|基金|炒股|理财)',
    r'(政治|选举|总统|战争)',
    r'(算命|星座|运势|塔罗|占卜)',
    r'(减肥|健身计划|食谱|菜谱)',
    r'(电影|电视剧|综艺|游戏|音乐)推荐',
]

_compiled_off_topic = [re.compile(p) for p in _OFF_TOPIC_PATTERNS]


def is_off_topic(question):
    """Check if a question is outside the study-abroad assistant scope.
    Returns True if off-topic, False if in-scope.
    """
    q = question.strip().lower()

    # If any in-scope keyword is present, it's in-scope
    for kw in _IN_SCOPE_KEYWORDS:
        if kw.lower() in q:
            return False

    # If matches an off-topic pattern, reject
    for pattern in _compiled_off_topic:
        if pattern.search(q):
            return True

    # Short questions without any scope keyword are ambiguous — let LLM handle
    if len(q) < 6:
        return False

    return False


def get_off_topic_reply(dept_id):
    """Return a polite decline message for off-topic questions."""
    from config import Config
    school_name = Config.DEPARTMENTS.get(dept_id, {}).get('name') or \
                  Config.ALL_SCHOOL_NAMES.get(dept_id, 'your school')
    return "我是%s的留学助手，主要帮助解答校园生活、学业、签证、住宿等留学相关问题。请问有什么留学方面的问题我可以帮你？" % school_name
