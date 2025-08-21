# 注册功能后端接口需求

## 🚨 当前问题

**单独的 `/app/user/add` 接口无法完成完整的注册功能**。注册系统需要以下完整的后端支持：

## 📋 必需的后端接口

### 1. 用户名重复检查接口
```
GET /app/user/checkUserName?userName=testuser123

响应格式：
{
  "code": 200,
  "msg": "操作成功", 
  "available": true  // true-可用, false-已占用
}
```

### 2. 邮箱重复检查接口
```
GET /app/user/checkEmail?email=test@ucla.edu

响应格式：
{
  "code": 200,
  "msg": "操作成功",
  "available": true  // true-可用, false-已注册
}
```

### 3. 邀请码验证接口
```
GET /app/invitation/validate?invCode=2G7KKG49

响应格式：
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "valid": true,
    "inviterName": "推荐人姓名",
    "organizationName": "学联组织", 
    "organizationId": 1,
    "usageCount": 5,
    "maxUsage": 100
  }
}
```

### 4. 公开组织列表接口
```
GET /app/organization/public-list
# 或者将现有接口改为无需认证

响应格式：
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {"id": 1, "name": "学联组织"},
    {"id": 2, "name": "社团"}
  ]
}
```

### 5. 短信验证码接口修复
```
GET /sms/vercodeSms?phone=13800138000

当前状态：返回空对象 {}
需要修复：配置短信服务提供商
```

## 🔧 数据库层面需求

### 1. 唯一性约束
```sql
-- 确保这些约束存在
ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE(userName);
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE(email);
ALTER TABLE users ADD CONSTRAINT unique_phone UNIQUE(phonenumber);
```

### 2. 外键约束
```sql
-- 确保外键约束正确
ALTER TABLE users ADD CONSTRAINT fk_dept 
  FOREIGN KEY (deptId) REFERENCES departments(deptId);
  
ALTER TABLE users ADD CONSTRAINT fk_org 
  FOREIGN KEY (orgId) REFERENCES organizations(orgId);
```

### 3. 邀请码表结构
```sql
-- 确保邀请码表包含必要字段
CREATE TABLE IF NOT EXISTS invitation_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invCode VARCHAR(20) UNIQUE NOT NULL,
  inviterUserId INT,
  organizationId INT,
  usageCount INT DEFAULT 0,
  maxUsage INT DEFAULT 100,
  status ENUM('active', 'disabled', 'expired') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiredAt TIMESTAMP NULL
);
```

## 🎯 两种注册方式的完整实现

### ①手机验证码注册流程
1. **前端验证** → 用户名重复检查
2. **前端验证** → 邮箱重复检查  
3. **发送验证码** → `/sms/vercodeSms`
4. **提交注册** → `/app/user/add`
```json
{
  "userName": "user123",
  "legalName": "张 三",
  "nickName": "John",
  "password": "123456",
  "phonenumber": "13800138000",
  "email": "user123@ucla.edu",
  "sex": "0",
  "deptId": 214,
  "orgId": 1,
  "verCode": "123456",
  "bizId": "sms-biz-id"
  // 不包含 invCode
}
```

### ②邀请码注册流程
1. **验证邀请码** → `/app/invitation/validate`
2. **前端验证** → 用户名重复检查
3. **提交注册** → `/app/user/add`
```json
{
  "userName": "invite123",
  "legalName": "李 四", 
  "nickName": "Lisa",
  "password": "123456",
  "sex": "1",
  "deptId": 214,
  "orgId": 1,
  "invCode": "2G7KKG49"
  // 可选: "phonenumber", "email"
  // 不包含: "verCode", "bizId"
}
```

## 🚨 导致注册失败的可能原因

### 1. 数据库层面
- ❌ 用户名重复但没有唯一性约束检查
- ❌ 邮箱重复但没有唯一性约束检查  
- ❌ 外键约束失败（deptId或orgId不存在）
- ❌ 必填字段验证失败

### 2. 业务逻辑层面
- ❌ 邀请码无效或已过期
- ❌ 密码复杂度不符合要求
- ❌ 手机号格式验证失败
- ❌ 邮箱格式验证失败

### 3. 系统配置层面
- ❌ 注册功能被全局禁用
- ❌ 某些服务依赖未启动
- ❌ 数据库连接问题

## 💡 建议的解决步骤

### 阶段1：最小化可用版本
1. **移除所有约束检查**（临时）
2. **允许重复数据**（测试用）
3. **邀请码跳过验证**（直接接受）
4. **让基础注册接口先通**

### 阶段2：逐步添加验证
1. **添加用户名重复检查接口**
2. **添加邮箱重复检查接口**
3. **添加邀请码验证接口**
4. **配置短信服务**

### 阶段3：完整功能
1. **所有约束和验证**
2. **完整的错误处理**
3. **用户体验优化**

## 🧪 当前可测试的功能

**前端已完全实现**：
- ✅ 推荐码 `2G7KKG49` 扫描识别
- ✅ 邀请码注册流程（手机号可选）
- ✅ 实时用户名验证UI
- ✅ 完整的表单验证
- ✅ 错误处理机制

**只需要后端提供完整的接口支持！**