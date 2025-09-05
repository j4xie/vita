// PomeloX Backend API Service - Web Version
import { getCurrentToken } from './authAPI';

const BASE_URL = 'https://www.vitaglobal.icu';

// Web版本的网络重试工具
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries: number = 2): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error: any) {
      console.warn(`⚠️ 第${i + 1}次请求失败:`, error.message);
      
      // 基本重试逻辑：非中止错误且未达到最大重试次数
      const shouldRetry = !error.message.includes('AbortError') && i < maxRetries - 1;
      
      if (!shouldRetry) {
        throw error;
      }
      
      // 简单的重试延迟
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  throw new Error('网络请求失败');
};

interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
  rows?: T[];
  total?: number;
}

interface RegisterData {
  userName: string;
  legalName: string;
  nickName: string;
  password: string;
  phonenumber?: string;
  email?: string;
  sex: number;
  deptId?: number;
  verCode?: string;
  bizId?: string;
  invCode?: string;
  orgId?: number;
}

interface LoginData {
  username: string;
  password: string;
}

interface Activity {
  id: number;
  activityName: string;
  description?: string;
  activityTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  signStatus?: number; // 0-未报名 -1-已报名未签到 1-已报名已签到
  type?: number; // -1-即将开始 1-已开始 2-已结束
  image?: string;
  organization?: string;
}

interface User {
  id: number;
  userName: string;
  legalName: string;
  nickName: string;
  email?: string;
  phonenumber?: string;
  sex: number;
  deptId: number;
  roles?: Array<{
    key: string;
    roleName: string;
  }>;
  role?: {
    roleKey: string;
  };
}

interface Department {
  deptId: number;
  deptName: string;
  parentId?: number;
  children?: Department[];
}

// 用户注册
export const registerUser = async (userData: RegisterData): Promise<ApiResponse> => {
  try {
    console.log('🚀 注册请求数据:', userData);

    const formData = new URLSearchParams();
    formData.append('userName', userData.userName);
    formData.append('legalName', userData.legalName);
    formData.append('nickName', userData.nickName);
    formData.append('password', userData.password);
    formData.append('sex', userData.sex.toString());
    
    if (userData.phonenumber) formData.append('phonenumber', userData.phonenumber);
    if (userData.email) formData.append('email', userData.email);
    if (userData.deptId) formData.append('deptId', userData.deptId.toString());
    if (userData.verCode) formData.append('verCode', userData.verCode);
    if (userData.bizId) formData.append('bizId', userData.bizId);
    if (userData.invCode) formData.append('invCode', userData.invCode);
    if (userData.orgId) formData.append('orgId', userData.orgId.toString());

    const response = await fetchWithRetry(`${BASE_URL}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    console.log('✅ 注册响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 注册请求失败:', error);
    throw error;
  }
};

// 用户登录
export const loginUser = async (loginData: LoginData): Promise<ApiResponse> => {
  try {
    console.log('🚀 登录请求数据:', { username: loginData.username });

    const formData = new URLSearchParams();
    formData.append('username', loginData.username);
    formData.append('password', loginData.password);

    const response = await fetchWithRetry(`${BASE_URL}/app/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    console.log('✅ 登录响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 登录请求失败:', error);
    throw error;
  }
};

// 获取用户信息
export const getUserInfo = async (): Promise<ApiResponse<User>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const response = await fetchWithRetry(`${BASE_URL}/app/user/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 用户信息响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error);
    throw error;
  }
};

// 获取活动列表
export const getActivityList = async (pageNum: number = 1, pageSize: number = 10, userId?: number): Promise<ApiResponse<Activity[]>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const params = new URLSearchParams({
      pageNum: pageNum.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (userId) {
      params.append('userId', userId.toString());
    }

    const response = await fetchWithRetry(`${BASE_URL}/app/activity/list?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 活动列表响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取活动列表失败:', error);
    throw error;
  }
};

// 活动报名
export const enrollActivity = async (activityId: number, userId: number): Promise<ApiResponse> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const params = new URLSearchParams({
      activityId: activityId.toString(),
      userId: userId.toString(),
    });

    const response = await fetchWithRetry(`${BASE_URL}/app/activity/enroll?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 活动报名响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 活动报名失败:', error);
    throw error;
  }
};

// 活动签到
export const signInActivity = async (activityId: number, userId: number): Promise<ApiResponse> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const params = new URLSearchParams({
      activityId: activityId.toString(),
      userId: userId.toString(),
    });

    const response = await fetchWithRetry(`${BASE_URL}/app/activity/signIn?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 活动签到响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 活动签到失败:', error);
    throw error;
  }
};

// 获取用户相关活动
export const getUserActivityList = async (userId: number, signStatus?: -1 | 1): Promise<ApiResponse<Activity[]>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const params = new URLSearchParams({
      userId: userId.toString(),
    });
    
    if (signStatus !== undefined) {
      params.append('signStatus', signStatus.toString());
    }

    const response = await fetchWithRetry(`${BASE_URL}/app/activity/userActivitylist?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 用户活动列表响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取用户活动列表失败:', error);
    throw error;
  }
};

// 获取学校列表
export const getDepartmentList = async (): Promise<ApiResponse<Department[]>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const response = await fetchWithRetry(`${BASE_URL}/app/dept/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 学校列表响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取学校列表失败:', error);
    throw error;
  }
};

// 获取短信验证码
export const getSMSVerificationCode = async (phoneNum: string): Promise<ApiResponse> => {
  try {
    console.log('🚀 获取验证码请求:', { phoneNum });

    const params = new URLSearchParams({
      phoneNum: phoneNum,
    });

    const response = await fetchWithRetry(`${BASE_URL}/sms/vercodeSms?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 获取验证码响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取验证码失败:', error);
    throw error;
  }
};

export type { Activity, User, Department, ApiResponse, RegisterData, LoginData };