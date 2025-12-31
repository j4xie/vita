# API 接口文档

## 核心 API 接口

### 1. AI 问答接口
**端点:** `POST /ask`

**功能:** 集成 RAG 检索和联网搜索的智能问答接口

**请求参数:**
```json
{
  "session_id": "可选，会话ID",
  "question": "用户问题",
  "deptId": 123  // 部门ID，用于匹配学校
}
```

**响应示例:**
```json
{
  "session_id": "uuid-string",
  "school_id": "UCSD",
  "question": "如何申请宿舍？",
  "answer": "根据学校规定...",
  "source_type": "knowledge_base",  // 或 "web_search"
  "rag_score": 0.85,
  "web_sources": {}  // 仅在使用联网搜索时返回
}
```

---

### 2. 获取会话历史
**端点:** `GET /history/<session_id>`

**功能:** 查询指定会话的对话历史

**响应示例:**
```json
{
  "session_id": "uuid",
  "school_id": "UCI",
  "history": [
    {"role": "user", "content": "问题1"},
    {"role": "assistant", "content": "回答1"}
  ]
}
```

---

### 3. 清除会话
**端点:** `DELETE /clear/<session_id>`

**功能:** 删除指定会话的所有记录

---

### 4. 获取学校列表
**端点:** `GET /schools`

**功能:** 获取系统支持的所有学校信息

**响应示例:**
```json
{
  "schools": {
    "UCI": {"name": "加州大学尔湾分校", "dept_ids": [123]},
    "UCSD": {"name": "加州大学圣地亚哥分校", "dept_ids": [456]}
  }
}
```

---

### 5. 健康检查
**端点:** `GET /health`

**功能:** 服务健康状态检查

---

## 聊天历史管理接口

### 6. 获取所有聊天记录
**端点:** `GET /chat-history`

**响应示例:**
```json
{
  "chats": [
    {
      "sessionId": "uuid",
      "deptId": 123,
      "schoolId": "UCSD",
      "schoolName": "UCSD",
      "title": "对话标题",
      "messages": [],
      "createdAt": "2024-12-28T10:00:00Z",
      "updatedAt": "2024-12-28T10:30:00Z"
    }
  ]
}
```

---

### 7. 保存聊天记录
**端点:** `POST /chat-history`

**请求参数:**
```json
{
  "sessionId": "uuid",
  "deptId": 123,
  "schoolId": "UCSD",
  "schoolName": "UCSD",
  "title": "对话标题",
  "messages": [],
  "createdAt": "ISO时间戳",
  "updatedAt": "ISO时间戳"
}
```

---

### 8. 删除聊天记录
**端点:** `DELETE /chat-history/<session_id>`

---

### 9. 清空所有聊天记录
**端点:** `DELETE /chat-history/clear`

---

## 反馈系统接口 (v1.0新增)

### 10. 提交反馈
**端点:** `POST /app/ai/feedback`

**功能:** 用户对AI回答进行评价 (👍/👎)

**请求参数:**
```json
{
  "session_id": "uuid",
  "message_id": "uuid",
  "user_id": "可选，用户ID",
  "question": "原始问题",
  "answer": "AI回答",
  "rating": 1,  // 1=有帮助, -1=没帮助
  "comment": "可选，用户评论",
  "source_type": "knowledge_base",  // 或 "web_search"
  "rag_score": 0.85,
  "school_id": "UCSD"
}
```

**响应示例:**
```json
{
  "success": true,
  "feedback_id": "uuid",
  "confidence_score": 0.75,
  "auto_approved": false,
  "status": "pending",  // "auto_approved", "pending", "recorded"
  "message": "反馈已提交，等待人工审核"
}
```

**自动审核逻辑:**
- 置信度 ≥ 0.8: 自动入库 (auto_approved)
- 置信度 0.5-0.8: 待审核 (pending)
- 置信度 < 0.5: 仅记录 (recorded)

---

### 11. 获取待审核反馈
**端点:** `GET /app/ai/feedback/pending`

**查询参数:**
- `school_id`: 可选，学校ID
- `days`: 可选，最近N天的反馈 (默认30天)

---

### 12. 审核反馈 (批准)
**端点:** `POST /app/ai/feedback/<feedback_id>/approve`

**请求参数 (可选):**
```json
{
  "question": "修改后的问题",
  "answer": "修改后的答案",
  "category": "问答分类"
}
```

---

### 13. 审核反馈 (拒绝)
**端点:** `POST /app/ai/feedback/<feedback_id>/reject`

---

### 14. 删除反馈
**端点:** `DELETE /app/ai/feedback/<feedback_id>`

---

### 15. 获取知识库条目
**端点:** `GET /app/ai/knowledge`

**查询参数:**
- `school_id`: 可选，学校ID
- `enabled_only`: 可选，仅返回启用的条目 (默认true)

---

### 16. 更新知识库条目
**端点:** `PUT /app/ai/knowledge/<kb_id>`

**请求参数:**
```json
{
  "question": "更新的问题",
  "answer": "更新的答案",
  "category": "分类",
  "enabled": true
}
```

---

### 17. 删除知识库条目
**端点:** `DELETE /app/ai/knowledge/<kb_id>`

---

### 18. 触发归档任务
**端点:** `POST /app/ai/knowledge/archive`

**功能:** 手动触发将数据库新知识归档到向量库

**查询参数:**
- `school_id`: 可选，指定学校ID

---

## 错误码说明

| HTTP 状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

**错误响应格式:**
```json
{
  "error": "错误描述信息"
}
```

---

## 部门ID映射

通过 `deptId` 自动匹配学校，避免手动传递 `school_id`:

```python
DEPT_TO_SCHOOL = {
    123: 'UCI',
    456: 'UCSD',
    789: 'UCLA'
    # 在 config.py 中配置
}
```

---

## 注意事项

1. **反馈系统集成:** 接口 10-18 需要在 app.py 中手动注册:
   ```python
   from core.app_feedback_routes import register_feedback_routes
   register_feedback_routes(app)
   ```

2. **归档任务:** 建议配置 cron 每天自动运行归档脚本:
   ```bash
   0 2 * * * python scripts/archive_to_vector.py
   ```

3. **数据库配置:** 当前使用 JSON 文件存储，生产环境建议切换到 MySQL (修改 `config.py` 中的 `DATABASE_TYPE`)
