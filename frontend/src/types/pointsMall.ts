/**
 * Points Mall Type Definitions
 * 积分商城类型定义
 */

// 会员等级
export enum MembershipTier {
  BRONZE = 'bronze',     // 青铜: 0-999积分
  SILVER = 'silver',     // 白银: 1000-2999积分
  GOLD = 'gold',         // 黄金: 3000-5999积分
  DIAMOND = 'diamond',   // 钻石: 6000+积分
}

// 会员信息
export interface MembershipInfo {
  userId: string;
  tier: MembershipTier;
  tierName: string;           // 等级名称（中文）
  points: number;             // 当前积分
  nextTierPoints?: number;    // 升级所需积分
  joinDate: string;           // 加入日期
  memberNumber: string;       // 会员编号
  legalName: string;          // 法定姓名
  nickName?: string;          // 英文名
}

// 会员权益
export interface MembershipBenefit {
  id: string;
  icon: string;               // Ionicons图标名
  title: string;
  description?: string;
  available: boolean;         // 当前等级是否可用
}

// 商品类别
export enum ProductCategory {
  ELECTRONICS = 'electronics',    // 电子产品
  LIFESTYLE = 'lifestyle',        // 生活用品
  BOOKS = 'books',               // 图书
  VOUCHERS = 'vouchers',         // 代金券
  COURSES = 'courses',           // 课程
  FOOD = 'food',                 // 食品
}

// 商品状态
export enum ProductStatus {
  AVAILABLE = 'available',       // 可兑换
  OUT_OF_STOCK = 'out_of_stock', // 已兑完
  COMING_SOON = 'coming_soon',   // 即将上线
}

// 订单状态
export enum OrderStatus {
  PENDING = 'pending',           // 待发货
  SHIPPED = 'shipped',           // 已发货
  COMPLETED = 'completed',       // 已完成
  CANCELLED = 'cancelled',       // 已取消
}

// 积分记录类型
export enum PointsTransactionType {
  EARN = 'earn',                 // 赚取
  EXCHANGE = 'exchange',         // 兑换消费
  REFUND = 'refund',             // 退款
  EXPIRE = 'expire',             // 过期
}

// 商品图片
export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
}

// 商品规格（颜色/尺寸等）
export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  stock: number;
  pointsPrice?: number;          // 某些规格可能价格不同
}

// 商品信息
export interface Product {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  category: ProductCategory;
  status: ProductStatus;

  // 价格信息
  pointsPrice: number;           // 积分价格
  marketPrice?: number;          // 市场价（用于显示优惠力度）
  earnPoints?: number;           // 兑换后可额外获得的积分（类似参考图 "Earn 20%"）

  // 库存信息
  stock: number;
  maxExchangePerUser?: number;   // 每人限兑数量

  // 图片和媒体
  images: ProductImage[];
  primaryImage: string;          // 主图URL

  // 规格和变体
  variants?: ProductVariant[];

  // 元数据
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;          // 是否已收藏（前端维护）
  viewCount?: number;            // 浏览次数
  exchangeCount?: number;        // 兑换次数
}

// 购物车项目
export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>; // {color: 'red', size: 'L'}
}

// 兑换订单
export interface ExchangeOrder {
  id: string;
  userId: string;

  // 商品信息
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>;

  // 价格信息
  totalPoints: number;
  earnedPoints?: number;         // 此次兑换获得的额外积分

  // 订单状态
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];

  // 物流信息
  shippingAddress?: {
    recipientName: string;
    phone: string;
    address: string;
    zipCode?: string;
  };
  trackingNumber?: string;

  // 时间信息
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  completedAt?: string;
}

// 积分余额
export interface PointsBalance {
  userId: string;
  totalPoints: number;           // 总积分
  availablePoints: number;       // 可用积分
  frozenPoints: number;          // 冻结积分（订单处理中）
  expiringPoints?: {             // 即将过期积分
    points: number;
    expireDate: string;
  };
}

// 积分记录
export interface PointsTransaction {
  id: string;
  userId: string;
  type: PointsTransactionType;
  points: number;                // 正数为增加，负数为减少
  balance: number;               // 操作后余额
  description: string;           // 记录描述（如"兑换商品XXX"）
  relatedOrderId?: string;       // 关联订单ID
  createdAt: string;
}

// 收藏夹
export interface FavoriteCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  productIds: string[];
  coverImages: string[];         // 封面图（最多4张商品图）
  createdAt: string;
  updatedAt: string;
}

// API响应类型
export interface PointsMallApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// 商品列表响应
export interface ProductListResponse {
  products: Product[];
  total: number;
  pageNum: number;
  pageSize: number;
  hasMore: boolean;
}

// 兑换请求
export interface ExchangeRequest {
  userId: string;
  productId: string;
  quantity: number;
  selectedVariants?: Record<string, string>;
  shippingAddress: ExchangeOrder['shippingAddress'];
}

// 兑换响应
export interface ExchangeResponse {
  order: ExchangeOrder;
  newBalance: PointsBalance;
}
