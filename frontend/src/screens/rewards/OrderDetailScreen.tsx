import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Order, OrderStatus, ORDER_STATUS_TEXT } from '../../types/order';
import { orderAPI } from '../../services/orderAPI';

/**
 * OrderDetailScreen - 订单详情
 *
 * 功能：
 * - 显示订单详细信息
 * - 取消订单
 * - 确认收货
 */
export const OrderDetailScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const orderId: number = route.params?.orderId;

  // 状态管理
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 获取订单详情
  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const orderDetail = await orderAPI.getOrderDetail(orderId);
      setOrder(orderDetail);
    } catch (error) {
      console.error('获取订单详情失败:', error);
      Alert.alert(
        t('common.error'),
        t('order.load_failed', '加载订单详情失败'),
        [
          {
            text: t('common.confirm'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, t, navigation]);

  // 页面聚焦时刷新
  useFocusEffect(
    useCallback(() => {
      fetchOrderDetail();
    }, [fetchOrderDetail])
  );

  // 取消订单
  const handleCancelOrder = useCallback(async () => {
    if (!order) return;

    Alert.alert(
      t('order.cancel_order'),
      t('order.cancel_order_confirm', '确定要取消这个订单吗？'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await orderAPI.cancelOrder(order.id);
              Alert.alert(t('common.success'), t('order.cancel_success'), [
                {
                  text: t('common.confirm'),
                  onPress: () => fetchOrderDetail(),
                },
              ]);
            } catch (error: any) {
              console.error('取消订单失败:', error);
              Alert.alert(t('common.error'), error.message || t('order.cancel_failed'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [order, t, fetchOrderDetail]);

  // 确认收货
  const handleConfirmReceipt = useCallback(async () => {
    if (!order) return;

    Alert.alert(
      t('order.confirm_receipt'),
      t('order.confirm_receipt_desc', '确认已收到商品？'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              setActionLoading(true);
              await orderAPI.confirmReceipt(order.id);
              Alert.alert(t('common.success'), t('order.receipt_success'), [
                {
                  text: t('common.confirm'),
                  onPress: () => fetchOrderDetail(),
                },
              ]);
            } catch (error: any) {
              console.error('确认收货失败:', error);
              Alert.alert(t('common.error'), error.message || t('order.receipt_failed'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [order, t, fetchOrderDetail]);

  // 获取状态文本
  const getStatusText = (status: OrderStatus) => {
    const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
    return ORDER_STATUS_TEXT[status]?.[lang] || '';
  };

  // 获取状态颜色
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return '#FF9500';
      case OrderStatus.SHIPPED:
        return '#007AFF';
      case OrderStatus.COMPLETED:
        return '#34C759';
      case OrderStatus.CANCELLED:
        return '#999999';
      default:
        return '#999999';
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('order.order_detail')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(order.status);
  const canCancel = order.status === OrderStatus.PENDING;
  const canConfirmReceipt = order.status === OrderStatus.SHIPPED;

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('order.order_detail')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (canCancel || canConfirmReceipt ? 100 : 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 订单状态 */}
        <View style={[styles.statusSection, { backgroundColor: statusColor }]}>
          <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
          <Text style={styles.statusTitle}>{getStatusText(order.status)}</Text>
          {order.status === OrderStatus.SHIPPED && order.expressNo && (
            <Text style={styles.statusSubtitle}>
              {t('order.tracking_no')}: {order.expressNo}
            </Text>
          )}
        </View>

        {/* 收货地址 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>{t('order.delivery_address')}</Text>
          </View>
          <View style={styles.addressCard}>
            <Text style={styles.recipientName}>
              {order.receiverName} {order.receiverMobile}
            </Text>
            <Text style={styles.addressText}>{order.receiverAddress}</Text>
          </View>
        </View>

        {/* 商品信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>{t('order.product_info')}</Text>
          </View>
          <View style={styles.goodsCard}>
            {order.goods.map((item, index) => (
              <View key={index} style={styles.goodsRow}>
                <View style={styles.goodsInfo}>
                  <Text style={styles.goodsName}>{item.goodsName}</Text>
                  <Text style={styles.goodsQuantity}>x{item.quantity}</Text>
                </View>
                <Text style={styles.goodsPrice}>
                  {item.goodsPrice} {t('rewards.menu.points')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 订单信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>{t('order.order_info')}</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('order.order_no')}:</Text>
              <Text style={styles.infoValue}>{order.orderNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('order.create_time')}:</Text>
              <Text style={styles.infoValue}>{order.createTime}</Text>
            </View>
            {order.shipTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('order.ship_time')}:</Text>
                <Text style={styles.infoValue}>{order.shipTime}</Text>
              </View>
            )}
            {order.completeTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('order.complete_time')}:</Text>
                <Text style={styles.infoValue}>{order.completeTime}</Text>
              </View>
            )}
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.totalLabel}>{t('order.total_points')}:</Text>
              <Text style={styles.totalValue}>
                {order.totalPrice} {t('rewards.menu.points')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      {(canCancel || canConfirmReceipt) && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
              disabled={actionLoading}
            >
              <Text style={styles.cancelButtonText}>{t('order.cancel_order')}</Text>
            </TouchableOpacity>
          )}
          {canConfirmReceipt && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmReceipt}
              disabled={actionLoading}
            >
              <Text style={styles.confirmButtonText}>{t('order.confirm_receipt')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // 顶部导航栏
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  headerRight: {
    width: 36,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 滚动区域
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // 订单状态区域
  statusSection: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },

  statusSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },

  // 分区
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // 地址卡片
  addressCard: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },

  recipientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  addressText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },

  // 商品卡片
  goodsCard: {
    gap: 12,
  },

  goodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  goodsInfo: {
    flex: 1,
    marginRight: 12,
  },

  goodsName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },

  goodsQuantity: {
    fontSize: 13,
    color: '#999999',
  },

  goodsPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  // 订单信息卡片
  infoCard: {
    gap: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },

  infoValue: {
    fontSize: 14,
    color: '#333333',
  },

  infoDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  // 底部操作栏
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },

  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
