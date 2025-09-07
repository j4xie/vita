/**
 * 活动相关的类型定义
 * 用于替换ActivityListScreen中的any类型，提升类型安全
 */

export interface ScrollEvent {
  nativeEvent: {
    contentOffset: {
      y: number;
      x: number;
    };
    contentSize: {
      height: number;
      width: number;
    };
    layoutMeasurement: {
      height: number;
      width: number;
    };
  };
}

export interface Activity {
  id: string;
  title: string;
  location: string;
  date: string;
  endDate?: string;
  time: string;
  attendees: number;
  maxAttendees: number;
  status?: string;
  image?: string;
  category?: string;
  description?: string;
  organizer?: string;
  signStatus?: number; // 0-未报名，-1-已报名未签到，1-已签到
  type?: number; // -1-即将开始，1-已开始，2-已结束
}

export interface ActivityAPIResponse {
  code: number;
  msg: string;
  data?: {
    total: number;
    rows: Activity[];
  };
}

export interface NetworkError {
  name: string;
  message: string;
  code?: string;
  status?: number;
}