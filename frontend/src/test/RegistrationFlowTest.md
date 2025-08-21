# 注册流程测试清单

## 🧪 注册流程完整性测试

### 1. **导航测试**
- [ ] RegisterChoiceScreen → RegisterFormScreen 导航正常
- [ ] RegisterFormScreen → VerificationScreen 导航正常
- [ ] VerificationScreen → Login 导航正常
- [ ] QRScanner → RegisterFormScreen (邀请码) 导航正常

### 2. **API接口测试**

#### 2.1 学校列表API
```bash
# 测试命令
curl -X GET "http://106.14.165.234:8085/app/dept/list"
```
**预期结果**: 返回学校列表，包含UCD、UCB、UCLA等

#### 2.2 短信验证码API
```bash
# 测试命令 (中国号码)
curl -X GET "http://106.14.165.234:8085/sms/vercodeSms?phone=8613800138000"
```
**预期结果**: 返回bizId和验证码

#### 2.3 用户注册API
```bash
# 测试命令
curl -X POST "http://106.14.165.234:8085/app/user/add" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "testuser123",
    "legalName": "测试用户",
    "nickName": "Test User",
    "password": "123456",
    "phonenumber": "13800138000",
    "email": "test@berkeley.edu",
    "sex": "1",
    "deptId": "211",
    "verCode": "123456",
    "bizId": "test_biz_id"
  }'
```

#### 2.4 登录API
```bash
# 测试命令
curl -X POST "http://106.14.165.234:8085/app/login" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "testuser123",
    "password": "123456"
  }'
```

### 3. **表单验证测试**

#### 3.1 第一步 - 基本信息
- [ ] 用户名：6-20位字母数字验证
- [ ] 法定姓名：必填，最大50字符
- [ ] 英文昵称：必填，最大50字符
- [ ] 学校选择：必选，从API获取

#### 3.2 第二步 - 账号设置
- [ ] 邮箱：必填，格式验证
- [ ] 密码：6-20位验证
- [ ] 确认密码：匹配验证

#### 3.3 第三步 - 联系方式
- [ ] 手机号：格式验证（中国/美国）
- [ ] 性别选择：男/女/未知
- [ ] 服务条款：必须同意

### 4. **验证码流程测试**
- [ ] 发送验证码成功
- [ ] 60秒倒计时正常
- [ ] 重新发送功能正常
- [ ] 6位验证码输入验证
- [ ] 验证码验证成功

### 5. **邀请码注册测试**

#### 已知邀请码：`2G7KKG49`
- [ ] QR扫描邀请码
- [ ] 手动输入邀请码
- [ ] 邀请码注册跳过验证码
- [ ] 邀请码用户信息自动填充

### 6. **数据映射验证**

| 前端字段 | 后端字段 | 测试状态 |
|---------|---------|---------|
| `userName` | `userName` | ✅ |
| `legalName` | `legalName` | ✅ |
| `englishNickname` | `nickName` | ✅ |
| `universityId` | `deptId` | ✅ |
| `email` | `email` | ✅ |
| `password` | `password` | ✅ |
| `phoneNumber` | `phonenumber` | ✅ |
| `sex` | `sex` | ✅ |
| `referralCode` | `invCode` | ✅ |
| `bizId` | `bizId` | ✅ |

### 7. **错误处理测试**
- [ ] 网络错误处理
- [ ] API错误响应处理
- [ ] 表单验证错误显示
- [ ] 验证码错误处理
- [ ] 注册失败处理

### 8. **国际化测试**
- [ ] 中文界面显示正常
- [ ] 英文界面显示正常
- [ ] 错误信息多语言显示
- [ ] 验证消息多语言显示

### 9. **用户体验测试**
- [ ] 加载状态显示
- [ ] 按钮禁用状态
- [ ] 输入框焦点处理
- [ ] 键盘自动切换
- [ ] 表单自动滚动

### 10. **集成测试**
- [ ] 注册后自动登录
- [ ] 登录状态持久化
- [ ] 导航状态管理
- [ ] 数据清理

## 🐛 已知问题

1. **SchoolSelector组件**: 需要处理空数据情况
2. **验证码倒计时**: 需要页面切换时保持状态
3. **错误提示**: 需要更友好的错误信息

## 🔧 待优化功能

1. **自动填充**: 支持设备保存的用户信息
2. **社交登录**: 集成Google/Apple登录
3. **忘记密码**: 密码重置流程
4. **邮箱验证**: 邮箱验证流程

## 📝 测试记录

**测试日期**: 2025-08-21
**测试环境**: 开发环境
**后端地址**: http://106.14.165.234:8085
**测试邀请码**: 2G7KKG49

### 测试结果
- [ ] 所有API接口正常
- [ ] 所有导航正常
- [ ] 所有表单验证正常
- [ ] 数据映射正确
- [ ] 错误处理完善