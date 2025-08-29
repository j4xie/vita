/**
 * 用户身份数据映射工具
 */

import { UserIdentityData, OrganizationInfo } from '../types/userIdentity';

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
 * 将后端用户数据转换为身份码数据
 * @param user 后端用户数据
 * @returns 身份码数据
 */
export const mapUserToIdentityData = (user: any): UserIdentityData => {
  if (!user) {
    // 如果没有用户数据，返回默认数据
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

  // 获取组织信息
  const orgInfo = user.orgId ? getOrganizationInfo(user.orgId) : null;
  
  // 获取学校信息
  const schoolInfo = user.deptId ? getSchoolInfo(user.deptId) : null;

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
    // 简化的QR码内容，只包含关键信息
    const qrData = {
      type: 'VG_USER',
      userId: userData.userId,
      userName: userData.userName,
      legalName: userData.legalName,
      organization: userData.currentOrganization?.displayNameZh || userData.currentOrganization?.name,
      timestamp: Date.now(),
    };
    
    // 生成QR码字符串
    const jsonString = JSON.stringify(qrData);
    const encodedString = encodeURIComponent(jsonString);
    
    // 使用简单的格式，避免base64可能的兼容性问题
    return `VG_USER_${userData.userId}_${Date.now()}`;
  } catch (error) {
    console.error('生成QR码内容失败:', error);
    return `VG_USER_${userData.userId || 'unknown'}`;
  }
};