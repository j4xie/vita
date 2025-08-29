# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PomeloX is a Phase 0 MVP platform for Chinese international students overseas, focusing on activity management and registration. The project has a critical 5-week development timeline targeting September 2025 launch.

**Current Status:** Third-party services configured (85% complete), ready for code implementation.

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
- **State Management:** TBD based on frontend-requirements.md
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
- RESTful endpoints documented in `backend/API_DOC.md`
- JWT authentication with 7-day expiry
- Internationalization via Accept-Language header
- Standard error responses with multi-language support

### Third-Party Services Configuration
All services are pre-configured and ready for development:

1. **Gmail SMTP** - Email verification and notifications
2. **Cloudflare R2** - Image storage with S3-compatible API
3. **Firebase FCM** - Push notifications (mobile configs pending)
4. **Google OAuth** - Social login (client configured)

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

#### **🔧 强制验证工具**
```bash
# 开发时验证翻译键完整性
npm run validate-translations

# 验证工具位置
frontend/package-scripts/validate-translations.js
```

#### **📋 严格开发规范**
1. **新增翻译键时**:
   - 必须同时在 zh-CN 和 en-US 文件中添加
   - 添加后立即运行 `npm run validate-translations` 验证
   - 翻译键路径必须遵循 `feature.component.element` 结构

2. **翻译键命名约束**:
   ```typescript
   // ✅ 正确格式
   t('auth.register.form.email_label')
   t('activities.registration.success_title')
   t('validation.errors.required_field')
   
   // ❌ 禁止格式
   t('text1') // 无语义
   t('label') // 过于简单
   t('auth.register.form.invalid_key') // 键不存在
   ```

3. **JSON文件维护**:
   - 提交前必须通过 JSON.parse() 验证
   - 禁止重复的section或键名
   - 使用一致的缩进和格式

#### **⚡ 自动化检测**
- **开发环境**: i18n fallback显示 `[MISSING: key_name]` 而非键名
- **CI/CD**: 构建时自动运行翻译验证，失败则阻止部署
- **代码提交**: Git pre-commit hook验证翻译完整性

#### **🎯 责任分配**
- **开发者**: 新增t()调用时必须同步添加翻译
- **Code Review**: 必须检查翻译相关更改
- **Claude Code**: 发现翻译键问题时立即修复并更新规范

#### **📋 验证工具使用指南**
```bash
# 验证所有翻译键
cd frontend && node package-scripts/validate-translations.js

# 添加到package.json scripts中
"scripts": {
  "validate-translations": "node package-scripts/validate-translations.js"
}

# Git pre-commit hook (推荐)
#!/bin/sh
cd frontend && npm run validate-translations
if [ $? -ne 0 ]; then
  echo "❌ 翻译键验证失败，请修复后再提交"
  exit 1
fi
```

#### **🚨 常见翻译键显示问题快速诊断**
当界面显示翻译键名而非翻译文本时：

1. **检查JSON语法**: `python3 -m json.tool src/locales/zh-CN/translation.json`
2. **验证键路径**: 运行翻译验证工具
3. **检查i18n配置**: 确认 `utils/i18n.ts` 中没有强制语言设置
4. **检查控制台**: 查看是否有翻译相关错误信息

#### **⚠️ 历史问题记录**
- 2025-08-23: 发现大量翻译键显示问题，根本原因是JSON语法错误+重复section+缺失验证
- 修复策略: 统一翻译文件结构 + 添加验证工具 + 更新开发规范

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

### Week 1 Milestones (Critical)
- [ ] Backend: User registration API with email verification
- [ ] Frontend: Login/registration UI screens
- [ ] Database: Complete schema implementation with i18n
- [ ] Integration: All third-party services connected

### Week 2-3 Focus
- Activity CRUD operations
- Image upload functionality
- Registration system with concurrency control

### Week 4-5 Completion
- CRM features for administrators
- Performance optimization
- App store preparation

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

## Immediate Next Steps

1. **Create backend project structure:**
   - Initialize FastAPI project in `backend/` directory
   - Set up SQLAlchemy models based on DB_SCHEMA.md
   - Implement authentication endpoints

2. **Create frontend project:**
   - Initialize React Native with Expo in `frontend/` directory
   - Set up TypeScript and ESLint
   - Implement i18n with react-native-localize

3. **Complete Firebase mobile configuration:**
   - Add Android app to Firebase console
   - Add iOS app to Firebase console
   - Download and integrate config files

## Context for Development

This is a time-critical MVP targeting Chinese student organizations during their September recruitment period. The platform must support:
- 500-1000 concurrent users
- Bilingual interface (Chinese primary, English secondary)
- Activity creation and registration management
- Real-time notifications

All third-party services are configured with development credentials. Production deployment will require:
- Domain purchase for production URLs
- SSL certificate configuration
- Production database setup
- App store submissions

## 🚨 Critical Development Rules

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