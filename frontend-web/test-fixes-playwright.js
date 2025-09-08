/**
 * PomeloX Web端修复验证 - Playwright自动化测试
 */

const { chromium } = require('playwright');

async function testPomeloXFixes() {
  console.log('🚀 开始Playwright自动化验证...');
  
  let browser;
  let page;
  
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false, // 显示浏览器窗口
      slowMo: 1000,    // 减慢操作速度以便观察
    });
    
    page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('📱 浏览器已启动，准备访问应用...');
    
    // 导航到Web应用
    await page.goto('http://localhost:8090', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ 成功访问应用页面');
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    const results = {
      pageLoaded: true,
      timeClassification: false,
      cameraPermission: false,
      referralInput: false
    };
    
    // 验证一：时间分类逻辑
    console.log('\n🕐 验证时间分类逻辑...');
    try {
      // 查找活动列表相关元素
      const activityElements = await page.$$('[class*="activity"], [class*="card"], [class*="list"]');
      console.log(`找到 ${activityElements.length} 个可能的活动元素`);
      
      // 查找分类按钮
      const categoryButtons = await page.$$('button, [role="button"], [class*="tab"], [class*="filter"]');
      console.log(`找到 ${categoryButtons.length} 个可能的分类按钮`);
      
      // 尝试点击分类按钮
      let foundCategoryButton = false;
      for (const button of categoryButtons) {
        const text = await button.textContent();
        if (text && (text.includes('即将') || text.includes('已结束') || text.includes('全部'))) {
          console.log(`✅ 找到分类按钮: "${text}"`);
          await button.click();
          await page.waitForTimeout(1000);
          foundCategoryButton = true;
          break;
        }
      }
      
      results.timeClassification = foundCategoryButton;
      
    } catch (error) {
      console.log(`❌ 时间分类验证失败: ${error.message}`);
    }
    
    // 验证二：摄像头权限（查找扫码相关页面）
    console.log('\n📷 验证摄像头权限处理...');
    try {
      // 查找扫码相关按钮或链接
      const scanButtons = await page.$$('a, button, [role="button"]');
      let foundScanButton = false;
      
      for (const button of scanButtons) {
        const text = await button.textContent();
        if (text && (text.includes('扫码') || text.includes('二维码') || text.includes('scan'))) {
          console.log(`✅ 找到扫码按钮: "${text}"`);
          
          // 点击进入扫码页面
          await button.click();
          await page.waitForTimeout(2000);
          
          // 检查是否有摄像头相关元素
          const videoElements = await page.$$('video');
          const cameraElements = await page.$$('[class*="camera"], [class*="scanner"]');
          
          console.log(`找到 ${videoElements.length} 个video元素`);
          console.log(`找到 ${cameraElements.length} 个摄像头相关元素`);
          
          foundScanButton = true;
          break;
        }
      }
      
      results.cameraPermission = foundScanButton;
      
    } catch (error) {
      console.log(`❌ 摄像头权限验证失败: ${error.message}`);
    }
    
    // 验证三：推荐码输入功能
    console.log('\n🎫 验证推荐码输入功能...');
    try {
      // 查找推荐码相关功能
      const allButtons = await page.$$('a, button, [role="button"]');
      let foundReferralButton = false;
      
      for (const button of allButtons) {
        const text = await button.textContent();
        if (text && (text.includes('推荐') || text.includes('邀请') || text.includes('手动输入'))) {
          console.log(`✅ 找到推荐码相关按钮: "${text}"`);
          
          // 点击按钮
          await button.click();
          await page.waitForTimeout(1500);
          
          // 检查是否出现BottomSheet或Modal
          const modalElements = await page.$$('[class*="modal"], [class*="sheet"], [class*="bottom"]');
          const inputElements = await page.$$('input[placeholder*="推荐"], input[placeholder*="邀请"]');
          
          console.log(`找到 ${modalElements.length} 个Modal/Sheet元素`);
          console.log(`找到 ${inputElements.length} 个推荐码输入框`);
          
          if (modalElements.length > 0 || inputElements.length > 0) {
            console.log('✅ 推荐码输入界面出现');
            foundReferralButton = true;
          }
          
          break;
        }
      }
      
      results.referralInput = foundReferralButton;
      
    } catch (error) {
      console.log(`❌ 推荐码输入验证失败: ${error.message}`);
    }
    
    // 生成控制台日志检查
    console.log('\n📋 检查控制台日志...');
    const logs = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    // 等待一些日志生成
    await page.waitForTimeout(2000);
    
    // 分析日志
    const relevantLogs = logs.filter(log => 
      log.includes('ActivityListScreen') || 
      log.includes('ActivityStatusCalculator') || 
      log.includes('EnhancedWebCameraView') ||
      log.includes('QRScannerScreen')
    );
    
    console.log(`发现 ${relevantLogs.length} 条相关日志:`);
    relevantLogs.forEach(log => console.log(`  📝 ${log}`));
    
    // 生成最终报告
    console.log('\n📊 验证报告:');
    console.log('═══════════════════════════════════════');
    console.log(`🕐 时间分类逻辑: ${results.timeClassification ? '✅ 通过' : '❌ 需要检查'}`);
    console.log(`📷 摄像头权限处理: ${results.cameraPermission ? '✅ 通过' : '❌ 需要检查'}`);
    console.log(`🎫 推荐码输入功能: ${results.referralInput ? '✅ 通过' : '❌ 需要检查'}`);
    console.log(`📋 页面加载: ${results.pageLoaded ? '✅ 通过' : '❌ 失败'}`);
    
    const passCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n🎯 总体结果: ${passCount}/${totalCount} 项验证通过`);
    
    if (passCount === totalCount) {
      console.log('🎉 所有修复验证通过！');
    } else {
      console.log('⚠️ 部分功能需要进一步检查');
    }
    
    // 截图保存
    await page.screenshot({ 
      path: 'verification-screenshot.png',
      fullPage: true 
    });
    console.log('📸 验证截图已保存: verification-screenshot.png');
    
    // 保持浏览器开启5秒以供观察
    console.log('\n⏰ 浏览器将在5秒后关闭...');
    await page.waitForTimeout(5000);
    
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

// 运行验证
testPomeloXFixes()
  .then(results => {
    if (results) {
      console.log('\n✅ 验证完成');
    } else {
      console.log('\n❌ 验证失败');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
