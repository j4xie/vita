# 注册功能测试指南

## 🧪 如何测试推荐码 `2G7KKG49` 注册

### 方法1：QR扫描测试
1. 启动应用：`npm start`
2. 打开注册页面 → 选择"推荐码注册"
3. 在QR扫描界面，点击"手动输入"
4. 输入推荐码：`2G7KKG49`
5. 确认后进入邀请码注册流程

### 方法2：直接导航测试
在开发者工具中执行：
```javascript
// 直接导航到邀请码注册
navigation.navigate('RegisterStep1', {
  referralCode: '2G7KKG49',
  hasReferralCode: true,
  registrationType: 'invitation'
});
```

## 📋 测试要点

### ✅ 验证邀请码注册流程
1. **第一页**：
   - 看到邀请码徽章显示 "推荐码：2G7KKG49"
   - 手机号标记为"可选"
   - 可以跳过手机号输入

2. **第二页**：
   - 看到邀请码徽章
   - 组织列表显示4个选项：
     - 学联组织 (id: 1)
     - 社团 (id: 2)
     - Chinese Union (id: 4)
     - CSSA (id: 5)
   - 不显示验证码输入框

3. **提交注册**：
   - 控制台显示正确的数据格式
   - 包含 `invCode: "2G7KKG49"`
   - 不包含 `verCode` 和 `bizId`
   - 手机号和邮箱为可选

### ✅ 验证普通注册流程
1. **注册选择页面** → "普通注册"
2. **第一页**：
   - 不显示邀请码徽章
   - 手机号标记为必填 "*"
   - 邮箱必须填写

3. **第二页**：
   - 显示验证码输入框（暂时禁用）
   - 必须填写手机号和邮箱

## 🔍 控制台调试信息

注册时查看控制台输出：

### 邀请码注册数据格式：
```javascript
{
  userName: "invite2025",
  legalName: "邀请 用户",
  nickName: "Invite User", 
  password: "test123456",
  sex: "1",
  deptId: 214,
  orgId: 4,
  invCode: "2G7KKG49"
  // 注意：没有 verCode, bizId, phonenumber, email
}
```

### 普通注册数据格式：
```javascript
{
  userName: "normal2025",
  legalName: "普通 用户",
  nickName: "Normal User",
  password: "test123456", 
  phonenumber: "13800138000",
  email: "normal2025@ucla.edu",
  sex: "0",
  deptId: 214,
  orgId: 1
  // 注意：没有 invCode
  // verCode 和 bizId 暂时跳过（短信服务未配置）
}
```

## 🎯 当前状态

**前端功能完整**：
- ✅ 推荐码扫描和识别
- ✅ 两种注册方式正确区分
- ✅ 组织列表正常获取
- ✅ 表单验证完善
- ✅ 用户体验流畅

**后端接口状态**：
- ✅ 组织列表：`/app/organization/list` 正常工作
- ✅ 学校列表：`/app/dept/list` 正常工作
- ❌ 注册接口：`/app/user/add` 返回500错误
- ❌ 短信服务：`/sms/vercodeSms` 未配置

**测试建议**：
1. 先测试UI流程和数据格式
2. 等后端修复注册接口后立即可用
3. 验证推荐码 `2G7KKG49` 的完整体验