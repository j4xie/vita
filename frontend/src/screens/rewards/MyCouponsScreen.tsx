import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { couponAPI, Coupon } from '../../services/couponAPI';
import { useUser } from '../../context/UserContext';

/**
 * MyCouponsScreen - 我的优惠券列表页面
 *
 * 功能：
 * - 显示用户的优惠券列表
 * - 支持状态筛选（未使用/已使用/已过期）
 * - 支持下拉刷新
 * - 处理空状态
 */
export const MyCouponsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // 调试：打印翻译值
  useEffect(() => {
    console.log('🌍 [MyCoupons] 当前语言:', i18n.language);
    console.log('🌍 [MyCoupons] 翻译测试:', {
      unused: t('rewards.coupons.unused'),
      used: t('rewards.coupons.used'),
      expired: t('rewards.coupons.expired'),
      no_coupons: t('rewards.coupons.no_coupons'),
    });
  }, [i18n.language, t]);

  // 状态管理
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<number>(1); // 1-未使用, 2-已使用, 3-已过期

  // 获取优惠券列表
  const fetchCoupons = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      const response = await couponAPI.getUserCouponList({
        userId: user.userId,
        status: selectedStatus,
        pageNum: 1,
        pageSize: 100,
      });

      if (response.code === 200) {
        const couponList = response.rows || response.data || [];
        setCoupons(Array.isArray(couponList) ? couponList : []);
      } else {
        setCoupons([]);
      }
    } catch (error) {
      console.error('获取优惠券列表失败:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId, selectedStatus]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCoupons().finally(() => setRefreshing(false));
  }, [fetchCoupons]);

  // 渲染优惠券卡片
  const renderCouponCard = (coupon: Coupon) => {
    const isUsed = coupon.status === 2;
    const isExpired = coupon.status === 3;
    const isDisabled = isUsed || isExpired;

    return (
      <View
        key={coupon.id}
        style={[styles.couponCard, isDisabled && styles.couponCardDisabled]}
      >
        <View style={styles.couponLeft}>
          {/* 优惠券金额 */}
          <View style={styles.priceSection}>
            <Text style={[styles.currencySymbol, isDisabled && styles.textDisabled]}>¥</Text>
            <Text style={[styles.priceValue, isDisabled && styles.textDisabled]}>
              {coupon.couponPrice || 0}
            </Text>
          </View>
          {/* 使用条件 */}
          {coupon.couponLimit && coupon.couponLimit > 0 && (
            <Text style={[styles.limitText, isDisabled && styles.textDisabled]}>
              {t('rewards.coupons.min_amount', { amount: coupon.couponLimit })}
            </Text>
          )}
        </View>

        <View style={styles.couponDivider}>
          <View style={styles.dottedLine} />
        </View>

        <View style={styles.couponRight}>
          {/* 优惠券名称 */}
          <Text style={[styles.couponName, isDisabled && styles.textDisabled]} numberOfLines={2}>
            {coupon.couponName}
          </Text>

          {/* 优惠券类型 */}
          <View style={styles.couponMeta}>
            <View style={[styles.typeBadge, isDisabled && styles.typeBadgeDisabled]}>
              <Text style={[styles.typeBadgeText, isDisabled && styles.textDisabled]}>
                {coupon.couponTypeName || t('rewards.coupons.voucher')}
              </Text>
            </View>
            {coupon.sourceFromName && (
              <Text style={[styles.sourceText, isDisabled && styles.textDisabled]}>
                {coupon.sourceFromName}
              </Text>
            )}
          </View>

          {/* 有效期 */}
          {coupon.validFrom && coupon.validEnd && (
            <View style={styles.validityRow}>
              <Ionicons
                name="time-outline"
                size={14}
                color={isDisabled ? '#CCCCCC' : '#999999'}
              />
              <Text style={[styles.validityText, isDisabled && styles.textDisabled]}>
                {t('rewards.coupons.valid_period', {
                  from: coupon.validFrom.split(' ')[0],
                  to: coupon.validEnd.split(' ')[0],
                })}
              </Text>
            </View>
          )}

          {/* 优惠券编号 */}
          {coupon.couponNo && (
            <Text style={[styles.couponNo, isDisabled && styles.textDisabled]}>
              {t('rewards.coupons.coupon_no')}: {coupon.couponNo}
            </Text>
          )}

          {/* 核销按钮 */}
          {!isDisabled && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() =>
                navigation.navigate('CouponQRCode', {
                  userCouponId: coupon.id,
                  coupon,
                })
              }
            >
              <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>
                {t('coupons.verify', '核销')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 状态标识 */}
          {isUsed && (
            <View style={styles.statusOverlay}>
              <Text style={styles.statusText}>{t('rewards.coupons.used')}</Text>
            </View>
          )}
          {isExpired && (
            <View style={styles.statusOverlay}>
              <Text style={styles.statusText}>{t('rewards.coupons.expired')}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ticket-outline" size={80} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>{t('rewards.coupons.no_coupons')}</Text>
      <Text style={styles.emptySubtitle}>{t('rewards.coupons.no_coupons_desc')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('rewards.menu.my_coupons')}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 状态筛选器 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 1 && styles.filterButtonActive]}
          onPress={() => setSelectedStatus(1)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.filterText, selectedStatus === 1 && styles.filterTextActive]}
          >
            {t('rewards.coupons.unused')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 2 && styles.filterButtonActive]}
          onPress={() => setSelectedStatus(2)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.filterText, selectedStatus === 2 && styles.filterTextActive]}
          >
            {t('rewards.coupons.used')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 3 && styles.filterButtonActive]}
          onPress={() => setSelectedStatus(3)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.filterText, selectedStatus === 3 && styles.filterTextActive]}
          >
            {t('rewards.coupons.expired')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 优惠券列表 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : coupons.length > 0 ? (
          coupons.map(renderCouponCard)
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
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

  // 加载状态
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  // 优惠券卡片
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  couponCardDisabled: {
    opacity: 0.6,
  },

  couponLeft: {
    width: 110,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },

  priceSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginTop: 4,
  },

  priceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  limitText: {
    marginTop: 4,
    fontSize: 12,
    color: '#999999',
  },

  couponDivider: {
    width: 1,
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },

  dottedLine: {
    width: 1,
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    borderStyle: 'dashed',
  },

  couponRight: {
    flex: 1,
    padding: 16,
    position: 'relative',
  },

  couponName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  couponMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FFE5E5',
  },

  typeBadgeDisabled: {
    backgroundColor: '#F5F5F5',
  },

  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  sourceText: {
    fontSize: 11,
    color: '#999999',
  },

  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },

  validityText: {
    fontSize: 12,
    color: '#999999',
  },

  couponNo: {
    fontSize: 11,
    color: '#CCCCCC',
    marginTop: 4,
  },

  textDisabled: {
    color: '#CCCCCC',
  },

  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A054',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },

  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  statusOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
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
