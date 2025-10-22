/**
 * 管理员API服务
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../utils/environment';

const getBaseUrl = () => getApiUrl();

// 存储键名
const ADMIN_STORAGE_KEYS = {
  ADMIN_TOKEN: '@pomelox_admin_token',
  ADMIN_USER_ID: '@pomelox_admin_user_id',
  ADMIN_USER_INFO: '@pomelox_admin_user_info',
} as const;

// 图形验证码响应
export interface CaptchaResponse {
  msg: string;
  img: string; // base64图片数据
  code: number;
  captchaEnabled: boolean;
  uuid: string;
}

// 管理员登录请求
export interface AdminLoginRequest {
  username: string;
  password: string;
  code: string; // 图形验证码
  uuid: string; // 验证码UUID
}

// 管理员登录响应
export interface AdminLoginResponse {
  token: string;
  userId?: number;
}

// API响应基础类型
interface APIResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
}

/**
 * 获取图形验证码
 * @returns 验证码信息
 */
export const getCaptcha = async (): Promise<CaptchaResponse> => {
  try {
    const response = await fetch(`${getBaseUrl()}/captchaImage`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取验证码失败:', error);
    throw error;
  }
};

/**
 * 管理员登录
 * @param credentials 登录凭据
 * @returns 登录结果
 */
export const adminLogin = async (credentials: AdminLoginRequest): Promise<APIResponse<AdminLoginResponse>> => {
  try {
    // 构建form-data格式（基于用户登录的经验）
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    formData.append('code', credentials.code);
    formData.append('uuid', credentials.uuid);

    const response = await fetch(`${getBaseUrl()}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 如果登录成功，保存管理员token
    if (data.code === 200 && data.token) {
      await saveAdminSession({
        token: data.token,
        userId: data.userId
      });
      console.log('✅ 管理员登录成功，已保存token');
    }
    
    return data;
  } catch (error) {
    console.error('管理员登录失败:', error);
    throw error;
  }
};


/**
 * 查询邀请码信息
 * @returns 邀请码信息
 */
export const getInvitationInfo = async (): Promise<APIResponse<any>> => {
  try {
    const token = await getAdminToken();
    
    if (!token) {
      throw new Error('管理员未登录');
    }

    // 使用form-data格式
    const response = await fetch(`${getBaseUrl()}/app/invitation/invInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: '', // 空body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('查询邀请码失败:', error);
    throw error;
  }
};

/**
 * 生成新邀请码
 * @returns 生成结果
 */
export const generateInvitationCode = async (): Promise<APIResponse> => {
  try {
    const token = await getAdminToken();
    
    if (!token) {
      throw new Error('管理员未登录');
    }

    const response = await fetch(`${getBaseUrl()}/app/invitation/addInv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: '', // 空body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('生成邀请码失败:', error);
    throw error;
  }
};

/**
 * 重新生成邀请码
 * @returns 重置结果
 */
export const resetInvitationCode = async (): Promise<APIResponse> => {
  try {
    const token = await getAdminToken();
    
    if (!token) {
      throw new Error('管理员未登录');
    }

    const response = await fetch(`${getBaseUrl()}/app/invitation/resetInv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: '', // 空body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('重置邀请码失败:', error);
    throw error;
  }
};

// 管理员会话管理
export const saveAdminSession = async (sessionData: AdminLoginResponse): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(ADMIN_STORAGE_KEYS.ADMIN_TOKEN, sessionData.token),
      sessionData.userId && AsyncStorage.setItem(ADMIN_STORAGE_KEYS.ADMIN_USER_ID, sessionData.userId.toString()),
    ]);
  } catch (error) {
    console.error('保存管理员会话失败:', error);
    throw error;
  }
};

export const getAdminToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ADMIN_STORAGE_KEYS.ADMIN_TOKEN);
  } catch (error) {
    console.error('获取管理员token失败:', error);
    return null;
  }
};

export const clearAdminSession = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.ADMIN_TOKEN),
      AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.ADMIN_USER_ID),
      AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.ADMIN_USER_INFO),
    ]);
  } catch (error) {
    console.error('清除管理员会话失败:', error);
    throw error;
  }
};

export const isAdminLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await getAdminToken();
    return !!token;
  } catch (error) {
    console.error('检查管理员登录状态失败:', error);
    return false;
  }
};