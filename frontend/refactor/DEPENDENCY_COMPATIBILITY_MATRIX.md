# 📦 PomeloX 依赖兼容性矩阵

**更新时间**: 2025年09月23日
**RN版本**: 0.76.9
**Expo SDK**: 52.0.0

## 🎯 兼容性评级说明

- ✅ **COMPATIBLE**: 完全支持新架构，无需修改
- ⚠️ **NEEDS_PATCH**: 支持新架构，但需要更新或patch
- 🔄 **NEEDS_TESTING**: 支持状况未知，需要测试验证
- ❌ **INCOMPATIBLE**: 不支持新架构，必须替换
- 🆕 **ALTERNATIVE**: 推荐的替代方案

---

## 🟢 完全兼容依赖 (无需修改)

| 库名 | 当前版本 | 最低支持版本 | 新架构支持 | 备注 |
|---|---|---|---|---|
| **react-native** | 0.76.9 | 0.74.0+ | ✅ COMPATIBLE | 核心框架，完全支持 |
| **react** | 18.3.1 | 18.0.0+ | ✅ COMPATIBLE | 核心库 |
| **expo** | ~52.0.0 | 51.0.0+ | ✅ COMPATIBLE | Expo SDK 51+ 支持新架构 |
| **react-native-reanimated** | ~3.16.1 | 3.0.0+ | ✅ COMPATIBLE | 动画库，新架构优化 |
| **react-native-screens** | ~4.4.0 | 3.29.0+ | ✅ COMPATIBLE | 导航优化 |
| **react-native-gesture-handler** | ~2.20.2 | 2.14.0+ | ✅ COMPATIBLE | 手势处理 |
| **react-native-safe-area-context** | 4.12.0 | 4.8.0+ | ✅ COMPATIBLE | 安全区域 |
| **react-native-svg** | 15.8.0 | 14.0.0+ | ✅ COMPATIBLE | SVG 支持 |
| **@react-navigation/native** | ^7.1.17 | 6.1.0+ | ✅ COMPATIBLE | 导航核心 |
| **@react-navigation/stack** | ^7.4.5 | 6.3.0+ | ✅ COMPATIBLE | 堆栈导航 |
| **@react-navigation/bottom-tabs** | ^7.4.5 | 6.5.0+ | ✅ COMPATIBLE | 底部标签 |
| **expo-camera** | ~16.0.18 | 15.0.0+ | ✅ COMPATIBLE | 相机功能 |
| **expo-image-picker** | ~16.0.6 | 15.0.0+ | ✅ COMPATIBLE | 图片选择 |
| **expo-blur** | ~14.0.3 | 13.0.0+ | ✅ COMPATIBLE | 模糊效果 |
| **expo-linear-gradient** | ~14.0.2 | 13.0.0+ | ✅ COMPATIBLE | 线性渐变 |
| **expo-haptics** | ~14.0.1 | 13.0.0+ | ✅ COMPATIBLE | 触觉反馈 |
| **expo-constants** | ~17.0.8 | 16.0.0+ | ✅ COMPATIBLE | 应用常量 |
| **expo-status-bar** | ~2.0.1 | 1.6.0+ | ✅ COMPATIBLE | 状态栏 |
| **@react-native-async-storage/async-storage** | 1.23.1 | 1.19.0+ | ✅ COMPATIBLE | 本地存储 |
| **axios** | ^1.11.0 | 1.0.0+ | ✅ COMPATIBLE | HTTP 客户端 |
| **i18next** | ^23.15.2 | 22.0.0+ | ✅ COMPATIBLE | 国际化 |
| **react-i18next** | ^15.6.1 | 13.0.0+ | ✅ COMPATIBLE | React i18n 绑定 |

---

## 🟡 需要更新的依赖

| 库名 | 当前版本 | 建议版本 | 状态 | 升级难度 | 操作建议 |
|---|---|---|---|---|---|
| **@react-native-picker/picker** | 2.9.0 | 2.10.0+ | ⚠️ NEEDS_PATCH | 🟢 LOW | 升级到最新版 |

---

## 🔴 高风险依赖 (必须处理)

### ❌ 不兼容依赖

| 库名 | 当前版本 | 新架构支持 | 替代方案 | 迁移难度 | 操作建议 |
|---|---|---|---|---|---|
| **@react-native-community/blur** | ^4.4.1 | ❌ INCOMPATIBLE | 🆕 expo-blur | 🟢 LOW | 已有 expo-blur，删除此依赖 |

**迁移方案**:
```typescript
// 替换前
import { BlurView } from '@react-native-community/blur';

// 替换后 (已在项目中)
import { BlurView } from 'expo-blur';
```

### ⚠️ 部分兼容依赖

| 库名 | 当前版本 | 新架构支持 | 替代方案 | 迁移难度 | 操作建议 |
|---|---|---|---|---|---|
| **react-native-fast-image** | ^8.6.3 | ⚠️ NEEDS_PATCH | 🆕 expo-image | 🟡 MEDIUM | 测试或替换 |

**react-native-fast-image 处理方案**:

1. **方案A: 升级测试**
   ```bash
   npm install react-native-fast-image@latest
   ```

2. **方案B: 迁移到 expo-image** (推荐)
   ```typescript
   // 替换前
   import FastImage from 'react-native-fast-image';

   // 替换后
   import { Image } from 'expo-image';
   ```

---

## 🔵 需要测试验证的依赖

| 库名 | 当前版本 | 测试优先级 | 风险等级 | 备用方案 |
|---|---|---|---|---|
| **react-native-qrcode-svg** | ^6.3.15 | 🔴 HIGH | 🟡 MEDIUM | 自定义QR组件 |
| **react-native-base64** | ^0.2.1 | 🟡 MEDIUM | 🟢 LOW | JS原生 btoa/atob |
| **react-native-render-html** | ^6.3.4 | 🟡 MEDIUM | 🟡 MEDIUM | react-native-webview |
| **crypto-js** | ^4.2.0 | 🟢 LOW | 🟢 LOW | 纯JS库，无影响 |

**测试验证步骤**:

1. **react-native-qrcode-svg**
   ```bash
   # 测试QR码生成功能
   npm run test:qr-functionality
   ```

2. **react-native-base64**
   ```typescript
   // 验证编码/解码功能
   import { decode, encode } from 'react-native-base64';
   // 或使用原生方案
   // btoa(string) / atob(encodedString)
   ```

---

## 📱 原生模块分析

### Expo 管理的原生功能 ✅
- **expo-camera**: 相机访问
- **expo-image-picker**: 图片选择
- **expo-location**: 位置服务
- **expo-haptics**: 触觉反馈
- **expo-av**: 音视频
- **expo-updates**: OTA 更新

这些都由 Expo 管理，完全兼容新架构。

### 第三方原生模块状态
- **无自定义原生模块**: ✅ 无迁移工作
- **无Bridge调用**: ✅ 无兼容性问题

---

## 🚀 迁移优先级矩阵

### 阶段1: 立即处理 (启用Hermes前)
- [ ] 删除 `@react-native-community/blur` (已有替代)
- [ ] 验证 `expo-blur` 功能正常

### 阶段2: 新架构启用前
- [ ] 测试 `react-native-qrcode-svg` 兼容性
- [ ] 决定 `react-native-fast-image` 处理方案
- [ ] 验证 `react-native-base64` 或准备替换

### 阶段3: 新架构启用后
- [ ] 性能回归测试
- [ ] 监控依赖库运行状况
- [ ] 评估 FlashList 迁移

---

## 🔧 自动化检测命令

```bash
# 运行依赖兼容性检测
npm run check:new-arch-compatibility

# 生成依赖报告
node refactor/stage0-baseline-detection.js

# 检测潜在问题
npm audit --audit-level moderate
```

---

## 📋 迁移检查清单

### 准备阶段
- [ ] 备份当前 package.json
- [ ] 创建测试分支
- [ ] 记录当前性能基线

### 依赖处理
- [ ] 删除不兼容依赖
- [ ] 更新需要patch的依赖
- [ ] 测试验证未确定依赖
- [ ] 验证所有功能正常

### 验证测试
- [ ] 核心功能回归测试
- [ ] 性能基准对比
- [ ] 兼容性问题排查
- [ ] 用户体验验证

---

## ⚠️ 风险提醒

1. **生产环境谨慎**: 所有依赖变更需要在测试环境充分验证
2. **功能回归**: 特别关注图片、模糊、QR码等功能
3. **性能监控**: 迁移后持续监控性能指标
4. **回滚准备**: 保持快速回滚能力

---

**最后更新**: 2025年09月23日
**下次审查**: 依赖状况变化时