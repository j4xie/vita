/**
 * 统一时间管理服务
 * 解决多个页面重复时间管理导致的冲突问题
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

class TimeManagerService {
  private static instance: TimeManagerService;
  private listeners: Set<(time: Date) => void> = new Set();
  private currentTime: Date = new Date();
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  private constructor() {
    this.start();
  }

  static getInstance(): TimeManagerService {
    if (!TimeManagerService.instance) {
      TimeManagerService.instance = new TimeManagerService();
    }
    return TimeManagerService.instance;
  }

  /**
   * 开始全局时间更新
   */
  private start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.timer = setInterval(() => {
      this.currentTime = new Date();
      this.notifyListeners();
    }, 1000);
    
    console.log('⏰ 全局时间管理器已启动');
  }

  /**
   * 停止全局时间更新
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('⏰ 全局时间管理器已停止');
  }

  /**
   * 获取当前时间
   */
  getCurrentTime(): Date {
    return this.currentTime;
  }

  /**
   * 添加时间更新监听器
   */
  addListener(callback: (time: Date) => void): () => void {
    this.listeners.add(callback);
    
    // 立即调用一次回调
    callback(this.currentTime);
    
    console.log(`⏰ 新增时间监听器，当前监听器数量: ${this.listeners.size}`);
    
    // 返回取消订阅函数
    return () => {
      this.removeListener(callback);
    };
  }

  /**
   * 移除时间更新监听器
   */
  removeListener(callback: (time: Date) => void) {
    this.listeners.delete(callback);
    console.log(`⏰ 移除时间监听器，剩余监听器数量: ${this.listeners.size}`);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTime);
      } catch (error) {
        console.error('⏰ 时间监听器回调错误:', error);
      }
    });
  }

  /**
   * 生成API用的时间格式 (YYYY-MM-DD HH:mm:ss) - 使用本地时间
   */
  static getAPITimeFormat(date: Date = new Date()): string {
    // 🚨 FIX: 使用本地时间而不是UTC时间
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 统一的时间差计算（分钟）
   */
  static getTimeDifferenceMinutes(startTime: string | Date, endTime: Date = new Date()): number {
    try {
      const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
      
      if (isNaN(start.getTime()) || isNaN(endTime.getTime())) {
        console.warn('⏰ 时间格式无效:', { startTime, endTime });
        return 0;
      }
      
      const diffMs = endTime.getTime() - start.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60)));
    } catch (error) {
      console.error('⏰ 计算时间差错误:', error);
      return 0;
    }
  }

  /**
   * 格式化时长显示
   */
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  }

  /**
   * 检查设备时间合理性（时区无关）
   * 用于志愿者签到前的基本时间验证
   */
  static async validateDeviceTime(): Promise<{ isValid: boolean; info?: string; warning?: string }> {
    try {
      const deviceTime = new Date();
      
      // 🚨 检查是否在模拟器环境
      const isSimulator = __DEV__ && Platform.OS === 'ios';
      
      // 基本的时间合理性检查
      const currentYear = deviceTime.getFullYear();
      const currentMonth = deviceTime.getMonth() + 1;
      const currentDate = deviceTime.getDate();
      
      // 年份检查
      if (currentYear < 2024 || currentYear > 2030) {
        return {
          isValid: false,
          warning: `设备年份异常：${currentYear}年，请检查设备时间设置`
        };
      }
      
      // 月份和日期基本检查
      if (currentMonth < 1 || currentMonth > 12 || currentDate < 1 || currentDate > 31) {
        return {
          isValid: false,
          warning: `设备日期异常：${currentYear}-${currentMonth}-${currentDate}`
        };
      }
      
      // 🚨 将时区检测包装在独立的try-catch中
      let timezoneInfo = '';
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = deviceTime.getTimezoneOffset();
        const offsetHours = Math.abs(offset / 60);
        const offsetSign = offset <= 0 ? '+' : '-';
        timezoneInfo = `设备时区: ${timezone} (UTC${offsetSign}${offsetHours})`;
      } catch (timezoneError) {
        console.warn('⚠️ [TIME-VALIDATION] 时区检测失败，但不影响基础验证:', timezoneError);
        timezoneInfo = isSimulator ? '模拟器环境，跳过时区检测' : '时区检测失败';
      }
      
      return { 
        isValid: true,
        info: `${timezoneInfo}, 当前时间: ${TimeManagerService.getAPITimeFormat(deviceTime)}`
      };
    } catch (error) {
      console.error('🚨 [TIME-VALIDATION] 时间验证异常:', error);
      
      // 🚨 在模拟器环境下更宽松的处理
      if (__DEV__ && Platform.OS === 'ios') {
        console.log('📱 [TIME-VALIDATION] 模拟器环境，跳过严格时间验证');
        return {
          isValid: true,
          info: '模拟器环境，时间验证已跳过'
        };
      }
      
      return {
        isValid: false,
        warning: '无法验证设备时间，请检查系统时间设置'
      };
    }
  }

  /**
   * 清理所有监听器（用于应用退出时）
   */
  cleanup() {
    this.listeners.clear();
    this.stop();
    console.log('⏰ 时间管理器已清理');
  }
}

// 导出单例实例
export const timeManager = TimeManagerService.getInstance();

// 导出常用的静态方法（已移除getFrontendTimeFormat，使用timeService.formatForServer替代）
export const { getAPITimeFormat, getTimeDifferenceMinutes, formatDuration, validateDeviceTime } = TimeManagerService;

// React Hook for time management
export const useGlobalTime = () => {
  const [currentTime, setCurrentTime] = useState(timeManager.getCurrentTime());

  useEffect(() => {
    const unsubscribe = timeManager.addListener(setCurrentTime);
    return unsubscribe;
  }, []);

  return currentTime;
};

export default TimeManagerService;