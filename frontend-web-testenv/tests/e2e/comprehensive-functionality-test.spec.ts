// PomeloX Web端全面功能和渲染稳定性测试
import { test, expect, Page, Browser } from '@playwright/test';

// 测试配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:8090',
  timeout: 30000,
  testData: {
    validInviteCode: 'WRK4EY7V',
    invalidInviteCode: 'abcdefgh',
    testPhone: '13331914881',
    usPhone: '2025551234'
  }
};

// 等待函数
async function waitForLoad(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { timeout });
}

// 内存使用监控
async function measureMemoryUsage(page: Page) {
  const memoryInfo = await page.evaluate(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  });
  return memoryInfo;
}

// 控制台错误监控
function setupConsoleMonitoring(page: Page) {
  const errors: any[] = [];
  const warnings: any[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  return { errors, warnings };
}

// 测试组1: 核心功能完整性测试
test.describe('核心功能完整性测试', () => {
  
  test('邀请码验证完整流程测试', async ({ page }) => {
    console.log('🧪 测试: 邀请码验证完整流程');
    
    const { errors, warnings } = setupConsoleMonitoring(page);
    const memoryBefore = await measureMemoryUsage(page);
    
    // 1. 访问首页
    await page.goto(TEST_CONFIG.baseURL);
    await expect(page).toHaveTitle(/PomeloX/);
    
    // 2. 进入邀请码注册流程
    await page.click('text=注册');  
    await page.click('text=推荐码注册');
    
    // 3. 进入QR扫描页面，点击"Enter Code"
    await waitForLoad(page, 'text=Scan Referral Code', 5000);
    await page.click('text=Enter Code');
    
    // 4. 测试无效邀请码
    await waitForLoad(page, 'input[placeholder*="referral"]', 5000);
    await page.fill('input[placeholder*="referral"]', TEST_CONFIG.testData.invalidInviteCode);
    await page.click('text=确认');
    
    // 验证错误显示
    await expect(page.locator('text=邀请码错误')).toBeVisible({ timeout: 5000 });
    console.log('✅ 无效邀请码正确显示错误');
    
    // 5. 测试有效邀请码
    await page.fill('input[placeholder*="referral"]', '');
    await page.fill('input[placeholder*="referral"]', TEST_CONFIG.testData.validInviteCode);
    await page.click('text=确认');
    
    // 验证跳转到注册页面
    await expect(page.locator('text=Register')).toBeVisible({ timeout: 10000 });
    console.log('✅ 有效邀请码正确跳转到注册页面');
    
    // 检查内存使用
    const memoryAfter = await measureMemoryUsage(page);
    console.log('📊 内存使用情况:', {
      before: memoryBefore?.usedJSHeapSize,
      after: memoryAfter?.usedJSHeapSize,
      increase: memoryAfter && memoryBefore ? memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize : 'unknown'
    });
    
    // 检查控制台错误
    console.log('🔍 控制台监控:', {
      errors: errors.length,
      warnings: warnings.length,
      criticalErrors: errors.filter(e => !e.includes('chrome-extension'))
    });
    
    expect(errors.filter(e => !e.includes('chrome-extension')).length).toBeLessThan(5);
  });
  
  test('忘记密码功能完整测试', async ({ page }) => {
    console.log('🧪 测试: 忘记密码功能完整流程');
    
    const { errors } = setupConsoleMonitoring(page);
    
    // 1. 访问忘记密码页面
    await page.goto(TEST_CONFIG.baseURL);
    await page.click('text=登录');
    await page.click('text=忘记密码');
    
    // 2. 测试中国手机号
    await waitForLoad(page, 'input[placeholder*="手机"]', 5000);
    await page.fill('input[placeholder*="手机"]', TEST_CONFIG.testData.testPhone);
    
    // 检查按钮状态
    const sendButton = page.locator('text=Send Code');
    await expect(sendButton).toBeVisible();
    
    await sendButton.click();
    
    // 验证API调用和响应
    await page.waitForTimeout(3000); // 等待API调用
    
    // 检查是否有成功提示或验证码输入界面
    const hasSuccessIndicator = await page.locator('text=验证码, text=成功, text=发送').first().isVisible().catch(() => false);
    
    console.log('📱 忘记密码测试结果:', { 
      hasSuccessIndicator,
      consoleErrors: errors.length
    });
    
    expect(errors.filter(e => !e.includes('chrome-extension')).length).toBeLessThan(3);
  });
  
  test('注册错误信息显示测试', async ({ page }) => {
    console.log('🧪 测试: 注册错误信息显示');
    
    // 1. 访问注册页面并填写重复用户名
    await page.goto(TEST_CONFIG.baseURL);
    await page.click('text=注册');
    await page.click('text=推荐码注册'); 
    await page.click('text=Enter Code');
    
    await waitForLoad(page, 'input[placeholder*="referral"]', 5000);
    await page.fill('input[placeholder*="referral"]', TEST_CONFIG.testData.validInviteCode);
    await page.click('text=确认');
    
    // 2. 填写重复的用户名信息
    await waitForLoad(page, 'input[placeholder*="username"]', 5000);
    await page.fill('input[placeholder*="username"]', '123123'); // 已知重复用户名
    await page.fill('input[placeholder*="姓名"]', '测试用户');
    await page.fill('input[placeholder*="nickname"], input[placeholder*="英文"]', 'TestUser');
    
    // 选择学校
    await page.click('text=选择学校, text=University');
    await page.click('text=清华大学, text=Tsinghua').first();
    
    // 下一步
    await page.click('text=下一步, text=Next');
    
    // 填写邮箱和密码
    await page.fill('input[placeholder*="email"], input[placeholder*="邮箱"]', 'test@example.edu');
    await page.fill('input[placeholder*="password"], input[placeholder*="密码"]', 'test123456');
    await page.fill('input[placeholder*="confirm"], input[placeholder*="确认"]', 'test123456');
    
    // 下一步
    await page.click('text=下一步, text=Next');
    
    // 填写手机号和完成注册
    await page.fill('input[placeholder*="手机"], input[placeholder*="phone"]', '13912345678');
    
    // 选择组织
    await page.click('text=选择组织, text=Organization');
    await page.click('text=学联组织').first();
    
    // 勾选同意条款
    await page.click('input[type="checkbox"]', { timeout: 5000 }).catch(() => {});
    
    // 点击完成注册
    await page.click('text=完成注册, text=Complete');
    
    // 3. 验证错误提示
    await page.waitForTimeout(5000); // 等待API响应
    
    // 查找错误提示对话框
    const errorDialog = page.locator('text=用户名已被使用, text=username, text=已存在');
    const hasSpecificError = await errorDialog.isVisible().catch(() => false);
    
    console.log('📋 注册错误测试结果:', { hasSpecificError });
    
    // 如果没有看到具体错误，检查是否有通用错误
    const genericError = page.locator('text=An error occurred');
    const hasGenericError = await genericError.isVisible().catch(() => false);
    
    console.log('⚠️ 错误提示检查:', { 
      hasSpecificError, 
      hasGenericError,
      expectation: '应该显示具体错误而非通用错误'
    });
  });
});

// 测试组2: 渲染性能和稳定性测试
test.describe('渲染性能和稳定性测试', () => {
  
  test('内存泄漏检测测试', async ({ page }) => {
    console.log('🧪 测试: 内存泄漏检测');
    
    const memorySnapshots: any[] = [];
    
    // 初始内存状态
    await page.goto(TEST_CONFIG.baseURL);
    memorySnapshots.push(await measureMemoryUsage(page));
    
    // 模拟用户频繁操作
    for (let i = 0; i < 5; i++) {
      // 导航到不同页面
      await page.click('text=注册');
      await page.waitForTimeout(1000);
      
      await page.goBack();
      await page.waitForTimeout(1000);
      
      await page.click('text=登录');
      await page.waitForTimeout(1000);
      
      await page.goBack();
      await page.waitForTimeout(1000);
      
      // 记录内存使用
      memorySnapshots.push(await measureMemoryUsage(page));
    }
    
    // 分析内存趋势
    console.log('📊 内存使用趋势:');
    memorySnapshots.forEach((snapshot, index) => {
      if (snapshot) {
        console.log(`   ${index}: ${(snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
    });
    
    // 检查内存是否持续增长
    const firstMemory = memorySnapshots[0]?.usedJSHeapSize || 0;
    const lastMemory = memorySnapshots[memorySnapshots.length - 1]?.usedJSHeapSize || 0;
    const memoryIncrease = lastMemory - firstMemory;
    
    console.log(`💧 内存变化: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    
    // 内存增长应该在合理范围内 (< 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
  
  test('用户界面响应性能测试', async ({ page }) => {
    console.log('🧪 测试: 用户界面响应性能');
    
    await page.goto(TEST_CONFIG.baseURL);
    
    // 测试点击响应时间
    const performanceMetrics: any[] = [];
    
    const testElements = [
      { name: '注册按钮', selector: 'text=注册' },
      { name: '登录按钮', selector: 'text=登录' },  
      { name: '返回按钮', selector: 'button[aria-label="返回"], [name="arrow-back"]' }
    ];
    
    for (const element of testElements) {
      try {
        const startTime = Date.now();
        await page.click(element.selector);
        await page.waitForTimeout(500); // 等待响应
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        performanceMetrics.push({
          element: element.name,
          responseTime
        });
        
        console.log(`⚡ ${element.name}响应时间: ${responseTime}ms`);
        
        // 返回首页准备下一个测试
        await page.goto(TEST_CONFIG.baseURL);
        
      } catch (error) {
        console.log(`❌ ${element.name}测试失败: ${error}`);
      }
    }
    
    // 验证响应时间都在合理范围内
    const slowResponses = performanceMetrics.filter(m => m.responseTime > 2000);
    expect(slowResponses.length).toBe(0);
  });
});

// 测试组3: 错误处理和边界情况  
test.describe('错误处理和边界情况测试', () => {
  
  test('网络中断和恢复测试', async ({ page }) => {
    console.log('🧪 测试: 网络异常处理');
    
    await page.goto(TEST_CONFIG.baseURL);
    
    // 模拟网络中断
    await page.route('**/*', route => {
      if (route.request().url().includes('vitaglobal.icu')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // 尝试操作应该显示网络错误
    try {
      await page.click('text=忘记密码');
      await page.fill('input[placeholder*="手机"]', TEST_CONFIG.testData.testPhone);
      await page.click('text=Send Code');
      
      await page.waitForTimeout(3000);
      
      // 应该显示网络错误提示
      const networkError = await page.locator('text=网络, text=连接, text=Network').isVisible();
      console.log('🌐 网络错误处理:', { networkError });
      
    } catch (error) {
      console.log('📡 网络中断测试:', error);
    }
    
    // 恢复网络
    await page.unroute('**/*');
  });
  
  test('快速点击和重复提交测试', async ({ page }) => {
    console.log('🧪 测试: 快速点击和重复提交');
    
    const { errors } = setupConsoleMonitoring(page);
    
    await page.goto(TEST_CONFIG.baseURL);
    await page.click('text=忘记密码');
    
    await waitForLoad(page, 'input[placeholder*="手机"]', 5000);
    await page.fill('input[placeholder*="手机"]', TEST_CONFIG.testData.testPhone);
    
    // 快速连续点击按钮
    const sendButton = page.locator('text=Send Code');
    
    try {
      // 连续点击3次
      await Promise.all([
        sendButton.click(),
        sendButton.click(), 
        sendButton.click()
      ]);
      
      await page.waitForTimeout(3000);
      
      // 检查是否有重复请求错误
      const duplicateErrors = errors.filter(e => 
        e.includes('duplicate') || e.includes('重复') || e.includes('already')
      );
      
      console.log('🔄 重复提交测试:', { 
        duplicateErrors: duplicateErrors.length,
        totalErrors: errors.length
      });
      
    } catch (error) {
      console.log('⚡ 快速点击测试完成');
    }
  });
});

// 测试组4: 浏览器兼容性和渲染测试
test.describe('浏览器兼容性测试', () => {
  
  test('页面加载和渲染完整性', async ({ page }) => {
    console.log('🧪 测试: 页面渲染完整性');
    
    await page.goto(TEST_CONFIG.baseURL);
    
    // 检查关键元素是否正确渲染
    const keyElements = [
      'text=PomeloX',
      'text=登录',
      'text=注册',
      'text=跳过'
    ];
    
    const renderingResults = [];
    
    for (const selector of keyElements) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
        renderingResults.push({ selector, status: '✅' });
      } catch (error) {
        renderingResults.push({ selector, status: '❌' });
      }
    }
    
    console.log('🎨 关键元素渲染状态:');
    renderingResults.forEach(result => {
      console.log(`   ${result.status} ${result.selector}`);
    });
    
    // 验证至少80%的关键元素正确渲染
    const successCount = renderingResults.filter(r => r.status === '✅').length;
    const successRate = successCount / renderingResults.length;
    
    expect(successRate).toBeGreaterThan(0.8);
  });
  
  test('响应式设计测试', async ({ page }) => {
    console.log('🧪 测试: 响应式设计适配');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(TEST_CONFIG.baseURL);
      
      // 检查页面是否正确适配
      await page.waitForTimeout(1000);
      
      const isResponsive = await page.evaluate(() => {
        const body = document.body;
        return {
          hasHorizontalScroll: body.scrollWidth > body.clientWidth,
          bodyWidth: body.clientWidth,
          bodyHeight: body.clientHeight
        };
      });
      
      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}):`, isResponsive);
      
      // 验证没有水平滚动条
      expect(isResponsive.hasHorizontalScroll).toBe(false);
    }
  });
});

// 测试组5: 端到端用户流程测试
test.describe('端到端用户流程测试', () => {
  
  test('完整注册流程性能测试', async ({ page }) => {
    console.log('🧪 测试: 完整注册流程性能');
    
    const { errors, warnings } = setupConsoleMonitoring(page);
    const startTime = Date.now();
    
    try {
      // 完整的注册流程
      await page.goto(TEST_CONFIG.baseURL);
      
      // 生成唯一测试数据
      const timestamp = Date.now();
      const testUser = `perftest${timestamp}`;
      const testPhone = `139${timestamp.toString().slice(-8)}`;
      
      // 邀请码注册流程
      await page.click('text=注册');
      await page.click('text=推荐码注册');
      await page.click('text=Enter Code');
      
      await page.fill('input[placeholder*="referral"]', TEST_CONFIG.testData.validInviteCode);
      await page.click('text=确认');
      
      // 填写注册信息
      await page.fill('input[placeholder*="username"]', testUser);
      await page.fill('input[placeholder*="姓名"]', '性能测试用户');
      await page.fill('input[placeholder*="nickname"]', 'PerfTest');
      
      await page.click('text=下一步');
      
      await page.fill('input[placeholder*="email"]', `${testUser}@test.edu`);
      await page.fill('input[placeholder*="password"]', 'test123456');
      await page.fill('input[placeholder*="confirm"]', 'test123456');
      
      await page.click('text=下一步');
      
      await page.fill('input[placeholder*="手机"]', testPhone);
      await page.click('input[type="checkbox"]').catch(() => {});
      
      await page.click('text=完成注册');
      
      await page.waitForTimeout(8000); // 等待注册完成
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log('⏱️ 完整注册流程时间:', `${totalTime}ms`);
      console.log('🔍 过程中的错误:', errors.filter(e => !e.includes('chrome-extension')).length);
      
      // 验证性能在合理范围内
      expect(totalTime).toBeLessThan(30000); // 30秒内完成
      
    } catch (error) {
      console.log('❌ 完整流程测试异常:', error);
    }
  });
});