/**
 * 志愿者相关的类型定义
 * 用于替换SchoolDetailScreen中的any类型，提升类型安全
 */

export interface VolunteerRecord {
  id: number;
  userId: number;
  startTime: string;
  endTime: string | null;
  type: 1 | 2; // 1-签到 2-签退
}

export interface VolunteerHours {
  userId: number;
  totalMinutes: number;
  totalHours: number;
}

export interface UserRole {
  key?: string;
  roleKey?: string;
  roleName?: string;
  name?: string;
}

export interface UserPost {
  postCode: string;
  postName?: string;
  postId?: number;
}

export interface UserData {
  userId: number;
  userName: string;
  legalName: string;
  nickName?: string;
  phonenumber?: string;
  admin: boolean;
  roles: UserRole[];
  posts?: UserPost[];
  deptId: number;
}

export interface VolunteerInfo {
  id: string;
  name: string;
  legalName: string;
  userName: string;
  phoneNumber?: string;
  userId: number;
  hours: number;
  totalHours: number;
  level: string;
  major: string;
  checkInStatus: 'checked_in' | 'not_checked_in' | 'checked_out';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  lastCheckInTime?: string | null;
  lastCheckOutTime?: string | null;
}

export interface VolunteerStatusUpdate {
  checkInStatus: 'checked_in' | 'not_checked_in' | 'checked_out';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  lastCheckInTime?: string | null;
  lastCheckOutTime?: string | null;
}

export interface APIResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
  rows?: T[];
  total?: number;
}