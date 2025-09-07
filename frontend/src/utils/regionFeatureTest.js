/**
 * Region & Timezone 功能测试脚本
 * 验证地理位置检测、用户偏好管理和相关功能是否正常工作
 */

import RegionDetectionService from '../services/RegionDetectionService';
import UserRegionPreferences from '../services/UserRegionPreferences';

/**
 * 测试地理位置检测服务
 */
export const testRegionDetection = async () => {
  console.log('🧪 开始测试地理位置检测服务...');
  
  try {
    // 测试区域检测
    console.log('1️⃣ 测试区域检测...');
    const detectionResult = await RegionDetectionService.detectRegion();
    console.log('✅ 区域检测结果:', detectionResult);
    
    // 测试缓存功能
    console.log('2️⃣ 测试缓存功能...');
    const cachedResult = RegionDetectionService.getCachedResult();
    console.log('✅ 缓存结果:', cachedResult);
    
    // 测试强制重新检测
    console.log('3️⃣ 测试强制重新检测...');
    await RegionDetectionService.clearCache();
    const forcedResult = await RegionDetectionService.detectRegion();
    console.log('✅ 强制重新检测结果:', forcedResult);
    
    console.log('✅ 地理位置检测服务测试完成');
    return true;
  } catch (error) {
    console.error('❌ 地理位置检测服务测试失败:', error);
    return false;
  }
};

/**
 * 测试用户区域偏好管理
 */
export const testUserRegionPreferences = async () => {
  console.log('🧪 开始测试用户区域偏好管理...');
  
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
    
    console.log('✅ 用户区域偏好管理测试完成');
    return true;
  } catch (error) {
    console.error('❌ 用户区域偏好管理测试失败:', error);
    return false;
  }
};

/**
 * 测试显示名称和图标
 */
export const testRegionDisplay = () => {
  console.log('🧪 开始测试区域显示功能...');
  
  try {
    console.log('1️⃣ 测试中文显示名称...');
    const chinaZh = UserRegionPreferences.getRegionDisplayName('china', 'zh');
    const usaZh = UserRegionPreferences.getRegionDisplayName('usa', 'zh');
    console.log('✅ 中文显示名称:', { china: chinaZh, usa: usaZh });
    
    console.log('2️⃣ 测试英文显示名称...');
    const chinaEn = UserRegionPreferences.getRegionDisplayName('china', 'en');
    const usaEn = UserRegionPreferences.getRegionDisplayName('usa', 'en');
    console.log('✅ 英文显示名称:', { china: chinaEn, usa: usaEn });
    
    console.log('3️⃣ 测试区域图标...');
    const chinaIcon = UserRegionPreferences.getRegionIcon('china');
    const usaIcon = UserRegionPreferences.getRegionIcon('usa');
    console.log('✅ 区域图标:', { china: chinaIcon, usa: usaIcon });
    
    console.log('✅ 区域显示功能测试完成');
    return true;
  } catch (error) {
    console.error('❌ 区域显示功能测试失败:', error);
    return false;
  }
};

/**
 * 运行完整测试套件
 */
export const runCompleteRegionTest = async () => {
  console.log('🚀 开始 Region & Timezone 功能完整测试...');
  
  const results = {
    regionDetection: false,
    userPreferences: false,
    regionDisplay: false,
  };
  
  try {
    // 1. 测试地理位置检测
    results.regionDetection = await testRegionDetection();
    
    // 2. 测试用户偏好管理
    results.userPreferences = await testUserRegionPreferences();
    
    // 3. 测试显示功能
    results.regionDisplay = testRegionDisplay();
    
    // 汇总结果
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过: ${passedTests}/${totalTests}`);
    console.log('📋 详细结果:', results);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有测试通过！Region & Timezone 功能实现成功！');
    } else {
      console.log('⚠️ 部分测试失败，需要检查和修复。');
    }
    
    return results;
  } catch (error) {
    console.error('❌ 测试套件执行失败:', error);
    return results;
  }
};

// 导出测试函数供开发环境使用
if (__DEV__) {
  global.testRegionFeatures = runCompleteRegionTest;
  global.testRegionDetection = testRegionDetection;
  global.testUserRegionPreferences = testUserRegionPreferences;
  global.testRegionDisplay = testRegionDisplay;
  
  console.log('🧪 Region功能测试工具已加载');
  console.log('   - global.testRegionFeatures() - 运行完整测试');
  console.log('   - global.testRegionDetection() - 测试地理检测');
  console.log('   - global.testUserRegionPreferences() - 测试用户偏好');
  console.log('   - global.testRegionDisplay() - 测试显示功能');
}