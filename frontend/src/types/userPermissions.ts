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
  key?: string;  // 后端返回的字段名
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

// 用户权限级别 - 直接使用后端roleKey，避免不必要的映射
export type PermissionLevel = 'manage' | 'part_manage' | 'staff' | 'common' | 'guest';

// 权限映射配置
export const PERMISSION_CONFIG = {
  // 基于用户名的权限映射（临时方案，当roles API有问题时使用）
  USERNAME_PERMISSIONS: {
    'admin': 'manage',
    'admin Xie': 'manage',           // 添加后台显示的admin Xie用户
    'admin Jie': 'part_manage',      // 添加分管理员admin Jie用户
    'admin-bracnh': 'part_manage',   // 修正用户名拼写
    'EB-1': 'staff',
    'user1': 'staff',                // 添加内部员工user1
    'test001': 'common',
    'test0019': 'common',
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
  legalName?: string;
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
    console.log('🔍 [PERMISSION] admin字段检测: 用户为manage');
    return 'manage';
  }

  // 方案2：直接使用后端roleKey，无需映射
  if (user.roles && Array.isArray(user.roles)) {
    console.log('🔍 [PERMISSION] 检查roles数组:', user.roles.map((r: any) => ({ 
      key: r.key, 
      roleName: r.roleName || r.name 
    })));
    for (const role of user.roles) {
      // 🚨 修复：后端实际使用roleKey字段，不是key字段
      const roleKey = role.roleKey || role.key;
      
      if (roleKey && ['manage', 'part_manage', 'staff', 'common'].includes(roleKey)) {
        console.log(`🔍 [PERMISSION] roles检测成功: ${roleKey} (使用roleKey字段)`);
        return roleKey as PermissionLevel;
      }
    }
  }

  // 方案3：posts只是岗位任职，不影响权限，跳过

  // 方案4：基于用户名的映射（兜底方案，因为后端roles配置可能不完整）
  if (user.userName && PERMISSION_CONFIG.USERNAME_PERMISSIONS[user.userName]) {
    console.log(`🔍 [PERMISSION] 用户名映射: ${user.userName} -> ${PERMISSION_CONFIG.USERNAME_PERMISSIONS[user.userName]}`);
    return PERMISSION_CONFIG.USERNAME_PERMISSIONS[user.userName];
  }

  // 🚨 严格基于roleKey判断，如果roleKey为空且无用户名映射，说明后端权限配置有问题
  console.log('⚠️ [PERMISSION] 无法确定权限，后端roles配置可能缺失:', {
    userName: user.userName,
    legalName: user.legalName,
    hasValidRoles: !!(user.roles && user.roles.length > 0),
    rolesData: user.roles,
    postsData: user.posts?.map(p => p.postCode), // posts仅用于显示，不影响权限
    issue: 'roles数组为空且无用户名映射匹配'
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
    isAdmin: () => permissionLevel === 'manage',
    isPartManager: () => permissionLevel === 'part_manage',
    isStaff: () => permissionLevel === 'staff',
    isRegularUser: () => permissionLevel === 'common',
    
    // 功能权限检查 - staff可以查看志愿者界面但只能看个人数据，管理员可以管理
    hasVolunteerManagementAccess: () => ['manage', 'part_manage', 'staff'].includes(permissionLevel),
    hasUserManagementAccess: () => ['manage', 'part_manage'].includes(permissionLevel),
    hasInvitationManagementAccess: () => ['manage'].includes(permissionLevel),
    
    getPermissionLevel: () => permissionLevel,
    
    // 数据范围权限
    getDataScope: (): DataScope => {
      switch (permissionLevel) {
        case 'manage': return 'all';           // 总管理员：所有学校数据
        case 'part_manage': return 'school';   // 分管理员：本校数据（可操作）
        case 'staff': return 'self';           // 内部员工：只能查看自己的数据
        default: return 'none';                // 普通用户：无数据
      }
    },
    
    // 操作权限
    canCheckInOut: () => ['manage', 'part_manage'].includes(permissionLevel), // 只有总管理员和分管理员可以操作
    
    // 查看权限
    canViewAllSchools: () => permissionLevel === 'manage',
    canViewSchoolData: (schoolId?: number) => {
      if (permissionLevel === 'manage') return true;
      if (permissionLevel === 'part_manage') return !schoolId || schoolId === userDeptId;
      return false;
    },
    canViewUserData: (targetUserId?: number) => {
      if (permissionLevel === 'manage') return true;
      if (permissionLevel === 'part_manage') return true; // 可以查看本校所有用户
      if (permissionLevel === 'staff') return !targetUserId || targetUserId === userId; // 只能查看自己
      return false;
    },
  };
};