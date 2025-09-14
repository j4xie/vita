// 测试片段分析方法
const targetHash = '487f7b22f68312d2c1bbc93b1aea445b';

console.log('🎯 目标哈希:', targetHash);
console.log('🧠 开始片段分析...\n');

function analyzeHashFragments(hash) {
  const candidates = [];
  
  console.log('=== 十六进制片段提取 ===');
  
  // 前2位十六进制
  const front2 = parseInt(hash.substring(0, 2), 16);
  console.log(`前2位 (${hash.substring(0, 2)}):`, front2);
  candidates.push(front2);
  
  // 后2位十六进制  
  const back2 = parseInt(hash.substring(-2), 16);
  console.log(`后2位 (${hash.substring(-2)}):`, back2);
  candidates.push(back2);
  
  // 中间片段
  const mid2 = parseInt(hash.substring(14, 16), 16);
  console.log(`中间片段 (${hash.substring(14, 16)}):`, mid2);
  candidates.push(mid2);
  
  console.log('\n=== 取模运算 ===');
  
  // 取模运算
  const hashNum = parseInt(hash.substring(0, 8), 16);
  console.log(`前8位数值 (${hash.substring(0, 8)}):`, hashNum);
  
  const mod100 = hashNum % 100;
  const mod50 = hashNum % 50;
  const mod200 = hashNum % 200;
  const mod25 = hashNum % 25;
  
  console.log('取模100:', mod100);
  console.log('取模50:', mod50);
  console.log('取模200:', mod200);
  console.log('取模25:', mod25);
  
  candidates.push(mod100, mod50, mod200, mod25);
  
  console.log('\n=== 其他计算 ===');
  
  // 数字根计算
  const digitalRoot = getDigitalRoot(hashNum);
  console.log('数字根:', digitalRoot);
  candidates.push(digitalRoot);
  
  // 简单数学运算
  const sum = front2 + back2;
  const diff = Math.abs(front2 - back2);
  const mult = front2 * back2;
  
  console.log(`前后相加 (${front2} + ${back2}):`, sum);
  console.log(`前后相减 |${front2} - ${back2}|:`, diff);
  console.log(`前后相乘 (${front2} * ${back2}):`, mult);
  
  if (sum <= 1000) candidates.push(sum);
  if (diff <= 1000) candidates.push(diff);
  if (mult <= 1000) candidates.push(mult);
  
  // 过滤并去重
  const validCandidates = [...new Set(candidates)]
    .filter(id => id >= 1 && id <= 1000)
    .sort((a, b) => a - b);
    
  console.log('\n🎯 最终候选活动ID:', validCandidates);
  return validCandidates;
}

function getDigitalRoot(num) {
  while (num >= 10) {
    num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return num;
}

// 执行分析
const candidates = analyzeHashFragments(targetHash);

console.log('\n🎯 建议测试这些活动ID:');
candidates.forEach((id, index) => {
  console.log(`${index + 1}. 活动ID ${id} - 可以尝试手动签到或生成二维码测试`);
});

console.log('\n💡 下一步:');
console.log('1. 尝试用这些ID手动调用签到API');
console.log('2. 或者生成包含这些数字的二维码进行扫描测试');
console.log('3. 如果其中某个ID有效，说明片段分析方法可行！');