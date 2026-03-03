import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import { useUser } from '../../context/UserContext';
import { createOrder, getOrderList, cancelOrder } from '../../services/orderAPI';
import { Address, getDefaultAddress } from '../../services/addressAPI';
import { useStripePayment } from '../../hooks/useStripePayment';
import { OrderItem, productToOrderItem } from '../../types/order';
import pomeloXAPI from '../../services/PomeloXAPI';

/**
 * 订单确认页面 (通用版)
 * 支持三种订单类型：
 * 1. 积分商城 (orderType=1) — 积分兑换/支付宝/Stripe
 * 2. 活动付费 (orderType=2) — 支付宝/Stripe
 * 3. 会员购买 (orderType=3) — 支付宝/Stripe
 */
export const OrderConfirmScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { processStripePayment } = useStripePayment();

  // ===== 解析路由参数，支持新旧两种格式 =====
  const orderItem: OrderItem | null = useMemo(() => {
    if (route.params?.orderItem) {
      return route.params.orderItem as OrderItem;
    }
    // 向后兼容：旧版 product 参数自动转换
    if (route.params?.product) {
      const quantity = route.params?.quantity || 1;
      return productToOrderItem(route.params.product, quantity);
    }
    return null;
  }, [route.params]);

  const quantity = orderItem?.quantity || 1;
  const routeSelectedAddress = route.params?.selectedAddress as Address | undefined;

  // PVSA flow data (passed through to PaymentResult)
  const pvsaFormData = route.params?.pvsaFormData as Record<string, string> | undefined;
  const pvsaActivityId = route.params?.pvsaActivityId as number | undefined;
  const preselectedPayment = route.params?.preselectedPayment as 'stripe' | 'alipay' | undefined;

  // Detect if we're in RootStack (OrderConfirmGlobal) to use correct PaymentResult screen name
  const paymentResultScreenName = route.name === 'OrderConfirmGlobal' ? 'PaymentResultGlobal' : 'PaymentResult';

  // 是否为积分商城订单
  const isPointsMall = orderItem?.orderType === '1';
  // 是否为活动或会员订单（只支持金额支付）
  const isMoneyOnly = orderItem?.orderType === '2' || orderItem?.orderType === '3';

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'points' | 'alipay' | 'stripe'>(
    preselectedPayment || (isMoneyOnly ? 'stripe' : 'points')
  );
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // 加载默认地址或使用路由传递的地址（仅积分商城需要）
  const loadAddress = useCallback(async () => {
    if (!isPointsMall) return;
    if (routeSelectedAddress) {
      setSelectedAddress(routeSelectedAddress);
    } else if (!selectedAddress) {
      const defaultAddr = await getDefaultAddress();
      setSelectedAddress(defaultAddr);
    }
  }, [routeSelectedAddress, selectedAddress, isPointsMall]);

  useFocusEffect(
    useCallback(() => {
      loadAddress();
    }, [loadAddress])
  );

  const handleSelectAddress = useCallback(() => {
    Haptics.selectionAsync();
    navigation.navigate('AddressSelect', {
      selectedAddressId: selectedAddress?.id,
    });
  }, [navigation, selectedAddress]);

  // ===== 价格计算 =====
  const totalPoints = isPointsMall ? (orderItem?.pointsPrice || 0) * quantity : 0;
  const totalAmount = orderItem?.price || 0; // 单位：分
  const userPoints = user?.points || 0;
  const hasEnoughPoints = userPoints >= totalPoints;

  // ===== 构建 createOrder 参数 =====
  const buildOrderParams = (payChannel?: '1' | '2') => {
    if (!orderItem) return null;
    // 后端 price 参数统一为"元/美元"（大单位），后端内部转换为 cents/分
    // 支付宝: 人民币元, Stripe: 美元
    let orderPrice: number;
    if (paymentMethod === 'points') {
      orderPrice = totalPoints;
    } else if (payChannel === '1') {
      // 支付宝：优先人民币元，无则用美元价格转换
      orderPrice = orderItem.priceCNY ? orderItem.priceCNY * quantity : totalAmount / 100;
    } else {
      // Stripe：USD cents → 转为美元（后端期望美元，内部再×100给Stripe）
      orderPrice = totalAmount / 100;
    }
    const params: any = {
      orderType: orderItem.orderType,
      payMode: paymentMethod === 'points' ? '2' : '1',
      price: String(orderPrice),
      addrId: selectedAddress ? String(selectedAddress.id) : '0',
      num: String(quantity),
    };
    if (orderItem.goodsId) params.goodsId = orderItem.goodsId;
    if (orderItem.activityId) params.activityId = orderItem.activityId;
    if (payChannel) params.payChannel = payChannel;
    return params;
  };

  /**
   * 创建订单（带重试逻辑）
   * 如果后端返回"报名失败"（用户已报名且有待支付订单），
   * 自动取消旧订单 + 取消报名，然后重试创建
   */
  const createOrderWithRetry = async (params: any) => {
    const response = await createOrder(params);

    // 如果是活动订单且返回"报名失败"，取消旧订单+报名后重试
    if (response.code === 500 && response.msg?.includes('报名失败') && params.activityId && user?.userId) {
      console.log('[OrderConfirm] 报名失败, canceling old orders and enrollment...');
      try {
        // 1. 取消该活动所有待支付订单
        const orders = await getOrderList({ orderType: '2', orderStatus: '1' });
        const pendingOrders = orders.filter(
          (o) => String(o.activityId) === String(params.activityId) && o.orderStatus === 1
        );
        for (const order of pendingOrders) {
          console.log(`[OrderConfirm] Canceling order #${order.id}`);
          await cancelOrder(String(order.id), 'auto_cancel_for_retry');
        }

        // 2. 取消活动报名 (isCancel=true)
        console.log('[OrderConfirm] Canceling enrollment for activity', params.activityId);
        await pomeloXAPI.enrollActivity(Number(params.activityId), user.userId, true);

        // 3. 重试创建订单
        console.log('[OrderConfirm] Retrying createOrder...');
        return await createOrder(params);
      } catch (retryError) {
        console.warn('[OrderConfirm] Retry logic failed:', retryError);
      }
    }

    return response;
  };

  // ===== 支付宝支付 =====
  const handleAlipayPayment = async () => {
    if (!orderItem || !user) return;
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await createOrderWithRetry(buildOrderParams('1')!);

      if (response.code !== 200) {
        Alert.alert(t('common.error'), response.msg || t('rewards.order.create_order_failed'));
        return;
      }

      const orderString = response.data?.orderString;
      const outTradeNo = response.data?.outTradeNo;

      if (orderString) {
        const canOpen = await Linking.canOpenURL(orderString);
        if (canOpen) await Linking.openURL(orderString);

        navigation.replace(paymentResultScreenName, {
          orderId: outTradeNo,
          productName: orderItem.name,
          paymentMethod: 'alipay',
          pvsaFormData,
          pvsaActivityId,
        });
      } else {
        Alert.alert(
          t('rewards.payment.alipay_unavailable'),
          t('rewards.payment.alipay_unavailable_desc')
        );
      }
    } catch (error) {
      console.error('[OrderConfirm] Alipay payment failed:', error);
      Alert.alert(t('common.error'), t('rewards.order.create_order_failed'));
    } finally {
      setLoading(false);
    }
  };

  // ===== Stripe支付 =====
  const handleStripePayment = async () => {
    if (!orderItem || !user) return;
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await createOrderWithRetry(buildOrderParams('2')!);

      if (response.code !== 200) {
        Alert.alert(t('common.error'), response.msg || t('rewards.order.create_order_failed'));
        return;
      }

      const stripeData = response.data?.body;
      const clientSecret = stripeData?.client_secret;

      if (!clientSecret) {
        Alert.alert(
          t('rewards.payment.stripe_unavailable'),
          t('rewards.payment.stripe_unavailable_desc')
        );
        return;
      }

      const paymentIntentId = stripeData?.payment_intent_id;
      const result = await processStripePayment(clientSecret);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace(paymentResultScreenName, {
          orderId: paymentIntentId,
          productName: orderItem.name,
          paymentMethod: 'stripe',
          paymentStatus: 'paid',
          pvsaFormData,
          pvsaActivityId,
        });
      } else if (result.error === 'cancelled') {
        Alert.alert(t('rewards.payment.cancelled'), t('rewards.payment.cancelled_desc'));
      } else {
        Alert.alert(t('common.error'), t('rewards.payment.stripe_failed', { error: result.error }));
      }
    } catch (error: any) {
      console.error('[OrderConfirm] Stripe payment failed:', error?.message || error);
      Alert.alert(t('common.error'), `${t('rewards.order.create_order_failed')}\n\n${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // ===== 积分兑换 =====
  const handlePointsExchange = async () => {
    if (!hasEnoughPoints) {
      Alert.alert(t('rewards.mall.insufficient_points'), t('rewards.mall.insufficient_points_desc'));
      return;
    }
    if (!orderItem || !user) return;
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await createOrderWithRetry(buildOrderParams()!);

      if (response.code === 200) {
        Alert.alert(t('common.success'), t('rewards.order.exchange_success'), [
          { text: t('common.confirm'), onPress: () => navigation.navigate('PointsMallHome') },
        ]);
      } else {
        Alert.alert(t('common.error'), response.msg || t('rewards.order.exchange_failed'));
      }
    } catch (error) {
      console.error('[OrderConfirm] Points exchange failed:', error);
      Alert.alert(t('common.error'), t('rewards.order.exchange_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (paymentMethod === 'stripe') handleStripePayment();
    else if (paymentMethod === 'alipay') handleAlipayPayment();
    else handlePointsExchange();
  };

  // ===== 金额显示 =====
  const getAmountText = () => {
    if (paymentMethod === 'points') {
      return `${totalPoints} ${t('rewards.order.points_unit')}`;
    }
    return `$${(totalAmount / 100).toFixed(2)}`;
  };

  // ===== 商品价格显示 =====
  const getItemPriceText = () => {
    if (isPointsMall) {
      return `${orderItem?.pointsPrice || 0} ${t('rewards.order.points_unit')}`;
    }
    return `$${(totalAmount / 100).toFixed(2)}`;
  };

  if (!orderItem) {
    return (
      <View style={styles.centerContainer}>
        <Text>{t('rewards.order.product_error')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('rewards.order.confirm_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 收货地址 - 仅积分商城显示 */}
        {isPointsMall && (
          <TouchableOpacity style={styles.addressSection} onPress={handleSelectAddress}>
            <View style={styles.addressLeft}>
              <Ionicons name="location-outline" size={20} color="#FF9500" style={styles.addressIcon} />
              {selectedAddress ? (
                <View style={styles.addressInfo}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressName}>{selectedAddress.name}</Text>
                    <Text style={styles.addressPhone}>
                      +{selectedAddress.intAreaCode} {selectedAddress.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                    </Text>
                  </View>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {selectedAddress.address}
                    {selectedAddress.detailAddr ? ` ${selectedAddress.detailAddr}` : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.addressInfo}>
                  <Text style={styles.noAddressText}>{t('rewards.order.add_address')}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        )}

        {/* 商品/活动/会员 信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('rewards.order.product_info')}</Text>
          <View style={styles.productCard}>
            {orderItem.image ? (
              <OptimizedImage
                source={{ uri: orderItem.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons
                  name={orderItem.orderType === '2' ? 'calendar' : orderItem.orderType === '3' ? 'star' : 'gift'}
                  size={32}
                  color="#C7C7CC"
                />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {orderItem.name}
              </Text>
              <Text style={styles.productPrice}>
                {getItemPriceText()}
              </Text>
              <Text style={styles.productQuantity}>
                {t('rewards.order.quantity_label', { count: quantity })}
              </Text>
            </View>
          </View>
        </View>

        {/* 支付方式选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('rewards.order.payment_method')}</Text>

          {/* 积分支付 - 仅积分商城显示 */}
          {isPointsMall && (
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'points' && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod('points')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="star" size={24} color="#FF9500" style={styles.paymentIcon} />
                <View>
                  <Text style={styles.paymentOptionTitle}>{t('rewards.order.points_exchange')}</Text>
                  <Text style={styles.paymentOptionDesc}>
                    {t('rewards.order.current_points', { points: userPoints })}
                  </Text>
                </View>
              </View>
              <View style={[styles.radio, paymentMethod === 'points' && styles.radioSelected]}>
                {paymentMethod === 'points' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          )}

          {/* 支付宝支付 */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'alipay' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('alipay')}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons name="logo-alipay" size={24} color="#1677FF" style={styles.paymentIcon} />
              <View>
                <Text style={styles.paymentOptionTitle}>{t('rewards.order.alipay_payment')}</Text>
                <Text style={styles.paymentOptionDesc}>
                  {orderItem?.priceCNY ? `¥${orderItem.priceCNY * quantity}` : `$${(totalAmount / 100).toFixed(2)}`}
                </Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'alipay' && styles.radioSelected]}>
              {paymentMethod === 'alipay' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {/* Stripe支付（银行卡） */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'stripe' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('stripe')}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons name="card-outline" size={24} color="#635BFF" style={styles.paymentIcon} />
              <View>
                <Text style={styles.paymentOptionTitle}>{t('rewards.order.stripe_payment')}</Text>
                <Text style={styles.paymentOptionDesc}>
                  {t('rewards.order.stripe_payment_desc')}
                </Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'stripe' && styles.radioSelected]}>
              {paymentMethod === 'stripe' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {!hasEnoughPoints && paymentMethod === 'points' && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#FF9500" />
              <Text style={styles.warningText}>
                {t('rewards.order.insufficient_points_warning')}
              </Text>
            </View>
          )}
        </View>

        {/* 订单总计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('rewards.order.order_summary')}</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('rewards.order.product_total')}</Text>
            <Text style={styles.totalValue}>{getAmountText()}</Text>
          </View>
          {orderItem.earnPoints && orderItem.earnPoints > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('rewards.order.earn_points_label')}</Text>
              <Text style={[styles.totalValue, styles.earnPoints]}>
                +{orderItem.earnPoints * quantity}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部确认按钮 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>{t('rewards.order.total')}</Text>
            <Text style={styles.footerPrice}>{getAmountText()}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (loading || (!hasEnoughPoints && paymentMethod === 'points')) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={loading || (!hasEnoughPoints && paymentMethod === 'points')}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {paymentMethod === 'points' ? t('rewards.order.confirm_exchange') : t('rewards.order.go_pay')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginRight: 10,
  },
  addressPhone: {
    fontSize: 13,
    color: '#8E8E93',
  },
  addressText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  noAddressText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#FF9500',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 13,
    color: '#8E8E93',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  paymentOptionSelected: {
    backgroundColor: '#F5F5F7',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    marginRight: 12,
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  paymentOptionDesc: {
    fontSize: 13,
    color: '#8E8E93',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#007AFF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#FF9500',
    marginLeft: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  earnPoints: {
    color: '#34C759',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  confirmButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 22,
    minWidth: 140,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
