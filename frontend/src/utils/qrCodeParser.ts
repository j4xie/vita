import { UserIdentityData } from '../types/userIdentity';

export interface ParsedQRResult {
  success: boolean;
  type?: 'user' | 'activity' | 'referral' | 'merchant' | 'unknown';
  data?: any;
  error?: string;
}

/**
 * Parse Base64 encoded user identity QR code
 */
export const parseBase64UserQR = (content: string): ParsedQRResult => {
  try {
    if (!content.startsWith('VG_USER_BASE64_')) {
      return { success: false, error: 'Invalid Base64 user QR format' };
    }

    const base64Data = content.replace('VG_USER_BASE64_', '');
    const jsonStr = atob(base64Data);
    const userData = JSON.parse(jsonStr) as UserIdentityData;

    return {
      success: true,
      type: 'user',
      data: userData
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse Base64 user data'
    };
  }
};

/**
 * Parse hash format user identity QR code
 */
export const parseHashUserQR = (content: string): ParsedQRResult => {
  try {
    if (!content.startsWith('VG_USER_HASH_')) {
      return { success: false, error: 'Invalid hash user QR format' };
    }

    const parts = content.split('_');
    if (parts.length < 5) {
      return { success: false, error: 'Invalid hash format structure' };
    }

    const userId = parts[3];
    const hash = parts[4];

    return {
      success: true,
      type: 'user',
      data: { userId, hash, needsFetch: true }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse hash user data'
    };
  }
};

/**
 * Parse activity QR code
 */
export const parseActivityQR = (content: string): ParsedQRResult => {
  try {
    if (!content.startsWith('VITAGLOBAL_ACTIVITY_')) {
      return { success: false, error: 'Not an activity QR code' };
    }

    const activityId = content.replace('VITAGLOBAL_ACTIVITY_', '');
    if (!activityId || activityId.length === 0) {
      return { success: false, error: 'Invalid activity ID' };
    }

    return {
      success: true,
      type: 'activity',
      data: { activityId }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse activity QR'
    };
  }
};

/**
 * Parse referral code (can be QR or manual input)
 */
export const parseReferralCode = (content: string): ParsedQRResult => {
  try {
    // Handle QR format
    if (content.startsWith('VITAGLOBAL_REFERRAL_')) {
      const code = content.replace('VITAGLOBAL_REFERRAL_', '');
      return {
        success: true,
        type: 'referral',
        data: { referralCode: code }
      };
    }

    // Handle direct referral code (6-16 alphanumeric)
    if (/^[A-Za-z0-9]{6,16}$/.test(content)) {
      return {
        success: true,
        type: 'referral',
        data: { referralCode: content }
      };
    }

    return {
      success: false,
      error: 'Invalid referral code format'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse referral code'
    };
  }
};

/**
 * Parse merchant QR code
 */
export const parseMerchantQR = (content: string): ParsedQRResult => {
  try {
    // Try to parse as JSON first (merchant QR might be JSON)
    const merchantData = JSON.parse(content);
    if (merchantData.merchantId) {
      return {
        success: true,
        type: 'merchant',
        data: merchantData
      };
    }

    return {
      success: false,
      error: 'Invalid merchant QR format'
    };
  } catch (error) {
    // Not JSON format
    if (content.includes('merchant') || content.includes('MERCHANT')) {
      return {
        success: true,
        type: 'merchant',
        data: { rawContent: content }
      };
    }

    return {
      success: false,
      error: 'Not a merchant QR code'
    };
  }
};

/**
 * Main QR code parser - determines type and parses accordingly
 */
export const parseQRCode = (content: string): ParsedQRResult => {
  if (!content || content.trim() === '') {
    return { success: false, error: 'Empty QR content' };
  }

  // Check for user identity formats
  if (content.startsWith('VG_USER_BASE64_')) {
    return parseBase64UserQR(content);
  }

  if (content.startsWith('VG_USER_HASH_')) {
    return parseHashUserQR(content);
  }

  // Check for activity format
  if (content.startsWith('VITAGLOBAL_ACTIVITY_')) {
    return parseActivityQR(content);
  }

  // Check for referral format
  if (content.startsWith('VITAGLOBAL_REFERRAL_') || /^[A-Za-z0-9]{6,16}$/.test(content)) {
    return parseReferralCode(content);
  }

  // Try merchant format
  const merchantResult = parseMerchantQR(content);
  if (merchantResult.success) {
    return merchantResult;
  }

  // Unknown format
  return {
    success: false,
    type: 'unknown',
    error: 'Unknown QR code format'
  };
};

/**
 * Validate if content is a valid QR code we can handle
 */
export const isValidQRCode = (content: string): boolean => {
  const result = parseQRCode(content);
  return result.success && result.type !== 'unknown';
};

/**
 * Get QR code type without full parsing
 */
export const getQRCodeType = (content: string): string => {
  if (content.startsWith('VG_USER_')) return 'user';
  if (content.startsWith('VITAGLOBAL_ACTIVITY_')) return 'activity';
  if (content.startsWith('VITAGLOBAL_REFERRAL_')) return 'referral';
  if (/^[A-Za-z0-9]{6,16}$/.test(content)) return 'referral';
  
  try {
    const data = JSON.parse(content);
    if (data.merchantId) return 'merchant';
  } catch {}
  
  return 'unknown';
};