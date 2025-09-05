// Volunteer API Service - Web Version
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
      
      const shouldRetry = !error.message.includes('AbortError') && i < maxRetries - 1;
      
      if (!shouldRetry) {
        throw error;
      }
      
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

interface VolunteerRecord {
  id: number;
  userId: number;
  startTime: string;
  endTime?: string | null;
  type: number; // 1-正常记录
  legalName: string;
}

interface VolunteerHour {
  userId: number;
  totalMinutes: number;
  legalName: string;
}

interface UserHourStat {
  userId: number;
  totalMinutes: number;
  legalName: string;
}

// 志愿者签到/签退
export const volunteerSignRecord = async (
  userId: number,
  type: 1 | 2, // 1-签到 2-签退
  operateUserId: number,
  operateLegalName: string,
  startTime?: string,
  endTime?: string,
  recordId?: number
): Promise<ApiResponse> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    console.log('🚀 志愿者签到/签退请求:', {
      userId,
      type,
      operateUserId,
      operateLegalName,
      startTime,
      endTime,
      recordId
    });

    const formData = new URLSearchParams();
    formData.append('userId', userId.toString());
    formData.append('type', type.toString());
    formData.append('operateUserId', operateUserId.toString());
    formData.append('operateLegalName', operateLegalName);
    
    if (type === 1 && startTime) {
      // 签到
      formData.append('startTime', startTime);
    } else if (type === 2 && endTime && recordId) {
      // 签退
      formData.append('endTime', endTime);
      formData.append('id', recordId.toString());
    }

    const response = await fetchWithRetry(`${BASE_URL}/app/hour/signRecord`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    console.log('✅ 志愿者签到/签退响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 志愿者签到/签退失败:', error);
    throw error;
  }
};

// 获取志愿者最后一次签到记录
export const getLastVolunteerRecord = async (userId: number): Promise<ApiResponse<VolunteerRecord[]>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const params = new URLSearchParams({
      userId: userId.toString(),
    });

    const response = await fetchWithRetry(`${BASE_URL}/app/hour/lastRecordList?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 志愿者最后记录响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取志愿者最后记录失败:', error);
    throw error;
  }
};

// 获取志愿者打卡记录列表
export const getVolunteerRecordList = async (userId?: number): Promise<ApiResponse<VolunteerRecord[]>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const params = new URLSearchParams();
    if (userId) {
      params.append('userId', userId.toString());
    }

    const url = `${BASE_URL}/app/hour/recordList${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 志愿者记录列表响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取志愿者记录列表失败:', error);
    throw error;
  }
};

// 获取志愿者工时统计
export const getVolunteerHourList = async (): Promise<ApiResponse<VolunteerHour[]>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const response = await fetchWithRetry(`${BASE_URL}/app/hour/hourList`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 志愿者工时统计响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取志愿者工时统计失败:', error);
    throw error;
  }
};

// 获取个人工时统计
export const getUserHourStat = async (userId: number): Promise<ApiResponse<UserHourStat>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('未找到有效的token');
    }

    const params = new URLSearchParams({
      userId: userId.toString(),
    });

    const response = await fetchWithRetry(`${BASE_URL}/app/hour/userHour?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 个人工时统计响应:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取个人工时统计失败:', error);
    throw error;
  }
};

export type { VolunteerRecord, VolunteerHour, UserHourStat };