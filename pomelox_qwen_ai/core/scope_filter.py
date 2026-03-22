"""
Lightweight scope filter for AI chat.
- Rejects off-topic questions BEFORE RAG/LLM to save time and cost.
- Detects simple chat (greetings, thanks, confirmations) to skip RAG entirely.
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


# ==================== Simple Chat Detection ====================
# These patterns match greetings, thanks, confirmations, and follow-ups
# that do NOT need RAG retrieval — just a quick LLM reply (or canned reply).

_SIMPLE_CHAT_EXACT = {
    # Greetings
    '你好', '您好', 'hi', 'hello', 'hey', '嗨', '哈喽', '在吗', '在不在',
    # Thanks
    '谢谢', '感谢', '谢谢你', '谢谢啦', '多谢', 'thanks', 'thank you', 'thx',
    # Confirmations
    '好的', '好', 'ok', 'okay', '知道了', '明白了', '了解', '收到',
    '嗯', '嗯嗯', '好吧', '行', '可以', '没问题',
    # Farewells
    '再见', '拜拜', 'bye', '88', '886',
    # Affirmations / reactions
    '哦', '哦哦', '噢', '是的', '对', '对的', '没错',
    # Filler
    '嘿', '喂',
}

_SIMPLE_CHAT_PATTERNS = [
    r'^(你好|您好|hi|hello|hey).{0,6}$',           # 你好呀 / hello!
    r'^谢谢.{0,4}$',                                # 谢谢啦 / 谢谢你
    r'^(好的|收到|明白|了解|知道了).{0,4}$',           # 好的谢谢
    r'^(还有吗|还有呢|还有别的吗|就这些吗)$',           # follow-up expecting more
    r'^(可以了|够了|不用了|没有了|没了)$',              # done / no more
    r'^(哈哈|haha|lol|😂|👍|🙏).{0,4}$',            # emoji / laughter
]
_compiled_simple = [re.compile(p, re.IGNORECASE) for p in _SIMPLE_CHAT_PATTERNS]

# Canned replies keyed by intent — avoids LLM call entirely for ultra-fast response
_SIMPLE_REPLIES = {
    'greeting': '你好！我是{school}的留学助手，有什么留学相关的问题可以问我哦～',
    'thanks': '不客气！如果还有其他留学相关的问题，随时问我～',
    'farewell': '再见，祝一切顺利！有问题随时回来找我～',
    'confirm': None,   # None means: skip RAG but still call LLM with history (for natural continuation)
    'followup': None,  # same — LLM with history, no RAG
}


def classify_simple_chat(question: str):
    """
    Classify whether a message is simple chat that doesn't need RAG.

    Returns:
        str intent key ('greeting', 'thanks', 'farewell', 'confirm', 'followup')
        or None if the message is a real question that needs RAG.
    """
    q = question.strip()
    q_lower = q.lower()

    # Exact match (fastest path)
    if q_lower in _SIMPLE_CHAT_EXACT:
        # Determine intent
        if q_lower in {'你好', '您好', 'hi', 'hello', 'hey', '嗨', '哈喽', '在吗', '在不在', '嘿', '喂'}:
            return 'greeting'
        if q_lower in {'谢谢', '感谢', '谢谢你', '谢谢啦', '多谢', 'thanks', 'thank you', 'thx'}:
            return 'thanks'
        if q_lower in {'再见', '拜拜', 'bye', '88', '886'}:
            return 'farewell'
        if q_lower in {'还有吗', '还有呢', '还有别的吗', '就这些吗'}:
            return 'followup'
        return 'confirm'

    # Regex match (slightly slower but catches variants)
    for pattern in _compiled_simple:
        if pattern.search(q):
            if any(kw in q_lower for kw in ['谢', 'thank', 'thx']):
                return 'thanks'
            if any(kw in q_lower for kw in ['你好', '您好', 'hi', 'hello', 'hey']):
                return 'greeting'
            if any(kw in q_lower for kw in ['再见', '拜拜', 'bye', '88']):
                return 'farewell'
            if any(kw in q_lower for kw in ['还有', '别的']):
                return 'followup'
            return 'confirm'

    return None


def get_simple_reply(intent: str, dept_id: int):
    """
    Get a canned reply for simple chat intent.

    Returns:
        str reply text, or None if LLM should handle (with skipRag=True).
    """
    template = _SIMPLE_REPLIES.get(intent)
    if template is None:
        return None  # caller should use LLM without RAG

    from config import Config
    school_name = Config.DEPARTMENTS.get(dept_id, {}).get('name_cn') or \
                  Config.ALL_SCHOOL_NAMES.get(dept_id, '你的学校')
    return template.format(school=school_name)


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
