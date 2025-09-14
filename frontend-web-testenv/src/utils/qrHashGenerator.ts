/**
 * QR码哈希生成工具
 * 为用户身份码提供哈希格式，避免Base64编码兼容性问题
 */

import { UserIdentityData } from '../types/userIdentity';

/**
 * 简单SHA-256哈希实现（适用于React Native环境）
 * @param text 要哈希的文本
 * @returns 8位哈希值
 */
export const simpleHash = async (text: string): Promise<string> => {
  try {
    // 优先使用Web Crypto API（如果可用）
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      
      // 转换为hex字符串并取前8位
      const hashHex = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      return hashHex.substring(0, 8);
    } else {
      // 降级到简单哈希算法
      return fallbackHash(text);
    }
  } catch (error) {
    console.warn('🔐 [QR哈希] Web Crypto API失败，使用降级哈希:', error);
    return fallbackHash(text);
  }
};

/**
 * 降级哈希算法（兼容所有环境）
 * @param text 要哈希的文本
 * @returns 8位哈希值
 */
const fallbackHash = (text: string): string => {
  let hash = 0;
  if (text.length === 0) return '00000000';
  
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // 转换为正数并格式化为8位hex
  const positiveHash = Math.abs(hash);
  return positiveHash.toString(16).padStart(8, '0').substring(0, 8);
};

/**
 * 生成用户身份码哈希
 * @param userData 用户身份数据
 * @returns 哈希格式的QR码字符串
 */
export const generateUserIdentityHash = async (userData: UserIdentityData): Promise<string> => {
  try {
    console.log('🔐 [QR哈希] 开始生成身份码哈希:', userData.userId);
    
    // 验证必要字段
    if (!userData.userId || !userData.userName || !userData.legalName) {
      throw new Error('缺少必要的用户信息');
    }
    
    // 创建时间戳
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
    
    // 创建哈希输入字符串（包含关键但不敏感的信息）
    const hashInput = [
      userData.userId,
      userData.userName,
      userData.legalName.substring(0, 2), // 只用姓名前两个字符
      userData.currentOrganization?.id || '0',
      userData.school?.id || '0',
      timestamp.toString()
    ].join('|');
    
    console.log('📝 [QR哈希] 哈希输入:', hashInput);
    
    // 生成哈希
    const hash = await simpleHash(hashInput);
    
    // 构建最终的QR码格式
    const qrCode = `VG_HASH_${timestamp}_${userData.userId}_${hash}`;
    
    console.log('✅ [QR哈希] 哈希身份码生成成功:', {
      qrCode: qrCode,
      length: qrCode.length,
      userId: userData.userId,
      hash: hash
    });
    
    return qrCode;
    
  } catch (error) {
    console.error('❌ [QR哈希] 生成哈希身份码失败:', error);
    
    // 降级到简单格式
    const timestamp = Math.floor(Date.now() / 1000);
    const fallbackCode = `VG_HASH_${timestamp}_${userData.userId}_${fallbackHash(userData.userId + userData.legalName)}`;
    
    console.log('🔄 [QR哈希] 使用降级格式:', fallbackCode);
    return fallbackCode;
  }
};

/**
 * 解析哈希格式的身份码
 * @param qrCode 扫描到的QR码字符串
 * @returns 解析结果
 */
export const parseHashIdentityQR = (qrCode: string): { 
  isValid: boolean; 
  timestamp?: number; 
  userId?: string; 
  hash?: string; 
  error?: string; 
} => {
  try {
    console.log('🔍 [QR哈希解析] 开始解析哈希身份码:', qrCode);
    
    if (!qrCode || !qrCode.startsWith('VG_HASH_')) {
      return {
        isValid: false,
        error: '不是有效的哈希身份码格式'
      };
    }
    
    // 解析格式: VG_HASH_{timestamp}_{userId}_{hash}
    const parts = qrCode.split('_');
    if (parts.length !== 5 || parts[0] !== 'VG' || parts[1] !== 'HASH') {
      return {
        isValid: false,
        error: '哈希身份码格式错误'
      };
    }
    
    const timestamp = parseInt(parts[2], 10);
    const userId = parts[3];
    const hash = parts[4];
    
    // 验证各部分有效性
    if (isNaN(timestamp) || !userId || !hash || hash.length !== 8) {
      return {
        isValid: false,
        error: '哈希身份码数据无效'
      };
    }
    
    // 检查时间戳是否过期（例如1年）
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 365 * 24 * 60 * 60; // 1年
    if (now - timestamp > maxAge) {
      return {
        isValid: false,
        error: '身份码已过期，请重新生成'
      };
    }
    
    console.log('✅ [QR哈希解析] 哈希身份码解析成功:', {
      timestamp,
      userId,
      hash,
      age: Math.floor((now - timestamp) / 86400) + '天'
    });
    
    return {
      isValid: true,
      timestamp,
      userId,
      hash
    };
    
  } catch (error) {
    console.error('❌ [QR哈希解析] 解析过程异常:', error);
    return {
      isValid: false,
      error: `解析异常: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
};

/**
 * 验证哈希身份码的有效性（本地验证）
 * @param originalData 原始用户数据
 * @param timestamp 时间戳
 * @param receivedHash 收到的哈希值
 * @returns 是否有效
 */
export const validateIdentityHash = async (
  originalData: UserIdentityData, 
  timestamp: number, 
  receivedHash: string
): Promise<boolean> => {
  try {
    // 重新计算哈希
    const hashInput = [
      originalData.userId,
      originalData.userName,
      originalData.legalName.substring(0, 2),
      originalData.currentOrganization?.id || '0',
      originalData.school?.id || '0',
      timestamp.toString()
    ].join('|');
    
    const calculatedHash = await simpleHash(hashInput);
    const isValid = calculatedHash === receivedHash;
    
    console.log('🔐 [QR哈希验证]:', {
      receivedHash,
      calculatedHash,
      isValid,
      hashInput: hashInput.substring(0, 50) + '...'
    });
    
    return isValid;
  } catch (error) {
    console.error('❌ [QR哈希验证] 验证过程失败:', error);
    return false;
  }
};