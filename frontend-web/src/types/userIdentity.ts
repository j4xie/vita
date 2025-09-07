// 用户身份识别相关类型定义

export interface UserIdentityData {
  userId: string;
  userName: string;
  legalName: string;
  nickName: string;
  email: string;
  avatarUrl?: string;
  studentId?: string;
  deptId?: string;
  currentOrganization?: OrganizationInfo;
  memberOrganizations?: UserOrganizationMembership[];
  school?: SchoolInfo;
  position?: PositionInfo;
  type: 'user_identity';
}

export interface OrganizationInfo {
  id: string;
  name: string;
  displayNameZh: string;
  displayNameEn?: string;
  logoUrl?: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  fullName?: string;
  parentId?: number;
  ancestors?: string;
}

export interface PositionInfo {
  roleKey: string;
  roleName: string;
  displayName: string;
  displayNameEn?: string;
  level: 'admin' | 'part_admin' | 'staff' | 'user';
}

export interface UserOrganizationMembership {
  id: string;
  role: 'member' | 'admin' | 'super_admin';
  isPrimary: boolean;
  joinedAt: string; // ISO timestamp
  status: 'active' | 'inactive' | 'pending';
}

export interface ScannedUserInfo {
  isValid: boolean;
  user?: {
    userId: string;
    legalName: string;
    nickName: string;
    email: string;
    avatarUrl?: string;
    studentId?: string;
    currentOrganization?: OrganizationInfo;
    activityStats?: {
      totalParticipated: number;
      volunteeredHours: number;
      points: number;
    };
  };
  permissions?: {
    canViewDetails: boolean;
    canViewContact: boolean;
    canViewActivities: boolean;
  };
  recentActivities?: RecentActivity[];
  error?: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  participatedAt: string; // ISO timestamp
  role: 'participant' | 'organizer' | 'volunteer';
  organizationId: string;
}

export interface IdentityQRCodeProps {
  visible: boolean;
  onClose: () => void;
  userData: UserIdentityData;
}

export interface ScannedUserModalProps {
  visible: boolean;
  onClose: () => void;
  userInfo: ScannedUserInfo;
  scannerOrganization?: OrganizationInfo;
}

// QR码生成和解析相关
export interface QRCodeGenerationOptions {
  size?: number;
  backgroundColor?: string;
  color?: string;
  logo?: string;
  logoSize?: number;
}

export interface ParsedUserQRCode {
  isValid: boolean;
  data?: UserIdentityData;
  error?: string;
}

// 身份验证相关
export interface IdentityVerificationRequest {
  identityCode: string;
  scannerUserId: string;
  scannerOrganizationId: string;
}

export interface IdentityVerificationResponse {
  isValid: boolean;
  user?: ScannedUserInfo['user'];
  permissions?: ScannedUserInfo['permissions'];
  recentActivities?: RecentActivity[];
  error?: {
    code: string;
    message: string;
  };
}

// 模拟数据类型（前端开发阶段使用）
export interface MockUserData {
  userId: string;
  userName: string;
  legalName: string;
  nickName: string;
  email: string;
  sex: 0 | 1 | 2; // 0-男 1-女 2-未知
  deptId: string;
  phoneNumber: string;
}

// 工具类型
export type UserIdentityQRContent = string; // Base64 encoded UserIdentityData
export type QRScanResult = 'success' | 'invalid_format' | 'expired' | 'network_error';