# AI 审批流程配置助手 — 设计文档 (v2)

> 日期: 2026-04-04
> 状态: 设计完成，已通过 review 修复
> Review 修复: C1-C4 数据结构对齐、I1-I6 补充

## 1. 目标

在 RuoYi 管理后台的流程模板设计器中，集成 AI 对话助手。管理员通过自然语言描述，自动生成完整的审批模板配置（表单字段 + 流程节点 + 权限设置）。

## 2. 核心需求

### 2.1 AI 能力

- **表单字段生成**: 根据用户描述生成审批表单字段（13种组件类型），支持用户明确指定或 AI 从条件分支自动推断
- **流程节点生成**: 生成完整审批流程（审批人、抄送人、条件分支、并行分支、延迟、触发器）
- **权限配置**: 生成模板使用权限（发起/管理/查看导出），每项支持按部门、角色、指定人员三种粒度
- **修改已有流程**: 感知当前画布上的节点和字段，支持增量修改（添加、删除、调整节点）
- **模板推断**: 内置 5 个常用模板，用户说"活动审批"时基于模板生成并按需调整

### 2.2 审批人指定方式（7种，对齐 manage/index.vue 实际选项）

| config 值 | 含义 | AI 理解示例 |
|-----------|------|-----------|
| `specified` | 指定人员 | "让张三和李四审批" |
| `role` | 按角色 | "让分管理员审批" |
| `manager` | 主管 | "让发起人的主管审批" |
| `multiLevel` | 多级主管 | "逐级审批到顶级" |
| `selfSelect` | 发起人自选 | "让发起人自己选审批人" |
| `initiator` | 发起人自己 | "发起人自动通过" |
| `department` | 按部门 | "让财务部审批" (**需扩展 UI**) |

> **注意**: `department` 在现有 UI 中不存在，需在实施时扩展 `manage/index.vue` 的审批人选项。

### 2.3 审批模式

| mode | 含义 | AI 理解示例 |
|------|------|-----------|
| `or` | 或签（一人通过即可） | "任意一个审批人通过就行" |
| `and` | 会签（需所有人通过） | "需要所有人都通过" |

### 2.4 权限控制（完整模式）

每个模板配置三类权限，每类支持部门/角色/指定人员三种粒度：

| 权限类型 | settings 字段 | 说明 |
|---------|-------------|------|
| 发起权限 | `commiter` | 谁能使用此模板发起审批 |
| 管理权限 | `admin` | 谁能编辑此模板 |
| 查看导出权限 | `viewer` | 谁能查看审批数据和导出 |

**权限值结构** (需扩展现有 UI):
```javascript
// 现有 UI: commiter 存的是粒度类型 ["department", "role", "user"]
// 扩展后: 存具体的值
settings: {
  commiter: {
    type: "role",                    // department | role | specified
    roles: ["staff", "part_manage"], // 当 type=role 时
    deptIds: [],                     // 当 type=department 时
    userIds: []                      // 当 type=specified 时
  },
  admin: {
    type: "role",
    roles: ["manage"]
  },
  viewer: {
    type: "role",
    roles: ["manage", "part_manage"]
  }
}
```

> **注意**: 现有 `manage/index.vue` 的 settings.commiter 只存 `["department","role","user"]` 粒度类型，不存具体值。需在实施时扩展 settings 结构和对应 UI。

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
│  │ 🔐 权限: staff以上可发起            │              │
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
        ├─ 检测流程设计器 dialog (vm.flowNodes 存在)
        ├─ 在 dialog 底部注入 AI 面板 DOM
        ├─ 获取 Vue 实例 (vm.flowNodes, vm.form.formItems 等)
        ├─ 构建 designer_context (当前状态)
        │
        ▼
/api/ai/approval-designer/chat/stream (Python 后端)
        │
        ├─ system prompt (节点规范 + 内置模板 + 当前状态)
        ├─ DashScope qwen-plus 流式生成
        ├─ 返回 preview + actions JSON
        │
        ▼
前端 Action 执行引擎
        │
        ├─ 预览模式: 渲染文字预览 + 确认按钮
        ├─ 用户确认后: 批量执行 actions
        ├─ 操作前快照 (用于撤销)
        └─ 直接操作 vm.flowNodes / vm.form.formItems
```

### 4.2 前端 (`ai-approval-assistant.js`)

**核心文件**: `frontend/scripts/ai-approval-assistant.js`

**复用 ai-form-assistant.js 的基础设施**:
- `getAuthToken()` / `buildAuthHeaders()` — Auth
- SSE 流式响应解析
- 对话历史管理 (localStorage, 最多30个, 自动压缩)
- 历史压缩机制 (40条消息触发)

**Vue 实例检测**:
- 检测标志: dialog 内的 Vue 组件含有 `vm.flowNodes` 属性
- dialog 是 `append-to-body` 的，需要从 `document.querySelector('.process-design-dialog')` 开始查找
- 缓存 Vue 实例引用，dialog 关闭时清除

**designer_context 构建**:
```javascript
{
  currentFormItems: vm.form.formItems,        // 当前表单字段
  currentFlowNodes: vm.flowNodes,             // 当前流程节点
  startNodeConfig: vm.startNodeConfig,        // 发起人配置
  currentSettings: vm.form.settings,          // 当前权限设置
  availableUsers: [...],   // 从 /system/user/list 获取
  availableDepts: [...],   // 从 /system/dept/list 获取
  availableRoles: [...]    // 从 /system/role/list 获取
}
```

### 4.3 Action 格式（深度验证后，严格对齐 Vue 数据模型）

**Vue 实际节点结构** (来源: manage/index.vue addNode() 第1116-1218行):
```javascript
// 审批人节点
{ id: Date.now(), type: 'approver', config: { approver: 'specified', mode: 'or', emptyAction: 'pass', operateUsers: 252 } }

// 抄送人节点
{ id: Date.now(), type: 'cc', config: { cc: 'specified', operateUsers: 105 } }

// 条件分支节点 (来源: addConditionBranch() 第1221-1247行)
{ id: Date.now(), type: 'conditionBranch', conditions: [
    { id: Date.now(), name: '条件1', condition: '预算金额 > 5000', priority: 1, nodes: [] },
    { id: Date.now()+1, name: '其他情况', condition: '', priority: 2, nodes: [] }
]}

// 并行分支节点 (来源: addParallelBranch() 第1298-1324行)
{ id: Date.now(), type: 'parallelBranch', branches: [
    { id: Date.now(), name: '分支1', content: '并行任务', nodes: [] },
    { id: Date.now()+1, name: '分支2', content: '并行任务', nodes: [] }
]}

// 延迟节点
{ id: Date.now(), type: 'delay', config: { time: 1, unit: 'minute' } }

// 触发器节点
{ id: Date.now(), type: 'trigger', config: { type: 'webhook', url: '' } }
```

**表单字段实际结构** (来源: addFormComponent() 第1428-1456行):
```javascript
{
  id: Date.now(),
  type: 'text',              // 组件类型
  label: '活动名称',          // 显示标签
  field: 'activity_name',    // 字段标识 (由label生成)  ← 必需
  required: false,
  placeholder: '请输入活动名称', // ← 必需
  options: [],               // 选项列表 ← 必需
  // 类型特定字段:
  // money: precision=2
  // datetime/daterange: format='yyyy-MM-dd'
  // description: description='', style='normal'
}
```

**Action 定义**:

```json
{
  "preview": { ... },
  "actions": [
    // === 清空操作 ===
    {"a": "clearForm"},
    {"a": "clearFlow"},

    // === 表单字段操作 ===
    // 执行引擎自动补充: field, placeholder, options, 类型特定默认值
    {"a": "addFormField", "type": "text", "label": "活动名称", "required": true},
    {"a": "addFormField", "type": "money", "label": "预算金额", "required": true},
    {"a": "addFormField", "type": "radio", "label": "请假类型",
     "options": [{"label":"事假","value":"1"},{"label":"病假","value":"2"}]},
    {"a": "removeFormField", "index": 2},

    // === 流程节点操作 (主流程) ===
    // afterIndex: 可选，指定插入位置(flowNodes索引)。省略则追加到末尾
    {"a": "addApprover", "approver": "role", "mode": "or", "emptyAction": "pass",
     "operateUsers": null, "afterIndex": null},
    {"a": "addApprover", "approver": "specified", "mode": "and",
     "operateUsers": 249, "afterIndex": 0},
    {"a": "addCc", "cc": "specified", "operateUsers": 105},
    {"a": "addDelay", "time": 1, "unit": "hour"},
    {"a": "addTrigger", "type": "webhook", "url": "https://..."},
    {"a": "removeNode", "index": 2},

    // === 条件分支操作 ===
    // conditions 中的每个条件: condition 是纯文本字符串(不是结构化对象)
    // 执行引擎自动补充: 每个condition的 id 和 nodes 字段
    {"a": "addConditionBranch", "conditions": [
      {"name": "大额预算", "condition": "预算金额 > 5000", "priority": 1},
      {"name": "其他情况", "condition": "", "priority": 2}
    ]},
    // groupIndex: conditionBranch 节点在 flowNodes 中的索引
    // conditionIndex: conditions 数组中的索引
    // 执行引擎自动给 node 补充 id
    {"a": "addNodeToCondition", "groupIndex": 1, "conditionIndex": 0,
     "node": {"type": "approver", "config": {"approver": "specified", "mode": "or", "operateUsers": 249}}},

    // === 并行分支操作 ===
    // 执行引擎自动补充: 每个branch的 id 和 nodes 字段
    {"a": "addParallelBranch", "branches": [
      {"name": "财务审批", "content": ""},
      {"name": "技术审批", "content": ""}
    ]},
    // nodeIndex: parallelBranch 节点在 flowNodes 中的索引
    // branchIndex: branches 数组中的索引
    {"a": "addNodeToParallel", "nodeIndex": 2, "branchIndex": 0,
     "node": {"type": "approver", "config": {"approver": "role", "mode": "or"}}},

    // === 权限操作 ===
    // 短期兼容: 写入数组格式匹配现有UI。长期: 扩展UI后改为对象格式
    {"a": "setPermission", "key": "commiter", "value": ["role"]},
    {"a": "setPermission", "key": "admin", "value": ["role"]},
    {"a": "setPermission", "key": "viewer", "value": ["role"]},

    // === 基础设置 ===
    {"a": "setName", "value": "活动审批"},
    {"a": "setStartNode", "initiator": "all"}
  ]
}
```

### 4.4 Action 执行引擎

**执行方式**: 逐步延迟执行（与 ai-form-assistant.js 一致），操作前保存快照用于撤销

```javascript
// 1. 执行前快照
const snapshot = {
  formItems: JSON.parse(JSON.stringify(vm.form.formItems)),
  flowNodes: JSON.parse(JSON.stringify(vm.flowNodes)),
  settings: JSON.parse(JSON.stringify(vm.form.settings)),
  startNodeConfig: JSON.parse(JSON.stringify(vm.startNodeConfig))
}

// 2. 逐步执行 actions (每步200-400ms延迟)
function runStep(index) {
  if (index >= actions.length) {
    vm.$forceUpdate()  // 全部完成后强制刷新
    return
  }
  executeAction(vm, actions[index])
  setTimeout(() => runStep(index + 1), 200)
}
runStep(0)
```

**各 Action 的执行逻辑**:

| Action | 执行代码 | 说明 |
|--------|---------|------|
| `clearForm` | `vm.form.formItems = []` | data属性直接赋值即可响应 |
| `clearFlow` | `vm.flowNodes = []` | 同上 |
| `addFormField` | 见下方详细逻辑 | 自动补充 field/placeholder/options |
| `removeFormField` | `vm.form.formItems.splice(index, 1)` | |
| `addApprover` | `insertNode(vm, afterIndex, {id:Date.now(), type:'approver', config:{approver, mode, emptyAction, operateUsers}})` | |
| `addCc` | `insertNode(vm, afterIndex, {id:Date.now(), type:'cc', config:{cc, operateUsers}})` | |
| `addDelay` | `insertNode(vm, null, {id:Date.now(), type:'delay', config:{time, unit}})` | |
| `addTrigger` | `insertNode(vm, null, {id:Date.now(), type:'trigger', config:{type, url}})` | |
| `removeNode` | `vm.flowNodes.splice(index, 1)` | 多个删除时倒序执行 |
| `addConditionBranch` | 见下方 | 自动补充每个condition的id和nodes |
| `addNodeToCondition` | `vm.flowNodes[groupIndex].conditions[conditionIndex].nodes.push({id:Date.now(), ...node})` | |
| `addParallelBranch` | 见下方 | 自动补充每个branch的id和nodes |
| `addNodeToParallel` | `vm.flowNodes[nodeIndex].branches[branchIndex].nodes.push({id:Date.now(), ...node})` | |
| `setPermission` | `vm.form.settings[key] = value` | 短期: 数组格式 |
| `setName` | `vm.form.name = value` | |
| `setStartNode` | `vm.startNodeConfig.initiator = value` | |

**addFormField 详细逻辑**:
```javascript
function execAddFormField(vm, action) {
  const item = {
    id: Date.now() + Math.random(),
    type: action.type,
    label: action.label,
    field: (action.label || '').replace(/\s+/g, '_').toLowerCase(),
    required: action.required || false,
    placeholder: action.placeholder || `请输入${action.label}`,
    options: action.options || []
  }
  if (action.type === 'money') item.precision = 2
  if (['datetime','daterange'].includes(action.type)) item.format = 'yyyy-MM-dd'
  if (action.type === 'description') { item.description = ''; item.style = 'normal' }
  if (['select','radio','checkbox'].includes(action.type) && item.options.length === 0) {
    item.options = [{label:'选项1',value:'1'},{label:'选项2',value:'2'}]
  }
  vm.form.formItems.push(item)
}
```

**insertNode 通用插入函数**:
```javascript
function insertNode(vm, afterIndex, node) {
  if (afterIndex !== null && afterIndex !== undefined && afterIndex >= 0) {
    vm.flowNodes.splice(afterIndex + 1, 0, node)
  } else {
    vm.flowNodes.push(node)
  }
}
```

**addConditionBranch 详细逻辑**:
```javascript
function execAddConditionBranch(vm, action) {
  const conditions = (action.conditions || []).map((c, i) => ({
    id: Date.now() + i,
    name: c.name || `条件${i+1}`,
    condition: c.condition || '',  // 纯文本字符串
    priority: c.priority || (i+1),
    nodes: []  // 自动补充
  }))
  if (conditions.length < 2) {
    conditions.push({id: Date.now()+99, name:'其他', condition:'', priority:conditions.length+1, nodes:[]})
  }
  vm.flowNodes.push({id: Date.now(), type: 'conditionBranch', conditions})
}
```

**撤销功能**: 执行后在 AI 面板显示"撤销"按钮，点击恢复快照:
```javascript
vm.form.formItems = snapshot.formItems
vm.flowNodes = snapshot.flowNodes
Object.assign(vm.form.settings, snapshot.settings)
Object.assign(vm.startNodeConfig, snapshot.startNodeConfig)
vm.$forceUpdate()
```

### 4.5 后端 (`/api/ai/approval-designer/chat/stream`)

**新建文件**: `pomelox_qwen_ai/core/approval_designer_routes.py`

**API 路径**: `/api/ai/approval-designer/chat/stream` (与表单助手 `/api/ai/form-designer/chat/stream` 命名风格一致)

**请求体**:
```json
{
  "message": "创建活动审批...",
  "session_id": "uuid",
  "model": "qwen-plus",
  "designer_context": {
    "currentFormItems": [...],
    "currentFlowNodes": [...],
    "startNodeConfig": {...},
    "currentSettings": {...},
    "availableUsers": [{"id":249,"name":"张三"}, ...],
    "availableDepts": [{"id":223,"name":"PomeloX HQ"}, ...],
    "availableRoles": [{"id":2,"name":"总管理员","key":"manage"}, ...]
  },
  "history": [...]
}
```

**System Prompt 核心规则**:
1. 输出必须是合法 JSON，包含 `preview` 和 `actions` 两部分
2. 条件表达式 (`condition` 字段) 是纯文本字符串（如 `"预算金额 > 5000"`），不是结构化对象
3. 如果用户提到条件判断（如"金额超过5000"），自动在表单字段中确保有对应字段
4. 如果是修改操作（designer_context 中已有节点），只生成增量 actions，不包含 clearForm/clearFlow
5. 审批人/抄送人的 `operateUsers` 用实际用户 ID（从 availableUsers 中匹配）
6. 权限默认: 发起=所有内部人员(staff+), 管理=总管理员, 查看=管理员+分管
7. 审批模式: `or`=或签(一人通过), `and`=会签(全部通过)

**响应格式 (SSE)** — 与现有 form-designer 端点一致:
```
data: {"type": "start", "session_id": "..."}
data: {"type": "chunk", "content": "正在分析您的需求..."}
data: {"type": "chunk", "content": "```json\n{\"preview\":..."}
data: {"type": "done", "session_id": "...", "full_content": "完整回复文本"}
```

**前端解析**: 从 `done` 消息的 `full_content` 中提取 JSON 代码块（```json...```），解析为 `{preview, actions}` 对象。与现有 ai-form-assistant.js 的解析方式一致。

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
    {"type": "approver", "config": {"approver": "role", "mode": "or", "emptyAction": "pass"}, "name": "分管审批"},
    {"type": "conditionBranch", "conditions": [
      {"name": "大额预算", "condition": "预算金额 > 5000", "priority": 1, "nodes": [
        {"type": "approver", "config": {"approver": "role", "mode": "or"}, "name": "总管审批"}
      ]},
      {"name": "其他", "condition": "", "priority": 2, "nodes": []}
    ]},
    {"type": "cc", "config": {"cc": "role"}, "name": "行政抄送"}
  ],
  "permissions": {
    "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
    "admin": {"type": "role", "roles": ["manage"]},
    "viewer": {"type": "role", "roles": ["manage", "part_manage"]}
  }
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
    {"type": "approver", "config": {"approver": "role", "mode": "or"}, "name": "分管审批"},
    {"type": "approver", "config": {"approver": "specified", "mode": "or"}, "name": "财务审批"},
    {"type": "conditionBranch", "conditions": [
      {"name": "大额报销", "condition": "报销金额 > 5000", "priority": 1, "nodes": [
        {"type": "approver", "config": {"approver": "role", "mode": "or"}, "name": "总管审批"}
      ]},
      {"name": "其他", "condition": "", "priority": 2, "nodes": []}
    ]},
    {"type": "cc", "config": {"cc": "role"}, "name": "行政抄送"}
  ],
  "permissions": {
    "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
    "admin": {"type": "role", "roles": ["manage"]},
    "viewer": {"type": "role", "roles": ["manage", "part_manage"]}
  }
}
```

### 5.3 请假申请
```json
{
  "name": "请假申请",
  "formFields": [
    {"type": "radio", "label": "请假类型", "options": ["事假","病假","年假","调休"], "required": true},
    {"type": "daterange", "label": "请假日期", "required": true},
    {"type": "number", "label": "请假天数", "required": true},
    {"type": "textarea", "label": "请假原因", "required": true}
  ],
  "flowNodes": [
    {"type": "approver", "config": {"approver": "manager", "mode": "or"}, "name": "直属主管审批"},
    {"type": "conditionBranch", "conditions": [
      {"name": "长假", "condition": "请假天数 > 3", "priority": 1, "nodes": [
        {"type": "approver", "config": {"approver": "role", "mode": "or"}, "name": "总管审批"}
      ]},
      {"name": "其他", "condition": "", "priority": 2, "nodes": []}
    ]}
  ],
  "permissions": {
    "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
    "admin": {"type": "role", "roles": ["manage"]},
    "viewer": {"type": "role", "roles": ["manage"]}
  }
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
    {"type": "approver", "config": {"approver": "role", "mode": "or"}, "name": "分管审批"},
    {"type": "conditionBranch", "conditions": [
      {"name": "大额采购", "condition": "总价 > 2000", "priority": 1, "nodes": [
        {"type": "approver", "config": {"approver": "role", "mode": "or"}, "name": "总管审批"}
      ]},
      {"name": "其他", "condition": "", "priority": 2, "nodes": []}
    ]},
    {"type": "cc", "config": {"cc": "specified"}, "name": "财务抄送"}
  ],
  "permissions": {
    "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
    "admin": {"type": "role", "roles": ["manage"]},
    "viewer": {"type": "role", "roles": ["manage", "part_manage"]}
  }
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
    {"type": "approver", "config": {"approver": "selfSelect", "mode": "or"}, "name": "自选审批人"}
  ],
  "permissions": {
    "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
    "admin": {"type": "role", "roles": ["manage"]},
    "viewer": {"type": "role", "roles": ["manage"]}
  }
}
```

## 6. 实施前置条件

在开发 AI 助手之前，需要先扩展 `manage/index.vue`:

1. **审批人增加 `department` 选项** — 在审批人/抄送人的 select 中增加"按部门"选项
2. **权限 settings 结构扩展** — 从简单的粒度类型列表改为 `{type, roles, deptIds, userIds}` 结构
3. **权限 UI 扩展** — 每个权限项支持选择具体的角色/部门/人员（对接 `/system/user/list`、`/system/dept/list`、`/system/role/list`）

## 7. 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `frontend/scripts/ai-approval-assistant.js` | 新建 | 前端 AI 助手核心 |
| `pomelox_qwen_ai/core/approval_designer_routes.py` | 新建 | 后端 AI 生成接口 |
| `ruoyi-ui/src/views/system/manage/index.vue` | 修改 | 扩展 department 选项 + 权限 settings 结构 + AI 面板注入 hook |

## 8. 部署方式

与现有 `ai-form-assistant.js` 一致：
1. 本地开发 JS 文件
2. `jar uf` 注入到 JAR 包的 `BOOT-INF/classes/static/js/` 目录
3. 在 admin-web 的 `index.html` 中添加 `<script>` 标签
4. Python 后端接口部署到 AI 服务 (端口 8087)，Nginx `/ai/` 路由自动转发

## 9. E2E 验证（Playwright）

使用 Playwright 对审批全流程进行端到端测试。

### 9.1 测试环境

- Web 管理后台: `http://localhost:8099` (本地开发) 或 `http://106.14.165.234:8086` (测试服务器)
- 后端 API: `http://106.14.165.234:8085` (测试服务器)
- 登录账号: `admin` / `admin123`

### 9.2 测试场景

#### E2E-1: AI 创建审批模板

```
1. 登录管理后台
2. 导航到 流程管理 → 流程模板
3. 点击 "新建表单" 或 "+ 创建新表单"
4. 在 AI 面板输入: "创建一个活动审批模板，需要活动名称、日期、预算字段，
   先分管审批，预算超过5000需要总管审批，最后抄送行政"
5. 验证 AI 返回预览内容:
   - 表单字段: 活动名称(text) + 日期(datetime) + 预算(money)
   - 流程: 审批人(分管) → 条件(>5000 → 总管) → 抄送(行政)
6. 点击 "应用到画布"
7. 验证设计器:
   - 审批表单 Tab: 3 个组件已添加
   - 审批流程 Tab: 节点已渲染 (审批人 + 条件分支 + 抄送人)
8. 点击 "确定" 保存
9. 验证列表页出现新模板
```

#### E2E-2: AI 修改已有模板

```
1. 在流程模板列表点击 "修改" (已有报销模板)
2. 在 AI 面板输入: "在第一个审批人后面加一个财务审批节点"
3. 验证预览: 只显示增量变更 (新增1个审批人节点)
4. 点击 "应用到画布"
5. 验证审批流程 Tab: 新节点已插入到正确位置
6. 在 AI 面板输入: "撤销"
7. 验证节点恢复到修改前状态
```

#### E2E-3: 条件分支 + 字段自动推断

```
1. 新建模板
2. 在 AI 面板输入: "请假审批，请假超过3天需要总管审批"
3. 验证:
   - 表单自动包含 "请假天数" 字段 (AI 自动推断)
   - 流程包含条件分支 "请假天数 > 3"
```

#### E2E-4: 审批全流程 (Web管理后台 + 后端API)

```
1. 在管理后台创建审批模板并保存
2. 调用后端 API 发起审批:
   POST /app/progress/submit
   Body: { templateId, title, formData, urgency }
3. 调用查询接口验证审批已创建:
   GET /app/progress/list?userId=xxx
4. 调用审批操作接口:
   POST /app/progress/approve { instanceId, action: 'approve' }
5. 验证审批状态变更为已通过
6. 调用统计接口验证:
   GET /ai/approval/stats
```

#### E2E-5: 权限控制验证

```
1. 用 manage 角色登录 → 能看到流程管理菜单
2. 用 staff 角色登录 → 能看到流程管理菜单
3. 用 common 角色登录 → 不能看到流程管理菜单
4. 用 part_manage 登录 → 只能查看本校审批数据
```

### 9.3 测试文件

```
frontend/tests/
└── e2e/
    └── approval/
        ├── ai-create-template.spec.ts    # E2E-1
        ├── ai-modify-template.spec.ts    # E2E-2
        ├── ai-condition-infer.spec.ts    # E2E-3
        ├── approval-full-flow.spec.ts    # E2E-4
        └── approval-permissions.spec.ts  # E2E-5
```
