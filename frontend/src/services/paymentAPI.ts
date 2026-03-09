/**
 * 支付 API 服务
 *
 * 提供支付宝支付相关的接口
 */

import { getApiUrl } from '../utils/environment';
import { getCurrentToken } from './authAPI';

const getBaseUrl = () => getApiUrl();

// 订单信息
export interface PaymentOrder {
  orderId: string;
  userId: number;
  productId: string;
  productName: string;
  amount: number; // 金额（分）
  quantity: number;
  totalAmount: number; // 总金额（分）
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  createTime?: string;
  payTime?: string;
}

// 支付宝支付参数
export interface AlipayCreateParams {
  orderId?: string; // 订单ID（如果已创建订单）
  userId: number; // 用户ID
  productId: string; // 商品ID
  productName: string; // 商品名称
  amount: number; // 支付金额（分）
  quantity?: number; // 购买数量，默认1
  returnUrl?: string; // 支付成功返回URL
  notifyUrl?: string; // 支付通知URL
}

// 支付宝支付响应
export interface AlipayCreateResponse {
  orderId: string; // 订单ID
  payUrl: string; // 支付宝支付页面URL
  qrCode?: string; // 支付二维码（如果支持）
  outTradeNo: string; // 商户订单号
}

// 支付状态查询参数
export interface PaymentQueryParams {
  orderId: string; // 订单ID
  userId?: number; // 用户ID
}

// 支付状态响应
export interface PaymentStatusResponse {
  orderId: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  tradeNo?: string; // 支付宝交易号
  payTime?: string; // 支付时间
  amount: number; // 支付金额（分）
}

// API响应结构
interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
}

class PaymentAPI {
  /**
   * 创建支付宝支付订单
   * POST /app/pay/alipay/create
   */
  async createAlipayOrder(params: AlipayCreateParams): Promise<ApiResponse<AlipayCreateResponse>> {
    try {
      const url = `${getBaseUrl()}/app/pay/alipay/create`;

      console.log('💳 [PaymentAPI] 创建支付宝订单:', params);

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [PaymentAPI] 支付订单创建响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [PaymentAPI] 创建支付订单失败:', error);
      throw error;
    }
  }

  /**
   * 查询支付状态
   * GET /app/pay/status
   */
  async queryPaymentStatus(params: PaymentQueryParams): Promise<ApiResponse<PaymentStatusResponse>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('orderId', params.orderId);
      if (params.userId) {
        queryParams.append('userId', params.userId.toString());
      }

      const url = `${getBaseUrl()}/app/pay/status?${queryParams.toString()}`;

      console.log('💳 [PaymentAPI] 查询支付状态:', params);

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
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
      console.log('📋 [PaymentAPI] 支付状态响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [PaymentAPI] 查询支付状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户订单列表
   * GET /app/pay/orders
   */
  async getUserOrders(params: {
    userId: number;
    status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
    pageNum?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaymentOrder[]>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('userId', params.userId.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

      const url = `${getBaseUrl()}/app/pay/orders?${queryParams.toString()}`;

      console.log('💳 [PaymentAPI] 获取用户订单列表:', params);

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
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
      console.log('📋 [PaymentAPI] 订单列表响应:', {
        code: result.code,
        count: result.data?.length || result.rows?.length || 0,
      });

      return result;
    } catch (error) {
      console.error('❌ [PaymentAPI] 获取订单列表失败:', error);
      throw error;
    }
  }

  /**
   * 取消订单
   * POST /app/pay/cancel
   */
  async cancelOrder(params: {
    orderId: string;
    userId: number;
    reason?: string;
  }): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/app/pay/cancel`;

      console.log('💳 [PaymentAPI] 取消订单:', params);

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [PaymentAPI] 取消订单响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [PaymentAPI] 取消订单失败:', error);
      throw error;
    }
  }

  /**
   * 测试支付宝接口连接
   * GET /app/pay/alipay/test
   */
  async testAlipayConnection(): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/app/pay/alipay/test`;

      console.log('💳 [PaymentAPI] 测试支付宝连接');

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
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
      console.log('📋 [PaymentAPI] 测试连接响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [PaymentAPI] 测试连接失败:', error);
      throw error;
    }
  }
}

export const paymentAPI = new PaymentAPI();
export default paymentAPI;
