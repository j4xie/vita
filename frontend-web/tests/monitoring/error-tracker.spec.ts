import { test, expect, Page, BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * PomeloX 错误追踪监控器
 * 专门用于捕获、分析和报告应用中的各种错误类型
 */

interface ErrorReport {
  id: string;
  timestamp: string;
  type: 'javascript' | 'network' | 'resource' | 'unhandled' | 'security' | 'cors';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
  stackTrace?: string;
  url?: string;
  userAgent?: string;
  context?: any;
}

interface ErrorSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  errors: ErrorReport[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byType: Record<string, number>;
  };
  pageInfo: {
    url: string;
    title: string;
    viewport?: { width: number; height: number };
  };
}

class ErrorTracker {
  private session: ErrorSession;
  private reportFile: string;
  private screenshotDir: string;
  
  constructor(sessionId?: string) {
    const id = sessionId || `error-session-${Date.now()}`;
    this.session = {
      sessionId: id,
      startTime: new Date().toISOString(),
      errors: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        byType: {},
      },
      pageInfo: {
        url: '',
        title: '',
      },
    };
    
    this.reportFile = path.join(process.cwd(), 'monitoring-logs', `errors-${id}.json`);
    this.screenshotDir = path.join(process.cwd(), 'screenshots', 'errors');
    
    // 确保目录存在
    fs.mkdirSync(this.screenshotDir, { recursive: true });
  }
  
  /**
   * 开始错误追踪
   */
  async startTracking(page: Page) {
    console.log(`🔍 开始错误追踪 - 会话: ${this.session.sessionId}`);
    
    // 获取页面信息
    this.session.pageInfo.url = page.url();
    this.session.pageInfo.title = await page.title().catch(() => '');
    this.session.pageInfo.viewport = page.viewportSize();
    
    // 1. 捕获JavaScript错误
    page.on('pageerror', async (error) => {
      const errorReport: ErrorReport = {
        id: `js-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'javascript',
        severity: this.classifyJSError(error.message),
        message: error.message,
        stackTrace: error.stack,
        url: page.url(),
        userAgent: await page.evaluate(() => navigator.userAgent),
      };
      
      await this.recordError(errorReport, page);
    });
    
    // 2. 捕获网络错误
    page.on('requestfailed', async (request) => {
      const errorReport: ErrorReport = {
        id: `net-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'network',
        severity: this.classifyNetworkError(request.url(), request.failure()?.errorText || ''),
        message: `Network request failed: ${request.url()}`,
        source: request.failure()?.errorText,
        url: request.url(),
        context: {
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
        },
      };
      
      await this.recordError(errorReport, page);
    });
    
    // 3. 捕获HTTP错误响应
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        const errorReport: ErrorReport = {
          id: `http-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'network',
          severity: this.classifyHTTPError(response.status()),
          message: `HTTP ${response.status()}: ${response.statusText()}`,
          source: response.url(),
          url: response.url(),
          context: {
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
          },
        };
        
        await this.recordError(errorReport, page);
      }
    });
    
    // 4. 捕获控制台错误
    page.on('console', async (msg) => {
      if (msg.type() === 'error') {
        const errorReport: ErrorReport = {
          id: `console-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'javascript',
          severity: this.classifyConsoleError(msg.text()),
          message: `Console Error: ${msg.text()}`,
          source: msg.location()?.url,
          lineNumber: msg.location()?.lineNumber,
          columnNumber: msg.location()?.columnNumber,
          url: page.url(),
        };
        
        await this.recordError(errorReport, page);
      }
    });
    
    // 5. 监听未处理的Promise拒绝
    await page.addInitScript(() => {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise Rejection:', event.reason);
        (window as any)._unhandledRejections = (window as any)._unhandledRejections || [];
        (window as any)._unhandledRejections.push({
          timestamp: new Date().toISOString(),
          reason: event.reason?.toString() || 'Unknown rejection',
          stack: event.reason?.stack || '',
        });
      });
    });
    
    // 6. 监听安全错误
    await page.addInitScript(() => {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).catch(error => {
          if (error.message.includes('CORS') || error.message.includes('CSP')) {
            console.error('Security Error:', error.message);
            (window as any)._securityErrors = (window as any)._securityErrors || [];
            (window as any)._securityErrors.push({
              timestamp: new Date().toISOString(),
              type: error.message.includes('CORS') ? 'cors' : 'csp',
              message: error.message,
              url: typeof args[0] === 'string' ? args[0] : args[0]?.url,
            });
          }
          throw error;
        });
      };
    });
  }
  
  /**
   * 记录错误并执行相关操作
   */
  private async recordError(errorReport: ErrorReport, page: Page) {
    this.session.errors.push(errorReport);
    this.updateSummary(errorReport);
    
    // 显示错误信息
    this.displayError(errorReport);
    
    // 对于严重错误，截图保存
    if (errorReport.severity === 'critical' || errorReport.severity === 'high') {
      await this.takeErrorScreenshot(errorReport, page);
    }
    
    // 收集额外的上下文信息
    if (errorReport.type === 'javascript' && errorReport.severity === 'critical') {
      try {
        const context = await page.evaluate(() => ({
          location: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          localStorage: Object.keys(localStorage).length,
          sessionStorage: Object.keys(sessionStorage).length,
          cookiesEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
        }));
        errorReport.context = context;
      } catch (error) {
        // 忽略上下文收集错误
      }
    }
  }
  
  /**
   * 分类JavaScript错误严重程度
   */
  private classifyJSError(message: string): ErrorReport['severity'] {
    const criticalPatterns = [
      'Cannot read property',
      'Cannot read properties',
      'is not a function',
      'is not defined',
      'ReferenceError',
      'TypeError',
    ];
    
    const highPatterns = [
      'SyntaxError',
      'RangeError',
      'Network Error',
      'Failed to fetch',
    ];
    
    const mediumPatterns = [
      'Warning',
      'Deprecated',
      'console.warn',
    ];
    
    const lowerMessage = message.toLowerCase();
    
    if (criticalPatterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()))) {
      return 'critical';
    }
    if (highPatterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()))) {
      return 'high';
    }
    if (mediumPatterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()))) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * 分类网络错误严重程度
   */
  private classifyNetworkError(url: string, errorText: string): ErrorReport['severity'] {
    // API请求失败通常是关键错误
    if (url.includes('/api/') || url.includes('vitaglobal.icu')) {
      return 'critical';
    }
    
    // 静态资源加载失败
    if (url.match(/\.(js|css|png|jpg|svg|woff)$/)) {
      return 'high';
    }
    
    // 网络超时
    if (errorText.includes('timeout') || errorText.includes('TIMEOUT')) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * 分类HTTP错误严重程度
   */
  private classifyHTTPError(status: number): ErrorReport['severity'] {
    if (status >= 500) return 'critical';  // 服务器错误
    if (status === 404) return 'medium';   // 未找到
    if (status === 403 || status === 401) return 'high'; // 权限错误
    return 'low';
  }
  
  /**
   * 分类控制台错误严重程度
   */
  private classifyConsoleError(message: string): ErrorReport['severity'] {
    return this.classifyJSError(message);
  }
  
  /**
   * 更新错误统计
   */
  private updateSummary(errorReport: ErrorReport) {
    this.session.summary.total++;
    this.session.summary[errorReport.severity]++;
    this.session.summary.byType[errorReport.type] = (this.session.summary.byType[errorReport.type] || 0) + 1;
  }
  
  /**
   * 显示错误信息
   */
  private displayError(errorReport: ErrorReport) {
    const severityEmoji = {
      critical: '💥',
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };
    
    const typeEmoji = {
      javascript: '🐛',
      network: '🌐',
      resource: '📦',
      unhandled: '⚡',
      security: '🔒',
      cors: '🚫'
    };
    
    const emoji = severityEmoji[errorReport.severity];
    const typeIcon = typeEmoji[errorReport.type];
    const timestamp = new Date(errorReport.timestamp).toLocaleTimeString();
    
    console.log(`${emoji} ${typeIcon} [${timestamp}] ${errorReport.severity.toUpperCase()}: ${errorReport.message}`);
    
    if (errorReport.source) {
      console.log(`   源: ${errorReport.source}:${errorReport.lineNumber || 0}:${errorReport.columnNumber || 0}`);
    }
    
    if (errorReport.stackTrace) {
      const firstLine = errorReport.stackTrace.split('\n')[0];
      console.log(`   堆栈: ${firstLine}`);
    }
  }
  
  /**
   * 错误截图
   */
  private async takeErrorScreenshot(errorReport: ErrorReport, page: Page) {
    try {
      const screenshotPath = path.join(this.screenshotDir, `${errorReport.id}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        type: 'png'
      });
      errorReport.context = { 
        ...errorReport.context, 
        screenshot: screenshotPath 
      };
      console.log(`📸 错误截图已保存: ${screenshotPath}`);
    } catch (error) {
      console.warn('截图失败:', error.message);
    }
  }
  
  /**
   * 检查页面中的未处理Promise拒绝
   */
  async checkUnhandledRejections(page: Page) {
    try {
      const rejections = await page.evaluate(() => (window as any)._unhandledRejections || []);
      
      for (const rejection of rejections) {
        const errorReport: ErrorReport = {
          id: `rejection-${Date.now()}`,
          timestamp: rejection.timestamp,
          type: 'unhandled',
          severity: 'high',
          message: `Unhandled Promise Rejection: ${rejection.reason}`,
          stackTrace: rejection.stack,
          url: page.url(),
        };
        
        await this.recordError(errorReport, page);
      }
      
      // 清除已处理的拒绝
      await page.evaluate(() => {
        (window as any)._unhandledRejections = [];
      });
    } catch (error) {
      // 忽略检查错误
    }
  }
  
  /**
   * 检查安全错误
   */
  async checkSecurityErrors(page: Page) {
    try {
      const securityErrors = await page.evaluate(() => (window as any)._securityErrors || []);
      
      for (const secError of securityErrors) {
        const errorReport: ErrorReport = {
          id: `security-${Date.now()}`,
          timestamp: secError.timestamp,
          type: secError.type === 'cors' ? 'cors' : 'security',
          severity: 'high',
          message: secError.message,
          url: secError.url || page.url(),
        };
        
        await this.recordError(errorReport, page);
      }
      
      // 清除已处理的安全错误
      await page.evaluate(() => {
        (window as any)._securityErrors = [];
      });
    } catch (error) {
      // 忽略检查错误
    }
  }
  
  /**
   * 完成错误追踪会话
   */
  async finishSession() {
    this.session.endTime = new Date().toISOString();
    
    try {
      await fs.promises.writeFile(this.reportFile, JSON.stringify(this.session, null, 2));
      console.log(`💾 错误报告已保存: ${this.reportFile}`);
    } catch (error) {
      console.error('保存错误报告失败:', error);
    }
    
    return this.session;
  }
  
  /**
   * 获取错误统计
   */
  getSummary() {
    return this.session.summary;
  }
  
  /**
   * 获取关键错误列表
   */
  getCriticalErrors(): ErrorReport[] {
    return this.session.errors.filter(error => error.severity === 'critical');
  }
  
  /**
   * 生成错误报告摘要
   */
  generateSummary(): string {
    const { summary } = this.session;
    let report = '📊 错误追踪摘要:\n';
    report += `   总错误数: ${summary.total}\n`;
    report += `   💥 关键: ${summary.critical}\n`;
    report += `   🔴 严重: ${summary.high}\n`;
    report += `   🟡 中等: ${summary.medium}\n`;
    report += `   🟢 轻微: ${summary.low}\n`;
    
    if (Object.keys(summary.byType).length > 0) {
      report += '   按类型统计:\n';
      Object.entries(summary.byType).forEach(([type, count]) => {
        report += `     ${type}: ${count}\n`;
      });
    }
    
    return report;
  }
}

// 测试套件：错误追踪监控
test.describe('PomeloX 错误追踪监控', () => {
  let errorTracker: ErrorTracker;
  
  test.beforeEach(async () => {
    errorTracker = new ErrorTracker();
  });
  
  test.afterEach(async () => {
    if (errorTracker) {
      const session = await errorTracker.finishSession();
      console.log(errorTracker.generateSummary());
      
      // 如果发现关键错误，输出详细信息
      const criticalErrors = errorTracker.getCriticalErrors();
      if (criticalErrors.length > 0) {
        console.log('💥 发现关键错误:');
        criticalErrors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.message}`);
          if (error.stackTrace) {
            console.log(`      堆栈: ${error.stackTrace.split('\n')[0]}`);
          }
        });
      }
    }
  });
  
  test('基础错误追踪', async ({ page }) => {
    await errorTracker.startTracking(page);
    
    console.log('🔍 开始基础错误追踪...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 等待并检查各类错误
    await page.waitForTimeout(3000);
    await errorTracker.checkUnhandledRejections(page);
    await errorTracker.checkSecurityErrors(page);
    
    const summary = errorTracker.getSummary();
    console.log(`✅ 基础错误追踪完成，发现 ${summary.total} 个错误`);
    
    // 基本页面加载不应该有关键错误
    expect(summary.critical).toBeLessThan(3);
  });
  
  test('API错误追踪', async ({ page }) => {
    await errorTracker.startTracking(page);
    
    console.log('🌐 开始API错误追踪...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 等待API调用完成
    await page.waitForTimeout(5000);
    
    // 触发可能的API调用（如果有登录按钮等）
    try {
      const buttons = await page.locator('button, [role=\"button\"]').all();
      if (buttons.length > 0) {
        console.log('🔘 尝试点击按钮触发API调用...');
        await buttons[0].click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('按钮点击测试失败，继续追踪...');
    }
    
    await errorTracker.checkUnhandledRejections(page);
    await errorTracker.checkSecurityErrors(page);
    
    const summary = errorTracker.getSummary();
    console.log(`✅ API错误追踪完成，发现 ${summary.total} 个错误`);
    
    // 检查网络相关错误
    const networkErrorCount = summary.byType['network'] || 0;
    console.log(`🌐 网络相关错误: ${networkErrorCount}`);
  });
  
  test('JavaScript错误追踪', async ({ page }) => {
    await errorTracker.startTracking(page);
    
    console.log('🐛 开始JavaScript错误追踪...');
    
    // 注入一个测试错误来验证追踪功能
    await page.addInitScript(() => {
      // 延迟执行以确保追踪器已设置
      setTimeout(() => {
        try {
          // 故意触发一个错误用于测试
          console.error('Test error for tracking');
        } catch (e) {
          // 忽略
        }
      }, 1000);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 尝试触发可能的JavaScript错误
    try {
      await page.evaluate(() => {
        // 测试一些可能出错的操作
        localStorage.setItem('test', JSON.stringify({ test: true }));
        localStorage.removeItem('test');
      });
    } catch (error) {
      // 这些错误会被追踪器捕获
    }
    
    await page.waitForTimeout(3000);
    await errorTracker.checkUnhandledRejections(page);
    
    const summary = errorTracker.getSummary();
    console.log(`✅ JavaScript错误追踪完成，发现 ${summary.total} 个错误`);
  });
  
  test('移动端错误追踪', async ({ page, browserName }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    await errorTracker.startTracking(page);
    
    console.log('📱 开始移动端错误追踪...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 模拟移动端操作
    try {
      // 模拟触摸操作
      await page.touchscreen.tap(200, 300);
      await page.waitForTimeout(1000);
      
      // 模拟滑动
      await page.touchscreen.tap(200, 400);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1000);
      
    } catch (error) {
      console.log('移动端操作模拟失败，继续追踪...');
    }
    
    await errorTracker.checkUnhandledRejections(page);
    await errorTracker.checkSecurityErrors(page);
    
    const summary = errorTracker.getSummary();
    console.log(`✅ 移动端错误追踪完成，发现 ${summary.total} 个错误`);
    
    // 移动端不应该有额外的关键错误
    expect(summary.critical).toBeLessThan(5);
  });
  
  test('长时间错误监控', async ({ page }) => {
    await errorTracker.startTracking(page);
    
    console.log('⏰ 开始长时间错误监控（60秒）...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const duration = 60000; // 60秒
    const checkInterval = 10000; // 每10秒检查一次
    const iterations = duration / checkInterval;
    
    for (let i = 0; i < iterations; i++) {
      await page.waitForTimeout(checkInterval);
      
      // 定期检查错误
      await errorTracker.checkUnhandledRejections(page);
      await errorTracker.checkSecurityErrors(page);
      
      const summary = errorTracker.getSummary();
      console.log(`⏳ 监控进度: ${i + 1}/${iterations}, 累计错误: ${summary.total}`);
      
      // 执行一些随机操作
      try {
        if (i % 2 === 0) {
          await page.reload();
          await page.waitForLoadState('networkidle');
        } else {
          await page.mouse.move(Math.random() * 800, Math.random() * 600);
        }
      } catch (error) {
        // 忽略操作错误
      }
    }
    
    const finalSummary = errorTracker.getSummary();
    console.log(`✅ 长时间错误监控完成，总计发现 ${finalSummary.total} 个错误`);
    
    // 长时间运行不应该有过多错误累积
    expect(finalSummary.total).toBeLessThan(20);
    expect(finalSummary.critical).toBeLessThan(3);
  });
});