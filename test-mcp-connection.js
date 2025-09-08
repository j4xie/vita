#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');

async function testMCPConnection() {
  console.log('🔗 测试 MCP 连接和扩展状态...\n');

  // 首先检查配置文件
  console.log('📋 检查 MCP 配置...');
  try {
    const mcpConfig = JSON.parse(fs.readFileSync('./mcp.json', 'utf8'));
    console.log('✅ MCP 配置文件存在');
    console.log(JSON.stringify(mcpConfig, null, 2));
  } catch (error) {
    console.log('❌ MCP 配置文件读取失败:', error.message);
    return;
  }

  const browser = await chromium.launch({
    headless: false,
    // 尝试使用不同的Chrome路径
    executablePath: '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome'
  });
  
  const page = await browser.newPage();

  try {
    // 监听控制台消息
    page.on('console', msg => {
      console.log(`🖥️  CONSOLE [${msg.type()}]:`, msg.text());
    });

    // 监听页面错误
    page.on('pageerror', error => {
      console.log('❌ PAGE ERROR:', error.message);
    });

    console.log('🌐 打开测试页面...');
    await page.goto('https://www.baidu.com');
    await page.waitForLoadState('networkidle');

    // 尝试多种方式检测扩展
    const extensionInfo = await page.evaluate(() => {
      const checks = {
        // MCP 相关检查
        windowMCP: typeof window.mcp,
        mcpTools: typeof window.mcpTools,
        
        // Playwright 相关检查
        windowPlaywright: typeof window.playwright,
        playwrightMCP: typeof window.playwrightMCP,
        
        // Chrome 扩展相关检查
        chromeRuntime: !!(window.chrome && window.chrome.runtime),
        chromeRuntimeId: window.chrome && window.chrome.runtime && window.chrome.runtime.id,
        
        // 其他可能的全局变量
        availableGlobals: Object.getOwnPropertyNames(window).filter(name => 
          name.toLowerCase().includes('mcp') || 
          name.toLowerCase().includes('playwright') ||
          name.toLowerCase().includes('browser')
        ),
        
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      return checks;
    });

    console.log('🔍 详细扩展检查结果:');
    console.log(JSON.stringify(extensionInfo, null, 2));

    // 尝试执行一些可能触发扩展的操作
    console.log('\n🎯 尝试触发扩展功能...');
    
    // 尝试在页面上注入一些代码来测试扩展响应
    await page.evaluate(() => {
      // 发送自定义事件，看是否有扩展响应
      window.dispatchEvent(new CustomEvent('mcpTest', { detail: { test: true } }));
      
      // 尝试访问一些常见的扩展API
      if (window.chrome && window.chrome.runtime) {
        try {
          window.chrome.runtime.sendMessage({type: 'mcp-test'}, response => {
            console.log('Chrome runtime response:', response);
          });
        } catch (e) {
          console.log('Chrome runtime message failed:', e.message);
        }
      }
    });

    // 等待一会看是否有响应
    await page.waitForTimeout(2000);

    // 截图
    console.log('\n📸 保存测试截图...');
    await page.screenshot({ 
      path: 'mcp-connection-test.png', 
      fullPage: true 
    });
    console.log('✅ 截图已保存: mcp-connection-test.png');

    console.log('\n⏱️  保持浏览器开启 5 秒供手动检查...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ MCP 连接测试完成！');
  }
}

testMCPConnection();