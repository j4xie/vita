import { Page, BrowserContext, Locator } from '@playwright/test';

/**
 * PomeloX 测试工具函数集合
 * 提供通用的测试辅助功能
 */

export interface TestConfig {
  timeout: number;
  retries: number;
  waitForNetworkIdle: boolean;
  enableConsoleLogging: boolean;
  screenshotOnFailure: boolean;
}

export const defaultTestConfig: TestConfig = {
  timeout: 30000,
  retries: 2,
  waitForNetworkIdle: true,
  enableConsoleLogging: true,
  screenshotOnFailure: true,
};

/**
 * 等待页面完全加载
 */
export async function waitForPageLoad(page: Page, config: Partial<TestConfig> = {}) {
  const finalConfig = { ...defaultTestConfig, ...config };
  
  if (finalConfig.waitForNetworkIdle) {
    await page.waitForLoadState('networkidle', { timeout: finalConfig.timeout });
  } else {
    await page.waitForLoadState('domcontentloaded', { timeout: finalConfig.timeout });
  }
}

/**
 * 智能查找元素（支持多种选择器策略）
 */
export async function smartLocate(page: Page, selectors: string | string[]): Promise<Locator | null> {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  
  for (const selector of selectorArray) {
    try {
      const element = page.locator(selector).first();
      
      // 等待元素存在（不一定可见）
      await element.waitFor({ state: 'attached', timeout: 2000 });
      
      if (await element.isVisible()) {
        return element;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * 查找并点击元素（带重试机制）
 */
export async function smartClick(
  page: Page, 
  selectors: string | string[], 
  config: Partial<TestConfig> = {}
): Promise<boolean> {
  const finalConfig = { ...defaultTestConfig, ...config };
  const element = await smartLocate(page, selectors);
  
  if (!element) {
    console.log(`⚠️  未找到元素: ${Array.isArray(selectors) ? selectors.join(', ') : selectors}`);
    return false;
  }
  
  let retries = finalConfig.retries;
  while (retries > 0) {
    try {
      await element.click({ timeout: finalConfig.timeout });
      console.log(`✅ 成功点击元素`);
      return true;
    } catch (error) {
      retries--;
      if (retries > 0) {
        console.log(`🔄 点击失败，重试中... (剩余: ${retries})`);
        await page.waitForTimeout(1000);
      } else {
        console.log(`❌ 点击失败: ${error.message}`);
        return false;
      }
    }
  }
  
  return false;
}

/**
 * 智能填写表单字段
 */
export async function smartFill(
  page: Page, 
  selectors: string | string[], 
  value: string,
  config: Partial<TestConfig> = {}
): Promise<boolean> {
  const element = await smartLocate(page, selectors);
  
  if (!element) {
    console.log(`⚠️  未找到输入字段: ${Array.isArray(selectors) ? selectors.join(', ') : selectors}`);
    return false;
  }
  
  try {
    await element.fill(value);
    console.log(`✅ 成功填写字段: "${value}"`);
    return true;
  } catch (error) {
    console.log(`❌ 填写字段失败: ${error.message}`);
    return false;
  }
}

/**
 * 检查元素是否存在并可见
 */
export async function isElementVisible(page: Page, selectors: string | string[]): Promise<boolean> {
  const element = await smartLocate(page, selectors);
  return element !== null;
}

/**
 * 等待导航完成
 */
export async function waitForNavigation(
  page: Page, 
  action: () => Promise<void>,
  config: Partial<TestConfig> = {}
): Promise<void> {
  const finalConfig = { ...defaultTestConfig, ...config };
  
  try {
    await Promise.all([
      page.waitForNavigation({ timeout: finalConfig.timeout }),
      action()
    ]);
  } catch (error) {
    console.log(`⚠️  导航等待超时，但继续执行: ${error.message}`);
  }
}

/**
 * 等待并处理模态框
 */
export async function handleModal(
  page: Page,
  action: () => Promise<void>,
  config: Partial<TestConfig> = {}
): Promise<boolean> {
  const finalConfig = { ...defaultTestConfig, ...config };
  
  try {
    // 执行可能触发模态框的操作
    await action();
    
    // 等待模态框出现
    await page.waitForSelector('[role="dialog"], .modal, .popup', { 
      timeout: finalConfig.timeout 
    });
    
    console.log('✅ 检测到模态框');
    return true;
    
  } catch (error) {
    console.log('📝 未检测到模态框或操作失败');
    return false;
  }
}

/**
 * 关闭模态框
 */
export async function closeModal(page: Page): Promise<boolean> {
  const closeSelectors = [
    '[aria-label*="关闭"], [aria-label*="close"]',
    '.close, .modal-close',
    'button:has-text("×")',
    'button:has-text("关闭")',
    'button:has-text("Close")',
    '.overlay, .backdrop'
  ];
  
  return await smartClick(page, closeSelectors);
}

/**
 * 截图辅助函数
 */
export async function takeScreenshot(
  page: Page, 
  filename: string, 
  options: { fullPage?: boolean; path?: string } = {}
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = options.path || `screenshots/${filename}-${timestamp}.png`;
  
  try {
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: options.fullPage || false,
      type: 'png'
    });
    
    console.log(`📸 截图已保存: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    console.log(`❌ 截图失败: ${error.message}`);
    return '';
  }
}

/**
 * 网络请求监控
 */
export class NetworkMonitor {
  private requests: Array<{
    url: string;
    method: string;
    status?: number;
    duration?: number;
    timestamp: string;
  }> = [];
  
  constructor(private page: Page) {
    this.setupListeners();
  }
  
  private setupListeners() {
    this.page.on('request', (request) => {
      const requestData = {
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString(),
      };
      this.requests.push(requestData);
    });
    
    this.page.on('response', (response) => {
      const request = this.requests.find(req => 
        req.url === response.url() && !req.hasOwnProperty('status')
      );
      
      if (request) {
        request.status = response.status();
        request.duration = Date.now() - Date.parse(request.timestamp);
      }
    });
  }
  
  getRequests(): typeof this.requests {
    return [...this.requests];
  }
  
  getFailedRequests(): typeof this.requests {
    return this.requests.filter(req => req.status && req.status >= 400);
  }
  
  getSlowRequests(threshold = 3000): typeof this.requests {
    return this.requests.filter(req => req.duration && req.duration > threshold);
  }
  
  clear(): void {
    this.requests = [];
  }
}

/**
 * 控制台消息收集器
 */
export class ConsoleCollector {
  private messages: Array<{
    type: string;
    text: string;
    timestamp: string;
  }> = [];
  
  constructor(private page: Page) {
    this.setupListeners();
  }
  
  private setupListeners() {
    this.page.on('console', (msg) => {
      this.messages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
      });
    });
  }
  
  getMessages(): typeof this.messages {
    return [...this.messages];
  }
  
  getErrors(): typeof this.messages {
    return this.messages.filter(msg => msg.type === 'error');
  }
  
  getWarnings(): typeof this.messages {
    return this.messages.filter(msg => msg.type === 'warn');
  }
  
  clear(): void {
    this.messages = [];
  }
}

/**
 * 多语言测试辅助
 */
export async function switchLanguage(
  page: Page, 
  language: 'zh-CN' | 'en-US'
): Promise<boolean> {
  const languageSwitchers = [
    `button[data-lang="${language}"]`,
    `a[data-lang="${language}"]`,
    '.language-switcher button',
    '.lang-switch',
    '[data-testid="language-switch"]'
  ];
  
  for (const selector of languageSwitchers) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(1000);
        console.log(`✅ 语言已切换到: ${language}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  console.log('⚠️  未找到语言切换控件');
  return false;
}

/**
 * 移动端设备模拟
 */
export async function emulateDevice(page: Page, deviceType: 'mobile' | 'tablet' | 'desktop') {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1366, height: 768 }
  };
  
  const viewport = viewports[deviceType];
  await page.setViewportSize(viewport);
  
  if (deviceType === 'mobile') {
    await page.emulateMedia({ media: 'screen' });
    // 模拟触摸设备
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    });
  }
  
  console.log(`📱 设备已模拟为: ${deviceType} (${viewport.width}x${viewport.height})`);
}

/**
 * 性能指标收集
 */
export async function collectPerformanceMetrics(page: Page) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      totalLoadTime: navigation.loadEventEnd - navigation.navigationStart,
    };
  });
  
  return metrics;
}

/**
 * API响应验证
 */
export async function validateApiResponse(page: Page, apiUrl: string, expectedStatus = 200) {
  return new Promise((resolve) => {
    const handler = (response: any) => {
      if (response.url().includes(apiUrl)) {
        const isValid = response.status() === expectedStatus;
        console.log(`🌐 API验证 ${apiUrl}: ${response.status()} ${isValid ? '✅' : '❌'}`);
        page.off('response', handler);
        resolve(isValid);
      }
    };
    
    page.on('response', handler);
    
    // 10秒超时
    setTimeout(() => {
      page.off('response', handler);
      console.log(`⏰ API验证超时: ${apiUrl}`);
      resolve(false);
    }, 10000);
  });
}

/**
 * 错误边界测试
 */
export async function testErrorBoundary(page: Page) {
  try {
    // 注入错误来测试错误边界
    await page.evaluate(() => {
      // 创建一个会抛出错误的组件
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = '<script>throw new Error("Test error boundary");</script>';
      document.body.appendChild(errorDiv);
    });
    
    await page.waitForTimeout(1000);
    
    // 检查是否有错误边界UI
    const errorBoundary = await page.locator('.error-boundary, .error-fallback, [data-testid="error"]').isVisible();
    
    if (errorBoundary) {
      console.log('✅ 错误边界工作正常');
      return true;
    } else {
      console.log('⚠️  未检测到错误边界');
      return false;
    }
  } catch (error) {
    console.log('📝 错误边界测试异常，但不影响主流程');
    return false;
  }
}

/**
 * 清理测试数据
 */
export async function cleanupTestData(page: Page) {
  try {
    await page.evaluate(() => {
      // 清理localStorage
      localStorage.clear();
      // 清理sessionStorage
      sessionStorage.clear();
      // 清理cookies（如果需要）
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    });
    
    console.log('🧹 测试数据已清理');
  } catch (error) {
    console.log(`⚠️  清理测试数据失败: ${error.message}`);
  }
}

/**
 * 断言辅助函数
 */
export class TestAssertions {
  constructor(private page: Page) {}
  
  async assertElementExists(selectors: string | string[], message = '') {
    const element = await smartLocate(this.page, selectors);
    if (!element) {
      throw new Error(`元素不存在: ${Array.isArray(selectors) ? selectors.join(', ') : selectors}. ${message}`);
    }
    return element;
  }
  
  async assertElementVisible(selectors: string | string[], message = '') {
    const element = await this.assertElementExists(selectors, message);
    const isVisible = await element.isVisible();
    if (!isVisible) {
      throw new Error(`元素不可见: ${Array.isArray(selectors) ? selectors.join(', ') : selectors}. ${message}`);
    }
    return element;
  }
  
  async assertPageTitle(expectedTitle: string | RegExp, message = '') {
    const actualTitle = await this.page.title();
    const matches = typeof expectedTitle === 'string' 
      ? actualTitle === expectedTitle 
      : expectedTitle.test(actualTitle);
    
    if (!matches) {
      throw new Error(`页面标题不匹配. 期望: ${expectedTitle}, 实际: ${actualTitle}. ${message}`);
    }
  }
  
  async assertUrl(expectedUrl: string | RegExp, message = '') {
    const actualUrl = this.page.url();
    const matches = typeof expectedUrl === 'string' 
      ? actualUrl.includes(expectedUrl) 
      : expectedUrl.test(actualUrl);
    
    if (!matches) {
      throw new Error(`URL不匹配. 期望包含: ${expectedUrl}, 实际: ${actualUrl}. ${message}`);
    }
  }
  
  async assertTextContent(selectors: string | string[], expectedText: string | RegExp, message = '') {
    const element = await this.assertElementVisible(selectors, message);
    const actualText = await element.textContent();
    
    const matches = typeof expectedText === 'string' 
      ? actualText?.includes(expectedText) 
      : expectedText.test(actualText || '');
    
    if (!matches) {
      throw new Error(`文本内容不匹配. 期望: ${expectedText}, 实际: ${actualText}. ${message}`);
    }
  }
}