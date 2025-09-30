/**
 * 会员卡管理服务
 * 处理会员卡的本地存储、数据转换、QR码解析等功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  MembershipCard, 
  Organization, 
  Merchant
} from '../types/organization';
import { 
  CardDisplayInfo, 
  CardGroupCollection, 
  StoredCardData,
  MerchantQRCodeData,
  MerchantQRScanResult,
  CardCreationResult,
  ParsedMerchantQR
} from '../types/cards';
// MockAPI import removed - using real data only

// ==================== 存储键名 ====================

const STORAGE_KEYS = {
  MEMBERSHIP_CARDS: '@pomelox:membership_cards',
  CARD_DISPLAY_CACHE: '@pomelox:card_display_cache',
  MERCHANTS_CACHE: '@pomelox:merchants_cache',
  ORGANIZATIONS_CACHE: '@pomelox:organizations_cache',
} as const;

// ==================== 会员卡服务类 ====================

export class MembershipCardService {
  private static instance: MembershipCardService;

  public static getInstance(): MembershipCardService {
    if (!MembershipCardService.instance) {
      MembershipCardService.instance = new MembershipCardService();
    }
    return MembershipCardService.instance;
  }

  // ==================== 本地存储操作 ====================

  /**
   * 获取所有会员卡 (仅使用真实数据)
   */
  async getAllCards(): Promise<MembershipCard[]> {
    try {
      // 使用本地存储的真实数据
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEMBERSHIP_CARDS);
      if (!data) return [];

      const storedData: StoredCardData = JSON.parse(data);
      return storedData.cards || [];
    } catch (error) {
      console.error('Error loading cards from storage:', error);
      return [];
    }
  }

  /**
   * 保存会员卡
   */
  async saveCard(card: MembershipCard): Promise<void> {
    try {
      const existingCards = await this.getAllCards();
      const cardIndex = existingCards.findIndex(c => c.id === card.id);

      let updatedCards: MembershipCard[];
      if (cardIndex >= 0) {
        // 更新现有卡片
        updatedCards = [...existingCards];
        updatedCards[cardIndex] = card;
      } else {
        // 添加新卡片
        updatedCards = [...existingCards, card];
      }

      const storedData: StoredCardData = {
        cards: updatedCards,
        lastSyncTime: new Date().toISOString(),
        version: '1.0',
        organizationMapping: {},
        merchantMapping: {}
      };

      await AsyncStorage.setItem(STORAGE_KEYS.MEMBERSHIP_CARDS, JSON.stringify(storedData));
    } catch (error) {
      console.error('Error saving card to storage:', error);
      throw error;
    }
  }

  /**
   * 删除会员卡
   */
  async deleteCard(cardId: string): Promise<void> {
    try {
      const existingCards = await this.getAllCards();
      const updatedCards = existingCards.filter(c => c.id !== cardId);

      const storedData: StoredCardData = {
        cards: updatedCards,
        lastSyncTime: new Date().toISOString(),
        version: '1.0',
        organizationMapping: {},
        merchantMapping: {}
      };

      await AsyncStorage.setItem(STORAGE_KEYS.MEMBERSHIP_CARDS, JSON.stringify(storedData));
    } catch (error) {
      console.error('Error deleting card from storage:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID获取会员卡
   */
  async getCardsByUserId(userId: string): Promise<MembershipCard[]> {
    const allCards = await this.getAllCards();
    return allCards.filter(card => card.userId === userId);
  }

  /**
   * 根据组织ID获取会员卡
   */
  async getCardsByOrganization(userId: string, organizationId: string): Promise<MembershipCard[]> {
    const userCards = await this.getCardsByUserId(userId);
    return userCards.filter(card => card.organizationId === organizationId);
  }

  /**
   * 获取商家会员卡
   */
  async getMerchantCards(userId: string, organizationId?: string): Promise<MembershipCard[]> {
    const userCards = await this.getCardsByUserId(userId);
    let merchantCards = userCards.filter(card => card.cardType === 'merchant');

    if (organizationId) {
      merchantCards = merchantCards.filter(card => card.organizationId === organizationId);
    }

    return merchantCards;
  }

  /**
   * 获取组织会员卡
   */
  async getOrganizationCards(userId: string): Promise<MembershipCard[]> {
    const userCards = await this.getCardsByUserId(userId);
    return userCards.filter(card => card.cardType === 'organization');
  }

  // ==================== QR码处理 ====================

  /**
   * 解析商家QR码
   */
  parseMerchantQR(qrData: string): ParsedMerchantQR {
    try {
      // PomeloX商家QR码格式: pomelox://merchant/{merchantId}?location={locationId}&campaign={campaignId}
      if (!qrData.startsWith('pomelox://merchant/')) {
        return {
          isValid: false,
          isExpired: false,
          error: '无效的QR码格式',
          rawData: qrData
        };
      }

      const url = new URL(qrData);
      const pathParts = url.pathname.split('/');
      const merchantId = pathParts[pathParts.length - 1];

      if (!merchantId) {
        return {
          isValid: false,
          isExpired: false,
          error: '缺少商家ID',
          rawData: qrData
        };
      }

      const locationId = url.searchParams.get('location') || undefined;
      const campaignId = url.searchParams.get('campaign') || undefined;
      const timestampStr = url.searchParams.get('timestamp');

      // 检查时间戳是否过期（如果提供）
      let isExpired = false;
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const expiryTime = timestamp + (24 * 60 * 60 * 1000); // 24小时过期
        isExpired = Date.now() > expiryTime;
      }

      return {
        isValid: true,
        merchantId,
        locationId,
        campaignId,
        isExpired,
        rawData: qrData
      };
    } catch (error) {
      return {
        isValid: false,
        isExpired: false,
        error: '解析QR码失败',
        rawData: qrData
      };
    }
  }

  /**
   * 生成会员卡QR码数据
   */
  generateCardQRData(card: MembershipCard): string {
    // 格式: pomelox://card/{cardType}/{cardId}?number={cardNumber}&org={orgId}
    const baseUrl = `pomelox://card/${card.cardType}/${card.id}`;
    const params = new URLSearchParams({
      number: card.cardNumber,
      org: card.organizationId,
      timestamp: Date.now().toString()
    });

    if (card.merchantId) {
      params.set('merchant', card.merchantId);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // ==================== 数据转换 ====================

  /**
   * 将MembershipCard转换为显示用的CardDisplayInfo
   */
  formatCardForDisplay(
    card: MembershipCard, 
    organization?: Organization, 
    merchant?: Merchant
  ): CardDisplayInfo {
    const isOrgCard = card.cardType === 'organization';
    const displayOrg = organization;
    const displayMerchant = merchant;

    // 构建品牌色彩
    const brandColors = isOrgCard 
      ? (displayOrg?.brandColors || { primary: '#6B7280', secondary: '#F3F4F6' })
      : (displayMerchant?.brandColors || { primary: '#6B7280', secondary: '#F3F4F6' });

    // 构建渐变色
    const gradient = [brandColors.primary, brandColors.secondary];

    // 构建标题和副标题
    const title = isOrgCard 
      ? (displayOrg?.displayNameZh || displayOrg?.name || '组织会员卡')
      : (displayMerchant?.name || '商家会员卡');

    const subtitle = isOrgCard
      ? `会员编号: ${card.cardNumber}`
      : `${displayOrg?.displayNameZh || ''}·${this.getCategoryLabel(displayMerchant?.category || 'retail')}`;

    // 构建分类
    const category = isOrgCard
      ? 'organization'
      : (displayMerchant?.category || 'retail');

    // 检查是否过期
    const isExpired = card.expiresAt ? new Date(card.expiresAt) < new Date() : false;
    const expiryText = card.expiresAt 
      ? `到期时间: ${new Date(card.expiresAt).toLocaleDateString('zh-CN')}`
      : undefined;

    // 构建最后使用时间文本
    const lastUsedText = card.lastUsedAt
      ? `最后使用: ${this.formatRelativeTime(card.lastUsedAt)}`
      : '尚未使用';

    // 构建权益列表
    const benefits = this.getBenefitsList(card, displayOrg, displayMerchant);

    return {
      id: card.id,
      title,
      subtitle,
      logoUrl: isOrgCard ? displayOrg?.logoUrl : displayMerchant?.logoUrl,
      brandColors: {
        ...brandColors,
        gradient
      },
      category,
      categoryLabel: this.getCategoryLabel(category),
      cardNumber: card.cardNumber,
      points: card.points,
      membershipLevel: card.membershipLevel,
      membershipLevelLabel: this.getMembershipLevelLabel(card.membershipLevel),
      isExpired,
      expiryText,
      qrCodeData: card.qrCodeData || this.generateCardQRData(card),
      benefits,
      lastUsedText,
      addedToWallet: !!card.appleWalletPassId || !!card.googleWalletObjectId
    };
  }

  /**
   * 将会员卡列表按组织和类别分组
   */
  groupCards(cards: CardDisplayInfo[]): CardGroupCollection {
    // 分离组织卡和商家卡
    const orgCards = cards.filter(card => card.category === 'organization');
    const merchantCards = cards.filter(card => card.category !== 'organization');

    // 按商家类别分组
    const merchantGroups = {
      dining: merchantCards.filter(card => card.category === 'dining'),
      retail: merchantCards.filter(card => card.category === 'retail'),
      service: merchantCards.filter(card => card.category === 'service'),
      education: merchantCards.filter(card => card.category === 'education'),
      entertainment: merchantCards.filter(card => card.category === 'entertainment'),
      other: merchantCards.filter(card => !['dining', 'retail', 'service', 'education', 'entertainment'].includes(card.category))
    };

    // 获取最近使用的卡片（按最后使用时间排序，取前5个）
    const recentlyUsed = cards
      .filter(card => card.lastUsedText && card.lastUsedText !== '尚未使用')
      .sort((a, b) => {
        // 这里需要根据实际的lastUsedAt字段排序，但我们用模拟逻辑
        return Math.random() - 0.5; // 临时随机排序
      })
      .slice(0, 5);

    // 获取即将过期的卡片
    const expiringSoon = cards.filter(card => {
      if (!card.expiryText) return false;
      // 简单检查是否在30天内过期（实际应该基于真实日期计算）
      return !card.isExpired; // 临时逻辑
    });

    return {
      organizationCards: {
        id: 'organization',
        title: '组织会员卡',
        subtitle: `${orgCards.length}张`,
        cards: orgCards,
        count: orgCards.length,
        icon: 'school-outline',
        color: '#3B82F6'
      },
      merchantCards: {
        dining: {
          id: 'dining',
          title: '餐饮美食',
          cards: merchantGroups.dining,
          count: merchantGroups.dining.length,
          icon: 'restaurant-outline',
          color: '#EF4444'
        },
        retail: {
          id: 'retail',
          title: '零售购物',
          cards: merchantGroups.retail,
          count: merchantGroups.retail.length,
          icon: 'storefront-outline',
          color: '#10B981'
        },
        service: {
          id: 'service',
          title: '生活服务',
          cards: merchantGroups.service,
          count: merchantGroups.service.length,
          icon: 'construct-outline',
          color: '#F59E0B'
        },
        education: {
          id: 'education',
          title: '教育培训',
          cards: merchantGroups.education,
          count: merchantGroups.education.length,
          icon: 'library-outline',
          color: '#8B5CF6'
        },
        entertainment: {
          id: 'entertainment',
          title: '休闲娱乐',
          cards: merchantGroups.entertainment,
          count: merchantGroups.entertainment.length,
          icon: 'game-controller-outline',
          color: '#EC4899'
        },
        other: {
          id: 'other',
          title: '其他',
          cards: merchantGroups.other,
          count: merchantGroups.other.length,
          icon: 'ellipsis-horizontal-outline',
          color: '#6B7280'
        }
      },
      totalCount: cards.length,
      recentlyUsed,
      expiringSoon
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 获取分类标签
   */
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      organization: '组织会员',
      dining: '餐饮美食',
      retail: '零售购物',
      service: '生活服务',
      education: '教育培训',
      entertainment: '休闲娱乐'
    };
    return labels[category] || '其他';
  }

  /**
   * 获取会员等级标签
   */
  private getMembershipLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      basic: '普通会员',
      premium: '高级会员',
      vip: 'VIP会员'
    };
    return labels[level] || '普通会员';
  }

  /**
   * 格式化相对时间
   */
  private formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}周前`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months}个月前`;
    }
  }

  /**
   * 获取权益列表
   */
  private getBenefitsList(
    card: MembershipCard, 
    organization?: Organization, 
    merchant?: Merchant
  ): string[] {
    const benefits: string[] = [];

    if (card.cardType === 'organization') {
      // 组织会员卡权益
      benefits.push('参与专属活动');
      benefits.push('积分奖励机制');
      if (card.membershipLevel === 'premium') {
        benefits.push('优先报名活动');
        benefits.push('专属客服支持');
      }
      if (card.membershipLevel === 'vip') {
        benefits.push('VIP专属活动');
        benefits.push('生日特权');
      }
    } else {
      // 商家会员卡权益
      benefits.push('消费积分');
      if (merchant?.category === 'dining') {
        benefits.push('生日优惠');
        benefits.push('会员折扣');
      } else if (merchant?.category === 'retail') {
        benefits.push('会员价格');
        benefits.push('新品预购');
      }
    }

    return benefits;
  }

  /**
   * 生成唯一的会员卡号
   */
  generateCardNumber(organizationId: string, cardType: 'organization' | 'merchant'): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orgPrefix = organizationId.slice(-4).toUpperCase();
    const typePrefix = cardType === 'organization' ? 'ORG' : 'MER';
    
    return `${orgPrefix}${typePrefix}${timestamp}${random}`;
  }

  /**
   * 创建新的会员卡 (使用Mock API)
   */
  async createMembershipCard(params: {
    userId: string;
    organizationId: string;
    merchantId?: string;
    cardType: 'organization' | 'merchant';
    membershipLevel?: string;
  }): Promise<MembershipCard> {
    try {
      // 直接创建本地会员卡 - 不再使用 MockAPI
      console.log('Creating membership card locally');
      
      // 本地创建逻辑
      const cardNumber = this.generateCardNumber(params.organizationId, params.cardType);
      const qrCodeData = this.generateCardQRData({
        id: '', // 临时ID，会在保存时生成真实ID
        cardNumber,
        ...params
      } as MembershipCard);

      const card: MembershipCard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId: params.userId,
        organizationId: params.organizationId,
        merchantId: params.merchantId,
        cardType: params.cardType,
        cardNumber,
        displayName: params.cardType === 'organization' ? '组织会员卡' : '商家会员卡',
        points: 0,
        membershipLevel: (params.membershipLevel || 'basic') as 'basic' | 'premium' | 'vip',
        qrCodeData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.saveCard(card);
      return card;
    } catch (error) {
      console.error('Error creating membership card:', error);
      
      // 返回错误的会员卡对象
      const errorCard: MembershipCard = {
        id: `error_${Date.now()}`,
        userId: params.userId,
        organizationId: params.organizationId || '',
        merchantId: params.merchantId || '',
        cardType: params.cardType,
        cardNumber: 'ERROR',
        displayName: '创建失败',
        points: 0,
        membershipLevel: 'basic',
        qrCodeData: '',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return errorCard;
    }
  }

  /**
   * 获取商家信息 (返回空 - 不再使用 Mock 数据)
   */
  getMerchantInfo(merchantId: string): Merchant | undefined {
    console.warn('getMerchantInfo: Mock API removed, returning undefined');
    return undefined;
  }

  /**
   * 获取组织信息 (返回空 - 不再使用 Mock 数据)
   */
  getOrganizationInfo(organizationId: string): Organization | undefined {
    console.warn('getOrganizationInfo: Mock API removed, returning undefined');
    return undefined;
  }
}

// ==================== 导出单例实例 ====================

export const membershipCardService = MembershipCardService.getInstance();