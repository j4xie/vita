# 📱 TestFlight更新分步指令手册

## 🔍 第一步：检查当前状态

### 1.1 检查项目目录
```bash
cd /Users/jietaoxie/pomeloX/frontend
pwd
```
**期望输出：** `/Users/jietaoxie/pomeloX/frontend`

### 1.2 检查当前版本
```bash
grep -A1 '"version"' app.json
grep -A1 'CFBundleShortVersionString' ios/PomeloX/Info.plist  
grep -A1 'CFBundleVersion' ios/PomeloX/Info.plist
```
**期望输出：**
```
"version": "1.0.1",
<string>1.0.1</string>
<string>2</string>
```

### 1.3 检查最新构建状态
```bash
eas build:list --platform ios --limit 1
```

## ⬆️ 第二步：递增版本号

### 2.1 计算下一版本号
**当前状态：**
- 应用版本：1.0.1
- 构建号：2

**下一版本：**
- 应用版本：1.0.2 (补丁版本递增)
- 构建号：3 (构建号递增)

### 2.2 更新app.json版本
```bash
# 编辑app.json，找到第9行附近
nano app.json
```

**修改内容：**
```json
// 第9行附近
"version": "1.0.2",

// 第28行附近  
"buildNumber": "3",
```

### 2.3 更新iOS Info.plist版本
```bash
# 编辑Info.plist，找到第22和41行
nano ios/PomeloX/Info.plist
```

**修改内容：**
```xml
<!-- 第22行附近 -->
<key>CFBundleShortVersionString</key>
<string>1.0.2</string>

<!-- 第41行附近 -->
<key>CFBundleVersion</key>
<string>3</string>
```

### 2.4 验证版本更新
```bash
grep -A1 '"version"' app.json
grep -A1 'CFBundleShortVersionString' ios/PomeloX/Info.plist
grep -A1 'CFBundleVersion' ios/PomeloX/Info.plist
```

**期望输出：**
```
"version": "1.0.2",
<string>1.0.2</string>
<string>3</string>
```

## 🛠️ 第三步：构建新版本

### 3.1 启动构建（交互式）
```bash
eas build --platform ios --profile production
```

### 3.2 Apple账户登录
**提示：** "Do you want to log in to your Apple account?"  
**输入：** `y`

**Apple账户信息：**
- **Apple ID：** `dev@americanpromotioncompany.com`
- **密码：** `1585785322@Qq`

### 3.3 等待构建完成
**构建时间：** 通常15-30分钟  
**状态显示：** 
```
Waiting for build to complete...
Build queued...
Build is about to start
✔ Build finished
🍏 iOS app: https://expo.dev/artifacts/eas/[ARTIFACT_ID].ipa
```

### 3.4 记录构建ID
**从输出中找到：**
```
See logs: https://expo.dev/accounts/stevenj4/projects/pomeloX/builds/[BUILD_ID]
```
**复制BUILD_ID用于下一步**

## 📤 第四步：提交到TestFlight

### 4.1 检查构建完成状态
```bash
eas build:list --platform ios --limit 1
```

**确认状态为：** `Status: finished`

### 4.2 提交到TestFlight
```bash
# 方式1：使用最新构建
eas submit --platform ios --profile production

# 方式2：指定构建ID
eas submit --platform ios --profile production --id [BUILD_ID]
```

### 4.3 等待提交完成
**成功标志：**
```
✔ Scheduled iOS submission
Submission details: https://expo.dev/accounts/stevenj4/projects/pomeloX/submissions/[SUBMISSION_ID]
✔ iOS submission successful
```

## 💾 第五步：提交更改到Git

### 5.1 回到项目根目录
```bash
cd /Users/jietaoxie/pomeloX
```

### 5.2 添加版本文件
```bash
git add frontend/app.json frontend/ios/PomeloX/Info.plist
```

### 5.3 检查暂存状态
```bash
git status
```

### 5.4 提交更改
```bash
git commit -m "feat: 版本更新为1.0.2构建号3 - logo更新版本

- 将应用版本从1.0.1升级到1.0.2
- 更新构建号从2到3
- 新的橙色西柚logo已应用到应用图标
- 已提交到TestFlight供测试

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## ✅ 第六步：验证更新成功

### 6.1 检查提交状态
```bash
cd /Users/jietaoxie/pomeloX/frontend
eas submission:list --platform ios --limit 1
```

### 6.2 检查App Store Connect
**浏览器打开：** https://appstoreconnect.apple.com
1. 登录Apple账户
2. 选择PomeloX应用  
3. 查看TestFlight标签页
4. 确认新版本出现在列表中

### 6.3 检查构建详情
```bash
eas build:list --platform ios --limit 1
```

**确认信息：**
- Version: 1.0.2
- Build number: 3
- Status: finished
- Distribution: store

## 🚨 故障排除指令

### 构建失败处理
```bash
# 清理缓存重新构建
npx expo prebuild -p ios --clean
eas build --platform ios --profile production
```

### 版本冲突处理
```bash
# 查看已提交的版本
eas submission:list --platform ios --limit 5

# 手动递增构建号（比最高的高1）
# 编辑app.json和Info.plist，将构建号设为更高数值
```

### Apple凭据问题
```bash
# 重新配置凭据
eas credentials --platform ios

# 清理凭据缓存
eas credentials:clear --platform ios
```

### 提交失败处理
```bash
# 检查失败原因
eas submission:list --platform ios --limit 1

# 如果是版本冲突，重新构建更高版本号
# 如果是凭据问题，重新登录Apple账户
```

## ⚡ 快速命令参考

### 一键检查状态
```bash
cd /Users/jietaoxie/pomeloX/frontend && \
echo "=== 当前版本 ===" && \
grep '"version"' app.json && \
echo "=== 最新构建 ===" && \
eas build:list --platform ios --limit 1 && \
echo "=== 最新提交 ===" && \
eas submission:list --platform ios --limit 1
```

### 当前可用的立即操作
**如果你想立即提交刚完成的构建到TestFlight：**
```bash
cd /Users/jietaoxie/pomeloX/frontend
eas submit --platform ios --profile production --id 38c8812b-f310-43fb-8721-3141fa2ec106
```

**构建详情：**
- **构建ID：** `38c8812b-f310-43fb-8721-3141fa2ec106`
- **状态：** ✅ 已完成
- **版本：** 1.0.1 (Build 2)
- **构建时间：** 刚刚完成

## 📋 版本计划表

| 操作 | 当前版本 | 目标版本 | 构建号 | 说明 |
|------|----------|----------|--------|------|
| 当前状态 | 1.0.1 | - | 2 | Logo已更新，构建已完成 |
| 立即提交 | 1.0.1 | - | 2 | 提交当前构建到TestFlight |
| 下次更新 | 1.0.1 | 1.0.2 | 3 | 下一个版本的更新流程 |

## 🎯 推荐操作顺序

1. **立即操作：** 提交刚完成的构建到TestFlight
2. **后续更新：** 使用本指南进行下一次版本更新

---
*基于当前项目状态生成，包含实际的构建ID和版本号*