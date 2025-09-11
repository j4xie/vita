// 高级哈希破解工具 - 尝试多种解密方法
const CryptoJS = require('crypto-js');

const targetHash = '487f7b22f68312d2c1bbc93b1aea445b';

console.log('🎯 目标哈希:', targetHash);
console.log('📏 哈希长度:', targetHash.length);
console.log('🔍 开始高级破解分析...\n');

// 方法1: 检查是否为其他哈希算法
console.log('=== 方法1: 检查哈希算法类型 ===');
const testString = 'test123';
console.log('MD5("test123"):', CryptoJS.MD5(testString).toString());
console.log('SHA1("test123"):', CryptoJS.SHA1(testString).toString());
console.log('SHA256("test123"):', CryptoJS.SHA256(testString).toString());

// 方法2: 尝试更大范围的数字
console.log('\n=== 方法2: 扩大数字范围 (1-5000) ===');
let found = false;

for (let i = 1; i <= 5000 && !found; i++) {
  const hash = CryptoJS.MD5(i.toString()).toString();
  if (hash === targetHash) {
    console.log('🎉 找到匹配! 数字:', i);
    found = true;
  }
  
  if (i % 1000 === 0) {
    console.log(`⏳ 已测试到 ${i}...`);
  }
}

// 方法3: 尝试日期格式
if (!found) {
  console.log('\n=== 方法3: 尝试日期时间格式 ===');
  const dateFormats = [
    // 日期格式
    '20250910', '2025-09-10', '09-10-2025', '10/09/2025',
    '20240910', '2024-09-10', 
    '20230910', '2023-09-10',
    
    // 时间戳格式 
    '1725955200', // 2025-09-10的时间戳
    '1694476800', // 2023-09-12的时间戳
    
    // 活动相关日期
    'UCI_20250910', 'uci_20250910',
    'activity_20250910', 'event_20250910',
  ];
  
  dateFormats.forEach(dateStr => {
    const hash = CryptoJS.MD5(dateStr).toString();
    if (hash === targetHash) {
      console.log('🎉 找到匹配! 日期格式:', dateStr);
      found = true;
    }
  });
}

// 方法4: 尝试UCI特定格式
if (!found) {
  console.log('\n=== 方法4: UCI特定格式 ===');
  const uciFormats = [
    // UCI + 数字组合
    'UCI2025', 'UCI2024', 'UCI2023',
    'UCI_2025', 'UCI_2024', 'UCI_2023',
    
    // UCI活动编号
    ...Array.from({length: 100}, (_, i) => `UCI${i + 1}`),
    ...Array.from({length: 100}, (_, i) => `uci${i + 1}`),
    
    // 可能的课程代码
    'CS101', 'CS201', 'ECON101', 'MATH101',
    'UCI_CS101', 'UCI_ECON101',
    
    // 活动类型
    'orientation', 'welcome', 'networking', 'study_group',
    'UCI_orientation', 'UCI_welcome',
  ];
  
  uciFormats.forEach(format => {
    const hash = CryptoJS.MD5(format).toString();
    if (hash === targetHash) {
      console.log('🎉 找到匹配! UCI格式:', format);
      found = true;
    }
  });
}

// 方法5: 尝试常见英文词汇
if (!found) {
  console.log('\n=== 方法5: 常见英文词汇 ===');
  const commonWords = [
    'checkin', 'signin', 'register', 'welcome', 'orientation',
    'activity', 'event', 'meeting', 'study', 'group',
    'university', 'college', 'student', 'campus',
    'irvine', 'california', 'socal', 'oc',
    'anteater', 'zot', // UCI吉祥物相关
  ];
  
  commonWords.forEach(word => {
    // 尝试不同变体
    const variants = [
      word,
      word.toUpperCase(),
      word.toLowerCase(),
      `uci_${word}`,
      `UCI_${word}`,
      `${word}_1`,
      `${word}_2025`,
    ];
    
    variants.forEach(variant => {
      const hash = CryptoJS.MD5(variant).toString();
      if (hash === targetHash) {
        console.log('🎉 找到匹配! 英文词汇:', variant);
        found = true;
      }
    });
  });
}

// 方法6: 尝试解析为其他格式
if (!found) {
  console.log('\n=== 方法6: 检查是否为Base64或其他编码 ===');
  
  try {
    // 尝试将哈希当作Base64解码
    const base64Decoded = atob(targetHash.substring(0, 24)); // 取前24位作为Base64
    console.log('Base64解码尝试:', base64Decoded);
  } catch (e) {
    console.log('不是Base64格式');
  }
  
  // 尝试十六进制解码
  try {
    const hexDecoded = Buffer.from(targetHash, 'hex').toString('utf8');
    console.log('十六进制解码尝试:', hexDecoded);
  } catch (e) {
    console.log('十六进制解码失败');
  }
}

if (!found) {
  console.log('\n❌ 所有常见方法都未找到匹配');
  console.log('\n💡 建议下一步：');
  console.log('1. 联系UCI活动组织者询问原始格式');
  console.log('2. 检查二维码是否包含其他信息');
  console.log('3. 可能需要特定的解密密钥');
  console.log('4. 或者这不是MD5哈希，而是其他算法');
} else {
  console.log('\n🎉 破解成功！现在可以用这个信息调用活动签到API了！');
}