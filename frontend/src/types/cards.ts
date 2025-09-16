/**
 * 会员卡相关类型定义
 * 专门用于会员卡管理功能
 */

import { Organization, Merchant, MembershipCard, PointsTransaction } from './organization';

// ==================== 会员卡显示类型 ====================

export interface CardDisplayInfo {
  id: string;
  title: string;                  // 卡片标题
  subtitle: string;               // 卡片副标题  
  logoUrl?: string;               // 显示的Logo
  brandColors: {
    primary: string;
    secondary: string;
    gradient?: string[];          // 渐变色数组
  };
  category: 'organization' | 'dining' | 'retail' | 'service' | 'education' | 'entertainment';
  categoryLabel: string;          // 分类显示标签
  cardNumber: string;
  points: number;
  membershipLevel: string;
  membershipLevelLabel: string;   // 等级显示标签
  isExpired: boolean;
  expiryText?: string;            // 过期显示文本
  qrCodeData: string;
  benefits?: string[];            // 权益列表
  lastUsedText?: string;          // 最后使用时间文本
  addedToWallet: boolean;         // 是否已添加到钱包
}

// ==================== 会员卡分组 ====================

export interface CardGroup {
  id: string;
  title: string;
  subtitle?: string;
  cards: CardDisplayInfo[];
  count: number;
  icon?: string;                  // 分组图标
  color?: string;                 // 分组颜色
}

export interface CardGroupCollection {
  organizationCards: CardGroup;   // 组织会员卡分组
  merchantCards: {
    dining: CardGroup;
    retail: CardGroup;
    service: CardGroup;
    education: CardGroup;
    entertainment: CardGroup;
    other: CardGroup;
  };
  totalCount: number;
  recentlyUsed: CardDisplayInfo[]; // 最近使用的卡片
  expiringSoon: CardDisplayInfo[]; // 即将过期的卡片
}

// ==================== 会员卡操作 ====================

export interface CardAction {
  id: string;
  label: string;
  icon: string;
  onPress: (card: CardDisplayInfo) => void;
  disabled?: boolean;
  destructive?: boolean;          // 是否为危险操作
}

export interface CardActionSheet {
  card: CardDisplayInfo;
  actions: CardAction[];
}

// ==================== Apple Wallet 集成 ====================

export interface AppleWalletPassInfo {
  passId: string;
  passUrl: string;
  expiresAt: string;
  lastUpdated: string;
  isInstalled: boolean;           // 是否已安装到用户钱包
  updateAvailable: boolean;       // 是否有更新可用
}

export interface AddToWalletRequest {
  cardId: string;
  userId: string;
  cardType: 'organization' | 'merchant';
}

export interface AddToWalletResponse {
  success: boolean;
  passInfo?: AppleWalletPassInfo;
  downloadUrl?: string;
  error?: string;
}

// ==================== 会员卡详情 ====================

export interface CardDetailInfo extends Omit<CardDisplayInfo, 'benefits'> {
  organization: Organization;
  merchant?: Merchant;
  memberSince: string;            // 会员起始时间
  totalPointsEarned: number;      // 累计获得积分
  totalPointsRedeemed: number;    // 累计消费积分
  transactionHistory: PointsTransaction[];
  usageStats: {
    thisMonth: number;            // 本月使用次数
    lastMonth: number;            // 上月使用次数
    totalUsage: number;           // 总使用次数
  };
  benefits: {
    current: string[];            // 当前权益
    upcoming: string[];           // 即将获得的权益
    expired: string[];            // 已过期权益
  };
  nextLevelInfo?: {
    level: string;
    pointsRequired: number;       // 还需积分
    benefits: string[];           // 升级后权益
  };
}

// ==================== QR码扫描结果 ====================

export interface MerchantQRScanResult {
  success: boolean;
  merchant?: Merchant;
  organization?: Organization;
  hasPermission: boolean;
  existingCard?: MembershipCard;
  availableOrganizations?: Organization[];
  error?: {
    code: 'NO_PERMISSION' | 'ALREADY_MEMBER' | 'INVALID_QR' | 'MERCHANT_INACTIVE';
    message: string;
    suggestedAction?: 'SWITCH_ORGANIZATION' | 'USE_EXISTING_CARD' | 'CONTACT_MERCHANT';
  };
}

export interface CardCreationResult {
  success: boolean;
  card?: MembershipCard;
  displayInfo?: CardDisplayInfo;
  appleWalletOption?: {
    available: boolean;
    passUrl?: string;
  };
  error?: string;
}

// ==================== 搜索和筛选 ====================

export interface CardSearchQuery {
  text: string;
  category?: string;
  organizationId?: string;
  hasPoints?: boolean;            // 是否有积分
  recentlyUsed?: boolean;         // 是否最近使用过
  expiringSoon?: boolean;         // 是否即将过期
}

export interface CardSearchResult {
  cards: CardDisplayInfo[];
  totalCount: number;
  query: CardSearchQuery;
  suggestions?: string[];         // 搜索建议
}

export interface CardFilterState {
  activeFilters: CardSearchQuery;
  availableCategories: {
    id: string;
    label: string;
    count: number;
  }[];
  availableOrganizations: {
    id: string;
    name: string;
    count: number;
  }[];
}

// ==================== 空状态和错误状态 ====================

export interface EmptyCardState {
  type: 'NO_CARDS' | 'NO_SEARCH_RESULTS' | 'NO_ORGANIZATION_CARDS' | 'NO_MERCHANT_CARDS';
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  illustration?: string;          // 插图资源路径
}

export interface CardErrorState {
  type: 'NETWORK_ERROR' | 'PERMISSION_ERROR' | 'SYNC_ERROR' | 'UNKNOWN_ERROR';
  title: string;
  subtitle: string;
  retryAction?: {
    label: string;
    onPress: () => void;
  };
  icon?: string;
}

// ==================== 会员卡动画 ====================

export interface CardAnimationConfig {
  duration: number;
  type: 'spring' | 'timing';
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
  };
  timingConfig?: {
    easing: any;                  // Easing function
  };
}

export interface CardTransition {
  entrance: CardAnimationConfig;
  exit: CardAnimationConfig;
  press: CardAnimationConfig;
  addToWallet: CardAnimationConfig;
}

// ==================== 会员卡模板 ====================

export interface CardTemplate {
  id: string;
  name: string;
  type: 'organization' | 'merchant';
  category?: string;
  brandColors: {
    primary: string;
    secondary: string;
    gradient?: string[];
  };
  layout: {
    logoPosition: 'top-left' | 'top-center' | 'center';
    showPoints: boolean;
    showLevel: boolean;
    showQRCode: boolean;
    backgroundStyle: 'solid' | 'gradient' | 'pattern';
  };
  fields: {
    primary: string[];            // 主要显示字段
    secondary: string[];          // 次要显示字段
    auxiliary: string[];          // 辅助显示字段
  };
}

// ==================== 本地存储类型 ====================

export interface StoredCardData {
  cards: MembershipCard[];
  lastSyncTime: string;
  version: string;                // 数据版本号
  organizationMapping: {
    [orgId: string]: Organization;
  };
  merchantMapping: {
    [merchantId: string]: Merchant;
  };
}

export interface CardSyncStatus {
  lastSyncTime: string;
  pendingSync: string[];          // 待同步的卡片ID
  syncErrors: string[];           // 同步失败的卡片ID
  isOnline: boolean;
}

// ==================== 事件类型 ====================

export interface CardEvent {
  type: 'CARD_ADDED' | 'CARD_UPDATED' | 'CARD_DELETED' | 'POINTS_CHANGED' | 'WALLET_ADDED';
  cardId: string;
  timestamp: string;
  data?: any;
}

export interface CardEventListener {
  eventType: CardEvent['type'];
  callback: (event: CardEvent) => void;
}

// ==================== 工具函数类型 ====================

export type CardFormatter = (card: MembershipCard, org?: Organization, merchant?: Merchant) => CardDisplayInfo;

export type CardGrouper = (cards: CardDisplayInfo[]) => CardGroupCollection;

export type CardSorter = (cards: CardDisplayInfo[], sortBy: string, order: 'asc' | 'desc') => CardDisplayInfo[];

export type CardFilter = (cards: CardDisplayInfo[], filters: CardSearchQuery) => CardDisplayInfo[];

// ==================== 组件状态类型 ====================

export interface MyCardsScreenState {
  cards: CardDisplayInfo[];
  groups: CardGroupCollection;
  loading: boolean;
  refreshing: boolean;
  error?: CardErrorState;
  searchQuery: string;
  activeFilters: CardFilterState;
  selectedCard?: CardDisplayInfo;
  showActionSheet: boolean;
  syncStatus: CardSyncStatus;
}

export interface CardDetailScreenState {
  card?: CardDetailInfo;
  loading: boolean;
  error?: CardErrorState;
  showQRModal: boolean;
  showTransactionHistory: boolean;
  addingToWallet: boolean;
  walletStatus?: AppleWalletPassInfo;
}

// ==================== 商家二维码格式 ====================

export interface MerchantQRCodeData {
  version: string;                // QR码版本
  merchantId: string;             // 商家ID
  locationId?: string;            // 门店ID（如果有多个分店）
  campaignId?: string;            // 活动ID（如果是特殊活动）
  timestamp: string;              // 生成时间戳
  signature?: string;             // 数字签名（防伪）
  extra?: Record<string, any>;    // 额外数据
}

// 解析后的QR码信息
export interface ParsedMerchantQR {
  isValid: boolean;
  merchantId?: string;
  locationId?: string;
  campaignId?: string;
  isExpired: boolean;
  error?: string;
  rawData: string;
}

// ==================== 常量定义 ====================

export const CARD_TYPES = {
  ORGANIZATION: 'organization',
  MERCHANT: 'merchant',
} as const;

export const MEMBERSHIP_LEVELS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  VIP: 'vip',
} as const;

export const MERCHANT_CATEGORIES = {
  DINING: 'dining',
  RETAIL: 'retail',
  SERVICE: 'service',
  EDUCATION: 'education',
  ENTERTAINMENT: 'entertainment',
} as const;

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const TRANSACTION_TYPES = {
  EARN: 'earn',
  REDEEM: 'redeem',
  TRANSFER: 'transfer',
  EXPIRE: 'expire',
} as const;

// ==================== 类型守卫 ====================

export const isOrganizationCard = (card: MembershipCard): boolean => {
  return card.cardType === CARD_TYPES.ORGANIZATION;
};

export const isMerchantCard = (card: MembershipCard): boolean => {
  return card.cardType === CARD_TYPES.MERCHANT;
};

export const isValidQRCode = (qrData: string): boolean => {
  return qrData.startsWith('pomelox://') || qrData.startsWith('https://pomelox.com/');
};

export const isExpiredCard = (card: MembershipCard): boolean => {
  if (!card.expiresAt) return false;
  return new Date(card.expiresAt) < new Date();
};

// ==================== 导出所有类型 ====================
// 移除重复导出，避免ESLint错误