/**
 * 志愿者工时管理API服务
 */

import { getCurrentToken, getUserInfo } from './authAPI';
import { notifyVolunteerCheckIn, notifyVolunteerCheckOut } from './smartAlertSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 导入新的统一时间服务
import { timeService } from '../utils/UnifiedTimeService';
import { apiCache } from './apiCache';
import { getApiUrl } from '../utils/environment';
import { getUserPermissionLevel } from '../types/userPermissions';

// 保留旧的导入以支持向后兼容（将逐步废弃）
// 移除旧时间系统，统一使用UnifiedTimeService
// 保留parseVolunteerTimestamp别名以兼容现有导出

const getBaseUrl = () => getApiUrl();

// 兼容旧系统的简单包装函数
export const parseVolunteerTimestamp = (timeString: string) => timeService.parseServerTime(timeString);

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
  const cacheData = {
    recordId,
    startTime,
    timestamp: Date.now()
  };
  localCheckInCache.set(userId, cacheData);
  // 同时持久化到AsyncStorage，防止App重启后丢失
  AsyncStorage.setItem(
    `volunteer_checkin_${userId}`,
    JSON.stringify(cacheData)
  ).catch(err => {
    if (__DEV__) {
      console.warn('⚠️ [LOCAL-CACHE] AsyncStorage持久化失败:', err);
    }
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

  // 检查缓存是否过期（24小时 - 作为后端数据缺失的fallback需要更长有效期）
  const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000;
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
 * 从AsyncStorage恢复签到缓存（用于App重启后恢复）
 */
const getLocalCheckInFromStorage = async (userId: number): Promise<string | null> => {
  try {
    const stored = await AsyncStorage.getItem(`volunteer_checkin_${userId}`);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    // 检查是否过期（24小时）
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      await AsyncStorage.removeItem(`volunteer_checkin_${userId}`);
      return null;
    }

    if (__DEV__) {
      console.log('📦 [ASYNC-STORAGE] 从持久化存储恢复签到时间:', {
        userId,
        startTime: parsed.startTime,
        recordId: parsed.recordId
      });
    }
    return parsed.startTime;
  } catch (err) {
    if (__DEV__) {
      console.warn('⚠️ [ASYNC-STORAGE] 读取持久化缓存失败:', err);
    }
    return null;
  }
};

/**
 * 从AsyncStorage恢复完整签到记录（含recordId）
 * 与 getLocalCheckInFromStorage 不同，此函数返回完整的 VolunteerRecord 对象
 * 用于App重启后恢复签退所需的记录ID
 */
const getLocalCheckInRecordFromStorage = async (userId: number): Promise<VolunteerRecord | null> => {
  try {
    const stored = await AsyncStorage.getItem(`volunteer_checkin_${userId}`);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    // 检查是否过期（24小时）
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      await AsyncStorage.removeItem(`volunteer_checkin_${userId}`);
      return null;
    }

    if (!parsed.recordId || !parsed.startTime) return null;

    if (__DEV__) {
      console.log('📦 [ASYNC-STORAGE] 从持久化存储恢复完整签到记录:', {
        userId,
        recordId: parsed.recordId,
        startTime: parsed.startTime
      });
    }
    return {
      id: parsed.recordId,
      userId: userId,
      startTime: parsed.startTime,
      endTime: null,
      type: 1,
      legalName: '',
      status: 1
    };
  } catch (err) {
    if (__DEV__) {
      console.warn('⚠️ [ASYNC-STORAGE] 读取完整签到记录失败:', err);
    }
    return null;
  }
};

/**
 * 公开的本地签到记录获取接口
 * 先查内存缓存，再查AsyncStorage，供外部组件作为API失败的fallback使用
 */
export const getLocalCheckInRecord = async (userId: number): Promise<VolunteerRecord | null> => {
  // 先尝试内存缓存
  const memoryRecord = getLocalCheckIn(userId);
  if (memoryRecord) return memoryRecord;

  // 再尝试AsyncStorage
  return await getLocalCheckInRecordFromStorage(userId);
};

/**
 * 清理本地签到信息
 * @param userId 用户ID
 */
const clearLocalCheckIn = (userId: number): void => {
  localCheckInCache.delete(userId);
  AsyncStorage.removeItem(`volunteer_checkin_${userId}`).catch(() => {});
  if (__DEV__) {
    console.log('🧹 [LOCAL-CACHE] 清理签到缓存:', { userId });
  }
};

/**
 * 格式化时间为API需要的格式 (YYYY-MM-DD HH:mm:ss)
 * 统一策略：使用本地时间，后端按接收到的时间直接处理
 */
const formatTimeForAPI = (timeInput: string | Date): string => {
  const date = typeof timeInput === 'string' ? new Date(timeInput) : timeInput;
  // 统一使用本地时间格式，避免时区转换混乱
  return timeService.formatLocalTime(date);
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

    const url = `${getBaseUrl()}/app/hour/recordList${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

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

    const url = `${getBaseUrl()}/app/hour/hourList${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

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
  autoApprovalStatus?: 1,    // 🆕 自动审核状态（1=自动审核通过）
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
    
    // 签退(type=2)需要 endTime，id(记录ID)可选
    if (type === 2) {
      if (!endTime) {
        throw new Error('签退操作缺少endTime参数');
      }
      // 转换时间格式为API期望的格式 (YYYY-MM-DD HH:mm:ss)
      const formattedEndTime = formatTimeForAPI(endTime);
      form.append('endTime', formattedEndTime);
      // id参数：如果有真实记录ID则发送，否则让后端按userId查找
      if (recordId) {
        form.append('id', String(recordId));
      }

      // 添加工作描述（如果提供）
      if (remark) {
        form.append('remark', remark);
      }

      // 🆕 添加自动审核状态（仅在自动审核通过时设置）
      if (autoApprovalStatus === 1) {
        form.append('status', '1');
        console.log('📝 [AUTO-APPROVE] 添加自动审核参数到请求: status=1');
      } else {
        // 不发送status参数，让后端使用默认值（避免-1可能导致的问题）
        console.log('ℹ️ [AUTO-APPROVE] 未满足自动审核条件，不发送status参数');
      }
    }

    // 详细的请求日志（签退时）
    if (__DEV__) {
      if (type === 2) {
        console.log('📤 [API-REQUEST-DETAIL] 签退完整请求参数:', {
          url: `${getBaseUrl()}/app/hour/signRecord`,
          userId,
          type,
          operateUserId,
          operateLegalName,
          endTime,
          recordId,
          remark,
          autoApprovalStatus,
          formData: form.toString()
        });
      } else {
        console.log('[API-REQUEST] 志愿者API请求:', {
          url: `${getBaseUrl()}/app/hour/signRecord`,
          operation: type === 1 ? '签到' : '签退'
        });
      }
    }

    const response = await fetch(`${getBaseUrl()}/app/hour/signRecord`, {
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
        } else if (type === 2 && recordId && endTime) {
          // 🚀 签退成功 - 检查是否需要自动审核
          if (__DEV__) {
            console.log('✅ [VOLUNTEER-CHECKOUT] 签退成功，检查自动审核条件');
          }

          try {
            // 🔍 获取操作用户信息和权限
            const operateUserInfo = await getUserInfo();
            if (operateUserInfo.code === 200 && operateUserInfo.data) {
              const operateUserPermission = getUserPermissionLevel(operateUserInfo.data as any);

              // 📊 获取完整记录以计算工作时长
              const recordResponse = await getLastRecordFromRecordList(userId);
              if (recordResponse.code === 200 && recordResponse.data) {
                const record = recordResponse.data;
                const recordStartTime = record.startTime;

                if (recordStartTime) {
                  // 计算工作时长（小时）
                  const startDate = timeService.parseServerTime(recordStartTime);
                  const endDate = timeService.parseServerTime(endTime);

                  if (startDate && endDate) {
                    const workDurationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

                    // 🔍 检查是否是异常处理
                    const isAbnormalProcessing = remark?.includes('【自动签退】') ||
                                               remark?.includes('【管理员重置】') ||
                                               remark?.includes('【补录】') ||
                                               remark?.includes('异常') ||
                                               remark?.includes('超时');

                    console.log('🔍 [AUTO-APPROVE] 审核条件检查:', {
                      operateUserPermission,
                      workDurationHours: workDurationHours.toFixed(2),
                      isAbnormalProcessing,
                      remark,
                      recordId
                    });

                    // ✅ 自动审核判断
                    const shouldAutoApprove =
                      ['manage', 'part_manage'].includes(operateUserPermission) &&  // 管理员权限
                      workDurationHours <= 8 &&                                    // 8小时内工作
                      !isAbnormalProcessing;                                       // 非异常处理

                    // ℹ️ 自动审核逻辑已移至smartVolunteerSignOut函数
                    // 在API调用前判断并设置status参数
                  }
                }
              }
            }
          } catch (autoApproveError) {
            console.warn('⚠️ [AUTO-APPROVE] 自动审核流程失败:', autoApproveError);
            // 自动审核失败不影响签退主流程
          }
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

/**
 * 智能签退 - 自动判断是否应该审核通过
 */
export const smartVolunteerSignOut = async (
  userId: number,
  operateUserId: number,
  operateLegalName: string,
  endTime: string,
  recordId: number,
  remark?: string
): Promise<APIResponse> => {
  try {
    console.log('🧠 [SMART-SIGNOUT] ========== 开始智能签退流程 ==========');
    console.log('🧠 [SMART-SIGNOUT] 输入参数:', {
      userId,
      operateUserId,
      operateLegalName,
      endTime,
      recordId,
      remark
    });

    // 🔍 获取操作用户权限
    const operateUserInfo = await getUserInfo();
    let shouldAutoApprove = false;

    console.log('👤 [USER-INFO] 获取用户信息结果:', {
      code: operateUserInfo.code,
      hasData: !!operateUserInfo.data
    });

    if (operateUserInfo.code === 200 && operateUserInfo.data) {
      const operateUserPermission = getUserPermissionLevel(operateUserInfo.data as any);
      console.log('🔑 [PERMISSION] 用户权限级别:', operateUserPermission);

      // 📊 获取签到记录以计算工作时长
      try {
        const recordResponse = await getLastRecordFromRecordList(userId);
        if (recordResponse.code === 200 && recordResponse.data) {
          const record = recordResponse.data;

          if (record.startTime) {
            // 计算工作时长
            const startDate = timeService.parseServerTime(record.startTime);
            const endDate = timeService.parseServerTime(endTime);

            if (startDate && endDate) {
              const workDurationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

              // 计算签到时间距离现在的天数
              const now = new Date();
              const daysSinceCheckIn = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

              // 检查是否是异常处理
              const isAbnormalProcessing = remark?.includes('【自动签退】') ||
                                         remark?.includes('【管理员重置】') ||
                                         remark?.includes('异常') ||
                                         remark?.includes('超时');

              // ✅ 自动审核判断
              shouldAutoApprove =
                ['manage', 'part_manage'].includes(operateUserPermission) &&  // 管理员权限
                daysSinceCheckIn <= 7 &&                                     // 签到时间在7天内
                workDurationHours <= 8 &&                                    // 8小时内工作
                !isAbnormalProcessing;                                       // 非异常处理

              console.log('🔍 [SMART-SIGNOUT] ========== 自动审核条件详细检查 ==========');
              console.log('📋 [CHECK-1] 权限检查:', {
                operateUserPermission,
                isManage: operateUserPermission === 'manage',
                isPartManage: operateUserPermission === 'part_manage',
                hasPermission: ['manage', 'part_manage'].includes(operateUserPermission)
              });
              console.log('📅 [CHECK-2] 时间检查:', {
                签到时间: startDate.toISOString(),
                当前时间: now.toISOString(),
                天数差: daysSinceCheckIn.toFixed(1),
                满足7天限制: daysSinceCheckIn <= 7
              });
              console.log('⏱️ [CHECK-3] 工作时长检查:', {
                开始时间: startDate.toISOString(),
                结束时间: endDate.toISOString(),
                工作小时数: workDurationHours.toFixed(2),
                满足8小时限制: workDurationHours <= 8
              });
              console.log('🚨 [CHECK-4] 异常处理检查:', {
                remark,
                包含自动签退: remark?.includes('【自动签退】'),
                包含管理员重置: remark?.includes('【管理员重置】'),
                包含异常: remark?.includes('异常'),
                包含超时: remark?.includes('超时'),
                isAbnormalProcessing
              });
              console.log('✅ [FINAL-RESULT] 最终判断:', {
                shouldAutoApprove,
                reason: shouldAutoApprove ? '✅ 满足自动审核条件' :
                       (!['manage', 'part_manage'].includes(operateUserPermission) ? '❌ 权限不足' :
                        daysSinceCheckIn > 7 ? '❌ 签到时间超过7天' :
                        workDurationHours > 8 ? '❌ 工作时长超过8小时' :
                        isAbnormalProcessing ? '❌ 异常处理记录' : '❌ 未知原因')
              });
              console.log('🔍 ========================================');
            }
          }
        }
      } catch (recordError) {
        console.warn('⚠️ [SMART-SIGNOUT] 获取工作时长失败，使用默认审核流程:', recordError);
      }
    }

    // 🚀 调用签退API，传递自动审核状态
    console.log('🚀 [API-CALL] 准备调用签退API:', {
      userId,
      type: 2,
      operateUserId,
      operateLegalName,
      endTime,
      recordId,
      remark,
      autoApprovalStatus: shouldAutoApprove ? 1 : undefined,
      willAutoApprove: shouldAutoApprove
    });

    const result = await volunteerSignRecord(
      userId,
      2, // 签退
      operateUserId,
      operateLegalName,
      undefined, // startTime
      endTime,
      recordId,
      remark,
      shouldAutoApprove ? 1 : undefined // 条件满足时传递status=1
    );

    console.log('📥 [API-RESPONSE] 签退API返回结果:', {
      code: result.code,
      msg: result.msg,
      success: result.code === 200,
      shouldAutoApprove
    });

    if (result.code === 200 && shouldAutoApprove) {
      console.log('✅ [SMART-SIGNOUT] 智能签退成功，已自动审核通过');
    } else if (result.code === 200 && !shouldAutoApprove) {
      console.log('⏸️ [SMART-SIGNOUT] 签退成功，需要人工审核');
    }

    return result;

  } catch (error) {
    console.error('❌ [SMART-SIGNOUT] 智能签退失败:', error);
    throw error;
  }
};

/**
 * 计算工作时长
 * @deprecated 请使用 timeService.calculateDuration() 替代
 * 🚀 修复：安全的工作时长计算，处理时区问题
 */
const calculateWorkDuration = (startTime: string | null | undefined, endTime: string | null | undefined): string => {
  // 使用新的统一时间服务
  const startDate = startTime ? timeService.parseServerTime(startTime) : null;
  const endDate = endTime ? timeService.parseServerTime(endTime) : null;

  if (!startDate || !endDate) {
    return '未知时长';
  }

  const duration = timeService.calculateDuration(startDate, endDate);

  // 处理超时12小时的特殊情况
  if (duration.isOvertime) {
    return '超过12小时（需要自动签退）';
  }

  return duration.display;
};


/**
 * 获取志愿者最后记录 - 简化版，专注于重置功能需求
 * URL: /app/hour/lastRecordList
 */
export const getLastVolunteerRecord = async (userId: number): Promise<APIResponse<VolunteerRecord>> => {
  if (__DEV__) {
    console.log('[VOLUNTEER-API] 获取志愿者最后记录 (简化版):', { userId });
  }

  try {
    const token = await getCurrentToken();
    if (!token) {
      return { code: 401, msg: '用户未登录' };
    }

    console.log('📡 [API] 直接调用lastRecordList接口...');

    const response = await fetch(`${getBaseUrl()}/app/hour/lastRecordList?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('❌ [API] lastRecordList HTTP错误:', response.status);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 [API] lastRecordList响应:', {
      code: data.code,
      hasData: !!data.data,
      dataId: data.data?.id
    });

    if (data.code === 200) {
      return data;
    }

    // 如果主接口失败，尝试recordList接口
    console.log('🔄 [API] 主接口失败，尝试备用接口...');
    return await getLastRecordFromRecordList(userId);

  } catch (error) {
    console.warn('⚠️ [API] lastRecordList失败, 尝试备用接口:', error.message);
    try {
      return await getLastRecordFromRecordList(userId);
    } catch (fallbackError) {
      console.warn('⚠️ [API] 备用接口也失败:', fallbackError.message);
      return {
        code: 500,
        msg: `无法获取志愿者记录: ${error.message}`,
        data: null
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

    const response = await fetch(`${getBaseUrl()}/app/hour/recordList?userId=${userId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 200 && result.rows && result.rows.length > 0) {
        // 过滤掉没有ID的记录
        const validRecords = result.rows.filter((r: any) => r.id);
        if (validRecords.length === 0) {
          return { code: 404, msg: '无有效签到记录' };
        }
        // 优先查找未签退的活跃记录（endTime为空）
        const activeRecords = validRecords.filter((r: any) => !r.endTime && r.endTime !== 0);
        const recordsToUse = activeRecords.length > 0 ? activeRecords : validRecords;
        const sortedRecords = recordsToUse.sort((a: any, b: any) => b.id - a.id);
        const lastRecord = sortedRecords[0];

        console.log(`✅ [recordList-fallback] 用户${userId}最新记录:`, {
          id: lastRecord.id,
          endTime: lastRecord.endTime,
          startTime: lastRecord.startTime,
          isActive: !lastRecord.endTime,
          totalRecords: validRecords.length,
          activeRecords: activeRecords.length,
        });
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
    const response = await fetch(`${getBaseUrl()}/app/user/searchByPhone?phone=${phoneNumber}`, {
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

    // 🕐 统一策略：使用本地时间格式
    const now = new Date();
    const currentTime = timeService.formatLocalTime(now);

    // 🔧 详细调试：记录本地时间
    if (__DEV__) {
      console.log('🔍 [CHECKIN-TIME-DEBUG] 本地时间生成:', {
        originalTime: now.toISOString(),
        originalLocal: now.toLocaleString(),
        generatedLocalTime: currentTime,
        note: '后端期望接收本地时间，不需要转换'
      });
    }

    // 验证时间格式正确性 - 本地时间不需要时区转换
    const testParse = new Date(currentTime.replace(' ', 'T'));
    if (isNaN(testParse.getTime())) {
      if (__DEV__) {
        console.error('❌ [CHECKIN-TIME] 生成的时间格式无效:', {
          generated: currentTime,
          testParse: testParse.toString()
        });
      }
      throw new Error('系统时间格式错误');
    }

    // 🚨 验证时间合理性
    const timeDiffMinutes = (testParse.getTime() - now.getTime()) / (1000 * 60);

    if (__DEV__) {
      console.log('⏰ [TIME-VALIDATION] 时间验证:', {
        localTime: now.toISOString(),
        generatedLocalTime: testParse.toISOString(),
        differenceMinutes: timeDiffMinutes.toFixed(1),
        isReasonable: Math.abs(timeDiffMinutes) < 1 // 本地时间应该几乎一致
      });
    }

    // 如果时间差异超过1分钟，说明有问题
    if (Math.abs(timeDiffMinutes) > 1) {
      const errorMsg = `本地时间生成异常，差异${timeDiffMinutes.toFixed(1)}分钟`;
      if (__DEV__) {
        console.error('❌ [TIME-GENERATION-ERROR]', errorMsg);
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
        // 尝试从API响应中获取记录ID
        let recordId = result.data?.id || result.data?.recordId;
        if (!recordId) {
          // API未返回记录ID，从recordList接口获取真实ID
          try {
            const recordListResponse = await getLastRecordFromRecordList(userId);
            if (recordListResponse.code === 200 && recordListResponse.data?.id) {
              recordId = recordListResponse.data.id;
              if (__DEV__) {
                console.log('✅ [CHECKIN-ID-RECOVERY] 从recordList获取到真实记录ID:', recordId);
              }
            }
          } catch (fetchError) {
            if (__DEV__) {
              console.warn('⚠️ [CHECKIN-ID-RECOVERY] 获取真实记录ID失败:', fetchError);
            }
          }
          // 最后手段：使用时间戳作为临时ID（仅用于本地状态追踪）
          if (!recordId) {
            recordId = Date.now() % 1000000;
            if (__DEV__) {
              console.warn('⚠️ [LOCAL-CACHE] 使用临时ID (非真实记录ID):', recordId);
            }
          }
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
    
    let lastRecord: VolunteerRecord;

    if (lastRecordResponse.code !== 200 || !lastRecordResponse.data) {
      // API失败，尝试从本地缓存恢复记录
      if (__DEV__) {
        console.warn('⚠️ [VOLUNTEER-CHECKOUT] API获取记录失败，尝试本地缓存恢复:', {
          code: lastRecordResponse.code,
          message: lastRecordResponse.msg,
          userId: userId
        });
      }

      // 尝试内存缓存
      let cachedRecord = getLocalCheckIn(userId);

      // 尝试AsyncStorage持久化缓存
      if (!cachedRecord) {
        cachedRecord = await getLocalCheckInRecordFromStorage(userId);
      }

      if (cachedRecord && cachedRecord.id) {
        lastRecord = cachedRecord;
        if (__DEV__) {
          console.log('✅ [VOLUNTEER-CHECKOUT] 从本地缓存恢复签到记录:', {
            recordId: lastRecord.id,
            startTime: lastRecord.startTime
          });
        }
      } else {
        // 所有方案均失败
        let userMessage = lastRecordResponse.msg;
        if (userMessage === '无签到记录' || userMessage === '暂时无法获取签到记录，请稍后再试或联系管理员') {
          userMessage = '未找到您的签到记录。请确认您已成功签到，或稍后再试。如问题持续存在，请联系管理员。';
        }

        const error = new Error(userMessage);
        if (__DEV__) {
          console.error('❌ [VOLUNTEER-CHECKOUT] 获取记录失败且无本地缓存:', {
            code: lastRecordResponse.code,
            message: lastRecordResponse.msg,
            userId: userId,
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
    } else {
      lastRecord = lastRecordResponse.data;
    }

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
      // 后端返回startTime为null，尝试从本地缓存恢复
      if (__DEV__) {
        console.warn('⚠️ [VOLUNTEER-CHECKOUT] 后端签到时间为null，尝试本地缓存恢复:', {
          recordId: lastRecord.id,
          userId: lastRecord.userId,
          status: lastRecord.status,
          type: lastRecord.type
        });
      }

      // 优先从内存缓存恢复
      const localRecord = getLocalCheckIn(userId);
      let recoveredStartTime: string | null = localRecord?.startTime || null;

      // 内存缓存没有，尝试AsyncStorage持久化存储
      if (!recoveredStartTime) {
        recoveredStartTime = await getLocalCheckInFromStorage(userId);
      }

      if (recoveredStartTime) {
        lastRecord.startTime = recoveredStartTime;
        if (__DEV__) {
          console.log('✅ [VOLUNTEER-CHECKOUT] 成功从本地缓存恢复签到时间:', {
            recoveredStartTime,
            recordId: lastRecord.id
          });
        }
      } else {
        const error = new Error('检测到异常的签到记录（签到时间为空），请重新签到');
        if (__DEV__) {
          console.error('❌ [VOLUNTEER-CHECKOUT] 签到时间为null且无本地缓存:', {
            recordId: lastRecord.id,
            userId: lastRecord.userId,
            status: lastRecord.status,
            type: lastRecord.type
          });
        }
        throw error;
      }
    }

    if (lastRecord.startTime) {
      let parsedTime;
      const rawValue = lastRecord.startTime;
      const now = new Date();

      // 🔍 详细调试：记录原始数据
      if (__DEV__) {
        console.log('🔍 [TIME-PARSE-DEBUG] 开始时间解析:', {
          rawValue,
          rawType: typeof rawValue,
          rawLength: String(rawValue).length,
          currentTime: now.toISOString()
        });
      }

      // 使用统一的解析函数
      try {
        // 使用新的统一时间服务解析
        parsedTime = timeService.parseServerTime(rawValue);
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
            console.warn('⚠️ [TIME-ANOMALY] 签到时间在未来，使用当前时间作为回退:', {
              parsedTime: parsedTime.toISOString(),
              now: now.toISOString(),
              rawValue
            });
          }

          // 简单回退：如果时间在未来，使用当前时间前5分钟作为合理的签到时间
          parsedTime = new Date(now.getTime() - 5 * 60 * 1000);
        }

        // 🔧 更新为标准化的本地时间格式（与后端一致）
        lastRecord.startTime = timeService.formatForServer(parsedTime);
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
    
    // 验证记录有效性 - 尝试从本地缓存恢复缺失的记录ID
    if (!lastRecord.id) {
      if (__DEV__) {
        console.warn('⚠️ [VOLUNTEER-CHECKOUT] 记录ID缺失，尝试从本地缓存恢复...');
      }

      // 尝试内存缓存
      const cachedRecord = getLocalCheckIn(userId);
      if (cachedRecord?.id) {
        lastRecord.id = cachedRecord.id;
        if (__DEV__) {
          console.log('✅ [VOLUNTEER-CHECKOUT] 从内存缓存恢复记录ID:', cachedRecord.id);
        }
      } else {
        // 尝试AsyncStorage
        const storedRecord = await getLocalCheckInRecordFromStorage(userId);
        if (storedRecord?.id) {
          lastRecord.id = storedRecord.id;
          if (__DEV__) {
            console.log('✅ [VOLUNTEER-CHECKOUT] 从AsyncStorage恢复记录ID:', storedRecord.id);
          }
        }
      }

      // 所有缓存都没有，才报错
      if (!lastRecord.id) {
        const error = new Error('签到记录ID缺失，请尝试重新签到');
        console.error('❌ [VOLUNTEER-CHECKOUT] ID验证失败且无缓存可恢复:', error);
        throw error;
      }
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
      signInTime = timeService.parseServerTime(lastRecord.startTime);
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

      // 🕐 统一策略：使用本地时间格式
      const actualTimeString = timeService.formatLocalTime(currentTime);
      
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
    // 🕐 统一策略：使用本地时间格式
    const normalTimeString = timeService.formatLocalTime(currentTime);

    console.log('📅 [VOLUNTEER-CHECKOUT] 生成标准化签退时间:', {
      formattedTime: normalTimeString
    });
    
    console.log('🚀 [VOLUNTEER-CHECKOUT] 准备调用正常签退API:', {
      userId,
      type: 2,
      operateUserId,
      operateLegalName,
      endTime: normalTimeString,
      recordId: lastRecord.id
    });
    
    // 🆕 使用智能签退，自动判断审核状态
    let result = await smartVolunteerSignOut(
      userId,
      operateUserId,
      operateLegalName,
      normalTimeString, // endTime
      lastRecord.id, // recordId
      remark // 传递工作描述
    );

    console.log('📋 [VOLUNTEER-CHECKOUT] 签退API返回结果:', result);

    // 🔄 如果带recordId签退失败，尝试不带recordId（让后端按userId查找活跃记录）
    if (result.code !== 200 && result.msg?.includes('暂无需要签退的记录')) {
      console.warn('⚠️ [VOLUNTEER-CHECKOUT] 带recordId签退失败，尝试不带recordId重试...');
      result = await volunteerSignRecord(
        userId,
        2,
        operateUserId,
        operateLegalName,
        undefined, // startTime
        normalTimeString, // endTime
        undefined, // recordId - 不传，让后端自行查找
        remark
      );
      console.log('📋 [VOLUNTEER-CHECKOUT] 不带recordId重试结果:', result);
    }

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
 * 简化的重置状态函数 - 直接调用API，跳过复杂验证
 * 用于解决长期签到状态异常问题
 */
export const forceResetVolunteerStatus = async (
  userId: number,
  operateUserId: number,
  operateLegalName: string,
  recordId: number
): Promise<APIResponse> => {
  try {
    console.log('🚨 [FORCE-RESET] 开始强制重置用户状态:', {
      userId,
      operateUserId,
      operateLegalName,
      recordId
    });

    if (!userId || !operateUserId || !recordId) {
      throw new Error('重置参数缺失: userId, operateUserId, recordId 均不能为空');
    }

    // 直接调用签退API，跳过所有复杂的验证逻辑
    const currentTime = new Date();
    const endTime = timeService.formatLocalTime(currentTime);

    console.log('📅 [FORCE-RESET] 使用重置时间:', endTime);

    const result = await volunteerSignRecord(
      userId,
      2, // 签退
      operateUserId,
      operateLegalName,
      undefined, // startTime
      endTime,
      recordId,
      `【管理员重置】长期签到状态异常，强制重置（操作人：${operateLegalName}）`
    );

    console.log('📊 [FORCE-RESET] 重置结果:', {
      code: result.code,
      msg: result.msg,
      success: result.code === 200
    });

    if (result.code === 200) {
      // 清理本地缓存
      clearLocalCheckIn(userId);
      console.log('✅ [FORCE-RESET] 状态重置成功，已清理本地缓存');
    }

    return result;

  } catch (error) {
    console.error('❌ [FORCE-RESET] 强制重置失败:', error);
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

    const response = await fetch(`${getBaseUrl()}/app/hour/userHour?userId=${userId}`, {
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

    const response = await fetch(`${getBaseUrl()}/app/hour/recordList?userId=${userId}`, {
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
      if (!record.id) continue;
      if (!record.endTime && record.startTime) {
        const signInTime = timeService.parseServerTime(record.startTime);
        if (!signInTime) continue;
        const workDurationHours = (now.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
        
        if (workDurationHours > 12) {
          console.log(`🚨 [AUTO-CHECKOUT] 发现超时用户: ${record.legalName}，时长: ${workDurationHours.toFixed(1)}小时`);
          
          try {
            // 执行自动签退，设置为12小时后的时间
            const autoSignOutTime = new Date(signInTime.getTime() + 12 * 60 * 60 * 1000);
            // 🕐 使用北京时间格式（修复时区混淆）
            const autoTimeString = timeService.formatLocalTime(autoSignOutTime);
            
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
 * 🆕 补录工时功能（Time Entry）
 * 该功能允许管理员为志愿者补录工时记录
 * 通过调用两次签到签退接口（type=1签到 + type=2签退）完成一条完整的补录记录
 * @param userId 目标志愿者用户ID
 * @param operateUserId 操作用户ID（当前管理员）
 * @param operateLegalName 操作用户姓名
 * @param startTime 开始时间（ISO字符串格式）
 * @param endTime 结束时间（ISO字符串格式）
 * @param remark 工作描述（会自动添加【补录】前缀）
 * @returns 返回操作结果
 */
export const performTimeEntry = async (
  userId: number,
  operateUserId: number,
  operateLegalName: string,
  startTime: string,
  endTime: string,
  remark: string
): Promise<{ success: boolean; message: string; recordId?: number }> => {
  try {
    console.log('📝 [TIME-ENTRY] 开始补录工时:', {
      userId,
      startTime,
      endTime,
      remark
    });

    // 第一步：调用签到接口（type=1）
    const checkInResult = await volunteerSignRecord(
      userId,
      1, // type=1 签到
      operateUserId,
      operateLegalName,
      startTime, // 提供开始时间
      undefined,
      undefined
    );

    if (checkInResult.code !== 200) {
      console.error('❌ [TIME-ENTRY] 签到失败:', checkInResult.msg);
      return {
        success: false,
        message: checkInResult.msg || '补录签到失败'
      };
    }

    // 获取签到记录ID（从返回数据或最新记录中获取）
    let recordId: number | undefined;

    // 尝试从返回数据中获取记录ID
    if (checkInResult.data && checkInResult.data.id) {
      recordId = checkInResult.data.id;
    }

    // Fallback 1: 通过 lastRecordList 获取（内部已含 recordList 备用）
    if (!recordId) {
      try {
        const lastRecord = await getLastVolunteerRecord(userId);
        if (lastRecord.code === 200 && lastRecord.data) {
          recordId = lastRecord.data.id;
        }
      } catch (error) {
        console.warn('⚠️ [TIME-ENTRY] lastRecordList获取失败:', error);
      }
    }

    // Fallback 2: 直接调用 recordList 接口（绕过可能有SQL bug的lastRecordList）
    if (!recordId) {
      try {
        const token = await getCurrentToken();
        if (token) {
          const response = await fetch(`${getBaseUrl()}/app/hour/recordList?userId=${userId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const result = await response.json();
            if (result.code === 200 && result.rows && result.rows.length > 0) {
              const sortedRecords = result.rows.sort((a: any, b: any) => b.id - a.id);
              recordId = sortedRecords[0].id;
              console.log('✅ [TIME-ENTRY] 通过recordList备用方案获取到记录ID:', recordId);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [TIME-ENTRY] recordList备用方案也失败:', error);
      }
    }

    if (!recordId) {
      console.error('❌ [TIME-ENTRY] 所有方案均无法获取签到记录ID');
      return {
        success: false,
        message: '无法获取签到记录ID，请重试'
      };
    }

    console.log('✅ [TIME-ENTRY] 签到成功，记录ID:', recordId);

    // 🔍 判断Time Entry是否应该自动审核
    let shouldAutoApprove = false;
    try {
      const operateUserInfo = await getUserInfo();
      if (operateUserInfo.code === 200 && operateUserInfo.data) {
        const operateUserPermission = getUserPermissionLevel(operateUserInfo.data as any);

        // 计算补录时间距离现在的天数
        const entryStartDate = timeService.parseServerTime(startTime);
        const now = new Date();
        const daysSinceEntry = entryStartDate ?
          (now.getTime() - entryStartDate.getTime()) / (1000 * 60 * 60 * 24) : 999;

        // 计算工作时长
        const startDate = timeService.parseServerTime(startTime);
        const endDate = timeService.parseServerTime(endTime);
        const workDurationHours = (startDate && endDate) ?
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60) : 999;

        // Time Entry自动审核判断
        shouldAutoApprove =
          ['manage', 'part_manage'].includes(operateUserPermission) &&  // 管理员权限
          daysSinceEntry <= 7 &&                                       // 7天内补录
          workDurationHours <= 8;                                      // 8小时内工作

        console.log('🔍 [TIME-ENTRY-SMART] 补录自动审核条件检查:', {
          operateUserPermission,
          daysSinceEntry: daysSinceEntry.toFixed(1),
          workDurationHours: workDurationHours.toFixed(2),
          shouldAutoApprove,
          reason: shouldAutoApprove ? '满足自动审核条件' :
                 (!['manage', 'part_manage'].includes(operateUserPermission) ? '内部员工需要审核' :
                  daysSinceEntry > 7 ? '超期补录需要审核' :
                  workDurationHours > 8 ? '长时间工作需要审核' : '其他原因')
        });
      }
    } catch (approvalCheckError) {
      console.warn('⚠️ [TIME-ENTRY-SMART] 自动审核条件检查失败:', approvalCheckError);
    }

    // 第二步：调用签退接口（type=2），传递自动审核状态
    const checkOutResult = await volunteerSignRecord(
      userId,
      2, // type=2 签退
      operateUserId,
      operateLegalName,
      undefined,
      endTime, // 提供结束时间
      recordId, // 使用第一步返回的记录ID
      remark, // 包含【补录】前缀的工作描述
      shouldAutoApprove ? 1 : undefined // 符合条件时自动审核通过
    );

    if (checkOutResult.code !== 200) {
      console.error('❌ [TIME-ENTRY] 签退失败:', checkOutResult.msg);
      return {
        success: false,
        message: `签到成功但签退失败: ${checkOutResult.msg || '请重试签退'}`,
        recordId // 返回记录ID以便重试
      };
    }

    console.log('✅ [TIME-ENTRY] 补录成功');

    // ℹ️ 自动审核逻辑已集成到签退API调用中（smartVolunteerSignOut函数）
    if (shouldAutoApprove) {
      console.log('🎯 [TIME-ENTRY] 本次补录已自动审核通过');
    } else {
      console.log('ℹ️ [TIME-ENTRY] 本次补录需要人工审核');
    }

    // 清除缓存，确保数据刷新
    try {
      apiCache.clearByPattern(`volunteerRecord:${userId}`);
      apiCache.clearKey('volunteerRecords');
      apiCache.clearKey('volunteerHours');
    } catch (error) {
      console.warn('[TIME-ENTRY] 清除缓存失败:', error);
    }

    return {
      success: true,
      message: '补录成功',
      recordId
    };

  } catch (error) {
    console.error('❌ [TIME-ENTRY] 补录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '补录失败，请重试'
    };
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
        
        const recordDate = timeService.parseServerTime(record.startTime);
        if (!recordDate) return false;
        return recordDate >= startTime && recordDate <= endTime;
      });
      
      // 按时间排序 (最新的在前)
      filteredRecords.sort((a: VolunteerRecord, b: VolunteerRecord) => {
        const timeA = timeService.parseServerTime(a.startTime);
        const timeB = timeService.parseServerTime(b.startTime);
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
 * @deprecated 已废弃，使用 timeService.formatForDisplay() 替代
 * 格式化时间显示，带时区信息
 * @param dateString ISO时间字符串
 * @param showTimezone 是否显示时区（已废弃，统一使用本地时间显示）
 * @returns 格式化的时间字符串
 */
export const formatVolunteerTimeWithTimezone = (dateString?: string, showTimezone: boolean = false): string => {
  if (!dateString) return '--:--';

  try {
    // 统一使用 timeService 进行时间处理
    const date = timeService.parseServerTime(dateString);
    if (!date) return '--:--';

    // 直接返回本地时间格式，不处理时区显示
    return timeService.formatForDisplay(date, { showTime: true });
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
    const checkIn = timeService.parseServerTime(checkInTime);
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