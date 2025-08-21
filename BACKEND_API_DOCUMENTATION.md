# VitaGlobal 后端 API 接口文档

## 🚀 服务器信息

- **Base URL**: `http://106.14.165.234:8085`
- **系统框架**: RuoYi v3.9.0 (Spring Boot 管理系统)
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON
- **最后更新**: 2025-08-21

---

## 📋 API 接口列表

### 🔓 1. 认证相关接口

#### 1.1 获取图形验证码
- **URL**: `/captchaImage`
- **方法**: `GET`
- **认证**: 🔓 无需认证
- **描述**: 获取管理员登录所需的图形验证码
- **响应示例**:
```json
{
  "msg": "操作成功",
  "img": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAIeF9DAA...",
  "code": 200,
  "captchaEnabled": true,
  "uuid": "c2a4c0d5-8f3e-4b2a-9c1d-3e5f7a8b9c0d"
}
```

#### 1.2 管理员后台登录
- **URL**: `/login`
- **方法**: `POST`
- **认证**: 🔓 无需认证
- **描述**: 管理员后台系统登录（需要验证码）
- **请求参数**: 
  - `username`: 管理员用户名
  - `password`: 管理员密码
  - `code`: 图形验证码
  - `uuid`: 验证码UUID

#### 1.3 用户登录
- **URL**: `/app/login`
- **方法**: `POST`
- **认证**: 🔓 无需认证
- **描述**: 普通用户登录
- **请求参数**:
  - `userName`: 用户名
  - `password`: 密码
- **响应示例**:
```json
{
  "msg": "操作成功",
  "code": 200,
  "data": {
    "userId": 100,
    "token": "eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl9..."
  }
}
```

#### 1.4 用户注册
- **URL**: `/app/user/add`
- **方法**: `POST`
- **认证**: 🔓 无需认证
- **描述**: 用户注册（当前系统已禁用注册功能）
- **注册方式**:
  - **手机验证码注册**: 提供 `phone`, `verCode`，不填 `invCode`
  - **邀请码注册**: 提供 `invCode`，可选 `phone`, `email`，不填 `verCode`

#### 1.5 获取短信验证码
- **URL**: `/sms/vercodeSms`
- **方法**: `GET`
- **认证**: 🔓 无需认证
- **描述**: 获取手机短信验证码
- **请求参数**: `phone` - 手机号码
- **响应示例**:
```json
{
  "bizId": "136692835821472073^0",
  "code": "OK",
  "message": "123456",
  "requestId": "86F4XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
}
```

---

### 🔐 2. 用户相关接口

#### 2.1 获取用户信息
- **URL**: `/app/user/info`
- **方法**: `GET`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 获取当前登录用户的详细信息
- **响应示例**:
```json
{
  "msg": "操作成功",
  "code": 200,
  "roleIds": [3],
  "data": {
    "userId": 100,
    "deptId": 202,
    "legalName": "测试用户001",
    "userName": "test001",
    "nickName": "testuser001",
    "email": "1836591303@qq.com",
    "phonenumber": "18221568871",
    "sex": "1",
    "avatar": "",
    "status": "0",
    "loginIp": "114.220.210.5",
    "loginDate": "2025-08-20T22:01:59.000+08:00",
    "dept": {
      "deptId": 202,
      "deptName": "学校A",
      "parentId": 1,
      "ancestors": "0,1"
    },
    "roles": [{
      "roleId": 3,
      "roleName": "分管理员",
      "roleKey": "part_manage",
      "roleSort": 3,
      "dataScope": "3"
    }]
  }
}
```

#### 2.2 获取用户列表
- **URL**: `/app/user/list`
- **方法**: `GET`
- **认证**: 🔐 需要管理员权限
- **描述**: 获取系统用户列表（管理员专用）

---

### 🎯 3. 活动相关接口

#### 3.1 获取活动列表
- **URL**: `/app/activity/list`
- **方法**: `GET`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 获取活动列表，包含报名状态
- **状态说明**:
  - `0`: 未报名
  - `-1`: 已报名未签到
  - `1`: 已签到
- **响应示例**:
```json
{
  "total": 1,
  "rows": [{
    "id": 20,
    "name": "这里是活动名称",
    "icon": "https://image.americanpromotioncompany.com/2025/08/20/8c7c0bc1-c4d3-4099-a0b4-21881d17885b.png",
    "startTime": "2025-08-22 00:00:00",
    "endTime": "2025-09-24 00:00:00",
    "address": "这里是活动地点",
    "enrollment": 50,
    "detail": "<p>这里是活动详情</p>",
    "signStartTime": "2025-08-20 00:00:00",
    "signEndTime": "2025-09-25 00:00:00",
    "enabled": 1,
    "createUserId": 102,
    "createName": "管理员",
    "createNickName": "guanliyuan"
  }],
  "code": 200,
  "msg": "查询成功"
}
```

#### 3.2 活动报名
- **URL**: `/app/activity/enroll`
- **方法**: `GET`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 报名参加活动
- **请求参数**: `activityId` - 活动ID
- **响应**: `data > 0` 表示报名成功

#### 3.3 活动签到
- **URL**: `/app/activity/signIn`
- **方法**: `GET`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 活动现场签到
- **请求参数**: `activityId` - 活动ID
- **响应**: `data > 0` 表示签到成功

---

### 🏢 4. 组织相关接口

#### 4.1 获取组织列表
- **URL**: `/app/organization/list`
- **方法**: `GET`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 获取所有组织/社团列表
- **响应示例**:
```json
{
  "total": 2,
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
    }
  ],
  "code": 200,
  "msg": "查询成功"
}
```

---

### 🏫 5. 学校相关接口

#### 5.1 获取学校列表
- **URL**: `/app/dept/list`
- **方法**: `GET`
- **认证**: 🔓 无需认证（公开接口）
- **描述**: 获取完整的学校层级结构
- **包含学校**:
  - **UC系列**: UCD, UCB, UCLA, UCI, UCSD, UCSB, UCSC
  - **其他知名大学**: USC, UMN, UW, U Berkeley music
- **响应示例**:
```json
{
  "msg": "操作成功",
  "code": 200,
  "data": [
    {
      "createBy": "superAdmin",
      "createTime": "2025-08-14 13:47:56",
      "deptId": 202,
      "parentId": 1,
      "ancestors": "0,1",
      "deptName": "学校A",
      "orderNum": 2,
      "status": "0",
      "delFlag": "0",
      "children": []
    },
    {
      "deptId": 210,
      "parentId": 202,
      "ancestors": "0,1,202",
      "deptName": "UCD",
      "orderNum": 1,
      "status": "0"
    },
    {
      "deptId": 211,
      "parentId": 202,
      "ancestors": "0,1,202",
      "deptName": "UCB",
      "orderNum": 2,
      "status": "0"
    }
  ]
}
```

---

### 🤝 6. 志愿者工时管理接口

#### 6.1 获取志愿者打卡记录
- **URL**: `/app/hour/recordList`
- **方法**: `GET`
- **认证**: 🔐 需要管理员权限
- **描述**: 查看所有志愿者的打卡记录
- **响应示例**:
```json
{
  "total": 1,
  "rows": [{
    "id": 17,
    "userId": 100,
    "startTime": "2025-08-20T22:28:53.000+08:00",
    "endTime": "2025-08-20T23:28:59.000+08:00",
    "type": 1,
    "operateUserId": null,
    "operateLegalName": null,
    "legalName": "测试用户001"
  }],
  "code": 200,
  "msg": "查询成功"
}
```

#### 6.2 获取志愿者工时统计
- **URL**: `/app/hour/hourList`
- **方法**: `GET`
- **认证**: 🔐 需要管理员权限
- **描述**: 查看志愿者累计工时统计
- **响应示例**:
```json
{
  "total": 1,
  "rows": [{
    "userId": 100,
    "totalMinutes": 33,
    "legalName": "测试用户001"
  }],
  "code": 200,
  "msg": "查询成功"
}
```

#### 6.3 志愿者签到/签退
- **URL**: `/app/hour/signRecord`
- **方法**: `POST`
- **认证**: 🔐 需要管理员权限
- **描述**: 为志愿者执行签到或签退操作
- **请求参数**:
  - `userId`: 志愿者用户ID
  - `type`: 操作类型（签到/签退）

#### 6.4 查看最后签到记录
- **URL**: `/app/hour/lastRecordList`
- **方法**: `GET`
- **认证**: 🔐 需要管理员权限
- **描述**: 查看指定志愿者的最后一次签到记录
- **请求参数**: `userId` - 志愿者用户ID

---

### 🎫 7. 邀请码管理接口

#### 7.1 查询邀请码信息
- **URL**: `/app/invitation/invInfo`
- **方法**: `POST`
- **认证**: 🔐 需要管理员权限
- **描述**: 查询现有邀请码信息
- **响应示例**:
```json
{
  "msg": "操作成功",
  "code": 200,
  "data": {
    "id": 1,
    "userId": 101,
    "invCode": "Y7MW5HBV"
  }
}
```

#### 7.2 生成邀请码
- **URL**: `/app/invitation/addInv`
- **方法**: `POST`
- **认证**: 🔐 需要管理员权限
- **描述**: 为指定用户生成新的邀请码

#### 7.3 重新生成邀请码
- **URL**: `/app/invitation/resetInv`
- **方法**: `POST`
- **认证**: 🔐 需要管理员权限
- **描述**: 重新生成邀请码（替换现有的）

---

### 🧪 8. 测试接口（开发专用）

#### 8.1 获取测试用户列表
- **URL**: `/dev-api/test/user/list`
- **方法**: `GET`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 开发测试用，获取测试用户列表

#### 8.2 新增测试用户
- **URL**: `/dev-api/test/user/save`
- **方法**: `POST`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 开发测试用，创建测试用户
- **请求参数**:
  - `mobile`: 用户手机
  - `password`: 用户密码
  - `userId`: 用户ID
  - `username`: 用户名称

#### 8.3 更新测试用户
- **URL**: `/dev-api/test/user/update`
- **方法**: `PUT`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 开发测试用，更新测试用户信息

#### 8.4 获取测试用户详情
- **URL**: `/dev-api/test/user/{userId}`
- **方法**: `GET`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 开发测试用，获取指定测试用户详情

#### 8.5 删除测试用户
- **URL**: `/dev-api/test/user/{userId}`
- **方法**: `DELETE`
- **认证**: 🔐 需要 Bearer Token
- **描述**: 开发测试用，删除指定测试用户

---

### 📄 9. 系统文档接口

#### 9.1 OpenAPI文档
- **URL**: `/v3/api-docs`
- **方法**: `GET`
- **认证**: 🔓 无需认证
- **描述**: 获取完整的OpenAPI 3.0规范文档
- **返回**: 完整的JSON格式API文档

---

## 🔑 认证机制详解

### 🔓 公开接口（无需认证）
以下接口可以直接访问，无需提供任何认证信息：
- `/captchaImage` - 获取验证码
- `/app/login` - 用户登录
- `/app/user/add` - 用户注册
- `/sms/vercodeSms` - 获取短信验证码
- `/app/dept/list` - 获取学校列表
- `/v3/api-docs` - API文档

### 🔐 用户接口（需要Bearer Token）
大部分业务接口需要在请求头中携带有效的JWT token：
```http
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl9...
```

### 👑 管理员接口（需要管理员权限）
以下接口需要管理员级别的权限：
- `/app/hour/*` - 志愿者工时管理
- `/app/invitation/*` - 邀请码管理
- `/app/user/list` - 用户列表查询
- `/dev-api/test/*` - 测试接口

---

## 📊 字段说明

### 通用响应格式
```json
{
  "msg": "操作结果描述",
  "code": 200,
  "data": "具体数据内容"
}
```

### 状态码说明
- `200`: 操作成功
- `401`: 认证失败，需要登录或token无效
- `403`: 权限不足，需要更高权限
- `404`: 接口不存在
- `500`: 服务器内部错误

### 重要字段说明

#### 用户相关
- `userId`: 用户唯一标识
- `legalName`: 用户真实姓名
- `userName`: 登录用户名
- `nickName`: 用户昵称
- `deptId`: 所属学校/部门ID
- `sex`: 性别，"1"-男，"0"-女
- `status`: 状态，"0"-正常，"1"-停用

#### 学校相关
- `deptId`: 学校/部门唯一ID
- `deptName`: 学校名称（如"UCD"、"UCLA"）
- `parentId`: 父级部门ID
- `ancestors`: 层级关系链（如"0,1,202"）
- `orderNum`: 显示排序号

#### 活动相关
- `id`: 活动唯一ID
- `name`: 活动名称
- `icon`: 活动封面图片URL
- `enrollment`: 报名人数限制
- `enabled`: 活动状态，1-启用，0-禁用
- `detail`: 活动详情（HTML格式）

---

## ⚠️ 重要注意事项

1. **系统状态**: 当前注册功能已被禁用
2. **时间格式**: 统一使用 `YYYY-MM-DD HH:mm:ss` 或 ISO 8601 格式
3. **图片链接**: 使用完整的URL路径
4. **分页**: 使用标准的 `page` 和 `pageSize` 参数
5. **验证码**: 管理员登录需要图形验证码验证
6. **Token过期**: JWT token有过期机制，需要定期刷新

---

## 🚀 使用示例

### 用户登录流程
```bash
# 1. 用户登录
curl -X POST http://106.14.165.234:8085/app/login \
  -H "Content-Type: application/json" \
  -d '{"userName":"test001","password":"123456"}'

# 2. 使用返回的token获取用户信息
curl -X GET http://106.14.165.234:8085/app/user/info \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 获取活动列表
```bash
curl -X GET http://106.14.165.234:8085/app/activity/list \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 获取学校列表（无需认证）
```bash
curl -X GET http://106.14.165.234:8085/app/dept/list
```

---

## 📝 更新日志

- **2025-08-21**: 创建完整的API接口文档
- **2025-08-21**: 验证所有接口的可用性和响应格式
- **2025-08-21**: 添加认证机制和使用示例

---

## 📞 技术支持

如需要更多接口信息或遇到技术问题，请联系开发团队。

**文档维护**: VitaGlobal 开发团队  
**最后更新**: 2025-08-21