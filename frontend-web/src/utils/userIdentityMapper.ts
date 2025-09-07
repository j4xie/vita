/**
 * 用户身份数据映射工具
 */

import { UserIdentityData, OrganizationInfo, SchoolInfo, PositionInfo } from '../types/userIdentity';
import Base64 from 'react-native-base64';

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
 * @returns 学校信息对象
 */
export const createSchoolInfo = (dept: any, deptId?: number): SchoolInfo | undefined => {
  if (!dept && !deptId) return undefined;
  
  const schoolMapping = deptId ? getSchoolInfo(deptId) : null;
  
  // 优先使用部门名称，特别是对于CU总部这样的特殊情况
  const deptName = dept?.deptName || '';
  let schoolName = deptName;
  let fullName = deptName;
  
  // 如果有学校映射，使用映射的名称
  if (schoolMapping) {
    schoolName = schoolMapping.name;
    fullName = schoolMapping.fullName;
  } else if (deptName.includes('CU总部') || deptName === 'CU总部') {
    // 特殊处理CU总部
    schoolName = 'CU总部';
    fullName = 'CU Headquarters';
  } else if (!deptName) {
    // 只有在完全没有信息时才显示未知
    schoolName = '未知学校';
    fullName = '未知学校';
  }
  
  return {
    id: (deptId || dept?.deptId || 0).toString(),
    name: schoolName,
    fullName: fullName,
    parentId: dept?.parentId,
    ancestors: dept?.ancestors,
  };
};

/**
 * 根据用户角色信息创建职位信息对象
 * @param roles 用户角色数组
 * @param posts 用户岗位数组
 * @returns 职位信息对象
 */
export const createPositionInfo = (roles: any[], posts?: any[]): PositionInfo | undefined => {
  if (!roles || roles.length === 0) return undefined;
  
  // 获取最高级别的角色
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
    // 如果没有找到标准角色，使用第一个角色
    highestRole = roles[0];
  }
  
  const roleKey = highestRole.key || highestRole.roleKey || 'common';
  
  // 角色中文名映射
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
 * @returns 身份码数据
 */
export const mapUserToIdentityData = (user: any): UserIdentityData => {
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

  // 获取组织信息 - 支持字符串和数字类型的orgId
  let orgInfo: OrganizationInfo | null = null;
  
  if (user.orgId) {
    const orgIdNum = typeof user.orgId === 'string' ? parseInt(user.orgId, 10) : user.orgId;
    if (!isNaN(orgIdNum)) {
      orgInfo = getOrganizationInfo(orgIdNum);
    }
  }
  
  // 如果没有组织信息，根据学校信息创建组织
  if (!orgInfo) {
    const schoolName = user.dept?.deptName || user.school?.name || '';
    if (schoolName) {
      if (schoolName.includes('CU总部') || schoolName === 'CU总部') {
        // CU总部的组织就是CU总部本身
        orgInfo = {
          id: 'cu_headquarters',
          name: 'CU总部',
          displayNameZh: 'CU总部',
          displayNameEn: 'CU Headquarters',
        };
      } else if (user.deptId) {
        // 其他学校使用默认组织映射
        orgInfo = getDefaultOrganizationBySchool(user.deptId);
      }
    }
  }
  
  // 获取学校信息
  const school = createSchoolInfo(user.dept, user.deptId);
  
  // 获取职位信息
  const position = createPositionInfo(user.roles, user.posts);

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
      id: '0',
      name: 'No Organization',
      displayNameZh: '无组织',
      displayNameEn: 'No Organization',
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
 * 生成用户身份QR码内容
 * @param userData 用户身份数据
 * @returns QR码字符串
 */
export const generateUserQRContent = (userData: UserIdentityData): string => {
  try {
    // 完整的QR码内容，包含所有关键信息
    const qrData = {
      type: 'VG_USER',
      userId: userData.userId,
      userName: userData.userName,
      legalName: userData.legalName,
      nickName: userData.nickName,
      organization: userData.currentOrganization?.displayNameZh || userData.currentOrganization?.name,
      school: userData.school?.name || userData.school?.fullName,
      position: userData.position?.displayName,
      roleKey: userData.position?.roleKey,
      timestamp: Date.now(),
    };
    
    // 生成QR码字符串 - 使用base64编码格式与扫描解析逻辑匹配
    const jsonString = JSON.stringify(qrData);
    
    // 如果数据太长，使用简化格式
    if (jsonString.length > 800) {
      return `VG_USER_${userData.userId}_${userData.legalName}_${userData.position?.roleKey || 'user'}_${Date.now()}`;
    }
    
    // 编码为base64格式，与扫描解析逻辑匹配 - 使用React Native兼容的方案
    const encodedString = encodeURIComponent(jsonString);
    const base64Data = Base64.encode(encodedString);
    
    return `VG_USER_${base64Data}`;
  } catch (error) {
    console.error('生成QR码内容失败:', error);
    return `VG_USER_${userData.userId || 'unknown'}_${Date.now()}`;
  }
};