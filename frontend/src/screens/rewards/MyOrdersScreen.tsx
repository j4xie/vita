import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Order, OrderStatus, ORDER_STATUS_TEXT } from '../../types/order';
import { orderAPI } from '../../services/orderAPI';

/**
 * MyOrdersScreen - 我的订单列表
 *
 * 功能：
 * - 显示订单列表
 * - 状态筛选
 * - 下拉刷新
 * - 查看订单详情
 */
export const MyOrdersScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // 状态管理
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null); // null = 全部

  // 获取订单列表
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await orderAPI.getOrderList({
        status: selectedStatus || undefined,
        pageNum: 1,
        pageSize: 100,
      });
      setOrders(result.orders);
    } catch (error) {
      console.error('获取订单列表失败:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  // 页面聚焦时刷新
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders().finally(() => setRefreshing(false));
  }, [fetchOrders]);

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

  // 渲染订单卡片
  const renderOrderCard = (order: Order) => {
    const statusColor = getStatusColor(order.status);

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
        activeOpacity={0.7}
      >
        {/* 订单号和状态 */}
        <View style={styles.cardHeader}>
          <Text style={styles.orderNo}>
            {t('order.order_no')}: {order.orderNo}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        {/* 商品信息 */}
        {order.goods && order.goods.length > 0 && (
          <View style={styles.goodsSection}>
            {order.goods.map((item, index) => (
              <View key={index} style={styles.goodsRow}>
                <Text style={styles.goodsName} numberOfLines={1}>
                  {item.goodsName}
                </Text>
                <Text style={styles.goodsPrice}>
                  {item.goodsPrice} {t('rewards.menu.points')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 收货信息 */}
        {order.receiverName && (
          <View style={styles.receiverSection}>
            <Ionicons name="location-outline" size={14} color="#666666" />
            <Text style={styles.receiverText} numberOfLines={1}>
              {order.receiverName} {order.receiverMobile}
            </Text>
          </View>
        )}

        {/* 订单总价 */}
        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>{t('order.total')}:</Text>
          <Text style={styles.totalPoints}>{order.totalPrice}</Text>
          <Text style={styles.totalUnit}> {t('rewards.menu.points')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>{t('order.no_orders', '暂无订单')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('order.no_orders_desc', '快去积分商城兑换商品吧')}
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>{t('profile.my_orders')}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 状态筛选器 */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === null && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(null)}
          >
            <Text
              style={[styles.filterText, selectedStatus === null && styles.filterTextActive]}
            >
              {t('order.all_orders', '全部')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedStatus === OrderStatus.PENDING && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(OrderStatus.PENDING)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === OrderStatus.PENDING && styles.filterTextActive,
              ]}
            >
              {getStatusText(OrderStatus.PENDING)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedStatus === OrderStatus.SHIPPED && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(OrderStatus.SHIPPED)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === OrderStatus.SHIPPED && styles.filterTextActive,
              ]}
            >
              {getStatusText(OrderStatus.SHIPPED)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedStatus === OrderStatus.COMPLETED && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(OrderStatus.COMPLETED)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === OrderStatus.COMPLETED && styles.filterTextActive,
              ]}
            >
              {getStatusText(OrderStatus.COMPLETED)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedStatus === OrderStatus.CANCELLED && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(OrderStatus.CANCELLED)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === OrderStatus.CANCELLED && styles.filterTextActive,
              ]}
            >
              {getStatusText(OrderStatus.CANCELLED)}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 订单列表 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : orders.length > 0 ? (
          orders.map(renderOrderCard)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
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

  // 状态筛选器
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },

  filterButtonActive: {
    backgroundColor: '#FF6B6B',
  },

  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  // 滚动区域
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },

  // 订单卡片
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  orderNo: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  goodsSection: {
    marginBottom: 12,
  },

  goodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },

  goodsName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },

  goodsPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  receiverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },

  receiverText: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  totalLabel: {
    fontSize: 13,
    color: '#666666',
  },

  totalPoints: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginLeft: 4,
  },

  totalUnit: {
    fontSize: 13,
    color: '#666666',
  },

  // 空状态
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },

  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});
