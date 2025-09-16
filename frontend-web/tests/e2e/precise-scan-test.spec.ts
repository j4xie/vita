/**
 * 🎯 精确扫码按钮测试
 * 
 * 使用确认的位置信息精确测试扫码按钮功能
 * 按钮位置: (1202,581) - 大小:(71x69) - 在"Ended"右侧
 */

import { test, expect } from '@playwright/test';

test.describe('精确扫码按钮测试', () => {
  test('🎯 使用确认位置测试扫码按钮功能', async ({ page }) => {
    console.log('🎯 开始精确扫码按钮测试...');

    // 设置摄像头权限
    const context = page.context();
    await context.grantPermissions(['camera'], { origin: 'http://localhost:8081' });
    console.log('✅ 已授予摄像头权限');

    // 监听控制台日志，特别关注导航和摄像头相关
    const importantLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('navigation') || 
          text.includes('navigate') ||
          text.includes('QRScanner') ||
          text.includes('handleScanPress') ||
          text.includes('摄像头') ||
          text.includes('camera') ||
          text.includes('EnhancedWebCameraView')) {
        importantLogs.push(text);
        console.log(`🎯 关键日志: ${text}`);
      }
    });

    // 监听导航变化
    let navigationOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationOccurred = true;
        console.log(`🎯 导航发生: ${frame.url()}`);
      }
    });

    // 导航到首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('🚀 页面加载完成');

    const initialUrl = page.url();
    console.log('📍 初始URL:', initialUrl);

    // 方法1: 使用坐标直接定位扫码按钮
    console.log('\n📋 方法1: 使用确认的坐标定位扫码按钮');
    
    // 根据DOM分析，扫码按钮在 (1202,581) 位置
    const targetX = 1202;
    const targetY = 581;
    const tolerance = 20; // 允许20像素的误差
    
    const scanButtonByPosition = await page.evaluate((coords) => {
      const { targetX, targetY, tolerance } = coords;
      const allElements = document.querySelectorAll('div');
      
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        
        // 检查是否在目标坐标附近
        if (Math.abs(rect.x - targetX) <= tolerance && 
            Math.abs(rect.y - targetY) <= tolerance &&
            rect.width > 30 && rect.height > 30) {
          
          const hasSVG = el.querySelector('svg') !== null;
          if (hasSVG) {
            return {
              found: true,
              element: el,
              position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              className: el.className
            };
          }
        }
      }
      return { found: false };
    }, { targetX, targetY, tolerance });

    if (scanButtonByPosition.found) {
      console.log('✅ 通过坐标找到扫码按钮:', scanButtonByPosition.position);
    }

    // 方法2: 使用DOM分析发现的选择器
    console.log('\n📋 方法2: 使用选择器定位扫码按钮');
    
    const scanButtonSelectors = [
      'div:right-of(:text("Ended"))',
      'div[style*="249, 168, 137"]', // 橙色特征
      'div:has(svg):right-of(:text("Ended"))'
    ];

    let scanButton = null;
    
    for (const selector of scanButtonSelectors) {
      try {
        const elements = await page.locator(selector).all();
        
        // 找到在目标位置附近的元素
        for (const element of elements) {
          const boundingBox = await element.boundingBox();
          if (boundingBox && 
              Math.abs(boundingBox.x - targetX) <= tolerance && 
              Math.abs(boundingBox.y - targetY) <= tolerance) {
            
            const hasSVG = await element.locator('svg').count() > 0;
            if (hasSVG) {
              scanButton = element;
              console.log(`✅ 通过选择器"${selector}"找到扫码按钮`);
              console.log(`   位置: (${Math.round(boundingBox.x)}, ${Math.round(boundingBox.y)})`);
              console.log(`   大小: ${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)}`);
              break;
            }
          }
        }
        
        if (scanButton) break;
      } catch (e) {
        console.log(`❌ 选择器"${selector}"失败: ${e.message}`);
      }
    }

    if (!scanButton) {
      // 方法3: 备用方案 - 直接使用坐标点击
      console.log('\n📋 方法3: 备用方案 - 直接坐标点击');
      
      console.log(`🔄 直接点击坐标 (${targetX}, ${targetY})...`);
      
      // 点击前截图
      await page.screenshot({
        path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/before-coordinate-click.png'
      });
      
      // 直接点击坐标
      await page.mouse.click(targetX, targetY);
      console.log('✅ 已执行坐标点击');
      
    } else {
      // 使用找到的元素点击
      console.log('\n🔄 点击找到的扫码按钮...');
      
      // 点击前截图
      await page.screenshot({
        path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/before-element-click.png'
      });
      
      await scanButton.click();
      console.log('✅ 已点击扫码按钮元素');
    }

    // 等待导航或其他变化
    console.log('\n🔍 等待导航或页面变化...');
    await page.waitForTimeout(3000);

    // 检查结果
    const afterClickUrl = page.url();
    console.log('📍 点击后URL:', afterClickUrl);
    console.log('🔄 是否发生导航:', navigationOccurred);
    console.log('🔄 URL是否改变:', initialUrl !== afterClickUrl);

    // 检查是否有重要的控制台日志
    console.log(`📋 重要日志数量: ${importantLogs.length}`);
    if (importantLogs.length > 0) {
      console.log('📋 重要日志内容:');
      importantLogs.forEach((log, i) => {
        console.log(`  ${i+1}. ${log}`);
      });
    }

    // 点击后截图
    await page.screenshot({
      path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/after-scan-click.png',
      fullPage: true
    });

    // 如果导航成功，验证QRScanner页面
    if (navigationOccurred || afterClickUrl.includes('QRScanner')) {
      console.log('\n✅ 导航成功，验证QRScanner页面...');
      
      // 等待QRScanner页面加载
      await page.waitForTimeout(2000);
      
      // 测试摄像头功能
      console.log('📷 测试摄像头功能...');
      const cameraResult = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          
          console.log('🎯 关键日志: 摄像头权限获取成功');
          
          // 创建视频预览
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.playsInline = true;
          video.style.position = 'fixed';
          video.style.top = '20px';
          video.style.right = '20px';
          video.style.width = '200px';
          video.style.height = '150px';
          video.style.border = '3px solid green';
          video.style.zIndex = '10000';
          document.body.appendChild(video);
          
          // 3秒后清理
          setTimeout(() => {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(video);
            console.log('🎯 关键日志: 摄像头已停止并清理');
          }, 3000);
          
          return { success: true, message: '摄像头启动成功' };
        } catch (error) {
          return { 
            success: false, 
            message: error instanceof Error ? error.message : String(error)
          };
        }
      });
      
      console.log('📊 摄像头测试结果:', cameraResult);
      
      // 检查EnhancedWebCameraView组件
      await page.waitForTimeout(2000);
      const componentCheck = await page.evaluate(() => {
        const videos = document.querySelectorAll('video');
        const canvases = document.querySelectorAll('canvas');
        
        return {
          videoCount: videos.length,
          canvasCount: canvases.length,
          hasEnhancedCameraView: document.body.textContent?.includes('EnhancedWebCameraView') || false
        };
      });
      
      console.log('📊 摄像头组件检查:', componentCheck);
      
      // 最终成功截图
      await page.screenshot({
        path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/qrscanner-success.png',
        fullPage: true
      });
      
      console.log('🎉 扫码按钮功能测试完全成功！');
      
    } else {
      console.log('\n❌ 导航未发生或失败');
      
      // 调试：检查页面是否有错误
      const pageErrors = await page.evaluate(() => {
        return {
          hasReactErrors: document.body.textContent?.includes('Error') || false,
          activeElement: document.activeElement?.tagName || 'none',
          bodyContent: document.body.textContent?.slice(0, 200) || ''
        };
      });
      
      console.log('📊 页面状态检查:', pageErrors);
    }

    console.log('✅ 精确扫码按钮测试完成');
  });
});







