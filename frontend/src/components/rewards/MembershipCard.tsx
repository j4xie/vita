import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Pattern, Rect, G } from 'react-native-svg';
import { MembershipInfo, MembershipTier } from '../../types/pointsMall';
import { TIER_COLORS, TIER_NAMES_EN, getNextTierPoints, getTierProgress } from '../../utils/membershipTierCalculator';
import { useTranslation } from 'react-i18next';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 240; // Increased height to prevent text cutoff

interface MembershipCardProps {
  membershipInfo: MembershipInfo;
}

/**
 * Dark Luxury Membership Card
 * 
 * Aesthetic: High-end fashion brand membership.
 * Colors: Deep Bronze, Black, Gold.
 * Texture: Visible monogram pattern.
 */
export const MembershipCard: React.FC<MembershipCardProps> = ({ membershipInfo }) => {
  const { t } = useTranslation();

  // Luxury Dark Palette
  const getLuxuryColors = (tier: MembershipTier) => {
    switch (tier) {
      case MembershipTier.BRONZE:
        return { gradient: ['#5D4037', '#3E2723', '#1A120B'] }; // Deep Bronze -> Coffee -> Black
      case MembershipTier.SILVER:
        return { gradient: ['#757575', '#424242', '#212121'] }; // Deep Silver -> Dark Grey -> Black
      case MembershipTier.GOLD:
        return { gradient: ['#C6A355', '#8D6E63', '#3E2723'] }; // Gold -> Bronze -> Dark
      case MembershipTier.DIAMOND:
        return { gradient: ['#263238', '#102027', '#000000'] }; // Blue Black -> Black
      default:
        return { gradient: ['#5D4037', '#3E2723', '#1A120B'] };
    }
  };

  const colors = getLuxuryColors(membershipInfo.tier);
  const tierNameEn = TIER_NAMES_EN[membershipInfo.tier].toUpperCase();
  const progress = getTierProgress(membershipInfo.points);
  const nextTierPoints = getNextTierPoints(membershipInfo.points);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Always light text on dark cards
  const textColor = '#FFFFFF';
  const subTextColor = 'rgba(255, 255, 255, 0.6)';
  const accentColor = '#D4AF37'; // Gold accent for progress bar

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Monogram Pattern Texture */}
        <View style={styles.textureContainer}>
          <Svg width={CARD_WIDTH} height={CARD_HEIGHT} style={styles.svg}>
            <Defs>
              <Pattern id="monogram" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                {/* Interlocking Circles Pattern */}
                <Circle cx="15" cy="15" r="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.1" />
                <Circle cx="0" cy="0" r="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.1" />
                <Circle cx="30" cy="0" r="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.1" />
                <Circle cx="0" cy="30" r="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.1" />
                <Circle cx="30" cy="30" r="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.1" />
              </Pattern>
              <SvgLinearGradient id="goldSheen" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#D4AF37" stopOpacity="0.2" />
                <Stop offset="0.5" stopColor="#D4AF37" stopOpacity="0.0" />
                <Stop offset="1" stopColor="#D4AF37" stopOpacity="0.2" />
              </SvgLinearGradient>
            </Defs>

            {/* Pattern Fill */}
            <Rect x="0" y="0" width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#monogram)" />

            {/* Gold Sheen Overlay */}
            <Rect x="0" y="0" width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#goldSheen)" />
          </Svg>
        </View>

        {/* Content Layer */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.brandContainer}>
              <Text style={[styles.brandLabel, { color: subTextColor }]}>POMELOX</Text>
              <View style={styles.brandLine} />
            </View>
            <View style={styles.monogramBadge}>
              <Text style={styles.monogramText}>
                {(() => {
                  const name = membershipInfo.nickName || membershipInfo.legalName || 'P';
                  const hasChinese = /[\u4e00-\u9fa5]/.test(name);
                  if (hasChinese) {
                    return name.charAt(0);
                  }
                  return name.charAt(0).toUpperCase();
                })()}
              </Text>
            </View>
          </View>


          {/* Center Tier Name */}
          <View style={styles.centerSection}>
            <Text style={[styles.tierTitle, { color: textColor }]}>{tierNameEn}</Text>
            <Text style={[styles.tierSubtitle, { color: accentColor }]}>MEMBER PRIVILEGES</Text>
          </View>

          {/* Bottom Info */}
          <View style={styles.footerRow}>
            <View>
              <Text style={[styles.pointsValue, { color: textColor }]}>
                {membershipInfo.points.toLocaleString()}
              </Text>
              <Text style={[styles.pointsLabel, { color: subTextColor }]}>
                {t('rewards.menu.points', 'Points Balance')}
              </Text>
            </View>

            {/* Circular Progress or Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: accentColor,
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: subTextColor }]}>
                {Math.floor(progress)}% to Next Tier
              </Text>
            </View>
          </View>
        </View >
      </LinearGradient >
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    marginVertical: 24,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  textureContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  svg: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    padding: 24, // Reduced padding to give more space
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  brandLine: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  monogramBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)', // Gold border
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  monogramText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  centerSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  tierTitle: {
    fontSize: 30, // Slightly smaller to fit better
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    textAlign: 'center',
    marginBottom: 4,
  },
  tierSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 40, // Reduced from 48 to fit better
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    lineHeight: 48, // Ensure line height doesn't clip
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  progressContainer: {
    width: 100,
    alignItems: 'flex-end',
    marginBottom: 6, // Align with text baseline
  },
  progressBarBg: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 9,
    letterSpacing: 0.5,
  }
});
