/**
 * 用户权限相关类型定义
 */

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'manage',        // 总管理员
  PART_MANAGER = 'part_manage',  // 分管理员
  STAFF = 'staff',               // 内部员工
  COMMON = 'common',             // 普通用户
  GUEST = 'guest'                // 访客
}

// 岗位类型
export interface UserPost {
  postId: number;
  postCode: string;
  postName: string;
  postSort: number;
  status: string;
  flag: boolean;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

// 角色类型
export interface UserRoleInfo {
  roleId: number;
  roleName: string;
  roleKey: string;
  roleSort: number;
  admin: boolean;
  status: string;
  flag: boolean;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

// 用户权限级别
export type PermissionLevel = 'super_admin' | 'part_manager' | 'staff' | 'common' | 'guest';

// 权限映射配置
export const PERMISSION_CONFIG = {
  // 基于用户名的权限映射（临时方案，当roles API有问题时使用）
  USERNAME_PERMISSIONS: {
    'admin': 'super_admin',
    'admin Xie': 'super_admin',      // 添加后台显示的admin Xie用户
    'admin Jie': 'part_manager',     // 添加分管理员admin Jie用户
    'admin-bracnh': 'part_manager',  // 修正用户名拼写
    'EB-1': 'staff',
    'user1': 'staff',                // 添加内部员工user1
    'test001': 'common',
    'test0019': 'common',
  } as Record<string, PermissionLevel>,

  // 基于roleKey的权限映射（理想方案）
  ROLE_PERMISSIONS: {
    'manage': 'super_admin',
    'part_manage': 'part_manager',
    'staff': 'staff', 
    'common': 'common',
    // 添加可能的角色key变体
    'admin': 'super_admin',
    'super_admin': 'super_admin',
    'manager': 'part_manager',
  } as Record<string, PermissionLevel>,

  // 基于postCode的权限映射（备用方案）
  POST_PERMISSIONS: {
    'admin': 'super_admin',
    'manager': 'part_manager',
    'pic': 'staff',        // 负责人
    'user': 'common',      // 普通员工
  } as Record<string, PermissionLevel>,
} as const;

// 数据范围类型
export type DataScope = 'all' | 'school' | 'self' | 'none';

// 权限检查函数类型
export interface PermissionChecker {
  isAdmin: () => boolean;
  isPartManager: () => boolean; 
  isStaff: () => boolean;
  isRegularUser: () => boolean;
  hasVolunteerManagementAccess: () => boolean;
  hasUserManagementAccess: () => boolean;
  hasInvitationManagementAccess: () => boolean;
  getPermissionLevel: () => PermissionLevel;
  // 新增数据范围和操作权限
  getDataScope: () => DataScope;
  canCheckInOut: () => boolean;
  canViewAllSchools: () => boolean;
  canViewSchoolData: (schoolId?: number) => boolean;
  canViewUserData: (userId?: number) => boolean;
}

/**
 * 根据用户信息获取权限级别
 * @param user 用户信息
 * @returns 权限级别
 */
export const getUserPermissionLevel = (user: {
  userName?: string;
  roles?: UserRoleInfo[] | null;
  posts?: UserPost[] | null;
  admin?: boolean;
}): PermissionLevel => {
  // 检查用户是否为null
  if (!user) {
    return 'guest';
  }

  // 🚨 DEBUG: 详细日志显示后端返回的原始数据
  console.log('🔍 [PERMISSION-DEBUG] 后端原始用户数据:', {
    userName: user.userName,
    admin: user.admin,
    adminType: typeof user.admin,
    roles: user.roles,
    posts: user.posts,
    hasRoles: !!(user.roles && user.roles.length > 0),
    hasPosts: !!(user.posts && user.posts.length > 0)
  });
  
  // 方案1：检查admin字段
  if (user.admin === true) {
    console.log('🔍 [PERMISSION] admin字段检测: 用户为super_admin');
    return 'super_admin';
  }

  // 方案2：检查roles数组中的roleKey
  if (user.roles && Array.isArray(user.roles)) {
    console.log('🔍 [PERMISSION] 检查roles数组:', user.roles.map((r: any) => ({ roleKey: r.roleKey, roleName: r.roleName })));
    for (const role of user.roles) {
      if (role.roleKey && PERMISSION_CONFIG.ROLE_PERMISSIONS[role.roleKey]) {
        console.log(`🔍 [PERMISSION] roles检测成功: ${role.roleKey} -> ${PERMISSION_CONFIG.ROLE_PERMISSIONS[role.roleKey]}`);
        return PERMISSION_CONFIG.ROLE_PERMISSIONS[role.roleKey];
      }
    }
  }

  // 方案3：检查posts数组中的postCode
  if (user.posts && Array.isArray(user.posts)) {
    console.log('🔍 [PERMISSION] 检查posts数组:', user.posts.map((p: any) => ({ postCode: p.postCode, postName: p.postName })));
    // 取最高权限级别
    const permissions = user.posts
      .map(post => PERMISSION_CONFIG.POST_PERMISSIONS[post.postCode])
      .filter(Boolean);
    
    if (permissions.includes('super_admin')) return 'super_admin';
    if (permissions.includes('part_manager')) return 'part_manager';
    if (permissions.includes('staff')) return 'staff';
    if (permissions.includes('common')) return 'common';
  }

  // 方案4：基于用户名的映射（临时方案）
  if (user.userName && PERMISSION_CONFIG.USERNAME_PERMISSIONS[user.userName]) {
    console.log(`🔍 [PERMISSION] 用户名映射成功: ${user.userName} -> ${PERMISSION_CONFIG.USERNAME_PERMISSIONS[user.userName]}`);
    return PERMISSION_CONFIG.USERNAME_PERMISSIONS[user.userName];
  }

  // 特殊处理：基于用户名和法定姓名的模糊匹配
  const userName = (user.userName || '').toLowerCase();
  const legalName = user.legalName || '';
  
  // 总管理员模式匹配
  if (userName === 'admin' || userName.includes('superadmin') || legalName.includes('超级管理员')) {
    console.log('🔍 [PERMISSION] 总管理员匹配: 设为super_admin');
    return 'super_admin';
  }
  
  // 分管理员模式匹配  
  if (userName.includes('admin') || legalName.includes('管理员') || legalName.includes('分管')) {
    console.log('🔍 [PERMISSION] 分管理员匹配: 设为part_manager');
    return 'part_manager';
  }
  
  // 内部员工模式匹配
  if (userName.includes('staff') || userName.includes('user') || 
      legalName.includes('员工') || legalName.includes('内部')) {
    console.log('🔍 [PERMISSION] 内部员工匹配: 设为staff');
    return 'staff';
  }

  console.log('⚠️ [PERMISSION] 无法确定权限级别，默认为common:', {
    userName: user.userName,
    legalName: user.legalName,
    hasRoles: !!user.roles,
    hasPosts: !!user.posts,
    adminField: user.admin
  });

  // 默认为普通用户
  return 'common';
};

/**
 * 创建权限检查器
 * @param user 用户信息
 * @returns 权限检查器
 */
export const createPermissionChecker = (user: any): PermissionChecker => {
  const permissionLevel = getUserPermissionLevel(user);
  const userDeptId = user?.deptId;
  const userId = user?.userId;

  return {
    isAdmin: () => permissionLevel === 'super_admin',
    isPartManager: () => permissionLevel === 'part_manager',
    isStaff: () => permissionLevel === 'staff',
    isRegularUser: () => permissionLevel === 'common',
    
    // 功能权限检查
    hasVolunteerManagementAccess: () => ['super_admin', 'part_manager', 'staff'].includes(permissionLevel),
    hasUserManagementAccess: () => ['super_admin', 'part_manager'].includes(permissionLevel),
    hasInvitationManagementAccess: () => ['super_admin'].includes(permissionLevel),
    
    getPermissionLevel: () => permissionLevel,
    
    // 数据范围权限
    getDataScope: (): DataScope => {
      switch (permissionLevel) {
        case 'super_admin': return 'all';      // 总管理员：所有学校数据
        case 'part_manager': return 'school';  // 分管理员：本校数据（可操作）
        case 'staff': return 'self';           // 内部员工：只能查看自己的数据
        default: return 'none';               // 普通用户：无数据
      }
    },
    
    // 操作权限
    canCheckInOut: () => ['super_admin', 'part_manager'].includes(permissionLevel), // 只有总管理员和分管理员可以操作
    
    // 查看权限
    canViewAllSchools: () => permissionLevel === 'super_admin',
    canViewSchoolData: (schoolId?: number) => {
      if (permissionLevel === 'super_admin') return true;
      if (permissionLevel === 'part_manager') return !schoolId || schoolId === userDeptId;
      return false;
    },
    canViewUserData: (targetUserId?: number) => {
      if (permissionLevel === 'super_admin') return true;
      if (permissionLevel === 'part_manager') return true; // 可以查看本校所有用户
      if (permissionLevel === 'staff') return !targetUserId || targetUserId === userId; // 只能查看自己
      return false;
    },
  };
};