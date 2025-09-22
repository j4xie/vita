/**
 * 志愿者时间格式化工具
 * 统一主屏幕和历史记录的时间显示格式
 */

import { safeParseTime, formatDateTime } from './timeHelper';
import { i18n } from './i18n';

/**
 * 统一的志愿者时间格式化函数
 * 复用主屏幕的时间显示逻辑
 */
export const formatVolunteerTime = (timeString: string): string => {
  try {
    if (!timeString) return '--:--';

    // 使用安全的时间解析
    const date = safeParseTime(timeString);
    if (!date) return '--:--';

    const now = new Date();

    // 更可靠的日期比较：使用本地时间的年月日
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const recordYear = date.getFullYear();
    const recordMonth = date.getMonth();
    const recordDate = date.getDate();

    const isToday = (recordYear === todayYear && recordMonth === todayMonth && recordDate === todayDate);

    if (isToday) {
      // 今天只显示时间
      const time = formatDateTime(timeString, {
        showDate: false,
        showTime: true,
        timeStyle: 'short'
      });
      return i18n.language === 'en-US' ? `Today ${time}` : `今日 ${time}`;
    } else {
      // 非今天显示完整的日期和时间，使用统一格式化
      const fullDateTime = formatDateTime(timeString, {
        showDate: true,
        showTime: true,
        dateStyle: 'short',
        timeStyle: 'short'
      });

      // 如果格式化失败，使用备用格式
      if (fullDateTime === '无效时间' || fullDateTime === '格式化错误') {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
      }

      return fullDateTime;
    }
  } catch (error) {
    console.error('时间格式化失败:', error);
    return '--:--';
  }
};

/**
 * 计算并格式化志愿者工作时长
 * 统一时长计算逻辑，处理异常情况
 */
export const calculateVolunteerDuration = (startTime: string, endTime: string) => {
  try {
    const start = safeParseTime(startTime);
    const end = safeParseTime(endTime);

    if (!start || !end) {
      return {
        duration: '--:--',
        isInvalid: true,
        isOvertime: false,
        hours: 0
      };
    }

    const diffMs = end.getTime() - start.getTime();

    // 处理负数时间（时间异常）
    if (diffMs < 0) {
      return {
        duration: i18n.t('wellbeing.volunteer.history.invalidTime', '时间异常'),
        isInvalid: true,
        isOvertime: false,
        hours: 0
      };
    }

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // 格式化时长显示
    let duration: string;
    if (hours > 0) {
      duration = `${hours}${i18n.t('common.time.hours', '小时')} ${mins}${i18n.t('common.time.minutes', '分钟')}`;
    } else {
      duration = `${mins}${i18n.t('common.time.minutes', '分钟')}`;
    }

    return {
      duration,
      isInvalid: false,
      isOvertime: hours > 12, // 超过12小时标记为异常
      hours: hours
    };
  } catch (error) {
    return {
      duration: '--:--',
      isInvalid: true,
      isOvertime: false,
      hours: 0
    };
  }
};

/**
 * 检查时间是否有效
 */
export const isValidVolunteerTime = (timeString: string): boolean => {
  try {
    const parsed = safeParseTime(timeString);
    return !!parsed && !isNaN(parsed.getTime());
  } catch {
    return false;
  }
};

/**
 * 兼容性：导出旧版本的函数名
 * @deprecated 使用 formatVolunteerTime 替代
 */
export const formatChineseDateTime = formatVolunteerTime;