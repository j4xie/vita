/**
 * MyCouponsScreen - My Coupons List
 *
 * Displays user's coupons with filter tabs:
 * - Unused (status=1 / CANUSE)
 * - Used (status=-1 / USED)
 * - Expired (status=2 / EXPIRE)
 *
 * Features:
 * - Pull-to-refresh
 * - Pagination (load more)
 * - Empty state per tab
 * - Loading state
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { couponAPI, Coupon } from '../../services/couponAPI';

// --------------- Constants ---------------

const PAGE_SIZE = 10;

// 后端枚举: CANUSE(1), USED(-1), EXPIRE(2)
const STATUS_UNUSED = 1;
const STATUS_USED = -1;
const STATUS_EXPIRED = 2;

interface TabItem {
  key: number;
  labelKey: string;
  defaultLabel: string;
}

const TABS: TabItem[] = [
  { key: STATUS_UNUSED, labelKey: 'rewards.coupons.tab_unused', defaultLabel: 'Unused' },
  { key: STATUS_USED, labelKey: 'rewards.coupons.tab_used', defaultLabel: 'Used' },
  { key: STATUS_EXPIRED, labelKey: 'rewards.coupons.tab_expired', defaultLabel: 'Expired' },
];

const STATUS_COLORS: Record<number, string> = {
  [STATUS_UNUSED]: '#34C759',
  [STATUS_USED]: '#8E8E93',
  [STATUS_EXPIRED]: '#FF3B30',
};

const STATUS_LABEL_KEYS: Record<number, { key: string; fallback: string }> = {
  [STATUS_UNUSED]: { key: 'rewards.coupons.status_unused', fallback: 'Unused' },
  [STATUS_USED]: { key: 'rewards.coupons.status_used', fallback: 'Used' },
  [STATUS_EXPIRED]: { key: 'rewards.coupons.status_expired', fallback: 'Expired' },
};

// --------------- Helper ---------------

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
};

// --------------- Coupon Card Component ---------------

// ─── Verify log type (from checkCoupon API) ──────────────────────────────────

interface VerifyLog {
  id?: number;
  userCouponId?: number;
  remark?: string;
  couponName?: string;
  couponNo?: string;
  userId?: number;
  verifyById?: number;
  verifyMerchantName?: string;
  createTime?: string;
  create_time?: string;
}

// ─── Parse points from remark ─────────────────────────────────────────────────

const parsePointsFromRemark = (remark?: string): string | null => {
  if (!remark) return null;
  // "核销成功，获得积分：10" or "核销成功，获得积分：0"
  const match = remark.match(/积分[：:]\s*(\d+\.?\d*)/);
  if (match) {
    const pts = parseFloat(match[1]);
    return pts > 0 ? match[1] : null;
  }
  return null;
};

// ─── Coupon Card ──────────────────────────────────────────────────────────────

interface CouponCardProps {
  coupon: Coupon;
  verifyLog?: VerifyLog | null;
  t: (key: string, opts?: any) => string;
}

const CouponCard: React.FC<CouponCardProps> = React.memo(({ coupon, verifyLog, t }) => {
  const status = coupon.status ?? STATUS_UNUSED;
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS[STATUS_UNUSED];
  const statusLabel = STATUS_LABEL_KEYS[status] ?? STATUS_LABEL_KEYS[STATUS_UNUSED];
  const isInactive = status === STATUS_USED || status === STATUS_EXPIRED;
  const isUsed = status === STATUS_USED;

  // Determine discount display
  const discountDisplay = (() => {
    if (coupon.discount != null && coupon.discount > 0) {
      return `¥${coupon.discount}`;
    }
    if (coupon.discountRate != null && coupon.discountRate > 0) {
      return `${coupon.discountRate}%`;
    }
    return null;
  })();

  const validRange = (() => {
    const from = formatDate(coupon.validFrom);
    const to = formatDate(coupon.validTo);
    if (from && to) return `${from} - ${to}`;
    if (from) return `${t('rewards.coupons.valid_from')} ${from}`;
    if (to) return `${t('rewards.coupons.valid_to')} ${to}`;
    return '';
  })();

  // Write-off info for used coupons
  const verifyTime = verifyLog?.createTime || verifyLog?.create_time;
  const verifyMerchant = verifyLog?.verifyMerchantName;
  const pointsEarned = parsePointsFromRemark(verifyLog?.remark);

  return (
    <View style={[styles.card, isInactive && styles.cardInactive]}>
      {/* Left discount badge */}
      <View style={[styles.cardLeft, { backgroundColor: isInactive ? '#E5E5EA' : '#FFF0ED' }]}>
        {discountDisplay ? (
          <Text
            style={[styles.discountText, { color: isInactive ? '#8E8E93' : '#FF6B6B' }]}
            numberOfLines={1}
          >
            {discountDisplay}
          </Text>
        ) : (
          <Ionicons
            name="ticket-outline"
            size={28}
            color={isInactive ? '#8E8E93' : '#FF6B6B'}
          />
        )}
        {coupon.minAmount != null && coupon.minAmount > 0 && (
          <Text style={[styles.minAmountText, { color: isInactive ? '#AEAEB2' : '#FF8E53' }]}>
            {t('rewards.coupons.min_amount', { amount: coupon.minAmount })}
          </Text>
        )}
      </View>

      {/* Dashed separator */}
      <View style={styles.separator}>
        <View style={[styles.separatorDot, styles.separatorDotTop]} />
        <View style={styles.separatorLine} />
        <View style={[styles.separatorDot, styles.separatorDotBottom]} />
      </View>

      {/* Right info */}
      <View style={styles.cardRight}>
        <View style={styles.cardRightTop}>
          <Text style={[styles.couponName, isInactive && styles.textInactive]} numberOfLines={2}>
            {coupon.couponName}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {t(statusLabel.key, statusLabel.fallback)}
            </Text>
          </View>
        </View>

        {coupon.merchantName ? (
          <Text style={[styles.merchantName, isInactive && styles.textInactive]} numberOfLines={1}>
            {coupon.merchantName}
          </Text>
        ) : null}

        {validRange ? (
          <Text style={styles.validRange} numberOfLines={1}>
            {validRange}
          </Text>
        ) : null}

        {/* Write-off info for used coupons */}
        {isUsed && verifyLog && (
          <View style={styles.verifyInfoRow}>
            {verifyMerchant ? (
              <View style={styles.verifyInfoItem}>
                <Ionicons name="storefront-outline" size={12} color="#636366" />
                <Text style={styles.verifyInfoText} numberOfLines={1}>{verifyMerchant}</Text>
              </View>
            ) : null}
            {verifyTime ? (
              <View style={styles.verifyInfoItem}>
                <Ionicons name="time-outline" size={12} color="#636366" />
                <Text style={styles.verifyInfoText}>{formatDate(verifyTime)}</Text>
              </View>
            ) : null}
            {pointsEarned ? (
              <View style={styles.verifyInfoItem}>
                <Ionicons name="star" size={12} color="#FF9500" />
                <Text style={[styles.verifyInfoText, styles.verifyPointsText]}>
                  +{pointsEarned} {t('rewards.coupons.points', 'pts')}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
});

CouponCard.displayName = 'CouponCard';

// --------------- Main Screen ---------------

export const MyCouponsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const userId = user?.userId ?? (user as any)?.id;

  // State
  const [activeTab, setActiveTab] = useState<number>(STATUS_UNUSED);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [verifyLogs, setVerifyLogs] = useState<Record<number, VerifyLog>>({});

  // Load coupons
  const loadCoupons = useCallback(
    async (page: number = 1, isRefresh: boolean = false) => {
      if (!userId) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await couponAPI.getUserCouponList({
          userId,
          status: activeTab,
          pageNum: page,
          pageSize: PAGE_SIZE,
        });

        if (response.code === 200) {
          const list = response.data || response.rows || [];
          const items = Array.isArray(list) ? list : [];

          if (isRefresh || page === 1) {
            setCoupons(items);
          } else {
            setCoupons((prev) => [...prev, ...items]);
          }

          // Fetch verify logs for used coupons
          if (activeTab === STATUS_USED && items.length > 0) {
            fetchVerifyLogsForItems(items);
          }

          // Determine if there are more pages
          if (items.length === 0) {
            setHasMore(false);
          } else if (response.total != null) {
            setHasMore(page * PAGE_SIZE < response.total);
          } else {
            setHasMore(items.length >= PAGE_SIZE);
          }

          setCurrentPage(page);
        } else {
          console.error('[MyCoupons] API error:', response.msg);
          if (page === 1) {
            setCoupons([]);
          }
          setHasMore(false);
        }
      } catch (error) {
        console.error('[MyCoupons] Load failed:', error);
        if (page === 1) {
          setCoupons([]);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [userId, activeTab],
  );

  // Fetch verify logs for used coupons
  const fetchVerifyLogsForItems = useCallback(async (couponList: Coupon[]) => {
    try {
      const logMap: Record<number, VerifyLog> = {};
      await Promise.all(
        couponList.map(async (coupon) => {
          try {
            const res = await couponAPI.verifyCouponById(coupon.id);
            if (res.code === 200 && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
              logMap[coupon.id] = res.data;
            }
          } catch {
            // Skip individual failures
          }
        })
      );
      setVerifyLogs((prev) => ({ ...prev, ...logMap }));
    } catch (error) {
      console.error('[MyCoupons] Fetch verify logs failed:', error);
    }
  }, []);

  // Initial load and reload on tab change
  useEffect(() => {
    setCoupons([]);
    setCurrentPage(1);
    setHasMore(true);
    setVerifyLogs({});
    loadCoupons(1);
  }, [activeTab, loadCoupons]);

  // Handlers
  const handleRefresh = useCallback(() => {
    loadCoupons(1, true);
  }, [loadCoupons]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadCoupons(currentPage + 1);
    }
  }, [loadingMore, hasMore, loading, currentPage, loadCoupons]);

  const handleTabChange = useCallback((status: number) => {
    setActiveTab(status);
  }, []);

  // Stable ref for verify logs to avoid re-renders on every fetch
  const verifyLogsRef = useRef(verifyLogs);
  verifyLogsRef.current = verifyLogs;

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: Coupon }) => (
      <CouponCard coupon={item} verifyLog={verifyLogsRef.current[item.id]} t={t} />
    ),
    [t],
  );

  const keyExtractor = useCallback((item: Coupon) => String(item.id), []);

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
    const emptyMessages: Record<number, { key: string; fallback: string }> = {
      [STATUS_UNUSED]: {
        key: 'rewards.coupons.empty_unused',
        fallback: 'No unused coupons',
      },
      [STATUS_USED]: {
        key: 'rewards.coupons.empty_used',
        fallback: 'No used coupons',
      },
      [STATUS_EXPIRED]: {
        key: 'rewards.coupons.empty_expired',
        fallback: 'No expired coupons',
      },
    };
    const msg = emptyMessages[activeTab] ?? emptyMessages[STATUS_UNUSED];
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="ticket-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyText}>{t(msg.key, msg.fallback)}</Text>
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
          {t('rewards.coupons.title', 'My Coupons')}
        </Text>
        {/* Spacer to balance the back button */}
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

      {/* Coupon List */}
      <FlatList
        data={coupons}
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
      {loading && coupons.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>
            {t('common.loading', 'Loading...')}
          </Text>
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
    fontSize: 14,
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },

  cardInactive: {
    opacity: 0.7,
  },

  cardLeft: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },

  discountText: {
    fontSize: 24,
    fontWeight: '800',
  },

  minAmountText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },

  // Dashed separator
  separator: {
    width: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  separatorLine: {
    width: 1,
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
    borderStyle: 'dashed',
  },

  separatorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF5F2',
    position: 'absolute',
  },

  separatorDotTop: {
    top: -8,
  },

  separatorDotBottom: {
    bottom: -8,
  },

  // Card right side
  cardRight: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },

  cardRightTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  couponName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },

  textInactive: {
    color: '#8E8E93',
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

  merchantName: {
    fontSize: 13,
    color: '#636366',
    marginBottom: 4,
  },

  validRange: {
    fontSize: 11,
    color: '#AEAEB2',
    marginTop: 2,
  },
  verifyInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  verifyInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifyInfoText: {
    fontSize: 11,
    color: '#636366',
  },
  verifyPointsText: {
    color: '#FF9500',
    fontWeight: '600',
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
});

export default MyCouponsScreen;
