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
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme';
import { createOrder, getOrderList, cancelOrder } from '../../services/orderAPI';
import { Address, getDefaultAddress } from '../../services/addressAPI';
import { useStripePayment } from '../../hooks/useStripePayment';
import { OrderItem, productToOrderItem } from '../../types/order';
import pomeloXAPI from '../../services/PomeloXAPI';

export const OrderConfirmScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user, refreshUserInfo } = useUser();
  const { isDarkMode } = useTheme();
  const { processStripePayment } = useStripePayment();

  const orderItem: OrderItem | null = useMemo(() => {
    if (route.params?.orderItem) {
      return route.params.orderItem as OrderItem;
    }
    if (route.params?.product) {
      const quantity = route.params?.quantity || 1;
      return productToOrderItem(route.params.product, quantity);
    }
    return null;
  }, [route.params]);

  const quantity = orderItem?.quantity || 1;
  const routeSelectedAddress = route.params?.selectedAddress as Address | undefined;

  const pvsaFormData = route.params?.pvsaFormData as Record<string, string> | undefined;
  const pvsaActivityId = route.params?.pvsaActivityId as number | undefined;
  const preselectedPayment = route.params?.preselectedPayment as 'stripe' | 'alipay' | undefined;

  const paymentResultScreenName = route.name === 'OrderConfirmGlobal' ? 'PaymentResultGlobal' : 'PaymentResult';

  const isPointsMall = orderItem?.orderType === '1';
  const isMoneyOnly = orderItem?.orderType === '2' || orderItem?.orderType === '3';

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'points' | 'alipay' | 'stripe'>(
    preselectedPayment || (isMoneyOnly ? 'stripe' : 'points')
  );
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

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

  const totalPoints = isPointsMall ? (orderItem?.pointsPrice || 0) * quantity : 0;
  const totalAmount = orderItem?.price || 0;
  const userPoints = user?.points || 0;
  const hasEnoughPoints = userPoints >= totalPoints;

  const buildOrderParams = (payChannel?: '1' | '2') => {
    if (!orderItem) return null;
    let orderPrice: number;
    if (paymentMethod === 'points') {
      orderPrice = totalPoints;
    } else if (payChannel === '1') {
      orderPrice = orderItem.priceCNY ? orderItem.priceCNY * quantity : totalAmount / 100;
    } else {
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

  const createOrderWithRetry = async (params: any) => {
    const response = await createOrder(params);

    if (response.code === 500 && response.msg?.includes('报名失败') && params.activityId && user?.userId) {
      try {
        const orders = await getOrderList({ orderType: '2', orderStatus: '1' });
        const pendingOrders = orders.filter(
          (o) => String(o.activityId) === String(params.activityId) && o.orderStatus === 1
        );
        for (const order of pendingOrders) {
          await cancelOrder(String(order.id), 'auto_cancel_for_retry');
        }
        await pomeloXAPI.enrollActivity(Number(params.activityId), Number(user.userId), true);
        return await createOrder(params);
      } catch (retryError) {
        console.warn('[OrderConfirm] Retry logic failed:', retryError);
      }
    }

    return response;
  };

  const handleAlipayPayment = async () => {
    if (!orderItem || !user) return;
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const orderParams = buildOrderParams('1');
      if (!orderParams) return;
      const response = await createOrderWithRetry(orderParams);

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

  const handleStripePayment = async () => {
    if (!orderItem || !user) return;
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const orderParams = buildOrderParams('2');
      if (!orderParams) return;
      const response = await createOrderWithRetry(orderParams);

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
        refreshUserInfo().catch((e) =>
          console.warn('[OrderConfirm] Failed to refresh user info:', e)
        );
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

  const getAmountText = () => {
    if (paymentMethod === 'points') {
      return `${totalPoints} ${t('rewards.order.points_unit')}`;
    }
    return `$${(totalAmount / 100).toFixed(2)}`;
  };

  const getItemPriceText = () => {
    if (isPointsMall) {
      return `${orderItem?.pointsPrice || 0} ${t('rewards.order.points_unit')}`;
    }
    return `$${(totalAmount / 100).toFixed(2)}`;
  };

  // Dark mode helper
  const dk = isDarkMode;

  if (!orderItem) {
    return (
      <View style={[styles.centerContainer, dk && styles.containerDark]}>
        <Text style={dk ? { color: '#fff' } : undefined}>{t('rewards.order.product_error')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, dk && styles.containerDark, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, dk && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={dk ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dk && styles.textWhite]}>{t('rewards.order.confirm_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Address section - points mall only */}
        {isPointsMall && (
          <TouchableOpacity
            style={[styles.addressSection, dk && styles.sectionDark]}
            onPress={handleSelectAddress}
          >
            <View style={styles.addressLeft}>
              <Ionicons name="location-outline" size={20} color="#FF9500" style={styles.addressIcon} />
              {selectedAddress ? (
                <View style={styles.addressInfo}>
                  <View style={styles.addressHeader}>
                    <Text style={[styles.addressName, dk && styles.textWhite]}>{selectedAddress.name}</Text>
                    <Text style={[styles.addressPhone, dk && styles.textSecondaryDark]}>
                      +{selectedAddress.intAreaCode} {selectedAddress.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                    </Text>
                  </View>
                  <Text style={[styles.addressText, dk && styles.textSecondaryDark]} numberOfLines={2}>
                    {selectedAddress.address}
                    {selectedAddress.detailAddr ? ` ${selectedAddress.detailAddr}` : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.addressInfo}>
                  <Text style={[styles.noAddressText, dk && styles.textSecondaryDark]}>
                    {t('rewards.order.add_address')}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={dk ? '#48484A' : '#C7C7CC'} />
          </TouchableOpacity>
        )}

        {/* Product info */}
        <View style={[styles.section, dk && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, dk && styles.textWhite]}>{t('rewards.order.product_info')}</Text>
          <View style={styles.productCard}>
            {orderItem.image ? (
              <OptimizedImage
                source={{ uri: orderItem.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder, dk && { backgroundColor: '#2C2C2E' }]}>
                <Ionicons
                  name={orderItem.orderType === '2' ? 'calendar' : orderItem.orderType === '3' ? 'star' : 'gift'}
                  size={32}
                  color={dk ? '#48484A' : '#C7C7CC'}
                />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={[styles.productName, dk && styles.textWhite]} numberOfLines={2}>
                {orderItem.name}
              </Text>
              <Text style={styles.productPrice}>
                {getItemPriceText()}
              </Text>
              <Text style={[styles.productQuantity, dk && styles.textSecondaryDark]}>
                {t('rewards.order.quantity_label', { count: quantity })}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment method */}
        <View style={[styles.section, dk && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, dk && styles.textWhite]}>{t('rewards.order.payment_method')}</Text>

          {/* Points - only for points mall */}
          {isPointsMall && (
            <TouchableOpacity
              style={[
                styles.paymentOption,
                dk && styles.paymentOptionDark,
                paymentMethod === 'points' && (dk ? styles.paymentOptionSelectedDark : styles.paymentOptionSelected),
              ]}
              onPress={() => setPaymentMethod('points')}
              accessibilityRole="radio"
              accessibilityState={{ checked: paymentMethod === 'points' }}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="star" size={24} color="#FF9500" style={styles.paymentIcon} />
                <View>
                  <Text style={[styles.paymentOptionTitle, dk && styles.textWhite]}>
                    {t('rewards.order.points_exchange')}
                  </Text>
                  <Text style={[styles.paymentOptionDesc, dk && styles.textSecondaryDark]}>
                    {t('rewards.order.current_points', { points: userPoints })}
                  </Text>
                </View>
              </View>
              <View style={[styles.radio, paymentMethod === 'points' && styles.radioSelected]}>
                {paymentMethod === 'points' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          )}

          {/* Alipay */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              dk && styles.paymentOptionDark,
              paymentMethod === 'alipay' && (dk ? styles.paymentOptionSelectedDark : styles.paymentOptionSelected),
            ]}
            onPress={() => setPaymentMethod('alipay')}
            accessibilityRole="radio"
            accessibilityState={{ checked: paymentMethod === 'alipay' }}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons name="logo-alipay" size={24} color="#1677FF" style={styles.paymentIcon} />
              <View>
                <Text style={[styles.paymentOptionTitle, dk && styles.textWhite]}>
                  {t('rewards.order.alipay_payment')}
                </Text>
                <Text style={[styles.paymentOptionDesc, dk && styles.textSecondaryDark]}>
                  {orderItem?.priceCNY
                    ? `¥${orderItem.priceCNY * quantity}`
                    : t('rewards.payment.price_at_checkout', { defaultValue: `$${(totalAmount / 100).toFixed(2)}` })
                  }
                </Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'alipay' && styles.radioSelected]}>
              {paymentMethod === 'alipay' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {/* Stripe */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              dk && styles.paymentOptionDark,
              paymentMethod === 'stripe' && (dk ? styles.paymentOptionSelectedDark : styles.paymentOptionSelected),
            ]}
            onPress={() => setPaymentMethod('stripe')}
            accessibilityRole="radio"
            accessibilityState={{ checked: paymentMethod === 'stripe' }}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons name="card-outline" size={24} color="#635BFF" style={styles.paymentIcon} />
              <View>
                <Text style={[styles.paymentOptionTitle, dk && styles.textWhite]}>
                  {t('rewards.order.stripe_payment')}
                </Text>
                <Text style={[styles.paymentOptionDesc, dk && styles.textSecondaryDark]}>
                  {t('rewards.order.stripe_payment_desc')}
                </Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'stripe' && styles.radioSelected]}>
              {paymentMethod === 'stripe' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {!hasEnoughPoints && paymentMethod === 'points' && (
            <View style={[styles.warningBox, dk && { backgroundColor: 'rgba(255,149,0,0.15)' }]}>
              <Ionicons name="warning" size={16} color="#FF9500" />
              <Text style={styles.warningText}>
                {t('rewards.order.insufficient_points_warning')}
              </Text>
            </View>
          )}
        </View>

        {/* Order summary */}
        <View style={[styles.section, dk && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, dk && styles.textWhite]}>{t('rewards.order.order_summary')}</Text>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, dk && styles.textSecondaryDark]}>{t('rewards.order.product_total')}</Text>
            <Text style={[styles.totalValue, dk && styles.textWhite]}>{getAmountText()}</Text>
          </View>
          {orderItem.earnPoints && orderItem.earnPoints > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, dk && styles.textSecondaryDark]}>{t('rewards.order.earn_points_label')}</Text>
              <Text style={[styles.totalValue, styles.earnPoints]}>
                +{orderItem.earnPoints * quantity}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, dk && styles.footerDark, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerContent}>
          <View>
            <Text style={[styles.footerLabel, dk && styles.textSecondaryDark]}>{t('rewards.order.total')}</Text>
            <Text style={[styles.footerPrice, dk && styles.textWhite]}>{getAmountText()}</Text>
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
  containerDark: {
    backgroundColor: '#000000',
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
  headerDark: {
    backgroundColor: '#000000',
    borderBottomColor: '#38383A',
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
  sectionDark: {
    backgroundColor: '#1C1C1E',
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
    color: theme.colors.primary,
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
  paymentOptionDark: {
    borderBottomColor: '#38383A',
  },
  paymentOptionSelected: {
    backgroundColor: '#FFF7ED',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  paymentOptionSelectedDark: {
    backgroundColor: 'rgba(255,107,53,0.1)',
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
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
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
  footerDark: {
    backgroundColor: '#1C1C1E',
    borderTopColor: '#38383A',
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
    backgroundColor: theme.colors.primary,
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

  // Dark mode text helpers
  textWhite: {
    color: '#FFFFFF',
  },
  textSecondaryDark: {
    color: '#9CA3AF',
  },
});
