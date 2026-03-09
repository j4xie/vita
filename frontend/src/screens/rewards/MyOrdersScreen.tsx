/**
 * MyOrdersScreen - My Orders List
 *
 * Displays user's orders with filter tabs:
 * - All (no filter)
 * - Pending Payment (orderStatus=1)
 * - Pending Receipt (orderStatus=7)
 * - Completed (orderStatus=8)
 *
 * Features:
 * - Pull-to-refresh
 * - Pagination (load more)
 * - Empty state per tab
 * - Cancel order / Confirm receipt actions
 * - Points refresh after confirm receipt
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  getOrderList,
  cancelOrder,
  confirmReceipt,
  getUserPoints,
  getOrderStatusKey,
  getOrderTypeKey,
  Order,
  OrderStatus,
} from '../../services/orderAPI';

// --------------- Constants ---------------

const PAGE_SIZE = 10;

type TabKey = 'all' | '1' | '7' | '8';

interface TabItem {
  key: TabKey;
  labelKey: string;
  defaultLabel: string;
}

const TABS: TabItem[] = [
  { key: 'all', labelKey: 'rewards.order.tab_all', defaultLabel: 'All' },
  { key: '1', labelKey: 'rewards.order.tab_pending_payment', defaultLabel: 'Pending' },
  { key: '7', labelKey: 'rewards.order.tab_pending_receipt', defaultLabel: 'Shipping' },
  { key: '8', labelKey: 'rewards.order.tab_completed', defaultLabel: 'Completed' },
];

const STATUS_COLORS: Record<number, string> = {
  1: '#FF9500', // Pending payment - orange
  2: '#34C759', // Paid - green
  3: '#8E8E93', // Cancelled - gray
  4: '#AF52DE', // Refunded - purple
  5: '#8E8E93', // Closed - gray
  6: '#007AFF', // Pending shipment - blue
  7: '#5856D6', // Pending receipt - indigo
  8: '#34C759', // Received - green
};

const ORDER_TYPE_ICONS: Record<number, string> = {
  1: 'storefront-outline', // Points mall
  2: 'ticket-outline',     // Activity payment
  3: 'diamond-outline',    // Membership
};

// --------------- Helper ---------------

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${min}`;
  } catch {
    return dateStr;
  }
};


const getPriceDisplay = (order: Order): string => {
  if (order.payMode === 2) {
    return `${order.price} pts`;
  }
  return `$${order.price.toFixed(2)}`;
};

// --------------- Order Card Component ---------------

interface OrderCardProps {
  order: Order;
  t: (key: string, opts?: any) => string;
  onCancel: (order: Order) => void;
  onConfirmReceipt: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = React.memo(({ order, t, onCancel, onConfirmReceipt }) => {
  const status = order.orderStatus;
  const statusColor = STATUS_COLORS[status] || '#8E8E93';
  const typeIcon = ORDER_TYPE_ICONS[order.orderType] || 'receipt-outline';

  return (
    <View style={styles.card}>
      {/* Top row: order type + status badge */}
      <View style={styles.cardTopRow}>
        <View style={styles.orderTypeRow}>
          <Ionicons name={typeIcon as any} size={16} color="#636366" />
          <Text style={styles.orderTypeText}>
            {t(getOrderTypeKey(order.orderType))}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(getOrderStatusKey(status))}
          </Text>
        </View>
      </View>

      {/* Order content */}
      <View style={styles.cardContent}>
        <Text style={styles.orderTitle} numberOfLines={2}>
          {order.title || order.orderDesc || `${t('rewards.order.order_number')}: ${order.orderNo}`}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{getPriceDisplay(order)}</Text>
          {order.num > 1 && (
            <Text style={styles.quantityText}>×{order.num}</Text>
          )}
        </View>
      </View>

      {/* Bottom row: order number + time */}
      <View style={styles.cardBottomInfo}>
        <Text style={styles.orderNoText} numberOfLines={1}>
          {t('rewards.order.order_number')}: {order.orderNo}
        </Text>
        <Text style={styles.timeText}>{formatDate(order.createTime)}</Text>
      </View>

      {/* Action buttons */}
      {(status === 1 || status === 7) && (
        <View style={styles.actionRow}>
          {status === 1 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => onCancel(order)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>
                {t('rewards.order.cancel_order')}
              </Text>
            </TouchableOpacity>
          )}
          {status === 7 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => onConfirmReceipt(order)}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>
                {t('rewards.order.confirm_receipt')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

OrderCard.displayName = 'OrderCard';

// --------------- Main Screen ---------------

export const MyOrdersScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // State
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Load orders
  const loadOrders = useCallback(
    async (page: number = 1, isRefresh: boolean = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params: any = {};
        if (activeTab !== 'all') {
          params.orderStatus = activeTab as OrderStatus;
        }

        const list = await getOrderList(params);
        const items = Array.isArray(list) ? list : [];

        // Client-side pagination since API returns all results
        const startIdx = (page - 1) * PAGE_SIZE;
        const pageItems = items.slice(startIdx, startIdx + PAGE_SIZE);

        if (isRefresh || page === 1) {
          setOrders(items.slice(0, PAGE_SIZE));
          setHasMore(items.length > PAGE_SIZE);
        } else {
          setOrders((prev) => [...prev, ...pageItems]);
          setHasMore(startIdx + PAGE_SIZE < items.length);
        }

        setCurrentPage(page);
      } catch (error) {
        console.error('[MyOrders] Load failed:', error);
        if (page === 1) {
          setOrders([]);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeTab],
  );

  // Initial load and reload on tab change
  useEffect(() => {
    setOrders([]);
    setCurrentPage(1);
    setHasMore(true);
    loadOrders(1);
  }, [activeTab, loadOrders]);

  // Handlers
  const handleRefresh = useCallback(() => {
    loadOrders(1, true);
  }, [loadOrders]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadOrders(currentPage + 1);
    }
  }, [loadingMore, hasMore, loading, currentPage, loadOrders]);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  const handleCancelOrder = useCallback(
    (order: Order) => {
      Alert.alert(
        t('rewards.order.cancel_order'),
        t('rewards.order.cancel_order_confirm'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.confirm', 'Confirm'),
            style: 'destructive',
            onPress: async () => {
              try {
                setActionLoading(order.id);
                await cancelOrder(String(order.id));
                Alert.alert('', t('rewards.order.cancel_order_success'));
                loadOrders(1, true);
              } catch (error) {
                Alert.alert('', t('rewards.order.cancel_order_failed'));
              } finally {
                setActionLoading(null);
              }
            },
          },
        ],
      );
    },
    [t, loadOrders],
  );

  const handleConfirmReceipt = useCallback(
    (order: Order) => {
      Alert.alert(
        t('rewards.order.confirm_receipt'),
        t('rewards.order.confirm_receipt_confirm'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.confirm', 'Confirm'),
            onPress: async () => {
              try {
                setActionLoading(order.id);
                await confirmReceipt(String(order.id));
                // Refresh points after confirm receipt
                const points = await getUserPoints();
                Alert.alert('', t('rewards.order.points_refreshed', { points }));
                loadOrders(1, true);
              } catch (error) {
                Alert.alert('', t('rewards.order.confirm_receipt_failed'));
              } finally {
                setActionLoading(null);
              }
            },
          },
        ],
      );
    },
    [t, loadOrders],
  );

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard
        order={item}
        t={t}
        onCancel={handleCancelOrder}
        onConfirmReceipt={handleConfirmReceipt}
      />
    ),
    [t, handleCancelOrder, handleConfirmReceipt],
  );

  const keyExtractor = useCallback((item: Order) => String(item.id), []);

  // Footer loader
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF6B6B" />
      </View>
    );
  }, [loadingMore]);

  // Empty state
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    const isFiltered = activeTab !== 'all';
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyText}>
          {isFiltered
            ? t('rewards.order.no_orders_in_tab')
            : t('rewards.order.no_orders')}
        </Text>
      </View>
    );
  }, [loading, activeTab, t]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('rewards.order.my_orders_title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t(tab.labelKey, tab.defaultLabel)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Order List */}
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B6B"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
      />

      {/* Full-screen loading overlay for initial load */}
      {loading && orders.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>
            {t('common.loading', 'Loading...')}
          </Text>
        </View>
      )}

      {/* Action loading overlay */}
      {actionLoading !== null && (
        <View style={styles.actionOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}
    </View>
  );
};

// --------------- Styles ---------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F2',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF5F2',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#FF6B6B',
    shadowColor: 'rgba(255, 107, 107, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderTypeText: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  quantityText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  cardBottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  orderNoText: {
    fontSize: 11,
    color: '#AEAEB2',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#AEAEB2',
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Footer
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Loading
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F2',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 16,
  },

  // Action overlay
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MyOrdersScreen;
