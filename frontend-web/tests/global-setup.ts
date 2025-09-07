import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Playwright 全局设置
 * 在所有测试运行前执行的初始化操作
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 开始 PomeloX 网页端监控设置...');
  
  // 创建必要的目录
  const directories = [
    'test-results',
    'playwright-report', 
    'screenshots',
    'monitoring-logs',
    'performance-data'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 已创建目录: ${dir}`);
    }
  });
  
  // 初始化监控日志文件
  const logFile = path.join(process.cwd(), 'monitoring-logs', 'session.log');
  const sessionStart = new Date().toISOString();
  fs.writeFileSync(logFile, `=== PomeloX 监控会话开始 ${sessionStart} ===\n`);
  
  // 验证开发服务器是否运行
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:8081';
  console.log(`🌐 检查开发服务器: ${baseURL}`);
  
  try {
    // 启动一个临时浏览器实例验证服务器
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // 设置较短的超时时间进行快速检查
    page.setDefaultTimeout(5000);
    
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');
    
    console.log('✅ 开发服务器已就绪');
    await browser.close();
    
  } catch (error) {
    console.error('❌ 开发服务器连接失败:', error.message);
    console.log('💡 请确保运行 npm run web 启动开发服务器');
    // 不抛出错误，让webServer配置自动启动
  }
  
  // 设置环境变量
  process.env.PLAYWRIGHT_MONITORING_SESSION = sessionStart;
  process.env.PLAYWRIGHT_LOG_FILE = logFile;
  
  console.log('🎯 全局设置完成，开始测试和监控...');
}

export default globalSetup;