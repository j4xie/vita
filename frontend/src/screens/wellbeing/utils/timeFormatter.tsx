/**
 * 时间格式化工具函数
 * 统一时长显示格式：支持国际化
 */

import { i18n } from '../../../utils/i18n';

// 格式化分钟为小时分钟显示
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} ${i18n.t('common.time.minutes', '分钟')}`;
  } else if (mins === 0) {
    return `${hours} ${i18n.t('common.time.hours', '小时')}`;
  } else {
    return `${hours} ${i18n.t('common.time.hours', '小时')} ${mins} ${i18n.t('common.time.minutes', '分钟')}`;
  }
};

// 格式化小时数为小时分钟显示
export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes} ${i18n.t('common.time.minutes', '分钟')}`;
  } else if (minutes === 0) {
    return `${wholeHours} ${i18n.t('common.time.hours', '小时')}`;
  } else {
    return `${wholeHours} ${i18n.t('common.time.hours', '小时')} ${minutes} ${i18n.t('common.time.minutes', '分钟')}`;
  }
};

// 格式化时间为简洁直观的年月日时间格式
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  if (isToday) {
    // 今天显示：今日 14:30
    return (typeof i18n.language === 'string' && i18n.language.startsWith('zh')) ? `今日 ${time}` : `Today ${time}`;
  } else {
    // 其他日期显示：2025/8/24 14:30 （简洁的斜杠格式）
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (typeof i18n.language === 'string' && i18n.language.startsWith('zh')) {
      return `${year}/${month}/${day} ${time}`;
    } else {
      // 英文：8/24/2025 2:30 PM
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }
};

// 格式化签到时间为最简洁格式（用于Toast提示）
export const formatTimeCompact = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 格式化时间范围
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// 计算两个时间之间的分钟差
export const calculateDurationMinutes = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
};

// 格式化当前工作时长（实时更新）
export const formatCurrentDuration = (checkInTime: string, currentTime: Date): string => {
  const start = new Date(checkInTime);
  const diffMinutes = Math.floor((currentTime.getTime() - start.getTime()) / (1000 * 60));
  return formatDuration(diffMinutes);
};

// Add missing exports for timezoneFixTest.ts
export const formatVolunteerTime = (date?: Date): string => {
  const targetDate = date || new Date();
  return targetDate.toISOString().replace('T', ' ').slice(0, 19);
};

export const getCurrentLocalTimestamp = (): string => {
  return formatVolunteerTime();
};

export const validateAndFormatTime = (timeString: string): string => {
  const date = new Date(timeString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid time format');
  }
  return formatVolunteerTime(date);
};