#!/usr/bin/env node

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class BrowserTools {
  constructor(browserType = 'chromium') {
    this.browser = null;
    this.page = null;
    this.browserType = browserType;
    this.consoleLogs = [];
  }

  async init() {
    // 选择浏览器类型
    const browserEngine = {
      'chromium': chromium,
      'firefox': firefox,
      'webkit': webkit
    }[this.browserType] || chromium;

    this.browser = await browserEngine.launch({
      headless: false,
      // 对于 macOS 上的 Chrome
      executablePath: this.browserType === 'chromium' ? 
        '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome' : undefined
    });
    
    this.page = await this.browser.newPage();
    
    // 监听控制台日志
    this.page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      this.consoleLogs.push(logEntry);
      console.log(`CONSOLE [${msg.type()}]:`, msg.text());
    });

    // 监听页面错误
    this.page.on('pageerror', error => {
      const errorEntry = {
        type: 'error',
        text: error.message,
        timestamp: new Date().toISOString()
      };
      this.consoleLogs.push(errorEntry);
      console.log('PAGE ERROR:', error.message);
    });
  }

  async navigate(url) {
    if (!this.page) await this.init();
    await this.page.goto(url);
    console.log(`已导航到: ${url}`);
  }

  async screenshot(filename = 'screenshot.png') {
    if (!this.page) throw new Error('请先导航到一个页面');
    
    const screenshotPath = path.join(process.cwd(), filename);
    await this.page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`截图已保存: ${screenshotPath}`);
    return screenshotPath;
  }

  async getConsoleLogs() {
    if (!this.page) throw new Error('请先导航到一个页面');
    
    // 返回已收集的控制台日志
    return this.consoleLogs;
  }

  async clearConsoleLogs() {
    this.consoleLogs = [];
  }

  async waitForSelector(selector, timeout = 30000) {
    if (!this.page) throw new Error('请先导航到一个页面');
    return await this.page.waitForSelector(selector, { timeout });
  }

  async click(selector) {
    if (!this.page) throw new Error('请先导航到一个页面');
    await this.page.click(selector);
    console.log(`已点击: ${selector}`);
  }

  async type(selector, text) {
    if (!this.page) throw new Error('请先导航到一个页面');
    await this.page.fill(selector, text);
    console.log(`已输入文本到 ${selector}: ${text}`);
  }

  async getPageInfo() {
    if (!this.page) throw new Error('请先导航到一个页面');
    
    const info = await this.page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      userAgent: navigator.userAgent
    }));
    return info;
  }

  async executeScript(script) {
    if (!this.page) throw new Error('请先导航到一个页面');
    return await this.page.evaluate(script);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI 使用
async function main() {
  const tools = new BrowserTools();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'navigate':
        await tools.navigate(args[0]);
        break;
      case 'screenshot':
        await tools.screenshot(args[0]);
        break;
      case 'console':
        const logs = await tools.getConsoleLogs();
        console.log('控制台日志:', JSON.stringify(logs, null, 2));
        break;
      case 'script':
        const result = await tools.executeScript(args[0]);
        console.log('脚本执行结果:', result);
        break;
      case 'click':
        await tools.click(args[0]);
        break;
      case 'type':
        await tools.type(args[0], args[1]);
        break;
      case 'info':
        const info = await tools.getPageInfo();
        console.log('页面信息:', JSON.stringify(info, null, 2));
        break;
      default:
        console.log('使用方法:');
        console.log('  node browser-tools.js navigate <url>');
        console.log('  node browser-tools.js screenshot [filename]');
        console.log('  node browser-tools.js console');
        console.log('  node browser-tools.js script "<JavaScript代码>"');
        console.log('  node browser-tools.js click <selector>');
        console.log('  node browser-tools.js type <selector> <text>');
        console.log('  node browser-tools.js info');
    }
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await tools.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = BrowserTools;
