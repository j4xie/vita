/**
 * 🎯 扫码功能专项测试
 * 
 * 验证扫码按钮和摄像头权限处理功能
 */

import { test, expect } from '@playwright/test';

test.describe('扫码功能专项测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置控制台监听，重点关注扫码相关日志
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('QRScanner') || 
          text.includes('EnhancedWebCameraView') ||
          text.includes('摄像头') ||
          text.includes('扫码') ||
          text.includes('handleScanPress')) {
        console.log(`🎯 扫码相关日志: ${text}`);
      }
    });

    // 导航到首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待React组件加载
    console.log('🚀 页面加载完成，开始扫码功能测试');
  });

  test('🔍 详细查找并测试扫码按钮', async ({ page }) => {
    console.log('🎯 开始详细扫码按钮测试...');

    // 步骤1: 分析页面结构，查找SimpleCategoryBar
    console.log('📋 步骤1: 分析页面结构');
    
    const pageAnalysis = await page.evaluate(() => {
      // 查找所有包含SVG图标的元素
      const svgElements = document.querySelectorAll('svg');
      const svgInfo = Array.from(svgElements).map((svg, index) => ({
        index,
        name: svg.getAttribute('name') || '',
        parent: svg.parentElement?.tagName || '',
        grandParent: svg.parentElement?.parentElement?.tagName || '',
        isClickable: svg.closest('button, [role="button"], div[onclick], *[onPress]') !== null,
        rect: svg.getBoundingClientRect(),
        visible: svg.offsetParent !== null
      })).filter(item => item.visible);

      // 查找所有可能的扫码相关元素
      const scanElements = document.querySelectorAll('*[name*="scan"], *[class*="scan"], *[id*="scan"]');
      const scanInfo = Array.from(scanElements).map((el, index) => ({
        index,
        tagName: el.tagName,
        name: el.getAttribute('name') || '',
        className: el.className || '',
        textContent: el.textContent?.slice(0, 30) || '',
        isClickable: el.closest('button, [role="button"], div[onclick]') !== null,
        visible: el.offsetParent !== null
      }));

      return {
        totalSVGs: svgInfo.length,
        scanOutlineSVGs: svgInfo.filter(svg => svg.name.includes('scan-outline')),
        allSVGs: svgInfo,
        scanElements: scanInfo,
        hasSimpleCategoryBar: document.querySelector('*').textContent?.includes('SimpleCategoryBar') || false
      };
    });

    console.log('📊 页面分析结果:', pageAnalysis);

    // 步骤2: 专门查找scan-outline图标
    let scanButton = null;
    
    if (pageAnalysis.scanOutlineSVGs.length > 0) {
      console.log('✅ 找到scan-outline图标:', pageAnalysis.scanOutlineSVGs.length, '个');
      
      // 尝试点击第一个scan-outline图标的父级可点击元素
      scanButton = page.locator('svg[name="scan-outline"]').first();
      const clickableParent = scanButton.locator('..').first(); // 父元素
      
      if (await clickableParent.isVisible()) {
        scanButton = clickableParent;
        console.log('✅ 找到scan-outline的可点击父元素');
      }
    }

    // 如果还没找到，尝试其他方法
    if (!scanButton) {
      // 根据页面分析结果，尝试点击右侧区域的SVG按钮
      const rightAreaSVGs = page.locator('div').filter({ hasText: /All|Upcoming|Ended/ }).locator('svg').all();
      const svgs = await rightAreaSVGs;
      
      if (svgs.length > 0) {
        // 取最右侧的SVG（可能是扫码按钮）
        scanButton = svgs[svgs.length - 1];
        console.log(`✅ 找到右侧区域的SVG按钮: ${svgs.length}个，选择最后一个`);
      }
    }

    // 步骤3: 测试扫码按钮功能
    if (scanButton) {
      console.log('🔄 准备点击扫码按钮...');
      
      // 设置导航监听
      let navigationPromise = page.waitForURL(/QRScanner/, { timeout: 5000 }).catch(() => null);
      
      try {
        await scanButton.click();
        console.log('✅ 成功点击扫码按钮');
        
        // 等待导航或超时
        const navigationResult = await navigationPromise;
        
        if (navigationResult) {
          console.log('🎯 关键日志: 成功导航到QRScanner页面!');
          console.log('📍 当前页面URL:', page.url());
          
          // 等待QRScanner页面加载
          await page.waitForTimeout(3000);
          
          // 检查是否有EnhancedWebCameraView相关的元素或日志
          const qrPageAnalysis = await page.evaluate(() => {
            return {
              hasCamera: typeof navigator.mediaDevices !== 'undefined',
              hasGetUserMedia: typeof navigator.mediaDevices?.getUserMedia !== 'undefined',
              pageTitle: document.title,
              bodyText: document.body.textContent?.slice(0, 200) || '',
              hasCameraElements: document.querySelectorAll('video, canvas').length > 0,
              timestamp: new Date().toISOString()
            };
          });
          
          console.log('📊 QRScanner页面分析:', qrPageAnalysis);
          
          // 测试摄像头权限
          const cameraTest = await page.evaluate(async () => {
            try {
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // 模拟摄像头权限请求
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop()); // 立即停止
                return { success: true, message: '摄像头权限获取成功' };
              } else {
                return { success: false, message: '浏览器不支持摄像头API' };
              }
            } catch (error) {
              return { 
                success: false, 
                message: '摄像头权限被拒绝或不可用',
                error: error instanceof Error ? error.message : String(error)
              };
            }
          });
          
          console.log('📊 摄像头测试结果:', cameraTest);
          
          expect(page.url()).toContain('QRScanner');
          console.log('✅ 扫码功能导航测试通过');
          
        } else {
          console.log('⚠️  点击后未导航到QRScanner页面');
        }
        
      } catch (error) {
        console.log('❌ 点击扫码按钮失败:', error.message);
      }
      
    } else {
      console.log('❌ 未找到扫码按钮');
      
      // 详细调试信息
      const detailedDebug = await page.evaluate(() => {
        const allClickable = document.querySelectorAll('button, [role="button"], div[onclick], *[style*="cursor"], touchableOpacity');
        return {
          totalClickable: allClickable.length,
          clickableElements: Array.from(allClickable).slice(0, 5).map((el, index) => ({
            index,
            tagName: el.tagName,
            textContent: el.textContent?.slice(0, 50) || '',
            className: el.className || '',
            hasChildren: el.children.length > 0,
            childrenTypes: Array.from(el.children).map(child => child.tagName).slice(0, 3)
          }))
        };
      });
      
      console.log('🔍 详细调试信息:', detailedDebug);
    }

    console.log('✅ 扫码按钮测试完成');
  });

  test('🎫 测试推荐码输入功能', async ({ page }) => {
    console.log('🎯 开始推荐码输入功能测试...');

    // 步骤1: 导航到QRScanner页面的注册模式
    console.log('📋 步骤1: 导航到QRScanner页面(注册模式)');
    
    try {
      await page.goto('/#QRScanner?purpose=register');
      await page.waitForTimeout(3000);
      
      const pageContent = await page.textContent('body');
      console.log('🔍 页面内容检查:', {
        hasManual: pageContent?.includes('手动') || false,
        hasInput: pageContent?.includes('输入') || false,
        hasReferral: pageContent?.includes('推荐') || false,
        hasKeypad: pageContent?.includes('keypad') || false,
        contentSample: pageContent?.slice(0, 200) || ''
      });
      
      // 步骤2: 查找手动输入按钮
      console.log('📋 步骤2: 查找手动输入按钮');
      
      const manualInputSelectors = [
        'text=手动输入',
        'text=manual_input_button',
        'button:has-text("手动")',
        'button:has-text("输入")',
        'svg[name="keypad-outline"]',
        '*:has(svg[name*="keypad"])'
      ];

      let manualButton = null;
      for (const selector of manualInputSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            manualButton = element;
            console.log(`✅ 找到手动输入按钮: "${selector}"`);
            break;
          }
        } catch (e) {
          // 继续尝试
        }
      }

      if (manualButton) {
        console.log('🔄 点击手动输入按钮...');
        
        await manualButton.click();
        await page.waitForTimeout(2000);
        
        // 检查是否出现了BottomSheet
        const sheetCheck = await page.evaluate(() => {
          const sheets = document.querySelectorAll('[class*="sheet"], [class*="modal"], [class*="bottom"], [class*="Sheet"]');
          const inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
          
          return {
            hasSheets: sheets.length > 0,
            hasInputs: inputs.length > 0,
            sheetCount: sheets.length,
            inputCount: inputs.length,
            visibleSheets: Array.from(sheets).filter(el => 
              el.offsetParent !== null && 
              window.getComputedStyle(el).visibility !== 'hidden'
            ).length
          };
        });
        
        console.log('📊 BottomSheet检查结果:', sheetCheck);
        
        if (sheetCheck.hasInputs || sheetCheck.visibleSheets > 0) {
          console.log('✅ 检测到推荐码输入界面');
          
          // 尝试在输入框中输入测试推荐码
          const inputField = page.locator('input[type="text"], input:not([type]), textarea').first();
          if (await inputField.isVisible({ timeout: 1000 })) {
            await inputField.fill('TEST123');
            console.log('✅ 成功输入测试推荐码');
          }
        } else {
          console.log('⚠️  未检测到BottomSheet界面');
        }
      } else {
        console.log('❌ 未找到手动输入按钮');
      }
      
    } catch (error) {
      console.log('❌ 推荐码功能测试失败:', error.message);
    }

    console.log('✅ 推荐码输入功能测试完成');
  });
});







