# Plan C: AI 审批流程配置助手前端注入脚本 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 `ai-approval-assistant.js`，注入到 RuoYi 管理后台的流程模板设计器 dialog 中，在底部提供 AI 对话面板，支持自然语言创建和修改审批模板

**Architecture:** 独立 JS 文件（IIFE），通过 `<script>` 标签注入。检测流程设计器 dialog 打开 → 在底部注入 AI 面板 → 获取 Vue 实例 → 调用 Python AI 后端 → 解析返回的 actions → 预览确认 → 执行操作。复用 ai-form-assistant.js 的 SSE 解析、Auth、历史管理等基础设施模式。

**Tech Stack:** 原生 JS (ES6+)，无框架依赖

**依赖:** Plan A (UI 扩展) + Plan B (Python AI 接口)

**设计文档:** `docs/superpowers/specs/2026-04-04-ai-approval-assistant-design.md` 第 3-4 节

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `frontend/scripts/ai-approval-assistant.js` | 新建 | AI 审批助手完整实现 |

---

### Task 1: 创建核心框架 — IIFE + 配置 + Auth + 初始化

**Files:**
- Create: `frontend/scripts/ai-approval-assistant.js`

- [ ] **Step 1: IIFE 入口 + 配置常量 + Auth**

```javascript
(function() {
  'use strict';

  // ==================== 配置 ====================
  const AI_API_URL = '/ai/api/ai/approval-designer/chat/stream';
  const AI_GENERATE_URL = '/ai/api/ai/approval-designer/generate';
  const STORAGE_KEY = 'ai_approval_conversations';
  const STORAGE_VERSION_KEY = 'ai_approval_schema_version';
  const MAX_CONVERSATIONS = 30;
  const MAX_STORAGE_BYTES = 3 * 1024 * 1024;

  // ==================== 全局状态 ====================
  let vueInstance = null;
  let panelInjected = false;
  let currentSessionId = '';
  let allConversations = [];
  let currentConversationId = null;
  let isGenerating = false;
  let lastSnapshot = null;

  // ==================== Auth ====================
  function getAuthToken() {
    var m = document.cookie.match(/(?:^|;\s*)Admin-Token=([^;]+)/);
    if (m) return m[1];
    try {
      return localStorage.getItem('Admin-Token') || localStorage.getItem('token') || '';
    } catch(e) { return ''; }
  }

  function buildAuthHeaders() {
    var token = getAuthToken();
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
  }

  // ==================== 初始化 ====================
  function init() {
    loadConversations();
    // 监听 dialog 打开（MutationObserver）
    observeDialogOpen();
    console.log('[AI审批助手] 初始化完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 2: Commit 骨架**

```bash
cd /Users/jietaoxie/vita
git add frontend/scripts/ai-approval-assistant.js
git commit -m "feat: ai-approval-assistant.js 骨架 — IIFE+配置+Auth+初始化"
```

---

### Task 2: Dialog 检测 + 面板注入

- [ ] **Step 1: MutationObserver 检测 dialog 打开**

在 IIFE 内添加：

```javascript
  function observeDialogOpen() {
    const observer = new MutationObserver(function(mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            // 检测流程设计器 dialog
            const dialog = node.querySelector ? node.querySelector('.process-design-dialog') || 
              (node.classList && node.classList.contains('el-dialog__wrapper') ? node : null) : null;
            if (dialog) {
              setTimeout(() => tryInjectPanel(), 500);
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 也用定时器兜底（dialog 可能已经在 DOM 中）
    setInterval(() => {
      const dialog = document.querySelector('.process-design-dialog .el-dialog');
      if (dialog && !panelInjected) {
        tryInjectPanel();
      }
      if (!document.querySelector('.process-design-dialog') && panelInjected) {
        panelInjected = false;
        vueInstance = null;
      }
    }, 2000);
  }

  function tryInjectPanel() {
    if (panelInjected) return;
    const dialog = document.querySelector('.process-design-dialog .el-dialog');
    if (!dialog) return;

    // 获取 Vue 实例
    vueInstance = findVueInstance(dialog);
    if (!vueInstance || !vueInstance.flowNodes) {
      console.log('[AI审批助手] 未找到流程设计器 Vue 实例');
      return;
    }

    injectAIPanel(dialog);
    panelInjected = true;
    console.log('[AI审批助手] 面板注入成功');
  }
```

- [ ] **Step 2: Vue 实例检测**

```javascript
  function findVueInstance(dialogEl) {
    // 策略1: 从 dialog 元素向上找
    let el = dialogEl;
    while (el) {
      if (el.__vue__) {
        const vm = el.__vue__;
        if (isApprovalDesigner(vm)) return vm;
        // 遍历 $parent
        let parent = vm.$parent;
        let depth = 0;
        while (parent && depth < 15) {
          if (isApprovalDesigner(parent)) return parent;
          parent = parent.$parent;
          depth++;
        }
      }
      el = el.parentElement;
    }

    // 策略2: 从 #app 根递归 $children
    const appEl = document.getElementById('app');
    if (appEl && appEl.__vue__) {
      return findInChildren(appEl.__vue__.$root);
    }
    return null;
  }

  function findInChildren(vm) {
    if (isApprovalDesigner(vm)) return vm;
    if (vm.$children) {
      for (const child of vm.$children) {
        const found = findInChildren(child);
        if (found) return found;
      }
    }
    return null;
  }

  function isApprovalDesigner(vm) {
    return vm && vm.flowNodes !== undefined && vm.form && vm.form.formItems !== undefined;
  }
```

- [ ] **Step 3: Commit**

```bash
git add frontend/scripts/ai-approval-assistant.js
git commit -m "feat: dialog检测 + Vue实例查找 + MutationObserver"
```

---

### Task 3: AI 面板 UI 注入

- [ ] **Step 1: 创建底部面板 DOM**

```javascript
  function injectAIPanel(dialog) {
    // 在 dialog footer 之前插入 AI 面板
    const footer = dialog.querySelector('.el-dialog__footer');
    if (!footer) return;

    const panel = document.createElement('div');
    panel.id = 'aiApprovalPanel';
    panel.innerHTML = `
      <div class="ai-approval-header" id="aiApprovalToggle">
        <span>🤖 AI 审批助手</span>
        <span class="ai-approval-toggle-btn">▼ 展开</span>
      </div>
      <div class="ai-approval-body" id="aiApprovalBody" style="display:none;">
        <div class="ai-approval-messages" id="aiApprovalMessages"></div>
        <div class="ai-approval-input-area">
          <textarea id="aiApprovalInput" placeholder="描述你想要的审批流程... 例如：创建活动审批，先分管审批，预算超过5000需要总管审批" rows="2"></textarea>
          <button id="aiApprovalSend" class="el-button el-button--primary el-button--small">发送</button>
        </div>
      </div>
    `;

    // 注入样式
    if (!document.getElementById('aiApprovalStyles')) {
      const style = document.createElement('style');
      style.id = 'aiApprovalStyles';
      style.textContent = getStyles();
      document.head.appendChild(style);
    }

    footer.parentNode.insertBefore(panel, footer);

    // 绑定事件
    document.getElementById('aiApprovalToggle').addEventListener('click', togglePanel);
    document.getElementById('aiApprovalSend').addEventListener('click', sendMessage);
    document.getElementById('aiApprovalInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  function togglePanel() {
    const body = document.getElementById('aiApprovalBody');
    const btn = document.querySelector('.ai-approval-toggle-btn');
    if (body.style.display === 'none') {
      body.style.display = 'block';
      btn.textContent = '▲ 收起';
    } else {
      body.style.display = 'none';
      btn.textContent = '▼ 展开';
    }
  }

  function getStyles() {
    return `
      #aiApprovalPanel { border-top: 1px solid #ebeef5; margin: 0 -20px; padding: 0 20px; }
      .ai-approval-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; cursor: pointer; color: #409EFF; font-size: 14px; font-weight: 500; }
      .ai-approval-header:hover { color: #66b1ff; }
      .ai-approval-toggle-btn { font-size: 12px; color: #909399; }
      .ai-approval-body { max-height: 300px; display: flex; flex-direction: column; }
      .ai-approval-messages { flex: 1; overflow-y: auto; max-height: 200px; padding: 8px 0; }
      .ai-approval-msg { margin: 6px 0; padding: 8px 12px; border-radius: 8px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
      .ai-approval-msg.user { background: #ecf5ff; color: #409EFF; margin-left: 40px; text-align: right; }
      .ai-approval-msg.bot { background: #f5f7fa; color: #303133; margin-right: 40px; }
      .ai-approval-msg.preview { background: #f0f9eb; border: 1px solid #e1f3d8; }
      .ai-approval-actions { display: flex; gap: 8px; margin-top: 8px; }
      .ai-approval-actions button { font-size: 12px; padding: 4px 12px; border-radius: 4px; border: none; cursor: pointer; }
      .ai-approval-actions .apply-btn { background: #67c23a; color: white; }
      .ai-approval-actions .apply-btn:hover { background: #85ce61; }
      .ai-approval-actions .retry-btn { background: #e6a23c; color: white; }
      .ai-approval-actions .retry-btn:hover { background: #ebb563; }
      .ai-approval-actions .undo-btn { background: #f56c6c; color: white; }
      .ai-approval-actions .undo-btn:hover { background: #f78989; }
      .ai-approval-input-area { display: flex; gap: 8px; padding: 8px 0; align-items: flex-end; }
      .ai-approval-input-area textarea { flex: 1; border: 1px solid #dcdfe6; border-radius: 4px; padding: 6px 10px; font-size: 13px; resize: none; outline: none; }
      .ai-approval-input-area textarea:focus { border-color: #409EFF; }
      .ai-approval-loading { color: #909399; font-style: italic; }
    `;
  }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/scripts/ai-approval-assistant.js
git commit -m "feat: AI面板DOM注入 + 样式 + 事件绑定"
```

---

### Task 4: 消息发送 + SSE 解析 + 预览渲染

- [ ] **Step 1: sendMessage 函数**

```javascript
  function sendMessage() {
    const input = document.getElementById('aiApprovalInput');
    const message = (input.value || '').trim();
    if (!message || isGenerating) return;

    input.value = '';
    appendMessage('user', message);
    isGenerating = true;

    // 构建 designer_context
    const context = buildDesignerContext();

    // 获取对话历史
    const history = getCurrentMessages().map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    appendMessage('bot', '正在分析...', 'loading');

    // 调用 AI 接口
    callAI(message, context, history);
  }

  function buildDesignerContext() {
    if (!vueInstance) return null;
    return {
      currentFormItems: JSON.parse(JSON.stringify(vueInstance.form.formItems || [])),
      currentFlowNodes: JSON.parse(JSON.stringify(vueInstance.flowNodes || [])),
      startNodeConfig: JSON.parse(JSON.stringify(vueInstance.startNodeConfig || {})),
      currentSettings: JSON.parse(JSON.stringify(vueInstance.form.settings || {}))
    };
  }
```

- [ ] **Step 2: SSE 流式调用**

```javascript
  async function callAI(message, context, history) {
    try {
      const resp = await fetch(AI_API_URL, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          message: message,
          session_id: currentSessionId || ('approval_' + Date.now()),
          designer_context: context,
          history: history
        })
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(trimmed.slice(5).trim());
            if (evt.type === 'chunk' && evt.content) {
              fullContent += evt.content;
              updateLoadingMessage('正在生成...');
            }
            if (evt.type === 'done') {
              fullContent = evt.full_content || fullContent;
            }
            if (evt.type === 'error') {
              removeLoadingMessage();
              appendMessage('bot', '❌ 生成失败: ' + (evt.msg || '未知错误'));
              isGenerating = false;
              return;
            }
          } catch(e) { /* 忽略解析错误 */ }
        }
      }

      // 解析完成，提取 JSON
      removeLoadingMessage();
      isGenerating = false;
      handleAIResponse(fullContent, message);

    } catch(e) {
      removeLoadingMessage();
      isGenerating = false;
      appendMessage('bot', '❌ 请求失败: ' + e.message);
    }
  }
```

- [ ] **Step 3: 解析 AI 响应并渲染预览**

```javascript
  function handleAIResponse(fullContent, originalMessage) {
    // 尝试从 ```json ``` 代码块中提取 JSON
    let result = null;
    const jsonMatch = fullContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try { result = JSON.parse(jsonMatch[1]); } catch(e) { /* */ }
    }
    if (!result) {
      try { result = JSON.parse(fullContent); } catch(e) { /* */ }
    }

    if (!result || !result.actions) {
      // 非结构化回复，直接显示文字
      appendMessage('bot', fullContent);
      saveCurrentConversation();
      return;
    }

    // 渲染预览
    renderPreview(result);
    saveCurrentConversation();
  }

  function renderPreview(result) {
    const preview = result.preview || {};
    const actions = result.actions || [];

    let html = '<div class="ai-approval-msg bot preview">';
    html += '<strong>🤖 将生成以下配置：</strong><br/>';

    // 表单字段预览
    const fields = preview.formFields || [];
    if (fields.length > 0) {
      html += '📋 <strong>表单:</strong> ' + fields.map(f => f.label + '(' + f.type + ')').join(' + ') + '<br/>';
    }

    // 流程节点预览
    const nodes = preview.flowNodes || [];
    if (nodes.length > 0) {
      html += '🔄 <strong>流程:</strong> 发起人';
      for (const n of nodes) {
        if (n.type === 'approver') html += ' → ' + (n.desc || '审批人');
        else if (n.type === 'cc') html += ' → ' + (n.desc || '抄送人');
        else if (n.type === 'conditionBranch') {
          const conds = n.conditions || [];
          html += ' → [' + conds.map(c => c.name).join('/') + ']';
        }
        else if (n.type === 'parallelBranch') html += ' → ⫝并行⫝';
      }
      html += '<br/>';
    }

    // 权限预览
    const perms = preview.permissions || {};
    if (perms.commiter) {
      html += '🔐 <strong>权限:</strong> 发起=' + formatPermission(perms.commiter);
      if (perms.admin) html += ', 管理=' + formatPermission(perms.admin);
      html += '<br/>';
    }

    html += '<div class="ai-approval-actions">';
    html += '<button class="apply-btn" onclick="window._aiApprovalApply()">✅ 应用到画布</button>';
    html += '<button class="retry-btn" onclick="window._aiApprovalRetry()">🔄 重新生成</button>';
    html += '</div></div>';

    const messagesDiv = document.getElementById('aiApprovalMessages');
    messagesDiv.insertAdjacentHTML('beforeend', html);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // 保存待执行的 actions
    window._pendingApprovalActions = actions;
    window._pendingApprovalMessage = '';
    window._aiApprovalApply = function() { executeApprovalActions(actions); };
    window._aiApprovalRetry = function() { sendMessage(); };
  }

  function formatPermission(perm) {
    if (perm.type === 'all') return '所有人';
    if (perm.type === 'role' && perm.roles) return perm.roles.join(',');
    if (perm.type === 'department') return '指定部门';
    if (perm.type === 'specified') return '指定人员';
    return '默认';
  }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/scripts/ai-approval-assistant.js
git commit -m "feat: AI消息发送 + SSE解析 + 预览渲染"
```

---

### Task 5: Action 执行引擎 + 快照撤销

- [ ] **Step 1: 执行引擎**

```javascript
  function executeApprovalActions(actions) {
    if (!vueInstance) {
      appendMessage('bot', '❌ 未找到设计器实例，请重新打开设计器');
      return;
    }

    // 保存快照用于撤销
    lastSnapshot = {
      formItems: JSON.parse(JSON.stringify(vueInstance.form.formItems || [])),
      flowNodes: JSON.parse(JSON.stringify(vueInstance.flowNodes || [])),
      settings: JSON.parse(JSON.stringify(vueInstance.form.settings || {})),
      startNodeConfig: JSON.parse(JSON.stringify(vueInstance.startNodeConfig || {})),
      name: vueInstance.form.name || ''
    };

    let completed = 0;
    for (const action of actions) {
      try {
        execAction(vueInstance, action);
        completed++;
      } catch(e) {
        console.warn('[AI审批助手] Action 执行失败:', action, e);
      }
    }

    vueInstance.$forceUpdate();

    // 显示结果 + 撤销按钮
    let html = '<div class="ai-approval-msg bot">';
    html += '✅ 已应用 ' + completed + '/' + actions.length + ' 项操作';
    html += '<div class="ai-approval-actions">';
    html += '<button class="undo-btn" onclick="window._aiApprovalUndo()">↩ 撤销</button>';
    html += '</div></div>';

    const messagesDiv = document.getElementById('aiApprovalMessages');
    messagesDiv.insertAdjacentHTML('beforeend', html);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    window._aiApprovalUndo = function() { undoActions(); };
  }

  function execAction(vm, action) {
    const a = action.a;

    switch(a) {
      case 'clearForm':
        vm.form.formItems = [];
        break;

      case 'clearFlow':
        vm.flowNodes = [];
        break;

      case 'setName':
        vm.form.name = action.value || '';
        break;

      case 'setStartNode':
        vm.startNodeConfig.initiator = action.initiator || 'all';
        break;

      case 'addFormField': {
        const item = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          type: action.type,
          label: action.label,
          field: (action.label || '').replace(/\s+/g, '_').toLowerCase(),
          required: action.required || false,
          placeholder: action.placeholder || ('请输入' + (action.label || '')),
          options: action.options || []
        };
        if (action.type === 'money') item.precision = 2;
        if (['datetime','daterange'].includes(action.type)) item.format = 'yyyy-MM-dd';
        if (action.type === 'description') { item.description = ''; item.style = 'normal'; }
        if (['select','radio','checkbox'].includes(action.type) && item.options.length === 0) {
          item.options = [{label:'选项1',value:'1'},{label:'选项2',value:'2'}];
        }
        vm.form.formItems.push(item);
        break;
      }

      case 'removeFormField':
        if (action.index >= 0 && action.index < vm.form.formItems.length) {
          vm.form.formItems.splice(action.index, 1);
        }
        break;

      case 'addApprover': {
        const node = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          type: 'approver',
          config: {
            approver: action.approver || 'specified',
            mode: action.mode || 'or',
            emptyAction: action.emptyAction || 'pass',
            operateUsers: action.operateUsers || [],
            operateDepts: action.operateDepts || [],
            operateRoles: action.operateRoles || []
          }
        };
        insertNode(vm, action.afterIndex, node);
        break;
      }

      case 'addCc': {
        const node = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          type: 'cc',
          config: {
            cc: action.cc || 'specified',
            operateUsers: action.operateUsers || [],
            operateDepts: action.operateDepts || [],
            operateRoles: action.operateRoles || []
          }
        };
        insertNode(vm, action.afterIndex, node);
        break;
      }

      case 'addDelay': {
        const node = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          type: 'delay',
          config: { time: action.time || 1, unit: action.unit || 'minute' }
        };
        insertNode(vm, null, node);
        break;
      }

      case 'addTrigger': {
        const node = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          type: 'trigger',
          config: { type: action.type || 'webhook', url: action.url || '' }
        };
        insertNode(vm, null, node);
        break;
      }

      case 'removeNode':
        if (action.index >= 0 && action.index < vm.flowNodes.length) {
          vm.flowNodes.splice(action.index, 1);
        }
        break;

      case 'addConditionBranch': {
        const conditions = (action.conditions || []).map((c, i) => ({
          id: Date.now() + i,
          name: c.name || ('条件' + (i+1)),
          condition: c.condition || '',
          priority: c.priority || (i+1),
          nodes: []
        }));
        if (conditions.length < 2) {
          conditions.push({id: Date.now()+99, name:'其他', condition:'', priority: conditions.length+1, nodes:[]});
        }
        vm.flowNodes.push({id: Date.now(), type: 'conditionBranch', conditions: conditions});
        break;
      }

      case 'addNodeToCondition': {
        const branch = vm.flowNodes[action.groupIndex];
        if (branch && branch.type === 'conditionBranch' && branch.conditions[action.conditionIndex]) {
          const subNode = Object.assign({id: Date.now() + Math.floor(Math.random() * 10000)}, action.node);
          branch.conditions[action.conditionIndex].nodes.push(subNode);
        }
        break;
      }

      case 'addParallelBranch': {
        const branches = (action.branches || []).map((b, i) => ({
          id: Date.now() + i,
          name: b.name || ('分支' + (i+1)),
          content: b.content || '',
          nodes: []
        }));
        if (branches.length < 2) {
          branches.push({id: Date.now()+99, name:'分支2', content:'', nodes:[]});
        }
        vm.flowNodes.push({id: Date.now(), type: 'parallelBranch', branches: branches});
        break;
      }

      case 'addNodeToParallel': {
        const pBranch = vm.flowNodes[action.nodeIndex];
        if (pBranch && pBranch.type === 'parallelBranch' && pBranch.branches[action.branchIndex]) {
          const subNode = Object.assign({id: Date.now() + Math.floor(Math.random() * 10000)}, action.node);
          pBranch.branches[action.branchIndex].nodes.push(subNode);
        }
        break;
      }

      case 'setPermission':
        if (action.key && vm.form.settings) {
          vm.form.settings[action.key] = action.value;
        }
        break;

      default:
        console.warn('[AI审批助手] 未知 action:', a);
    }
  }

  function insertNode(vm, afterIndex, node) {
    if (afterIndex !== null && afterIndex !== undefined && afterIndex >= 0) {
      vm.flowNodes.splice(afterIndex + 1, 0, node);
    } else {
      vm.flowNodes.push(node);
    }
  }

  function undoActions() {
    if (!lastSnapshot || !vueInstance) {
      appendMessage('bot', '❌ 无法撤销');
      return;
    }
    vueInstance.form.formItems = lastSnapshot.formItems;
    vueInstance.flowNodes = lastSnapshot.flowNodes;
    Object.assign(vueInstance.form.settings, lastSnapshot.settings);
    Object.assign(vueInstance.startNodeConfig, lastSnapshot.startNodeConfig);
    if (lastSnapshot.name) vueInstance.form.name = lastSnapshot.name;
    vueInstance.$forceUpdate();
    lastSnapshot = null;
    appendMessage('bot', '↩ 已撤销到上一步状态');
  }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/scripts/ai-approval-assistant.js
git commit -m "feat: Action执行引擎(16种action) + 快照撤销"
```

---

### Task 6: 消息 UI 辅助函数 + 对话历史

- [ ] **Step 1: 消息渲染辅助函数**

```javascript
  function appendMessage(role, text, type) {
    const messagesDiv = document.getElementById('aiApprovalMessages');
    if (!messagesDiv) return;
    const div = document.createElement('div');
    div.className = 'ai-approval-msg ' + role + (type === 'loading' ? ' ai-approval-loading' : '');
    if (type === 'loading') div.id = 'aiApprovalLoading';
    div.textContent = text;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // 保存到当前对话
    if (type !== 'loading') {
      getCurrentConversation().messages.push({ role: role, text: text });
    }
  }

  function updateLoadingMessage(text) {
    const el = document.getElementById('aiApprovalLoading');
    if (el) el.textContent = text;
  }

  function removeLoadingMessage() {
    const el = document.getElementById('aiApprovalLoading');
    if (el) el.remove();
  }
```

- [ ] **Step 2: 对话历史管理**

```javascript
  function loadConversations() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      allConversations = stored ? JSON.parse(stored) : [];
    } catch(e) {
      allConversations = [];
    }
  }

  function saveConversations() {
    if (allConversations.length > MAX_CONVERSATIONS) {
      allConversations = allConversations.slice(-MAX_CONVERSATIONS);
    }
    let json = JSON.stringify(allConversations);
    while (json.length > MAX_STORAGE_BYTES && allConversations.length > 1) {
      allConversations.shift();
      json = JSON.stringify(allConversations);
    }
    try { localStorage.setItem(STORAGE_KEY, json); } catch(e) { /* quota exceeded */ }
  }

  function getCurrentConversation() {
    if (!currentConversationId) {
      currentConversationId = 'approval_' + Date.now();
      currentSessionId = currentConversationId;
      allConversations.push({
        id: currentConversationId,
        title: '审批模板配置',
        timestamp: Date.now(),
        messages: []
      });
    }
    return allConversations.find(c => c.id === currentConversationId) || allConversations[allConversations.length - 1];
  }

  function getCurrentMessages() {
    const conv = getCurrentConversation();
    return conv ? conv.messages : [];
  }

  function saveCurrentConversation() {
    saveConversations();
  }
```

- [ ] **Step 3: Commit**

```bash
git add frontend/scripts/ai-approval-assistant.js
git commit -m "feat: 消息渲染 + 对话历史管理(localStorage)"
```

---

### Task 7: 集成测试

- [ ] **Step 1: 在本地 dev server 中注入脚本**

在 `ruoyi-ui/public/index.html` 末尾（`</body>` 之前）添加：

```html
<script src="/static/js/ai-approval-assistant.js"></script>
```

然后将 `ai-approval-assistant.js` 复制到 `ruoyi-ui/public/static/js/` 目录。

- [ ] **Step 2: 手动测试**

1. 刷新浏览器 `http://localhost:8099`
2. 进入 流程管理 → 流程模板 → 点击新增
3. 在 dialog 底部应该出现 "🤖 AI 审批助手" 面板
4. 点击展开 → 输入 "创建活动审批" → 发送
5. 验证预览内容（表单字段 + 流程 + 权限）
6. 点击 "应用到画布"
7. 切换到审批表单 Tab → 验证组件已添加
8. 切换到审批流程 Tab → 验证节点已添加
9. 点击 "撤销" → 验证恢复原状

- [ ] **Step 3: Commit**

```bash
git add frontend/scripts/ai-approval-assistant.js ruoyi-ui/public/static/js/ ruoyi-ui/public/index.html
git commit -m "feat: ai-approval-assistant.js 完成 + 集成到dev server"
```

---

## 验证清单

1. ✅ dialog 打开时自动检测并注入 AI 面板
2. ✅ dialog 关闭时清理状态
3. ✅ 输入描述 → SSE 流式响应 → 预览渲染
4. ✅ 预览显示表单字段 + 流程节点 + 权限
5. ✅ 点击"应用到画布" → 16 种 action 正确执行
6. ✅ 点击"撤销" → 恢复快照
7. ✅ 对话历史 localStorage 持久化
8. ✅ DashScope 不可用时 fallback 到模板匹配
9. ✅ 增量修改（已有内容时不清空）
