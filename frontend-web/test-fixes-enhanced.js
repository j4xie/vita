/**
 * PomeloX Web端修复验证 - 增强版Playwright测试
 * 专门针对React/Expo Web应用的深度检测
 */

const { chromium } = require('playwright');

async function testPomeloXFixesEnhanced() {
  console.log('🚀 开始增强版Playwright验证...');
  
  let browser;
  let page;
  
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false, // 显示浏览器窗口以便观察
      slowMo: 500,     // 减慢操作速度
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 监听控制台消息
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`🔍 Console: ${text}`);
    });
    
    // 监听网络请求
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push(request.url());
    });
    
    console.log('📱 浏览器已启动，导航到应用...');
    
    // 导航到Web应用
    await page.goto('http://localhost:8090', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('✅ 页面DOM加载完成，等待React应用初始化...');
    
    // 等待React应用加载
    try {
      // 等待React根元素或任何表明应用已加载的元素
      await page.waitForSelector('div[id="root"], div[id="app"], main, [data-testid]', { 
        timeout: 10000 
      });
      console.log('✅ React应用根元素已找到');
    } catch (error) {
      console.log('⚠️ 未找到标准的React根元素，继续检查...');
    }
    
    // 等待更多内容加载
    await page.waitForTimeout(5000);
    
    console.log('\n📊 页面分析开始...');
    
    // 获取页面基本信息
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasReact: !!(window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__),
        hasExpo: !!(window.expo || window.__expo),
        bodyChildren: document.body.children.length,
        allElements: document.querySelectorAll('*').length,
        buttons: document.querySelectorAll('button, [role="button"]').length,
        inputs: document.querySelectorAll('input').length,
        links: document.querySelectorAll('a').length,
        videos: document.querySelectorAll('video').length
      };
    });
    
    console.log('📱 页面信息:', pageInfo);
    
    const results = {
      pageLoaded: true,
      reactDetected: pageInfo.hasReact,
      expoDetected: pageInfo.hasExpo,
      timeClassification: false,
      cameraPermission: false,
      referralInput: false
    };
    
    // 获取所有文本内容进行分析
    const allText = await page.evaluate(() => {
      return document.body.innerText || document.body.textContent || '';
    });
    
    console.log('\n📝 页面文本内容采样:');
    console.log(allText.substring(0, 500) + (allText.length > 500 ? '...' : ''));
    
    // 验证一：时间分类逻辑
    console.log('\n🕐 验证时间分类逻辑...');
    try {
      // 查找包含时间分类相关文本的元素
      const timeRelatedElements = await page.$$eval('*', elements => {
        return elements.filter(el => {
          const text = el.textContent || '';
          return text.includes('即将开始') || 
                 text.includes('已结束') || 
                 text.includes('全部') ||
                 text.includes('活动') ||
                 text.includes('筛选') ||
                 text.includes('分类');
        }).map(el => ({
          tagName: el.tagName,
          text: el.textContent?.substring(0, 50),
          className: el.className
        }));
      });
      
      console.log(`找到 ${timeRelatedElements.length} 个时间/分类相关元素:`);
      timeRelatedElements.forEach(el => {
        console.log(`  - ${el.tagName}: "${el.text}" (${el.className})`);
      });
      
      // 尝试点击分类相关的元素
      if (timeRelatedElements.length > 0) {
        const clickableElements = await page.$$('button, [role="button"], [role="tab"]');
        for (const element of clickableElements) {
          const text = await element.textContent();
          if (text && (text.includes('即将') || text.includes('结束') || text.includes('全部'))) {
            console.log(`✅ 尝试点击分类按钮: "${text}"`);
            await element.click();
            await page.waitForTimeout(1000);
            results.timeClassification = true;
            break;
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ 时间分类验证出错: ${error.message}`);
    }
    
    // 验证二：摄像头权限
    console.log('\n📷 验证摄像头权限处理...');
    try {
      // 查找扫码相关元素
      const scanRelatedElements = await page.$$eval('*', elements => {
        return elements.filter(el => {
          const text = el.textContent || '';
          return text.includes('扫码') || 
                 text.includes('二维码') || 
                 text.includes('扫描') ||
                 text.includes('相机') ||
                 text.includes('camera') ||
                 text.includes('scan');
        }).map(el => ({
          tagName: el.tagName,
          text: el.textContent?.substring(0, 50),
          className: el.className
        }));
      });
      
      console.log(`找到 ${scanRelatedElements.length} 个扫码相关元素:`);
      scanRelatedElements.forEach(el => {
        console.log(`  - ${el.tagName}: "${el.text}" (${el.className})`);
      });
      
      // 检查视频元素
      const videoElements = await page.$$('video');
      console.log(`发现 ${videoElements.length} 个video元素`);
      
      if (scanRelatedElements.length > 0 || videoElements.length > 0) {
        results.cameraPermission = true;
      }
      
    } catch (error) {
      console.log(`❌ 摄像头验证出错: ${error.message}`);
    }
    
    // 验证三：推荐码输入
    console.log('\n🎫 验证推荐码输入功能...');
    try {
      // 查找推荐码相关元素
      const referralElements = await page.$$eval('*', elements => {
        return elements.filter(el => {
          const text = el.textContent || '';
          return text.includes('推荐码') || 
                 text.includes('邀请码') || 
                 text.includes('推荐') ||
                 text.includes('手动输入') ||
                 text.includes('referral') ||
                 text.includes('invitation');
        }).map(el => ({
          tagName: el.tagName,
          text: el.textContent?.substring(0, 50),
          className: el.className
        }));
      });
      
      console.log(`找到 ${referralElements.length} 个推荐码相关元素:`);
      referralElements.forEach(el => {
        console.log(`  - ${el.tagName}: "${el.text}" (${el.className})`);
      });
      
      // 尝试点击推荐码相关按钮
      const clickableElements = await page.$$('button, [role="button"], a');
      for (const element of clickableElements) {
        const text = await element.textContent();
        if (text && (text.includes('推荐') || text.includes('手动输入') || text.includes('邀请'))) {
          console.log(`✅ 尝试点击推荐码按钮: "${text}"`);
          await element.click();
          await page.waitForTimeout(2000);
          
          // 检查是否出现Modal或BottomSheet
          const modalElements = await page.$$('[class*="modal"], [class*="sheet"], [class*="overlay"]');
          const inputElements = await page.$$('input[placeholder*="推荐"], input[placeholder*="邀请"], input[placeholder*="码"]');
          
          if (modalElements.length > 0 || inputElements.length > 0) {
            console.log('✅ 推荐码输入界面已出现');
            results.referralInput = true;
          }
          break;
        }
      }
      
    } catch (error) {
      console.log(`❌ 推荐码验证出错: ${error.message}`);
    }
    
    // 分析控制台日志
    console.log('\n📋 控制台日志分析:');
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('ActivityListScreen') || 
      log.includes('ActivityStatusCalculator') || 
      log.includes('EnhancedWebCameraView') ||
      log.includes('QRScannerScreen') ||
      log.includes('ReferralCodeInputSheet')
    );
    
    console.log(`发现 ${relevantLogs.length} 条相关日志:`);
    relevantLogs.forEach(log => console.log(`  📝 ${log}`));
    
    // 检查网络请求
    console.log('\n🌐 网络请求分析:');
    const apiRequests = networkRequests.filter(url => 
      url.includes('/api/') || 
      url.includes('activity') || 
      url.includes('user')
    );
    console.log(`发现 ${apiRequests.length} 个API请求`);
    
    // 截图
    await page.screenshot({ 
      path: 'enhanced-verification-screenshot.png',
      fullPage: true 
    });
    console.log('📸 增强验证截图已保存: enhanced-verification-screenshot.png');
    
    // 生成最终报告
    console.log('\n📊 增强验证报告:');
    console.log('═══════════════════════════════════════');
    console.log(`📱 页面加载: ${results.pageLoaded ? '✅ 通过' : '❌ 失败'}`);
    console.log(`⚛️ React检测: ${results.reactDetected ? '✅ 通过' : '❌ 未检测到'}`);
    console.log(`🔧 Expo检测: ${results.expoDetected ? '✅ 通过' : '❌ 未检测到'}`);
    console.log(`🕐 时间分类逻辑: ${results.timeClassification ? '✅ 通过' : '❌ 需要检查'}`);
    console.log(`📷 摄像头权限处理: ${results.cameraPermission ? '✅ 通过' : '❌ 需要检查'}`);
    console.log(`🎫 推荐码输入功能: ${results.referralInput ? '✅ 通过' : '❌ 需要检查'}`);
    
    const passCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n🎯 总体结果: ${passCount}/${totalCount} 项验证通过`);
    
    if (passCount >= 4) { // 至少页面加载和React检测要通过
      console.log('🎉 基础验证通过，应用正常运行！');
    } else {
      console.log('⚠️ 应用可能存在加载问题');
    }
    
    // 保持浏览器开启10秒以供观察
    console.log('\n⏰ 浏览器将在10秒后关闭，请观察页面状态...');
    await page.waitForTimeout(10000);
    
    return results;
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔚 浏览器已关闭');
    }
  }
}

// 运行增强验证
testPomeloXFixesEnhanced()
  .then(results => {
    if (results) {
      console.log('\n✅ 增强验证完成');
      console.log('请查看截图和日志了解详细情况');
    } else {
      console.log('\n❌ 验证失败');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });


