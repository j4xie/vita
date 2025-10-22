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
  couponName: string; // 优惠券名称
  couponType?: number; // 优惠券类型
  discount?: number; // 折扣金额
  discountRate?: number; // 折扣率
  minAmount?: number; // 最低消费金额
  merchantId?: number; // 商家ID
  merchantName?: string; // 商家名称
  validFrom?: string; // 有效期开始
  validTo?: string; // 有效期结束
  status?: number; // 状态
  usedTime?: string; // 使用时间
  obtainTime?: string; // 领取时间
  code?: string; // 优惠券码
  qrCode?: string; // 二维码
  description?: string; // 描述
  terms?: string; // 使用条款
}

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
    status?: number; // 0-未使用, 1-已使用, 2-已过期
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

      // 打印第一个优惠券的字段
      const coupons = result.data || result.rows || [];
      if (coupons.length > 0) {
        console.log('🎫 [CouponAPI] 第一个优惠券字段:', Object.keys(coupons[0]));
      }

      return result;
    } catch (error) {
      console.error('❌ [CouponAPI] 获取优惠券列表失败:', error);
      throw error;
    }
  }

  /**
   * 核销优惠券
   * POST /app/coupon/writeOff
   * @param couponNo - 优惠券券码
   */
  async writeOffCoupon(couponNo: string): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('couponNo', couponNo);

      const url = `${getBaseUrl()}/app/coupon/writeOff?${queryParams.toString()}`;

      console.log('🎫 [CouponAPI] 核销优惠券:', { couponNo });

      const token = await getCurrentToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
   * 查询优惠券核销状态
   * POST /app/coupon/checkCoupon
   */
  async checkCouponStatus(userCouponId: number): Promise<{
    isVerified: boolean;
    earnedPoints: number;
    remark: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('userCouponId', userCouponId.toString());

      const url = `${getBaseUrl()}/app/coupon/checkCoupon?${queryParams}`;

      console.log('🔍 [CouponAPI] 查询优惠券核销状态:', userCouponId);

      const token = await getCurrentToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      // 解析核销状态
      const isVerified = result.code === 200 && result.data?.remark?.includes('核销成功');
      let earnedPoints = 0;

      // 从remark中提取积分数值，如 "核销成功，获得积分：0.08"
      if (isVerified && result.data?.remark) {
        const match = result.data.remark.match(/获得积分[：:]\s*([\d.]+)/);
        if (match) {
          earnedPoints = parseFloat(match[1]);
        }
      }

      console.log('📋 [CouponAPI] 核销状态:', {
        isVerified,
        earnedPoints,
        remark: result.data?.remark || '',
      });

      return {
        isVerified,
        earnedPoints,
        remark: result.data?.remark || '',
      };
    } catch (error) {
      console.error('❌ [CouponAPI] 查询核销状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取商家的可用优惠券
   */
  async getMerchantCoupons(merchantId: number, userId?: number): Promise<Coupon[]> {
    try {
      const response = await this.getUserCouponList({
        merchantId,
        userId,
        status: 0, // 只获取未使用的
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
