// 终极解码测试 - 尝试所有可能的方法
const CryptoJS = require('crypto-js');

const targetHash = '487f7b22f68312d2c1bbc93b1aea445b';

console.log('🎯 目标哈希:', targetHash);
console.log('🧪 开始终极解码测试...\n');

// 方法1: 尝试其他哈希算法的逆向
console.log('=== 方法1: 检查是否为其他哈希算法 ===');

// 检查是否是SHA1的前32位
console.log('检查是否为SHA1截断...');
for (let i = 1; i <= 100; i++) {
  const sha1 = CryptoJS.SHA1(i.toString()).toString();
  if (sha1.substring(0, 32) === targetHash) {
    console.log('🎉 找到SHA1匹配!', i, 'SHA1前32位:', sha1.substring(0, 32));
    break;
  }
}

// 方法2: 尝试复合字符串格式
console.log('\n=== 方法2: 复合字符串格式 ===');
const compoundTests = [];

// 活动ID + 用户ID组合
for (let actId = 1; actId <= 50; actId++) {
  for (let userId = 100; userId <= 150; userId++) {
    compoundTests.push(`${actId}_${userId}`);
    compoundTests.push(`activity_${actId}_user_${userId}`);
  }
}

// UUID格式测试（部分）
const uuidParts = ['487f', '7b22', 'f683', '12d2', 'c1bb', 'c93b', '1aea', '445b'];
uuidParts.forEach(part => {
  compoundTests.push(part);
});

// 时间戳组合
const timestamps = ['1725955200', '1694476800', '1662940800']; // 不同年份的9月10日
timestamps.forEach(ts => {
  compoundTests.push(ts);
  compoundTests.push(`uci_${ts}`);
  compoundTests.push(`activity_${ts}`);
});

console.log('测试', compoundTests.length, '种复合格式...');
let found = false;

compoundTests.forEach((test, index) => {
  const hash = CryptoJS.MD5(test).toString();
  if (hash === targetHash) {
    console.log('🎉 找到匹配!', test);
    found = true;
  }
  
  if ((index + 1) % 500 === 0) {
    console.log(`⏳ 已测试复合格式 ${index + 1}/${compoundTests.length}...`);
  }
});

// 方法3: 尝试将哈希作为数据而不是哈希
if (!found) {
  console.log('\n=== 方法3: 将哈希当作数据处理 ===');
  
  // 尝试将哈希转换为数字
  const hashAsNumber = parseInt(targetHash, 16);
  console.log('十六进制转数字:', hashAsNumber);
  console.log('取模1000:', hashAsNumber % 1000);
  console.log('取模100:', hashAsNumber % 100);
  console.log('取模50:', hashAsNumber % 50);
  
  // 尝试取哈希的部分作为活动ID
  const hashParts = [
    targetHash.substring(0, 2),   // 前2位: 48
    targetHash.substring(0, 4),   // 前4位: 487f
    targetHash.substring(-2),     // 后2位: 5b
    targetHash.substring(-4),     // 后4位: 445b
  ];
  
  console.log('哈希片段解析:');
  hashParts.forEach((part, index) => {
    const decimal = parseInt(part, 16);
    console.log(`片段${index + 1} (${part}): 十六进制=${part}, 十进制=${decimal}`);
  });
  
  // 尝试这些数字作为活动ID
  const possibleIds = [
    parseInt(targetHash.substring(0, 2), 16), // 72
    parseInt(targetHash.substring(0, 4), 16), // 18559
    parseInt(targetHash.substring(-2), 16),   // 91
    parseInt(targetHash.substring(-4), 16),   // 17499
  ];
  
  console.log('可能的活动ID候选:', possibleIds);
}

// 方法4: 在线MD5解密尝试
if (!found) {
  console.log('\n=== 方法4: 在线资源建议 ===');
  console.log('可以尝试这些在线MD5解密网站:');
  console.log('1. https://md5decrypt.net/');
  console.log('2. https://hashkiller.io/md5-decrypter');
  console.log('3. https://md5.gromweb.com/');
  console.log('目标哈希:', targetHash);
}

// 方法5: 创建映射表供后端使用
console.log('\n=== 方法5: 建议方案 ===');
console.log('如果无法破解，建议：');
console.log('1. 联系UCI活动管理员，询问这个哈希对应的活动ID');
console.log('2. 在后端创建哈希到活动ID的映射表');
console.log('3. 或者要求UCI提供标准格式的活动码 (VG_ACTIVITY_XX 或纯数字)');

if (!found) {
  console.log('\n🔍 高级分析完成 - 未找到明确的原始值');
  console.log('💡 这可能不是简单的MD5哈希，或者使用了复杂的原始字符串');
}