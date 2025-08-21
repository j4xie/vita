# VitaGlobal 后端 API 接口参数详细文档

## 🚀 服务器信息

- **Base URL**: `http://106.14.165.234:8085`
- **系统框架**: RuoYi v3.9.0 (Spring Boot 管理系统)
- **认证方式**: JWT Bearer Token
- **参数编码**: UTF-8
- **最后更新**: 2025-08-21
- **⚠️ 重要**: 本文档已修正认证要求，部分接口实际为公开接口

---

## 📋 参数类型说明

### 参数位置分类
- 🔗 **Path Parameters**: URL路径参数
- 🔍 **Query Parameters**: URL查询参数
- 📝 **Request Body**: 请求体参数（JSON格式）
- 📋 **Header Parameters**: 请求头参数

### 参数属性标记
- ✅ **必填**: 必须提供的参数
- ⚪ **可选**: 可选参数
- 🔐 **认证**: 需要认证的参数
- 👑 **管理员**: 需要管理员权限

---

## 🔓 1. 认证相关接口参数

### 1.1 获取图形验证码
**接口**: `GET /captchaImage`
**认证**: 🔓 无需认证

#### 请求参数
- **无参数**

#### 响应参数
```json
{
  "msg": "string",           // 操作结果消息
  "img": "string",           // Base64编码的验证码图片
  "code": "integer",         // 状态码（200=成功）
  "captchaEnabled": "boolean", // 验证码是否启用
  "uuid": "string"           // 验证码唯一标识符
}
```

### 1.2 管理员后台登录
**接口**: `POST /login`
**认证**: 🔓 无需认证

#### 请求参数 (Request Body - JSON)
```json
{
  "username": "string",      // ✅ 管理员用户名
  "password": "string",      // ✅ 管理员密码
  "code": "string",          // ✅ 图形验证码
  "uuid": "string"           // ✅ 验证码UUID
}
```

#### 参数详情
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `username` | string | ✅ | 管理员登录用户名 | "admin" |
| `password` | string | ✅ | 管理员登录密码 | "admin123" |
| `code` | string | ✅ | 图形验证码内容 | "1234" |
| `uuid` | string | ✅ | 验证码UUID | "c2a4c0d5-8f3e-4b2a-9c1d-3e5f7a8b9c0d" |

### 1.3 用户登录
**接口**: `POST /app/login`
**认证**: 🔓 无需认证

#### 请求参数 (Request Body - JSON)
```json
{
  "userName": "string",      // ✅ 用户名
  "password": "string"       // ✅ 密码
}
```

#### 参数详情
| 参数名 | 类型 | 必填 | 描述 | 格式要求 | 示例值 |
|--------|------|------|------|----------|--------|
| `userName` | string | ✅ | 用户登录名 | 3-20字符，字母数字下划线 | "test001" |
| `password` | string | ✅ | 用户密码 | 6-20字符 | "123456" |

#### 响应参数
```json
{
  "msg": "string",           // 操作结果消息
  "code": "integer",         // 状态码
  "data": {
    "userId": "integer",     // 用户ID
    "token": "string"        // JWT访问令牌
  }
}
```

### 1.4 用户注册
**接口**: `POST /app/user/add`
**认证**: 🔓 无需认证（当前系统已禁用）

#### 请求参数 (Request Body - JSON)

##### 方式一：手机验证码注册
```json
{
  "phone": "string",         // ✅ 手机号码
  "verCode": "string",       // ✅ 短信验证码
  "password": "string",      // ✅ 密码
  "userName": "string",      // ⚪ 用户名
  "legalName": "string",     // ⚪ 真实姓名
  "email": "string",         // ⚪ 邮箱地址
  "deptId": "integer"        // ⚪ 所属学校ID
}
```

##### 方式二：邀请码注册
```json
{
  "invCode": "string",       // ✅ 邀请码
  "password": "string",      // ✅ 密码
  "userName": "string",      // ⚪ 用户名
  "legalName": "string",     // ⚪ 真实姓名
  "phone": "string",         // ⚪ 手机号码
  "email": "string"          // ⚪ 邮箱地址
}
```

#### 参数详情
| 参数名 | 类型 | 必填 | 描述 | 格式要求 | 示例值 |
|--------|------|------|------|----------|--------|
| `phone` | string | ✅* | 手机号码 | 11位数字 | "18221568871" |
| `verCode` | string | ✅* | 短信验证码 | 4-6位数字 | "123456" |
| `invCode` | string | ✅** | 邀请码 | 8位字符 | "Y7MW5HBV" |
| `password` | string | ✅ | 登录密码 | 6-20字符 | "123456" |
| `userName` | string | ⚪ | 用户名 | 3-20字符 | "test001" |
| `legalName` | string | ⚪ | 真实姓名 | 2-50字符 | "张三" |
| `email` | string | ⚪ | 邮箱地址 | 邮箱格式 | "test@example.com" |
| `deptId` | integer | ⚪ | 所属学校ID | 正整数 | 210 |

**注**: *手机验证码注册必填，**邀请码注册必填

### 1.5 获取短信验证码
**接口**: `GET /sms/vercodeSms`
**认证**: 🔓 无需认证

#### 请求参数 (Query Parameters)
| 参数名 | 类型 | 必填 | 描述 | 格式要求 | 示例值 |
|--------|------|------|------|----------|--------|
| `phone` | string | ✅ | 手机号码 | 11位数字 | "18221568871" |

#### 完整URL示例
```
GET /sms/vercodeSms?phone=18221568871
```

#### 响应参数
```json
{
  "bizId": "string",         // 业务ID
  "code": "string",          // 状态码（OK=成功）
  "message": "string",       // 验证码内容
  "requestId": "string"      // 请求ID
}
```

---

## 🔐 2. 用户相关接口参数

### 2.1 获取用户信息
**接口**: `GET /app/user/info`
**认证**: 🔐 需要 Bearer Token

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 | 格式 |
|--------|------|------|------|------|
| `Authorization` | string | ✅ | JWT访问令牌 | "Bearer {token}" |

##### Query Parameters
- **无参数**

#### 响应参数
```json
{
  "msg": "string",
  "code": "integer",
  "roleIds": ["integer"],
  "data": {
    "userId": "integer",         // 用户ID
    "deptId": "integer",         // 所属部门ID
    "legalName": "string",       // 真实姓名
    "userName": "string",        // 用户名
    "nickName": "string",        // 昵称
    "email": "string",           // 邮箱
    "phonenumber": "string",     // 手机号
    "sex": "string",             // 性别：1-男，0-女
    "avatar": "string",          // 头像URL
    "status": "string",          // 状态：0-正常，1-停用
    "loginIp": "string",         // 最后登录IP
    "loginDate": "string",       // 最后登录时间
    "dept": {
      "deptId": "integer",       // 部门ID
      "deptName": "string",      // 部门名称
      "parentId": "integer",     // 父部门ID
      "ancestors": "string"      // 祖级关系
    },
    "roles": [{
      "roleId": "integer",       // 角色ID
      "roleName": "string",      // 角色名称
      "roleKey": "string",       // 角色标识
      "roleSort": "integer",     // 角色排序
      "dataScope": "string"      // 数据范围
    }]
  }
}
```

### 2.2 获取用户列表
**接口**: `GET /app/user/list`
**认证**: 🔐 需要管理员权限

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | 管理员JWT令牌 |

##### Query Parameters (分页和筛选)
| 参数名 | 类型 | 必填 | 描述 | 默认值 | 示例值 |
|--------|------|------|------|--------|--------|
| `pageNum` | integer | ⚪ | 页码 | 1 | 1 |
| `pageSize` | integer | ⚪ | 每页数量 | 10 | 20 |
| `userName` | string | ⚪ | 用户名筛选 | - | "test" |
| `status` | string | ⚪ | 状态筛选 | - | "0" |
| `deptId` | integer | ⚪ | 部门筛选 | - | 202 |

---

## 🎯 3. 活动相关接口参数

### 3.1 获取活动列表
**接口**: `GET /app/activity/list`
**认证**: 🔓 无需认证（公开接口）

#### 请求参数
##### Header Parameters
- **无需认证header**

##### Query Parameters (分页和筛选)
| 参数名 | 类型 | 必填 | 描述 | 默认值 | 示例值 |
|--------|------|------|------|--------|--------|
| `pageNum` | integer | ⚪ | 页码 | 1 | 1 |
| `pageSize` | integer | ⚪ | 每页数量 | 10 | 20 |
| `name` | string | ⚪ | 活动名称搜索 | - | "志愿活动" |
| `status` | integer | ⚪ | 活动状态筛选 | - | 1 |
| `categoryId` | integer | ⚪ | 分类筛选 | - | 1 |
| `startTime` | string | ⚪ | 开始时间筛选 | - | "2025-08-20" |
| `endTime` | string | ⚪ | 结束时间筛选 | - | "2025-09-20" |

#### 响应参数
```json
{
  "total": "integer",
  "rows": [{
    "id": "integer",             // 活动ID
    "name": "string",            // 活动名称
    "icon": "string",            // 活动封面图URL
    "startTime": "string",       // 开始时间
    "endTime": "string",         // 结束时间
    "address": "string",         // 活动地点
    "enrollment": "integer",     // 报名人数限制
    "detail": "string",          // 活动详情（HTML）
    "signStartTime": "string",   // 报名开始时间
    "signEndTime": "string",     // 报名结束时间
    "enabled": "integer",        // 启用状态：1-启用，0-禁用
    "createUserId": "integer",   // 创建者用户ID
    "createName": "string",      // 创建者姓名
    "createNickName": "string",  // 创建者昵称
    "registrationStatus": "integer" // 当前用户报名状态：0-未报名，-1-已报名未签到，1-已签到
  }],
  "code": "integer",
  "msg": "string"
}
```

### 3.2 活动报名
**接口**: `GET /app/activity/enroll`
**认证**: 🔐 需要 Bearer Token

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | JWT访问令牌 |

##### Query Parameters
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `activityId` | integer | ✅ | 活动ID | 20 |

#### 完整URL示例
```
GET /app/activity/enroll?activityId=20
```

#### 响应参数
```json
{
  "msg": "string",           // 操作结果消息
  "code": "integer",         // 状态码
  "data": "integer"          // 报名结果：>0成功，<=0失败
}
```

### 3.3 活动签到
**接口**: `GET /app/activity/signIn`
**认证**: 🔐 需要 Bearer Token

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | JWT访问令牌 |

##### Query Parameters
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `activityId` | integer | ✅ | 活动ID | 20 |

#### 完整URL示例
```
GET /app/activity/signIn?activityId=20
```

---

## 🏢 4. 组织相关接口参数

### 4.1 获取组织列表
**接口**: `GET /app/organization/list`
**认证**: 🔓 无需认证（公开接口）

#### 请求参数
##### Header Parameters
- **无需认证header**

##### Query Parameters (分页和筛选)
| 参数名 | 类型 | 必填 | 描述 | 默认值 | 示例值 | 备注 |
|--------|------|------|------|--------|--------|------|
| `pageNum` | integer | ⚪ | 页码 | 1 | 1 | - |
| `pageSize` | integer | ⚪ | 每页数量 | 10 | 20 | - |
| `name` | string | ⚪ | 组织名称搜索 | - | "学联" | ⚠️ 可能不支持URL参数搜索 |
| `type` | integer | ⚪ | 组织类型筛选 | - | 1 | ⚠️ 需要验证支持情况 |

#### 响应参数
**当前实际数据**（2025-08-21最新）:
```json
{
  "total": 4,
  "rows": [
    {
      "createBy": null,
      "createTime": "2025-08-19 21:46:21",
      "updateBy": null,
      "updateTime": null,
      "remark": null,
      "id": 1,
      "name": "学联组织"
    },
    {
      "createBy": null,
      "createTime": "2025-08-19 21:46:28",
      "updateBy": null,
      "updateTime": null,
      "remark": null,
      "id": 2,
      "name": "社团"
    },
    {
      "createBy": null,
      "createTime": "2025-08-21 12:00:11",
      "updateBy": null,
      "updateTime": null,
      "remark": null,
      "id": 4,
      "name": "Chinese Union"
    },
    {
      "createBy": null,
      "createTime": "2025-08-21 12:00:21",
      "updateBy": null,
      "updateTime": null,
      "remark": null,
      "id": 5,
      "name": "CSSA"
    }
  ],
  "code": 200,
  "msg": "查询成功"
}
```

**字段说明**:
- `total`: 总组织数量
- `id`: 组织唯一ID
- `name`: 组织名称
- `createTime`: 创建时间
- `createBy/updateBy`: 创建者/更新者（当前均为null）
- `remark`: 备注信息

---

## 🏫 5. 学校相关接口参数

### 5.1 获取学校列表
**接口**: `GET /app/dept/list`
**认证**: 🔓 无需认证（公开接口）

#### 请求参数
##### Query Parameters (可选筛选)
| 参数名 | 类型 | 必填 | 描述 | 示例值 | 验证状态 |
|--------|------|------|------|--------|----------|
| `deptName` | string | ⚪ | 学校名称筛选 | "UC" | ✅ 已验证支持 |
| `status` | string | ⚪ | 状态筛选 | "0" | ⚪ 未验证 |
| `parentId` | integer | ⚪ | 父级ID筛选 | 202 | ⚪ 未验证 |

#### 响应参数
```json
{
  "msg": "string",
  "code": "integer",
  "data": [{
    "createBy": "string",        // 创建者
    "createTime": "string",      // 创建时间
    "updateBy": "string",        // 更新者
    "updateTime": "string",      // 更新时间
    "deptId": "integer",         // 学校/部门ID
    "parentId": "integer",       // 父级部门ID
    "ancestors": "string",       // 祖级关系链（如"0,1,202"）
    "deptName": "string",        // 学校名称
    "orderNum": "integer",       // 显示排序
    "leader": "string",          // 负责人
    "phone": "string",           // 联系电话
    "email": "string",           // 邮箱
    "status": "string",          // 状态：0-正常，1-停用
    "delFlag": "string",         // 删除标记：0-正常，2-删除
    "children": []               // 子部门数组
  }]
}
```

---

## 🤝 6. 志愿者工时管理接口参数

### 6.1 获取志愿者打卡记录
**接口**: `GET /app/hour/recordList`
**认证**: 🔐 需要管理员权限

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | 管理员JWT令牌 |

##### Query Parameters (分页和筛选)
| 参数名 | 类型 | 必填 | 描述 | 默认值 | 示例值 |
|--------|------|------|------|--------|--------|
| `pageNum` | integer | ⚪ | 页码 | 1 | 1 |
| `pageSize` | integer | ⚪ | 每页数量 | 10 | 20 |
| `userId` | integer | ⚪ | 用户ID筛选 | - | 100 |
| `legalName` | string | ⚪ | 姓名搜索 | - | "张三" |
| `startDate` | string | ⚪ | 开始日期 | - | "2025-08-01" |
| `endDate` | string | ⚪ | 结束日期 | - | "2025-08-31" |

### 6.2 获取志愿者工时统计
**接口**: `GET /app/hour/hourList`
**认证**: 🔐 需要管理员权限

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | 管理员JWT令牌 |

##### Query Parameters (分页和筛选)
| 参数名 | 类型 | 必填 | 描述 | 默认值 | 示例值 |
|--------|------|------|------|--------|--------|
| `pageNum` | integer | ⚪ | 页码 | 1 | 1 |
| `pageSize` | integer | ⚪ | 每页数量 | 10 | 20 |
| `userId` | integer | ⚪ | 用户ID筛选 | - | 100 |
| `legalName` | string | ⚪ | 姓名搜索 | - | "张三" |

### 6.3 志愿者签到/签退
**接口**: `POST /app/hour/signRecord`
**认证**: 🔐 需要管理员权限

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | 管理员JWT令牌 |
| `Content-Type` | string | ✅ | 内容类型 | "application/json" |

##### Request Body Parameters
```json
{
  "userId": "integer",       // ✅ 志愿者用户ID
  "type": "integer"          // ✅ 操作类型：1-签到，2-签退
}
```

#### 参数详情
| 参数名 | 类型 | 必填 | 描述 | 取值范围 | 示例值 |
|--------|------|------|------|----------|--------|
| `userId` | integer | ✅ | 志愿者用户ID | 正整数 | 100 |
| `type` | integer | ✅ | 操作类型 | 1-签到，2-签退 | 1 |

### 6.4 查看最后签到记录
**接口**: `GET /app/hour/lastRecordList`
**认证**: 🔐 需要管理员权限

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | 管理员JWT令牌 |

##### Query Parameters
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `userId` | integer | ✅ | 志愿者用户ID | 100 |

---

## 🎫 7. 邀请码管理接口参数

### 7.1 查询邀请码信息
**接口**: `POST /app/invitation/invInfo`
**认证**: 🔐 需要管理员权限

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | 管理员JWT令牌 |
| `Content-Type` | string | ✅ | 内容类型 | "application/json" |

##### Request Body Parameters
```json
{
  "userId": "integer"        // ⚪ 用户ID（查询特定用户的邀请码）
}
```

### 7.2 生成邀请码
**接口**: `POST /app/invitation/addInv`
**认证**: 🔐 需要管理员权限

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | 管理员JWT令牌 |
| `Content-Type` | string | ✅ | 内容类型 | "application/json" |

##### Request Body Parameters
```json
{
  "userId": "integer",       // ✅ 目标用户ID
  "validDays": "integer",    // ⚪ 有效天数
  "maxUseCount": "integer"   // ⚪ 最大使用次数
}
```

### 7.3 重新生成邀请码
**接口**: `POST /app/invitation/resetInv`
**认证**: 🔐 需要管理员权限

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | 管理员JWT令牌 |
| `Content-Type` | string | ✅ | 内容类型 | "application/json" |

##### Request Body Parameters
```json
{
  "userId": "integer"        // ✅ 目标用户ID
}
```

---

## 🧪 8. 测试接口参数（开发专用）

### 8.1 获取测试用户列表
**接口**: `GET /dev-api/test/user/list`
**认证**: 🔐 需要 Bearer Token

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | JWT访问令牌 |

##### Query Parameters
- **无参数**

### 8.2 新增测试用户
**接口**: `POST /dev-api/test/user/save`
**认证**: 🔐 需要 Bearer Token

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | JWT访问令牌 |

##### Query Parameters
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `mobile` | string | ⚪ | 用户手机 | "18221568871" |
| `password` | string | ⚪ | 用户密码 | "123456" |
| `userId` | integer | ⚪ | 用户ID | 100 |
| `username` | string | ⚪ | 用户名称 | "testuser" |

### 8.3 更新测试用户
**接口**: `PUT /dev-api/test/user/update`
**认证**: 🔐 需要 Bearer Token

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | JWT访问令牌 |
| `Content-Type` | string | ✅ | 内容类型 | "application/json" |

##### Request Body Parameters
```json
{
  "userId": "integer",       // ✅ 用户ID
  "username": "string",      // ⚪ 用户名称
  "mobile": "string",        // ⚪ 用户手机
  "password": "string"       // ⚪ 用户密码
}
```

### 8.4 获取测试用户详情
**接口**: `GET /dev-api/test/user/{userId}`
**认证**: 🔐 需要 Bearer Token

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | JWT访问令牌 |

##### Path Parameters
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `userId` | integer | ✅ | 用户ID | 100 |

#### 完整URL示例
```
GET /dev-api/test/user/100
```

### 8.5 删除测试用户
**接口**: `DELETE /dev-api/test/user/{userId}`
**认证**: 🔐 需要 Bearer Token

#### 请求参数
##### Header Parameters
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `Authorization` | string | ✅ | JWT访问令牌 |

##### Path Parameters
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `userId` | integer | ✅ | 用户ID | 100 |

---

## 📄 9. 系统文档接口参数

### 9.1 OpenAPI文档
**接口**: `GET /v3/api-docs`
**认证**: 🔓 无需认证

#### 请求参数
- **无参数**

#### 响应参数
- 返回完整的OpenAPI 3.0规范JSON文档

---

## 🔑 通用参数字典

### Header 通用参数
| 参数名 | 描述 | 示例值 |
|--------|------|--------|
| `Authorization` | JWT Bearer Token | "Bearer eyJhbGciOiJIUzUxMiJ9..." |
| `Content-Type` | 请求内容类型 | "application/json" |
| `Accept` | 响应内容类型 | "application/json" |
| `User-Agent` | 客户端标识 | "VitaGlobal-App/1.0" |

### Query 通用分页参数
| 参数名 | 类型 | 描述 | 默认值 | 取值范围 |
|--------|------|------|--------|----------|
| `pageNum` | integer | 页码 | 1 | ≥1 |
| `pageSize` | integer | 每页数量 | 10 | 1-100 |
| `orderBy` | string | 排序字段 | - | 字段名 |
| `isAsc` | string | 排序方式 | "desc" | "asc", "desc" |

### 数据类型标准
| 类型 | 格式 | 示例 | 说明 |
|------|------|------|------|
| `string` | UTF-8文本 | "Hello" | 字符串 |
| `integer` | 32位整数 | 100 | 整数 |
| `boolean` | 布尔值 | true | 真/假 |
| `date` | YYYY-MM-DD | "2025-08-21" | 日期 |
| `datetime` | ISO 8601 | "2025-08-21T10:30:00.000+08:00" | 日期时间 |
| `array` | JSON数组 | [1,2,3] | 数组 |
| `object` | JSON对象 | {"key":"value"} | 对象 |

### 状态码含义
| 状态码 | 含义 | 描述 |
|--------|------|------|
| `200` | 成功 | 操作成功 |
| `400` | 请求错误 | 参数格式错误 |
| `401` | 认证失败 | 未登录或token无效 |
| `403` | 权限不足 | 没有操作权限 |
| `404` | 资源不存在 | 接口或资源不存在 |
| `500` | 服务器错误 | 内部服务器错误 |

### 字段值约定
| 字段 | 取值 | 含义 |
|------|------|------|
| `sex` | "1" / "0" | 男 / 女 |
| `status` | "0" / "1" | 正常 / 停用 |
| `enabled` | 1 / 0 | 启用 / 禁用 |
| `delFlag` | "0" / "2" | 正常 / 删除 |
| `type` | 1 / 2 | 签到 / 签退 |

---

## 🚀 请求示例

### 完整登录流程示例
```bash
# 1. 用户登录
curl -X POST http://106.14.165.234:8085/app/login \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "test001",
    "password": "123456"
  }'

# 2. 获取用户信息
curl -X GET http://106.14.165.234:8085/app/user/info \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. 获取活动列表（带分页）
curl -X GET "http://106.14.165.234:8085/app/activity/list?pageNum=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. 活动报名
curl -X GET "http://106.14.165.234:8085/app/activity/enroll?activityId=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 管理员操作示例
```bash
# 1. 获取图形验证码
curl -X GET http://106.14.165.234:8085/captchaImage

# 2. 管理员登录
curl -X POST http://106.14.165.234:8085/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "code": "1234",
    "uuid": "c2a4c0d5-8f3e-4b2a-9c1d-3e5f7a8b9c0d"
  }'

# 3. 志愿者签到
curl -X POST http://106.14.165.234:8085/app/hour/signRecord \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 100,
    "type": 1
  }'
```

---

## ⚠️ 重要注意事项

1. **参数编码**: 所有参数使用UTF-8编码
2. **日期格式**: 统一使用ISO 8601格式或YYYY-MM-DD格式
3. **分页参数**: pageNum从1开始，pageSize最大不超过100
4. **Token格式**: Bearer Token格式："Bearer {token}"
5. **JSON格式**: 请求体参数使用标准JSON格式
6. **特殊字符**: URL参数需要进行URL编码
7. **超时设置**: 建议设置请求超时时间为30秒
8. **错误处理**: 根据HTTP状态码和响应中的code字段判断操作结果

---

## 🔍 可能存在的其他接口

基于RuoYi框架特点，以下接口可能存在但需要进一步验证：

### 📂 文件上传相关
- `POST /common/upload` - 通用文件上传（❌ 需要认证，401错误）
- `POST /profile/upload` - 头像上传（❌ 需要认证，401错误）
- `POST /app/upload` - 应用内文件上传（⚪ 未验证）

### 📊 系统信息相关
- `GET /app/getInfo` - 获取系统信息（❌ 需要认证，401错误）
- `GET /getInfo` - 用户信息（⚪ 未验证）
- `POST /app/logout` - 用户退出登录（⚪ 未验证）

### 🔄 数据管理相关
- `POST /app/activity/add` - 创建活动（⚪ 未验证）
- `PUT /app/activity/edit` - 编辑活动（⚪ 未验证）
- `DELETE /app/activity/delete` - 删除活动（⚪ 未验证）
- `POST /app/organization/add` - 创建组织（⚪ 未验证）
- `PUT /app/organization/edit` - 编辑组织（⚪ 未验证）

### 💬 通知消息相关
- `GET /app/notice/list` - 获取通知列表（⚪ 未验证）
- `POST /app/notice/read` - 标记通知已读（⚪ 未验证）

### 📈 统计报表相关
- `GET /app/statistics/dashboard` - 仪表板数据（⚪ 未验证）
- `GET /app/statistics/activity` - 活动统计（⚪ 未验证）

**说明**：
- ✅ 已验证可用
- ❌ 已验证需要认证或不可用
- ⚪ 需要进一步验证

---

## 📝 更新日志

- **2025-08-21**: 创建详细的API参数文档
- **2025-08-21**: 补充所有接口的完整参数信息
- **2025-08-21**: 添加请求示例和最佳实践
- **2025-08-21 下午**: 🔧 **重要修正**：
  - 修正认证要求：`/app/activity/list` 和 `/app/organization/list` 实际上是**公开接口**，无需认证
  - 更新组织数据：当前有4个组织（新增"Chinese Union"和"CSSA"）
  - 验证学校接口支持`deptName`搜索参数
  - 标注了部分参数的验证状态

---

## 📞 技术支持

如需要更多参数信息或遇到技术问题，请联系开发团队。

**文档维护**: VitaGlobal 开发团队  
**最后更新**: 2025-08-21