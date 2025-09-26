# 📊 PomeloX React Native 新架构迁移总体计划

## 🎯 项目概述

**项目名称**: PomeloX Mobile App
**当前版本**: 1.0.31
**React Native**: 0.76.9
**Expo SDK**: 52.0.0
**生产状态**: 已上线App Store
**用户规模**: 500+ 活跃用户

## 🔍 当前架构基线

### 技术栈现状
- **架构模式**: Legacy Bridge (传统桥接)
- **JS引擎**: JSC (JavaScriptCore)
- **渲染器**: Paper Renderer
- **原生模块**: Legacy Native Modules
- **新架构状态**: 完全未启用

### 关键配置
```json
// app.json
"newArchEnabled": false
"jsEngine": "jsc"

// iOS
"newArchEnabled": "false"
"expo.jsEngine": "jsc"

// Android
newArchEnabled=false
hermesEnabled=false
```

---

## 🎯 阶段化迁移矩阵

### **阶段 0: 预备评估** ✅

**目标**: 建立迁移基础和风险评估

**必须完成**:
- ✅ 版本兼容性确认 (RN 0.76.9 + Expo 52)
- ⚠️ 第三方库兼容性审计 (12个关键库)
- ✅ 性能基准测试建立
- ✅ 迁移分支创建

**成功标准**:
- 所有依赖库兼容性报告
- 当前性能基准数据
- 回滚计划制定

---

### **阶段 1: Hermes 引擎迁移** 🟡

**目标**: 启用 Hermes 获得性能提升，风险最低

**配置变更**:
```json
// app.json
"jsEngine": "hermes"

// Podfile.properties.json
"expo.jsEngine": "hermes"

// android/gradle.properties
hermesEnabled=true
```

**预期收益**:
- 启动速度提升: 30-40%
- 内存占用降低: 20-30%
- TTI (Time to Interactive) 改善

**风险评估**: 🟢 低风险
- Expo 52 完全支持
- 生产环境广泛验证
- 可快速回滚

**验证清单**:
- [ ] iOS 构建成功
- [ ] Android 构建成功
- [ ] 核心功能回归测试
- [ ] 性能指标对比
- [ ] 内存泄漏检测

---

### **阶段 2: 新架构启用** 🔴

**目标**: 启用 Fabric + TurboModules

**配置变更**:
```json
// 全平台统一启用
"newArchEnabled": true
newArchEnabled=true
"newArchEnabled": "true"
```

**关键依赖兼容性**:

| 库名 | 版本 | 新架构支持 | 操作方案 |
|---|---|---|---|
| react-native-reanimated | 3.16.1 | ✅ 完全支持 | 保持不变 |
| react-native-screens | 4.4.0 | ✅ 完全支持 | 保持不变 |
| react-native-gesture-handler | 2.20.2 | ✅ 完全支持 | 保持不变 |
| react-native-safe-area-context | 4.12.0 | ✅ 完全支持 | 保持不变 |
| react-native-svg | 15.8.0 | ✅ 完全支持 | 保持不变 |
| **react-native-fast-image** | 8.6.3 | ⚠️ 需要patch | **升级/替换** |
| **@react-native-community/blur** | 4.4.1 | ❌ 不支持 | **替换为expo-blur** |
| react-native-qrcode-svg | 6.3.15 | ⚠️ 未验证 | 测试验证 |
| react-native-base64 | 0.2.1 | ⚠️ 未验证 | JS替代方案 |

**风险评估**: 🔴 高风险
- 2个库必须替换
- 3个库需要验证
- 广泛的UI行为测试需求

**必要代码改动**:
```typescript
// 1. 替换不兼容组件
import { BlurView } from 'expo-blur'; // 替换 @react-native-community/blur

// 2. 验证FastImage替换方案
import { Image } from 'expo-image'; // 可能替换 react-native-fast-image
```

---

### **阶段 3: Fabric 渲染器优化** 🔴

**目标**: 利用Fabric渲染器优势

**自动启用**: newArchEnabled=true 时自动启用

**UI组件审查**:
- 12个文件使用 FlatList/SectionList
- 考虑升级到 FlashList (性能提升10x)
- 验证所有自定义动画

**预期收益**:
- UI响应速度提升: 15-20%
- 列表滚动性能大幅改善
- 更准确的布局计算

**潜在问题**:
- 某些样式行为可能改变
- 动画时序可能调整
- 第三方UI库兼容性

---

### **阶段 4: TurboModules 验证** 🟢

**目标**: 确保原生模块正常工作

**当前状态**:
- 仅使用标准Expo模块
- 无自定义原生模块
- 自动迁移到TurboModules

**影响评估**: 🟢 极小影响
- 标准库自动兼容
- 无手动迁移需求

---

### **阶段 5: JSI 直接调用** 🟢

**目标**: 性能关键路径优化

**适用场景**:
- 高频计算操作
- 实时数据处理
- 复杂动画计算

**当前需求**: 无紧急需求，可作为未来优化

---

### **阶段 6: 性能优化与新特性** 🟡

**目标**: 充分利用新架构优势

**优化项目**:

1. **列表组件升级**:
   ```typescript
   // 12个文件需要更新
   import { FlashList } from '@shopify/flash-list';
   // 替换 FlatList，性能提升显著
   ```

2. **图片处理优化**:
   ```typescript
   import { Image } from 'expo-image';
   // 更好的新架构支持和缓存机制
   ```

3. **Bundle优化**:
   - 启用 RAM Bundle
   - 代码分割优化
   - 懒加载组件

**预期整体收益**:
| 指标 | 当前 | Hermes | 新架构全开 |
|---|---|---|---|
| 启动时间 | 3.2s | 2.0s (-38%) | 1.5s (-53%) |
| 列表FPS | 55fps | 58fps | 60fps |
| 内存占用 | 180MB | 140MB | 120MB |
| JS Bundle | 3MB | 2.2MB | 2.2MB |

---

## 🚨 关键风险点与缓解策略

### **高风险依赖处理**

#### 1. react-native-fast-image
**问题**: 新架构支持不完整
**解决方案**:
- 方案A: 升级到最新版本
- 方案B: 迁移到 expo-image
- 方案C: 维护自定义patch

#### 2. @react-native-community/blur
**问题**: 完全不支持新架构
**解决方案**:
- 必须替换为 expo-blur
- 需要更新所有使用该组件的文件

### **中风险依赖处理**

#### 1. react-native-qrcode-svg
**策略**: 在测试环境充分验证

#### 2. react-native-base64
**策略**: 评估纯JS替代方案

---

## 📋 推荐迁移路径

### **保守方案** (推荐生产环境)
```
阶段1 (Hermes) → 测试2周 → 生产验证 → 观察1月 → 评估阶段2
```

**时间线**: 2-3个月
**风险**: 低
**收益**: 中等

### **激进方案** (仅限测试环境)
```
阶段1+2+3 同时启用 → 问题集中解决 → 性能全面测试 → 分阶段上线
```

**时间线**: 1个月
**风险**: 高
**收益**: 高

### **推荐策略**: 混合方案
1. **立即执行**: 阶段1 (Hermes)
2. **并行准备**: 阶段2依赖库替换
3. **测试验证**: 新架构在独立分支
4. **分步上线**: 根据测试结果决定

---

## ⚡ 成功标准

### **阶段1成功标准**:
- [ ] 启动速度提升 >30%
- [ ] 无功能回归
- [ ] 生产稳定运行1周

### **阶段2成功标准**:
- [ ] 所有核心功能正常
- [ ] UI响应性提升可测量
- [ ] 无内存泄漏
- [ ] 用户反馈正面

### **整体项目成功标准**:
- [ ] 性能全面提升
- [ ] 用户体验改善
- [ ] 技术债务减少
- [ ] 为未来功能铺平道路

---

## 📞 联系与支持

**项目负责人**: 开发团队
**技术审查**: 架构团队
**风险评估**: QA团队
**上线决策**: 产品团队

**文档更新**: 2025年09月23日
**下次审查**: 根据阶段进展决定

---

*此文档将随着迁移进展持续更新，确保团队对迁移状态和风险有清晰认知。*