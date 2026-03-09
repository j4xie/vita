import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.round(screenWidth * 0.56);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.286);
const CARD_MARGIN = 23;

// Bottom panel geometry (same approach as FeaturedActivityCard)
const BOTTOM_PANEL_RATIO = 0.32;
const BOTTOM_PANEL_HEIGHT = Math.round(CARD_HEIGHT * BOTTOM_PANEL_RATIO);

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
  const earnMultiplier = merchant.earnPoints || 1;

  const displayTags = useMemo(() => {
    if (merchant.tags && merchant.tags.length > 0) {
      return merchant.tags.slice(0, 2);
    }
    if (merchant.category) {
      return merchant.category.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 2);
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
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Earn Badge - top left */}
      {earnMultiplier > 1 && (
        <View style={styles.earnOverlay}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <View style={styles.earnBadge}>
            <Text style={styles.earnBadgeText}>Earn x {earnMultiplier}</Text>
          </View>
        </View>
      )}

      {/* Arrow Button - top right */}
      <View style={styles.topRightArrow}>
        <Ionicons name="arrow-up" size={18} color="#111" style={{ transform: [{ rotate: '45deg' }] }} />
      </View>

      {/* Bottom Info Panel */}
      <View style={[styles.bottomPanel, isDarkMode && styles.bottomPanelDark]}>
        {/* Merchant Name */}
        <Text style={[styles.merchantName, isDarkMode && styles.textWhite]} numberOfLines={1}>
          {merchantName}
        </Text>

        {/* School + Distance */}
        {(orgName || distance) ? (
          <View style={styles.orgRow}>
            <Ionicons name="school-outline" size={12} color={isDarkMode ? '#999' : '#949494'} />
            {orgName ? <Text style={[styles.orgText, isDarkMode && styles.secondaryTextDark]} numberOfLines={1}>{orgName}</Text> : null}
            {orgName && distance ? <Text style={[styles.dotText, isDarkMode && styles.secondaryTextDark]}> · </Text> : null}
            {distance ? <Text style={[styles.distanceText, isDarkMode && styles.secondaryTextDark]}>{distance}</Text> : null}
          </View>
        ) : null}

        {/* Category Tags */}
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

  // Earn badge overlay on image (top-left)
  earnOverlay: {
    position: 'absolute',
    top: 14,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 5,
  },
  fireEmoji: {
    fontSize: 16,
  },
  earnBadge: {
    backgroundColor: '#E8734A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  earnBadgeText: {
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 16,
  },

  // Arrow Button - top right
  topRightArrow: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 41,
    height: 41,
    borderRadius: 20.5,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  // Bottom info panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  bottomPanelDark: {
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
  },

  merchantName: {
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },

  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orgText: {
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    fontSize: 10,
    color: '#949494',
    flexShrink: 1,
  },
  dotText: {
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    fontSize: 10,
    color: '#949494',
  },
  distanceText: {
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    fontSize: 10,
    color: '#949494',
  },

  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  categoryTag: {
    backgroundColor: '#EEEEEE',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryTagText: {
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    fontSize: 9,
    color: '#949494',
  },

  // Dark mode
  textWhite: {
    color: '#fff',
  },
  secondaryTextDark: {
    color: '#777',
  },
  categoryTagDark: {
    backgroundColor: '#333',
  },
  categoryTagTextDark: {
    color: '#aaa',
  },
});

export default FeaturedMerchantCard;
