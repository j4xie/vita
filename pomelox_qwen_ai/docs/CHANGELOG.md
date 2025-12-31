# 更新日志

> 本文档记录 pomelox_qwen_ai AI对话模块的所有重要更新和变更

## 📑 版本索引

- [v2.0.0 - MySQL数据库集成 (2025-12-30)](#v200---mysql数据库集成-2025-12-30) 🆕
- [v1.1.0 - 反馈系统与自动知识库扩展 (2024-12-28)](#v110---反馈系统与自动知识库扩展-2024-12-28)
- [v1.0.0 - RAG检索与联网搜索集成 (2024-12-14)](#v100---rag检索与联网搜索集成-2024-12-14)

---

## v2.0.0 - MySQL数据库集成 (2025-12-30)

### 🎯 核心更新
将AI对话模块完整集成到vita主项目数据库,实现用户关联、会话管理和数据持久化。

### ✨ 新增功能

#### 1. 数据库表结构
新增4张MySQL表,实现完整的用户对话和知识管理:

**ai_chat_session** - AI聊天会话表
- 记录每个用户的对话会话
- 支持会话标题和软删除
- 外键关联 `sys_user` 和 `sys_dept`

**ai_chat_message** - AI聊天消息表
- 记录会话中的所有消息(用户+AI)
- 保存RAG检索分数和来源类型
- 支持消息级别的查询和分析

**ai_feedback** - AI反馈表
- 收集用户对AI回答的评价
- 记录反馈置信度分数
- 支持审核工作流

**ai_knowledge_base** - AI知识库表
- 统一管理知识条目
- 支持归档状态标记(indexed: 0未归档/1已归档)
- 区分知识来源(user_feedback/manual/import)

#### 2. API接口扩展

**修改的接口:**
- `POST /ask` - 新增用户关联和数据库持久化
  - 新增必需参数: `userId`, `deptId`
  - 自动保存会话和消息到数据库
  - 返回 `session_id` 和 `message_id`

**新增的接口:**
- `GET /api/ai/sessions` - 获取用户会话列表
- `GET /api/ai/session/<id>/messages` - 获取会话消息详情
- `DELETE /api/ai/session/<id>` - 删除用户会话(软删除)

#### 3. 混合检索架构
实现向量库+数据库的混合检索:
- **向量索引检索**: 已归档知识(`indexed='1'`) - 高性能
- **数据库检索**: 未归档知识(`indexed='0'`) - 实时可用
- 两路结果合并后按分数排序

#### 4. 增量向量化归档
完整的知识归档流程:
```bash
python scripts/archive_to_vector.py --dept 216
```
- 查询数据库中未归档知识(`indexed='0'`)
- 转换为LlamaIndex文档格式
- 增量更新向量索引(不重建)
- 更新数据库标记(`indexed='1'`)

#### 5. 用户隔离机制
- 按 `user_id` 隔离对话记录
- 按 `dept_id` 隔离知识库和向量索引
- 外键约束确保数据完整性

### 📂 新增文件

**数据库层:**
- `database/mysql_impl.py` - MySQL数据库实现
- `database/schema.sql` - 数据库表结构SQL
- 新增方法:
  - `create_chat_session()` - 创建聊天会话
  - `get_user_chat_sessions()` - 获取用户会话列表
  - `save_chat_message()` - 保存聊天消息
  - `get_chat_messages()` - 获取会话消息
  - `delete_chat_session()` - 删除会话(软删除)
  - `update_knowledge()` - 更新知识库条目

**脚本工具:**
- `scripts/create_tables.py` - 数据库表初始化脚本
- `scripts/import_knowledge_from_excel.py` - Excel批量导入知识
- `scripts/migrate_vector_directories.py` - 向量目录迁移工具

**文档:**
- `docs/UPDATE_20251230.md` - 本次更新详细文档
- `docs/MYSQL_SSH_GUIDE.md` - MySQL SSH连接配置指南

### 🔧 修改文件

**app.py:**
- 添加数据库保存逻辑到 `/ask` 接口
- 生成并返回 `message_id`
- 新增3个会话管理API路由
- 集成用户登录验证

**config.py:**
- 新增 `DEPT_TO_SCHOOL` 映射配置
- dept_id 到 school_id 的转换逻辑

**database/interface.py:**
- 扩展抽象接口,新增会话管理方法

**models/feedback.py & models/knowledge.py:**
- 添加 `user_id` 和 `dept_id` 字段

### 📊 完整用户流程

```
用户登录 → 前端获取 userId + deptId
    ↓
AI对话: POST /ask {userId, deptId, question}
    ↓
保存到数据库:
  - ai_chat_session (会话)
  - ai_chat_message (用户消息 + AI回复)
    ↓
RAG混合检索:
  - 向量索引: indexed='1'
  - 数据库: indexed='0'
    ↓
用户反馈 → ai_feedback表
    ↓
计算置信度 ≥ 0.8
    ↓
自动入库: ai_knowledge_base (indexed='0')
    ↓
定时任务: archive_to_vector.py
    ↓
向量化归档:
  - 增量更新向量索引
  - 保存到 vector_store/{dept_id}/
  - 更新数据库 indexed='1'
    ↓
下次检索: 从向量库快速检索 ✅
```

### 🧪 测试验证

**端到端测试 (2025-12-30):**
1. ✅ 创建测试知识到数据库(indexed=0)
2. ✅ 运行归档脚本
3. ✅ 向量文件实际更新(时间戳+文件大小变化)
   - `default__vector_store.json`: 102K → 238K (+136K)
   - `docstore.json`: 15K → 22K (+7K)
4. ✅ 数据库状态更新(indexed=0 → indexed=1)
5. ✅ 从向量库成功检索到归档的知识
   - RAG分数: 0.748 (高质量)
   - 混合检索: 向量5条, 数据库0条

### ⚙️ 数据库配置

**.env 配置:**
```env
# 数据库类型
DATABASE_TYPE=mysql

# MySQL配置
MYSQL_DATABASE=inter_stu_center
MYSQL_HOST=106.14.165.234
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_PORT=3306

# SSH隧道(生产环境)
SSH_HOST=106.14.165.234
SSH_USERNAME=root
SSH_PRIVATE_KEY_PATH=C:\Users\username\.ssh\id_rsa
```

**初始化数据库:**
```bash
python scripts/create_tables.py
```

### 🏢 部门ID配置

| dept_id | 学校名称 | 英文缩写 |
|---------|---------|---------|
| 211 | 加州大学伯克利分校 | UC Berkeley |
| 213 | 南加州大学 | USC |
| 214 | 加州大学洛杉矶分校 | UCLA |
| 216 | 加州大学圣地亚哥分校 | UCSD |
| 218 | 华盛顿大学 | UW |
| 226 | 纽约大学 | NYU |

### ⚠️ 已知问题

1. **归档脚本Unicode编码问题**
   - 问题: 打印emoji时在Windows GBK环境下会报错
   - 影响: 脚本可能在更新数据库前崩溃
   - 临时方案: 手动更新数据库状态
   - 计划修复: 移除emoji或设置UTF-8编码

### 📈 性能指标

| 指标 | 测试结果 | 说明 |
|------|---------|------|
| API响应时间 | < 2秒 | 包含RAG检索和AI生成 |
| 数据库写入 | < 100ms | 会话+消息保存 |
| 向量检索 | < 500ms | 加载索引+检索 |
| 归档脚本 | ~3秒/条 | 包含向量化和索引更新 |
| 向量库大小 | ~2MB | 部门216, 包含数百条知识 |

### 🚀 升级指南

**从 v1.1.0 升级到 v2.0.0:**

1. 创建数据库表:
   ```bash
   python scripts/create_tables.py
   ```

2. 配置环境变量(`.env`):
   ```env
   DATABASE_TYPE=mysql
   MYSQL_DATABASE=inter_stu_center
   # ... 其他MySQL配置
   ```

3. 前端调用 `/ask` 接口时添加参数:
   ```javascript
   {
     question: "用户问题",
     userId: 1,        // 必需
     deptId: 216       // 必需
   }
   ```

4. (可选)配置定时归档任务:
   ```bash
   # Linux crontab
   0 2 * * * cd /path/to/pomelox_qwen_ai && python scripts/archive_to_vector.py
   ```

---

## v1.1.0 - 反馈系统与自动知识库扩展 (2024-12-28)

### 🎯 核心功能
用户反馈驱动的智能知识库自动扩展系统

### ✨ 新增功能

#### 1. 用户反馈收集
- 👍/👎 评价系统
- 支持用户评论
- 记录反馈来源(知识库/联网搜索)
- 记录RAG相关性分数

#### 2. 智能置信度计算
自动评估反馈质量,基于以下因素:
- **RAG分数低**(<0.5): 说明知识库存在缺口 → +0.3
- **相似问题多**(≥3个): 说明是高频问题 → +0.3
- **答案质量高**(长度适中): 100-2000字符 → +0.2
- **来源为联网搜索**: 说明知识库未覆盖 → +0.2

#### 3. 三级审核机制
- **置信度 ≥ 0.8**: 自动入库(auto_approved)
- **置信度 0.5-0.8**: 待人工审核(pending)
- **置信度 < 0.5**: 仅记录(recorded)

#### 4. 向量相似度去重
- 使用DashScope Embedding(1536维向量)
- 余弦相似度阈值: 0.85
- 防止重复问题入库

#### 5. 定时归档任务
- 每日自动将数据库新知识归档到向量库
- 支持 `--dry-run` 预览模式
- 支持 `--school` 指定学校

### 📂 新增文件

**数据模型层:**
- `models/feedback.py` - 反馈记录模型
- `models/knowledge.py` - 知识库条目模型

**数据库层:**
- `database/interface.py` - 数据库抽象接口
- `database/json_impl.py` - JSON文件实现(开发用)

**业务逻辑层:**
- `services/confidence_calculator.py` - 置信度计算
- `services/vector_similarity.py` - 向量相似度检测
- `services/feedback_service.py` - 反馈处理核心逻辑
- `services/knowledge_service.py` - 知识库管理

**API路由:**
- `core/app_feedback_routes.py` - 反馈系统API端点

**脚本工具:**
- `scripts/init_database.py` - 数据库初始化
- `scripts/archive_to_vector.py` - 归档任务脚本

### ⚙️ 配置项

```python
# 数据库配置
DATABASE_TYPE = 'json'  # 开发: 'json', 生产: 'mysql'

# 置信度阈值
CONFIDENCE_THRESHOLD_AUTO = 0.8      # 自动入库
CONFIDENCE_THRESHOLD_REVIEW = 0.5    # 人工审核

# 相似问题检测
SIMILAR_QUESTION_THRESHOLD = 0.85    # 向量相似度阈值
SIMILAR_QUESTION_DAYS = 30           # 查询最近N天

# 归档配置
ARCHIVE_ENABLED = True
ARCHIVE_DELETE_AFTER_INDEX = False   # False=标记, True=删除
```

---

## v1.0.0 - RAG检索与联网搜索集成 (2024-12-14)

### 🎯 核心功能
智能RAG检索 + 联网搜索fallback机制

### ✨ 新增功能

#### 1. RAG检索系统
- 基于llama-index的向量检索
- DashScope Embedding(text-embedding-v2)
- 学校隔离的知识库
- 相似度评分与质量判断

#### 2. 联网搜索Fallback
当RAG检索质量不足时:
- 自动启用Qwen联网搜索
- 支持两种搜索策略:
  - `standard`: 标准搜索
  - `pro`: 专业深度搜索
- 返回搜索来源和引用

#### 3. deptId自动匹配
- 通过部门ID自动匹配学校
- 无需前端传递school_id
- 配置化映射关系

#### 4. 质量阈值控制
```python
RAG_RETRIEVAL_TOP_K = 3              # 检索Top-K
RAG_SIMILARITY_THRESHOLD = 0.3       # 相关性阈值
RAG_HIGH_QUALITY_THRESHOLD = 0.7     # 高质量阈值
```

### 📂 新增文件
- `core/rag_service.py` - RAG检索服务
- `scripts/build_knowledge_base.py` - 知识库构建工具

### 📋 知识库构建

```bash
# 构建单个学校
python scripts/build_knowledge_base.py build UCSD data/ucsd_docs/

# 重建知识库
python scripts/build_knowledge_base.py rebuild UCSD data/ucsd_docs/

# 列出所有学校
python scripts/build_knowledge_base.py list
```

### ⚙️ 配置项

```python
# RAG配置
ENABLE_RAG = True
VECTOR_STORE_PATH = "./vector_store"
RAG_RETRIEVAL_TOP_K = 3
RAG_SIMILARITY_THRESHOLD = 0.3
RAG_HIGH_QUALITY_THRESHOLD = 0.7

# 联网搜索配置
ENABLE_WEB_SEARCH_FALLBACK = True
WEB_SEARCH_STRATEGY = "standard"  # 或 "pro"

# 学校配置
SCHOOLS = {
    'UCI': {'name': '加州大学尔湾分校', 'dept_ids': [211]},
    'UCSD': {'name': '加州大学圣地亚哥分校', 'dept_ids': [216]}
}

DEPT_TO_SCHOOL = {
    211: 'UCI',
    216: 'UCSD'
}
```

---

## 项目架构

### 目录结构

```
pomelox_qwen_ai/
├── app.py                     # Flask主应用
├── config.py                  # 全局配置
├── requirements.txt           # 依赖列表
│
├── core/                      # 核心业务模块
│   ├── rag_service.py        # RAG检索服务
│   └── app_feedback_routes.py # 反馈API
│
├── models/                    # 数据模型
│   ├── feedback.py
│   └── knowledge.py
│
├── database/                  # 数据库层
│   ├── interface.py          # 抽象接口
│   ├── json_impl.py          # JSON实现
│   ├── mysql_impl.py         # MySQL实现
│   ├── schema.sql            # 表结构
│   └── __init__.py
│
├── services/                  # 业务逻辑
│   ├── confidence_calculator.py
│   ├── vector_similarity.py
│   ├── feedback_service.py
│   └── knowledge_service.py
│
├── scripts/                   # 工具脚本
│   ├── build_knowledge_base.py
│   ├── create_tables.py
│   ├── archive_to_vector.py
│   └── import_knowledge_from_excel.py
│
├── docs/                      # 文档
│   ├── API.md                # API接口文档
│   ├── CHANGELOG.md          # 本文件
│   ├── MYSQL_SSH_GUIDE.md    # MySQL配置指南
│   └── UPDATE_20251230.md    # v2.0.0详细文档
│
├── data/                      # 数据文件
│   ├── chat_history.json
│   ├── ai_feedback.json
│   └── ai_knowledge_base.json
│
├── tests/                     # 测试
│   └── test_integration.py
│
└── vector_store/              # 向量索引存储
    ├── 211/                  # UC Berkeley
    ├── 213/                  # USC
    ├── 214/                  # UCLA
    ├── 216/                  # UCSD
    ├── 218/                  # UW
    └── 226/                  # NYU
```

---

## 开发路线图

### ✅ 已完成
- [x] RAG向量检索系统 (v1.0.0)
- [x] 联网搜索fallback (v1.0.0)
- [x] 用户反馈收集 (v1.1.0)
- [x] 智能置信度计算 (v1.1.0)
- [x] 自动/人工审核机制 (v1.1.0)
- [x] 定时归档任务 (v1.1.0)
- [x] MySQL数据库集成 (v2.0.0)
- [x] 用户会话管理 (v2.0.0)
- [x] 混合检索架构 (v2.0.0)
- [x] 增量向量化归档 (v2.0.0)

### 🔄 进行中
- [ ] 归档脚本Unicode编码修复
- [ ] 完善错误处理和日志

### 📅 计划中
- [ ] 前端反馈UI组件
- [ ] 知识库管理后台
- [ ] 高级分析仪表板
- [ ] 多语言支持
- [ ] 性能优化和缓存

---

## 技术栈

- **Web框架**: Flask 3.1.2
- **AI模型**: Qwen(通义千问) via DashScope
- **向量数据库**: llama-index + 本地文件存储
- **Embedding**: DashScope text-embedding-v2 (1536维)
- **数据存储**: MySQL (生产) / JSON文件 (开发)
- **相似度计算**: NumPy + 余弦相似度
- **SSH隧道**: sshtunnel (生产环境)

---

## 许可证

本模块为vita项目的一部分,内部使用,保留所有权利。
