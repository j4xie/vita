/**
 * 志愿者工时管理API服务
 */

import { getCurrentToken } from './authAPI';

const BASE_URL = 'http://106.14.165.234:8085';

// 志愿者打卡记录类型
export interface VolunteerRecord {
  id: number;
  userId: number;
  startTime: string;
  endTime: string;
  type: number; // 1-正常记录
  operateUserId?: number;
  operateLegalName?: string;
  legalName: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

// 志愿者工时统计类型
export interface VolunteerHours {
  userId: number;
  totalMinutes: number;
  legalName: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

// API响应类型
interface APIResponse<T = any> {
  total?: number;
  rows?: T[];
  code: number;
  msg: string;
  data?: T;
}

/**
 * 获取志愿者打卡记录列表
 * @param filters 过滤参数
 * @returns 打卡记录列表
 */
export const getVolunteerRecords = async (filters?: {
  deptId?: number;
  userId?: number;
}): Promise<APIResponse<VolunteerRecord[]>> => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('用户未登录');
    }

    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (filters?.deptId) {
      queryParams.append('deptId', filters.deptId.toString());
    }
    if (filters?.userId) {
      queryParams.append('userId', filters.userId.toString());
    }

    const url = `${BASE_URL}/app/hour/recordList${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 如果权限不足，返回空列表而不是抛出异常
    if (data.code === 403) {
      console.warn('当前用户无志愿者管理权限');
      return {
        code: 200,
        msg: '无权限',
        total: 0,
        rows: []
      };
    }
    
    return data;
  } catch (error) {
    console.error('获取志愿者记录失败:', error);
    // 返回空列表作为降级处理
    return {
      code: 200,
      msg: '获取失败',
      total: 0,
      rows: []
    };
  }
};

/**
 * 获取志愿者工时统计
 * @param filters 过滤参数
 * @returns 工时统计列表
 */
export const getVolunteerHours = async (filters?: {
  deptId?: number;
  userId?: number;
}): Promise<APIResponse<VolunteerHours[]>> => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('用户未登录');
    }

    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (filters?.deptId) {
      queryParams.append('deptId', filters.deptId.toString());
    }
    if (filters?.userId) {
      queryParams.append('userId', filters.userId.toString());
    }

    const url = `${BASE_URL}/app/hour/hourList${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 权限检查和降级处理
    if (data.code === 403 || data.code === 401) {
      console.warn('当前用户无志愿者管理权限');
      return {
        code: 200,
        msg: '无权限',
        total: 0,
        rows: []
      };
    }
    
    return data;
  } catch (error) {
    console.error('获取志愿者工时失败:', error);
    return {
      code: 200,
      msg: '获取失败',
      total: 0,
      rows: []
    };
  }
};

/**
 * 志愿者签到/签退 - 严格按照接口文档第12条
 * 签到(type=1): userId + type + startTime
 * 签退(type=2): userId + type + endTime + id(记录ID)
 */
export const volunteerSignRecord = async (
  userId: number,
  type: 1 | 2,
  operateUserId?: number,  // 操作用户ID  
  operateLegalName?: string, // 操作用户姓名
  startTime?: string,  // 签到时需要
  endTime?: string,    // 签退时需要
  recordId?: number,   // 签退时需要
): Promise<APIResponse> => {
  try {
    const token = await getCurrentToken();
    
    console.log('🔍 [TOKEN-CHECK] Token获取结果:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token ? token.substring(0, 20) : 'null',
      timestamp: new Date().toISOString()
    });
    
    if (!token) {
      console.error('[AUTH-ERROR] 志愿者签到权限检查: 用户未登录');
      throw new Error('用户未登录');
    }
    
    console.log('[AUTH] 志愿者API调用:', {
      targetUserId: userId,
      operationType: type === 1 ? '签到' : '签退',
      hasStartTime: !!startTime,
      hasEndTime: !!endTime,
      hasRecordId: !!recordId
    });

    // 根据接口文档第12条构建请求体 - 只包含必需参数
    const form = new URLSearchParams();
    form.append('userId', String(userId));
    form.append('type', String(type));
    
    // 添加操作用户信息
    if (operateUserId) form.append('operateUserId', String(operateUserId));
    if (operateLegalName) form.append('operateLegalName', operateLegalName);
    
    // 签到(type=1)需要 startTime
    if (type === 1 && startTime) {
      form.append('startTime', startTime);
    }
    
    // 签退(type=2)需要 endTime 和 id(记录ID)
    if (type === 2) {
      if (endTime) form.append('endTime', endTime);
      if (recordId) form.append('id', String(recordId));
    }

    console.log('[API-REQUEST] 志愿者签到/签退 API 请求:', {
      url: `${BASE_URL}/app/hour/signRecord`,
      method: 'POST',
      body: form.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      },
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`${BASE_URL}/app/hour/signRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: form.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🚨 [API-ERROR] 志愿者${type === 1 ? '签到' : '签退'}API请求失败:`, {
        operation: type === 1 ? '签到' : '签退',
        userId: userId,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        responseBody: errorText,
        requestParams: form.toString(),
        isPermissionError: response.status === 403 || response.status === 401,
        tokenValid: !!token && token.length > 10
      });
      
      if (response.status === 403) {
        throw new Error('无权限执行此操作，需要管理员权限');
      } else if (response.status === 401) {
        throw new Error('认证失效，请重新登录');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // 后端可能返回空响应体，做兼容
    const text = await response.text();
    const data = text ? JSON.parse(text) : { code: 200, msg: 'OK' };
    
    console.log('[API-RESPONSE] 志愿者签到/签退 API 响应:', {
      status: response.status,
      data: data,
      timestamp: new Date().toISOString()
    });
    
    return data;
  } catch (error) {
    console.error('[VOLUNTEER-ERROR] 志愿者签到/签退失败:', {
      error: error instanceof Error ? error.message : error,
      userId,
      type: type === 1 ? '签到' : '签退',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * 获取志愿者最后记录，增强错误处理和fallback机制
 */
export const getLastVolunteerRecord = async (userId: number): Promise<APIResponse<VolunteerRecord>> => {
  const token = await getCurrentToken();
  if (!token) {
    return { code: 401, msg: '用户未登录' };
  }

  try {
    // 第一步：尝试使用lastRecordList接口
    const response = await fetch(`${BASE_URL}/app/hour/lastRecordList?userId=${userId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      
      // 检查API返回的业务状态码
      if (result.code === 200) {
        console.log(`✅ [lastRecordList] 用户${userId}记录获取成功:`, result.data);
        return result;
      } else if (result.code === 500) {
        console.warn(`⚠️ [lastRecordList] 后端返回500，使用fallback方案`);
        // fallback到recordList接口
        return await getLastRecordFromRecordList(userId);
      } else {
        console.warn(`⚠️ [lastRecordList] 后端返回错误码${result.code}:`, result.msg);
        return result;
      }
    } else {
      console.warn(`⚠️ [lastRecordList] HTTP错误${response.status}，使用fallback方案`);
      return await getLastRecordFromRecordList(userId);
    }
  } catch (error) {
    console.error(`🚨 [lastRecordList] 网络错误，使用fallback方案:`, error);
    return await getLastRecordFromRecordList(userId);
  }
};

/**
 * Fallback方案：从recordList获取最后一条记录
 */
const getLastRecordFromRecordList = async (userId: number): Promise<APIResponse<VolunteerRecord>> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      return { code: 401, msg: '用户未登录' };
    }

    const response = await fetch(`${BASE_URL}/app/hour/recordList?userId=${userId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 200 && result.rows && result.rows.length > 0) {
        // 获取最后一条记录（按ID排序）
        const sortedRecords = result.rows.sort((a: any, b: any) => b.id - a.id);
        const lastRecord = sortedRecords[0];
        
        console.log(`✅ [recordList-fallback] 用户${userId}最新记录:`, lastRecord);
        return {
          code: 200,
          msg: '操作成功',
          data: lastRecord
        };
      } else {
        return { code: 404, msg: '无签到记录' };
      }
    } else {
      return { code: response.status, msg: 'recordList调用失败' };
    }
  } catch (error) {
    console.error(`🚨 [recordList-fallback] 获取记录失败:`, error);
    return { code: 500, msg: 'Fallback方案也失败' };
  }
};

/**
 * 搜索志愿者（通过手机号）
 * @param phoneNumber 手机号
 * @returns 用户信息
 */
export const searchVolunteerByPhone = async (phoneNumber: string): Promise<APIResponse<any>> => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('用户未登录');
    }

    // 这个接口可能需要根据实际后端接口调整
    const response = await fetch(`${BASE_URL}/app/user/searchByPhone?phone=${phoneNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('搜索志愿者失败:', error);
    throw error;
  }
};

/**
 * 计算工时（分钟转换为小时）
 * @param minutes 分钟数
 * @returns 格式化的工时字符串
 */
export const formatVolunteerHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return remainingMinutes > 0 
      ? `${hours}小时${remainingMinutes}分钟`
      : `${hours}小时`;
  } else {
    return `${remainingMinutes}分钟`;
  }
};

/**
 * 判断用户当前签到状态
 * @param lastRecord 最后一条记录
 * @returns 当前状态
 */
export const getVolunteerStatus = (lastRecord: VolunteerRecord | null): 'not_signed_in' | 'signed_in' | 'signed_out' => {
  if (!lastRecord) {
    return 'not_signed_in';
  }
  
  // 如果有结束时间，说明已签退
  if (lastRecord.endTime) {
    return 'signed_out';
  }
  
  // 如果只有开始时间，说明已签到但未签退
  if (lastRecord.startTime) {
    return 'signed_in';
  }
  
  return 'not_signed_in';
};

/**
 * 获取学校的志愿者统计数据
 * @param deptId 学校ID
 * @returns 学校志愿者统计
 */
export const getSchoolVolunteerStats = async (deptId?: number): Promise<{
  totalVolunteers: number;
  activeVolunteers: number;
  totalHours: number;
}> => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      return { totalVolunteers: 0, activeVolunteers: 0, totalHours: 0 };
    }

    // 获取志愿者工时数据，根据学校ID过滤
    const filters = deptId ? { deptId } : {};
    const hoursResult = await getVolunteerHours(filters);
    
    if (hoursResult.code === 200 && hoursResult.rows) {
      const volunteers = hoursResult.rows;
      return {
        totalVolunteers: volunteers.length,
        activeVolunteers: volunteers.filter(v => v.totalMinutes > 0).length,
        totalHours: Math.round(volunteers.reduce((sum, v) => sum + v.totalMinutes, 0) / 60),
      };
    }
    
    return { totalVolunteers: 0, activeVolunteers: 0, totalHours: 0 };
  } catch (error) {
    console.error('获取学校志愿者统计失败:', error);
    return { totalVolunteers: 0, activeVolunteers: 0, totalHours: 0 };
  }
};