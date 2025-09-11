/**
 * 简化的哈希活动码解码器
 * 直接从32位哈希提取活动ID，无复杂破解流程
 */

export interface HashDecodeResult {
  success: boolean;
  activityId?: number;
  method?: string;
}

/**
 * 从哈希中直接提取活动ID
 * @param hash 32位十六进制哈希
 * @returns 活动ID
 */
export const extractActivityIdFromHash = (hash: string): HashDecodeResult => {
  console.log('🔍 [HashDecoder] 从哈希提取活动ID:', hash);
  
  // 验证哈希格式
  if (!/^[a-f0-9]{32}$/.test(hash)) {
    return { success: false };
  }
  
  try {
    // 核心算法：取前8位哈希，转十进制后取模25
    const front8 = hash.substring(0, 8);
    const decimal = parseInt(front8, 16);
    const activityId = decimal % 25;
    
    console.log('🧮 [HashDecoder] 计算过程:', {
      hash8: front8,
      decimal: decimal,
      activityId: activityId,
      formula: `${decimal} % 25 = ${activityId}`
    });
    
    // 确保活动ID在合理范围内
    if (activityId >= 1 && activityId <= 1000) {
      console.log('✅ [HashDecoder] 提取活动ID成功:', activityId);
      return {
        success: true,
        activityId: activityId,
        method: 'modulo25'
      };
    } else {
      console.log('❌ [HashDecoder] 活动ID超出合理范围:', activityId);
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ [HashDecoder] 提取过程异常:', error);
    return { success: false };
  }
};

/**
 * 验证哈希格式是否为活动码
 * @param data 扫描数据
 * @returns 是否为32位哈希
 */
export const isActivityHash = (data: string): boolean => {
  return /^[a-f0-9]{32}$/.test(data);
};