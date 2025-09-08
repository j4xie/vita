# PomeloX 版本发布指南

## 更新类型分类

### 1. 代码/功能更新（需要重新构建）
**触发条件:**
- 修改了React Native JavaScript/TypeScript代码
- 添加了新功能或页面
- 修复了应用逻辑bug
- 更改了API调用逻辑

**必需步骤:**
```bash
# 1. 更新版本号
# 在 app.json 中更新: "version": "1.0.x"

# 2. 重新构建
cd frontend
eas build --platform ios --profile production

# 3. 重新提交TestFlight
eas submit --platform ios --profile production
```

### 2. 热更新（即时更新）
**适用条件:**
- 纯JavaScript代码小改动
- 文本内容更新
- 样式调整

**快速流程:**
```bash
cd frontend
eas update --branch production --message "描述更新内容"
```

### 3. 资源文件更新（需要重新构建）
**包含内容:**
- 应用图标: `assets/icon.png`, `assets/adaptive-icon.png`
- 启动页: `assets/splash-icon.png`
- 本地化资源

**处理流程:**
1. 更新资源文件
2. 清理缓存: `npx expo prebuild -p ios --clean`
3. 重新构建和提交

## 版本管理最佳实践

### 版本号规则 (语义化版本控制)
```javascript
// app.json 版本配置
{
  "expo": {
    "version": "1.2.3",      // 主版本.次版本.补丁版本
    "ios": {
      "buildNumber": "15"    // 构建号，每次构建必须递增
    }
  }
}
```

**版本号含义:**
- **1.x.x**: 重大功能更改
- **x.1.x**: 新功能添加
- **x.x.1**: bug修复和小改动

### 自动版本管理
```bash
# 自动递增构建号
eas build --platform ios --profile production --auto-increment

# 手动设置版本
eas build --platform ios --profile production --build-number 16
```

## TestFlight 更新完整流程

### 标准更新流程
```bash
# 工作目录
cd /Users/jietaoxie/pomeloX/frontend

# 1. 版本号更新（编辑 app.json）

# 2. Apple账户配置
# Apple ID: dev@americanpromotioncompany.com
# 密码: 1585785322@Qq

# 3. 交互式构建
eas build --platform ios --profile production

# 4. 自动提交
eas submit --platform ios --profile production
```

### 快速重建流程
```bash
cd frontend

# 清理缓存（如遇问题）
npx expo prebuild -p ios --clean

# 直接构建
eas build --platform ios --profile production

# 提交
eas submit --platform ios --profile production
```

## App Store 正式发布流程

### 从TestFlight到App Store
1. **TestFlight充分测试**: 至少3-5天内部测试
2. **App Store Connect提交审核**:
   - 选择TestFlight构建版本
   - 填写版本发布说明
   - 设置发布方式（自动/手动）
3. **审核时间**: 通常1-7天
4. **发布**: 审核通过后发布

### 审核要求检查清单
- [ ] 应用功能完整，无崩溃
- [ ] 所有功能都可以正常使用
- [ ] 隐私政策链接有效
- [ ] 应用内容符合App Store准则
- [ ] 截图和描述准确反映功能

## 开发阶段更新策略

### 频繁测试阶段
```bash
# 开发期间推荐使用Preview构建
eas build --platform ios --profile preview
```

### 准备发布阶段
```bash
# 使用Production构建准备正式发布
eas build --platform ios --profile production
```

## 紧急修复处理流程

### 严重Bug快速修复
1. **评估影响**: 确定是否可以使用热更新
2. **热更新优先**:
   ```bash
   # JavaScript层面问题
   eas update --branch production --message "紧急修复: 描述问题"
   ```
3. **如需重新构建**:
   ```bash
   # 优先级构建
   eas build --platform ios --profile production --priority high
   ```

### 回滚策略
```bash
# 热更新回滚
eas update --branch production --message "回滚到稳定版本"

# App Store版本回滚需要发布新版本
```

## 更新时间预期

### TestFlight更新
- **代码更新**: 15-30分钟构建 + 立即可测试
- **资源更新**: 20-35分钟构建 + 立即可测试  
- **热更新**: 1-2分钟 + 立即生效

### App Store更新
- **构建时间**: 15-30分钟
- **审核时间**: 1-7天（通常2-3天）
- **用户可用**: 审核通过后立即

## 故障排除

### 常见构建失败
1. **Bundle ID冲突**: 确认 `com.pomelotech.pomelo` 配置正确
2. **Apple凭据过期**: 重新登录Apple账户
3. **版本号重复**: 确保buildNumber递增
4. **代码语法错误**: 本地测试通过后再构建

### TestFlight问题
1. **构建不显示**: 等待5-10分钟处理时间
2. **测试员收不到邀请**: 检查邮箱地址和测试组配置
3. **应用闪退**: 检查原生依赖和权限配置

## 快速参考命令

```bash
# === 常用更新命令合集 ===

# 1. 标准版本更新
cd frontend && eas build --platform ios --profile production

# 2. 热更新
cd frontend && eas update --branch production --message "更新描述"

# 3. 清理重建
cd frontend && npx expo prebuild -p ios --clean && eas build --platform ios --profile production

# 4. 提交TestFlight
cd frontend && eas submit --platform ios --profile production

# 5. 检查构建状态
eas build:list --platform ios

# 6. 查看更新历史
eas update:list --branch production
```

## Claude 执行检查清单

当用户请求版本更新时，Claude应该：

1. **[ ] 确认更新类型**: 询问具体改动内容
2. **[ ] 检查当前版本**: 读取 `app.json` 中的版本号
3. **[ ] 建议新版本号**: 根据更新类型推荐合适版本号
4. **[ ] 更新版本配置**: 修改 `app.json` 版本信息
5. **[ ] 选择构建配置**: Production/Preview/热更新
6. **[ ] 执行构建命令**: 使用标准命令序列
7. **[ ] 监控构建进度**: 检查构建状态和错误
8. **[ ] 提交TestFlight**: 自动提交到App Store Connect
9. **[ ] 提供测试指导**: 说明TestFlight测试步骤

**标准响应格式:**
```
根据版本发布规范，我将帮您更新PomeloX应用：

1. 📊 当前版本: [读取版本]
2. 🔄 更新类型: [分析更新类型]  
3. 📝 建议版本: [推荐新版本号]
4. 🚀 执行流程: [显示执行步骤]

开始执行更新...
```