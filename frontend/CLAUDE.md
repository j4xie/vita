# CLAUDE.md - PomeloX Mobile App

This file provides guidance to Claude Code (claude.ai/code) when working with the PomeloX React Native mobile application.

## 🎯 Project Overview

PomeloX Mobile App is a **production-ready** React Native application for Chinese international students overseas, focusing on activity management and registration. The app is currently **live on App Store and TestFlight** as of September 2025.

**Current Status:** Production application with active user base serving 500+ students across multiple universities.

## 🔥 **Core Development Rules (MUST FOLLOW)**

### **🚫 Platform Isolation Rules (ZERO TOLERANCE)**
- ❌ **NEVER import from frontend-web** - Complete isolation from web version
- ❌ **NEVER use web-specific APIs** - No browser APIs or DOM elements
- ✅ **React Native components only** - Use native components and Expo libraries
- ✅ **Platform-specific files** - Use `.ios.tsx` and `.android.tsx` suffixes when needed

### **🚫 API Usage Rules (ZERO TOLERANCE)**
- ❌ **NEVER use Mock APIs** - Only real backend endpoints
- ❌ **NEVER hardcode fake data** - Show real 0 states instead of fake numbers
- ❌ **NEVER hardcode API URLs** - Always use environment manager (`getApiUrl()`)
- ✅ **Real data only** - All user stats, activity data must come from actual APIs
- ✅ **Unified API management** - All API calls must use `src/utils/environment.ts`

### **🚨 Known Backend Issues (2025年9月)**
- **志愿者状态查询SQL错误**
  - **问题**: `/app/hour/lastRecordList` 接口返回500错误
  - **错误信息**: "Column 'user_id' in where clause is ambiguous"
  - **原因**: 后端SQL JOIN查询中多表包含user_id字段，WHERE子句未指定表前缀
  - **影响**: 志愿者签到/签退状态无法正确显示
  - **前端临时方案**:
    - 优先使用备用接口 `/app/hour/recordList`
    - 增强错误处理，显示友好提示而非技术错误
    - 使用本地缓存保持状态
  - **后端修复方案**: SQL查询中将 `user_id` 改为 `vmh.user_id`
  - **状态**: 等待后端修复

### **🌍 Internationalization Rules (MANDATORY)**
- ❌ **NEVER hardcode Chinese text** - All user-visible text must use `t()` function
- ❌ **NEVER single-language development** - Add both `zh-CN` and `en-US` translations
- ✅ **Semantic key names** - Use `auth.login.welcome` not `text1`
- ✅ **Dual sync** - Every translation key exists in both language files

## 🏗️ **Tech Stack**

- **Framework:** React Native + Expo SDK 51
- **Language:** TypeScript
- **Navigation:** React Navigation 6
- **State:** React Context + AsyncStorage
- **i18n:** i18next (zh-CN, en-US)
- **Animation:** React Native Reanimated 3
- **Build:** EAS Build

## 🌐 **Environment Management (环境切换)**

### **一键环境切换 (推荐)**
```bash
# 测试环境
npm run ios:dev      # 自动切换到测试环境并启动iOS
npm run android:dev  # 自动切换到测试环境并启动Android

# 生产环境
npm run ios:prod     # 自动切换到生产环境并启动iOS
npm run android:prod # 自动切换到生产环境并启动Android
```

### **手动环境切换**
```bash
# 使用智能脚本
./switch-env.sh test   # 切换到测试环境
./switch-env.sh prod   # 切换到生产环境
./switch-env.sh status # 查看当前环境

# 然后启动
npm run ios
```

### **环境数据差异**
**测试环境** (`http://106.14.165.234:8085`):
- 中秋国庆预热活动, UMN免费接机, UCSB免费接机

**生产环境** (`https://www.vitaglobal.icu`):
- UMN中秋嘉年华, UCLA 2025新生活动, UCSD开学大典

### **技术实现** (2025年9月完成)
- ✅ **动态API地址**: 所有API服务使用 `getBaseUrl()` 动态获取
- ✅ **环境配置文件**: `.env.development` 和 `.env.production`
- ✅ **零硬编码**: 44处动态获取，0处硬编码

## 📋 **Key Commands**

### Development
```bash
# Install dependencies
npm install

# iOS development (生产环境)
npm run ios

# Android development (生产环境)
npm run android

# Start Expo development server
npm start
```


### Building & Deployment
```bash
# Build for production (iOS)
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Build for TestFlight
eas build --platform ios --profile preview
```

### Version Management

#### **版本号更新文件清单 (CRITICAL - 必须同步更新)**
更新版本号时，必须同时更新以下3个文件以保持版本一致性：

1. **app.json**
   - `version`: "1.0.X" (应用版本号)
   - `ios.buildNumber`: "X" (构建号)

2. **package.json**
   - `version`: "1.0.X" (必须与app.json保持一致)

3. **ios/PomeloXApp/Info.plist**
   - `CFBundleShortVersionString`: "1.0.X" (显示版本)
   - `CFBundleVersion`: "X" (构建版本)

**重要提醒**: 所有4个版本字段必须同步更新，否则会导致TestFlight/App Store上传失败或版本不一致问题。

#### **版本更新命令**
```bash
# Update version (updates app.json)
npm run update-version

# Quick release to TestFlight
./scripts/quick-release.sh
```

## ⚡ **Performance Requirements (MANDATORY)**

### React Native Optimization
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

## 🌟 **Critical APIs**

### Core Authentication & User
- **Login**: `POST /app/login` - `{username, password}`
- **Register**: `POST /app/register` - `{username, password, email, userType}`
- **User Info**: `GET /app/user/info` - Headers: `Authorization: Bearer {token}`
- **Update Profile**: `PUT /app/user/update` - `{userId, ...profileData}`

### Activity Management
- **List Activities**: `GET /app/activity/list` - Params: `{userId, pageNum?, pageSize?}`
- **Activity Detail**: `GET /app/activity/detail` - Params: `{activityId}`
- **Register Activity**: `POST /app/activity/register` - `{userId, activityId}`
- **My Activities**: `GET /app/activity/my` - Params: `{userId}`

### QR & Check-in
- **QR Scan**: `POST /app/activity/scan` - `{qrCode, userId}`
- **Generate QR**: `POST /app/qr/generate` - `{userId, activityId}`
- **Verify QR**: `POST /app/qr/verify` - `{qrCode, scannerId}`

### Volunteer Management
- **Sign In/Out**: `POST /app/hour/signRecord` - `{userId, type: 1|2, startTime?, endTime?}`
- **Hour Records**: `GET /app/hour/records` - Params: `{userId}`
- **Statistics**: `GET /app/hour/stats` - Params: `{userId}`

### Permission Levels
- `manage`: 总管理员 (Full system access)
- `part_manage`: 分管理员 (Organization management)
- `staff`: 内部员工 (Volunteer features)
- `common`: 普通用户 (Basic features)

### API Documentation
For complete API reference, see: [docs/api-7.pdf](docs/api-7.pdf)

## 📱 **Native Features**

### Camera & QR Scanning
```typescript
// Use expo-camera for QR scanning
import { CameraView } from 'expo-camera';
// NEVER use web QR libraries like jsQR
```

### Storage
```typescript
// Use AsyncStorage for persistent data
import AsyncStorage from '@react-native-async-storage/async-storage';
// NEVER use localStorage or sessionStorage
```

### Navigation
```typescript
// Use React Navigation
import { NavigationContainer } from '@react-navigation/native';
// NEVER use react-router or web routing
```

## 🚨 **Platform-Specific Warnings**

### **❌ NEVER Use These Web Components**
- `div`, `span`, `button` - Use `View`, `Text`, `TouchableOpacity`
- `window`, `document` - These don't exist in React Native
- CSS files - Use StyleSheet.create()
- `alert()` - Use Alert.alert()

### **⚠️ React Native Reanimated Warning**
**NEVER use `useAnimatedScrollHandler` with FlatList/SectionList** - Causes "onScroll is not a function" error. Use `useCallback` instead.

## 🚀 **iOS Release Process**

1. **Update Version**
   ```bash
   npm run update-version
   ```

2. **Build for Production**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit to App Store**
   ```bash
   eas submit --platform ios --profile production
   ```

4. **Monitor in App Store Connect**
   - Processing typically takes 30-60 minutes
   - TestFlight available immediately after processing
   - App Store review takes 24-48 hours

## 📂 **Project Structure**
```
frontend/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API services
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   └── locales/          # i18n translations
├── assets/               # Images, fonts, etc.
├── scripts/              # Build and deployment scripts
├── ios/                  # iOS native code
├── android/              # Android native code
├── app.json             # Expo configuration
├── eas.json             # EAS Build configuration
└── package.json         # Dependencies
```

## 🔧 **Development Workflow**

1. **Plan with TodoWrite** - Always track complex tasks
2. **Use real APIs only** - Never mock data unless explicitly requested
3. **Follow isolation rules** - Complete separation from frontend-web
4. **Add i18n from start** - No hardcoded Chinese text
5. **Optimize performance** - Use memo/callback/FastImage
6. **Test on both platforms** - iOS and Android
7. **Follow native patterns** - Use platform conventions

### Development Guidelines
- **Components**: Create reusable components in `src/components/`
- **Screens**: One screen per file in `src/screens/`
- **Services**: API calls in `src/services/` - **MUST use `getApiUrl()` from environment manager**
- **Types**: TypeScript types in `src/types/`
- **Constants**: App constants in `src/constants/`
- **Utils**: Helper functions in `src/utils/`
- **Environment**: All API URLs through `src/utils/environment.ts` - **NO hardcoding allowed**

## 📚 **Related Documentation**

- [API Guide](docs/API_GUIDE.md) - Complete API reference
- [Performance Guide](docs/PERFORMANCE_GUIDE.md) - Optimization techniques
- [Version Release](docs/VERSION_RELEASE.md) - TestFlight and App Store process
- [UI Design System](docs/UI_DESIGN_SYSTEM.md) - Design specifications

---

**Development Principle:** *Build native, think native, ship native.*