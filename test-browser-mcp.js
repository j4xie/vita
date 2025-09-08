#!/usr/bin/env node

const BrowserTools = require('./browser-tools.js');

async function testBrowserMCP() {
  const tools = new BrowserTools();
  
  try {
    console.log('🔧 Testing Browser MCP functionality...');
    
    // Test 1: Navigate to PomeloX web app
    console.log('\n1. 导航到 PomeloX 应用...');
    await tools.navigate('http://localhost:8090');
    
    // Wait a moment for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Take screenshot
    console.log('\n2. 截取页面截图...');
    const screenshotPath = await tools.screenshot('mcp-test-screenshot.png');
    console.log('✅ 截图成功:', screenshotPath);
    
    // Test 3: Get page info
    console.log('\n3. 获取页面信息...');
    const pageInfo = await tools.getPageInfo();
    console.log('✅ 页面信息:', JSON.stringify(pageInfo, null, 2));
    
    // Test 4: Check console logs
    console.log('\n4. 检查控制台日志...');
    const consoleLogs = await tools.getConsoleLogs();
    console.log(`✅ 收集到 ${consoleLogs.length} 条日志`);
    
    // Test 5: Try to interact with a simple element (if exists)
    console.log('\n5. 尝试页面交互...');
    try {
      // Look for common elements on the PomeloX app
      const result = await tools.executeScript(() => {
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');
        const inputs = document.querySelectorAll('input');
        
        return {
          buttonsCount: buttons.length,
          linksCount: links.length,
          inputsCount: inputs.length,
          hasLoginForm: !!document.querySelector('input[type="password"]'),
          title: document.title
        };
      });
      console.log('✅ 页面元素统计:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('⚠️ 页面交互测试失败:', error.message);
    }
    
    // Test 6: Navigate to a different page to test navigation
    console.log('\n6. 测试导航功能 - 访问百度...');
    await tools.navigate('https://www.baidu.com');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const baiduScreenshot = await tools.screenshot('baidu-homepage.png');
    console.log('✅ 百度页面截图:', baiduScreenshot);
    
    const baiduInfo = await tools.getPageInfo();
    console.log('✅ 百度页面信息:', JSON.stringify(baiduInfo, null, 2));
    
    console.log('\n🎉 Browser MCP 功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await tools.close();
  }
}

// Run the test
testBrowserMCP();