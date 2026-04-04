# Pomelox Qwen AI - 智能问答系统

基于通义千问(Qwen)和RAG技术的多学校智能问答系统。

## 📁 项目结构

```
pomelox_qwen_ai/
├── app.py                          # Flask主应用入口
├── config.py                       # 全局配置
├── requirements.txt                # Python依赖
├── .env                           # 环境变量配置(不提交到git)
├── .env.example                   # 环境变量示例
│
├── core/                          # 核心业务逻辑
│   ├── rag_service.py            # RAG检索服务(混合检索:向量+数据库)
│   ├── app_feedback_routes.py    # 用户反馈API路由
│   └── app_knowledge_routes.py   # 知识库管理API路由
│
├── database/                      # 数据库层
│   ├── __init__.py               # 数据库工厂
│   ├── interface.py              # 数据库抽象接口
│   ├── mysql_impl.py             # MySQL实现(生产环境)
│   ├── json_impl.py              # JSON文件实现(测试/开发)
│   └── schema_inter_stu_center.sql  # 数据库表结构
│
├── models/                        # 数据模型
│   ├── feedback.py               # 反馈记录模型
│   └── knowledge.py              # 知识库条目模型
│
├── scripts/                       # 工具脚本
│   ├── create_tables.py          # 创建数据库表
│   ├── archive_to_vector.py      # 知识库向量化归档
│   ├── migrate_vector_directories.py  # 向量目录迁移工具
│   ├── import_knowledge_from_excel.py # Excel批量导入
│   └── knowledge_import_template.md   # Excel导入说明
│
├── tests/                         # 测试文件
│   ├── test_integration.py       # 集成测试(数据库+RAG)
│   └── test_vector_migration.py  # 向量迁移测试
│
├── docs/                          # 文档
│   └── reports/                  # 测试报告
│       └── TEST_REPORT.md        # dept_id对齐测试报告
│
├── vector_store/                  # 向量索引存储
│   ├── 211/                      # UC Berkeley向量库
│   ├── 213/                      # USC向量库
│   ├── 214/                      # UCLA向量库
│   ├── 216/                      # UCSD向量库
│   ├── 218/                      # UW向量库
│   └── 226/                      # NYU向量库
│
├── data/                          # 数据文件
│   ├── chat_history.json         # 聊天历史(JSON备份)
│   └── feedback.json             # 反馈记录(JSON备份)
│
└── logs/                          # 日志文件
```

## 🎯 核心功能

### 1. 智能问答
- **混合检索**: 向量索引 + 数据库未归档知识
- **多部门支持**: 6所学校独立知识库和向量索引
- **用户关联**: 对话和反馈关联到具体用户
- **会话管理**: 持久化聊天历史

### 2. 知识库管理
- **来源多样**: 用户反馈、人工录入、Excel导入
- **质量评分**: 置信度计算,自动筛选高质量知识
- **增量归档**: 定期向量化新知识,无需重建索引
- **分类管理**: 按部门和类别组织知识

### 3. 用户反馈系统
- **双向反馈**: 点赞/点踩
- **自动入库**: 高置信度反馈自动加入知识库
- **人工审核**: 低置信度反馈进入待审核队列

## 🚀 快速开始

### 环境准备

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env
# 编辑.env,填入数据库连接信息和API密钥
```

### 数据库初始化

```bash
# 创建AI模块表
python scripts/create_tables.py
```

### 启动服务

```bash
# 开发模式
python app.py

# 生产模式(使用gunicorn)
gunicorn -w 4 -b 0.0.0.0:8087 app:app
```

## 📊 部门配置

当前支持6所学校,对应数据库`sys_dept`表:

| dept_id | 学校名称 | 英文缩写 |
|---------|---------|---------|
| 211 | 加州大学伯克利分校 | UC Berkeley |
| 213 | 南加州大学 | USC |
| 214 | 加州大学洛杉矶分校 | UCLA |
| 216 | 加州大学圣地亚哥分校 | UCSD |
| 218 | 华盛顿大学 | UW |
| 226 | 纽约大学 | NYU |

**配置文件**: [config.py](config.py) 中的 `DEPARTMENTS` 字典

## 📝 常用操作

### 添加新知识

**方式1: Excel批量导入(推荐)**

```bash
# 预览导入
python scripts/import_knowledge_from_excel.py \
    --file UCSD新知识.xlsx \
    --dept 216 \
    --dry-run

# 正式导入并归档
python scripts/import_knowledge_from_excel.py \
    --file UCSD新知识.xlsx \
    --dept 216 \
    --archive
```

**方式2: 直接插入数据库**

```sql
INSERT INTO ai_knowledge_base
(kb_id, question, answer, dept_id, category, source, quality_score, enabled, indexed)
VALUES
('kb_001', '问题', '答案', 216, '分类', 'manual', 0.9, '1', '0');
```

然后运行归档脚本:
```bash
python scripts/archive_to_vector.py --dept 216
```

### 向量化知识库

```bash
# 归档指定部门
python scripts/archive_to_vector.py --dept 216

# 归档所有部门
python scripts/archive_to_vector.py

# 预览模式(不实际执行)
python scripts/archive_to_vector.py --dept 216 --dry-run
```

### 运行测试

```bash
# 完整集成测试
python tests/test_integration.py

# 向量检索测试
python tests/test_vector_migration.py
```

## 🔧 API接口

### 聊天接口

```http
POST /ask
Content-Type: application/json

{
  "question": "如何申请宿舍?",
  "userId": 1,
  "deptId": 216,
  "session_id": "uuid-optional"
}
```

### 用户反馈

```http
POST /app/ai/feedback
Content-Type: application/json

{
  "sessionId": "session-uuid",
  "messageId": "message-uuid",
  "question": "如何申请宿舍?",
  "answer": "请访问housing portal...",
  "rating": 1,
  "userId": 1,
  "deptId": 216
}
```

### 会话管理

```http
# 获取用户会话列表
GET /api/ai/sessions?userId=1&page=1&pageSize=20

# 获取会话消息
GET /api/ai/session/{session_id}/messages?userId=1

# 删除会话
DELETE /api/ai/session/{session_id}?userId=1
```

更多API文档请参考: [docs/API.md](docs/API.md)

## 🗄️ 数据库表

系统使用4张AI相关表:

1. **ai_chat_session** - 聊天会话
2. **ai_chat_message** - 聊天消息
3. **ai_feedback** - 用户反馈
4. **ai_knowledge_base** - 知识库

详细表结构: [database/schema_inter_stu_center.sql](database/schema_inter_stu_center.sql)

## 📈 工作流程

### 新知识入库流程

```
1. 收集知识(Excel/人工录入/用户反馈)
   ↓
2. 插入 ai_knowledge_base 表
   - dept_id: 指定部门
   - indexed: '0' (未归档)
   - enabled: '1' (启用)
   ↓
3. 运行归档脚本
   python scripts/archive_to_vector.py --dept 216
   ↓
4. 向量化并存储到 vector_store/216/
   ↓
5. 更新 indexed='1'
   ↓
6. 用户立即可检索到新知识
```

### 定时归档任务

**Linux crontab**:
```bash
# 每天凌晨2点归档所有部门
0 2 * * * cd /path/to/pomelox_qwen_ai && python scripts/archive_to_vector.py >> logs/archive.log 2>&1
```

**Windows任务计划**:
```powershell
schtasks /create /tn "知识库归档" /tr "python E:\项目\pomelox_qwen_ai\scripts\archive_to_vector.py" /sc daily /st 02:00
```

## 🔒 安全考虑

1. **用户认证**: 所有接口验证userId,必须登录
2. **数据隔离**: 通过dept_id隔离不同学校数据
3. **权限验证**: 查询/删除会话时验证用户所有权
4. **SQL注入**: 使用参数化查询
5. **敏感信息**: .env文件不提交到git

## 📊 性能优化

1. **向量索引缓存**: 首次加载后缓存在内存
2. **数据库索引**: user_id, dept_id, session_id等字段已建索引
3. **分页查询**: 聊天记录分页加载
4. **SSH连接池**: 复用SSH隧道连接
5. **增量归档**: 只处理indexed='0'的新知识

## 🐛 故障排查

### 问题1: 向量检索失败

```bash
# 检查向量目录是否存在
ls vector_store/216/

# 检查向量文件完整性
ls vector_store/216/docstore.json
ls vector_store/216/index_store.json
```

### 问题2: 数据库连接失败

```bash
# 检查SSH隧道
# 查看.env中的SSH配置是否正确

# 测试MySQL连接
python tests/test_integration.py
```

### 问题3: 新知识检索不到

```bash
# 1. 检查是否已归档
SELECT * FROM ai_knowledge_base WHERE indexed='0' AND dept_id=216;

# 2. 运行归档脚本
python scripts/archive_to_vector.py --dept 216

# 3. 测试检索
python tests/test_vector_migration.py
```

## 📚 更多文档

- [测试报告](docs/reports/TEST_REPORT.md) - dept_id对齐完整测试报告
- [Excel导入说明](scripts/knowledge_import_template.md) - 批量导入知识库指南
- [数据库设计](database/schema_inter_stu_center.sql) - 表结构和字段说明

## 🤝 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📧 联系方式

问题反馈: [GitHub Issues](https://github.com/your-repo/pomelox_qwen_ai/issues)

---

**版本**: 2.0.0 (dept_id完整对齐版本)
**最后更新**: 2025-12-30
