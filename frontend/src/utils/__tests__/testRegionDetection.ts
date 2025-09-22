/**
 * 地域检测功能测试工具
 * 用于验证RegionDetectionService是否正常工作
 */

import RegionDetectionService from '../../services/RegionDetectionService';

export const testRegionDetection = async () => {
  console.log('🧪 开始测试地域检测功能...');
  
  try {
    // 测试完整的地域检测
    const result = await RegionDetectionService.detectRegion();
    
    console.log('🎯 地域检测测试结果:', {
      region: result.region,
      confidence: result.confidence,
      method: result.method,
      location: result.location,
      error: result.error
    });

    // 测试快速检测
    const quickResult = await RegionDetectionService.quickDetect();
    console.log('⚡ 快速检测结果:', quickResult);

    // 测试中国坐标判断
    console.log('🗺️ 测试中国坐标判断:');
    const testCoordinates = [
      { name: '北京', lat: 39.9042, lng: 116.4074, expected: true },
      { name: '上海', lat: 31.2304, lng: 121.4737, expected: true },
      { name: '纽约', lat: 40.7128, lng: -74.0060, expected: false },
      { name: '洛杉矶', lat: 34.0522, lng: -118.2437, expected: false },
      { name: '香港', lat: 22.3193, lng: 114.1694, expected: true },
      { name: '台北', lat: 25.0330, lng: 121.5654, expected: true },
    ];

    // 由于isLocationInChina是private方法，我们通过反射测试
    const service = RegionDetectionService as any;
    if (service.isLocationInChina) {
      testCoordinates.forEach(({ name, lat, lng, expected }) => {
        const result = service.isLocationInChina(lat, lng);
        const status = result === expected ? '✅' : '❌';
        console.log(`${status} ${name}: ${result} (预期: ${expected})`);
      });
    }

    return {
      success: true,
      detectionResult: result,
      quickResult: quickResult,
    };
  } catch (error) {
    console.error('❌ 地域检测测试失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const testRegionDetectionUI = () => {
  console.log('🖥️ 检查UI翻译键是否存在...');
  
  const requiredTranslations = [
    'auth.register.form.area_detection_label',
    'auth.register.form.area_detecting',
    'auth.register.form.area_detected_china',
    'auth.register.form.area_detected_usa',
    'auth.register.form.area_detection_method',
    'auth.register.form.area_change_manual',
    'auth.register.form.area_manual_select',
    'auth.register.form.area_detection_failed',
    'common.gps_location',
    'common.ip_address',
    'common.high_confidence',
    'common.medium_confidence'
  ];

  console.log('需要的翻译键:', requiredTranslations);
  console.log('请检查这些翻译键是否已在zh-CN和en-US的translation.json中正确配置');
};

// 导出测试函数，可在控制台中调用
export default {
  testRegionDetection,
  testRegionDetectionUI,
};