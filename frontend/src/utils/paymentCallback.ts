/**
 * Payment Callback Handler
 * 支付回调处理工具
 *
 * 处理支付宝等第三方支付的回调结果
 */

import { Linking, EmitterSubscription } from 'react-native';
import { AlipayResult } from '../services/alipayService';

/**
 * 支付回调处理函数类型
 */
export type PaymentCallbackHandler = (result: AlipayResult) => void;

/**
 * 设置支付回调监听
 *
 * @param callback 回调处理函数
 * @returns 清理函数
 */
export const setupPaymentCallback = (callback: PaymentCallbackHandler): (() => void) => {
  console.log('🔔 [Payment Callback] 设置支付回调监听...');

  let subscription: EmitterSubscription | null = null;

  const handleURL = ({ url }: { url: string }) => {
    console.log('🔗 [Payment Callback] 收到URL回调:', url);

    // 检查是否是支付宝回调
    if (url.includes('pomelox://') || url.includes('alipay')) {
      const params = parseURLParams(url);
      console.log('📋 [Payment Callback] 解析参数:', params);

      // 转换为AlipayResult格式
      const result: AlipayResult = {
        resultStatus: params.resultStatus || params.result_status || '',
        result: params.result,
        memo: params.memo || params.result_memo,
      };

      console.log('✅ [Payment Callback] 回调结果:', result);
      callback(result);
    }
  };

  // 添加监听器
  subscription = Linking.addEventListener('url', handleURL);

  // 检查是否有pending的URL（app从后台恢复时）
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('🔗 [Payment Callback] 检测到初始URL:', url);
      handleURL({ url });
    }
  });

  // 返回清理函数
  return () => {
    console.log('🧹 [Payment Callback] 清理支付回调监听');
    if (subscription) {
      subscription.remove();
    }
  };
};

/**
 * 解析URL参数
 *
 * @param url URL字符串
 * @returns 参数对象
 */
const parseURLParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};

  try {
    // 提取查询字符串
    let queryString = '';

    if (url.includes('?')) {
      queryString = url.split('?')[1];
    } else if (url.includes('#')) {
      // 有些回调使用hash
      queryString = url.split('#')[1];
    }

    if (!queryString) {
      console.warn('⚠️ [Payment Callback] URL中未找到参数');
      return params;
    }

    // 解析参数
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    console.log('📊 [Payment Callback] 解析出的参数数量:', Object.keys(params).length);
  } catch (error) {
    console.error('❌ [Payment Callback] 解析URL参数失败:', error);
  }

  return params;
};

/**
 * React Hook: 使用支付回调
 *
 * @param callback 回调处理函数
 *
 * 使用示例:
 * ```typescript
 * usePaymentCallback((result) => {
 *   if (result.resultStatus === '9000') {
 *     Alert.alert('支付成功');
 *   }
 * });
 * ```
 */
export const usePaymentCallback = (callback: PaymentCallbackHandler): void => {
  // 这个函数需要在React组件中使用useEffect调用setupPaymentCallback
  // 实际使用时应该这样：
  //
  // import { useEffect } from 'react';
  // import { setupPaymentCallback } from './paymentCallback';
  //
  // useEffect(() => {
  //   const cleanup = setupPaymentCallback(callback);
  //   return cleanup;
  // }, [callback]);
};
