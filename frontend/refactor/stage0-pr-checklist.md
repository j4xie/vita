# 📋 阶段0 PR Checklist - 基线检测与依赖清单

**PR标题**: `feat(refactor): 阶段0 - 新架构迁移基线检测与准备工具`

**分支名**: `feature/new-arch-stage0-baseline`

## 📝 PR 描述

本PR为新架构迁移的阶段0准备工作，提供基线检测脚本和工具，**不改变任何运行时配置**。

### 🎯 目标
- 建立性能基线数据
- 评估依赖兼容性
- 提供回滚机制
- 为后续迁移决策提供数据支持

### ⚠️ 重要说明
- **零运行时影响**: 所有工具仅用于分析和报告
- **不修改配置**: 不改变任何架构或引擎设置
- **纯工具添加**: 仅添加 `refactor/` 目录下的工具文件

## ✅ 文件清单

### 新增文件 (全部在 `refactor/` 目录)
- [ ] `NEW_ARCHITECTURE_MIGRATION_PLAN.md` - 总体迁移计划
- [ ] `stage0-baseline-detection.js` - 基线检测脚本
- [ ] `DEPENDENCY_COMPATIBILITY_MATRIX.md` - 依赖兼容性矩阵
- [ ] `performance-validation.js` - 性能验证脚本
- [ ] `BASELINE_REPORT_TEMPLATE.md` - 基线报告模板
- [ ] `rollback-switch.js` - 回滚开关机制
- [ ] `stage0-pr-checklist.md` - 本文件

### package.json 新增脚本
```json
{
  "scripts": {
    // 基线检测
    "arch:baseline": "node refactor/stage0-baseline-detection.js",
    "arch:perf-ios": "node refactor/performance-validation.js ios",
    "arch:perf-android": "node refactor/performance-validation.js android",

    // 架构切换（未来使用）
    "arch:enable": "node refactor/rollback-switch.js enable",
    "arch:disable": "node refactor/rollback-switch.js disable",
    "arch:status": "node refactor/rollback-switch.js status",
    "arch:validate": "node refactor/rollback-switch.js validate",
    "arch:backup": "node refactor/rollback-switch.js backup",

    // Hermes切换（未来使用）
    "hermes:enable": "node refactor/rollback-switch.js enable-hermes",
    "hermes:disable": "node refactor/rollback-switch.js disable-hermes"
  }
}
```

## 🔍 测试验证

### 运行基线检测
```bash
# 1. 运行架构配置检测
npm run arch:baseline

# 2. 查看生成的报告
cat refactor/baseline-report.json
cat refactor/BASELINE_REPORT.md

# 3. 验证无运行时影响
npm run arch:status  # 应显示当前仍为旧架构+JSC
```

### 性能基线测试
```bash
# iOS性能基线
npm run arch:perf-ios

# Android性能基线（可选）
npm run arch:perf-android

# 查看性能报告
cat refactor/performance-metrics/PERFORMANCE_BASELINE.md
```

### 依赖兼容性验证
```bash
# 检查依赖矩阵
cat refactor/DEPENDENCY_COMPATIBILITY_MATRIX.md

# 确认高风险依赖
grep "INCOMPATIBLE" refactor/DEPENDENCY_COMPATIBILITY_MATRIX.md
```

## 📊 预期输出

### 基线检测报告应包含
- [x] 当前架构配置状态（应为旧架构+JSC）
- [x] 依赖兼容性评估（12个关键依赖）
- [x] 性能基线数据（Bundle大小、组件数量等）
- [x] 风险评估（2个高风险依赖）
- [x] 迁移建议

### 性能验证报告应包含
- [x] 冷启动时间基线
- [x] TTI基线
- [x] 列表FPS基线
- [x] 内存使用基线
- [x] Bundle分析

## 🚨 风险评估

### 确认无风险项
- [ ] **无配置修改**: 确认 app.json、Podfile.properties.json、gradle.properties 未被修改
- [ ] **无依赖变更**: package.json 仅添加脚本，无新依赖
- [ ] **无代码改动**: src/ 目录无任何文件改动
- [ ] **工具独立性**: 所有工具可独立运行，不影响现有功能

### 已识别风险
- `@react-native-community/blur` - 不兼容新架构（影响：模糊效果）
- `react-native-fast-image` - 部分兼容（影响：图片加载）

## 📋 Code Review Checklist

### 架构团队检查
- [ ] 迁移计划合理性
- [ ] 阶段划分适当性
- [ ] 风险评估完整性

### QA团队检查
- [ ] 性能基线数据准确
- [ ] 测试脚本可运行
- [ ] 报告模板完整

### 开发团队检查
- [ ] 工具脚本质量
- [ ] 文档清晰度
- [ ] 命令易用性

## 🔄 合并前确认

- [ ] 所有脚本已测试运行
- [ ] 报告已生成并审阅
- [ ] 无运行时配置被修改
- [ ] package.json 仅包含脚本添加
- [ ] CI/CD 通过

## 📝 后续步骤

1. **合并本PR后**:
   - 运行完整基线检测
   - 收集所有环境的性能数据
   - 团队评审报告

2. **下一阶段（阶段1）**:
   - 预处理工作（Babel配置、构建脚本）
   - 仍不修改运行时

3. **决策点**:
   - 基于基线数据决定是否继续
   - 选择迁移路径（保守/激进）
   - 确定灰度策略

## 👥 审阅者

- [ ] @架构师 - 技术方案审核
- [ ] @QA负责人 - 测试策略审核
- [ ] @产品经理 - 风险知晓
- [ ] @DevOps - CI/CD影响评估

---

**注意**: 本PR为纯工具添加，不应对现有应用产生任何影响。如发现任何运行时变化，请立即停止合并。