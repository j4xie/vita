/**
 * 地域检测功能快速测试
 * 在Node.js环境中测试核心地域判断逻辑
 */

// 模拟中国边界判断函数（从RegionDetectionService复制）
const isLocationInChina = (latitude, longitude) => {
  // 中国大陆及港澳台地区的大致边界
  const chinaBounds = {
    north: 55.8271, // 黑龙江最北
    south: 3.8520,  // 南海最南（包含南沙群岛）
    east: 135.0857, // 黑龙江最东
    west: 73.4994   // 新疆最西
  };

  // 基本边界检查
  if (latitude < chinaBounds.south || latitude > chinaBounds.north ||
      longitude < chinaBounds.west || longitude > chinaBounds.east) {
    return false;
  }

  // 特殊区域检查（港澳台）
  const specialRegions = [
    // 香港
    { name: 'HongKong', north: 22.6, south: 22.1, east: 114.5, west: 113.8 },
    // 澳门
    { name: 'Macau', north: 22.25, south: 22.1, east: 113.65, west: 113.5 },
    // 台湾
    { name: 'Taiwan', north: 25.3, south: 21.9, east: 122.0, west: 119.3 }
  ];

  // 检查是否在特殊区域内
  for (const region of specialRegions) {
    if (latitude >= region.south && latitude <= region.north &&
        longitude >= region.west && longitude <= region.east) {
      return true;
    }
  }

  // 排除明显的海外区域（简单过滤）
  const overseasExclusions = [
    // 日本大致区域
    { north: 46, south: 30, east: 146, west: 129 },
    // 韩国大致区域  
    { north: 39, south: 33, east: 130, west: 124 },
    // 俄罗斯西伯利亚和远东地区
    { north: 72, south: 50, east: 180, west: 60 },
    // 印度北部（接近中国边境但属于印度）
    { north: 35, south: 25, east: 85, west: 72 },
  ];

  for (const exclusion of overseasExclusions) {
    if (latitude >= exclusion.south && latitude <= exclusion.north &&
        longitude >= exclusion.west && longitude <= exclusion.east) {
      return false;
    }
  }

  return true; // 在中国境内
};

// 测试用例
const testCases = [
  // 中国大陆主要城市
  { name: '北京', lat: 39.9042, lng: 116.4074, expected: true },
  { name: '上海', lat: 31.2304, lng: 121.4737, expected: true },
  { name: '广州', lat: 23.1291, lng: 113.2644, expected: true },
  { name: '深圳', lat: 22.5431, lng: 114.0579, expected: true },
  { name: '杭州', lat: 30.2741, lng: 120.1551, expected: true },
  { name: '成都', lat: 30.5728, lng: 104.0668, expected: true },
  { name: '西安', lat: 34.3416, lng: 108.9398, expected: true },
  { name: '乌鲁木齐', lat: 43.8256, lng: 87.6168, expected: true },
  { name: '哈尔滨', lat: 45.8038, lng: 126.5349, expected: true },
  
  // 港澳台地区
  { name: '香港', lat: 22.3193, lng: 114.1694, expected: true },
  { name: '澳门', lat: 22.1987, lng: 113.5439, expected: true },
  { name: '台北', lat: 25.0330, lng: 121.5654, expected: true },
  { name: '高雄', lat: 22.6273, lng: 120.3014, expected: true },
  
  // 海外主要城市
  { name: '纽约', lat: 40.7128, lng: -74.0060, expected: false },
  { name: '洛杉矶', lat: 34.0522, lng: -118.2437, expected: false },
  { name: '伦敦', lat: 51.5074, lng: -0.1278, expected: false },
  { name: '巴黎', lat: 48.8566, lng: 2.3522, expected: false },
  { name: '东京', lat: 35.6762, lng: 139.6503, expected: false },
  { name: '首尔', lat: 37.5665, lng: 126.9780, expected: false },
  { name: '悉尼', lat: -33.8688, lng: 151.2093, expected: false },
  
  // 边界测试
  { name: '俄罗斯（接近中国边境）', lat: 55.0000, lng: 82.0000, expected: false },
  { name: '印度（接近中国边境）', lat: 28.0000, lng: 77.0000, expected: false },
];

console.log('🧪 开始测试地域检测算法...\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach(({ name, lat, lng, expected }) => {
  const result = isLocationInChina(lat, lng);
  const passed = result === expected;
  const status = passed ? '✅' : '❌';
  
  console.log(`${status} ${name}: ${result} (预期: ${expected})`);
  
  if (passed) {
    passedTests++;
  }
});

console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过 (${Math.round(passedTests/totalTests*100)}%)`);

if (passedTests === totalTests) {
  console.log('🎉 所有测试通过！地域检测算法工作正常');
} else {
  console.log('⚠️  部分测试失败，需要调整地域判断逻辑');
}