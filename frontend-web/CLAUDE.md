# CLAUDE.md - PomeloX Web H5

This file provides guidance to Claude Code (claude.ai/code) when working with the PomeloX Web H5 version.

## 🎯 Project Overview

PomeloX Web H5 is a **production-ready** web application built with React Native Web + Expo, providing a browser-based experience for Chinese international students. The platform is **live and operational** at web.vitaglobal.icu as of September 2025.

**Current Status:** Production web application serving 500+ students via mobile and desktop browsers.

## 🔥 **Core Development Rules (MUST FOLLOW)**

### **🚫 Platform Isolation Rules (ZERO TOLERANCE)**
- ❌ **NEVER import from frontend** - Complete isolation from mobile app
- ❌ **NEVER use native-only APIs** - No native modules or device-specific features
- ✅ **Web-compatible components only** - Use web adapters in `src/components/web/`
- ✅ **Browser APIs allowed** - Can use window, document, localStorage

### **🚫 Environment Rules (ZERO TOLERANCE)**
- ❌ **NEVER mix test and production** - Separate directories for each environment
- ❌ **NEVER use .env switching** - Fixed API endpoints per environment
- ✅ **Fixed endpoints** - Hardcoded API URLs in configuration

### **🚫 API Usage Rules (ZERO TOLERANCE)**
- ❌ **NEVER use Mock APIs** - Only real backend endpoints
- ❌ **NEVER hardcode fake data** - Show real 0 states instead of fake numbers
- ✅ **Real data only** - All user stats, activity data must come from actual APIs

### **🌍 Internationalization Rules (MANDATORY)**
- ❌ **NEVER hardcode Chinese text** - All user-visible text must use `t()` function
- ✅ **Semantic key names** - Use `auth.login.welcome` not `text1`
- ✅ **Dual language support** - Both zh-CN and en-US translations

## 🏗️ **Tech Stack**

- **Framework:** React Native Web + Expo for Web
- **Language:** TypeScript
- **Build:** Webpack (via Expo)
- **State:** React Context + localStorage
- **i18n:** i18next (zh-CN, en-US)
- **Deployment:** 宝塔面板 (BT Panel)

## 🌐 **Environment Configuration**

### **生产环境** (frontend-web)
- **接口URL**: `https://www.vitaglobal.icu`
- **H5访问地址**: `https://web.vitaglobal.icu`
- **环境标识**: `EXPO_PUBLIC_ENVIRONMENT=production`
- **调试模式**: `EXPO_PUBLIC_DEBUG_MODE=false`
- **部署目录**: `/www/wwwroot/project/h5`

### **测试环境** (frontend-web-testenv)
- **接口URL**: `http://106.14.165.234:8085`
- **H5访问地址**: `http://106.14.165.234:8086`
- **环境标识**: `EXPO_PUBLIC_ENVIRONMENT=development`
- **调试模式**: `EXPO_PUBLIC_DEBUG_MODE=true`
- **部署目录**: `/www/wwwroot/project/test-h5`

### **Environment Isolation Rules**
- **NEVER mix environments** - Each has its own directory
- **Fixed API endpoints** - No .env switching
- **Separate deployments** - Test cannot deploy to production
- **Independent builds** - Each environment builds separately

## 📋 **Key Commands**

### Development
```bash
# Install dependencies
npm install

# Start development server (Port 8090)
npm run web:dev

# Build for production
npm run web:build
```

### Deployment
```bash
# Standard deployment (recommended)
npm run web:build
node scripts/upload-latest-builds.js

# Alternative: Deploy via npm script
npm run deploy
```

## 🚀 **Web部署规范 (CRITICAL)**

### **官方部署方法: curl API上传**

#### **标准部署流程**
```bash
# 1. 构建项目
npm run web:build

# 2. 一键上传 (5-10秒完成)
node scripts/upload-latest-builds.js
```

### **宝塔API配置**
```javascript
// 面板配置
panelUrl: 'https://106.14.165.234:8888'
apiKey: 'rbxLQQr0qDBvwcbOxZt9VVPJvy3mIDVN'

// 部署目录
生产环境: '/www/wwwroot/project/h5'
测试环境: '/www/wwwroot/project/test-h5'

// IP白名单
已配置IP: 52.124.34.249
```

### **文件大小分级处理**
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

### **部署脚本说明**

| 脚本名称 | 用途 | 使用场景 |
|---------|------|---------|
| upload-latest-builds.js | 主要部署脚本 | 生产部署 |
| baota-deploy.js | 宝塔API部署 | 自动化部署 |
| baota-api.js | 宝塔API封装 | API调用 |
| upload-compressed.js | 压缩上传 | 大文件优化 |
| upload-large-file.js | 大文件上传 | 3MB+文件 |

### **Git同步方案（备用）**
```bash
# 1. 提交代码
git add . && git commit -m "更新" && git push origin main

# 2. 触发服务器同步
node scripts/trigger-sync.js
```

## ⚡ **Performance Optimization**

### React Optimization
- **React.memo** - All list components
- **useMemo** - Cache expensive calculations
- **useCallback** - Stabilize function references
- **Code splitting** - Dynamic imports for routes

### Web-Specific Optimizations
- **Bundle size** - Keep under 3MB
- **Lazy loading** - Images and components
- **Gzip compression** - Server-side compression
- **Browser caching** - Leverage cache headers

### Performance Targets
- **First paint**: <2 seconds
- **Interactive**: <3 seconds
- **Bundle size**: <3MB (gzipped)

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
- **Generate QR**: `POST /app/qr/generate` - `{userId, activityId}`
- **QR Scan**: `POST /app/activity/scan` - `{qrCode, userId}`
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

## 🌐 **Web Adapters**

### Component Adapters
```typescript
// Use web adapters for native components
import WebFlatList from '@/components/web/WebFlatList';
import WebBlurView from '@/components/web/WebBlurView';
import WebLinearGradient from '@/components/web/WebLinearGradient';
import WebCameraView from '@/components/web/WebCameraView';
```

### Storage
```typescript
// Use localStorage for web
const storage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key)
};
```

## 🚨 **Web-Specific Warnings**

### **❌ NEVER Use Native Components**
- `FlatList` → Use `WebFlatList`
- `BlurView` → Use `WebBlurView`
- `expo-camera` → Use `WebCameraView`
- `Alert.alert()` → Use custom modal

### **✅ Browser Compatibility**
- Support Chrome, Safari, Firefox, Edge
- Mobile browsers: iOS Safari, Chrome Android
- Responsive design for all screen sizes

## 📂 **Project Structure**
```
frontend-web/
├── src/
│   ├── screens/          # Screen components
│   ├── components/
│   │   └── web/         # Web-specific adapters
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API services
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   └── locales/          # i18n translations
├── scripts/              # Deployment scripts
│   ├── baota-*.js       # 宝塔部署脚本
│   ├── upload-*.js      # 上传脚本
│   └── test-*.js        # 测试脚本
├── dist/                 # Build output
├── webpack.config.js     # Webpack configuration
└── package.json         # Dependencies
```

## 🔧 **Troubleshooting**

### 部署问题
- **大文件上传失败**: 使用curl方案 (upload-large-file.js)
- **API超时**: 增加timeout或使用分块上传
- **路径错误**: 检查宝塔目录权限
- **Logo不显示**: 确保上传到 /assets/src/assets/logos/
- **JS文件404**: 检查index.html引用的文件名

### Bundle优化
- **字体文件**: 独立加载，不打包进JS
- **图片资源**: 使用CDN或压缩
- **代码分割**: 路由级别的动态导入
- **Tree shaking**: 移除未使用代码

## 📚 **Related Documentation**

- [API Guide](docs/API_GUIDE.md) - Complete API reference
- [Performance Guide](docs/PERFORMANCE_GUIDE.md) - Web optimization
- [Environment Setup](docs/ENVIRONMENT_SETUP.md) - Environment configuration

---

**Development Principle:** *Build for web, optimize for mobile, deploy with confidence.*