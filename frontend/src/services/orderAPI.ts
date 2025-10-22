/**
 * Order API Service
 * 订单API服务
 *
 * 基于后端API文档实现
 */

import { getCurrentToken } from './authAPI';
import { getApiUrl } from '../utils/environment';
import {
  Order,
  OrderStatus,
  CreateOrderRequest,
  OrderListParams,
  OrderListResponse,
  OrderDetailResponse,
  ApiResponse,
  PaymentMethod,
  OrderType,
} from '../types/order';

const getBaseUrl = () => getApiUrl();

class OrderAPI {
  /**
   * 通用请求方法
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 添加认证token
    const token = await getCurrentToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    console.log(`📦 [Order API] ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      console.log(`✅ [Order API] 响应:`, data);

      if (data.code !== 200) {
        throw new Error(data.msg || `API Error ${data.code}`);
      }

      return data;
    } catch (error: any) {
      console.error(`❌ [Order API] 请求失败:`, error);
      throw error;
    }
  }

  /**
   * 创建订单
   * POST /app/order/createOrder
   *
   * @param data 订单数据
   * @returns 订单信息
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const params = new URLSearchParams({
      orderType: data.orderType,          // 订单类型
      payMode: data.payMode,              // 支付方式
      price: data.price.toString(),       // 价格
      addrId: data.addressId.toString(),  // 地址ID
      num: data.quantity.toString(),      // 数量
      goodsId: data.goodsId.toString(),   // 商品ID
      ...(data.remark && { remark: data.remark }),
    });

    console.log('📦 [Order API] 创建订单参数:', {
      orderType: data.orderType,
      payMode: data.payMode,
      paymentMethod: data.payMode === '1' ? '支付宝' : '积分',
    });

    const response = await this.request<OrderDetailResponse>(
      `/app/order/createOrder?${params}`,
      { method: 'POST' }
    );

    return response.data;
  }

  /**
   * 获取订单列表
   * GET /app/order/list
   *
   * @param params 查询参数
   * @returns 订单列表
   */
  async getOrderList(params?: OrderListParams): Promise<{
    orders: Order[];
    total: number;
    pageNum: number;
    pageSize: number;
  }> {
    const queryParams = new URLSearchParams({
      pageNum: (params?.pageNum || 1).toString(),
      pageSize: (params?.pageSize || 10).toString(),
      ...(params?.status && { status: params.status.toString() }),
    });

    const response = await this.request<OrderListResponse>(
      `/app/order/list?${queryParams}`,
      { method: 'GET' }
    );

    return {
      orders: response.rows || [],
      total: response.total || 0,
      pageNum: response.pageNum || 1,
      pageSize: response.pageSize || 10,
    };
  }

  /**
   * 获取订单详情
   * POST /app/order/info
   *
   * @param orderId 订单ID
   * @returns 订单详情
   */
  async getOrderDetail(orderId: number): Promise<Order> {
    const params = new URLSearchParams({
      orderId: orderId.toString(),
    });

    const response = await this.request<OrderDetailResponse>(
      `/app/order/info?${params}`,
      { method: 'POST' }
    );

    return response.data;
  }

  /**
   * 取消订单
   * POST /app/order/cancelOrder
   *
   * @param orderId 订单ID
   */
  async cancelOrder(orderId: number): Promise<ApiResponse> {
    const params = new URLSearchParams({
      orderId: orderId.toString(),
    });

    return this.request<ApiResponse>(
      `/app/order/cancelOrder?${params}`,
      { method: 'POST' }
    );
  }

  /**
   * 确认收货
   * POST /app/order/confirmReceipt
   *
   * @param orderId 订单ID
   */
  async confirmReceipt(orderId: number): Promise<ApiResponse> {
    const params = new URLSearchParams({
      orderId: orderId.toString(),
    });

    return this.request<ApiResponse>(
      `/app/order/confirmReceipt?${params}`,
      { method: 'POST' }
    );
  }

  /**
   * 获取待处理订单数量（用于小红点提示）
   *
   * @returns 待发货订单数量
   */
  async getPendingOrderCount(): Promise<number> {
    try {
      const result = await this.getOrderList({
        status: OrderStatus.PENDING,
        pageNum: 1,
        pageSize: 100, // 获取所有待发货订单
      });

      return result.total;
    } catch (error) {
      console.error('获取待处理订单数量失败:', error);
      return 0;
    }
  }
}

export const orderAPI = new OrderAPI();
