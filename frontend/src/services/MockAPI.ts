/**
 * Mock API 服务
 * 模拟后端API响应，用于前端开发和演示
 */

import { 
  Organization, 
  UserOrganization, 
  MembershipCard, 
  Merchant,
  PointsTransaction 
} from '../types/organization';

// ==================== Mock数据 ====================

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 'org_columbia_cu',
    name: 'Columbia CU',
    displayNameZh: '哥伦比亚大学中国学联',
    displayNameEn: 'Columbia University Chinese Union',
    slug: 'columbia-cu',
    region: 'US-NY',
    logoUrl: 'https://example.com/logos/columbia.png',
    brandColors: {
      primary: '#1E40AF',
      secondary: '#DBEAFE'
    },
    contactInfo: {
      email: 'contact@columbia-cu.org',
      website: 'https://columbia-cu.org'
    },
    memberCount: 1250,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'org_cssa',
    name: 'CSSA',
    displayNameZh: '中国学生学者联谊会',
    displayNameEn: 'Chinese Students and Scholars Association',
    slug: 'cssa',
    region: 'US-NY',
    logoUrl: 'https://example.com/logos/cssa.png',
    brandColors: {
      primary: '#DC2626',
      secondary: '#FEE2E2'
    },
    contactInfo: {
      email: 'contact@cssa.org',
      website: 'https://cssa.org'
    },
    memberCount: 890,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 'merchant_starbucks',
    name: 'Starbucks Coffee',
    category: 'dining',
    description: '全球知名咖啡连锁品牌',
    logoUrl: 'https://example.com/logos/starbucks.png',
    brandColors: {
      primary: '#00704A',
      secondary: '#FFFFFF'
    },
    address: '2920 Broadway, New York, NY 10025',
    phone: '+1 (212) 222-0200',
    website: 'https://starbucks.com',
    qrCodePattern: 'vitaglobal://merchant/merchant_starbucks',
    businessHours: {
      'monday': { open: '06:00', close: '22:00' },
      'tuesday': { open: '06:00', close: '22:00' },
      'wednesday': { open: '06:00', close: '22:00' },
      'thursday': { open: '06:00', close: '22:00' },
      'friday': { open: '06:00', close: '23:00' },
      'saturday': { open: '07:00', close: '23:00' },
      'sunday': { open: '07:00', close: '22:00' }
    },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'merchant_mcdonalds',
    name: "McDonald's",
    category: 'dining',
    description: '经典美式快餐连锁',
    logoUrl: 'https://example.com/logos/mcdonalds.png',
    brandColors: {
      primary: '#FFCC00',
      secondary: '#DA020E'
    },
    address: '2881 Broadway, New York, NY 10025',
    phone: '+1 (212) 866-4008',
    website: 'https://mcdonalds.com',
    qrCodePattern: 'vitaglobal://merchant/merchant_mcdonalds',
    businessHours: {
      'monday': { open: '05:00', close: '23:00' },
      'tuesday': { open: '05:00', close: '23:00' },
      'wednesday': { open: '05:00', close: '23:00' },
      'thursday': { open: '05:00', close: '23:00' },
      'friday': { open: '05:00', close: '24:00' },
      'saturday': { open: '05:00', close: '24:00' },
      'sunday': { open: '05:00', close: '23:00' }
    },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'merchant_subway',
    name: 'Subway',
    category: 'dining',
    description: '新鲜健康潜艇堡',
    logoUrl: 'https://example.com/logos/subway.png',
    brandColors: {
      primary: '#009639',
      secondary: '#FFCC00'
    },
    address: '2872 Broadway, New York, NY 10025',
    phone: '+1 (212) 316-6344',
    website: 'https://subway.com',
    qrCodePattern: 'vitaglobal://merchant/merchant_subway',
    businessHours: {
      'monday': { open: '07:00', close: '22:00' },
      'tuesday': { open: '07:00', close: '22:00' },
      'wednesday': { open: '07:00', close: '22:00' },
      'thursday': { open: '07:00', close: '22:00' },
      'friday': { open: '07:00', close: '22:00' },
      'saturday': { open: '08:00', close: '22:00' },
      'sunday': { open: '08:00', close: '21:00' }
    },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const MOCK_USER_ORGANIZATIONS: UserOrganization[] = [
  {
    id: 'membership_1',
    userId: 'user_123',
    organizationId: 'org_columbia_cu',
    membershipLevel: 'basic',
    memberNumber: 'CU2024001',
    joinDate: '2024-01-15',
    isCurrent: true,
    isActive: true,
    verificationStatus: 'verified',
    verificationData: {
      studentId: 'uni123',
      universityEmail: 'user@columbia.edu'
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'membership_2',
    userId: 'user_123',
    organizationId: 'org_cssa',
    membershipLevel: 'premium',
    memberNumber: 'CSSA2024002',
    joinDate: '2024-02-01',
    isCurrent: false,
    isActive: true,
    verificationStatus: 'verified',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
];

const MOCK_MEMBERSHIP_CARDS: MembershipCard[] = [
  {
    id: 'card_org_cu_001',
    userId: 'user_123',
    organizationId: 'org_columbia_cu',
    cardType: 'organization',
    cardNumber: 'CU2024001',
    displayName: '哥伦比亚大学中国学联会员卡',
    points: 1250,
    membershipLevel: 'basic',
    qrCodeData: 'vitaglobal://card/organization/card_org_cu_001?number=CU2024001&org=org_columbia_cu',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'card_org_cssa_001',
    userId: 'user_123',
    organizationId: 'org_cssa',
    cardType: 'organization',
    cardNumber: 'CSSA2024002',
    displayName: '中国学生学者联谊会会员卡',
    points: 890,
    membershipLevel: 'premium',
    qrCodeData: 'vitaglobal://card/organization/card_org_cssa_001?number=CSSA2024002&org=org_cssa',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'card_merchant_sb_001',
    userId: 'user_123',
    organizationId: 'org_columbia_cu',
    merchantId: 'merchant_starbucks',
    cardType: 'merchant',
    cardNumber: 'SB001234567',
    displayName: 'Starbucks Coffee 会员卡',
    points: 480,
    membershipLevel: 'basic',
    qrCodeData: 'vitaglobal://card/merchant/card_merchant_sb_001?number=SB001234567&org=org_columbia_cu&merchant=merchant_starbucks',
    lastUsedAt: '2024-08-15T10:30:00Z',
    isActive: true,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-08-15T10:30:00Z'
  }
];

// 商家-组织合作关系
const MOCK_PARTNERSHIPS = {
  'merchant_starbucks': ['org_columbia_cu', 'org_cssa'],
  'merchant_mcdonalds': ['org_columbia_cu'],
  'merchant_subway': ['org_cssa'],
};

// ==================== Mock API类 ====================

export class MockAPI {
  private static delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== 组织相关API ====================

  static async getUserOrganizations(userId: string): Promise<{
    organizations: Organization[];
    memberships: UserOrganization[];
  }> {
    await this.delay();
    
    const userMemberships = MOCK_USER_ORGANIZATIONS.filter(m => m.userId === userId);
    const organizationIds = userMemberships.map(m => m.organizationId);
    const organizations = MOCK_ORGANIZATIONS.filter(o => organizationIds.includes(o.id));
    
    return {
      organizations,
      memberships: userMemberships
    };
  }

  static async switchOrganization(userId: string, organizationId: string): Promise<{
    success: boolean;
    message: string;
    organization?: Organization;
  }> {
    await this.delay(300);
    
    const organization = MOCK_ORGANIZATIONS.find(o => o.id === organizationId);
    const membership = MOCK_USER_ORGANIZATIONS.find(
      m => m.userId === userId && m.organizationId === organizationId
    );
    
    if (!organization || !membership) {
      return {
        success: false,
        message: '组织不存在或用户无权限'
      };
    }
    
    return {
      success: true,
      message: `已切换到 ${organization.displayNameZh}`,
      organization
    };
  }

  // ==================== 商家相关API ====================

  static async getMerchantsByOrganization(organizationId: string): Promise<Merchant[]> {
    await this.delay();
    
    const availableMerchants = MOCK_MERCHANTS.filter(merchant => {
      const partnerships = MOCK_PARTNERSHIPS[merchant.id as keyof typeof MOCK_PARTNERSHIPS];
      return partnerships?.includes(organizationId);
    });
    
    return availableMerchants;
  }

  static async verifyMerchantAccess(
    merchantId: string, 
    organizationId: string
  ): Promise<{
    hasAccess: boolean;
    merchant?: Merchant;
    availableOrganizations?: string[];
  }> {
    await this.delay(200);
    
    const merchant = MOCK_MERCHANTS.find(m => m.id === merchantId);
    if (!merchant) {
      return { hasAccess: false };
    }
    
    const partnerships = MOCK_PARTNERSHIPS[merchantId as keyof typeof MOCK_PARTNERSHIPS] || [];
    const hasAccess = partnerships.includes(organizationId);
    
    return {
      hasAccess,
      merchant,
      availableOrganizations: hasAccess ? undefined : partnerships
    };
  }

  // ==================== 会员卡相关API ====================

  static async getUserMembershipCards(userId: string, organizationId?: string): Promise<MembershipCard[]> {
    await this.delay();
    
    let cards = MOCK_MEMBERSHIP_CARDS.filter(c => c.userId === userId);
    
    if (organizationId) {
      cards = cards.filter(c => c.organizationId === organizationId);
    }
    
    return cards;
  }

  static async createMembershipCard(params: {
    userId: string;
    organizationId: string;
    merchantId?: string;
    cardType: 'organization' | 'merchant';
  }): Promise<MembershipCard> {
    await this.delay(800); // 模拟创建时间
    
    const cardNumber = this.generateCardNumber(params.organizationId, params.cardType);
    const cardId = `card_${params.cardType}_${Date.now()}`;
    
    let displayName = '';
    if (params.cardType === 'organization') {
      const org = MOCK_ORGANIZATIONS.find(o => o.id === params.organizationId);
      displayName = `${org?.displayNameZh || '组织'}会员卡`;
    } else {
      const merchant = MOCK_MERCHANTS.find(m => m.id === params.merchantId);
      displayName = `${merchant?.name || '商家'} 会员卡`;
    }
    
    const newCard: MembershipCard = {
      id: cardId,
      userId: params.userId,
      organizationId: params.organizationId,
      merchantId: params.merchantId,
      cardType: params.cardType,
      cardNumber,
      displayName,
      points: 0,
      membershipLevel: 'basic',
      qrCodeData: this.generateQRCodeData(cardId, cardNumber, params),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 模拟添加到数据存储
    MOCK_MEMBERSHIP_CARDS.push(newCard);
    
    return newCard;
  }

  static async updateCardPoints(
    cardId: string, 
    pointsChange: number, 
    transactionType: 'earn' | 'redeem'
  ): Promise<{
    success: boolean;
    newPoints: number;
    transaction: PointsTransaction;
  }> {
    await this.delay(300);
    
    const card = MOCK_MEMBERSHIP_CARDS.find(c => c.id === cardId);
    if (!card) {
      throw new Error('会员卡不存在');
    }
    
    const newPoints = Math.max(0, card.points + pointsChange);
    card.points = newPoints;
    card.updatedAt = new Date().toISOString();
    
    const transaction: PointsTransaction = {
      id: `txn_${Date.now()}`,
      cardId,
      transactionType,
      pointsChange,
      description: transactionType === 'earn' ? '消费获得积分' : '积分兑换奖励',
      createdAt: new Date().toISOString()
    };
    
    return {
      success: true,
      newPoints,
      transaction
    };
  }

  // ==================== 统计相关API ====================

  static async getCardStatistics(userId: string): Promise<{
    totalCards: number;
    organizationCards: number;
    merchantCards: number;
    totalPoints: number;
    recentTransactions: PointsTransaction[];
  }> {
    await this.delay();
    
    const userCards = MOCK_MEMBERSHIP_CARDS.filter(c => c.userId === userId);
    const organizationCards = userCards.filter(c => c.cardType === 'organization');
    const merchantCards = userCards.filter(c => c.cardType === 'merchant');
    const totalPoints = userCards.reduce((sum, card) => sum + card.points, 0);
    
    // 模拟最近交易记录
    const recentTransactions: PointsTransaction[] = [
      {
        id: 'txn_001',
        cardId: 'card_merchant_sb_001',
        transactionType: 'earn',
        pointsChange: 25,
        description: 'Starbucks消费获得积分',
        merchantId: 'merchant_starbucks',
        createdAt: '2024-08-15T10:30:00Z'
      },
      {
        id: 'txn_002',
        cardId: 'card_org_cu_001',
        transactionType: 'earn',
        pointsChange: 100,
        description: '参与活动获得积分',
        createdAt: '2024-08-10T14:20:00Z'
      }
    ];
    
    return {
      totalCards: userCards.length,
      organizationCards: organizationCards.length,
      merchantCards: merchantCards.length,
      totalPoints,
      recentTransactions
    };
  }

  // ==================== 工具方法 ====================

  private static generateCardNumber(organizationId: string, cardType: 'organization' | 'merchant'): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orgPrefix = organizationId.includes('columbia') ? 'CU' : 'CSSA';
    const typePrefix = cardType === 'organization' ? 'ORG' : 'MER';
    
    return `${orgPrefix}${typePrefix}${timestamp}${random}`;
  }

  private static generateQRCodeData(
    cardId: string, 
    cardNumber: string, 
    params: any
  ): string {
    const baseUrl = `vitaglobal://card/${params.cardType}/${cardId}`;
    const searchParams = new URLSearchParams({
      number: cardNumber,
      org: params.organizationId,
      timestamp: Date.now().toString()
    });
    
    if (params.merchantId) {
      searchParams.set('merchant', params.merchantId);
    }
    
    return `${baseUrl}?${searchParams.toString()}`;
  }

  // ==================== 获取静态数据 ====================

  static getOrganizations(): Organization[] {
    return [...MOCK_ORGANIZATIONS];
  }

  static getMerchants(): Merchant[] {
    return [...MOCK_MERCHANTS];
  }

  static getMerchantById(merchantId: string): Merchant | undefined {
    return MOCK_MERCHANTS.find(m => m.id === merchantId);
  }

  static getOrganizationById(organizationId: string): Organization | undefined {
    return MOCK_ORGANIZATIONS.find(o => o.id === organizationId);
  }
}

export default MockAPI;