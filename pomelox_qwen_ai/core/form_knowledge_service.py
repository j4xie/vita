"""
Form Knowledge Base Service

Loads 88 real production forms from mike-x and provides:
1. Keyword-based matching to find relevant form examples
2. System prompt construction for the form designer AI assistant
"""

import json
import os
import re
from typing import List, Dict, Tuple

# Load knowledge base on module init
_KB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'form_knowledge_base.json')
_FORM_KB: List[Dict] = []

def _load_kb():
    global _FORM_KB
    try:
        with open(_KB_PATH, 'r', encoding='utf-8') as f:
            _FORM_KB = json.load(f)
        print(f"[Form KB] Loaded {len(_FORM_KB)} forms from knowledge base")
    except Exception as e:
        print(f"[Form KB] Failed to load knowledge base: {e}")
        _FORM_KB = []

_load_kb()


# ==================== Keyword Matching ====================

# Category keywords for matching
_CATEGORY_KEYWORDS = {
    'pickup': ['接机', '接送', 'airport', 'pickup', '航班', '班车', 'shuttle', '落地'],
    'recruit': ['招新', '招募', 'recruit', '纳新', '申请', 'application', 'officer', 'eboard', '换届'],
    'halloween': ['万圣节', 'halloween', '万圣', 'costume', '鬼'],
    'meetup': ['见面会', 'meetup', 'orientation', '迎新', '线下见面'],
    'ceremony': ['开学大典', 'welcoming', 'ceremony', '开学'],
    'social': ['非诚勿扰', '交友', 'dating', '脱单', '相亲', '单身', '联谊', '避难所'],
    'competition': ['比赛', '竞赛', 'competition', '王者', '麻将', '游戏', '电竞', '歌手', 'singing'],
    'mentorship': ['领导力', 'leadership', 'mentor', 'mentee', '导师', '指导'],
    'election': ['选举', '换届', 'election', 'VP', '竞选', '投票'],
    'membership': ['VITA', '会员', 'member', 'membership', '入会'],
    'safety': ['安心', '安全', 'safety', '失联', '紧急'],
    'photo': ['相册', 'photo', '照片', '素材', '投稿'],
    'roommate': ['室友', 'roommate', '合租', '租房', '找房'],
    'class_group': ['课友', '选课', 'class', '课程', '课群'],
    'hotel': ['酒店', 'hotel', '住宿', '预订', '折扣'],
    'survey': ['问卷', 'survey', '反馈', '调查', '意向'],
    'payment': ['支付', 'payment', '付费', '收费', '门票', '售票'],
    'party': ['晚会', '派对', 'party', 'gala', '庆典', '春节', '感恩节', '中秋', '元宵', '年夜饭'],
    'graduation': ['毕业', 'graduation', '毕业季'],
    'volunteer': ['志愿', 'volunteer', '义工', '公益'],
    'performance': ['节目', '表演', '主持', '竞选', '才艺'],
    'dance': ['舞会', '假面', 'masquerade', 'dance'],
    'staff': ['工作人员', 'staff', '内部', '留任'],
    'nda': ['NDA', '协议', 'agreement', '保密'],
    'lecture': ['讲座', '研讨', 'lecture', 'seminar', 'workshop', '分享'],
    'food': ['聚餐', '烧烤', 'BBQ', '火锅', '菜品', '预订', '餐'],
}

# School name patterns
_SCHOOL_PATTERNS = ['UCSD', 'UCI', 'UCD', 'USC', 'UCSB', 'UCLA', 'UCB', 'UCSC', 'UMN', 'UW', 'SDSU', 'SBCC', 'Stanford']


def _detect_category(name: str) -> str:
    """Detect form category from its name"""
    n = name.lower()
    for cat, keywords in _CATEGORY_KEYWORDS.items():
        if any(kw.lower() in n for kw in keywords):
            return cat
    return 'general'


def match_forms(question: str, top_k: int = 5) -> List[Dict]:
    """
    Match user question to the most relevant real forms.
    Returns top_k forms with variety (avoids returning all from same category).
    """
    if not _FORM_KB:
        return []

    q = question.lower()
    q_words = [w for w in re.split(r'[\s,，。！？、/|]+', q) if len(w) > 1]

    scored = []
    for form in _FORM_KB:
        score = 0
        name = (form.get('name') or '').lower()
        fields = form.get('fields') or []

        # 1. Category keyword matching (highest weight)
        for cat, keywords in _CATEGORY_KEYWORDS.items():
            cat_match = any(kw.lower() in q for kw in keywords)
            name_match = any(kw.lower() in name for kw in keywords)
            if cat_match and name_match:
                score += 20  # Both user question and form match same category

        # 2. School name matching
        for school in _SCHOOL_PATTERNS:
            if school.lower() in q and school.lower() in name:
                score += 15

        # 3. Direct word matching in form name
        for w in q_words:
            if w in name:
                score += 8

        # 4. Field title matching (for specific field requests)
        for field in fields[:15]:
            ft = (field.get('title') or '').lower()
            for w in q_words:
                if len(w) > 2 and w in ft:
                    score += 3

        # 5. Richness bonus (prefer forms with more fields as examples)
        if len(fields) >= 10:
            score += 2
        if len(fields) >= 20:
            score += 3

        if score > 0:
            scored.append((form, score))

    # Sort by score
    scored.sort(key=lambda x: x[1], reverse=True)

    # Select with variety
    selected = []
    seen_cats = set()
    for form, score in scored:
        cat = _detect_category(form.get('name', ''))
        if cat in seen_cats and len(selected) >= 2:
            continue
        seen_cats.add(cat)
        selected.append(form)
        if len(selected) >= top_k:
            break

    return selected


# ==================== System Prompt Construction ====================

def format_form_examples(forms: List[Dict]) -> str:
    """Format matched forms as prompt examples"""
    if not forms:
        return ''

    text = '\n\n## 真实表单参考（从88个生产表单中智能匹配）\n'
    text += '以下是与用户需求最相关的真实表单案例。**生成推荐时必须参考这些真实案例的字段命名、选项内容和表单结构**，确保生成结果贴近实际使用。\n\n'

    for i, form in enumerate(forms):
        name = form.get('name', 'Unknown')
        fields = form.get('fields') or []
        pages = form.get('pages', 1)
        has_payment = form.get('hasPayment', False)
        has_signature = form.get('hasSignature', False)

        text += f'### 参考{i+1}: {name}'
        if pages > 1:
            text += f' [{pages}页]'
        if has_payment:
            text += ' [含支付]'
        if has_signature:
            text += ' [含签名]'
        text += f' ({len(fields)}个字段)\n'

        for field in fields:
            title = field.get('title', '')
            ftype = field.get('type', 'input')
            required = '必填' if field.get('required') else '选填'
            desc = field.get('desc', '')
            options = field.get('options', [])
            placeholder = field.get('placeholder', '')

            text += f'  - **{title}** ({ftype}, {required})'
            if desc:
                text += f' — {desc}'
            text += '\n'
            if options:
                opts_str = ' / '.join(options[:6])
                if len(options) > 6:
                    opts_str += f' ...(共{len(options)}项)'
                text += f'    选项: {opts_str}\n'
            if placeholder:
                text += f'    placeholder: "{placeholder}"\n'
        text += '\n'

    text += '**参考规则**: 字段名、选项值、desc描述参考真实案例，但根据用户具体需求灵活增减。不要生搬硬套。\n'
    return text


def build_form_designer_prompt(user_question: str, designer_context: str = '') -> str:
    """
    Build the complete system prompt for the form designer AI assistant.

    Args:
        user_question: The user's original question/request
        designer_context: Additional context from the form designer (current form state, etc.)

    Returns:
        Complete system prompt with knowledge base examples
    """
    # Match relevant forms
    matched_forms = match_forms(user_question)
    kb_examples = format_form_examples(matched_forms)

    # Build match hint
    match_hint = ''
    if matched_forms:
        match_hint = '\n\n## 当前问题匹配的真实表单\n'
        match_hint += '根据用户描述，以下真实表单最相关，**优先参考这些表单的字段列表来推荐**：\n\n'
        for i, form in enumerate(matched_forms[:3]):
            name = form.get('name', '')
            fields = form.get('fields', [])
            match_hint += f'{i+1}. **{name}** ({len(fields)}个字段)\n'
            field_summary = '、'.join(f.get('title', '') for f in fields[:8])
            if len(fields) > 8:
                field_summary += f'...等共{len(fields)}个字段'
            match_hint += f'   字段: {field_summary}\n'
        match_hint += '\n请基于匹配的真实表单生成FIELDS推荐，根据用户具体需求调整。\n'

    # Knowledge base stats
    kb_stats = f'\n\n## 知识库统计\n- 真实表单总数: {len(_FORM_KB)}\n- 覆盖学校: UCSD、UCI、UCD、USC、UCSB、UCLA、UCB、UCSC、UMN、UW等10+所大学\n- 表单类型: 接机、招新、开学大典、万圣节、见面会、比赛、领导力、选举、VITA会员、安心计划等20+种\n'

    return kb_examples + match_hint + kb_stats + ('\n\n' + designer_context if designer_context else '')


def get_kb_stats() -> Dict:
    """Return knowledge base statistics"""
    if not _FORM_KB:
        return {'total': 0}

    categories = {}
    schools = {}
    total_fields = 0
    for form in _FORM_KB:
        cat = _detect_category(form.get('name', ''))
        categories[cat] = categories.get(cat, 0) + 1
        for school in _SCHOOL_PATTERNS:
            if school.lower() in (form.get('name') or '').lower():
                schools[school] = schools.get(school, 0) + 1
        total_fields += len(form.get('fields', []))

    return {
        'total_forms': len(_FORM_KB),
        'total_fields': total_fields,
        'avg_fields': round(total_fields / len(_FORM_KB), 1),
        'categories': categories,
        'schools': schools,
    }
