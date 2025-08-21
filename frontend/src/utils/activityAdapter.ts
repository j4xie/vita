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
  registrationStatus?: number;
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

/**
 * 转换报名状态
 */
const convertRegistrationStatus = (registrationStatus?: number): 'upcoming' | 'registered' | 'checked_in' => {
  switch (registrationStatus) {
    case -1:
      return 'registered';
    case 1:
      return 'checked_in';
    default:
      return 'upcoming';
  }
};

/**
 * 解析时间字符串为日期和时间
 */
const parseDateTime = (dateTimeString: string): { date: string; time: string } => {
  try {
    const date = new Date(dateTimeString);
    return {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      time: date.toTimeString().slice(0, 5), // HH:MM
    };
  } catch (error) {
    return {
      date: dateTimeString.split(' ')[0] || '',
      time: dateTimeString.split(' ')[1] || '',
    };
  }
};

/**
 * 适配单个活动数据
 */
export const adaptActivity = (
  backendActivity: BackendActivity, 
  language: 'zh' | 'en' = 'zh'
): FrontendActivity => {
  const { date, time } = parseDateTime(backendActivity.startTime);
  const { date: endDate } = parseDateTime(backendActivity.endTime);
  
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
    status: convertRegistrationStatus(backendActivity.registrationStatus),
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

  return {
    activities,
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