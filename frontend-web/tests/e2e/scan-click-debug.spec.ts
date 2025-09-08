/**
 * 🔍 扫码按钮点击后状态调试
 * 
 * 检查点击扫码按钮后发生了什么
 */

import { test, expect } from '@playwright/test';

test.describe('扫码按钮点击调试', () => {
  test('🔍 调试扫码按钮点击后的状态', async ({ page }) => {
    console.log('🎯 开始扫码按钮点击调试...');

    // 监听所有控制台日志
    const allLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      allLogs.push(text);
      console.log(`📋 控制台: ${text}`);
    });

    // 监听页面错误
    page.on('pageerror', (error) => {
      console.log(`❌ 页面错误: ${error.message}`);
    });

    // 监听网络请求
    page.on('request', (request) => {
      if (request.url().includes('QRScanner') || request.method() === 'POST') {
        console.log(`🌐 请求: ${request.method()} ${request.url()}`);
      }
    });

    // 导航到首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('🚀 页面加载完成');

    // 记录初始状态
    const initialUrl = page.url();
    console.log('📍 初始URL:', initialUrl);

    // 查找扫码按钮
    const categoryContainer = page.locator('div').filter({ 
      hasText: /All.*Upcoming.*Ended/
    }).first();

    if (await categoryContainer.isVisible()) {
      const roundButtons = await categoryContainer.locator('div').filter({
        has: page.locator('svg')
      }).all();

      // 找到最右侧按钮
      let scanButton = null;
      let maxX = -1;
      
      for (const button of roundButtons) {
        const boundingBox = await button.boundingBox();
        if (boundingBox && boundingBox.x > maxX) {
          maxX = boundingBox.x;
          scanButton = button;
        }
      }

      if (scanButton) {
        console.log('✅ 找到扫码按钮');
        
        // 检查按钮的详细信息
        const buttonInfo = await scanButton.evaluate(el => {
          const clickEvents = [];
          
          // 检查onclick属性
          if (el.onclick) clickEvents.push('onclick');
          
          // 检查事件监听器（这个在实际场景中可能无法获取）
          const hasClick = el.getAttribute('data-testid') || el.className || '';
          
          return {
            tagName: el.tagName,
            className: el.className || '',
            onclick: el.onclick ? 'has-onclick' : 'no-onclick',
            attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
            innerHTML: el.innerHTML.slice(0, 200),
            hasClickEvents: clickEvents.length > 0
          };
        });
        
        console.log('📊 扫码按钮详细信息:', buttonInfo);
        
        // 点击按钮前先截图
        await page.screenshot({
          path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/before-scan-click.png'
        });
        
        console.log('🔄 准备点击扫码按钮...');
        
        // 清空之前的日志
        allLogs.length = 0;
        
        // 点击按钮
        await scanButton.click();
        console.log('✅ 已点击扫码按钮');
        
        // 等待一下看看有什么变化
        await page.waitForTimeout(2000);
        
        // 检查点击后状态
        const afterClickUrl = page.url();
        console.log('📍 点击后URL:', afterClickUrl);
        console.log('🔄 URL是否改变:', initialUrl !== afterClickUrl);
        
        // 检查是否有新的控制台日志
        console.log('📋 点击后的控制台日志数量:', allLogs.length);
        if (allLogs.length > 0) {
          console.log('📋 新增的日志:');
          allLogs.forEach((log, i) => {
            console.log(`  ${i+1}. ${log}`);
          });
        }
        
        // 检查页面内容是否有变化
        const pageContent = await page.evaluate(() => {
          return {
            title: document.title,
            bodyText: document.body.textContent?.slice(0, 100) || '',
            hasQRScannerText: document.body.textContent?.includes('QRScanner') || false,
            hasQRText: document.body.textContent?.includes('QR') || false,
            hasCameraText: document.body.textContent?.includes('摄像头') || document.body.textContent?.includes('camera') || false,
            activeElements: document.activeElement?.tagName || 'none'
          };
        });
        
        console.log('📊 页面内容检查:', pageContent);
        
        // 点击后截图
        await page.screenshot({
          path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/after-scan-click.png'
        });
        
        // 尝试手动导航到QRScanner页面看看是否可行
        console.log('🔄 尝试手动导航到QRScanner页面...');
        try {
          await page.goto('/QRScanner');
          await page.waitForTimeout(2000);
          console.log('✅ 手动导航成功');
          console.log('📍 手动导航后URL:', page.url());
          
          // 截图QRScanner页面
          await page.screenshot({
            path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/manual-qrscanner.png'
          });
          
        } catch (error) {
          console.log('❌ 手动导航也失败:', error.message);
        }
        
      } else {
        console.log('❌ 未找到扫码按钮');
      }
      
    } else {
      console.log('❌ 未找到category bar');
    }

    console.log('✅ 扫码按钮点击调试完成');
  });
});


