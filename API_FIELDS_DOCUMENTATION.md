# VitaGlobal API 字段文档

## 概述
本文档列出了VitaGlobal前端应用所需的所有API字段名称及其功能描述。

---

## 1. 认证相关字段 (Authentication)

### 登录请求
- `loginType` - 登录方式 (email/phone/oauth)
- `email` - 邮箱地址（用于登录）
- `phone` - 手机号码（用于登录）
- `password` - 密码
- `deviceId` - 设备ID
- `deviceType` - 设备类型 (ios/android/web)
- `fcmToken` - Firebase推送令牌
- `rememberMe` - 是否记住登录状态

### 登录响应
- `accessToken` - 访问令牌 (JWT)
- `refreshToken` - 刷新令牌
- `tokenType` - 令牌类型 (Bearer)
- `expiresIn` - 令牌过期时间（秒）
- `userId` - 用户ID
- `userInfo` - 用户基本信息对象

### 注册请求
- `registrationType` - 注册类型 (regular/invited)
- `legalName` - 法定姓名
- `englishNickname` - 英文昵称
- `email` - 学校邮箱 (.edu结尾)
- `password` - 密码
- `confirmPassword` - 确认密码
- `phoneCountryCode` - 手机国家码 (+86/+1)
- `phoneNumber` - 手机号码
- `university` - 所属学校
- `referralCode` - 推荐码（可选）
- `verificationCode` - 验证码
- `agreedToTerms` - 是否同意服务条款
- `agreedToPrivacy` - 是否同意隐私政策

### 验证相关
- `verificationType` - 验证类型 (email/phone)
- `verificationCode` - 验证码
- `verificationToken` - 验证令牌
- `sendTime` - 发送时间
- `expireTime` - 过期时间
- `attemptCount` - 尝试次数
- `isVerified` - 是否已验证

### 密码重置
- `resetType` - 重置方式 (email/phone)
- `resetToken` - 重置令牌
- `newPassword` - 新密码
- `confirmNewPassword` - 确认新密码

### OAuth登录
- `provider` - OAuth提供商 (google/apple/wechat)
- `providerId` - 提供商用户ID
- `providerToken` - 提供商访问令牌
- `providerEmail` - 提供商邮箱
- `providerName` - 提供商用户名
- `providerAvatar` - 提供商头像

---

## 2. 用户相关字段 (User)

### 基础信息
- `userId` - 用户唯一标识符
- `username` - 用户名
- `email` - 邮箱地址
- `phone` - 手机号码
- `avatar` - 用户头像URL
- `nickname` - 昵称
- `realName` - 真实姓名
- `studentId` - 学号
- `school` - 所属学校名称
- `schoolId` - 学校ID
- `major` - 专业
- `enrollmentYear` - 入学年份
- `graduationYear` - 毕业年份
- `bio` - 个人简介
- `gender` - 性别
- `birthDate` - 出生日期
- `preferredLanguage` - 偏好语言 (zh-CN/en-US)

### 账户状态
- `accountStatus` - 账户状态 (active/inactive/suspended)
- `emailVerified` - 邮箱是否验证
- `phoneVerified` - 手机号是否验证
- `lastLoginTime` - 最后登录时间
- `createdAt` - 账户创建时间
- `updatedAt` - 最后更新时间

### 权限与角色
- `role` - 用户角色 (student/organizer/admin)
- `permissions` - 权限列表
- `organizationIds` - 所属组织ID列表
- `isOrganizer` - 是否为组织者

---

## 3. 活动相关字段 (Activity)

### 基础信息
- `activityId` - 活动唯一标识符
- `title` - 活动标题
- `description` - 活动描述
- `shortDescription` - 简短描述
- `coverImage` - 封面图片URL
- `images` - 活动图片URL数组
- `tags` - 标签数组

### 分类与状态
- `category` - 活动分类 (academic/social/career/sports/culture/volunteer)
- `status` - 活动状态 (upcoming/ongoing/ended/cancelled)
- `registrationStatus` - 报名状态 (open/closed/full/waitlist)
- `visibility` - 可见性 (public/private/organization)

### 时间信息
- `startTime` - 开始时间
- `endTime` - 结束时间
- `registrationStartTime` - 报名开始时间
- `registrationEndTime` - 报名截止时间
- `duration` - 持续时长（分钟）
- `timezone` - 时区

### 地点信息
- `location` - 详细地址
- `locationType` - 地点类型 (campus/downtown/online/offsite)
- `venue` - 场地名称
- `roomNumber` - 房间号
- `onlineLink` - 线上活动链接
- `latitude` - 纬度
- `longitude` - 经度

### 容量与报名
- `maxParticipants` - 最大参与人数
- `currentParticipants` - 当前报名人数
- `waitlistCount` - 等待列表人数
- `minParticipants` - 最小参与人数
- `registrationRequired` - 是否需要报名
- `approvalRequired` - 是否需要审批

### 组织者信息
- `organizerId` - 组织者用户ID
- `organizerName` - 组织者名称
- `organizationId` - 组织ID
- `organizationName` - 组织名称
- `organizationLogo` - 组织Logo URL
- `contactEmail` - 联系邮箱
- `contactPhone` - 联系电话

### 费用相关
- `isFree` - 是否免费
- `price` - 价格
- `currency` - 货币单位
- `paymentMethods` - 支付方式数组

### 其他信息
- `requirements` - 参与要求
- `benefits` - 活动福利
- `highlights` - 活动亮点数组
- `agenda` - 议程安排
- `speakers` - 演讲者信息数组
- `sponsors` - 赞助商信息数组
- `viewCount` - 浏览次数
- `likeCount` - 点赞数
- `shareCount` - 分享次数
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

---

## 4. 活动报名相关字段 (Registration)

### 报名信息
- `registrationId` - 报名记录ID
- `userId` - 用户ID
- `activityId` - 活动ID
- `registrationTime` - 报名时间
- `registrationStatus` - 报名状态 (pending/confirmed/cancelled/rejected/waitlist)
- `registrationNumber` - 报名编号
- `qrCode` - 签到二维码
- `qrCodeUrl` - 二维码图片URL
- `qrCodeData` - 二维码数据内容

### 审批信息
- `approvalStatus` - 审批状态
- `approvalTime` - 审批时间
- `approvedBy` - 审批人ID
- `approvalNote` - 审批备注
- `rejectionReason` - 拒绝原因

### 签到信息
- `checkedIn` - 是否已签到
- `checkInTime` - 签到时间
- `checkOutTime` - 签退时间
- `attendanceStatus` - 出勤状态 (present/absent/late/early_leave)

### 支付信息
- `paymentStatus` - 支付状态
- `paymentTime` - 支付时间
- `paymentAmount` - 支付金额
- `paymentMethod` - 支付方式
- `transactionId` - 交易ID

### 其他
- `notes` - 备注
- `feedback` - 反馈
- `rating` - 评分
- `certificateUrl` - 证书URL

---

## 5. 组织相关字段 (Organization)

### 基础信息
- `organizationId` - 组织ID
- `name` - 组织名称
- `englishName` - 英文名称
- `type` - 组织类型 (student_union/club/society/team)
- `logo` - Logo URL
- `coverImage` - 封面图片URL
- `description` - 组织介绍
- `mission` - 组织使命
- `vision` - 组织愿景

### 联系信息
- `email` - 组织邮箱
- `phone` - 联系电话
- `website` - 官网链接
- `socialMedia` - 社交媒体链接对象
- `officeLocation` - 办公地点

### 成员信息
- `memberCount` - 成员数量
- `foundedDate` - 成立日期
- `presidentId` - 社长/主席ID
- `advisorId` - 指导老师ID
- `departmentCount` - 部门数量

### 状态信息
- `status` - 组织状态 (active/inactive/suspended)
- `verificationStatus` - 认证状态
- `verifiedAt` - 认证时间
- `followersCount` - 关注者数量
- `activitiesCount` - 举办活动数量

---

## 6. 二维码相关字段 (QRCode)

### 二维码生成
- `qrType` - 二维码类型 (registration/checkin/referral/event/volunteer)
- `qrData` - 二维码数据内容
- `qrFormat` - 二维码格式 (url/json/text)
- `qrSize` - 二维码尺寸 (像素)
- `qrErrorLevel` - 纠错级别 (L/M/Q/H)
- `qrColor` - 二维码颜色
- `qrBackgroundColor` - 背景颜色
- `qrLogo` - Logo图片URL
- `qrExpireTime` - 过期时间

### 活动签到二维码
- `eventQrId` - 活动二维码ID
- `eventId` - 活动ID
- `eventTitle` - 活动标题
- `checkInCode` - 签到码 (VG_EVENT_XXXXX)
- `validFrom` - 生效时间
- `validUntil` - 失效时间
- `maxUseCount` - 最大使用次数
- `currentUseCount` - 当前使用次数

### 推荐码二维码
- `referralQrId` - 推荐二维码ID
- `referrerId` - 推荐人ID
- `referralCode` - 推荐码 (VG_REF_XXXXX)
- `referralType` - 推荐类型 (user/organization/event)
- `referralReward` - 推荐奖励
- `referralCount` - 已推荐人数

### 志愿者签到二维码
- `volunteerQrId` - 志愿者二维码ID
- `volunteerId` - 志愿者ID
- `volunteerCode` - 志愿者码 (VG_VOL_XXXXX)
- `sessionId` - 服务场次ID
- `locationId` - 服务地点ID

### 二维码扫描记录
- `scanId` - 扫描记录ID
- `scannerId` - 扫描者ID
- `qrCodeId` - 二维码ID
- `scanTime` - 扫描时间
- `scanLocation` - 扫描位置
- `scanDevice` - 扫描设备
- `scanResult` - 扫描结果 (success/invalid/expired/used)
- `scanAction` - 扫描后动作

---

## 7. 志愿者管理相关字段 (Volunteer)

### 志愿者信息
- `volunteerId` - 志愿者ID
- `userId` - 用户ID
- `name` - 姓名
- `phone` - 电话
- `school` - 学校
- `studentId` - 学号
- `volunteerNumber` - 志愿者编号

### 签到签出
- `status` - 当前状态 (checked_in/not_checked_in)
- `checkInTime` - 签到时间
- `checkOutTime` - 签退时间
- `lastCheckInTime` - 上次签到时间
- `lastCheckOutTime` - 上次签退时间

### 工时统计
- `totalHours` - 累计志愿时长
- `monthlyHours` - 本月志愿时长
- `weeklyHours` - 本周志愿时长
- `todayHours` - 今日志愿时长
- `sessions` - 志愿服务记录数组

### 志愿活动
- `activityId` - 活动ID
- `activityName` - 活动名称
- `position` - 岗位
- `department` - 部门
- `supervisor` - 负责人
- `location` - 服务地点

---

## 8. 社区相关字段 (Community)

### 帖子信息
- `postId` - 帖子ID
- `authorId` - 作者ID
- `authorName` - 作者名称
- `authorAvatar` - 作者头像
- `title` - 标题
- `content` - 内容
- `images` - 图片数组
- `type` - 帖子类型 (discussion/question/sharing/announcement)
- `category` - 分类
- `tags` - 标签数组

### 互动数据
- `viewCount` - 浏览数
- `likeCount` - 点赞数
- `commentCount` - 评论数
- `shareCount` - 分享数
- `isLiked` - 当前用户是否点赞
- `isBookmarked` - 当前用户是否收藏
- `isFollowing` - 当前用户是否关注

### 评论信息
- `commentId` - 评论ID
- `parentId` - 父评论ID（用于回复）
- `content` - 评论内容
- `authorId` - 评论者ID
- `authorName` - 评论者名称
- `createdAt` - 评论时间
- `likes` - 评论点赞数
- `replies` - 回复数组

---

## 9. 个人资料相关字段 (Profile)

### 统计数据
- `joinedActivities` - 参加的活动数
- `organizedActivities` - 组织的活动数
- `volunteerHours` - 志愿时长
- `followersCount` - 粉丝数
- `followingCount` - 关注数
- `postsCount` - 发帖数
- `achievementsCount` - 成就数量

### 成就与认证
- `achievements` - 成就列表
- `badges` - 徽章列表
- `certificates` - 证书列表
- `skills` - 技能标签数组
- `interests` - 兴趣标签数组

### 隐私设置
- `profileVisibility` - 资料可见性
- `showEmail` - 是否显示邮箱
- `showPhone` - 是否显示电话
- `allowMessages` - 是否允许私信
- `allowNotifications` - 是否允许通知

---

## 10. 咨询服务相关字段 (Consulting)

### 学校信息
- `schoolId` - 学校ID
- `schoolName` - 学校名称
- `schoolEnglishName` - 学校英文名
- `schoolShortName` - 学校简称
- `schoolLogo` - 学校Logo
- `schoolColor` - 学校主题色
- `studentCount` - 学生数量
- `consultantCount` - 顾问数量

### 咨询服务
- `serviceId` - 服务ID
- `serviceName` - 服务名称
- `serviceType` - 服务类型
- `serviceDescription` - 服务描述
- `consultantId` - 顾问ID
- `consultantName` - 顾问姓名
- `consultantAvatar` - 顾问头像
- `consultantRating` - 顾问评分
- `availability` - 可预约时段

### 预约信息
- `appointmentId` - 预约ID
- `studentId` - 学生ID
- `consultantId` - 顾问ID
- `appointmentTime` - 预约时间
- `duration` - 持续时长
- `topic` - 咨询主题
- `status` - 预约状态
- `notes` - 备注

---

## 11. 消息通知相关字段 (Notification)

### 通知信息
- `notificationId` - 通知ID
- `userId` - 接收用户ID
- `type` - 通知类型 (system/activity/registration/comment/like/follow)
- `title` - 通知标题
- `content` - 通知内容
- `imageUrl` - 相关图片
- `actionUrl` - 跳转链接
- `isRead` - 是否已读
- `createdAt` - 创建时间

### 推送设置
- `pushEnabled` - 是否开启推送
- `emailEnabled` - 是否开启邮件通知
- `smsEnabled` - 是否开启短信通知
- `notificationCategories` - 订阅的通知类别数组

---

## 12. 搜索与筛选相关字段

### 搜索参数
- `keyword` - 搜索关键词
- `searchType` - 搜索类型
- `sortBy` - 排序字段
- `sortOrder` - 排序方式 (asc/desc)
- `page` - 页码
- `pageSize` - 每页数量
- `totalCount` - 总数量
- `hasMore` - 是否有更多

### 筛选条件
- `categories` - 分类筛选数组
- `statuses` - 状态筛选数组
- `locations` - 地点筛选数组
- `dateRange` - 日期范围对象
- `priceRange` - 价格范围对象
- `organizations` - 组织筛选数组
- `tags` - 标签筛选数组

---

## 13. 文件上传相关字段 (FileUpload)

### 上传请求
- `fileType` - 文件类型 (image/document/video)
- `fileName` - 文件名
- `fileSize` - 文件大小（字节）
- `mimeType` - MIME类型
- `uploadPurpose` - 上传用途 (avatar/cover/attachment/certificate)
- `chunkIndex` - 分片索引（大文件）
- `totalChunks` - 总分片数
- `md5Hash` - 文件MD5值

### 上传响应
- `fileId` - 文件ID
- `fileUrl` - 文件访问URL
- `thumbnailUrl` - 缩略图URL（图片）
- `cdnUrl` - CDN加速URL
- `uploadTime` - 上传时间
- `expiryTime` - 过期时间（临时文件）

### 图片处理
- `originalUrl` - 原始图片URL
- `compressedUrl` - 压缩图片URL
- `thumbnailSmall` - 小缩略图 (150x150)
- `thumbnailMedium` - 中缩略图 (400x400)
- `thumbnailLarge` - 大缩略图 (800x800)
- `imageWidth` - 图片宽度
- `imageHeight` - 图片高度
- `imageFormat` - 图片格式

---

## 14. 统计分析相关字段 (Analytics)

### 用户行为
- `eventName` - 事件名称
- `eventCategory` - 事件分类
- `eventAction` - 事件动作
- `eventLabel` - 事件标签
- `eventValue` - 事件值
- `userId` - 用户ID
- `sessionId` - 会话ID
- `timestamp` - 时间戳
- `platform` - 平台 (ios/android/web)
- `appVersion` - 应用版本
- `deviceModel` - 设备型号
- `osVersion` - 操作系统版本

### 页面访问
- `pageUrl` - 页面URL
- `pageName` - 页面名称
- `pageCategory` - 页面分类
- `enterTime` - 进入时间
- `exitTime` - 离开时间
- `duration` - 停留时长
- `referrer` - 来源页面

### 性能监控
- `metricType` - 指标类型 (api/page/resource)
- `metricName` - 指标名称
- `responseTime` - 响应时间（毫秒）
- `errorRate` - 错误率
- `successRate` - 成功率
- `throughput` - 吞吐量

---

## 15. 系统配置相关字段

### 应用配置
- `appVersion` - 应用版本
- `minVersion` - 最低支持版本
- `forceUpdate` - 是否强制更新
- `maintenanceMode` - 维护模式
- `maintenanceMessage` - 维护公告

### 多语言
- `locale` - 语言代码
- `translations` - 翻译内容对象
- `supportedLanguages` - 支持的语言列表

### 功能开关
- `features` - 功能开关对象
- `permissions` - 权限配置对象
- `limits` - 限制配置对象

---

## 使用说明

1. **命名规范**：
   - 使用驼峰命名法（camelCase）
   - 布尔类型字段以 is/has/should 开头
   - 时间字段以 Time/At 结尾
   - 数量字段以 Count/Number 结尾

2. **数据格式**：
   - 时间字段使用 ISO 8601 格式
   - 图片URL使用完整路径
   - 数组字段返回空数组而非 null
   - 可选字段缺失时返回 null

3. **分页规范**：
   - 使用 page 和 pageSize 进行分页
   - 返回 totalCount 表示总数
   - 返回 hasMore 表示是否有更多数据

4. **错误处理**：
   - 统一的错误码体系
   - 包含 errorCode, errorMessage, errorDetails
   - HTTP状态码遵循RESTful规范

---

## 更新日志

- 2025-08-13: 初始版本，包含所有基础功能字段
- 2025-08-13: 补充认证、二维码、文件上传、统计分析相关字段
- 待更新: 根据后端实际实现调整字段名称

---

## 联系方式

如有疑问或需要新增字段，请联系前端开发团队。