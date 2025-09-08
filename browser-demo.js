#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');

async function demo() {
  console.log('🚀 启动 Playwright 浏览器工具演示...\n');

  // 启动浏览器
  const browser = await chromium.launch({
    headless: false, // 显示浏览器窗口
  });

  const page = await browser.newPage();
  const consoleLogs = [];

  // 监听控制台日志
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    console.log(`📝 控制台 [${msg.type()}]: ${msg.text()}`);
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.log('❌ 页面错误:', error.message);
  });

  try {
    // 1. 导航到百度
    console.log('🌐 导航到百度首页...');
    await page.goto('https://www.baidu.com');
    await page.waitForLoadState('networkidle');

    // 2. 截图
    console.log('📸 正在截图...');
    const screenshotPath = path.join(process.cwd(), 'baidu-homepage.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`✅ 截图已保存: ${screenshotPath}\n`);

    // 3. 获取页面信息
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      userAgent: navigator.userAgent
    }));
    console.log('📄 页面信息:');
    console.log(`   标题: ${pageInfo.title}`);
    console.log(`   URL: ${pageInfo.url}`);
    console.log(`   用户代理: ${pageInfo.userAgent}\n`);

    // 4. 显示控制台日志
    console.log('📋 控制台日志:');
    consoleLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. [${log.type}] ${log.text}`);
    });

    // 5. 可选：搜索功能演示
    console.log('\n🔍 演示搜索功能...');
    await page.fill('#kw', 'Playwright 自动化测试');
    await page.click('#su');
    await page.waitForLoadState('networkidle');

    // 再次截图
    console.log('📸 搜索结果截图...');
    const searchScreenshotPath = path.join(process.cwd(), 'baidu-search-result.png');
    await page.screenshot({ 
      path: searchScreenshotPath,
      fullPage: true 
    });
    console.log(`✅ 搜索结果截图已保存: ${searchScreenshotPath}`);

    console.log('\n🎉 演示完成！浏览器将在 3 秒后关闭...');
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
  } finally {
    await browser.close();
  }
}

// 运行演示
demo();





