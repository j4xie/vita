# Plan A: 流程设计器 UI 扩展 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展 `manage/index.vue` 流程设计器，支持 department 审批人类型和完整权限结构（部门/角色/指定人员三种粒度）

**Architecture:** 修改现有 Vue 组件的模板和数据结构。审批人/抄送人增加 department 选项，权限设置从简单数组改为结构化对象。所有修改保持向后兼容——旧模板数据仍可正常加载。

**Tech Stack:** Vue 2, Element UI, RuoYi 框架

**依赖:** 无前置依赖，这是 Plan B/C/D 的前置条件

**设计文档:** `docs/superpowers/specs/2026-04-04-ai-approval-assistant-design.md` 第 2.2-2.4 节、第 6 节

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `ruoyi-ui/src/views/system/manage/index.vue` | 修改 | 审批人 department 选项 + 权限 UI 扩展 |
| `ruoyi-ui/src/api/system/manage.js` | 不变 | API 层无需改动 |

---

### Task 1: 审批人增加 department 选项

**Files:**
- Modify: `ruoyi-ui/src/views/system/manage/index.vue:601-608`

- [ ] **Step 1: 在审批人 el-select 中添加 department 选项**

在第 607 行 `<el-option label="发起人自己" value="initiator">` 后面添加：

```vue
<el-option label="部门" value="department"></el-option>
```

完整代码（第 601-609 行）：
```vue
<el-select v-model="selectedNode.config.approver" placeholder="请选择审批人">
  <el-option label="指定人员" value="specified"></el-option>
  <el-option label="发起人自选" value="selfSelect"></el-option>
  <el-option label="连续多级主管" value="multiLevel"></el-option>
  <el-option label="主管" value="manager"></el-option>
  <el-option label="角色" value="role"></el-option>
  <el-option label="发起人自己" value="initiator"></el-option>
  <el-option label="部门" value="department"></el-option>
</el-select>
```

- [ ] **Step 2: 在抄送人 el-select 中添加 department 选项**

在第 634 行 `<el-option label="角色" value="role">` 后面添加：

```vue
<el-option label="部门" value="department"></el-option>
```

完整代码（第 630-636 行）：
```vue
<el-select v-model="selectedNode.config.cc" placeholder="请设置抄送人">
  <el-option label="指定人员" value="specified"></el-option>
  <el-option label="发起人自选" value="selfSelect"></el-option>
  <el-option label="主管" value="manager"></el-option>
  <el-option label="角色" value="role"></el-option>
  <el-option label="部门" value="department"></el-option>
</el-select>
```

- [ ] **Step 3: 验证**

在浏览器中：
1. 打开 `http://localhost:8099` → 流程管理 → 流程模板
2. 点击修改 "报销" 模板
3. 切换到 "审批流程" Tab
4. 点击审批人节点 → 属性面板 → 审批人下拉框
5. 确认出现 "部门" 选项
6. 点击抄送人节点 → 确认出现 "部门" 选项

- [ ] **Step 4: Commit**

```bash
cd /Users/jietaoxie/vita
git add ruoyi-ui/src/views/system/manage/index.vue
git commit -m "feat: 审批人/抄送人增加department部门选项"
```

---

### Task 2: 部门选择器 UI（当选择 department 时显示部门下拉）

**Files:**
- Modify: `ruoyi-ui/src/views/system/manage/index.vue:596-637` (审批人配置区域)
- Modify: `ruoyi-ui/src/views/system/manage/index.vue:885-895` (data 区域)

- [ ] **Step 1: 在 data 中添加部门列表和用户列表数据**

在 `processTypeList` 定义附近（约第 893 行），添加：

```javascript
// 可选人员/部门/角色列表（从后端加载）
deptList: [],      // 部门列表
userList: [],      // 用户列表
roleList: [],      // 角色列表
```

- [ ] **Step 2: 在 created 中加载部门/用户/角色列表**

在 `created()` 钩子中（约第 999 行），添加加载方法调用：

```javascript
created() {
  this.getList()
  this.loadProcessTypes()
  this.loadOrgData()  // 新增
},
```

- [ ] **Step 3: 实现 loadOrgData 方法**

在 methods 中添加：

```javascript
/** 加载组织架构数据（部门+用户+角色） */
loadOrgData() {
  // 加载部门列表
  this.getDicts && this.getDicts('sys_dept').catch(() => {})
  request({ url: '/system/dept/list', method: 'get' }).then(res => {
    this.deptList = (res.data || []).map(d => ({ id: d.deptId, name: d.deptName }))
  }).catch(() => {
    this.deptList = []
  })
  // 加载用户列表（内部人员）
  request({ url: '/system/user/list', method: 'get', params: { pageNum: 1, pageSize: 500 } }).then(res => {
    this.userList = (res.rows || []).map(u => ({ id: u.userId, name: u.nickName || u.userName }))
  }).catch(() => {
    this.userList = []
  })
  // 加载角色列表
  request({ url: '/system/role/list', method: 'get', params: { pageNum: 1, pageSize: 100 } }).then(res => {
    this.roleList = (res.rows || []).map(r => ({ id: r.roleId, name: r.roleName, key: r.roleKey }))
  }).catch(() => {
    this.roleList = []
  })
},
```

需要在文件顶部确认已有 `import request from '@/utils/request'`，如果没有则需添加到 script 的 import 区域。

- [ ] **Step 4: 在审批人配置面板中添加部门选择器**

在审批人节点配置区域（约第 620 行 `审批为空` 的 form-item 后面），添加条件性的人员/部门/角色选择器：

```vue
<!-- 指定人员时显示人员选择 -->
<el-form-item v-if="selectedNode.config.approver === 'specified'" label="选择人员">
  <el-select v-model="selectedNode.config.operateUsers" multiple filterable placeholder="请选择审批人员">
    <el-option v-for="u in userList" :key="u.id" :label="u.name" :value="u.id" />
  </el-select>
</el-form-item>
<!-- 按部门时显示部门选择 -->
<el-form-item v-if="selectedNode.config.approver === 'department'" label="选择部门">
  <el-select v-model="selectedNode.config.operateDepts" multiple filterable placeholder="请选择部门">
    <el-option v-for="d in deptList" :key="d.id" :label="d.name" :value="d.id" />
  </el-select>
</el-form-item>
<!-- 按角色时显示角色选择 -->
<el-form-item v-if="selectedNode.config.approver === 'role'" label="选择角色">
  <el-select v-model="selectedNode.config.operateRoles" multiple filterable placeholder="请选择角色">
    <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.key" />
  </el-select>
</el-form-item>
```

- [ ] **Step 5: 在抄送人配置面板中添加同样的选择器**

在抄送人节点配置区域（约第 636 行后），添加：

```vue
<!-- 指定人员时显示人员选择 -->
<el-form-item v-if="selectedNode.config.cc === 'specified'" label="选择人员">
  <el-select v-model="selectedNode.config.operateUsers" multiple filterable placeholder="请选择抄送人员">
    <el-option v-for="u in userList" :key="u.id" :label="u.name" :value="u.id" />
  </el-select>
</el-form-item>
<!-- 按部门时显示部门选择 -->
<el-form-item v-if="selectedNode.config.cc === 'department'" label="选择部门">
  <el-select v-model="selectedNode.config.operateDepts" multiple filterable placeholder="请选择部门">
    <el-option v-for="d in deptList" :key="d.id" :label="d.name" :value="d.id" />
  </el-select>
</el-form-item>
<!-- 按角色时显示角色选择 -->
<el-form-item v-if="selectedNode.config.cc === 'role'" label="选择角色">
  <el-select v-model="selectedNode.config.operateRoles" multiple filterable placeholder="请选择角色">
    <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.key" />
  </el-select>
</el-form-item>
```

- [ ] **Step 6: 更新 addNode 默认 config**

在 `addNode()` 方法（约第 1124 行）中，给 approver 和 cc 类型的默认 config 添加空的选择器字段：

```javascript
if (type === 'approver') {
  newNode.config = {
    approver: 'specified',
    mode: 'or',
    emptyAction: 'pass',
    operateUsers: [],
    operateDepts: [],
    operateRoles: []
  }
} else if (type === 'cc') {
  newNode.config = {
    cc: 'specified',
    operateUsers: [],
    operateDepts: [],
    operateRoles: []
  }
}
```

- [ ] **Step 7: 验证**

在浏览器中：
1. 打开流程模板 → 修改报销模板 → 审批流程 Tab
2. 点击审批人节点 → 选择 "指定人员" → 确认出现人员多选下拉
3. 切换为 "部门" → 确认出现部门多选下拉
4. 切换为 "角色" → 确认出现角色多选下拉
5. 对抄送人节点重复同样测试

- [ ] **Step 8: Commit**

```bash
git add ruoyi-ui/src/views/system/manage/index.vue
git commit -m "feat: 审批人/抄送人支持指定人员、部门、角色选择器"
```

---

### Task 3: 权限 settings 结构扩展

**Files:**
- Modify: `ruoyi-ui/src/views/system/manage/index.vue:177-191` (权限 UI)
- Modify: `ruoyi-ui/src/views/system/manage/index.vue:866-875` (settings 数据结构)
- Modify: `ruoyi-ui/src/views/system/manage/index.vue:776-783` (查看导出权限 dialog)

- [ ] **Step 1: 扩展 settings 默认数据结构**

将 `form.settings`（约第 866 行）和 `reset()` 中的初始值（约第 1658 行）改为：

```javascript
settings: {
  commiter: {
    type: 'role',
    roles: [],
    deptIds: [],
    userIds: []
  },
  admin: {
    type: 'role',
    roles: ['manage'],
    deptIds: [],
    userIds: []
  },
  sign: false,
  notify: {
    type: 'APP',
    title: '流程通知'
  },
  viewer: {
    type: 'role',
    roles: ['manage'],
    deptIds: [],
    userIds: []
  }
}
```

- [ ] **Step 2: 重写"谁可以发起提交"UI**

替换第 177-182 行的简单 el-select 为结构化权限选择器：

```vue
<div class="setting-section">
  <div class="section-title">谁可以发起提交</div>
  <el-radio-group v-model="form.settings.commiter.type" size="small" style="margin-bottom: 10px">
    <el-radio-button label="all">所有人</el-radio-button>
    <el-radio-button label="role">按角色</el-radio-button>
    <el-radio-button label="department">按部门</el-radio-button>
    <el-radio-button label="specified">指定人员</el-radio-button>
  </el-radio-group>
  <el-select v-if="form.settings.commiter.type === 'role'" v-model="form.settings.commiter.roles" multiple filterable placeholder="请选择角色" style="width: 400px">
    <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.key" />
  </el-select>
  <el-select v-if="form.settings.commiter.type === 'department'" v-model="form.settings.commiter.deptIds" multiple filterable placeholder="请选择部门" style="width: 400px">
    <el-option v-for="d in deptList" :key="d.id" :label="d.name" :value="d.id" />
  </el-select>
  <el-select v-if="form.settings.commiter.type === 'specified'" v-model="form.settings.commiter.userIds" multiple filterable placeholder="请选择人员" style="width: 400px">
    <el-option v-for="u in userList" :key="u.id" :label="u.name" :value="u.id" />
  </el-select>
</div>
```

- [ ] **Step 3: 对"谁可以编辑此流程"做同样的改造**

替换第 186-191 行，结构与 Step 2 相同，将 `form.settings.commiter` 改为 `form.settings.admin`。

- [ ] **Step 4: 对"谁可以查看并导出数据"做同样的改造**

替换第 778-783 行的权限对话框中的 viewer 选择器，结构与 Step 2 相同，将 `form.settings.commiter` 改为 `form.settings.viewer`。

- [ ] **Step 5: 修复 buildSubmitData 的 settings 序列化**

在 `buildSubmitData()`（约第 1609-1612 行）中，修改 accessFlag 和 accessIds 的序列化逻辑：

```javascript
// 旧代码:
// accessFlag: this.form.settings.commiter && this.form.settings.commiter.length > 0 ? 1 : null,
// accessIds: this.form.settings.commiter ? this.form.settings.commiter.join(',') : null

// 新代码:
accessFlag: (this.form.settings.commiter.type !== 'all') ? 1 : null,
accessIds: this.form.settings.commiter.type === 'role' ? this.form.settings.commiter.roles.join(',')
  : this.form.settings.commiter.type === 'department' ? this.form.settings.commiter.deptIds.join(',')
  : this.form.settings.commiter.type === 'specified' ? this.form.settings.commiter.userIds.join(',')
  : null
```

- [ ] **Step 6: 修复 handleUpdate 的 settings 反序列化兼容性**

在 handleUpdate（约第 1562-1570 行），添加旧数据格式兼容：

```javascript
if (content.settings) {
  // 兼容旧格式（commiter 是数组）和新格式（commiter 是对象）
  const s = content.settings
  if (Array.isArray(s.commiter)) {
    // 旧格式，转换为新格式
    this.form.settings.commiter = { type: 'role', roles: s.commiter, deptIds: [], userIds: [] }
  } else if (s.commiter && typeof s.commiter === 'object') {
    this.form.settings.commiter = Object.assign({ type: 'role', roles: [], deptIds: [], userIds: [] }, s.commiter)
  }
  // admin 和 viewer 同理
  if (Array.isArray(s.admin)) {
    this.form.settings.admin = { type: 'role', roles: s.admin, deptIds: [], userIds: [] }
  } else if (s.admin && typeof s.admin === 'object') {
    this.form.settings.admin = Object.assign({ type: 'role', roles: ['manage'], deptIds: [], userIds: [] }, s.admin)
  }
  if (Array.isArray(s.viewer)) {
    this.form.settings.viewer = { type: 'role', roles: s.viewer, deptIds: [], userIds: [] }
  } else if (s.viewer && typeof s.viewer === 'object') {
    this.form.settings.viewer = Object.assign({ type: 'role', roles: ['manage'], deptIds: [], userIds: [] }, s.viewer)
  }
  // 其他 settings 字段
  if (s.sign !== undefined) this.form.settings.sign = s.sign
  if (s.notify) this.form.settings.notify = Object.assign({}, this.form.settings.notify, s.notify)
}
```

- [ ] **Step 7: 验证**

在浏览器中：
1. 新建模板 → 基础设置 Tab
2. "谁可以发起提交" → 切换 "按角色"/"按部门"/"指定人员"/"所有人" → 各模式 UI 正确
3. 选择具体角色/部门/人员 → 值正确绑定
4. 保存模板 → 重新编辑 → 确认权限配置正确回显
5. 编辑已有 "报销" 模板 → 确认旧格式兼容加载无报错

- [ ] **Step 8: Commit**

```bash
git add ruoyi-ui/src/views/system/manage/index.vue
git commit -m "feat: 权限设置扩展为部门/角色/指定人员三种粒度"
```

---

### Task 4: 节点显示优化（展示审批人/部门/角色名称）

**Files:**
- Modify: `ruoyi-ui/src/views/system/manage/index.vue` (节点内容显示区域)

- [ ] **Step 1: 添加节点内容显示辅助方法**

在 methods 中添加：

```javascript
/** 获取节点的内容描述 */
getNodeContentDesc(node) {
  if (!node || !node.config) return '请设置'
  const config = node.config
  const assignType = config.approver || config.cc
  
  if (assignType === 'specified' && config.operateUsers) {
    const users = Array.isArray(config.operateUsers) ? config.operateUsers : [config.operateUsers]
    const names = users.map(id => {
      const u = this.userList.find(u => u.id === id)
      return u ? u.name : `用户${id}`
    })
    return names.join('、') || '请指定人员'
  }
  if (assignType === 'department' && config.operateDepts) {
    const depts = Array.isArray(config.operateDepts) ? config.operateDepts : [config.operateDepts]
    const names = depts.map(id => {
      const d = this.deptList.find(d => d.id === id)
      return d ? d.name : `部门${id}`
    })
    return names.join('、') || '请选择部门'
  }
  if (assignType === 'role' && config.operateRoles) {
    const roles = Array.isArray(config.operateRoles) ? config.operateRoles : [config.operateRoles]
    const names = roles.map(key => {
      const r = this.roleList.find(r => r.key === key)
      return r ? r.name : key
    })
    return names.join('、') || '请选择角色'
  }
  
  const descMap = {
    'selfSelect': '发起人自选',
    'manager': '直属主管',
    'multiLevel': '逐级主管',
    'initiator': '发起人自己'
  }
  return descMap[assignType] || '请设置'
},
```

- [ ] **Step 2: 在流程节点模板中使用**

找到审批人节点的内容展示区域（约第 440-454 行的 `.node-content`），将固定文字替换为动态内容：

```vue
<div class="node-content">
  <span>{{ getNodeContentDesc(node) }}</span>
  <i class="el-icon-arrow-right"></i>
</div>
```

- [ ] **Step 3: 验证**

1. 编辑报销模板 → 审批流程 Tab
2. 给审批人节点选择 "指定人员" → 选择具体用户
3. 节点卡片上显示用户姓名（如 "张三、李四"）而非 "请设置审批人"
4. 切换为 "角色" → 选择角色 → 显示角色名称

- [ ] **Step 4: Commit**

```bash
git add ruoyi-ui/src/views/system/manage/index.vue
git commit -m "feat: 流程节点展示审批人/部门/角色具体名称"
```

---

## 验证清单

完成所有 Task 后，执行以下端到端验证：

1. ✅ 新建模板 → 基础设置填写 → 审批表单添加组件 → 审批流程添加节点 → 保存成功
2. ✅ 审批人支持 7 种指定方式（specified/selfSelect/multiLevel/manager/role/initiator/department）
3. ✅ 抄送人支持 5 种指定方式（specified/selfSelect/manager/role/department）
4. ✅ 每种指定方式对应的选择器 UI 正确（人员/部门/角色多选下拉）
5. ✅ 权限设置支持三种粒度（按角色/按部门/指定人员）+ 所有人
6. ✅ 保存 → 重新编辑 → 数据正确回显
7. ✅ 旧格式模板（报销）能正常加载不报错
8. ✅ 节点卡片展示具体名称而非通用文字
