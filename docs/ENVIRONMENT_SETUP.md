# PomeloX 环境配置说明

## 📋 概述

PomeloX支持**测试环境**和**正式环境**两套独立配置，确保开发和生产环境的完全隔离。Web端（`frontend-web/`）和App端（`frontend/`）使用完全独立的架构实现。

## 🌍 环境类型

### 测试环境 (Development)
- **API地址**: `https://test.vitaglobal.icu`
- **Firebase项目**: `pomelox-test`
- **图片CDN**: `https://test-pub-578670e517644aad94f4f68695b605b9.r2.dev`
- **调试模式**: 开启
- **分析功能**: 关闭

### 正式环境 (Production)
- **API地址**: `https://www.vitaglobal.icu`
- **Firebase项目**: `pomelox`
- **图片CDN**: `https://pub-578670e517644aad94f4f68695b605b9.r2.dev`
- **调试模式**: 关闭
- **分析功能**: 开启

## 🖥️ Web端使用方法

### 快速启动
```bash
cd frontend-web

# 启动测试环境
npm run web:dev

# 启动正式环境
npm run web:prod
```

### 构建部署
```bash
# 构建测试环境
npm run web:build:dev

# 构建正式环境
npm run web:build:prod
```

### 环境切换
在开发模式下，页面顶部会显示环境指示器，点击可以动态切换环境。

## 📱 App端使用方法

### 开发调试
```bash
cd frontend

# 启动测试环境开发服务器
npm run start:dev

# 启动正式环境开发服务器
npm run start:prod
```

### iOS运行
```bash
# iOS测试环境
npm run ios:dev

# iOS正式环境
npm run ios:prod
```

### Android运行
```bash
# Android测试环境
npm run android:dev

# Android正式环境
npm run android:prod
```

### 环境切换
在开发模式下，App顶部会显示环境指示器，点击可以打开环境切换界面。

## ⚙️ 环境配置文件

### Web端配置文件
- `.env.development` - 测试环境配置
- `.env.production` - 正式环境配置
- `.env` - 当前生效的配置（由脚本自动复制）

### App端配置文件
- `.env.development` - 测试环境配置
- `.env.production` - 正式环境配置
- `.env` - 当前生效的配置（由脚本自动复制）

## 🔧 环境管理API

### Web端（frontend-web/src/utils/environment.ts）
```typescript
import { environmentManager } from './utils/environment';

// 获取当前环境
const currentEnv = environmentManager.getCurrentEnvironment();

// 获取API地址
const apiUrl = environmentManager.getApiUrl();

// 检查是否为调试模式
const isDebug = environmentManager.isDebugMode();

// 动态切换环境（仅开发模式）
await environmentManager.setEnvironment('development');
```

### App端（frontend/src/utils/environment.ts）
```typescript
import { environmentManager } from './utils/environment';

// 获取当前环境
const currentEnv = environmentManager.getCurrentEnvironment();

// 获取Firebase配置（移动端特定）
const firebaseConfig = environmentManager.getFirebaseConfig();

// 异步切换环境（持久化到AsyncStorage）
await environmentManager.setEnvironment('production');
```

## 🎨 环境指示器组件

### Web端
```typescript
import { EnvironmentIndicator } from './components/dev/EnvironmentSwitcher';

// 在根组件中使用
<EnvironmentIndicator />
```

### App端
```typescript
import { EnvironmentIndicator } from './components/dev/EnvironmentSwitcher';

// 在根组件中使用
<EnvironmentIndicator />
```

## 🔒 安全说明

1. **环境隔离**: 测试和正式环境使用完全独立的数据库和服务
2. **配置安全**: 敏感信息使用环境变量，不直接写在代码中
3. **权限控制**: 环境切换功能仅在开发模式下可用
4. **数据保护**: 测试环境数据不会影响正式环境

## 📝 开发注意事项

1. **代码隔离**: Web端和App端使用完全独立的代码实现
2. **配置同步**: 两端环境配置保持一致，但实现方式不同
3. **测试流程**: 
   - 先在测试环境验证功能
   - 确认无误后切换到正式环境
   - 部署前再次验证正式环境配置

4. **环境检查**: 
   - 部署前确认当前环境配置
   - 检查API地址和Firebase项目是否正确
   - 验证环境指示器显示正确

## 🚀 部署流程

### Web端部署
1. 选择目标环境配置
2. 运行对应的构建命令
3. 部署到相应的服务器

### App端发布
1. 配置正式环境
2. 构建生产版本
3. 提交到App Store/Google Play

## 🔍 故障排除

### 常见问题
1. **环境配置不生效**: 检查.env文件是否正确复制
2. **API连接失败**: 验证环境配置中的API地址
3. **Firebase错误**: 确认Firebase项目ID和配置正确
4. **环境切换无效**: 重启应用以加载新配置

### 调试方法
1. 查看环境指示器显示的当前环境
2. 检查控制台日志中的环境信息
3. 验证网络请求是否指向正确的API地址

---

**遵循原则**: 保持Web端和App端代码完全独立，避免任何交叉引用或共享代码。