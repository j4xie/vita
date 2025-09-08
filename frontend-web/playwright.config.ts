import { defineConfig, devices } from '@playwright/test';

/**
 * PomeloX 网页端 Playwright 配置
 * 支持实时监控、错误追踪和自动化测试
 */
export default defineConfig({
  // 测试文件目录
  testDir: './tests',
  
  // 全局超时设置
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
  
  // 失败重试次数
  retries: 2,
  
  // 并行工作线程数
  workers: 1,
  
  // 输出目录
  outputDir: 'test-results/',
  
  // 报告格式
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line']
  ],
  
  // 全局测试配置
  use: {
    // 基础URL - 测试页面地址
    baseURL: 'http://localhost:8081',
    
    // 浏览器设置
    headless: false, // 显示浏览器窗口便于监控
    viewport: { width: 1280, height: 720 },
    
    // 网络和等待设置
    actionTimeout: 0,
    navigationTimeout: 30 * 1000,
    
    // 录制设置
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    
    // 忽略HTTPS错误（用于开发环境）
    ignoreHTTPSErrors: true,
    
    // 接受下载
    acceptDownloads: true,
    
    // 额外的浏览器上下文选项
    contextOptions: {
      // 权限设置 - Chromium only
      permissions: ['geolocation'],
      
      // 模拟移动设备（测试响应式设计）
      // userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      
      // 时区设置
      timezoneId: 'Asia/Shanghai',
      locale: 'zh-CN',
      
      // 设备像素比
      deviceScaleFactor: 1,
    },
  },

  // 多项目配置 - 支持不同浏览器和设备
  projects: [
    // 桌面浏览器测试
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // 开启控制台日志捕获
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--enable-logging',
            '--v=1'
          ],
        },
      },
    },
    
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'security.tls.insecure_fallback_hosts': 'localhost',
            'network.stricttransportsecurity.preloadlist': false,
          },
        },
      },
    },
    
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },

    // 移动设备测试
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // 移动设备特定设置
        hasTouch: true,
        isMobile: true,
      },
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        hasTouch: true,
        isMobile: true,
      },
    },

    // 监控专用配置
    {
      name: 'monitor-mode',
      use: {
        ...devices['Desktop Chrome'],
        // 监控模式特定设置
        headless: false,
        screenshot: 'on',
        video: 'on',
        trace: 'on',
        
        // 启用所有日志级别
        launchOptions: {
          args: [
            '--enable-logging',
            '--v=2',
            '--enable-automation',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--keep-alive-for-test',
          ],
        },
      },
      testMatch: '**/monitoring/**/*.spec.ts',
    },
  ],

  // 不需要启动服务器，使用本地HTML文件

  // 全局设置钩子
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});