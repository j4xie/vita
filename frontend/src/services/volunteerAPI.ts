/**
 * 志愿者工时管理API服务
 */

import { getCurrentToken } from './authAPI';
import { notifyVolunteerCheckIn, notifyVolunteerCheckOut } from './smartAlertSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseTimestamp as parseVolunteerTimestamp,
  safeParseTime,
  calculateDuration,
  formatDateTime,
  toISOStringSafe,
  compareTimes,
  getCurrentISOTime,
  toBeijingTimeString
} from '../utils/timeHelper';

const BASE_URL = 'https://www.vitaglobal.icu';

// 导出别名以保持向后兼容
export { parseVolunteerTimestamp };

/**
 * 通用重试函数，使用指数退避算法
 * @param fn 要重试的函数
 * @param maxRetries 最大重试次数
 * @param baseDelay 基础延迟（毫秒）
 * @returns 函数执行结果
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 第一次尝试前也加延迟，确保后端同步
      if (attempt > 0 || baseDelay > 0) {
        const delay = attempt === 0 ? baseDelay : baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const result = await fn();
      return result;
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) {
        break;
      }
      // 重试逻辑，不显示警告以避免控制台干扰
    }
  }

  throw lastError!;
};

/**
 * 本地状态管理 - 存储最近的签到信息
 */
const localCheckInCache = new Map<number, {
  recordId: number;
  startTime: string;
  timestamp: number;
}>();

/**
 * 存储本地签到信息
 * @param userId 用户ID
 * @param recordId 记录ID
 * @param startTime 签到时间
 */
const storeLocalCheckIn = (userId: number, recordId: number, startTime: string): void => {
  localCheckInCache.set(userId, {
    recordId,
    startTime,
    timestamp: Date.now()
  });
  if (__DEV__) {
    console.log('💾 [LOCAL-CACHE] 存储签到信息:', { userId, recordId, startTime });
  }
};

/**
 * 获取本地签到信息
 * @param userId 用户ID
 * @returns 本地签到信息或null
 */
const getLocalCheckIn = (userId: number): VolunteerRecord | null => {
  const cached = localCheckInCache.get(userId);
  if (!cached) return null;

  // 检查缓存是否过期（10分钟）
  const isExpired = Date.now() - cached.timestamp > 10 * 60 * 1000;
  if (isExpired) {
    localCheckInCache.delete(userId);
    if (__DEV__) {
      console.log('🗑️ [LOCAL-CACHE] 缓存已过期并清理:', { userId });
    }
    return null;
  }

  if (__DEV__) {
    console.log('📦 [LOCAL-CACHE] 使用本地缓存:', cached);
  }
  return {
    id: cached.recordId,
    userId: userId,
    startTime: cached.startTime,
    endTime: null,
    type: 1,
    legalName: '', // 这些字段在checkout时不关键
    status: 1
  };
};

/**
 * 清理本地签到信息
 * @param userId 用户ID
 */
const clearLocalCheckIn = (userId: number): void => {
  localCheckInCache.delete(userId);
  if (__DEV__) {
    console.log('🧹 [LOCAL-CACHE] 清理签到缓存:', { userId });
  }
};

/**
 * 格式化时间为API需要的格式 (YYYY-MM-DD HH:mm:ss)
 * 🌍 修复版本：确保输出正确的北京时间，避免双重转换
 */
const formatTimeForAPI = (timeInput: string | Date): string => {
  try {
    let date: Date;

    // 处理不同的输入格式
    if (typeof timeInput === 'string') {
      // 如果已经是正确格式，且看起来是当前日期，直接返回
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timeInput)) {
        const testDate = new Date(timeInput.replace(' ', 'T') + '+08:00');
        const now = new Date();
        const timeDiff = Math.abs(testDate.getTime() - now.getTime());

        // 如果时间差小于24小时，认为是有效的当前时间
        if (timeDiff < 24 * 60 * 60 * 1000) {
          if (__DEV__) {
            console.log('🔧 [API-FORMAT] 检测到有效格式，直接使用:', timeInput);
          }
          return timeInput;
        }
      }

      date = new Date(timeInput);
    } else {
      date = timeInput;
    }

    if (isNaN(date.getTime())) {
      throw new Error('无效的日期对象');
    }

    // 🚀 使用修复后的时区转换函数
    const result = toBeijingTimeString(date);

    if (__DEV__) {
      console.log('🔧 [API-FORMAT] 时间格式化完成:', {
        input: typeof timeInput === 'string' ? timeInput : timeInput.toISOString(),
        output: result,
        inputType: typeof timeInput
      });
    }

    return result;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ [API-FORMAT] 时间格式化失败:', error, 'Input:', timeInput);
    }
    // 最后的fallback：返回当前北京时间
    const fallback = toBeijingTimeString(new Date());
    if (__DEV__) {
      console.warn('⚠️ [API-FORMAT] 使用fallback时间:', fallback);
    }
    return fallback;
  }
};

// 根据API文档第10-13条定义的志愿者打卡记录类型
export interface VolunteerRecord {
  id: number;
  userId: number;
  startTime: string;
  endTime: string | null;
  type: number; // 1-正常记录
  status?: -1 | 1 | 2; // -1:待审核 1:审核通过 2:审核拒绝
  operateUserId?: number;
  operateLegalName?: string;
  legalName: string;
  createBy?: string | null;
  createTime?: string | null;
  updateBy?: string | null;
  updateTime?: string | null;
  remark?: string | null;
}

// 通知状态管理
export interface NotificationStatus {
  recordId: number;
  isRead: boolean;
  statusChangedAt: string;
  previousStatus?: number;
  currentStatus: number;
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
      if (__DEV__) {
        console.warn('当前用户无志愿者管理权限');
      }
      return {
        code: 200,
        msg: '无权限',
        total: 0,
        rows: []
      };
    }
    
    return data;
  } catch (error) {
    if (__DEV__) {
      console.error('获取志愿者记录失败:', error);
    }
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
      if (__DEV__) {
        console.warn('当前用户无志愿者管理权限');
      }
      return {
        code: 200,
        msg: '无权限',
        total: 0,
        rows: []
      };
    }
    
    return data;
  } catch (error) {
    if (__DEV__) {
      console.error('获取志愿者工时失败:', error);
    }
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
 * 签退(type=2): userId + type + endTime + operateUserId + operateLegalName + id(记录ID) + remark(工作描述)
 */
export const volunteerSignRecord = async (
  userId: number,
  type: 1 | 2,
  operateUserId: number,     // 必需：操作用户ID
  operateLegalName: string,  // 必需：操作用户姓名
  startTime?: string,        // 签到时需要
  endTime?: string,          // 签退时需要
  recordId?: number,         // 签退时需要
  remark?: string,           // 签退时的工作描述（最多100字）
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
      // 转换时间格式为API期望的格式 (YYYY-MM-DD HH:mm:ss)
      const formattedStartTime = formatTimeForAPI(startTime);
      form.append('startTime', formattedStartTime);
    }
    
    // 签退(type=2)需要 endTime 和 id(记录ID)
    if (type === 2) {
      if (!endTime) {
        throw new Error('签退操作缺少endTime参数');
      }
      if (!recordId) {
        throw new Error('签退操作缺少记录ID参数');
      }
      // 转换时间格式为API期望的格式 (YYYY-MM-DD HH:mm:ss)
      const formattedEndTime = formatTimeForAPI(endTime);
      form.append('endTime', formattedEndTime);
      form.append('id', String(recordId));

      // 添加工作描述（如果提供）
      if (remark) {
        form.append('remark', remark);
      }
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
      if (__DEV__) {
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
      }
      
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
          // 🚀 签退成功 - 不显示弹窗
          if (__DEV__) {
            console.log('✅ [VOLUNTEER-CHECKOUT] 签退成功，已记录工作时长');
          }
          // 注释掉弹窗通知，避免显示错误的时长
          // try {
          //   // 重新获取完整记录来计算正确的工作时长
          //   const recordResponse = await getLastRecordFromRecordList(userId);
          //   if (recordResponse.code === 200 && recordResponse.data) {
          //     const record = recordResponse.data;
          //     const actualStartTime = record.startTime;
          //     if (!actualStartTime) {
          //       console.warn('⚠️ [DURATION] 记录缺少开始时间');
          //       return;
          //     }
          //     const actualEndTime = endTime || new Date().toISOString();
          //     const workDuration = calculateWorkDuration(actualStartTime, actualEndTime);
          //     await notifyVolunteerCheckOut(workDuration);
          //   }
          // } catch (notificationError) {
          //   console.error('发送签退通知失败:', notificationError);
          // }
        }
      } catch (notificationError) {
        // 通知失败不应该影响主流程
        if (__DEV__) {
          console.warn('发送通知失败:', notificationError);
        }
      }
    }
    
    return data;
  } catch (error) {
    if (__DEV__) {
      console.error('[VOLUNTEER-ERROR] 志愿者签到/签退失败:', {
        error: error instanceof Error ? error.message : error,
        userId,
        type: type === 1 ? '签到' : '签退',
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
};

// 🚀 修复：安全的工作时长计算，处理时区问题
const calculateWorkDuration = (startTime: string | null | undefined, endTime: string | null | undefined): string => {
  try {
    if (!startTime || !endTime) {
      if (__DEV__) {
        console.warn('🚨 [DURATION] 缺少时间参数:', {
          startTime: startTime || 'null',
          endTime: endTime || 'null'
        });
      }
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
      if (__DEV__) {
        console.warn('🚨 [DURATION] 时长为负数:', durationMs);
      }
      return '未知时长';
    }
    
    if (durationMs > 12 * 60 * 60 * 1000) { // 超过12小时 - 用户要求的最大限制
      if (__DEV__) {
        console.warn('🚨 [DURATION] 时长超过12小时限制:', Math.floor(durationMs / (1000 * 60 * 60)), '小时');
      }
      return '超过12小时（需要自动签退）';
    }
    
    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // 根据分钟数返回合适的显示格式
    // 0分钟时显示"少于1分钟"而不是"0分钟"
    const result = hours > 0
      ? (minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`)
      : (minutes > 0 ? `${minutes}分钟` : '少于1分钟');
      
    // 最终结果仅在开发环境显示
    if (__DEV__) {
      console.log('🕐 [DURATION-RESULT] 最终时长:', result);
    }
    return result;
  } catch (error) {
    if (__DEV__) {
      console.error('🚨 [DURATION] 计算工作时长失败:', error);
    }
    return '未知时长';
  }
};


/**
 * 根据API文档第13条获取志愿者最后记录（增强版：支持重试和本地缓存）
 * URL: /app/hour/lastRecordList
 */
export const getLastVolunteerRecord = async (userId: number): Promise<APIResponse<VolunteerRecord>> => {
  if (__DEV__) {
    console.log('[VOLUNTEER-API] 开始获取志愿者最后记录:', { userId });
  }

  // 使用重试机制调用API
  const fetchWithRetry = async (): Promise<APIResponse<VolunteerRecord>> => {
    const token = await getCurrentToken();

    if (!token) {
      throw new Error('用户未登录');
    }

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
    if (__DEV__) {
      console.log('[VOLUNTEER-API] 最后记录API响应:', data);
    }

    // 根据API文档，成功时返回code: 200，失败时返回code: 500
    if (data.code === 200) {
      return data;
    } else if (data.code === 500) {
      // API返回500表示无记录，抛出错误以触发重试或fallback
      throw new Error('无签到记录');
    }

    return data;
  };

  try {
    // 使用重试机制：首次延迟200ms，最多重试2次，加快响应速度
    return await retryWithBackoff(fetchWithRetry, 2, 200);
  } catch (error) {

    // 如果重试失败，先尝试本地缓存
    const localRecord = getLocalCheckIn(userId);
    if (localRecord) {
      return {
        code: 200,
        msg: '使用本地缓存记录',
        data: localRecord
      };
    }

    // 再次尝试recordList接口，也使用重试机制
    try {
      return await retryWithBackoff(
        () => getLastRecordFromRecordList(userId),
        1, // 进一步减少重试次数
        200 // 统一使用200ms延迟
      );
    } catch (fallbackError) {

      // 返回更友好的错误信息
      return {
        code: 404,
        msg: '暂时无法获取签到记录，请稍后再试或联系管理员'
      };
    }
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
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-CHECKIN] 参数验证失败:', {
          userId,
          operateUserId,
          operateLegalName,
          userIdType: typeof userId,
          operateUserIdType: typeof operateUserId,
          legalNameType: typeof operateLegalName
        });
      }
      throw error;
    }
    
    if (__DEV__) {
      console.log('🔍 [VOLUNTEER-CHECKIN] 开始签到流程:', { userId, operateUserId, operateLegalName });
    }

    // 🚨 函数存在性验证
    if (typeof volunteerSignRecord !== 'function') {
      const error = new Error('volunteerSignRecord函数未定义');
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-CHECKIN] 函数检查失败:', error);
      }
      throw error;
    }

    // 🕐 直接使用当前时间进行API格式化（避免复杂转换）
    const now = new Date();
    const currentTime = formatTimeForAPI(now);

    // 🔧 详细调试：记录完整的时间转换过程
    if (__DEV__) {
      console.log('🔍 [CHECKIN-TIME-DEBUG] 完整时间转换过程:', {
        originalTime: now.toISOString(),
        originalLocal: now.toLocaleString(),
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: now.getTimezoneOffset(),
        generatedBeijingTime: currentTime,
        // 验证转换是否正确
        beijingNow: new Intl.DateTimeFormat('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(now),
        shouldMatch: 'generatedBeijingTime === beijingNow'
      });
    }

    // 验证时间格式正确性
    const testParse = new Date(currentTime.replace(' ', 'T') + '+08:00');
    if (isNaN(testParse.getTime())) {
      if (__DEV__) {
        console.error('❌ [CHECKIN-TIME] 生成的时间格式无效:', {
          generated: currentTime,
          testParse: testParse.toString()
        });
      }
      throw new Error('系统时间格式错误');
    }

    // 🚨 关键验证：确保生成的时间不是未来时间
    const beijingTimeParsed = new Date(currentTime.replace(' ', 'T') + '+08:00');
    const timeDiffMinutes = (beijingTimeParsed.getTime() - now.getTime()) / (1000 * 60);

    if (__DEV__) {
      console.log('⏰ [TIME-VALIDATION] 时间验证:', {
        localTime: now.toISOString(),
        beijingTime: beijingTimeParsed.toISOString(),
        differenceMinutes: timeDiffMinutes.toFixed(1),
        isReasonable: Math.abs(timeDiffMinutes) < 24 * 60 // 不应该超过24小时差异
      });
    }

    // 如果时间差异超过24小时，说明转换有问题
    if (Math.abs(timeDiffMinutes) > 24 * 60) {
      const errorMsg = `时间转换异常，差异${timeDiffMinutes.toFixed(1)}分钟`;
      if (__DEV__) {
        console.error('❌ [TIME-CONVERSION-ERROR]', errorMsg);
      }
      throw new Error(errorMsg);
    }
    
    const result = await volunteerSignRecord(
      userId,
      1, // 签到
      operateUserId,
      operateLegalName,
      currentTime, // startTime
      undefined, // endTime
      undefined  // recordId
    );

    if (__DEV__) {
      console.log('📋 [VOLUNTEER-CHECKIN] API返回结果:', result);
    }

    if (result.code === 200) {
      if (__DEV__) {
        console.log('✅ [VOLUNTEER-CHECKIN] 签到成功');
      }

      // 💾 存储本地签到信息，用于快速签退
      try {
        // 尝试从API响应中获取记录ID，如果没有则使用时间戳估算
        let recordId = result.data?.id || result.data?.recordId;
        if (!recordId) {
          // 如果API响应中没有ID，使用时间戳估算
          recordId = Date.now() % 1000000;
        }
        storeLocalCheckIn(userId, recordId, currentTime);
        if (__DEV__) {
          console.log('💾 [LOCAL-CACHE] 签到缓存已存储，记录ID:', recordId);
        }
      } catch (cacheError) {
        if (__DEV__) {
          console.warn('⚠️ [LOCAL-CACHE] 存储签到缓存失败:', cacheError);
        }
      }
    } else {
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-CHECKIN] 签到失败:', result.msg);
      }
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
  operateLegalName: string,
  remark?: string  // 新增：工作描述参数
): Promise<APIResponse> => {
  try {
    // 🚨 参数完整性验证
    if (!userId || !operateUserId || !operateLegalName) {
      const error = new Error(`签退参数缺失: userId=${userId}, operateUserId=${operateUserId}, operateLegalName=${operateLegalName}`);
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-CHECKOUT] 参数验证失败:', {
          userId,
          operateUserId,
          operateLegalName,
          userIdType: typeof userId,
          operateUserIdType: typeof operateUserId,
          legalNameType: typeof operateLegalName
        });
      }
      throw error;
    }
    
    if (__DEV__) {
      console.log('🔍 [VOLUNTEER-CHECKOUT] 开始签退流程:', { userId, operateUserId, operateLegalName });
    }
    
    // 🚨 函数存在性验证
    if (typeof getLastVolunteerRecord !== 'function') {
      const error = new Error('getLastVolunteerRecord函数未定义');
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-CHECKOUT] 函数检查失败:', error);
      }
      throw error;
    }
    
    if (typeof volunteerSignRecord !== 'function') {
      const error = new Error('volunteerSignRecord函数未定义');
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-CHECKOUT] 函数检查失败:', error);
      }
      throw error;
    }
    
    // 第一步：获取最后的签到记录
    if (__DEV__) {
      console.log('📋 [VOLUNTEER-CHECKOUT] 开始获取最后签到记录...');
    }
    const lastRecordResponse = await getLastVolunteerRecord(userId);
    if (__DEV__) {
      console.log('📋 [VOLUNTEER-CHECKOUT] 获取记录API响应:', lastRecordResponse);
    }
    
    if (lastRecordResponse.code !== 200 || !lastRecordResponse.data) {
      // 提供更友好的错误信息
      let userMessage = lastRecordResponse.msg;
      if (userMessage === '无签到记录' || userMessage === '暂时无法获取签到记录，请稍后再试或联系管理员') {
        userMessage = '未找到您的签到记录。请确认您已成功签到，或稍后再试。如问题持续存在，请联系管理员。';
      }

      const error = new Error(userMessage);
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-CHECKOUT] 获取记录失败:', {
          code: lastRecordResponse.code,
          message: lastRecordResponse.msg,
          userId: userId,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
    
    const lastRecord = lastRecordResponse.data;

    // 🔍 详细记录原始时间戳数据
    if (__DEV__) {
      console.log('🔍 [TIMESTAMP-DEBUG] 原始签到记录:', {
        rawStartTime: lastRecord.startTime,
        startTimeType: typeof lastRecord.startTime,
        startTimeValue: lastRecord.startTime,
        recordId: lastRecord.id,
        userId: lastRecord.userId
      });
    }

    // 🔧 智能时间戳解析和修正
    if (!lastRecord.startTime) {
      // 处理startTime为null的异常情况
      const error = new Error('检测到异常的签到记录（签到时间为空），请重新签到');
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-CHECKOUT] 签到时间为null:', {
          recordId: lastRecord.id,
          userId: lastRecord.userId,
          status: lastRecord.status,
          type: lastRecord.type
        });
      }
      throw error;
    }

    if (lastRecord.startTime) {
      let parsedTime;
      const rawValue = lastRecord.startTime;
      const now = new Date();

      // 🔍 详细调试：记录原始数据和环境信息
      if (__DEV__) {
        console.log('🔍 [TIMEZONE-DEBUG] 开始时间解析调试:', {
          rawValue,
          rawType: typeof rawValue,
          rawLength: String(rawValue).length,
          currentTimeUTC: now.toISOString(),
          currentTimeLocal: now.toLocaleString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: now.getTimezoneOffset(),
          // 尝试不同的初始解析看看结果
          asUTCString: typeof rawValue === 'string' ? new Date(rawValue.replace(' ', 'T') + 'Z').toISOString() : 'N/A',
          asBeijingString: typeof rawValue === 'string' ? new Date(rawValue.replace(' ', 'T') + '+08:00').toISOString() : 'N/A',
          asLocalString: typeof rawValue === 'string' ? new Date(rawValue.replace(' ', 'T')).toISOString() : 'N/A'
        });
      }

      // 使用统一的解析函数
      try {
        parsedTime = parseVolunteerTimestamp(rawValue);
        if (__DEV__) {
          console.log('📊 [TIMESTAMP-PARSE] 成功解析时间戳:', {
            input: rawValue,
            inputType: typeof rawValue,
            parsedDate: parsedTime.toISOString(),
            timestamp: parsedTime.getTime()
          });
        }

        // 检查时间是否在合理范围内（过去30天到未来1小时）
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneHourFuture = new Date(now.getTime() + 60 * 60 * 1000);

        if (parsedTime < thirtyDaysAgo) {
          const yearsAgo = (now.getTime() - parsedTime.getTime()) / (1000 * 60 * 60 * 24 * 365);
          if (__DEV__) {
            console.error('❌ [TIMESTAMP-ANOMALY] 签到时间异常过早:', {
              parsedTime: parsedTime.toISOString(),
              yearsAgo: yearsAgo.toFixed(1),
              rawValue
            });
          }
          throw new Error(`签到时间异常（${yearsAgo.toFixed(0)}年前），请联系管理员重置`);
        }

        if (parsedTime > oneHourFuture) {
          if (__DEV__) {
            console.error('❌ [TIMESTAMP-ANOMALY] 签到时间在未来:', {
              parsedTime: parsedTime.toISOString(),
              now: now.toISOString(),
              rawValue,
              difference: (parsedTime.getTime() - now.getTime()) / (1000 * 60 * 60) + '小时'
            });
          }

          // 🔧 多策略时区修正：尝试不同的解析方法
          const strategies = [
            // 策略1：作为UTC时间解析
            () => {
              if (typeof rawValue === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(rawValue)) {
                return new Date(rawValue.replace(' ', 'T') + 'Z');
              }
              return null;
            },
            // 策略2：作为本地时间解析
            () => {
              if (typeof rawValue === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(rawValue)) {
                return new Date(rawValue.replace(' ', 'T'));
              }
              return null;
            },
            // 策略3：减去8小时（可能是双重时区转换）
            () => {
              return new Date(parsedTime.getTime() - 8 * 60 * 60 * 1000);
            },
            // 策略4：从当前时间倒推合理时间
            () => {
              // 假设用户可能1-30分钟前签到
              const randomMinutes = Math.floor(Math.random() * 30) + 1;
              return new Date(now.getTime() - randomMinutes * 60 * 1000);
            }
          ];

          let fixedTime = null;
          for (let i = 0; i < strategies.length; i++) {
            try {
              const candidate = strategies[i]();
              if (candidate && !isNaN(candidate.getTime()) &&
                  candidate <= oneHourFuture && candidate >= thirtyDaysAgo) {
                fixedTime = candidate;
                if (__DEV__) {
                  console.log(`✅ [TIMEZONE-FIX] 策略${i + 1}成功修复时间:`, {
                    strategy: i + 1,
                    original: parsedTime.toISOString(),
                    fixed: fixedTime.toISOString(),
                    difference: (now.getTime() - fixedTime.getTime()) / (1000 * 60) + '分钟前'
                  });
                }
                break;
              }
            } catch (error) {
              if (__DEV__) {
                console.warn(`⚠️ [TIMEZONE-FIX] 策略${i + 1}失败:`, error);
              }
            }
          }

          if (fixedTime) {
            parsedTime = fixedTime;
          } else {
            // 所有策略都失败，使用保守的回退方案
            parsedTime = new Date(now.getTime() - 5 * 60 * 1000); // 5分钟前
            if (__DEV__) {
              console.warn('⚠️ [FINAL-FALLBACK] 所有修复策略失败，使用5分钟前作为回退时间');
            }
          }
        }

        // 更新为标准化的ISO时间
        lastRecord.startTime = parsedTime.toISOString();
        if (__DEV__) {
          console.log('✅ [TIMESTAMP-NORMALIZED] 标准化后的签到时间:', lastRecord.startTime);
        }

      } catch (parseError) {
        if (__DEV__) {
          console.error('❌ [TIMESTAMP-ERROR] 时间解析失败:', {
            error: parseError,
            rawValue,
            rawType: typeof rawValue
          });
        }
        throw new Error('签到时间格式错误，请联系管理员');
      }
    }

    if (__DEV__) {
      console.log('📋 [VOLUNTEER-CHECKOUT] 获取到最后记录:', {
        id: lastRecord.id,
        userId: lastRecord.userId,
        startTime: lastRecord.startTime,
        endTime: lastRecord.endTime,
        type: lastRecord.type
      });
    }
    
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
    
    // 🚨 时间校验：确保签退时间不早于签到时间（允许同分钟操作）
    // 使用parseVolunteerTimestamp来处理所有可能的时间格式
    let signInTime;
    try {
      signInTime = parseVolunteerTimestamp(lastRecord.startTime);
    } catch (parseError) {
      // 如果parseVolunteerTimestamp失败，尝试safeParseTime
      signInTime = safeParseTime(lastRecord.startTime);
    }

    const currentTime = new Date();

    if (!signInTime) {
      const error = new Error('签到时间数据异常，请联系管理员');
      console.error('❌ [VOLUNTEER-CHECKOUT] 签到时间解析失败:', {
        startTime: lastRecord.startTime,
        startTimeType: typeof lastRecord.startTime,
        recordId: lastRecord.id
      });
      throw error;
    }

    const timeDiffMs = currentTime.getTime() - signInTime.getTime();
    const timeDiffSeconds = timeDiffMs / 1000;

    // 详细记录时间比较
    if (__DEV__) {
      console.log('⏰ [TIME-CHECK] 时间校验:', {
        signInTime: signInTime.toISOString(),
        signInTimeMs: signInTime.getTime(),
        currentTime: currentTime.toISOString(),
        currentTimeMs: currentTime.getTime(),
        differenceMs: timeDiffMs,
        differenceSeconds: timeDiffSeconds,
        differenceMinutes: timeDiffMs / (1000 * 60),
        differenceHours: timeDiffMs / (1000 * 60 * 60)
      });
    }

    // 🔧 修复：允许同时或稍后的签退，最小容忍度为负2秒（考虑系统时钟差异）
    if (timeDiffMs < -2000) {
      const error = new Error('签退时间不能早于签到时间超过2秒，请稍后再试');
      console.error('❌ [TIME-VALIDATION] 签退时间过早:', {
        signInTime: signInTime.toISOString(),
        signOutTime: currentTime.toISOString(),
        differenceSeconds: timeDiffSeconds,
        userId
      });
      throw error;
    }

    // ✅ 允许同分钟签退，但给出友好提示
    if (timeDiffMs < 10000) { // 10秒内
      if (__DEV__) {
        console.log('⚡ [QUICK-CHECKOUT] 快速签退检测:', {
          duration: `${timeDiffSeconds.toFixed(1)}秒`,
          message: '允许快速签退操作'
        });
      }
    }

    // 🚨 检查工作时长是否超过合理范围
    const workDurationHours = (currentTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
    const workDurationMinutes = (currentTime.getTime() - signInTime.getTime()) / (1000 * 60);

    if (__DEV__) {
      console.log('📊 [WORK-DURATION] 工作时长计算:', {
        hours: workDurationHours.toFixed(2),
        minutes: workDurationMinutes.toFixed(0),
        startTime: lastRecord.startTime,
        currentTime: currentTime.toISOString()
      });
    }

    // 检测极端异常时长（超过24小时肯定是错误）
    if (workDurationHours > 24) {
      console.error(`❌ [TIME-ANOMALY] 检测到异常工作时长: ${workDurationHours.toFixed(1)}小时`, {
        rawStartTime: lastRecord.startTime,
        parsedStartTime: signInTime.toISOString(),
        currentTime: currentTime.toISOString()
      });

      // 不再尝试自动修正，直接报错让用户重新签到
      throw new Error(`签到时间记录异常（${workDurationHours.toFixed(0)}小时），请联系管理员重置签到状态`);
    } else if (workDurationHours > 12) {
      console.warn(`🚨 [12H-LIMIT] 用户${userId}工作时长${workDurationHours.toFixed(1)}小时，超过12小时限制`);

      // 🚀 新逻辑：允许超时签退，但提供警告信息
      console.log('📅 [VOLUNTEER-CHECKOUT] 执行超时签退，记录实际工作时间');

      // 🕐 使用统一的API格式化函数
      const actualTimeString = formatTimeForAPI(currentTime);
      
      const overtimeResult = await volunteerSignRecord(
        userId,
        2, // 签退
        operateUserId,
        operateLegalName,
        undefined, // startTime
        actualTimeString, // 使用实际时间，不限制
        lastRecord.id, // recordId - 关键参数
        remark // 传递工作描述
      );
      
      // 添加超时提示但允许正常签退
      if (overtimeResult.code === 200) {
        console.log('✅ [OVERTIME-CHECKOUT] 超时签退成功，已记录实际工作时间');

        // 🧹 清理本地签到缓存
        clearLocalCheckIn(userId);

        return {
          ...overtimeResult,
          msg: `签退成功。工作时长${workDurationHours.toFixed(1)}小时已超过建议的12小时限制，请注意休息。`
        };
      } else {
        return overtimeResult;
      }
    }
    
    // 第二步：正常签退（12小时内）
    // 🕐 使用统一的API格式化函数
    const normalTimeString = formatTimeForAPI(currentTime);

    console.log('📅 [VOLUNTEER-CHECKOUT] 生成标准化签退时间:', {
      formattedTime: normalTimeString,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
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
      lastRecord.id, // recordId - 关键参数
      remark // 传递工作描述
    );
    
    console.log('📋 [VOLUNTEER-CHECKOUT] 签退API返回结果:', result);
    
    if (result.code === 200) {
      console.log('✅ [VOLUNTEER-CHECKOUT] 签退成功');

      // 🧹 清理本地签到缓存
      clearLocalCheckIn(userId);
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
        const signInTime = safeParseTime(record.startTime);
        if (!signInTime) continue;
        const workDurationHours = (now.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
        
        if (workDurationHours > 12) {
          console.log(`🚨 [AUTO-CHECKOUT] 发现超时用户: ${record.legalName}，时长: ${workDurationHours.toFixed(1)}小时`);
          
          try {
            // 执行自动签退，设置为12小时后的时间
            const autoSignOutTime = new Date(signInTime.getTime() + 12 * 60 * 60 * 1000);
            // 🕐 使用北京时间格式（修复时区混淆）
            const autoTimeString = toBeijingTimeString(autoSignOutTime);
            
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
    
    // 使用本地日期而不是UTC日期
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatLocalDate(startDate); // YYYY-MM-DD
    const endDateStr = formatLocalDate(endDate);

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
        
        const recordDate = safeParseTime(record.startTime);
        if (!recordDate) return false;
        return recordDate >= startTime && recordDate <= endTime;
      });
      
      // 按时间排序 (最新的在前)
      filteredRecords.sort((a: VolunteerRecord, b: VolunteerRecord) => {
        const timeA = safeParseTime(a.startTime);
        const timeB = safeParseTime(b.startTime);
        if (!timeA || !timeB) return 0;
        return timeB.getTime() - timeA.getTime();
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

/**
 * 获取志愿者记录未读数量
 * @param userId 用户ID
 * @returns 未读的审核状态更新数量
 */
export const getVolunteerUnreadCount = async (userId: number): Promise<number> => {
  try {

    // 获取用户的志愿者记录
    const records = await getVolunteerRecords({ userId });

    if (records.code !== 200 || !records.rows) {
      return 0;
    }

    // 获取已读状态
    const readStatusStr = await AsyncStorage.getItem('volunteerReadStatus');
    const readMap = readStatusStr ? JSON.parse(readStatusStr) : {};

    // 计算未读的已审核记录（通过或拒绝）
    const unreadCount = records.rows.filter((record: VolunteerRecord) => {
      // 只计算已经有审核结果的记录
      const hasResult = record.status === 1 || record.status === 2;
      const isUnread = !readMap[record.id];
      return hasResult && isUnread;
    }).length;

    return unreadCount;
  } catch (error) {
    console.error('获取未读数量失败:', error);
    return 0;
  }
};

/**
 * 标记志愿者记录为已读
 * @param recordId 记录ID
 */
export const markVolunteerRecordAsRead = async (recordId: number): Promise<void> => {
  try {

    const readStatusStr = await AsyncStorage.getItem('volunteerReadStatus');
    const readMap = readStatusStr ? JSON.parse(readStatusStr) : {};

    readMap[recordId] = true;

    await AsyncStorage.setItem('volunteerReadStatus', JSON.stringify(readMap));
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

/**
 * 标记所有志愿者记录为已读
 * @param userId 用户ID
 */
export const markAllVolunteerRecordsAsRead = async (userId: number): Promise<void> => {
  try {

    const records = await getVolunteerRecords({ userId });

    if (records.code !== 200 || !records.rows) {
      return;
    }

    const readMap: Record<number, boolean> = {};

    // 标记所有已审核的记录为已读
    records.rows.forEach((record: VolunteerRecord) => {
      if (record.status === 1 || record.status === 2) {
        readMap[record.id] = true;
      }
    });

    await AsyncStorage.setItem('volunteerReadStatus', JSON.stringify(readMap));
  } catch (error) {
    console.error('标记全部已读失败:', error);
  }
};

/**
 * 格式化时间显示，带时区信息
 * @param dateString ISO时间字符串
 * @param showTimezone 是否显示时区
 * @returns 格式化的时间字符串
 */
export const formatVolunteerTimeWithTimezone = (dateString?: string, showTimezone: boolean = false): string => {
  if (!dateString) return '--:--';

  try {
    const date = new Date(dateString);

    // 检测无效日期
    if (isNaN(date.getTime())) {
      return '--:--';
    }

    // 获取本地时区信息
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeZoneAbbr = new Date().toLocaleTimeString('en-US', {
      timeZoneName: 'short',
      timeZone
    }).split(' ').pop() || '';

    // 格式化时间
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    const formattedTime = date.toLocaleTimeString('zh-CN', options);

    // 如果需要显示时区
    if (showTimezone) {
      return `${formattedTime} (${timeZoneAbbr})`;
    }

    return formattedTime;
  } catch (error) {
    console.error('时间格式化失败:', error);
    return '--:--';
  }
};

/**
 * 检测时间异常
 * @param checkInTime 签到时间
 * @returns 异常信息或null
 */
export const detectTimeAnomaly = (checkInTime?: string): { type: 'future' | 'too_long' | null, message?: string } => {
  if (!checkInTime) return { type: null };

  try {
    const checkIn = safeParseTime(checkInTime);
    if (!checkIn) return { type: null };

    const now = new Date();
    const diffMs = now.getTime() - checkIn.getTime();

    // 检测未来时间
    if (diffMs < 0) {
      return {
        type: 'future',
        message: '签到时间在未来，请检查系统时间'
      };
    }

    // 检测超长时间（超过24小时）
    if (diffMs > 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      return {
        type: 'too_long',
        message: `已签到超过${hours}小时，建议重新签到`
      };
    }

    return { type: null };
  } catch (error) {
    console.error('时间异常检测失败:', error);
    return { type: null };
  }
};