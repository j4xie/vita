# 🌟 PomeloX 环境管理完整方案

## 📋 概述

PomeloX现在拥有完整的环境管理方案，结合了你原有的灵活开发环境切换和新的自动化发布流程，实现了从开发到发布的完整自动化。

## 🔄 双重环境管理策略

### **1. 开发阶段 - 灵活切换** (保留你的方案)

适用于本地开发和调试：

```bash
# 切换到开发环境
npm run env:dev && npm run ios

# 切换到生产环境
npm run env:prod && npm run ios

# 查看当前环境状态
npm run env:status
```

### **2. 发布阶段 - 自动化发布** (新增EAS Profiles)

适用于TestFlight和App Store发布：

```bash
# TestFlight发布 (自动使用开发环境)
npm run testflight:release

# App Store发布 (自动使用生产环境)
npm run appstore:release
```

## 🎯 核心优势

| 特性 | 开发阶段 | 发布阶段 |
|------|----------|----------|
| **灵活性** | ✅ 一键切换环境 | ✅ 自动选择环境 |
| **安全性** | ✅ 本地可控 | ✅ 零切换错误 |
| **效率** | ✅ 快速调试 | ✅ 一键发布 |
| **追踪** | ✅ 状态可查 | ✅ 环境隔离 |

## 🚀 完整发布工作流程

### **步骤1: 版本管理**

```bash
# 查看当前版本
npm run version:status

# 创建Beta版本 (TestFlight用)
npm run version:beta    # 1.0.31 -> 1.0.32-beta.1

# 升级正式版本 (App Store用)
npm run version:release # 1.0.32-beta.1 -> 1.0.32
```

### **步骤2: TestFlight发布** (开发环境数据)

```bash
# 一键发布到TestFlight
npm run testflight:release
```

脚本会自动：
- ✅ 检查代码质量 (TypeScript + ESLint)
- ✅ 使用staging profile (开发环境API)
- ✅ 构建iOS应用
- ✅ 上传到TestFlight
- ✅ 发送完成通知

### **步骤3: App Store发布** (生产环境数据)

```bash
# 一键发布到App Store
npm run appstore:release
```

脚本会自动：
- ✅ 运行安全检查 (生产环境配置验证)
- ✅ 使用production profile (生产环境API)
- ✅ 构建生产版本
- ✅ 提交App Store审核
- ✅ 提供后续步骤指引

## 🔧 技术实现详情

### **EAS Profiles配置**

```json
{
  "build": {
    "staging": {
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "development",
        "EXPO_PUBLIC_API_URL": "http://106.14.165.234:8085"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production",
        "EXPO_PUBLIC_API_URL": "https://www.vitaglobal.icu"
      }
    }
  }
}
```

### **版本号管理**

- **Beta版本**: `1.0.31-beta.1` (TestFlight)
- **正式版本**: `1.0.31` (App Store)
- **自动同步**: package.json、app.json、Info.plist

### **安全检查**

1. **发布前验证**:
   - TypeScript类型检查
   - ESLint代码规范
   - 环境配置检查

2. **生产环境保护**:
   - 禁止测试API地址
   - 关闭调试模式
   - 二次确认机制

## 📱 使用场景示例

### **场景1: 开发新功能**

```bash
# 1. 切换到开发环境测试
npm run env:dev && npm run ios

# 2. 功能完成后切换到生产环境验证
npm run env:prod && npm run ios
```

### **场景2: TestFlight内测**

```bash
# 1. 创建Beta版本
npm run version:beta

# 2. 发布到TestFlight
npm run testflight:release

# 3. 等待邮件通知，在TestFlight中测试
```

### **场景3: App Store正式发布**

```bash
# 1. 从Beta升级为正式版本
npm run version:release

# 2. 发布到App Store
npm run appstore:release

# 3. 关注审核状态
```

## ⚠️ 重要提醒

### **发布时机**
- **TestFlight**: 随时可发布，用于内测
- **App Store**: 确保TestFlight充分测试后再发布

### **环境数据**
- **TestFlight**: 使用开发环境数据 (测试活动、测试用户)
- **App Store**: 使用生产环境数据 (真实活动、真实用户)

### **版本策略**
- **每次发布TestFlight**: 使用`npm run version:beta`
- **正式发布App Store**: 使用`npm run version:release`

## 🎉 总结

现在你拥有了业界最佳的环境管理方案：

1. **开发时**: 使用你原有的`npm run env:dev/prod`灵活切换
2. **发布时**: 使用新的`npm run testflight:release/appstore:release`自动化发布
3. **版本管理**: 使用`npm run version:*`智能版本管理
4. **零错误风险**: 发布时自动选择正确环境，无需手动切换

这样既保持了开发的灵活性，又确保了发布的准确性和安全性！🚀