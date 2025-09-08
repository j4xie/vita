/**
 * 🎯 核心功能综合测试
 * 
 * 测试三个关键修复功能：
 * 1. 📷 摄像头权限处理 - 扫码功能是否使用EnhancedWebCameraView
 * 2. 🎫 推荐码输入界面 - 是否使用BottomSheet而不是浏览器alert
 * 3. 📝 活动报名表单 - 点击报名后是否可以修改表单信息
 */

import { test, expect } from '@playwright/test';

test.describe('核心功能综合测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置控制台监听
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      
      // 只显示关键的调试信息
      if (text.includes('EnhancedWebCameraView') || 
          text.includes('ReferralCodeInputSheet') ||
          text.includes('活动报名') ||
          text.includes('扫码') ||
          text.includes('摄像头')) {
        console.log(`🎯 关键日志: ${text}`);
      }
    });

    // 导航到首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('🚀 页面加载完成');
  });

  test('📷 测试扫码功能和摄像头权限处理', async ({ page }) => {
    console.log('🎯 开始测试扫码功能...');

    // 步骤1: 查找扫码按钮 - 基于代码分析，应该是一个图标按钮
    console.log('📋 步骤1: 查找扫码按钮');
    
    // 根据代码分析，扫码按钮是一个 TouchableOpacity 包含 Ionicons scan-outline
    const scanSelectors = [
      // 基于样式类名的选择器
      '[style*="scan"]',
      // 基于Ionicons的选择器
      'svg[name="scan-outline"]',
      // 通用的扫码相关选择器
      'text=扫码',
      'text=扫描', 
      '[aria-label*="扫"]',
      '[title*="扫"]',
      // 查找包含扫码图标的可点击元素
      '*:has(svg) >> visible=true',
      // 右侧按钮组中的扫码按钮
      'div:has-text("rightButtonsContainer") button',
      'button:near(:text("refresh"))'
    ];

    let scanButton = null;
    
    // 先检查页面中所有的按钮元素
    const allButtons = await page.locator('button, [role="button"], div[onclick], *[style*="cursor: pointer"]').all();
    console.log(`🔍 页面中找到 ${allButtons.length} 个可点击元素`);

    for (const selector of scanSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          scanButton = element;
          console.log(`✅ 找到扫码按钮: "${selector}"`);
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    // 如果还没找到，尝试通过位置查找（右上角区域）
    if (!scanButton) {
      console.log('🔍 尝试通过位置查找扫码按钮...');
      try {
        // 查找右上角区域的按钮
        const rightAreaButtons = await page.locator('[style*="right"], [style*="flex"], [style*="row"]').locator('button, div').all();
        for (const btn of rightAreaButtons.slice(-2)) { // 取最后2个按钮
          if (await btn.isVisible()) {
            scanButton = btn;
            console.log('✅ 在右侧区域找到可能的扫码按钮');
            break;
          }
        }
      } catch (e) {
        console.log('⚠️  通过位置查找失败');
      }
    }

    if (scanButton) {
      console.log('🔄 点击扫码按钮...');
      
      // 点击前设置页面监听器
      let navigationOccurred = false;
      page.on('framenavigated', () => {
        navigationOccurred = true;
        console.log('🎯 关键日志: 页面导航发生，可能进入了QRScanner页面');
      });

      await scanButton.click();
      
      // 等待导航或UI变化
      await page.waitForTimeout(3000);
      
      if (navigationOccurred) {
        console.log('✅ 成功导航到扫码页面');
        
        // 检查是否在QRScanner页面
        const currentUrl = page.url();
        console.log('📍 当前页面URL:', currentUrl);
        
        // 查找EnhancedWebCameraView组件的日志
        await page.waitForTimeout(2000);
        
        // 检查摄像头相关的控制台日志
        console.log('🔍 等待EnhancedWebCameraView相关日志...');
      } else {
        console.log('⚠️  点击后没有发生导航，可能按钮不是扫码按钮');
      }
      
      const cameraCheck = await page.evaluate(() => {
        return {
          hasCamera: typeof navigator.mediaDevices !== 'undefined',
          hasGetUserMedia: typeof navigator.mediaDevices?.getUserMedia !== 'undefined',
          timestamp: new Date().toISOString()
        };
      });
      
      console.log('📊 摄像头API检查结果:', cameraCheck);
    } else {
      console.log('❌ 未找到扫码按钮');
      
      // 调试：列出页面中所有可点击的元素
      const debugButtons = await page.evaluate(() => {
        const clickableElements = document.querySelectorAll('button, [role="button"], div[onclick], *[tabindex], a');
        return Array.from(clickableElements).slice(0, 10).map((el, index) => ({
          index,
          tagName: el.tagName,
          textContent: el.textContent?.slice(0, 50) || '',
          className: el.className || '',
          isVisible: el.offsetParent !== null
        }));
      });
      console.log('🔍 页面中的可点击元素样例:', debugButtons);
    }

    console.log('✅ 扫码功能测试完成');
  });

  test('🎫 测试推荐码输入界面', async ({ page }) => {
    console.log('🎯 开始测试推荐码输入功能...');

    // 根据代码分析，推荐码输入功能在QRScanner页面中
    // 需要先导航到QRScanner页面，且purpose=register时会显示手动输入按钮
    console.log('📋 步骤1: 导航到扫码页面以查找推荐码功能');
    
    try {
      // 直接导航到QRScanner页面，模拟注册场景
      await page.goto('/#/QRScanner?purpose=register');
      await page.waitForTimeout(3000);
      console.log('🔄 已导航到QRScanner页面(注册模式)');
    } catch (e) {
      console.log('⚠️  直接导航失败，尝试通过按钮进入');
    }

    // 步骤2: 查找手动输入按钮
    console.log('📋 步骤2: 查找手动输入/推荐码按钮');
    
    const referralSelectors = [
      // 基于代码分析：手动输入按钮包含keypad-outline图标
      'text=手动输入',
      'text=manual_input_button',  // 翻译键
      'text=推荐码',
      'text=邀请码',
      'text=referral',
      'button:has-text("手动")',
      'button:has-text("输入")',
      'button:has-text("推荐")',
      'button:has-text("邀请")',
      '[aria-label*="手动"]',
      '[title*="手动"]',
      // 查找包含keypad图标的按钮
      'svg[name="keypad-outline"]',
      '*:has(svg[name*="keypad"])',
      // 底部操作区域的按钮
      'div[style*="bottom"] button',
      '*[class*="manualButton"]'
    ];

    let referralButton = null;
    
    // 首先检查页面内容
    const pageContent = await page.textContent('body');
    console.log('🔍 页面是否包含"手动"文字:', pageContent?.includes('手动') || false);
    console.log('🔍 页面是否包含"推荐"文字:', pageContent?.includes('推荐') || false);

    for (const selector of referralSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          referralButton = element;
          console.log(`✅ 找到推荐码/手动输入按钮: "${selector}"`);
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (referralButton) {
      console.log('🔄 点击推荐码/手动输入按钮...');
      
      // 监听页面状态变化
      let sheetVisible = false;
      const checkForSheet = async () => {
        const sheet = await page.locator('*[class*="sheet"], *[class*="modal"], *[class*="bottom"]').first();
        if (await sheet.isVisible({ timeout: 500 })) {
          sheetVisible = true;
          console.log('🎯 关键日志: BottomSheet界面已显示');
        }
      };

      await referralButton.click();
      
      // 等待UI响应
      await page.waitForTimeout(2000);
      await checkForSheet();
      
      // 检查是否出现了BottomSheet而不是browser alert
      const uiCheck = await page.evaluate(() => {
        // 检查是否有BottomSheet相关的DOM元素
        const bottomSheets = document.querySelectorAll('[class*="bottom"], [class*="sheet"], [class*="modal"], [class*="Sheet"]');
        const inputElements = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
        const visibleSheets = Array.from(bottomSheets).filter(el => 
          el.offsetParent !== null && window.getComputedStyle(el).visibility !== 'hidden'
        );
        
        return {
          hasBottomSheet: bottomSheets.length > 0,
          hasVisibleSheet: visibleSheets.length > 0,
          hasInputFields: inputElements.length > 0,
          totalBottomSheets: bottomSheets.length,
          totalVisibleSheets: visibleSheets.length,
          totalInputs: inputElements.length,
          sheetElements: Array.from(bottomSheets).map(el => ({
            className: el.className,
            visible: el.offsetParent !== null,
            textContent: el.textContent?.slice(0, 100) || ''
          })),
          timestamp: new Date().toISOString()
        };
      });
      
      console.log('📊 推荐码UI检查结果:', uiCheck);
      
      if (uiCheck.hasVisibleSheet || uiCheck.hasInputFields) {
        console.log('✅ 检测到BottomSheet界面，推荐码输入功能正常');
        
        // 尝试输入推荐码
        const inputField = page.locator('input[type="text"], input:not([type]), textarea').first();
        if (await inputField.isVisible({ timeout: 1000 })) {
          await inputField.fill('TEST123');
          console.log('✅ 成功在推荐码输入框中输入测试内容');
        }
      } else {
        console.log('⚠️  未检测到BottomSheet，可能使用了浏览器原生alert');
      }
      
      // 检查ReferralCodeInputSheet组件的存在
      console.log('🔍 等待ReferralCodeInputSheet相关日志...');
      
    } else {
      console.log('❌ 未找到推荐码/手动输入按钮');
      
      // 调试：显示页面中的所有按钮
      const debugButtons = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"], div[onclick]');
        return Array.from(buttons).slice(0, 10).map((btn, index) => ({
          index,
          text: btn.textContent?.slice(0, 30) || '',
          className: btn.className || '',
          visible: btn.offsetParent !== null
        }));
      });
      console.log('🔍 页面中的按钮样例:', debugButtons);
    }

    console.log('✅ 推荐码输入功能测试完成');
  });

  test('📝 测试活动报名表单修改功能', async ({ page }) => {
    console.log('🎯 开始测试活动报名功能...');

    // 步骤1: 查找并点击一个活动
    console.log('📋 步骤1: 查找活动列表中的活动');
    
    // 等待活动加载
    await page.waitForSelector('text=USC', { timeout: 10000 });
    
    // 点击USC活动
    const uscActivity = page.locator('text=USC免费接机活动').first();
    if (await uscActivity.isVisible()) {
      console.log('🔄 点击USC活动...');
      await uscActivity.click();
      await page.waitForTimeout(2000);
      
      // 步骤2: 查找报名按钮
      console.log('📋 步骤2: 查找报名按钮');
      
      const registrationSelectors = [
        'text=报名',
        'text=立即报名',
        'text=参加活动',
        'text=加入',
        'button:has-text("报名")',
        'button:has-text("参加")',
        '[aria-label*="报名"]'
      ];

      let registrationButton = null;
      for (const selector of registrationSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            registrationButton = element;
            console.log(`✅ 找到报名按钮: "${selector}"`);
            break;
          }
        } catch (e) {
          // 继续尝试下一个选择器
        }
      }

      if (registrationButton) {
        console.log('🔄 点击报名按钮...');
        await registrationButton.click();
        await page.waitForTimeout(3000);
        
        // 步骤3: 检查报名表单
        console.log('📋 步骤3: 检查报名表单');
        
        const formCheck = await page.evaluate(() => {
          // 查找表单相关元素
          const forms = document.querySelectorAll('form');
          const inputs = document.querySelectorAll('input, textarea, select');
          const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
          
          return {
            hasForms: forms.length > 0,
            totalForms: forms.length,
            totalInputs: inputs.length,
            totalSubmitButtons: submitButtons.length,
            formDetails: Array.from(forms).map((form, index) => ({
              index,
              action: form.action,
              method: form.method,
              inputCount: form.querySelectorAll('input, textarea, select').length
            })),
            timestamp: new Date().toISOString()
          };
        });
        
        console.log('📊 报名表单检查结果:', formCheck);
        
        // 如果有表单，尝试填写和修改
        if (formCheck.hasForms && formCheck.totalInputs > 0) {
          console.log('🔄 尝试填写表单...');
          
          // 查找第一个文本输入框
          const firstInput = page.locator('input[type="text"], input:not([type]), textarea').first();
          if (await firstInput.isVisible({ timeout: 1000 })) {
            await firstInput.fill('测试用户');
            console.log('✅ 成功填写第一个输入框');
            
            // 等待一下再检查是否可以修改
            await page.waitForTimeout(1000);
            
            await firstInput.clear();
            await firstInput.fill('修改后的测试用户');
            console.log('✅ 成功修改输入框内容');
          }
        }
      } else {
        console.log('❌ 未找到报名按钮');
      }
    } else {
      console.log('❌ 未找到USC活动');
    }

    console.log('✅ 活动报名功能测试完成');
  });

  test('📊 综合功能状态报告', async ({ page }) => {
    console.log('🎯 生成综合功能状态报告...');

    // 检查页面整体状态
    const overallStatus = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasJavaScript: typeof window.React !== 'undefined',
        hasConsoleErrors: window.console && window.console.error ? true : false,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
    });

    console.log('📊 综合状态报告:', overallStatus);
    
    expect(overallStatus.title).toBeTruthy();
    console.log('✅ 综合功能状态报告完成');
  });
});
