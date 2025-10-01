/**
 * Membership Tier Calculator
 * 会员等级计算工具
 */

import { MembershipTier, MembershipInfo } from '../types/pointsMall';

// 等级阈值配置
const TIER_THRESHOLDS = {
  [MembershipTier.BRONZE]: 0,
  [MembershipTier.SILVER]: 1000,
  [MembershipTier.GOLD]: 3000,
  [MembershipTier.DIAMOND]: 6000,
};

// 等级颜色配置
export const TIER_COLORS = {
  [MembershipTier.BRONZE]: {
    gradient: ['#CD7F32', '#B87333'],
    primary: '#CD7F32',
    secondary: '#B87333',
  },
  [MembershipTier.SILVER]: {
    gradient: ['#C0C0C0', '#E8E8E8'],
    primary: '#C0C0C0',
    secondary: '#E8E8E8',
  },
  [MembershipTier.GOLD]: {
    gradient: ['#FFD700', '#FFA500'],
    primary: '#FFD700',
    secondary: '#FFA500',
  },
  [MembershipTier.DIAMOND]: {
    gradient: ['#3D5A80', '#2C4A5B', '#1A3542'], // 深海色三色渐变
    primary: '#3D5A80',
    secondary: '#2C4A5B',
    accent: '#D4AF37', // 金色装饰
  },
};

// 等级名称配置（中文）
export const TIER_NAMES = {
  [MembershipTier.BRONZE]: '青铜会员',
  [MembershipTier.SILVER]: '白银会员',
  [MembershipTier.GOLD]: '黄金会员',
  [MembershipTier.DIAMOND]: '钻石会员',
};

// 等级名称配置（英文）
export const TIER_NAMES_EN = {
  [MembershipTier.BRONZE]: 'Bronze Member',
  [MembershipTier.SILVER]: 'Silver Member',
  [MembershipTier.GOLD]: 'Gold Member',
  [MembershipTier.DIAMOND]: 'Diamond Member',
};

/**
 * 根据积分计算会员等级
 */
export const calculateTier = (points: number): MembershipTier => {
  if (points >= TIER_THRESHOLDS[MembershipTier.DIAMOND]) {
    return MembershipTier.DIAMOND;
  } else if (points >= TIER_THRESHOLDS[MembershipTier.GOLD]) {
    return MembershipTier.GOLD;
  } else if (points >= TIER_THRESHOLDS[MembershipTier.SILVER]) {
    return MembershipTier.SILVER;
  } else {
    return MembershipTier.BRONZE;
  }
};

/**
 * 获取下一等级所需积分
 */
export const getNextTierPoints = (currentPoints: number): number | undefined => {
  const currentTier = calculateTier(currentPoints);

  switch (currentTier) {
    case MembershipTier.BRONZE:
      return TIER_THRESHOLDS[MembershipTier.SILVER] - currentPoints;
    case MembershipTier.SILVER:
      return TIER_THRESHOLDS[MembershipTier.GOLD] - currentPoints;
    case MembershipTier.GOLD:
      return TIER_THRESHOLDS[MembershipTier.DIAMOND] - currentPoints;
    case MembershipTier.DIAMOND:
      return undefined; // 已是最高等级
  }
};

/**
 * 获取等级进度百分比
 */
export const getTierProgress = (currentPoints: number): number => {
  const currentTier = calculateTier(currentPoints);

  if (currentTier === MembershipTier.DIAMOND) {
    return 100;
  }

  const tierKeys = Object.keys(TIER_THRESHOLDS) as MembershipTier[];
  const currentIndex = tierKeys.indexOf(currentTier);
  const nextTier = tierKeys[currentIndex + 1];

  if (!nextTier) return 100;

  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[nextTier];
  const progress = ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return Math.min(Math.max(progress, 0), 100);
};

/**
 * 根据用户信息生成会员信息
 */
export const generateMembershipInfo = (
  user: any,
  points: number = 0
): MembershipInfo => {
  const tier = calculateTier(points);
  const nextTierPoints = getNextTierPoints(points);

  return {
    userId: user.userId?.toString() || user.id?.toString() || '0',
    tier,
    tierName: TIER_NAMES[tier],
    points,
    nextTierPoints,
    joinDate: user.createTime || new Date().toISOString(),
    memberNumber: `PM${String(user.userId || user.id || '0').padStart(8, '0')}`, // PM00000123
    legalName: user.legalName || user.userName || 'User',
    nickName: user.nickName,
  };
};
