# 用户信息API集成测试

## 🧪 测试流程

### 1. **登录流程测试**
```bash
# 测试登录API
curl -X POST "http://106.14.165.234:8085/app/login" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "test001",
    "password": "123456"
  }'
```

**预期结果**: 返回`{"code": 200, "data": {"userId": 100, "token": "jwt_token"}}`

### 2. **获取用户信息测试**
```bash
# 使用登录获得的token
curl -X GET "http://106.14.165.234:8085/app/user/info" \
  -H "Authorization: Bearer {登录获得的token}" \
  -H "Accept: application/json"
```

**预期结果**: 返回完整用户信息，包括学校、角色等

### 3. **前端集成测试**

#### 3.1 UserContext集成
- [ ] 登录后自动调用`/app/user/info`
- [ ] 用户数据正确适配和存储
- [ ] 权限信息正确解析

#### 3.2 个人资料页面
- [ ] 显示真实姓名：`legalName`
- [ ] 显示真实邮箱：`email` 
- [ ] 显示学校信息：`dept.deptName`
- [ ] 显示用户角色：`roles[0].roleName`

#### 3.3 权限控制
- [ ] 分管理员可以访问志愿者功能
- [ ] 普通用户无法访问管理功能
- [ ] 权限检查正常工作

## 📋 数据映射验证

### 后端数据 → 前端显示
```json
{
  "legalName": "测试用户001",     // → 个人资料显示名
  "userName": "test001",         // → 用户名显示
  "nickName": "testuser001",     // → 昵称显示
  "email": "1836591303@qq.com",  // → 邮箱显示
  "phonenumber": "18221568871",  // → 电话显示
  "sex": "1",                    // → 性别：女
  "dept": {
    "deptName": "学校A"           // → 学校显示
  },
  "roles": [{
    "roleName": "分管理员",        // → 角色显示
    "roleKey": "part_manage"      // → 权限判断
  }]
}
```

### 权限映射
```typescript
// 后端角色 → 前端权限
{
  "roleKey": "part_manage" → {
    "canManageVolunteers": true,
    "canManageInvitations": true,
    "canManageActivities": true
  }
}
```

## 🎯 测试检查点

### ✅ 已完成的集成
- [x] VitaGlobalAPI.getUserInfo() 方法更新
- [x] 用户数据适配器创建 
- [x] UserContext真实API集成
- [x] ProfileHomeScreen真实数据显示
- [x] 权限控制系统实现
- [x] 志愿者功能权限检查

### 🧪 需要验证的功能
- [ ] 完整登录→获取用户信息流程
- [ ] 用户资料页面数据显示
- [ ] 权限控制是否正确工作
- [ ] 错误处理是否完善

## 📝 测试账号

如果需要测试，可以使用：
- **用户名**: test001
- **密码**: 123456 (需要确认)
- **预期角色**: 分管理员
- **预期学校**: 学校A

## 🚀 下一步

用户信息API集成已完成，等待：
1. 真实登录测试验证
2. 活动数据添加后的完整流程测试
3. 组织信息API的进一步集成