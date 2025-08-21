/**
 * 组织相关类型定义
 * 支持多学联组织架构和会员卡系统
 */

// ==================== 组织类型 ====================

export interface Organization {
  id: string;
  name: string;                    // 组织名称
  displayNameZh: string;           // 中文显示名
  displayNameEn: string;           // 英文显示名
  slug: string;                    // URL友好标识
  region: string;                  // 地区 (US-NY, US-CA, etc.)
  logoUrl?: string;                // Logo图片URL
  brandColors: {
    primary: string;               // 主色
    secondary: string;             // 辅色
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    wechat?: string;
  };
  memberCount: number;             // 成员数量
  isActive: boolean;               // 是否启用
  createdAt: string;
  updatedAt: string;
}

// ==================== 用户组织关系 ====================

export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  membershipLevel: 'basic' | 'premium' | 'vip';
  memberNumber: string;            // 会员编号
  joinDate: string;                // 加入日期
  isCurrent: boolean;              // 当前激活组织
  isActive: boolean;               // 会员状态
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationData?: {
    studentId?: string;
    universityEmail?: string;
    documents?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// ==================== 商家类型 ====================

export interface Merchant {
  id: string;
  name: string;                    // 商家名称
  category: 'dining' | 'retail' | 'service' | 'education' | 'entertainment';
  description?: string;            // 描述
  logoUrl?: string;                // Logo URL
  brandColors: {
    primary: string;
    secondary: string;
  };
  address?: string;                // 地址
  phone?: string;                  // 电话
  website?: string;                // 网站
  qrCodePattern: string;           // QR码模式
  businessHours?: {
    [key: string]: {               // 星期几
      open: string;                // 开门时间
      close: string;               // 关门时间
      closed?: boolean;            // 是否休息
    };
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== 组织-商家合作关系 ====================

export interface OrganizationMerchantPartnership {
  id: string;
  organizationId: string;
  merchantId: string;
  partnershipType: 'standard' | 'premium' | 'exclusive';
  discountRate?: number;           // 折扣率 (0-100)
  specialBenefits?: string[];      // 特殊权益
  startDate?: string;              // 合作开始日期
  endDate?: string;                // 合作结束日期
  isActive: boolean;
  createdAt: string;
}

// ==================== 会员卡类型 ====================

export interface MembershipCard {
  id: string;
  userId: string;
  organizationId: string;          // 所属组织
  merchantId?: string;             // 商家ID (商家会员卡)
  cardType: 'organization' | 'merchant';
  cardNumber: string;              // 卡号
  displayName: string;             // 显示名称
  points: number;                  // 积分
  membershipLevel: 'basic' | 'premium' | 'vip';
  qrCodeData: string;              // 二维码数据
  appleWalletPassId?: string;      // Apple Wallet Pass ID
  googleWalletObjectId?: string;   // Google Wallet Object ID
  lastUsedAt?: string;             // 最后使用时间
  expiresAt?: string;              // 过期时间
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据 (前端组装)
  organization?: Organization;
  merchant?: Merchant;
  partnershipInfo?: OrganizationMerchantPartnership;
}

// ==================== 积分交易记录 ====================

export interface PointsTransaction {
  id: string;
  cardId: string;
  transactionType: 'earn' | 'redeem' | 'transfer' | 'expire';
  pointsChange: number;            // 积分变化(正负数)
  description: string;             // 交易描述
  referenceId?: string;            // 关联ID(订单、活动等)
  merchantId?: string;             // 相关商家
  createdAt: string;
  
  // 关联数据
  merchant?: Merchant;
}

// ==================== API请求/响应类型 ====================

// 切换组织请求
export interface SwitchOrganizationRequest {
  userId: string;
  organizationId: string;
}

// 验证商家QR码请求
export interface VerifyMerchantQRRequest {
  qrData: string;
  userId: string;
  organizationId: string;
}

// 验证商家QR码响应
export interface VerifyMerchantQRResponse {
  valid: boolean;
  merchant?: Merchant;
  hasPermission: boolean;
  partnershipInfo?: OrganizationMerchantPartnership;
  availableOrganizations?: Organization[]; // 有权限的其他组织
  message: string;
}

// 创建商家会员卡请求
export interface CreateMerchantCardRequest {
  userId: string;
  organizationId: string;
  merchantId: string;
  qrData: string;
}

// 创建商家会员卡响应
export interface CreateMerchantCardResponse {
  success: boolean;
  card?: MembershipCard;
  appleWalletPassUrl?: string;
  message: string;
}

// 更新积分请求
export interface UpdatePointsRequest {
  pointsChange: number;
  transactionType: 'earn' | 'redeem' | 'transfer' | 'expire';
  description: string;
  merchantId?: string;
  referenceId?: string;
}

// ==================== 前端状态类型 ====================

// 组织切换器状态
export interface OrganizationSwitcherState {
  isExpanded: boolean;
  selectedOrganization?: Organization;
  isAnimating: boolean;
  error?: string;
}

// 会员卡筛选选项
export interface CardFilterOptions {
  cardType?: 'organization' | 'merchant' | 'all';
  category?: 'dining' | 'retail' | 'service' | 'education' | 'entertainment' | 'all';
  organizationId?: string;
  sortBy?: 'created_date' | 'last_used' | 'points' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// 会员卡列表响应
export interface MembershipCardsResponse {
  cards: MembershipCard[];
  totalCount: number;
  organizationCards: MembershipCard[];
  merchantCards: MembershipCard[];
  categories: {
    [category: string]: MembershipCard[];
  };
}

// ==================== 组件Props类型 ====================

// 组织切换器Props
export interface OrganizationSwitcherProps {
  topOffset?: number;              // 垂直位置偏移
  onOrganizationChange: (orgId: string) => void;
  currentOrganization: Organization;
  organizations: Organization[];
  disabled?: boolean;
  testID?: string;
}

// 会员卡组件Props
export interface MembershipCardProps {
  card: MembershipCard;
  onPress?: (card: MembershipCard) => void;
  onLongPress?: (card: MembershipCard) => void;
  showAddToWallet?: boolean;
  compact?: boolean;               // 紧凑模式
  testID?: string;
}

// ==================== 工具类型 ====================

// QR码解析结果
export interface QRCodeParseResult {
  type: 'merchant' | 'organization' | 'activity' | 'unknown';
  data: {
    merchantId?: string;
    organizationId?: string;
    activityId?: string;
    locationId?: string;
    extra?: Record<string, any>;
  };
  rawData: string;
}

// 组织切换结果
export interface OrganizationSwitchResult {
  success: boolean;
  previousOrganization?: Organization;
  newOrganization?: Organization;
  affectedData: {
    cardsUpdated: number;
    activitiesReloaded: boolean;
    merchantsReloaded: boolean;
  };
  message: string;
}

// ==================== 错误类型 ====================

export interface OrganizationError {
  code: 'PERMISSION_DENIED' | 'ORGANIZATION_NOT_FOUND' | 'VERIFICATION_REQUIRED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: Record<string, any>;
}

export interface MembershipCardError {
  code: 'CARD_ALREADY_EXISTS' | 'MERCHANT_NOT_AVAILABLE' | 'INVALID_QR_CODE' | 'PERMISSION_DENIED' | 'NETWORK_ERROR';
  message: string;
  details?: Record<string, any>;
}

// ==================== 常量定义 ====================

export const CARD_TYPES = {
  ORGANIZATION: 'organization' as const,
  MERCHANT: 'merchant' as const,
};

export const MEMBERSHIP_LEVELS = {
  BASIC: 'basic' as const,
  PREMIUM: 'premium' as const,
  VIP: 'vip' as const,
};

export const MERCHANT_CATEGORIES = {
  DINING: 'dining' as const,
  RETAIL: 'retail' as const,
  SERVICE: 'service' as const,
  EDUCATION: 'education' as const,
  ENTERTAINMENT: 'entertainment' as const,
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending' as const,
  VERIFIED: 'verified' as const,
  REJECTED: 'rejected' as const,
};

export const TRANSACTION_TYPES = {
  EARN: 'earn' as const,
  REDEEM: 'redeem' as const,
  TRANSFER: 'transfer' as const,
  EXPIRE: 'expire' as const,
};

// ==================== 类型守卫 ====================

export const isOrganizationCard = (card: MembershipCard): boolean => {
  return card.cardType === CARD_TYPES.ORGANIZATION;
};

export const isMerchantCard = (card: MembershipCard): boolean => {
  return card.cardType === CARD_TYPES.MERCHANT;
};

export const isValidQRCode = (qrData: string): boolean => {
  return qrData.startsWith('vitaglobal://') || qrData.startsWith('https://vitaglobal.com/');
};

export const isExpiredCard = (card: MembershipCard): boolean => {
  if (!card.expiresAt) return false;
  return new Date(card.expiresAt) < new Date();
};