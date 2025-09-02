# 📱 TestFlight版本更新操作指南

## 🔄 快速更新流程

### **第一步：版本号更新**
```bash
cd /Users/jietaoxie/vitaglobal/frontend
```

编辑 `app.json`，更新版本号：
```json
{
  "expo": {
    "version": "1.0.X",  // 递增版本号 (当前1.0.1)
    "ios": {
      "buildNumber": "X"  // 递增构建号 (当前2)
    }
  }
}
```

同时更新 `ios/PomeloX/Info.plist`：
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.X</string>     <!-- 版本号 -->
<key>CFBundleVersion</key>
<string>X</string>         <!-- 构建号 -->
```

### **第二步：构建应用**
```bash
# 进入前端目录
cd /Users/jietaoxie/vitaglobal/frontend

# 启动构建（交互式，需要Apple账户）
eas build --platform ios --profile production

# Apple账户信息：
# Apple ID: dev@americanpromotioncompany.com
# 密码: 1585785322@Qq
```

**构建过程中会提示：**
1. "Do you want to log in to your Apple account?" - 输入 `y`
2. 输入Apple ID和密码
3. 等待15-30分钟构建完成

### **第三步：提交到TestFlight**
```bash
# 构建完成后，使用最新的build ID提交
eas submit --platform ios --profile production

# 或者指定具体的build ID
eas submit --platform ios --profile production --id [BUILD_ID]
```

### **第四步：提交更改到Git**
```bash
cd /Users/jietaoxie/vitaglobal

# 添加版本更改
git add frontend/app.json frontend/ios/PomeloX/Info.plist

# 提交更改
git commit -m "feat: 版本更新为1.0.X构建号X - [更新原因]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 📋 完整命令序列（复制粘贴使用）

```bash
# === 完整TestFlight更新流程 ===

# 1. 进入项目目录
cd /Users/jietaoxie/vitaglobal/frontend

# 2. 检查当前版本
grep -A2 '"version"' app.json
grep -A1 'CFBundleVersion' ios/PomeloX/Info.plist

# 3. 构建新版本（需要手动输入Apple凭据）
eas build --platform ios --profile production

# 4. 查看构建状态
eas build:list --platform ios --limit 1

# 5. 提交到TestFlight（使用最新构建）
eas submit --platform ios --profile production

# 6. 提交到Git
cd /Users/jietaoxie/vitaglobal
git add frontend/app.json frontend/ios/PomeloX/Info.plist
git commit -m "feat: 版本更新 - [描述更新内容]"
```

## 🎯 不同更新类型处理方式

### **1. 代码/功能更新**
```bash
# 更新版本号 → 构建 → 提交TestFlight
# 需要重新构建和上传
```

### **2. 紧急热更新**
```bash
# 仅适用于JavaScript代码更改
eas update --branch production --message "热更新: [描述]"
```

### **3. 资源文件更新（logo、图标等）**
```bash
# 更新版本号 → 构建 → 提交TestFlight
# 资源文件更改需要重新构建
```

## ⚡ 快速检查命令

```bash
# 检查构建状态
eas build:list --platform ios --limit 3

# 检查提交状态  
eas submission:list --platform ios --limit 3

# 查看构建日志（替换BUILD_ID）
open https://expo.dev/accounts/stevenj4/projects/vitaglobal/builds/[BUILD_ID]

# 检查App Store Connect
open https://appstoreconnect.apple.com
```

## 🔧 故障排除

### **构建失败**
```bash
# 清理缓存重新构建
npx expo prebuild -p ios --clean
eas build --platform ios --profile production
```

### **版本号冲突**
```bash
# 检查当前最高构建号
eas build:list --platform ios --limit 5
# 手动设置更高的构建号
```

### **Apple凭据过期**
```bash
# 重新登录Apple账户
eas credentials --platform ios
```

## 📊 版本管理建议

### **版本号规则**
- **主版本.次版本.补丁版本** (如 1.2.3)
- **构建号**: 每次构建必须递增（如 1, 2, 3...）

### **更新频率**
- **开发阶段**: 每天1-2次更新
- **测试阶段**: 每周2-3次更新  
- **生产阶段**: 按需更新

### **TestFlight限制**
- **最多100个测试版本**
- **每个版本最多10,000名测试员**
- **测试期限90天**

## 🏆 成功标志

✅ **构建完成**: Status显示为"finished"
✅ **TestFlight提交**: Submission显示为"finished" 
✅ **App Store Connect**: 新版本出现在TestFlight标签页
✅ **测试员收到**: 自动邮件通知新版本可用

## 🆘 紧急联系

如遇到问题：
1. 查看构建日志链接
2. 检查App Store Connect状态
3. 参考 `frontend/LOGO_UPDATE_GUIDE.md` 获取logo相关帮助

---
*最后更新: 2025-08-29*  
*当前版本: PomeloX v1.0.1 (Build 2)*