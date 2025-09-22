# 🚀 PomeloX 开发服务器管理指南

## 📋 目录
- [常见问题](#常见问题)
- [管理命令](#管理命令)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 🔥 常见问题

### Q: 为什么会出现多个开发服务器？
**原因:**
1. **端口冲突**: 前一个服务器未完全关闭，新服务器自动选择其他端口
2. **缓存问题**: Metro bundler 缓存导致多个实例
3. **进程残留**: Expo 或 Metro 进程在后台继续运行
4. **IDE重复启动**: VS Code 等IDE的集成终端可能启动多个实例

### Q: 如何完全清理开发环境？
使用我们提供的管理工具！

## 🛠️ 管理命令

### 新增的 npm 脚本
```bash
# 检查端口占用情况
npm run dev:check

# 清理所有开发服务器并启动新的
npm run dev:clean

# 启动干净的开发服务器
npm run dev

# 快速重启（清理+启动）
npm run dev:restart
```

### 直接使用脚本
```bash
# 使用 Shell 脚本
./scripts/dev-server-manager.sh check     # 检查端口
./scripts/dev-server-manager.sh cleanup   # 清理进程
./scripts/dev-server-manager.sh start     # 启动服务器
./scripts/dev-server-manager.sh restart   # 重启

# 使用 Node.js 脚本
node scripts/port-check.js check          # 检查端口占用
node scripts/port-check.js clean          # 清理占用的端口
node scripts/port-check.js restart        # 清理并准备重启
```

## ✅ 最佳实践

### 1. 开发前必做检查
```bash
# 每次开始开发前运行
npm run dev:check
```

### 2. 正确的启动流程
```bash
# 推荐方式：清理后启动
npm run dev:clean

# 或者使用一步到位的命令
npm run dev:restart
```

### 3. 工作结束后清理
```bash
# 结束工作时清理环境
npm run dev:check
# 如果有占用的端口，运行清理
npm run dev:clean
```

### 4. IDE 设置建议
- **VS Code**: 使用内置终端，避免同时开启多个终端窗口
- **WebStorm**: 配置启动脚本使用我们的管理命令
- **终端**: 推荐使用一个专门的终端窗口进行开发服务器管理

## 🚨 故障排除

### 问题: 端口被占用
```bash
# 症状: Error: listen EADDRINUSE: address already in use :::8081
# 解决: 
npm run dev:check    # 查看占用情况
npm run dev:clean    # 清理占用的端口
npm run dev          # 重新启动
```

### 问题: 多个服务器同时运行
```bash
# 症状: Expo 开发工具显示多个服务器选项
# 解决:
./scripts/dev-server-manager.sh cleanup  # 清理所有服务器
./scripts/dev-server-manager.sh start    # 启动单个服务器
```

### 问题: Metro bundler 卡死
```bash
# 症状: 打包进程无响应
# 解决:
npm run dev:restart   # 强制重启所有相关进程
```

### 问题: 缓存导致的问题
```bash
# 症状: 代码更改未生效
# 解决:
npx expo start --clear   # 清除缓存启动
# 或者
npm run dev:clean        # 使用我们的清理脚本
```

## 📊 端口使用说明

### 默认端口分配
- **8081**: 主要 Expo 开发服务器
- **8082-8085**: 备用端口（自动分配）
- **19000-19002**: Expo 传统端口

### 检查端口占用
```bash
# 检查特定端口
lsof -i :8081

# 检查所有相关端口
npm run dev:check
```

### 手动清理特定端口
```bash
# 清理单个端口
lsof -ti:8081 | xargs kill -9

# 清理多个端口
npm run dev:clean
```

## 🎯 开发工作流建议

### 标准工作流
1. **开始工作**:
   ```bash
   npm run dev:check     # 检查环境
   npm run dev:clean     # 启动干净的服务器
   ```

2. **开发过程中**:
   - 遇到问题时使用 `npm run dev:restart` 快速重启
   - 定期检查是否有多余的进程

3. **结束工作**:
   ```bash
   npm run dev:check     # 检查是否有残留进程
   # 如果需要，运行清理命令
   ```

### 团队协作建议
- **统一使用**这些管理脚本
- **PR 中包含**开发服务器相关的更改说明
- **文档更新**时同时更新管理脚本

## 🔧 高级配置

### 自定义端口
```bash
# 指定端口启动
npx expo start --port 8088

# 修改默认端口（在脚本中）
# 编辑 scripts/dev-server-manager.sh
```

### 环境变量
```bash
# 设置开发环境变量
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export EXPO_METRO_CACHE_KEY_VERSION=1
```

## 📝 脚本维护

### 更新管理脚本
管理脚本位于：
- `scripts/dev-server-manager.sh` - Shell 版本
- `scripts/port-check.js` - Node.js 版本

### 添加新功能
可以在脚本中添加：
- 自动检测和处理特定错误
- 集成其他开发工具
- 性能监控功能

---

**记住**: 当遇到开发服务器问题时，首先尝试 `npm run dev:restart` 🚀