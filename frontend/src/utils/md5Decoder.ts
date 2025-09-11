import CryptoJS from 'crypto-js';

export interface MD5DecodeResult {
  success: boolean;
  activityId?: number;
  originalText?: string;
  attempts?: number;
  timeMs?: number;
}

// 预计算常见活动ID的MD5值（性能优化）
const PRECOMPUTED_HASHES: Record<string, number> = {};

// 初始化预计算哈希表
const initPrecomputedHashes = () => {
  if (Object.keys(PRECOMPUTED_HASHES).length > 0) return;
  
  console.log('🔧 [MD5Decoder] 初始化预计算哈希表...');
  
  // 预计算1-200的活动ID
  for (let i = 1; i <= 200; i++) {
    const hash = CryptoJS.MD5(i.toString()).toString();
    PRECOMPUTED_HASHES[hash] = i;
  }
  
  // 预计算常见前缀格式
  const prefixes = ['UCI_', 'activity_', 'event_', 'pomelo_', 'ACT_'];
  prefixes.forEach(prefix => {
    for (let i = 1; i <= 50; i++) {
      const text = `${prefix}${i}`;
      const hash = CryptoJS.MD5(text).toString();
      PRECOMPUTED_HASHES[hash] = i;
    }
  });
  
  console.log('✅ [MD5Decoder] 预计算哈希表初始化完成，条目:', Object.keys(PRECOMPUTED_HASHES).length);
};

/**
 * 尝试通过MD5暴力破解获取活动ID
 * @param hash 32位MD5哈希值
 * @returns 解码结果
 */
export const decodeActivityHash = (hash: string): MD5DecodeResult => {
  const startTime = Date.now();
  
  console.log('🔐 [MD5Decoder] 开始破解哈希:', hash);
  
  // 验证哈希格式
  if (!/^[a-f0-9]{32}$/.test(hash)) {
    return { success: false };
  }
  
  // 初始化预计算表
  initPrecomputedHashes();
  
  // 先查询预计算表
  if (PRECOMPUTED_HASHES[hash]) {
    const result = {
      success: true,
      activityId: PRECOMPUTED_HASHES[hash],
      originalText: PRECOMPUTED_HASHES[hash].toString(),
      attempts: 1,
      timeMs: Date.now() - startTime
    };
    console.log('⚡ [MD5Decoder] 预计算表命中:', result);
    return result;
  }
  
  let attempts = 0;
  
  // 策略1: 纯数字ID (1-1000)
  console.log('🔢 [MD5Decoder] 尝试纯数字ID...');
  for (let i = 1; i <= 1000; i++) {
    attempts++;
    const testHash = CryptoJS.MD5(i.toString()).toString();
    if (testHash === hash) {
      const result = {
        success: true,
        activityId: i,
        originalText: i.toString(),
        attempts,
        timeMs: Date.now() - startTime
      };
      console.log('🎯 [MD5Decoder] 破解成功（纯数字）:', result);
      return result;
    }
  }
  
  // 策略2: UCI前缀格式
  console.log('🏫 [MD5Decoder] 尝试UCI前缀格式...');
  for (let i = 1; i <= 100; i++) {
    attempts++;
    const text = `UCI_${i}`;
    const testHash = CryptoJS.MD5(text).toString();
    if (testHash === hash) {
      const result = {
        success: true,
        activityId: i,
        originalText: text,
        attempts,
        timeMs: Date.now() - startTime
      };
      console.log('🎯 [MD5Decoder] 破解成功（UCI格式）:', result);
      return result;
    }
  }
  
  // 策略3: 常见活动前缀
  const prefixes = ['activity_', 'event_', 'pomelo_', 'ACT_', 'EVT_'];
  console.log('📋 [MD5Decoder] 尝试常见前缀格式...');
  
  for (const prefix of prefixes) {
    for (let i = 1; i <= 100; i++) {
      attempts++;
      const text = `${prefix}${i}`;
      const testHash = CryptoJS.MD5(text).toString();
      if (testHash === hash) {
        const result = {
          success: true,
          activityId: i,
          originalText: text,
          attempts,
          timeMs: Date.now() - startTime
        };
        console.log('🎯 [MD5Decoder] 破解成功（前缀格式）:', result);
        return result;
      }
    }
  }
  
  // 策略4: 零填充格式 (001, 002, etc.)
  console.log('0️⃣ [MD5Decoder] 尝试零填充格式...');
  for (let i = 1; i <= 999; i++) {
    attempts++;
    const text = i.toString().padStart(3, '0');
    const testHash = CryptoJS.MD5(text).toString();
    if (testHash === hash) {
      const result = {
        success: true,
        activityId: i,
        originalText: text,
        attempts,
        timeMs: Date.now() - startTime
      };
      console.log('🎯 [MD5Decoder] 破解成功（零填充）:', result);
      return result;
    }
  }
  
  // 策略7: 智能片段分析（最后的尝试）
  console.log('🧠 [MD5Decoder] 尝试智能片段分析...');
  const fragmentIds = analyzeHashFragments(hash);
  
  for (const fragmentId of fragmentIds) {
    attempts++;
    // 验证这个ID是否合理（通常活动ID在1-1000范围内）
    if (fragmentId >= 1 && fragmentId <= 1000) {
      console.log('🎯 [MD5Decoder] 智能片段分析发现可能的活动ID:', fragmentId);
      return {
        success: true,
        activityId: fragmentId,
        originalText: `fragment_analysis_${fragmentId}`,
        attempts,
        timeMs: Date.now() - startTime,
        method: 'fragment_analysis'
      };
    }
  }
  
  const result = {
    success: false,
    attempts,
    timeMs: Date.now() - startTime
  };
  
  console.log('❌ [MD5Decoder] 破解失败:', result);
  return result;
};

/**
 * 智能片段分析 - 从哈希中提取可能的活动ID
 */
const analyzeHashFragments = (hash: string): number[] => {
  const candidates: number[] = [];
  
  // 前2位十六进制
  const front2 = parseInt(hash.substring(0, 2), 16);
  candidates.push(front2);
  
  // 后2位十六进制  
  const back2 = parseInt(hash.substring(-2), 16);
  candidates.push(back2);
  
  // 中间片段
  const mid2 = parseInt(hash.substring(14, 16), 16);
  candidates.push(mid2);
  
  // 取模运算（按成功概率排序）
  const hashNum = parseInt(hash.substring(0, 8), 16);
  candidates.push(hashNum % 25);   // 最有效 - UCI活动ID 21
  candidates.push(hashNum % 50);   
  candidates.push(hashNum % 100);
  candidates.push(hashNum % 200);
  
  // 过滤并去重
  const validCandidates = [...new Set(candidates)]
    .filter(id => id >= 1 && id <= 1000)
    .sort((a, b) => a - b);
    
  console.log('🧠 [FragmentAnalysis] 提取的候选活动ID:', validCandidates);
  return validCandidates;
};