/**
 * 认证相关API服务
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIResponse } from '../types/registration';

// API基础URL配置
const BASE_URL = 'http://106.14.165.234:8085';

// 存储键名
const STORAGE_KEYS = {
  TOKEN: '@pomelox_token',
  USER_ID: '@pomelox_user_id',
  USER_INFO: '@pomelox_user_info',
} as const;

// 登录请求参数
export interface LoginRequest {
  username?: string;
  userName?: string;
  email?: string;
  password: string;
}

// 登录响应数据
export interface LoginResponse {
  userId: number;
  token: string;
}

// 用户信息
export interface UserInfo {
  userId: number;
  deptId: number;
  legalName: string;
  userName: string;
  nickName: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  status: string;
  loginDate: string;
  dept: {
    deptId: number;
    deptName: string;
    parentId: number;
    ancestors: string;
    orderNum: number;
    status: string;
  };
  roles: Array<{
    roleId: number;
    roleName: string;
    roleKey: string;
    admin: boolean;
  }>;
}

/**
 * 用户登录
 * @param credentials 登录凭据
 * @returns 登录结果
 */
export const login = async (credentials: LoginRequest): Promise<APIResponse<LoginResponse>> => {
  try {
    // 构建form-data格式的请求体
    const formData = new URLSearchParams();
    Object.entries(credentials).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(`${BASE_URL}/app/login`, {
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
    
    // 如果登录成功，保存token和用户信息
    if (data.code === 200 && data.data) {
      await saveUserSession(data.data);
      console.log('✅ 登录成功，已保存token和userId:', {
        userId: data.data.userId,
        tokenPreview: data.data.token.substring(0, 20) + '...'
      });
    }
    
    return data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

/**
 * 获取用户信息
 * @param token 用户token
 * @param userId 用户ID（可选，如果不提供会尝试从存储获取）
 * @returns 用户信息
 */
export const getUserInfo = async (token?: string, userId?: number): Promise<APIResponse<UserInfo>> => {
  try {
    const authToken = token || await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    let targetUserId = userId;
    
    if (!authToken) {
      throw new Error('No token available');
    }

    // 如果没有提供userId，尝试从存储获取
    if (!targetUserId) {
      const storedUserId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      if (storedUserId) {
        targetUserId = parseInt(storedUserId, 10);
      }
    }

    // 构建URL，根据截图，需要userId参数
    const url = targetUserId 
      ? `${BASE_URL}/app/user/info?userId=${targetUserId}`
      : `${BASE_URL}/app/user/info`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      // 如果token无效，清除本地存储
      if (response.status === 401) {
        await clearUserSession();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 保存用户信息到本地
    if (data.code === 200 && data.data) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(data.data));
    }
    
    return data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

/**
 * 保存用户会话信息
 * @param loginData 登录返回的数据
 */
export const saveUserSession = async (loginData: LoginResponse): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, loginData.token),
      AsyncStorage.setItem(STORAGE_KEYS.USER_ID, loginData.userId.toString()),
    ]);
  } catch (error) {
    console.error('保存用户会话失败:', error);
    throw error;
  }
};

/**
 * 清除用户会话信息
 */
export const clearUserSession = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO),
    ]);
  } catch (error) {
    console.error('清除用户会话失败:', error);
    throw error;
  }
};

/**
 * 检查用户是否已登录
 * @returns 是否已登录
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    return !!token;
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return false;
  }
};

/**
 * 获取当前token
 * @returns token字符串
 */
export const getCurrentToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('获取token失败:', error);
    return null;
  }
};

/**
 * 获取当前用户ID
 * @returns 用户ID
 */
export const getCurrentUserId = async (): Promise<number | null> => {
  try {
    const userIdStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    return userIdStr ? parseInt(userIdStr, 10) : null;
  } catch (error) {
    console.error('获取用户ID失败:', error);
    return null;
  }
};

/**
 * 获取本地存储的用户信息
 * @returns 用户信息
 */
export const getStoredUserInfo = async (): Promise<UserInfo | null> => {
  try {
    const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  } catch (error) {
    console.error('获取本地用户信息失败:', error);
    return null;
  }
};

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  try {
    await clearUserSession();
  } catch (error) {
    console.error('登出失败:', error);
    throw error;
  }
};