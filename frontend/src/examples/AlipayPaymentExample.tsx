/**
 * Alipay Payment Integration Example
 * 支付宝支付集成示例
 *
 * 此文件展示如何在实际页面中集成支付宝支付功能
 * This file demonstrates how to integrate Alipay payment in real screens
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  createAndPayAlipayOrder,
  isPaymentSuccess,
  getAlipayResultMessage,
  AlipayResult,
} from '../services/alipayService';
import { setupPaymentCallback } from '../utils/paymentCallback';
import { OrderType } from '../types/order';
import { useUser } from '../context/UserContext';

/**
 * 示例1: 付费活动报名 - 完整流程
 *
 * 使用场景: 在活动详情页面添加付费报名按钮
 */
export const PaidActivityRegistrationExample: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  // 示例活动数据
  const activity = {
    id: 123,
    title: '中秋晚会',
    price: 29.99,
  };

  // 步骤1: 设置支付回调监听
  useEffect(() => {
    console.log('🔔 [Payment Example] 设置支付回调监听...');

    const cleanup = setupPaymentCallback(handlePaymentResult);

    // 组件卸载时清理
    return cleanup;
  }, []);

  // 步骤2: 处理支付结果
  const handlePaymentResult = (result: AlipayResult) => {
    console.log('💳 [Payment Example] 收到支付结果:', result);

    const message = getAlipayResultMessage(result.resultStatus);

    if (isPaymentSuccess(result.resultStatus)) {
      // 支付成功
      Alert.alert(
        '支付成功',
        `您已成功报名活动「${activity.title}」`,
        [
          {
            text: '查看我的活动',
            onPress: () => {
              // 跳转到我的活动页面
              navigation.navigate('MyActivities' as never);
            },
          },
          {
            text: '返回首页',
            onPress: () => {
              navigation.navigate('Explore' as never);
            },
          },
        ]
      );
    } else {
      // 支付失败或取消
      Alert.alert('支付未完成', message, [
        {
          text: '重新支付',
          onPress: handlePayment,
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ]);
    }
  };

  // 步骤3: 创建订单并发起支付
  const handlePayment = async () => {
    if (!user) {
      Alert.alert('提示', '请先登录');
      return;
    }

    try {
      setLoading(true);
      console.log('💳 [Payment Example] 开始创建支付宝订单...');

      // 创建订单并唤起支付宝
      const order = await createAndPayAlipayOrder({
        itemId: activity.id,
        itemName: activity.title,
        price: activity.price,
        orderType: OrderType.PAID_ACTIVITY,
      });

      console.log('✅ [Payment Example] 订单创建成功，已唤起支付宝:', {
        orderId: order.id,
        orderNo: order.orderNo,
      });

      // 注意：此时app已经跳转到支付宝，等待用户支付
      // 支付结果会通过URL回调返回到 handlePaymentResult

    } catch (error: any) {
      console.error('❌ [Payment Example] 支付失败:', error);

      Alert.alert(
        '支付失败',
        error.message || '创建订单失败，请稍后重试',
        [{ text: '确定' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* 活动信息 */}
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.price}>¥{activity.price.toFixed(2)}</Text>

        {/* 支付按钮 */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>支付宝支付</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * 示例2: 简化版 - 仅支付按钮
 *
 * 使用场景: 在任何需要支付的地方快速集成
 */
export const SimpleAlipayButton: React.FC<{
  activityId: number;
  activityName: string;
  price: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}> = ({ activityId, activityName, price, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanup = setupPaymentCallback((result) => {
      if (isPaymentSuccess(result.resultStatus)) {
        onSuccess?.();
      } else {
        onError?.(new Error(getAlipayResultMessage(result.resultStatus)));
      }
    });

    return cleanup;
  }, [onSuccess, onError]);

  const handlePay = async () => {
    try {
      setLoading(true);

      await createAndPayAlipayOrder({
        itemId: activityId,
        itemName: activityName,
        price: price,
        orderType: OrderType.PAID_ACTIVITY,
      });
    } catch (error: any) {
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.simpleButton, loading && styles.simpleButtonDisabled]}
      onPress={handlePay}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.simpleButtonText}>¥{price.toFixed(2)} 立即支付</Text>
      )}
    </TouchableOpacity>
  );
};

/**
 * 示例3: 在现有ActivityDetailScreen中集成
 *
 * 只需在现有的ActivityDetailScreen中添加以下代码：
 */
export const IntegrationGuide = `
// 在 ActivityDetailScreen.tsx 中:

import { useEffect } from 'react';
import { createAndPayAlipayOrder, isPaymentSuccess } from '../services/alipayService';
import { setupPaymentCallback } from '../utils/paymentCallback';
import { OrderType } from '../types/order';

// 1. 在组件中添加支付回调监听
useEffect(() => {
  const cleanup = setupPaymentCallback((result) => {
    if (isPaymentSuccess(result.resultStatus)) {
      Alert.alert('支付成功', '您已成功报名活动');
      // 刷新活动状态
      fetchActivityDetail();
    }
  });

  return cleanup;
}, []);

// 2. 添加支付处理函数
const handlePaidRegistration = async () => {
  try {
    setLoading(true);

    await createAndPayAlipayOrder({
      itemId: activity.id,
      itemName: activity.title,
      price: activity.price,
      orderType: OrderType.PAID_ACTIVITY,
    });

    // 支付宝已唤起，等待用户支付
  } catch (error) {
    Alert.alert('支付失败', error.message);
  } finally {
    setLoading(false);
  }
};

// 3. 在UI中添加支付按钮
{activity.isPaid && (
  <TouchableOpacity
    style={styles.payButton}
    onPress={handlePaidRegistration}
  >
    <Text style={styles.payButtonText}>
      ¥{activity.price} 立即支付
    </Text>
  </TouchableOpacity>
)}
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4A054',
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  simpleButton: {
    backgroundColor: '#D4A054',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  simpleButtonDisabled: {
    backgroundColor: '#ccc',
  },
  simpleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaidActivityRegistrationExample;
