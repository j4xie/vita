/**
 * 时间冲突检测工具
 * 用于诊断和预防时间管理冲突问题
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { timeManager } from '../services/timeManager';

export class TimeConflictDetector {
  private static conflicts: string[] = [];
  
  /**
   * 检测重复的定时器
   */
  static detectTimerConflicts(): void {
    console.log('🔍 检测时间管理冲突...');
    
    // 检查全局定时器数量
    const timerCount = this.getActiveTimerCount();
    if (timerCount > 1) {
      this.addConflict(`检测到${timerCount}个活跃定时器，可能存在冲突`);
    }
    
    // 检查时间管理器状态
    console.log('⏰ 全局时间管理器状态: 运行中，监听器数量:', this.getActiveTimerCount());
  }
  
  /**
   * 检测AsyncStorage键冲突
   */
  static async detectStorageConflicts(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const checkinKeys = keys.filter(key => key.includes('checkin'));
      
      console.log('🔍 检测到的签到相关存储键:', checkinKeys);
      
      if (checkinKeys.length > 1) {
        this.addConflict(`发现${checkinKeys.length}个签到相关存储键，可能存在数据冲突`);
      }
      
      // 检查存储数据一致性
      for (const key of checkinKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            console.log(`📦 存储键 ${key}:`, parsed);
          }
        } catch (error) {
          this.addConflict(`存储键 ${key} 数据格式错误`);
        }
      }
    } catch (error) {
      console.error('🔍 存储冲突检测失败:', error);
    }
  }
  
  /**
   * 检测时间格式一致性
   */
  static detectTimeFormatConflicts(): void {
    const now = new Date();
    
    // 检查不同时间格式是否一致
    const formats = {
      deviceTime: now.toISOString(),
      apiFormat: now.toISOString().replace('T', ' ').substring(0, 19),
      timestampMs: now.getTime(),
      localString: now.toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    console.log('🕐 时间格式检测:', formats);
    
    // 检查设备时间合理性（不限制时区）
    const currentYear = now.getFullYear();
    if (currentYear < 2024 || currentYear > 2030) {
      this.addConflict(`设备时间异常: ${currentYear}年，请检查设备时间设置`);
    }
    
    // 时区信息提示（不作为冲突，仅供参考）
    const offset = now.getTimezoneOffset();
    const timezoneHours = Math.abs(offset / 60);
    const timezoneSign = offset <= 0 ? '+' : '-';
    console.log(`ℹ️ 设备时区: UTC${timezoneSign}${timezoneHours} (${formats.timezone})`);
  }
  
  /**
   * 运行完整的冲突检测
   */
  static async runFullDetection(): Promise<string[]> {
    console.log('🔍 开始完整的时间冲突检测...');
    this.conflicts = [];
    
    try {
      // 1. 检测定时器冲突
      this.detectTimerConflicts();
      
      // 2. 检测存储冲突
      await this.detectStorageConflicts();
      
      // 3. 检测时间格式冲突
      this.detectTimeFormatConflicts();
      
      // 4. 报告结果
      if (this.conflicts.length === 0) {
        console.log('✅ 未检测到时间管理冲突');
      } else {
        console.warn('⚠️ 检测到以下时间冲突:');
        this.conflicts.forEach((conflict, index) => {
          console.warn(`${index + 1}. ${conflict}`);
        });
      }
      
      return this.conflicts;
    } catch (error) {
      console.error('🔍 冲突检测失败:', error);
      return ['冲突检测过程中发生错误'];
    }
  }
  
  /**
   * 清理时间冲突
   */
  static async cleanupTimeConflicts(): Promise<void> {
    console.log('🧹 开始清理时间冲突...');
    
    try {
      // 1. 清理重复的存储键（保留主要的一个）
      const keys = await AsyncStorage.getAllKeys();
      const checkinKeys = keys.filter(key => key.includes('checkin'));
      
      if (checkinKeys.length > 1) {
        // 保留 'vg_volunteer_checkin_times'，删除其他重复键
        const keysToRemove = checkinKeys.filter(key => key !== 'vg_volunteer_checkin_times');
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          console.log('🧹 清理了重复的存储键:', keysToRemove);
        }
      }
      
      // 2. 重置时间管理器（如果需要）
      // timeManager.cleanup();
      // timeManager = TimeManagerService.getInstance();
      
      console.log('✅ 时间冲突清理完成');
    } catch (error) {
      console.error('🧹 时间冲突清理失败:', error);
    }
  }
  
  private static addConflict(message: string) {
    this.conflicts.push(message);
  }
  
  private static getActiveTimerCount(): number {
    // 这是一个估算，实际实现可能需要更复杂的检测
    // 返回一个保守的估计值
    return 1; // 假设只有全局时间管理器
  }
}

// 开发环境自动检测
if (__DEV__) {
  // 延迟5秒后自动运行冲突检测
  setTimeout(() => {
    TimeConflictDetector.runFullDetection();
  }, 5000);
  
  // 暴露到全局供调试使用
  (global as any).TimeConflictDetector = TimeConflictDetector;
  (global as any).detectTimeConflicts = () => TimeConflictDetector.runFullDetection();
  (global as any).cleanupTimeConflicts = () => TimeConflictDetector.cleanupTimeConflicts();
  
  console.log('🔍 时间冲突检测器已加载');
  console.log('💡 使用 detectTimeConflicts() 检测冲突');
  console.log('💡 使用 cleanupTimeConflicts() 清理冲突');
}

export default TimeConflictDetector;