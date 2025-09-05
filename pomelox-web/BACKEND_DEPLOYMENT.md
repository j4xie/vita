# PomeloX Web版本 - 后端部署指南

## 📦 项目打包信息

**项目名称**: PomeloX Web版本  
**框架**: Next.js 15.5.2 + TypeScript  
**打包时间**: 2025-09-05  
**版本**: 1.0.0  

## 🛠️ 部署环境要求

### Node.js环境
- **Node.js版本**: >= 18.0.0 (推荐 20.x)
- **NPM版本**: >= 9.0.0
- **操作系统**: Linux/macOS/Windows

### 服务器配置
- **内存**: 最少512MB (推荐1GB+)
- **磁盘**: 最少100MB可用空间
- **端口**: 3000 (可配置)
- **域名**: 支持自定义域名绑定

## 🚀 部署步骤

### 1. 解压和安装
```bash
# 解压项目文件
unzip pomelox-web.zip
cd pomelox-web

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 2. 启动服务
```bash
# 生产模式启动
npm start

# 或使用PM2管理进程 (推荐)
npm install -g pm2
pm2 start npm --name "pomelox-web" -- start
pm2 save
pm2 startup
```

### 3. 反向代理配置 (Nginx示例)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📋 API连接验证

### 后端API地址
```
https://www.vitaglobal.icu
```

### 已对接的API接口

**用户认证**:
- ✅ `/app/login` - 用户登录
- ✅ `/app/user/add` - 用户注册  
- ✅ `/app/user/info` - 获取用户信息
- ✅ `/sms/vercodeSms` - 短信验证码

**活动管理**:
- ✅ `/app/activity/list` - 活动列表
- ✅ `/app/activity/enroll` - 活动报名
- ✅ `/app/activity/signIn` - 活动签到
- ✅ `/app/activity/userActivitylist` - 用户活动

**志愿者服务**:
- ✅ `/app/hour/signRecord` - 志愿者签到签退
- ✅ `/app/hour/lastRecordList` - 最后签到记录
- ✅ `/app/hour/recordList` - 工时记录列表
- ✅ `/app/hour/hourList` - 工时统计
- ✅ `/app/hour/userHour` - 个人工时统计

**基础数据**:
- ✅ `/app/dept/list` - 学校列表

## 🔒 安全配置

### SSL证书
- 必须配置HTTPS (QR扫码功能需要)
- 推荐使用Let's Encrypt免费证书

### CORS配置
后端需要允许Web域名的跨域请求:
```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

## 📱 功能特性

### ✅ 已实现功能
- 🔐 **用户认证**: 登录/注册/token管理
- 📅 **活动管理**: 浏览/报名/签到
- 🤝 **志愿服务**: 签到签退/工时统计  
- 📷 **QR扫码**: Web摄像头扫码
- 🌍 **多语言**: 中英文支持框架
- 📱 **响应式**: 手机/平板/桌面适配

### 🎨 设计特色
- 玻璃形态设计 (Liquid Glass)
- PomeloX品牌色彩
- 现代化UI/UX体验
- 原生应用级交互

## ⚡ 性能优化

### 已配置的优化
- 静态页面生成 (SSG)
- 代码分割和懒加载
- 图片优化和缓存
- 构建体积优化 (~105KB首次加载)

## 🧪 测试验证

### 部署后测试清单
- [ ] 页面正常加载
- [ ] 登录功能工作
- [ ] API连接正常
- [ ] QR扫码权限获取
- [ ] 响应式布局适配
- [ ] 跨浏览器兼容性

### 浏览器支持
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ 移动端浏览器

## 📞 技术支持

### 常见问题
1. **QR扫码不工作**: 确保HTTPS配置正确
2. **API连接失败**: 检查CORS和网络配置
3. **页面空白**: 查看浏览器控制台错误

### 日志监控
```bash
# PM2日志查看
pm2 logs pomelox-web

# 实时错误监控
pm2 monit
```

## 🎯 MVP部署建议

**立即可上线**: 此Web版本已完全具备生产环境部署条件，可作为MVP立即上线使用，为App Store审核争取时间。

### 推荐部署流程
1. **测试环境**: 先部署到测试域名验证功能
2. **生产环境**: 确认无误后部署到正式域名
3. **监控配置**: 添加错误监控和性能追踪
4. **用户通知**: 通知用户Web版本上线

**项目已准备完毕，可立即开始部署！**