import { test, expect } from '@playwright/test';

/**
 * 摄像头和活动注册推荐码测试
 * 专门测试用户报告的摄像头功能和活动注册时推荐码输入问题
 */

test.describe('摄像头和推荐码功能测试', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // 授予摄像头权限
    await context.grantPermissions(['camera'], { origin: 'http://localhost:8081' });
    
    // 设置fake媒体流用于测试
    await page.addInitScript(() => {
      // Mock getUserMedia for testing
      Object.defineProperty(window.navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: () => Promise.resolve({
            getTracks: () => [{ stop: () => {} }],
            getVideoTracks: () => [{ stop: () => {} }],
            getAudioTracks: () => [{ stop: () => {} }],
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => {}
          }),
          enumerateDevices: () => Promise.resolve([
            {
              deviceId: 'camera1',
              kind: 'videoinput',
              label: 'Test Camera',
              groupId: 'group1'
            }
          ])
        }
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('🎥 测试摄像头权限和功能', async ({ page }) => {
    console.log('🎥 开始测试摄像头功能...');
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 查找摄像头相关按钮或组件
    const cameraSelectors = [
      '[data-testid*="camera"]',
      '[aria-label*="相机"]',
      '[aria-label*="camera"]',
      'button[class*="camera"]',
      '.camera-button',
      '[class*="Camera"]',
      'svg[class*="camera"]',
      '[role="button"]:has-text("扫描")',
      '[role="button"]:has-text("相机")',
      'button:has-text("扫码")',
      'button:has-text("扫描")'
    ];
    
    let cameraElement = null;
    for (const selector of cameraSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          cameraElement = element;
          console.log(`✅ 找到摄像头按钮 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (cameraElement) {
      // 测试点击摄像头按钮
      console.log('🔍 测试点击摄像头按钮...');
      await cameraElement.click();
      await page.waitForTimeout(2000);
      
      // 检查是否出现摄像头界面或权限请求
      const cameraInterface = await page.locator('video, canvas, [class*="camera"], [class*="scanner"]').count();
      console.log(`📹 检测到摄像头界面元素: ${cameraInterface} 个`);
      
      // 检查是否有权限相关的提示
      const permissionElements = await page.locator(':has-text("权限"), :has-text("允许"), :has-text("摄像头"), :has-text("相机")').count();
      console.log(`🔒 检测到权限相关元素: ${permissionElements} 个`);
      
    } else {
      console.log('⚠️  未找到明显的摄像头按钮，检查页面内容...');
      
      // 检查页面是否包含摄像头相关文本
      const pageText = await page.textContent('body');
      const hasCameraText = /相机|摄像头|扫描|扫码|camera|scan/i.test(pageText || '');
      
      if (hasCameraText) {
        console.log('📝 页面包含摄像头相关文本，但未找到可点击元素');
      } else {
        console.log('📝 页面似乎不包含摄像头功能');
      }
    }
    
    console.log('✅ 摄像头功能测试完成');
  });

  test('🎫 测试活动注册推荐码输入功能', async ({ page }) => {
    console.log('🎫 开始测试活动注册推荐码输入...');
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 查找活动列表或活动卡片
    const activitySelectors = [
      '[data-testid*="activity"]',
      '.activity-card',
      'article',
      '[class*="activity"]',
      '[class*="card"]',
      '.list-item'
    ];
    
    let activityElement = null;
    for (const selector of activitySelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          activityElement = elements.first();
          console.log(`✅ 找到活动元素 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (activityElement) {
      console.log('🔍 尝试点击活动进入详情...');
      await activityElement.click();
      await page.waitForTimeout(2000);
      
      // 查找注册或报名按钮
      const registerSelectors = [
        'button:has-text("报名")',
        'button:has-text("注册")',
        'button:has-text("立即报名")',
        'button:has-text("参加")',
        '[data-testid*="register"]',
        '[class*="register"]',
        '[aria-label*="报名"]',
        '[aria-label*="注册"]'
      ];
      
      let registerButton = null;
      for (const selector of registerSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            registerButton = element;
            console.log(`✅ 找到注册按钮 (选择器: ${selector})`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (registerButton) {
        console.log('🔍 点击注册按钮...');
        await registerButton.click();
        await page.waitForTimeout(2000);
        
        // 查找推荐码相关的输入框
        const referralSelectors = [
          'input[placeholder*="推荐码"]',
          'input[placeholder*="referral"]',
          'input[placeholder*="邀请码"]',
          'input[placeholder*="推荐"]',
          'input[name*="referral"]',
          'input[name*="recommend"]',
          '[data-testid*="referral"]',
          '[class*="referral"]',
          'input[type="text"]:near(:has-text("推荐码"))',
          'input[type="text"]:near(:has-text("邀请码"))'
        ];
        
        let referralInput = null;
        for (const selector of referralSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              referralInput = element;
              console.log(`✅ 找到推荐码输入框 (选择器: ${selector})`);
              break;
            }
          } catch (error) {
            continue;
          }
        }
        
        if (referralInput) {
          console.log('🔍 测试推荐码输入功能...');
          
          // 测试输入推荐码
          const testReferralCode = 'TEST123';
          await referralInput.fill(testReferralCode);
          await page.waitForTimeout(1000);
          
          // 验证输入是否成功
          const inputValue = await referralInput.inputValue();
          console.log(`📝 推荐码输入值: "${inputValue}"`);
          
          if (inputValue === testReferralCode) {
            console.log('✅ 推荐码输入功能正常');
          } else {
            console.log('❌ 推荐码输入可能存在问题');
          }
          
          // 测试清空推荐码
          await referralInput.clear();
          await page.waitForTimeout(500);
          const clearedValue = await referralInput.inputValue();
          
          if (clearedValue === '') {
            console.log('✅ 推荐码清空功能正常');
          } else {
            console.log('❌ 推荐码清空可能存在问题');
          }
          
        } else {
          console.log('⚠️  未找到推荐码输入框');
          
          // 检查页面是否包含推荐码相关文本
          const pageText = await page.textContent('body');
          const hasReferralText = /推荐码|邀请码|referral|recommend/i.test(pageText || '');
          
          if (hasReferralText) {
            console.log('📝 页面包含推荐码相关文本，但未找到输入框');
          } else {
            console.log('📝 页面可能不包含推荐码功能');
          }
        }
        
      } else {
        console.log('⚠️  未找到注册按钮');
      }
      
    } else {
      console.log('⚠️  未找到活动元素');
    }
    
    console.log('✅ 推荐码输入测试完成');
  });

  test('🔍 综合功能排查测试', async ({ page }) => {
    console.log('🔍 开始综合功能排查...');
    
    // 监听所有错误
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    const pageErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('requestfailed', request => {
      networkErrors.push(`${request.url()}: ${request.failure()?.errorText}`);
    });
    
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // 等待页面完全加载
    await page.waitForTimeout(5000);
    
    // 收集页面基本信息
    const pageInfo = {
      title: await page.title(),
      url: page.url(),
      hasImages: await page.locator('img').count(),
      hasButtons: await page.locator('button').count(),
      hasInputs: await page.locator('input').count(),
      hasForms: await page.locator('form').count(),
      hasVideo: await page.locator('video').count(),
      hasCanvas: await page.locator('canvas').count()
    };
    
    console.log('📊 页面基本信息:');
    console.log(`  标题: ${pageInfo.title}`);
    console.log(`  URL: ${pageInfo.url}`);
    console.log(`  图片数量: ${pageInfo.hasImages}`);
    console.log(`  按钮数量: ${pageInfo.hasButtons}`);
    console.log(`  输入框数量: ${pageInfo.hasInputs}`);
    console.log(`  表单数量: ${pageInfo.hasForms}`);
    console.log(`  视频元素: ${pageInfo.hasVideo}`);
    console.log(`  Canvas元素: ${pageInfo.hasCanvas}`);
    
    // 检查是否存在常见的功能元素
    const functionalElements = {
      camera: await page.locator('[class*="camera"], [data-testid*="camera"], svg[class*="camera"]').count(),
      referral: await page.locator('[placeholder*="推荐"], [name*="referral"], [class*="referral"]').count(),
      registration: await page.locator('button:has-text("报名"), button:has-text("注册")').count(),
      navigation: await page.locator('nav, [role="navigation"], .navigation').count(),
      search: await page.locator('input[type="search"], input[placeholder*="搜索"]').count()
    };
    
    console.log('🔧 功能元素统计:');
    Object.entries(functionalElements).forEach(([key, count]) => {
      console.log(`  ${key}: ${count} 个`);
    });
    
    // 报告错误情况
    console.log('🚨 错误统计:');
    console.log(`  控制台错误: ${consoleErrors.length}`);
    console.log(`  网络错误: ${networkErrors.length}`);
    console.log(`  页面错误: ${pageErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('控制台错误详情:');
      consoleErrors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('✅ 综合功能排查完成');
  });
});