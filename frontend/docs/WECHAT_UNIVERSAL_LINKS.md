# WeChat Universal Links Integration Guide

## 配置完成情况

### ✅ 已完成的配置

1. **iOS Entitlements** (`ios/PomeloX/PomeloX.entitlements`)
   - 添加了 Associated Domains: `applinks:web.vitaglobal.icu`

2. **Info.plist** (`ios/PomeloX/Info.plist`)
   - 添加了微信URL Scheme: `wxPomeloXApp`
   - 注意：实际使用时需要替换为真实的微信AppID格式：`wx[YOUR_WECHAT_APP_ID]`

3. **AppDelegate.mm** (`ios/PomeloX/AppDelegate.mm`)
   - 增强了Universal Links处理逻辑
   - 添加了微信回调URL的识别

4. **apple-app-site-association文件**
   - Team ID: `5RYR7K29A7`
   - Bundle ID: `com.pomelotech.pomelo`
   - 支持的路径：所有路径 + 微信专用路径

5. **部署脚本** (`frontend/ios/UniversalLinks/deploy-universal-links.sh`)
   - 自动部署到 `web.vitaglobal.icu`

## 部署步骤

### 1. 部署apple-app-site-association文件
```bash
cd /Users/jietaoxie/pomeloX/frontend/ios/UniversalLinks
./deploy-universal-links.sh
```

### 2. 验证部署
访问以下URL确认文件已正确部署：
- https://web.vitaglobal.icu/.well-known/apple-app-site-association
- https://web.vitaglobal.icu/apple-app-site-association

### 3. 重新构建iOS应用
```bash
cd /Users/jietaoxie/pomeloX/frontend
eas build --platform ios --profile production
```

### 4. 提交到TestFlight测试
```bash
eas submit --platform ios --profile production
```

## 微信SDK集成（待完成）

### 需要您提供的信息：
1. **微信AppID** - 从微信开放平台获取
2. **微信AppSecret** - 从微信开放平台获取
3. **微信Universal Links路径** - 微信要求的特定格式

### 后续步骤：

1. **安装微信SDK**
```bash
npm install react-native-wechat-lib
cd ios && pod install
```

2. **更新URL Scheme**
将 `wxPomeloXApp` 替换为实际的微信AppID：`wx[YOUR_ACTUAL_WECHAT_APP_ID]`

3. **初始化微信SDK**
在App启动时调用：
```javascript
import * as WeChat from 'react-native-wechat-lib';

WeChat.registerApp('YOUR_WECHAT_APP_ID', 'https://web.vitaglobal.icu/');
```

## 测试验证

### 1. Apple验证工具
使用Apple的验证工具检查配置：
```bash
curl -v https://web.vitaglobal.icu/.well-known/apple-app-site-association
```

### 2. 测试Universal Links
1. 在备忘录中输入：`https://web.vitaglobal.icu/wechat/test`
2. 长按链接，应该显示"在PomeloX中打开"选项

### 3. 微信支付回调测试
1. 发起微信支付
2. 完成支付后应自动返回App
3. App应正确处理支付结果

## 常见问题

### Q: Universal Links不工作
A: 检查以下几点：
- 确保域名支持HTTPS
- apple-app-site-association文件格式正确
- Team ID和Bundle ID正确
- 在Apple Developer中启用了Associated Domains

### Q: 微信支付无法返回App
A: 确认：
- URL Scheme正确配置
- Universal Links路径包含微信要求的路径
- AppDelegate正确处理回调

## 重要提醒

- **生产环境部署前**必须使用真实的微信AppID
- Universal Links配置更改后需要重新构建App
- 首次配置可能需要24小时才能完全生效
- 测试时使用TestFlight版本，不要使用开发版本