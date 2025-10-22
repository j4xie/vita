/**
 * 时区工具函数
 * 用于计算本地时区与北京时间的时差
 */

/**
 * 获取当前设备时区与北京时间的时差（小时）
 *
 * @returns 时差（小时），负数表示比北京时间慢，正数表示比北京时间快
 *
 * @example
 * // 在美国洛杉矶（UTC-8）
 * getTimeOffsetFromBeijing() // 返回 -16 (即 -8 - 8 = -16)
 *
 * @example
 * // 在日本东京（UTC+9）
 * getTimeOffsetFromBeijing() // 返回 +1 (即 9 - 8 = 1)
 *
 * @example
 * // 在中国上海（UTC+8）
 * getTimeOffsetFromBeijing() // 返回 0 (即 8 - 8 = 0)
 */
export const getTimeOffsetFromBeijing = (): number => {
  try {
    // 获取本地时区相对UTC的偏移量（分钟）
    // 注意：getTimezoneOffset() 返回值符号与常规相反
    // 例如：UTC+8 返回 -480，UTC-5 返回 300
    const localOffsetMinutes = -new Date().getTimezoneOffset();

    // 转换为小时
    const localOffsetHours = localOffsetMinutes / 60;

    // 北京时间是 UTC+8
    const beijingOffsetHours = 8;

    // 计算时差
    const timeOffset = localOffsetHours - beijingOffsetHours;

    // 开发环境下输出调试信息
    if (__DEV__) {
      const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('⏰ [TIMEZONE] 时区信息:', {
        timezoneName,
        localOffsetMinutes,
        localOffsetHours,
        beijingOffsetHours,
        timeOffset: timeOffset >= 0 ? `+${timeOffset}` : `${timeOffset}`,
        description: timeOffset === 0 ? '与北京时间相同' :
                    timeOffset > 0 ? `比北京时间快${timeOffset}小时` :
                    `比北京时间慢${Math.abs(timeOffset)}小时`
      });
    }

    return timeOffset;
  } catch (error) {
    // 如果获取失败，默认返回0（假设在北京时区）
    console.error('❌ [TIMEZONE] 获取时区偏移失败:', error);
    return 0;
  }
};

/**
 * 获取当前时区的名称
 *
 * @returns 时区名称，如 "Asia/Shanghai", "America/Los_Angeles"
 */
export const getTimezoneName = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('❌ [TIMEZONE] 获取时区名称失败:', error);
    return 'Asia/Shanghai'; // 默认北京时区
  }
};

/**
 * 检查当前时区是否为北京时区
 *
 * @returns true表示在北京时区，false表示不在
 */
export const isBeijingTimezone = (): boolean => {
  const timezoneName = getTimezoneName();
  const beijingTimezones = [
    'Asia/Shanghai',
    'Asia/Beijing',
    'Asia/Chongqing',
    'Asia/Harbin',
    'Asia/Urumqi'
  ];
  return beijingTimezones.includes(timezoneName);
};

/**
 * 格式化时差为可读字符串
 *
 * @param offset 时差（小时）
 * @returns 格式化的时差字符串，如 "+1小时", "-8小时", "与北京时间相同"
 */
export const formatTimeOffset = (offset: number): string => {
  if (offset === 0) {
    return '与北京时间相同';
  } else if (offset > 0) {
    return `比北京时间快${offset}小时`;
  } else {
    return `比北京时间慢${Math.abs(offset)}小时`;
  }
};
