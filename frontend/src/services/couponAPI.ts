/**
 * 优惠券 API 服务
 *
 * 提供优惠券相关的数据接口
 */

import { getApiUrl } from '../utils/environment';
import { getCurrentToken } from './authAPI';

const getBaseUrl = () => getApiUrl();

export interface Coupon {
  id: number;
  couponId?: number;
  couponName: string; // 优惠券名称
  couponType?: number; // 优惠券类型
  couponTypeName?: string;
  // 后端原始字段
  couponPrice?: number; // 折扣金额（后端）
  couponLimit?: number; // 最低消费（后端）
  couponNo?: string; // 优惠券码（后端）
  couponRules?: string; // 使用规则（后端）
  validEnd?: string; // 有效期结束（后端）
  status?: number; // 状态
  statusName?: string;
  sourceFrom?: number;
  sourceFromName?: string;
  purposeMerchantUserId?: string;
  purposeMerchantName?: string; // 商家名称（后端）
  // 前端兼容别名（由 adaptCoupon 填充）
  discount?: number; // 折扣金额
  discountRate?: number; // 折扣率
  minAmount?: number; // 最低消费金额
  merchantId?: number; // 商家ID
  merchantName?: string; // 商家名称
  validFrom?: string; // 有效期开始
  validTo?: string; // 有效期结束
  code?: string; // 优惠券码
  terms?: string; // 使用条款
  // 其他
  usedTime?: string; // 使用时间
  obtainTime?: string; // 领取时间
  qrCode?: string; // 二维码
  description?: string; // 描述
}

/** 将后端原始字段映射为前端期望的别名字段 */
const adaptCoupon = (raw: any): Coupon => ({
  ...raw,
  discount: raw.couponPrice ?? raw.discount ?? 0,
  minAmount: raw.couponLimit ?? raw.minAmount ?? 0,
  validTo: raw.validEnd ?? raw.validTo ?? '',
  merchantName: raw.purposeMerchantName ?? raw.merchantName ?? '',
  code: raw.couponNo ?? raw.code ?? '',
  terms: raw.couponRules ?? raw.terms ?? '',
});

interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
  rows?: T;
  total?: number;
}

class CouponAPI {
  /**
   * 获取用户优惠券列表
   * GET /app/coupon/userCouponlist
   */
  async getUserCouponList(params?: {
    userId?: number;
    merchantId?: number;
    status?: number; // 1-未使用(CANUSE), -1-已使用(USED), 2-已过期(EXPIRE)
    pageNum?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Coupon[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.userId) queryParams.append('userId', params.userId.toString());
      if (params?.merchantId) queryParams.append('merchantId', params.merchantId.toString());
      if (params?.status !== undefined) queryParams.append('status', params.status.toString());
      if (params?.pageNum) queryParams.append('pageNum', params.pageNum.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

      const queryString = queryParams.toString();
      const url = `${getBaseUrl()}/app/coupon/userCouponlist${queryString ? `?${queryString}` : ''}`;

      console.log('🎫 [CouponAPI] 获取用户优惠券列表:', url);

      const token = await getCurrentToken();
      if (!token) {
        return { code: 401, msg: '未登录', rows: [], total: 0 };
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [CouponAPI] 优惠券列表响应:', {
        code: result.code,
        msg: result.msg,
        count: (result.data?.length || result.rows?.length || 0),
      });

      // 适配后端字段到前端别名
      const coupons = result.data || result.rows || [];
      const adapted = Array.isArray(coupons) ? coupons.map(adaptCoupon) : [];
      if (adapted.length > 0) {
        console.log('🎫 [CouponAPI] 第一个优惠券字段:', Object.keys(adapted[0]));
        console.log('🎫 [CouponAPI] 适配后 discount:', adapted[0].discount, 'minAmount:', adapted[0].minAmount);
      }
      result.rows = adapted;
      result.data = adapted;

      return result;
    } catch (error) {
      console.error('❌ [CouponAPI] 获取优惠券列表失败:', error);
      throw error;
    }
  }

  /**
   * 核销优惠券
   * POST /app/coupon/writeOff
   */
  async writeOffCoupon(params: {
    couponNo: string;
    merchantId?: number;
    userId?: number;
  }): Promise<ApiResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('couponNo', params.couponNo);
      if (params.merchantId) {
        formData.append('merchantId', params.merchantId.toString());
      }
      if (params.userId) {
        formData.append('userId', params.userId.toString());
      }

      const url = `${getBaseUrl()}/app/coupon/writeOff`;

      console.log('🎫 [CouponAPI] 核销优惠券:', params);

      const token = await getCurrentToken();
      if (!token) {
        return { code: 401, msg: '未登录' };
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [CouponAPI] 核销响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [CouponAPI] 核销优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 获取商家优惠券模板列表（商家端 - 只读）
   * GET /system/coupon/list — 商家角色后端自动筛选
   */
  async getMerchantCouponTemplates(params?: {
    pageNum?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Coupon[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pageNum) queryParams.append('pageNum', params.pageNum.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

      const queryString = queryParams.toString();
      const url = `${getBaseUrl()}/system/coupon/list${queryString ? `?${queryString}` : ''}`;

      console.log('🏪 [CouponAPI] 获取商家优惠券模板:', url);

      const token = await getCurrentToken();
      if (!token) {
        return { code: 401, msg: '未登录', rows: [], total: 0 };
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 403) {
        console.warn('⚠️ [CouponAPI] 商家无权限访问优惠券模板列表 (403)');
        return { code: 403, msg: '暂无权限查看优惠券模板', rows: [], total: 0 };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const coupons = result.data || result.rows || [];
      const adapted = Array.isArray(coupons) ? coupons.map(adaptCoupon) : [];
      result.rows = adapted;
      result.data = adapted;

      console.log('📋 [CouponAPI] 商家优惠券模板响应:', {
        code: result.code,
        count: adapted.length,
        total: result.total,
      });

      return result;
    } catch (error) {
      console.error('❌ [CouponAPI] 获取商家优惠券模板失败:', error);
      return { code: 500, msg: '获取优惠券模板失败', rows: [], total: 0 };
    }
  }

  /**
   * 获取核销记录列表（商家端）
   * POST /app/coupon/verifyList
   */
  async getWriteOffHistory(params?: {
    pageNum?: number;
    pageSize?: number;
  }): Promise<ApiResponse> {
    try {
      const formData = new URLSearchParams();
      if (params?.pageNum) formData.append('pageNum', params.pageNum.toString());
      if (params?.pageSize) formData.append('pageSize', params.pageSize.toString());

      const url = `${getBaseUrl()}/app/coupon/verifyList`;

      console.log('🏪 [CouponAPI] 获取核销记录:', url);

      const token = await getCurrentToken();
      if (!token) {
        return { code: 401, msg: '未登录' };
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [CouponAPI] 核销记录响应:', {
        code: result.code,
        count: (result.data?.length || result.rows?.length || 0),
      });

      return result;
    } catch (error) {
      console.error('❌ [CouponAPI] 获取核销记录失败:', error);
      return { code: 500, msg: '获取核销记录失败' };
    }
  }

  /**
   * 验证券码（核销前检查）— 注意：后端接受 couponNo 但参数名是 userCouponId
   * POST /app/coupon/checkCoupon
   */
  async verifyCouponByCode(couponNo: string): Promise<ApiResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('couponNo', couponNo);

      const url = `${getBaseUrl()}/app/coupon/checkCoupon`;

      console.log('🏪 [CouponAPI] 验证券码:', couponNo);

      const token = await getCurrentToken();
      if (!token) {
        return { code: 401, msg: '未登录' };
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [CouponAPI] 验证券码响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [CouponAPI] 验证券码失败:', error);
      return { code: 500, msg: '验证券码失败' };
    }
  }

  /**
   * 查询用户券的核销记录（通过 userCouponId）
   * POST /app/coupon/checkCoupon — 参数: userCouponId
   */
  async verifyCouponById(userCouponId: number): Promise<ApiResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('userCouponId', userCouponId.toString());

      const url = `${getBaseUrl()}/app/coupon/checkCoupon`;

      const token = await getCurrentToken();
      if (!token) {
        return { code: 401, msg: '未登录' };
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ [CouponAPI] 查询核销记录失败:', error);
      return { code: 500, msg: '查询核销记录失败' };
    }
  }

  /**
   * 查询用户在指定商家可使用的优惠券
   * POST /app/coupon/canUseCouponList
   *
   * 比 getUserCouponList 更精确：后端会根据商家和券规则筛选可用券
   */
  async getCanUseCouponList(params: {
    userId: number;
    purposeMerchantUserId: number;
    pageNum?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Coupon[]>> {
    try {
      const formData = new URLSearchParams();
      formData.append('userId', params.userId.toString());
      formData.append('purposeMerchantUserId', params.purposeMerchantUserId.toString());
      if (params.pageNum) formData.append('pageNum', params.pageNum.toString());
      if (params.pageSize) formData.append('pageSize', params.pageSize.toString());

      const url = `${getBaseUrl()}/app/coupon/canUseCouponList`;

      console.log('🎫 [CouponAPI] 查询商家可用券:', params);

      const token = await getCurrentToken();
      if (!token) {
        return { code: 401, msg: '未登录', rows: [], total: 0 };
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const coupons = result.data || result.rows || [];
      const adapted = Array.isArray(coupons) ? coupons.map(adaptCoupon) : [];
      result.rows = adapted;
      result.data = adapted;

      console.log('📋 [CouponAPI] 商家可用券响应:', {
        code: result.code,
        count: adapted.length,
      });

      return result;
    } catch (error) {
      console.error('❌ [CouponAPI] 查询商家可用券失败:', error);
      return { code: 500, msg: '查询失败', rows: [], total: 0 };
    }
  }

  /**
   * 获取商家的可用优惠券
   * 优先使用 canUseCouponList (更精确)，失败时降级到 getUserCouponList
   */
  async getMerchantCoupons(merchantId: number, userId?: number): Promise<Coupon[]> {
    try {
      // 优先使用精确的商家可用券接口
      if (userId) {
        try {
          const canUseResponse = await this.getCanUseCouponList({
            userId,
            purposeMerchantUserId: merchantId,
          });
          if (canUseResponse.code === 200) {
            const coupons = canUseResponse.data || canUseResponse.rows || [];
            return Array.isArray(coupons) ? coupons : [];
          }
        } catch (e) {
          console.warn('⚠️ [CouponAPI] canUseCouponList 降级到 userCouponlist:', e);
        }
      }

      // 降级：使用通用的用户优惠券列表按商家筛选
      const response = await this.getUserCouponList({
        merchantId,
        userId,
        status: 1, // CANUSE=1 未使用
      });

      if (response.code === 200) {
        const coupons = response.data || response.rows || [];
        return Array.isArray(coupons) ? coupons : [];
      }

      return [];
    } catch (error) {
      console.error('❌ [CouponAPI] 获取商家优惠券失败:', error);
      return [];
    }
  }
}

export const couponAPI = new CouponAPI();
export default couponAPI;
