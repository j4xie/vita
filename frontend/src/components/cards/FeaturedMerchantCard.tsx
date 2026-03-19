import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SchoolMarkerIcon, FlameIcon } from '../common/icons/CommunityIcons';

// Figma specs
const CARD_WIDTH = 220;
const CARD_HEIGHT = 222;
const CARD_MARGIN = 23;
const IMAGE_HEIGHT = 154;
const PANEL_TOP = 133;
const PANEL_HEIGHT = CARD_HEIGHT - PANEL_TOP;

/** Filled star icon matching Figma (20x20, fill #F3C562) */
const StarIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M11.4417 2.925L12.9084 5.85833C13.1084 6.26667 13.6417 6.65833 14.0917 6.73333L16.75 7.175C18.45 7.45833 18.85 8.69167 17.6251 9.90833L15.5584 11.975C15.2084 12.325 15.0167 13 15.1251 13.4833L15.7167 16.0417C16.1834 18.0667 15.1084 18.85 13.3167 17.7917L10.8251 16.3167C10.3751 16.05 9.63341 16.05 9.17508 16.3167L6.68341 17.7917C4.90008 18.85 3.81674 18.0583 4.28341 16.0417L4.87508 13.4833C4.98341 13 4.79174 12.325 4.44174 11.975L2.37508 9.90833C1.15841 8.69167 1.55008 7.45833 3.25008 7.175L5.90841 6.73333C6.35008 6.65833 6.88341 6.26667 7.08341 5.85833L8.55008 2.925C9.35008 1.33333 10.6501 1.33333 11.4417 2.925Z"
      fill="#F3C562"
    />
  </Svg>
);

/** Arrow with diagonal line + arrowhead */
const ArrowLine: React.FC = () => (
  <Svg width={19} height={19} viewBox="0 0 19 19" fill="none">
    <Line x1="2" y1="17" x2="17" y2="2" stroke="#000000" strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="7" y1="2" x2="17" y2="2" stroke="#000000" strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="17" y1="2" x2="17" y2="12" stroke="#000000" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

interface FeaturedMerchantCardProps {
  merchant: {
    id: string;
    merchantId?: number;
    title?: string;
    name?: string;
    location?: string;
    image?: string;
    earnPoints?: number;
    schoolName?: string;
    category?: string;
    rating?: number;
    reviewCount?: number;
    distance?: string;
    tags?: string[];
  };
  onPress: () => void;
  onBookmark?: () => void;
  isDarkMode?: boolean;
}

const FeaturedMerchantCardComponent: React.FC<FeaturedMerchantCardProps> = ({
  merchant,
  onPress,
  isDarkMode = false,
}) => {
  const merchantName = merchant.title || merchant.name || 'Merchant';
  const orgName = merchant.schoolName || '';
  const distance = merchant.distance || '';
  const earnMultiplier = merchant.earnPoints ?? 1;
  const rating = merchant.rating || 0;
  const reviewCount = merchant.reviewCount || 0;

  const displayTags = useMemo(() => {
    if (merchant.tags && merchant.tags.length > 0) {
      return merchant.tags.slice(0, 3);
    }
    if (merchant.category) {
      return merchant.category.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3);
    }
    return [];
  }, [merchant.tags, merchant.category]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Hero Image */}
      <Image
        source={{
          uri: merchant.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        }}
        style={styles.heroImage}
        resizeMode="cover"
      />

      {/* Earn Badge - always show on image */}
      <View style={styles.earnOverlay}>
        {earnMultiplier > 1 && <FlameIcon size={15} />}
        {earnMultiplier > 1 ? (
          <LinearGradient
            colors={['#F9701A', '#EF4741']}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.earnBadgeGradient}
          >
            <Text style={styles.earnBadgeText}>Earn × {earnMultiplier}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.earnBadgeSimple}>
            <Text style={styles.earnBadgeText}>Earn</Text>
          </View>
        )}
      </View>

      {/* Arrow Button - top right */}
      <View style={styles.topRightArrow}>
        <ArrowLine />
      </View>

      {/* White Bottom Panel */}
      <View style={[styles.bottomPanel, isDarkMode && styles.bottomPanelDark]}>
        {/* Row 1: Name + Rating (rating hidden until API supports it) */}
        <View style={styles.nameRatingRow}>
          <Text style={[styles.merchantName, isDarkMode && styles.textWhite]} numberOfLines={1}>
            {merchantName}
          </Text>
          {rating > 0 && (
            <View style={styles.ratingRow}>
              <StarIcon size={20} />
              <Text style={[styles.ratingText, isDarkMode && styles.textWhite]}>
                {rating.toFixed(1)}
              </Text>
              {reviewCount > 0 && (
                <Text style={[styles.reviewCountText, isDarkMode && styles.secondaryTextDark]}>
                  ({reviewCount}+)
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Row 2: School + Distance */}
        <View style={styles.orgRow}>
          <SchoolMarkerIcon size={13} color={isDarkMode ? '#999' : '#949494'} />
          <Text style={[styles.orgText, isDarkMode && styles.secondaryTextDark]} numberOfLines={1}>
            {orgName}{orgName && distance ? ' · ' : ''}{distance}
          </Text>
        </View>

        {/* Row 3: Category Tags */}
        {displayTags.length > 0 && (
          <View style={styles.tagsRow}>
            {displayTags.map((tag, index) => (
              <View key={`${tag}-${index}`} style={[styles.categoryTag, isDarkMode && styles.categoryTagDark]}>
                <Text style={[styles.categoryTagText, isDarkMode && styles.categoryTagTextDark]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const FeaturedMerchantCard = memo(FeaturedMerchantCardComponent);

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },

  heroImage: {
    position: 'absolute',
    top: 0,
    left: -3,
    width: CARD_WIDTH + 6,
    height: IMAGE_HEIGHT,
  },

  // Earn badge (left:8, top:105)
  earnOverlay: {
    position: 'absolute',
    top: 105,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    zIndex: 5,
  },
  earnBadgeGradient: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 20,
  },
  earnBadgeSimple: {
    backgroundColor: '#F1B22B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 20,
  },
  earnBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 18,
  },

  // Arrow Button (41x41, top:11, right:12)
  topRightArrow: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 41,
    height: 41,
    borderRadius: 25.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  // White bottom panel
  bottomPanel: {
    position: 'absolute',
    top: PANEL_TOP,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: '#FFFFFF',
    paddingLeft: 9,
    paddingRight: 9,
    paddingTop: 8,
    gap: 4,
  },
  bottomPanelDark: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
  },

  // Row 1: Name + Rating
  nameRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 26,
  },
  merchantName: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    fontSize: 15,
    color: '#000000',
    flexShrink: 1,
    marginRight: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  ratingText: {
    fontFamily: 'Poppins_400Regular',
    fontWeight: '400',
    fontSize: 12,
    color: '#000000',
  },
  reviewCountText: {
    fontFamily: 'Poppins_400Regular',
    fontWeight: '400',
    fontSize: 10,
    color: '#949494',
  },

  // Row 2: School + Distance
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 15,
  },
  orgText: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 10,
    color: '#949494',
    lineHeight: 15,
    flexShrink: 1,
  },

  // Row 3: Tags
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 20,
  },
  categoryTag: {
    backgroundColor: '#EEEEEE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryTagText: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 8,
    color: '#949494',
    lineHeight: 12,
  },

  // Dark mode
  textWhite: { color: '#fff' },
  secondaryTextDark: { color: '#777' },
  categoryTagDark: { backgroundColor: '#333' },
  categoryTagTextDark: { color: '#aaa' },
});

export default FeaturedMerchantCard;
