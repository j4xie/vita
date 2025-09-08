const BrowserTools = require('./browser-tools.js');

async function testBrowser() {
  const tools = new BrowserTools();
  
  try {
    console.log('1. 初始化浏览器...');
    await tools.init();
    
    console.log('2. 导航到Google...');
    await tools.navigate('https://www.google.com');
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('3. 截图...');
    const screenshotPath = await tools.screenshot('browser-test-screenshot.png');
    console.log(`截图已保存到: ${screenshotPath}`);
    
    console.log('4. 获取页面信息...');
    const info = await tools.getPageInfo();
    console.log('页面信息:', JSON.stringify(info, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await tools.close();
  }
}

testBrowser();