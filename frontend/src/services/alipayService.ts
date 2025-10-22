/**
 * Alipay Payment Service
 * 支付宝支付服务
 *
 * 支持iOS和Android平台的支付宝支付集成
 * 使用支付宝SDK原生模块
 */

import { NativeModules, NativeEventEmitter, Platform, Alert } from 'react-native';
import { orderAPI } from './orderAPI';
import { PaymentMethod, OrderType } from '../types/order';

// 获取原生模块
const { RNAlipay } = NativeModules;

// 创建事件监听器
const alipayEventEmitter = RNAlipay ? new NativeEventEmitter(RNAlipay) : null;

/**
 * 支付结果状态码
 */
export enum AlipayResultStatus {
  /** 支付成功 */
  SUCCESS = '9000',
  /** 订单处理中 */
  PROCESSING = '8000',
  /** 订单支付失败 */
  FAILED = '4000',
  /** 用户取消支付 */
  CANCELLED = '6001',
  /** 网络连接出错 */
  NETWORK_ERROR = '6002',
}

/**
 * 支付结果
 */
export interface AlipayResult {
  resultStatus: string;
  result?: string;
  memo?: string;
}

/**
 * 使用支付宝支付（SDK方式）
 *
 * @param orderStr 支付宝订单字符串
 * @param scheme 应用URL Scheme（默认: pomelox）
 * @returns 支付结果Promise
 */
export const payWithAlipay = async (
  orderStr: string,
  scheme: string = 'pomelox'
): Promise<AlipayResult> => {
  console.log('💳 [Alipay SDK] 准备唤起支付宝...');
  console.log('💳 [Alipay SDK] orderStr:', orderStr.substring(0, 100) + '...');
  console.log('💳 [Alipay SDK] scheme:', scheme);

  if (!RNAlipay) {
    console.error('❌ [Alipay SDK] 原生模块未找到');
    throw new Error('支付宝SDK未正确集成，请检查原生模块配置');
  }

  if (Platform.OS === 'ios') {
    try {
      console.log('📱 [Alipay iOS SDK] 调用原生支付模块...');

      // 调用原生模块
      const result = await RNAlipay.pay(orderStr, scheme);

      console.log('✅ [Alipay iOS SDK] 支付结果:', result);

      // 转换为AlipayResult格式
      return {
        resultStatus: result.resultStatus || '',
        result: result.result,
        memo: result.memo,
      };
    } catch (error: any) {
      console.error('❌ [Alipay iOS SDK] 支付失败:', error);
      throw error;
    }
  } else if (Platform.OS === 'android') {
    // Android: 使用原生模块（需要单独实现）
    console.warn('⚠️ [Alipay Android SDK] Android支付待实现');
    Alert.alert('提示', 'Android支付功能开发中，请使用iOS设备测试');
    throw new Error('Android支付待实现');
  } else {
    throw new Error(`不支持的平台: ${Platform.OS}`);
  }
};

/**
 * 创建支付宝订单并发起支付
 *
 * @param params 订单参数
 * @returns 包含订单信息和支付结果的对象
 */
export const createAndPayAlipayOrder = async (params: {
  /** 活动ID或商品ID */
  itemId: number;
  /** 活动/商品名称 */
  itemName: string;
  /** 价格（元） */
  price: number;
  /** 收货地址ID（可选） */
  addressId?: number;
  /** 订单类型 */
  orderType: OrderType;
  /** 数量（默认1） */
  quantity?: number;
}): Promise<{ order: any; paymentResult: AlipayResult }> => {
  try {
    console.log('📦 [Alipay SDK] 创建支付宝订单...', params);

    // 1. 创建订单
    const order = await orderAPI.createOrder({
      goodsId: params.itemId,
      quantity: params.quantity || 1,
      price: params.price,
      addressId: params.addressId || 1,
      orderType: params.orderType,
      payMode: PaymentMethod.ALIPAY,
      remark: params.itemName,
    });

    console.log('✅ [Alipay SDK] 订单创建成功:', {
      orderId: (order as any).id,
      orderNo: (order as any).orderNo,
    });

    // 2. 获取orderStr
    const orderStr = (order as any).orderString || (order as any).orderStr;

    if (!orderStr) {
      console.error('❌ [Alipay SDK] 后端未返回orderStr:', order);
      throw new Error('未获取到支付宝订单字符串，请联系技术支持');
    }

    console.log('💳 [Alipay SDK] 获取到orderStr，长度:', orderStr.length);

    // 3. 唤起支付宝并等待支付结果
    const paymentResult = await payWithAlipay(orderStr);

    console.log('✅ [Alipay SDK] 支付流程完成:', {
      resultStatus: paymentResult.resultStatus,
      orderId: (order as any).id,
    });

    return { order, paymentResult };
  } catch (error: any) {
    console.error('❌ [Alipay SDK] 创建订单或唤起支付失败:', error);
    throw error;
  }
};

/**
 * 解析支付宝支付结果状态码
 *
 * @param resultStatus 状态码
 * @returns 状态描述
 */
export const getAlipayResultMessage = (resultStatus: string): string => {
  switch (resultStatus) {
    case AlipayResultStatus.SUCCESS:
      return '支付成功';
    case AlipayResultStatus.PROCESSING:
      return '订单处理中';
    case AlipayResultStatus.FAILED:
      return '支付失败';
    case AlipayResultStatus.CANCELLED:
      return '用户取消支付';
    case AlipayResultStatus.NETWORK_ERROR:
      return '网络连接出错';
    default:
      return `未知状态: ${resultStatus}`;
  }
};

/**
 * 检查支付结果是否成功
 *
 * @param resultStatus 状态码
 * @returns 是否成功
 */
export const isPaymentSuccess = (resultStatus: string): boolean => {
  return resultStatus === AlipayResultStatus.SUCCESS;
};

/**
 * 监听支付宝支付结果事件（备用方案）
 *
 * 注意：SDK集成方式下，推荐使用 payWithAlipay() 的Promise返回值
 * 此方法仅作为备用监听方案
 *
 * @param callback 支付结果回调函数
 * @returns 取消监听的函数
 */
export const addPaymentResultListener = (
  callback: (result: AlipayResult) => void
): (() => void) => {
  if (!alipayEventEmitter) {
    console.warn('⚠️ [Alipay SDK] 事件监听器未初始化');
    return () => {};
  }

  console.log('🔔 [Alipay SDK] 添加支付结果监听器...');

  const subscription = alipayEventEmitter.addListener(
    'AlipayPaymentResult',
    (result: any) => {
      console.log('📢 [Alipay SDK] 收到支付结果事件:', result);
      callback({
        resultStatus: result.resultStatus || '',
        result: result.result,
        memo: result.memo,
      });
    }
  );

  // 返回清理函数
  return () => {
    console.log('🧹 [Alipay SDK] 移除支付结果监听器');
    subscription.remove();
  };
};

/**
 * 获取支付宝SDK版本（调试用）
 *
 * @returns SDK版本号
 */
export const getAlipaySDKVersion = async (): Promise<string> => {
  if (!RNAlipay) {
    return '未集成';
  }

  try {
    const version = await RNAlipay.getVersion();
    console.log('ℹ️ [Alipay SDK] SDK版本:', version);
    return version;
  } catch (error) {
    console.error('❌ [Alipay SDK] 获取版本失败:', error);
    return '获取失败';
  }
};
