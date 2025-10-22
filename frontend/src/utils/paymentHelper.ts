/**
 * Payment Helper
 * 支付辅助工具
 *
 * 处理支付宝等第三方支付集成
 */

import { orderAPI } from '../services/orderAPI';
import { PaymentMethod, OrderType } from '../types/order';
import { Alert, Linking } from 'react-native';

/**
 * 创建支付宝支付订单
 *
 * @param params 支付参数
 * @returns 订单信息
 */
export const createAlipayOrder = async (params: {
  activityId: number;    // 活动ID
  activityName: string;  // 活动名称
  price: number;         // 价格（元）
  addressId?: number;    // 收货地址ID（可选）
}) => {
  try {
    console.log('💳 [Payment] 创建支付宝订单:', params);

    // 创建订单
    const order = await orderAPI.createOrder({
      goodsId: params.activityId,
      quantity: 1,
      price: params.price,
      addressId: params.addressId || 1,  // 付费活动可能不需要地址
      orderType: OrderType.PAID_ACTIVITY,
      payMode: PaymentMethod.ALIPAY,
      remark: `付费活动: ${params.activityName}`,
    });

    console.log('✅ [Payment] 订单创建成功:', order);

    // TODO: 集成支付宝SDK
    // 这里需要根据后端返回的支付宝支付链接或orderString进行跳转
    // 示例代码：
    // if (order.orderString) {
    //   Linking.openURL(order.orderString);
    // }

    return order;
  } catch (error: any) {
    console.error('❌ [Payment] 创建支付宝订单失败:', error);
    throw error;
  }
};

/**
 * 创建积分支付订单（积分商城）
 *
 * @param params 支付参数
 * @returns 订单信息
 */
export const createPointsOrder = async (params: {
  goodsId: number;       // 商品ID
  goodsName: string;     // 商品名称
  pointsPrice: number;   // 积分价格
  addressId: number;     // 收货地址ID
  quantity?: number;     // 数量
}) => {
  try {
    console.log('🎁 [Payment] 创建积分订单:', params);

    const order = await orderAPI.createOrder({
      goodsId: params.goodsId,
      quantity: params.quantity || 1,
      price: params.pointsPrice,
      addressId: params.addressId,
      orderType: OrderType.POINTS_MALL,
      payMode: PaymentMethod.POINTS,
      remark: `积分商城: ${params.goodsName}`,
    });

    console.log('✅ [Payment] 积分订单创建成功:', order);
    return order;
  } catch (error: any) {
    console.error('❌ [Payment] 创建积分订单失败:', error);
    throw error;
  }
};

/**
 * 支付方式显示名称
 */
export const getPaymentMethodName = (payMode: PaymentMethod): string => {
  switch (payMode) {
    case PaymentMethod.ALIPAY:
      return '支付宝';
    case PaymentMethod.POINTS:
      return '积分';
    default:
      return '未知';
  }
};

/**
 * 订单类型显示名称
 */
export const getOrderTypeName = (orderType: OrderType): string => {
  switch (orderType) {
    case OrderType.POINTS_MALL:
      return '积分商城';
    case OrderType.PAID_ACTIVITY:
      return '付费活动';
    default:
      return '未知';
  }
};
