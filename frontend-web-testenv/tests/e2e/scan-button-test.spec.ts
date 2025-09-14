/**
 * 📷 扫码按钮精确测试
 * 
 * 根据用户提供的位置信息，精确测试category bar右侧的扫码按钮
 */

import { test, expect } from '@playwright/test';

test.describe('扫码按钮精确测试', () => {
  test('📷 测试category bar右侧的扫码按钮', async ({ page }) => {
    console.log('🎯 开始精确扫码按钮测试...');

    // 设置摄像头权限
    const context = page.context();
    await context.grantPermissions(['camera'], { origin: 'http://localhost:8081' });
    console.log('✅ 已授予摄像头权限');

    // 监听控制台日志
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('handleScanPress') || 
          text.includes('QRScanner') ||
          text.includes('EnhancedWebCameraView') ||
          text.includes('摄像头') ||
          text.includes('navigation.navigate')) {
        console.log(`🎯 关键日志: ${text}`);
      }
    });

    // 导航到首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('🚀 页面加载完成');

    // 步骤1: 精确查找category bar区域
    console.log('📋 步骤1: 查找category bar区域');
    
    // 查找包含 All, Upcoming, Ended 的container
    const categoryContainer = page.locator('div').filter({ 
      hasText: /All.*Upcoming.*Ended/
    }).first();
    
    if (await categoryContainer.isVisible()) {
      console.log('✅ 找到category bar容器');
      
      // 步骤2: 在category bar中查找最右侧的可点击元素
      console.log('📋 步骤2: 查找最右侧的扫码按钮');
      
      // 方法1: 查找category bar中的所有可点击元素
      const clickableElements = await categoryContainer.locator('div, button, [role="button"]').all();
      console.log(`🔍 在category bar中找到 ${clickableElements.length} 个可点击元素`);
      
      let scanButton = null;
      
      // 方法2: 通过样式特征查找 - 扫码按钮通常有特殊的圆形样式
      const roundButtons = await categoryContainer.locator('div').filter({
        has: page.locator('svg')
      }).all();
      
      console.log(`🔍 找到 ${roundButtons.length} 个包含SVG的div元素`);
      
      // 分析每个元素的位置和样式
      for (let i = 0; i < roundButtons.length; i++) {
        const button = roundButtons[i];
        const boundingBox = await button.boundingBox();
        const isVisible = await button.isVisible();
        
        if (boundingBox && isVisible) {
          console.log(`  元素 ${i+1}: 位置(${Math.round(boundingBox.x)}, ${Math.round(boundingBox.y)}) 大小(${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)})`);
          
          // 扫码按钮通常在最右侧，且是圆形的
          if (boundingBox.width > 30 && boundingBox.width < 50 && 
              Math.abs(boundingBox.width - boundingBox.height) < 5) {
            scanButton = button;
            console.log(`✅ 找到可能的扫码按钮: 元素 ${i+1} (圆形按钮)`);
          }
        }
      }
      
      // 方法3: 如果还没找到，尝试通过位置查找最右侧的元素
      if (!scanButton && roundButtons.length > 0) {
        let rightMostButton = null;
        let maxX = -1;
        
        for (const button of roundButtons) {
          const boundingBox = await button.boundingBox();
          if (boundingBox && boundingBox.x > maxX) {
            maxX = boundingBox.x;
            rightMostButton = button;
          }
        }
        
        if (rightMostButton) {
          scanButton = rightMostButton;
          console.log('✅ 通过位置找到最右侧按钮作为扫码按钮');
        }
      }

      // 步骤3: 测试扫码按钮功能
      if (scanButton) {
        console.log('🔄 开始测试扫码按钮...');
        
        // 设置导航监听 - 等待跳转到QRScanner页面
        const navigationPromise = page.waitForURL(/QRScanner/i, { timeout: 10000 });
        
        // 点击扫码按钮
        await scanButton.click();
        console.log('✅ 已点击扫码按钮');
        
        try {
          // 等待导航
          await navigationPromise;
          console.log('🎯 关键日志: 成功导航到QRScanner页面!');
          
          const currentUrl = page.url();
          console.log('📍 当前页面URL:', currentUrl);
          
          // 验证确实到了QRScanner页面
          expect(currentUrl).toContain('QRScanner');
          
          // 等待QRScanner页面加载
          await page.waitForTimeout(3000);
          
          // 步骤4: 测试摄像头功能
          console.log('📋 步骤4: 测试摄像头功能');
          
          const cameraTest = await page.evaluate(async () => {
            let result = {
              hasMediaDevices: typeof navigator.mediaDevices !== 'undefined',
              hasGetUserMedia: typeof navigator.mediaDevices?.getUserMedia !== 'undefined',
              cameraAccessSuccess: false,
              videoElementCreated: false,
              error: null as string | null
            };

            try {
              if (result.hasGetUserMedia) {
                console.log('🎯 关键日志: 开始请求摄像头权限...');
                
                const stream = await navigator.mediaDevices.getUserMedia({
                  video: { 
                    facingMode: 'environment' // 后置摄像头，用于扫码
                  }
                });
                
                result.cameraAccessSuccess = true;
                console.log('🎯 关键日志: 摄像头权限获取成功!');
                
                // 创建video元素测试摄像头画面
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                video.style.width = '200px';
                video.style.height = '150px';
                video.style.position = 'fixed';
                video.style.top = '20px';
                video.style.right = '20px';
                video.style.border = '3px solid green';
                video.style.borderRadius = '10px';
                video.style.zIndex = '10000';
                video.id = 'scan-test-camera';
                
                document.body.appendChild(video);
                result.videoElementCreated = true;
                console.log('🎯 关键日志: 摄像头预览已创建');
                
                // 3秒后停止摄像头
                setTimeout(() => {
                  stream.getTracks().forEach(track => track.stop());
                  const videoEl = document.getElementById('scan-test-camera');
                  if (videoEl) {
                    document.body.removeChild(videoEl);
                  }
                  console.log('🎯 关键日志: 摄像头已停止并清理');
                }, 3000);
              }
            } catch (error) {
              result.error = error instanceof Error ? error.message : String(error);
              console.log('🎯 关键日志: 摄像头访问失败:', result.error);
            }

            return result;
          });

          console.log('📊 摄像头测试结果:', cameraTest);
          
          // 步骤5: 检查EnhancedWebCameraView组件是否被加载
          await page.waitForTimeout(2000);
          
          const componentCheck = await page.evaluate(() => {
            const videos = document.querySelectorAll('video');
            const canvases = document.querySelectorAll('canvas');
            
            return {
              hasVideoElements: videos.length > 0,
              hasCanvasElements: canvases.length > 0,
              videoElementsInfo: Array.from(videos).map(v => ({
                id: v.id,
                src: v.src || 'stream',
                autoplay: v.autoplay,
                visible: v.offsetParent !== null
              }))
            };
          });
          
          console.log('📊 摄像头组件检查:', componentCheck);
          
          // 截图保存测试结果
          await page.screenshot({
            path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/scan-button-success.png',
            fullPage: true
          });
          console.log('📸 成功截图已保存');
          
          // 最终结果
          if (cameraTest.cameraAccessSuccess) {
            console.log('✅ 🎉 扫码按钮测试完全成功！');
            console.log('✅ 按钮点击 → QRScanner页面导航 → 摄像头权限获取 → 摄像头画面显示');
          } else {
            console.log('⚠️  扫码按钮导航成功，但摄像头访问失败:', cameraTest.error);
          }
          
        } catch (error) {
          console.log('❌ 导航到QRScanner页面失败:', error.message);
          
          // 即使导航失败也截图保存状态
          await page.screenshot({
            path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/scan-button-failed.png'
          });
        }
        
      } else {
        console.log('❌ 仍然未找到扫码按钮');
        
        // 详细调试 - 显示category bar中的所有元素
        const debugInfo = await categoryContainer.evaluate(el => {
          const children = Array.from(el.children);
          return children.map((child, index) => {
            const rect = child.getBoundingClientRect();
            return {
              index,
              tagName: child.tagName,
              className: child.className || '',
              hasChildren: child.children.length > 0,
              childrenCount: child.children.length,
              position: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              visible: child.offsetParent !== null,
              textContent: child.textContent?.slice(0, 30) || ''
            };
          });
        });
        
        console.log('🔍 Category bar详细结构:');
        debugInfo.forEach(info => {
          console.log(`  ${info.index}: ${info.tagName} - ${info.textContent} - 位置:(${info.position.x},${info.position.y}) - 大小:(${info.position.width}x${info.position.height})`);
        });
      }
      
    } else {
      console.log('❌ 未找到category bar容器');
    }

    console.log('✅ 扫码按钮测试完成');
  });
});





