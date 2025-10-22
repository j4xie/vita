import { Platform } from 'react-native';
import { getApiUrl } from '../utils/environment';

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
    console.log('🚀 [Upload] Starting avatar upload:', { imageUri, userId });

    // 创建FormData用于文件上传
    const formData = new FormData();

    // ✅ 修复：React Native文件上传正确格式
    // - 保留完整URI（包括file://前缀）
    // - 使用简单文件名（不包含路径）
    // - type必须精确匹配MIME类型
    const imageFile = {
      uri: imageUri,  // ✅ 保持完整URI，React Native需要file://前缀
      type: 'image/jpeg',  // MIME类型
      name: 'avatar.jpg',  // ✅ 简单文件名，后端会处理路径
    } as any;

    console.log('📦 [Upload] FormData file object:', imageFile);

    // 根据API文档，只需要传递file参数
    formData.append('file', imageFile);

    // ✅ 根据接口文档.html，发现了正确的文件上传接口：/file/upload
    // API规范：
    // - URL: /file/upload
    // - 方法: POST
    // - 参数: multipart/form-data 包含 file (MultipartFile)
    // - 返回: {code: 200, data: {url: "文件URL"}}

    const apiUrl = `${getApiUrl()}/file/upload`;
    console.log('🌐 [Upload] Uploading to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      // ⚠️ 重要：不要手动设置Content-Type
      // React Native会自动设置正确的multipart/form-data boundary
    });

    console.log('📡 [Upload] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Upload] HTTP error:', { status: response.status, body: errorText });
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [Upload] API response:', result);

    if (result.code === 200 && result.data?.url) {
      console.log('🎉 [Upload] Upload successful! URL:', result.data.url);
      return {
        success: true,
        url: result.data.url,
      };
    } else {
      console.error('❌ [Upload] API returned error:', result);
      return {
        success: false,
        error: result.msg || 'Upload failed - no URL returned',
      };
    }
  } catch (error) {
    console.error('💥 [Upload] Exception during upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed with unknown error',
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