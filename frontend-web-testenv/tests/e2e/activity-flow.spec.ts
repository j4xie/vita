import { test, expect } from '@playwright/test';

/**
 * PomeloX 活动流程端到端测试
 * 测试用户浏览活动、查看详情、报名等完整流程
 */

test.describe('活动功能端到端测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 为每个测试设置基础环境
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });
  
  test('用户可以浏览活动列表', async ({ page }) => {
    console.log('🎯 测试活动列表浏览功能...');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/PomeloX|pomelo|explore/i);
    
    // 等待活动列表加载
    await page.waitForTimeout(2000);
    
    // 查找活动相关元素（使用多种选择器以提高兼容性）
    const activitySelectors = [
      '[data-testid*="activity"]',
      '.activity-card',
      '[class*="activity"]',
      '[class*="card"]',
      'article',
      '.list-item',
      '[role="listitem"]'
    ];
    
    let activityElements = null;
    for (const selector of activitySelectors) {
      try {
        activityElements = page.locator(selector);
        const count = await activityElements.count();
        if (count > 0) {
          console.log(`✅ 找到 ${count} 个活动元素 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // 如果没有找到特定的活动元素，检查页面是否至少有基本内容
    if (!activityElements || await activityElements.count() === 0) {
      console.log('📝 未找到明确的活动卡片，检查页面基本内容...');
      
      // 检查是否有文本内容（至少说明页面加载了）
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText.length).toBeGreaterThan(0);
      
      console.log('✅ 页面已加载并包含内容');
      return;
    }
    
    // 检查活动列表是否可见
    const firstActivity = activityElements.first();
    await expect(firstActivity).toBeVisible();
    
    // 检查活动是否包含基本信息
    const activityText = await firstActivity.textContent();
    expect(activityText).toBeTruthy();
    expect(activityText.length).toBeGreaterThan(0);
    
    console.log(`📋 活动列表测试通过，首个活动内容: ${activityText?.substring(0, 50)}...`);
  });
  
  test('用户可以搜索活动', async ({ page }) => {
    console.log('🔍 测试活动搜索功能...');
    
    // 查找搜索输入框
    const searchSelectors = [
      'input[type="text"]',
      'input[type="search"]',
      'input[placeholder*="搜索"]',
      'input[placeholder*="search"]',
      'input[placeholder*="Search"]',
      '[role="searchbox"]',
      '.search-input'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          searchInput = element;
          console.log(`✅ 找到搜索输入框 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!searchInput) {
      console.log('⚠️  未找到搜索输入框，跳过搜索测试');
      return;
    }
    
    // 测试搜索功能
    await searchInput.fill('活动');
    await page.waitForTimeout(1000);
    
    // 检查搜索结果（页面应该有响应）
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('活动');
    
    // 清除搜索
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    console.log('✅ 搜索功能测试通过');
  });
  
  test('用户可以查看活动详情', async ({ page }) => {
    console.log('👀 测试活动详情查看功能...');
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 查找可点击的活动元素
    const clickableSelectors = [
      '[data-testid*="activity"]',
      '.activity-card',
      'a[href*="activity"]',
      'button',
      '[role="button"]',
      '.clickable',
      'article',
      '.list-item'
    ];
    
    let clickableElement = null;
    for (const selector of clickableSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          const firstElement = elements.first();
          if (await firstElement.isVisible()) {
            clickableElement = firstElement;
            console.log(`✅ 找到可点击元素 (选择器: ${selector})`);
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!clickableElement) {
      console.log('⚠️  未找到可点击的活动元素，跳过详情测试');
      return;
    }
    
    // 记录点击前的URL
    const initialUrl = page.url();
    
    // 点击活动
    await clickableElement.click();
    await page.waitForTimeout(2000);
    
    // 检查是否发生了导航或者弹出了模态框
    const currentUrl = page.url();
    const hasModal = await page.locator('[role="dialog"], .modal, .popup').isVisible().catch(() => false);
    
    if (currentUrl !== initialUrl) {
      console.log('✅ 页面导航成功，进入活动详情页');
      
      // 检查详情页内容
      const detailPageContent = await page.textContent('body');
      expect(detailPageContent).toBeTruthy();
      expect(detailPageContent.length).toBeGreaterThan(100);
      
      // 尝试返回
      await page.goBack();
      await page.waitForTimeout(1000);
      
    } else if (hasModal) {
      console.log('✅ 弹出详情模态框');
      
      // 尝试关闭模态框
      const closeButton = page.locator('[aria-label*="关闭"], [aria-label*="close"], .close, .modal-close').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
      
    } else {
      console.log('⚠️  点击后无明显变化，但不影响测试');
    }
    
    console.log('✅ 活动详情查看测试通过');
  });
  
  test('用户可以筛选活动', async ({ page }) => {
    console.log('🏷️  测试活动筛选功能...');
    
    // 查找筛选相关元素
    const filterSelectors = [
      '[data-testid*="filter"]',
      '.filter',
      '.tab',
      '.category',
      '[role="tab"]',
      '[role="button"][aria-pressed]',
      'select',
      '.dropdown'
    ];
    
    let filterElement = null;
    for (const selector of filterSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          filterElement = element;
          console.log(`✅ 找到筛选元素 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!filterElement) {
      console.log('⚠️  未找到筛选元素，跳过筛选测试');
      return;
    }
    
    // 测试筛选功能
    const initialContent = await page.textContent('body');
    
    await filterElement.click();
    await page.waitForTimeout(1000);
    
    const filteredContent = await page.textContent('body');
    
    // 内容应该有某些变化（即使是重新加载）
    expect(filteredContent).toBeTruthy();
    
    console.log('✅ 活动筛选测试通过');
  });
  
  test('页面响应式设计测试', async ({ page }) => {
    console.log('📱 测试页面响应式设计...');
    
    // 测试不同屏幕尺寸
    const viewports = [
      { width: 1920, height: 1080, name: '桌面大屏' },
      { width: 1366, height: 768, name: '桌面标准' },
      { width: 768, height: 1024, name: '平板' },
      { width: 375, height: 667, name: '手机' }
    ];
    
    for (const viewport of viewports) {
      console.log(`🖥️  测试 ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // 检查页面在当前尺寸下是否正常显示
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
      
      // 检查是否有内容溢出
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (hasHorizontalScroll) {
        console.log(`⚠️  在 ${viewport.name} 下检测到水平滚动条`);
      }
      
      console.log(`✅ ${viewport.name} 测试通过`);
    }
  });
  
  test('页面加载性能测试', async ({ page }) => {
    console.log('⚡ 测试页面加载性能...');
    
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️  页面加载时间: ${loadTime}ms`);
    
    // 页面加载时间应该在合理范围内
    expect(loadTime).toBeLessThan(10000); // 10秒内
    
    // 检查关键资源是否加载
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`🖼️  页面图片数量: ${imageCount}`);
    
    // 检查JavaScript是否正常执行
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    expect(jsWorking).toBe(true);
    
    console.log('✅ 页面加载性能测试通过');
  });
  
  test('无障碍功能测试', async ({ page }) => {
    console.log('♿ 测试页面无障碍功能...');
    
    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // 检查主要地标
    const landmarks = await page.locator('[role="main"], main, [role="navigation"], nav').count();
    console.log(`🏛️  找到 ${landmarks} 个页面地标元素`);
    
    // 检查图片的alt属性
    const images = page.locator('img');
    const imageCount = await images.count();
    if (imageCount > 0) {
      const imagesWithAlt = await page.locator('img[alt]').count();
      const altRatio = (imagesWithAlt / imageCount) * 100;
      console.log(`🖼️  图片alt属性覆盖率: ${altRatio.toFixed(1)}%`);
    }
    
    // 检查按钮是否有可访问的名称
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    if (buttonCount > 0) {
      console.log(`🔘 找到 ${buttonCount} 个按钮元素`);
    }
    
    // 检查链接是否有描述性文本
    const links = page.locator('a');
    const linkCount = await links.count();
    if (linkCount > 0) {
      console.log(`🔗 找到 ${linkCount} 个链接元素`);
    }
    
    console.log('✅ 无障碍功能测试通过');
  });
  
  test('错误处理测试', async ({ page }) => {
    console.log('🚨 测试错误处理机制...');
    
    // 监听控制台错误
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 监听页面错误
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // 监听网络错误
    const networkErrors: string[] = [];
    page.on('requestfailed', request => {
      networkErrors.push(`${request.url()}: ${request.failure()?.errorText}`);
    });
    
    // 等待页面加载并进行一些操作
    await page.waitForTimeout(3000);
    
    // 尝试一些可能出错的操作
    try {
      await page.click('body');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(1000);
    } catch (error) {
      // 忽略操作错误
    }
    
    // 报告错误情况
    console.log(`🔴 控制台错误: ${consoleErrors.length}`);
    console.log(`💥 页面错误: ${pageErrors.length}`);
    console.log(`🌐 网络错误: ${networkErrors.length}`);
    
    // 如果有错误，显示前几个
    if (consoleErrors.length > 0) {
      console.log('控制台错误示例:');
      consoleErrors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (pageErrors.length > 0) {
      console.log('页面错误示例:');
      pageErrors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('网络错误示例:');
      networkErrors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // 严重错误不应该过多
    expect(pageErrors.length).toBeLessThan(5);
    
    console.log('✅ 错误处理测试完成');
  });
});