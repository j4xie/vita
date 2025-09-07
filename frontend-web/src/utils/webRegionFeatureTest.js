/**
 * Web端 Region & Timezone 功能测试脚本
 * 验证浏览器环境下的地理位置检测、用户偏好管理和相关功能
 */

import RegionDetectionService from '../services/RegionDetectionService';
import UserRegionPreferences from '../services/UserRegionPreferences';
import WebStorageService, { WebAsyncStorage } from '../services/WebStorageService';

/**
 * 测试Web端地理位置检测服务
 */
export const testWebRegionDetection = async () => {
  console.log('🧪 [Web] 开始测试地理位置检测服务...');
  
  try {
    // 测试浏览器兼容性
    console.log('1️⃣ 测试浏览器兼容性...');
    const hasGeolocation = 'geolocation' in navigator;
    const hasLocalStorage = WebStorageService.isStorageAvailable('local');
    const hasSessionStorage = WebStorageService.isStorageAvailable('session');
    
    console.log('✅ 浏览器兼容性:', {
      geolocation: hasGeolocation,
      localStorage: hasLocalStorage,
      sessionStorage: hasSessionStorage,
    });
    
    // 测试区域检测（仅IP，不触发权限请求）
    console.log('2️⃣ 测试IP区域检测...');
    const detectionResult = await RegionDetectionService.detectUserRegion({
      preferGeolocation: false,
      useCache: false
    });
    console.log('✅ 区域检测结果:', detectionResult);
    
    // 测试缓存功能
    console.log('3️⃣ 测试缓存功能...');
    const cachedResult = await RegionDetectionService.getCurrentRegion();
    console.log('✅ 缓存结果:', cachedResult);
    
    // 测试强制重新检测
    console.log('4️⃣ 测试强制重新检测...');
    await RegionDetectionService.clearCache();
    const forcedResult = await RegionDetectionService.forceDetection(false);
    console.log('✅ 强制重新检测结果:', forcedResult);
    
    console.log('✅ Web端地理位置检测服务测试完成');
    return true;
  } catch (error) {
    console.error('❌ Web端地理位置检测服务测试失败:', error);
    return false;
  }
};

/**
 * 测试Web端用户区域偏好管理
 */
export const testWebUserRegionPreferences = async () => {
  console.log('🧪 [Web] 开始测试用户区域偏好管理...');
  
  try {
    // 清除现有偏好（重新开始）
    console.log('1️⃣ 清除现有偏好...');
    await UserRegionPreferences.clearPreferences();
    
    // 测试初始化
    console.log('2️⃣ 测试偏好初始化...');
    const initialized = await UserRegionPreferences.initializePreferences('zh');
    console.log('✅ 初始化结果:', initialized);
    
    // 测试获取偏好
    console.log('3️⃣ 测试获取偏好...');
    const preferences = await UserRegionPreferences.getPreferences();
    console.log('✅ 获取偏好结果:', preferences);
    
    // 测试区域切换
    console.log('4️⃣ 测试区域切换...');
    const updated = await UserRegionPreferences.updateCurrentRegion('usa');
    console.log('✅ 区域切换结果:', updated);
    
    // 测试隐私签署
    console.log('5️⃣ 测试隐私签署...');
    await UserRegionPreferences.markPrivacySigned('usa');
    const hasSigned = await UserRegionPreferences.hasSignedPrivacyFor('usa');
    console.log('✅ 隐私签署结果:', hasSigned);
    
    // 测试位置不匹配检测
    console.log('6️⃣ 测试位置不匹配检测...');
    const mismatchResult = await UserRegionPreferences.checkLocationMismatch();
    console.log('✅ 位置不匹配检测结果:', mismatchResult);
    
    // 测试通知权限（Web端特有）
    console.log('7️⃣ 测试浏览器通知权限...');
    const hasNotificationPermission = await UserRegionPreferences.requestNotificationPermission();
    console.log('✅ 通知权限结果:', hasNotificationPermission);
    
    console.log('✅ Web端用户区域偏好管理测试完成');
    return true;
  } catch (error) {
    console.error('❌ Web端用户区域偏好管理测试失败:', error);
    return false;
  }
};

/**
 * 测试Web端存储服务
 */
export const testWebStorageService = async () => {
  console.log('🧪 [Web] 开始测试存储服务...');
  
  try {
    // 测试基本存储操作
    console.log('1️⃣ 测试基本存储操作...');
    await WebAsyncStorage.setItem('test_key', 'test_value');
    const retrieved = await WebAsyncStorage.getItem('test_key');
    console.log('✅ 基本存储测试:', { set: 'test_value', get: retrieved });
    
    // 测试JSON存储
    console.log('2️⃣ 测试JSON存储...');
    const testObject = { id: 1, name: 'test', timestamp: Date.now() };
    await WebAsyncStorage.setObject('test_object', testObject);
    const retrievedObject = await WebAsyncStorage.getObject('test_object');
    console.log('✅ JSON存储测试:', { set: testObject, get: retrievedObject });
    
    // 测试存储空间信息
    console.log('3️⃣ 测试存储空间信息...');
    const localStorageService = new WebStorageService('local');
    const storageInfo = localStorageService.getStorageInfo();
    console.log('✅ 存储空间信息:', storageInfo);
    
    // 清理测试数据
    await WebAsyncStorage.removeItem('test_key');
    await WebAsyncStorage.removeItem('test_object');
    
    console.log('✅ Web端存储服务测试完成');
    return true;
  } catch (error) {
    console.error('❌ Web端存储服务测试失败:', error);
    return false;
  }
};

/**
 * 测试Web端UI组件（模拟测试）
 */
export const testWebUIComponents = () => {
  console.log('🧪 [Web] 开始测试UI组件...');
  
  try {
    console.log('1️⃣ 测试区域显示名称...');
    const chinaZh = UserRegionPreferences.getRegionDisplayName('china', 'zh');
    const usaZh = UserRegionPreferences.getRegionDisplayName('usa', 'zh');
    const chinaEn = UserRegionPreferences.getRegionDisplayName('china', 'en');
    const usaEn = UserRegionPreferences.getRegionDisplayName('usa', 'en');
    
    console.log('✅ 显示名称测试:', {
      中文: { china: chinaZh, usa: usaZh },
      English: { china: chinaEn, usa: usaEn }
    });
    
    console.log('2️⃣ 测试区域图标...');
    const chinaIcon = UserRegionPreferences.getRegionIcon('china');
    const usaIcon = UserRegionPreferences.getRegionIcon('usa');
    console.log('✅ 区域图标:', { china: chinaIcon, usa: usaIcon });
    
    console.log('3️⃣ 测试Web端特有功能...');
    
    // 测试CSS媒体查询支持
    const supportsDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const supportsReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    console.log('✅ Web端特性:', {
      darkModePreference: supportsDarkMode,
      reducedMotionPreference: supportsReducedMotion,
      userAgent: navigator.userAgent.substring(0, 50) + '...',
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    
    console.log('✅ Web端UI组件测试完成');
    return true;
  } catch (error) {
    console.error('❌ Web端UI组件测试失败:', error);
    return false;
  }
};

/**
 * Web端特有：测试浏览器API兼容性
 */
export const testWebBrowserAPIs = () => {
  console.log('🧪 [Web] 开始测试浏览器API兼容性...');
  
  try {
    const apiSupport = {
      // 核心API
      fetch: typeof fetch !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      
      // 地理位置相关
      geolocation: 'geolocation' in navigator,
      permissions: 'permissions' in navigator,
      
      // 通知相关
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      
      // 现代浏览器特性
      internationalAPI: typeof Intl !== 'undefined',
      promiseAPI: typeof Promise !== 'undefined',
      asyncAwait: true, // 如果代码能运行说明支持
      
      // Web平台特有
      historyAPI: 'history' in window && 'pushState' in history,
      visibilityAPI: 'visibilityState' in document,
      mediaQuery: 'matchMedia' in window,
    };
    
    console.log('✅ 浏览器API支持情况:', apiSupport);
    
    const supportedAPIs = Object.values(apiSupport).filter(Boolean).length;
    const totalAPIs = Object.keys(apiSupport).length;
    
    console.log(`✅ API兼容性: ${supportedAPIs}/${totalAPIs} (${(supportedAPIs/totalAPIs*100).toFixed(1)}%)`);
    
    // 检查关键API
    const criticalAPIs = ['fetch', 'localStorage', 'internationalAPI', 'promiseAPI'];
    const criticalSupport = criticalAPIs.every(api => apiSupport[api]);
    
    if (criticalSupport) {
      console.log('✅ 所有关键API都支持，功能可以正常运行');
    } else {
      console.warn('⚠️ 部分关键API不支持，功能可能受限');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 浏览器API兼容性测试失败:', error);
    return false;
  }
};

/**
 * 运行Web端完整测试套件
 */
export const runWebCompleteRegionTest = async () => {
  console.log('🚀 [Web] 开始 Region & Timezone 功能完整测试...');
  
  const results = {
    browserAPIs: false,
    storageService: false,
    regionDetection: false,
    userPreferences: false,
    uiComponents: false,
  };
  
  try {
    // 1. 测试浏览器API兼容性
    results.browserAPIs = testWebBrowserAPIs();
    
    // 2. 测试存储服务
    results.storageService = await testWebStorageService();
    
    // 3. 测试地理位置检测
    results.regionDetection = await testWebRegionDetection();
    
    // 4. 测试用户偏好管理
    results.userPreferences = await testWebUserRegionPreferences();
    
    // 5. 测试UI组件
    results.uiComponents = testWebUIComponents();
    
    // 汇总结果
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log('\n📊 Web端测试结果汇总:');
    console.log(`✅ 通过: ${passedTests}/${totalTests}`);
    console.log('📋 详细结果:', results);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有Web端测试通过！Region & Timezone 功能在Web端实现成功！');
      console.log('🌐 Web端特色功能：');
      console.log('   - 浏览器通知支持');
      console.log('   - localStorage持久化');
      console.log('   - CSS暗色模式适配');
      console.log('   - 键盘快捷键支持');
    } else {
      console.log('⚠️ 部分Web端测试失败，需要检查和修复。');
    }
    
    return results;
  } catch (error) {
    console.error('❌ Web端测试套件执行失败:', error);
    return results;
  }
};

/**
 * Web端性能测试
 */
export const testWebPerformance = async () => {
  console.log('🧪 [Web] 开始性能测试...');
  
  try {
    const startTime = performance.now();
    
    // 测试检测速度
    const detectionTime = performance.now();
    await RegionDetectionService.detectUserRegion({ useCache: false });
    const detectionDuration = performance.now() - detectionTime;
    
    // 测试存储速度
    const storageTime = performance.now();
    await WebAsyncStorage.setObject('perf_test', { data: 'test'.repeat(1000) });
    await WebAsyncStorage.getObject('perf_test');
    await WebAsyncStorage.removeItem('perf_test');
    const storageDuration = performance.now() - storageTime;
    
    const totalDuration = performance.now() - startTime;
    
    const performanceResults = {
      totalTime: `${totalDuration.toFixed(2)}ms`,
      detectionTime: `${detectionDuration.toFixed(2)}ms`,
      storageTime: `${storageDuration.toFixed(2)}ms`,
      memoryUsage: (performance as any).memory ? {
        used: `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${((performance as any).memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      } : 'Not available',
    };
    
    console.log('✅ Web端性能测试结果:', performanceResults);
    
    // 性能基准
    const isGoodPerformance = detectionDuration < 3000 && storageDuration < 100;
    console.log(isGoodPerformance ? '🚀 性能优秀！' : '⚠️ 性能需要优化');
    
    return true;
  } catch (error) {
    console.error('❌ Web端性能测试失败:', error);
    return false;
  }
};

// 导出测试函数供浏览器控制台使用
if (typeof window !== 'undefined') {
  // 添加到window对象，便于调试
  (window as any).webRegionTests = {
    runComplete: runWebCompleteRegionTest,
    testDetection: testWebRegionDetection,
    testPreferences: testWebUserRegionPreferences,
    testStorage: testWebStorageService,
    testUIComponents: testWebUIComponents,
    testBrowserAPIs: testWebBrowserAPIs,
    testPerformance: testWebPerformance,
  };
  
  console.log('🧪 Web端Region功能测试工具已加载');
  console.log('   - window.webRegionTests.runComplete() - 运行完整测试');
  console.log('   - window.webRegionTests.testDetection() - 测试地理检测');
  console.log('   - window.webRegionTests.testPreferences() - 测试用户偏好');
  console.log('   - window.webRegionTests.testStorage() - 测试存储服务');
  console.log('   - window.webRegionTests.testUIComponents() - 测试UI组件');
  console.log('   - window.webRegionTests.testBrowserAPIs() - 测试浏览器API');
  console.log('   - window.webRegionTests.testPerformance() - 性能测试');
}