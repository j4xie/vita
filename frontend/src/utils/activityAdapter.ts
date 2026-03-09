// 活动数据适配器 - 转换后端数据到前端格式
import { getCategoryName } from '../data/activityCategories';
import { getLogoByDeptIdSync, getSchoolLogoSync, getSchoolNameByDeptIdSync } from '../hooks/useSchoolLogos';

// 后端活动数据接口 - 🔧 更新字段映射以匹配实际API
export interface BackendActivity {
  id: number;
  activityName?: string; // 🔧 新增：有些API返回activityName
  name?: string; // 兼容旧格式
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
  signStatus?: number; // 🔧 用户报名状态：0-未报名，-1-已报名未签到，1-已签到
  type?: number; // -1-即将开始，1-已开始，2-已结束
  categoryId?: number;
  registerCount?: number; // 活动已报名人数
  timeZone?: string; // 活动时区
  price?: number; // 活动价格（0表示免费）
  modelContent?: string; // 动态表单模板内容
  deptId?: number; // 🔧 创建者所属部门ID（通常是总部223）
  deptIds?: string | number; // 🔧 活动所属学校ID（正确的学校ID）
  deptName?: string; // 🔧 活动所属学校名称
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
  // 扁平化的组织者字段（供 GridActivityCard 使用）
  organizerName?: string;
  organizerAvatar?: string;
  // 额外信息
  registrationStartTime?: string;
  registrationEndTime?: string;
  detail?: string;
  enabled?: boolean;
  timeZone?: string; // 活动时区
  price?: number; // 活动价格（0或undefined表示免费）
  modelContent?: string; // 动态表单模板内容
  // 🆕 学校信息
  deptId?: number; // 活动所属学校ID
  deptName?: string; // 活动所属学校名称
  registeredUserAvatars?: string[]; // 已报名用户头像（后端返回时才有）
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
 * ✅ 增强容错的报名状态转换函数 - 支持备用状态
 */
const convertRegistrationStatus = (
  signStatus?: number | null,
  fallbackStatus?: 'registered' | 'checked_in' | 'available'
): 'available' | 'registered' | 'checked_in' => {

  // ✅ 如果API返回失败或空值，使用备用状态
  if (signStatus === null || signStatus === undefined) {
    if (fallbackStatus === 'registered' || fallbackStatus === 'checked_in') {
      console.log(`✅ [STATUS-MAP] 使用备用状态:`, {
        signStatus,
        fallbackStatus,
        原因: 'API返回空值或失败'
      });
      return fallbackStatus;
    }
    return 'available';
  }

  // ✅ 正常映射逻辑
  const result = REGISTRATION_STATUS_MAP.get(signStatus) ?? 'available';

  // 详细的映射日志
  console.log(`🔄 [STATUS-MAP] signStatus映射:`, {
    输入signStatus: signStatus,
    是否为undefined: signStatus === undefined,
    是否为null: signStatus === null,
    fallbackStatus,
    映射结果: result,
    映射表: Object.fromEntries(REGISTRATION_STATUS_MAP.entries())
  });

  return result;
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
 * 清除时间解析缓存 - 用于强制刷新场景
 */
export const clearTimeParseCache = () => {
  const cacheSize = TIME_PARSE_CACHE.size;
  TIME_PARSE_CACHE.clear();
  console.log(`🧹 [CACHE-CLEAR] 清除时间解析缓存: ${cacheSize}条记录`);
};

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
 * 时区映射表 - 支持夏令时/冬令时动态切换（仅用于显示时区名称）
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
 * 获取时区缩写 - 支持夏令时/冬令时智能检测（仅用于显示）
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

  // 智能夏令时检测逻辑（仅用于显示时区名称，不转换时间）
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
 * 🔧 修复：直接字符串拆分，不做时区转换
 * ⚠️ 后端传什么时间，前端就显示什么时间
 */
const parseDateTime = (dateTimeString: string): { date: string; time: string } => {
  // 检查缓存
  const cached = TIME_PARSE_CACHE.get(dateTimeString);
  if (cached) return cached;

  let result: { date: string; time: string };

  // 🔧 直接拆分字符串，避免 new Date() 的时区转换问题
  // 后端返回格式: "2025-09-29 18:00:00"
  const parts = dateTimeString.split(' ');
  result = {
    date: parts[0] || '',              // YYYY-MM-DD
    time: parts[1]?.slice(0, 5) || '', // HH:MM
  };

  // 验证日期格式
  if (!result.date || !/^\d{4}-\d{2}-\d{2}$/.test(result.date)) {
    console.warn('⚠️ [parseDateTime] 日期格式异常:', dateTimeString, '→', result.date);
  }

  // 缓存结果（限制缓存大小，防止内存泄漏）
  if (TIME_PARSE_CACHE.size < 100) {
    TIME_PARSE_CACHE.set(dateTimeString, result);
  }

  console.log('🕐 [parseDateTime]', {
    input: dateTimeString,
    output: result
  });

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
    // ✅ 第一优先级：用户的报名/签到状态（增强容错处理）
    if (backendActivity.signStatus !== undefined && backendActivity.signStatus !== null) {
      return convertRegistrationStatus(backendActivity.signStatus);
    }

    // 第二优先级：基于当前时间实时计算活动状态
    const now = new Date();
    const activityEnd = new Date(backendActivity.endTime.replace(/-/g, '/'));

    if (activityEnd.getTime() < now.getTime()) {
      return 'ended';
    } else {
      return 'available';
    }
  };

  const activityStatus = calculateRealTimeStatus();

  // 🔧 修复活动名称获取逻辑，支持多种字段名
  const activityTitle = backendActivity.activityName || backendActivity.name || `活动${backendActivity.id}`;

  // 🔧 获取活动所属学校名称 - 优先 deptIds，fallback 到 deptId，再通过 school cache 查英文名
  const activitySchoolId = backendActivity.deptIds ? parseInt(String(backendActivity.deptIds), 10) : backendActivity.deptId;
  const schoolName = getSchoolNameByDeptIdSync(activitySchoolId, language) || backendActivity.deptName || (language === 'en' ? 'Official Event' : '官方活动');

  return {
    id: backendActivity.id.toString(),
    title: activityTitle,
    location: backendActivity.address,
    date,
    endDate,
    time,
    image: backendActivity.icon,
    attendees: backendActivity.registerCount ?? 0,
    maxAttendees: backendActivity.enrollment || 0,
    registeredCount: backendActivity.registerCount ?? 0,
    status: activityStatus,
    category: backendActivity.categoryId
      ? getCategoryName(backendActivity.categoryId, language)
      : undefined,
    organizer: {
      name: schoolName,
      avatar: getSchoolLogoSync(activityTitle, backendActivity.address) ||
              getLogoByDeptIdSync(activitySchoolId || backendActivity.deptId) ||
              'https://image.americanpromotioncompany.com/2026/01/05/275c7520-5b3f-4717-9800-dc80dac2f82a.png',
      verified: true,
    },
    organizerName: schoolName,
    organizerAvatar: getSchoolLogoSync(activityTitle, backendActivity.address) ||
                    getLogoByDeptIdSync(activitySchoolId || backendActivity.deptId) ||
                    'https://image.americanpromotioncompany.com/2026/01/05/275c7520-5b3f-4717-9800-dc80dac2f82a.png',
    registrationStartTime: backendActivity.signStartTime,
    registrationEndTime: backendActivity.signEndTime,
    detail: backendActivity.detail,
    enabled: backendActivity.enabled === 1,
    timeZone: backendActivity.timeZone,
    price: backendActivity.price,
    modelContent: backendActivity.modelContent,
    // 🔧 学校信息 - 优先使用deptIds（活动所属学校），fallback到deptId（创建者部门）
    deptId: backendActivity.deptIds ? parseInt(String(backendActivity.deptIds), 10) : backendActivity.deptId,
    deptName: backendActivity.deptName,
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
  language: 'zh' | 'en' = 'zh',
  forceRefresh: boolean = false
): {
  activities: FrontendActivity[];
  total: number;
  success: boolean;
  message: string;
} => {
  // 🔄 强制刷新时清除时间解析缓存
  if (forceRefresh) {
    clearTimeParseCache();
    console.log('🔄 [ADAPTER] 强制刷新模式，已清除时间缓存');
  }

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
    case 'available':
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