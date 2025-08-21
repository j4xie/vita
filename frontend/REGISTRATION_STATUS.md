# 注册功能实现状态

## 📋 当前状态总结

### ✅ 已完成的功能

1. **完整的两页式注册流程**
   - 第一页：基础信息收集（姓名、学校选择、手机号）
   - 第二页：账户设置（用户名、密码、组织选择）

2. **学校邮箱自动生成系统**
   - 11所支持的学校及其邮箱域名映射
   - 后端学校数据已配置完成（ID: 210-220）
   - 自动邮箱生成：选择学校 → 生成 `username@domain.edu`

3. **完整的表单验证**
   - 前端实时验证（姓名、用户名、密码、邮箱格式等）
   - 多语言错误提示（中英文）
   - 用户友好的交互反馈

4. **API接口对接**
   - 学校列表：`GET /app/dept/list` ✅ 正常工作
   - 组织列表：`GET /app/organization/list` ✅ 有降级处理
   - 注册接口：`POST /app/user/add` ⚠️ 后端问题

### ⚠️ 当前限制

1. **短信验证功能暂时禁用**
   - 短信服务未配置完成
   - UI中已隐藏短信验证码相关组件
   - API调用中不包含 `verCode` 和 `bizId` 字段

2. **注册接口临时模拟**
   - 后端注册接口返回500错误
   - 前端暂时使用模拟响应确保UI流程正常
   - 所有注册数据验证和处理逻辑已就绪

### 🔧 待恢复的功能

#### 恢复短信验证（当短信服务配置完成后）

1. **RegisterStep2Screen.tsx** - 取消注释：
   ```typescript
   // 第133-138行：恢复验证码验证
   if (!formData.verificationCode.trim()) {
     newErrors.verificationCode = t('validation.verification_code_required');
   } else if (!/^\d{6}$/.test(formData.verificationCode)) {
     newErrors.verificationCode = t('validation.verification_code_format');
   }

   // 第212-213行：恢复验证码字段
   verCode: formData.verificationCode,
   bizId: bizId,

   // 第463-495行：恢复验证码UI组件
   // 将 {false && (...)} 改为正常的组件渲染
   ```

#### 恢复真实API调用（当后端注册接口修复后）

1. **RegisterStep2Screen.tsx** - 第220-224行：
   ```typescript
   // 注释掉模拟响应
   // const response = { code: 200, msg: '注册成功' };
   
   // 取消注释真实API调用
   const response = await registerUser(registrationData);
   ```

### 📊 支持的学校列表

| 学校缩写 | 学校名称 | 后端ID | 邮箱域名 |
|---------|---------|--------|----------|
| UCD | University of California, Davis | 210 | ucdavis.edu |
| UCB | University of California, Berkeley | 211 | berkeley.edu |
| UCSC | University of California, Santa Cruz | 212 | ucsc.edu |
| USC | University of Southern California | 213 | usc.edu |
| UCLA | University of California, Los Angeles | 214 | ucla.edu |
| UCI | University of California, Irvine | 215 | uci.edu |
| UCSD | University of California, San Diego | 216 | ucsd.edu |
| UMN | University of Minnesota | 217 | umn.edu |
| UW | University of Washington | 218 | uw.edu |
| U Berklee Music | Berklee College of Music | 219 | berklee.edu |
| UCSB | University of California, Santa Barbara | 220 | ucsb.edu |

### 🎯 用户注册流程

1. **注册选择页面** → 选择"普通注册"
2. **第一页（基础信息）**：
   - 输入姓名（姓、名分开）
   - 选择学校（从下拉列表）
   - 自动生成学校邮箱预览
   - 输入手机号
3. **第二页（账户设置）**：
   - 确认学校邮箱
   - 设置用户名（6-20位数字字母）
   - 设置昵称
   - 设置密码和确认密码
   - 选择性别
   - 选择所属组织
   - ~~输入手机验证码~~（暂时禁用）
4. **提交注册** → 成功后跳转登录页面

### 🔄 数据字段映射

注册时发送到后端的数据格式：
```typescript
{
  userName: string,        // 用户名 (6-20位数字字母)
  legalName: string,       // 法定姓名 (姓+名组合)
  nickName: string,        // 昵称
  password: string,        // 密码
  phonenumber: string,     // 手机号 (注意字段名)
  email: string,           // 学校邮箱
  sex: '0'|'1'|'2',       // 性别 (0-男 1-女 2-未知)
  deptId: number,          // 学校ID (210-220)
  orgId: number,           // 组织ID (1-学联组织 2-社团)
  // verCode: string,      // 验证码 (暂时禁用)
  // bizId: string,        // 短信业务ID (暂时禁用)
}
```

### 🚀 测试建议

1. **测试UI流程**：
   - 打开注册页面
   - 选择不同学校，查看邮箱生成
   - 填写完整表单
   - 提交注册（会显示成功模拟）

2. **验证数据格式**：
   - 检查控制台输出的注册数据
   - 确认所有字段映射正确

3. **多语言测试**：
   - 切换中英文界面
   - 验证所有文本翻译正确

## 📞 联系后端事项

1. **注册接口500错误**
   - 请检查 `/app/user/add` 接口
   - 确认是否需要特殊配置或权限

2. **短信验证服务**
   - 确认 `/sms/vercodeSms` 接口状态
   - 短信服务提供商配置

3. **组织列表权限**
   - `/app/organization/list` 是否需要认证
   - 建议提供公开的组织列表接口

一旦后端问题解决，前端可以立即恢复完整功能！