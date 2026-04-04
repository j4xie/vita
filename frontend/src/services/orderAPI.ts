/**
 * Order API Service
 * 订单API服务
 *
 * 支持积分商城消费、活动支付、会员等级支付
 */

import { getCurrentToken } from './authAPI';
import { getApiUrl } from '../utils/environment';

const getBaseUrl = () => getApiUrl();

// ==================== 类型定义 ====================

// 订单类型
export type OrderType = '1' | '2' | '3'; // 1-积分商城消费 2-活动支付 3-会员等级支付

// 支付方式
export type PayMode = '1' | '2' | '3'; // 1-美元 2-积分 3-人民币

// 支付渠道
export type PayChannel = '1' | '2'; // 1-支付宝 2-Stripe

// 订单状态
export type OrderStatus = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
// 1-待支付 2-已支付 3-已取消 4-已退款 5-已关闭 6-待发货 7-待收货 8-已收货

// 创建订单请求参数
export interface CreateOrderParams {
  orderType: OrderType;    // 订单类型
  payMode: PayMode;        // 消费方式
  price: string;           // 订单金额
  addrId: string;          // 地址表id
  num: string;             // 数量
  goodsId?: string;        // 商品id (积分商品时传)
  activityId?: string;     // 活动id (活动支付时传)
  remark?: string;         // 订单备注
  payChannel?: PayChannel; // 支付途径 (payMode=1时传)
}

// 订单列表查询参数
export interface OrderListParams {
  orderNo?: string;        // 订单号
  orderStatus?: OrderStatus; // 订单状态
  orderType?: OrderType;   // 订单类型
}

// 订单信息
export interface Order {
  id: number;
  title?: string;
  orderNo: string;
  orderType: number;
  orderTypeText?: string;
  orderStatus: number;
  orderStatusText?: string;
  payMode: number;
  payModeText?: string;
  price: number;
  goodsId?: number;
  activityId?: number;
  addrId?: number;
  orderDesc?: string;
  num: number;
  receivingName?: string;
  receivingMobile?: string;
  receivingAddress?: string;
  intAreaCode?: string;
  longitude?: string;
  latitude?: string;
  trackingNumber?: string;
  logisticsCompany?: string;
  remark?: string;
  cancelReason?: string;
  payChannel?: number;
  orderStr?: string;
  createById?: number;
  createByName?: string;
  createTime: string;
  payTime?: string;
  refundTime?: string;
  cancelTime?: string;
  currentTime?: string;
  clientSecret?: string;
  paymentIntentId?: string;
}

// API响应结构
interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
}

// Stripe支付响应数据
export interface StripePaymentData {
  payment_intent_id: string;
  client_secret: string;
  status: string;
}

// 支付宝支付响应数据
export interface AlipayPaymentData {
  outTradeNo: string;
  orderString: string;
}

// 创建订单响应（根据payChannel返回不同结构）
export interface CreateOrderResponse {
  msg: string;
  code: number;
  data?: any;
  body?: StripePaymentData;
  outTradeNo?: string;
  orderString?: string;
}

// ==================== 辅助函数 ====================

/**
 * 构建请求头
 */
const getHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const token = await getCurrentToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * 获取订单状态的 i18n 翻译 key
 */
export const getOrderStatusKey = (status: number | string): string => {
  const statusMap: Record<string, string> = {
    '1': 'rewards.order.status_pending_payment',
    '2': 'rewards.order.status_paid',
    '3': 'rewards.order.status_cancelled',
    '4': 'rewards.order.status_refunded',
    '5': 'rewards.order.status_closed',
    '6': 'rewards.order.status_pending_shipment',
    '7': 'rewards.order.status_pending_receipt',
    '8': 'rewards.order.status_received',
  };
  return statusMap[String(status)] || 'rewards.order.status_pending_payment';
};

/**
 * 获取订单类型的 i18n 翻译 key
 */
export const getOrderTypeKey = (type: number | string): string => {
  const typeMap: Record<string, string> = {
    '1': 'rewards.order.order_type_points_mall',
    '2': 'rewards.order.order_type_activity',
    '3': 'rewards.order.order_type_membership',
  };
  return typeMap[String(type)] || 'rewards.order.order_type_points_mall';
};

// ==================== API 函数 ====================

/**
 * 创建订单
 * POST /app/order/createOrder
 *
 * @param params 订单参数
 * @returns 创建结果
 */
export const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResponse> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    // 构建Query参数
    const queryParams = new URLSearchParams();
    queryParams.append('orderType', params.orderType);
    queryParams.append('payMode', params.payMode);
    queryParams.append('price', params.price);
    queryParams.append('addrId', params.addrId);
    queryParams.append('num', params.num);

    if (params.goodsId) {
      queryParams.append('goodsId', params.goodsId);
    }
    if (params.activityId) {
      queryParams.append('activityId', params.activityId);
    }
    if (params.remark) {
      queryParams.append('remark', params.remark);
    }
    if (params.payChannel) {
      queryParams.append('payChannel', params.payChannel);
    }

    const url = `${baseUrl}/app/order/createOrder?${queryParams.toString()}`;

    console.log('[OrderAPI] 创建订单:', {
      url,
      params,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OrderAPI] HTTP错误:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CreateOrderResponse = await response.json();
    console.log('[OrderAPI] 创建订单结果:', result);

    return result;
  } catch (error) {
    console.error('[OrderAPI] 创建订单失败:', error);
    throw error;
  }
};

/**
 * 获取订单列表
 * GET /app/order/list
 *
 * @param params 查询参数
 * @returns 订单列表
 */
export const getOrderList = async (params?: OrderListParams): Promise<Order[]> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    // 构建Query参数
    const queryParams = new URLSearchParams();
    if (params?.orderNo) {
      queryParams.append('orderNo', params.orderNo);
    }
    if (params?.orderStatus) {
      queryParams.append('orderStatus', params.orderStatus);
    }
    if (params?.orderType) {
      queryParams.append('orderType', params.orderType);
    }

    const queryString = queryParams.toString();
    const url = `${baseUrl}/app/order/list${queryString ? '?' + queryString : ''}`;

    console.log('[OrderAPI] 获取订单列表:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('[OrderAPI] 订单列表:', result);

    if (result.code === 200) {
      // 后端返回分页格式：{ rows: [...], total, pageNum, pageSize }
      return result.rows || result.data || [];
    }
    return [];
  } catch (error) {
    console.error('[OrderAPI] 获取订单列表失败:', error);
    throw error;
  }
};

/**
 * 获取订单详情
 * POST /app/order/info
 *
 * @param orderId 订单ID
 * @returns 订单详情
 */
export const getOrderInfo = async (orderId: string): Promise<Order | null> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    const url = `${baseUrl}/app/order/info?orderId=${orderId}`;

    console.log('[OrderAPI] 获取订单详情:', orderId);

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Order> = await response.json();
    console.log('[OrderAPI] 订单详情:', result);

    if (result.code === 200 && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('[OrderAPI] 获取订单详情失败:', error);
    throw error;
  }
};

/**
 * 取消订单
 * POST /app/order/cancelOrder
 *
 * @param orderId 订单ID
 * @param cancelReason 取消原因
 */
export const cancelOrder = async (orderId: string, cancelReason?: string): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    // 构建Query参数
    const queryParams = new URLSearchParams();
    queryParams.append('orderId', orderId);
    if (cancelReason) {
      queryParams.append('cancelReason', cancelReason);
    }

    const url = `${baseUrl}/app/order/cancelOrder?${queryParams.toString()}`;

    console.log('[OrderAPI] 取消订单:', { orderId, cancelReason });

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    console.log('[OrderAPI] 取消订单结果:', result);

    if (result.code !== 200) {
      throw new Error(result.msg || '取消订单失败');
    }
  } catch (error) {
    console.error('[OrderAPI] 取消订单失败:', error);
    throw error;
  }
};

/**
 * 确认收货
 * POST /app/order/confirmReceipt
 *
 * @param orderId 订单ID
 */
export const confirmReceipt = async (orderId: string): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    const url = `${baseUrl}/app/order/confirmReceipt?orderId=${orderId}`;

    console.log('[OrderAPI] 确认收货:', orderId);

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    console.log('[OrderAPI] 确认收货结果:', result);

    if (result.code !== 200) {
      throw new Error(result.msg || '确认收货失败');
    }
  } catch (error) {
    console.error('[OrderAPI] 确认收货失败:', error);
    throw error;
  }
};

/**
 * 查询用户积分（实时）
 * POST /app/user/userPoint
 *
 * @returns 用户当前积分
 */
export const getUserPoints = async (): Promise<number> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    const url = `${baseUrl}/app/user/userPoint`;

    console.log('[OrderAPI] 查询用户积分');

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<number> = await response.json();
    console.log('[OrderAPI] 用户积分:', result);

    if (result.code === 200) {
      // API returns { point: "880" } not { data: 880 }
      const point = (result as any).point ?? result.data;
      return Number(point) || 0;
    }
    return 0;
  } catch (error) {
    console.error('[OrderAPI] 查询用户积分失败:', error);
    return 0;
  }
};

// ==================== 导出 ====================

const orderAPI = {
  createOrder,
  getOrderList,
  getOrderInfo,
  cancelOrder,
  confirmReceipt,
  getUserPoints,
  getOrderStatusKey,
  getOrderTypeKey,
};

export default orderAPI;
