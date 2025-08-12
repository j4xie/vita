# VitaGlobal 国际化实施方案

## 📋 实施概述

基于您的建议，我们将从项目开始就设计多语言支持，避免后期本地化的困难。本方案提供了完整的国际化实施路径。

## 🎯 语言支持策略

### 第一阶段 (MVP) - 双语基础
- **主语言:** 简体中文 (zh-CN) - 核心用户群体
- **辅助语言:** 英语 (en-US) - 国际化基础
- **技术语言:** 英语 - 代码、API、数据库

### 第二阶段 (V2) - 完善本地化
- 完善英文内容翻译
- 优化双语用户体验
- 添加语言切换功能

### 第三阶段 (V3) - 扩展支持
- 繁体中文 (zh-TW) - 港台用户
- 韩语 (ko-KR) - 亚洲市场扩展

## 🏗 技术架构设计

### 前端架构 (iOS + SwiftUI)

#### 1. 本地化文件结构
```
/VitaGlobal
  /Resources
    /Localizations
      /zh-Hans.lproj          # 简体中文
        Localizable.strings
        InfoPlist.strings
        Localizable.stringsdict # 复数形式
      /en.lproj               # 英语
        Localizable.strings
        InfoPlist.strings
        Localizable.stringsdict
```

#### 2. 字符串管理示例
```swift
// Localizable.strings (zh-Hans)
"auth.login.title" = "登录";
"auth.login.email.placeholder" = "请输入邮箱";
"auth.login.password.placeholder" = "请输入密码";
"auth.login.button" = "登录";
"auth.register.title" = "注册";

// Localizable.strings (en)
"auth.login.title" = "Login";
"auth.login.email.placeholder" = "Enter email";
"auth.login.password.placeholder" = "Enter password";
"auth.login.button" = "Login";
"auth.register.title" = "Register";
```

#### 3. SwiftUI 使用示例
```swift
struct LoginView: View {
    var body: some View {
        VStack {
            Text("auth.login.title")
                .font(.largeTitle)
            
            TextField("auth.login.email.placeholder", text: $email)
            SecureField("auth.login.password.placeholder", text: $password)
            
            Button("auth.login.button") {
                // 登录逻辑
            }
        }
    }
}
```

### 后端架构 (FastAPI + Python)

#### 1. 多语言消息管理
```python
# messages.py
MESSAGES = {
    "zh-CN": {
        "auth.invalid_email": "邮箱格式不正确",
        "auth.user_not_found": "用户不存在",
        "auth.invalid_password": "密码错误",
        "emergency.report_created": "紧急联系请求已创建",
    },
    "en-US": {
        "auth.invalid_email": "Invalid email format",
        "auth.user_not_found": "User not found",
        "auth.invalid_password": "Invalid password",
        "emergency.report_created": "Emergency report created",
    }
}

def get_message(key: str, lang: str = "zh-CN") -> str:
    return MESSAGES.get(lang, MESSAGES["zh-CN"]).get(key, key)
```

#### 2. API 响应本地化
```python
# utils/response.py
from fastapi import Request

def get_user_language(request: Request) -> str:
    accept_language = request.headers.get("Accept-Language", "zh-CN")
    # 解析 Accept-Language 头
    if "en" in accept_language:
        return "en-US"
    return "zh-CN"

def create_error_response(code: str, message_key: str, request: Request):
    lang = get_user_language(request)
    return {
        "error": {
            "code": code,
            "message": get_message(message_key, "zh-CN"),
            "message_en": get_message(message_key, "en-US"),
            "language": lang
        }
    }
```

### 数据库设计 (PostgreSQL)

#### 1. 多语言内容表设计
```sql
-- 文章表支持多语言
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 中文内容（主要）
    title_zh VARCHAR(500) NOT NULL,
    content_zh TEXT NOT NULL,
    summary_zh TEXT,
    -- 英文内容（可选）
    title_en VARCHAR(500),
    content_en TEXT,
    summary_en TEXT,
    -- 元数据
    category VARCHAR(50) NOT NULL,
    author_id UUID,
    is_published BOOLEAN DEFAULT FALSE,
    primary_language VARCHAR(10) DEFAULT 'zh-CN',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 通用翻译表
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL, -- 'category', 'tag', 'system_message'
    resource_key VARCHAR(100) NOT NULL, -- 资源标识符
    language_code VARCHAR(10) NOT NULL, -- 语言代码
    translated_text TEXT NOT NULL,      -- 翻译文本
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(resource_type, resource_key, language_code)
);

-- 插入示例数据
INSERT INTO translations (resource_type, resource_key, language_code, translated_text) VALUES
('category', 'visa', 'zh-CN', '签证申请'),
('category', 'visa', 'en-US', 'Visa Application'),
('category', 'housing', 'zh-CN', '住房租赁'),
('category', 'housing', 'en-US', 'Housing & Rental');
```

## 🤖 AI 问答多语言支持

### 智能语言检测
```python
import langdetect

def detect_question_language(question: str) -> str:
    try:
        detected = langdetect.detect(question)
        if detected == 'zh-cn':
            return 'zh-CN'
        elif detected == 'en':
            return 'en-US'
        else:
            return 'zh-CN'  # 默认中文
    except:
        return 'zh-CN'

def generate_ai_response(question: str, user_preference: str = None):
    # 检测问题语言
    detected_lang = detect_question_language(question)
    
    # 用户偏好优先
    response_lang = user_preference or detected_lang
    
    if response_lang == 'en-US':
        prompt = f"Please answer in English: {question}"
        knowledge_base = load_english_knowledge()
    else:
        prompt = f"请用中文回答: {question}"
        knowledge_base = load_chinese_knowledge()
    
    response = ai_model.generate(prompt, context=knowledge_base)
    
    return {
        "answer": response,
        "language": response_lang,
        "detected_language": detected_lang
    }
```

## 📱 用户体验设计

### 语言切换功能
- **自动检测:** 根据设备语言自动选择
- **手动切换:** 设置页面提供语言选择
- **记忆偏好:** 保存用户语言偏好

### UI 适配考虑
- **文本长度:** 英文通常比中文长 20-30%
- **布局弹性:** 使用自适应布局
- **字体选择:** 中英文字体分别优化

## 📝 内容管理策略

### 翻译工作流程
1. **核心内容:** 专业翻译服务
2. **一般内容:** AI 翻译 + 人工校对
3. **用户生成内容:** 可选翻译

### 内容优先级
- **高优先级:** 安全信息、法律条款、重要通知
- **中优先级:** 功能说明、帮助文档
- **低优先级:** 社区内容、非核心文章

## 🚀 实施时间表

### Phase 1 (MVP开发期间)
- [x] 设置基础国际化架构
- [x] 创建双语字符串文件结构
- [ ] 实现API多语言响应
- [ ] 设计数据库多语言表结构

### Phase 2 (MVP后)
- [ ] 完善英文内容翻译
- [ ] 添加语言切换功能
- [ ] 优化AI问答多语言支持
- [ ] 用户测试和反馈收集

### Phase 3 (V2开发期间)
- [ ] 扩展更多语言支持
- [ ] 优化翻译质量
- [ ] 建立翻译管理系统

## 💡 最佳实践建议

### 开发规范
- 所有用户可见文本都通过本地化文件管理
- 使用有意义的 key 命名约定
- 代码中不硬编码任何显示文本
- 定期检查遗漏的本地化字符串

### 质量保证
- 建立翻译审核流程
- 不同语言环境下的功能测试
- 收集多语言用户反馈
- 定期更新和维护翻译内容

这个方案确保了从项目开始就考虑国际化，避免了后期重构的痛苦，同时保持了中文优先的产品策略。
