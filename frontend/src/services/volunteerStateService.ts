/**
 * 志愿者状态管理统一服务
 * 解决代码重复和状态管理一致性问题
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 持久化存储Key
const CHECKIN_TIMES_STORAGE_KEY = 'vg_volunteer_checkin_times';

// 志愿者状态类型
export type VolunteerStatus = 'not_checked_in' | 'checked_in' | 'checked_out';

// 志愿者信息接口
export interface VolunteerInfo {
  id: string;
  userId: number;
  name: string;
  phone?: string;
  school?: string;
  status: VolunteerStatus;
  checkInTime?: string;
  checkOutTime?: string;
  lastCheckInTime?: string;
  lastCheckOutTime?: string;
  totalHours?: number;
  currentRecordId?: number;
}

/**
 * 志愿者状态管理类
 */
export class VolunteerStateService {
  private static persistedCheckins: Record<number, string> = {};
  private static listeners: Set<() => void> = new Set();

  /**
   * 初始化服务，加载持久化数据
   */
  static async initialize(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(CHECKIN_TIMES_STORAGE_KEY);
      if (raw) {
        this.persistedCheckins = JSON.parse(raw);
        console.log('📱 [VolunteerState] 加载持久化数据:', this.persistedCheckins);
      }
    } catch (error) {
      console.warn('📱 [VolunteerState] 加载持久化数据失败:', error);
    }
  }

  /**
   * 持久化签到时间
   */
  static async persistCheckinTime(userId: number, startTime: string | null): Promise<void> {
    try {
      const next = { ...this.persistedCheckins };
      if (startTime) {
        next[userId] = startTime;
      } else {
        delete next[userId];
      }
      
      this.persistedCheckins = next;
      await AsyncStorage.setItem(CHECKIN_TIMES_STORAGE_KEY, JSON.stringify(next));
      
      // 通知监听器
      this.notifyListeners();
      
      console.log('💾 [VolunteerState] 保存持久化时间:', { userId, startTime });
    } catch (error) {
      console.warn('💾 [VolunteerState] 保存持久化时间失败:', error);
    }
  }

  /**
   * 获取用户的持久化签到时间
   */
  static getPersistedCheckinTime(userId: number): string | null {
    return this.persistedCheckins[userId] || null;
  }

  /**
   * 计算当前本次时长（分钟）
   */
  static getCurrentDurationMinutes(volunteer: VolunteerInfo, currentTime: Date): number {
    const startTime = volunteer.checkInTime || this.getPersistedCheckinTime(volunteer.userId);
    if (!startTime) return 0;
    
    try {
      let startDate: Date;
      
      // 处理不同时间格式
      if (startTime.includes(' ')) {
        // "YYYY-MM-DD HH:mm:ss" 格式（本地时间）
        const isoTime = startTime.replace(' ', 'T') + (startTime.includes('+') ? '' : '+08:00');
        startDate = new Date(isoTime);
      } else if (startTime.includes('T') && (startTime.includes('Z') || startTime.includes('+'))) {
        // 标准ISO格式（已包含时区信息）- 直接解析，不要额外添加时区
        startDate = new Date(startTime);
      } else {
        // 其他格式尝试直接解析
        startDate = new Date(startTime);
      }
      
      if (isNaN(startDate.getTime())) {
        console.warn('🕐 [VolunteerState] 无效时间格式:', startTime);
        return 0;
      }
      
      const diffMs = currentTime.getTime() - startDate.getTime();
      const minutes = Math.max(0, Math.floor(diffMs / 60000));
      
      // 调试信息
      console.log('🕐 [VolunteerState] 时长计算详情:', {
        originalTime: startTime,
        parsedTime: startDate.toISOString(),
        currentTime: currentTime.toISOString(),
        diffMs,
        minutes
      });
      
      return minutes;
    } catch (error) {
      console.warn('🕐 [VolunteerState] 时长计算错误:', error);
      return 0;
    }
  }

  /**
   * 格式化时长显示
   */
  static formatDuration(minutes: number, useEnglish = false): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (useEnglish) {
      if (hours > 0) {
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      } else {
        return `${mins}m`;
      }
    } else {
      if (hours > 0) {
        return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
      } else {
        return `${mins}分钟`;
      }
    }
  }

  /**
   * 格式化中文日期时间
   */
  static formatChineseDateTime(timeString: string): string {
    try {
      let date: Date;
      
      // 处理不同时间格式
      if (timeString.includes(' ')) {
        // "YYYY-MM-DD HH:mm:ss" 格式（本地时间）
        const isoTime = timeString.replace(' ', 'T') + (timeString.includes('+') ? '' : '+08:00');
        date = new Date(isoTime);
      } else if (timeString.includes('T') && (timeString.includes('Z') || timeString.includes('+'))) {
        // 标准ISO格式（已包含时区信息）- 直接解析，不要额外添加时区
        date = new Date(timeString);
      } else {
        // 其他格式尝试直接解析
        date = new Date(timeString);
      }
      
      if (isNaN(date.getTime())) {
        return '--:--';
      }
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const time = date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      if (isToday) {
        return `今日 ${time}`;
      } else {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}/${month}/${day} ${time}`;
      }
    } catch (error) {
      console.warn('🕐 [VolunteerState] 时间格式化错误:', error);
      return '--:--';
    }
  }

  /**
   * 验证签退前置条件
   */
  static validateCheckOutConditions(volunteer: VolunteerInfo): {
    isValid: boolean;
    error?: string;
  } {
    if (!volunteer.userId) {
      return { isValid: false, error: '无法识别用户身份' };
    }
    
    const checkInTime = volunteer.checkInTime || this.getPersistedCheckinTime(volunteer.userId);
    if (!checkInTime) {
      return { isValid: false, error: '未找到签到时间记录' };
    }
    
    // 🚨 FIX: 检查两种可能的状态字段名称
    const currentStatus = (volunteer as any).checkInStatus || volunteer.status;
    console.log('🔍 [VALIDATION-DEBUG] 签退验证状态检查:', {
      volunteerName: volunteer.name,
      userId: volunteer.userId,
      status: volunteer.status,
      checkInStatus: (volunteer as any).checkInStatus,
      finalStatus: currentStatus,
      checkInTime: checkInTime
    });
    
    if (currentStatus !== 'checked_in') {
      return { 
        isValid: false, 
        error: `用户当前未处于签到状态 (当前状态: ${currentStatus || 'undefined'})` 
      };
    }
    
    return { isValid: true };
  }

  /**
   * 验证签到前置条件
   */
  static validateCheckInConditions(volunteer: VolunteerInfo): {
    isValid: boolean;
    error?: string;
  } {
    if (!volunteer.userId) {
      return { isValid: false, error: '无法识别用户身份' };
    }
    
    // 🚨 FIX: 检查两种可能的状态字段名称
    const currentStatus = (volunteer as any).checkInStatus || volunteer.status;
    console.log('🔍 [VALIDATION-DEBUG] 签到验证状态检查:', {
      volunteerName: volunteer.name,
      userId: volunteer.userId,
      status: volunteer.status,
      checkInStatus: (volunteer as any).checkInStatus,
      finalStatus: currentStatus
    });
    
    if (currentStatus === 'checked_in') {
      return { isValid: false, error: '用户已经处于签到状态' };
    }
    
    return { isValid: true };
  }

  /**
   * 计算工时统计
   */
  static calculateWorkHours(checkInTime: string, checkOutTime?: string): {
    duration: number; // 分钟
    hours: number;    // 小时（小数）
    display: string;  // 显示文本
  } {
    try {
      const start = new Date(checkInTime);
      const end = checkOutTime ? new Date(checkOutTime) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { duration: 0, hours: 0, display: '0小时' };
      }
      
      const duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
      const hours = duration / 60;
      const display = this.formatDuration(duration);
      
      return { duration, hours, display };
    } catch (error) {
      console.warn('🕐 [VolunteerState] 工时计算错误:', error);
      return { duration: 0, hours: 0, display: '0小时' };
    }
  }

  /**
   * 添加状态变更监听器
   */
  static addListener(callback: () => void): void {
    this.listeners.add(callback);
  }

  /**
   * 移除状态变更监听器
   */
  static removeListener(callback: () => void): void {
    this.listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   */
  private static notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('🔔 [VolunteerState] 监听器回调错误:', error);
      }
    });
  }

  /**
   * 清理服务（组件卸载时调用）
   */
  static cleanup(): void {
    this.listeners.clear();
  }

  /**
   * 获取所有持久化数据（调试用）
   */
  static getPersistedData(): Record<number, string> {
    return { ...this.persistedCheckins };
  }
}