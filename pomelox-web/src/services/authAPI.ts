// Authentication API Service - Web Version
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';

// Web版本的存储服务
class WebStorage {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('存储失败:', error);
      throw error;
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('读取失败:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('清空失败:', error);
    }
  }
}

// 存储token
export const storeToken = async (token: string): Promise<void> => {
  try {
    await WebStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Token存储成功');
  } catch (error) {
    console.error('❌ Token存储失败:', error);
    throw error;
  }
};

// 获取当前token
export const getCurrentToken = async (): Promise<string | null> => {
  try {
    const token = await WebStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ 获取token失败:', error);
    return null;
  }
};

// 删除token
export const removeToken = async (): Promise<void> => {
  try {
    await WebStorage.removeItem(TOKEN_KEY);
    console.log('✅ Token删除成功');
  } catch (error) {
    console.error('❌ Token删除失败:', error);
  }
};

// 存储用户信息
export const storeUserInfo = async (userInfo: any): Promise<void> => {
  try {
    const userInfoString = JSON.stringify(userInfo);
    await WebStorage.setItem(USER_INFO_KEY, userInfoString);
    console.log('✅ 用户信息存储成功');
  } catch (error) {
    console.error('❌ 用户信息存储失败:', error);
    throw error;
  }
};

// 获取用户信息
export const getUserInfo = async (): Promise<any | null> => {
  try {
    const userInfoString = await WebStorage.getItem(USER_INFO_KEY);
    if (userInfoString) {
      return JSON.parse(userInfoString);
    }
    return null;
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error);
    return null;
  }
};

// 删除用户信息
export const removeUserInfo = async (): Promise<void> => {
  try {
    await WebStorage.removeItem(USER_INFO_KEY);
    console.log('✅ 用户信息删除成功');
  } catch (error) {
    console.error('❌ 用户信息删除失败:', error);
  }
};

// 检查是否已登录
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await getCurrentToken();
    return !!token;
  } catch (error) {
    console.error('❌ 检查登录状态失败:', error);
    return false;
  }
};

// 清空所有认证数据
export const clearAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      removeToken(),
      removeUserInfo()
    ]);
    console.log('✅ 认证数据清空成功');
  } catch (error) {
    console.error('❌ 清空认证数据失败:', error);
  }
};

// 验证token是否有效
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    // 这里可以添加token验证逻辑
    // 简单检查token格式
    if (!token || token.length < 10) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Token验证失败:', error);
    return false;
  }
};

export { WebStorage };