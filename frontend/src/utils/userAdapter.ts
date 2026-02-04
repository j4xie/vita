// 用户数据适配器 - 转换后端用户数据到前端格式

import { timeService } from './UnifiedTimeService';
import { PermissionLevel } from '../types/userPermissions';

// 后端用户数据接口（完整结构）
export interface BackendUserInfo {
  createBy: string;
  createTime: string;
  updateBy: string | null;
  updateTime: string | null;
  remark: string | null;
  userId: number;
  deptId: number | null;
  legalName: string;
  userName: string;
  nickName: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  password: string;
  status: string;
  delFlag: string;
  loginIp: string;
  loginDate: string;
  pwdUpdateDate: string | null;
  dept: {
    createBy: string | null;
    createTime: string | null;
    updateBy: string | null;
    updateTime: string | null;
    remark: string | null;
    deptId: number;
    parentId: number;
    ancestors: string;
    deptName: string;
    orderNum: number;
    leader: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    delFlag: string | null;
    parentName: string | null;
    children: any[];
  };
  roles: {
    createBy: string | null;
    createTime: string | null;
    updateBy: string | null;
    updateTime: string | null;
    remark: string | null;
    roleId: number;
    roleName: string;
    roleKey: string;
    roleSort: number;
    dataScope: string;
    menuCheckStrictly: boolean;
    deptCheckStrictly: boolean;
    status: string;
    delFlag: string | null;
    flag: boolean;
    menuIds: string | null;
    deptIds: string | null;
    permissions: string | null;
    admin: boolean;
  }[];
  roleIds: number[] | null;
  postIds: number[] | null;
  roleId: number | null;
  verCode: string | null;
  invCode: string | null;
  bizId: string | null;
  orgId: string | null;
  admin: boolean;
  area?: string; // 地域字段
  alternateEmail?: string; // 第二邮箱/工作邮箱/学校邮箱
}

// 前端用户数据接口（简化格式）
export interface FrontendUser {
  id: string;
  userId: number | string; // 用户ID（required to match types/user.ts）
  userName: string;
  legalName: string;
  nickName: string;
  email: string;
  alternateEmail?: string; // 第二邮箱/工作邮箱/学校邮箱
  phone: string;
  phonenumber?: string; // 兼容字段，与phone相同
  avatar: string;
  gender: 'male' | 'female' | 'unknown';
  isActive: boolean;
  lastLoginTime: string;
  createTime: string;

  // 🆕 保留原始权限字段供权限检查系统使用
  admin?: boolean;
  role?: any;
  post?: any;

  // 学校信息
  school: {
    id: string;
    name: string;
    parentId: number;
    ancestors: string;
  };
  dept?: { // 兼容字段，与school相同
    deptId: number;
    deptName: string;
  };
  deptId?: number; // 兼容字段

  // 角色权限
  roles: {
    id: number;
    name: string;
    key: string;
    isAdmin: boolean;
  }[];

  // 权限标识
  permissions: {
    isAdmin: boolean;
    isPartAdmin: boolean; // 分管理员
    canManageActivities: boolean;
    canManageVolunteers: boolean;
    canManageInvitations: boolean;
    // 兼容字段
    isOrganizer?: boolean;
    canAccessVolunteerFeatures?: boolean;
  };

  // 兼容字段
  name?: string; // 与legalName相同
  verified?: boolean;
  area?: 'zh' | 'en'; // 地域选择
  points?: number; // 积分

  // 兼容types/user.ts FrontendUser接口所需的字段
  permissionLevel: PermissionLevel;
  isAdmin: boolean; // 顶层isAdmin字段（与permissions.isAdmin一致）
  status: 'active' | 'inactive' | 'pending';
  department?: {
    deptId: number;
    deptName: string;
    parentId?: number;
    ancestors?: string;
    status?: string;
    engName?: string;
    aprName?: string;
  };
}

/**
 * 转换性别字段
 */
const convertGender = (sex: string): 'male' | 'female' | 'unknown' => {
  switch (sex) {
    case '0':
      return 'male';
    case '1':
      return 'female';
    default:
      return 'unknown';
  }
};

/**
 * 解析用户权限
 */
const parsePermissions = (roles: BackendUserInfo['roles'] | [], isAdmin: boolean) => {
  const safeRoles = Array.isArray(roles) ? roles : [];
  const hasRole = (roleKey: string) => safeRoles.some(role => role.roleKey === roleKey);

  return {
    isAdmin,
    isPartAdmin: hasRole('part_manage'), // 分管理员
    canManageActivities: isAdmin || hasRole('part_manage'),
    canManageVolunteers: isAdmin || hasRole('part_manage'),
    canManageInvitations: isAdmin || hasRole('part_manage'),
  };
};

/**
 * 从角色数组计算权限级别
 * @param roles 角色数组
 * @param isAdmin 是否为管理员
 * @returns 权限级别
 */
const getPermissionLevelFromRoles = (roles: BackendUserInfo['roles'] | [], isAdmin: boolean): PermissionLevel => {
  if (isAdmin) return 'manage';

  const safeRoles = Array.isArray(roles) ? roles : [];

  // 按权限优先级检查
  for (const role of safeRoles) {
    if (role.roleKey === 'manage') return 'manage';
    if (role.roleKey === 'part_manage') return 'part_manage';
    if (role.roleKey === 'staff') return 'staff';
  }

  return 'common';
};

/**
 * 格式化时间字符串
 */
const formatDateTime = (dateTime: string): string => {
  // 使用统一时间服务解析时间
  const parsedDate = timeService.parseServerTime(dateTime);
  if (parsedDate) {
    return parsedDate.toISOString();
  }
  // 如果解析失败，返回原始值
  return dateTime;
};

/**
 * 适配用户信息数据
 */
export const adaptUserInfo = (backendUser: BackendUserInfo): FrontendUser => {
  const userId = backendUser.userId.toString();

  // 处理角色数据：后端可能返回 role 对象或 roles 数组
  let safeRoles = Array.isArray(backendUser.roles) ? backendUser.roles : [];

  // 如果有 role 对象但 roles 数组为空，将 role 对象转换为数组格式
  const role = (backendUser as any).role;
  if (role && safeRoles.length === 0) {
    safeRoles = [{
      roleId: role.roleId,
      roleName: role.roleName,
      roleKey: role.roleKey,
      admin: role.admin,
      roleSort: role.roleSort,
      dataScope: role.dataScope,
      // Add missing required properties with defaults
      createBy: role.createBy || '',
      createTime: role.createTime || '',
      updateBy: role.updateBy || '',
      updateTime: role.updateTime || '',
      remark: role.remark || '',
      status: role.status || '0',
      flag: role.flag || false,
      menuCheckStrictly: role.menuCheckStrictly || false,
      deptCheckStrictly: role.deptCheckStrictly || false,
    } as any];
  }

  const permissions = parsePermissions(safeRoles, backendUser.admin);

  return {
    id: userId,
    userId, // 兼容字段
    userName: backendUser.userName,
    legalName: backendUser.legalName,
    nickName: backendUser.nickName,
    email: backendUser.email,
    alternateEmail: backendUser.alternateEmail,
    phone: backendUser.phonenumber,
    phonenumber: backendUser.phonenumber, // 兼容字段
    avatar: backendUser.avatar || '', // 处理空头像
    gender: convertGender(backendUser.sex),
    isActive: backendUser.status === '0', // "0"表示正常状态
    lastLoginTime: formatDateTime(backendUser.loginDate),
    createTime: formatDateTime(backendUser.createTime),

    // 🆕 保留原始权限字段供权限检查系统使用
    admin: backendUser.admin,
    role: role,
    post: (backendUser as any).post,

    // 学校信息 - 处理deptId为null的情况
    school: {
      id: backendUser.deptId ? backendUser.deptId.toString() : '0',
      name: backendUser.dept?.deptName || '未设置学校',
      parentId: backendUser.dept?.parentId || 0,
      ancestors: backendUser.dept?.ancestors || '',
    },
    dept: { // 兼容字段
      deptId: backendUser.deptId || 0,
      deptName: backendUser.dept?.deptName || '未设置学校',
    },
    deptId: backendUser.deptId || 0, // 兼容字段

    // 角色信息 - 使用安全的roles数组
    roles: safeRoles.map(role => ({
      id: role.roleId,
      name: role.roleName,
      key: role.roleKey,  // 后端返回的字段是roleKey
      isAdmin: role.admin,
    })),

    // 权限解析
    permissions: {
      ...permissions,
      isOrganizer: permissions.isPartAdmin, // 兼容字段
      canAccessVolunteerFeatures: permissions.canManageVolunteers, // 兼容字段
    },

    // 兼容字段
    name: backendUser.legalName,
    verified: true, // 默认已验证
    area: (backendUser.area as 'zh' | 'en') || 'zh', // 地域字段，默认中国

    // 积分 (Added to fix type error)
    points: (backendUser as any).points || 0,

    // 兼容types/user.ts FrontendUser接口所需的字段
    permissionLevel: getPermissionLevelFromRoles(safeRoles, backendUser.admin),
    isAdmin: permissions.isAdmin, // 顶层isAdmin，与permissions.isAdmin一致
    status: backendUser.status === '0' ? 'active' : 'inactive', // "0"表示正常状态
    department: backendUser.dept ? {
      deptId: backendUser.dept.deptId,
      deptName: backendUser.dept.deptName,
      parentId: backendUser.dept.parentId,
      ancestors: backendUser.dept.ancestors,
      status: backendUser.dept.status,
    } : undefined,
  };
};

/**
 * 适配API响应
 */
export const adaptUserInfoResponse = (
  response: {
    msg: string;
    code: number;
    roleIds: number[];
    data: BackendUserInfo;
    postIds: number[];
    roles: any[];
    posts: any[];
  }
): {
  success: boolean;
  user: FrontendUser | null;
  message: string;
  roleIds: number[];
} => {
  if (response.code !== 200) {
    return {
      success: false,
      user: null,
      message: response.msg,
      roleIds: [],
    };
  }

  return {
    success: true,
    user: adaptUserInfo(response.data),
    message: response.msg,
    roleIds: response.roleIds,
  };
};

/**
 * 获取用户显示名称
 */
export const getUserDisplayName = (user: FrontendUser): string => {
  return user.nickName || user.legalName || user.userName;
};

/**
 * 获取用户角色显示文本
 */
export const getUserRoleText = (user: FrontendUser, language: 'zh' | 'en' = 'zh'): string => {
  if (user.permissions.isAdmin) {
    return language === 'zh' ? '超级管理员' : 'Super Admin';
  }

  if (user.permissions.isPartAdmin) {
    return language === 'zh' ? '分管理员' : 'Partial Admin';
  }

  return language === 'zh' ? '普通用户' : 'User';
};

/**
 * 检查用户是否有特定权限
 */
export const hasPermission = (user: FrontendUser, permission: keyof FrontendUser['permissions']): boolean => {
  return user.permissions[permission];
};

/**
 * 获取用户头像URL或默认头像
 */
export const getUserAvatar = (user: FrontendUser): string => {
  if (user.avatar && user.avatar.trim() !== '') {
    return user.avatar;
  }

  // 返回默认头像，根据性别区分
  switch (user.gender) {
    case 'male':
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face';
    case 'female':
      return 'https://images.unsplash.com/photo-1494790108755-2616b84c78d4?w=150&h=150&fit=crop&crop=face';
    default:
      return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';
  }
};