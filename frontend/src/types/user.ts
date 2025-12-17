/**
 * User Type Definitions - Unified for PomeloX
 * Following TypeScript 5.0 best practices
 */

import { UserRoleInfo, UserPost, PermissionLevel } from './userPermissions';

/**
 * Base User Information
 */
export interface BaseUserInfo {
  userId: number | string;
  userName: string;
  legalName?: string;
  nickName?: string;
  email?: string;
  emailVerified?: boolean; // 邮箱是否已验证
  alternateEmail?: string;  // 第二邮箱/工作邮箱/学校邮箱
  alternateEmailVerified?: boolean; // 第二邮箱是否已验证
  phonenumber?: string;
  avatarUrl?: string;
  studentId?: string;
  deptId?: number | string;
  createTime?: string;
  updateTime?: string;
}

/**
 * Department Information
 */
export interface UserDepartment {
  deptId: number;
  deptName: string;
  parentId?: number;
  ancestors?: string;
  status?: string;
  engName?: string; // 英文名称
  aprName?: string; // 简称
}

/**
 * Complete User Information from Backend
 */
export interface BackendUserInfo extends BaseUserInfo {
  user?: BaseUserInfo; // Nested user object from backend
  dept?: UserDepartment;
  roles?: UserRoleInfo[];
  role?: UserRoleInfo; // Single role for compatibility
  posts?: UserPost[];
  roleIds?: number[];
  postIds?: number[];
  admin?: boolean;
  status?: string;
  delFlag?: string;
  loginIp?: string;
  loginDate?: string;
  remark?: string;
}

/**
 * Frontend User Model (Normalized)
 */
export interface FrontendUser extends BaseUserInfo {
  organization?: {
    id: string | number;
    name: string;
    icon?: string;
  };
  department?: UserDepartment;
  roles: Array<{
    id?: number;
    key: string;
    name: string;
    isAdmin: boolean;
  }>;
  permissionLevel: PermissionLevel;
  isAdmin: boolean;
  status: 'active' | 'inactive' | 'pending';
  areaCode?: string; // 区号
  sex?: string; // 性别
  postCode?: string; // 岗位代码
  points?: number; // 用户积分
}

/**
 * User Context Data
 */
export interface UserContextData {
  user: FrontendUser | null;
  token: string | null;
  isLoggedIn: boolean;
  permissionLevel: PermissionLevel;
}

/**
 * User Statistics
 */
export interface UserStats {
  totalHours?: number;
  totalActivities?: number;
  currentMonthHours?: number;
  ranking?: number;
  badges?: string[];
}

/**
 * User Permissions (for scanning/viewing)
 */
export interface UserPermissions {
  canViewBasicInfo: boolean;
  canViewContactInfo: boolean;
  canViewStudentId: boolean;
  canViewActivityStats: boolean;
  canViewRecentActivities: boolean;
  canViewFullProfile: boolean;
  canEditInfo: boolean;
  canManageUsers: boolean;
  canManageUser: boolean;
  canManageActivities: boolean;
  canAccessPlatform: boolean;
  canViewSensitiveInfo: boolean;
  isHigherAuthority: boolean;
  canViewDetails?: boolean; // Legacy compatibility
  canViewContact?: boolean; // Legacy compatibility
  canViewActivities?: boolean; // Legacy compatibility
}

/**
 * Type Guards for User Types
 */
export const isBackendUser = (user: any): user is BackendUserInfo => {
  return user && (typeof user.userId === 'number' || typeof user.userId === 'string');
};

export const isFrontendUser = (user: any): user is FrontendUser => {
  return user && user.permissionLevel && Array.isArray(user.roles);
};

/**
 * Default User Values
 */
export const DEFAULT_USER: Partial<FrontendUser> = {
  roles: [],
  permissionLevel: 'common' as PermissionLevel,
  isAdmin: false,
  status: 'active',
};

/**
 * User Role Helpers
 */
export const getUserPrimaryRole = (user: BackendUserInfo | FrontendUser): string => {
  if ('permissionLevel' in user) {
    return user.permissionLevel;
  }
  if (user.roles && user.roles.length > 0) {
    const role = user.roles[0];
    return typeof role === 'string' ? role : (role.key || role.roleKey || 'common');
  }
  if ('role' in user && user.role) {
    return user.role.key || user.role.roleKey || 'common';
  }
  return 'common';
};

/**
 * Permission Check Helpers
 */
export const hasPermission = (user: FrontendUser | null, requiredLevel: PermissionLevel): boolean => {
  if (!user) return false;

  const levelHierarchy: Record<PermissionLevel, number> = {
    'manage': 4,
    'part_manage': 3,
    'staff': 2,
    'common': 1,
    'guest': 0,
  };

  return levelHierarchy[user.permissionLevel] >= levelHierarchy[requiredLevel];
};