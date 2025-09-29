/**
 * 统一时间服务类
 *
 * 设计原则：
 * 1. 前后端统一使用本地时间格式 "YYYY-MM-DD HH:mm:ss"
 * 2. 后端按接收到的时间直接处理，不进行时区转换
 * 3. 前端显示时直接显示，无需时区转换
 * 4. 每个方法只做一件事，职责单一
 */

import { i18n } from './i18n';

// 类型定义
export interface DisplayOptions {
  showDate?: boolean;  // 是否显示日期
  showTime?: boolean;  // 是否显示时间
  relative?: boolean;  // 是否使用相对时间（今日）
}

export interface DurationResult {
  minutes: number;     // 总分钟数
  display: string;     // 格式化显示文本
  isValid: boolean;    // 是否有效
  isOvertime: boolean; // 是否超时（>12小时）
}

export class UnifiedTimeService {

  /**
   * 核心方法1: 解析后端时间
   *
   * 架构设计：前后端都使用本地时间，无时区转换
   * 后端返回什么时间，前端就按照该时间直接解析和显示
   *
   * @param serverTime 后端返回的时间字符串，格式: "YYYY-MM-DD HH:mm:ss"
   * @param _deprecated 兼容参数，已弃用
   * @returns JavaScript Date对象
   * @example
   * const date = parseServerTime("2025-01-25 14:30:00"); // 直接解析为本地时间
   */
  parseServerTime(serverTime: string | null | undefined, _deprecated?: boolean): Date | null {
    if (!serverTime) {
      return null;
    }

    try {
      // 检查是否已经是ISO 8601格式 (包含T和时区信息)
      if (serverTime.includes('T')) {
        // 直接使用Date构造函数解析ISO格式
        const date = new Date(serverTime);
        if (isNaN(date.getTime())) {
          console.error('[UnifiedTimeService] 无效的ISO时间格式:', serverTime);
          return null;
        }
        return date;
      }

      // 🔧 核心修复：后端返回的时间格式 "YYYY-MM-DD HH:mm:ss" 直接作为本地时间解析
      // 不添加任何时区信息，避免时区转换错误
      const isoString = serverTime.replace(' ', 'T');
      const date = new Date(isoString);

      // 验证日期有效性
      if (isNaN(date.getTime())) {
        console.error('[UnifiedTimeService] 无效的时间格式:', serverTime);
        return null;
      }

      if (__DEV__) {
        console.log('📅 [LocalTime] 本地时间解析:', {
          input: serverTime,
          output: date.toLocaleString(),
          timestamp: date.getTime()
        });
      }

      return date;
    } catch (error) {
      console.error('[UnifiedTimeService] 解析时间失败:', error, 'Input:', serverTime);
      return null;
    }
  }

  /**
   * 核心方法2: 格式化为后端API格式
   *
   * @param date JavaScript Date对象
   * @returns 格式化的字符串 "YYYY-MM-DD HH:mm:ss" (本地时间)
   * @example
   * const apiTime = formatForServer(new Date());
   * // 输出: "2025-01-25 14:30:00" (用户本地时间)
   */
  formatForServer(date: Date | null | undefined): string {
    if (!date || isNaN(date.getTime())) {
      // 返回当前时间作为后备方案
      date = new Date();
    }

    // 统一策略：直接使用本地时间格式，避免时区转换
    return this.formatLocalTime(date);
  }

  /**
   * 核心方法3: 前端显示格式化
   *
   * @param date JavaScript Date对象
   * @param options 显示选项
   * @returns 格式化的显示字符串（用户本地时间）
   * @example
   * const display = formatForDisplay(date, { relative: true });
   * // 输出: "今日 14:30"
   */
  formatForDisplay(date: Date | null | undefined, options?: DisplayOptions): string {
    if (!date || isNaN(date.getTime())) {
      return '--:--';
    }

    const { showDate = false, showTime = true, relative = false } = options || {};

    try {
      // 相对时间显示（今日）
      if (relative && this.isToday(date)) {
        const time = date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return `今日 ${time}`;
      }

      // 绝对时间显示（用户本地时间）
      const parts = [];

      if (showDate) {
        const dateStr = date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        parts.push(dateStr);
      }

      if (showTime) {
        const timeStr = date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        parts.push(timeStr);
      }

      return parts.join(' ');

    } catch (error) {
      console.error('[UnifiedTimeService] 显示格式化失败:', error);
      return '--:--';
    }
  }

  /**
   * 核心方法4: 时长计算
   *
   * @param start 开始时间
   * @param end 结束时间
   * @returns 时长计算结果
   * @example
   * const duration = calculateDuration(startDate, endDate);
   * // { minutes: 510, display: "8小时30分钟", isValid: true, isOvertime: false }
   */
  calculateDuration(start: Date | null | undefined, end: Date | null | undefined): DurationResult {
    // 参数验证
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        minutes: 0,
        display: i18n.t('common.time.invalidDuration', { defaultValue: '无效时长' }),
        isValid: false,
        isOvertime: false
      };
    }

    const diff = end.getTime() - start.getTime();

    // 异常检测：负时长
    if (diff < 0) {
      return {
        minutes: 0,
        display: i18n.t('common.time.endTimeBeforeStart', { defaultValue: '结束时间早于开始时间' }),
        isValid: false,
        isOvertime: false
      };
    }

    // 计算分钟数
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // 超时检测（12小时）
    const isOvertime = hours >= 12;

    // 格式化显示（支持国际化）
    let display: string;
    if (hours > 0) {
      if (mins > 0) {
        display = i18n.t('common.time.hoursAndMinutes', {
          hours,
          minutes: mins,
          defaultValue: `${hours}小时${mins}分钟`
        });
      } else {
        display = i18n.t('common.time.hours', {
          hours,
          defaultValue: `${hours}小时`
        });
      }
    } else {
      display = mins > 0
        ? i18n.t('common.time.minutes', { minutes: mins, defaultValue: `${mins}分钟` })
        : i18n.t('common.time.lessThanOneMinute', { defaultValue: '少于1分钟' });
    }

    // 超时警告（支持国际化）
    if (isOvertime) {
      display += i18n.t('common.time.overtime', { defaultValue: ' (超时)' });
    }

    return {
      minutes,
      display,
      isValid: true,
      isOvertime
    };
  }

  /**
   * 辅助方法：判断是否为今天
   */
  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * 辅助方法：获取当前本地时间（API格式）
   *
   * @returns 当前时间的API格式字符串
   * @example
   * const now = getCurrentLocalTime();
   * // "2025-01-25 14:30:00"
   */
  getCurrentLocalTime(): string {
    return this.formatForServer(new Date());
  }


  /**
   * 格式化为本地时间字符串（不转换时区）
   *
   * @param date Date对象
   * @returns 本地时间字符串 "YYYY-MM-DD HH:mm:ss"
   * @example
   * const localTime = formatLocalTime(new Date());
   * // 输出: "2025-01-25 14:30:00" (用户本地时间)
   */
  formatLocalTime(date: Date | null | undefined): string {
    if (!date || isNaN(date.getTime())) {
      date = new Date();
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }


  /**
   * 工具方法：验证时间合理性
   *
   * @param date 要验证的时间
   * @returns 是否在合理范围内（过去30天到未来1小时）
   */
  isReasonableTime(date: Date | null | undefined): boolean {
    if (!date || isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneHourFuture = new Date(now.getTime() + 60 * 60 * 1000);

    return date >= thirtyDaysAgo && date <= oneHourFuture;
  }

  /**
   * 工具方法：格式化相对时间
   *
   * @param date 时间
   * @returns 相对时间描述（刚刚、5分钟前、昨天等）
   */
  formatRelativeTime(date: Date | null | undefined): string {
    if (!date || isNaN(date.getTime())) {
      return '未知时间';
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diff / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else {
      return this.formatForDisplay(date, { showDate: true, showTime: false });
    }
  }

  /**
   * 检测时间异常 - 替代旧的detectTimeAnomaly函数
   *
   * @param checkInTime 签到时间（字符串或Date对象）
   * @returns 异常检测结果
   */
  detectTimeAnomaly(
    checkInTime?: any
  ): { type: 'future' | 'too_long' | null; message?: string } {
    if (!checkInTime) return { type: null };

    try {
      const checkIn = this.parseServerTime(checkInTime);
      if (!checkIn) return { type: null };

      const now = new Date();
      const diffMs = now.getTime() - checkIn.getTime();

      // 检测未来时间
      if (diffMs < 0) {
        return {
          type: 'future',
          message: '签到时间在未来'
        };
      }

      // 检测超长时间（超过24小时）
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      if (diffMs > twentyFourHoursMs) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        return {
          type: 'too_long',
          message: `已签到${hours}小时，可能存在异常`
        };
      }

      return { type: null };
    } catch (error) {
      console.error('检测时间异常失败:', error);
      return { type: null };
    }
  }

  /**
   * 预防性状态检查 - 检测可能需要重置的用户
   */
  checkVolunteerStatusHealth(volunteers: any[]): {
    needResetUsers: any[];
    longTermUsers: any[];
    totalAnomalies: number;
  } {
    const needResetUsers = [];
    const longTermUsers = [];

    for (const volunteer of volunteers) {
      if (!volunteer.checkInTime || volunteer.checkInStatus !== 'checked_in') {
        continue;
      }

      const anomaly = this.detectTimeAnomaly(volunteer.checkInTime);
      if (anomaly.type === 'too_long') {
        const parsedTime = this.parseServerTime(volunteer.checkInTime);
        if (parsedTime) {
          const hoursElapsed = (new Date().getTime() - parsedTime.getTime()) / (1000 * 60 * 60);

          if (hoursElapsed > 24) {
            needResetUsers.push({
              ...volunteer,
              hoursElapsed: Math.floor(hoursElapsed),
              anomalyMessage: anomaly.message
            });
          } else if (hoursElapsed > 8) {
            longTermUsers.push({
              ...volunteer,
              hoursElapsed: Math.floor(hoursElapsed),
              anomalyMessage: anomaly.message
            });
          }
        }
      }
    }

    return {
      needResetUsers,
      longTermUsers,
      totalAnomalies: needResetUsers.length + longTermUsers.length
    };
  }
}

// 导出单例实例
export const timeService = new UnifiedTimeService();

// 导出默认实例
export default timeService;