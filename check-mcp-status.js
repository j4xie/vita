#!/usr/bin/env node

const { chromium } = require('playwright');

async function checkMCPStatus() {
  console.log('🚀 使用 Playwright 检查 MCP 扩展状态...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 打开 Playwright MCP Bridge Status 页面
    console.log('🌐 导航到 MCP 扩展状态页面...');
    await page.goto('chrome-extension://jakfalbnhgkpmoaakfflbfibfpkailf/status.html');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 截图
    console.log('📸 截取状态页面截图...');
    await page.screenshot({ 
      path: 'mcp-status-check.png', 
      fullPage: true 
    });
    console.log('✅ 截图已保存: mcp-status-check.png');

    // 获取页面文本内容
    const pageText = await page.textContent('body');
    console.log('\n📄 页面内容:');
    console.log(pageText);

    // 检查是否显示连接状态
    if (pageText.includes('MCP client connected') || pageText.includes('connected')) {
      console.log('\n🎉 成功！MCP 客户端已连接！');
    } else if (pageText.includes('No MCP clients are currently connected')) {
      console.log('\n⚠️  MCP 客户端仍未连接，可能需要重启 Cursor IDE');
    } else {
      console.log('\n❓ 状态不确定，请查看截图');
    }

    // 等待 5 秒让用户观察
    console.log('\n⏱️  等待 5 秒供观察...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 检查完成！');
  }
}

checkMCPStatus();


