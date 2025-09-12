/**
 * 用户身份数据映射工具 (Web端)
 */

import { UserIdentityData, OrganizationInfo, SchoolInfo, PositionInfo } from '../types/userIdentity';
import Base64 from 'react-native-base64';

// 添加调试日志函数
const debugLog = (message: string, data?: any) => {
  console.log(`[Web-UserIdentityMapper] ${message}`, data || '');
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
  999: { name: 'CU总部', fullName: 'CU Headquarters' },
};

export const getOrganizationInfo = (orgId: number): OrganizationInfo => {
  return ORGANIZATION_MAPPING[orgId] || {
    id: orgId.toString(),
    name: 'Unknown Organization',
    displayNameZh: '未知组织',
    displayNameEn: 'Unknown Organization',
  };
};

export const getSchoolInfo = (deptId: number): { name: string; fullName: string } => {
  return SCHOOL_MAPPING[deptId] || {
    name: 'Unknown',
    fullName: 'Unknown School',
  };
};

export const createSchoolInfo = (dept: any, deptId?: number): SchoolInfo | undefined => {
  if (!dept && !deptId) return undefined;
  
  const schoolMapping = deptId ? getSchoolInfo(deptId) : null;
  
  const deptName = dept?.deptName || '';
  let schoolName = deptName;
  let fullName = deptName;
  
  if (schoolMapping) {
    schoolName = schoolMapping.name;
    fullName = schoolMapping.fullName;
  } else if (deptName.includes('CU总部') || deptName === 'CU总部') {
    schoolName = 'CU总部';
    fullName = 'CU Headquarters';
  } else if (!deptName) {
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

export const createPositionInfo = (roles: any[], posts?: any[]): PositionInfo | undefined => {
  if (!roles || roles.length === 0) return undefined;
  
  const roleHierarchy = ['manage', 'part_manage', 'staff', 'common'];
  let highestRole = null;
  
  for (const roleKey of roleHierarchy) {
    const role = roles.find(r => (r.key || r.roleKey) === roleKey);
    if (role) {
      highestRole = role;
      break;
    }
  }
  
  if (!highestRole) {
    highestRole = roles[0];
  }
  
  const roleKey = highestRole.key || highestRole.roleKey || 'common';
  
  const roleDisplayNames: Record<string, { zh: string; en: string; level: PositionInfo['level'] }> = {
    'manage': { zh: '总管理员', en: 'Super Admin', level: 'admin' },
    'part_manage': { zh: '分管理员', en: 'Partial Admin', level: 'part_admin' },
    'staff': { zh: '内部员工', en: 'Staff', level: 'staff' },
    'common': { zh: '普通用户', en: 'User', level: 'user' },
  };
  
  const displayInfo = roleDisplayNames[roleKey] || roleDisplayNames['common'];
  
  return {
    roleKey,
    roleName: highestRole.roleName || displayInfo.zh,
    displayName: displayInfo.zh,
    displayNameEn: displayInfo.en,
    level: displayInfo.level,
  };
};

const getDefaultOrganizationBySchool = (deptId?: number): OrganizationInfo | null => {
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

export const mapUserToIdentityData = (user: any): UserIdentityData => {
  if (!user) {
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

  let orgInfo: OrganizationInfo | null = null;
  
  if (user.orgId) {
    const orgIdNum = typeof user.orgId === 'string' ? parseInt(user.orgId, 10) : user.orgId;
    if (!isNaN(orgIdNum)) {
      orgInfo = getOrganizationInfo(orgIdNum);
    }
  }
  
  if (!orgInfo) {
    const schoolName = user.dept?.deptName || user.school?.name || '';
    if (schoolName) {
      if (schoolName.includes('CU总部') || schoolName === 'CU总部') {
        orgInfo = {
          id: 'cu_headquarters',
          name: 'CU总部',
          displayNameZh: 'CU总部',
          displayNameEn: 'CU Headquarters',
        };
      } else if (user.deptId) {
        orgInfo = getDefaultOrganizationBySchool(user.deptId);
      }
    }
  }
  
  const school = createSchoolInfo(user.dept, user.deptId);
  const position = createPositionInfo(user.roles, user.posts);

  return {
    userId: user.userId?.toString() || 'unknown',
    userName: user.userName || 'unknown',
    legalName: user.legalName || '未知用户',
    nickName: user.nickName || user.userName || 'unknown',
    email: user.email || 'unknown@example.com',
    avatarUrl: user.avatar || undefined,
    studentId: user.userId?.toString(),
    deptId: user.deptId?.toString(),
    currentOrganization: orgInfo || {
      id: '0',
      name: 'No Organization',
      displayNameZh: '无组织',
      displayNameEn: 'No Organization',
    },
    memberOrganizations: orgInfo ? [{
      id: orgInfo.id,
      role: 'member',
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
 * 生成用户身份QR码内容 (异步版本，支持哈希格式)
 */
export const generateUserQRContentAsync = async (userData: UserIdentityData, useHashFormat: boolean = true): Promise<string> => {
  if (useHashFormat) {
    try {
      const { generateUserIdentityHash } = require('./qrHashGenerator');
      const hashCode = await generateUserIdentityHash(userData);
      debugLog('🔐 [Web-生成身份码] 使用哈希格式生成成功:', hashCode);
      return hashCode;
    } catch (hashError) {
      console.warn('⚠️ [Web-生成身份码] 哈希格式生成失败，降级到Base64:', hashError);
    }
  }
  
  // Base64降级逻辑
  return generateUserQRContentWeb(userData);
};

/**
 * 生成用户身份QR码内容 (同步版本，Base64格式)
 */
export const generateUserQRContentWeb = (userData: UserIdentityData): string => {
  try {
    debugLog('🔧 [Web-生成身份码] 开始生成用户身份码:', userData.userId);
    
    if (!userData || !userData.userId || !userData.userName || !userData.legalName) {
      throw new Error('缺少必要的用户信息');
    }

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
    
    const jsonString = JSON.stringify(qrData);
    
    if (jsonString.length > 1000) {
      const fallbackCode = `VG_USER_SIMPLE_${userData.userId}_${userData.legalName}_${userData.position?.roleKey || 'user'}_${Date.now()}`;
      debugLog('⚠️ [Web-生成身份码] 数据太长，使用简化格式:', fallbackCode.substring(0, 50) + '...');
      return fallbackCode;
    }
    
    try {
      const encodedString = encodeURIComponent(jsonString);
      const base64Data = Base64.encode(encodedString);
      const finalCode = `VG_USER_${base64Data}`;
      
      if (finalCode.length > 2000) {
        throw new Error('生成的二维码过长');
      }
      
      debugLog('✅ [Web-生成身份码] 身份码生成成功:', {
        finalCodeLength: finalCode.length,
        finalCodePreview: finalCode.substring(0, 50) + '...'
      });
      
      return finalCode;
    } catch (encodingError) {
      console.error('❌ [Web-生成身份码] 编码失败:', encodingError);
      const backupCode = `VG_USER_BACKUP_${userData.userId}_${encodeURIComponent(userData.legalName)}_${Date.now()}`;
      debugLog('🔄 [Web-生成身份码] 使用备用格式:', backupCode);
      return backupCode;
    }
    
  } catch (error) {
    console.error('❌ [Web-生成身份码] 生成失败:', error);
    return `VG_USER_ERROR_${userData?.userId || 'unknown'}_${Date.now()}`;
  }
};