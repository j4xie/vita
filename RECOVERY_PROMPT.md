# 恢复用户资料编辑功能 - Recovery Prompt

## 背景
PomeloX应用中的用户资料编辑功能因后端Bug被临时封禁。现在后端已修复 `/app/user/edit` 接口的角色字段处理问题，需要恢复编辑功能。

## 任务清单

请按以下步骤恢复用户资料编辑功能：

### 1. 恢复编辑按钮显示
**文件**: `/Users/jietaoxie/pomeloX/frontend/src/components/profile/PersonalInfoCard.tsx`
**位置**: 第457行
**操作**: 将 `{false && onEditPress &&` 修改为 `{onEditPress &&`

**修改前**:
```typescript
{/* 编辑按钮 - 🚫 临时封禁：由于后端角色字段问题暂时禁用 */}
{false && onEditPress && (
```

**修改后**:
```typescript
{/* 编辑按钮 - ✅ 已恢复：后端角色字段问题已修复 */}
{onEditPress && (
```

### 2. 清理临时解决方案代码
**文件**: `/Users/jietaoxie/pomeloX/frontend/src/screens/profile/EditProfileScreen.tsx`
**位置**: 约第405-435行

**移除以下临时代码块**:
```typescript
// 🔧 临时解决方案：保持用户角色信息，避免被后端清空
// 原因：后端在更新用户信息时会意外清空角色，这是后端的Bug
if (user?.roles && user.roles.length > 0) {
  try {
    // ... 整个临时方案代码块
  } catch (error) {
    console.warn('⚠️ 角色信息处理失败:', error);
  }
} else {
  console.warn('⚠️ 用户没有角色信息，无法保持角色');
}
```

### 3. 清理调试日志
**文件**: `/Users/jietaoxie/pomeloX/frontend/src/screens/profile/EditProfileScreen.tsx`

**移除这些调试相关的console.log**:
- `console.log('📊 后端返回的用户数据:', ...)`
- `console.log('📝 设置的表单数据:', ...)`
- `console.log('🔧 临时方案: 添加roleIds参数:', ...)`
- `console.log('📝 准备更新的数据:', ...)`
- `console.log('✅ 临时方案成功：角色信息保持完整', ...)`

### 4. 简化成功处理逻辑
**文件**: `/Users/jietaoxie/pomeloX/frontend/src/screens/profile/EditProfileScreen.tsx`
**位置**: 约第480-500行

**移除角色检查代码**:
```typescript
// 检查角色是否保持完整
setTimeout(async () => {
  // ... 整个角色检查逻辑
}, 1000);
```

### 5. 更新CLAUDE规范
**文件**: `/Users/jietaoxie/pomeloX/CLAUDE.md`
**操作**: 移除"临时禁用功能"章节或更新为"已恢复"状态

**移除第33-40行**:
```markdown
### **🚫 临时禁用功能 (CRITICAL - 2025年9月)**
- ❌ **用户资料编辑功能已临时封禁** - `/app/user/edit` 接口存在后端Bug
  - **问题**：编辑用户信息时会意外清空用户角色，导致权限丢失
  - **影响**：志愿者管理按钮消失，用户权限被重置
  - **解决方案**：编辑按钮已隐藏 (`PersonalInfoCard.tsx:457`)
  - **代码位置**：`EditProfileScreen.tsx` 完整保留，仅入口被禁用
  - **恢复条件**：等待后端修复角色字段处理逻辑
  - **联系人**：需与后端开发确认 `/app/user/edit` 接口的角色保持机制
```

### 6. 清理authAPI类型定义
**文件**: `/Users/jietaoxie/pomeloX/frontend/src/services/authAPI.ts`
**位置**: 约第221-225行

**移除临时角色参数**:
```typescript
// 🔧 临时解决方案：添加角色相关参数，避免角色被清空
roleIds?: string; // 角色ID列表，逗号分隔
roles?: string; // 角色信息JSON字符串
roleId?: number; // 主要角色ID
roleKey?: string; // 主要角色Key
```

## 验证步骤

恢复后请验证：

1. **编辑按钮显示**: 个人资料卡片右上角应显示铅笔图标
2. **页面导航**: 点击编辑按钮能正常进入编辑页面
3. **字段显示**: 所有用户信息正确显示，特别是性别字段
4. **保存功能**: 修改信息并保存成功
5. **角色保持**: 修改后用户角色不被清空，志愿者管理等功能正常

## 重要提醒

- 确保后端 `/app/user/edit` 接口已真正修复角色字段问题
- 测试时先用测试账号验证，避免影响生产用户
- 如发现角色仍被清空，立即重新封禁功能并联系后端

## 完成确认

恢复完成后请：
1. 测试编辑功能是否正常工作
2. 确认用户角色不会被意外清空
3. 删除本文件 `RECOVERY_PROMPT.md`

---
**创建时间**: 2025年9月22日
**问题追踪**: 用户资料编辑功能临时封禁
**状态**: 待后端修复后执行