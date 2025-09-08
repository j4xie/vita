#!/usr/bin/env node

const { chromium } = require('playwright');

async function test() {
  console.log('🚀 测试 Playwright 浏览器工具...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 导航到百度
    console.log('🌐 导航到百度...');
    await page.goto('https://www.baidu.com');
    
    // 截图
    console.log('📸 截图中...');
    await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
    console.log('✅ 截图保存为 test-screenshot.png');

    // 获取页面信息
    const title = await page.title();
    const url = page.url();
    console.log(`📄 页面标题: ${title}`);
    console.log(`🔗 页面URL: ${url}`);

    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
}

test();




