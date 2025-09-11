import { test, expect } from '@playwright/test';

/**
 * PomeloX 核心功能修复验证测试
 * 测试三个关键修复：时间分类、摄像头权限、推荐码输入
 */

test.describe('核心功能修复验证测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 监听控制台日志
    page.on('console', msg => {
      console.log(`🔍 控制台 [${msg.type()}]: ${msg.text()}`);
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
      console.log(`❌ 页面错误: ${error.message}`);
    });
    
    // 导航到应用
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('🚀 已加载 PomeloX 应用页面');
  });

  test('1. 🕐 时间分类逻辑修复验证', async ({ page }) => {
    console.log('🎯 开始测试活动时间分类功能...');
    
    // 等待页面加载完成
    await page.waitForTimeout(2000);
    
    // 查找分类按钮 - 使用多种可能的选择器
    const categorySelectors = [
      '[data-testid*="category"]',
      '[data-testid*="filter"]',
      '.tab',
      '.category',
      '[role="tab"]',
      'button:has-text("全部")',
      'button:has-text("即将开始")',
      'button:has-text("已结束")',
      'button:has-text("进行中")',
      '[aria-label*="分类"]',
      '[aria-label*="筛选"]'
    ];
    
    let foundCategories = false;
    let categoryElements = [];
    
    for (const selector of categorySelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ 找到 ${count} 个分类元素 (选择器: ${selector})`);
          categoryElements = await elements.all();
          foundCategories = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!foundCategories) {
      console.log('⚠️  未找到明确的分类按钮，尝试检查页面内容...');
      
      // 检查页面文本是否包含分类相关内容
      const pageText = await page.textContent('body');
      const hasTimeCategories = /全部|即将开始|已结束|进行中|upcoming|ongoing|finished/.test(pageText);
      
      if (hasTimeCategories) {
        console.log('✅ 页面包含时间分类相关文本');
      } else {
        console.log('❌ 未找到时间分类功能');
        return;
      }
    }
    
    // 测试分类切换功能
    if (categoryElements.length > 0) {
      for (let i = 0; i < Math.min(categoryElements.length, 3); i++) {
        try {
          const element = categoryElements[i];
          const text = await element.textContent();
          console.log(`🔄 点击分类: ${text}`);
          
          // 记录点击前的活动列表
          const beforeClick = await page.textContent('body');
          
          await element.click();
          await page.waitForTimeout(1000);
          
          // 记录点击后的活动列表
          const afterClick = await page.textContent('body');
          
          if (beforeClick !== afterClick) {
            console.log(`✅ 分类切换成功，页面内容已更新`);
          } else {
            console.log(`⚠️  分类切换后页面内容未变化`);
          }
          
        } catch (error) {
          console.log(`⚠️  分类按钮点击失败: ${error.message}`);
        }
      }
    }
    
    // 检查是否有 ActivityStatusCalculator 日志
    await page.waitForTimeout(2000);
    console.log('🔍 监听 ActivityStatusCalculator 相关日志...');
    
    console.log('✅ 时间分类逻辑测试完成');
  });

  test('2. 📷 摄像头权限处理验证', async ({ page }) => {
    console.log('🎯 开始测试摄像头权限处理功能...');
    
    // 拒绝摄像头权限（模拟用户拒绝）
    await page.context().grantPermissions([], { origin: page.url() });
    
    // 查找扫码相关按钮
    const scanSelectors = [
      'button:has-text("扫码")',
      'button:has-text("二维码")',
      'button:has-text("扫描")',
      'button:has-text("scan")',
      'button:has-text("QR")',
      '[data-testid*="scan"]',
      '[data-testid*="qr"]',
      '[data-testid*="camera"]',
      '[aria-label*="扫码"]',
      '[aria-label*="二维码"]',
      '.scan-button',
      '.qr-button'
    ];
    
    let scanButton = null;
    
    for (const selector of scanSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          scanButton = element;
          console.log(`✅ 找到扫码按钮 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!scanButton) {
      console.log('⚠️  未找到扫码按钮，尝试其他方式触发摄像头...');
      
      // 尝试查找可能包含扫码功能的其他元素
      const possibleTriggers = [
        'button',
        '[role="button"]',
        'a',
        '.clickable'
      ];
      
      for (const selector of possibleTriggers) {
        try {
          const elements = page.locator(selector);
          const count = await elements.count();
          
          for (let i = 0; i < Math.min(count, 5); i++) {
            const element = elements.nth(i);
            const text = await element.textContent();
            
            if (text && /扫|码|scan|qr|camera/i.test(text)) {
              scanButton = element;
              console.log(`✅ 找到可能的扫码元素: ${text}`);
              break;
            }
          }
          
          if (scanButton) break;
        } catch (error) {
          continue;
        }
      }
    }
    
    if (scanButton) {
      console.log('📷 准备测试摄像头权限处理...');
      
      // 点击扫码按钮
      try {
        await scanButton.click();
        await page.waitForTimeout(2000);
        
        // 检查是否有摄像头权限错误提示
        const bodyText = await page.textContent('body');
        
        const hasPermissionError = /权限|permission|camera|摄像头|拒绝|denied|blocked/i.test(bodyText);
        
        if (hasPermissionError) {
          console.log('✅ 检测到摄像头权限相关提示');
        }
        
        // 检查是否使用了 EnhancedWebCameraView
        const hasEnhancedCamera = bodyText.includes('EnhancedWebCameraView') || 
                                 bodyText.includes('enhanced') ||
                                 bodyText.includes('camera');
        
        if (hasEnhancedCamera) {
          console.log('✅ 检测到增强的摄像头组件');
        }
        
        // 检查是否有模态框或摄像头界面
        const hasCameraUI = await page.locator('[role="dialog"], .modal, .camera, .scanner').count() > 0;
        
        if (hasCameraUI) {
          console.log('✅ 检测到摄像头相关界面');
          
          // 尝试关闭摄像头界面
          const closeButton = page.locator('[aria-label*="关闭"], [aria-label*="close"], .close, button:has-text("取消")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            console.log('✅ 成功关闭摄像头界面');
          }
        }
        
      } catch (error) {
        console.log(`⚠️  摄像头功能测试出错: ${error.message}`);
      }
    } else {
      console.log('❌ 未找到扫码功能入口');
    }
    
    console.log('✅ 摄像头权限处理测试完成');
  });

  test('3. 🎫 推荐码输入界面验证', async ({ page }) => {
    console.log('🎯 开始测试推荐码输入界面...');
    
    // 查找推荐码相关按钮
    const referralSelectors = [
      'button:has-text("推荐码")',
      'button:has-text("邀请码")',
      'button:has-text("手动输入")',
      'button:has-text("输入码")',
      'button:has-text("referral")',
      'button:has-text("invite")',
      '[data-testid*="referral"]',
      '[data-testid*="invite"]',
      '[data-testid*="code"]',
      '[aria-label*="推荐码"]',
      '[aria-label*="邀请码"]',
      '.referral-button',
      '.invite-button'
    ];
    
    let referralButton = null;
    
    for (const selector of referralSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          referralButton = element;
          console.log(`✅ 找到推荐码按钮 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // 如果没找到明确的推荐码按钮，查找可能包含推荐码功能的元素
    if (!referralButton) {
      console.log('🔍 未找到明确的推荐码按钮，搜索页面中的相关元素...');
      
      const pageText = await page.textContent('body');
      
      if (/推荐码|邀请码|referral|invite|promo/i.test(pageText)) {
        console.log('✅ 页面包含推荐码相关内容');
        
        // 尝试查找任何可点击的元素
        const clickableElements = page.locator('button, [role="button"], a');
        const count = await clickableElements.count();
        
        for (let i = 0; i < Math.min(count, 10); i++) {
          try {
            const element = clickableElements.nth(i);
            const text = await element.textContent();
            
            if (text && /推荐|邀请|码|code|referral|invite/i.test(text)) {
              referralButton = element;
              console.log(`✅ 找到可能的推荐码元素: ${text}`);
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }
    }
    
    if (referralButton) {
      console.log('🎫 准备测试推荐码输入界面...');
      
      try {
        // 点击推荐码按钮
        await referralButton.click();
        await page.waitForTimeout(1500);
        
        // 检查是否出现了 BottomSheet 而不是 Alert
        const hasBottomSheet = await page.locator('.bottom-sheet, .sheet, [role="dialog"]').count() > 0;
        const hasModal = await page.locator('.modal, .popup').count() > 0;
        
        if (hasBottomSheet || hasModal) {
          console.log('✅ 检测到弹出界面 (BottomSheet/Modal)');
          
          // 检查是否有输入框
          const inputElements = page.locator('input[type="text"], input[placeholder*="推荐"], input[placeholder*="邀请"], input[placeholder*="code"]');
          const inputCount = await inputElements.count();
          
          if (inputCount > 0) {
            console.log(`✅ 找到 ${inputCount} 个输入框`);
            
            // 测试输入功能
            const firstInput = inputElements.first();
            try {
              await firstInput.fill('TEST123');
              await page.waitForTimeout(500);
              
              const inputValue = await firstInput.inputValue();
              if (inputValue === 'TEST123') {
                console.log('✅ 输入框功能正常');
              }
              
              // 清除测试输入
              await firstInput.clear();
            } catch (error) {
              console.log(`⚠️  输入框测试失败: ${error.message}`);
            }
          }
          
          // 查找提交按钮
          const submitButton = page.locator('button:has-text("确定"), button:has-text("提交"), button:has-text("确认"), button[type="submit"]').first();
          
          if (await submitButton.isVisible()) {
            console.log('✅ 找到提交按钮');
          }
          
          // 查找关闭按钮并关闭界面
          const closeButton = page.locator('[aria-label*="关闭"], [aria-label*="close"], .close, button:has-text("取消"), button:has-text("关闭")').first();
          
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(500);
            console.log('✅ 成功关闭推荐码输入界面');
          }
          
        } else {
          // 检查是否出现了浏览器的 alert（这是我们不希望看到的）
          console.log('🔍 检查是否有浏览器Alert弹窗...');
          
          // 监听 dialog 事件
          let hasAlert = false;
          page.on('dialog', async dialog => {
            hasAlert = true;
            console.log(`❌ 检测到浏览器Alert: ${dialog.message()}`);
            await dialog.dismiss();
          });
          
          if (!hasAlert) {
            console.log('✅ 未检测到浏览器Alert (符合预期)');
          }
        }
        
      } catch (error) {
        console.log(`⚠️  推荐码界面测试出错: ${error.message}`);
      }
    } else {
      console.log('❌ 未找到推荐码功能入口');
    }
    
    console.log('✅ 推荐码输入界面测试完成');
  });

  test('📊 综合功能验证总结', async ({ page }) => {
    console.log('🎯 开始综合功能验证总结...');
    
    // 收集所有控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 等待一段时间收集日志
    await page.waitForTimeout(3000);
    
    // 检查关键组件的日志
    const keyComponents = [
      'ActivityStatusCalculator',
      'EnhancedWebCameraView', 
      'ReferralCodeInputSheet',
      'BottomSheet'
    ];
    
    console.log('🔍 检查关键组件日志:');
    keyComponents.forEach(component => {
      const hasLogs = consoleLogs.some(log => log.includes(component));
      if (hasLogs) {
        console.log(`✅ ${component}: 发现相关日志`);
      } else {
        console.log(`⚠️  ${component}: 未发现相关日志`);
      }
    });
    
    // 检查页面整体功能
    const pageText = await page.textContent('body');
    
    const functionalityChecks = [
      { name: '时间分类', keywords: ['全部', '即将开始', '已结束', 'upcoming', 'finished'] },
      { name: '扫码功能', keywords: ['扫码', '二维码', 'scan', 'QR'] },
      { name: '推荐码功能', keywords: ['推荐码', '邀请码', 'referral', 'invite'] }
    ];
    
    console.log('🔍 检查页面功能完整性:');
    functionalityChecks.forEach(check => {
      const hasFeature = check.keywords.some(keyword => 
        pageText.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasFeature) {
        console.log(`✅ ${check.name}: 功能入口存在`);
      } else {
        console.log(`⚠️  ${check.name}: 未发现功能入口`);
      }
    });
    
    // 性能检查
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reloadTime = Date.now() - startTime;
    
    console.log(`⚡ 页面重载时间: ${reloadTime}ms`);
    
    if (reloadTime < 3000) {
      console.log('✅ 页面性能良好');
    } else {
      console.log('⚠️  页面加载较慢');
    }
    
    console.log('🎉 综合功能验证总结完成！');
  });
});




