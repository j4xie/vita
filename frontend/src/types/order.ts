/**
 * Order Type Definitions
 * 订单类型定义
 *
 * 基于后端API: /app/order/*
 */

import { Address } from './address';

/**
 * 支付方式枚举
 */
export enum PaymentMethod {
  /** 支付宝 */
  ALIPAY = '1',
  /** 积分 */
  POINTS = '2',
}

/**
 * 订单类型枚举
 */
export enum OrderType {
  /** 积分商城消费 */
  POINTS_MALL = '1',
  /** 付费活动 */
  PAID_ACTIVITY = '2',
}

/**
 * 订单状态
 */
export enum OrderStatus {
  /** 待发货 */
  PENDING = 1,
  /** 已发货 */
  SHIPPED = 2,
  /** 已完成 */
  COMPLETED = 3,
  /** 已取消 */
  CANCELLED = 4,
}

/**
 * 订单状态文本映射
 */
export const ORDER_STATUS_TEXT = {
  [OrderStatus.PENDING]: { zh: '待发货', en: 'Pending' },
  [OrderStatus.SHIPPED]: { zh: '已发货', en: 'Shipped' },
  [OrderStatus.COMPLETED]: { zh: '已完成', en: 'Completed' },
  [OrderStatus.CANCELLED]: { zh: '已取消', en: 'Cancelled' },
};

/**
 * 订单项（商品信息）
 */
export interface OrderItem {
  /** 商品ID */
  goodsId: number;
  /** 商品名称 */
  goodsName: string;
  /** 商品图片 */
  goodsIcon?: string;
  /** 商品价格（积分） */
  goodsPrice: number;
  /** 购买数量 */
  quantity: number;
}

/**
 * 订单
 */
export interface Order {
  /** 订单ID */
  id: number;
  /** 订单编号 */
  orderNo: string;
  /** 用户ID */
  userId: number;
  /** 用户名 */
  userName?: string;
  /** 订单状态 */
  status: OrderStatus;
  /** 订单总价（积分） */
  totalPrice: number;
  /** 商品信息 */
  goods: OrderItem[];
  /** 收货地址ID */
  addressId: number;
  /** 收货地址详情 */
  address?: Address;
  /** 收货人姓名 */
  receiverName?: string;
  /** 收货人电话 */
  receiverMobile?: string;
  /** 收货地址 */
  receiverAddress?: string;
  /** 物流公司 */
  expressCompany?: string;
  /** 物流单号 */
  expressNo?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime?: string;
  /** 发货时间 */
  shipTime?: string;
  /** 完成时间 */
  completeTime?: string;
  /** 支付宝订单字符串 (用于唤起支付宝收银台) */
  orderString?: string;
  /** 支付宝订单字符串 (备用字段名) */
  orderStr?: string;
}

/**
 * 创建订单请求
 */
export interface CreateOrderRequest {
  /** 商品ID (积分商城) 或 活动ID (付费活动) */
  goodsId: number;
  /** 购买数量 */
  quantity: number;
  /** 商品价格 */
  price: number;
  /** 收货地址ID */
  addressId: number;
  /** 订单类型 */
  orderType: OrderType;
  /** 支付方式 */
  payMode: PaymentMethod;
  /** 备注 */
  remark?: string;
}

/**
 * 订单列表查询参数
 */
export interface OrderListParams {
  /** 订单状态 (可选) */
  status?: OrderStatus;
  /** 页码 */
  pageNum?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 订单列表API响应
 */
export interface OrderListResponse {
  code: number;
  msg: string;
  pageNum: number;
  pageSize: number;
  total: number;
  totalPage: number;
  rows: Order[];
}

/**
 * 订单详情API响应
 */
export interface OrderDetailResponse {
  code: number;
  msg: string;
  data: Order;
}

/**
 * 通用API响应
 */
export interface ApiResponse {
  code: number;
  msg: string;
}
