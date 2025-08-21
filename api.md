baseUrl：http://106.14.165.234:8085

用户注册接口
Url：/app/user/add
请求方式：POST
请求参数：


返回值：
{
    "msg": "操作成功",
    "code": 200
}
注意：两种注册方式：
①手机验证码注册：
invCode不填
②邀请码注册：
手机号和邮箱可填可不填，verCode不填。


用户登录接口
Url：/app/login
请求方式：POST
请求参数：


返回值：
{
    "msg": "操作成功",
    "code": 200,
    "data": {
        "userId": 100,
        "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0MDAxIiwibG9naW5fdXNlcl9rZXkiOiI0Nzk3ODg5MS1lYjIxLTQwYzctYjFhZS1iOWFkNmRlZTZjMjkifQ.nEoqXKVyalquycbpgslp2ooe39C6An-wwsILxrIFO4Wg8S004yezilOkv-OW_ZSrQaIT9sHjsS9GJ8aY8GZiDw"
    }
}


获取短信验证码接口
Url：/sms/vercodeSms
请求方式：GET
请求参数：

返回值：
{
    "bizId": "735818755698130134^0",
    "code": "OK",
    "message": "766404",
    "requestId": "70841027-7254-56A6-BB40-FACC9EA02529"
}


根据UserId获取用户信息接口
Url：/app/user/info
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token


返回值：{
    "msg": "操作成功",
    "code": 200,
    "roleIds": [
        3
    ],
    "data": {
        "createBy": "self",
        "createTime": "2025-08-13 11:09:22",
        "updateBy": null,
        "updateTime": null,
        "remark": null,
        "userId": 100,
        "deptId": 202,
        "legalName": "测试用户001",
        "userName": "test001",
        "nickName": "testuser001",
        "email": "1836591303@qq.com",
        "phonenumber": "18221568871",
        "sex": "1",
        "avatar": "",
        "password": "$2a$10$7U6JchPfYxyRtG7mcd811utPT56HBpNO7aGH0nCoZ0MG/6wU/c7zu",
        "status": "0",
        "delFlag": "0",
        "loginIp": "114.220.210.5",
        "loginDate": "2025-08-20T22:01:59.000+08:00",
        "pwdUpdateDate": null,
        "dept": {
            "createBy": null,
            "createTime": null,
            "updateBy": null,
            "updateTime": null,
            "remark": null,
            "deptId": 202,
            "parentId": 1,
            "ancestors": "0,1",
            "deptName": "学校A",
            "orderNum": 2,
            "leader": null,
            "phone": null,
            "email": null,
            "status": "0",
            "delFlag": null,
            "parentName": null,
            "children": []
        },
        "roles": [
            {
                "createBy": null,
                "createTime": null,
                "updateBy": null,
                "updateTime": null,
                "remark": null,
                "roleId": 3,
                "roleName": "分管理员",
                "roleKey": "part_manage",
                "roleSort": 3,
                "dataScope": "3",
                "menuCheckStrictly": false,
                "deptCheckStrictly": false,
                "status": "0",
                "delFlag": null,
                "flag": false,
                "menuIds": null,
                "deptIds": null,
                "permissions": null,
                "admin": false
            }
        ],
        "roleIds": null,
        "postIds": null,
        "roleId": null,
        "verCode": null,
        "invCode": null,
        "bizId": null,
        "orgId": null,
        "admin": false
    },
    "postIds": [],
    "roles": [],
    "posts": []
}


获取全部活动列表接口
Url：/app/activity/list
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token

返回值：
{
    "total": 1,
    "rows": [
        {
            "createBy": null,
            "createTime": "2025-08-20 22:15:47",
            "updateBy": null,
            "updateTime": null,
            "remark": null,
            "id": 20,
            "name": "这里是活动名称",
            "icon": "https://image.americanpromotioncompany.com/2025/08/20/8c7c0bc1-c4d3-4099-a0b4-21881d17885b.png",
            "startTime": "2025-08-22 00:00:00",
            "endTime": "2025-09-24 00:00:00",
            "address": "这里是活动地点",
            "enrollment": 50,
            "detail": "<p>这里是活动详情</p><p>很好的活动</p><p><img src=\"https://image.americanpromotioncompany.com/2025/08/20/f1b21330-ae81-4fe4-8d68-1243a3f7dd45.png\"></p><p><img src=\"https://image.americanpromotioncompany.com/2025/08/20/7c204441-8598-44c4-a5eb-556fef74aeac.png\"></p>",
            "signStartTime": "2025-08-20 00:00:00",
            "signEndTime": "2025-09-25 00:00:00",
            "status": null,
            "enabled": 1,
            "createUserId": 102,
            "createName": "管理员",
            "createNickName": "guanliyuan"
        }
    ],
    "code": 200,
    "msg": "查询成功"
}


6、获取全部活动列表接口
Url：/app/activity/list
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token

返回值：
{
    "msg": "操作成功",
    "code": 200,
    "data": 0       0-未报名   -1-已报名未签到    1-已签到
}


7、活动报名接口
Url：/app/activity/enroll
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token


返回值：
{
    "msg": "操作成功",
    "code": 200,
    "data": 1        >0 报名成功
}



8、活动签到接口
Url：/app/activity/signIn
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token

返回值：
{
    "msg": "操作成功",
    "code": 200,
    "data": 1    >0签到成功
}


9、查询全部学校列表接口
Url：/app/dept/list
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token
返回值：
{
    "msg": "操作成功",
    "code": 200,
    "data": [
        {
            "createBy": "superAdmin",
            "createTime": "2025-08-14 13:47:56",
            "updateBy": null,
            "updateTime": null,
            "remark": null,
            "deptId": 202,
            "parentId": 1,
            "ancestors": "0,1",
            "deptName": "学校A",
            "orderNum": 2,
            "leader": null,
            "phone": null,
            "email": null,
            "status": "0",
            "delFlag": "0",
            "parentName": null,
            "children": []
        },
        {
            "createBy": "superAdmin",
            "createTime": "2025-08-14 13:48:07",
            "updateBy": null,
            "updateTime": null,
            "remark": null,
            "deptId": 203,
            "parentId": 1,
            "ancestors": "0,1",
            "deptName": "学校B",
            "orderNum": 3,
            "leader": null,
            "phone": null,
            "email": null,
            "status": "0",
            "delFlag": "0",
            "parentName": null,
            "children": []
        }
    ]
}


10、管理员用--志愿者打卡记录列表接口
Url：/app/hour/recordList
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token
返回值：
{
    "total": 1,
    "rows": [
        {
            "createBy": null,
            "createTime": null,
            "updateBy": null,
            "updateTime": null,
            "remark": null,
            "id": 17,
            "userId": 100,
            "startTime": "2025-08-20T22:28:53.000+08:00",
            "endTime": "2025-08-20T23:28:59.000+08:00",
            "type": 1,
            "operateUserId": null,
            "operateLegalName": null,
            "legalName": "测试用户001"
        }
    ],
    "code": 200,
    "msg": "查询成功"
}


11、管理员用--志愿者工时列表
Url：/app/hour/hourList
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token
返回值：
{
    "total": 1,
    "rows": [
        {
            "createBy": null,
            "createTime": null,
            "updateBy": null,
            "updateTime": null,
            "remark": null,
            "userId": 100,
            "totalMinutes": 33,
            "legalName": "测试用户001"
        }
    ],
    "code": 200,
    "msg": "查询成功"
}


12、管理员用-给志愿者签到、签退
Url：/app/hour/signRecord
请求方式：POST
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token


返回值：
{
    "msg": "操作成功",
    "code": 200
}


13、管理员-查看志愿者是否签到
Url：/app/hour/lastRecordList
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token


返回值：
成功：
{
    "msg": "操作成功",
    "code": 200,
    "data": {
        "createBy": null,
        "createTime": null,
        "updateBy": null,
        "updateTime": null,
        "remark": null,
        "id": 18,
        "userId": 100,
        "startTime": "2025-08-18T12:11:23.000+08:00",
        "endTime": "2025-08-18T13:05:02.000+08:00",
        "type": 1,
        "operateUserId": 102,
        "operateLegalName": "管理员",
        "legalName": "测试用户001"
    }
}

失败：
{
    "msg": "操作失败",
    "code": 500,
    "data": null
}


14、管理员-查询已生成的邀请码
Url：/app/invitation/invInfo
请求方式：POST
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token

返回值：
{
    "msg": "操作成功",
    "code": 200,
    "data": {
        "createBy": null,
        "createTime": null,
        "updateBy": null,
        "updateTime": null,
        "remark": null,
        "id": 1,
        "userId": 101,
        "invCode": "Y7MW5HBV"
    }
}


15、管理员-生成邀请码接口
Url：/app/invitation/addInv
请求方式：POST
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token

返回值：
{
    "msg": "操作成功",
    "code": 200
}

16、管理员-重新生成邀请码接口
Url：/app/invitation/resetInv
请求方式：POST
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token

返回值：
{
    "msg": "操作成功",
    "code": 200
}


17、组织列表查询
Url：/app/organization/list
请求方式：GET
请求参数：
Header需要携带用户token
例：Authorization：Bearer 用户token
返回值：
{
    "total": 2,
    "rows": [
        {
            "createBy": null,
            "createTime": "2025-08-19 21:46:21",
            "updateBy": null,
            "updateTime": null,
            "remark": null,
            "id": 1,
            "name": "学联组织"
        },
        {
            "createBy": null,
            "createTime": "2025-08-19 21:46:28",
            "updateBy": null,
            "updateTime": null,
            "remark": null,
            "id": 2,
            "name": "社团"
        }
    ],
    "code": 200,
    "msg": "查询成功"
}







