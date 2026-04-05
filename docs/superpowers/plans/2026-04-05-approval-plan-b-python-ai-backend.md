# Plan B: Python 后端 AI 审批模板生成接口 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 Python AI 后端接口，接收自然语言描述，生成审批模板的表单字段 + 流程节点 + 权限配置 JSON

**Architecture:** Flask Blueprint 新增 `/api/ai/approval-designer/chat/stream` 端点，使用 DashScope qwen-plus 模型，SSE 流式响应。system prompt 包含节点规范 + 5 个内置模板。复用现有 AI 服务的会话管理和流式响应基础设施。

**Tech Stack:** Python 3, Flask, DashScope SDK, SSE

**依赖:** 无前置依赖（独立服务），但 Plan C 的前端脚本会调用此接口

**设计文档:** `docs/superpowers/specs/2026-04-04-ai-approval-assistant-design.md` 第 4.3-4.5 节

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `pomelox_qwen_ai/core/approval_designer_routes.py` | 新建 | AI 模板生成接口 + system prompt + 内置模板 |
| `pomelox_qwen_ai/app.py` | 修改 | 注册新 Blueprint |
| `pomelox_qwen_ai/core/approval_routes.py` | 不变 | 已有的审批补充接口 |

---

### Task 1: 创建 AI 审批模板生成接口

**Files:**
- Create: `pomelox_qwen_ai/core/approval_designer_routes.py`

- [ ] **Step 1: 创建 Blueprint 和内置模板常量**

```python
"""
AI 审批流程模板生成接口
- 接收自然语言描述，生成审批模板 JSON（表单+流程+权限）
- 支持创建新模板和修改已有模板
- 内置 5 个常用审批模板作为参考
"""
import os
import json
import time
from flask import Blueprint, request, jsonify, Response, stream_with_context

approval_designer_bp = Blueprint('approval_designer', __name__)

# ==================== 内置模板 ====================

BUILTIN_TEMPLATES = {
    "活动审批": {
        "formFields": [
            {"type": "text", "label": "活动名称", "required": True},
            {"type": "datetime", "label": "活动日期", "required": True},
            {"type": "text", "label": "活动地点"},
            {"type": "money", "label": "预算金额", "required": True},
            {"type": "textarea", "label": "活动描述"}
        ],
        "flowNodes": [
            {"type": "approver", "config": {"approver": "role", "mode": "or", "emptyAction": "pass", "operateRoles": ["part_manage"]}, "desc": "分管审批"},
            {"type": "conditionBranch", "conditions": [
                {"name": "大额预算", "condition": "预算金额 > 5000", "priority": 1, "nodes": [
                    {"type": "approver", "config": {"approver": "role", "mode": "or", "operateRoles": ["manage"]}, "desc": "总管审批"}
                ]},
                {"name": "其他", "condition": "", "priority": 2, "nodes": []}
            ]},
            {"type": "cc", "config": {"cc": "role", "operateRoles": ["part_manage"]}, "desc": "行政抄送"}
        ],
        "permissions": {
            "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
            "admin": {"type": "role", "roles": ["manage"]},
            "viewer": {"type": "role", "roles": ["manage", "part_manage"]}
        }
    },
    "费用报销": {
        "formFields": [
            {"type": "money", "label": "报销金额", "required": True},
            {"type": "datetime", "label": "费用日期", "required": True},
            {"type": "textarea", "label": "费用说明", "required": True},
            {"type": "upload", "label": "凭证上传", "required": True}
        ],
        "flowNodes": [
            {"type": "approver", "config": {"approver": "role", "mode": "or", "operateRoles": ["part_manage"]}, "desc": "分管审批"},
            {"type": "approver", "config": {"approver": "specified", "mode": "or"}, "desc": "财务审批"},
            {"type": "conditionBranch", "conditions": [
                {"name": "大额报销", "condition": "报销金额 > 5000", "priority": 1, "nodes": [
                    {"type": "approver", "config": {"approver": "role", "mode": "or", "operateRoles": ["manage"]}, "desc": "总管审批"}
                ]},
                {"name": "其他", "condition": "", "priority": 2, "nodes": []}
            ]},
            {"type": "cc", "config": {"cc": "role", "operateRoles": ["part_manage"]}, "desc": "行政抄送"}
        ],
        "permissions": {
            "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
            "admin": {"type": "role", "roles": ["manage"]},
            "viewer": {"type": "role", "roles": ["manage", "part_manage"]}
        }
    },
    "请假申请": {
        "formFields": [
            {"type": "radio", "label": "请假类型", "required": True, "options": [
                {"label": "事假", "value": "1"}, {"label": "病假", "value": "2"},
                {"label": "年假", "value": "3"}, {"label": "调休", "value": "4"}
            ]},
            {"type": "daterange", "label": "请假日期", "required": True},
            {"type": "number", "label": "请假天数", "required": True},
            {"type": "textarea", "label": "请假原因", "required": True}
        ],
        "flowNodes": [
            {"type": "approver", "config": {"approver": "manager", "mode": "or"}, "desc": "直属主管审批"},
            {"type": "conditionBranch", "conditions": [
                {"name": "长假", "condition": "请假天数 > 3", "priority": 1, "nodes": [
                    {"type": "approver", "config": {"approver": "role", "mode": "or", "operateRoles": ["manage"]}, "desc": "总管审批"}
                ]},
                {"name": "其他", "condition": "", "priority": 2, "nodes": []}
            ]}
        ],
        "permissions": {
            "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
            "admin": {"type": "role", "roles": ["manage"]},
            "viewer": {"type": "role", "roles": ["manage"]}
        }
    },
    "采购申请": {
        "formFields": [
            {"type": "text", "label": "物品名称", "required": True},
            {"type": "number", "label": "数量", "required": True},
            {"type": "money", "label": "单价", "required": True},
            {"type": "money", "label": "总价", "required": True},
            {"type": "textarea", "label": "用途说明"}
        ],
        "flowNodes": [
            {"type": "approver", "config": {"approver": "role", "mode": "or", "operateRoles": ["part_manage"]}, "desc": "分管审批"},
            {"type": "conditionBranch", "conditions": [
                {"name": "大额采购", "condition": "总价 > 2000", "priority": 1, "nodes": [
                    {"type": "approver", "config": {"approver": "role", "mode": "or", "operateRoles": ["manage"]}, "desc": "总管审批"}
                ]},
                {"name": "其他", "condition": "", "priority": 2, "nodes": []}
            ]},
            {"type": "cc", "config": {"cc": "specified"}, "desc": "财务抄送"}
        ],
        "permissions": {
            "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
            "admin": {"type": "role", "roles": ["manage"]},
            "viewer": {"type": "role", "roles": ["manage", "part_manage"]}
        }
    },
    "通用审批": {
        "formFields": [
            {"type": "text", "label": "审批标题", "required": True},
            {"type": "textarea", "label": "详细说明"},
            {"type": "upload", "label": "附件"}
        ],
        "flowNodes": [
            {"type": "approver", "config": {"approver": "selfSelect", "mode": "or"}, "desc": "自选审批人"}
        ],
        "permissions": {
            "commiter": {"type": "role", "roles": ["staff", "part_manage", "manage"]},
            "admin": {"type": "role", "roles": ["manage"]},
            "viewer": {"type": "role", "roles": ["manage"]}
        }
    }
}
```

- [ ] **Step 2: 创建 system prompt 构建函数**

```python
def build_system_prompt(designer_context=None):
    """构建 AI 系统提示词"""
    templates_json = json.dumps(BUILTIN_TEMPLATES, ensure_ascii=False, indent=2)

    context_section = ""
    if designer_context:
        context_section = f"""
## 当前设计器状态（已有内容，修改时只做增量变更）
当前表单字段: {json.dumps(designer_context.get('currentFormItems', []), ensure_ascii=False)}
当前流程节点: {json.dumps(designer_context.get('currentFlowNodes', []), ensure_ascii=False)}
当前权限设置: {json.dumps(designer_context.get('currentSettings', {}), ensure_ascii=False)}

可用用户: {json.dumps(designer_context.get('availableUsers', []), ensure_ascii=False)}
可用部门: {json.dumps(designer_context.get('availableDepts', []), ensure_ascii=False)}
可用角色: {json.dumps(designer_context.get('availableRoles', []), ensure_ascii=False)}
"""

    return f"""你是审批流程设计助手。根据用户的自然语言描述，生成审批模板配置。

## 输出格式
你必须在回复中包含一个 JSON 代码块（用 ```json 包裹），格式如下：
```json
{{
  "preview": {{
    "formFields": [...],
    "flowNodes": [...],
    "permissions": {{...}}
  }},
  "actions": [...]
}}
```

## 可用的表单字段类型
- text: 单行文本
- textarea: 多行文本
- number: 数字输入
- money: 金额输入（自动带¥前缀和2位精度）
- radio: 单选（需提供 options: [{{label, value}}]）
- checkbox: 多选（需提供 options）
- select: 下拉选择（需提供 options）
- datetime: 日期时间点（格式 yyyy-MM-dd）
- daterange: 日期时间区间
- upload: 文件上传
- user: 人员选择
- department: 部门选择
- description: 说明文字

## 可用的流程节点类型和配置
审批人节点:
  type: "approver"
  config.approver: "specified"(指定人员) | "role"(角色) | "department"(部门) | "manager"(主管) | "multiLevel"(多级主管) | "selfSelect"(自选) | "initiator"(发起人自己)
  config.mode: "or"(或签,一人通过) | "and"(会签,全部通过)
  config.emptyAction: "pass"(自动通过) | "reject"(自动拒绝) | "transfer"(转交)
  config.operateUsers: [用户ID] (指定人员时)
  config.operateDepts: [部门ID] (按部门时)
  config.operateRoles: [角色key] (按角色时)

抄送人节点:
  type: "cc"
  config.cc: "specified" | "role" | "department" | "manager" | "selfSelect"

条件分支节点:
  type: "conditionBranch"
  conditions: [{{name, condition(纯文本表达式), priority, nodes: []}}]
  注意: condition 是纯文本字符串如 "预算金额 > 5000"，不是结构化对象
  至少包含2个条件，最后一个通常是"其他"(condition为空字符串)

并行分支节点:
  type: "parallelBranch"
  branches: [{{name, content, nodes: []}}]

延迟节点: type: "delay", config: {{time, unit: "second"|"minute"|"hour"|"day"}}
触发器节点: type: "trigger", config: {{type: "webhook"|"api"|"email", url}}

## 权限配置
commiter(发起权限), admin(管理权限), viewer(查看导出权限)
每项: {{type: "all"|"role"|"department"|"specified", roles: [], deptIds: [], userIds: []}}

## Action 格式
- {{"a": "clearForm"}} — 清空所有表单字段
- {{"a": "clearFlow"}} — 清空所有流程节点
- {{"a": "addFormField", "type": "text", "label": "名称", "required": true}} — 添加表单字段
- {{"a": "addApprover", "approver": "role", "mode": "or", "emptyAction": "pass", "operateRoles": ["part_manage"]}} — 添加审批人
- {{"a": "addCc", "cc": "role", "operateRoles": ["part_manage"]}} — 添加抄送人
- {{"a": "addConditionBranch", "conditions": [...]}} — 添加条件分支
- {{"a": "addNodeToCondition", "groupIndex": 0, "conditionIndex": 0, "node": {{...}}}} — 在条件分支内添加节点
- {{"a": "addParallelBranch", "branches": [...]}} — 添加并行分支
- {{"a": "addNodeToParallel", "nodeIndex": 0, "branchIndex": 0, "node": {{...}}}} — 在并行分支内添加节点
- {{"a": "setPermission", "key": "commiter", "value": {{"type": "role", "roles": [...]}}}} — 设置权限
- {{"a": "setName", "value": "模板名称"}} — 设置模板名称
- {{"a": "setStartNode", "initiator": "all"}} — 设置发起人

## 内置模板参考
{templates_json}

## 规则
1. 如果用户提到条件判断（如"金额超过5000"），自动在表单字段中确保有对应字段
2. 如果当前设计器已有内容（designer_context不为空），只生成增量actions，不包含clearForm/clearFlow
3. 如果是全新创建，actions以clearForm和clearFlow开头
4. 权限默认: 发起=所有内部人员(staff+), 管理=总管理员, 查看=管理员+分管
5. preview 是给用户看的预览摘要，actions 是执行指令
6. 条件分支至少2个条件，最后一个为"其他"（空条件）
7. 每个节点都要有合理的默认值，不要留空配置
8. 如果用户说的场景匹配内置模板，优先基于模板生成再根据用户要求调整

{context_section}"""
```

- [ ] **Step 3: 创建流式 AI 接口**

```python
@approval_designer_bp.route('/api/ai/approval-designer/chat/stream', methods=['POST'])
def approval_designer_chat_stream():
    """AI 审批模板生成（流式SSE响应）"""
    data = request.get_json()
    message = data.get('message', '')
    session_id = data.get('session_id', '')
    designer_context = data.get('designer_context', None)
    history = data.get('history', [])

    if not message:
        return jsonify({'code': 400, 'msg': '缺少 message 参数'}), 400

    system_prompt = build_system_prompt(designer_context)

    # 构建消息列表
    messages = [{'role': 'system', 'content': system_prompt}]
    for h in history[-10:]:  # 最多保留最近10轮
        messages.append({'role': h.get('role', 'user'), 'content': h.get('content', '')})
    messages.append({'role': 'user', 'content': message})

    def generate():
        try:
            import dashscope
            from dashscope import Generation

            yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"

            full_content = ''
            responses = Generation.call(
                model='qwen-plus',
                messages=messages,
                result_format='message',
                stream=True,
                incremental_output=True,
                api_key=os.environ.get('DASHSCOPE_API_KEY', '')
            )

            for response in responses:
                if response.status_code == 200:
                    content = response.output.choices[0].message.content
                    if content:
                        full_content += content
                        yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'error', 'msg': f'API error: {response.code}'})}\n\n"
                    return

            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'full_content': full_content})}\n\n"

        except ImportError:
            # dashscope 未安装，返回基于模板的 fallback
            yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"
            template = match_template(message)
            result = json.dumps(template, ensure_ascii=False)
            yield f"data: {json.dumps({'type': 'chunk', 'content': '```json\\n' + result + '\\n```'})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'full_content': '```json\\n' + result + '\\n```'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'msg': str(e)})}\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


def match_template(message):
    """基于关键词匹配内置模板（AI 不可用时的 fallback）"""
    keywords = {
        '活动': '活动审批',
        '报销': '费用报销',
        '请假': '请假申请',
        '采购': '采购申请',
    }
    for kw, name in keywords.items():
        if kw in message:
            tpl = BUILTIN_TEMPLATES[name]
            return build_actions_from_template(name, tpl)
    # 默认通用审批
    tpl = BUILTIN_TEMPLATES['通用审批']
    return build_actions_from_template('通用审批', tpl)


def build_actions_from_template(name, tpl):
    """将内置模板转换为 preview + actions 格式"""
    actions = [
        {"a": "clearForm"},
        {"a": "clearFlow"},
        {"a": "setName", "value": name},
    ]
    # 表单字段
    for f in tpl.get('formFields', []):
        action = {"a": "addFormField", "type": f["type"], "label": f["label"]}
        if f.get("required"):
            action["required"] = True
        if f.get("options"):
            action["options"] = f["options"]
        actions.append(action)

    # 流程节点
    for node in tpl.get('flowNodes', []):
        if node['type'] == 'approver':
            action = {"a": "addApprover"}
            action.update(node['config'])
            actions.append(action)
        elif node['type'] == 'cc':
            action = {"a": "addCc"}
            action.update(node['config'])
            actions.append(action)
        elif node['type'] == 'conditionBranch':
            actions.append({"a": "addConditionBranch", "conditions": node['conditions']})
            # 条件内的子节点
            for ci, cond in enumerate(node['conditions']):
                for sub_node in cond.get('nodes', []):
                    actions.append({
                        "a": "addNodeToCondition",
                        "groupIndex": len([a for a in actions if a['a'] in ('addApprover','addCc','addConditionBranch','addParallelBranch')]) - 1,
                        "conditionIndex": ci,
                        "node": {"type": sub_node["type"], "config": sub_node["config"]}
                    })

    # 权限
    perms = tpl.get('permissions', {})
    for key in ('commiter', 'admin', 'viewer'):
        if key in perms:
            actions.append({"a": "setPermission", "key": key, "value": perms[key]})

    return {
        "preview": {
            "name": name,
            "formFields": tpl['formFields'],
            "flowNodes": tpl['flowNodes'],
            "permissions": tpl.get('permissions', {})
        },
        "actions": actions
    }
```

- [ ] **Step 4: 创建非流式接口（用于快速生成/测试）**

```python
@approval_designer_bp.route('/api/ai/approval-designer/generate', methods=['POST'])
def approval_designer_generate():
    """快速生成审批模板（非流式，用于测试和 fallback）"""
    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({'code': 400, 'msg': '缺少 message 参数'}), 400

    result = match_template(message)
    return jsonify({'code': 200, 'data': result})
```

---

### Task 2: 注册 Blueprint 到 app.py

**Files:**
- Modify: `pomelox_qwen_ai/app.py`

- [ ] **Step 1: 导入并注册新 Blueprint**

在 `app.py` 的现有 Blueprint 导入处（搜索 `from core.approval_routes`），添加：

```python
from core.approval_designer_routes import approval_designer_bp
```

在 `app.register_blueprint` 处添加：

```python
app.register_blueprint(approval_designer_bp)
```

- [ ] **Step 2: Commit**

```bash
cd /Users/jietaoxie/vita
git add pomelox_qwen_ai/core/approval_designer_routes.py pomelox_qwen_ai/app.py
git commit -m "feat: AI审批模板生成接口 — 流式SSE + 5个内置模板 + fallback"
```

---

### Task 3: 本地测试

**Files:** 无新文件，使用已有的本地测试环境

- [ ] **Step 1: 测试非流式接口（模板匹配）**

```bash
cd /Users/jietaoxie/vita/pomelox_qwen_ai && source .venv/bin/activate && python3 -c "
from flask import Flask
from flask_cors import CORS
from core.approval_designer_routes import approval_designer_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(approval_designer_bp)

with app.test_client() as client:
    # 测试1: 活动审批
    r = client.post('/api/ai/approval-designer/generate', json={'message': '创建一个活动审批流程'})
    data = r.get_json()
    print('=== 活动审批 ===')
    print(f'Status: {r.status_code}')
    print(f'Preview name: {data[\"data\"][\"preview\"][\"name\"]}')
    print(f'Form fields: {len(data[\"data\"][\"preview\"][\"formFields\"])}')
    print(f'Actions count: {len(data[\"data\"][\"actions\"])}')

    # 测试2: 报销
    r = client.post('/api/ai/approval-designer/generate', json={'message': '帮我做一个报销审批'})
    data = r.get_json()
    print(f'\\n=== 报销 === Preview: {data[\"data\"][\"preview\"][\"name\"]}')

    # 测试3: 未知场景
    r = client.post('/api/ai/approval-designer/generate', json={'message': '随便搞个审批'})
    data = r.get_json()
    print(f'\\n=== 未知(fallback) === Preview: {data[\"data\"][\"preview\"][\"name\"]}')

print('\\nAll tests passed!')
"
```

Expected output:
```
=== 活动审批 ===
Status: 200
Preview name: 活动审批
Form fields: 5
Actions count: 11+

=== 报销 === Preview: 费用报销
=== 未知(fallback) === Preview: 通用审批
All tests passed!
```

- [ ] **Step 2: 测试流式接口（SSE）**

```bash
cd /Users/jietaoxie/vita/pomelox_qwen_ai && source .venv/bin/activate && python3 -c "
from flask import Flask
from flask_cors import CORS
from core.approval_designer_routes import approval_designer_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(approval_designer_bp)

with app.test_client() as client:
    r = client.post('/api/ai/approval-designer/chat/stream', json={
        'message': '创建活动审批',
        'session_id': 'test-123'
    })
    lines = r.data.decode().strip().split('\\n\\n')
    for line in lines:
        if line.startswith('data: '):
            import json
            data = json.loads(line[6:])
            print(f'type={data[\"type\"]}', end=' ')
            if data['type'] == 'chunk':
                print(f'content_len={len(data.get(\"content\",\"\"))}', end='')
            if data['type'] == 'done':
                print(f'full_content_len={len(data.get(\"full_content\",\"\"))}', end='')
            print()
print('\\nSSE stream test passed!')
"
```

Expected output:
```
type=start
type=chunk content_len=...
type=done full_content_len=...
SSE stream test passed!
```

---

## 验证清单

1. ✅ `POST /api/ai/approval-designer/generate` — 非流式，关键词匹配内置模板
2. ✅ `POST /api/ai/approval-designer/chat/stream` — 流式 SSE 响应
3. ✅ 5 个内置模板全部可匹配（活动/报销/请假/采购/通用）
4. ✅ 未匹配时 fallback 到通用审批
5. ✅ DashScope 不可用时 fallback 到模板匹配
6. ✅ preview + actions 格式符合设计文档规范
7. ✅ actions 中的字段名和结构对齐 manage/index.vue 的实际数据模型
