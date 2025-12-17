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

    // 根据API文档，只需要传递file参数
    formData.append('file', imageFile);

    // ✅ 根据接口文档.html，发现了正确的文件上传接口：/file/upload
    // API规范：
    // - URL: /file/upload
    // - 方法: POST
    // - 参数: multipart/form-data 包含 file (MultipartFile)
    // - 返回: {code: 200, data: {url: "文件URL"}}

    const response = await fetch(`${getApiUrl()}/file/upload`, {
      method: 'POST',
      body: formData,
      // 不要手动设置Content-Type，让浏览器自动设置multipart/form-data的boundary
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
 * 通用媒体上传 (支持图片和视频)
 * @param fileUri 文件URI
 * @param type 文件类型 ('image' | 'video')
 * @returns 上传结果
 */
export const uploadMedia = async (fileUri: string, type: 'image' | 'video' = 'image'): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    const extension = type === 'video' ? 'mp4' : 'jpg';
    const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';
    const fileName = `uploads/${type}_${Date.now()}.${extension}`;

    const file = {
      uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
      type: mimeType,
      name: fileName,
    } as any;

    formData.append('file', file);

    const response = await fetch(`${getApiUrl()}/file/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.code === 200) {
      return {
        success: true,
        url: result.data.url, // 根据文档，返回结构应该是 {code: 200, data: {url: "..."}}
      };
    } else {
      return {
        success: false,
        error: result.msg || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('Media upload error:', error);
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