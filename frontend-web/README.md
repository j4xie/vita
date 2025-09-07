# PomeloX 网页端实时监控方案

![PomeloX Logo](https://img.shields.io/badge/PomeloX-监控系统-orange) ![Playwright](https://img.shields.io/badge/Playwright-Latest-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue)

这是一个基于 **Playwright** 的完整网页端实时监控解决方案，专门为 PomeloX 应用设计，提供控制台监控、错误追踪、性能分析和自动化测试功能。

## 🚀 功能特性

### 📊 实时监控
- **控制台监控**: 捕获所有 console.log、warn、error 消息
- **错误追踪**: JavaScript错误、网络错误、CORS错误等全面追踪
- **性能监控**: Web Vitals、内存使用、网络请求性能分析
- **用户交互监控**: 点击、输入、导航等用户行为追踪

### 🛠️ 自动化测试
- **端到端测试**: 活动流程、用户认证完整测试
- **多浏览器支持**: Chrome、Firefox、Safari 兼容性测试
- **移动端测试**: 响应式设计和移动端体验测试
- **API集成测试**: 后端接口调用验证

### 🎭 可视化面板
- **实时监控面板**: 美观的实时数据可视化界面
- **性能指标**: 加载时间、内存使用、错误统计
- **日志查看器**: 实时日志流和历史记录
- **测试结果**: 自动化测试执行结果和报告

## 📁 项目结构

```
frontend-web/
├── playwright.config.ts          # Playwright 配置
├── monitor-dashboard.html         # 监控面板界面
├── test-simple.html              # 测试用页面
├── tests/
│   ├── global-setup.ts           # 全局设置
│   ├── global-teardown.ts        # 全局清理
│   ├── monitoring/               # 监控测试套件
│   │   ├── console-monitor.spec.ts    # 控制台监控
│   │   ├── error-tracker.spec.ts      # 错误追踪
│   │   └── performance-monitor.spec.ts # 性能监控
│   ├── e2e/                     # 端到端测试
│   │   ├── activity-flow.spec.ts      # 活动流程测试
│   │   └── auth-flow.spec.ts          # 认证流程测试
│   └── utils/                   # 测试工具
│       └── test-helpers.ts            # 测试辅助函数
├── monitoring-logs/             # 监控日志存储
├── performance-data/            # 性能数据存储
├── screenshots/                 # 错误截图
└── test-results/               # 测试结果输出
```

## 🎯 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
cd frontend-web
npm install
```

### 运行监控测试
```bash
# 运行所有测试
npm test

# 运行特定监控测试
npm run test:console     # 控制台监控
npm run test:errors      # 错误追踪
npm run test:performance # 性能监控

# 运行端到端测试
npm run test:activities  # 活动流程测试
npm run test:auth       # 认证流程测试
```

### 启动监控面板
```bash
# 运行监控并打开面板
npm run monitor:start

# 仅打开监控面板
npm run monitor:dashboard
```

## 📊 监控功能详解

### 1. 控制台监控 (Console Monitor)

实时捕获和分析浏览器控制台输出：

**功能特性:**
- ✅ 实时日志捕获 (log, info, warn, error)
- ✅ 错误堆栈追踪
- ✅ 网络请求失败监控
- ✅ 未处理Promise错误捕获
- ✅ 统计报告生成

**使用示例:**
```bash
npm run test:console
```

### 2. 错误追踪 (Error Tracker)

专业的错误追踪和分析系统：

**错误类型覆盖:**
- 🐛 JavaScript 运行时错误
- 🌐 网络请求错误 (404, 500, 超时等)
- 🔒 安全错误 (CORS, CSP等)
- ⚡ 未处理的Promise拒绝
- 📦 资源加载失败

**自动功能:**
- 错误严重程度分类 (Critical, High, Medium, Low)
- 自动截图保存 (严重错误)
- 错误上下文信息收集
- 详细报告生成

### 3. 性能监控 (Performance Monitor)

全面的Web性能分析工具：

**监控指标:**
- ⚡ Web Vitals (FCP, LCP, CLS, FID)
- 🧠 内存使用监控
- 🌐 网络请求分析
- 📊 性能评分系统
- 📈 性能趋势分析

**优化建议:**
- 自动性能审计
- 大型资源检测
- 重复请求识别
- 未使用代码分析
- Critical Resource Hints 检查

### 4. 端到端测试 (E2E Testing)

完整的用户流程测试：

**测试覆盖:**
- 📱 活动浏览和报名流程
- 🔐 用户登录注册流程
- 🔍 搜索和筛选功能
- 📱 响应式设计测试
- ♿ 无障碍功能测试

## 🎭 监控面板使用指南

### 面板功能
1. **实时状态**: 当前监控状态和会话信息
2. **性能指标**: 页面加载时间、FCP、LCP等
3. **错误统计**: JavaScript错误、网络错误统计
4. **网络活动**: 请求数量、响应时间、传输量
5. **用户体验**: 交互响应时间、稳定性评分
6. **测试结果**: 自动化测试通过率和覆盖率

### 操作按钮
- 🚀 **开始监控**: 启动实时监控
- ⏸️ **暂停监控**: 暂停数据收集
- 🗑️ **清除日志**: 清理历史日志
- 📊 **导出数据**: 导出监控数据为JSON
- 🧪 **运行测试**: 执行自动化测试套件

### 实时日志
- 🔴 错误信息 (红色背景)
- 🟡 警告信息 (橙色背景)
- 🔵 普通信息 (蓝色背景)
- 🟢 成功信息 (绿色背景)

## 🔧 高级配置

### Playwright 配置 (playwright.config.ts)

```typescript
export default defineConfig({
  // 测试超时
  timeout: 30 * 1000,
  
  // 失败重试
  retries: 2,
  
  // 浏览器配置
  use: {
    headless: false,  // 显示浏览器窗口
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  
  // 多项目支持
  projects: [
    { name: 'chromium-desktop' },
    { name: 'firefox-desktop' },
    { name: 'webkit-desktop' },
    { name: 'mobile-chrome' },
    { name: 'mobile-safari' },
    { name: 'monitor-mode' },  // 专用监控模式
  ],
});
```

### 自定义监控器

创建自定义监控器：

```typescript
import { ConsoleMonitor } from './tests/monitoring/console-monitor.spec.ts';

const monitor = new ConsoleMonitor();
await monitor.startMonitoring(page);

// 获取统计信息
const stats = monitor.getStats();
console.log(`错误数: ${stats.errorCount}`);

// 获取错误列表
const errors = monitor.getErrors();
errors.forEach(error => {
  console.log(`错误: ${error.text}`);
});
```

## 🔍 Browser Tools 集成潜力

考虑到你提到的 **Browser Tools**，这个监控方案也可以很容易地集成其他浏览器自动化工具：

### 可集成工具:
- **Puppeteer**: 更底层的Chrome DevTools协议控制
- **Selenium**: 跨浏览器WebDriver支持
- **Cypress**: 开发者友好的测试工具
- **WebDriver.IO**: 功能丰富的自动化框架

### Browser Tools 优势:
- 🛠️ 直接访问 Chrome DevTools API
- 📱 移动端调试支持
- 🔍 更细粒度的网络控制
- 📊 原生性能分析工具

## 📈 报告和分析

### 自动生成报告
```bash
# 生成HTML报告
npx playwright show-report

# 生成JSON数据
npm run test -- --reporter=json
```

### 数据导出格式
```json
{
  "session": {
    "start": "2025-09-06T16:30:00.000Z",
    "duration": "00:05:30",
    "status": "completed"
  },
  "metrics": {
    "performance": {...},
    "errors": [...],
    "requests": [...]
  },
  "summary": {
    "totalErrors": 3,
    "performanceScore": 85,
    "testsPassed": 12,
    "testsFailed": 1
  }
}
```

## 🚨 故障排除

### 常见问题

1. **浏览器启动失败**
   ```bash
   npx playwright install
   ```

2. **权限错误 (Firefox)**
   - Firefox不支持某些Chrome特定权限
   - 使用 `--project=chromium-desktop` 限制测试

3. **文件路径问题**
   - 确保使用绝对路径或正确的相对路径
   - 检查 `baseURL` 配置

4. **测试超时**
   - 增加 `timeout` 配置
   - 使用 `--timeout=60000` 参数

### 调试模式
```bash
# 调试模式运行
npm run test:debug

# 查看测试UI
npm run test:ui

# 显示浏览器窗口
npm run test:headed
```

## 🎉 总结

这个 PomeloX 网页端监控方案提供了：

✅ **完整的监控覆盖**: 控制台、错误、性能、用户行为  
✅ **企业级测试框架**: 多浏览器、多设备、多场景  
✅ **美观的可视化面板**: 实时数据展示和交互  
✅ **灵活的扩展性**: 支持自定义监控器和测试  
✅ **生产就绪**: 稳定可靠的监控和测试解决方案  

这个方案与 **Browser Tools** 可以很好地互补，提供更全面的网页端监控和测试能力。

---

**需要帮助或有问题？**  
- 📧 查看测试报告: `npx playwright show-report`
- 🔧 配置参考: `playwright.config.ts`  
- 📊 监控面板: `monitor-dashboard.html`  
- 🧪 测试工具: `tests/utils/test-helpers.ts`

享受你的 PomeloX 监控体验！🎭✨