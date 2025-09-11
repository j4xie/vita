/**
 * 🔍 导航功能调试测试
 * 
 * 专门测试扫码按钮的导航功能
 */

import { test, expect } from '@playwright/test';

test.describe('导航功能调试', () => {
  test('🔍 调试扫码按钮的导航功能', async ({ page }) => {
    console.log('🎯 开始导航功能调试...');

    // 监听所有控制台日志，特别关注导航相关的
    const allLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      allLogs.push(text);
      
      // 特别关注导航相关的日志
      if (text.includes('navigation') || 
          text.includes('navigate') ||
          text.includes('QRScanner') ||
          text.includes('handleScanPress') ||
          text.includes('[NAVIGATION]') ||
          text.includes('route')) {
        console.log(`🎯 导航日志: ${text}`);
      }
    });

    // 监听页面错误
    page.on('pageerror', (error) => {
      console.log(`❌ 页面错误: ${error.message}`);
    });

    // 监听未处理的Promise拒绝
    page.on('unhandledrejection', (error) => {
      console.log(`❌ 未处理的Promise拒绝: ${error.message}`);
    });

    // 导航到首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('🚀 页面加载完成');

    // 记录初始状态
    const initialUrl = page.url();
    console.log('📍 初始URL:', initialUrl);

    // 在页面上注入调试代码来监控导航
    await page.evaluate(() => {
      // 检查React Navigation是否存在
      console.log('[NAVIGATION-DEBUG] Window对象检查:', {
        hasReactNavigation: typeof window !== 'undefined',
        navigationKeys: window ? Object.keys(window).filter(key => key.toLowerCase().includes('nav')) : []
      });
      
      // 尝试监听路由变化（如果使用React Router）
      if (window.history) {
        const originalPushState = window.history.pushState;
        window.history.pushState = function(state, title, url) {
          console.log('[NAVIGATION-DEBUG] History pushState 被调用:', { state, title, url });
          return originalPushState.apply(this, arguments);
        };
        
        const originalReplaceState = window.history.replaceState;
        window.history.replaceState = function(state, title, url) {
          console.log('[NAVIGATION-DEBUG] History replaceState 被调用:', { state, title, url });
          return originalReplaceState.apply(this, arguments);
        };
      }
      
      // 监听hashchange（如果使用hash路由）
      window.addEventListener('hashchange', () => {
        console.log('[NAVIGATION-DEBUG] Hash 变化:', window.location.hash);
      });
      
      // 监听popstate
      window.addEventListener('popstate', () => {
        console.log('[NAVIGATION-DEBUG] Popstate 事件:', window.location.href);
      });
    });

    // 查找扫码按钮
    const categoryContainer = page.locator('div').filter({ 
      hasText: /All.*Upcoming.*Ended/
    }).first();

    if (await categoryContainer.isVisible()) {
      console.log('✅ 找到category bar容器');
      
      // 找到扫码按钮（最右侧的SVG按钮）
      const roundButtons = await categoryContainer.locator('div').filter({
        has: page.locator('svg')
      }).all();

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
        
        // 在点击前注入额外的调试代码
        await page.evaluate(() => {
          // 尝试查找React组件的props或state
          const allElements = document.querySelectorAll('div');
          console.log('[NAVIGATION-DEBUG] 页面中div元素总数:', allElements.length);
          
          // 检查是否有React相关的属性
          let reactElementsCount = 0;
          allElements.forEach(el => {
            const keys = Object.keys(el);
            const hasReact = keys.some(key => key.startsWith('__react'));
            if (hasReact) reactElementsCount++;
          });
          console.log('[NAVIGATION-DEBUG] 包含React属性的元素数量:', reactElementsCount);
        });
        
        console.log('🔄 准备点击扫码按钮...');
        
        // 清空之前的日志
        allLogs.length = 0;
        
        // 设置URL变化监听
        const urlChanges: string[] = [];
        const checkURL = async () => {
          const currentUrl = page.url();
          urlChanges.push(currentUrl);
          return currentUrl;
        };
        
        // 点击按钮
        await scanButton.click();
        console.log('✅ 已点击扫码按钮');
        
        // 等待并多次检查URL变化
        for (let i = 0; i < 10; i++) {
          await page.waitForTimeout(300);
          await checkURL();
        }
        
        console.log('📍 URL变化历史:', urlChanges);
        
        // 检查点击后状态
        const afterClickUrl = page.url();
        console.log('📍 最终URL:', afterClickUrl);
        console.log('🔄 URL是否改变:', initialUrl !== afterClickUrl);
        
        // 显示所有新增的控制台日志
        console.log('📋 点击后的所有控制台日志:');
        allLogs.forEach((log, i) => {
          console.log(`  ${i+1}. ${log}`);
        });
        
        // 检查是否有错误或异常
        const pageErrors = await page.evaluate(() => {
          // 检查React错误边界或其他错误
          const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
          return {
            hasErrorElements: errorElements.length > 0,
            errorCount: errorElements.length,
            lastError: window.lastError || null // 如果应用设置了全局错误处理
          };
        });
        
        console.log('📊 错误检查:', pageErrors);
        
        // 尝试手动执行导航函数（如果能访问到的话）
        console.log('🔧 尝试手动执行导航...');
        const manualNavResult = await page.evaluate(() => {
          try {
            // 尝试直接操作window.history
            window.history.pushState({}, '', '/QRScanner');
            return { success: true, method: 'pushState' };
          } catch (error) {
            try {
              // 尝试设置location
              window.location.hash = '#/QRScanner';
              return { success: true, method: 'hash' };
            } catch (error2) {
              return { 
                success: false, 
                error: error instanceof Error ? error.message : String(error),
                error2: error2 instanceof Error ? error2.message : String(error2)
              };
            }
          }
        });
        
        console.log('🔧 手动导航结果:', manualNavResult);
        
        // 等待看看手动导航是否生效
        await page.waitForTimeout(2000);
        const finalUrl = page.url();
        console.log('📍 手动导航后URL:', finalUrl);
        
        // 截图保存最终状态
        await page.screenshot({
          path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/navigation-debug.png',
          fullPage: true
        });
        
      } else {
        console.log('❌ 未找到扫码按钮');
      }
      
    } else {
      console.log('❌ 未找到category bar');
    }

    console.log('✅ 导航功能调试完成');
  });
});




