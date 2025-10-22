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
import { MembershipTier } from '../../types/pointsMall';
import { WaveBackgroundPattern } from '../../components/rewards/WaveBackgroundPattern';
import { TierProgressCircle } from '../../components/rewards/TierProgressCircle';
import { BenefitsCarousel } from '../../components/rewards/BenefitsCarousel';
import { useUser } from '../../context/UserContext';
import { calculateTier, getNextTierPoints } from '../../utils/membershipTierCalculator';
import { couponAPI } from '../../services/couponAPI';

/**
 * PointsMallHomeScreen - 会员中心页面
 *
 * 1:1还原酒店会员系统设计：
 * - 波浪纹理背景
 * - 大圆环等级展示
 * - 分段控制器
 * - 横向权益轮播
 * - 列表项功能入口
 */
export const PointsMallHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // 状态管理
  const [refreshing, setRefreshing] = useState(false);
  const [mockPoints] = useState(3500); // TODO: 从API获取
  const [couponCount, setCouponCount] = useState(0); // 优惠券数量
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  // 计算会员等级
  const currentTier = calculateTier(mockPoints);
  const nextTier = currentTier === MembershipTier.DIAMOND
    ? MembershipTier.DIAMOND
    : (Object.values(MembershipTier)[
        Object.values(MembershipTier).indexOf(currentTier) + 1
      ] as MembershipTier);
  const pointsToNext = getNextTierPoints(mockPoints);

  // 会员权益数据（基于PDF会员体系）
  const benefits = [
    { id: '1', icon: 'gift-outline', title: t('rewards.benefits.merchant_coupon') },
    { id: '2', icon: 'ticket-outline', title: t('rewards.benefits.platform_coupon') },
    { id: '3', icon: 'storefront-outline', title: t('rewards.benefits.points_mall') },
    { id: '4', icon: 'people-outline', title: t('rewards.benefits.group_buy') },
    { id: '5', icon: 'restaurant-outline', title: t('rewards.benefits.free_meal'), redCardOnly: true },
    { id: '6', icon: 'sparkles', title: t('rewards.benefits.exclusive_coupon'), redCardOnly: true },
    { id: '7', icon: 'trending-up', title: t('rewards.benefits.points_boost'), redCardOnly: true },
  ];

  // 获取优惠券数量
  const fetchCouponCount = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoadingCoupons(true);
      const response = await couponAPI.getUserCouponList({
        userId: user.userId,
        status: 1, // 1-未使用
        pageNum: 1,
        pageSize: 100,
      });

      if (response.code === 200) {
        const coupons = response.rows || response.data || [];
        setCouponCount(Array.isArray(coupons) ? coupons.length : 0);
      }
    } catch (error) {
      console.error('获取优惠券数量失败:', error);
      setCouponCount(0);
    } finally {
      setLoadingCoupons(false);
    }
  }, [user?.userId]);

  // 页面加载时获取优惠券数量
  useEffect(() => {
    fetchCouponCount();
  }, [fetchCouponCount]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCouponCount().finally(() => setRefreshing(false));
  }, [fetchCouponCount]);

  return (
    <View style={styles.container}>
      {/* 波浪背景 */}
      <WaveBackgroundPattern />

      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Explore');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.legalName || user?.userName || 'Member'}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 主滚动区域 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 卡片图标 */}
        <View style={styles.cardIconSection}>
          <Ionicons name="card-outline" size={22} color="#666666" />
        </View>

        {/* 大圆环 - 会员等级展示 */}
        <TierProgressCircle
          currentTier={currentTier}
          targetTier={nextTier}
          points={mockPoints}
          nextTierPoints={pointsToNext}
        />

        {/* Member Benefits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('rewards.benefits.title')}</Text>
          </View>
          <BenefitsCarousel benefits={benefits} />
        </View>

        {/* 积分商城 */}
        <TouchableOpacity
          style={styles.menuItemWithSubtitle}
          onPress={() => navigation.navigate('PointsMallList')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="storefront" size={22} color="#1A1A1A" />
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemTitle}>{t('rewards.menu.points_mall')}</Text>
              <Text style={styles.menuItemSubtitle}>{t('rewards.menu.points_mall_desc')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Points Balance */}
        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.pointsBalanceTitle}>{t('rewards.menu.points_balance')}</Text>
            <View style={styles.pointsBalanceRow}>
              <Text style={styles.pointsBalanceValue}>{mockPoints}</Text>
              <Text style={styles.pointsBalanceUnit}> {t('rewards.menu.points')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.earnButton}>
            <Text style={styles.earnButtonText}>{t('rewards.menu.earn_redeem')}</Text>
          </TouchableOpacity>
        </View>

        {/* 我的优惠券 */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyCoupons')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="ticket" size={22} color="#1A1A1A" />
            <Text style={styles.menuItemTitle}>{t('rewards.menu.my_coupons')}</Text>
            {loadingCoupons ? (
              <ActivityIndicator size="small" color="#999999" style={{ marginLeft: 8 }} />
            ) : couponCount > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{couponCount}</Text>
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </TouchableOpacity>

        {/* 推荐好友 */}
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="share-social" size={22} color="#1A1A1A" />
            <Text style={styles.menuItemTitle}>{t('rewards.menu.refer_friends')}</Text>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardBadgeText}>{t('rewards.menu.earn_points')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </TouchableOpacity>

        {/* 种草任务 - 红卡专属 */}
        {currentTier === MembershipTier.DIAMOND && (
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="create" size={22} color="#1A1A1A" />
              <Text style={styles.menuItemTitle}>{t('rewards.menu.review_tasks')}</Text>
              <View style={styles.redCardBadge}>
                <Text style={styles.redCardBadgeText}>{t('rewards.menu.red_card_exclusive')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        )}

        {/* 霸王餐报名 - 红卡专属 */}
        {currentTier === MembershipTier.DIAMOND && (
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="restaurant" size={22} color="#1A1A1A" />
              <Text style={styles.menuItemTitle}>{t('rewards.menu.free_meal_signup')}</Text>
              <View style={styles.redCardBadge}>
                <Text style={styles.redCardBadgeText}>{t('rewards.menu.red_card_exclusive')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8DCC8', // 更柔和的米色背景
  },

  // 顶部栏
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },

  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },

  // 卡片图标
  cardIconSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 3,
  },

  // 区域标题
  section: {
    marginBottom: 6,
    marginTop: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // 列表菜单项
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F0EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  menuItemWithSubtitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F0EB',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  menuItemTextContainer: {
    flex: 1,
  },

  menuItemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  menuItemSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#999999',
    marginTop: 2,
  },

  // Points Balance 特殊样式
  pointsBalanceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },

  pointsBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  pointsBalanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  pointsBalanceUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
  },

  earnButton: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },

  earnButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 徽章样式
  countBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },

  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  rewardBadge: {
    backgroundColor: '#FFB800',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },

  rewardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  redCardBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },

  redCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
