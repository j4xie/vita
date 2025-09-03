import { Platform } from 'react-native';

// Cloudflare R2配置 - 从环境变量获取
const R2_CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_R2_ENDPOINT || 'https://your-account-id.r2.cloudflarestorage.com',
  accessKeyId: process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY || '',
  bucket: process.env.EXPO_PUBLIC_R2_BUCKET_NAME || 'pomeloX-images',
  region: 'auto',
};

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 上传头像到Cloudflare R2
 * @param imageUri 本地图片URI
 * @param userId 用户ID
 * @returns 上传结果和图片URL
 */
export const uploadAvatar = async (imageUri: string, userId: number): Promise<UploadResult> => {
  try {
    // 创建FormData用于文件上传
    const formData = new FormData();
    
    // 生成唯一文件名
    const fileName = `avatars/user_${userId}_${Date.now()}.jpg`;
    
    // 根据平台处理图片文件
    const imageFile = {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      type: 'image/jpeg',
      name: fileName,
    } as any;

    formData.append('file', imageFile);
    formData.append('key', fileName);

    // ⚠️ 注意：后端暂无头像上传接口，此API路径为预期接口
    // 需要后端团队实现 /app/upload/avatar 接口，集成Cloudflare R2
    
    // 临时方案：通过后端代理上传
    const response = await fetch('https://www.vitaglobal.icu/app/upload/avatar', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code === 200) {
      return {
        success: true,
        url: result.data.url,
      };
    } else {
      return {
        success: false,
        error: result.msg || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('Avatar upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * 获取用户头像URL
 * @param userId 用户ID
 * @returns 头像URL或null
 */
export const getUserAvatarUrl = (userId: number): string | null => {
  // 构建Cloudflare R2公开访问URL
  const publicUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_URL || 'https://images.pomeloX.app';
  return `${publicUrl}/avatars/user_${userId}.jpg`;
};

/**
 * 检查头像是否存在
 * @param avatarUrl 头像URL
 * @returns 是否存在
 */
export const checkAvatarExists = async (avatarUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(avatarUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};