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
  status: 'upcoming' | 'ongoing' | 'ended' | 'registered' | 'checked_in';
  category?: string;
  organizer?: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  // 额外信息
  registrationStartTime?: string;
  registrationEndTime?: string;
  detail?: string;
  enabled?: boolean;
}

// 🚀 性能优化：预编译状态映射表
const REGISTRATION_STATUS_MAP = new Map<number, 'upcoming' | 'registered' | 'checked_in'>([
  [-1, 'registered'],
  [1, 'checked_in'],
]);

const ACTIVITY_TYPE_MAP = new Map<number, 'upcoming' | 'ongoing' | 'ended'>([
  [-1, 'upcoming'],
  [1, 'ongoing'], 
  [2, 'ended'],
]);

/**
 * 快速转换报名状态
 */
const convertRegistrationStatus = (signStatus?: number): 'upcoming' | 'registered' | 'checked_in' => {
  return REGISTRATION_STATUS_MAP.get(signStatus ?? 0) ?? 'upcoming';
};

/**
 * 快速转换活动类型状态
 */
const convertActivityType = (type?: number): 'upcoming' | 'ongoing' | 'ended' => {
  return ACTIVITY_TYPE_MAP.get(type ?? -1) ?? 'upcoming';
};

// 🚀 性能优化：快速时间解析缓存
const TIME_PARSE_CACHE = new Map<string, { date: string; time: string }>();

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
  const calculateRealTimeStatus = (): 'upcoming' | 'ongoing' | 'ended' | 'registered' | 'checked_in' => {
    // 第一优先级：用户的报名/签到状态
    if (backendActivity.signStatus !== undefined) {
      return convertRegistrationStatus(backendActivity.signStatus);
    }
    
    // 第二优先级：基于当前时间实时计算活动状态
    const now = new Date();
    const activityStart = new Date(backendActivity.startTime);
    const activityEnd = new Date(backendActivity.endTime);
    
    if (activityEnd.getTime() < now.getTime()) {
      return 'ended'; // 已结束
    } else if (activityStart.getTime() <= now.getTime() && activityEnd.getTime() >= now.getTime()) {
      return 'ongoing'; // 进行中
    } else {
      return 'upcoming'; // 即将开始
    }
  };
  
  const activityStatus = calculateRealTimeStatus();
    
  // 🚀 减少调试日志，只在必要时输出
  if (backendActivity.id % 10 === 0) { // 每10个活动输出一次状态
    console.log(`🔄 活动${backendActivity.id}状态转换:`, {
      signStatus: backendActivity.signStatus,
      type: backendActivity.type, 
      result: activityStatus
    });
  }

  return {
    id: backendActivity.id.toString(),
    title: backendActivity.name,
    location: backendActivity.address,
    date,
    endDate,
    time,
    image: backendActivity.icon,
    attendees: 0, // 后端暂无此数据，默认为0
    maxAttendees: backendActivity.enrollment || 100, // 如果enrollment为0，默认设为100
    status: activityStatus,
    category: backendActivity.categoryId 
      ? getCategoryName(backendActivity.categoryId, language)
      : undefined,
    organizer: {
      name: '官方活动', // 暂时使用通用名称
      verified: true,
    },
    registrationStartTime: backendActivity.signStartTime,
    registrationEndTime: backendActivity.signEndTime,
    detail: backendActivity.detail,
    enabled: backendActivity.enabled === 1,
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