/**
 * 时间格式化工具函数
 * 统一时长显示格式：X小时X分钟
 */

// 格式化分钟为小时分钟显示
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}分钟`;
  } else if (mins === 0) {
    return `${hours}小时`;
  } else {
    return `${hours}小时${mins}分钟`;
  }
};

// 格式化小时数为小时分钟显示
export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes}分钟`;
  } else if (minutes === 0) {
    return `${wholeHours}小时`;
  } else {
    return `${wholeHours}小时${minutes}分钟`;
  }
};

// 格式化时间为 MM-DD HH:MM 格式
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const time = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${month}-${day} ${time}`;
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