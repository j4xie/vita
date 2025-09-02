# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PomeloX is a production-ready mobile platform for Chinese international students overseas, focusing on activity management and registration. The platform is currently live and operational as of September 2025.

**Current Status:** Production application deployed with active user base and ongoing feature development.

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL 15 + Redis 7
- **Email:** Gmail SMTP (port 587)
- **Storage:** Cloudflare R2
- **Push Notifications:** Firebase FCM
- **Authentication:** JWT tokens

### Frontend
- **Framework:** React Native + Expo
- **Language:** TypeScript
- **Internationalization:** i18next (zh-CN, en-US)
- **State Management:** React Context + AsyncStorage
- **Animation:** React Native Reanimated 3

## Key Commands

### Environment Setup
```bash
# Start local database services
docker-compose up -d postgres redis

# Start all services including management tools
docker-compose --profile tools up -d

# View service status
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop services
docker-compose down

# Clean up all data
docker-compose down -v
```

### Database Management
```bash
# Connect to PostgreSQL
psql postgresql://vitaglobal:vitaglobal_password@localhost:5432/vitaglobal_db

# Test Redis connection
redis-cli -h localhost -p 6379 ping

# Access management interfaces (with --profile tools)
# PgAdmin: http://localhost:5050 (admin@vitaglobal.dev / admin123)
# Redis Commander: http://localhost:8081 (admin / admin123)
```

### Configuration Setup
```bash
# Copy environment configurations
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Project Structure

```
vitaglobal/
├── backend/                 # FastAPI backend
│   ├── .env.example        # Backend environment template
│   ├── API_DOC.md          # API endpoints documentation
│   ├── DB_SCHEMA.md        # Database schema design
│   └── backend-requirements.md  # 5-week development plan
├── frontend/               # React Native mobile app
│   ├── .env.example       # Frontend environment template
│   └── frontend-requirements.md  # UI development plan
├── config/
│   └── secrets.md         # Sensitive keys documentation
├── docs/
│   └── I18N_IMPLEMENTATION.md  # Internationalization guide
├── docker-compose.yml     # Local development services
├── important-date.md      # Project timeline and milestones
├── MRD.md                # Market requirements
├── PRD.md                # Product requirements
└── README.md             # Project overview
```

## Architecture Decisions

### Database Design
- Complete schema in `backend/DB_SCHEMA.md`
- Users, Organizations, Activities, Registrations tables
- Internationalization support via translations table
- Redis for session management and caching

### API Design
- **Base URL**: `http://106.14.165.234:8085`
- **认证方式**: JWT Bearer Token (Header: `Authorization: Bearer {token}`)
- **请求格式**: `application/x-www-form-urlencoded` (POST) 或 Query Parameters (GET)
- **响应格式**: JSON
- **标准响应**: `{"msg": "操作成功", "code": 200, "data": {...}}`
- **⚠️ 禁止使用任何Mock API - 仅使用上述真实后端接口**

### Third-Party Services Configuration
All services are configured and operational in production:

1. **Gmail SMTP** - Email verification and notifications ✅ Active
2. **Cloudflare R2** - Image storage with S3-compatible API ✅ Active
3. **Firebase FCM** - Push notifications ✅ Active
4. **Google OAuth** - Social login ✅ Active

## Frontend UI/UX Specifications

### Design System - Liquid Glass (Apple WWDC 2025 Inspired)

#### Visual Language
- **Primary Design Pattern:** Liquid Glass with blur effects and translucency
- **Color System:** PomeloX/Pomelo brand colors with warm gradient palette
  - Primary: #FF6B35 (Vibrant Orange) - Used for CTAs and active states
  - Secondary: #FF4757 (Coral Red) - Used for secondary actions and gradients
  - Accent: #FF8A65 (Light Orange) - Used for highlights and hover states
  - Success: #2ED573 (Fresh Green) - Confirmations and positive states
  - Warning: #FFA726 (Warm Amber) - Alerts and urgency indicators
- **Shadow System:** Multi-level elevation (xs, sm, base, md, lg, xl)
  - Cards: 4dp elevation with colored shadows
  - Floating elements: 12dp elevation with glow effects
  - Modals: 16dp elevation with heavy shadows

#### Component Library

##### Activity Card (EventCard)
- **Layout:** 180px height with gradient overlay
- **Animations:** 
  - Spring animation on press (scale 0.98)
  - Fade-in on scroll visibility
  - Parallax effect on image during scroll
- **Interactive Elements:**
  - Floating heart icon (top-right) with pulse animation
  - Quick register button with primary color background
  - Status badge with dynamic color based on availability
- **Gradient Overlay:** Two-tone gradient from 30% to 80% opacity

##### Floating Action Buttons (FAB)
- **Position:** Bottom-right, 16dp from edges
- **Behavior:**
  - Auto-hide on scroll down, show on scroll up
  - Scale animation (1.0 → 1.1) on press
  - Pulsing shadow effect for primary actions
- **Types:**
  - Primary FAB: Create activity (admin only)
  - Secondary FAB: Filter/Sort options
  - Mini FAB: Quick actions (40dp diameter)

##### Bottom Sheets
- **Implementation:** react-native-bottom-sheet
- **Snap Points:** [25%, 50%, 90%]
- **Content Types:**
  - Quick registration form
  - Activity filters
  - User profile quick view
- **Animations:** Spring physics with 0.8 damping

### Animation Framework

#### Core Animations (React Native Reanimated 3)
```javascript
// Standard animation configs
const springConfig = {
  damping: 15,
  mass: 1,
  stiffness: 150,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.4, 0, 0.2, 1), // Material Design standard
};
```

#### Animation Patterns
1. **Entry Animations:**
   - Fade + Slide up (300ms, staggered 50ms)
   - Scale from 0.9 to 1.0 with opacity
   
2. **Interactive Animations:**
   - Button press: Scale to 0.95 with spring
   - Card hover: Elevate + subtle rotation
   - Pull to refresh: Elastic bounce

3. **Navigation Transitions:**
   - Shared element transitions for images
   - Cross-fade for tab switches
   - iOS-style slide for stack navigation

4. **Micro-interactions:**
   - Heart animation: Scale + rotate on like
   - Number counters: Animated text changes
   - Progress indicators: Smooth fill animations

### Floating Elements & Overlays

#### Toast Notifications
- **Position:** Top-center, below safe area
- **Animation:** Slide down + fade in (250ms)
- **Auto-dismiss:** 3 seconds for info, 5 seconds for errors
- **Swipe to dismiss:** Horizontal swipe gesture

#### Modal System
- **Backdrop:** Blur effect (20px) with 0.5 opacity
- **Entry:** Scale from 0.95 with fade
- **Types:**
  - Full-screen: Activity details
  - Dialog: Confirmations
  - Bottom modal: Forms and selections

#### Floating Registration Button
- **Behavior:**
  - Sticky position when scrolling past activity info
  - Pulse animation when spots < 10
  - Disabled state with grayscale filter
- **Position:** Bottom of screen with 16dp padding

### Performance Optimizations

#### Image Handling
- **Library:** react-native-fast-image
- **Caching:** Memory + disk cache (100MB limit)
- **Lazy Loading:** Viewport-based with 200px threshold
- **Formats:** WebP preferred, JPEG fallback
- **Thumbnails:** 150x150 for lists, full resolution on demand

#### List Optimization
```javascript
// FlatList configuration
const listConfig = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 10,
  windowSize: 10,
  getItemLayout: (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }),
};
```

#### Memory Management
- **Component unmounting:** Clean up animations and listeners
- **Image cache clearing:** On low memory warnings
- **State persistence:** AsyncStorage for offline support
- **Bundle optimization:** 
  - Code splitting with React.lazy()
  - Tree shaking unused imports
  - Asset optimization (convert to WebP)

### Gesture Interactions

#### Swipe Gestures (react-native-gesture-handler)
- **Horizontal Swipe:** 
  - Left: Show quick actions (favorite, share)
  - Right: Mark as interested
- **Vertical Swipe:**
  - Pull-to-refresh with custom animation
  - Dismiss modals and sheets

#### Long Press Actions
- **Cards:** Show preview in modal
- **Images:** Save to gallery option
- **Text:** Copy to clipboard

#### Pinch & Pan
- **Images:** Zoom and pan in full-screen view
- **Maps:** Standard map interactions

### Accessibility & Internationalization

## 🌍 国际化开发规范 (强制执行)

### **🚫 严格禁止事项**
- ❌ **硬编码中文文本**: 任何用户可见的中文字符串必须使用 `t()` 翻译函数
- ❌ **单语言开发**: 新增中文翻译时必须同时添加对应的英文翻译
- ❌ **无意义键名**: 禁止使用 `text1`, `label2` 等无语义的翻译键名
- ❌ **Mock数据使用**: 除非明确要求，严禁使用Mock API和Mock数据，必须使用真实后端接口

### **✅ 强制要求**
- ✅ **双语同步**: 每个翻译键必须在 `zh-CN` 和 `en-US` 文件中都存在
- ✅ **语义化键名**: 使用描述性的翻译键名，如 `auth.login.welcome`
- ✅ **插值支持**: 动态内容使用 `{{variable}}` 语法
- ✅ **真实数据优先**: 优先使用真实后端API，确保数据准确性和功能完整性

### **📋 翻译键命名规范**
```typescript
// ✅ 正确示例
t('auth.register.form.legal_name_label')
t('validation.errors.email_required') 
t('common.buttons.next_step')
t('activities.status.available_spots', { count: 5 })

// ❌ 错误示例  
"基本信息"  // 硬编码中文
t('text1')  // 无意义键名
t('button')  // 过于简单
```

### **🔧 开发工作流**
1. **新增UI文本时**:
   - 先在 `zh-CN/translation.json` 添加中文翻译
   - 立即在 `en-US/translation.json` 添加英文翻译
   - 代码中使用 `t('键名')` 而非硬编码文本

2. **翻译键组织结构**:
   ```json
   {
     "auth": {
       "login": { "welcome": "...", "subtitle": "..." },
       "register": { "form": {...}, "validation": {...} }
     },
     "activities": { "status": {...}, "actions": {...} },
     "validation": { "errors": {...} },
     "common": { "buttons": {...}, "labels": {...} }
   }
   ```

3. **动态内容处理**:
   ```typescript
   // ✅ 正确 - 使用插值
   t('welcome.message', { userName: user.name })
   t('progress.step', { current: 2, total: 5 })
   
   // ❌ 错误 - 字符串拼接
   `欢迎 ${user.name}`
   `第 ${step} 步`
   ```

### **🧪 代码审查检查点**
在每次提交前必须检查：
- [ ] 是否有新的硬编码中文字符串？
- [ ] 翻译键名是否语义化且易理解？
- [ ] 英文翻译是否准确自然？
- [ ] 动态内容是否正确使用插值语法？
- [ ] JSON格式是否正确无语法错误？

### **🚨 翻译键显示问题预防机制 (2025-08-23 新增)**

#### **问题原因分析**
翻译键显示而非翻译文本的根本原因：
1. **开发流程缺陷**: 编写t()调用时未同步添加翻译值
2. **JSON语法错误**: 语法错误导致整个翻译文件加载失败
3. **翻译文件结构混乱**: 重复section、路径不一致导致键被覆盖
4. **缺乏验证机制**: 没有开发时和CI/CD的翻译键验证

#### **📋 实际开发规范**
1. **新增翻译键时**:
   - 必须同时在 zh-CN 和 en-US 文件中添加
   - 翻译键路径必须遵循 `feature.component.element` 结构
   - 使用语义化的键名

2. **翻译键命名约束**:
   ```typescript
   // ✅ 正确格式
   t('auth.register.form.email_label')
   t('activities.registration.success_title')
   t('validation.errors.required_field')
   
   // ❌ 禁止格式
   t('text1') // 无语义
   t('label') // 过于简单
   ```

3. **JSON文件维护**:
   - 提交前确保JSON格式正确
   - 禁止重复的section或键名
   - 使用一致的缩进和格式

#### **🚨 翻译键问题快速诊断**
当界面显示翻译键名而非翻译文本时：

1. **检查JSON语法**: `python3 -m json.tool src/locales/zh-CN/translation.json`
2. **检查键是否存在**: 确认翻译键在两个语言文件中都存在
3. **检查i18n配置**: 确认 `utils/i18n.ts` 配置正确
4. **检查控制台**: 查看是否有翻译相关错误信息

#### Touch Targets
- **Minimum Size:** 44x44 points (iOS), 48x48dp (Android)
- **Spacing:** 8dp minimum between interactive elements
- **Hit Slop:** Extended touch areas for small buttons

#### Screen Reader Support
- **Labels:** All interactive elements have accessibilityLabel
- **Hints:** Complex interactions have accessibilityHint
- **Roles:** Proper accessibilityRole for semantic meaning
- **Live Regions:** Dynamic content updates announced

#### Language-Aware Layouts
- **Text Expansion:** 30% buffer for English → Chinese
- **Dynamic Heights:** Auto-adjusting card heights
- **Font Scaling:** Support for system font size preferences
- **RTL Support:** Prepared for future Arabic/Hebrew

#### Responsive Design
- **Breakpoints:**
  - Small: < 375px width
  - Medium: 375-414px
  - Large: > 414px
- **Orientation:** Support landscape mode for tablets
- **Safe Areas:** Respect notches and system UI

### Platform-Specific Adaptations

#### iOS Specific
- **Navigation:** iOS-style back swipe gesture
- **Haptics:** Haptic feedback for important actions
- **Scroll:** Bounce effect on scroll boundaries
- **Keyboard:** Keyboard avoiding view for forms

#### Android Specific
- **Navigation:** Material Design bottom navigation
- **Ripple:** Touch ripple effects on buttons
- **Back Handler:** Hardware back button support
- **Status Bar:** Translucent with color theming

## Development Workflow

### Production Maintenance
- ✅ **Completed Features**: User authentication, activity management, volunteer system
- ✅ **Live Services**: Registration system, image upload, push notifications
- ✅ **Deployed**: iOS TestFlight distribution active

### Ongoing Development
- Feature enhancements based on user feedback
- Performance optimizations
- Bug fixes and stability improvements
- New feature rollouts via TestFlight

## Important Files

### Configuration Files
- `backend/.env.example` - Backend service configurations
- `frontend/.env.example` - Mobile app configurations
- `config/secrets.md` - All sensitive keys and passwords
- `firebase-service-account.json` - Firebase admin credentials

### Requirements Documents
- `backend/backend-requirements.md` - Detailed backend tasks with timeline
- `frontend/frontend-requirements.md` - Frontend implementation plan
- `important-date.md` - Project status and immediate actions

## Security Keys

JWT and encryption keys are pre-generated and documented in `config/secrets.md`:
- JWT Secret Key: `VG2025_a8f5c8e9d2b3f7e1c4a6b9d8e3f7c2a5b8e1f4c7d0b3a6e9f2c5b8e1a4d7`
- Encryption Key: `ENC2025_f3e8c1b7d4a9f6e2c5b8f1e4c7d0b3a6f9e2c5b8e1f4c7d0b3a6e9f2c5b8e1a4`

## Testing Commands

```bash
# Test email sending (Gmail SMTP)
openssl s_client -connect smtp.gmail.com:587 -starttls smtp

# Test database connection
docker exec -it vitaglobal_postgres pg_isready -U vitaglobal -d vitaglobal_db

# Test Redis connection
docker exec -it vitaglobal_redis redis-cli ping
```

## Production Context

PomeloX is a live production application serving Chinese international students. The platform successfully supports:
- ✅ 500+ active users across multiple universities
- ✅ Bilingual interface (Chinese primary, English secondary)
- ✅ Activity creation and registration management
- ✅ Real-time push notifications
- ✅ Volunteer hour tracking system
- ✅ Multi-role user permission system

### Production Environment
- ✅ **Backend**: Live FastAPI server at `http://106.14.165.234:8085`
- ✅ **Database**: Production PostgreSQL + Redis setup
- ✅ **Mobile**: iOS TestFlight distribution with active user base
- ✅ **Services**: All third-party integrations operational

## 🚨 Critical Development Rules

## 🌍 Production API 接口文档 (必读)

### **API基础配置**
- **Base URL**: `http://106.14.165.234:8085`
- **认证方式**: JWT Bearer Token (Header: `Authorization: Bearer {token}`)
- **请求格式**: `application/x-www-form-urlencoded` (POST) 或 Query Parameters (GET)
- **响应格式**: JSON

### **标准响应结构**
```json
{
  "msg": "操作成功",
  "code": 200,
  "data": {...}  // 响应数据，可能为null
}
```

### **角色权限系统**
根据用户的 `roleKey` 判断权限级别：
- `manage`: 总管理员
- `part_manage`: 分管理员  
- `staff`: 内部员工
- `common`: 普通用户

### **已确认的真实API接口**

#### **1. 用户认证模块**

##### 用户注册 `/app/user/add` [POST]
**两种注册方式:**
- **手机验证码注册**: 需要 `verCode`, `bizId`，`invCode` 不填
- **邀请码注册**: 需要 `invCode`，手机号邮箱可选，`verCode` 不填

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

##### 用户登录 `/app/login` [POST]
**参数:**
```typescript
{
  username: string;  // 用户名
  password: string;  // 密码
}
```
**响应:**
```json
{
  "msg": "操作成功",
  "code": 200,
  "data": {
    "userId": 100,
    "token": "eyJhbGciOiJIUzUxMiJ9..."
  }
}
```

##### 获取短信验证码 `/sms/vercodeSms` [GET]
**参数:**
```typescript
{
  phoneNum: string;  // 手机号
}
```

##### 获取用户信息 `/app/user/info` [GET]
**Headers:** `Authorization: Bearer {token}`
**响应:** 包含用户详细信息、部门信息、角色信息

#### **2. 活动管理模块**

##### 获取活动列表 `/app/activity/list` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  pageNum?: number;   // 当前页码，默认1
  pageSize?: number;  // 每页条数，默认10  
  userId: number;     // 用户ID，必填
}
```
**响应包含活动状态字段:**
- `signStatus`: `0`未报名 `-1`已报名未签到 `1`已报名已签到
- `type`: `-1`即将开始 `1`已开始 `2`已结束

##### 活动报名 `/app/activity/enroll` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  activityId: number;  // 活动ID
  userId: number;      // 用户ID
}
```

##### 活动签到 `/app/activity/signIn` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  activityId: number;  // 活动ID
  userId: number;      // 用户ID
}
```

##### 获取用户相关活动 `/app/activity/userActivitylist` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;           // 用户ID
  signStatus?: -1 | 1;     // 筛选条件：-1已报名未签到，1已报名已签到
}
```

#### **3. 学校信息模块**

##### 获取学校列表 `/app/dept/list` [GET]
**Headers:** `Authorization: Bearer {token}`
**响应:** 包含学校详细信息，支持层级结构（父子部门）

#### **4. 志愿者管理模块**

##### 志愿者签到/签退 `/app/hour/signRecord` [POST]
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
**签退参数:**
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

##### 查看志愿者签到状态 `/app/hour/lastRecordList` [GET]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;  // 志愿者ID
}
```

##### 志愿者打卡记录 `/app/hour/recordList` [GET]
**Headers:** `Authorization: Bearer {token}`
**响应:** 所有志愿者的打卡记录列表

##### 志愿者工时统计 `/app/hour/hourList` [GET] 
**Headers:** `Authorization: Bearer {token}`
**响应:** 志愿者工时汇总信息

#### **5. 管理员功能模块**

##### 查询已生成邀请码 `/app/invitation/invInfo` [POST]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;  // 管理员ID
}
```

##### 生成邀请码 `/app/invitation/addInv` [POST]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;  // 管理员ID
}
```

##### 重新生成邀请码 `/app/invitation/resetInv` [POST]
**Headers:** `Authorization: Bearer {token}`
**参数:**
```typescript
{
  userId: number;  // 管理员ID
  id: number;      // 已生成邀请码的ID
}
```

#### **6. 组织信息模块**

##### 组织列表查询 `/app/organization/list` [GET]
**Headers:** `Authorization: Bearer {token}`
**响应:** 所有组织信息列表

### **⚠️ 严格API使用规范**

#### **🚫 绝对禁止的操作**
- ❌ **使用任何Mock API**: 严禁使用MockAPI、VitaGlobalAPI等虚假接口
- ❌ **硬编码Mock数据**: 严禁返回虚假的统计数据、活动数据等
- ❌ **捏造接口**: 如果某个功能没有对应的真实接口，必须立即告知，不得编造

#### **✅ 必须遵循的原则**
- ✅ **仅使用已确认接口**: 只能调用上述列出的真实后端接口
- ✅ **缺失接口必须报告**: 发现功能需要但接口不存在时，立即向用户报告
- ✅ **真实数据优先**: 显示真实的0状态，而非虚假数据
- ✅ **错误处理完善**: API调用失败时显示真实的错误状态

#### **📋 接口缺失检查清单**
当需要实现某功能但发现接口不存在时，请立即报告以下信息：
```
❌ 功能需求: [具体功能描述]
❌ 缺失接口: [预期的接口路径和参数]
❌ 影响范围: [哪些页面/组件受影响]
```

### Mock数据和API使用规范

**⚠️ 严格禁止使用Mock数据，除非明确要求！**

**问题原因**: Mock数据会误导用户，导致以下问题：
- 用户看到虚假的统计数字（如显示100积分但实际为0）
- 功能测试不准确，无法发现真实的API问题
- 用户操作后数据不更新，影响用户体验
- 不同用户可能看到相同的Mock数据，破坏个性化体验

**❌ 禁止的做法:**
```typescript
// 禁止使用Mock API
const mockData = await MockAPI.getUserData();

// 禁止硬编码Mock数据
const userStats = { points: 1680, hours: 24 }; // Mock数据

// 禁止返回Mock数据
return { bookmarked: 5, participated: 8 }; // Mock数字
```

**✅ 正确的做法:**
```typescript
// 使用真实API
const userData = await vitaGlobalAPI.getUserInfo();

// 显示真实数据或0
const userStats = { points: userData.points || 0, hours: userData.hours || 0 };

// API失败时显示空状态
if (!response.success) {
  return { bookmarked: 0, participated: 0 }; // 真实的空状态
}
```

**例外情况**: 只有在以下情况下才可以使用Mock数据：
- 明确要求使用Mock数据进行功能演示
- 后端接口暂未实现且需要UI开发时的临时方案
- 单元测试中的测试数据

**数据处理最佳实践**:
- **用户统计数据**: 必须从后端API获取或显示0，不得显示虚假数字
- **个人活动状态**: 基于真实的报名状态(registrationStatus)计算，不得硬编码
- **收藏和评价功能**: 使用用户ID隔离的本地存储，确保多用户数据独立
- **志愿者数量**: 从getUserList API获取真实工作人员统计，按权限级别显示
- **会员卡数据**: 显示真实的0状态，不显示虚假卡片
- **空状态处理**: API失败或无数据时显示美观的空状态，而非Mock数据

### React Native Reanimated Scroll Handler Issue

**⚠️ NEVER use `useAnimatedScrollHandler` with FlatList, SectionList, or ScrollView in this project!**

**Problem:** React Native Reanimated's `useAnimatedScrollHandler` returns an animated object, but React Native's VirtualizedList (which powers FlatList/SectionList) expects `onScroll` to be a function. This causes the error:
```
TypeError: _this.props.onScroll is not a function (it is Object)
```

**❌ WRONG - Never Do This:**
```typescript
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    'worklet';
    // Animation logic here
  },
});

<SectionList onScroll={scrollHandler} />
```

**✅ CORRECT - Always Do This:**
```typescript
const handleScroll = useCallback((event: any) => {
  const scrollY = event.nativeEvent.contentOffset.y;
  // Update shared values for animations
  animatedValue.value = scrollY;
  // Animation logic using withTiming, etc.
}, [animatedValue]);

<SectionList onScroll={handleScroll} />
```

**Key Points:**
1. Use `useCallback` instead of `useAnimatedScrollHandler`
2. Access scroll position via `event.nativeEvent.contentOffset.y`
3. Update Reanimated shared values manually in the callback
4. Keep `withTiming`, `useSharedValue`, and `useAnimatedStyle` for animations
5. Always add explicit `onScroll={() => {}}` to ScrollView components to prevent propagation issues

**Files that have been affected by this issue:**
- `src/screens/activities/ActivityListScreen.tsx` (Fixed multiple times)
- `src/screens/profile/ProfileHomeScreen.tsx` (Added preventive handler)
- `src/screens/profile/ProfileScreen.tsx` (Added preventive handler)
- `src/screens/wellbeing/VolunteerListScreen.tsx` (Added preventive handler)

**Why this keeps happening:**
- Linters or auto-formatters may "correct" the code back to useAnimatedScrollHandler
- Copy-pasting code from Reanimated documentation
- Not understanding the VirtualizedList vs Reanimated compatibility issue

**Prevention:**
- Always test navigation between tabs after scroll-related changes
- Check console for onScroll errors before committing
- Prefer standard React Native scroll handling over Reanimated for list components

**Enhanced Safety Measures (Added 2025-08-13):**
All scroll handlers should include safety checks and error handling:
```typescript
const handleScroll = useCallback((event: any) => {
  try {
    // Always validate event object first
    if (!event || !event.nativeEvent || typeof event.nativeEvent.contentOffset?.y !== 'number') {
      return;
    }
    
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Safe Reanimated value updates with existence checks
    if (scrollY && typeof scrollY.value !== 'undefined') {
      scrollY.value = currentScrollY;
    }
    
    // Safe animation calls
    if (headerTranslateY && typeof headerTranslateY.value !== 'undefined') {
      headerTranslateY.value = withTiming(targetValue, animationConfig);
    }
  } catch (error) {
    console.warn('Scroll handler error:', error);
    // Silent failure to prevent breaking scroll functionality
  }
}, [dependencies]);
```

**Recent Enhanced Files:**
- `ActivityListScreen.tsx`: Enhanced with safety checks and error handling
- `usePerformanceDegradation.ts`: Added validation and error boundaries

### 志愿者签到签退API规范 (Added 2025-08-25)

**⚠️ 关键发现**: 志愿者签退需要先获取签到记录ID

**问题原因**: 后端签退接口需要签到记录的`id`参数来标识要签退的具体记录

**正确的API调用方式:**

```typescript
// ✅ 签到 - 直接调用
await volunteerSignRecord(
  userId, 
  1, // 签到
  operateUserId,
  operateLegalName,
  startTime // 当前时间
);

// ✅ 签退 - 需要先获取记录ID
const lastRecord = await getLastVolunteerRecord();
const recordId = lastRecord.data?.id;

await volunteerSignRecord(
  userId, 
  2, // 签退
  operateUserId,
  operateLegalName,
  undefined, // 签到时间不需要
  endTime, // 当前时间
  recordId // 必需的记录ID
);
```

**API参数格式**: `application/x-www-form-urlencoded`

**签到参数**: `userId`, `type=1`, `startTime`, `operateUserId`, `operateLegalName`
**签退参数**: `id`, `userId`, `type=2`, `endTime`, `operateUserId`, `operateLegalName`

**测试确认 (2025-08-25)**:
- 签到: ✅ `curl -X POST .../signRecord -d "userId=120&type=1&startTime=2025-08-25 19:00:00"`
- 签退: ✅ `curl -X POST .../signRecord -d "id=22&userId=120&type=2&endTime=2025-08-25 19:05:00"`

**文件位置**: 
- API实现: `frontend/src/services/volunteerAPI.ts`
- 前端调用: `frontend/src/screens/wellbeing/SchoolDetailScreen.tsx`

## 🎯 CategoryBar 位置配置规范 (Added 2025-09-01)

### **⚠️ 关键配置 - 已优化的最佳位置**

经过扫码返回位置异常问题的调试和优化，以下配置为CategoryBar的最佳位置，**严禁随意修改**：

#### **固定CategoryBar样式配置**
```typescript
// ActivityListScreen.tsx - fixedCategoryBar样式
fixedCategoryBar: {
  position: 'absolute',
  top: 120, // 确保不被header遮挡的安全位置
  left: 0,
  right: 0,
  zIndex: 999,
  paddingHorizontal: theme.spacing.md,
  paddingVertical: 4, // 适中的垂直边距
  backgroundColor: 'rgba(255, 255, 255, 0.001)',
}
```

#### **列表内容间距配置**
```typescript
// SectionList contentContainerStyle
contentContainerStyle: {
  paddingTop: 45 + insets.top, // 与CategoryBar的最佳间距
  paddingBottom: 120 + insets.bottom,
}

// RefreshControl配置
progressViewOffset: insets.top + 45 // 与paddingTop保持一致
```

#### **CategoryBar组件尺寸优化**
```typescript
// CategoryBar.tsx - container样式
container: {
  height: 40, // 已优化的紧凑高度
  borderRadius: 20, // 高度的一半
  marginVertical: 0, // 无额外垂直边距
}

// SegmentedControl.tsx - container样式  
container: {
  height: 32, // 配合CategoryBar的紧凑高度
  borderRadius: 16, // 高度的一半
}
```

### **🚫 严禁修改的原因**

1. **扫码返回位置稳定性**: 当前配置确保扫码页面返回后CategoryBar位置不会异常偏移
2. **避免被遮挡**: `top: 120`是经过测试的安全位置，不会被header玻璃面板遮挡
3. **最佳视觉间距**: `paddingTop: 45`提供CategoryBar与活动卡片间的最佳视觉距离
4. **下拉刷新兼容**: 所有数值都与RefreshControl的progressViewOffset同步

### **🔧 维护注意事项**

- **修改CategoryBar位置前**: 必须先测试扫码功能的往返切换
- **调整间距时**: 必须同时更新paddingTop和progressViewOffset
- **组件高度变更**: 需要重新计算top值和paddingTop值
- **测试检查清单**:
  - [ ] CategoryBar不被header遮挡
  - [ ] 扫码返回后位置稳定
  - [ ] 下拉刷新指示器位置正确  
  - [ ] CategoryBar与卡片间距合理

## 📱 PomeloX App版本更新规范 (Added 2025-08-29)

### **⚠️ 重要提示**
当需要更新应用时，用户只需说："**请查看CLAUDE规范关于新版本发布的规范，帮我更新应用**"，Claude将按照以下标准化流程执行。

### **🔄 更新类型分类**

#### **1. 代码/功能更新（需要重新构建和上传）**
**触发条件:**
- 修改了React Native JavaScript/TypeScript代码
- 添加了新功能或页面
- 修复了应用逻辑bug
- 更改了API调用逻辑
- 修改了应用配置

**必需步骤:**
```bash
# 1. 更新版本号
# 在 app.json 中更新:
"version": "1.0.x"  // 递增版本号

# 2. 重新构建
cd frontend
eas build --platform ios --profile production

# 3. 重新提交TestFlight
eas submit --platform ios --profile production
```

#### **2. 热更新（无需重新构建，即时更新）**
**适用条件:**
- 纯JavaScript代码小改动
- 文本内容更新（不涉及原生代码）
- 样式调整
- 不改变应用权限或原生功能

**快速流程:**
```bash
cd frontend
eas update --branch production --message "描述更新内容"
```

#### **3. 资源文件更新（需要重新构建）**
**包含内容:**
- **应用图标更新**: `assets/icon.png`, `assets/adaptive-icon.png`
- **启动页更新**: `assets/splash-icon.png`
- **本地化资源**: `src/locales/*/app.json`
- **原生资源**: iOS/Android特定资源

**处理流程:**
1. 更新资源文件
2. 清理缓存: `npx expo prebuild -p ios --clean`
3. 重新构建和提交

#### **4. 配置文件更新（需要重新构建）**
**关键配置:**
- **Bundle ID更改**: 影响App Store配置
- **应用名称更改**: 多语言显示名称
- **权限更改**: `Info.plist`中的权限描述
- **深链接配置**: URL Schemes更新

### **🔢 版本管理最佳实践**

#### **版本号规则 (语义化版本控制)**
```javascript
// app.json 版本配置
{
  "expo": {
    "version": "1.2.3",      // 主版本.次版本.补丁版本
    "ios": {
      "buildNumber": "15"    // 构建号，每次构建必须递增
    }
  }
}
```

**版本号含义:**
- **1.x.x**: 重大功能更改，可能不向后兼容
- **x.1.x**: 新功能添加，向后兼容
- **x.x.1**: bug修复和小改动

#### **自动版本管理**
```bash
# 自动递增构建号
eas build --platform ios --profile production --auto-increment

# 手动设置版本
eas build --platform ios --profile production --build-number 16
```

### **🚀 TestFlight更新完整流程**

#### **标准更新流程**
```bash
# 工作目录
cd /Users/jietaoxie/vitaglobal/frontend

# 1. 版本号更新（根据更新类型）
# 编辑 app.json 更新 version 字段

# 2. Apple账户配置（首次或凭据过期时）
# Apple ID: dev@americanpromotioncompany.com
# 密码: 1585785322@Qq

# 3. 交互式构建（推荐）
eas build --platform ios --profile production
# 选择 Yes 登录Apple账户
# 输入上述Apple账户信息

# 4. 自动提交到App Store Connect
eas submit --platform ios --profile production

# 5. 在App Store Connect中配置TestFlight
# - 添加测试说明
# - 邀请内部测试员
# - 设置测试组
```

#### **快速重建流程（仅代码更新）**
```bash
# 适用于频繁的代码调试
cd frontend

# 清理缓存（可选，如遇到问题时使用）
npx expo prebuild -p ios --clean

# 直接构建
eas build --platform ios --profile production

# 提交
eas submit --platform ios --profile production
```

### **🏪 App Store正式发布流程**

#### **从TestFlight到App Store**
1. **TestFlight充分测试**: 至少3-5天内部测试
2. **在App Store Connect中提交审核**:
   - 选择TestFlight构建版本
   - 填写版本发布说明
   - 设置发布方式（自动/手动）
3. **审核时间**: 通常1-7天
4. **发布**: 审核通过后自动/手动发布

#### **审核要求检查清单**
- [ ] 应用功能完整，无崩溃
- [ ] 所有功能都可以正常使用
- [ ] 隐私政策链接有效
- [ ] 应用内容符合App Store准则
- [ ] 截图和描述准确反映应用功能

### **⚡ 开发阶段更新策略**

#### **频繁测试阶段（当前阶段）**
```bash
# 开发期间推荐使用Preview构建
eas build --platform ios --profile preview
```

**优势:**
- 构建速度更快
- 适合快速迭代测试
- 可分发给内部测试团队

#### **准备发布阶段**
```bash
# 使用Production构建准备正式发布
eas build --platform ios --profile production
```

### **🆘 紧急修复处理流程**

#### **严重Bug快速修复**
1. **评估影响**: 确定是否可以使用热更新
2. **热更新优先**:
   ```bash
   # 如果是JavaScript层面的问题
   eas update --branch production --message "紧急修复: 描述问题"
   ```
3. **如需重新构建**:
   ```bash
   # 优先级构建
   eas build --platform ios --profile production --priority high
   ```

#### **回滚策略**
```bash
# 热更新回滚到前一版本
eas update --branch production --message "回滚到稳定版本"

# 如需回滚App Store版本，需要发布新版本
```

### **📊 更新时间预期**

#### **TestFlight更新**
- **代码更新**: 15-30分钟构建 + 立即可测试
- **资源更新**: 20-35分钟构建 + 立即可测试  
- **热更新**: 1-2分钟 + 立即生效

#### **App Store更新**
- **构建时间**: 15-30分钟
- **审核时间**: 1-7天（通常2-3天）
- **用户可用**: 审核通过后立即

### **🔧 故障排除**

#### **常见构建失败**
1. **Bundle ID冲突**: 确认 `com.pomelotech.pomelo` 配置正确
2. **Apple凭据过期**: 重新登录Apple账户
3. **版本号重复**: 确保buildNumber递增
4. **代码语法错误**: 本地测试通过后再构建

#### **TestFlight问题**
1. **构建不显示**: 等待5-10分钟处理时间
2. **测试员收不到邀请**: 检查邮箱地址和测试组配置
3. **应用闪退**: 检查原生依赖和权限配置

### **📝 快速参考命令**

```bash
# === 常用更新命令合集 ===

# 1. 标准版本更新
cd frontend && eas build --platform ios --profile production

# 2. 热更新
cd frontend && eas update --branch production --message "更新描述"

# 3. 清理重建
cd frontend && npx expo prebuild -p ios --clean && eas build --platform ios --profile production

# 4. 提交TestFlight
cd frontend && eas submit --platform ios --profile production

# 5. 检查构建状态
eas build:list --platform ios

# 6. 查看更新历史
eas update:list --branch production
```

### **⭐ Claude执行检查清单**

当用户请求"查看CLAUDE规范关于新版本发布的规范，帮我更新应用"时，Claude应该：

1. **[ ] 确认更新类型**: 询问具体改动内容
2. **[ ] 检查当前版本**: 读取 `app.json` 中的版本号
3. **[ ] 建议新版本号**: 根据更新类型推荐合适版本号
4. **[ ] 更新版本配置**: 修改 `app.json` 版本信息
5. **[ ] 选择构建配置**: Production/Preview/热更新
6. **[ ] 执行构建命令**: 使用标准命令序列
7. **[ ] 监控构建进度**: 检查构建状态和错误
8. **[ ] 提交TestFlight**: 自动提交到App Store Connect
9. **[ ] 提供测试指导**: 说明TestFlight测试步骤

**标准响应格式:**
```
根据CLAUDE规范，我将帮您更新PomeloX应用：

1. 📊 当前版本: [读取版本]
2. 🔄 更新类型: [分析更新类型]  
3. 📝 建议版本: [推荐新版本号]
4. 🚀 执行流程: [显示执行步骤]

开始执行更新...
```