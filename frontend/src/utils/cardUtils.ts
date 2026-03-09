/**
 * Card Utilities
 * 卡片组件共享的工具函数
 */

// ==================== 安全值转换 ====================

/**
 * 安全转换为字符串
 */
export function safeString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  return String(value);
}

/**
 * 安全转换为数字
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

// ==================== 活动状态 ====================

export interface ActivityStatusLabel {
  type: 'registered' | 'checked_in' | 'today' | 'upcoming';
  label: string;
}

interface ActivityStatusInput {
  status?: string;
  date?: string;
  time?: string;
}

interface TranslationFunction {
  (key: string, fallback?: string): string;
}

/**
 * 获取活动状态标签
 * 优先显示报名状态，其次是时间紧急程度
 */
export function getActivityStatusLabel(
  activity: ActivityStatusInput,
  t: TranslationFunction
): ActivityStatusLabel | null {
  // 第一优先级：用户的报名/签到状态
  if (activity?.status === 'registered') {
    return {
      type: 'registered',
      label: t('activities.status.registered', '已报名')
    };
  }
  if (activity?.status === 'checked_in') {
    return {
      type: 'checked_in',
      label: t('activities.status.checked_in', '已签到')
    };
  }

  // 第二优先级：时间紧急程度
  try {
    if (!activity?.date || !activity?.time) {
      return null;
    }

    const now = new Date();
    const activityStart = new Date(activity.date + ' ' + activity.time);

    // 检查日期是否有效
    if (isNaN(activityStart.getTime())) {
      return null;
    }

    const hoursToStart = (activityStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursToStart >= 0 && hoursToStart <= 24) {
      return {
        type: 'today',
        label: t('activities.urgency.today', '今日开始')
      };
    } else if (hoursToStart >= 0 && hoursToStart <= 168) {
      return {
        type: 'upcoming',
        label: t('activities.urgency.upcoming', '即将开始')
      };
    }
  } catch {
    // 静默处理错误
  }

  return null;
}

// ==================== 日期格式化 ====================

/**
 * 格式化单个日期为 MM/DD 格式
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return 'TBD';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // 尝试手动解析 YYYY-MM-DD 格式
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        return `${month}/${day}`;
      }
      return dateStr;
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  } catch {
    return 'TBD';
  }
}

/**
 * 格式化日期范围
 */
export function formatDateRange(
  startDate: string,
  endDate?: string,
  options?: { padZero?: boolean }
): string {
  const padZero = options?.padZero ?? false;

  const formatSingleDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (padZero) {
        return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
      }
      return `${month}/${day}`;
    }
    return dateStr;
  };

  if (!startDate) return 'TBD';

  const start = formatSingleDate(startDate);

  if (endDate && endDate !== startDate) {
    const end = formatSingleDate(endDate);
    return `${start}-${end}`;
  }

  return start;
}

// ==================== 参与率计算 ====================

/**
 * 计算剩余名额
 */
export function calculateAvailableSpots(
  attendees: number | unknown,
  maxAttendees: number | unknown
): number {
  const current = safeNumber(attendees, 0);
  const max = safeNumber(maxAttendees, 0);
  return Math.max(0, max - current);
}

/**
 * 判断是否接近满员
 */
export function isAlmostFull(
  attendees: number | unknown,
  maxAttendees: number | unknown,
  threshold: number = 5
): boolean {
  const available = calculateAvailableSpots(attendees, maxAttendees);
  return available <= threshold && available > 0;
}

/**
 * 计算参与率百分比
 */
export function calculateParticipationRate(
  attendees: number | unknown,
  maxAttendees: number | unknown
): number {
  const current = safeNumber(attendees, 0);
  const max = safeNumber(maxAttendees, 1); // 避免除以0
  return Math.round((current / max) * 100);
}

// ==================== 导出 ====================

const cardUtils = {
  safeString,
  safeNumber,
  getActivityStatusLabel,
  formatDateShort,
  formatDateRange,
  calculateAvailableSpots,
  isAlmostFull,
  calculateParticipationRate,
};

export default cardUtils;
