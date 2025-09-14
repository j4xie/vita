# PomeloX 宝塔自动部署使用指南

## 🎯 **快速开始**

### 安装依赖
```bash
cd frontend-web
npm install
```

### 一键部署命令
```bash
# 部署到测试环境
npm run deploy:test

# 部署到正式环境
npm run deploy:prod

# 快速部署（别名）
npm run deploy:quick
```

## ⚙️ **配置说明**

### 当前配置
- **服务器**: 106.14.165.234:8888
- **API密钥**: rbxLQQr0qDBvwcbOxZt9VVPJvy3mIDVN
- **测试环境**: /www/wwwroot/project/test-h5
- **正式环境**: /www/wwwroot/project/h5

### 修改配置
如需修改配置，编辑 `scripts/baota-config.js` 文件：

```javascript
this.panelUrl = 'https://106.14.165.234:8888';
this.apiKey = 'your_api_key_here';
this.deployPaths = {
    test: '/www/wwwroot/project/test-h5',
    prod: '/www/wwwroot/project/h5'
};
```

## 🚀 **部署流程**

自动部署包含以下步骤：

1. **依赖检查** - 验证必需的npm包
2. **项目构建** - 执行 `npm run web:build:prod`
3. **文件验证** - 检查构建文件完整性
4. **文件压缩** - 将dist目录压缩为zip文件
5. **上传文件** - 通过宝塔API上传到服务器
6. **解压部署** - 解压到目标目录
7. **清理临时** - 删除临时文件

## 📁 **文件结构**

```
frontend-web/
├── scripts/
│   ├── baota-config.js      # 宝塔配置
│   ├── baota-api.js         # API调用工具
│   ├── deploy-utils.js      # 部署工具函数
│   └── baota-deploy.js      # 主部署脚本
├── package.json             # 部署命令配置
└── BAOTA_DEPLOY_GUIDE.md    # 使用说明
```

## 🔧 **故障排除**

### 常见错误

**1. 依赖缺失**
```
错误: 缺少必需的依赖包
解决: npm install archiver form-data
```

**2. API认证失败**  
```
错误: 签名验证失败
解决: 检查API密钥和时间戳
```

**3. 文件上传失败**
```
错误: 文件上传超时
解决: 检查网络连接和文件大小
```

**4. 构建文件不存在**
```
错误: 构建目录不存在
解决: 先运行 npm run web:build:prod
```

### IP白名单设置

如果遇到IP访问限制，需要在宝塔面板中添加您的IP到白名单：

1. 登录宝塔面板
2. 设置 → API接口
3. 添加您的IP地址到白名单

## 📊 **使用示例**

### 部署到测试环境
```bash
$ npm run deploy:test

🚀 PomeloX 自动部署工具
📦 目标环境: TEST
==================================================
[17%] 检查依赖完成
[33%] 项目构建完成
[50%] 构建文件验证通过
[67%] 文件压缩完成
[83%] 文件上传完成
[100%] 部署完成
✅ 部署成功！
   环境: TEST, 路径: /www/wwwroot/project/test-h5
```

### 部署到正式环境
```bash
$ npm run deploy:prod

🚀 PomeloX 自动部署工具
📦 目标环境: PROD
==================================================
[部署进度显示...]
✅ 部署成功！
   环境: PROD, 路径: /www/wwwroot/project/h5
```

## 🛡️ **安全特性**

- **API签名验证** - 使用MD5签名确保请求安全
- **IP白名单** - 限制API访问来源
- **临时文件清理** - 自动删除本地和服务器临时文件
- **错误处理** - 完善的错误捕获和提示

## 📞 **技术支持**

- 脚本基于宝塔Linux面板官方API
- 支持zip格式文件上传和解压
- 兼容Expo Web静态构建
- 自动处理文件权限和目录创建

## 🔄 **更新日志**

### v1.0.0 (2025-09-12)
- ✅ 初始版本发布
- ✅ 支持测试/正式环境部署
- ✅ 完整的错误处理和进度显示
- ✅ 自动化构建和文件管理

---

**维护状态**: 生产就绪 ✅  
**最后更新**: 2025-09-12