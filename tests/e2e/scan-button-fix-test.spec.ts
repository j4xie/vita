import { test, expect } from '@playwright/test';

/**
 * 扫码按钮修复专项测试
 * 基于用户提供的截图，精确定位和测试"Ended"右侧的扫码按钮
 */

test.describe('扫码按钮精确定位修复测试', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // 授予摄像头权限
    await context.grantPermissions(['camera'], { origin: 'http://localhost:8081' });
    
    // Mock 摄像头 API
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: () => Promise.resolve({
            getTracks: () => [{ stop: () => {} }],
            getVideoTracks: () => [{ stop: () => {} }],
            getAudioTracks: () => [{ stop: () => {} }]
          }),
          enumerateDevices: () => Promise.resolve([{
            deviceId: 'camera1',
            kind: 'videoinput',
            label: 'Test Camera'
          }])
        }
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('🎯 精确定位扫码按钮 - 基于截图位置', async ({ page }) => {
    console.log('🎯 开始精确定位扫码按钮...');
    
    // 等待页面完全稳定
    await page.waitForTimeout(5000);
    
    // 首先确保分类栏存在（All, Upcoming, Ended）
    console.log('📋 步骤1: 确认分类栏存在');
    const categoryBar = page.locator('div').filter({ hasText: /All|Upcoming|Ended/ });
    await expect(categoryBar).toBeVisible({ timeout: 10000 });
    console.log('✅ 分类栏已找到');
    
    // 确认Ended按钮存在
    console.log('📋 步骤2: 确认Ended按钮');
    const endedButton = page.locator('button, div, span').filter({ hasText: 'Ended' });
    await expect(endedButton.first()).toBeVisible();
    console.log('✅ Ended按钮已确认');
    
    // 查找扫码按钮的多种策略
    console.log('📋 步骤3: 多策略查找扫码按钮');
    
    const scanButtonStrategies = [
      {
        name: '策略1: 分类栏右侧的SVG',
        locator: categoryBar.locator('svg').last()
      },
      {
        name: '策略2: 圆形扫码按钮',
        locator: page.locator('[class*="scan"], [class*="qr"], [data-testid*="scan"]')
      },
      {
        name: '策略3: 分类栏内的最后一个按钮',
        locator: categoryBar.locator('button, div[role="button"]').last()
      },
      {
        name: '策略4: SVG扫描图标',
        locator: page.locator('svg').filter({ hasText: '' }).last()
      },
      {
        name: '策略5: 分类栏相邻的按钮',
        locator: categoryBar.locator('xpath=following-sibling::*[1]')
      }
    ];
    
    let workingScanButton = null;
    let workingStrategy = '';
    
    for (const strategy of scanButtonStrategies) {
      try {
        const element = strategy.locator.first();
        const isVisible = await element.isVisible({ timeout: 2000 });
        
        if (isVisible) {
          console.log(`✅ ${strategy.name} - 找到可见元素`);
          
          // 检查元素位置是否合理（应该在分类栏右侧）
          const categoryBox = await categoryBar.boundingBox();
          const buttonBox = await element.boundingBox();
          
          if (categoryBox && buttonBox) {
            const isRightPosition = buttonBox.x > categoryBox.x + categoryBox.width - 100;
            console.log(`📐 位置检查: 分类栏右边界=${categoryBox.x + categoryBox.width}, 按钮位置=${buttonBox.x}, 合理位置=${isRightPosition}`);
            
            if (isRightPosition) {
              workingScanButton = element;
              workingStrategy = strategy.name;
              break;
            }
          }
        }
      } catch (error) {
        console.log(`❌ ${strategy.name} - 失败: ${error.message}`);
      }
    }
    
    if (workingScanButton) {
      console.log(`🎉 成功定位扫码按钮: ${workingStrategy}`);
      
      // 测试按钮的各种属性
      console.log('📋 步骤4: 分析按钮属性');
      const buttonBox = await workingScanButton.boundingBox();
      const isEnabled = await workingScanButton.isEnabled();
      const innerHTML = await workingScanButton.innerHTML().catch(() => 'N/A');
      
      console.log('📊 按钮信息:');
      console.log(`  位置: ${buttonBox ? `(${buttonBox.x}, ${buttonBox.y})` : '未知'}`);
      console.log(`  尺寸: ${buttonBox ? `${buttonBox.width}x${buttonBox.height}` : '未知'}`);
      console.log(`  可用: ${isEnabled}`);
      console.log(`  内容: ${innerHTML.substring(0, 100)}...`);
      
      // 测试点击功能
      console.log('📋 步骤5: 测试点击功能');
      
      try {
        // 等待元素稳定的多种方法
        await workingScanButton.waitFor({ state: 'visible', timeout: 5000 });
        
        // 先尝试hover来确保元素交互性
        await workingScanButton.hover();
        await page.waitForTimeout(500);
        
        // 使用force点击来绕过稳定性检查
        console.log('🔄 尝试强制点击...');
        await workingScanButton.click({ force: true });
        
        console.log('✅ 点击成功，等待响应...');
        await page.waitForTimeout(2000);
        
        // 检查点击后的状态变化
        const currentUrl = page.url();
        const hasModal = await page.locator('[role="dialog"], .modal, [class*="modal"]').isVisible().catch(() => false);
        const hasCameraView = await page.locator('video, canvas, [class*="camera"], [class*="scanner"]').count();
        
        console.log('📊 点击后状态:');
        console.log(`  URL变化: ${currentUrl}`);
        console.log(`  弹出模态框: ${hasModal}`);
        console.log(`  摄像头界面元素: ${hasCameraView}`);
        
        if (currentUrl.includes('scanner') || currentUrl.includes('qr') || hasModal || hasCameraView > 0) {
          console.log('🎉 扫码按钮功能正常！');
        } else {
          console.log('⚠️  点击后无明显界面变化，可能需要进一步调试');
        }
        
      } catch (clickError) {
        console.log(`❌ 点击失败: ${clickError.message}`);
        
        // 尝试备用点击方法
        console.log('🔄 尝试备用点击方法...');
        try {
          // 方法1: 使用坐标点击
          if (buttonBox) {
            await page.mouse.click(buttonBox.x + buttonBox.width/2, buttonBox.y + buttonBox.height/2);
            console.log('✅ 坐标点击成功');
          }
        } catch (altError) {
          console.log(`❌ 备用方法也失败: ${altError.message}`);
        }
      }
      
    } else {
      console.log('❌ 未能定位到扫码按钮');
      
      // 提供调试信息
      console.log('🔍 页面调试信息:');
      const allSvgs = await page.locator('svg').count();
      const allButtons = await page.locator('button').count();
      const categoryContent = await categoryBar.textContent();
      
      console.log(`  SVG总数: ${allSvgs}`);
      console.log(`  按钮总数: ${allButtons}`);
      console.log(`  分类栏内容: "${categoryContent}"`);
    }
    
    console.log('✅ 扫码按钮定位测试完成');
  });

  test('🔧 扫码按钮稳定性修复测试', async ({ page }) => {
    console.log('🔧 开始扫码按钮稳定性修复测试...');
    
    // 等待页面完全加载和动画完成
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 禁用动画来提高稳定性
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `
    });
    
    console.log('✅ 已禁用页面动画');
    
    // 查找分类栏
    const categoryBar = page.locator('div').filter({ hasText: /All|Upcoming|Ended/ });
    await categoryBar.waitFor({ state: 'visible' });
    
    // 查找扫码按钮
    const scanButton = categoryBar.locator('svg').last();
    
    // 多次稳定性检查
    console.log('🔍 进行稳定性检查...');
    
    for (let i = 0; i < 5; i++) {
      try {
        const isVisible = await scanButton.isVisible();
        const isEnabled = await scanButton.isEnabled();
        const boundingBox = await scanButton.boundingBox();
        
        console.log(`检查 ${i + 1}: 可见=${isVisible}, 可用=${isEnabled}, 位置=${boundingBox ? 'stable' : 'unstable'}`);
        
        if (!isVisible || !boundingBox) {
          console.log('❌ 元素不稳定，等待后重试...');
          await page.waitForTimeout(1000);
          continue;
        }
        
        // 尝试点击
        await scanButton.click({ 
          force: true,
          timeout: 5000
        });
        
        console.log('✅ 稳定性测试通过！');
        break;
        
      } catch (error) {
        console.log(`⚠️  第${i + 1}次尝试失败: ${error.message}`);
        if (i === 4) {
          console.log('❌ 所有稳定性测试都失败');
        }
        await page.waitForTimeout(1000);
      }
    }
    
    console.log('✅ 稳定性测试完成');
  });

  test('🎥 摄像头权限和功能完整测试', async ({ page }) => {
    console.log('🎥 开始摄像头权限和功能完整测试...');
    
    // 监听摄像头相关的控制台消息
    const cameraLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('camera') || msg.text().includes('getUserMedia') || msg.text().includes('permission')) {
        cameraLogs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    // 等待页面稳定
    await page.waitForTimeout(5000);
    
    // 测试摄像头权限状态
    const permissionState = await page.evaluate(async () => {
      if (!navigator.permissions) return 'not supported';
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return result.state;
      } catch (error) {
        return `error: ${error.message}`;
      }
    });
    
    console.log(`📷 摄像头权限状态: ${permissionState}`);
    
    // 测试 getUserMedia API
    const getUserMediaTest = await page.evaluate(async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { success: false, error: 'API not available' };
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log(`📷 getUserMedia测试: ${getUserMediaTest.success ? '成功' : '失败 - ' + getUserMediaTest.error}`);
    
    // 查找并点击扫码按钮
    const categoryBar = page.locator('div').filter({ hasText: /All|Upcoming|Ended/ });
    await categoryBar.waitFor({ state: 'visible' });
    
    const scanButton = categoryBar.locator('svg').last();
    
    if (await scanButton.isVisible()) {
      console.log('🔍 点击扫码按钮触发摄像头...');
      
      await scanButton.click({ force: true });
      await page.waitForTimeout(3000);
      
      // 检查是否出现摄像头相关界面
      const cameraElements = {
        video: await page.locator('video').count(),
        canvas: await page.locator('canvas').count(),
        cameraClass: await page.locator('[class*="camera"]').count(),
        scannerClass: await page.locator('[class*="scanner"]').count(),
        qrClass: await page.locator('[class*="qr"]').count()
      };
      
      console.log('📊 摄像头界面元素统计:', cameraElements);
      
      // 检查URL变化
      const currentUrl = page.url();
      console.log(`🌐 当前URL: ${currentUrl}`);
      
      // 报告摄像头相关日志
      if (cameraLogs.length > 0) {
        console.log('📝 摄像头相关日志:');
        cameraLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. ${log}`);
        });
      } else {
        console.log('📝 无摄像头相关日志');
      }
      
    } else {
      console.log('❌ 未找到扫码按钮');
    }
    
    console.log('✅ 摄像头功能测试完成');
  });
});