/**
 * 用户身份数据映射工具
 */

import { UserIdentityData, OrganizationInfo, SchoolInfo, PositionInfo } from '../types/userIdentity';
import Base64 from 'react-native-base64';

// 添加调试日志函数
const debugLog = (message: string, data?: any) => {
  console.log(`[UserIdentityMapper] ${message}`, data || '');
};

// 组织ID到组织信息的映射
const ORGANIZATION_MAPPING: Record<number, OrganizationInfo> = {
  1: {
    id: '1',
    name: 'Student Union',
    displayNameZh: '学联组织',
    displayNameEn: 'Student Union',
  },
  2: {
    id: '2', 
    name: 'Community',
    displayNameZh: '社团',
    displayNameEn: 'Student Community',
  },
  4: {
    id: '4',
    name: 'Chinese Union',
    displayNameZh: 'Chinese Union',
    displayNameEn: 'Chinese Union',
  },
  5: {
    id: '5',
    name: 'CSSA',
    displayNameZh: 'CSSA',
    displayNameEn: 'Chinese Students and Scholars Association',
  },
};

// 学校ID到学校信息的映射
const SCHOOL_MAPPING: Record<number, { name: string; fullName: string }> = {
  210: { name: 'UCD', fullName: 'University of California, Davis' },
  211: { name: 'UCB', fullName: 'University of California, Berkeley' },
  212: { name: 'UCSC', fullName: 'University of California, Santa Cruz' },
  213: { name: 'USC', fullName: 'University of Southern California' },
  214: { name: 'UCLA', fullName: 'University of California, Los Angeles' },
  215: { name: 'UCI', fullName: 'University of California, Irvine' },
  216: { name: 'UCSD', fullName: 'University of California, San Diego' },
  217: { name: 'UMN', fullName: 'University of Minnesota' },
  218: { name: 'UW', fullName: 'University of Washington' },
  219: { name: 'U Berklee Music', fullName: 'Berklee College of Music' },
  220: { name: 'UCSB', fullName: 'University of California, Santa Barbara' },
  // 添加CU总部的映射
  999: { name: 'CU总部', fullName: 'CU Headquarters' },
};

/**
 * 根据组织ID获取组织信息
 * @param orgId 组织ID
 * @returns 组织信息
 */
export const getOrganizationInfo = (orgId: number): OrganizationInfo => {
  return ORGANIZATION_MAPPING[orgId] || {
    id: orgId.toString(),
    name: 'Unknown Organization',
    displayNameZh: '未知组织',
    displayNameEn: 'Unknown Organization',
  };
};

/**
 * 根据学校ID获取学校信息
 * @param deptId 学校ID
 * @returns 学校信息
 */
export const getSchoolInfo = (deptId: number): { name: string; fullName: string } => {
  return SCHOOL_MAPPING[deptId] || {
    name: 'Unknown',
    fullName: 'Unknown School',
  };
};

/**
 * 根据后端部门信息创建学校信息对象
 * @param dept 后端部门信息
 * @param deptId 部门ID
 * @param isEnglish 是否英文环境（用于CU总部的国际化显示）
 * @returns 学校信息对象
 */
export const createSchoolInfo = (dept: any, deptId?: number, isEnglish?: boolean): SchoolInfo | undefined => {
  if (!dept && !deptId) return undefined;

  const schoolMapping = deptId ? getSchoolInfo(deptId) : null;

  // 🆕 学校信息 - 与ProfileHomeScreen保持一致
  const rawSchool = dept?.deptName || '';
  let schoolName = rawSchool;
  let fullName = rawSchool;

  // 🆕 英文环境下使用学校简称 - 与ProfileHomeScreen逻辑一致
  if (rawSchool.includes('CU总部') || rawSchool === 'CU总部') {
    schoolName = isEnglish ? 'CU HQ' : 'CU总部';
    fullName = 'CU Headquarters';
  } else if (schoolMapping) {
    // 其他学校使用映射的名称
    schoolName = schoolMapping.name;
    fullName = schoolMapping.fullName;
  } else if (!rawSchool) {
    // 只有在完全没有信息时才显示未知
    schoolName = '未知学校';
    fullName = '未知学校';
  }

  // ✅ 安全处理parentId字段，避免编码问题
  let safeParentId: number | undefined = undefined;
  if (dept?.parentId !== undefined && dept?.parentId !== null) {
    const parentId = dept.parentId;
    if (typeof parentId === 'number' && !isNaN(parentId) && parentId > 0) {
      safeParentId = parentId;
    } else if (typeof parentId === 'string') {
      const numParentId = parseInt(parentId, 10);
      safeParentId = isNaN(numParentId) ? undefined : numParentId;
    }
  }

  return {
    id: (deptId || dept?.deptId || 0).toString(),
    name: schoolName,
    fullName: fullName,
    parentId: safeParentId,
    ancestors: dept?.ancestors || undefined,
  };
};

/**
 * 根据用户角色信息创建职位信息对象
 * @param user 完整用户对象，包含role、roles、post、posts等字段
 * @returns 职位信息对象
 */
export const createPositionInfo = (user: any): PositionInfo | undefined => {
  if (!user) return undefined;

  // 获取权限级别 - 从单个role或roles数组
  let permissionLevel = 'common';

  // 优先检查单个role对象
  if (user.role?.roleKey) {
    permissionLevel = user.role.roleKey;
  } else if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    // 检查roles数组
    const roleHierarchy = ['manage', 'part_manage', 'staff', 'common'];
    for (const roleKey of roleHierarchy) {
      const role = user.roles.find((r: any) => (r.key || r.roleKey) === roleKey);
      if (role) {
        permissionLevel = roleKey;
        break;
      }
    }
  }

  // 🚫 权限角色名黑名单 - 与ProfileHomeScreen保持一致
  const roleBlacklist = ['总管理员', '分管理员', '内部员工', '普通用户', 'admin', 'manager', 'staff', 'common'];

  // 🆕 岗位信息显示逻辑 - 与ProfileHomeScreen保持一致
  let actualPosition = '';

  // 只有管理员、分管理员、内部员工才显示职位
  if (['manage', 'part_manage', 'staff'].includes(permissionLevel)) {
    // 优先显示具体岗位(post)
    if (user.post?.postName && !roleBlacklist.includes(user.post.postName)) {
      actualPosition = user.post.postName;
    } else if (user.role?.roleName && !roleBlacklist.includes(user.role.roleName)) {
      // 如果没有具体岗位且角色名不在黑名单中，显示角色名称
      actualPosition = user.role.roleName;
    } else if (user.roles && user.roles.length > 0) {
      // 兼容旧格式：从roles数组获取，跳过黑名单
      for (const role of user.roles) {
        if (role.roleName && !roleBlacklist.includes(role.roleName)) {
          actualPosition = role.roleName;
          break;
        }
      }
    }
  }

  // 如果没有实际职位，返回undefined（普通用户不显示职位）
  if (!actualPosition) {
    return undefined;
  }

  // 角色级别映射
  const levelMapping: Record<string, PositionInfo['level']> = {
    'manage': 'admin',
    'part_manage': 'part_admin',
    'staff': 'staff',
    'common': 'user',
  };

  return {
    roleKey: permissionLevel,
    roleName: actualPosition, // 使用实际职位名
    displayName: actualPosition,
    displayNameEn: actualPosition, // 暂时使用中文，后续可加翻译
    level: levelMapping[permissionLevel] || 'user',
  };
};

/**
 * 根据学校获取默认组织信息
 * @param deptId 学校ID
 * @returns 默认组织信息
 */
const getDefaultOrganizationBySchool = (deptId?: number): OrganizationInfo | null => {
  // 基于学校的默认组织映射
  const schoolOrgMapping: Record<number, number> = {
    210: 1, // UCD -> Student Union
    211: 1, // UCB -> Student Union  
    212: 1, // UCSC -> Student Union
    213: 1, // USC -> Student Union
    214: 1, // UCLA -> Student Union
    215: 1, // UCI -> Student Union
    216: 1, // UCSD -> Student Union
    217: 1, // UMN -> Student Union
    218: 1, // UW -> Student Union
    219: 1, // U Berklee Music -> Student Union
    220: 1, // UCSB -> Student Union
  };
  
  const orgId = deptId ? schoolOrgMapping[deptId] : null;
  return orgId ? getOrganizationInfo(orgId) : null;
};

/**
 * 将后端用户数据转换为身份码数据
 * @param user 后端用户数据
 * @param isEnglish 是否为英文环境（可选，默认自动检测）
 * @returns 身份码数据
 */
export const mapUserToIdentityData = (user: any, isEnglish?: boolean): UserIdentityData => {
  // 🌍 检测当前语言环境
  let currentIsEnglish = isEnglish;
  if (currentIsEnglish === undefined) {
    try {
      // 尝试导入i18next来检测当前语言
      const i18n = require('i18next').default;
      currentIsEnglish = i18n?.language === 'en-US' || i18n?.language === 'en';
    } catch {
      // 如果无法访问i18n，默认为中文
      currentIsEnglish = false;
    }
  }
  if (!user) {
    // 如果没有用户数据，返回访客默认数据
    // 注意：访客用户不应该有身份码功能，此数据仅用于错误处理
    return {
      userId: 'guest',
      userName: 'guest',
      legalName: '访客用户',
      nickName: 'Guest',
      email: 'guest@example.com',
      currentOrganization: {
        id: '0',
        name: 'Guest',
        displayNameZh: '访客',
        displayNameEn: 'Guest',
      },
      memberOrganizations: [],
      type: 'user_identity',
    };
  }

  // 🆕 组织信息 - 与ProfileHomeScreen保持一致，统一显示为CU
  let orgInfo: OrganizationInfo | null = null;
  const schoolName = user.dept?.deptName || user.school?.name || '';

  // 只要有学校信息，组织就统一显示为CU
  if (schoolName) {
    orgInfo = {
      id: 'cu',
      name: 'CU',
      displayNameZh: 'CU',
      displayNameEn: 'CU',
    };
  }

  // 获取学校信息 - 传入语言环境
  const school = createSchoolInfo(user.dept, user.deptId, currentIsEnglish);

  // 获取职位信息 - 传入完整用户对象
  const position = createPositionInfo(user);

  return {
    userId: user.userId?.toString() || 'unknown',
    userName: user.userName || 'unknown',
    legalName: user.legalName || '未知用户',
    nickName: user.nickName || user.userName || 'unknown',
    email: user.email || 'unknown@example.com',
    avatarUrl: user.avatar || undefined,
    studentId: user.userId?.toString(), // 使用userId作为学生ID
    deptId: user.deptId?.toString(),
    currentOrganization: orgInfo || {
      id: 'cu',
      name: 'CU',
      displayNameZh: 'CU',
      displayNameEn: 'CU',
    },
    memberOrganizations: orgInfo ? [{
      id: orgInfo.id,
      role: 'member', // 默认为成员
      isPrimary: true,
      joinedAt: new Date().toISOString(),
      status: 'active',
    }] : [],
    school,
    position,
    type: 'user_identity',
  };
};

/**
 * 生成用户身份QR码内容 (异步版本)
 * @param userData 用户身份数据
 * @param useHashFormat 是否使用哈希格式（默认true，避免Base64兼容性问题）
 * @returns QR码字符串
 */
export const generateUserQRContentAsync = async (userData: UserIdentityData, useHashFormat: boolean = true): Promise<string> => {
  // ✅ 优先使用哈希格式，避免编码兼容性问题
  if (useHashFormat) {
    try {
      const { generateUserIdentityHash } = require('./qrHashGenerator');
      const hashCode = await generateUserIdentityHash(userData);
      debugLog('🔐 [生成身份码] 使用哈希格式生成成功:', hashCode);
      return hashCode;
    } catch (hashError) {
      console.warn('⚠️ [生成身份码] 哈希格式生成失败，降级到Base64:', hashError);
      // 如果哈希生成失败，降级到Base64格式
    }
  }
  
  // ✅ 保留Base64格式作为降级方案
  try {
    debugLog('🔧 [生成身份码] 开始生成用户身份码:', userData.userId);
    
    // 验证输入数据
    if (!userData) {
      throw new Error('用户数据不能为空');
    }
    
    if (!userData.userId || !userData.userName || !userData.legalName) {
      throw new Error('缺少必要的用户信息');
    }

    // 使用与解析逻辑匹配的数据结构 - 直接使用UserIdentityData格式
    const qrData: UserIdentityData = {
      userId: userData.userId.toString().trim(),
      userName: userData.userName.trim(),
      legalName: userData.legalName.trim(),
      nickName: userData.nickName?.trim() || userData.userName.trim(),
      email: userData.email?.trim() || `${userData.userName}@example.com`,
      avatarUrl: userData.avatarUrl,
      studentId: userData.studentId,
      deptId: userData.deptId,
      currentOrganization: userData.currentOrganization,
      memberOrganizations: userData.memberOrganizations || [],
      school: userData.school,
      position: userData.position,
      type: 'user_identity' as const, // 使用正确的类型标识
    };
    
    // 验证关键数据字段
    if (!qrData.type || qrData.type !== 'user_identity') {
      throw new Error('身份码类型设置错误');
    }

    // 生成QR码字符串 - 使用base64编码格式与扫描解析逻辑匹配
    const jsonString = JSON.stringify(qrData);
    debugLog('📝 [生成身份码] JSON字符串长度:', jsonString.length);
    debugLog('📋 [生成身份码] JSON内容预览:', jsonString.substring(0, 100) + '...');
    
    // 如果数据太长，使用简化格式
    if (jsonString.length > 1000) {
      const fallbackCode = `VG_USER_SIMPLE_${userData.userId}_${userData.legalName}_${userData.position?.roleKey || 'user'}_${Date.now()}`;
      debugLog('⚠️ [生成身份码] 数据太长，使用简化格式:', fallbackCode.substring(0, 50) + '...');
      return fallbackCode;
    }
    
    // 编码为base64格式，与扫描解析逻辑匹配
    try {
      const encodedString = encodeURIComponent(jsonString);
      debugLog('🔗 [生成身份码] URL编码完成，长度:', encodedString.length);
      
      const base64Data = Base64.encode(encodedString);
      debugLog('🔐 [生成身份码] Base64编码完成，长度:', base64Data.length);
      
      const finalCode = `VG_USER_${base64Data}`;
      
      // 验证生成的二维码是否过长
      if (finalCode.length > 2000) {
        throw new Error('生成的二维码过长，可能导致扫描失败');
      }
      
      debugLog('✅ [生成身份码] 身份码生成成功:', {
        finalCodeLength: finalCode.length,
        finalCodePreview: finalCode.substring(0, 50) + '...',
        dataStructure: {
          userId: qrData.userId,
          userName: qrData.userName,
          legalName: qrData.legalName,
          type: qrData.type,
          hasEmail: !!qrData.email,
          hasOrganization: !!qrData.currentOrganization
        }
      });
      
      return finalCode;
    } catch (encodingError) {
      console.error('❌ [生成身份码] 编码过程失败:', encodingError);
      // 使用简化的备用格式
      const backupCode = `VG_USER_BACKUP_${userData.userId}_${encodeURIComponent(userData.legalName)}_${Date.now()}`;
      debugLog('🔄 [生成身份码] 使用备用简化格式:', backupCode);
      return backupCode;
    }
    
  } catch (error) {
    console.error('❌ [生成身份码] 生成QR码内容失败:', error);
    debugLog('🚨 [生成身份码] 错误详情:', {
      error: error instanceof Error ? error.message : '未知错误',
      userData: {
        userId: userData?.userId,
        userName: userData?.userName,
        legalName: userData?.legalName
      }
    });
    // 返回最基本的错误码格式
    return `VG_USER_ERROR_${userData?.userId || 'unknown'}_${Date.now()}`;
  }
};

/**
 * 生成用户身份QR码内容 (同步版本，向后兼容)
 * @param userData 用户身份数据
 * @param useHashFormat 是否使用哈希格式（默认false，确保兼容性）
 * @returns QR码字符串
 */
export const generateUserQRContent = (userData: UserIdentityData, useHashFormat: boolean = false): string => {
  // ✅ 为了兼容性，同步版本默认使用Base64格式
  if (!useHashFormat) {
    try {
      debugLog('🔧 [生成身份码-同步] 使用Base64格式:', userData.userId);
      
      // 验证输入数据
      if (!userData) {
        throw new Error('用户数据不能为空');
      }
      
      if (!userData.userId || !userData.userName || !userData.legalName) {
        throw new Error('缺少必要的用户信息');
      }

      // 使用与解析逻辑匹配的数据结构
      const qrData: UserIdentityData = {
        userId: userData.userId.toString().trim(),
        userName: userData.userName.trim(),
        legalName: userData.legalName.trim(),
        nickName: userData.nickName?.trim() || userData.userName.trim(),
        email: userData.email?.trim() || `${userData.userName}@example.com`,
        avatarUrl: userData.avatarUrl,
        studentId: userData.studentId,
        deptId: userData.deptId,
        currentOrganization: userData.currentOrganization,
        memberOrganizations: userData.memberOrganizations || [],
        school: userData.school,
        position: userData.position,
        type: 'user_identity' as const,
      };
      
      // 生成QR码字符串
      const jsonString = JSON.stringify(qrData);
      
      // 如果数据太长，使用简化格式
      if (jsonString.length > 1000) {
        const fallbackCode = `VG_USER_SIMPLE_${userData.userId}_${userData.legalName}_${userData.position?.roleKey || 'user'}_${Date.now()}`;
        debugLog('⚠️ [生成身份码-同步] 数据太长，使用简化格式:', fallbackCode.substring(0, 50) + '...');
        return fallbackCode;
      }
      
      // 编码为base64格式
      const encodedString = encodeURIComponent(jsonString);
      const base64Data = Base64.encode(encodedString);
      const finalCode = `VG_USER_${base64Data}`;
      
      debugLog('✅ [生成身份码-同步] Base64格式生成成功:', {
        finalCodeLength: finalCode.length,
        finalCodePreview: finalCode.substring(0, 50) + '...'
      });
      
      return finalCode;
    } catch (error) {
      console.error('❌ [生成身份码-同步] 生成失败:', error);
      // 返回最基本的错误码格式
      return `VG_USER_ERROR_${userData?.userId || 'unknown'}_${Date.now()}`;
    }
  } else {
    // 哈希格式需要异步调用，返回错误提示
    console.warn('⚠️ [生成身份码-同步] 哈希格式需要使用generateUserQRContentAsync');
    return `VG_USER_ASYNC_REQUIRED_${userData.userId}_${Date.now()}`;
  }
};