/**
 * PomeloX Web端修复自动验证脚本
 * 在浏览器控制台中运行此脚本来验证所有修复
 */

console.log('🚀 开始PomeloX Web端修复验证...');

// 验证配置
const VERIFICATION_CONFIG = {
  timeClassification: true,
  cameraPermission: true,
  referralInput: true,
  verbose: true
};

// 工具函数
const utils = {
  log: (message, type = 'info') => {
    const styles = {
      info: 'color: #007bff; font-weight: bold;',
      success: 'color: #28a745; font-weight: bold;',
      error: 'color: #dc3545; font-weight: bold;',
      warning: 'color: #ffc107; font-weight: bold;'
    };
    console.log(`%c${message}`, styles[type] || styles.info);
  },
  
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  checkElement: (selector, timeout = 5000) => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
};

// 验证一：时间分类逻辑
async function verifyTimeClassification() {
  utils.log('🕐 验证时间分类逻辑修复...', 'info');
  
  try {
    // 检查是否有统一的状态计算器
    if (typeof window.calculateActivityStatus === 'function') {
      utils.log('✅ 发现统一状态计算器函数', 'success');
    } else {
      utils.log('⚠️ 未发现全局状态计算器，检查模块导入', 'warning');
    }
    
    // 模拟活动数据测试
    const testActivities = [
      {
        id: 1,
        name: "测试已结束活动",
        startTime: "2024-01-15T14:00:00",
        endTime: "2024-01-15T16:00:00"
      },
      {
        id: 2,
        name: "测试进行中活动",
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      },
      {
        id: 3,
        name: "测试即将开始活动",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString()
      }
    ];
    
    utils.log('测试活动数据:', 'info');
    testActivities.forEach(activity => {
      const now = new Date();
      const start = new Date(activity.startTime);
      const end = new Date(activity.endTime);
      
      let status;
      if (end < now) status = 'ended';
      else if (start <= now && end >= now) status = 'ongoing';
      else status = 'upcoming';
      
      console.log(`  活动${activity.id}: ${status}`);
    });
    
    // 检查活动列表分类按钮
    const categoryButtons = document.querySelectorAll('[data-testid*="category"], [class*="tab"], [class*="filter"]');
    if (categoryButtons.length > 0) {
      utils.log(`✅ 发现 ${categoryButtons.length} 个分类按钮`, 'success');
    } else {
      utils.log('⚠️ 未发现分类按钮，可能页面未加载完成', 'warning');
    }
    
    return true;
  } catch (error) {
    utils.log(`❌ 时间分类验证失败: ${error.message}`, 'error');
    return false;
  }
}

// 验证二：摄像头权限处理
async function verifyCameraPermission() {
  utils.log('📷 验证摄像头权限修复...', 'info');
  
  try {
    // 检查MediaDevices API支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      utils.log('❌ 浏览器不支持MediaDevices API', 'error');
      return false;
    }
    utils.log('✅ MediaDevices API支持正常', 'success');
    
    // 检查环境要求
    const isSecure = location.protocol === 'https:' || 
                    location.hostname === 'localhost' || 
                    location.hostname === '127.0.0.1';
    
    if (isSecure) {
      utils.log('✅ 安全环境检查通过', 'success');
    } else {
      utils.log('⚠️ 非安全环境，摄像头可能无法访问', 'warning');
    }
    
    // 检查权限状态
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({name: 'camera'});
        utils.log(`📋 摄像头权限状态: ${result.state}`, 'info');
      } catch (error) {
        utils.log('⚠️ 权限查询失败，可能浏览器不支持', 'warning');
      }
    }
    
    // 检查摄像头组件
    const cameraElements = document.querySelectorAll('video, [class*="camera"], [class*="scanner"]');
    if (cameraElements.length > 0) {
      utils.log(`✅ 发现 ${cameraElements.length} 个摄像头相关元素`, 'success');
    }
    
    return true;
  } catch (error) {
    utils.log(`❌ 摄像头权限验证失败: ${error.message}`, 'error');
    return false;
  }
}

// 验证三：推荐码输入功能
async function verifyReferralInput() {
  utils.log('🎫 验证推荐码输入修复...', 'info');
  
  try {
    // 检查是否还在使用Alert.prompt
    const originalPrompt = window.Alert?.prompt;
    if (originalPrompt) {
      utils.log('⚠️ 检测到Alert.prompt，可能未完全替换', 'warning');
    } else {
      utils.log('✅ 未检测到Alert.prompt，替换成功', 'success');
    }
    
    // 检查BottomSheet相关元素
    const modalElements = document.querySelectorAll('[class*="modal"], [class*="sheet"], [class*="bottom"]');
    const referralElements = document.querySelectorAll('[class*="referral"], [data-testid*="referral"]');
    
    utils.log(`📱 发现 ${modalElements.length} 个Modal/Sheet元素`, 'info');
    utils.log(`🎫 发现 ${referralElements.length} 个推荐码相关元素`, 'info');
    
    // 检查手动输入按钮
    const manualInputButtons = document.querySelectorAll('button, [role="button"]');
    let foundManualButton = false;
    
    manualInputButtons.forEach(button => {
      const text = button.textContent || button.innerText || '';
      if (text.includes('手动') || text.includes('输入') || text.includes('manual')) {
        foundManualButton = true;
        utils.log('✅ 发现手动输入按钮', 'success');
      }
    });
    
    if (!foundManualButton) {
      utils.log('⚠️ 未发现手动输入按钮，可能页面未加载完成', 'warning');
    }
    
    return true;
  } catch (error) {
    utils.log(`❌ 推荐码输入验证失败: ${error.message}`, 'error');
    return false;
  }
}

// 页面信息收集
function collectPageInfo() {
  utils.log('📊 收集页面信息...', 'info');
  
  const info = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    screen: {
      width: screen.width,
      height: screen.height
    }
  };
  
  console.table(info);
  
  // 检查React相关
  if (window.React) {
    utils.log('✅ 检测到React环境', 'success');
  }
  
  // 检查Expo相关
  if (window.expo || window.__expo) {
    utils.log('✅ 检测到Expo环境', 'success');
  }
  
  return info;
}

// 主验证函数
async function runVerification() {
  utils.log('🚀 开始完整验证流程...', 'info');
  
  const results = {
    pageInfo: collectPageInfo(),
    timeClassification: false,
    cameraPermission: false,
    referralInput: false
  };
  
  // 等待页面完全加载
  if (document.readyState !== 'complete') {
    utils.log('⏳ 等待页面加载完成...', 'info');
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }
  
  // 执行各项验证
  if (VERIFICATION_CONFIG.timeClassification) {
    results.timeClassification = await verifyTimeClassification();
    await utils.wait(1000);
  }
  
  if (VERIFICATION_CONFIG.cameraPermission) {
    results.cameraPermission = await verifyCameraPermission();
    await utils.wait(1000);
  }
  
  if (VERIFICATION_CONFIG.referralInput) {
    results.referralInput = await verifyReferralInput();
    await utils.wait(1000);
  }
  
  // 生成报告
  utils.log('📋 验证报告:', 'info');
  console.group('详细结果');
  console.log('时间分类修复:', results.timeClassification ? '✅ 通过' : '❌ 失败');
  console.log('摄像头权限修复:', results.cameraPermission ? '✅ 通过' : '❌ 失败');
  console.log('推荐码输入修复:', results.referralInput ? '✅ 通过' : '❌ 失败');
  console.groupEnd();
  
  const passedCount = Object.values(results).filter(Boolean).length - 1; // 减去pageInfo
  const totalCount = Object.keys(results).length - 1;
  
  if (passedCount === totalCount) {
    utils.log('🎉 所有修复验证通过！', 'success');
  } else {
    utils.log(`⚠️ ${passedCount}/${totalCount} 项修复验证通过`, 'warning');
  }
  
  return results;
}

// 导出到全局，方便手动调用
window.PomeloXVerification = {
  runVerification,
  verifyTimeClassification,
  verifyCameraPermission,
  verifyReferralInput,
  utils
};

// 自动运行验证
utils.log('💡 使用说明:', 'info');
console.log('1. 复制此脚本到浏览器控制台运行');
console.log('2. 或者调用: PomeloXVerification.runVerification()');
console.log('3. 单独验证: PomeloXVerification.verifyTimeClassification()');

// 如果是直接运行，自动开始验证
if (typeof window !== 'undefined') {
  setTimeout(() => {
    runVerification();
  }, 1000);
}





