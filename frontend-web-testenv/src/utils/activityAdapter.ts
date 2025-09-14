// 活动数据适配器 - 转换后端数据到前端格式
import { getCategoryName } from '../data/activityCategories';

// 后端活动数据接口
export interface BackendActivity {
  id: number;
  name: string;
  icon: string;
  startTime: string;
  endTime: string;
  address: string;
  enrollment: number;
  detail: string;
  signStartTime: string;
  signEndTime: string;
  enabled: number;
  createUserId: number;
  createName: string;
  createNickName: string;
  signStatus?: number; // 0-未报名，-1-已报名未签到，1-已签到
  type?: number; // -1-即将开始，1-已开始，2-已结束
  categoryId?: number;
  registerCount?: number; // 活动已报名人数
  timeZone?: string; // 活动时区
}

// 前端活动数据接口
export interface FrontendActivity {
  id: string;
  title: string;
  location: string;
  date: string;
  endDate?: string; // 添加结束日期
  time: string;
  image: string;
  attendees: number;
  maxAttendees: number;
  registeredCount: number; // 已报名人数
  status: 'available' | 'ended' | 'registered' | 'checked_in';
  category?: string;
  organizer?: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  // 完整的时间信息（用于准确的状态判断）
  startTime?: string; // 完整的开始时间字符串
  endTime?: string; // 完整的结束时间字符串
  // 额外信息
  registrationStartTime?: string;
  registrationEndTime?: string;
  detail?: string;
  enabled?: boolean;
  timeZone?: string; // 活动时区
}

// 🚀 性能优化：预编译状态映射表
const REGISTRATION_STATUS_MAP = new Map<number, 'available' | 'registered' | 'checked_in'>([
  [-1, 'registered'],
  [1, 'checked_in'],
]);

const ACTIVITY_TYPE_MAP = new Map<number, 'available' | 'ended'>([
  [-1, 'available'],
  [2, 'ended'],
]);

/**
 * 快速转换报名状态
 */
const convertRegistrationStatus = (signStatus?: number): 'available' | 'registered' | 'checked_in' => {
  return REGISTRATION_STATUS_MAP.get(signStatus ?? 0) ?? 'available';
};

/**
 * 快速转换活动类型状态
 */
const convertActivityType = (type?: number): 'available' | 'ended' => {
  return ACTIVITY_TYPE_MAP.get(type ?? -1) ?? 'available';
};

// 🚀 性能优化：快速时间解析缓存
const TIME_PARSE_CACHE = new Map<string, { date: string; time: string }>();

/**
 * 美国夏令时检测函数
 * 夏令时规则：3月第二个周日2AM开始 → 11月第一个周日2AM结束
 */
const isDaylightSavingTime = (date: Date): boolean => {
  const year = date.getFullYear();
  
  // 计算3月第二个周日 (夏令时开始)
  const march = new Date(year, 2, 1); // 3月1日
  const firstSundayInMarch = 7 - march.getDay(); // 第一个周日的日期
  const secondSundayInMarch = firstSundayInMarch + 7; // 第二个周日
  const dstStart = new Date(year, 2, secondSundayInMarch, 2, 0, 0); // 3月第二个周日2AM
  
  // 计算11月第一个周日 (夏令时结束)  
  const november = new Date(year, 10, 1); // 11月1日
  const firstSundayInNovember = 7 - november.getDay(); // 第一个周日的日期
  const dstEnd = new Date(year, 10, firstSundayInNovember, 2, 0, 0); // 11月第一个周日2AM
  
  return date >= dstStart && date < dstEnd;
};

/**
 * 时区映射表 - 支持夏令时/冬令时动态切换
 */
const TIMEZONE_DST_MAP = new Map<string, { 
  standard: { zh: string; en: string }; 
  daylight: { zh: string; en: string };
}>([
  // 美国中部时区
  ['central', { 
    standard: { zh: '美中', en: 'CST' }, 
    daylight: { zh: '美中', en: 'CDT' } 
  }],
  // 美国西部时区
  ['pacific', { 
    standard: { zh: '美西', en: 'PST' }, 
    daylight: { zh: '美西', en: 'PDT' } 
  }],
  // 美国东部时区
  ['eastern', { 
    standard: { zh: '美东', en: 'EST' }, 
    daylight: { zh: '美东', en: 'EDT' } 
  }],
  // 美国山区时区
  ['mountain', { 
    standard: { zh: '山区', en: 'MST' }, 
    daylight: { zh: '山区', en: 'MDT' } 
  }],
  // 北京时间 (不使用夏令时)
  ['beijing', { 
    standard: { zh: '北京', en: 'CST' }, 
    daylight: { zh: '北京', en: 'CST' } 
  }],
]);

/**
 * 传统时区映射表 - 兼容旧格式
 */
const TIMEZONE_MAP = new Map<string, { zh: string; en: string }>([
  ['美中部时区(Central Time, CT)', { zh: '美中', en: 'CT' }],
  ['美西部时区(Pacific Time, PT)', { zh: '美西', en: 'PT' }], 
  ['美东部时区(Eastern Time, ET)', { zh: '美东', en: 'ET' }],
  ['美山区时区(Mountain Time, MT)', { zh: '山区', en: 'MT' }],
  ['北京时间(Beijing Time, CST)', { zh: '北京', en: 'CST' }],
  ['Central Time, CT', { zh: '美中', en: 'CT' }],
  ['Pacific Time, PT', { zh: '美西', en: 'PT' }],
  ['Eastern Time, ET', { zh: '美东', en: 'ET' }],
  ['Mountain Time, MT', { zh: '山区', en: 'MT' }],
  ['Beijing Time, CST', { zh: '北京', en: 'CST' }],
]);

/**
 * 获取时区缩写 - 支持夏令时/冬令时智能检测
 */
const getTimezoneAbbreviation = (timezone?: string, activityDate?: string, language: 'zh' | 'en' = 'zh'): string => {
  if (!timezone) return '';
  
  // 先检查传统映射表(完整匹配)
  const exactMatch = TIMEZONE_MAP.get(timezone);
  if (exactMatch) {
    return exactMatch[language];
  }
  
  // 检查部分匹配
  for (const [key, value] of TIMEZONE_MAP.entries()) {
    if (timezone.includes(key) || key.includes(timezone)) {
      return value[language];
    }
  }
  
  // 智能夏令时检测逻辑
  if (activityDate) {
    const activityDateTime = new Date(activityDate);
    const isDST = isDaylightSavingTime(activityDateTime);
    
    // 检测时区类型并应用夏令时规则
    const timezoneKey = detectTimezoneKey(timezone);
    if (timezoneKey) {
      const timezoneConfig = TIMEZONE_DST_MAP.get(timezoneKey);
      if (timezoneConfig) {
        return isDST ? timezoneConfig.daylight[language] : timezoneConfig.standard[language];
      }
    }
  }
  
  // 传统关键词匹配作为fallback
  if (timezone.toLowerCase().includes('central') || timezone.includes('中部')) {
    return language === 'zh' ? '美中' : 'CT';
  }
  if (timezone.toLowerCase().includes('pacific') || timezone.includes('西部')) {
    return language === 'zh' ? '美西' : 'PT';
  }
  if (timezone.toLowerCase().includes('eastern') || timezone.includes('东部')) {
    return language === 'zh' ? '美东' : 'ET';
  }
  if (timezone.toLowerCase().includes('mountain') || timezone.includes('山区')) {
    return language === 'zh' ? '山区' : 'MT';
  }
  if (timezone.toLowerCase().includes('beijing') || timezone.includes('北京')) {
    return language === 'zh' ? '北京' : 'CST';
  }
  
  return ''; // 无法识别时返回空
};

/**
 * 检测时区关键字
 */
const detectTimezoneKey = (timezone: string): string | null => {
  const tz = timezone.toLowerCase();
  if (tz.includes('central') || tz.includes('中部')) return 'central';
  if (tz.includes('pacific') || tz.includes('西部')) return 'pacific';
  if (tz.includes('eastern') || tz.includes('东部')) return 'eastern';
  if (tz.includes('mountain') || tz.includes('山区')) return 'mountain';
  if (tz.includes('beijing') || tz.includes('北京')) return 'beijing';
  return null;
};

/**
 * 快速解析时间字符串（带缓存）
 */
const parseDateTime = (dateTimeString: string): { date: string; time: string } => {
  // 检查缓存
  const cached = TIME_PARSE_CACHE.get(dateTimeString);
  if (cached) return cached;
  
  let result: { date: string; time: string };
  
  try {
    const date = new Date(dateTimeString);
    result = {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      time: date.toTimeString().slice(0, 5), // HH:MM
    };
  } catch (error) {
    // Fallback parsing
    const parts = dateTimeString.split(' ');
    result = {
      date: parts[0] || '',
      time: parts[1]?.slice(0, 5) || '',
    };
  }
  
  // 缓存结果（限制缓存大小，防止内存泄漏）
  if (TIME_PARSE_CACHE.size < 100) {
    TIME_PARSE_CACHE.set(dateTimeString, result);
  }
  
  return result;
};

/**
 * 适配单个活动数据
 */
// 🚀 性能优化：批量适配活动数据
export const adaptActivity = (
  backendActivity: BackendActivity, 
  language: 'zh' | 'en' = 'zh'
): FrontendActivity => {
  // 快速解析时间（使用缓存）
  const { date, time } = parseDateTime(backendActivity.startTime);
  const { date: endDate } = parseDateTime(backendActivity.endTime);
  
  // 实时计算活动状态，确保准确性
  const calculateRealTimeStatus = (): 'available' | 'ended' | 'registered' | 'checked_in' => {
    // 🔥 修复优先级：先基于时间判断活动状态，再考虑用户报名状态
    const now = new Date();
    const activityStart = new Date(backendActivity.startTime);
    const activityEnd = new Date(backendActivity.endTime);
    
    // 🎯 详细时间计算调试
    const isEnded = activityEnd.getTime() < now.getTime();
    const isOngoing = activityStart.getTime() <= now.getTime() && activityEnd.getTime() >= now.getTime();
    
    if (backendActivity.name.includes('USC')) {
      console.log(`🎯 [TIME-DEBUG] USC活动修复后时间计算:`, {
        活动名称: backendActivity.name,
        当前时间: now.toISOString(),
        开始时间原始: backendActivity.startTime,
        结束时间原始: backendActivity.endTime,
        开始时间解析: activityStart.toISOString(),
        结束时间解析: activityEnd.toISOString(),
        时间戳比较: {
          现在: now.getTime(),
          开始: activityStart.getTime(),
          结束: activityEnd.getTime()
        },
        判断结果: {
          已结束: isEnded,
          进行中: isOngoing,
          时间基础状态: isEnded ? 'ended' : 'available'
        },
        用户状态: {
          signStatus: backendActivity.signStatus,
          用户状态转换: backendActivity.signStatus !== undefined ? convertRegistrationStatus(backendActivity.signStatus) : '无'
        }
      });
    }
    
    // ✅ 第一优先级：活动已结束则直接返回ended，不考虑用户状态
    if (isEnded) {
      return 'ended'; // 已结束的活动，不管用户是否报名都是ended
    }
    
    // ✅ 第二优先级：对于未结束的活动，考虑用户的报名/签到状态
    if (backendActivity.signStatus !== undefined && backendActivity.signStatus !== 0) {
      // 只有当用户已报名或已签到时，才返回特殊状态
      return convertRegistrationStatus(backendActivity.signStatus);
    }
    
    // ✅ 第三优先级：对于未结束的活动，统一显示为可报名
    return 'available'; // 可报名（不管是否已开始）
  };
  
  const activityStatus = calculateRealTimeStatus();
    
  // 🚀 详细调试报名人数数据映射
  console.log(`🔄 活动${backendActivity.id}[${backendActivity.name}]数据详情:`, {
    enrollment: backendActivity.enrollment,
    registerCount: backendActivity.registerCount,
    registerCountType: typeof backendActivity.registerCount,
    hasRegisterCount: backendActivity.registerCount !== undefined,
    timeZone: backendActivity.timeZone,
    signStatus: backendActivity.signStatus,
    willUseValue: backendActivity.registerCount ?? 0,
  });

  return {
    id: backendActivity.id.toString(),
    title: backendActivity.name,
    location: backendActivity.address,
    date,
    endDate,
    time,
    image: backendActivity.icon,
    attendees: backendActivity.registerCount ?? 0, // 使用真实的报名人数，null时为0
    maxAttendees: backendActivity.enrollment || 0, // 保持真实的enrollment值，0表示无限制
    registeredCount: backendActivity.registerCount ?? 0, // 已报名人数，支持undefined/null
    status: activityStatus,
    category: backendActivity.categoryId 
      ? getCategoryName(backendActivity.categoryId, language)
      : undefined,
    organizer: {
      name: '官方活动', // 暂时使用通用名称
      verified: true,
    },
    // 🔧 添加完整的时间字段，用于精确的状态判断
    startTime: backendActivity.startTime,
    endTime: backendActivity.endTime,
    registrationStartTime: backendActivity.signStartTime,
    registrationEndTime: backendActivity.signEndTime,
    detail: backendActivity.detail,
    enabled: backendActivity.enabled === 1,
    timeZone: backendActivity.timeZone,
  };
};

/**
 * 智能活动排序算法 - 混合时间紧急性和发布新鲜度
 */
const smartSortActivities = (activities: FrontendActivity[]): FrontendActivity[] => {
  const now = new Date();
  
  return activities.sort((a, b) => {
    const aStart = new Date(a.date + ' ' + a.time);
    const bStart = new Date(b.date + ' ' + b.time);
    const aEnd = a.endDate ? new Date(a.endDate + ' 23:59:59') : aStart;
    const bEnd = b.endDate ? new Date(b.endDate + ' 23:59:59') : bStart;
    
    // 计算到活动开始的小时数
    const aHoursToStart = (aStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    const bHoursToStart = (bStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // 判断活动是否已结束
    const aEnded = aEnd.getTime() < now.getTime();
    const bEnded = bEnd.getTime() < now.getTime();
    
    // 已结束的活动排在最后
    if (aEnded && !bEnded) return 1;
    if (!aEnded && bEnded) return -1;
    if (aEnded && bEnded) return parseInt(b.id) - parseInt(a.id); // 已结束的按发布时间排序
    
    // 第一层：24小时内的紧急活动（优先级最高）
    const aUrgent = aHoursToStart >= 0 && aHoursToStart <= 24;
    const bUrgent = bHoursToStart >= 0 && bHoursToStart <= 24;
    
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    if (aUrgent && bUrgent) return aHoursToStart - bHoursToStart;
    
    // 第二层：7天内的即将开始活动
    const aUpcoming = aHoursToStart >= 0 && aHoursToStart <= 168; // 7*24h
    const bUpcoming = bHoursToStart >= 0 && bHoursToStart <= 168;
    
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    if (aUpcoming && bUpcoming) return aHoursToStart - bHoursToStart;
    
    // 第三层：其他活动按ID倒序排序(代表发布时间)
    return parseInt(b.id) - parseInt(a.id);
  });
};

/**
 * 适配活动列表数据
 */
export const adaptActivityList = (
  backendResponse: {
    total: number;
    rows: BackendActivity[];
    code: number;
    msg: string;
  },
  language: 'zh' | 'en' = 'zh'
): {
  activities: FrontendActivity[];
  total: number;
  success: boolean;
  message: string;
} => {
  if (backendResponse.code !== 200) {
    return {
      activities: [],
      total: 0,
      success: false,
      message: backendResponse.msg,
    };
  }

  const activities = backendResponse.rows
    .filter(activity => activity.enabled === 1) // 只显示启用的活动
    .map(activity => adaptActivity(activity, language));

  // 应用智能排序算法
  const sortedActivities = smartSortActivities(activities);

  return {
    activities: sortedActivities,
    total: backendResponse.total,
    success: true,
    message: backendResponse.msg,
  };
};

/**
 * 判断活动是否可以报名
 */
export const canRegisterForActivity = (activity: FrontendActivity): boolean => {
  if (!activity.registrationStartTime || !activity.registrationEndTime) {
    return true; // 如果没有报名时间限制，默认可以报名
  }
  
  const now = new Date();
  const registrationStart = new Date(activity.registrationStartTime);
  const registrationEnd = new Date(activity.registrationEndTime);
  
  return now >= registrationStart && now <= registrationEnd;
};

/**
 * 获取活动状态文本
 */
export const getActivityStatusText = (
  activity: FrontendActivity, 
  t: (key: string) => string
): string => {
  switch (activity.status) {
    case 'registered':
      return t('activities.status.registered');
    case 'checked_in':
      return t('activities.status.checked_in');
    case 'upcoming':
      return canRegisterForActivity(activity) 
        ? t('activities.status.available') 
        : t('activities.status.registration_closed');
    default:
      return '';
  }
};

/**
 * 格式化带时区的日期显示
 */
export const formatActivityDateWithTimezone = (
  activity: FrontendActivity,
  language: 'zh' | 'en' = 'zh'
): string => {
  // 获取时区缩写 - 传递活动日期用于夏令时检测
  const timezoneAbbrev = getTimezoneAbbreviation(activity.timeZone, activity.date, language);
  
  // 格式化日期
  const formatSingleDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return { year: parseInt(year), month: parseInt(month), day: parseInt(day) };
  };
  
  const start = formatSingleDate(activity.date);
  
  // 构建日期显示
  let dateDisplay = '';
  if (activity.endDate && activity.endDate !== activity.date) {
    const end = formatSingleDate(activity.endDate);
    // 多日活动: 09/11-09/17
    dateDisplay = `${start.month.toString().padStart(2, '0')}/${start.day.toString().padStart(2, '0')}-${end.month.toString().padStart(2, '0')}/${end.day.toString().padStart(2, '0')}`;
  } else {
    // 单日活动: 09/11
    dateDisplay = `${start.month.toString().padStart(2, '0')}/${start.day.toString().padStart(2, '0')}`;
  }
  
  // 添加时间（如果不是00:00）
  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr === '00:00') return '';
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return ` ${hour12}:${minutes}${ampm}`;
  };
  
  const timeDisplay = formatTime(activity.time) || '';
  
  // 组合时区前缀 + 日期 + 时间
  return timezoneAbbrev 
    ? `${timezoneAbbrev} ${dateDisplay}${timeDisplay}`
    : `${dateDisplay}${timeDisplay}`;
};