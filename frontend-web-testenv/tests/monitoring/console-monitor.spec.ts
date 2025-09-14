import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * PomeloX 实时控制台监控器
 * 捕获并记录所有浏览器控制台输出，包括日志、警告、错误等
 */

interface ConsoleMessage {
  timestamp: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  url?: string;
  lineNumber?: number;
  stackTrace?: string;
}

interface MonitoringSession {
  sessionId: string;
  startTime: string;
  messages: ConsoleMessage[];
  stats: {
    totalMessages: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    logCount: number;
  };
}

class ConsoleMonitor {
  private session: MonitoringSession;
  private logFile: string;
  
  constructor() {
    this.session = {
      sessionId: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      messages: [],
      stats: {
        totalMessages: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        logCount: 0,
      }
    };
    
    this.logFile = path.join(process.cwd(), 'monitoring-logs', `console-${this.session.sessionId}.json`);
  }
  
  /**
   * 开始监控页面控制台
   */
  async startMonitoring(page: Page) {
    console.log(`🔍 开始控制台监控 - 会话 ID: ${this.session.sessionId}`);
    
    // 监听所有控制台消息
    page.on('console', (msg) => {
      const message: ConsoleMessage = {
        timestamp: new Date().toISOString(),
        type: msg.type() as ConsoleMessage['type'],
        text: msg.text(),
        url: msg.location()?.url,
        lineNumber: msg.location()?.lineNumber,
      };
      
      // 如果是错误消息，尝试获取堆栈跟踪
      if (msg.type() === 'error') {
        try {
          const args = msg.args();
          if (args.length > 0) {
            // 尝试获取错误对象的堆栈信息
            args[0].jsonValue().then((errorObj: any) => {
              if (errorObj && errorObj.stack) {
                message.stackTrace = errorObj.stack;
              }
            }).catch(() => {
              // 忽略堆栈获取失败
            });
          }
        } catch (error) {
          // 忽略堆栈获取错误
        }
      }
      
      this.addMessage(message);
      this.displayMessage(message);
    });
    
    // 监听页面错误（未捕获的JavaScript错误）
    page.on('pageerror', (error) => {
      const message: ConsoleMessage = {
        timestamp: new Date().toISOString(),
        type: 'error',
        text: `Uncaught Error: ${error.message}`,
        stackTrace: error.stack,
      };
      
      this.addMessage(message);
      this.displayMessage(message);
    });
    
    // 监听响应错误（网络请求失败）
    page.on('response', (response) => {
      if (response.status() >= 400) {
        const message: ConsoleMessage = {
          timestamp: new Date().toISOString(),
          type: 'error',
          text: `HTTP ${response.status()}: ${response.url()}`,
          url: response.url(),
        };
        
        this.addMessage(message);
        this.displayMessage(message);
      }
    });
    
    // 监听请求失败
    page.on('requestfailed', (request) => {
      const message: ConsoleMessage = {
        timestamp: new Date().toISOString(),
        type: 'error',
        text: `Request Failed: ${request.url()} - ${request.failure()?.errorText}`,
        url: request.url(),
      };
      
      this.addMessage(message);
      this.displayMessage(message);
    });
  }
  
  /**
   * 添加消息到监控会话
   */
  private addMessage(message: ConsoleMessage) {
    this.session.messages.push(message);
    this.session.stats.totalMessages++;
    
    switch (message.type) {
      case 'error':
        this.session.stats.errorCount++;
        break;
      case 'warn':
        this.session.stats.warningCount++;
        break;
      case 'info':
        this.session.stats.infoCount++;
        break;
      case 'log':
        this.session.stats.logCount++;
        break;
    }
  }
  
  /**
   * 显示消息到控制台（带颜色格式化）
   */
  private displayMessage(message: ConsoleMessage) {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const location = message.url ? ` (${path.basename(message.url)}:${message.lineNumber || 0})` : '';
    
    switch (message.type) {
      case 'error':
        console.error(`🔴 [${timestamp}] ERROR: ${message.text}${location}`);
        if (message.stackTrace) {
          console.error(`   Stack: ${message.stackTrace.split('\n')[0]}`);
        }
        break;
      case 'warn':
        console.warn(`🟡 [${timestamp}] WARN: ${message.text}${location}`);
        break;
      case 'info':
        console.info(`🔵 [${timestamp}] INFO: ${message.text}${location}`);
        break;
      case 'log':
        console.log(`⚪ [${timestamp}] LOG: ${message.text}${location}`);
        break;
      default:
        console.log(`⚪ [${timestamp}] ${message.type.toUpperCase()}: ${message.text}${location}`);
    }
  }
  
  /**
   * 保存监控会话数据
   */
  async saveSession() {
    try {
      await fs.promises.writeFile(this.logFile, JSON.stringify(this.session, null, 2));
      console.log(`💾 控制台监控数据已保存: ${this.logFile}`);
    } catch (error) {
      console.error('❌ 保存监控数据失败:', error);
    }
  }
  
  /**
   * 获取监控统计信息
   */
  getStats() {
    return this.session.stats;
  }
  
  /**
   * 获取错误消息列表
   */
  getErrors(): ConsoleMessage[] {
    return this.session.messages.filter(msg => msg.type === 'error');
  }
  
  /**
   * 获取警告消息列表
   */
  getWarnings(): ConsoleMessage[] {
    return this.session.messages.filter(msg => msg.type === 'warn');
  }
}

// 测试套件：实时控制台监控
test.describe('PomeloX 实时控制台监控', () => {
  let monitor: ConsoleMonitor;
  
  test.beforeEach(async () => {
    monitor = new ConsoleMonitor();
  });
  
  test.afterEach(async () => {
    if (monitor) {
      await monitor.saveSession();
      
      // 输出监控统计信息
      const stats = monitor.getStats();
      console.log('📊 控制台监控统计:');
      console.log(`   总消息数: ${stats.totalMessages}`);
      console.log(`   错误: ${stats.errorCount}`);
      console.log(`   警告: ${stats.warningCount}`);
      console.log(`   信息: ${stats.infoCount}`);
      console.log(`   日志: ${stats.logCount}`);
      
      // 如果有错误，列出前3个
      const errors = monitor.getErrors();
      if (errors.length > 0) {
        console.log('🔴 发现错误:');
        errors.slice(0, 3).forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.text}`);
        });
        if (errors.length > 3) {
          console.log(`   ... 还有 ${errors.length - 3} 个错误`);
        }
      }
    }
  });
  
  test('监控应用加载过程', async ({ page }) => {
    await monitor.startMonitoring(page);
    
    console.log('🚀 开始监控 PomeloX 应用加载...');
    
    // 访问测试页面
    await page.goto('/test-simple.html');
    
    // 等待页面完全加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/PomeloX|pomelo/i);
    
    // 等待一段时间以捕获更多控制台消息
    await page.waitForTimeout(3000);
    
    const stats = monitor.getStats();
    console.log(`✅ 应用加载监控完成，共捕获 ${stats.totalMessages} 条消息`);
    
    // 如果有错误，测试失败
    if (stats.errorCount > 0) {
      const errors = monitor.getErrors();
      console.error(`❌ 发现 ${stats.errorCount} 个错误:`);
      errors.forEach(error => {
        console.error(`   - ${error.text}`);
      });
    }
    
    // 验证关键功能是否正常（没有严重错误）
    expect(stats.errorCount).toBeLessThan(5); // 允许少量非关键错误
  });
  
  test('监控用户交互过程', async ({ page }) => {
    await monitor.startMonitoring(page);
    
    console.log('👆 开始监控用户交互过程...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 模拟用户浏览活动
    try {
      // 查找活动卡片
      const activityCards = page.locator('[data-testid*=\"activity\"], .activity-card, [class*=\"activity\"]').first();
      
      if (await activityCards.isVisible()) {
        console.log('🎯 点击活动卡片...');
        await activityCards.click();
        await page.waitForTimeout(2000);
        
        // 尝试返回
        await page.goBack();
        await page.waitForTimeout(1000);
      }
      
      // 尝试搜索功能
      const searchInput = page.locator('input[type=\"text\"], input[placeholder*=\"搜索\"], input[placeholder*=\"search\"]').first();
      
      if (await searchInput.isVisible()) {
        console.log('🔍 测试搜索功能...');
        await searchInput.fill('活动');
        await page.waitForTimeout(1000);
        await searchInput.clear();
      }
      
    } catch (error) {
      console.log('⚠️  交互测试部分失败，但继续监控:', error.message);
    }
    
    await page.waitForTimeout(2000);
    
    const stats = monitor.getStats();
    console.log(`✅ 用户交互监控完成，共捕获 ${stats.totalMessages} 条消息`);
    
    // 交互过程中出现的错误应该更少
    expect(stats.errorCount).toBeLessThan(3);
  });
  
  test('监控API调用过程', async ({ page }) => {
    await monitor.startMonitoring(page);
    
    console.log('🌐 开始监控API调用过程...');
    
    // 监听网络请求
    const apiRequests: any[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('api') || url.includes('vitaglobal.icu')) {
        apiRequests.push({
          method: request.method(),
          url: url,
          timestamp: new Date().toISOString(),
        });
        console.log(`📡 API请求: ${request.method()} ${url}`);
      }
    });
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('api') || url.includes('vitaglobal.icu')) {
        console.log(`📨 API响应: ${response.status()} ${url}`);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 等待API调用完成
    await page.waitForTimeout(5000);
    
    const stats = monitor.getStats();
    console.log(`✅ API监控完成，共捕获 ${stats.totalMessages} 条消息，${apiRequests.length} 个API请求`);
    
    // 记录API请求信息
    if (apiRequests.length > 0) {
      console.log('📋 API请求详情:');
      apiRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.url}`);
      });
    }
  });
  
  test('长时间监控测试', async ({ page }) => {
    await monitor.startMonitoring(page);
    
    console.log('⏰ 开始长时间监控测试（30秒）...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 模拟用户长时间使用应用
    const duration = 30000; // 30秒
    const interval = 3000;   // 每3秒一次操作
    const iterations = Math.floor(duration / interval);
    
    for (let i = 0; i < iterations; i++) {
      try {
        // 随机执行一些操作
        const actions = [
          () => page.reload(),
          () => page.goBack().catch(() => {}),
          () => page.mouse.move(Math.random() * 800, Math.random() * 600),
          () => page.keyboard.press('Tab'),
        ];
        
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        await randomAction();
        
        console.log(`⏳ 监控进度: ${i + 1}/${iterations} (${Math.round((i + 1) / iterations * 100)}%)`);
        
      } catch (error) {
        // 忽略操作错误，继续监控
      }
      
      await page.waitForTimeout(interval);
    }
    
    const stats = monitor.getStats();
    console.log(`✅ 长时间监控完成，共捕获 ${stats.totalMessages} 条消息`);
    
    // 长时间运行不应该有内存泄漏相关的错误
    const memoryErrors = monitor.getErrors().filter(error => 
      error.text.toLowerCase().includes('memory') || 
      error.text.toLowerCase().includes('heap') ||
      error.text.toLowerCase().includes('leak')
    );
    
    expect(memoryErrors.length).toBe(0);
  });
});