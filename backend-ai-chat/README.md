# PomeloX AI Chat Backend Service

基于 **Hugging Face Llama-3.1-8B-Instruct** 模型的多轮对话AI服务。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑.env文件，填入你的Hugging Face Token
# HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**获取Hugging Face Token**:
1. 访问 https://huggingface.co/settings/tokens
2. 创建新Token（需要有read权限）
3. 复制Token到.env文件

### 3. 安装Redis（可选但推荐）

**Windows**:
```bash
# 使用WSL安装或下载Windows版本
# https://github.com/microsoftarchive/redis/releases
```

**macOS**:
```bash
brew install redis
brew services start redis
```

**Linux**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**或使用Docker**:
```bash
docker run -d -p 6379:6379 redis:alpine
```

⚠️ **如果不安装Redis**：程序会自动使用内存存储（服务重启后会话丢失）

### 4. 启动服务

```bash
python main.py
```

服务启动后访问：
- API文档: http://localhost:8085/docs
- 健康检查: http://localhost:8085/

---

## 📡 API接口说明

### 1. **发送消息** `POST /api/ai/chat`

**请求体**:
```json
{
  "message": "你好，请介绍一下PomeloX平台",
  "session_id": "可选-会话ID",
  "user_id": "可选-用户ID"
}
```

**响应**:
```json
{
  "reply": "你好！PomeloX是专为海外中国留学生打造的...",
  "session_id": "abc123...",
  "message_count": 3
}
```

**特点**:
- ✅ 自动创建新会话（如果不提供session_id）
- ✅ 保留对话上下文（多轮对话）
- ✅ 24小时会话过期

---

### 2. **获取会话历史** `GET /api/ai/session/{session_id}`

**参数**:
- `session_id`: 会话ID
- `user_id`: （可选）用户ID

**响应**:
```json
{
  "session_id": "abc123...",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    },
    {
      "role": "assistant",
      "content": "你好！我是PomeloX AI助手..."
    }
  ],
  "created_at": "2025-01-20T10:00:00",
  "updated_at": "2025-01-20T10:05:00"
}
```

---

### 3. **删除会话** `DELETE /api/ai/session/{session_id}`

清空会话历史记录。

---

### 4. **重置会话** `POST /api/ai/reset`

**请求体**:
```json
{
  "session_id": "abc123...",
  "user_id": "可选-用户ID"
}
```

---

## 🏗️ 架构设计

```
前端Web应用
    ↓
POST /api/ai/chat
    ↓
FastAPI后端服务
    ↓
Redis存储会话 → Hugging Face API
    ↓
Llama-3.1-8B-Instruct
```

### 核心功能

1. **多轮对话管理**
   - 每个用户有独立的会话ID
   - 自动保存对话历史
   - 支持上下文理解

2. **会话存储**
   - 优先使用Redis（持久化）
   - 备份使用内存（服务重启丢失）
   - 自动过期（24小时）

3. **用户隔离**
   - 通过user_id区分不同用户
   - 每个用户可以有多个会话

---

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `HF_TOKEN` | Hugging Face API Token | - | ✅ 是 |
| `REDIS_HOST` | Redis服务器地址 | localhost | ❌ 否 |
| `REDIS_PORT` | Redis端口 | 6379 | ❌ 否 |
| `REDIS_DB` | Redis数据库编号 | 0 | ❌ 否 |

### 模型参数调整

编辑 `main.py` 中的 `query_llama` 函数：

```python
payload = {
    "max_tokens": 1000,      # 回复最大长度
    "temperature": 0.7,      # 随机性 (0-1)
    # 0.3 = 更保守
    # 0.7 = 平衡
    # 1.0 = 更有创意
}
```

---

## 🧪 测试API

### 使用curl测试

```bash
# 1. 发送第一条消息
curl -X POST http://localhost:8085/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，请介绍一下自己",
    "user_id": "test_user_001"
  }'

# 2. 继续对话（使用返回的session_id）
curl -X POST http://localhost:8085/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "能帮我推荐一些活动吗？",
    "session_id": "返回的session_id",
    "user_id": "test_user_001"
  }'

# 3. 获取会话历史
curl http://localhost:8085/api/ai/session/{session_id}?user_id=test_user_001
```

### 使用Postman测试

1. 导入OpenAPI文档: http://localhost:8085/openapi.json
2. 或访问交互式文档: http://localhost:8085/docs

---

## 📊 监控和日志

服务运行时会输出以下日志：

```
✅ Redis连接成功
INFO:     Started server process [12345]
INFO:     Uvicorn running on http://0.0.0.0:8085
```

---

## 🚨 故障排除

### 问题1: `HF_TOKEN未配置`
**解决**: 确保.env文件中设置了有效的Hugging Face Token

### 问题2: `Redis连接失败`
**解决**:
- 检查Redis是否启动: `redis-cli ping`（应返回PONG）
- 或不使用Redis，程序会自动切换到内存模式

### 问题3: `AI模型调用失败`
**解决**:
- 检查网络连接
- 确认HF_TOKEN有效且有权限
- 查看Hugging Face服务状态

### 问题4: 会话丢失
**原因**: 使用内存存储且服务重启
**解决**: 安装并启动Redis

---

## 🔐 安全建议

1. **不要将.env文件提交到Git**
   ```bash
   # .gitignore中添加
   .env
   ```

2. **生产环境使用HTTPS**

3. **添加用户认证**（推荐）
   ```python
   # 在每个API端点添加Token验证
   async def verify_token(authorization: str = Header(...)):
       # 验证JWT token
   ```

4. **限流保护**
   ```python
   # 使用slowapi添加速率限制
   from slowapi import Limiter
   ```

---

## 📦 部署到生产环境

### 使用Docker部署

```bash
# 待补充Dockerfile
```

### 使用PM2部署

```bash
pm2 start main.py --name ai-chat --interpreter python3
```

---

## 🛠️ 下一步优化

- [ ] 添加流式返回（实时显示AI回复）
- [ ] 添加用户认证和鉴权
- [ ] 添加速率限制
- [ ] 优化系统提示词
- [ ] 添加对话质量评分
- [ ] 支持上传图片/文件
- [ ] 添加敏感词过滤

---

## 📄 许可证

MIT License
