import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MembershipBenefit, MembershipTier } from '../../types/pointsMall';
import { useTranslation } from 'react-i18next';

interface MembershipBenefitsGridProps {
  tier: MembershipTier;
}

/**
 * MembershipBenefitsGrid - 会员权益网格展示
 *
 * 设计参考：Shangri-La会员权益图标网格
 * - 3列布局
 * - 图标 + 文字说明
 * - 根据等级显示可用权益
 */
export const MembershipBenefitsGrid: React.FC<MembershipBenefitsGridProps> = ({ tier }) => {
  const { t } = useTranslation();

  // 定义所有会员权益
  const allBenefits: MembershipBenefit[] = [
    {
      id: 'priority_registration',
      icon: 'flash',
      title: '活动优先报名',
      available: true,
    },
    {
      id: 'points_exchange',
      icon: 'gift',
      title: '积分兑换商品',
      available: true,
    },
    {
      id: 'exclusive_coupons',
      icon: 'ticket',
      title: '专属优惠券',
      available: tier === MembershipTier.GOLD || tier === MembershipTier.DIAMOND,
    },
    {
      id: 'free_checkin',
      icon: 'qr-code',
      title: '免费扫码签到',
      available: true,
    },
    {
      id: 'leaderboard',
      icon: 'trophy',
      title: '排行榜特权',
      available: tier === MembershipTier.DIAMOND,
    },
    {
      id: 'referral_bonus',
      icon: 'people',
      title: '邀请好友奖励',
      available: tier === MembershipTier.SILVER || tier === MembershipTier.GOLD || tier === MembershipTier.DIAMOND,
    },
    {
      id: 'stats_report',
      icon: 'stats-chart',
      title: '数据统计报告',
      available: tier === MembershipTier.GOLD || tier === MembershipTier.DIAMOND,
    },
    {
      id: 'custom_recommendations',
      icon: 'sparkles',
      title: '定制活动推荐',
      available: tier === MembershipTier.DIAMOND,
    },
    {
      id: 'priority_support',
      icon: 'chatbubbles',
      title: '优先客服支持',
      available: tier === MembershipTier.GOLD || tier === MembershipTier.DIAMOND,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>会员权益</Text>
      <View style={styles.grid}>
        {allBenefits.map((benefit) => (
          <View
            key={benefit.id}
            style={[
              styles.benefitItem,
              !benefit.available && styles.benefitItemDisabled,
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                !benefit.available && styles.iconContainerDisabled,
              ]}
            >
              <Ionicons
                name={benefit.icon as any}
                size={28}
                color={benefit.available ? '#FF6B6B' : '#CCCCCC'}
              />
            </View>
            <Text
              style={[
                styles.benefitTitle,
                !benefit.available && styles.benefitTitleDisabled,
              ]}
              numberOfLines={2}
            >
              {benefit.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  benefitItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },

  benefitItemDisabled: {
    opacity: 0.4,
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#FFE0E0',
  },

  iconContainerDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },

  benefitTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 16,
  },

  benefitTitleDisabled: {
    color: '#999999',
  },
});
