/**
 * 统一的时间处理工具库
 * 用于处理所有时间戳相关的解析、格式化和计算
 *
 * @deprecated 此文件已废弃，请使用 UnifiedTimeService
 * import { timeService } from '../utils/UnifiedTimeService';
 *
 * 迁移指南:
 * - parseTimestamp() → timeService.parseServerTime()
 * - safeParseTime() → timeService.parseServerTime()
 * - calculateDuration() → timeService.calculateDuration()
 * - formatDateTime() → timeService.formatForDisplay()
 * - toBeijingTimeString() → timeService.formatForServer()
 * - formatBeijingTime() → timeService.formatForDisplay()
 * - formatLocalTime() → timeService.formatForDisplay()
 * - detectTimeAnomaly() → timeService.isReasonableTime()
 * - formatRelativeTime() → timeService.formatRelativeTime()
 */

/**
 * 智能解析时间戳，支持多种格式，防止双重时区转换
 * @deprecated 使用 timeService.parseServerTime() 替代
 * @param rawValue 原始时间值（可能是Unix秒、Unix毫秒、ISO字符串等）
 * @returns 解析后的Date对象
 */
export const parseTimestamp = (rawValue: any): Date => {
  // 如果已经是Date对象
  if (rawValue instanceof Date) {
    return rawValue;
  }

  // 如果是null或undefined
  if (!rawValue) {
    throw new Error('时间戳为空');
  }

  const stringValue = String(rawValue);

  // Unix时间戳（秒） - 10位数字
  if (/^\d{10}$/.test(stringValue)) {
    return new Date(parseInt(stringValue) * 1000);
  }

  // Unix时间戳（毫秒） - 13位数字
  if (/^\d{13}$/.test(stringValue)) {
    return new Date(parseInt(stringValue));
  }

  // 🔧 检测ISO格式时间（已包含时区信息），直接解析避免双重转换
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([Z]|[+-]\d{2}:\d{2})$/.test(stringValue)) {
    const parsed = new Date(stringValue);
    if (!isNaN(parsed.getTime())) {
      if (__DEV__) {
        console.log('🔍 [PARSE-ISO] 检测到ISO格式，直接解析:', {
          input: stringValue,
          output: parsed.toISOString()
        });
      }
      return parsed;
    }
  }

  // 🔧 智能检测可能的时区格式
  // 如果时间看起来像是UTC时间（通常22-24点或0-6点范围），可能需要特殊处理
  const timeMatch = stringValue.match(/(\d{2}):(\d{2}):(\d{2})/);
  let isProbablyUTC = false;
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    // 如果是深夜时段，可能已经是UTC时间
    isProbablyUTC = hour >= 22 || hour <= 6;
  }

  // 后端返回的格式 "YYYY-MM-DD HH:mm:ss" - 需要智能处理时区
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(stringValue)) {
    const now = new Date();

    // 🔧 关键修复：检测跨日期问题
    const utcParsed = new Date(stringValue.replace(' ', 'T') + 'Z');
    const beijingParsed = new Date(stringValue.replace(' ', 'T') + '+08:00');

    // 计算与当前时间的差异
    const utcDaysDiff = (utcParsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const beijingDaysDiff = (beijingParsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (__DEV__) {
      console.log('🔍 [CROSS-DATE-CHECK] 跨日期检测:', {
        input: stringValue,
        utcParsed: utcParsed.toISOString(),
        beijingParsed: beijingParsed.toISOString(),
        utcDaysDiff: utcDaysDiff.toFixed(3),
        beijingDaysDiff: beijingDaysDiff.toFixed(3),
        isUtcFuture: utcDaysDiff > 0.1,
        isBeijingFuture: beijingDaysDiff > 0.1
      });
    }

    // 🚨 修复：智能选择合适的时区解析
    // 选择与当前时间更接近的解析结果
    const utcDiff = Math.abs(now.getTime() - utcParsed.getTime());
    const beijingDiff = Math.abs(now.getTime() - beijingParsed.getTime());

    // 选择时间差更小的解析方式（更合理的结果）
    if (utcDiff < beijingDiff) {
      if (__DEV__) {
        console.log('🔧 [TIMEZONE-FIX] 选择UTC时间解析:', {
          original: stringValue,
          utcResult: utcParsed.toISOString(),
          beijingResult: beijingParsed.toISOString(),
          utcDiff: utcDiff,
          beijingDiff: beijingDiff,
          chosen: 'UTC'
        });
      }
      return utcParsed;
    } else {
      if (__DEV__) {
        console.log('🔧 [TIMEZONE-FIX] 选择北京时间解析:', {
          original: stringValue,
          utcResult: utcParsed.toISOString(),
          beijingResult: beijingParsed.toISOString(),
          utcDiff: utcDiff,
          beijingDiff: beijingDiff,
          chosen: 'Beijing'
        });
      }
      return beijingParsed;
    }
  }

  // 处理可能的毫秒格式 "YYYY-MM-DD HH:mm:ss.SSS"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/.test(stringValue)) {
    if (isProbablyUTC) {
      const utcParsed = new Date(stringValue.replace(' ', 'T') + 'Z');
      if (!isNaN(utcParsed.getTime())) {
        if (__DEV__) {
          console.log('🔍 [PARSE-UTC-MS] 毫秒格式作为UTC解析:', {
            input: stringValue,
            output: utcParsed.toISOString()
          });
        }
        return utcParsed;
      }
    }

    // 默认作为北京时间处理
    const dateTimeWithTZ = stringValue.replace(' ', 'T') + '+08:00';
    return new Date(dateTimeWithTZ);
  }

  // 尝试直接解析（ISO字符串等）
  const parsed = new Date(rawValue);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  throw new Error(`无法解析时间戳: ${rawValue}`);
};

/**
 * 安全的时间解析（带null检查和错误处理）
 * @deprecated 使用 timeService.parseServerTime() 替代
 * @param rawValue 原始时间值
 * @param defaultValue 解析失败时的默认值
 * @returns Date对象或默认值
 */
export const safeParseTime = (
  rawValue: any,
  defaultValue: Date | null = null
): Date | null => {
  if (!rawValue) {
    return defaultValue;
  }

  try {
    return parseTimestamp(rawValue);
  } catch (error) {
    console.warn('时间解析失败:', error, '原始值:', rawValue);
    return defaultValue;
  }
};

/**
 * 计算两个时间之间的时长
 * @deprecated 使用 timeService.calculateDuration() 替代
 * @param startTime 开始时间
 * @param endTime 结束时间（默认为当前时间）
 * @returns 时长信息对象
 */
export const calculateDuration = (
  startTime: any,
  endTime: any = new Date()
): {
  totalMinutes: number;
  hours: number;
  minutes: number;
  display: string;
  hasError: boolean;
  errorMessage?: string;
} => {
  try {
    const start = safeParseTime(startTime);
    const end = safeParseTime(endTime);

    if (!start || !end) {
      return {
        totalMinutes: 0,
        hours: 0,
        minutes: 0,
        display: '时间数据缺失',
        hasError: true,
        errorMessage: '无法获取有效的时间数据'
      };
    }

    const diffMs = end.getTime() - start.getTime();

    // 检测时间异常
    if (diffMs < 0) {
      return {
        totalMinutes: 0,
        hours: 0,
        minutes: 0,
        display: '时间异常',
        hasError: true,
        errorMessage: '结束时间早于开始时间'
      };
    }

    // 检测超长时间（超过30天）
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (diffMs > thirtyDaysMs) {
      return {
        totalMinutes: 0,
        hours: 0,
        minutes: 0,
        display: '时间异常',
        hasError: true,
        errorMessage: `时长异常：${Math.floor(diffMs / (1000 * 60 * 60))}小时`
      };
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      totalMinutes,
      hours,
      minutes,
      display: `${hours}小时${minutes}分钟`,
      hasError: false
    };
  } catch (error) {
    console.error('计算时长失败:', error);
    return {
      totalMinutes: 0,
      hours: 0,
      minutes: 0,
      display: '计算错误',
      hasError: true,
      errorMessage: String(error)
    };
  }
};

/**
 * 格式化日期时间为本地字符串
 * @deprecated 使用 timeService.formatForDisplay() 替代
 * @param dateTime 日期时间
 * @param options 格式化选项
 * @returns 格式化后的字符串
 */
export const formatDateTime = (
  dateTime: any,
  options: {
    locale?: string;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    showDate?: boolean;
    showTime?: boolean;
  } = {}
): string => {
  const {
    locale = 'zh-CN',
    dateStyle = 'short',
    timeStyle = 'short',
    showDate = true,
    showTime = true
  } = options;

  try {
    const date = safeParseTime(dateTime);
    if (!date) {
      return '无效时间';
    }

    if (showDate && showTime) {
      return date.toLocaleString(locale, { dateStyle, timeStyle });
    } else if (showDate) {
      return date.toLocaleDateString(locale, { dateStyle });
    } else if (showTime) {
      return date.toLocaleTimeString(locale, { timeStyle });
    }

    return date.toISOString();
  } catch (error) {
    console.error('格式化时间失败:', error);
    return '格式化错误';
  }
};

/**
 * 检测时间异常
 * @deprecated 使用 timeService.isReasonableTime() 替代
 * @param checkInTime 签到时间
 * @returns 异常信息或null
 */
export const detectTimeAnomaly = (
  checkInTime?: any
): { type: 'future' | 'too_long' | null; message?: string } => {
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
};

/**
 * 将时间转换为ISO字符串（安全版本）
 * @param dateTime 日期时间
 * @returns ISO字符串或空字符串
 */
export const toISOStringSafe = (dateTime: any): string => {
  try {
    const date = safeParseTime(dateTime);
    return date ? date.toISOString() : '';
  } catch {
    return '';
  }
};

/**
 * 比较两个时间的先后
 * @param time1 时间1
 * @param time2 时间2
 * @returns -1（time1较早）、0（相等）、1（time1较晚）
 */
export const compareTimes = (time1: any, time2: any): number => {
  try {
    const date1 = safeParseTime(time1);
    const date2 = safeParseTime(time2);

    if (!date1 || !date2) return 0;

    const diff = date1.getTime() - date2.getTime();
    if (diff < 0) return -1;
    if (diff > 0) return 1;
    return 0;
  } catch {
    return 0;
  }
};

/**
 * 获取当前时间的ISO字符串
 * @returns ISO格式的当前时间
 */
export const getCurrentISOTime = (): string => {
  return new Date().toISOString();
};

// 导出用于志愿者API的别名（保持向后兼容）
// @deprecated 使用 timeService.parseServerTime() 替代
export const parseVolunteerTimestamp = parseTimestamp;

/**
 * 将本地时间转换为北京时间字符串（适用于全球所有时区）
 * @deprecated 使用 timeService.formatForServer() 替代
 * 使用Intl.DateTimeFormat处理时区转换，自动处理夏令时和各种时区偏移
 * @param localDate 本地Date对象
 * @returns 格式化的北京时间字符串 YYYY-MM-DD HH:mm:ss
 */
export const toBeijingTimeString = (localDate: Date): string => {
  try {
    // 验证输入
    if (!localDate || isNaN(localDate.getTime())) {
      throw new Error('无效的日期对象');
    }

    // 使用Intl.DateTimeFormat处理时区转换
    const beijingFormatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = beijingFormatter.formatToParts(localDate);
    const dateMap: any = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        dateMap[part.type] = part.value;
      }
    });

    const result = `${dateMap.year}-${dateMap.month}-${dateMap.day} ${dateMap.hour}:${dateMap.minute}:${dateMap.second}`;

    if (__DEV__) {
      console.log('🔧 [BEIJING-TIME] 时区转换完成:', {
        input: localDate.toISOString(),
        inputLocal: localDate.toLocaleString(),
        output: result,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }

    return result;
  } catch (error) {
    if (__DEV__) {
      console.error('北京时间转换失败，使用备用方法:', error);
    }
    // 如果Intl.DateTimeFormat失败，使用备用方法
    return toBeijingTimeStringManual(localDate);
  }
};

/**
 * 备用方法：手动计算北京时间（兼容性更好）
 * @param localDate 本地Date对象
 * @returns 格式化的北京时间字符串 YYYY-MM-DD HH:mm:ss
 */
export const toBeijingTimeStringManual = (localDate: Date): string => {
  try {
    // 获取UTC时间组件
    const utcYear = localDate.getUTCFullYear();
    const utcMonth = localDate.getUTCMonth();
    const utcDate = localDate.getUTCDate();
    const utcHours = localDate.getUTCHours();
    const utcMinutes = localDate.getUTCMinutes();
    const utcSeconds = localDate.getUTCSeconds();

    // 创建UTC时间
    const utcDateTime = new Date(Date.UTC(utcYear, utcMonth, utcDate, utcHours, utcMinutes, utcSeconds));

    // 加8小时得到北京时间
    const beijingTime = new Date(utcDateTime.getTime() + (8 * 60 * 60 * 1000));

    // 格式化输出
    const year = beijingTime.getUTCFullYear();
    const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getUTCDate()).padStart(2, '0');
    const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
    const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('手动北京时间转换失败:', error);
    // 最后的fallback：返回当前时间
    const now = new Date();
    return formatDateTime(now);
  }
};

/**
 * 将任意时间转换为北京时间并格式化为简短时间显示（HH:mm）
 * @deprecated 使用 timeService.formatForDisplay() 替代
 * 🔧 增强版：使用智能解析防止时区错误
 * @param dateTime 日期时间（支持Date、字符串、时间戳等各种格式）
 * @returns 北京时间格式的时间字符串 HH:mm，如果解析失败返回 --:--
 */
export const formatBeijingTime = (dateTime: any): string => {
  try {
    // 处理null、undefined等无效值
    if (!dateTime) {
      return '--:--';
    }

    let date: Date | null = null;

    // 🔧 使用智能解析函数，避免时区双重转换
    try {
      date = parseTimestamp(dateTime);
    } catch (parseError) {
      // 如果智能解析失败，尝试传统方法
      if (typeof dateTime === 'string') {
        // 处理ISO字符串格式（如：2025-09-22T07:44:00.000Z）
        if (dateTime.includes('T') && (dateTime.includes('Z') || dateTime.includes('+') || dateTime.includes('-'))) {
          date = new Date(dateTime);
        }
        // 处理后端返回的格式 "YYYY-MM-DD HH:mm:ss"
        else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTime)) {
          // 后端返回的是北京时间，添加时区标识让JavaScript正确解析
          const dateTimeWithTZ = dateTime.replace(' ', 'T') + '+08:00';
          date = new Date(dateTimeWithTZ);
        }
        else {
          // 其他字符串格式，尝试直接解析
          date = new Date(dateTime);
        }
      } else {
        // 使用现有的安全解析函数处理其他格式（Date对象、数字等）
        date = safeParseTime(dateTime);
      }
    }

    if (!date || isNaN(date.getTime())) {
      if (__DEV__) {
        console.warn('⚠️ [FORMAT-BEIJING] 时间解析失败:', {
          input: dateTime,
          inputType: typeof dateTime
        });
      }
      return '--:--';
    }

    // 🔧 验证时间合理性（避免显示明显错误的时间）
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - date.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    // 如果时间差超过365天，可能是解析错误
    if (daysDiff > 365) {
      if (__DEV__) {
        console.warn('⚠️ [FORMAT-BEIJING] 时间差异过大，可能存在解析错误:', {
          input: dateTime,
          parsed: date.toISOString(),
          daysDiff: daysDiff.toFixed(1)
        });
      }
      return '--:--';
    }

    // 使用Intl.DateTimeFormat将任意时间转换为北京时间显示
    const beijingTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const result = beijingTimeFormatter.format(date);

    if (__DEV__) {
      console.log('🔍 [FORMAT-BEIJING] 格式化完成:', {
        input: dateTime,
        parsed: date.toISOString(),
        formatted: result
      });
    }

    return result;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ [FORMAT-BEIJING] 北京时间格式化失败:', error);
    }
    return '--:--';
  }
};

/**
 * 格式化为手机本地时间显示（HH:mm）
 * @deprecated 使用 timeService.formatForDisplay() 替代
 * @param dateTime 日期时间，默认为当前时间
 * @returns 本地时间格式的时间字符串 HH:mm
 */
export const formatLocalTime = (dateTime: Date = new Date()): string => {
  try {
    // 验证输入
    if (!dateTime || isNaN(dateTime.getTime())) {
      dateTime = new Date(); // 使用当前时间作为fallback
    }

    // 使用本地时区格式化时间
    const localTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const result = localTimeFormatter.format(dateTime);

    if (__DEV__) {
      console.log('🔧 [LOCAL-TIME] 本地时间格式化完成:', {
        input: dateTime.toISOString(),
        inputLocal: dateTime.toLocaleString(),
        output: result,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }

    return result;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ [LOCAL-TIME] 本地时间格式化失败:', error);
    }
    // fallback：使用简单的本地时间格式
    const now = dateTime || new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};