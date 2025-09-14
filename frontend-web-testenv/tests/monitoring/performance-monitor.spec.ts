import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * PomeloX 性能监控器
 * 监控页面加载时间、渲染性能、内存使用、网络请求等性能指标
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  category: 'loading' | 'runtime' | 'memory' | 'network' | 'user';
  threshold?: number;
  status: 'good' | 'warning' | 'poor';
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  size: number;
  duration: number;
  timestamp: string;
  type: 'document' | 'script' | 'stylesheet' | 'image' | 'xhr' | 'fetch' | 'other';
}

interface PerformanceSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  url: string;
  metrics: PerformanceMetric[];
  networkRequests: NetworkRequest[];
  summary: {
    pageLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    totalRequests: number;
    totalSize: number;
    averageResponseTime: number;
    memoryUsage: number;
  };
  recommendations: string[];
}

class PerformanceMonitor {
  private session: PerformanceSession;
  private reportFile: string;
  private startTimestamp: number;
  
  constructor(sessionId?: string) {
    const id = sessionId || `perf-${Date.now()}`;
    this.startTimestamp = Date.now();
    this.session = {
      sessionId: id,
      startTime: new Date().toISOString(),
      url: '',
      metrics: [],
      networkRequests: [],
      summary: {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        totalRequests: 0,
        totalSize: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
      },
      recommendations: [],
    };
    
    this.reportFile = path.join(process.cwd(), 'performance-data', `perf-${id}.json`);
    
    // 确保目录存在
    fs.mkdirSync(path.dirname(this.reportFile), { recursive: true });
  }
  
  /**
   * 开始性能监控
   */
  async startMonitoring(page: Page) {
    console.log(`📊 开始性能监控 - 会话: ${this.session.sessionId}`);
    
    this.session.url = page.url();
    
    // 监听网络请求
    page.on('request', (request) => {
      const startTime = Date.now();
      request.timing = { startTime };
    });
    
    page.on('response', (response) => {
      const endTime = Date.now();
      const request = response.request();
      const startTime = (request as any).timing?.startTime || endTime;
      
      const networkRequest: NetworkRequest = {
        url: response.url(),
        method: request.method(),
        status: response.status(),
        size: 0, // 稍后获取
        duration: endTime - startTime,
        timestamp: new Date().toISOString(),
        type: this.classifyRequestType(response.url()),
      };
      
      // 尝试获取响应大小
      response.body().then(body => {
        networkRequest.size = body.length;
      }).catch(() => {
        // 忽略获取大小失败
      });
      
      this.session.networkRequests.push(networkRequest);
    });
    
    // 等待页面加载完成后收集性能指标
    await page.waitForLoadState('networkidle');
    await this.collectWebVitals(page);
    await this.collectNetworkMetrics();
    await this.collectMemoryMetrics(page);
  }
  
  /**
   * 收集Web Vitals指标
   */
  private async collectWebVitals(page: Page) {
    try {
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const metrics = {};
          
          // 获取Navigation Timing指标
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (nav) {
            metrics['loadEventEnd'] = nav.loadEventEnd;
            metrics['domContentLoadedEventEnd'] = nav.domContentLoadedEventEnd;
            metrics['responseEnd'] = nav.responseEnd;
            metrics['requestStart'] = nav.requestStart;
            metrics['domInteractive'] = nav.domInteractive;
          }
          
          // 尝试获取Paint Timing指标
          const paintEntries = performance.getEntriesByType('paint');
          paintEntries.forEach(entry => {
            metrics[entry.name.replace(/-/g, '')] = entry.startTime;
          });
          
          // 获取LCP (如果可用)
          if (window.PerformanceObserver) {
            try {
              const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                metrics['largestContentfulPaint'] = lastEntry.startTime;
              });
              observer.observe({entryTypes: ['largest-contentful-paint']});
              
              // 等待一小段时间收集指标
              setTimeout(() => {
                observer.disconnect();
                resolve(metrics);
              }, 1000);
            } catch (error) {
              resolve(metrics);
            }
          } else {
            resolve(metrics);
          }
        });
      });
      
      // 处理收集到的指标
      const pageLoadTime = webVitals['loadEventEnd'] || 0;
      const firstContentfulPaint = webVitals['firstcontentfulpaint'] || 0;
      const largestContentfulPaint = webVitals['largestContentfulPaint'] || 0;
      const domContentLoaded = webVitals['domContentLoadedEventEnd'] || 0;
      
      // 添加性能指标
      this.addMetric('Page Load Time', pageLoadTime, 'ms', 'loading', 3000);
      this.addMetric('First Contentful Paint', firstContentfulPaint, 'ms', 'loading', 1800);
      this.addMetric('Largest Contentful Paint', largestContentfulPaint, 'ms', 'loading', 2500);
      this.addMetric('DOM Content Loaded', domContentLoaded, 'ms', 'loading', 1500);
      
      // 更新会话摘要
      this.session.summary.pageLoadTime = pageLoadTime;
      this.session.summary.firstContentfulPaint = firstContentfulPaint;
      this.session.summary.largestContentfulPaint = largestContentfulPaint;
      
    } catch (error) {
      console.warn('收集Web Vitals失败:', error.message);
    }
  }
  
  /**
   * 收集网络性能指标
   */
  private collectNetworkMetrics() {
    const requests = this.session.networkRequests;
    
    if (requests.length === 0) {
      return;
    }
    
    const totalSize = requests.reduce((sum, req) => sum + req.size, 0);
    const totalDuration = requests.reduce((sum, req) => sum + req.duration, 0);
    const averageResponseTime = totalDuration / requests.length;
    
    const slowRequests = requests.filter(req => req.duration > 3000);
    const errorRequests = requests.filter(req => req.status >= 400);
    
    // 添加网络指标
    this.addMetric('Total Requests', requests.length, 'count', 'network', 50);
    this.addMetric('Total Size', totalSize / 1024, 'KB', 'network', 2048); // 2MB阈值
    this.addMetric('Average Response Time', averageResponseTime, 'ms', 'network', 1000);
    this.addMetric('Slow Requests', slowRequests.length, 'count', 'network', 3);
    this.addMetric('Error Requests', errorRequests.length, 'count', 'network', 1);
    
    // 更新会话摘要
    this.session.summary.totalRequests = requests.length;
    this.session.summary.totalSize = totalSize;
    this.session.summary.averageResponseTime = averageResponseTime;
    
    // 生成网络性能建议
    if (slowRequests.length > 0) {
      this.session.recommendations.push(`发现 ${slowRequests.length} 个慢请求，建议优化服务器响应时间`);
    }
    
    if (totalSize > 2048 * 1024) { // > 2MB
      this.session.recommendations.push('页面资源过大，建议启用压缩和缓存');
    }
    
    if (errorRequests.length > 0) {
      this.session.recommendations.push(`发现 ${errorRequests.length} 个失败请求，需要修复网络错误`);
    }
  }
  
  /**
   * 收集内存使用指标
   */
  private async collectMemoryMetrics(page: Page) {
    try {
      const memoryInfo = await page.evaluate(() => {
        // 获取内存信息（如果浏览器支持）
        const memory = (performance as any).memory;
        if (memory) {
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          };
        }
        return null;
      });
      
      if (memoryInfo) {
        const usedMemoryMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
        const totalMemoryMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
        const memoryLimitMB = memoryInfo.jsHeapSizeLimit / 1024 / 1024;
        
        this.addMetric('Used Memory', usedMemoryMB, 'MB', 'memory', 50);
        this.addMetric('Total Memory', totalMemoryMB, 'MB', 'memory', 100);
        this.addMetric('Memory Limit', memoryLimitMB, 'MB', 'memory', 0);
        
        this.session.summary.memoryUsage = usedMemoryMB;
        
        // 内存使用建议
        if (usedMemoryMB > 50) {
          this.session.recommendations.push('内存使用较高，建议检查内存泄漏');
        }
        
        const memoryUsagePercent = (usedMemoryMB / memoryLimitMB) * 100;
        if (memoryUsagePercent > 70) {
          this.session.recommendations.push('内存使用率过高，可能影响性能');
        }
      }
    } catch (error) {
      console.warn('收集内存指标失败:', error.message);
    }
  }
  
  /**
   * 添加性能指标
   */
  private addMetric(
    name: string, 
    value: number, 
    unit: string, 
    category: PerformanceMetric['category'],
    threshold?: number
  ) {
    let status: PerformanceMetric['status'] = 'good';
    
    if (threshold) {
      if (value > threshold * 1.5) {
        status = 'poor';
      } else if (value > threshold) {
        status = 'warning';
      }
    }
    
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value * 100) / 100, // 保留2位小数
      unit,
      category,
      threshold,
      status,
      timestamp: new Date().toISOString(),
    };
    
    this.session.metrics.push(metric);
    
    // 显示指标
    const statusEmoji = { good: '✅', warning: '⚠️', poor: '❌' };
    console.log(`${statusEmoji[status]} ${name}: ${metric.value}${unit}${threshold ? ` (阈值: ${threshold}${unit})` : ''}`);
  }
  
  /**
   * 分类请求类型
   */
  private classifyRequestType(url: string): NetworkRequest['type'] {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('/api/') || url.includes('vitaglobal.icu')) return 'xhr';
    if (url.includes('fetch')) return 'fetch';
    if (url.endsWith('/') || url.includes('.html')) return 'document';
    return 'other';
  }
  
  /**
   * 运行性能审计
   */
  async runPerformanceAudit(page: Page) {
    console.log('🔍 开始性能审计...');
    
    // 审计1: 检查大型资源
    const largeResources = this.session.networkRequests.filter(req => req.size > 1024 * 1024); // > 1MB
    if (largeResources.length > 0) {
      this.session.recommendations.push(`发现 ${largeResources.length} 个大型资源文件，建议优化`);
      largeResources.forEach(resource => {
        console.log(`📦 大型资源: ${resource.url} (${Math.round(resource.size / 1024)}KB)`);
      });
    }
    
    // 审计2: 检查重复请求
    const urlMap = new Map();
    this.session.networkRequests.forEach(req => {
      const count = urlMap.get(req.url) || 0;
      urlMap.set(req.url, count + 1);
    });
    
    const duplicateRequests = Array.from(urlMap.entries()).filter(([_, count]) => count > 1);
    if (duplicateRequests.length > 0) {
      this.session.recommendations.push(`发现 ${duplicateRequests.length} 个重复请求，建议添加缓存`);
    }
    
    // 审计3: 检查未使用的JavaScript（简化版）
    try {
      const coverage = await page.coverage?.startJSCoverage?.();
      if (coverage) {
        await page.reload();
        await page.waitForLoadState('networkidle');
        const jsCoverage = await page.coverage?.stopJSCoverage?.();
        
        if (jsCoverage) {
          const unusedBytes = jsCoverage.reduce((sum, entry) => {
            return sum + (entry.text.length - entry.ranges.reduce((used, range) => used + range.end - range.start, 0));
          }, 0);
          
          const unusedKB = unusedBytes / 1024;
          this.addMetric('Unused JavaScript', unusedKB, 'KB', 'loading', 100);
          
          if (unusedKB > 100) {
            this.session.recommendations.push(`发现 ${Math.round(unusedKB)}KB 未使用的JavaScript，建议代码分割`);
          }
        }
      }
    } catch (error) {
      console.warn('JavaScript覆盖率检查失败:', error.message);
    }
    
    // 审计4: 检查Critical Resource Hints
    const hasPreload = await page.evaluate(() => {
      return document.querySelectorAll('link[rel="preload"]').length > 0;
    });
    
    if (!hasPreload) {
      this.session.recommendations.push('建议为关键资源添加 preload 提示');
    }
    
    console.log('✅ 性能审计完成');
  }
  
  /**
   * 生成性能报告
   */
  generateReport(): string {
    const { metrics, summary, recommendations } = this.session;
    
    let report = '📊 性能监控报告\n';
    report += `🕐 监控时间: ${this.session.startTime}\n`;
    report += `🌐 页面: ${this.session.url}\n\n`;
    
    // 核心指标
    report += '🎯 核心指标:\n';
    report += `  页面加载时间: ${summary.pageLoadTime}ms\n`;
    report += `  首次内容绘制: ${summary.firstContentfulPaint}ms\n`;
    report += `  最大内容绘制: ${summary.largestContentfulPaint}ms\n`;
    report += `  内存使用: ${Math.round(summary.memoryUsage * 100) / 100}MB\n\n`;
    
    // 网络指标
    report += '🌐 网络指标:\n';
    report += `  总请求数: ${summary.totalRequests}\n`;
    report += `  总大小: ${Math.round(summary.totalSize / 1024)}KB\n`;
    report += `  平均响应时间: ${Math.round(summary.averageResponseTime)}ms\n\n`;
    
    // 性能评级
    const poorMetrics = metrics.filter(m => m.status === 'poor').length;
    const warningMetrics = metrics.filter(m => m.status === 'warning').length;
    const goodMetrics = metrics.filter(m => m.status === 'good').length;
    
    report += '📊 性能评级:\n';
    report += `  优秀: ${goodMetrics} 项\n`;
    report += `  警告: ${warningMetrics} 项\n`;
    report += `  差: ${poorMetrics} 项\n\n`;
    
    // 性能评分
    const totalMetrics = metrics.length;
    const score = totalMetrics > 0 ? Math.round(((goodMetrics + warningMetrics * 0.5) / totalMetrics) * 100) : 0;
    report += `🏆 总体评分: ${score}/100\n\n`;
    
    // 优化建议
    if (recommendations.length > 0) {
      report += '💡 优化建议:\n';
      recommendations.forEach((rec, index) => {
        report += `  ${index + 1}. ${rec}\n`;
      });
    }
    
    return report;
  }
  
  /**
   * 保存性能数据
   */
  async saveSession() {
    this.session.endTime = new Date().toISOString();
    
    try {
      await fs.promises.writeFile(this.reportFile, JSON.stringify(this.session, null, 2));
      console.log(`💾 性能数据已保存: ${this.reportFile}`);
    } catch (error) {
      console.error('保存性能数据失败:', error);
    }
  }
  
  /**
   * 获取性能评分
   */
  getPerformanceScore(): number {
    const { metrics } = this.session;
    if (metrics.length === 0) return 0;
    
    const goodCount = metrics.filter(m => m.status === 'good').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    
    return Math.round(((goodCount + warningCount * 0.5) / metrics.length) * 100);
  }
}

// 测试套件：性能监控
test.describe('PomeloX 性能监控', () => {
  let performanceMonitor: PerformanceMonitor;
  
  test.beforeEach(async () => {
    performanceMonitor = new PerformanceMonitor();
  });
  
  test.afterEach(async () => {
    if (performanceMonitor) {
      await performanceMonitor.saveSession();
      const report = performanceMonitor.generateReport();
      console.log(report);
      
      const score = performanceMonitor.getPerformanceScore();
      console.log(`🎯 性能评分: ${score}/100`);
    }
  });
  
  test('基础性能监控', async ({ page }) => {
    await performanceMonitor.startMonitoring(page);
    
    console.log('📊 开始基础性能监控...');
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏰ 页面加载耗时: ${loadTime}ms`);
    
    // 验证基本性能要求
    const score = performanceMonitor.getPerformanceScore();
    expect(score).toBeGreaterThan(60); // 性能评分应该大于60分
    
    console.log('✅ 基础性能监控完成');
  });
  
  test('移动端性能监控', async ({ page }) => {
    // 模拟移动设备
    await page.setViewportSize({ width: 375, height: 667 });
    await page.emulateMedia({ media: 'screen' });
    
    await performanceMonitor.startMonitoring(page);
    
    console.log('📱 开始移动端性能监控...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 移动端应该有合理的性能表现
    const score = performanceMonitor.getPerformanceScore();
    expect(score).toBeGreaterThan(50); // 移动端性能要求稍低
    
    console.log('✅ 移动端性能监控完成');
  });
  
  test('慢网络条件下的性能', async ({ page, context }) => {
    // 模拟慢网络
    await context.route('**/*', async (route) => {
      // 添加延迟模拟慢网络
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    await performanceMonitor.startMonitoring(page);
    
    console.log('🐌 开始慢网络性能监控...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 慢网络性能监控完成');
  });
  
  test('交互性能监控', async ({ page }) => {
    await performanceMonitor.startMonitoring(page);
    
    console.log('👆 开始交互性能监控...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 测试点击响应时间
    const interactionTimes: number[] = [];
    
    try {
      const buttons = await page.locator('button, [role="button"], a').all();
      
      for (let i = 0; i < Math.min(buttons.length, 3); i++) {
        if (await buttons[i].isVisible()) {
          const startTime = Date.now();
          await buttons[i].click();
          await page.waitForTimeout(500);
          const responseTime = Date.now() - startTime;
          interactionTimes.push(responseTime);
          
          console.log(`🔘 按钮 ${i + 1} 响应时间: ${responseTime}ms`);
          
          // 返回或刷新页面
          await page.goBack().catch(() => page.reload());
          await page.waitForLoadState('networkidle');
        }
      }
    } catch (error) {
      console.log('交互测试部分失败，但继续监控...');
    }
    
    // 计算平均交互时间
    if (interactionTimes.length > 0) {
      const avgInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
      console.log(`⚡ 平均交互响应时间: ${Math.round(avgInteractionTime)}ms`);
      
      // 交互应该足够快
      expect(avgInteractionTime).toBeLessThan(3000);
    }
    
    console.log('✅ 交互性能监控完成');
  });
  
  test('完整性能审计', async ({ page }) => {
    await performanceMonitor.startMonitoring(page);
    
    console.log('🔍 开始完整性能审计...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 运行性能审计
    await performanceMonitor.runPerformanceAudit(page);
    
    const score = performanceMonitor.getPerformanceScore();
    console.log(`🎯 最终性能评分: ${score}/100`);
    
    // 完整审计后评分应该合理
    expect(score).toBeGreaterThan(40);
    
    console.log('✅ 完整性能审计完成');
  });
  
  test('长期性能稳定性', async ({ page }) => {
    await performanceMonitor.startMonitoring(page);
    
    console.log('⏰ 开始长期性能稳定性测试（60秒）...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const duration = 60000; // 60秒
    const checkInterval = 15000; // 每15秒检查一次
    const iterations = Math.floor(duration / checkInterval);
    
    const performanceScores: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // 执行一些操作
      try {
        if (i % 2 === 0) {
          await page.reload();
        } else {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(1000);
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        await page.waitForLoadState('networkidle');
      } catch (error) {
        // 忽略操作错误
      }
      
      await page.waitForTimeout(checkInterval);
      
      // 记录当前性能评分
      const currentScore = performanceMonitor.getPerformanceScore();
      performanceScores.push(currentScore);
      
      console.log(`⏳ 性能检查 ${i + 1}/${iterations}: ${currentScore}/100`);
    }
    
    // 分析性能稳定性
    if (performanceScores.length > 1) {
      const avgScore = performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length;
      const minScore = Math.min(...performanceScores);
      const maxScore = Math.max(...performanceScores);
      
      console.log(`📊 性能稳定性统计:`);
      console.log(`   平均评分: ${Math.round(avgScore)}/100`);
      console.log(`   最低评分: ${minScore}/100`);
      console.log(`   最高评分: ${maxScore}/100`);
      console.log(`   评分波动: ${maxScore - minScore}/100`);
      
      // 性能应该保持稳定
      expect(avgScore).toBeGreaterThan(40);
      expect(maxScore - minScore).toBeLessThan(50); // 评分波动不应过大
    }
    
    console.log('✅ 长期性能稳定性测试完成');
  });
});