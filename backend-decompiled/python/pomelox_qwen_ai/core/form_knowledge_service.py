"""
Form Knowledge Base Service

Loads 88 real production forms from mike-x and provides:
1. Keyword-based matching to find relevant form examples
2. System prompt construction for the form designer AI assistant
"""

import json
import os
import re
from datetime import datetime
from typing import List, Dict, Tuple, Optional


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


# ==================== Type Mapping ====================

# Semantic description of mike-x field types (NOT hardcoded frontend types)
# This helps AI understand what each mike-x type means functionally,
# so it can pick the correct frontend component type from whatever
# the frontend currently supports (passed via supported_types param).
_MIKEX_TYPE_SEMANTICS = {
    'single': '单行文本输入',
    'input': '单行文本输入',
    'number': '数字输入',
    'textarea': '多行文本输入',
    'contactName': '姓名输入（文本）',
    'contactEmail': '邮箱输入（文本, vModel建议: email）',
    'contactMobile': '手机号输入（文本, vModel建议: phone）',
    'contactTelephone': '电话输入（文本）',
    'contactIMItem': '即时通讯号输入（文本, vModel建议: wechatId）',
    'contactCompany': '公司名输入（文本）',
    'contactPosition': '职位输入（文本）',
    'contactAddress': '地址输入（文本）',
    'contactGender': '性别选择（单选: 男/女）',
    'contactBirthDate': '出生日期（日期选择）',
    'contactAvatar': '头像上传（图片上传）',
    'radio': '单选',
    'checkbox': '多选',
    'dropdown': '下拉选择',
    'dateTime': '日期时间选择',
    'date': '日期选择',
    'time': '时间选择',
    'pictureAttachment': '图片上传',
    'attachment': '文件上传',
    'signature': '电子签名（⚠️特殊组件，需确认前端是否支持）',
    'commodity': '商品/支付（⚠️特殊组件，需确认前端是否支持）',
    'staticText': '静态文本说明',
    'staticPicture': '静态图片展示',
    'separator': '分隔线',
    'city': '城市选择（文本或级联选择）',
}


def _get_type_semantic(mikex_type: str) -> str:
    """Get semantic description for a mike-x field type"""
    return _MIKEX_TYPE_SEMANTICS.get(mikex_type, mikex_type)


# ==================== System Prompt Construction ====================

def format_form_examples(forms: List[Dict], supported_types: Optional[List[str]] = None) -> str:
    """
    Format matched forms as prompt examples.

    Args:
        forms: List of matched form dicts from knowledge base
        supported_types: Optional list of frontend-supported component types
                        (e.g., ['input', 'textarea', 'radio', ...]).
                        If provided, will be included as constraint for AI.
                        If not provided, no type constraint is added (frontend
                        system prompt handles it).
    """
    if not forms:
        return ''

    text = '\n\n## 真实表单参考（从88个生产表单中智能匹配）\n'
    text += '以下是与用户需求最相关的真实表单案例。**生成推荐时必须参考这些真实案例的字段命名、选项内容和表单结构**，确保生成结果贴近实际使用。\n'
    text += '注意：字段的原始类型已附带语义说明，请根据前端设计器支持的组件类型进行转换。\n\n'

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
            raw_type = field.get('type', 'input')
            semantic = _get_type_semantic(raw_type)
            required = '必填' if field.get('required') else '选填'
            desc = field.get('desc', '')
            options = field.get('options', [])
            placeholder = field.get('placeholder', '')

            text += f'  - **{title}** [{semantic}] ({required})'
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

    # Current date context for year/season replacement
    now = datetime.now()
    current_year = now.year
    # Determine current academic season
    month = now.month
    if 1 <= month <= 5:
        current_season = '春季'
        next_season = '秋季'
        next_season_year = current_year
    elif 6 <= month <= 8:
        current_season = '夏季'
        next_season = '秋季'
        next_season_year = current_year
    else:
        current_season = '秋季'
        next_season = '春季'
        next_season_year = current_year + 1

    text += '**参考规则**:\n'
    text += '1. 字段名、选项值、desc描述参考真实案例，但根据用户具体需求灵活增减，不要生搬硬套\n'
    text += '2. 生成的type必须使用前端设计器实际支持的组件类型（见系统提示中的类型列表）\n'
    text += '3. 带⚠️标记的特殊组件（如签名、商品支付）需确认前端是否支持，不支持时用替代方案\n'
    text += '4. 联系方式字段通过vModel命名区分用途: name, email, phone, wechatId\n'
    text += f'5. **日期/年份规则（重要）**: 当前日期是{now.strftime("%Y年%m月%d日")}，'
    text += f'当前学期为{current_year}{current_season}，即将到来的学期为{next_season_year}{next_season}。'
    text += '知识库中的年份（如2022、2025等）是历史数据，**生成推荐时必须替换为当前年份**。'
    text += f'例如：将"2025年秋季新生"改为"{current_year}年{current_season}新生"，'
    text += f'将"9月14号"等具体日期改为当前年份对应的合理日期范围。'
    text += '选项中的旧日期也要更新，不要照搬历史数据中的具体日期。\n'

    # If frontend passed supported types, include as reference
    if supported_types:
        text += f'6. 当前前端支持的组件类型: {", ".join(supported_types)}\n'

    return text


def _build_user_context_section(user_context: Optional[Dict]) -> str:
    """
    Build a prompt section that tells AI about the current user's role and school,
    so it can personalize field placeholders, form titles, and field composition.
    """
    if not user_context:
        return ''

    roles = user_context.get('roles', [])
    dept_name = user_context.get('deptName', '')
    nick_name = user_context.get('nickName', '')

    # Determine if this is a headquarters admin (manage) or school-specific admin
    is_manage = 'manage' in roles
    is_part_manage = 'part_manage' in roles

    section = '\n\n## 当前操作者身份（个性化推荐，重要）\n'
    if nick_name:
        section += f'- 操作者: {nick_name}\n'
    section += f'- 角色: {", ".join(roles) if roles else "未知"}\n'
    if dept_name:
        section += f'- 所属部门/学校: {dept_name}\n'

    # School detection from dept_name
    school_code = ''
    school_email_domain = ''
    _SCHOOL_EMAIL_MAP = {
        'UCSD': 'ucsd.edu', 'UCI': 'uci.edu', 'UCD': 'ucdavis.edu',
        'USC': 'usc.edu', 'UCSB': 'ucsb.edu', 'UCLA': 'ucla.edu',
        'UCB': 'berkeley.edu', 'UCSC': 'ucsc.edu', 'UMN': 'umn.edu',
        'UW': 'uw.edu', 'SDSU': 'sdsu.edu', 'Stanford': 'stanford.edu',
        'NYU': 'nyu.edu', 'BU': 'bu.edu', 'NEU': 'northeastern.edu',
    }
    if dept_name:
        for code, domain in _SCHOOL_EMAIL_MAP.items():
            if code.lower() in dept_name.lower():
                school_code = code
                school_email_domain = domain
                break

    section += '\n### 个性化规则\n'

    if is_manage:
        section += '此用户是**总管理员（总部）**，管理多所学校。\n'
        section += '- 表单标题：不要默认加特定学校名，除非用户指定\n'
        section += '- 邮箱placeholder：使用通用示例如 `your_name@school.edu`\n'
        section += '- 学校字段：如果有学校相关字段，提供多校选项（UCSD, UCI, UCLA等）\n'
        section += '- 字段推荐：面向多校通用场景\n'
    elif dept_name:
        section += f'此用户是**{dept_name}**的管理员，创建的表单默认服务于该校学生。\n'
        if school_code and school_email_domain:
            section += f'- 邮箱placeholder：使用 `xxx@{school_email_domain}` 作为示例\n'
            section += f'- 表单标题：可默认加上"{school_code}"前缀（如"{school_code} 2026春季XXX"）\n'
            section += f'- 学校相关字段：默认值或选项优先使用 {school_code} 相关信息\n'
        else:
            section += f'- 邮箱placeholder：可使用通用示例，但提示该校学生填写\n'
            section += f'- 表单标题：可默认加上"{dept_name}"前缀\n'
        section += '- 字段推荐：面向该校学生场景，内容贴合该校实际\n'
    else:
        section += '- 未检测到具体学校信息，使用通用推荐\n'
        section += '- 邮箱placeholder：使用通用示例 `your_name@school.edu`\n'

    return section


def build_form_designer_prompt(user_question: str, designer_context: str = '',
                                supported_types: Optional[List[str]] = None,
                                user_context: Optional[Dict] = None) -> str:
    """
    Build the complete system prompt for the form designer AI assistant.

    Args:
        user_question: The user's original question/request
        designer_context: Additional context from the form designer (current form state, etc.)
        supported_types: Optional list of frontend-supported component types
        user_context: Optional dict with user role/school info for personalization

    Returns:
        Complete system prompt with knowledge base examples
    """
    # Match relevant forms
    matched_forms = match_forms(user_question)
    kb_examples = format_form_examples(matched_forms, supported_types)

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

    # Form styling guidance
    styling_guide = '\n\n## 表单样式与属性推荐（重要）\n'
    styling_guide += '搭建表单时，除了推荐字段，还应该推荐合适的**表单属性和外观设置**，让表单更美观专业。\n'
    styling_guide += '在actions代码块的开头（clear之后、add之前），加入以下属性设置：\n\n'
    styling_guide += '### 必须设置的表单属性\n'
    styling_guide += '- **labelPosition**: 标签位置。推荐 `top`（标签在字段上方，移动端友好）或 `left`（标签在左侧，PC端传统布局）\n'
    styling_guide += '- **labelWidth**: 标签宽度。labelPosition为left时建议 `120`，top时可不设\n'
    styling_guide += '- **size**: 组件尺寸。推荐 `medium`（默认）或 `small`（紧凑型表单）\n\n'
    styling_guide += '### 推荐设置的外观属性\n'
    styling_guide += '- **backgroundColor**: 表单背景色。根据活动主题选择：\n'
    styling_guide += '  - 通用/正式: `#f7f8fa`（浅灰）或 `#ffffff`（白色）\n'
    styling_guide += '  - 节日/欢快: `#fff8f0`（暖橙）、`#f0f7ff`（淡蓝）、`#f6fff0`（淡绿）\n'
    styling_guide += '  - 万圣节: `#1a1a2e`（深紫黑）配合 `#f39c12`（橙色）主题\n'
    styling_guide += '  - 春节/中秋: `#fff5f5`（淡红）或 `#fffbe6`（暖黄）\n'
    styling_guide += '  - 招新/正式: `#f0f5ff`（淡蓝）\n\n'
    styling_guide += '### 多页表单规则\n'
    styling_guide += '- 字段较多（≥12个）时，建议分多页：第1页基础信息，第2页详细信息，第3页确认/声明\n'
    styling_guide += '- 使用addPage和switchPage指令分页\n\n'
    styling_guide += '### FIELDS推荐中的样式提示\n'
    styling_guide += '在FIELDS推荐的JSON中，可以通过props传递样式相关建议：\n'
    styling_guide += '- `"props": {"formProps": {"labelPosition": "top", "backgroundColor": "#f7f8fa"}}`\n'
    styling_guide += '- 这些属性会在搭建时自动应用\n\n'
    styling_guide += '### 活动须知与免责声明（强制规则 — 所有报名表单必须包含）\n'
    styling_guide += '**所有活动报名表单都必须包含活动须知和免责声明**，这不是可选的，是每个表单的标配。\n'
    styling_guide += '即使用户没有明确要求，也必须在FIELDS推荐中自动包含以下两个组件（放在表单最后）：\n\n'
    styling_guide += '1. **desc（说明文本）组件** — 展示活动须知与免责协议的完整内容。\n'
    styling_guide += '   内容**必须根据活动的具体类型和学校情况个性化**，不能千篇一律。基本框架：\n'
    styling_guide += '   - **一、活动须知**：活动时间地点、注意事项、着装要求等（根据活动类型定制）\n'
    styling_guide += '   - **二、安全责任声明**：参与者自愿参加，主办方已采取合理安全措施但不承担意外责任\n'
    styling_guide += '   - **三、肖像/摄影授权**：活动现场拍照/录像可能用于宣传推广\n'
    styling_guide += '   - **四、个人信息保护**：收集的信息仅用于活动管理，不会泄露给第三方\n'
    styling_guide += '   根据活动类型**追加专项条款**：\n'
    styling_guide += '   - 涉及交通/接机：乘车安全、保险责任、航班变动免责\n'
    styling_guide += '   - 涉及食物/聚餐：食物过敏免责、饮酒责任自负\n'
    styling_guide += '   - 户外活动/运动：人身安全自负、建议购买保险\n'
    styling_guide += '   - 竞赛/游戏类：公平竞赛声明、设备损坏责任\n'
    styling_guide += '   - 派对/社交类：行为守则、酒精政策（如适用）\n'
    styling_guide += '   如果已知学校信息，须知中应体现学校名称，如"本活动由Vita Global UCSD分会举办"。主办方统一为**Vita Global (Chinese Union)**，不是CSSA。\n\n'
    styling_guide += '2. **radio（单选确认）组件** — 紧跟在说明文本后面，选项为"我已阅读并同意以上活动须知与免责条款"，设为必填\n\n'
    styling_guide += '示例：\n'
    styling_guide += '```json\n'
    styling_guide += '{"label":"活动须知与免责声明","type":"desc","desc":"展示完整协议文本","checked":true,"props":{"defaultValue":"一、活动须知\\n本活动由Vita Global [学校名]分会举办，活动类型为[活动类型]，时间为XX，地点为XX。请参与者注意以下事项：...\\n\\n二、安全责任声明\\n参与者确认自愿参加本次活动。Vita Global已采取合理安全措施，但对参与过程中因个人原因导致的意外伤害不承担责任。...\\n\\n三、肖像/摄影授权\\n活动期间Vita Global可能进行拍照/录像，用于活动宣传和社交媒体推广。如不同意，请提前告知工作人员。\\n\\n四、个人信息保护\\n报名时收集的个人信息仅用于本次活动组织管理，Vita Global承诺不会将信息泄露给第三方。"}}\n'
    styling_guide += '```\n'
    styling_guide += '然后：\n'
    styling_guide += '```json\n'
    styling_guide += '{"label":"我已阅读并同意以上活动须知与免责条款","type":"radio","checked":true,"props":{"options":"我已阅读并同意","required":true}}\n'
    styling_guide += '```\n'
    styling_guide += '**重要**：desc的defaultValue中的须知内容必须是完整的、具体的、针对该活动定制的文本，不能用"..."省略，要写出真实可用的条款内容。\n\n'

    # Component properties reference
    comp_guide = '\n\n## 组件完整属性参考（FIELDS推荐中的props可用属性）\n'
    comp_guide += '在FIELDS推荐中，每个字段的`props`对象可以包含该组件类型支持的所有属性。\n\n'

    comp_guide += '### 通用属性（所有组件都支持）\n'
    comp_guide += '- `vModel`: 字段名（英文，如name, email, phone）\n'
    comp_guide += '- `required`: 是否必填（true/false）\n'
    comp_guide += '- `disabled`: 是否禁用\n'
    comp_guide += '- `span`: 栅格宽度（1-24，默认24=全宽）\n'
    comp_guide += '- `labelWidth`: 标签宽度（数字，单位px）\n'
    comp_guide += '- `defaultValue`: 默认值\n'
    comp_guide += '- `condition`: 条件显示（见下方详细说明）\n\n'

    comp_guide += '### input（单行文本）专有属性\n'
    comp_guide += '- `placeholder`: 占位提示\n'
    comp_guide += '- `maxlength`: 最大字符数\n'
    comp_guide += '- `show-word-limit`: 是否显示字数统计\n'
    comp_guide += '- `clearable`: 是否可清空\n'
    comp_guide += '- `readonly`: 是否只读\n'
    comp_guide += '- `prepend`: 前缀文本（如"https://"）\n'
    comp_guide += '- `append`: 后缀文本（如".com"）\n'
    comp_guide += '- `prefixIcon`: 前图标（el-icon-*名称）\n'
    comp_guide += '- `suffixIcon`: 后图标（el-icon-*名称）\n'
    comp_guide += '- `regexValidation`: 正则验证\n'
    comp_guide += '- `regexMessage`: 验证失败提示\n\n'

    comp_guide += '### textarea（多行文本）专有属性\n'
    comp_guide += '- `placeholder`, `maxlength`, `show-word-limit`, `readonly`, `disabled`\n'
    comp_guide += '- `autosize`: 自适应高度，如 `{"minRows":4,"maxRows":8}`\n'
    comp_guide += '- `rows`: 固定行数\n\n'

    comp_guide += '### phone（手机号）— 自带手机正则验证和el-icon-phone图标\n'
    comp_guide += '### email（邮箱）— 自带邮箱正则验证和el-icon-message图标\n'
    comp_guide += '### password（密码）— 自带密码遮挡\n'
    comp_guide += '### number（计数器）专有属性\n'
    comp_guide += '- `min`, `max`, `step`: 数值范围和步长\n'
    comp_guide += '- `step-strictly`: 是否只能输入步长的倍数\n'
    comp_guide += '- `controls-position`: 控制按钮位置（""或"right"）\n\n'

    comp_guide += '### select（下拉选择）专有属性\n'
    comp_guide += '- `options`: 选项数组，如 "选项一,选项二" 或 [{"label":"选项一","value":1}]\n'
    comp_guide += '- `multiple`: 是否多选\n'
    comp_guide += '- `filterable`: 是否可搜索\n'
    comp_guide += '- `clearable`: 是否可清空\n\n'

    comp_guide += '### radio（单选框组）专有属性\n'
    comp_guide += '- `options`: 选项数组\n'
    comp_guide += '- `optionType`: "default"或"button"（按钮样式）\n'
    comp_guide += '- `border`: 是否带边框\n'
    comp_guide += '- `size`: 尺寸（medium/small/mini）\n\n'

    comp_guide += '### checkbox（多选框组）— 属性同radio\n\n'

    comp_guide += '### switch（开关）专有属性\n'
    comp_guide += '- `activeText`, `inactiveText`: 开/关文字\n'
    comp_guide += '- `activeColor`, `inactiveColor`: 开/关颜色\n'
    comp_guide += '- `activeValue`, `inactiveValue`: 开/关值\n\n'

    comp_guide += '### slider（滑块）专有属性\n'
    comp_guide += '- `min`, `max`, `step`: 范围和步长\n'
    comp_guide += '- `show-stops`: 是否显示间断点\n'
    comp_guide += '- `range`: 是否范围选择\n\n'

    comp_guide += '### date（日期选择）专有属性\n'
    comp_guide += '- `format`: 显示格式（如"yyyy-MM-dd"）\n'
    comp_guide += '- `value-format`: 值格式\n'
    comp_guide += '- `readonly`: 是否只读\n\n'

    comp_guide += '### date-range（日期范围）专有属性\n'
    comp_guide += '- `rangeSeparator`: 分隔符（默认"至"）\n'
    comp_guide += '- `startPlaceholder`, `endPlaceholder`: 起止占位文本\n'
    comp_guide += '- `format`, `value-format`\n\n'

    comp_guide += '### time / time-range — 属性类似date/date-range\n\n'

    comp_guide += '### rate（评分）专有属性\n'
    comp_guide += '- `max`: 最大星数（默认5）\n'
    comp_guide += '- `allowHalf`: 是否允许半星\n'
    comp_guide += '- `showText`: 是否显示文字\n'
    comp_guide += '- `showScore`: 是否显示分数\n\n'

    comp_guide += '### upload（上传）专有属性\n'
    comp_guide += '- `accept`: 接受文件类型（"image/*", "video/*", ".pdf,.doc"等）\n'
    comp_guide += '- `buttonText`: 上传按钮文字\n'
    comp_guide += '- `fileSize`: 文件大小限制（数字）\n'
    comp_guide += '- `sizeUnit`: 大小单位（"MB"或"KB"）\n'
    comp_guide += '- `listType`: 列表类型（"text","picture","picture-card"）\n'
    comp_guide += '- `multiple`: 是否多文件上传\n'
    comp_guide += '- `showTip`: 是否显示提示\n\n'

    comp_guide += '### color（颜色选择）: `showAlpha`（透明度）, `colorFormat`\n'
    comp_guide += '### edit（电子签名）— 属性同upload\n'
    comp_guide += '### cascader（级联选择）专有属性\n'
    comp_guide += '- `showAllLevels`: 是否显示完整路径\n'
    comp_guide += '- `separator`: 分隔符（默认"/"）\n'
    comp_guide += '- `filterable`: 是否可搜索\n'
    comp_guide += '- `props`: 嵌套配置对象，如 `{"multiple":true,"checkStrictly":true}`\n'
    comp_guide += '  - `props.multiple`: 是否多选\n'
    comp_guide += '  - `props.checkStrictly`: 父子是否不互相关联\n\n'

    comp_guide += '### row（行容器）— 布局组件\n'
    comp_guide += '行容器可将多个字段放在同一行显示。\n\n'
    comp_guide += '**在FIELDS推荐中使用行容器**：\n'
    comp_guide += '```json\n'
    comp_guide += '{"label":"行容器","type":"row","desc":"姓名和性别同行","checked":true,"props":{"gutter":15},"children":[\n'
    comp_guide += '  {"label":"姓名","type":"input","desc":"","checked":true,"props":{"vModel":"name","span":14}},\n'
    comp_guide += '  {"label":"性别","type":"radio","desc":"","checked":true,"props":{"vModel":"gender","span":10,"options":"男,女"}}\n'
    comp_guide += ']}\n'
    comp_guide += '```\n'
    comp_guide += 'children内的字段用span控制宽度（总和≤24），如span:14+span:10=24占满一行。\n\n'
    comp_guide += '**典型场景**: 姓名+性别同行(span:14+10)、日期+时间同行(span:12+12)、城市+邮编同行(span:16+8)\n'
    comp_guide += '**重要**: 当用户要求"同一行显示"/"并排"/"同行"时，**必须**使用type:"row"的嵌套children结构。\n'
    comp_guide += '行容器属性: `type`("default"/"flex"), `justify`("start"/"center"/"end"/"space-between"), `align`("top"/"middle"/"bottom"), `gutter`(列间距)\n\n'

    # Condition documentation
    comp_guide += '### 条件显示（condition）— 重要功能\n'
    comp_guide += '可以让某个字段仅在另一个字段满足特定条件时才显示。\n'
    comp_guide += '在props中设置：\n'
    comp_guide += '```json\n'
    comp_guide += '"condition": {\n'
    comp_guide += '  "field": "依赖字段的vModel名",\n'
    comp_guide += '  "operator": "===",\n'
    comp_guide += '  "value": "触发显示的值"\n'
    comp_guide += '}\n'
    comp_guide += '```\n'
    comp_guide += '支持的operator: `===`（等于）, `!==`（不等于）, `>`（大于）, `<`（小于）, `>=`, `<=`\n'
    comp_guide += '**典型用法**：\n'
    comp_guide += '- "是否携带同伴"(vModel:bringCompanion) 选"是"(value:2) → 显示"同伴姓名"(condition: {field:"bringCompanion",operator:"===",value:"2"})\n'
    comp_guide += '- "身份类型"选"学生" → 显示"学号"\n'
    comp_guide += '- "是否有过敏史"选"是" → 显示"过敏详情"\n'
    comp_guide += '**必须使用条件显示的场景**: 当推荐了有逻辑依赖关系的字段时，**一定要**在被依赖字段的props中设置condition。\n\n'

    # Icon reference
    comp_guide += '### 图标参考（prefix-icon / suffix-icon）\n'
    comp_guide += '为input类字段添加图标可以提升表单的专业感和可读性。推荐使用的图标：\n'
    comp_guide += '- 姓名: `el-icon-user`\n'
    comp_guide += '- 邮箱: `el-icon-message`（email类型自带）\n'
    comp_guide += '- 手机: `el-icon-phone`（phone类型自带）\n'
    comp_guide += '- 微信/社交: `el-icon-chat-dot-round`\n'
    comp_guide += '- 学校/教育: `el-icon-school` 或 `el-icon-reading`\n'
    comp_guide += '- 地址/位置: `el-icon-location`\n'
    comp_guide += '- 日历/日期: `el-icon-date`\n'
    comp_guide += '- 链接/网址: `el-icon-link`\n'
    comp_guide += '- 搜索: `el-icon-search`\n'
    comp_guide += '- 编辑/备注: `el-icon-edit`\n'
    comp_guide += '- 文档: `el-icon-document`\n'
    comp_guide += '- 星标/收藏: `el-icon-star-off`\n'
    comp_guide += '- 设置: `el-icon-setting`\n'
    comp_guide += '- 票务: `el-icon-tickets`\n'
    comp_guide += '- 专业/工作: `el-icon-suitcase`\n'
    comp_guide += '- 性别: `el-icon-male` / `el-icon-female`\n'
    comp_guide += '推荐为**input类型字段**（单行文本、密码等）添加`prefixIcon`属性，提升视觉体验。\n\n'

    # User identity context for personalized recommendations
    user_section = _build_user_context_section(user_context)

    return kb_examples + match_hint + kb_stats + styling_guide + comp_guide + user_section + ('\n\n' + designer_context if designer_context else '')


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
