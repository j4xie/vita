# PomeloX API 接口指南

## 基础配置

- **Base URL**: `https://www.vitaglobal.icu`
- **认证方式**: JWT Bearer Token (Header: `Authorization: Bearer {token}`)
- **请求格式**: `application/x-www-form-urlencoded` (POST) 或 Query Parameters (GET)
- **响应格式**: JSON

## 标准响应结构
```json
{
  "msg": "操作成功",
  "code": 200,
  "data": {...}  // 响应数据，可能为null
}
```

## 权限系统
根据用户的 `roleKey` 判断权限级别：
- `manage`: 总管理员
- `part_manage`: 分管理员  
- `staff`: 内部员工
- `common`: 普通用户

## 1. 用户认证模块

### 用户注册 `/app/user/add` [POST]
**参数:**
```typescript
{
  userName: string;        // 用户名，6-20位数字字母
  legalName: string;       // 法定姓名，最长50字符
  nickName: string;        // 英文名，最长50字符  
  password: string;        // 密码，6-20位
  phonenumber?: string;    // 手机号
  email?: string;          // 邮箱
  sex: 0 | 1 | 2;         // 0-男 1-女 2-未知
  deptId: number;          // 学校ID
  verCode?: string;        // 手机验证码
  invCode?: string;        // 邀请码
  bizId?: string;          // 短信验证码接口返回字段
  orgId?: number;          // 组织ID
}
```

### 用户登录 `/app/login` [POST]
**参数:**
```typescript
{
  username: string;  // 用户名
  password: string;  // 密码
}
```

### 获取短信验证码 `/sms/vercodeSms` [GET]
**参数:**
```typescript
{
  phoneNum: string;  // 手机号
}
```

### 获取用户信息 `/app/user/info` [GET]
**Headers:** `Authorization: Bearer {token}`

## 2. 活动管理模块

### 获取活动列表 `/app/activity/list` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  pageNum?: number;   // 当前页码，默认1
  pageSize?: number;  // 每页条数，默认10  
  userId: number;     // 用户ID，必填
}
```

### 活动报名 `/app/activity/enroll` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  activityId: number;  // 活动ID
  userId: number;      // 用户ID
}
```

### 活动签到 `/app/activity/signIn` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  activityId: number;  // 活动ID
  userId: number;      // 用户ID
}
```

### 获取用户相关活动 `/app/activity/userActivitylist` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;           // 用户ID
  signStatus?: -1 | 1;     // 筛选条件：-1已报名未签到，1已报名已签到
}
```

## 3. 志愿者管理模块

### 志愿者签到/签退 `/app/hour/signRecord` [POST]
**Headers:** `Authorization: Bearer {token}`

**签到参数:**
```typescript
{
  userId: number;              // 志愿者ID
  type: 1;                    // 1-签到 2-签退
  startTime: string;          // 签到时间 "2025-08-18 12:11:23"
  operateUserId: number;      // 操作人ID
  operateLegalName: string;   // 操作人法定姓名
}
```

**签退参数 (需要先获取记录ID):**
```typescript
{
  id: number;                 // 签到记录ID（必须先获取）
  userId: number;             // 志愿者ID
  type: 2;                   // 2-签退
  endTime: string;           // 签退时间 "2025-08-18 13:05:02"
  operateUserId: number;     // 操作人ID
  operateLegalName: string;  // 操作人法定姓名
}
```

### 查看志愿者签到状态 `/app/hour/lastRecordList` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;  // 志愿者ID
}
```

### 志愿者打卡记录 `/app/hour/recordList` [GET]
**Headers:** `Authorization: Bearer {token}`

### 志愿者工时统计 `/app/hour/hourList` [GET] 
**Headers:** `Authorization: Bearer {token}`

## 4. 管理员功能模块

### 查询已生成邀请码 `/app/invitation/invInfo` [POST]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;  // 管理员ID
}
```

### 生成邀请码 `/app/invitation/addInv` [POST]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;  // 管理员ID
}
```

### 重新生成邀请码 `/app/invitation/resetInv` [POST]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;  // 管理员ID
  id: number;      // 已生成邀请码的ID
}
```

## 5. 学校和组织模块

### 获取学校列表 `/app/dept/list` [GET]
**Headers:** `Authorization: Bearer {token}`

### 组织列表查询 `/app/organization/list` [GET]
**Headers:** `Authorization: Bearer {token}`

## ⚠️ 重要使用规范

### 🚫 严格禁止
- ❌ 使用任何Mock API或虚假数据
- ❌ 硬编码Mock数据到界面
- ❌ 跨平台文件混用 (frontend vs frontend-web)

### ✅ 强制要求
- ✅ 仅使用上述真实后端接口
- ✅ API调用失败时显示真实错误状态
- ✅ 缺失接口必须立即报告，不得编造
- ✅ 所有统计数据必须来自真实API或显示0