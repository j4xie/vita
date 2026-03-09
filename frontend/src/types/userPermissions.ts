/**
 * 用户权限相关类型定义
 */

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'manage',        // 总管理员
  PART_MANAGER = 'part_manage',  // 分管理员
  STAFF = 'staff',               // 内部员工
  MERCHANT = 'merchant',         // 商家用户
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

// 简化版角色信息（用于测试和调试）
export interface SimpleRoleInfo {
  key: string;
  roleName?: string;
}

// 用户权限级别 - 直接使用后端roleKey，避免不必要的映射
export type PermissionLevel = 'manage' | 'part_manage' | 'staff' | 'merchant' | 'common' | 'guest';

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
  isMerchant: () => boolean;
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
  role?: UserRoleInfo | null; // 单个role对象（API文档第4页结构）
  roles?: (UserRoleInfo | { id?: number; key: string; name?: string; roleName?: string; isAdmin?: boolean })[] | null; // roles数组（备用，支持FrontendUser格式）
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
    role: user.role, // 单个role对象
    roleKey: user.role?.roleKey, // 关键字段
    roles: user.roles, // roles数组
    posts: user.posts,
    hasRole: !!user.role,
    hasRoles: !!(user.roles && user.roles.length > 0),
    hasPosts: !!(user.posts && user.posts.length > 0)
  });
  
  // 方案1：检查单个role对象的roleKey（主要方式，后端实际使用的结构）
  if (user.role && user.role.roleKey) {
    const roleKey = user.role.roleKey;
    console.log(`🔍 [PERMISSION] 单个role对象检测: ${roleKey}`);
    
    if (['manage', 'part_manage', 'staff', 'merchant', 'common'].includes(roleKey)) {
      console.log(`✅ [PERMISSION] 权限确认: ${roleKey} (来自role.roleKey)`);
      return roleKey as PermissionLevel;
    }
  }

  // 方案2：检查admin字段
  if (user.admin === true) {
    console.log('🔍 [PERMISSION] admin字段检测: 用户为manage');
    return 'manage';
  }

  // 方案3：检查roles数组的roleKey字段（备用方式）
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    console.log('🔍 [PERMISSION] 检查roles数组:', user.roles.map((r: any) => ({ 
      roleKey: r.roleKey,
      key: r.key, 
      roleName: r.roleName || r.name 
    })));
    
    for (const role of user.roles) {
      // 优先使用roleKey字段，key作为备用
      const roleKey = (role as any).roleKey || role.key;
      
      if (roleKey && ['manage', 'part_manage', 'staff', 'merchant', 'common'].includes(roleKey)) {
        console.log(`✅ [PERMISSION] roles数组检测成功: ${roleKey} (来自role.roleKey)`);
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
 * 检查操作者是否有权限操作目标用户（分管理员不能操作总管理员）
 * @param operatorUser 操作者用户信息
 * @param targetUser 目标用户信息  
 * @returns 是否有权限操作
 */
export const canOperateTargetUser = (operatorUser: any, targetUser: any): boolean => {
  const operatorLevel = getUserPermissionLevel(operatorUser);
  const targetLevel = getUserPermissionLevel(targetUser);
  
  // 总管理员可以操作任何人
  if (operatorLevel === 'manage') {
    return true;
  }
  
  // 分管理员不能操作总管理员
  if (operatorLevel === 'part_manage' && targetLevel === 'manage') {
    console.warn(`🚨 [PERMISSION-VIOLATION] 分管理员${operatorUser.userName}试图操作总管理员${targetUser.userName}`);
    return false;
  }
  
  // 分管理员只能操作本校用户
  if (operatorLevel === 'part_manage') {
    const operatorDeptId = operatorUser.deptId || operatorUser.dept?.deptId;
    const targetDeptId = targetUser.deptId || targetUser.dept?.deptId;
    
    if (operatorDeptId !== targetDeptId) {
      console.warn(`🚨 [SCHOOL-BOUNDARY] 分管理员${operatorUser.userName}(学校${operatorDeptId})试图操作其他学校用户${targetUser.userName}(学校${targetDeptId})`);
      return false;
    }
  }
  
  // Staff和Common不能操作其他人
  if (['staff', 'common'].includes(operatorLevel)) {
    return false;
  }
  
  return true;
};

/**
 * 检查扫码用户的权限和可用操作选项
 * @param scannerUser 扫码的用户（当前登录用户）
 * @param scannedUserData 被扫码用户的身份数据
 * @returns 权限检查结果和可用选项
 */
export const getScanPermissions = (scannerUser: any, scannedUserData: {
  userId: string;
  deptId?: string;
  school?: { id: string };
  position?: { roleKey?: string; level?: string };
}) => {
  // 🚨 Enhanced Debug: 详细记录输入参数
  console.log('🔍 [SCAN-PERMISSION-INPUT] 权限检查输入参数:', {
    scannerUser存在: !!scannerUser,
    scannerUserName: scannerUser?.userName,
    scannerUserRole: scannerUser?.role,
    scannerUserRoles: scannerUser?.roles,
    scannerUserDeptId: scannerUser?.deptId,
    scannedUserData: scannedUserData
  });

  const scannerLevel = getUserPermissionLevel(scannerUser);
  const scannedLevel = getUserPermissionLevel(scannedUserData as any);
  const scannerDeptId = scannerUser?.deptId;
  const scannedDeptId = scannedUserData?.deptId || scannedUserData?.school?.id;

  // 权限计算
  const isSameSchool = scannerDeptId && scannedDeptId &&
                      (scannerDeptId === parseInt(scannedDeptId) || scannerDeptId.toString() === scannedDeptId);

  // 🆕 个人信息查看权限 - 所有人都可以查看
  const canViewPersonalInfo = true;

  // 🆕 志愿者时间查看权限
  const canViewVolunteerHours =
    scannerLevel === 'manage' || // 总管理员：查看所有人
    (scannerLevel === 'part_manage' && isSameSchool) || // 分管理员：查看同校所有人
    (scannerLevel === 'staff' && scannedLevel === 'staff' && isSameSchool); // 内部员工：只查看同级别

  // 🆕 活动签到帮助权限
  const canHelpActivityCheckIn =
    scannerLevel === 'manage' || // 总管理员：帮所有人签到
    (scannerLevel === 'part_manage' && isSameSchool) || // 分管理员：帮同校所有人签到
    (scannerLevel === 'staff' && isSameSchool); // 内部员工：帮同校所有人签到

  // 🚫 志愿者工时签到权限 - 无人有此权限
  const canManageVolunteerHours = false;

  // 🚨 Enhanced Debug: 详细权限计算过程
  console.log('🔍 [SCAN-PERMISSION] 权限检查详细:', {
    // 输入信息
    scannerUser: scannerUser?.userName,
    scannerLevel,
    scannedLevel,
    scannerDeptId,
    scannedUserId: scannedUserData?.userId,
    scannedDeptId,

    // 计算过程
    isSameSchool,

    // 🆕 详细权限结果
    canViewPersonalInfo,
    canViewVolunteerHours,
    canViewVolunteerHoursReason: scannerLevel === 'manage' ? 'total_admin_all' :
                                 (scannerLevel === 'part_manage' && isSameSchool) ? 'part_admin_same_school' :
                                 (scannerLevel === 'staff' && scannedLevel === 'staff' && isSameSchool) ? 'staff_same_level_same_school' : 'no_permission',
    canHelpActivityCheckIn,
    canHelpActivityCheckInReason: scannerLevel === 'manage' ? 'total_admin_all' :
                                  (scannerLevel === 'part_manage' && isSameSchool) ? 'part_admin_same_school' :
                                  (scannerLevel === 'staff' && isSameSchool) ? 'staff_same_school' : 'no_permission',
    canManageVolunteerHours
  });

  return {
    // 🆕 新的权限字段
    canViewPersonalInfo,
    canViewVolunteerHours,
    canHelpActivityCheckIn,
    canManageVolunteerHours,

    // 🔧 保留原有字段以保持兼容性
    canManageVolunteer: canManageVolunteerHours, // 已废弃，映射到新字段
    canManageActivity: canHelpActivityCheckIn, // 重新定义为活动签到帮助
    isSameSchool,
    scannerLevel,
    scannedLevel,
    availableOptions: {
      personalInfo: canViewPersonalInfo,
      volunteerHours: canViewVolunteerHours,
      activityCheckIn: canHelpActivityCheckIn,
      volunteerCheckIn: canManageVolunteerHours // 已废弃
    }
  };
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
    isMerchant: () => permissionLevel === 'merchant',
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
        case 'merchant': return 'self';        // 商家用户：只能查看自己的数据
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