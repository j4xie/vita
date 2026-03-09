/**
 * 用户权限管理工具
 * 用于计算用户扫描身份码时的权限和可见信息
 */

import { PositionInfo } from '../types/userIdentity';

// 权限等级枚举
export enum PermissionLevel {
  GUEST = 0,        // 访客
  USER = 1,         // 普通用户 
  STAFF = 2,        // 内部员工
  PART_ADMIN = 3,   // 分管理员
  ADMIN = 4,        // 总管理员
}

// 权限配置接口
export interface UserPermissions {
  canViewBasicInfo: boolean;      // 可以查看基本信息
  canViewContactInfo: boolean;    // 可以查看联系信息
  canViewStudentId: boolean;      // 可以查看学号
  canViewActivityStats: boolean;  // 可以查看活动统计
  canViewRecentActivities: boolean; // 可以查看最近活动
  canViewSensitiveInfo: boolean;  // 可以查看敏感信息
  canViewFullProfile: boolean;    // 可以查看完整档案
  isHigherAuthority: boolean;     // 是否拥有更高权限
  accessLevel: PermissionLevel;   // 访问等级
}

/**
 * 从职位信息获取权限等级
 */
export const getPermissionLevel = (position?: PositionInfo): PermissionLevel => {
  if (!position) return PermissionLevel.GUEST;
  
  switch (position.level) {
    case 'admin':
      return PermissionLevel.ADMIN;
    case 'part_admin':
      return PermissionLevel.PART_ADMIN;
    case 'staff':
      return PermissionLevel.STAFF;
    case 'user':
      return PermissionLevel.USER;
    default:
      return PermissionLevel.GUEST;
  }
};

/**
 * 从用户角色键获取权限等级
 */
export const getPermissionLevelFromRoleKey = (roleKey?: string): PermissionLevel => {
  if (!roleKey) return PermissionLevel.GUEST;

  switch (roleKey) {
    case 'manage':
      return PermissionLevel.ADMIN;
    case 'part_manage':
      return PermissionLevel.PART_ADMIN;
    case 'staff':
      return PermissionLevel.STAFF;
    case 'merchant':
      return PermissionLevel.USER; // 商家用户权限等级等同普通用户
    case 'common':
      return PermissionLevel.USER;
    default:
      return PermissionLevel.GUEST;
  }
};

/**
 * 计算用户权限
 * @param scannerLevel 扫描者的权限等级
 * @param targetLevel 被扫描用户的权限等级
 * @returns 权限配置
 */
export const calculateUserPermissions = (
  scannerLevel: PermissionLevel,
  targetLevel: PermissionLevel
): UserPermissions => {
  
  const isHigherAuthority = scannerLevel > targetLevel;
  const isSameOrHigherLevel = scannerLevel >= targetLevel;
  
  return {
    // 基本信息 - 所有用户都可以查看
    canViewBasicInfo: true,
    
    // 联系信息 - 员工及以上可以查看，或者查看同等级/低等级用户
    canViewContactInfo: scannerLevel >= PermissionLevel.STAFF || isSameOrHigherLevel,
    
    // 学号 - 员工及以上可以查看
    canViewStudentId: scannerLevel >= PermissionLevel.STAFF,
    
    // 活动统计 - 分管理员及以上可以查看，或者查看低等级用户
    canViewActivityStats: scannerLevel >= PermissionLevel.PART_ADMIN || isHigherAuthority,
    
    // 最近活动 - 员工及以上可以查看
    canViewRecentActivities: scannerLevel >= PermissionLevel.STAFF,
    
    // 敏感信息 - 总管理员可以查看，或者查看低两个等级以上的用户
    canViewSensitiveInfo: scannerLevel >= PermissionLevel.ADMIN || (scannerLevel - targetLevel >= 2),
    
    // 完整档案 - 员工及以上可以查看
    canViewFullProfile: scannerLevel >= PermissionLevel.STAFF,
    
    // 权限标识
    isHigherAuthority,
    accessLevel: scannerLevel,
  };
};

/**
 * 获取权限等级的显示名称
 */
export const getPermissionLevelDisplayName = (level: PermissionLevel): { zh: string; en: string } => {
  switch (level) {
    case PermissionLevel.ADMIN:
      return { zh: '总管理员', en: 'Administrator' };
    case PermissionLevel.PART_ADMIN:
      return { zh: '分管理员', en: 'Partial Administrator' };
    case PermissionLevel.STAFF:
      return { zh: '内部员工', en: 'Staff' };
    case PermissionLevel.USER:
      return { zh: '普通用户', en: 'User' };
    case PermissionLevel.GUEST:
    default:
      return { zh: '访客', en: 'Guest' };
  }
};

/**
 * 获取权限等级的颜色
 */
export const getPermissionLevelColor = (level: PermissionLevel): string => {
  switch (level) {
    case PermissionLevel.ADMIN:
      return '#DC2626'; // 红色 - 最高权限
    case PermissionLevel.PART_ADMIN:
      return '#EA580C'; // 橙色 - 高权限
    case PermissionLevel.STAFF:
      return '#2563EB'; // 蓝色 - 中权限
    case PermissionLevel.USER:
      return '#16A34A'; // 绿色 - 基础权限
    case PermissionLevel.GUEST:
    default:
      return '#6B7280'; // 灰色 - 无权限
  }
};

/**
 * 获取权限描述文本
 */
export const getPermissionDescription = (permissions: UserPermissions): string => {
  if (permissions.canViewSensitiveInfo) {
    return '🔑 您拥有查看此用户所有信息的权限';
  } else if (permissions.isHigherAuthority) {
    return '🔍 您拥有查看此用户详细信息的权限';
  } else if (permissions.canViewFullProfile) {
    return '👁️ 您可以查看此用户的基本档案';
  } else if (permissions.canViewBasicInfo) {
    return '📋 您只能查看此用户的公开信息';
  } else {
    return '⚠️ 您没有查看此用户信息的权限';
  }
};

/**
 * 权限配置预设
 */
export const PERMISSION_PRESETS = {
  // 访客权限：只能查看最基本的公开信息
  GUEST: {
    canViewBasicInfo: true,
    canViewContactInfo: false,
    canViewStudentId: false,
    canViewActivityStats: false,
    canViewRecentActivities: false,
    canViewSensitiveInfo: false,
    canViewFullProfile: false,
    isHigherAuthority: false,
    accessLevel: PermissionLevel.GUEST,
  } as UserPermissions,

  // 普通用户权限：查看同等级用户的基本信息
  USER: {
    canViewBasicInfo: true,
    canViewContactInfo: true,
    canViewStudentId: false,
    canViewActivityStats: false,
    canViewRecentActivities: false,
    canViewSensitiveInfo: false,
    canViewFullProfile: false,
    isHigherAuthority: false,
    accessLevel: PermissionLevel.USER,
  } as UserPermissions,

  // 员工权限：查看大部分信息
  STAFF: {
    canViewBasicInfo: true,
    canViewContactInfo: true,
    canViewStudentId: true,
    canViewActivityStats: false,
    canViewRecentActivities: true,
    canViewSensitiveInfo: false,
    canViewFullProfile: true,
    isHigherAuthority: true,
    accessLevel: PermissionLevel.STAFF,
  } as UserPermissions,

  // 分管理员权限：查看详细统计信息
  PART_ADMIN: {
    canViewBasicInfo: true,
    canViewContactInfo: true,
    canViewStudentId: true,
    canViewActivityStats: true,
    canViewRecentActivities: true,
    canViewSensitiveInfo: false,
    canViewFullProfile: true,
    isHigherAuthority: true,
    accessLevel: PermissionLevel.PART_ADMIN,
  } as UserPermissions,

  // 总管理员权限：查看所有信息
  ADMIN: {
    canViewBasicInfo: true,
    canViewContactInfo: true,
    canViewStudentId: true,
    canViewActivityStats: true,
    canViewRecentActivities: true,
    canViewSensitiveInfo: true,
    canViewFullProfile: true,
    isHigherAuthority: true,
    accessLevel: PermissionLevel.ADMIN,
  } as UserPermissions,
};