# AI 审批流程配置助手 — 设计文档

> 日期: 2026-04-04
> 状态: 设计完成，待实施

## 1. 目标

在 RuoYi 管理后台的流程模板设计器中，集成 AI 对话助手。管理员通过自然语言描述，自动生成完整的审批模板配置（表单字段 + 流程节点 + 权限设置）。

## 2. 核心需求

### 2.1 AI 能力

- **表单字段生成**: 根据用户描述生成审批表单字段（13种组件类型），支持用户明确指定或 AI 从条件分支自动推断
- **流程节点生成**: 生成完整审批流程（审批人、抄送人、条件分支、并行分支、延迟、触发器）
- **权限配置**: 生成模板使用权限（发起/管理/查看导出），每项支持按部门、角色、指定人员三种粒度
- **修改已有流程**: 感知当前画布上的节点和字段，支持增量修改（添加、删除、调整节点）
- **模板推断**: 内置 5 个常用模板，用户说"活动审批"时基于模板生成并按需调整

### 2.2 审批人指定方式（6种）

| 方式 | AI 理解示例 |
|------|-----------|
| 指定人员 | "让张三和李四审批" |
| 按角色 | "让分管理员审批" |
| 按部门 | "让财务部审批" |
| 主管 | "让发起人的主管审批" |
| 多级主管 | "逐级审批到顶级" |
| 发起人自选 | "让发起人自己选审批人" |

### 2.3 权限控制（完整模式）

每个模板配置三类权限，每类支持部门/角色/指定人员三种粒度：

| 权限类型 | 说明 | 示例 |
|---------|------|------|
| 发起权限 | 谁能使用此模板发起审批 | "只有 UMN 的 staff 以上能发起" |
| 管理权限 | 谁能编辑此模板 | "只有总管理员能编辑" |
| 查看导出权限 | 谁能查看审批数据和导出 | "总管看所有，分管只看本校" |

## 3. UI 设计

### 3.1 底部可折叠面板

嵌入在流程模板设计器 dialog 的底部，不影响现有设计器布局。

```
┌──────────────────────────────────────────────────────┐
│  流程模板设计器                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 基础设置  │  │ 审批表单  │  │ 审批流程  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                      │
│  ... 设计器内容区 ...                                  │
│                                                      │
├──────────────────────────────────────────────────────┤
│  🤖 AI 审批助手                        [展开/收起] ▼  │
│  ┌────────────────────────────────────┐              │
│  │ 消息历史区                          │              │
│  │                                    │              │
│  │ 🤖 将生成以下配置:                   │              │
│  │ 📋 表单: 活动名称 + 日期 + 预算(金额) │              │
│  │ 🔄 流程: 发起人 → 分管(或签)         │              │
│  │        → [预算>5000 → 总管]         │              │
│  │        → 行政(抄送)                 │              │
│  │ 🔐 权限: UMN staff以上可发起         │              │
│  │                                    │              │
│  │      [✅ 应用到画布]  [🔄 重新生成]   │              │
│  └────────────────────────────────────┘              │
│  ┌────────────────────────────────┐ [发送]           │
│  │ 输入描述...                     │                  │
│  └────────────────────────────────┘                  │
├──────────────────────────────────────[确定] [取消]────┤
└──────────────────────────────────────────────────────┘
```

### 3.2 交互流程

1. 用户在底部面板输入描述
2. AI 解析后展示**文字预览**（表单字段 + 流程节点 + 权限配置）
3. 用户点击"应用到画布" → 执行 actions，节点和字段渲染到设计器
4. 用户可继续对话修改（"把条件改成3000"、"加一个抄送人"）
5. 修改时 AI 读取当前画布状态，只做增量变更

## 4. 技术架构

### 4.1 整体架构

```
ai-approval-assistant.js (前端注入)
        │
        ├─ 检测流程设计器页面
        ├─ 在 dialog 底部注入 AI 面板 DOM
        ├─ 获取 Vue 实例 (vm.flowNodes, vm.form.formItems 等)
        ├─ 构建 designer_context (当前状态)
        │
        ▼
/ai/approval/designer/chat/stream (Python 后端)
        │
        ├─ system prompt (节点规范 + 内置模板 + 当前状态)
        ├─ DashScope qwen-plus 流式生成
        ├─ 解析 AI 输出为 actions JSON
        │
        ▼
前端 Action 执行引擎
        │
        ├─ 预览模式: 渲染文字预览
        ├─ 用户确认后: 逐步执行 actions
        └─ 调用 vm.addNode(), vm.addConditionBranch() 等
```

### 4.2 前端 (`ai-approval-assistant.js`)

**核心文件**: `frontend/scripts/ai-approval-assistant.js`

**复用 ai-form-assistant.js 的基础设施**:
- Auth token 获取
- SSE 流式响应解析
- 对话历史管理 (localStorage)
- 历史压缩机制
- Vue 实例检测模式

**新增逻辑**:
- 检测标志: `vm.flowNodes` 和 `vm.form.formItems` (而非 `vm.drawingList`)
- UI 注入位置: 设计器 dialog 底部 (而非页面右下角 FAB)
- Action 类型: 流程节点操作 (addNode, addCondition 等)
- 预览渲染: 文字描述 + 确认按钮

**Action 格式**:
```json
{
  "preview": {
    "formFields": [
      {"type": "text", "label": "活动名称", "required": true},
      {"type": "datetime", "label": "活动日期"},
      {"type": "money", "label": "预算金额", "required": true}
    ],
    "flowNodes": [
      {"type": "approver", "name": "分管理员", "mode": "or", "assignType": "role", "assign": "part_manage"},
      {"type": "condition", "field": "预算金额", "op": ">", "value": 5000, "children": [
        {"type": "approver", "name": "总管理员", "assignType": "specified", "assign": [249]}
      ]},
      {"type": "cc", "name": "行政组", "assignType": "department", "assign": [223]}
    ],
    "permissions": {
      "initiator": {"type": "role", "value": ["staff", "part_manage", "manage"]},
      "admin": {"type": "role", "value": ["manage"]},
      "viewer": {"type": "role", "value": ["manage", "part_manage"]}
    }
  },
  "actions": [
    {"a": "clearForm"},
    {"a": "clearFlow"},
    {"a": "addFormField", "t": "text", "label": "活动名称", "required": true},
    {"a": "addFormField", "t": "datetime", "label": "活动日期"},
    {"a": "addFormField", "t": "money", "label": "预算金额", "required": true},
    {"a": "addNode", "t": "approver", "name": "分管理员", "mode": "or"},
    {"a": "addConditionBranch"},
    {"a": "setCondition", "i": 0, "field": "预算金额", "op": ">", "value": 5000},
    {"a": "addNodeToCondition", "i": 0, "t": "approver", "name": "总管理员"},
    {"a": "addNode", "t": "cc", "name": "行政组"},
    {"a": "setPermission", "k": "commiter", "v": ["staff", "part_manage", "manage"]},
    {"a": "setPermission", "k": "admin", "v": ["manage"]},
    {"a": "setPermission", "k": "viewer", "v": ["manage", "part_manage"]}
  ]
}
```

### 4.3 后端 (`/ai/approval/designer/chat/stream`)

**新建文件**: `pomelox_qwen_ai/core/approval_designer_routes.py`

**System Prompt 核心内容**:

```
你是审批流程设计助手。根据用户描述生成审批模板配置。

## 输出格式
返回 JSON，包含 preview (预览) 和 actions (操作指令) 两部分。

## 可用的表单字段类型
text(单行文本), textarea(多行文本), number(数字), money(金额),
radio(单选), checkbox(多选), select(下拉), datetime(日期时间),
daterange(日期区间), upload(上传), user(人员选择),
department(部门选择), description(说明文字)

## 可用的流程节点类型
approver(审批人), cc(抄送人), conditionBranch(条件分支),
parallelBranch(并行分支), delay(延迟), trigger(触发器)

## 审批人指定方式
specified(指定人员), role(角色), department(部门),
manager(主管), multiLevel(多级主管), selfSelect(自选)

## 权限粒度
role(按角色), department(按部门), specified(指定人员)

## 内置模板
[5个模板的完整 JSON 示例]

## 当前设计器状态
[由前端动态注入: 现有的 formItems 和 flowNodes]

## 规则
1. 如果用户提到条件判断（如"金额超过5000"），自动确保表单中有对应字段
2. 如果用户说"修改"或"添加"，只生成增量 actions，不清空现有内容
3. 权限默认: 发起=所有内部人员, 管理=总管理员, 查看=管理员
```

**请求体**:
```json
{
  "message": "创建活动审批...",
  "session_id": "uuid",
  "designer_context": {
    "currentFormItems": [...],
    "currentFlowNodes": [...],
    "currentPermissions": {...},
    "availableUsers": [...],
    "availableDepts": [...],
    "availableRoles": [...]
  }
}
```

### 4.4 Action 执行引擎

**执行顺序**: clearForm → clearFlow → addFormField (逐个) → addNode (逐个) → setPermission

**每步操作**:

| Action | 调用的 Vue 方法 | 延迟 |
|--------|---------------|------|
| `clearForm` | `vm.form.formItems = []` | 200ms |
| `clearFlow` | `vm.flowNodes = []` | 200ms |
| `addFormField` | `vm.form.formItems.push({...})` + `vm.addFormComponent()` | 300ms |
| `addNode` | `vm.flowNodes.push({...})` 或 `vm.addNode(type)` | 400ms |
| `addConditionBranch` | `vm.addConditionBranch()` | 400ms |
| `setCondition` | 修改条件分支的 condition 对象 | 200ms |
| `addNodeToCondition` | 条件分支内的 nodes.push | 400ms |
| `setPermission` | 修改 `vm.form.settings` | 200ms |

**预览渲染**: 将 `preview` 对象转换为可读的中文描述，包含表单字段列表、流程图文字表示、权限说明。

## 5. 内置模板

### 5.1 活动审批
```json
{
  "name": "活动审批",
  "formFields": [
    {"type": "text", "label": "活动名称", "required": true},
    {"type": "datetime", "label": "活动日期", "required": true},
    {"type": "text", "label": "活动地点"},
    {"type": "money", "label": "预算金额", "required": true},
    {"type": "textarea", "label": "活动描述"}
  ],
  "flowNodes": [
    {"type": "approver", "assignType": "role", "assign": "part_manage", "mode": "or"},
    {"type": "condition", "field": "预算金额", "op": ">", "value": 5000, "children": [
      {"type": "approver", "assignType": "role", "assign": "manage"}
    ]},
    {"type": "cc", "assignType": "role", "assign": "part_manage"}
  ]
}
```

### 5.2 费用报销
```json
{
  "name": "费用报销",
  "formFields": [
    {"type": "money", "label": "报销金额", "required": true},
    {"type": "datetime", "label": "费用日期", "required": true},
    {"type": "textarea", "label": "费用说明", "required": true},
    {"type": "upload", "label": "凭证上传", "required": true}
  ],
  "flowNodes": [
    {"type": "approver", "assignType": "role", "assign": "part_manage", "mode": "or"},
    {"type": "approver", "assignType": "department", "assign": "财务部", "mode": "or"},
    {"type": "condition", "field": "报销金额", "op": ">", "value": 5000, "children": [
      {"type": "approver", "assignType": "role", "assign": "manage"}
    ]},
    {"type": "cc", "assignType": "role", "assign": "part_manage"}
  ]
}
```

### 5.3 请假申请
```json
{
  "name": "请假申请",
  "formFields": [
    {"type": "radio", "label": "请假类型", "options": ["事假","病假","年假","调休"], "required": true},
    {"type": "daterange", "label": "请假日期", "required": true},
    {"type": "textarea", "label": "请假原因", "required": true}
  ],
  "flowNodes": [
    {"type": "approver", "assignType": "manager", "level": 1, "mode": "or"},
    {"type": "condition", "field": "请假天数", "op": ">", "value": 3, "children": [
      {"type": "approver", "assignType": "role", "assign": "manage"}
    ]}
  ]
}
```

### 5.4 采购申请
```json
{
  "name": "采购申请",
  "formFields": [
    {"type": "text", "label": "物品名称", "required": true},
    {"type": "number", "label": "数量", "required": true},
    {"type": "money", "label": "单价", "required": true},
    {"type": "money", "label": "总价", "required": true},
    {"type": "textarea", "label": "用途说明"}
  ],
  "flowNodes": [
    {"type": "approver", "assignType": "role", "assign": "part_manage", "mode": "or"},
    {"type": "condition", "field": "总价", "op": ">", "value": 2000, "children": [
      {"type": "approver", "assignType": "role", "assign": "manage"}
    ]},
    {"type": "cc", "assignType": "department", "assign": "财务部"}
  ]
}
```

### 5.5 通用审批
```json
{
  "name": "通用审批",
  "formFields": [
    {"type": "text", "label": "审批标题", "required": true},
    {"type": "textarea", "label": "详细说明"},
    {"type": "upload", "label": "附件"}
  ],
  "flowNodes": [
    {"type": "approver", "assignType": "selfSelect", "mode": "or"}
  ]
}
```

## 6. 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `frontend/scripts/ai-approval-assistant.js` | 新建 | 前端 AI 助手核心 |
| `pomelox_qwen_ai/core/approval_designer_routes.py` | 新建 | 后端 AI 生成接口 |
| `ruoyi-ui/src/views/system/manage/index.vue` | 修改 | 注入 AI 面板的 hook 点 |

## 7. 部署方式

与现有 `ai-form-assistant.js` 一致：
1. 本地开发 JS 文件
2. `jar uf` 注入到 JAR 包的 `BOOT-INF/classes/static/js/` 目录
3. 在 admin-web 的 `index.html` 中添加 `<script>` 标签
4. Python 后端接口部署到 AI 服务 (端口 8087)
