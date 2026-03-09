/**
 * Membership API Service
 * 会员等级权益API服务
 *
 * 接入 GET /app/userExLevel/info 接口
 */

import { getCurrentToken } from './authAPI';
import { getApiUrl } from '../utils/environment';

const getBaseUrl = () => getApiUrl();

// ==================== 类型定义 ====================

/** 用户等级权益项 */
export interface UserLevelEquity {
  levelId: number;
  equityId: number;
  equName: string;
  equTag?: string;
  equSort?: number;
  createTime?: string;
  createBy?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

/** 系统用户等级 */
export interface SysUserLevel {
  id: number;
  levelName: string;
  logo?: string;
  memberBenefits?: string;
  equids?: number[];
  isUpgrade?: number;
  limitValue?: number;
  limitType?: number;
  pointRate?: number;
  acquisitionMethodType?: string;
  acquisitionMethod?: string;
  periodOfValidityType?: number;
  validityStartTime?: string;
  validityEndTime?: string;
  validityNum?: number;
  validityType?: number;
  createByUserId?: number;
  createByName?: string;
  updateByName?: string;
  userLevelExEquityList?: UserLevelEquity[];
}

/** 用户等级信息（接口返回） */
export interface UserExLevelInfo {
  id?: number;
  userId?: number;
  levelId?: number;
  validityType?: number;
  status?: number;
  validityStartTime?: string;
  validityEndTime?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
  remark?: string;
  sysUserLevel?: SysUserLevel;
}

// API响应结构
interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
}

// ==================== 辅助函数 ====================

const getHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = await getCurrentToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// ==================== API 函数 ====================

/**
 * 获取用户会员等级信息
 * GET /app/userExLevel/info?userId={userId}
 */
export const getUserExLevelInfo = async (userId: number | string): Promise<UserExLevelInfo | null> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    const url = `${baseUrl}/app/userExLevel/info?userId=${userId}`;

    console.log('[MembershipAPI] 获取会员等级信息:', { userId });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Warn instead of error to avoid LogBox toast visible to users
      console.warn('[MembershipAPI] HTTP错误:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<UserExLevelInfo> = await response.json();
    console.log('[MembershipAPI] 会员等级信息:', result);

    if (result.code === 200 && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.warn('[MembershipAPI] 获取会员等级信息失败');
    throw error;
  }
};

/**
 * 获取所有会员等级列表
 *
 * 后端暂无 App 端 level list 接口（/system/level/list 需要管理端权限）。
 * 先尝试 /app/level/list，失败则使用从数据库同步的静态等级数据。
 * 等后端补充 App 端接口后可移除 fallback。
 */
export const getAllLevels = async (): Promise<SysUserLevel[]> => {
  // 先尝试 API
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();
    const url = `${baseUrl}/app/level/list`;

    console.log('[MembershipAPI] 尝试获取会员等级列表 via API');

    const response = await fetch(url, { method: 'GET', headers });

    if (response.ok) {
      const result: ApiResponse = await response.json();
      if (result.code === 200) {
        let levels: SysUserLevel[] = [];
        if (Array.isArray(result.data)) {
          levels = result.data;
        } else if (result.data?.rows && Array.isArray(result.data.rows)) {
          levels = result.data.rows;
        } else if (result.data && typeof result.data === 'object' && result.data.id) {
          levels = [result.data];
        }
        if (levels.length > 0) {
          console.log('[MembershipAPI] API 返回等级数量:', levels.length);
          return levels as SysUserLevel[];
        }
      }
    }
  } catch (err) {
    console.warn('[MembershipAPI] API 获取失败，使用本地数据:', err);
  }

  // Fallback：使用从数据库同步的静态等级数据
  console.log('[MembershipAPI] 使用本地等级数据 fallback');
  return getLocalLevelData();
};

/**
 * 本地等级数据（从数据库 sys_user_level 同步）
 * 当后端补充 App 端接口后可移除
 */
const getLocalLevelData = (): SysUserLevel[] => [
  {
    id: 4,
    levelName: '蓝卡会员',
    acquisitionMethodType: 'register_get',
    limitValue: 0,
    memberBenefits: undefined,
    userLevelExEquityList: [
      { levelId: 4, equityId: 1, equName: '基础活动报名', equTag: 'TAG_1' },
      { levelId: 4, equityId: 5, equName: '积分商城兑换', equTag: 'TAG_5' },
    ],
  },
  {
    id: 5,
    levelName: '红卡会员',
    acquisitionMethodType: 'buy_get',
    limitValue: 0,
    memberBenefits: '可领商家券+平台券；可积分商城兑换商品',
    userLevelExEquityList: [
      { levelId: 5, equityId: 1, equName: '基础活动报名', equTag: 'TAG_1' },
      { levelId: 5, equityId: 2, equName: '商家优惠券', equTag: 'TAG_2' },
      { levelId: 5, equityId: 3, equName: '平台优惠券', equTag: 'TAG_3' },
      { levelId: 5, equityId: 5, equName: '积分商城兑换', equTag: 'TAG_5' },
    ],
  },
  {
    id: 6,
    levelName: '红黑卡会员',
    acquisitionMethodType: 'grant_get',
    limitValue: 1000,
    memberBenefits: '每月1次"霸王餐"活动；社媒种草任务；开屏广告权益抽选',
    userLevelExEquityList: [
      { levelId: 6, equityId: 1, equName: '基础活动报名', equTag: 'TAG_1' },
      { levelId: 6, equityId: 2, equName: '商家优惠券', equTag: 'TAG_2' },
      { levelId: 6, equityId: 3, equName: '平台优惠券', equTag: 'TAG_3' },
      { levelId: 6, equityId: 4, equName: '霸王餐活动', equTag: 'TAG_4' },
      { levelId: 6, equityId: 5, equName: '积分商城兑换', equTag: 'TAG_5' },
      { levelId: 6, equityId: 6, equName: '种草任务', equTag: 'TAG_6' },
    ],
  },
  {
    id: 7,
    levelName: '黑卡会员',
    acquisitionMethodType: 'grant_get',
    limitValue: undefined,
    memberBenefits: '全部权益 + 专属VIP服务',
    userLevelExEquityList: [
      { levelId: 7, equityId: 1, equName: '基础活动报名', equTag: 'TAG_1' },
      { levelId: 7, equityId: 2, equName: '商家优惠券', equTag: 'TAG_2' },
      { levelId: 7, equityId: 3, equName: '平台优惠券', equTag: 'TAG_3' },
      { levelId: 7, equityId: 4, equName: '霸王餐活动', equTag: 'TAG_4' },
      { levelId: 7, equityId: 5, equName: '积分商城兑换', equTag: 'TAG_5' },
      { levelId: 7, equityId: 6, equName: '种草任务', equTag: 'TAG_6' },
      { levelId: 7, equityId: 7, equName: 'VIP专属服务', equTag: 'TAG_7' },
    ],
  },
];

// ==================== 导出 ====================

const membershipAPI = {
  getUserExLevelInfo,
  getAllLevels,
};

export default membershipAPI;
