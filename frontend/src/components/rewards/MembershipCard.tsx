import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { MembershipInfo, MembershipTier } from '../../types/pointsMall';
import { TIER_COLORS, TIER_NAMES_EN } from '../../utils/membershipTierCalculator';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = 200;
const SIDEBAR_WIDTH = 50;

interface MembershipCardProps {
  membershipInfo: MembershipInfo;
}

/**
 * MembershipCard - 高端3D会员卡组件
 *
 * 1:1还原Shangri-La POLARIS会员卡设计：
 * - 深海色渐变背景
 * - 左侧装饰边栏（竖排Diamond文字）
 * - 优雅的贝塞尔曲线波浪
 * - 金色双圈logo
 * - 散落的星星装饰
 * - 衬线字体标题
 */
export const MembershipCard: React.FC<MembershipCardProps> = ({ membershipInfo }) => {
  const colors = TIER_COLORS[membershipInfo.tier];
  const tierNameEn = TIER_NAMES_EN[membershipInfo.tier].toUpperCase();
  const isDiamond = membershipInfo.tier === MembershipTier.DIAMOND;
  const accentColor = isDiamond ? '#D4AF37' : '#FFFFFF'; // 钻石用金色，其他用白色

  return (
    <View style={styles.container}>
      {/* 左侧装饰边栏 */}
      <View style={styles.sidebar}>
        {/* 竖排文字 */}
        <Text
          style={[
            styles.sidebarText,
            { color: accentColor },
          ]}
        >
          {tierNameEn}
        </Text>

        {/* 装饰波浪纹理 */}
        <Svg width={SIDEBAR_WIDTH} height={CARD_HEIGHT} style={styles.sidebarSvg}>
          <Path
            d={`M ${SIDEBAR_WIDTH / 2},0 Q ${SIDEBAR_WIDTH * 0.3},50 ${SIDEBAR_WIDTH / 2},100 T ${SIDEBAR_WIDTH / 2},${CARD_HEIGHT}`}
            stroke={`${accentColor}40`}
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d={`M ${SIDEBAR_WIDTH * 0.7},20 Q ${SIDEBAR_WIDTH * 0.4},70 ${SIDEBAR_WIDTH * 0.7},120 T ${SIDEBAR_WIDTH * 0.7},${CARD_HEIGHT}`}
            stroke={`${accentColor}20`}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </View>

      {/* 主卡片 */}
      <LinearGradient
        colors={colors.gradient as any}
        locations={colors.gradient.length === 3 ? [0, 0.5, 1] : [0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* SVG装饰层 */}
        <Svg
          width={CARD_WIDTH - SIDEBAR_WIDTH}
          height={CARD_HEIGHT}
          style={styles.decorationSvg}
        >
          {/* 优雅的波浪曲线 - 横跨卡片中部 */}
          <Path
            d={`
              M 0,${CARD_HEIGHT * 0.5}
              Q ${(CARD_WIDTH - SIDEBAR_WIDTH) * 0.25},${CARD_HEIGHT * 0.4}
              ${(CARD_WIDTH - SIDEBAR_WIDTH) * 0.5},${CARD_HEIGHT * 0.5}
              T ${CARD_WIDTH - SIDEBAR_WIDTH},${CARD_HEIGHT * 0.5}
            `}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={1.5}
            fill="none"
          />

          {/* 第二条波浪线（更柔和） */}
          <Path
            d={`
              M 0,${CARD_HEIGHT * 0.55}
              Q ${(CARD_WIDTH - SIDEBAR_WIDTH) * 0.3},${CARD_HEIGHT * 0.48}
              ${(CARD_WIDTH - SIDEBAR_WIDTH) * 0.6},${CARD_HEIGHT * 0.55}
              T ${CARD_WIDTH - SIDEBAR_WIDTH},${CARD_HEIGHT * 0.55}
            `}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
            fill="none"
          />

          {/* 星星装饰点 */}
          <Circle cx={(CARD_WIDTH - SIDEBAR_WIDTH) * 0.15} cy={50} r={2} fill="rgba(255, 255, 255, 0.6)" />
          <Circle cx={(CARD_WIDTH - SIDEBAR_WIDTH) * 0.25} cy={30} r={1.5} fill="rgba(255, 255, 255, 0.5)" />
          <Circle cx={(CARD_WIDTH - SIDEBAR_WIDTH) * 0.35} cy={65} r={1} fill="rgba(255, 255, 255, 0.4)" />
          <Circle cx={(CARD_WIDTH - SIDEBAR_WIDTH) * 0.75} cy={45} r={2.5} fill={`${accentColor}60`} />
          <Circle cx={(CARD_WIDTH - SIDEBAR_WIDTH) * 0.85} cy={70} r={1.5} fill={`${accentColor}40`} />
        </Svg>

        {/* 金色圆环logo - 中央 */}
        <Svg
          width={70}
          height={70}
          style={styles.centerLogo}
        >
          {/* 外圈 */}
          <Circle
            cx={35}
            cy={35}
            r={30}
            stroke={accentColor}
            strokeWidth={1.5}
            fill="none"
            opacity={0.8}
          />
          {/* 内圈 */}
          <Circle
            cx={35}
            cy={35}
            r={22}
            stroke={accentColor}
            strokeWidth={1}
            fill="none"
            opacity={0.5}
          />
          {/* 中心装饰 - PomeloX标志 */}
          <Circle
            cx={35}
            cy={35}
            r={12}
            fill={accentColor}
            opacity={0.25}
          />
          {/* 中心点 */}
          <Circle
            cx={35}
            cy={35}
            r={4}
            fill={accentColor}
            opacity={0.6}
          />
        </Svg>

        {/* 卡片文字内容 */}
        <View style={styles.cardContent}>
          {/* 顶部区域 */}
          <View style={styles.topSection}>
            <Text style={styles.topLeftText}>POMELOX CIRCLE</Text>
            <Text style={styles.topRightText}>{tierNameEn}</Text>
          </View>

          {/* 底部用户信息 */}
          <View style={styles.bottomSection}>
            <View style={styles.userInfo}>
              {membershipInfo.nickName && (
                <Text style={styles.nickName}>{membershipInfo.nickName.toUpperCase()}</Text>
              )}
              <Text style={styles.legalName}>{membershipInfo.legalName}</Text>
            </View>
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsValue}>{membershipInfo.points}</Text>
              <Text style={styles.pointsLabel}>POINTS</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH * 0.9,
    height: CARD_HEIGHT,
    flexDirection: 'row',
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },

  // 左侧边栏
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  sidebarText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    transform: [{ rotate: '90deg' }],
    opacity: 0.9,
  },

  sidebarSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // 主卡片
  card: {
    flex: 1,
    height: CARD_HEIGHT,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'visible',
    position: 'relative',
  },

  decorationSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // 中央金色logo
  centerLogo: {
    position: 'absolute',
    top: CARD_HEIGHT / 2 - 35,
    left: (CARD_WIDTH - SIDEBAR_WIDTH) / 2 - 35,
    opacity: 0.9,
  },

  cardContent: {
    flex: 1,
    padding: 16,
    paddingLeft: 20,
    justifyContent: 'space-between',
  },

  // 顶部文字
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  topLeftText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  topRightText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // 底部用户信息
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  userInfo: {
    flex: 1,
  },

  nickName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  legalName: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
  },

  // 积分信息
  pointsInfo: {
    alignItems: 'flex-end',
  },

  pointsValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  pointsLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 2,
  },
});
