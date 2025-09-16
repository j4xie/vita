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
- ✅ **Real data only** - All user stats, activity data must come from actual APIs

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

## 🌐 **API Configuration**

### **Production API**
- **Base URL**: `https://www.vitaglobal.icu`
- **Auth**: JWT Bearer Token (`Authorization: Bearer {token}`)

### **Test Environment** (for development)
- **Base URL**: `http://106.14.165.234:8085`

## 📋 **Key Commands**

### Development
```bash
# Install dependencies
npm install

# iOS development
npm run ios

# Android development
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
- **Services**: API calls in `src/services/`
- **Types**: TypeScript types in `src/types/`
- **Constants**: App constants in `src/constants/`
- **Utils**: Helper functions in `src/utils/`

## 📚 **Related Documentation**

- [API Guide](docs/API_GUIDE.md) - Complete API reference
- [Performance Guide](docs/PERFORMANCE_GUIDE.md) - Optimization techniques
- [Version Release](docs/VERSION_RELEASE.md) - TestFlight and App Store process
- [UI Design System](docs/UI_DESIGN_SYSTEM.md) - Design specifications

---

**Development Principle:** *Build native, think native, ship native.*