/**
 * Order Item Types
 * 通用订单项类型，解耦 OrderConfirmScreen 对 Product 的依赖
 */

import { Product } from './pointsMall';
import { SysUserLevel } from '../services/membershipAPI';

// ==================== 币种相关 ====================

export type CurrencyType = 'USD' | 'CNY' | 'Points';

/** 汇率常量 (USD → CNY) */
export const EXCHANGE_RATE_USD_TO_CNY = 7.25;

/**
 * 格式化价格显示
 * @param amount 金额数值
 * @param currency 币种
 */
export const formatPrice = (amount: number, currency: CurrencyType): string => {
  switch (currency) {
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'CNY':
      return `¥${amount.toFixed(2)}`;
    case 'Points':
      return `${amount}`;
    default:
      return `$${amount.toFixed(2)}`;
  }
};

/**
 * 币种换算
 * @param amount 金额
 * @param from 源币种
 * @param to 目标币种
 */
export const convertCurrency = (amount: number, from: CurrencyType, to: CurrencyType): number => {
  if (from === to) return amount;
  if (from === 'USD' && to === 'CNY') return Math.round(amount * EXCHANGE_RATE_USD_TO_CNY * 100) / 100;
  if (from === 'CNY' && to === 'USD') return Math.round(amount / EXCHANGE_RATE_USD_TO_CNY * 100) / 100;
  return amount;
};

/** 通用订单项 */
export interface OrderItem {
  id: string;
  name: string;
  image?: string;
  price: number;          // 金额（USD cents）或积分数
  priceCNY?: number;      // 人民币金额（元），支付宝支付时使用
  currency?: CurrencyType; // 币种标记
  quantity: number;
  orderType: '1' | '2' | '3';  // 1积分商城 2活动 3会员
  // 积分商城专用
  goodsId?: string;
  pointsPrice?: number;
  earnPoints?: number;
  // 活动专用
  activityId?: string;
  // 会员专用
  levelId?: string;
  levelName?: string;
}

/** 积分商品 → OrderItem */
export const productToOrderItem = (product: Product, quantity: number = 1): OrderItem => ({
  id: String(product.id),
  name: product.name,
  image: product.primaryImage,
  price: product.priceUSD ? Math.round(product.priceUSD * 100) : product.pointsPrice * quantity,
  priceCNY: product.priceCNY || undefined,
  currency: product.priceUSD ? 'USD' : 'Points',
  quantity,
  orderType: '1',
  goodsId: String(product.id),
  pointsPrice: product.pointsPrice,
  earnPoints: product.earnPoints,
});

/** 活动 → OrderItem */
export const activityToOrderItem = (activity: any): OrderItem & { actType?: number } => {
  const priceUSD = activity.price || 0;
  const priceCNY = activity.priceCNY || convertCurrency(priceUSD, 'USD', 'CNY');
  return {
    id: String(activity.id),
    name: activity.title || activity.name || '',
    image: activity.image || activity.coverImage,
    price: Math.round(priceUSD * 100), // 元 → 分 (USD cents)
    priceCNY,
    currency: 'USD',
    quantity: 1,
    orderType: '2',
    activityId: String(activity.id),
    actType: activity.actType,
  };
};

/** 会员等级 → OrderItem */
export const membershipToOrderItem = (level: SysUserLevel): OrderItem => {
  const priceUSD = level.limitValue || 0;
  const priceCNY = convertCurrency(priceUSD, 'USD', 'CNY');
  return {
    id: String(level.id),
    name: level.levelName,
    image: level.logo,
    price: priceUSD ? Math.round(priceUSD * 100) : 0, // 元 → 分 (USD cents)
    priceCNY,
    currency: 'USD',
    quantity: 1,
    orderType: '3',
    levelId: String(level.id),
    levelName: level.levelName,
  };
};

/** PVSA 证书套餐 → OrderItem */
export const pvsaToOrderItem = (
  activityId: number,
  packageType: 'basic' | 'standard' | 'premium',
  activityName?: string,
): OrderItem => {
  const priceUSDCents: Record<string, number> = { basic: 3000, standard: 5000, premium: 8000 };
  const priceCNYYuan: Record<string, number> = { basic: 200, standard: 350, premium: 560 };
  return {
    id: String(activityId),
    name: activityName || 'PVSA Certificate',
    price: priceUSDCents[packageType] || 3000,
    priceCNY: priceCNYYuan[packageType] || 200,
    quantity: 1,
    orderType: '2',
    activityId: String(activityId),
  };
};
