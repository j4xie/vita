#!/usr/bin/env node

const { chromium } = require('playwright');

async function checkExtensionStatus() {
  console.log('🚀 检查 MCP 扩展状态...\n');

  const browser = await chromium.launch({ 
    headless: false
  });
  
  const page = await browser.newPage();

  try {
    // 先打开一个正常页面
    console.log('🌐 打开测试页面...');
    await page.goto('https://www.baidu.com');
    await page.waitForLoadState('networkidle');

    // 尝试通过 JavaScript 检查扩展
    const extensionStatus = await page.evaluate(() => {
      // 检查是否有 MCP 相关的全局变量或方法
      const checks = {
        windowMCP: typeof window.mcp !== 'undefined',
        hasPlaywrightMCP: typeof window.playwright !== 'undefined',
        hasExtensions: window.chrome && window.chrome.runtime,
        timestamp: new Date().toISOString()
      };
      
      return checks;
    });

    console.log('🔍 扩展检查结果:');
    console.log(JSON.stringify(extensionStatus, null, 2));

    // 截图当前状态
    console.log('\n📸 截取当前页面状态...');
    await page.screenshot({ 
      path: 'browser-extension-check.png', 
      fullPage: true 
    });
    console.log('✅ 截图已保存: browser-extension-check.png');

    // 尝试打开扩展管理页面
    console.log('\n🔧 尝试访问扩展管理页面...');
    try {
      await page.goto('chrome://extensions/');
      await page.waitForTimeout(2000);
      
      const extensionsPageContent = await page.textContent('body').catch(() => '无法获取内容');
      
      if (extensionsPageContent.includes('Playwright') || extensionsPageContent.includes('MCP')) {
        console.log('✅ 在扩展管理页面找到了 Playwright/MCP 相关扩展');
      } else {
        console.log('❓ 未在扩展管理页面找到明确的 Playwright/MCP 信息');
      }
      
      await page.screenshot({ path: 'extensions-page.png' });
      console.log('📸 扩展管理页面截图已保存: extensions-page.png');
      
    } catch (error) {
      console.log('⚠️  无法访问扩展管理页面（正常限制）');
    }

    console.log('\n⏱️  等待 3 秒供观察...');
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 检查完成！');
  }
}

checkExtensionStatus();
