/**
 * AI Form Assistant for PomeloX Admin Backend Form Designer
 *
 * Injected via <script> tag in admin-web/index.html
 * Detects form designer page, creates floating AI chat UI,
 * and bridges with Vue instance to control the real form designer.
 */
(function() {
  'use strict';

  // ===== Configuration =====
  const AI_API_URL = 'https://www.vitaglobal.icu/ai/api/ai/chat/stream';
  const AI_FORM_DESIGNER_URL = 'https://www.vitaglobal.icu/ai/api/ai/form-designer/chat/stream';
  const AI_DEPT_ID = 211;
  const AI_MODEL = 'qwen-plus';
  const MAX_PROMPT_CHARS = 20000; // ~5000 tokens budget for system prompt (increased for comprehensive forms)

  // ===== Auth Helper =====
  function getAuthToken() {
    // RuoYi admin stores JWT in cookie and localStorage as 'Admin-Token'
    var m = document.cookie.match(/(?:^|;\s*)Admin-Token=([^;]+)/);
    if (m) return m[1];
    try { return localStorage.getItem('Admin-Token') || localStorage.getItem('token') || ''; } catch(e) { return ''; }
  }

  function buildAuthHeaders() {
    var token = getAuthToken();
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
  }

  // ===== State =====
  let aiSessionId = null;
  let aiIsTyping = false;
  let aiAbortController = null;
  let aiChatHistory = [];
  let vueInstance = null;
  let isDesignerPage = false;
  let uiInjected = false;
  let pendingImage = null; // { base64, name, type, preview }

  // ===== Chat History Management =====
  let allConversations = []; // Array of { id, title, timestamp, summary?, summaryMsgCount?, messages[] }
  let currentConversationId = null;
  let historyPanelOpen = false;
  let currentSummary = null;       // Compressed summary of old messages
  let currentSummaryMsgCount = 0;  // Number of messages already summarized

  const STORAGE_SCHEMA_VERSION = 2; // Bump when changing conversation data structure

  function loadConversations() {
    try {
      const stored = localStorage.getItem('ai_form_conversations');
      if (!stored) { allConversations = []; return; }
      var parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) { allConversations = []; return; }
      // Migrate schema if needed
      var storedVersion = parseInt(localStorage.getItem('ai_form_schema_version') || '1', 10);
      if (storedVersion < 2) {
        // v1 → v2: ensure summary/summaryMsgCount fields exist on all conversations
        parsed.forEach(function(conv) {
          if (conv.summary === undefined) conv.summary = null;
          if (conv.summaryMsgCount === undefined) conv.summaryMsgCount = 0;
        });
        localStorage.setItem('ai_form_schema_version', String(STORAGE_SCHEMA_VERSION));
        console.log('[AI Form Assistant] Migrated conversation schema v' + storedVersion + ' → v' + STORAGE_SCHEMA_VERSION);
      }
      allConversations = parsed;
    } catch (e) {
      console.warn('[AI Form Assistant] Failed to load conversations, resetting:', e.message);
      allConversations = [];
      // Clear corrupted data so it doesn't fail repeatedly
      try { localStorage.removeItem('ai_form_conversations'); } catch(e2) {}
    }
  }

  function saveConversations() {
    try {
      // Keep last 30 conversations max
      if (allConversations.length > 30) allConversations = allConversations.slice(-30);
      let json = JSON.stringify(allConversations);
      // Progressive cleanup if exceeding 3MB
      // P1 修复：跳过当前活跃对话，避免裁剪时删除用户正在使用的对话
      while (json.length > 3 * 1024 * 1024 && allConversations.length > 1) {
        var delIdx = allConversations.findIndex(function(c) { return c.id !== currentConversationId; });
        if (delIdx === -1) break;
        allConversations.splice(delIdx, 1);
        json = JSON.stringify(allConversations);
      }
      localStorage.setItem('ai_form_conversations', json);
    } catch (e) {
      console.warn('[AI Form Assistant] Storage save failed:', e.message);
      if (e.name === 'QuotaExceededError') {
        allConversations = allConversations.slice(-Math.floor(allConversations.length / 2));
        try { localStorage.setItem('ai_form_conversations', JSON.stringify(allConversations)); } catch (e2) {}
      }
    }
  }

  function getCurrentConversation() {
    return allConversations.find(c => c.id === currentConversationId);
  }

  function saveCurrentMessages() {
    const conv = getCurrentConversation();
    if (conv) {
      // Auto compact: over 40 messages triggers automatic compression
      if (aiChatHistory.length > 40) {
        autoCompact();
      }
      conv.messages = aiChatHistory.slice(-40);
      conv.summary = currentSummary;
      conv.summaryMsgCount = currentSummaryMsgCount;
      // Auto-set title from first user message
      if (!conv.title || conv.title === '新对话') {
        const firstUser = conv.messages.find(m => m.role === 'user');
        if (firstUser) conv.title = firstUser.text.substring(0, 30) + (firstUser.text.length > 30 ? '...' : '');
      }
      // Show/hide compact hint
      updateCompactHint();
      saveConversations();
    }
  }

  function createNewConversation() {
    const conv = {
      id: 'conv_' + Date.now(),
      title: '新对话',
      timestamp: Date.now(),
      summary: null,
      summaryMsgCount: 0,
      messages: []
    };
    allConversations.push(conv);
    currentConversationId = conv.id;
    currentSummary = null;
    currentSummaryMsgCount = 0;
    saveConversations();
    return conv;
  }

  function startNewChat() {
    // Save current conversation
    saveCurrentMessages();
    // Reset state
    aiChatHistory = [];
    aiSessionId = null;
    aiIsTyping = false;
    currentSummary = null;
    currentSummaryMsgCount = 0;
    if (aiAbortController) { aiAbortController.abort(); aiAbortController = null; }
    // Create new conversation
    createNewConversation();
    // Reset UI
    const msgs = document.getElementById('aiAssistantMessages');
    if (msgs) {
      msgs.innerHTML = '<div class="ai-msg bot">你好！我是 AI 表单设计助手，可以直接在设计器中帮你搭建表单。<br><br>点击下方活动类型快速开始，或直接描述你的需求：</div>';
    }
    const statusBar = document.getElementById('aiAssistantStatus');
    if (statusBar) statusBar.textContent = '';
    const sendBtn = document.getElementById('aiAssistantSend');
    if (sendBtn) sendBtn.disabled = false;
    // Hide compact hint
    const hint = document.getElementById('aiCompactHint');
    if (hint) hint.style.display = 'none';
    // Re-show quick area
    const quickArea = document.querySelector('.ai-quick-area');
    if (quickArea) quickArea.classList.remove('hidden');
    // Close history panel if open
    closeHistoryPanel();
  }

  function toggleHistoryPanel() {
    if (historyPanelOpen) {
      closeHistoryPanel();
    } else {
      openHistoryPanel();
    }
  }

  function openHistoryPanel() {
    saveCurrentMessages();
    historyPanelOpen = true;
    const win = document.getElementById('aiAssistantWindow');
    if (!win) return;

    // Remove existing panel
    const existing = win.querySelector('.ai-history-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.className = 'ai-history-panel';

    let listHtml = '';
    if (allConversations.length === 0) {
      listHtml = '<div class="ai-history-empty">暂无历史对话</div>';
    } else {
      // Reverse to show newest first
      const sorted = [...allConversations].reverse();
      sorted.forEach(conv => {
        const date = new Date(conv.timestamp);
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const msgCount = (conv.messages || []).length;
        const isActive = conv.id === currentConversationId;
        const summaryTag = conv.summary ? ' <span class="ai-history-summary-badge">有摘要</span>' : '';
        listHtml += '<div class="ai-history-item' + (isActive ? ' active' : '') + '" data-conv-id="' + conv.id + '">'
          + '<div class="ai-history-item-row"><div class="ai-history-item-title">' + escapeHtml(conv.title || '新对话') + '</div>'
          + '<button class="ai-history-del" data-del-id="' + conv.id + '" title="删除">&times;</button></div>'
          + '<div class="ai-history-item-meta">' + dateStr + ' · ' + msgCount + ' 条消息' + summaryTag + '</div>'
          + '</div>';
      });
    }

    panel.innerHTML = '<div class="ai-history-panel-header"><span>历史对话</span><div class="ai-history-header-actions">'
      + '<button class="ai-history-clear-all" id="aiHistoryClearAll" title="清空所有历史">\uD83D\uDDD1 清空</button>'
      + '<button id="aiHistoryCloseBtn">&times;</button></div></div>'
      + '<div class="ai-history-list">' + listHtml + '</div>';
    win.appendChild(panel);

    // Bind events
    panel.querySelector('#aiHistoryCloseBtn').onclick = closeHistoryPanel;
    panel.querySelector('#aiHistoryClearAll').onclick = clearAllConversations;
    panel.querySelectorAll('.ai-history-item').forEach(item => {
      item.onclick = function(e) {
        // Ignore clicks on delete button
        if (e.target.classList.contains('ai-history-del')) return;
        const convId = this.getAttribute('data-conv-id');
        switchToConversation(convId);
      };
    });
    panel.querySelectorAll('.ai-history-del').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        deleteConversation(this.getAttribute('data-del-id'));
      };
    });
  }

  function closeHistoryPanel() {
    historyPanelOpen = false;
    const panel = document.querySelector('.ai-history-panel');
    if (panel) panel.remove();
  }

  function switchToConversation(convId) {
    saveCurrentMessages();
    const conv = allConversations.find(c => c.id === convId);
    if (!conv) return;
    currentConversationId = convId;
    aiChatHistory = conv.messages ? conv.messages.slice() : [];
    currentSummary = conv.summary || null;
    currentSummaryMsgCount = conv.summaryMsgCount || 0;
    aiSessionId = null;
    // Rebuild messages UI
    const msgs = document.getElementById('aiAssistantMessages');
    if (msgs) {
      // Only show welcome message if conversation has no history
      if (aiChatHistory.length === 0) {
        msgs.innerHTML = '<div class="ai-msg bot">你好！我是 AI 表单设计助手，可以直接在设计器中帮你搭建表单。<br><br>点击下方活动类型快速开始，或直接描述你的需求：</div>';
        // Re-show quick area for empty conversation
        var qa = document.querySelector('.ai-quick-area');
        if (qa) qa.classList.remove('hidden');
      } else {
        msgs.innerHTML = '';
        // Hide quick area for conversations with history
        var qa = document.querySelector('.ai-quick-area');
        if (qa && !qa.classList.contains('hidden')) qa.classList.add('hidden');
      }
      // Show summary notice if conversation has been compacted
      if (currentSummary && currentSummaryMsgCount > 0) {
        const notice = document.createElement('div');
        notice.className = 'ai-msg system';
        notice.textContent = '\uD83D\uDCCB 此对话已压缩 ' + currentSummaryMsgCount + ' 条历史消息为摘要。';
        msgs.appendChild(notice);
      }
      aiChatHistory.forEach(msg => {
        const el = document.createElement('div');
        el.className = 'ai-msg ' + (msg.role === 'system' ? 'system' : msg.role);
        if (msg.role === 'user') {
          el.textContent = msg.text;
        } else {
          el.innerHTML = renderMd(msg.text);
        }
        msgs.appendChild(el);
      });
      scrollChatBottom();
    }
    updateCompactHint();
    closeHistoryPanel();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== 对话压缩/摘要功能 =====
  // 当对话超过40条消息时，自动将旧消息压缩为AI生成的摘要
  // 摘要注入到后续请求的系统提示词中，确保AI仍了解历史上下文
  // 同时释放 localStorage 空间（每条对话最多保留40条消息）

  function updateCompactHint() {
    const hint = document.getElementById('aiCompactHint');
    if (!hint) return;
    if (aiChatHistory.length > 20) {
      hint.innerHTML = '<span>对话较长，</span><button id="aiCompactBtn">压缩历史</button><span> 可优化性能</span>';
      var btn = document.getElementById('aiCompactBtn');
      if (btn) btn.onclick = compactHistory;
      hint.style.display = 'flex';
    } else {
      hint.style.display = 'none';
    }
  }

  // Re-render chat messages DOM from aiChatHistory (used after compact)
  function rerenderChatMessages() {
    const msgs = document.getElementById('aiAssistantMessages');
    if (!msgs) return;
    msgs.innerHTML = '';
    // Show summary notice if exists
    if (currentSummary && currentSummaryMsgCount > 0) {
      const notice = document.createElement('div');
      notice.className = 'ai-msg system';
      notice.textContent = '\uD83D\uDCCB 此对话已压缩 ' + currentSummaryMsgCount + ' 条历史消息为摘要。AI 仍了解之前的对话内容。';
      msgs.appendChild(notice);
    }
    aiChatHistory.forEach(function(msg) {
      const el = document.createElement('div');
      el.className = 'ai-msg ' + (msg.role === 'system' ? 'system' : msg.role);
      if (msg.role === 'user') {
        el.textContent = msg.text;
      } else {
        el.innerHTML = renderMd(msg.text);
      }
      msgs.appendChild(el);
    });
    scrollChatBottom();
  }

  async function compactHistory() {
    if (aiChatHistory.length <= 10) return;

    const oldMessages = aiChatHistory.slice(0, -8);
    const recentMessages = aiChatHistory.slice(-8);

    const oldText = oldMessages.map(m =>
      (m.role === 'user' ? '用户: ' : 'AI: ') + m.text
    ).join('\n');

    const existingSummary = currentSummary
      ? '之前的摘要：\n' + currentSummary + '\n\n新增对话：\n'
      : '';

    const summaryPrompt = '请将以下对话压缩为一段简洁的摘要（100-200字），保留：关键决策、用户偏好、已完成的操作、待处理的事项。不要遗漏重要信息。\n\n'
      + existingSummary + oldText;

    // Show compacting state
    const hint = document.getElementById('aiCompactHint');
    if (hint) {
      hint.innerHTML = '<span>正在压缩历史...</span>';
      hint.style.display = 'flex';
    }

    try {
      const summary = await callAIForSummary(summaryPrompt);
      currentSummary = summary;
      currentSummaryMsgCount += oldMessages.length;
      aiChatHistory = recentMessages;

      showCompactNotice(currentSummaryMsgCount, recentMessages.length);
      rerenderChatMessages();
      saveCurrentMessages();
    } catch (e) {
      console.warn('[AI Form Assistant] Compact failed:', e.message);
      // Fallback: simple text truncation summary
      currentSummary = (currentSummary ? currentSummary + '\n' : '')
        + oldMessages.slice(-6).map(m => (m.role === 'user' ? '用户: ' : 'AI: ') + m.text.substring(0, 80)).join('\n');
      currentSummaryMsgCount += oldMessages.length;
      aiChatHistory = recentMessages;
      showCompactNotice(currentSummaryMsgCount, recentMessages.length);
      rerenderChatMessages();
      saveCurrentMessages();
    } finally {
      updateCompactHint();
    }
  }

  function autoCompact() {
    // Synchronous fallback compact for auto-trigger (no AI call to avoid blocking sendChat)
    if (aiChatHistory.length <= 20) return;
    const oldMessages = aiChatHistory.slice(0, -8);
    const recentMessages = aiChatHistory.slice(-8);

    // Build a simple text summary from old messages
    const parts = [];
    if (currentSummary) parts.push(currentSummary);
    parts.push(oldMessages.map(m =>
      (m.role === 'user' ? '用户: ' : 'AI: ') + m.text.substring(0, 100)
    ).join('\n'));

    currentSummary = parts.join('\n---\n');
    // Trim summary if too long
    if (currentSummary.length > 2000) {
      currentSummary = currentSummary.substring(currentSummary.length - 2000);
    }
    currentSummaryMsgCount += oldMessages.length;
    aiChatHistory = recentMessages;
    showCompactNotice(currentSummaryMsgCount, recentMessages.length);
    rerenderChatMessages();
    updateCompactHint();
  }

  async function callAIForSummary(prompt) {
    const body = { question: prompt, deptId: AI_DEPT_ID, model: AI_MODEL, skipRag: true };
    const resp = await fetch(AI_API_URL, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000)
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);

    // Parse SSE stream to collect full response
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Flush TextDecoder's internal multibyte buffer
        buffer += decoder.decode();
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;
        try {
          const evt = JSON.parse(jsonStr);
          if (evt.type === 'chunk' && evt.content) result += evt.content;
        } catch (e) {}
      }
    }
    // Flush remaining buffer (last SSE line may not end with \n)
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:')) {
        try {
          const evt = JSON.parse(trimmed.slice(5).trim());
          if (evt.type === 'chunk' && evt.content) result += evt.content;
        } catch (e) {}
      }
    }
    if (!result) throw new Error('Empty summary response');
    return result.trim();
  }

  function showCompactNotice(summarizedCount, recentCount) {
    const msgs = document.getElementById('aiAssistantMessages');
    if (!msgs) return;
    const notice = document.createElement('div');
    notice.className = 'ai-msg system';
    notice.textContent = '\uD83D\uDCCB 已压缩 ' + summarizedCount + ' 条历史消息为摘要，保留最近 ' + recentCount + ' 条。AI 仍了解之前的对话内容。';
    msgs.appendChild(notice);
    scrollChatBottom();
  }

  function deleteConversation(convId) {
    allConversations = allConversations.filter(c => c.id !== convId);
    saveConversations();
    if (convId === currentConversationId) {
      startNewChat();
    } else {
      openHistoryPanel();
    }
  }

  function clearAllConversations() {
    if (!confirm('确定清空所有历史对话？')) return;
    allConversations = [];
    saveConversations();
    startNewChat();
  }

  // ===== 静态回退：组件类型中文名映射 =====
  // 当动态缓存（buildComponentCache）不可用时使用此静态表
  // 键：组件类型标识，值：对应的中文显示名
  const COMP_TYPE_NAMES_STATIC = {
    input:'单行文本', textarea:'多行文本', password:'密码', counter:'计数器',
    select:'下拉选择', cascader:'级联选择', radio:'单选框组', checkbox:'多选框组',
    switch:'开关', slider:'滑块', time:'时间选择', timerange:'时间范围',
    date:'日期选择', daterange:'日期范围', rate:'评分', color:'颜色选择',
    upload:'上传', row:'行容器', button:'按钮',
    desc:'文本描述',  // 纯展示文本，用于说明/声明/注意事项
    esign:'电子签名', signature:'电子签名', sign:'电子签名'
  };

  // ===== 静态回退：类型到 Element UI 标签的映射 =====
  // 例如 'input' → 'el-input', 'date' → 'el-date-picker'
  const TYPE_TO_TAG_STATIC = {
    input: 'el-input', textarea: 'el-input', password: 'el-input',
    counter: 'el-input-number', select: 'el-select', cascader: 'el-cascader',
    radio: 'el-radio-group', checkbox: 'el-checkbox-group', switch: 'el-switch',
    slider: 'el-slider', time: 'el-time-picker', timerange: 'el-time-picker',
    date: 'el-date-picker', daterange: 'el-date-picker', rate: 'el-rate',
    color: 'el-color-picker', upload: 'el-upload', row: 'row',
    button: 'el-button', desc: 'el-input',
    esign: 'el-sign', signature: 'el-sign', sign: 'el-sign'
  };

  // ===== 动态组件缓存 =====
  // 运行时从 Vue 实例的组件数组中构建，30秒自动过期刷新
  // 结构: { typeKey: { tag, label, tagIcon, template } }
  // 优先使用此缓存，静态表仅作为回退
  let _componentCache = null;
  let _componentCacheTime = 0;
  const CACHE_TTL = 30000; // 30s — refresh if stale

  /**
   * Build component cache from Vue instance.
   * Scans all component arrays, extracts tagIcon (=type key), tag, label.
   * Returns map: typeKey → { tag, label, tagIcon, template }
   */
  function buildComponentCache(force) {
    const now = Date.now();
    if (!force && _componentCache && (now - _componentCacheTime < CACHE_TTL)) {
      return _componentCache;
    }
    const vm = vueInstance;
    if (!vm) return _componentCache || {};

    const sources = getComponentSources(vm);
    if (sources.length === 0) return _componentCache || {};

    const cache = {};
    sources.forEach(function(arr) {
      if (!Array.isArray(arr)) return;
      arr.forEach(function(tpl) {
        const conf = tpl.__config__ || tpl;
        const tagIcon = conf.tagIcon || tpl.tagIcon;
        const tag = conf.tag || tpl.tag;
        const label = conf.label || tpl.label;
        if (!tagIcon && !tag) return;

        // Primary key is tagIcon (e.g. 'input', 'textarea', 'select', 'date-range')
        var typeKey = tagIcon || tag;
        // Normalize: 'date-range' → 'daterange', 'time-range' → 'timerange'
        var normalizedKey = typeKey.replace(/-/g, '').toLowerCase();

        cache[normalizedKey] = { tag: tag, label: label, tagIcon: tagIcon, template: tpl };
        // Also store under original tagIcon if different from normalized
        if (tagIcon && tagIcon !== normalizedKey) {
          cache[tagIcon] = { tag: tag, label: label, tagIcon: tagIcon, template: tpl };
        }
      });
    });

    _componentCache = cache;
    _componentCacheTime = now;
    console.log('[AI Form Assistant] Component cache built:', Object.keys(cache).length, 'types:', Object.keys(cache).join(', '));
    return cache;
  }

  /** Get display name for a type — dynamic first, static fallback */
  function getTypeName(type) {
    if (!type) return '';
    var cache = buildComponentCache();
    var entry = cache[type] || cache[type.replace(/-/g, '').toLowerCase()];
    if (entry && entry.label) return entry.label;
    return COMP_TYPE_NAMES_STATIC[type] || type;
  }

  /** Get Element UI tag for a type — dynamic first, static fallback */
  function getTypeTag(type) {
    if (!type) return null;
    var cache = buildComponentCache();
    var entry = cache[type] || cache[type.replace(/-/g, '').toLowerCase()];
    if (entry && entry.tag) return entry.tag;
    return TYPE_TO_TAG_STATIC[type] || null;
  }

  // ===== 动态属性 Schema 缓存 =====
  // 运行时从 Vue 实例中探测每种组件可设置的属性列表
  // 注入到系统提示词中，让 AI 知道当前设计器支持哪些属性键名
  let _propSchemaCache = null;   // { typeKey: { configKeys:[], directKeys:[], slotKeys:[] } }
  let _formPropSchema = null;    // 表单级属性 { key: typeof_value }，来自 vm.formConf
  let _propSchemaCacheTime = 0;

  /**
   * Detect property schema for each component type.
   * Inspects template objects to find all settable keys.
   */
  function buildPropSchema(force) {
    const now = Date.now();
    if (!force && _propSchemaCache && (now - _propSchemaCacheTime < CACHE_TTL)) {
      return _propSchemaCache;
    }
    const vm = vueInstance;
    if (!vm) return _propSchemaCache || {};

    const sources = getComponentSources(vm);
    const schema = {};

    sources.forEach(function(arr) {
      if (!Array.isArray(arr)) return;
      arr.forEach(function(tpl) {
        const conf = tpl.__config__ || tpl;
        const typeKey = (conf.tagIcon || tpl.tagIcon || conf.tag || tpl.tag || '').replace(/-/g, '').toLowerCase();
        if (!typeKey) return;

        // Collect all settable keys
        var configKeys = conf !== tpl ? Object.keys(conf) : [];
        var directKeys = Object.keys(tpl).filter(function(k) { return k !== '__config__' && k !== '__slot__'; });
        var slotKeys = tpl.__slot__ ? Object.keys(tpl.__slot__) : [];

        schema[typeKey] = {
          configKeys: configKeys,
          directKeys: directKeys,
          slotKeys: slotKeys,
          hasSlotOptions: !!(tpl.__slot__ && tpl.__slot__.options),
          hasConfChildren: !!(conf.children),
          hasDirectOptions: tpl.options !== undefined,
          tag: conf.tag || tpl.tag,
          label: conf.label || tpl.label
        };
      });
    });

    _propSchemaCache = schema;
    _propSchemaCacheTime = now;
    console.log('[AI Form Assistant] Prop schema built:', Object.keys(schema).length, 'types');
    return schema;
  }

  /**
   * Detect form-level property schema from vm.formConf
   */
  function buildFormPropSchema(force) {
    const vm = vueInstance;
    if (!vm || !vm.formConf) return _formPropSchema || {};
    if (!force && _formPropSchema) return _formPropSchema;

    _formPropSchema = {};
    Object.keys(vm.formConf).forEach(function(k) {
      var v = vm.formConf[k];
      _formPropSchema[k] = typeof v;
    });
    // Also scan vm.appearance for visual properties (background color, etc.)
    if (vm.appearance && typeof vm.appearance === 'object') {
      Object.keys(vm.appearance).forEach(function(k) {
        _formPropSchema['appearance.' + k] = typeof vm.appearance[k];
      });
    }
    console.log('[AI Form Assistant] Form prop schema:', Object.keys(_formPropSchema).join(', '));
    return _formPropSchema;
  }

  /**
   * Smartly set a property on a component, with auto-detection fallback.
   * Tries the intended key first; if it doesn't exist, probes the component structure.
   * Returns { ok: boolean, usedKey: string }
   */
  function smartSetProp(comp, key, value) {
    if (!comp) return { ok: false };
    const conf = comp.__config__ || comp;

    // Direct match: key exists on conf or comp
    if (conf[key] !== undefined && conf !== comp) {
      conf[key] = value;
      return { ok: true, usedKey: '__config__.' + key };
    }
    if (comp[key] !== undefined) {
      comp[key] = value;
      return { ok: true, usedKey: key };
    }

    // Kebab-case fallback: 'activeText' → 'active-text'
    var kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (kebab !== key && comp[kebab] !== undefined) {
      comp[kebab] = value;
      return { ok: true, usedKey: kebab };
    }

    // camelCase fallback: 'show-word-limit' → 'showWordLimit'
    var camel = key.replace(/-([a-z])/g, function(_, c) { return c.toUpperCase(); });
    if (camel !== key) {
      if (comp[camel] !== undefined) {
        comp[camel] = value;
        return { ok: true, usedKey: camel };
      }
      if (conf[camel] !== undefined && conf !== comp) {
        conf[camel] = value;
        return { ok: true, usedKey: '__config__.' + camel };
      }
    }

    return { ok: false };
  }

  // ===== 自学习模板（从用户实际提交的表单中学习） =====
  // 当用户点击"提交表单"时，自动提取画布上的组件结构保存到 localStorage
  // 下次 AI 推荐字段时会参考这些历史记录（最多保留20条，显示最近5条）
  let _learnedTemplates = null;

  function loadLearnedTemplates() {
    if (_learnedTemplates) return _learnedTemplates;
    try {
      var stored = localStorage.getItem('ai_form_learned_templates');
      _learnedTemplates = stored ? JSON.parse(stored) : [];
    } catch (e) { _learnedTemplates = []; }
    return _learnedTemplates;
  }

  function saveLearnedTemplate(formName, fields, userQuery) {
    var learned = loadLearnedTemplates();
    // Deduplicate by name
    learned = learned.filter(function(t) { return t.name !== formName; });
    learned.push({
      name: formName,
      query: userQuery || '',
      fields: fields,
      timestamp: Date.now()
    });
    // Keep last 20
    if (learned.length > 20) learned = learned.slice(-20);
    _learnedTemplates = learned;
    try {
      localStorage.setItem('ai_form_learned_templates', JSON.stringify(learned));
    } catch (e) { /* ignore */ }
    console.log('[AI Form Assistant] Learned from submitted form:', formName, '(' + fields.length + ' fields)');
  }

  /**
   * Read the current canvas components and extract field structure for learning.
   * Only called when user clicks "提交表单" — these are the forms that actually get used.
   */
  /**
   * Extract field info from a single component object.
   */
  function extractFieldFromComponent(comp) {
    var conf = comp.__config__ || comp;
    var field = {
      label: conf.label || comp.label || '',
      type: conf.tagIcon || comp.tagIcon || conf.tag || comp.tag || '',
      tag: conf.tag || comp.tag || ''
    };
    if (field.type.startsWith('el-')) field.type = field.type.replace('el-', '');

    var props = {};
    if (comp.placeholder) props.placeholder = comp.placeholder;
    if (conf.vModel || comp.vModel) props.vModel = conf.vModel || comp.vModel;
    if (conf.required) props.required = true;
    if (comp.maxlength) props.maxlength = comp.maxlength;
    if (comp.__slot__ && comp.__slot__.options) {
      props.options = comp.__slot__.options.map(function(o) { return o.label || o; });
    } else if (comp.options) {
      props.options = comp.options.map(function(o) { return o.label || o; });
    } else if (conf.children && conf.children.length > 0) {
      props.options = conf.children.map(function(c) { return (c.__config__ || c).label || c.label; });
    }
    if (comp.regList && comp.regList.length > 0) {
      props.regexValidation = comp.regList[0].pattern;
    }
    field.props = props;
    return field;
  }

  /**
   * Read ALL pages' components from the canvas for learning.
   * Called when user clicks "提交表单" — these are the forms that actually get used.
   */
  function learnFromCanvas() {
    var vm = vueInstance;
    if (!vm) return;

    // Get form name
    var formName = '';
    var nameInput = document.querySelector('input[placeholder*="表单模板名称"]');
    if (nameInput) formName = nameInput.value;
    if (!formName && vm.formConf) formName = vm.formConf.formRef || '';
    if (!formName) return;

    var allFields = [];
    var pageCount = 0;

    // Multi-page: vm.pages is an array of { id, name, components: [...] }
    if (vm.pages && Array.isArray(vm.pages) && vm.pages.length > 0) {
      pageCount = vm.pages.length;
      vm.pages.forEach(function(page, pi) {
        var comps = page.components || page.drawingList || page.list || [];
        comps.forEach(function(comp) {
          var field = extractFieldFromComponent(comp);
          field.page = pi + 1; // Record which page this field is on
          allFields.push(field);
        });
      });
    }

    // Fallback: single-page via drawingList/drawingData
    if (allFields.length === 0) {
      var dl = getDrawingList(vm);
      if (dl) {
        var items = Array.isArray(dl) ? dl : [];
        items.forEach(function(comp) {
          allFields.push(extractFieldFromComponent(comp));
        });
      }
    }

    if (allFields.length === 0) return;

    // Find the user's original request
    var userQuery = '';
    var userMsgs = aiChatHistory.filter(function(m) { return m.role === 'user'; });
    if (userMsgs.length > 0) userQuery = userMsgs[userMsgs.length - 1].text;

    saveLearnedTemplate(formName, allFields, userQuery);
    if (pageCount > 1) {
      console.log('[AI Form Assistant] Learned multi-page form:', formName, pageCount, 'pages,', allFields.length, 'fields');
    }
  }

  /**
   * Watch for "提交表单" button clicks to trigger learning.
   * Uses event delegation on document to catch dynamically rendered buttons.
   */
  let _submitWatcherInstalled = false;
  function installSubmitWatcher() {
    if (_submitWatcherInstalled) return;
    _submitWatcherInstalled = true;

    document.addEventListener('click', function(e) {
      // Match the "提交表单" button (contains text "提交" in the form designer toolbar)
      var btn = e.target.closest('button');
      if (!btn) return;
      var text = btn.textContent || '';
      if (text.includes('提交表单') || text.includes('提交')) {
        // Check we're on a form designer page with components
        // Learn IMMEDIATELY — the page may navigate away after submit,
        // destroying the Vue instance before a delayed callback runs.
        var dl = vueInstance ? getDrawingList(vueInstance) : null;
        if (dl && (Array.isArray(dl) ? dl.length : 0) > 0) {
          learnFromCanvas();
        } else if (vueInstance && vueInstance.pages && vueInstance.pages.length > 0) {
          // Multi-page: pages may have components even if drawingList is empty
          learnFromCanvas();
        }
      }
    }, true); // capture phase to catch before Vue handlers
    console.log('[AI Form Assistant] Submit watcher installed — will learn from submitted forms');
  }

  function formatLearnedTemplates() {
    var learned = loadLearnedTemplates();
    if (!learned || learned.length === 0) return '';
    var text = '\n\n## 历史搭建记录（用户实际使用过的表单）\n';
    text += '以下表单是用户之前成功搭建的，可作为推荐参考（注意：不要完全照搬，应根据当前需求灵活调整）：\n\n';
    // Show last 5 most recent
    var recent = learned.slice(-5);
    recent.forEach(function(t, i) {
      text += (i + 1) + '. **' + t.name + '**';
      if (t.query) text += ' (用户描述: "' + t.query.substring(0, 50) + '")';
      // Check if multi-page
      var hasPages = t.fields.some(function(f) { return f.page && f.page > 1; });
      var maxPage = hasPages ? Math.max.apply(null, t.fields.map(function(f) { return f.page || 1; })) : 1;
      if (maxPage > 1) text += ' [' + maxPage + '页]';
      text += '\n   字段: ' + t.fields.map(function(f) {
        var s = f.label + '(' + (getTypeName(f.type)) + ')';
        if (f.page && f.page > 1) s += '[P' + f.page + ']';
        return s;
      }).join('、') + '\n';
    });
    return text;
  }

  // ===== 表单模板库（异步加载） =====
  // 尝试从 /static/js/form-templates.json 加载外部模板文件
  // 加载失败时使用内置模板（getBuiltinTemplates）
  // 模板按复杂度分4档：简单(5-8字段)/中等(8-15)/复杂(15-25)/超复杂(25-40+)
  let FORM_TEMPLATES = null;

  /** Build dynamic type list string for system prompt (tells AI what types to use in FIELDS) */
  function buildDynamicTypeHint() {
    var cache = buildComponentCache();
    var keys = Object.keys(cache);
    if (keys.length === 0) return null;
    // Deduplicate by template reference
    var seen = new Set();
    var items = [];
    keys.forEach(function(k) {
      var entry = cache[k];
      if (seen.has(entry.template)) return;
      seen.add(entry.template);
      items.push(k + '(' + (entry.label || entry.tag) + ')');
    });
    return items.join(', ');
  }

  // Build dynamic component list from Vue instance
  function buildDynamicComponentList() {
    if (!vueInstance) return null;
    var vm = vueInstance;
    var sections = [];
    var total = 0;
    // Map of known category key patterns to display names
    var categoryNames = [
      [/input/i, '输入型组件'],
      [/select/i, '选择型组件'],
      [/layout/i, '布局型组件']
    ];
    var dataKeys = Object.keys(vm._data || {});
    dataKeys.forEach(function(k) {
      var v = vm[k];
      if (!Array.isArray(v) || v.length === 0) return;
      if (!(v[0] && (v[0].tag || (v[0].__config__ && (v[0].__config__.tag || v[0].__config__.tagIcon))))) return;
      var catName = k;
      for (var ci = 0; ci < categoryNames.length; ci++) {
        if (categoryNames[ci][0].test(k)) { catName = categoryNames[ci][1]; break; }
      }
      var items = v.map(function(t) { return (t.__config__ || t).label || t.tag; });
      total += items.length;
      sections.push('**' + catName + '（' + items.length + '个）**\n- ' + items.join('、'));
    });
    if (sections.length === 0) return null;
    return '表单设计器提供 **' + total + ' 个组件**，分为' + sections.length + '大类：\n' + sections.join('\n');
  }

  // ===== 本地快速回答（无需调用 AI API） =====
  // 对于常见问题直接返回预设答案，节省 API 调用和等待时间
  // null 值表示运行时动态生成（如组件列表从 Vue 实例读取）
  // 同时支持模糊关键词匹配（见 sendChat 中的 fuzzyMap）
  const QUICK_ANSWERS = {
    '有哪些组件可以使用？': null, // Will be dynamically generated
    '如何创建报名表？': '创建报名表步骤：\n1. **进入表单设计器** — 点击"创建新模板"或从模板列表进入\n2. **输入模板名称** — 填写表单标题\n3. **添加组件** — 从左侧组件面板拖拽所需组件到画布\n4. **配置属性** — 选中组件后在右侧属性面板设置必填、校验规则等\n5. **提交保存** — 点击提交按钮保存模板\n也可以直接告诉我你要做什么表单，我来帮你搭建！',
    '如何添加表单验证？': '常用表单验证配置：\n**手机号验证**\n- 正则表达式：`/^1[3-9]\\d{9}$/`\n- 错误提示："手机号格式错误"\n**邮箱验证**\n- 正则表达式：`/^[\\w.-]+@[\\w.-]+\\.\\w+$/`\n**通用设置**\n- 在组件属性面板开启"必填"开关\n- 添加自定义正则规则',
    '怎么实现多列布局？': '**多列布局实现方法：**\n1. 添加 **行容器** 组件到画布\n2. 在行容器内添加需要并排的组件\n3. 设置每个子组件的 **"表单栅格"** 值\n**常用配置：**\n| 布局 | 栅格值 |\n|------|--------|\n| 两列等宽 | 12 + 12 |\n| 三列等宽 | 8 + 8 + 8 |\n| 左窄右宽 | 8 + 16 |',
    '这样就好了': '好的！表单已搭建完成。你可以：\n1. 在画布中预览和微调各字段\n2. 点击顶部 **「提交」** 按钮保存模板\n3. 随时回来找我修改或新建表单\n\n祝活动顺利！'
  };

  // ===== 知识库片段（按主题分块，按关键词匹配注入系统提示词） =====
  const KB_CHUNKS = {
    overview: '表单设计器采用经典三栏布局：\n- **左侧组件面板**：提供19个组件，分为输入型(4个)、选择型(13个)、布局型(2个)三类，点击或拖拽即可添加到画布\n- **中间画布区域**：展示已添加的组件，支持拖拽排序、复制、删除\n- **右侧属性面板**：选中画布中的组件后可配置其所有属性',
    input_components: '**输入型组件（4个）：**\n1. 单行文本 — 姓名、手机号、邮箱等\n2. 多行文本 — 自我介绍、备注\n3. 密码 — 密码输入\n4. 计数器 — 数字输入',
    select_components: '**选择型组件（13个）：**\n下拉选择、级联选择、单选框组、多选框组、开关、滑块、时间选择、时间范围、日期选择、日期范围、评分、颜色选择、上传',
    layout_components: '**布局型组件：**\n行容器（多组件并排）、按钮（提交/重置）',
    faq_general: '**组件选择建议：**\n- 短文本 → 单行文本\n- 长文本 → 多行文本\n- 固定少量选项 → 单选框组\n- 多项可选 → 多选框组\n- 选项较多 → 下拉选择\n- 是/否 → 开关\n- 打分 → 评分\n- 文件 → 上传'
  };

  // ===== Load Form Template Library =====
  async function loadFormTemplates() {
    if (FORM_TEMPLATES) return; // Already loaded
    try {
      // Try loading from same directory as the script
      const paths = [
        '/static/js/form-templates.json',
        './form-templates.json',
        '/form-templates.json'
      ];
      for (const p of paths) {
        try {
          const resp = await fetch(p, { cache: 'no-cache' });
          if (resp.ok) {
            FORM_TEMPLATES = await resp.json();
            console.log('[AI Form Assistant] Loaded ' + (FORM_TEMPLATES.templates || []).length + ' form templates');
            return;
          }
        } catch (e) { /* try next path */ }
      }
      console.warn('[AI Form Assistant] form-templates.json not found, using built-in templates');
      FORM_TEMPLATES = { templates: getBuiltinTemplates() };
    } catch (err) {
      console.warn('[AI Form Assistant] Template load error:', err);
      FORM_TEMPLATES = { templates: getBuiltinTemplates() };
    }
  }

  /** Built-in minimal templates (fallback if JSON not deployed) */
  function getBuiltinTemplates() {
    return [
      // ===== 简单 Simple (5-8 fields) =====
      {
        id: 'free_gala', name: '免费晚会/派对报名', nameEn: 'Free Gala/Party Registration',
        keywords: ['春节','感恩节','中秋','晚会','派对','gala','party','新年','圣诞','万圣节','元旦','庆典','联欢','年会'],
        complexity: 'simple', fieldCount: '5-7',
        fields: [
          { title:'姓名 Name', type:'input', required:true, desc:'请填写真实姓名', props:{placeholder:'请输入姓名 / Your Name',vModel:'name',maxlength:30,required:true} },
          { title:'邮箱 Email', type:'input', required:true, desc:'接收活动确认邮件', props:{placeholder:'your_email@example.com',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'手机号 Phone Number', type:'input', required:true, desc:'中国或美国手机号均可', props:{placeholder:'请输入手机号',vModel:'phone',maxlength:15,required:true} },
          { title:'微信号 WeChat ID', type:'input', required:true, desc:'用于添加活动群', props:{placeholder:'请输入微信号（不是微信名）',vModel:'wechatId',required:true} },
          { title:'性别 Gender', type:'radio', required:true, desc:'', props:{vModel:'gender',required:true,options:['男 Male','女 Female','保密 Prefer not to say']} },
          { title:'是否携带朋友/家长', type:'select', required:false, desc:'方便统计人数', props:{vModel:'companions',placeholder:'请选择',options:['0人','1人','2人','3人及以上']} }
        ],
        features: ['bilingual_titles','lottery','one_submission_per_person']
      },
      {
        id: 'photo_collection', name: '素材/照片收集', nameEn: 'Photo/Material Collection',
        keywords: ['照片','素材','收集','投稿','photo','图片','视频','作品','相册','新生相册'],
        complexity: 'simple', fieldCount: '4-6',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'联系方式（微信号）', type:'input', required:true, desc:'用于联系投稿作者', props:{placeholder:'微信号或手机号',vModel:'contact',required:true} },
          { title:'上传照片/作品', type:'upload', required:true, desc:'支持jpg/png，单张10MB', props:{vModel:'files',required:true} },
          { title:'作品说明', type:'textarea', required:false, desc:'简述拍摄时间/地点/内容', props:{placeholder:'简要描述作品内容、拍摄时间等',vModel:'description',maxlength:500} }
        ],
        features: ['file_upload','multiple_uploads']
      },
      {
        id: 'class_group', name: '课友群/选课互助', nameEn: 'Class Group Matching',
        keywords: ['课友','选课','课程','class','课群','学习','互助','同课','选课群','学习群'],
        complexity: 'simple', fieldCount: '5-7',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'微信号 WeChat ID', type:'input', required:true, desc:'用于拉入课友群', props:{placeholder:'请输入微信号（不是微信名）',vModel:'wechatId',required:true} },
          { title:'年级 Grade', type:'select', required:true, props:{vModel:'grade',required:true,placeholder:'请选择年级',options:['大一 Freshman','大二 Sophomore','大三 Junior','大四 Senior','研一 Master Year 1','研二 Master Year 2','PhD']} },
          { title:'专业 Major', type:'input', required:true, props:{placeholder:'如：Computer Science',vModel:'major',required:true} },
          { title:'选修课程（可多选）', type:'checkbox', required:true, desc:'选择你本学期的课程', props:{vModel:'courses',required:true,options:['CSE 100','CSE 101','MATH 20A','MATH 20B','ECON 1','BILD 1','CHEM 6A','PHYS 2A','其他（请备注）']} },
          { title:'备注', type:'textarea', required:false, desc:'如有其他课程请在此填写', props:{placeholder:'其他课程或说明',vModel:'remarks',maxlength:200} }
        ],
        features: ['course_matching','group_assignment']
      },

      // ===== 中等 Medium (8-15 fields) =====
      {
        id: 'paid_activity', name: '付费活动报名', nameEn: 'Paid Activity Registration',
        keywords: ['篝火','烧烤','BBQ','聚餐','晚餐','火锅','旅行','露营','camping','付费','门票','票价','收费'],
        complexity: 'medium', fieldCount: '8-12',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'性别 Gender', type:'radio', required:true, props:{vModel:'gender',required:true,options:['男 Male','女 Female','保密 Prefer not to say']} },
          { title:'手机号 Phone', type:'input', required:true, desc:'中国手机号加86，美国加1', props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'微信号 WeChat ID', type:'input', required:true, props:{placeholder:'请输入微信号（不是微信名）',vModel:'wechatId',required:true} },
          { title:'邮箱 Email', type:'input', required:true, desc:'尽量使用.edu邮箱', props:{placeholder:'xxx@ucsd.edu',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'是否携带朋友', type:'select', required:true, desc:'需统计总人数', props:{vModel:'companions',required:true,placeholder:'请选择',options:['0人（仅本人）','1人','2人','3人及以上']} },
          { title:'饮食偏好/忌口', type:'textarea', required:false, desc:'有想吃的或忌口的请告诉我们', props:{placeholder:'如：不吃辣、素食、海鲜过敏等',vModel:'dietaryPreference',maxlength:200} },
          { title:'想问学长学姐的问题', type:'textarea', required:false, desc:'有问题可以提前提交', props:{placeholder:'关于选课、生活、实习等问题',vModel:'questions',maxlength:300} },
          { title:'备注 Remarks', type:'textarea', required:false, props:{placeholder:'其他需要说明的事项',vModel:'remarks',maxlength:200} }
        ],
        features: ['payment','dietary_preference','interactive_qa']
      },
      {
        id: 'social_event', name: '社交活动报名', nameEn: 'Social Event Registration',
        keywords: ['单身','交友','相亲','dating','social','脱单','联谊','避难所','非诚勿扰','匹配'],
        complexity: 'medium', fieldCount: '8-12',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'性别 Gender', type:'radio', required:true, props:{vModel:'gender',required:true,options:['男 Male','女 Female','保密 Prefer not to say']} },
          { title:'年龄 Age', type:'input', required:true, props:{placeholder:'请输入年龄',vModel:'age',required:true} },
          { title:'学校 University', type:'select', required:true, props:{vModel:'university',required:true,placeholder:'请选择学校',options:['UCSD','UCLA','UCSB','UCI','USC','UCR','UCD','Stanford','其他 Other']} },
          { title:'专业 Major', type:'input', required:true, props:{placeholder:'如：Computer Science',vModel:'major',required:true} },
          { title:'微信号 WeChat ID', type:'input', required:true, desc:'用于活动匹配后联系', props:{placeholder:'请输入微信号（不是微信名）',vModel:'wechatId',required:true} },
          { title:'手机号 Phone', type:'input', required:true, props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'邮箱 Email', type:'input', required:true, props:{placeholder:'your_email@example.com',vModel:'email',required:true} },
          { title:'星座', type:'radio', required:false, desc:'社交破冰特色字段', props:{vModel:'zodiac',options:['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座']} },
          { title:'MBTI', type:'radio', required:false, desc:'人格测试类型', props:{vModel:'mbti',options:['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP']} },
          { title:'兴趣爱好（可多选）', type:'checkbox', required:false, desc:'帮助匹配兴趣相似的参与者', props:{vModel:'hobbies',options:['运动健身','音乐','电影/追剧','摄影','旅行','美食/烹饪','游戏','阅读','户外活动','艺术/手工']} },
          { title:'自我介绍/留言板', type:'textarea', required:false, desc:'写点什么让大家认识你', props:{placeholder:'介绍自己，爱好、专业、想说的话',vModel:'intro',maxlength:300} }
        ],
        features: ['interactive_fields','bilingual_titles','personality_matching']
      },
      {
        id: 'volunteer_signup', name: '志愿者活动报名', nameEn: 'Volunteer Signup',
        keywords: ['志愿','义工','volunteer','服务','公益','foodbank','义卖','慈善'],
        complexity: 'medium', fieldCount: '8-12',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'手机号 Phone', type:'input', required:true, props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'邮箱 Email', type:'input', required:true, props:{placeholder:'请输入邮箱',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'微信号', type:'input', required:true, props:{placeholder:'请输入微信号',vModel:'wechatId',required:true} },
          { title:'学校 University', type:'select', required:true, props:{vModel:'university',required:true,placeholder:'请选择学校',options:['UCSD','UCLA','UCSB','UCI','USC','UMN','UCR','UCD','其他']} },
          { title:'可用时间段', type:'checkbox', required:true, desc:'选择可参加的时间', props:{vModel:'availableSlots',required:true,options:['周一上午','周一下午','周二上午','周二下午','周三上午','周三下午','周四上午','周四下午','周五上午','周五下午','周六全天','周日全天']} },
          { title:'是否有交通工具', type:'radio', required:true, desc:'部分志愿地点需自驾', props:{vModel:'hasTransport',required:true,options:['有车','无车（需拼车）']} },
          { title:'相关技能/经验', type:'checkbox', required:false, desc:'有助于分配岗位', props:{vModel:'skills',options:['中英翻译','驾驶（有车）','摄影/摄像','急救/医疗','活动策划','设计/美工','其他']} },
          { title:'备注', type:'textarea', required:false, props:{placeholder:'其他需要说明的事项',vModel:'remarks',maxlength:200} }
        ],
        features: ['time_selection','skill_selection']
      },
      {
        id: 'lecture_seminar', name: '讲座/研讨会报名', nameEn: 'Lecture/Seminar Registration',
        keywords: ['讲座','研讨','分享','沙龙','lecture','seminar','workshop','工作坊','培训','课程','talk','career'],
        complexity: 'medium', fieldCount: '7-10',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'邮箱 Email', type:'input', required:true, desc:'讲座资料将发此邮箱', props:{placeholder:'xxx@ucsd.edu',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'手机号 Phone', type:'input', required:true, props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'微信号', type:'input', required:false, props:{placeholder:'请输入微信号',vModel:'wechatId'} },
          { title:'学校/专业', type:'input', required:true, props:{placeholder:'如：UCSD / Computer Science',vModel:'universityMajor',required:true} },
          { title:'年级 Grade', type:'select', required:true, props:{vModel:'grade',required:true,placeholder:'请选择年级',options:['大一 Freshman','大二 Sophomore','大三 Junior','大四 Senior','研一','研二','PhD','其他']} },
          { title:'感兴趣的话题', type:'checkbox', required:false, desc:'帮助讲师调整内容', props:{vModel:'interestedTopics',options:['选课指南','实习/求职','研究生申请','生活适应','学术研究','创业','其他']} },
          { title:'想提前问的问题', type:'textarea', required:false, desc:'讲座中优先解答', props:{placeholder:'请输入你想问的问题...',vModel:'questions',maxlength:300} }
        ],
        features: ['topic_selection','question_collection']
      },
      {
        id: 'hotel_booking', name: '折扣酒店/住宿预订', nameEn: 'Hotel Booking',
        keywords: ['酒店','住宿','预订','hotel','booking','公寓','折扣','住房','临时住宿'],
        complexity: 'medium', fieldCount: '6-8',
        fields: [
          { title:'请勿分享预约链接', type:'radio', required:true, desc:'未提交表单的预约不负责售后', props:{vModel:'agreeTerms',required:true,options:['已了解']} },
          { title:'姓名（酒店预订用）', type:'input', required:true, desc:'与证件一致', props:{placeholder:'姓 Last / 名 First',vModel:'name',required:true} },
          { title:'手机号', type:'input', required:true, desc:'酒店预定使用手机', props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'邮箱', type:'input', required:true, desc:'酒店预定使用邮箱', props:{placeholder:'your_email@example.com',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'入住日期（可多选）', type:'checkbox', required:true, desc:'可多选连续日期', props:{vModel:'checkInDates',required:true,options:['9/12','9/13','9/14','9/15','9/16','9/17','9/18','9/19','9/20','9/21']} }
        ],
        features: ['date_selection','confirmation','notice_text']
      },
      {
        id: 'roommate_matching', name: '找室友/合租匹配', nameEn: 'Roommate Matching',
        keywords: ['室友','合租','roommate','租房','找房','住房','合住','house','apartment','室友匹配'],
        complexity: 'medium', fieldCount: '10-15',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'性别 Gender', type:'radio', required:true, props:{vModel:'gender',required:true,options:['男 Male','女 Female']} },
          { title:'微信号 WeChat ID', type:'input', required:true, desc:'用于匹配后联系', props:{placeholder:'请输入微信号（不是微信名）',vModel:'wechatId',required:true} },
          { title:'邮箱 Email', type:'input', required:true, props:{placeholder:'xxx@ucsd.edu',vModel:'email',required:true} },
          { title:'年级 Grade', type:'select', required:true, props:{vModel:'grade',required:true,placeholder:'请选择年级',options:['大一 Freshman','大二 Sophomore','大三 Junior','大四 Senior','研一','研二','PhD']} },
          { title:'专业 Major', type:'input', required:true, props:{placeholder:'如：Computer Science',vModel:'major',required:true} },
          { title:'期望入住时间', type:'input', required:true, desc:'如2025年9月', props:{placeholder:'如：2025年9月中旬',vModel:'moveInDate',required:true} },
          { title:'期望租金范围（每月）', type:'radio', required:true, props:{vModel:'budget',required:true,options:['$500-800','$800-1200','$1200-1500','$1500以上','均可']} },
          { title:'期望住房类型', type:'radio', required:true, props:{vModel:'housingType',required:true,options:['校内宿舍','校外公寓（合租）','校外公寓（整租）','均可']} },
          { title:'作息习惯', type:'radio', required:true, desc:'帮助匹配生活习惯相近的室友', props:{vModel:'sleepSchedule',required:true,options:['早睡早起（11点前入睡）','正常作息（12点前入睡）','夜猫子（12点后入睡）']} },
          { title:'是否介意室友', type:'checkbox', required:false, desc:'选择你在意的事项', props:{vModel:'preferences',options:['养宠物','做饭有油烟','经常带朋友来','打游戏/看视频外放','抽烟','喝酒']} },
          { title:'自我介绍', type:'textarea', required:false, desc:'介绍自己的生活习惯和期望', props:{placeholder:'简单介绍你的生活习惯、爱好、对室友的期望等',vModel:'intro',maxlength:500} }
        ],
        features: ['matching_algorithm','personality_fields','housing_preference']
      },
      {
        id: 'competition', name: '比赛/竞赛报名', nameEn: 'Competition Registration',
        keywords: ['比赛','竞赛','competition','锦标赛','麻将','游戏','电竞','篮球','足球','桌游','辩论','演讲'],
        complexity: 'medium', fieldCount: '8-12',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'微信号 WeChat ID', type:'input', required:true, desc:'赛事通知和分组信息', props:{placeholder:'请输入微信号',vModel:'wechatId',required:true} },
          { title:'手机号 Phone', type:'input', required:true, props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'邮箱 Email', type:'input', required:true, props:{placeholder:'your_email@example.com',vModel:'email',required:true} },
          { title:'学校 University', type:'select', required:true, props:{vModel:'university',required:true,placeholder:'请选择学校',options:['UCSD','UCLA','UCSB','UCI','USC','UCR','UCD','Stanford','其他']} },
          { title:'参赛形式', type:'radio', required:true, props:{vModel:'teamType',required:true,options:['个人参赛','组队参赛（已有队伍）','组队参赛（需要匹配队友）']} },
          { title:'队伍名称', type:'input', required:false, desc:'已有队伍请填写', props:{placeholder:'请输入队伍名称',vModel:'teamName'} },
          { title:'队友信息', type:'textarea', required:false, desc:'已有队友请填写姓名', props:{placeholder:'队友1姓名 / 队友2姓名',vModel:'teammates',maxlength:200} },
          { title:'经验水平', type:'radio', required:true, desc:'帮助合理分组', props:{vModel:'level',required:true,options:['新手（从未参加过）','入门（偶尔参与）','中级（经常参与）','高级（竞赛经验丰富）']} },
          { title:'备注 Remarks', type:'textarea', required:false, props:{placeholder:'其他需要说明的事项',vModel:'remarks',maxlength:200} }
        ],
        features: ['team_formation','skill_matching','bracket_system']
      },
      {
        id: 'general_registration', name: '通用活动报名', nameEn: 'General Registration',
        keywords: ['报名','注册','活动','register','sign up','event','参加','活动报名'],
        complexity: 'medium', fieldCount: '6-10',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'手机号 Phone', type:'input', required:true, props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'邮箱 Email', type:'input', required:true, props:{placeholder:'请输入邮箱',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'微信号 WeChat ID', type:'input', required:true, props:{placeholder:'请输入微信号（不是微信名）',vModel:'wechatId',required:true} },
          { title:'学校 University', type:'select', required:false, props:{vModel:'university',placeholder:'请选择学校',options:['UCSD','UCLA','UCSB','UCI','USC','UMN','Stanford','UCR','UCD','其他 Other']} },
          { title:'年级 Grade', type:'select', required:false, props:{vModel:'grade',placeholder:'请选择年级',options:['大一 Freshman','大二 Sophomore','大三 Junior','大四 Senior','研一','研二','PhD','其他']} },
          { title:'备注 Remarks', type:'textarea', required:false, props:{placeholder:'其他需要说明的事项',vModel:'remarks',maxlength:200} }
        ],
        features: ['contact_info','basic_fields']
      },

      // ===== 复杂 High (15-25 fields) =====
      {
        id: 'recruitment', name: '社团/部门招新', nameEn: 'Club/Department Recruitment',
        keywords: ['招新','招募','加入','recruit','join','纳新','面试','申请','application','部门','officer','eboard','e-board','换届'],
        complexity: 'high', fieldCount: '12-18',
        fields: [
          { title:'护照姓名 Legal Name', type:'input', required:true, desc:'Name on your passport', props:{placeholder:'如：Zhang San',vModel:'legalName',required:true} },
          { title:'常用名 Preferred Name', type:'input', required:true, desc:'Nickname or English name', props:{placeholder:'如：Tony',vModel:'nickname',required:true} },
          { title:'性别 Gender', type:'radio', required:true, props:{vModel:'gender',required:true,options:['男 Male','女 Female','不回答 Prefer not to say']} },
          { title:'年级 Grade', type:'select', required:true, props:{vModel:'grade',required:true,placeholder:'请选择年级',options:['大一 Freshman','大二 Sophomore','大三 Junior','大四 Senior','研一 Master Year 1','研二 Master Year 2','PhD','其他']} },
          { title:'专业 Major', type:'input', required:true, props:{placeholder:'如：Computer Science',vModel:'major',required:true} },
          { title:'手机号 Cellphone#', type:'input', required:true, props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'微信号 WeChat ID', type:'input', required:true, desc:'不是微信名，是微信号', props:{placeholder:'请输入微信号',vModel:'wechatId',required:true} },
          { title:'邮箱 Email', type:'input', required:true, desc:'用于接收confirmation和面试结果', props:{placeholder:'xxx@ucsd.edu',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'感兴趣的部门/Program', type:'checkbox', required:true, desc:'可多选', props:{vModel:'departments',required:true,options:['Business Development（商务发展）','Public Relation（公关）','Human Resources（人力资源）','Project Manager（活动策划）','Marketing & Branding（市场营销）']} },
          { title:'感兴趣的Program', type:'checkbox', required:false, desc:'选中后可查看具体介绍', props:{vModel:'programs',options:['Mentor Mentee计划','高中生计划','公益活动计划','开学大典']} },
          { title:'LinkedIn（选填）', type:'input', required:false, props:{placeholder:'LinkedIn个人主页链接',vModel:'linkedin'} },
          { title:'简历上传 Resume', type:'upload', required:false, desc:'支持PDF/Word', props:{vModel:'resume'} },
          { title:'有没有想通过平台实现的愿望及目标', type:'textarea', required:false, desc:'可以在面试的时候分享', props:{placeholder:'请描述你的愿望和目标...',vModel:'goals',maxlength:500} },
          { title:'对组织的愿望及期待', type:'textarea', required:false, desc:'帮助我们改进', props:{placeholder:'你对CU有什么期待和建议？',vModel:'expectations',maxlength:500} }
        ],
        features: ['department_selection','resume_upload','personal_statement','multi_page']
      },
      {
        id: 'freshman_meetup', name: '新生见面会/迎新活动', nameEn: 'Freshman Meetup',
        keywords: ['见面会','迎新','新生','meetup','freshman','orientation','开学','新生活动','线下见面','welcome'],
        complexity: 'high', fieldCount: '12-18',
        fields: [
          { title:'该表单仅开放于学生，家长请以学生身份报名', type:'radio', required:true, desc:'家长同行数量在后面填写', props:{vModel:'confirmStudent',required:true,options:['已了解']} },
          { title:'选择参加的场次', type:'checkbox', required:true, desc:'可多选，选中后查看具体地址', props:{vModel:'sessions',required:true,options:['上海场 | 6月21日','北京场 | 6月28日','深圳场 | 7月5日','成都场 | 7月12日']} },
          { title:'真实姓名（中文）', type:'input', required:true, desc:'Legal Name', props:{placeholder:'请输入中文姓名',vModel:'name',required:true} },
          { title:'微信号', type:'input', required:true, desc:'请填写ID方便联系', props:{placeholder:'不是微信名',vModel:'wechatId',required:true} },
          { title:'内地手机号（建议填写）', type:'input', required:false, desc:'用于接收入场短信通知', props:{placeholder:'请填写大陆手机号码接收入场信息',vModel:'phoneCN'} },
          { title:'邮箱 Email', type:'input', required:true, desc:'请填写常用联系邮箱', props:{placeholder:'优先使用学校邮箱',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'专业 Major', type:'input', required:true, props:{placeholder:'如：Computer Science',vModel:'major',required:true} },
          { title:'是否携带朋友/家长', type:'select', required:true, desc:'方便统计人数和餐饮准备', props:{vModel:'companions',required:true,placeholder:'请选择',options:['0人（仅本人）','1人','2人','3人及以上']} },
          { title:'请问你对after party感兴趣吗', type:'radio', required:true, props:{vModel:'afterParty',required:true,options:['是','否']} },
          { title:'饮食偏好/忌口', type:'textarea', required:false, props:{placeholder:'如：不吃辣、素食、海鲜过敏等',vModel:'dietary',maxlength:200} },
          { title:'您期望的其他地点', type:'textarea', required:false, desc:'帮助规划下次活动地点', props:{placeholder:'您希望在哪个城市举办？',vModel:'locationSuggestion',maxlength:200} }
        ],
        features: ['multi_city_event','session_selection','multi_page','companion_count']
      },
      {
        id: 'quiz_survey', name: '测验/问卷调查', nameEn: 'Quiz/Survey',
        keywords: ['测验','问答','问卷','quiz','survey','调查','反馈','培训','考核','测试','feedback'],
        complexity: 'high', fieldCount: '15-30',
        fields: [
          { title:'学校', type:'select', required:true, props:{vModel:'university',required:true,placeholder:'请选择学校',options:['UCSD','UCLA','UCSB','UCI','USC','UCR','UCD','其他']} },
          { title:'姓名', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'手机号', type:'input', required:true, props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'邮箱', type:'input', required:true, props:{placeholder:'请输入邮箱',vModel:'email',required:true} },
          { title:'确认声明', type:'radio', required:true, desc:'确认已完成前置要求', props:{vModel:'confirmWatched',required:true,options:['是的，我已观看完所有录播内容']} },
          { title:'测验题（单选示例）', type:'radio', required:true, desc:'根据实际题目配置', props:{vModel:'q1',required:true,options:['选项A','选项B','选项C','选项D']} },
          { title:'测验题（多选示例）', type:'checkbox', required:true, desc:'请选择所有正确答案', props:{vModel:'q2',required:true,options:['选项A','选项B','选项C','选项D','选项E']} },
          { title:'测验题（文字回答）', type:'textarea', required:true, desc:'简述你的理解', props:{vModel:'q3',required:true,placeholder:'请输入答案...',maxlength:500} }
        ],
        features: ['multi_page','scoring','mixed_types','confirmation']
      },
      {
        id: 'mentorship_program', name: '导师/领导力计划', nameEn: 'Mentorship/Leadership Program',
        keywords: ['导师','mentee','mentor','领导力','leadership','计划','program','培训计划','学长学姐','指导'],
        complexity: 'high', fieldCount: '12-18',
        fields: [
          { title:'姓名 Name', type:'input', required:true, props:{placeholder:'请输入姓名',vModel:'name',required:true} },
          { title:'性别 Gender', type:'radio', required:true, props:{vModel:'gender',required:true,options:['男 Male','女 Female','保密 Prefer not to say']} },
          { title:'微信号 WeChat ID', type:'input', required:true, props:{placeholder:'请输入微信号',vModel:'wechatId',required:true} },
          { title:'手机号 Phone', type:'input', required:true, props:{placeholder:'请输入手机号',vModel:'phone',required:true} },
          { title:'邮箱 Email', type:'input', required:true, props:{placeholder:'xxx@ucsd.edu',vModel:'email',required:true} },
          { title:'学校 University', type:'select', required:true, props:{vModel:'university',required:true,placeholder:'请选择学校',options:['UCSD','UCLA','UCSB','UCI','USC','UCR','UCD','UMN','其他']} },
          { title:'年级 Grade', type:'select', required:true, props:{vModel:'grade',required:true,placeholder:'请选择年级',options:['大一 Freshman','大二 Sophomore','大三 Junior','大四 Senior','研一','研二','PhD']} },
          { title:'专业 Major', type:'input', required:true, props:{placeholder:'如：Computer Science',vModel:'major',required:true} },
          { title:'申请角色', type:'radio', required:true, desc:'Mentor需有至少1年在校经验', props:{vModel:'role',required:true,options:['Mentor（指导者）','Mentee（被指导者）']} },
          { title:'感兴趣的领域', type:'checkbox', required:true, desc:'帮助匹配合适的导师/学员', props:{vModel:'interests',required:true,options:['学业指导（选课/GPA）','求职/实习','研究生申请','校园生活适应','社交/人脉拓展','创业','心理健康','其他']} },
          { title:'你能提供或期望获得的帮助', type:'textarea', required:true, desc:'Mentor写能提供的，Mentee写期望获得的', props:{placeholder:'请描述你的经验/期望...',vModel:'helpDescription',required:true,maxlength:500} },
          { title:'每周可用时间', type:'checkbox', required:true, desc:'用于安排导师-学员会面', props:{vModel:'availability',required:true,options:['周一-周三白天','周一-周三晚上','周四-周五白天','周四-周五晚上','周末白天','周末晚上']} },
          { title:'其他说明', type:'textarea', required:false, props:{placeholder:'其他需要说明的事项',vModel:'remarks',maxlength:300} }
        ],
        features: ['role_matching','interest_matching','availability_scheduling','multi_page']
      },

      // ===== 最复杂 Very High (25-40+ fields) =====
      {
        id: 'airport_pickup', name: '新生接机/接送服务报名', nameEn: 'Airport Pickup Registration',
        keywords: ['接机','接送','airport','pickup','新生接','落地','航班','班车','大巴','shuttle'],
        complexity: 'very_high', fieldCount: '25-40',
        fields: [
          { title:'您的身份', type:'radio', required:true, desc:'区分新生和家长', props:{vModel:'identity',required:true,options:['25年秋季入学新生','家长/陪同人员']} },
          { title:'交通工具默认为巴士，建议优先选择巴士', type:'radio', required:true, desc:'确认已了解交通安排', props:{vModel:'confirmTransport',required:true,options:['已了解']} },
          { title:'入学Offer截图', type:'upload', required:true, desc:'截图即可，用于验证新生身份', props:{vModel:'offerScreenshot',required:true} },
          { title:'姓名 Legal Name', type:'input', required:true, desc:'请填写法定名，与护照一致', props:{placeholder:'如：Zhang San',vModel:'legalName',required:true,maxlength:50} },
          { title:'航班类型', type:'radio', required:true, desc:'选择后显示对应航空公司列表', props:{vModel:'flightType',required:true,options:['中国大陆直飞美国','港澳台直飞美国','经日韩转机','经加拿大/美国本土转机','其他（请备注）']} },
          { title:'航空公司（Airline）', type:'radio', required:true, desc:'根据航班类型选择对应航空公司', props:{vModel:'airline',required:true,options:['中国国际航空 Air China CA','中国东方航空 China Eastern MU','中国南方航空 China Southern CZ','海南航空 Hainan Airlines HU','厦门航空 Xiamen Airlines MF','美联航 United Airlines UA','达美航空 Delta DL','其他（请备注）']} },
          { title:'最终落地的航班号 Flight Number', type:'input', required:true, desc:'请填写最后一段航班，用于接机定位', props:{placeholder:'例如：MU583、CA987、DL120',vModel:'flightNumber',required:true,maxlength:10} },
          { title:'降落日期', type:'date', required:true, props:{vModel:'landingDate',required:true,placeholder:'请选择降落日期'} },
          { title:'航班落地时间', type:'input', required:true, desc:'精确到分钟', props:{placeholder:'如：14:30',vModel:'landingTime',required:true} },
          { title:'机票预定信息截图', type:'upload', required:true, desc:'需要时间+航班号+地点', props:{vModel:'ticketScreenshot',required:true} },
          { title:'确认航班信息无误', type:'radio', required:true, props:{vModel:'confirmFlight',required:true,options:['已了解']} },
          { title:'微信个人二维码', type:'upload', required:true, desc:'用于添加接机服务群', props:{vModel:'wechatQR',required:true} },
          { title:'微信ID', type:'input', required:true, props:{placeholder:'请输入微信号',vModel:'wechatId',required:true} },
          { title:'邮箱 Email', type:'input', required:true, desc:'请使用学生邮箱', props:{placeholder:'xxx@uxx.edu',vModel:'email',required:true,regexValidation:'/^[\\w.-]+@[\\w.-]+\\.\\w+$/',regexMessage:'请输入正确的邮箱格式'} },
          { title:'手机号 Phone Number', type:'input', required:true, desc:'请填写可联系手机号（美国/中国均可）', props:{placeholder:'请使用落地即可联系的号码',vModel:'phone',required:true} },
          { title:'紧急联系人手机号', type:'input', required:false, desc:'仅限父母、亲缘关系或法定监护人', props:{placeholder:'紧急联系人手机号（选填）',vModel:'emergencyPhone'} },
          { title:'随行家长数量', type:'radio', required:true, desc:'每位学生最多同行2位，超出额外收费', props:{vModel:'parentCount',required:true,options:['0','1','2','更多（请备注）']} },
          { title:'随行人姓名', type:'input', required:false, desc:'用于接机时信息核对', props:{placeholder:'随行人姓名',vModel:'companionName'} },
          { title:'班车日期', type:'radio', required:true, props:{vModel:'shuttleDate',required:true,options:['9月14号','9月15号','9月16号','9月17号','9月18号']} },
          { title:'班车时间', type:'radio', required:true, desc:'班车时间为发车时间，请选择航班到达后1-1.5小时', props:{vModel:'shuttleTime',required:true,options:['12:30','17:30','22:30','其它时间请注明（专车接送）']} },
          { title:'登机箱数量 Carry-on', type:'select', required:true, desc:'小于56cmx36cmx23cm', props:{vModel:'carryOnCount',required:true,placeholder:'请选择',options:['0个','1个','2个','3个及以上']} },
          { title:'托运箱数量 Luggage', type:'select', required:true, desc:'大于56cmx36cmx23cm', props:{vModel:'checkedCount',required:true,placeholder:'请选择',options:['0个','1个','2个','3个','4个及以上']} },
          { title:'行李额度限制确认', type:'radio', required:true, props:{vModel:'confirmLuggage',required:true,options:['我了解，并且接受']} },
          { title:'确认信息无误并签署免责声明', type:'radio', required:true, desc:'法律免责声明', props:{vModel:'agreeDisclaimer',required:true,options:['已阅读并签署']} },
          { title:'电子签名', type:'input', required:true, desc:'请签署您的姓名作为电子签名', props:{placeholder:'请签名',vModel:'signature',required:true} },
          { title:'确认已添加负责人联系方式', type:'radio', required:true, props:{vModel:'confirmContact',required:true,options:['确认']} }
        ],
        features: ['payment','signature','conditional_logic','multi_page','identity_verification','shuttle_scheduling','luggage_management']
      }
    ];
  }

  /** Match user question to the best template(s) */
  function matchTemplates(question) {
    if (!FORM_TEMPLATES || !FORM_TEMPLATES.templates) return [];
    const q = question.toLowerCase();
    const scored = FORM_TEMPLATES.templates.map(t => {
      let score = 0;
      (t.keywords || []).forEach(kw => {
        if (q.includes(kw.toLowerCase())) score += 10;
      });
      // Partial name match
      if (q.includes(t.name.replace(/[/（）]/g, '').toLowerCase())) score += 20;
      if (t.nameEn && q.includes(t.nameEn.toLowerCase())) score += 15;
      return { template: t, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.template);
  }

  /** Format template library into system prompt knowledge section */
  function formatTemplateKnowledge() {
    if (!FORM_TEMPLATES || !FORM_TEMPLATES.templates) return '';

    const templates = FORM_TEMPLATES.templates;
    const complexityOrder = { simple: 1, medium: 2, high: 3, very_high: 4 };
    const sorted = [...templates].sort((a, b) =>
      (complexityOrder[a.complexity] || 2) - (complexityOrder[b.complexity] || 2)
    );

    let text = '\n\n## 真实表单模板库（基于802个MikeX生产表单深度研究，涵盖10+所大学）\n\n';
    text += '以下是从真实生产环境中提取的表单模板，覆盖留学生活动的全部主要场景（UCSD/UCI/UCD/USC/UCSB/UCLA/UMN/UCR等）。推荐字段时**必须参考这些模板**，根据用户描述匹配最接近的模板，使用其字段列表作为推荐基础。\n\n';

    text += '### 复杂度分级标准\n';
    text += '| 级别 | 字段数 | 典型场景 |\n';
    text += '|------|--------|----------|\n';
    text += '| 简单 simple | 5-8 | 免费晚会、素材收集、课友群 |\n';
    text += '| 中等 medium | 8-15 | 付费活动、社交活动、讲座、志愿者、找室友、比赛、酒店 |\n';
    text += '| 复杂 high | 15-25 | 招新、新生见面会、测验问卷、导师计划 |\n';
    text += '| 最复杂 very_high | 25-40+ | 新生接机（含支付/签名/条件逻辑） |\n\n';

    text += '### 模板详情\n\n';

    sorted.forEach(t => {
      const complexityLabel = { simple:'简单', medium:'中等', high:'复杂', very_high:'最复杂' };
      text += '#### ' + t.name + ' (' + t.nameEn + ')\n';
      text += '- **复杂度**: ' + (complexityLabel[t.complexity] || t.complexity) + ' | **推荐字段数**: ' + (t.fieldCount || t.fields.length) + '\n';
      text += '- **匹配关键词**: ' + (t.keywords || []).join('、') + '\n';
      if (t.features && t.features.length > 0) {
        text += '- **特色功能**: ' + t.features.join('、') + '\n';
      }
      text += '- **推荐字段**:\n';
      (t.fields || []).forEach(f => {
        const req = f.required ? '必填' : '选填';
        const typeLabel = getTypeName(f.type);
        text += '  - **' + f.title + '** (' + typeLabel + ', ' + req + ')';
        if (f.desc) text += ' — ' + f.desc;
        text += '\n';
        // Show key props
        if (f.props) {
          const propHints = [];
          if (f.props.placeholder) propHints.push('placeholder:"' + f.props.placeholder + '"');
          if (f.props.options) propHints.push('options:' + JSON.stringify(f.props.options.slice(0, 5)) + (f.props.options.length > 5 ? '...' : ''));
          if (f.props.regexValidation) propHints.push('regex:' + f.props.regexValidation);
          if (f.props.maxlength) propHints.push('maxlength:' + f.props.maxlength);
          if (propHints.length > 0) text += '    props: ' + propHints.join(', ') + '\n';
        }
      });
      text += '\n';
    });

    text += '### 重要推荐规则\n';
    text += '1. **根据活动复杂度自动调整字段数量** — 简单晚会只需5-6个字段，不要过度推荐；接机服务需要20+个字段\n';
    text += '2. **选项内容必须使用真实值** — 不要用"选项A/B/C"，使用具体的学校名、航空公司名、部门名等\n';
    text += '3. **双语标题** — 留学生场景下，字段标题应中英双语（如"姓名 Name"、"邮箱 Email"）\n';
    text += '4. **详细的placeholder** — 每个字段都应有具体的输入提示（如"xxx@ucsd.edu"而非"请输入"）\n';
    text += '5. **确认声明字段** — 复杂表单（付费/法律相关）必须包含确认勾选字段\n';
    text += '6. **联系方式完整性** — 留学生场景标配：姓名+手机+邮箱+微信号（4件套）\n';
    text += '7. **desc描述** — 每个字段的desc应说明为什么要收集这个信息\n';
    text += '8. **文本描述组件** — 在关键位置（表单顶部、支付前、签名前）插入说明文字/注意事项/免责声明\n';

    return text;
  }

  // ===== CSS 样式注入 =====
  // 将全部 CSS 通过 JS 动态创建 <style> 标签注入到页面 <head> 中
  // 避免依赖外部 CSS 文件，确保插件独立部署
  // 各组件样式说明见内联注释
  function injectStyles() {
    // 防止重复注入（页面切换时 checkAndInit 可能多次调用）
    if (document.getElementById('ai-form-assistant-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-form-assistant-styles';
    style.textContent = `
      /* ---------- 右下角浮动按钮（FAB） ---------- */
      .ai-assistant-fab {
        position: fixed; bottom: 24px; right: 24px;
        width: 56px; height: 56px; border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #a855f7);
        color: #fff; border: none; font-size: 14px; font-weight: 700;
        cursor: pointer; box-shadow: 0 4px 16px rgba(59,130,246,.4);
        z-index: 99999; transition: all .3s ease;
        display: flex; align-items: center; justify-content: center;
      }
      .ai-assistant-fab:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(59,130,246,.5); }

      /* ---------- 聊天主窗口（固定定位，右下角弹出） ---------- */
      .ai-assistant-window {
        position: fixed; bottom: 90px; right: 24px;
        width: 420px; height: 580px;
        min-width: 320px; min-height: 400px;
        background: #fff; border-radius: 16px;
        box-shadow: 0 16px 48px rgba(0,0,0,.18);
        z-index: 100000; display: none; flex-direction: column;
        overflow: hidden; border: 1px solid #e5e7eb;
        transition: border-radius .2s;
      }
      .ai-assistant-window.open { display: flex; animation: aiSlideUp .3s ease; }
      .ai-assistant-window.maximized {
        width: calc(100vw - 300px) !important; height: calc(100vh - 40px) !important;
        bottom: 20px !important; right: 20px !important; border-radius: 12px;
      }
      @keyframes aiSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

      /* ---------- 窗口拖拽调整大小手柄（左/上/左上三个方向） ---------- */
      .ai-resize-handle {
        position: absolute; z-index: 2;
      }
      .ai-resize-handle.left {
        top: 16px; bottom: 0; left: -3px; width: 6px; cursor: ew-resize;
      }
      .ai-resize-handle.top {
        top: -3px; left: 16px; right: 0; height: 6px; cursor: ns-resize;
      }
      .ai-resize-handle.top-left {
        top: -3px; left: -3px; width: 16px; height: 16px; cursor: nwse-resize;
      }
      .ai-resize-handle:hover { background: rgba(59,130,246,.15); border-radius: 3px; }

      /* ---------- 窗口顶部标题栏（含新对话/历史/最大化/关闭按钮） ---------- */
      .ai-assistant-header {
        padding: 14px 16px;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: #fff; display: flex; align-items: center;
        justify-content: space-between; flex-shrink: 0;
      }
      .ai-assistant-header h4 {
        margin: 0; font-size: 15px; font-weight: 600; color: #fff;
        display: flex; align-items: center; gap: 8px;
      }
      .ai-assistant-header .ai-header-actions {
        display: flex; align-items: center; gap: 8px;
      }
      .ai-assistant-header .ai-header-btn {
        background: rgba(255,255,255,.15); border: none; color: rgba(255,255,255,.9);
        font-size: 13px; cursor: pointer; padding: 4px 10px; line-height: 1;
        border-radius: 6px; transition: background .2s; display: flex; align-items: center; gap: 4px;
      }
      .ai-assistant-header .ai-header-btn:hover { background: rgba(255,255,255,.25); color: #fff; }
      .ai-assistant-header .ai-close-btn {
        background: none; border: none; color: rgba(255,255,255,.8);
        font-size: 22px; cursor: pointer; padding: 0; line-height: 1;
      }
      .ai-assistant-header .ai-close-btn:hover { color: #fff; }

      /* ---------- 历史对话面板（覆盖消息区域，绝对定位） ---------- */
      .ai-history-panel {
        position: absolute; top: 48px; left: 0; right: 0; bottom: 0;
        background: #fff; z-index: 10; display: flex; flex-direction: column;
        animation: aiSlideUp .2s ease; overflow: hidden;
      }
      .ai-history-panel-header {
        padding: 12px 16px; border-bottom: 1px solid #e5e7eb;
        display: flex; align-items: center; justify-content: space-between;
        font-size: 14px; font-weight: 600; color: #1f2937;
      }
      .ai-history-panel-header button {
        background: none; border: none; color: #6b7280; cursor: pointer; font-size: 18px;
      }
      .ai-history-panel-header button:hover { color: #1f2937; }
      .ai-history-list {
        flex: 1; overflow-y: auto; padding: 8px;
      }
      .ai-history-item {
        padding: 10px 12px; border-radius: 8px; cursor: pointer;
        margin-bottom: 4px; transition: background .15s;
        font-size: 13px; color: #374151; display: flex; flex-direction: column; gap: 2px;
      }
      .ai-history-item:hover { background: #f3f4f6; }
      .ai-history-item.active { background: #eff6ff; border-left: 3px solid #2563eb; }
      .ai-history-item-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ai-history-item-meta { font-size: 11px; color: #9ca3af; }
      .ai-history-empty {
        padding: 40px 20px; text-align: center; color: #9ca3af; font-size: 13px;
      }
      .ai-history-item-row {
        display: flex; align-items: center; justify-content: space-between; gap: 4px;
      }
      .ai-history-del {
        background: none; border: none; color: #d1d5db; cursor: pointer;
        font-size: 16px; padding: 0 4px; opacity: 0; transition: all .15s;
        flex-shrink: 0;
      }
      .ai-history-item:hover .ai-history-del { opacity: 1; }
      .ai-history-del:hover { color: #ef4444; }
      .ai-history-header-actions { display: flex; align-items: center; gap: 8px; }
      .ai-history-clear-all {
        background: none; border: 1px solid #e5e7eb; color: #6b7280; cursor: pointer;
        font-size: 11px; padding: 3px 8px; border-radius: 10px; transition: all .15s;
      }
      .ai-history-clear-all:hover { border-color: #f87171; color: #ef4444; }
      .ai-history-summary-badge {
        display: inline-block; background: #ecfdf5; color: #059669;
        font-size: 10px; padding: 1px 5px; border-radius: 6px; margin-left: 4px;
      }
      /* ---------- 系统消息（压缩历史通知等） ---------- */
      .ai-msg.system {
        align-self: center; text-align: center;
        background: #f0fdf4; color: #16a34a; font-size: 11px;
        padding: 6px 12px; border-radius: 12px; max-width: 90%;
        margin: 4px auto;
      }
      /* ---------- 字段推荐加载动画（AI 生成 FIELDS 时的等待提示） ---------- */
      .ai-fields-loading {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 14px; margin-top: 8px;
        background: #f0f7ff; border: 1px solid #bfdbfe;
        border-radius: 8px; font-size: 13px; color: #1d4ed8;
      }
      .ai-fields-loading-dots { display: inline-flex; gap: 4px; }
      .ai-fields-loading-dots span {
        width: 6px; height: 6px; background: #2563eb; border-radius: 50%;
        animation: ai-dot-bounce 1.2s ease-in-out infinite;
      }
      .ai-fields-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
      .ai-fields-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes ai-dot-bounce { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }
      /* ---------- 对话压缩提示条（对话过长时提示用户压缩历史） ---------- */
      .ai-compact-hint {
        display: none; align-items: center; justify-content: center; gap: 6px;
        padding: 6px 12px; background: #fefce8; border-top: 1px solid #fde68a;
        font-size: 11px; color: #92400e; flex-shrink: 0;
      }
      .ai-compact-hint button {
        background: #f59e0b; color: #fff; border: none; border-radius: 10px;
        padding: 2px 10px; font-size: 11px; cursor: pointer; transition: background .15s;
      }
      .ai-compact-hint button:hover { background: #d97706; }
      .ai-compact-hint button:disabled { background: #d1d5db; cursor: not-allowed; }

      /* ---------- 消息列表区域（flex 纵向布局，可滚动） ---------- */
      .ai-assistant-messages {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 12px;
      }
      /* ---------- 聊天气泡（用户/AI/系统三种角色） ---------- */
      .ai-msg {
        max-width: 85%; padding: 10px 14px; border-radius: 12px;
        font-size: 13px; line-height: 1.6; word-break: break-word;
      }
      .ai-msg.user {
        align-self: flex-end; background: #2563eb; color: #fff;
        border-bottom-right-radius: 4px;
      }
      .ai-msg.bot {
        align-self: flex-start; background: #f3f4f6; color: #1f2937;
        border-bottom-left-radius: 4px;
      }
      .ai-msg.bot p { margin: 0 0 3px; }
      .ai-msg.bot p:last-child { margin: 0; }
      .ai-msg.bot strong { color: #111827; }
      .ai-msg.bot code { background: #e5e7eb; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
      .ai-msg.bot ul, .ai-msg.bot ol { margin: 2px 0; padding-left: 16px; }
      .ai-msg.bot li { margin-bottom: 1px; }
      .ai-msg.typing::after { content: '...'; animation: aiDots 1.4s infinite; }
      @keyframes aiDots { 0%,20% { content: '.'; } 40% { content: '..'; } 60%,100% { content: '...'; } }

      /* ---------- AI 消息内 Markdown 渲染样式（代码块、表格、标题） ---------- */
      .ai-msg.bot pre.md-codeblock {
        background: #1f2937; color: #f3f4f6; padding: 10px 12px;
        border-radius: 6px; overflow-x: auto; font-size: 12px;
        line-height: 1.5; margin: 6px 0; white-space: pre-wrap;
      }
      .ai-msg.bot pre.md-codeblock code { background: none; padding: 0; color: inherit; }
      .ai-msg.bot table.md-table { border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 12px; }
      .ai-msg.bot table.md-table th, .ai-msg.bot table.md-table td { border: 1px solid #d1d5db; padding: 4px 8px; text-align: left; }
      .ai-msg.bot table.md-table th { background: #e5e7eb; font-weight: 600; }
      .ai-msg.bot h4, .ai-msg.bot h5 { margin: 4px 0 2px; font-weight: 600; }
      .ai-msg.bot h4 { font-size: 14px; }
      .ai-msg.bot h5 { font-size: 13px; }

      /* ---------- 快速操作按钮区（活动类型快捷选项，首次发消息后隐藏） ---------- */
      .ai-quick-area {
        padding: 8px 16px; display: flex; flex-wrap: wrap; gap: 6px;
        border-top: 1px solid #f3f4f6; flex-shrink: 0; max-height: 110px; overflow-y: auto;
        position: relative; transition: max-height .3s ease, opacity .3s ease, padding .3s ease;
      }
      .ai-quick-area.hidden {
        max-height: 0; padding: 0 16px; opacity: 0; overflow: hidden; border-top: none;
      }
      .ai-quick-btn {
        padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 14px;
        background: #fff; color: #6b7280; font-size: 11px; cursor: pointer;
        transition: all .2s; white-space: nowrap;
      }
      .ai-quick-btn:hover { border-color: #60a5fa; color: #2563eb; background: #eff6ff; }

      /* ---------- 底部输入区（textarea + 图片按钮 + 优化按钮 + 发送按钮） ---------- */
      .ai-input-area {
        padding: 12px 16px; border-top: 1px solid #e5e7eb;
        display: flex; gap: 8px; flex-shrink: 0;
      }
      .ai-input-area textarea {
        flex: 1; padding: 8px 12px; border: 1px solid #e5e7eb;
        border-radius: 12px; font-size: 13px; outline: none;
        resize: none; line-height: 1.4; max-height: 120px;
        overflow-y: auto; font-family: inherit; transition: border-color .2s;
      }
      .ai-input-area textarea:focus { border-color: #60a5fa; }
      .ai-input-area button#aiAssistantSend {
        width: 36px; height: 36px; border-radius: 50%;
        background: #2563eb; color: #fff; border: none;
        cursor: pointer; display: flex;
        align-items: center; justify-content: center;
        transition: all .2s; flex-shrink: 0;
      }
      .ai-input-area button#aiAssistantSend:hover { background: #1d4ed8; }
      .ai-input-area button#aiAssistantSend:disabled { background: #d1d5db; cursor: not-allowed; }
      .ai-input-area button#aiAssistantSend svg { margin-left: 2px; }

      /* ---------- 停止生成按钮（SSE 流式传输过程中显示） ---------- */
      .ai-stop-btn {
        display: none; align-self: center; padding: 5px 14px;
        border: 1px solid #d1d5db; border-radius: 16px; background: #fff;
        color: #6b7280; font-size: 12px; cursor: pointer; margin: 4px 0;
      }
      .ai-stop-btn:hover { border-color: #f87171; color: #ef4444; }
      .ai-stop-btn.visible { display: inline-flex; align-items: center; gap: 4px; }

      /* ---------- "在设计器中搭建"按钮（AI 返回 actions 后的一键执行按钮） ---------- */
      .ai-build-trigger-btn {
        display: block; margin-top: 10px; padding: 6px 14px;
        border: 1px solid #93c5fd; border-radius: 16px;
        background: linear-gradient(135deg, #eff6ff, #f0f0ff);
        color: #2563eb; font-size: 12px; cursor: pointer;
        transition: all .2s; font-weight: 500;
      }
      .ai-build-trigger-btn:hover { background: linear-gradient(135deg, #dbeafe, #e8e8ff); transform: translateY(-1px); }
      .ai-build-trigger-btn:disabled { opacity: .6; cursor: default; transform: none; }

      /* ---------- 后续操作选项按钮组（搭建完成后的"再加一个字段"等） ---------- */
      .ai-option-btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
      .ai-option-btn {
        padding: 6px 12px; border: 1px solid #bfdbfe; border-radius: 16px;
        background: #fff; color: #2563eb; font-size: 12px; cursor: pointer;
        transition: all .2s; line-height: 1.4;
      }
      .ai-option-btn:hover { background: #eff6ff; border-color: #60a5fa; transform: translateY(-1px); }

      /* ---------- 字段勾选面板（AI 推荐字段后，用户勾选确认再搭建） ---------- */
      .ai-field-picker { margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #fff; }
      .ai-field-picker-header {
        padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;
        font-size: 11px; color: #6b7280; display: flex; justify-content: space-between; align-items: center;
      }
      .ai-field-item {
        display: flex; align-items: center; gap: 8px; padding: 8px 12px;
        border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background .15s; user-select: none;
      }
      .ai-field-item:last-child { border-bottom: none; }
      .ai-field-item:hover { background: #eff6ff; }
      .ai-field-item.checked { background: rgba(59,130,246,.04); }
      .ai-field-cb {
        width: 16px; height: 16px; border: 2px solid #d1d5db; border-radius: 4px;
        flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        transition: all .15s; font-size: 10px; color: #fff;
      }
      .ai-field-item.checked .ai-field-cb { background: #3b82f6; border-color: #3b82f6; }
      .ai-field-info { flex: 1; min-width: 0; }
      .ai-field-name { font-size: 13px; font-weight: 500; color: #1f2937; }
      .ai-field-desc { font-size: 11px; color: #9ca3af; margin-top: 1px; }
      .ai-field-tag {
        padding: 2px 6px; border-radius: 8px; font-size: 10px;
        background: #f3f4f6; color: #6b7280; flex-shrink: 0; white-space: nowrap;
      }
      .ai-field-item.checked .ai-field-tag { background: #dbeafe; color: #2563eb; }
      .ai-field-actions {
        padding: 8px 12px; border-top: 1px solid #e5e7eb;
        display: flex; gap: 8px; background: #f9fafb;
      }
      .ai-field-build-btn {
        flex: 1; padding: 8px; border: none; border-radius: 8px;
        background: linear-gradient(135deg, #3b82f6, #a855f7);
        color: #fff; font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all .2s;
      }
      .ai-field-build-btn:hover { box-shadow: 0 2px 8px rgba(59,130,246,.3); transform: translateY(-1px); }
      .ai-field-build-btn:disabled { opacity: .6; cursor: default; transform: none; }

      /* ---------- 组件高亮脉冲动画（搭建完成时画布组件闪烁提示） ---------- */
      .ai-highlight-pulse {
        animation: aiHighlight 1s ease-out;
      }
      @keyframes aiHighlight {
        0% { box-shadow: 0 0 0 0 rgba(59,130,246,.5); }
        70% { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
        100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
      }

      /* ---------- 底部状态栏（搭建进度、错误提示等临时消息，4秒后自动隐藏） ---------- */
      .ai-status-bar {
        padding: 4px 16px; background: #f0fdf4; border-top: 1px solid #bbf7d0;
        font-size: 11px; color: #16a34a; text-align: center; flex-shrink: 0;
        display: none;
      }
      .ai-status-bar.visible { display: block; }
      .ai-status-bar.error { background: #fef2f2; border-color: #fecaca; color: #dc2626; }

      /* ---------- 提示词优化按钮（星形图标，调 AI 优化用户输入） ---------- */
      .ai-enhance-btn {
        width: 32px; height: 32px; border-radius: 8px;
        background: transparent; color: #9ca3af; border: 1px solid #e5e7eb;
        cursor: pointer; display: flex;
        align-items: center; justify-content: center;
        transition: all .2s; flex-shrink: 0;
      }
      .ai-enhance-btn:hover { background: #fffbeb; color: #f59e0b; border-color: #fcd34d; }
      .ai-enhance-btn:disabled { opacity: .4; cursor: not-allowed; }
      .ai-enhance-btn.loading svg { animation: aiSpin .8s linear infinite; }
      @keyframes aiSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

      /* ---------- 图片上传按钮及预览区域 ---------- */
      .ai-img-btn {
        width: 32px; height: 32px; border-radius: 8px;
        background: transparent; color: #9ca3af; border: 1px solid #e5e7eb;
        cursor: pointer; display: flex;
        align-items: center; justify-content: center;
        transition: all .2s; flex-shrink: 0;
      }
      .ai-img-btn:hover { background: #eff6ff; color: #3b82f6; border-color: #93c5fd; }
      .ai-img-preview {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;
        flex-shrink: 0;
      }
      .ai-img-preview img {
        width: 48px; height: 48px; object-fit: cover; border-radius: 6px;
        border: 1px solid #e5e7eb;
      }
      .ai-img-preview .ai-img-info {
        flex: 1; min-width: 0; font-size: 11px; color: #6b7280;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .ai-img-preview .ai-img-remove {
        background: none; border: none; color: #9ca3af; cursor: pointer;
        font-size: 16px; padding: 2px 4px; line-height: 1;
      }
      .ai-img-preview .ai-img-remove:hover { color: #ef4444; }

      /* ---------- AI 消息中的图片展示 ---------- */
      .ai-msg.bot img.md-img {
        max-width: 100%; border-radius: 8px; margin: 4px 0;
        cursor: pointer; transition: opacity .2s;
      }
      .ai-msg.bot img.md-img:hover { opacity: .85; }
      .ai-msg.user .ai-user-img {
        max-width: 200px; max-height: 150px; border-radius: 8px;
        margin-top: 6px; display: block;
      }
    `;
    document.head.appendChild(style);
  }

  // ===== 轻量 Markdown 渲染器 =====
  // 自行实现而非引入第三方库，减少包体积
  // 渲染流程：代码块占位 → 图片/链接 → 表格 → 标题 → 加粗/斜体 → 行内代码 → 列表 → 段落 → 还原代码块
  // 所有用户可控内容均通过 escHtml() 转义，防止 XSS 注入
  function renderMd(text) {
    if (!text) return '';
    let html = text;
    // Code blocks
    const codeBlocks = [];
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      codeBlocks.push('<pre class="md-codeblock"><code>' + escHtml(code.trim()) + '</code></pre>');
      return '\x00CB' + (codeBlocks.length - 1) + '\x00';
    });
    // Images: ![alt](url) — sanitize URL to prevent XSS
    html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, (_, alt, url) => {
      return '<img class="md-img" src="' + escHtml(url) + '" alt="' + escHtml(alt) + '" loading="lazy">';
    });
    // Links: [text](url) — only allow http/https URLs
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, text, url) => {
      return '<a href="' + escHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escHtml(text) + '</a>';
    });
    // Tables (escape cell content to prevent XSS)
    html = html.replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_, hdr, body) => {
      const ths = hdr.split('|').map(c => '<th>' + escHtml(c.trim()) + '</th>').join('');
      const rows = body.trim().split('\n').map(r => '<tr>' + r.split('|').filter(Boolean).map(c => '<td>' + escHtml(c.trim()) + '</td>').join('') + '</tr>').join('');
      return '<table class="md-table"><thead><tr>' + ths + '</tr></thead><tbody>' + rows + '</tbody></table>';
    });
    // Headings — don't escHtml so inline markdown (bold/code) rendered earlier is preserved
    html = html.replace(/^####\s+(.+)$/gm, (_, t) => '<h5>' + t + '</h5>');
    html = html.replace(/^###\s+(.+)$/gm, (_, t) => '<h4>' + t + '</h4>');
    // Bold + italic (escape content to prevent XSS)
    html = html.replace(/\*\*(.+?)\*\*/g, (_, t) => '<strong>' + escHtml(t) + '</strong>');
    html = html.replace(/\*(.+?)\*/g, (_, t) => '<em>' + escHtml(t) + '</em>');
    // Inline code (escape content to prevent XSS)
    html = html.replace(/`([^`]+)`/g, (_, t) => '<code>' + escHtml(t) + '</code>');
    // Unordered lists — preserve already-rendered inline HTML (strong, em, code, a, img)
    html = html.replace(/^[-*]\s+(.+)$/gm, (_, t) => '<li>' + t + '</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Escape any remaining raw HTML tags in paragraph text (XSS protection)
    // At this point, all intentional HTML (headings, bold, code, lists, tables, images)
    // has already been generated. Any remaining < > are from AI output and should be escaped.
    html = html.replace(/<(?!\/?(?:h[1-6]|p|br|strong|em|code|pre|ul|li|table|thead|tbody|tr|th|td|img|a)\b)[^>]*>/g, function(tag) {
      return tag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
    // P1 修复：清除允许列表标签上的事件处理属性，防止 XSS
    // 例如 <a onmouseover="alert(1)"> 或 <img onerror="alert(1)">
    html = html.replace(/<(a|img)(\s[^>]*)>/gi, function(_, tag, attrs) {
      attrs = attrs.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
      return '<' + tag + attrs + '>';
    });
    // Paragraphs — collapse excessive blank lines
    html = html.replace(/\n{3,}/g, '\n\n');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<br>\s*<\/p>/g, '</p>');
    // Restore code blocks
    html = html.replace(/\x00CB(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)]);
    return html;
  }

  /** HTML 实体转义 —— 所有动态内容渲染前必须经过此函数 */
  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ===== Vue Bridge 层（核心） =====
  // 本模块负责与后台管理系统（RuoYi + Vue 2）的表单设计器实例进行交互
  // 通过 DOM 查找 __vue__ 获取 Vue 实例引用，直接操作其 drawingList（组件列表）
  //
  // 核心调用链：
  //   getVueInstance() → 查找并缓存 Vue 实例
  //   findComponentTemplate(type) → 从组件面板中查找组件模板
  //   addComponentToDesigner(type) → 克隆模板并添加到画布
  //   setComponentProp(key, value) → 设置当前选中组件的属性
  //   executeActions(actions) → 批量执行 AI 返回的操作指令
  //
  // 兼容性：同时支持 drawingList（旧版）和 drawingData（新版）两种数据结构
  //          支持单页和多页（pages[]）表单

  /** 判断一个 Vue 实例是否为表单设计器（通过是否拥有 drawingList/drawingData 判定） */
  function isDesignerVm(vm) {
    return vm && (vm.drawingList || vm.drawingData);
  }

  /**
   * 获取当前页面的组件列表数组（兼容层）
   * 优先级：drawingList/drawingData → 多页模式 pages[currentPage].components
   * 返回的是 Vue 响应式数组的引用，对其 push/splice 会直接触发界面更新
   */
  function getDrawingList(vm) {
    if (!vm) return null;
    // Try flat drawingList/drawingData first
    var dl = vm.drawingList || vm.drawingData;
    if (dl && dl.length > 0) return dl;
    // Fallback: multi-page structure pages[currentPage].components
    if (vm.pages && vm.pages.length > 0) {
      // currentPage may be 1-based string or 0-based number
      var rawIdx = vm.currentPage;
      var pageIdx = typeof rawIdx === 'string' ? parseInt(rawIdx, 10) : (rawIdx || 0);
      // Handle 1-based index: if pageIdx >= pages.length, try pageIdx-1
      if (pageIdx >= vm.pages.length && pageIdx > 0) pageIdx = pageIdx - 1;
      var page = vm.pages[pageIdx];
      if (!page) page = vm.pages[0]; // ultimate fallback to first page
      if (page && page.components) return page.components;
      if (page && page.drawingData) return page.drawingData;
    }
    // Return drawingData even if empty (for addComponent to work)
    return dl || null;
  }

  /**
   * 查找并缓存表单设计器的 Vue 实例
   * 查找策略（按优先级）：
   *   1. 通过 CSS 选择器查找 DOM 元素上的 __vue__ 属性
   *   2. 向上遍历 $parent 链（最多10层）
   *   3. 从 #app 根实例递归遍历 $children
   * 缓存的实例如果 _isDestroyed 则自动重新查找
   */
  function getVueInstance() {
    // 检测缓存的实例是否已被销毁（页面切换时会发生）
    if (vueInstance && vueInstance._isDestroyed) {
      vueInstance = null;
      _componentCache = null; // Clear cache when VM is destroyed
    }

    // Try multiple selectors to find the form designer Vue instance
    const selectors = [
      '.container',
      '.center-board',
      '#app',
      '.drawing-board',
      '[class*="designer"]',
      '[class*="generator"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.__vue__) {
        const vm = el.__vue__;
        // Check if this is the form designer instance (has drawingList or drawingData)
        if (isDesignerVm(vm) || vm.$parent && isDesignerVm(vm.$parent)) {
          vueInstance = isDesignerVm(vm) ? vm : vm.$parent;
          return vueInstance;
        }
        // Walk up the component tree
        let parent = vm.$parent;
        let depth = 0;
        while (parent && depth < 10) {
          if (isDesignerVm(parent)) {
            vueInstance = parent;
            return vueInstance;
          }
          parent = parent.$parent;
          depth++;
        }
      }
    }

    // Fallback: traverse all Vue instances from root
    const app = document.getElementById('app');
    if (app && app.__vue__) {
      const root = app.__vue__.$root;
      function findDesigner(vm) {
        if (isDesignerVm(vm)) return vm;
        if (vm.$children) {
          for (const child of vm.$children) {
            const found = findDesigner(child);
            if (found) return found;
          }
        }
        return null;
      }
      vueInstance = findDesigner(root);
      return vueInstance;
    }

    return null;
  }

  /**
   * 动态发现 Vue 实例中的所有组件模板数组
   * 通过扫描 vm._data 中名称包含 "Component" 的数组属性
   * 如果动态发现失败，回退到硬编码的属性名（inputComponents 等）
   * 返回值：组件模板数组的数组，如 [[输入型模板...], [选择型模板...], [布局型模板...]]
   */
  function getComponentSources(vm) {
    if (!vm) return [];
    // Collect all arrays that look like component templates
    var sources = [];
    var dataKeys = Object.keys(vm._data || {});
    dataKeys.forEach(function(k) {
      if (/[Cc]omponent/.test(k)) {
        var v = vm[k];
        if (Array.isArray(v) && v.length > 0 && v[0] && (v[0].tag || v[0].tagIcon || (v[0].__config__ && (v[0].__config__.tag || v[0].__config__.tagIcon)))) {
          sources.push(v);
        }
      }
    });
    // Fallback to hardcoded names if dynamic discovery found nothing
    if (sources.length === 0) {
      [vm.inputComponents, vm.processedInputComponents, vm.selectComponents, vm.processedSelectComponents, vm.layoutComponents].forEach(function(s) {
        if (Array.isArray(s) && s.length > 0) sources.push(s);
      });
    }
    return sources;
  }

  /**
   * 根据类型名查找对应的组件模板对象
   * 处理歧义类型：textarea/password/input 共享 el-input 标签，通过 tagIcon 区分
   * 同理 date/daterange 共享 el-date-picker，time/timerange 共享 el-time-picker
   * 查找优先级：动态缓存 → 标签匹配 + 子类型匹配 → tagIcon/label 回退
   */
  function findComponentTemplate(type) {
    const vm = vueInstance;
    if (!vm) return null;

    // Try dynamic cache first — direct template match
    const cache = buildComponentCache();
    const cacheEntry = cache[type] || cache[type.replace(/-/g, '').toLowerCase()];
    if (cacheEntry && cacheEntry.template) {
      // For ambiguous types (textarea/password/input share el-input, date/daterange share el-date-picker),
      // verify the cache entry is the right sub-type before returning
      const ambiguousTypes = ['textarea', 'password', 'input', 'daterange', 'date', 'timerange', 'time'];
      if (!ambiguousTypes.includes(type)) {
        return cacheEntry.template;
      }
    }

    const tag = getTypeTag(type);
    if (!tag) {
      // Last resort: if cache has an entry with matching tagIcon, use its tag
      if (cacheEntry && cacheEntry.tag) {
        // Fall through to source search with this tag
      } else {
        return cacheEntry ? cacheEntry.template : null;
      }
    }
    const effectiveTag = tag || (cacheEntry && cacheEntry.tag);

    // Dynamically discover all component template arrays
    const sources = getComponentSources(vm);

    for (const arr of sources) {
      for (const tpl of arr) {
        // Match by tag
        if (tpl.tag === effectiveTag) {
          // For textarea vs input, check config
          if (type === 'textarea' && tpl.tag === 'el-input') {
            if (tpl.tagIcon === 'textarea' || tpl.label === '多行文本' ||
                (tpl.type && tpl.type === 'textarea') ||
                (tpl.__config__ && tpl.__config__.tagIcon === 'textarea')) {
              return tpl;
            }
            continue;
          }
          if (type === 'password' && tpl.tag === 'el-input') {
            if (tpl.tagIcon === 'password' || tpl.label === '密码' ||
                (tpl.__config__ && tpl.__config__.tagIcon === 'password')) {
              return tpl;
            }
            continue;
          }
          if (type === 'input' && tpl.tag === 'el-input') {
            if (tpl.tagIcon === 'input' || tpl.label === '单行文本' ||
                (!tpl.type || tpl.type !== 'textarea') &&
                (tpl.__config__ && tpl.__config__.tagIcon === 'input')) {
              return tpl;
            }
            // Default el-input if no specific match
            if (!tpl.tagIcon && !tpl.__config__) return tpl;
          }
          // Date range vs date
          if (type === 'daterange' && tpl.tag === 'el-date-picker') {
            if ((tpl.type && tpl.type.includes('range')) ||
                (tpl.__config__ && tpl.__config__.tagIcon === 'date-range')) {
              return tpl;
            }
            continue;
          }
          if (type === 'date' && tpl.tag === 'el-date-picker') {
            if ((!tpl.type || !tpl.type.includes('range')) ||
                (tpl.__config__ && tpl.__config__.tagIcon === 'date')) {
              return tpl;
            }
          }
          // Time range vs time
          if (type === 'timerange' && tpl.tag === 'el-time-picker') {
            if (tpl['is-range'] || (tpl.__config__ && tpl.__config__.tagIcon === 'time-range')) {
              return tpl;
            }
            continue;
          }
          if (type === 'time' && tpl.tag === 'el-time-picker') {
            if (!tpl['is-range']) return tpl;
          }
          // Generic match for non-ambiguous tags
          if (!['el-input', 'el-date-picker', 'el-time-picker'].includes(effectiveTag)) {
            return tpl;
          }
        }
      }
    }

    // Fallback: search by tagIcon or label
    for (const arr of sources) {
      for (const tpl of arr) {
        const conf = tpl.__config__ || tpl;
        if (conf.tagIcon === type || conf.label === getTypeName(type)) {
          return tpl;
        }
      }
    }

    // Cache miss — force rebuild cache and log warning
    if (!cacheEntry) {
      console.warn('[AI Form Assistant] Type not in cache, forcing rebuild:', type);
      buildComponentCache(true);
    }

    return null;
  }

  /**
   * 向设计器画布添加一个新组件
   * 步骤：查找模板 → 深度克隆 → 生成唯一 formId → 添加到 drawingList → 设为活跃组件
   * 注意：添加后需要延迟修复 placeholder，因为 Vue watcher 可能异步篡改值
   */
  function addComponentToDesigner(type) {
    const vm = vueInstance;
    if (!vm) return false;

    const tpl = findComponentTemplate(type);
    if (!tpl) {
      console.warn('[AI Assistant] Component template not found for type:', type);
      return false;
    }

    try {
      // Clone the template (the designer usually has a clone method)
      let comp;
      if (typeof vm.cloneComponent === 'function') {
        comp = vm.cloneComponent(tpl);
      } else {
        // Manual deep clone with new formId
        comp = JSON.parse(JSON.stringify(tpl));
        const conf = comp.__config__ || comp;
        conf.formId = Date.now() + Math.floor(Math.random() * 1000);
        conf.renderKey = Date.now();
      }

      // Save original placeholder before adding (designer watcher may corrupt it)
      var origPh = comp.placeholder || (comp.__config__ || comp).placeholder;

      // Add to drawing list
      if (typeof vm.addComponent === 'function') {
        vm.addComponent(comp);
      } else {
        var dl = getDrawingList(vm);
        if (!dl) { console.warn('[AI Assistant] No drawing list available'); return false; }
        dl.push(comp);
        // Make it active
        if (typeof vm.activeFormItem === 'function') {
          vm.activeFormItem(comp);
        } else {
          vm.activeData = comp;
          vm.activeId = (comp.__config__ || comp).formId;
        }
      }

      // Schedule placeholder fix — designer watcher may corrupt it asynchronously
      if (origPh) {
        var fixComp = vm.activeData || comp;
        setTimeout(function() {
          var c = vm.activeData;
          if (!c) return;
          var curPh = c.placeholder || '';
          var cLabel = (c.__config__ || c).label || '';
          // Detect corruption: placeholder has label repeated multiple times
          if (cLabel && curPh.indexOf(cLabel) >= 0) {
            var esc = cLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var m = curPh.match(new RegExp(esc, 'g'));
            if (m && m.length > 1) {
              // Deduplicate
              var fi = curPh.indexOf(cLabel);
              var fixed = curPh.substring(0, fi + cLabel.length) + curPh.substring(fi + cLabel.length).replace(new RegExp(esc, 'g'), '');
              c.placeholder = fixed;
              var cc = c.__config__ || c;
              if (cc !== c) cc.placeholder = fixed;
              console.log('[AI Form Assistant] Fixed corrupted placeholder after add:', curPh, '->', fixed);
            }
          }
        }, 50);
      }

      return true;
    } catch (e) {
      console.error('[AI Assistant] Failed to add component:', e);
      return false;
    }
  }

  // 当前活跃的行容器引用 —— addToRow 操作会将子组件添加到此容器中
  let _activeRowContainer = null;

  /**
   * 添加行容器组件（用于多列布局）
   * 行容器内的子组件通过 addComponentToRow() 添加，用 span 属性控制列宽
   * 添加完成后通过 endRowContainer() 结束上下文
   */
  function addRowContainer(type) {
    const vm = vueInstance;
    if (!vm) return false;

    // Find the row template — row is special: no tag, no __config__, just tagIcon on root
    let tpl = findComponentTemplate('row');
    if (!tpl) {
      // Direct fallback: row template lives in layoutComponents with tagIcon='row'
      const sources = getComponentSources(vm);
      for (const arr of sources) {
        for (const t of arr) {
          const conf = t.__config__ || t;
          if (conf.tagIcon === 'row' || t.tagIcon === 'row') {
            tpl = t;
            break;
          }
        }
        if (tpl) break;
      }
      // Last resort: check vm.layoutComponents directly
      if (!tpl && vm.layoutComponents) {
        for (const t of vm.layoutComponents) {
          if ((t.__config__ || t).tagIcon === 'row' || t.tagIcon === 'row') {
            tpl = t;
            break;
          }
        }
      }
      if (!tpl) {
        console.warn('[AI Form Assistant] Row template not found even with direct search');
        return false;
      }
      console.log('[AI Form Assistant] Row template found via direct search fallback');
    }

    try {
      let comp;
      if (typeof vm.cloneComponent === 'function') {
        comp = vm.cloneComponent(tpl);
      } else {
        comp = JSON.parse(JSON.stringify(tpl));
        const conf = comp.__config__ || comp;
        conf.formId = Date.now() + Math.floor(Math.random() * 1000);
        conf.renderKey = Date.now();
      }

      // Ensure children array exists
      if (!comp.children) comp.children = [];
      var conf = comp.__config__ || comp;
      if (!conf.children) conf.children = [];

      // Set row type if specified (default, flex, grid)
      if (type) comp.type = type;

      // Add to drawing list (use splice for Vue 2 reactivity)
      if (typeof vm.addComponent === 'function') {
        vm.addComponent(comp);
      } else {
        var dl = getDrawingList(vm);
        if (!dl) { console.warn('[AI Assistant] No drawing list available'); return false; }
        dl.splice(dl.length, 0, comp);
        if (typeof vm.activeFormItem === 'function') {
          vm.activeFormItem(comp);
        } else {
          vm.activeData = comp;
          vm.activeId = conf.formId;
        }
      }

      // Set as active row for subsequent addToRow actions
      // IMPORTANT: vm.addComponent() may clone the object, so we must get
      // the actual reference from the drawingList (the last item added)
      var dlAfter = getDrawingList(vm);
      var actualComp = dlAfter[dlAfter.length - 1];
      var isRow = actualComp && (actualComp.tagIcon === 'row' || (actualComp.__config__ || {}).tagIcon === 'row' || actualComp.layout === 'rowFormItem');
      _activeRowContainer = isRow ? actualComp : comp;
      console.log('[AI Form Assistant] Added row container, ready for children. Ref match:', _activeRowContainer === actualComp, 'isRow:', isRow);
      return true;
    } catch (e) {
      console.error('[AI Form Assistant] Failed to add row container:', e);
      return false;
    }
  }

  /** 在当前活跃行容器内添加子组件（使用 splice 触发 Vue 2 响应式更新） */
  function addComponentToRow(type) {
    const vm = vueInstance;
    if (!vm || !_activeRowContainer) {
      console.warn('[AI Form Assistant] No active row container for addToRow');
      return false;
    }

    const tpl = findComponentTemplate(type);
    if (!tpl) {
      console.warn('[AI Form Assistant] Component template not found for type:', type);
      return false;
    }

    try {
      let comp;
      if (typeof vm.cloneComponent === 'function') {
        comp = vm.cloneComponent(tpl);
      } else {
        comp = JSON.parse(JSON.stringify(tpl));
        const conf = comp.__config__ || comp;
        conf.formId = Date.now() + Math.floor(Math.random() * 1000);
        conf.renderKey = Date.now();
      }

      // Add to row's children array using Vue-reactive methods
      var rowConf = _activeRowContainer.__config__ || _activeRowContainer;
      var childrenArr = _activeRowContainer.children || rowConf.children;
      if (!childrenArr) {
        // Use $set to make the array reactive from the start
        childrenArr = [comp];
        if (vm.$set) {
          vm.$set(_activeRowContainer, 'children', childrenArr);
          if (rowConf !== _activeRowContainer) vm.$set(rowConf, 'children', childrenArr);
        } else {
          _activeRowContainer.children = childrenArr;
          if (rowConf !== _activeRowContainer) rowConf.children = childrenArr;
        }
      } else {
        // Use splice to trigger Vue reactivity (Vue 2 intercepts splice)
        childrenArr.splice(childrenArr.length, 0, comp);
      }

      // Make child the active component for subsequent prop setting
      if (typeof vm.activeFormItem === 'function') {
        vm.activeFormItem(comp);
      } else {
        vm.activeData = comp;
        vm.activeId = (comp.__config__ || comp).formId;
      }

      console.log('[AI Form Assistant] Added child "' + type + '" to row container');
      return true;
    } catch (e) {
      console.error('[AI Form Assistant] Failed to add component to row:', e);
      return false;
    }
  }

  function endRowContainer() {
    _activeRowContainer = null;
    console.log('[AI Form Assistant] Ended row container context');
    return true;
  }

  /**
   * 设置当前活跃组件的属性值
   * 此函数是 Vue Bridge 中最复杂的部分，需要处理：
   *   1. 特殊属性（required/placeholder/label/vModel/options/regex/condition 等）各有定制逻辑
   *   2. placeholder 防腐蚀 —— Vue watcher 会在 label 变更时自动生成 "请输入{label}" 覆盖原值
   *   3. 范围组件（daterange/timerange）使用 start-placeholder 而非 placeholder
   *   4. 选项归一化 —— 字符串/数组/对象统一转为 [{label, value}] 格式
   *   5. 属性名兼容 —— 自动尝试 camelCase/kebab-case 转换和别名映射
   *   6. 类型强转 —— 已知的布尔/数值属性自动转换类型
   *   7. 兜底 —— 找不到属性时强制创建新属性
   */
  function setComponentProp(key, value) {
    const vm = vueInstance;
    if (!vm || !vm.activeData) return false;

    const comp = vm.activeData;
    const conf = comp.__config__ || comp;

    try {
      // === Special keys that need custom handling ===
      if (key === 'required') {
        // Boolean coercion
        var boolVal = value === true || value === 'true';
        var res = smartSetProp(comp, 'required', boolVal);
        if (!res.ok) conf.required = boolVal; // force set on config
        return true;
      }

      if (key === 'placeholder') {
        // Range components (daterange/timerange) use start-placeholder/end-placeholder
        var compTag = comp.tag || (conf !== comp ? conf.tag : '') || '';
        var compTagIcon = (conf !== comp ? conf.tagIcon : comp.tagIcon) || '';
        var isRange = comp['is-range'] || compTagIcon === 'date-range' || compTagIcon === 'time-range'
          || (compTag === 'el-date-picker' && (comp.type === 'daterange' || comp.type === 'datetimerange'))
          || (compTag === 'el-time-picker' && comp['is-range']);
        if (isRange) {
          // Set start-placeholder; don't touch regular placeholder
          smartSetProp(comp, 'start-placeholder', value);
          if (!smartSetProp(comp, 'startPlaceholder', value).ok) {
            comp['start-placeholder'] = value;
          }
          console.log('[AI Form Assistant] Range component: set start-placeholder to', value);
          return true;
        }

        // Guard: skip if component already has a valid placeholder
        var curPh = comp.placeholder || (conf !== comp ? conf.placeholder : '') || '';
        var label = (conf !== comp ? conf.label : comp.label) || '';
        if (value && label) {
          // Deduplicate: if label appears more than once in value, strip extras
          var escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          var matches = value.match(new RegExp(escaped, 'g'));
          if (matches && matches.length > 1) {
            var first = value.indexOf(label);
            value = value.substring(0, first + label.length) + value.substring(first + label.length).replace(new RegExp(escaped, 'g'), '');
            console.log('[AI Form Assistant] Deduped placeholder:', value);
          }
        }
        // If new value equals existing, skip
        if (curPh && value && curPh === value) return true;
        // If both contain label and new value is just "请输入"+label (default pattern), skip
        if (curPh && label && curPh.indexOf(label) >= 0 && value && value.indexOf(label) >= 0) {
          // Only skip if new value matches the default "请输入/请选择" + label pattern
          var defaultPattern = new RegExp('^(请输入|请选择)' + escaped + '$');
          if (defaultPattern.test(value)) {
            console.log('[AI Form Assistant] Skipping default placeholder set. Current:', curPh, 'New:', value);
            return true;
          }
          // Otherwise it's a custom placeholder — allow it through
        }
        // Sync placeholder on both comp and __config__
        comp.placeholder = value;
        if (conf !== comp) conf.placeholder = value;
        return true;
      }

      if (key === 'label') {
        // Save current placeholder before label change — Vue watcher will corrupt it
        var savedPh = comp.placeholder || (conf !== comp ? conf.placeholder : '') || '';
        // Sync label on both layers
        if (conf !== comp) conf.label = value;
        comp.label = value;
        // Restore placeholder after Vue watcher fires — use multiple retries
        // because Vue's nextTick and watcher timing is unpredictable
        if (savedPh) {
          var restorePh = function(attempt) {
            var curPh = comp.placeholder || '';
            if (curPh !== savedPh) {
              comp.placeholder = savedPh;
              if (conf !== comp) conf.placeholder = savedPh;
              console.log('[AI Form Assistant] Fixed placeholder after label change (attempt ' + attempt + '):', curPh, '->', savedPh);
            }
          };
          setTimeout(function() { restorePh(1); }, 30);
          setTimeout(function() { restorePh(2); }, 100);
          setTimeout(function() { restorePh(3); }, 250);
        }
        return true;
      }

      if (key === 'field' || key === 'vModel') {
        // Sanitize: vModel must be a safe identifier (letters, digits, underscores, dots)
        var safeVModel = String(value).replace(/[^a-zA-Z0-9_.]/g, '');
        if (!safeVModel) { console.warn('[AI Form Assistant] Invalid vModel value rejected:', value); return false; }
        var r = smartSetProp(comp, 'vModel', safeVModel);
        if (!r.ok) { comp.vModel = safeVModel; } // force create
        return true;
      }

      if (key === 'options') {
        // Normalize options to [{label, value}]
        let opts;
        if (typeof value === 'string') {
          opts = value.split(',').map((label, i) => ({ label: label.trim(), value: i + 1 }));
        } else if (Array.isArray(value)) {
          opts = value.map((item, i) => {
            if (typeof item === 'string') return { label: item, value: i + 1 };
            return { label: item.label || item, value: item.value !== undefined ? item.value : i + 1 };
          });
        }
        if (opts && opts.length > 0) {
          // Dynamically detect where options live on this component
          if (comp.options !== undefined) comp.options = opts;
          if (conf.children) {
            conf.children = opts.map(o => ({ __config__: { label: o.label }, label: o.label, value: o.value }));
          }
          if (comp.__slot__) {
            comp.__slot__.options = opts;
          }
          // If none of the above paths existed, try setting directly
          if (comp.options === undefined && !conf.children && !comp.__slot__) {
            comp.options = opts;
          }
        }
        return true;
      }

      if (key === 'regexValidation' || key === 'regex' || key === 'pattern') {
        // Add a regex validation rule to regList
        // Value can be: a regex string, or an object {pattern, message}
        var regPattern = value;
        var regMsg = comp.__pendingRegexMsg || '格式不正确';
        if (typeof value === 'object' && value !== null) {
          regPattern = value.pattern || value.regex || value.expression || String(value);
          regMsg = value.message || value.msg || regMsg;
        }
        var listKey = comp.regList !== undefined ? 'regList' : (comp.regexList !== undefined ? 'regexList' : 'regList');
        if (!comp[listKey]) comp[listKey] = [];
        // Use splice for Vue 2 reactivity
        comp[listKey].splice(comp[listKey].length, 0, { pattern: String(regPattern), message: regMsg });
        delete comp.__pendingRegexMsg;
        console.log('[AI Form Assistant] Added regex rule:', regPattern, 'msg:', regMsg);
        return true;
      }

      if (key === 'regexMessage' || key === 'regMsg') {
        var rList = comp.regList || comp.regexList || [];
        if (rList.length > 0) rList[rList.length - 1].message = value;
        else comp.__pendingRegexMsg = value;
        return true;
      }

      // === Conditional display (v-if / show expression) ===
      if (key === 'condition' || key === 'showExpression' || key === 'vIf') {
        // Sanitize: block script injection in expressions
        var exprStr = String(value);
        if (/<script|javascript:|on\w+\s*=/i.test(exprStr)) {
          console.warn('[AI Form Assistant] Unsafe expression rejected:', value);
          return false;
        }
        // Store as a custom property for form rendering logic
        // The form designer uses __config__.showExpression or similar
        conf.showExpression = exprStr;
        comp.showExpression = exprStr;
        // Also try setting on __config__.changeTag for conditional rendering
        if (conf !== comp) {
          conf.changeTag = true; // Enable conditional rendering flag
        }
        console.log('[AI Form Assistant] Set conditional display:', value);
        return true;
      }

      // === Special: autosize for textarea ===
      if (key === 'autosize' && value && typeof value === 'object') {
        comp.autosize = value;
        if (conf !== comp) conf.autosize = value;
        return true;
      }

      // === Special: prefix-icon / suffix-icon ===
      if (key === 'prefixIcon' || key === 'prefix-icon') {
        comp['prefix-icon'] = value;
        if (conf !== comp) conf['prefix-icon'] = value;
        return true;
      }
      if (key === 'suffixIcon' || key === 'suffix-icon') {
        comp['suffix-icon'] = value;
        if (conf !== comp) conf['suffix-icon'] = value;
        return true;
      }

      // === Special: cascader props.props (nested object for multiple, checkStrictly, etc.) ===
      if (key === 'props' && value && typeof value === 'object') {
        // Cascader has a nested props.props structure: { props: { multiple: true, checkStrictly: false } }
        if (!comp.props) comp.props = {};
        if (typeof comp.props === 'object') {
          // Deep merge: props.props.multiple, props.props.checkStrictly, etc.
          for (var pk in value) {
            if (value.hasOwnProperty(pk)) {
              comp.props[pk] = value[pk];
            }
          }
          console.log('[AI Form Assistant] Set cascader nested props:', JSON.stringify(comp.props));
          return true;
        }
      }
      // Also handle dot-notation like "props.multiple" directly
      if (key.startsWith('props.') && key.length > 6) {
        var subKey = key.substring(6);
        if (!comp.props) comp.props = {};
        if (typeof comp.props === 'object') {
          comp.props[subKey] = value;
          console.log('[AI Form Assistant] Set cascader props.' + subKey + ' =', value);
          return true;
        }
      }

      // === Special: upload properties ===
      if (key === 'buttonText') {
        comp.buttonText = value;
        if (conf !== comp) conf.buttonText = value;
        return true;
      }
      if (key === 'accept') {
        comp.accept = value;
        if (conf !== comp) conf.accept = value;
        return true;
      }
      if (key === 'fileSize') {
        comp.fileSize = parseInt(value) || 2;
        if (conf !== comp) conf.fileSize = comp.fileSize;
        return true;
      }
      if (key === 'sizeUnit') {
        comp.sizeUnit = value;
        if (conf !== comp) conf.sizeUnit = value;
        return true;
      }

      // === Type coercion for known numeric/boolean keys ===
      var boolKeys = ['showWordLimit', 'show-word-limit', 'multiple', 'showTip', 'disabled', 'readonly',
        'allowHalf', 'allow-half', 'showScore', 'show-score', 'showText', 'show-text',
        'clearable', 'filterable', 'border', 'show-password', 'show-stops', 'range',
        'is-range', 'show-all-levels', 'show-alpha', 'step-strictly', 'auto-upload'];
      var numKeys = ['maxlength', 'max', 'min', 'step', 'span', 'spanCount', 'gutter',
        'maxSize', 'labelWidth', 'precision', 'fileSize', 'rows'];

      if (boolKeys.indexOf(key) >= 0) value = value === true || value === 'true';
      if (numKeys.indexOf(key) >= 0) value = key === 'step' || key === 'maxSize' ? parseFloat(value) : parseInt(value);

      // === Alias mapping: try known aliases ===
      var aliases = {
        'spanCount': 'span', 'maxSize': 'fileSize',
        'showWordLimit': 'show-word-limit', 'activeText': 'active-text',
        'inactiveText': 'inactive-text', 'activeColor': 'active-color',
        'inactiveColor': 'inactive-color', 'activeValue': 'active-value',
        'inactiveValue': 'inactive-value', 'allowHalf': 'allow-half',
        'showScore': 'show-score', 'showText': 'show-text',
        'startPlaceholder': 'start-placeholder', 'endPlaceholder': 'end-placeholder',
        'listType': 'list-type', 'dateType': 'type', 'rangeSeparator': 'range-separator',
        'controlsPosition': 'controls-position', 'stepStrictly': 'step-strictly',
        'showStops': 'show-stops', 'showAllLevels': 'show-all-levels',
        'showAlpha': 'show-alpha', 'colorFormat': 'color-format',
        'isRange': 'is-range', 'showPassword': 'show-password',
        'autoUpload': 'auto-upload', 'valueFormat': 'value-format',
        'prefixIcon': 'prefix-icon', 'suffixIcon': 'suffix-icon',
        'optionType': 'optionType', 'pickerOptions': 'picker-options'
      };

      // Try primary key first
      var result = smartSetProp(comp, key, value);
      if (result.ok) return true;

      // Try alias
      if (aliases[key]) {
        result = smartSetProp(comp, aliases[key], value);
        if (result.ok) return true;
      }

      // Try reverse alias lookup
      for (var aliasKey in aliases) {
        if (aliases[aliasKey] === key) {
          result = smartSetProp(comp, aliasKey, value);
          if (result.ok) return true;
        }
      }

      // Last resort: force-set on comp (new property)
      comp[key] = value;
      console.log('[AI Form Assistant] Property "' + key + '" not found on component, force-created.');

      // Trigger schema rebuild for future reference
      buildPropSchema(true);
      return true;
    } catch (e) {
      console.error('[AI Assistant] Failed to set property:', key, value, e);
      return false;
    }
  }

  /**
   * 基于 MutationObserver 的确认弹窗自动关闭器
   * 问题背景：清空画布时 Element UI 会弹出确认对话框，阻塞后续操作
   * 解决方案：在 actionRunning 期间监听 DOM 变化，发现确认按钮立即自动点击
   * 只安装一次，仅在 actionRunning=true 时生效
   */
  var _dialogDismissObserver = null;
  function installDialogAutoDismiss() {
    if (_dialogDismissObserver) return; // already installed
    _dialogDismissObserver = new MutationObserver(function() {
      if (!actionRunning) return; // only auto-dismiss during action execution
      var btn = document.querySelector('.el-message-box__btns .el-button--primary');
      if (btn) {
        btn.click();
        console.log('[AI Form Assistant] Auto-dismissed confirmation dialog');
      }
    });
    _dialogDismissObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * 清空设计器画布
   * 多层防御措施确保清空成功：
   *   1. 安装持久化弹窗自动关闭器
   *   2. 立即关闭已有弹窗
   *   3. 临时覆盖 Vue.prototype.$confirm 直接返回 resolve
   *   4. 清空 pages/drawingList/drawingData 数组
   *   5. 500ms 后恢复原始 $confirm
   */
  function clearDesignerCanvas() {
    const vm = vueInstance;
    if (!vm) return false;

    // Monkey-patch $confirm 作为额外安全层（清空时会触发确认弹窗）
    var Vue = vm.$root && vm.$root.constructor;
    var origConfirm = null;
    if (Vue && Vue.prototype.$confirm) {
      origConfirm = Vue.prototype.$confirm;
      Vue.prototype.$confirm = function() {
        return Promise.resolve('confirm');
      };
    }

    try {
      // 安装持久化弹窗自动关闭器
      installDialogAutoDismiss();

      // 立即关闭已有弹窗
      var existingBtn = document.querySelector('.el-message-box__btns .el-button--primary');
      if (existingBtn) existingBtn.click();

      // 清空数据数组
      if (vm.pages && vm.pages.length > 0) {
        var rawIdx = vm.currentPage;
        var pidx = typeof rawIdx === 'string' ? parseInt(rawIdx, 10) : (rawIdx || 0);
        if (pidx >= vm.pages.length && pidx > 0) pidx = pidx - 1;
        var page = vm.pages[pidx] || vm.pages[0];
        if (page && page.components) page.components.splice(0);
        if (page && page.drawingData) page.drawingData.splice(0);
      }
      var dl = vm.drawingList || vm.drawingData;
      if (dl && typeof dl.splice === 'function') dl.splice(0);
      vm.activeData = null;
      vm.activeId = null;

      return true;
    } catch (e) {
      console.error('[AI Assistant] Failed to clear canvas:', e);
      return false;
    } finally {
      // P0 修复：无论成功还是异常，都必须恢复原始 $confirm
      // 否则全局所有确认弹窗会被静默跳过
      if (origConfirm) {
        Vue.prototype.$confirm = origConfirm;
      }
    }
  }

  // ===== 多页表单支持 =====
  /** 添加新页面（复杂表单可分多页，如 PVSA 证书申请表） */
  function addDesignerPage() {
    var vm = vueInstance;
    if (!vm) return false;
    if (typeof vm.addPage === 'function') {
      vm.addPage();
      return true;
    }
    // Fallback: manually add page to pages array
    if (vm.pages && Array.isArray(vm.pages)) {
      var newId = String(vm.pages.length + 1);
      vm.pages.push({ id: newId, name: '页面 ' + newId, components: [] });
      vm.currentPage = newId;
      return true;
    }
    return false;
  }

  /** 切换到指定页面（0-based 索引） */
  function switchDesignerPage(pageIndex) {
    var vm = vueInstance;
    if (!vm) return false;
    if (typeof vm.handlePageChange === 'function') {
      var pageId = vm.pages && vm.pages[pageIndex] ? vm.pages[pageIndex].id : String(pageIndex + 1);
      vm.handlePageChange(pageId);
      return true;
    }
    if (vm.currentPage !== undefined && vm.pages && vm.pages[pageIndex]) {
      vm.currentPage = vm.pages[pageIndex].id || String(pageIndex + 1);
      return true;
    }
    return false;
  }

  /**
   * 设置表单名称
   * 优先通过 Vue 数据绑定设置 formConf.formRef（最可靠）
   * 回退方案：查找 DOM 中的表单名称输入框，通过原生 setter 触发 input 事件
   */
  function setFormName(name) {
    const vm = vueInstance;
    if (vm && vm.formConf) {
      vm.$set ? vm.$set(vm.formConf, 'formRef', name) : (vm.formConf.formRef = name);
      console.log('[AI Form Assistant] Set form name to "' + name + '" via formConf.formRef');
      return true;
    }

    // Fallback: try to find the form name input (narrow selector to avoid icon inputs)
    const inputs = document.querySelectorAll('input[placeholder*="表单名"], input[placeholder*="模板名"]');
    for (const input of inputs) {
      // P2 修复：添加 null 检查，兼容非标准浏览器环境
      const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      if (desc && desc.set) {
        desc.set.call(input, name);
      } else {
        input.value = name;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  /**
   * 设置表单级属性（非组件属性）
   * 支持：labelPosition/labelWidth/gutter/size 等表单布局属性
   *       appearance.* 前缀的外观属性（背景色等）
   *       bgColor/backgroundColor 直接映射到 appearance 对象
   */
  function setFormProperty(key, value) {
    const vm = vueInstance;
    if (!vm) return false;

    // Handle appearance.* keys (e.g. appearance.bgColor, appearance.background)
    if (key.startsWith('appearance.') && vm.appearance) {
      var appKey = key.substring('appearance.'.length);
      vm.appearance[appKey] = value;
      return true;
    }
    // Also handle bgColor/backgroundColor directly → route to appearance
    if (/^(bgColor|backgroundColor|formBgColor|background)$/i.test(key) && vm.appearance) {
      // Try common keys in appearance
      var bgKeys = ['bgColor', 'backgroundColor', 'formBgColor', 'background'];
      for (var bi = 0; bi < bgKeys.length; bi++) {
        if (vm.appearance[bgKeys[bi]] !== undefined) {
          vm.appearance[bgKeys[bi]] = value;
          return true;
        }
      }
      // Force-set on appearance
      vm.appearance.bgColor = value;
      return true;
    }

    // Dynamically find form config object
    var formConf = vm.formConf || vm.formData || vm.conf;
    if (!formConf) {
      // Probe for form config in _data
      var dataKeys = Object.keys(vm._data || {});
      for (var i = 0; i < dataKeys.length; i++) {
        var dk = dataKeys[i];
        if (/form.*conf|conf.*form|formData/i.test(dk) && typeof vm[dk] === 'object' && vm[dk] !== null) {
          formConf = vm[dk];
          break;
        }
      }
    }
    if (!formConf) return false;

    try {
      // Type coercion
      var numFormKeys = ['labelWidth', 'gutter'];
      var boolFormKeys = ['disabled'];
      if (numFormKeys.indexOf(key) >= 0) value = parseInt(value) || 0;
      if (boolFormKeys.indexOf(key) >= 0) value = value === true || value === 'true';

      // Try direct set
      if (formConf[key] !== undefined) {
        formConf[key] = value;
        return true;
      }

      // Try kebab/camel variants
      var kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (kebab !== key && formConf[kebab] !== undefined) {
        formConf[kebab] = value;
        return true;
      }
      var camel = key.replace(/-([a-z])/g, function(_, c) { return c.toUpperCase(); });
      if (camel !== key && formConf[camel] !== undefined) {
        formConf[camel] = value;
        return true;
      }

      // Force set (new property)
      formConf[key] = value;
      console.log('[AI Form Assistant] Form prop "' + key + '" not found, force-created on formConf.');
      buildFormPropSchema(true);
      return true;
    } catch (e) {
      console.error('[AI Assistant] Failed to set form property:', key, value, e);
      return false;
    }
  }

  /**
   * Set conditional display on a component.
   * Makes the component visible only when another field meets a condition.
   */
  function setComponentCondition(compIndex, fieldVModel, operator, condValue) {
    const vm = vueInstance;
    const dl = getDrawingList(vm);
    if (!vm || !dl) return false;

    var comp = null;
    // Support string index as vModel/label lookup (more reliable than numeric index)
    if (typeof compIndex === 'string') {
      for (var ci = 0; ci < dl.length; ci++) {
        var cc = dl[ci].__config__ || dl[ci];
        if ((cc.vModel || dl[ci].vModel) === compIndex || cc.label === compIndex) { comp = dl[ci]; break; }
      }
    } else if (typeof compIndex === 'number' && compIndex < dl.length) {
      comp = dl[compIndex];
    }
    if (!comp) comp = vm.activeData || dl[dl.length - 1];
    if (!comp) return false;

    var conf = comp.__config__ || comp;
    // Map operator aliases to actual designer operators
    var opMap = { eq: '===', ne: '!==', gt: '>', lt: '<', gte: '>=', lte: '<=', contains: 'includes' };
    var actualOp = opMap[operator] || operator || '===';

    // Use actual backend condition structure: { enable, field, operator, value }
    if (!conf.condition || typeof conf.condition !== 'object') {
      conf.condition = { enable: false, field: '', operator: '===', value: '' };
    }
    conf.condition.enable = true;
    conf.condition.field = fieldVModel;
    conf.condition.operator = actualOp;
    conf.condition.value = condValue;

    // Also set legacy fields if they exist
    if ('conditionEnabled' in conf) conf.conditionEnabled = true;
    if ('showCondition' in conf) {
      conf.showCondition = { field: fieldVModel, op: actualOp, val: condValue };
    }

    console.log('[AI Form Assistant] Set condition on component:', conf.label, '→ show when', fieldVModel, actualOp, condValue);
    return true;
  }

  /** 选中画布上的指定组件（支持数字索引或 vModel/label 字符串查找） */
  function selectComponent(index) {
    const vm = vueInstance;
    const dl = getDrawingList(vm);
    if (!vm || !dl) return false;
    var comp = null;
    // Support string index as vModel/label lookup
    if (typeof index === 'string') {
      for (var si = 0; si < dl.length; si++) {
        var sc = dl[si].__config__ || dl[si];
        if ((sc.vModel || dl[si].vModel) === index || sc.label === index) { comp = dl[si]; break; }
      }
    } else if (typeof index === 'number' && index < dl.length) {
      comp = dl[index];
    }
    if (!comp) return false;
    if (typeof vm.activeFormItem === 'function') {
      vm.activeFormItem(comp);
    } else {
      vm.activeData = comp;
      vm.activeId = (comp.__config__ || comp).formId;
    }
    return true;
  }

  /** 删除画布上的指定组件（支持数字索引或 vModel/label 字符串查找） */
  function removeComponent(index) {
    const vm = vueInstance;
    const dl = getDrawingList(vm);
    if (!vm || !dl) return false;
    var targetIdx = -1;
    if (typeof index === 'string') {
      for (var ri = 0; ri < dl.length; ri++) {
        var rc = dl[ri].__config__ || dl[ri];
        if ((rc.vModel || dl[ri].vModel) === index || rc.label === index) { targetIdx = ri; break; }
      }
    } else if (typeof index === 'number') {
      targetIdx = index;
    }
    if (targetIdx < 0 || targetIdx >= dl.length) return false;
    dl.splice(targetIdx, 1);
    // Reset active item if we deleted the active one
    if (dl.length > 0) {
      var newIdx = Math.min(targetIdx, dl.length - 1);
      if (typeof vm.activeFormItem === 'function') {
        vm.activeFormItem(dl[newIdx]);
      } else {
        vm.activeData = dl[newIdx];
        vm.activeId = (dl[newIdx].__config__ || dl[newIdx]).formId;
      }
    } else {
      // Canvas is now empty — clear dangling references
      vm.activeData = null;
      vm.activeId = null;
    }
    return true;
  }

  // ===== 操作执行器（将 AI 返回的 actions 指令逐条执行到设计器） =====
  // AI 返回的 actions 是一个 JSON 数组，每条指令有 {a: 操作类型, ...参数}
  // 执行器按顺序逐条执行，每步之间有延迟（add=450ms, clear=300ms, 其他=200ms）
  // 全部执行完后只调用一次 $forceUpdate() 刷新界面（性能优化）
  let actionRunning = false;  // 防止并发执行

  /**
   * 批量执行 AI 操作指令
   * @param {Array} actions - 操作指令数组，如 [{a:'clear'}, {a:'add',t:'input'}, {a:'prop',k:'label',v:'姓名'}]
   * @param {Function} onComplete - 全部执行完成后的回调
   *
   * 预处理：多个 remove 操作按索引降序排列，避免删除时索引偏移
   * 执行中：显示 "搭建中... (X/Y)" 进度条
   * 安全措施：前一个 select 失败时跳过后续 prop 操作，防止修改错误组件
   */
  function executeActions(actions, onComplete) {
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    // Refresh Vue instance
    getVueInstance();
    if (!vueInstance) {
      updateStatus('未找到表单设计器实例', true);
      if (onComplete) onComplete();
      return;
    }

    // Pre-process: reorder multiple remove actions to delete from highest index first
    // This prevents index shifting when deleting multiple items by numeric index
    var removeActions = [];
    var otherActions = [];
    var hasOnlyRemoves = true;
    for (var ri = 0; ri < actions.length; ri++) {
      var ract = actions[ri].a || actions[ri].action;
      if (ract === 'remove' || ract === 'delete') {
        removeActions.push(actions[ri]);
      } else {
        otherActions.push(actions[ri]);
        hasOnlyRemoves = false;
      }
    }
    if (removeActions.length > 1 && hasOnlyRemoves) {
      // Sort removes: string indices first (vModel lookup, order doesn't matter),
      // then numeric indices descending (highest first to avoid shifting)
      removeActions.sort(function(a, b) {
        var ai = a.i !== undefined ? a.i : a.index;
        var bi = b.i !== undefined ? b.i : b.index;
        if (typeof ai === 'string' && typeof bi === 'string') return 0;
        if (typeof ai === 'string') return -1;
        if (typeof bi === 'string') return 1;
        return bi - ai; // descending numeric
      });
      actions = removeActions;
    }

    actionRunning = true;
    let i = 0;
    let successCount = 0;
    let modifyCount = 0;
    let removeCount = 0;
    let lastSelectOk = true; // Track if last select succeeded

    function runStep() {
      if (i >= actions.length) {
        actionRunning = false;
        // P1 修复：操作完成后断开 MutationObserver，避免持续监听全 DOM
        if (_dialogDismissObserver) {
          _dialogDismissObserver.disconnect();
          _dialogDismissObserver = null;
        }
        // Single forceUpdate after all actions complete
        const vm = vueInstance;
        if (vm && vm.$forceUpdate) vm.$forceUpdate();
        var statusParts = [];
        if (successCount > 0) statusParts.push('添加 ' + successCount + ' 个组件');
        if (modifyCount > 0) statusParts.push('修改 ' + modifyCount + ' 项属性');
        if (removeCount > 0) statusParts.push('删除 ' + removeCount + ' 个组件');
        updateStatus(statusParts.length ? '完成！' + statusParts.join('，') : '操作完成');
        if (onComplete) onComplete();
        return;
      }

      const s = actions[i];
      const act = s.a || s.action;
      let ok = false;

      // P2 修复：每个 case 用 {} 包裹，防止 const/let 声明在 strict mode 下的作用域隐患
      switch (act) {
        case 'clear': {
          ok = clearDesignerCanvas();
          break;
        }
        case 'name': {
          ok = setFormName(s.v || s.value);
          break;
        }
        case 'add': {
          var addType = s.t || s.type;
          if (addType === 'row') {
            ok = addRowContainer(s.t || 'default');
            if (ok) successCount++;
          } else {
            ok = addComponentToDesigner(addType);
            if (ok) { successCount++; lastSelectOk = true; }
          }
          break;
        }
        case 'prop': {
          if (!lastSelectOk) {
            console.warn('[AI Form Assistant] Skipping prop — previous select failed');
            break;
          }
          const key = s.k || s.key;
          let val = s.v !== undefined ? s.v : s.value;
          if (val === 'true') val = true;
          if (val === 'false') val = false;
          ok = setComponentProp(key, val);
          if (ok) modifyCount++;
          break;
        }
        case 'select': {
          const idx = s.i !== undefined ? s.i : s.index;
          ok = selectComponent(idx);
          lastSelectOk = ok;
          if (!ok) console.warn('[AI Form Assistant] Select failed for:', idx);
          break;
        }
        case 'formProp': {
          const fKey = s.k || s.key;
          const fVal = s.v !== undefined ? s.v : s.value;
          ok = setFormProperty(fKey, fVal);
          if (ok) modifyCount++;
          break;
        }
        case 'addPage': {
          ok = addDesignerPage();
          break;
        }
        case 'switchPage':
        case 'page': {
          const pi = s.i !== undefined ? s.i : (s.v !== undefined ? parseInt(s.v) : 0);
          ok = switchDesignerPage(pi);
          break;
        }
        case 'condition': {
          ok = setComponentCondition(s.i, s.field, s.op || 'eq', s.val);
          break;
        }
        case 'remove':
        case 'delete': {
          ok = removeComponent(s.i !== undefined ? s.i : s.index);
          if (ok) removeCount++;
          break;
        }
        case 'addRow': {
          ok = addRowContainer(s.t || s.type || 'default');
          if (ok) { successCount++; lastSelectOk = true; }
          break;
        }
        case 'addToRow': {
          ok = addComponentToRow(s.t || s.type);
          if (ok) successCount++;
          break;
        }
        case 'endRow': {
          ok = endRowContainer();
          break;
        }
      }

      i++;
      // Show progress during build
      if (actions.length > 3) {
        updateStatus('搭建中... (' + i + '/' + actions.length + ')');
      }
      const delay = (act === 'add') ? 450 : (act === 'clear') ? 300 : 200;
      setTimeout(runStep, delay);
    }

    runStep();
  }

  // ===== 状态栏 =====
  /** 显示临时状态消息（4秒后自动隐藏），isError=true 时显示为红色 */
  function updateStatus(msg, isError) {
    const bar = document.getElementById('aiAssistantStatus');
    if (!bar) return;
    bar.textContent = msg;
    bar.className = 'ai-status-bar visible' + (isError ? ' error' : '');
    setTimeout(() => { bar.className = 'ai-status-bar'; }, 4000);
  }

  // ===== UI 创建 =====
  // 动态创建完整的聊天界面 DOM 结构（不依赖任何模板文件）
  // 包括：FAB 按钮、聊天窗口（标题栏 + 消息区 + 快捷按钮 + 状态栏 + 输入区）
  function createUI() {
    if (uiInjected) return;
    uiInjected = true;
    injectStyles();

    // FAB button
    const fab = document.createElement('button');
    fab.id = 'aiAssistantFab';
    fab.className = 'ai-assistant-fab';
    fab.title = 'AI 表单助手';
    fab.textContent = 'AI';
    fab.onclick = toggleChat;
    document.body.appendChild(fab);

    // Chat window
    const win = document.createElement('div');
    win.id = 'aiAssistantWindow';
    win.className = 'ai-assistant-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'AI 表单设计助手');
    win.innerHTML = `
      <div class="ai-assistant-header" role="banner">
        <h4>AI 表单设计助手</h4>
        <div class="ai-header-actions">
          <button class="ai-header-btn" id="aiNewChatBtn" title="新建对话" aria-label="新建对话">+ 新对话</button>
          <button class="ai-header-btn" id="aiHistoryBtn" title="历史记录" aria-label="历史记录">= 历史</button>
          <button class="ai-header-btn" id="aiMaximizeBtn" title="最大化/还原" aria-label="最大化或还原窗口">[]</button>
          <button class="ai-close-btn" id="aiAssistantClose" aria-label="关闭">&times;</button>
        </div>
      </div>
      <div class="ai-assistant-messages" id="aiAssistantMessages" role="log" aria-live="polite" aria-label="对话消息">
        <div class="ai-msg bot">你好！我是 AI 表单设计助手，可以直接在设计器中帮你搭建表单。<br><br>点击下方活动类型快速开始，或直接描述你的需求：</div>
      </div>
      <div class="ai-quick-area">
        <button class="ai-quick-btn" data-q="帮我搭建一个免费晚会/派对报名表">晚会派对</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个付费活动报名表，比如篝火烧烤聚餐">付费活动</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个志愿者活动报名表">志愿者报名</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个社交/交友活动报名表">社交活动</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个讲座/研讨会报名表">讲座研讨</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个比赛/竞赛报名表">比赛竞赛</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个社团招新/部门招募申请表">社团招新</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个找室友/合租匹配表">找室友</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个课友群/选课互助表">课友互助</button>
        <button class="ai-quick-btn" data-q="帮我搭建一个照片/素材收集表">素材收集</button>
      </div>
      <div class="ai-status-bar" id="aiAssistantStatus"></div>
      <div class="ai-compact-hint" id="aiCompactHint">
        <span>对话较长，</span><button id="aiCompactBtn">压缩历史</button><span> 可优化性能</span>
      </div>
      <div class="ai-img-preview" id="aiImgPreview" style="display:none">
        <img id="aiImgThumb" src="" alt="preview">
        <span class="ai-img-info" id="aiImgName"></span>
        <button class="ai-img-remove" id="aiImgRemove" title="移除图片">&times;</button>
      </div>
      <div class="ai-input-area">
        <button class="ai-img-btn" id="aiImgBtn" title="上传图片"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></button>
        <input type="file" id="aiImgFile" accept="image/*" style="display:none">
        <textarea id="aiAssistantInput" placeholder="描述你想要的表单..." rows="1" aria-label="输入表单描述，Enter发送，Shift+Enter换行"></textarea>
        <button class="ai-enhance-btn" id="aiEnhanceBtn" title="优化提示词 — AI 帮你完善表单描述"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg></button>
        <button id="aiAssistantSend" aria-label="发送消息"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
      </div>
    `;
    // Add resize handles
    ['left', 'top', 'top-left'].forEach(dir => {
      const handle = document.createElement('div');
      handle.className = 'ai-resize-handle ' + dir;
      handle.dataset.dir = dir;
      win.appendChild(handle);
    });

    document.body.appendChild(win);

    // Event bindings
    document.getElementById('aiAssistantClose').onclick = toggleChat;
    document.getElementById('aiAssistantSend').onclick = sendChat;
    document.getElementById('aiNewChatBtn').onclick = startNewChat;
    document.getElementById('aiHistoryBtn').onclick = toggleHistoryPanel;
    document.getElementById('aiMaximizeBtn').onclick = toggleMaximize;

    // Image upload
    document.getElementById('aiImgBtn').onclick = () => document.getElementById('aiImgFile').click();
    document.getElementById('aiImgFile').onchange = handleImageSelect;
    document.getElementById('aiImgRemove').onclick = clearPendingImage;
    document.getElementById('aiEnhanceBtn').onclick = enhancePrompt;

    // P2 修复：通过 DOM 事件绑定而非暴露全局函数
    var compactBtn = document.getElementById('aiCompactBtn');
    if (compactBtn) compactBtn.onclick = compactHistory;

    // Escape to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && win.classList.contains('open')) {
        toggleChat();
      }
    });

    // Resize logic
    setupResize(win);

    const input = document.getElementById('aiAssistantInput');
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.isComposing && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
      // Shift+Enter: allow newline (default behavior)
    });
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    input.addEventListener('paste', function(e) {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) { updateStatus('图片大小不能超过 5MB'); return; }
          const reader = new FileReader();
          reader.onload = function(ev) {
            pendingImage = { base64: ev.target.result, name: '粘贴的图片.png', type: file.type };
            document.getElementById('aiImgThumb').src = ev.target.result;
            document.getElementById('aiImgName').textContent = '粘贴的图片 (' + (file.size / 1024).toFixed(0) + 'KB)';
            document.getElementById('aiImgPreview').style.display = 'flex';
          };
          reader.readAsDataURL(file);
          return; // Only handle first image
        }
      }
    });

    // Quick action buttons
    win.querySelectorAll('.ai-quick-btn').forEach(btn => {
      btn.onclick = function() {
        const q = this.getAttribute('data-q');
        document.getElementById('aiAssistantInput').value = q;
        // Hide quick area after click
        const quickArea = document.querySelector('.ai-quick-area');
        if (quickArea) quickArea.classList.add('hidden');
        sendChat();
      };
    });

    // Initialize conversation history
    loadConversations();
    if (!currentConversationId) {
      createNewConversation();
    }
  }

  function toggleChat() {
    const win = document.getElementById('aiAssistantWindow');
    const fab = document.getElementById('aiAssistantFab');
    if (!win || !fab) return;

    if (win.classList.contains('open')) {
      win.classList.remove('open');
      fab.style.display = 'flex';
      // Return focus to FAB when closing
      fab.focus();
    } else {
      win.classList.add('open');
      fab.style.display = 'none';
      // Re-detect Vue instance when opening
      getVueInstance();
      scrollChatBottom();
      // Auto-focus input for immediate typing
      setTimeout(function() {
        var input = document.getElementById('aiAssistantInput');
        if (input) input.focus();
      }, 100);
    }
  }

  /**
   * 智能滚动到底部
   * 只有用户当前位于底部附近（80px 内）时才自动滚动
   * 用户手动向上滚动查看历史时不强制拉回底部
   */
  function scrollChatBottom() {
    const msgs = document.getElementById('aiAssistantMessages');
    if (!msgs) return;
    // Only auto-scroll if user hasn't manually scrolled up
    const isNearBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
    if (isNearBottom) {
      requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });
    }
  }

  // ===== Maximize / Restore =====
  function toggleMaximize() {
    const win = document.getElementById('aiAssistantWindow');
    if (!win) return;
    const btn = document.getElementById('aiMaximizeBtn');
    if (win.classList.toggle('maximized')) {
      btn.textContent = '⧉';
      btn.title = '还原';
    } else {
      btn.textContent = '[]';
      btn.title = '最大化';
    }
    scrollChatBottom();
  }

  // ===== 窗口拖拽缩放 =====
  /** 为聊天窗口添加拖拽调整大小功能（左/上/左上三个方向），尺寸持久化到 localStorage */
  function setupResize(win) {
    const handles = win.querySelectorAll('.ai-resize-handle');
    let isResizing = false;

    handles.forEach(handle => {
      handle.addEventListener('mousedown', function(e) {
        if (win.classList.contains('maximized')) return;
        e.preventDefault();
        isResizing = true;
        const dir = handle.dataset.dir;
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = win.offsetWidth;
        const startH = win.offsetHeight;
        const startBottom = parseInt(getComputedStyle(win).bottom);
        const startRight = parseInt(getComputedStyle(win).right);

        document.body.style.cursor = getComputedStyle(handle).cursor;
        document.body.style.userSelect = 'none';

        function onMove(e) {
          const dx = startX - e.clientX;
          const dy = startY - e.clientY;

          if (dir === 'left' || dir === 'top-left') {
            const newW = Math.max(320, startW + dx);
            win.style.width = newW + 'px';
          }
          if (dir === 'top' || dir === 'top-left') {
            const newH = Math.max(400, startH + dy);
            win.style.height = newH + 'px';
          }
        }

        function onUp() {
          isResizing = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          // Save size preference
          try {
            localStorage.setItem('ai_window_size', JSON.stringify({
              width: win.offsetWidth, height: win.offsetHeight
            }));
          } catch(e) {}
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });

    // Restore saved size
    try {
      const saved = JSON.parse(localStorage.getItem('ai_window_size'));
      if (saved && saved.width >= 320 && saved.height >= 400) {
        win.style.width = saved.width + 'px';
        win.style.height = saved.height + 'px';
      }
    } catch(e) {}
  }

  // ===== 画布状态读取器（用于后续修改请求的上下文） =====
  /**
   * 读取当前设计器画布上所有组件的状态，格式化为文本摘要
   * 注入到系统提示词中，让 AI 了解画布上已有哪些组件
   * 这样用户说"把邮箱改成必填"时，AI 能用 select+prop 操作精准修改
   */
  function getCurrentCanvasState() {
    var vm = vueInstance;
    if (!vm) return '';
    var allFields = [];
    // Multi-page
    if (vm.pages && Array.isArray(vm.pages) && vm.pages.length > 0) {
      vm.pages.forEach(function(page, pi) {
        var comps = page.components || page.drawingList || page.list || [];
        comps.forEach(function(comp, ci) {
          var f = extractFieldFromComponent(comp);
          f.index = ci;
          f.page = pi;
          allFields.push(f);
        });
      });
    }
    // Single-page fallback
    if (allFields.length === 0) {
      var dl = getDrawingList(vm);
      if (dl && Array.isArray(dl)) {
        dl.forEach(function(comp, ci) {
          var f = extractFieldFromComponent(comp);
          f.index = ci;
          allFields.push(f);
        });
      }
    }
    if (allFields.length === 0) return '';
    // Format as concise state summary
    var lines = allFields.map(function(f, i) {
      var parts = [(f.index !== undefined ? f.index : i) + '. ' + f.label + ' (' + f.type + ')'];
      if (f.props && f.props.vModel) parts.push('vModel=' + f.props.vModel);
      if (f.props && f.props.required) parts.push('必填');
      if (f.props && f.props.placeholder) parts.push('placeholder=' + f.props.placeholder);
      if (f.props && f.props.options) parts.push('选项:' + f.props.options.join('/'));
      if (f.page !== undefined && vm.pages && vm.pages.length > 1) parts.push('页' + (f.page + 1));
      return parts.join(' | ');
    });
    return '\n\n## 当前画布状态（' + allFields.length + '个组件）\n以下是设计器画布中已有的组件，用户的修改请求基于此状态：\n' + lines.join('\n') + '\n\n**修改已有组件时**：先用 {"a":"select","i":"vModel值"} 选中，再用 {"a":"prop",...} 修改。新增用 {"a":"add",...}。删除用 {"a":"remove","i":"vModel值"}。';
  }

  // ===== 上下文构建器 =====
  /**
   * 根据用户问题的关键词匹配相关知识库片段
   * 用于补充系统提示词中的设计器使用知识
   * 最多返回3个片段，避免 token 超预算
   */
  function getRelevantContext(question) {
    const q = question.toLowerCase();
    const matches = [];
    const rules = [
      { keys: ['概述','布局','三栏','面板','画布','怎么用','是什么'], chunk: 'overview' },
      { keys: ['单行','多行','密码','计数','输入','文本'], chunk: 'input_components' },
      { keys: ['下拉','选择','级联','单选','多选','开关','滑块','时间','日期','评分','颜色','上传'], chunk: 'select_components' },
      { keys: ['行容器','按钮','布局','多列','并排'], chunk: 'layout_components' },
      { keys: ['选择','组件','建议','不生效'], chunk: 'faq_general' }
    ];
    const matched = new Set();
    rules.forEach(r => {
      if (r.keys.some(k => q.includes(k)) && !matched.has(r.chunk)) {
        matched.add(r.chunk);
        matches.push(KB_CHUNKS[r.chunk]);
      }
    });
    // For form building requests, add component overview as context
    const buildKeywords = ['搭建','创建','做一个','帮我做','帮我搭','表单','报名','招新','接机','晚会','活动','志愿','问卷'];
    if (buildKeywords.some(k => q.includes(k)) && !matched.has('overview')) {
      matches.push(KB_CHUNKS.overview);
    }
    if (matches.length === 0) {
      matches.push(KB_CHUNKS.overview, KB_CHUNKS.faq_general);
    }
    return matches.slice(0, 3).join('\n\n');
  }

  // ===== 字段勾选面板渲染器 =====
  /**
   * 当 AI 返回 [[FIELDS:...]] 标签时，渲染一个可勾选的字段列表面板
   * 用户可以：全选/取消全选、逐个勾选/取消、查看每个字段的类型标签
   * 点击"开始搭建"后，将选中的字段转换为 actions 指令数组交给 executeActions() 执行
   *
   * 性能优化：全选/取消时原地更新已有 DOM 行（toggleClass），不重建整个列表
   *
   * @param {Array} fields - AI 推荐的字段数组，每项 {label, type, desc, checked, props, children?}
   * @param {string} formName - 表单名称（用于 clear+name 操作）
   * @param {HTMLElement} containerEl - 面板挂载的父 DOM 元素（通常是 bot 消息气泡）
   */
  function renderFieldPicker(fields, formName, containerEl) {
    const picker = document.createElement('div');
    picker.className = 'ai-field-picker';

    const checkedCount = () => fields.filter(f => f.checked).length;

    // Header
    const header = document.createElement('div');
    header.className = 'ai-field-picker-header';
    const countSpan = document.createElement('span');
    countSpan.textContent = '已选 ' + checkedCount() + '/' + fields.length + ' 个字段';
    const toggleAll = document.createElement('span');
    toggleAll.style.cssText = 'cursor:pointer;color:#3b82f6';
    toggleAll.textContent = '全选';
    toggleAll.onclick = () => {
      const allChecked = fields.every(f => f.checked);
      fields.forEach(f => f.checked = !allChecked);
      toggleAll.textContent = allChecked ? '全选' : '取消全选';
      refreshItems();
    };
    header.appendChild(countSpan);
    header.appendChild(toggleAll);
    picker.appendChild(header);

    // Items
    const itemsWrap = document.createElement('div');
    picker.appendChild(itemsWrap);

    // P1 修复：将 buildBtn 声明移到 updateCounters 之前，消除 TDZ 隐患
    const actionsBar = document.createElement('div');
    actionsBar.className = 'ai-field-actions';
    const buildBtn = document.createElement('button');
    buildBtn.className = 'ai-field-build-btn';
    buildBtn.textContent = '开始搭建（' + checkedCount() + '个字段）';

    function updateCounters() {
      countSpan.textContent = '已选 ' + checkedCount() + '/' + fields.length + ' 个字段';
      buildBtn.textContent = '开始搭建（' + checkedCount() + '个字段）';
      buildBtn.disabled = checkedCount() === 0;
    }

    function refreshItems() {
      updateCounters();
      // Update existing rows in-place if available, else rebuild
      const existingRows = itemsWrap.querySelectorAll('.ai-field-item');
      if (existingRows.length === fields.length) {
        fields.forEach((f, idx) => {
          const row = existingRows[idx];
          row.className = 'ai-field-item' + (f.checked ? ' checked' : '');
          const cb = row.querySelector('.ai-field-cb');
          if (cb) cb.innerHTML = f.checked ? 'v' : '';
        });
        return;
      }
      itemsWrap.innerHTML = '';
      fields.forEach(f => {
        const row = document.createElement('div');
        row.className = 'ai-field-item' + (f.checked ? ' checked' : '');
        row.onclick = () => {
          f.checked = !f.checked;
          row.classList.toggle('checked');
          cb.innerHTML = f.checked ? 'v' : '';
          updateCounters();
        };

        const cb = document.createElement('div');
        cb.className = 'ai-field-cb';
        cb.innerHTML = f.checked ? 'v' : '';
        row.appendChild(cb);

        const info = document.createElement('div');
        info.className = 'ai-field-info';
        const name = document.createElement('div');
        name.className = 'ai-field-name';
        name.textContent = f.label;
        info.appendChild(name);
        if (f.desc) {
          const desc = document.createElement('div');
          desc.className = 'ai-field-desc';
          desc.textContent = f.desc;
          info.appendChild(desc);
        }
        row.appendChild(info);

        const tag = document.createElement('span');
        tag.className = 'ai-field-tag';
        tag.textContent = getTypeName(f.type);
        row.appendChild(tag);

        itemsWrap.appendChild(row);
      });
    }

    refreshItems();
    buildBtn.onclick = function() {
      const selected = fields.filter(f => f.checked);
      if (selected.length === 0) return;

      // Build actions with full property configuration
      const actions = [
        { a: 'clear' },
        { a: 'name', v: formName || '新建表单' },
        // Set form-level properties
        { a: 'formProp', k: 'labelPosition', v: 'right' },
        { a: 'formProp', k: 'labelWidth', v: 100 },
        { a: 'formProp', k: 'gutter', v: 15 },
        { a: 'formProp', k: 'size', v: 'medium' },
      ];
      // Condition actions are deferred until all components are added
      const deferredConditions = [];
      // Helper: convert a single field to actions
      function fieldToActions(f, idx, isRowChild) {
        var fieldActions = [];
        // Handle desc type: designer has no native desc component,
        // so use textarea (readonly, disabled) with content as defaultValue
        if (f.type === 'desc') {
          fieldActions.push({ a: isRowChild ? 'addToRow' : 'add', t: 'textarea' });
          fieldActions.push({ a: 'prop', k: 'label', v: f.label });
          var descVModel = (f.props && f.props.vModel) || 'notice_' + (idx + 1);
          fieldActions.push({ a: 'prop', k: 'vModel', v: descVModel });
          var descText = (f.props && f.props.defaultValue) || f.desc || '';
          if (descText) fieldActions.push({ a: 'prop', k: 'defaultValue', v: descText });
          fieldActions.push({ a: 'prop', k: 'readonly', v: true });
          fieldActions.push({ a: 'prop', k: 'disabled', v: true });
          fieldActions.push({ a: 'prop', k: 'required', v: false });
          var rowCount = Math.min(Math.max(Math.ceil(descText.length / 40), 4), 12);
          fieldActions.push({ a: 'prop', k: 'rows', v: rowCount });
          return fieldActions;
        }

        // Handle row container type
        if (f.type === 'row') {
          fieldActions.push({ a: 'addRow', t: (f.props && f.props.type) || 'default' });
          // Set row properties
          if (f.props) {
            ['justify', 'align', 'gutter', 'type'].forEach(function(k) {
              if (f.props[k] !== undefined) {
                fieldActions.push({ a: 'prop', k: k, v: f.props[k] });
              }
            });
          }
          // Add children
          if (f.children && Array.isArray(f.children)) {
            f.children.forEach(function(child, ci) {
              var childActions = fieldToActions(child, idx * 100 + ci, true);
              childActions.forEach(function(ca) { fieldActions.push(ca); });
            });
          }
          fieldActions.push({ a: 'endRow' });
          return fieldActions;
        }

        fieldActions.push({ a: isRowChild ? 'addToRow' : 'add', t: f.type });
        fieldActions.push({ a: 'prop', k: 'label', v: f.label });

        // Auto-generate vModel if not provided
        const vModel = (f.props && f.props.vModel) || 'field' + (idx + 1);
        fieldActions.push({ a: 'prop', k: 'vModel', v: vModel });

        // Set required (from props or inferred from desc containing "必填")
        const isRequired = (f.props && f.props.required === true) ||
                           (f.desc && f.desc.includes('必填'));
        fieldActions.push({ a: 'prop', k: 'required', v: isRequired });

        if (f.props) {
          Object.entries(f.props).forEach(([k, v]) => {
            if (k === 'vModel' || k === 'required') return;

            if (k === 'regexValidation') {
              fieldActions.push({ a: 'prop', k: 'regexValidation', v: v });
              const msg = f.props.regexMessage || '格式不正确';
              fieldActions.push({ a: 'prop', k: 'regexMessage', v: msg });
              return;
            }
            if (k === 'regexMessage') return;

            if (k === 'condition' && v && typeof v === 'object') {
              var condField = v.field || v.dependsOn || '';
              var condOp = v.operator || v.op || '===';
              var condVal = v.value !== undefined ? v.value : '';
              if (condField) {
                var targetVModel = (f.props && f.props.vModel) || 'field' + (idx + 1);
                deferredConditions.push({ a: 'condition', i: targetVModel, field: condField, op: condOp, val: String(condVal) });
              }
              return;
            }

            fieldActions.push({ a: 'prop', k, v });
          });
        }
        return fieldActions;
      }

      selected.forEach((f, idx) => {
        var fa = fieldToActions(f, idx, false);
        fa.forEach(function(a) { actions.push(a); });
      });

      // Append deferred condition actions at the end (after all components are added)
      if (deferredConditions.length > 0) {
        deferredConditions.forEach(c => actions.push(c));
        console.log('[AI Form Assistant] Deferred ' + deferredConditions.length + ' condition actions to end');
      }

      // Disable picker during build
      buildBtn.disabled = true;
      buildBtn.textContent = '搭建中...';
      picker.style.opacity = '.7';
      picker.style.pointerEvents = 'none';

      executeActions(actions, () => {
        buildBtn.textContent = '搭建完成';
        picker.style.opacity = '1';

        // Completion message
        const msgs = document.getElementById('aiAssistantMessages');
        const doneEl = document.createElement('div');
        doneEl.className = 'ai-msg bot';
        doneEl.innerHTML = renderMd('已在设计器中搭建好 **' + formName + '**，包含 ' + selected.length + ' 个字段。\n\n你可以在画布中查看和调整，满意后点击顶部「提交」按钮保存。');

        // Follow-up options — context-aware based on form type
        const wrap = document.createElement('div');
        wrap.className = 'ai-option-btns';
        var followUps = ['再加一个字段', '修改某个字段', '设置条件显示'];
        // Add contextual suggestions based on field count
        if (selected.length < 8) {
          followUps.push('字段太少，帮我补充');
        } else if (selected.length > 12) {
          followUps.push('拆成多页表单');
        }
        followUps.push('这样就好了');
        followUps.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'ai-option-btn';
          btn.textContent = opt;
          btn.onclick = function() {
            wrap.querySelectorAll('.ai-option-btn').forEach(b => { b.disabled = true; b.style.opacity = '.5'; });
            btn.style.opacity = '1';
            btn.style.borderColor = '#3b82f6';
            btn.style.background = '#eff6ff';
            document.getElementById('aiAssistantInput').value = opt;
            sendChat();
          };
          wrap.appendChild(btn);
        });
        doneEl.appendChild(wrap);
        msgs.appendChild(doneEl);
        aiChatHistory.push({ role: 'bot', text: '已搭建 ' + formName + '，含' + selected.length + '个字段。' });
        saveCurrentMessages();
        scrollChatBottom();
      });
    };
    actionsBar.appendChild(buildBtn);
    picker.appendChild(actionsBar);
    containerEl.appendChild(picker);
    scrollChatBottom();
  }

  // ===== 系统提示词构建 =====
  /**
   * 动态构建发送给 AI 的系统提示词
   * 包含以下动态注入的上下文（按优先级排序，超长时截断低优先级部分）：
   *   1. 画布当前状态（已有组件列表） —— 修改请求的关键上下文
   *   2. 匹配的表单模板 —— 根据用户描述匹配的推荐模板
   *   3. 模板库知识 —— 通用的模板参考
   *   4. 自学习历史 —— 用户之前成功提交的表单结构
   * 总字符数超过 MAX_PROMPT_CHARS（12000）时自动截断
   */
  function buildSystemPrompt(question) {
    const context = getRelevantContext(question);
    const templateKnowledge = formatTemplateKnowledge();

    // Find matching templates for targeted hints
    const matched = matchTemplates(question);
    let matchHint = '';
    if (matched.length > 0) {
      matchHint = '\n\n## 当前问题匹配的模板\n';
      matchHint += '根据用户描述，以下模板最相关，**优先参考这些模板的字段列表来推荐**：\n\n';
      matched.forEach((t, i) => {
        matchHint += (i + 1) + '. **' + t.name + '** (' + (t.fieldCount || t.fields.length + '个字段') + ', ' + t.complexity + ')\n';
        matchHint += '   推荐字段: ' + t.fields.map(f => f.title + '(' + getTypeName(f.type) + ')').join('、') + '\n';
      });
      matchHint += '\n请基于匹配模板生成FIELDS推荐，但可根据用户具体需求调整。如果用户的场景比模板简单，减少字段数量；如果更复杂，增加字段。\n';
    }

    // Inject conversation summary if available
    let summaryContext = '';
    if (currentSummary) {
      summaryContext = '\n\n## 之前的对话摘要\n以下是之前对话的压缩摘要，请基于此上下文理解用户的后续请求：\n' + currentSummary + '\n';
    }

    // Inject current canvas state for follow-up modifications
    var canvasState = getCurrentCanvasState();

    // Build dynamic type hint for AI
    var typeHint = buildDynamicTypeHint();
    var typeListStr = typeHint
      ? '当前设计器可用组件类型（动态检测）：' + typeHint
      : 'type 使用：input/textarea/select/radio/checkbox/switch/date/daterange/time/timerange/upload/rate/counter/slider/cascader/color/row/button/desc';

    // Build dynamic form property hint
    var formPropSchema = buildFormPropSchema();
    var formPropHint = formPropSchema && Object.keys(formPropSchema).length > 0
      ? '当前设计器表单属性（动态检测）：' + Object.keys(formPropSchema).join(', ')
      : 'labelPosition, labelWidth, gutter, size, disabled';

    // Build dynamic component property hint from sample component
    var propSchemaHint = '';
    var propSchema = buildPropSchema();
    if (propSchema && Object.keys(propSchema).length > 0) {
      var sampleType = Object.keys(propSchema)[0];
      var sample = propSchema[sampleType];
      if (sample) {
        var allKeys = (sample.configKeys || []).concat(sample.directKeys || []);
        var uniqueKeys = allKeys.filter(function(k, i) { return allKeys.indexOf(k) === i && k !== 'tag' && k !== 'tagIcon'; });
        propSchemaHint = '\n组件可设置的属性（从设计器动态检测）：' + uniqueKeys.slice(0, 25).join(', ');
      }
    }

    // Inject learned templates
    var learnedSection = formatLearnedTemplates();

    var systemBase = '你是PomeloX表单设计器专家助手。PomeloX是Vita Global（维塔全球）旗下的核心产品，是一个面向海外中国留学生的活动管理与报名平台。你现在正在管理后台的**真实表单设计器**中工作，可以直接操控设计器画布添加和配置组件。\n\n请回答用户问题，使用markdown格式。**回复务必简洁，以执行操作为主，不要大段解释设计理由。**如果用户的问题与表单设计器、PomeloX完全无关，请礼貌拒绝。' + summaryContext + '\n\n## 设计器操控能力\n你可以直接操控管理后台的表单设计器画布来为用户实时搭建表单。所有操作都在真实环境中执行，搭建完成后用户可以直接点击「提交」保存。\n\n### 交互流程（非常重要）\n当用户说"帮我搭建/创建/做一个XX表单"这类请求时，按以下流程处理：\n\n**第一步：智能推荐字段** — 如果用户只给了模糊描述（如"帮我做一个春节活动表单"），你应该：\n1. 参考模板库和历史搭建记录，结合用户当前描述的具体场景，**创造性地推荐**适合的字段\n2. 不要机械照搬模板，根据活动特点灵活调整字段内容、选项、描述\n3. 输出[[FIELDS:...]]标签，提供一个字段推荐清单，让用户勾选确认\n4. 不要在这一步附加actions代码块\n5. 回复文字部分必须简短，一两句话即可\n\n**FIELDS标签格式**：[[FIELDS:表单名称|JSON数组]]。JSON数组的每个元素：\n{"label":"字段标题","type":"组件类型","desc":"简短说明","checked":true或false,"props":{"属性名":"值"}}\n\n**行容器（同行布局）**：当用户要求多个字段在同一行显示时，使用type:"row"嵌套children：\n{"label":"行容器","type":"row","desc":"姓名和性别同行显示","checked":true,"props":{"gutter":15},"children":[{"label":"姓名","type":"input","desc":"","checked":true,"props":{"vModel":"name","span":14}},{"label":"性别","type":"radio","desc":"","checked":true,"props":{"vModel":"gender","span":10,"options":"男,女"}}]}\n注意：children内的字段用span控制宽度（总和≤24），如span:14+span:10=24占满一行。\n\n- checked:true = 推荐必选, checked:false = 可选\n- ' + typeListStr + '\n- desc类型：纯文本展示组件\n- **props要包含完整配置**：placeholder(具体示例值), required, vModel(英文字段名), maxlength, options(真实内容), regexValidation, regexMessage 等' + propSchemaHint + '\n- **vModel标准命名**（App自动填充用）：name/legalName, phone/mobile, email, school/university, gender, wechatId, studentId\n\n**推荐原则**：\n1. 每次推荐要根据具体场景灵活创作，不要千篇一律\n2. desc描述要自然、有针对性，说明为什么这个活动需要这个字段\n3. placeholder要给出具体例值，不要泛泛地写"请输入"\n4. options选项要用真实内容，不要"选项A/B/C"\n5. 根据活动复杂度调整字段数量（简单5-6个，中等8-10个，复杂12+个）\n\n**回复风格要求**：简洁为主，不要解释推理过程，不要说"根据模板"之类的话，直接给推荐。\n\n**第二步** — 用户在界面上勾选完成后点击"开始搭建"，前端会自动执行。\n\n**第三步：后续修改（非常重要）** — 搭建完成后用户说"再加一个XX"/"把XX改成XX"/"删掉XX"等修改请求：\n1. **必须**输出 ```actions 代码块（不要输出FIELDS标签，直接用actions修改）\n2. **查看"当前画布状态"来了解已有组件**，不要凭记忆猜测\n3. 修改已有组件：先 {"a":"select","i":"vModel值"} 选中，再 {"a":"prop","k":"属性名","v":"值"} 修改\n4. 新增组件：{"a":"add","t":"类型"} + {"a":"prop",...}\n5. **删除组件：必须且只能用 {"a":"remove","i":"vModel值"}**，不要用prop改名或隐藏，不要add新组件\n6. 修改选项：select选中 + {"a":"prop","k":"options","v":"全部选项逗号分隔"}\n7. **不要用clear清空重建**，只修改需要变更的部分\n8. **严格最小操作原则**：如果用户只是修改属性（改label、改required、改placeholder、改选项等），只用select+prop操作，**绝对不要添加任何新组件**。只有用户明确说"添加/新增/加一个"时才用add\n8. 当用户说"删除/删掉/移除/去掉XX字段"时，**只输出remove操作**，不要add任何新组件，不要修改其他字段\n9. **删除多个字段示例**：用户说"删除phone2和phone3" → ```actions\\n[{"a":"remove","i":"phone2"},{"a":"remove","i":"phone3"}]\\n```\n10. **删除单个字段示例**：用户说"删掉邮箱" → ```actions\\n[{"a":"remove","i":"email"}]\\n```\n\n### 操作指令格式\n```actions 代码块，JSON数组。可用操作：\n- {"a":"clear"} — 清空画布\n- {"a":"name","v":"表单名称"}\n- {"a":"formProp","k":"属性名","v":"值"} — 可用属性: ' + formPropHint + '\n- {"a":"add","t":"组件类型"} — 添加组件\n- {"a":"prop","k":"属性名","v":"值"} — 设置当前组件属性\n- {"a":"select","i":"vModel字段名"} — 按vModel选中组件（推荐），也可用数字索引如{"a":"select","i":0}\n- {"a":"addPage"} — 添加新页面（多页表单）\n- {"a":"switchPage","i":页码索引} — 切换到指定页面(从0开始)\n- {"a":"addRow","t":"default"} — 添加行容器（将后续addToRow的组件放在同一行）\n- {"a":"addToRow","t":"组件类型"} — 在当前行容器内添加子组件（用span控制宽度）\n- {"a":"endRow"} — 结束行容器，后续add回到主画布\n- {"a":"remove","i":"vModel字段名"} — 删除组件（按vModel或数字索引）\n- {"a":"condition","i":"目标组件vModel","field":"关联字段vModel","op":"eq/ne/gt/lt/contains","val":"条件值"} — 设置条件显示。i推荐用vModel字符串定位组件\n\n### 条件显示配置\n组件支持动态关联条件显示/隐藏。使用condition action可以让某个组件仅在另一个字段满足条件时显示。\n例如：当"是否携带同伴"选择"是"时才显示"同伴姓名"字段。\n\n### 外观设置\n表单支持背景色设置。使用 {"a":"formProp","k":"appearance.bgColor","v":"#ff0000"} 或 {"a":"formProp","k":"backgroundColor","v":"#f5f5f5"} 设置表单背景色。\n\n### 搭建规则\n1. add后紧跟的prop作用于刚添加的组件\n2. 修改之前的组件先用select选中（用vModel字符串：{"a":"select","i":"email"}）\n3. 总是先clear再开始搭建\n4. 复杂表单(15+字段)建议使用多页面：先addPage创建新页，再switchPage切换后继续add\n5. add添加的组件已自带默认placeholder（如手机号→"请输入手机号"），**不需要再设置placeholder**，除非用户要求自定义。label同理\n6. 组件默认都是必填(required:true)。如果用户指定某个字段"非必填/可选/选填"，**必须**在add后用 {"a":"prop","k":"required","v":false} 将其设为非必填\n7. 时间范围/日期范围组件的placeholder会自动映射到start-placeholder，不需要特殊处理\n\n**例外** — 如果用户已给出明确字段需求，可跳过推荐直接用actions搭建。\n\n';

    // Assemble variable-length sections (will be truncated if too long)
    var dynamicSections = templateKnowledge + matchHint + learnedSection + canvasState;
    // P2 修复：不再在 system_prompt 尾部重复用户问题（message 字段已单独携带）
    var tail = '\n\n' + context;

    // Token budget: truncate dynamic sections if total prompt exceeds limit
    var total = systemBase.length + dynamicSections.length + tail.length;
    if (total > MAX_PROMPT_CHARS) {
      var budget = MAX_PROMPT_CHARS - systemBase.length - tail.length;
      if (budget < 200) budget = 200;
      // Priority: canvasState > matchHint > templateKnowledge > learnedSection
      var parts = [
        { key: 'canvasState', val: canvasState },
        { key: 'matchHint', val: matchHint },
        { key: 'templateKnowledge', val: templateKnowledge },
        { key: 'learnedSection', val: learnedSection }
      ];
      var kept = '';
      var remaining = budget;
      for (var pi = 0; pi < parts.length; pi++) {
        if (parts[pi].val.length <= remaining) {
          kept += parts[pi].val;
          remaining -= parts[pi].val.length;
        } else if (remaining > 100) {
          kept += parts[pi].val.substring(0, remaining - 20) + '\n...(已截断)';
          remaining = 0;
        }
      }
      dynamicSections = kept;
      console.log('[AI Form Assistant] Prompt truncated: ' + total + ' -> ' + (systemBase.length + dynamicSections.length + tail.length) + ' chars');
    }

    return systemBase + dynamicSections + tail;
  }

  // ===== 图片上传处理 =====
  /** 处理用户选择的图片文件，转为 base64 用于发送给视觉模型（qwen-vl-plus） */
  function handleImageSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Validate: max 5MB, image only
    if (!file.type.startsWith('image/')) {
      updateStatus('请选择图片文件'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      updateStatus('图片大小不能超过 5MB'); return;
    }
    const reader = new FileReader();
    reader.onload = function(ev) {
      pendingImage = {
        base64: ev.target.result, // data:image/...;base64,...
        name: file.name,
        type: file.type
      };
      // Show preview
      document.getElementById('aiImgThumb').src = ev.target.result;
      document.getElementById('aiImgName').textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + 'KB)';
      document.getElementById('aiImgPreview').style.display = 'flex';
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected
    e.target.value = '';
  }

  function clearPendingImage() {
    pendingImage = null;
    document.getElementById('aiImgPreview').style.display = 'none';
    document.getElementById('aiImgThumb').src = '';
    document.getElementById('aiImgName').textContent = '';
  }

  // ===== 错误信息友好化 =====
  /** 将技术性错误信息转为用户可读的中文提示 */
  function friendlyError(msg) {
    if (!msg) return '服务异常，请稍后重试';
    if (msg.includes('image length and width') || msg.includes('must be larger than'))
      return '图片尺寸过小，请上传更大的截图（建议不小于 100×100 像素）';
    if (msg.includes('image') && msg.includes('format'))
      return '图片格式不支持，请使用 PNG 或 JPG 格式';
    if (msg.includes('image') && (msg.includes('size') || msg.includes('too large')))
      return '图片文件过大，请压缩后重试（不超过 5MB）';
    if (msg.includes('rate limit') || msg.includes('throttl'))
      return '请求过于频繁，请稍后再试';
    if (msg.includes('timeout') || msg.includes('timed out'))
      return '请求超时，请稍后重试';
    // Generic: strip technical details, keep it short
    if (msg.length > 80) return '服务暂时异常，请稍后重试';
    return msg;
  }

  // ===== 提示词优化 =====
  /**
   * 调用 AI 将用户简短描述扩展为更具体的表单需求
   * 例如 "春节活动" → "帮我搭建一个春节联欢晚会报名表，包含姓名、手机号、微信号、饮食偏好、是否携带朋友"
   * 使用通用聊天接口（非表单设计器接口），skipRag=true 跳过知识库检索
   */
  async function enhancePrompt() {
    const input = document.getElementById('aiAssistantInput');
    const btn = document.getElementById('aiEnhanceBtn');
    const raw = input.value.trim();
    if (!raw) { updateStatus('请先输入表单描述'); return; }
    if (raw.length > 200) { updateStatus('描述已经很详细了，可以直接发送'); return; }

    btn.disabled = true;
    btn.classList.add('loading');
    const origText = btn.textContent;

    try {
      const resp = await fetch(AI_API_URL, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          question: '你是PomeloX表单需求优化助手。PomeloX是面向**美国高校中国留学生**的活动平台（Vita Global旗下）。\n\n请将用户的简短描述扩展为一段更具体的表单需求（50-100字），帮助AI更好地理解要搭建什么表单。\n\n**扩展规则（非常重要）**：\n1. 只补充与该活动直接相关的字段需求，不要凭空编造不相关的字段\n2. 常用联系信息字段：姓名、手机号、邮箱、微信号（根据活动选2-3个即可，不需要全加）\n3. 根据活动类型补充特有字段：\n   - 聚餐/BBQ → 饮食偏好、是否携带朋友\n   - 接机 → 航班号、到达时间、行李数量\n   - 志愿者 → 可用时间段、技能\n   - 社交/联谊 → 性别、年级、自我介绍\n   - 讲座 → 感兴趣话题、想提问的问题\n   - 比赛 → 参赛类别、队伍信息\n4. 不要加与活动无关的字段（如签到表不需要饮食偏好）\n5. 不要使用国内概念（学号、工号、院系、部门、身份证）\n6. 只输出优化后的纯文本描述，不要输出标签、代码、JSON或markdown\n7. 保持简洁自然，像人在对话中描述需求一样\n8. 不要添加任何免责声明、建议咨询官方等后缀\n\n用户原始描述：' + raw,
          deptId: AI_DEPT_ID,
          model: AI_MODEL,
          skipRag: true
        })
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      // Read SSE stream to get full response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(trimmed.slice(5).trim());
            if (evt.type === 'chunk' && evt.content) result += evt.content;
          } catch (e) {}
        }
      }
      // Flush remaining buffer (last SSE line may not end with \n)
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data:')) {
          try {
            const evt = JSON.parse(trimmed.slice(5).trim());
            if (evt.type === 'chunk' && evt.content) result += evt.content;
          } catch (e) {}
        }
      }

      if (result) {
        // Clean up: remove quotes, markdown, tags
        result = result.replace(/^["'`]+|["'`]+$/g, '').trim();
        result = result.replace(/\*\*/g, '').replace(/\n+/g, '，');
        // Strip trailing disclaimers (ℹ️ *...* or similar)
        result = result.replace(/[，,\s]*ℹ️.*$/s, '').replace(/[，,\s]*\*以上为.*$/s, '').trim();
        input.value = result;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        input.focus();
      }
    } catch (e) {
      updateStatus('优化失败，请直接发送');
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = origText;
    }
  }

  // ===== 消息发送与流式接收 =====
  /**
   * 核心函数 —— 处理用户消息发送和 AI 响应接收的完整流程
   *
   * 执行流程：
   *   1. 防重复发送检查（aiIsTyping/actionRunning）
   *   2. 尝试本地快速回答匹配（精确 → 模糊关键词）
   *   3. 未匹配则调用后端 AI 接口（SSE 流式传输）
   *   4. 流式渲染（100ms 防抖，避免频繁 DOM 更新导致闪烁）
   *   5. 解析 AI 响应中的特殊标记：
   *      - ```actions 代码块 → 渲染"在设计器中搭建"按钮
   *      - [[FIELDS:名称|JSON]] → 渲染字段勾选面板
   *      - [[OPTIONS:选项1|选项2]] → 渲染后续操作选项按钮
   *   6. 错误处理：自动重试1次、15秒慢响应提示、45秒超时中止
   *   7. 中途停止：清理未闭合的标签，保留已接收内容
   *
   * SSE 数据格式：data:{"type":"chunk","content":"..."} 或 {"type":"start/done/error",...}
   * 含图片时自动切换到视觉模型 qwen-vl-plus
   */
  async function sendChat() {
    if (aiIsTyping || actionRunning) return;
    aiIsTyping = true;  // 立即设置，防止双击竞态
    const input = document.getElementById('aiAssistantInput');
    if (!input) { aiIsTyping = false; return; }
    const q = input.value.trim();
    if (!q) { aiIsTyping = false; return; }
    input.value = '';
    input.style.height = 'auto';
    try { // P0 修复：try/finally 确保异常时 aiIsTyping 一定被重置

    // Hide quick area on first message
    const quickArea = document.querySelector('.ai-quick-area');
    if (quickArea && !quickArea.classList.contains('hidden')) quickArea.classList.add('hidden');

    // Capture and clear pending image
    const chatImage = pendingImage;
    if (pendingImage) clearPendingImage();

    const msgs = document.getElementById('aiAssistantMessages');

    // User message
    const userEl = document.createElement('div');
    userEl.className = 'ai-msg user';
    userEl.textContent = q;
    if (chatImage) {
      const img = document.createElement('img');
      img.className = 'ai-user-img';
      img.src = chatImage.base64;
      img.alt = chatImage.name;
      userEl.appendChild(img);
    }
    msgs.appendChild(userEl);
    aiChatHistory.push({ role: 'user', text: q, image: chatImage ? chatImage.name : null });
    updateCompactHint();
    scrollChatBottom();

    // Check for local quick answer (exact match first, then fuzzy keyword match)
    // BUT skip quick answers if the user's request contains action verbs (they want execution, not info)
    // Exclude question patterns: 如何/怎么/怎样 + verb = asking for info, not execution
    var isQuestion = /^(如何|怎么|怎样|什么|有哪些|有什么|哪些)/.test(q.trim());
    var actionVerbs = /清空|添加|搭建|创建|做一个|加一个|新增|删除|删掉|修改|改为|改成|设置|选中|把.*改/;
    var isActionRequest = !isQuestion && actionVerbs.test(q);
    let quickAnswer = !isActionRequest ? QUICK_ANSWERS[q] : undefined;
    if (!quickAnswer && !isActionRequest) {
      // Fuzzy match: check if user input contains key phrases from QUICK_ANSWERS keys
      const fuzzyMap = {
        '有哪些组件可以使用？': ['组件列表', '组件有哪些', '有什么组件', '可用组件'],
        '如何创建报名表？': ['创建教程', '怎么创建', '如何创建', '创建步骤', '怎么做表单'],
        '如何添加表单验证？': ['表单验证', '验证规则', '正则校验', '怎么验证', '添加验证'],
        '怎么实现多列布局？': ['多列布局', '多列', '并排', '栅格布局', '两列', '三列']
      };
      for (const [key, keywords] of Object.entries(fuzzyMap)) {
        if (keywords.some(kw => q.includes(kw))) {
          quickAnswer = QUICK_ANSWERS[key];
          // Handle dynamic generation (null means generate at runtime)
          if (quickAnswer === null) quickAnswer = buildDynamicComponentList();
          break;
        }
      }
    }
    // Dynamic generation for component list
    if (quickAnswer === null && QUICK_ANSWERS.hasOwnProperty(q)) {
      quickAnswer = buildDynamicComponentList() || '正在检测组件列表...';
    }
    if (quickAnswer) {
      const botEl = document.createElement('div');
      botEl.className = 'ai-msg bot';
      botEl.innerHTML = renderMd(quickAnswer);
      msgs.appendChild(botEl);
      aiChatHistory.push({ role: 'bot', text: quickAnswer });
      updateCompactHint();
      saveCurrentMessages();
      scrollChatBottom();
      return; // finally 块会自动重置 aiIsTyping
    }

    // AI streaming
    document.getElementById('aiAssistantSend').disabled = true;

    const typingEl = document.createElement('div');
    typingEl.className = 'ai-msg bot typing';
    typingEl.textContent = '正在思考';
    msgs.appendChild(typingEl);
    scrollChatBottom();

    const fullPrompt = buildSystemPrompt(q);
    // Use form designer endpoint (backend appends KB examples) with fallback to legacy endpoint
    const useFormDesignerAPI = true;
    const apiUrl = useFormDesignerAPI ? AI_FORM_DESIGNER_URL : AI_API_URL;
    // Collect currently supported component types from dynamic cache
    const supportedTypes = (function() {
      try {
        const cache = buildComponentCache();
        return cache ? Object.keys(cache) : null;
      } catch(e) { return null; }
    })();
    // Extract current user context from Vuex store for personalized recommendations
    const userContext = (function() {
      try {
        var store = vueInstance && vueInstance.$store;
        if (!store) return null;
        var state = store.state || {};
        var user = state.user || {};
        var ctx = {};
        // Role: manage=总管理员(多校), part_manage=分管理员(单校), etc.
        var roles = user.roles || store.getters && store.getters.roles;
        // P1 修复：只发送角色标识，不泄露完整权限对象
        if (roles && roles.length) ctx.roles = roles.map(function(r) { return r.key || r.roleKey || r; }).filter(Boolean);
        // User name
        if (user.name) ctx.userName = user.name;
        if (user.nickName) ctx.nickName = user.nickName;
        // Department / school info
        if (user.dept) {
          ctx.deptId = user.dept.deptId || user.dept.id;
          ctx.deptName = user.dept.deptName || user.dept.name;
        } else if (user.deptId) {
          ctx.deptId = user.deptId;
        }
        // Try getters for additional info
        if (store.getters) {
          if (store.getters.deptName) ctx.deptName = store.getters.deptName;
          if (store.getters.deptId) ctx.deptId = store.getters.deptId;
        }
        return Object.keys(ctx).length > 0 ? ctx : null;
      } catch(e) { console.warn('[AI] Failed to get user context:', e); return null; }
    })();
    // Build recent chat history for backend context (last 6 messages = 3 rounds)
    const recentHistory = aiChatHistory.slice(-6).map(function(m) {
      return { role: m.role === 'bot' ? 'assistant' : m.role, content: m.text };
    });
    const body = useFormDesignerAPI
      ? { message: q, system_prompt: fullPrompt, model: AI_MODEL, supported_types: supportedTypes, user_context: userContext, history: recentHistory }
      : { question: fullPrompt, deptId: AI_DEPT_ID, model: AI_MODEL, skipRag: true };
    if (aiSessionId) body.session_id = aiSessionId;
    if (chatImage) {
      body.image = chatImage.base64; // data:image/...;base64,...
      body.model = 'qwen-vl-plus'; // Switch to vision model for image analysis
    }

    let fullAnswer = '';
    let botEl = null;
    let stopBtn = null;
    let lastErr = null;
    let renderTimer = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) fullAnswer = '';  // Reset on retry to prevent content duplication
      let safetyTimeout = null;
      let warningTimeout = null;
      try {
        aiAbortController = new AbortController();
        warningTimeout = setTimeout(() => { updateStatus('AI 响应较慢，请耐心等待...'); }, 15000);
        safetyTimeout = setTimeout(() => { if (aiIsTyping) aiAbortController.abort(); }, 45000);

        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: buildAuthHeaders(),
          body: JSON.stringify(body),
          signal: aiAbortController.signal
        });
        clearTimeout(safetyTimeout);
        clearTimeout(warningTimeout);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);

        // Remove typing indicator
        typingEl.remove();
        if (!botEl) {
          botEl = document.createElement('div');
          botEl.className = 'ai-msg bot';
          msgs.appendChild(botEl);
          stopBtn = document.createElement('button');
          stopBtn.className = 'ai-stop-btn visible';
          stopBtn.innerHTML = '■ 停止生成';
          stopBtn.onclick = () => { stopBtn.disabled = true; stopBtn.textContent = '停止中...'; aiAbortController.abort(); };
          msgs.appendChild(stopBtn);
        }

        // SSE streaming
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            buffer += decoder.decode();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;
            try {
              const evt = JSON.parse(jsonStr);
              if (evt.type === 'chunk' && evt.content) {
                fullAnswer += evt.content;
                // Debounced render to reduce flicker (100ms)
                if (renderTimer) clearTimeout(renderTimer);
                renderTimer = setTimeout(() => {
                  // Hide raw [[FIELDS:...]], [[ACTIONS:...]], [[OPTIONS:...]] tags during streaming
                  let displayText = fullAnswer;
                  // First strip any already-closed tags (e.g. [[OPTIONS:a|b|c]])
                  displayText = displayText.replace(/\[\[OPTIONS:.*?\]\]/g, '');
                  displayText = displayText.replace(/\[\[ACTIONS:[\s\S]*?\]\]/g, '');
                  // Then hide any open (in-progress) tags by truncating at their start
                  let showFieldsLoading = false;
                  let showActionsLoading = false;
                  const fieldsStart = displayText.indexOf('[[FIELDS:');
                  if (fieldsStart !== -1) {
                    displayText = displayText.substring(0, fieldsStart).trim();
                    if (!displayText) displayText = '正在生成表单字段...';
                    showFieldsLoading = true;
                  }
                  const actionsStart = displayText.indexOf('[[ACTIONS:');
                  if (actionsStart !== -1) {
                    displayText = displayText.substring(0, actionsStart).trim();
                    if (!displayText) displayText = '正在生成操作指令...';
                    showActionsLoading = true;
                  }
                  const optionsStart = displayText.indexOf('[[OPTIONS:');
                  if (optionsStart !== -1) {
                    displayText = displayText.substring(0, optionsStart).trim();
                  }
                  // Also hide ```json blocks that look like field arrays during streaming
                  if (!showFieldsLoading) {
                    var jsonBlockMatch = displayText.match(/```json\s*\n?\s*\[\s*\{[\s\S]*$/);
                    if (jsonBlockMatch) {
                      displayText = displayText.substring(0, jsonBlockMatch.index).trim();
                      if (!displayText) displayText = '正在生成表单字段...';
                      showFieldsLoading = true;
                    }
                  }
                  botEl.innerHTML = renderMd(displayText);
                  // Append loading indicator via DOM (not markdown) so HTML isn't mangled
                  if (showFieldsLoading || showActionsLoading) {
                    var loadingDiv = document.createElement('div');
                    loadingDiv.className = 'ai-fields-loading';
                    loadingDiv.innerHTML = '<div class="ai-fields-loading-dots"><span></span><span></span><span></span></div>' + (showFieldsLoading ? '正在生成推荐字段，请稍候...' : '正在生成操作指令...');
                    botEl.appendChild(loadingDiv);
                  }
                  scrollChatBottom();
                  renderTimer = null;
                }, 100);
              } else if (evt.type === 'start' && evt.session_id) {
                aiSessionId = evt.session_id;
              } else if (evt.type === 'done' && evt.session_id) {
                aiSessionId = evt.session_id;
              } else if (evt.type === 'error') {
                fullAnswer += '\n' + friendlyError(evt.message);
              }
            } catch (e) {}
          }
        }
        // Flush remaining buffer (last SSE line may not end with \n)
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const evt = JSON.parse(trimmed.slice(5).trim());
              if (evt.type === 'chunk' && evt.content) fullAnswer += evt.content;
              else if (evt.type === 'done' && evt.session_id) aiSessionId = evt.session_id;
            } catch (e) {}
          }
        }

        lastErr = null;
        break;
      } catch (err) {
        clearTimeout(safetyTimeout);
        clearTimeout(warningTimeout);
        lastErr = err;
        if (err.name === 'AbortError') {
          if (fullAnswer) lastErr = null;
          break;
        }
        if (attempt === 0) {
          typingEl.textContent = '重试中';
          if (!msgs.contains(typingEl)) msgs.appendChild(typingEl);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    // Cleanup stop button
    if (stopBtn) stopBtn.remove();
    const wasAborted = lastErr === null && aiAbortController && aiAbortController.signal.aborted;

    // If generation was stopped mid-stream, clean up incomplete tags
    if (wasAborted && fullAnswer) {
      // Remove incomplete [[FIELDS:... (no closing ]])
      const incFieldsIdx = fullAnswer.indexOf('[[FIELDS:');
      if (incFieldsIdx !== -1 && fullAnswer.indexOf(']]', incFieldsIdx) === -1) {
        fullAnswer = fullAnswer.substring(0, incFieldsIdx).trim();
      }
      // Remove incomplete [[ACTIONS:...
      const incActionsIdx = fullAnswer.indexOf('[[ACTIONS:');
      if (incActionsIdx !== -1 && fullAnswer.indexOf(']]', incActionsIdx) === -1) {
        fullAnswer = fullAnswer.substring(0, incActionsIdx).trim();
      }
      // Remove incomplete [[OPTIONS:...
      const incOptionsIdx = fullAnswer.indexOf('[[OPTIONS:');
      if (incOptionsIdx !== -1 && fullAnswer.indexOf(']]', incOptionsIdx) === -1) {
        fullAnswer = fullAnswer.substring(0, incOptionsIdx).trim();
      }
      // Remove incomplete ```actions blocks (no closing ```)
      const incCodeIdx = fullAnswer.indexOf('```actions');
      if (incCodeIdx !== -1) {
        const closeIdx = fullAnswer.indexOf('```', incCodeIdx + 10);
        if (closeIdx === -1) fullAnswer = fullAnswer.substring(0, incCodeIdx).trim();
      }
      // Add abort notice if content was truncated to empty
      if (!fullAnswer) fullAnswer = '⏹ 已停止生成。';
      else fullAnswer += '\n\n⏹ 已停止生成。';
    }

    // Final render + parse
    if (fullAnswer) {
      if (!botEl) {
        typingEl.remove();
        botEl = document.createElement('div');
        botEl.className = 'ai-msg bot';
        msgs.appendChild(botEl);
      }

      // Extract ```actions blocks
      let parsedActions = null;
      fullAnswer = fullAnswer.replace(/```actions\s*\n?([\s\S]*?)```/g, (_, json) => {
        try {
          parsedActions = JSON.parse(json.trim());
          // AI may return a single action object instead of an array
          if (parsedActions && !Array.isArray(parsedActions)) {
            parsedActions = [parsedActions];
          }
        } catch (e) {
          // AI often returns newline-separated JSON objects instead of a JSON array
          // e.g. {"a":"add","t":"input"}\n{"a":"prop","k":"label","v":"邮箱"}
          try {
            var lines = json.trim().split('\n').filter(function(l) { return l.trim(); });
            var arr = lines.map(function(l) { return JSON.parse(l.trim()); });
            if (arr.length > 0) parsedActions = arr;
          } catch (e2) {
            console.error('[AI Form Assistant] Actions parse failed:', e2.message);
          }
        }
        return '';
      }).trim();

      // Fallback: detect bare action JSON objects (no ```actions wrapper)
      // AI sometimes returns raw JSON like: {"a":"select","i":"name"}\n{"a":"prop","k":"label","v":"..."}
      if (!parsedActions && fullAnswer) {
        var bareLines = fullAnswer.trim().split('\n').filter(function(l) { return l.trim(); });
        var allAreJson = bareLines.length > 0 && bareLines.length <= 20;
        if (allAreJson) {
          try {
            var bareArr = [];
            for (var bi = 0; bi < bareLines.length; bi++) {
              var bline = bareLines[bi].trim();
              // Strip markdown <p> tags if present
              bline = bline.replace(/^<p>/, '').replace(/<\/p>$/, '').replace(/<br\s*\/?>$/i, '').trim();
              if (!bline) continue;
              // Must look like JSON object
              if (bline.charAt(0) !== '{' || bline.charAt(bline.length - 1) !== '}') { allAreJson = false; break; }
              var parsed = JSON.parse(bline);
              if (parsed.a || parsed.action) {
                bareArr.push(parsed);
              } else {
                allAreJson = false; break;
              }
            }
            if (allAreJson && bareArr.length > 0) {
              parsedActions = bareArr;
              fullAnswer = ''; // Clear display text since it was all actions
              console.log('[AI Form Assistant] Detected bare action JSON (no code fence), parsed', bareArr.length, 'actions');
            }
          } catch (e3) {
            // Not bare JSON actions, ignore
          }
        }
      }

      // Extract [[FIELDS:name|JSON]] using bracket-aware parsing
      // Can't use simple regex because JSON contains ]] which confuses the regex
      let fieldData = null;
      let fieldFormName = null;
      const fieldsMarker = '[[FIELDS:';
      const fieldsIdx = fullAnswer.indexOf(fieldsMarker);
      if (fieldsIdx !== -1) {
        const afterMarker = fullAnswer.substring(fieldsIdx + fieldsMarker.length);
        const pipeIdx = afterMarker.indexOf('|');
        if (pipeIdx !== -1) {
          fieldFormName = afterMarker.substring(0, pipeIdx).trim();
          // Find the matching ]] by counting [ and ] brackets, skipping inside JSON strings
          const jsonStart = pipeIdx + 1;
          let depth = 0;
          let endIdx = -1;
          let inString = false;
          for (let ci = jsonStart; ci < afterMarker.length; ci++) {
            const ch = afterMarker[ci];
            if (inString) {
              if (ch === '\\') { ci++; continue; } // skip escaped char
              if (ch === '"') inString = false;
              continue;
            }
            if (ch === '"') { inString = true; continue; }
            if (ch === '[') depth++;
            else if (ch === ']') {
              depth--;
              if (depth === 0) {
                // Finished the JSON array, check for ]] (FIELDS closing tag)
                if (ci + 1 < afterMarker.length && afterMarker[ci + 1] === ']') {
                  endIdx = ci + 1; // include the closing ] of array
                  break;
                }
              }
              if (depth < 0) {
                // We went below zero - this ] is part of the ]] closing tag
                endIdx = ci;
                break;
              }
            }
          }
          if (endIdx === -1) {
            // Fallback: find last ]] in the string
            const lastBrackets = afterMarker.lastIndexOf(']]');
            if (lastBrackets > jsonStart) endIdx = lastBrackets;
          }
          if (endIdx !== -1) {
            const jsonStr = afterMarker.substring(jsonStart, endIdx).trim();
            console.log('[AI Form Assistant] Extracted FIELDS:', fieldFormName, 'JSON length:', jsonStr.length);
            try {
              fieldData = JSON.parse(jsonStr);
              // AI may return a single object instead of an array for single-field forms
              if (fieldData && !Array.isArray(fieldData)) {
                fieldData = [fieldData];
              }
              console.log('[AI Form Assistant] Parsed', fieldData.length, 'fields');
            } catch (e) {
              console.error('[AI Form Assistant] FIELDS JSON parse error:', e.message, 'JSON:', jsonStr.substring(0, 300));
              // Fallback: try to fix common JSON issues
              try {
                // Sometimes AI outputs trailing comma or incomplete JSON
                let fixed = jsonStr.trim();
                // Remove trailing comma before ]
                fixed = fixed.replace(/,\s*\]/g, ']');
                // If missing closing ], add it
                if (fixed.startsWith('[') && !fixed.endsWith(']')) {
                  // Find the last complete object (ends with })
                  const lastBrace = fixed.lastIndexOf('}');
                  if (lastBrace > 0) fixed = fixed.substring(0, lastBrace + 1) + ']';
                }
                fieldData = JSON.parse(fixed);
                if (fieldData && !Array.isArray(fieldData)) fieldData = [fieldData];
                console.log('[AI Form Assistant] Parsed (fixed)', fieldData.length, 'fields');
              } catch (e2) {
                console.error('[AI Form Assistant] FIELDS fallback parse also failed:', e2.message);
              }
            }
            // Remove the entire [[FIELDS:...]] from fullAnswer
            const fullTagEnd = fieldsIdx + fieldsMarker.length + endIdx + 2; // +2 for ]]
            fullAnswer = (fullAnswer.substring(0, fieldsIdx) + fullAnswer.substring(fullTagEnd)).trim();
          }
        }
      }

      // Fallback: if no [[FIELDS:...]] found, try to extract fields from ```json code blocks
      if (!fieldData && fullAnswer) {
        const jsonBlockRegex = /```json\s*\n?([\s\S]*?)```/g;
        let jsonMatch;
        while ((jsonMatch = jsonBlockRegex.exec(fullAnswer)) !== null) {
          try {
            // Strip JS-style comments that AI sometimes adds (// ...)
            var rawJson = jsonMatch[1].trim().replace(/\/\/[^\n]*/g, '');
            // Remove trailing commas before ] or }
            rawJson = rawJson.replace(/,\s*([}\]])/g, '$1');
            let candidate = JSON.parse(rawJson);
            if (candidate && !Array.isArray(candidate)) candidate = [candidate];
            // Validate: must be array of objects with "label" and "type" (field-like structure)
            if (Array.isArray(candidate) && candidate.length > 0 &&
                candidate[0].label && candidate[0].type &&
                typeof candidate[0].type === 'string') {
              fieldData = candidate;
              // Try to extract form name from nearby text (e.g. "FIELDS 推荐" heading or "签到表单")
              var beforeBlock = fullAnswer.substring(0, jsonMatch.index);
              var nameMatch = beforeBlock.match(/(?:FIELDS\s*推荐|搭建|创建|设计)[：:\s]*[「""]?([^「""」\n]{2,20})[」""]?/i)
                || beforeBlock.match(/[「""]([^「""」\n]{2,20})表单[」""]?/);
              fieldFormName = nameMatch ? nameMatch[1].replace(/表单$/, '').trim() : '表单';
              // Remove the JSON block from display
              fullAnswer = (fullAnswer.substring(0, jsonMatch.index) + fullAnswer.substring(jsonMatch.index + jsonMatch[0].length)).trim();
              // Also remove other ```json blocks that are not field arrays (e.g. formProps)
              fullAnswer = fullAnswer.replace(/```json\s*\n?\{[\s\S]*?\}[\s\S]*?```/g, '').trim();
              console.log('[AI Form Assistant] Fallback: extracted', fieldData.length, 'fields from ```json block');
              break;
            }
          } catch (e) {
            // Not valid field JSON, skip this block
          }
        }
      }

      // Extract [[OPTIONS:a|b|c]]
      let optionsList = null;
      fullAnswer = fullAnswer.replace(/\[\[OPTIONS:(.*?)\]\]/g, (_, opts) => {
        optionsList = opts.split('|').map(o => o.trim()).filter(Boolean);
        return '';
      }).trim();

      // If FIELDS were extracted and text is empty, add a default intro
      if (fieldData && fieldData.length > 0 && !fullAnswer) {
        fullAnswer = '根据你的需求，我推荐以下字段。请勾选需要的字段，然后点击「开始搭建」：';
      }

      // Clear debounce timer before final render to prevent overwrite
      if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }

      botEl.innerHTML = renderMd(fullAnswer);

      // Render field picker
      if (fieldData && Array.isArray(fieldData) && fieldData.length > 0) {
        renderFieldPicker(fieldData, fieldFormName, botEl);
      }
      // Render action build button
      else if (parsedActions && Array.isArray(parsedActions) && parsedActions.length > 0) {
        // Filter spurious add actions when user only asked for modification/deletion
        var modOnlyKeywords = /^(改|修改|把|将|设|设置|变|变更|删|删除|删掉|移除|去掉)/;
        var addKeywords = /(添加|新增|加一个|再加|增加|加上|帮我加|帮我添)/;
        if (modOnlyKeywords.test(q.trim()) && !addKeywords.test(q)) {
          parsedActions = parsedActions.filter(function(ac) {
            var aType = ac.a || ac.action;
            if (aType === 'add' || aType === 'addRow' || aType === 'addToRow') {
              console.log('[AI Form Assistant] Filtered spurious add action in modification context:', JSON.stringify(ac));
              return false;
            }
            return true;
          });
        }
        const btn = document.createElement('button');
        btn.className = 'ai-build-trigger-btn';
        btn.innerHTML = '在设计器中搭建';
        btn.onclick = function() {
          btn.disabled = true;
          btn.textContent = '搭建中...';
          executeActions(parsedActions, () => {
            btn.textContent = '重新搭建';
            btn.disabled = false;
          });
        };
        botEl.appendChild(btn);
      }

      // Render options
      if (optionsList && optionsList.length > 0) {
        const wrap = document.createElement('div');
        wrap.className = 'ai-option-btns';
        optionsList.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'ai-option-btn';
          btn.textContent = opt;
          btn.onclick = function() {
            wrap.querySelectorAll('.ai-option-btn').forEach(b => { b.disabled = true; b.style.opacity = '.5'; });
            btn.style.opacity = '1';
            btn.style.borderColor = '#3b82f6';
            btn.style.background = '#eff6ff';
            document.getElementById('aiAssistantInput').value = opt;
            sendChat();
          };
          wrap.appendChild(btn);
        });
        botEl.appendChild(wrap);
      }

      aiChatHistory.push({ role: 'bot', text: fullAnswer });
      updateCompactHint();
      saveCurrentMessages();
    } else if (lastErr) {
      typingEl.remove();
      // Remove partial bot element if it exists (e.g. stream failed mid-response on retry)
      if (botEl && !fullAnswer.trim()) {
        botEl.remove();
        botEl = null;
      }
      const errEl = document.createElement('div');
      errEl.className = 'ai-msg bot';
      const errText = lastErr.name === 'AbortError' ? '请求超时，请稍后重试。' : '网络请求失败，已重试仍无法连接。';
      errEl.innerHTML = '<p>' + errText + '</p>';
      // Add retry button
      const retryBtn = document.createElement('button');
      retryBtn.className = 'ai-option-btn';
      retryBtn.textContent = '重试';
      retryBtn.style.marginTop = '6px';
      retryBtn.onclick = function() {
        retryBtn.disabled = true;
        retryBtn.textContent = '重试中...';
        // Re-send the last user message
        var lastUserMsg = aiChatHistory.filter(m => m.role === 'user').pop();
        if (lastUserMsg) {
          document.getElementById('aiAssistantInput').value = lastUserMsg.text;
          // Remove the error message and last user message from history
          errEl.remove();
          aiChatHistory = aiChatHistory.filter(m => m !== lastUserMsg);
          sendChat();
        }
      };
      errEl.appendChild(retryBtn);
      msgs.appendChild(errEl);
    }

    } finally {
      // P0 修复：无论正常完成还是异常，都必须重置状态，防止 UI 永久锁死
      aiIsTyping = false;
      aiAbortController = null;
      var sendBtnFinal = document.getElementById('aiAssistantSend');
      if (sendBtnFinal) sendBtnFinal.disabled = false;
      scrollChatBottom();
    }
  }

  // ===== 路由修复说明 =====
  // 后台数据库 sys_menu 表已更新：menu_id 2121（活动表单模板）
  // component 从 system/model/index（不存在）改为 tool/build/index（表单设计器）
  // 现在表单设计器通过 /active/model 直接加载，无需运行时路由补丁
  function patchFormDesignerRoute() {
    // No-op: route is now correctly configured in the database
    console.log('[AI Form Assistant] Form designer route configured via DB (tool/build/index)');
  }

  // ===== 页面检测与初始化 =====
  /**
   * 通过 DOM 选择器判断当前页面是否为表单设计器页面
   * 检测标志：存在 .drawing-board / .center-board / .left-board 之一
   */
  function isFormDesignerPage() {
    // Only show AI assistant when the form designer canvas is actually rendered
    // This means we need the drawing-board or center-board DOM elements
    const hasDesigner = document.querySelector('.drawing-board') ||
                        document.querySelector('.center-board') ||
                        document.querySelector('.container .left-board');
    return !!hasDesigner;
  }

  function checkAndInit() {
    if (isFormDesignerPage()) {
      if (!isDesignerPage) {
        isDesignerPage = true;
        console.log('[AI Form Assistant] Form designer page detected');
        // Wait a bit for Vue components to fully render, then show AI assistant
        setTimeout(() => {
          getVueInstance();
          if (!uiInjected) {
            createUI();
          } else {
            // Re-show the FAB if it was hidden
            const fab = document.getElementById('aiAssistantFab');
            if (fab) fab.style.display = 'flex';
          }
          installSubmitWatcher();
          console.log('[AI Form Assistant] Initialized. Vue instance:', !!vueInstance);
        }, 1000);
      }
    } else {
      if (isDesignerPage) {
        isDesignerPage = false;
        // Hide UI when leaving designer page
        const fab = document.getElementById('aiAssistantFab');
        const win = document.getElementById('aiAssistantWindow');
        if (fab) fab.style.display = 'none';
        if (win) win.classList.remove('open');
        // 离开页面时清理 MutationObserver，释放资源
        if (_dialogDismissObserver) {
          _dialogDismissObserver.disconnect();
          _dialogDismissObserver = null;
        }
        console.log('[AI Form Assistant] Left designer page, hiding UI');
      }
    }
  }

  // ===== 启动入口 =====
  /**
   * 插件初始化：加载模板库 → 立即检测页面 → 注册路由监听
   * 三重检测机制确保 SPA 路由切换时能正确显示/隐藏 AI 助手：
   *   1. hashchange 事件（Vue Router hash 模式）
   *   2. popstate 事件（浏览器前进/后退）
   *   3. 3秒定时轮询（兜底：编程式导航可能不触发上述事件）
   */
  function init() {
    console.log('[AI Form Assistant] Script loaded, watching for form designer page...');

    // Load form template library (async, non-blocking)
    loadFormTemplates();

    // Log route configuration status
    patchFormDesignerRoute();

    // Check immediately (will only show UI if on form designer page)
    checkAndInit();

    // Watch for route changes (Vue Router uses hashchange and popstate)
    // Guard against duplicate listeners on re-injection
    if (!window._aiFormListenersAttached) {
      window.addEventListener('hashchange', () => setTimeout(checkAndInit, 500));
      window.addEventListener('popstate', () => setTimeout(checkAndInit, 500));
      window._aiFormListenersAttached = true;
    }

    // Periodic check (fallback for programmatic navigation)
    // Store interval ID so it can be cleaned up if script is re-injected
    if (window._aiFormCheckInterval) clearInterval(window._aiFormCheckInterval);
    window._aiFormCheckInterval = setInterval(checkAndInit, 3000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
