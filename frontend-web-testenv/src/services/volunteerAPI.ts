/**
 * 志愿者工时管理API服务
 */

import { getCurrentToken } from './authAPI';
import { notifyVolunteerCheckIn, notifyVolunteerCheckOut } from './smartAlertSystem';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://www.vitaglobal.icu';

// 根据API文档第10-13条定义的志愿者打卡记录类型
export interface VolunteerRecord {
  id: number;
  userId: number;
  startTime: string;
  endTime: string | null;
  type: number; // 1-正常记录
  operateUserId?: number;
  operateLegalName?: string;
  legalName: string;
  createBy?: string | null;
  createTime?: string | null;
  updateBy?: string | null;
  updateTime?: string | null;
  remark?: string | null;
}

// 根据API文档第11条定义的志愿者工时统计类型
export interface VolunteerHours {
  userId: number;
  totalMinutes?: number; // API可能不返回此字段，设为可选
  legalName: string;
  createBy?: string | null;
  createTime?: string | null;
  updateBy?: string | null;
  updateTime?: string | null;
  remark?: string | null;
}

// API响应类型
interface APIResponse<T = any> {
  total?: number;
  rows?: T;  // 修复：rows可以是任意类型，不固定为数组
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
  startDate?: string; // 开始日期 YYYY-MM-DD
  endDate?: string;   // 结束日期 YYYY-MM-DD
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
    // 注释：后端API不支持日期过滤，移除startDate和endDate参数
    // if (filters?.startDate) {
    //   queryParams.append('startDate', filters.startDate);
    // }
    // if (filters?.endDate) {
    //   queryParams.append('endDate', filters.endDate);
    // }

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
 * 签到(type=1): userId + type + startTime + operateUserId + operateLegalName
 * 签退(type=2): userId + type + endTime + operateUserId + operateLegalName + id(记录ID)
 */
export const volunteerSignRecord = async (
  userId: number,
  type: 1 | 2,
  operateUserId: number,     // 必需：操作用户ID  
  operateLegalName: string,  // 必需：操作用户姓名
  startTime?: string,        // 签到时需要
  endTime?: string,          // 签退时需要
  recordId?: number,         // 签退时需要
): Promise<APIResponse> => {
  try {
    const token = await getCurrentToken();
    
    // 生产环境简化日志
    if (__DEV__) {
      console.log('🔍 [TOKEN-CHECK] Token获取结果:', {
        hasToken: !!token,
        tokenLength: token?.length,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!token) {
      if (__DEV__) {
        console.warn('[AUTH-INFO] 用户未登录，跳过志愿者操作');
      }
      throw new Error('用户未登录');
    }
    
    // 生产环境简化日志
    if (__DEV__) {
      console.log('[AUTH] 志愿者API调用:', {
        targetUserId: userId,
        operationType: type === 1 ? '签到' : '签退'
      });
    }

    // 根据接口文档第12条构建请求体 - 必需参数优先
    const form = new URLSearchParams();
    form.append('userId', String(userId));
    form.append('type', String(type));
    
    // 操作用户信息 - 必需参数
    form.append('operateUserId', String(operateUserId));
    form.append('operateLegalName', operateLegalName);
    
    // 签到(type=1)需要 startTime
    if (type === 1) {
      if (!startTime) {
        throw new Error('签到操作缺少startTime参数');
      }
      form.append('startTime', startTime);
    }
    
    // 签退(type=2)需要 endTime 和 id(记录ID)
    if (type === 2) {
      if (!endTime) {
        throw new Error('签退操作缺少endTime参数');
      }
      if (!recordId) {
        throw new Error('签退操作缺少记录ID参数');
      }
      form.append('endTime', endTime);
      form.append('id', String(recordId));
    }

    // 生产环境简化请求日志
    if (__DEV__) {
      console.log('[API-REQUEST] 志愿者API请求:', {
        url: `${BASE_URL}/app/hour/signRecord`,
        operation: type === 1 ? '签到' : '签退'
      });
    }

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
    
    // 生产环境简化响应日志
    if (__DEV__) {
      console.log('[API-RESPONSE] 志愿者API响应:', { status: response.status, code: data.code });
    }
    
    // 🎉 JSC引擎下恢复完整通知处理
    if (data.code === 200) {
      try {
        if (type === 1 && startTime) {
          // 签到成功 - 只发送即时通知，不安排2小时提醒
          await notifyVolunteerCheckIn();
        } else if (type === 2 && recordId) {
          // 🚀 签退成功 - 恢复完整的工作时长计算
          try {
            // 重新获取完整记录来计算正确的工作时长
            const recordResponse = await getLastRecordFromRecordList(userId);
            if (recordResponse.code === 200 && recordResponse.data) {
              const record = recordResponse.data;
              const actualStartTime = record.startTime;
              // 🚨 修复时区问题：使用相同的时间格式
              // endTime来自API调用参数，格式为 "YYYY-MM-DD HH:mm:ss"
              // 如果没有endTime，生成相同格式的当前时间
              const actualEndTime = endTime || (() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const day = now.getDate().toString().padStart(2, '0');
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const seconds = now.getSeconds().toString().padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
              })();
              
              // 生产环境简化时长日志
              if (__DEV__) {
                console.log('🕐 [DURATION-CALCULATION] 计算工作时长:', { actualStartTime, actualEndTime });
              }
              
              const workDuration = calculateWorkDuration(actualStartTime, actualEndTime);
              await notifyVolunteerCheckOut(workDuration);
            } else {
              // 无法获取记录，使用默认消息
              await notifyVolunteerCheckOut('本次服务');
            }
          } catch (notificationError) {
            console.error('发送签退通知失败:', notificationError);
            // 即使通知失败，也发送一个基本通知
            await notifyVolunteerCheckOut('本次服务');
          }
        }
      } catch (notificationError) {
        // 通知失败不应该影响主流程
        console.warn('发送通知失败:', notificationError);
      }
    }
    
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

// 🚀 修复：安全的工作时长计算，处理时区问题
const calculateWorkDuration = (startTime: string, endTime: string): string => {
  try {
    if (!startTime || !endTime) {
      console.warn('🚨 [DURATION] 缺少时间参数:', { startTime, endTime });
      return '未知时长';
    }
    
    // 详细调试仅在开发环境
    if (__DEV__) {
      console.log('🕐 [DURATION-DEBUG] 原始时间:', { startTime, endTime });
    }
    
    // 🚨 处理不同的时间格式
    const parseTime = (timeStr: string): Date => {
      // API时间格式: "2025-08-18T12:11:23.000+08:00"
      // ISO时间格式: "2025-08-31T00:22:00.000Z"
      
      if (timeStr.includes('T') && (timeStr.includes('+') || timeStr.includes('Z'))) {
        // 标准ISO格式，直接解析
        return new Date(timeStr);
      } else if (timeStr.includes(' ')) {
        // "YYYY-MM-DD HH:mm:ss" 格式，需要添加时区
        const isoTime = timeStr.replace(' ', 'T') + '+08:00';
        return new Date(isoTime);
      } else {
        // 尝试直接解析
        return new Date(timeStr);
      }
    };
    
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    // 详细调试仅在开发环境
    if (__DEV__) {
      console.log('🕐 [DURATION-DEBUG] 解析后时间:', { 
        start: start.toISOString(), 
        end: end.toISOString()
      });
    }
    
    // 🚨 验证时间有效性
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('🚨 [DURATION] 时间解析失败:', { startTime, endTime });
      return '未知时长';
    }
    
    const durationMs = end.getTime() - start.getTime();
    
    // 详细计算调试仅在开发环境
    if (__DEV__) {
      console.log('🕐 [DURATION-DEBUG] 计算结果:', { 
        durationMs, 
        durationMinutes: Math.floor(durationMs / (1000 * 60))
      });
    }
    
    // 🚨 验证时长合理性
    if (durationMs < 0) {
      console.warn('🚨 [DURATION] 时长为负数:', durationMs);
      return '未知时长';
    }
    
    if (durationMs > 12 * 60 * 60 * 1000) { // 超过12小时 - 用户要求的最大限制
      console.warn('🚨 [DURATION] 时长超过12小时限制:', Math.floor(durationMs / (1000 * 60 * 60)), '小时');
      return '超过12小时（需要自动签退）';
    }
    
    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const result = hours > 0 
      ? (minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`)
      : `${Math.max(1, minutes)}分钟`; // 至少显示1分钟
      
    // 最终结果仅在开发环境显示
    if (__DEV__) {
      console.log('🕐 [DURATION-RESULT] 最终时长:', result);
    }
    return result;
  } catch (error) {
    console.error('🚨 [DURATION] 计算工作时长失败:', error);
    return '未知时长';
  }
};


/**
 * 根据API文档第13条获取志愿者最后记录
 * URL: /app/hour/lastRecordList
 */
export const getLastVolunteerRecord = async (userId: number): Promise<APIResponse<VolunteerRecord>> => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('用户未登录');
    }

    console.log('[VOLUNTEER-API] 获取志愿者最后记录:', { userId });

    const response = await fetch(`${BASE_URL}/app/hour/lastRecordList?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('[VOLUNTEER-API] 最后记录API响应:', data);
    
    // 根据API文档，成功时返回code: 200，失败时返回code: 500
    if (data.code === 200) {
      return data;
    } else if (data.code === 500) {
      return { code: 404, msg: '无签到记录' };
    }
    
    return data;
  } catch (error) {
    console.error('[VOLUNTEER-API] 获取志愿者最后记录失败:', error);
    // 如果主接口失败，fallback到recordList接口
    return await getLastRecordFromRecordList(userId);
  }
};

/**
 * 从接口10获取志愿者最新记录（使用recordList接口）
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
 * 完整的志愿者签到流程
 */
export const performVolunteerCheckIn = async (
  userId: number,
  operateUserId: number,
  operateLegalName: string
): Promise<APIResponse> => {
  try {
    // 🚨 参数完整性验证
    if (!userId || !operateUserId || !operateLegalName) {
      const error = new Error(`签到参数缺失: userId=${userId}, operateUserId=${operateUserId}, operateLegalName=${operateLegalName}`);
      console.error('❌ [VOLUNTEER-CHECKIN] 参数验证失败:', {
        userId,
        operateUserId,
        operateLegalName,
        userIdType: typeof userId,
        operateUserIdType: typeof operateUserId,
        legalNameType: typeof operateLegalName
      });
      throw error;
    }
    
    console.log('🔍 [VOLUNTEER-CHECKIN] 开始签到流程:', { userId, operateUserId, operateLegalName });
    
    // 🚨 函数存在性验证
    if (typeof volunteerSignRecord !== 'function') {
      const error = new Error('volunteerSignRecord函数未定义');
      console.error('❌ [VOLUNTEER-CHECKIN] 函数检查失败:', error);
      throw error;
    }
    
    const currentTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log('📅 [VOLUNTEER-CHECKIN] 生成时间:', { currentTime });
    
    const result = await volunteerSignRecord(
      userId,
      1, // 签到
      operateUserId,
      operateLegalName,
      currentTime, // startTime
      undefined, // endTime
      undefined  // recordId
    );
    
    console.log('📋 [VOLUNTEER-CHECKIN] API返回结果:', result);
    
    if (result.code === 200) {
      console.log('✅ [VOLUNTEER-CHECKIN] 签到成功');
    } else {
      console.error('❌ [VOLUNTEER-CHECKIN] 签到失败:', result.msg);
    }
    
    return result;
  } catch (error) {
    console.error('🚨 [VOLUNTEER-CHECKIN] 签到流程异常:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId,
      operateUserId,
      operateLegalName
    });
    throw error;
  }
};

/**
 * 完整的志愿者签退流程 - 先获取记录ID再签退
 */
export const performVolunteerCheckOut = async (
  userId: number,
  operateUserId: number,
  operateLegalName: string
): Promise<APIResponse> => {
  try {
    // 🚨 参数完整性验证
    if (!userId || !operateUserId || !operateLegalName) {
      const error = new Error(`签退参数缺失: userId=${userId}, operateUserId=${operateUserId}, operateLegalName=${operateLegalName}`);
      console.error('❌ [VOLUNTEER-CHECKOUT] 参数验证失败:', {
        userId,
        operateUserId,
        operateLegalName,
        userIdType: typeof userId,
        operateUserIdType: typeof operateUserId,
        legalNameType: typeof operateLegalName
      });
      throw error;
    }
    
    console.log('🔍 [VOLUNTEER-CHECKOUT] 开始签退流程:', { userId, operateUserId, operateLegalName });
    
    // 🚨 函数存在性验证
    if (typeof getLastVolunteerRecord !== 'function') {
      const error = new Error('getLastVolunteerRecord函数未定义');
      console.error('❌ [VOLUNTEER-CHECKOUT] 函数检查失败:', error);
      throw error;
    }
    
    if (typeof volunteerSignRecord !== 'function') {
      const error = new Error('volunteerSignRecord函数未定义');
      console.error('❌ [VOLUNTEER-CHECKOUT] 函数检查失败:', error);
      throw error;
    }
    
    // 第一步：获取最后的签到记录
    console.log('📋 [VOLUNTEER-CHECKOUT] 开始获取最后签到记录...');
    const lastRecordResponse = await getLastVolunteerRecord(userId);
    console.log('📋 [VOLUNTEER-CHECKOUT] 获取记录API响应:', lastRecordResponse);
    
    if (lastRecordResponse.code !== 200 || !lastRecordResponse.data) {
      const error = new Error(`获取签到记录失败: ${lastRecordResponse.msg}`);
      console.error('❌ [VOLUNTEER-CHECKOUT] 获取记录失败:', error);
      throw error;
    }
    
    const lastRecord = lastRecordResponse.data;
    console.log('📋 [VOLUNTEER-CHECKOUT] 获取到最后记录:', {
      id: lastRecord.id,
      userId: lastRecord.userId,
      startTime: lastRecord.startTime,
      endTime: lastRecord.endTime,
      type: lastRecord.type
    });
    
    // 验证记录有效性
    if (!lastRecord.id) {
      const error = new Error('签到记录ID缺失');
      console.error('❌ [VOLUNTEER-CHECKOUT] ID验证失败:', error);
      throw error;
    }
    
    if (lastRecord.endTime) {
      const error = new Error('用户已经签退，无法重复签退');
      console.error('❌ [VOLUNTEER-CHECKOUT] 重复签退检查失败:', error);
      throw error;
    }
    
    // 🚨 时间校验：确保签退时间晚于签到时间
    const signInTime = new Date(lastRecord.startTime);
    const currentTime = new Date();
    
    if (currentTime <= signInTime) {
      const error = new Error('本次工作时间记录失败，请联系管理员进行时间补充');
      console.error('❌ [TIME-VALIDATION] 签退时间不能早于或等于签到时间:', {
        signInTime: signInTime.toISOString(),
        signOutTime: currentTime.toISOString(),
        userId
      });
      throw error;
    }
    
    // 🚨 检查工作时长是否超过12小时限制
    const workDurationHours = (currentTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
    
    if (workDurationHours > 12) {
      console.warn(`🚨 [12H-LIMIT] 用户${userId}工作时长${workDurationHours.toFixed(1)}小时，超过12小时限制`);
      
      // 🚀 新逻辑：允许超时签退，但提供警告信息
      console.log('📅 [VOLUNTEER-CHECKOUT] 执行超时签退，记录实际工作时间');
      
      // 使用实际时间执行签退，不限制在12小时
      const actualTimeString = currentTime.toISOString().replace('T', ' ').slice(0, 19);
      
      const overtimeResult = await volunteerSignRecord(
        userId,
        2, // 签退
        operateUserId,
        operateLegalName,
        undefined, // startTime
        actualTimeString, // 使用实际时间，不限制
        lastRecord.id // recordId - 关键参数
      );
      
      // 添加超时提示但允许正常签退
      if (overtimeResult.code === 200) {
        console.log('✅ [OVERTIME-CHECKOUT] 超时签退成功，已记录实际工作时间');
        return {
          ...overtimeResult,
          msg: `签退成功。工作时长${workDurationHours.toFixed(1)}小时已超过建议的12小时限制，请注意休息。`
        };
      } else {
        return overtimeResult;
      }
    }
    
    // 第二步：正常签退（12小时内）
    const normalTimeString = currentTime.toISOString().replace('T', ' ').slice(0, 19);
    console.log('📅 [VOLUNTEER-CHECKOUT] 生成正常签退时间:', { normalTimeString });
    
    console.log('🚀 [VOLUNTEER-CHECKOUT] 准备调用正常签退API:', {
      userId,
      type: 2,
      operateUserId,
      operateLegalName,
      endTime: normalTimeString,
      recordId: lastRecord.id
    });
    
    const result = await volunteerSignRecord(
      userId,
      2, // 签退
      operateUserId,
      operateLegalName,
      undefined, // startTime
      normalTimeString, // endTime
      lastRecord.id // recordId - 关键参数
    );
    
    console.log('📋 [VOLUNTEER-CHECKOUT] 签退API返回结果:', result);
    
    if (result.code === 200) {
      console.log('✅ [VOLUNTEER-CHECKOUT] 签退成功');
    } else {
      console.error('❌ [VOLUNTEER-CHECKOUT] 签退失败:', result.msg);
    }
    
    return result;
  } catch (error) {
    console.error('🚨 [VOLUNTEER-CHECKOUT] 签退流程异常:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId,
      operateUserId,
      operateLegalName,
      timestamp: new Date().toISOString()
    });
    throw error;
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
 * 🆕 接口19: 获取志愿者个人总工时 - 仅限staff及以上权限
 * URL: /app/hour/userHour
 * @param userId 志愿者用户ID
 * @returns 个人工时统计
 */
export const getPersonalVolunteerHours = async (userId: number): Promise<APIResponse<{
  userId: number;
  totalMinutes: number;
  legalName: string | null;
}>> => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('用户未登录');
    }

    console.log('🔍 [PERSONAL-HOURS] 获取个人工时:', { userId });

    const response = await fetch(`${BASE_URL}/app/hour/userHour?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('无权限访问志愿者工时数据');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📊 [PERSONAL-HOURS] 个人工时API响应:', {
      code: data.code,
      totalMinutes: data.data?.totalMinutes,
      userId: data.data?.userId
    });
    
    return data;
  } catch (error) {
    console.error('获取个人志愿者工时失败:', error);
    throw error;
  }
};

/**
 * 🆕 获取志愿者个人打卡记录 - 仅限staff及以上权限
 * 使用接口10，传入userId参数实现个人化查询
 * @param userId 志愿者用户ID
 * @returns 个人打卡记录列表
 */
export const getPersonalVolunteerRecords = async (userId: number): Promise<APIResponse<VolunteerRecord[]>> => {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      throw new Error('用户未登录');
    }

    console.log('🔍 [PERSONAL-RECORDS] 获取个人打卡记录:', { userId });

    const response = await fetch(`${BASE_URL}/app/hour/recordList?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('无权限访问个人打卡记录');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📋 [PERSONAL-RECORDS] 个人记录API响应:', {
      code: data.code,
      total: data.total,
      recordsCount: data.rows?.length || 0
    });
    
    return data;
  } catch (error) {
    console.error('获取个人打卡记录失败:', error);
    throw error;
  }
};

/**
 * 🆕 自动签退超时用户 (12小时限制)
 * @param operateUserId 操作人ID
 * @param operateLegalName 操作人姓名
 * @returns 自动签退结果
 */
export const autoCheckoutOvertimeUsers = async (
  operateUserId: number,
  operateLegalName: string
): Promise<{
  autoCheckoutCount: number;
  affectedUsers: string[];
}> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    console.log('🕐 [AUTO-CHECKOUT] 开始检查超时签到用户...');

    // 获取所有打卡记录，查找超时用户
    const recordsResult = await getVolunteerRecords();
    
    if (recordsResult.code !== 200 || !recordsResult.rows) {
      return { autoCheckoutCount: 0, affectedUsers: [] };
    }

    const now = new Date();
    const autoCheckoutResults = [];
    const affectedUsers = [];

    // 查找所有未签退记录和超过12小时的历史记录
    for (const record of recordsResult.rows) {
      if (!record.endTime && record.startTime) {
        const signInTime = new Date(record.startTime);
        const workDurationHours = (now.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
        
        if (workDurationHours > 12) {
          console.log(`🚨 [AUTO-CHECKOUT] 发现超时用户: ${record.legalName}，时长: ${workDurationHours.toFixed(1)}小时`);
          
          try {
            // 执行自动签退，设置为12小时后的时间
            const autoSignOutTime = new Date(signInTime.getTime() + 12 * 60 * 60 * 1000);
            const autoTimeString = autoSignOutTime.toISOString().replace('T', ' ').slice(0, 19);
            
            const autoResult = await volunteerSignRecord(
              record.userId,
              2, // 签退
              operateUserId,
              operateLegalName,
              undefined,
              autoTimeString, // 设置为12小时后的时间
              record.id
            );
            
            if (autoResult.code === 200) {
              autoCheckoutResults.push(autoResult);
              affectedUsers.push(`${record.legalName}(12h自动签退)`);
              console.log(`✅ [AUTO-CHECKOUT] ${record.legalName} 自动签退成功`);
            }
          } catch (error) {
            console.error(`❌ [AUTO-CHECKOUT] ${record.legalName} 自动签退失败:`, error);
          }
        }
      }
    }

    // 🚨 处理历史超时记录：检查工时统计是否合理
    try {
      const hoursResult = await getVolunteerHours();
      if (hoursResult.code === 200 && hoursResult.rows) {
        for (const hourRecord of hoursResult.rows) {
          const totalHours = (hourRecord.totalMinutes || 0) / 60;
          if (totalHours > 12) {
            console.warn(`🚨 [HISTORY-OVERTIME] ${hourRecord.legalName} 历史工时异常: ${totalHours.toFixed(1)}小时`);
            affectedUsers.push(`${hourRecord.legalName}(历史工时${totalHours.toFixed(1)}h需要人工核查)`);
          }
        }
      }
    } catch (error) {
      console.warn('检查历史工时统计失败:', error);
    }

    console.log(`🎯 [AUTO-CHECKOUT] 自动签退完成: ${autoCheckoutResults.length}个用户`);
    
    return {
      autoCheckoutCount: autoCheckoutResults.length,
      affectedUsers
    };
    
  } catch (error) {
    console.error('❌ [AUTO-CHECKOUT] 自动签退检查失败:', error);
    return { autoCheckoutCount: 0, affectedUsers: [] };
  }
};

/**
 * 🆕 获取志愿者历史记录 (支持时间范围过滤)
 * @param userId 用户ID
 * @param days 查询天数 (1, 3, 7, 30)
 * @param permission 用户权限级别
 * @returns 历史打卡记录
 */
export const getVolunteerHistoryRecords = async (
  userId: number, 
  days: 1 | 3 | 7 | 30,
  permission: 'manage' | 'part_manage' | 'staff'
): Promise<APIResponse<VolunteerRecord[]>> => {
  try {
    // 权限验证
    if (permission === 'staff' && days > 7) {
      throw new Error('Staff用户最多只能查询7天内的记录');
    }
    if (['part_manage'].includes(permission) && days > 7) {
      throw new Error('分管理员最多只能查询7天内的记录');
    }
    if (permission === 'manage' && days > 30) {
      throw new Error('总管理员最多只能查询30天内的记录');
    }

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`🔍 [HISTORY-RECORDS] 查询${days}天历史记录:`, {
      userId,
      permission,
      startDate: startDateStr,
      endDate: endDateStr
    });

    // 调用基础记录查询API (后端不支持日期过滤)
    const result = await getVolunteerRecords({
      userId // 只传userId，后端不支持日期过滤
    });

    // 前端按日期过滤和排序
    if (result.code === 200 && result.rows && Array.isArray(result.rows)) {
      console.log(`🔍 [FILTER-RECORDS] 原始记录数: ${result.rows.length}`);
      
      // 按日期范围过滤 (前端实现)
      const startTime = new Date(startDateStr + 'T00:00:00');
      const endTime = new Date(endDateStr + 'T23:59:59');
      
      const filteredRecords = result.rows.filter((record: VolunteerRecord) => {
        if (!record.startTime) return false;
        
        const recordDate = new Date(record.startTime);
        return recordDate >= startTime && recordDate <= endTime;
      });
      
      // 按时间排序 (最新的在前)
      filteredRecords.sort((a: VolunteerRecord, b: VolunteerRecord) => {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
      
      console.log(`📊 [FILTER-RESULT] 过滤后记录数: ${filteredRecords.length} (${days}天内)`);
      
      // 更新result中的数据
      result.rows = filteredRecords;
      result.total = filteredRecords.length;
    }

    return result;
  } catch (error) {
    console.error('获取志愿者历史记录失败:', error);
    throw error;
  }
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
    
    if (hoursResult.code === 200 && hoursResult.rows && Array.isArray(hoursResult.rows)) {
      const volunteers = hoursResult.rows as VolunteerHours[];
      return {
        totalVolunteers: volunteers.length,
        activeVolunteers: volunteers.filter(v => (v.totalMinutes || 0) > 0).length,
        totalHours: Math.round(volunteers.reduce((sum, v) => sum + (v.totalMinutes || 0), 0) / 60),
      };
    }
    
    return { totalVolunteers: 0, activeVolunteers: 0, totalHours: 0 };
  } catch (error) {
    console.error('获取学校志愿者统计失败:', error);
    return { totalVolunteers: 0, activeVolunteers: 0, totalHours: 0 };
  }
};