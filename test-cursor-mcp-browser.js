#!/usr/bin/env node

const { chromium } = require('playwright');

async function testCursorMCPBrowser() {
  console.log('🎯 测试 Cursor MCP 浏览器扩展连接...\n');

  const browser = await chromium.launch({
    headless: false,
    // 尝试使用系统默认浏览器或Chrome
    executablePath: '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome'
  });
  
  const page = await browser.newPage();

  try {
    // 监听所有的控制台消息和事件
    page.on('console', msg => {
      console.log(`🖥️  CONSOLE [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      console.log('❌ PAGE ERROR:', error.message);
    });

    // 监听网络请求，看是否有MCP相关的请求
    page.on('request', request => {
      const url = request.url();
      if (url.includes('mcp') || url.includes('cursor') || url.includes('localhost')) {
        console.log('🌐 Network request:', url);
      }
    });

    console.log('🌐 打开测试页面...');
    await page.goto('https://www.example.com');
    await page.waitForLoadState('networkidle');

    // 尝试注入MCP测试代码
    console.log('🔧 注入 MCP 测试代码...');
    const mcpTestResult = await page.evaluate(() => {
      // 创建一个全局的MCP测试对象
      window.mcpTest = {
        startTime: new Date().toISOString(),
        attempts: []
      };

      // 尝试各种可能的MCP连接方式
      const testAttempts = [];

      // 1. 检查是否有 MCP 相关的全局对象
      testAttempts.push({
        test: 'Global MCP objects',
        result: {
          windowMCP: typeof window.mcp,
          windowMCPTools: typeof window.mcpTools,
          windowCursorMCP: typeof window.cursorMCP,
          windowPlaywright: typeof window.playwright
        }
      });

      // 2. 尝试通过 postMessage 与扩展通信
      try {
        window.postMessage({ type: 'MCP_TEST', source: 'page' }, '*');
        testAttempts.push({
          test: 'PostMessage to extension',
          result: 'Message sent successfully'
        });
      } catch (error) {
        testAttempts.push({
          test: 'PostMessage to extension',
          result: 'Failed: ' + error.message
        });
      }

      // 3. 尝试通过自定义事件与扩展通信
      try {
        const event = new CustomEvent('cursor-mcp-test', {
          detail: { test: true, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
        testAttempts.push({
          test: 'Custom event dispatch',
          result: 'Event dispatched successfully'
        });
      } catch (error) {
        testAttempts.push({
          test: 'Custom event dispatch',
          result: 'Failed: ' + error.message
        });
      }

      // 4. 检查是否有Chrome扩展API
      testAttempts.push({
        test: 'Chrome extension APIs',
        result: {
          chromeRuntime: !!(window.chrome && window.chrome.runtime),
          chromeRuntimeId: window.chrome && window.chrome.runtime && window.chrome.runtime.id
        }
      });

      // 5. 尝试WebSocket连接到本地MCP服务器
      testAttempts.push({
        test: 'WebSocket connection attempt',
        result: 'Will attempt external connection'
      });

      window.mcpTest.attempts = testAttempts;
      return testAttempts;
    });

    console.log('🔍 MCP 测试结果:');
    mcpTestResult.forEach((attempt, index) => {
      console.log(`\n${index + 1}. ${attempt.test}:`);
      console.log(JSON.stringify(attempt.result, null, 2));
    });

    // 尝试连接到本地MCP服务器
    console.log('\n🔗 尝试连接到本地 MCP 服务器...');
    try {
      // 检查常见的MCP端口
      const ports = [3000, 3001, 8000, 8080, 9000];
      for (const port of ports) {
        try {
          console.log(`尝试连接 localhost:${port}...`);
          await page.goto(`http://localhost:${port}`, { timeout: 5000 });
          console.log(`✅ 成功连接到 localhost:${port}`);
          break;
        } catch (error) {
          console.log(`❌ localhost:${port} 连接失败`);
        }
      }
    } catch (error) {
      console.log('❌ 本地服务器连接测试完成');
    }

    // 回到测试页面并设置消息监听器
    await page.goto('https://www.example.com');
    
    // 设置消息监听器等待扩展响应
    console.log('\n📡 设置消息监听器...');
    await page.evaluate(() => {
      // 监听来自扩展的消息
      window.addEventListener('message', (event) => {
        if (event.data && event.data.source === 'cursor-mcp-extension') {
          console.log('🎉 收到来自 Cursor MCP 扩展的消息:', event.data);
          window.mcpExtensionResponse = event.data;
        }
      });

      // 监听自定义事件
      window.addEventListener('cursor-mcp-response', (event) => {
        console.log('🎉 收到 Cursor MCP 响应事件:', event.detail);
        window.mcpEventResponse = event.detail;
      });
    });

    console.log('\n⏰ 等待 5 秒钟查看是否有扩展响应...');
    await page.waitForTimeout(5000);

    // 检查是否有响应
    const finalCheck = await page.evaluate(() => {
      return {
        mcpExtensionResponse: window.mcpExtensionResponse,
        mcpEventResponse: window.mcpEventResponse,
        timestamp: new Date().toISOString()
      };
    });

    console.log('\n📋 最终检查结果:');
    console.log(JSON.stringify(finalCheck, null, 2));

    // 截图保存当前状态
    console.log('\n📸 保存测试截图...');
    await page.screenshot({ 
      path: 'cursor-mcp-test.png', 
      fullPage: true 
    });
    console.log('✅ 截图已保存: cursor-mcp-test.png');

    console.log('\n🎯 保持浏览器开启 10 秒供手动检查和交互...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Cursor MCP 浏览器测试完成！');
    
    console.log('\n📝 测试总结:');
    console.log('- 检查了常见的 MCP 全局对象');
    console.log('- 尝试了 postMessage 和自定义事件通信');
    console.log('- 检查了 Chrome 扩展 API');
    console.log('- 尝试连接到本地 MCP 服务器');
    console.log('- 设置了消息监听器等待扩展响应');
  }
}

testCursorMCPBrowser();