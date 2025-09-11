// 快速测试特定哈希值的可能原始值
const CryptoJS = require('crypto-js');

const targetHash = '487f7b22f68312d2c1bbc93b1aea445b';

console.log('🎯 目标哈希:', targetHash);
console.log('🔍 开始快速破解测试...\n');

// 测试一些可能的值
const testCases = [
  // 常见数字
  ...Array.from({length: 100}, (_, i) => (i + 1).toString()),
  
  // UCI相关
  'UCI', 'uci', 'UCI_EVENT', 'UCI_ACTIVITY',
  ...Array.from({length: 20}, (_, i) => `UCI_${i + 1}`),
  ...Array.from({length: 20}, (_, i) => `uci_${i + 1}`),
  
  // 活动相关
  'activity', 'event', 'signin', 'checkin',
  ...Array.from({length: 20}, (_, i) => `activity_${i + 1}`),
  ...Array.from({length: 20}, (_, i) => `event_${i + 1}`),
  
  // 时间戳相关
  '20250910', '2025091020', 
  
  // 特殊格式
  'pomelo', 'vitaglobal', 'checkin_1', 'signin_1',
  
  // 可能的ID组合
  '487', '7b22', 'f683', '12d2', 'c1bb', 'c93b',
  
  // 其他可能格式
  'ACTIVITY_001', 'EVENT_001', 'UCI_ACTIVITY_1',
];

let found = false;

console.log('📋 测试', testCases.length, '种可能的原始值...\n');

testCases.forEach((testValue, index) => {
  const hash = CryptoJS.MD5(testValue).toString();
  
  if (hash === targetHash) {
    console.log('🎉 找到匹配!');
    console.log('原始值:', testValue);
    console.log('活动ID:', parseInt(testValue) || '非数字格式');
    console.log('哈希值:', hash);
    found = true;
  }
  
  // 每100次打印进度
  if ((index + 1) % 100 === 0) {
    console.log(`⏳ 已测试 ${index + 1}/${testCases.length} 个值...`);
  }
});

if (!found) {
  console.log('\n❌ 在常见格式中未找到匹配');
  console.log('💡 建议：');
  console.log('1. 联系UCI活动管理员获取原始活动ID');
  console.log('2. 检查活动二维码是否包含其他信息');
  console.log('3. 可能需要特殊的解密逻辑');
}

// 生成一些示例哈希供参考
console.log('\n📝 常见格式的哈希示例:');
['1', '2', '20', 'UCI_1', 'activity_1'].forEach(val => {
  const hash = CryptoJS.MD5(val).toString();
  console.log(`${val} -> ${hash}`);
});