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
- ❌ **NEVER use Mock APIs** - Only real backend endpoints
- ❌ **NEVER hardcode fake data** - Show real 0 states instead of fake numbers
- ❌ **NEVER create missing APIs** - Report missing endpoints immediately
- ✅ **Real data only** - All user stats, activity data must come from actual APIs


### **🌐 Environment Configuration (CRITICAL)**

#### **测试环境** (frontend-web-testenv)
- **接口URL**: `http://106.14.165.234:8085`
- **H5访问地址**: `http://106.14.165.234:8086`
- **环境标识**: `EXPO_PUBLIC_ENVIRONMENT=development`
- **调试模式**: `EXPO_PUBLIC_DEBUG_MODE=true`

#### **生产环境** (frontend-web)
- **接口URL**: `https://www.vitaglobal.icu`
- **H5访问地址**: `https://web.vitaglobal.icu`
- **环境标识**: `EXPO_PUBLIC_ENVIRONMENT=production`
- **调试模式**: `EXPO_PUBLIC_DEBUG_MODE=false`

### **🌍 Internationalization Rules (MANDATORY)**
- ❌ **NEVER hardcode Chinese text** - All user-visible text must use `t()` function
- ❌ **NEVER single-language development** - Add both `zh-CN` and `en-US` translations
- ✅ **Semantic key names** - Use `auth.login.welcome` not `text1`
- ✅ **Dual sync** - Every translation key exists in both language files

### **⚠️ 角色数据结构兼容性 (IMPORTANT - 2025年9月)**
后端API在不同情况下返回角色数据的格式不一致，必须同时处理两种格式：

#### **问题描述**
- **格式1**: `role` 对象（单个角色，字段名 `roleKey`）
  ```json
  {
    "role": { "roleId": 2, "roleKey": "manage", "roleName": "总管理员" },
    "roles": []
  }
  ```
- **格式2**: `roles` 数组（多个角色，字段名 `key`）
  ```json
  {
    "roles": [{ "id": 2, "key": "manage", "name": "总管理员" }],
    "role": null
  }
  ```

#### **解决方案**
1. **userAdapter.ts** - 统一转换为数组格式：
   ```typescript
   if (backendUser.role && safeRoles.length === 0) {
     safeRoles = [{ ...backendUser.role, key: backendUser.role.roleKey }];
   }
   ```

2. **权限检查** - 同时检查两种格式：
   ```typescript
   const hasPermission =
     user?.roles?.some(r => r.key === 'manage') ||
     user?.role?.roleKey === 'manage';
   ```

#### **影响范围**
- EditProfileScreen (alternateEmail权限判断)
- UserContext (权限等级计算)
- 任何依赖角色权限的功能模块

## 🏗️ **Tech Stack**

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL 15 + Redis 7
- **Auth:** JWT Bearer Token (`Authorization: Bearer {token}`)

#### **环境配置 (更新: Sep 2025)**
- **测试环境API**: `http://106.14.165.234:8085`
- **生产环境API**: `https://www.vitaglobal.icu`

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

# Frontend development (App) - 生产环境
cd frontend && npm run ios:prod

# Frontend development (App) - 测试环境
cd frontend && npm run ios:dev

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

#### **版本号更新文件清单 (CRITICAL - 必须同步更新)**
更新版本号时，必须同时更新以下3个文件以保持版本一致性：

1. **frontend/app.json**
   - `version`: "1.0.X" (应用版本号)
   - `ios.buildNumber`: "X" (构建号)

2. **frontend/package.json**
   - `version`: "1.0.X" (必须与app.json保持一致)

3. **frontend/ios/PomeloXApp/Info.plist**
   - `CFBundleShortVersionString`: "1.0.X" (显示版本)
   - `CFBundleVersion`: "X" (构建版本)

**重要提醒**: 所有4个版本字段必须同步更新，否则会导致TestFlight/App Store上传失败或版本不一致问题。

#### **发布命令**
```bash
cd frontend
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

## 📂 **Project Structure & Environment Mapping**
```
pomeloX/
├── backend/                 # FastAPI backend
├── frontend/               # React Native app (ISOLATED)
├── frontend-web/           # Web生产环境
│   ├── API: https://www.vitaglobal.icu
│   └── H5: https://web.vitaglobal.icu
├── frontend-web-testenv/   # Web测试环境
│   ├── API: http://106.14.165.234:8085
│   └── H5: http://106.14.165.234:8086
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
7. **Use curl API部署** - Always use curl API upload for deployment, Git sync as backup

## 🚀 **Web部署规范 (MANDATORY)**

### **官方部署方法: curl API上传**
```bash
# 标准部署流程 (推荐)
# 1. 开发测试
cd frontend-web-testenv && npm run web:dev

# 2. 构建项目
npm run web:build

# 3. 一键上传 (5-10秒完成)
node scripts/upload-latest-builds.js

# 对于生产环境
cd frontend-web && npm run web:build && node scripts/upload-latest-builds.js
```

### **部署方案优先级**
1. **curl API上传** ⭐⭐⭐⭐⭐ - 主要方案，处理大文件(3MB+)最有效
2. **直接API上传** ⭐⭐⭐⭐ - 小文件(<1MB)快速上传
3. **Git同步** ⭐⭐⭐ - 备用方案，服务器端构建
4. **手动上传** ❌ - 已废弃，容易出错且效率低

### **宝塔API上传规范**

#### **文件大小分级处理**
```bash
# 小文件 (<1MB): 直接API上传
await api.uploadFile(filePath, targetPath);

# 大文件 (>1MB): 使用curl上传
curl -k -X POST "https://IP:8888/files?action=upload" \
  -F "request_time=${timestamp}" \
  -F "request_token=${token}" \
  -F "f_path=${targetDir}" \
  -F "f_name=${filename}" \
  -F "f_size=${filesize}" \
  -F "f_start=0" \
  -F "blob=@${filepath}"
```

#### **API参数格式 (关键)**
- **request_time**: Unix时间戳
- **request_token**: md5(时间戳 + md5(API密钥))
- **f_path**: 目标目录路径
- **f_name**: 文件名
- **f_size**: 文件大小(字节)
- **f_start**: 起始位置(通常为0)
- **blob**: 文件内容

#### **上传限制和性能**
- **API直接上传**: 适用于<1MB文件，60秒超时
- **curl上传**: 适用于3MB+文件，5-10秒完成
- **大文件优势**: curl比API直接上传更稳定高效

### **技术实现细节**
- **服务器脚本**: `/www/wwwroot/project/build-sync.sh`
- **Git仓库**: `/www/wwwroot/project/git-repo/`
- **宝塔API**: `/files?action=ExecShell` - 执行服务器命令
- **部署目录**:
  - 测试环境: `test-h5/`
  - 生产环境: `h5/`

### **标准部署工作流程 (推荐)**

#### **方案A: 快速API上传 (5-10秒)**
```bash
# 1. 开发和构建
cd frontend-web-testenv && npm run web:build
cd frontend-web && npm run web:build

# 2. 一键上传 (使用优化的curl方案)
cd frontend-web-testenv && node scripts/upload-latest-builds.js
```

#### **方案B: Git同步 (备用方案)**
```bash
# 1. 提交代码
git add . && git commit -m "更新" && git push origin main

# 2. 触发服务器同步
cd frontend-web-testenv && node scripts/trigger-sync.js
```

### **环境专用命令**
```bash
# 测试环境部署
cd frontend-web-testenv
npm run web:build                    # 构建
node scripts/upload-latest-builds.js # 上传

# 生产环境部署
cd frontend-web
npm run web:build                    # 构建
node scripts/upload-latest-builds.js # 上传
```

### **宝塔API配置信息**
```javascript
// 宝塔面板配置
panelUrl: 'https://106.14.165.234:8888'
apiKey: 'rbxLQQr0qDBvwcbOxZt9VVPJvy3mIDVN'

// 部署目录
测试环境: '/www/wwwroot/project/test-h5'
生产环境: '/www/wwwroot/project/h5'

// IP白名单
已配置IP: 52.124.34.249
```

### **Bundle大小优化经验**
- **字体文件**: 不在JS bundle内，是独立assets加载
- **JS Bundle**: 3MB主要是React Native Web + 组件代码
- **优化方向**: 代码分割和依赖优化，而非字体文件删除
- **实际体验**: 3MB bundle通过gzip压缩和缓存，用户体验可接受

### **故障排除**
- **大文件上传失败**: 使用curl方案，支持3MB+文件
- **API超时**: 增加timeout配置或使用分块上传
- **路径错误**: 检查宝塔目录结构和权限
- **logo不显示**: 确保压缩logo上传到正确路径 (/assets/src/assets/logos/)
- **文件名不匹配**: 构建后检查index.html引用的JS文件名

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

### **Environment Management (2025年9月更新)**
- **App环境切换**: `npm run ios:dev` (测试) / `npm run ios:prod` (生产)
- **一键切换**: 自动更新.env文件并启动对应环境
- **零硬编码**: 所有API地址通过环境管理器动态获取

---

**Development Principle:** *Keep it simple, keep it real, keep it working.*

For detailed implementation guidance, always refer to the specialized documentation in the `docs/` folder.