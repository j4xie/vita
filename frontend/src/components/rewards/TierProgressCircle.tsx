import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { MembershipTier } from '../../types/pointsMall';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CIRCLE_SIZE = 210;

interface TierProgressCircleProps {
  currentTier: MembershipTier;
  targetTier: MembershipTier;
  points: number;
  nextTierPoints?: number;
}

// 等级积分阈值
const TIER_THRESHOLDS = {
  [MembershipTier.BRONZE]: 0,
  [MembershipTier.SILVER]: 1000,
  [MembershipTier.GOLD]: 3000,
  [MembershipTier.DIAMOND]: 6000,
};

/**
 * TierProgressCircle - 会员等级大圆环组件
 *
 * 1:1还原酒店会员系统设计：
 * - 大圆环（直径300px）
 * - 圆环内显示当前等级、目标等级、说明文字
 * - 底部水平进度条
 */
export const TierProgressCircle: React.FC<TierProgressCircleProps> = ({
  currentTier,
  targetTier,
  points,
  nextTierPoints,
}) => {
  const { t } = useTranslation();

  const getTierName = (tier: MembershipTier) => {
    const tierKeys = {
      bronze: 'rewards.tiers.bronze',
      silver: 'rewards.tiers.silver',
      gold: 'rewards.tiers.gold',
      diamond: 'rewards.tiers.diamond',
    };
    return t(tierKeys[tier]);
  };

  const currentTierName = getTierName(currentTier);
  const targetTierName = getTierName(targetTier);

  // 计算真实进度（0-1）
  const currentTierStart = TIER_THRESHOLDS[currentTier];
  const nextTierStart = TIER_THRESHOLDS[targetTier];
  const progress = currentTier === targetTier
    ? 1 // 已达到最高等级
    : Math.min(1, (points - currentTierStart) / (nextTierStart - currentTierStart));

  // 生成圆弧路径
  const radius = CIRCLE_SIZE / 2 - 10;
  const centerX = CIRCLE_SIZE / 2;
  const centerY = CIRCLE_SIZE / 2;
  const angle = progress * 360;

  const getArcPath = (angle: number) => {
    if (angle === 0) return '';
    if (angle >= 360) {
      // 完整圆形
      return `M ${centerX},${centerY - radius} A ${radius},${radius} 0 1,1 ${centerX},${centerY + radius} A ${radius},${radius} 0 1,1 ${centerX},${centerY - radius}`;
    }

    const startAngle = -90; // 从顶部开始
    const endAngle = startAngle + angle;

    const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return `M ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY}`;
  };

  const arcPath = getArcPath(angle);

  return (
    <View style={styles.container}>
      {/* 外圆环 */}
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.circleSvg}>
        <Defs>
          {/* 金色渐变 */}
          <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* 背景圆环 */}
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={CIRCLE_SIZE / 2 - 10}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={2.5}
          fill="none"
        />

        {/* 进度圆弧 */}
        {arcPath && (
          <Path
            d={arcPath}
            stroke="url(#goldGradient)"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Gold标签到圆环的连接线 */}
        <Line
          x1={CIRCLE_SIZE / 2}
          y1={42}
          x2={CIRCLE_SIZE / 2}
          y2={10}
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={1}
        />
      </Svg>

      {/* 圆环内内容 */}
      <View style={styles.innerContent}>
        {/* 顶部小标签 */}
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>{currentTierName}</Text>
        </View>

        {/* 中央大标题 */}
        <Text style={styles.mainTitle}>{targetTierName}</Text>

        {/* 说明文字 */}
        <Text style={styles.description}>
          {t('rewards.circle.description')}
        </Text>

        {/* 积分进度显示 */}
        <View style={styles.pointsProgressContainer}>
          <Text style={styles.pointsText}>
            <Text style={styles.currentPoints}>{points.toLocaleString()}</Text>
            <Text style={styles.pointsSeparator}> / </Text>
            <Text style={styles.targetPoints}>{nextTierStart.toLocaleString()}</Text>
          </Text>
          <Text style={styles.pointsLabel}>{t('rewards.circle.points')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },

  circleSvg: {
    position: 'absolute',
  },

  innerContent: {
    width: CIRCLE_SIZE - 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 顶部小标签
  topBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },

  topBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.5,
  },

  // 中央大标题
  mainTitle: {
    fontFamily: 'Georgia', // 衬线字体
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 5,
    letterSpacing: 0.5,
  },

  // 说明文字
  description: {
    fontSize: 10,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },

  // 积分进度显示
  pointsProgressContainer: {
    alignItems: 'center',
  },

  pointsText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  currentPoints: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFB800',
  },

  pointsSeparator: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999999',
  },

  targetPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },

  pointsLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#999999',
    marginTop: 2,
  },
});
