# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

PomeloX is a **production-ready** mobile platform for Chinese international students overseas, focusing on activity management and registration. The platform is currently **live and operational** as of September 2025.

**Current Status:** Production application with active user base serving 500+ students across multiple universities.

## 🔥 **Core Development Rules (MUST FOLLOW)**

### **🚫 Code Isolation Rules (ZERO TOLERANCE)**
- ❌ **NEVER mix files between `frontend/` and `frontend-web/`** - Complete isolation required
- ❌ **NEVER share components** - Each platform has independent implementations  
- ❌ **NEVER cross-import** - No `../frontend/` imports in web, no `../frontend-web/` in app
- ✅ **Platform-specific files only** - Use `.native.tsx` and `.web.tsx` suffixes when needed

### **🚫 Environment Isolation Rules (ZERO TOLERANCE)**
- ❌ **NEVER mix environments in same directory** - No API URL switching in same codebase
- ❌ **NEVER use .env switching** - No `cp .env.development .env` approach
- ❌ **NEVER cross-deploy** - Test code cannot deploy to production
- ✅ **Complete directory separation** - Use `frontend-web-testenv/` for test, `frontend-web/` for production
- ✅ **Fixed API endpoints** - Each directory has hardcoded API configuration
- ✅ **Independent deployment** - Each environment has its own deploy scripts

### **🚫 API Usage Rules (ZERO TOLERANCE)**
- ❌ **NEVER use Mock APIs** - Only real backend at `https://www.vitaglobal.icu`
- ❌ **NEVER hardcode fake data** - Show real 0 states instead of fake numbers
- ❌ **NEVER create missing APIs** - Report missing endpoints immediately
- ✅ **Real data only** - All user stats, activity data must come from actual APIs

### **🌍 Internationalization Rules (MANDATORY)**
- ❌ **NEVER hardcode Chinese text** - All user-visible text must use `t()` function
- ❌ **NEVER single-language development** - Add both `zh-CN` and `en-US` translations
- ✅ **Semantic key names** - Use `auth.login.welcome` not `text1`
- ✅ **Dual sync** - Every translation key exists in both language files

## 🏗️ **Tech Stack**

### Backend
- **Framework:** FastAPI (Python)  
- **Database:** PostgreSQL 15 + Redis 7
- **API Base:** `https://www.vitaglobal.icu` ✅ **Production Only**
- **Auth:** JWT Bearer Token (`Authorization: Bearer {token}`)

### Frontend  
- **Framework:** React Native + Expo
- **Language:** TypeScript
- **i18n:** i18next (zh-CN, en-US)
- **State:** React Context + AsyncStorage
- **Animation:** React Native Reanimated 3

## 📋 **Key Commands**

### Environment Setup
```bash
# Database services
docker-compose up -d postgres redis

# Frontend development (App)
cd frontend && npm run ios

# Web测试环境 (Port 8091)
cd frontend-web-testenv && npm run web:dev

# Web生产环境 (Port 8090)  
cd frontend-web && npm run web:dev
```

### Environment Deployment (Git同步方案 - 官方推荐)
```bash
# 方案A: Git同步部署 (推荐 - 无文件大小限制)
# 1. 本地构建并提交
cd frontend-web-testenv && npm run web:build
cd /Users/jietaoxie/pomeloX
git add . && git commit -m "更新" && git push origin main

# 2. 触发服务器同步
cd frontend-web-testenv && node scripts/trigger-sync.js

# 方案B: 直接API上传 (备用 - 仅小文件)
cd frontend-web-testenv && npm run deploy
cd frontend-web && npm run deploy
```

### Git同步部署系统
```bash
# 服务器端自动构建同步 (解决大文件问题)
cd frontend-web-testenv && node scripts/server-build-sync.js

# 检查同步结果
cd frontend-web-testenv && node scripts/check-sync-result.js
```

### Version Updates
**Quick Reference:** When user says "请查看CLAUDE规范关于新版本发布的规范，帮我更新应用"
```bash
cd frontend
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

## 📂 **Project Structure**
```
pomeloX/
├── backend/                 # FastAPI backend
├── frontend/               # React Native app (ISOLATED)
├── frontend-web/           # Web生产环境 (PRODUCTION API ONLY)
├── frontend-web-testenv/   # Web测试环境 (TEST API ONLY)  
├── docs/                   # Detailed documentation
│   ├── API_GUIDE.md        # Complete API reference
│   ├── UI_DESIGN_SYSTEM.md # UI/UX specifications
│   ├── PERFORMANCE_GUIDE.md # Performance optimization
│   └── VERSION_RELEASE.md  # Release management
└── CLAUDE.md              # This core guide
```

## ⚡ **Performance Requirements (MANDATORY)**

### React Optimization (MUST USE)
- **React.memo** - All list components to prevent re-renders
- **useMemo** - Cache expensive calculations  
- **useCallback** - Stabilize function references
- **FastImage** - All network images (no regular Image component)
- **FlatList optimization** - `removeClippedSubviews={true}`, proper `getItemLayout`

### Performance Targets
- **List scrolling**: ≥55fps
- **Image loading**: <2 seconds
- **Page transitions**: <300ms
- **Memory**: Zero leak warnings

## 🌟 **Quick References**

### Critical APIs (Production)
- **Login**: `POST /app/login` - `{username, password}`
- **User Info**: `GET /app/user/info` - Headers: `Authorization: Bearer {token}`
- **Activities**: `GET /app/activity/list` - Params: `{userId, pageNum?, pageSize?}`
- **Volunteer Sign**: `POST /app/hour/signRecord` - `{userId, type: 1|2, startTime?, endTime?}`

### Permission Levels
- `manage`: 总管理员 (Full access)
- `part_manage`: 分管理员 (Partial management)
- `staff`: 内部员工 (Volunteer features only)
- `common`: 普通用户 (Basic features)

### Development Workflow
1. **Plan with TodoWrite** - Always track complex tasks
2. **Use real APIs only** - Never mock data unless explicitly requested
3. **Follow isolation rules** - Keep frontend/ and frontend-web/ separate
4. **Add i18n from start** - No hardcoded Chinese text
5. **Optimize performance** - Use memo/callback/FastImage
6. **Test both platforms** - Verify app and web work independently
7. **Use Git同步部署** - Always use Git sync for deployment, never manual file upload

## 🚀 **Web部署规范 (MANDATORY)**

### **官方部署方法: Git同步**
```bash
# 标准部署流程 (替代手动上传)
# 1. 本地开发测试
cd frontend-web-testenv && npm run web:dev

# 2. 构建项目
npm run web:build

# 3. 提交到GitHub
cd /Users/jietaoxie/pomeloX
git add . && git commit -m "更新功能" && git push origin main

# 4. 触发服务器同步
cd frontend-web-testenv && node scripts/trigger-sync.js

# 5. 检查部署结果
node scripts/check-sync-result.js
```

### **部署方案优先级**
1. **Git同步** ⭐⭐⭐⭐⭐ - 主要方案，处理所有文件包括大文件
2. **API上传** ⭐⭐⭐ - 备用方案，仅用于小文件快速更新
3. **手动上传** ❌ - 已废弃，容易出错且效率低

### **Git同步优势**
- ✅ **无文件大小限制** - 可处理3MB+的JS bundle
- ✅ **版本控制** - 每次部署都有Git记录
- ✅ **环境隔离** - 测试/生产环境完全分离
- ✅ **自动化程度高** - 一次设置，长期使用
- ✅ **可靠性强** - Git协议比HTTP上传更稳定

### **技术实现细节**
- **服务器脚本**: `/www/wwwroot/project/build-sync.sh`
- **Git仓库**: `/www/wwwroot/project/git-repo/`
- **宝塔API**: `/files?action=ExecShell` - 执行服务器命令
- **部署目录**:
  - 测试环境: `test-h5/`
  - 生产环境: `h5/`

### **部署工作流程**
1. **本地开发** → 使用 `npm run web:dev`
2. **本地构建** → 使用 `npm run web:build`
3. **推送代码** → `git push origin main`
4. **服务器同步** → `node scripts/trigger-sync.js`
5. **验证部署** → `node scripts/check-sync-result.js`

## 📚 **Detailed Documentation**

For comprehensive information, see the specialized guides:

- **[API Guide](docs/API_GUIDE.md)** - Complete API reference with all endpoints
- **[UI Design System](docs/UI_DESIGN_SYSTEM.md)** - Liquid Glass design specifications  
- **[Performance Guide](docs/PERFORMANCE_GUIDE.md)** - React optimization and performance rules
- **[Version Release](docs/VERSION_RELEASE.md)** - TestFlight and App Store release process

## 🔧 **Platform Compatibility (CRITICAL)**

### **❌ App端不兼容的组件**
- **Web-specific libraries**: `jsQR`, browser MediaDevices API
- **DOM elements**: `div`, `span`, HTML5 input types
- **CSS properties**: `backdrop-filter`, `linear-gradient`, browser-specific styles
- **Browser APIs**: `window.alert()`, `window.confirm()`, `navigator.geolocation`

### **❌ Web端不兼容的组件**
- **React Native Alert**: `Alert.alert()` - Use `SafeAlert` instead
- **Native UI components**:
  - `FlatList` → Use `WebFlatList` 
  - `BlurView` → Use `WebBlurView`
  - `LinearGradient` → Use `WebLinearGradient`
  - Native `TouchableOpacity` animations
- **Expo libraries**:
  - `expo-camera` → Use `WebCameraView`
  - `expo-blur` → CSS backdrop-filter
  - `expo-linear-gradient` → CSS gradients
- **Hardware APIs**: Native camera, haptics, device sensors

### **✅ Compatible Components**
- Basic components: `View`, `Text`, `TextInput`, `Image`
- Network: `fetch`, API calls, AsyncStorage
- Context/State: React Context, useState, useEffect
- Internationalization: i18next works on both platforms

### **🛠️ Web Adapter Location**
Web-specific components located in: `frontend-web/src/components/web/`

## 🚨 **Critical Reminders**

### **React Native Reanimated Warning**
**⚠️ NEVER use `useAnimatedScrollHandler` with FlatList/SectionList** - Causes "onScroll is not a function" error. Use `useCallback` instead.

### **Production Context**
This is a **live application** serving real users. Always:
- Prioritize stability over new features
- Test thoroughly before commits
- Use real data and APIs
- Follow established patterns
- Report issues immediately

---

**Development Principle:** *Keep it simple, keep it real, keep it working.*

For detailed implementation guidance, always refer to the specialized documentation in the `docs/` folder.