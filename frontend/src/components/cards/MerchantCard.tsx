import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '../common/OptimizedImage';
import { LoaderOne } from '../ui/LoaderOne';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 260; // Slightly narrower for better carousel feel
const CARD_HEIGHT = 340;
const IMAGE_HEIGHT = 180;

interface MerchantCardProps {
  merchant: {
    id: string;
    name: string;
    location: string;
    price?: string;
    earnPoints?: number;
    image?: string;
    category?: string;
  };
  onPress: () => void;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({
  merchant,
  onPress,
}) => {
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Top Image Section */}
      <View style={styles.imageContainer}>
        {merchant.image && !imageError ? (
          <>
            <OptimizedImage
              source={{
                uri: merchant.image,
                priority: 'normal'
              }}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
            {imageLoading && (
              <View style={styles.loadingContainer}>
                <LoaderOne size="small" color="#999" />
              </View>
            )}

            {/* Category Tag Overlay */}
            {merchant.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{merchant.category}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#CCC" />
          </View>
        )}
      </View>

      {/* Bottom Info Section */}
      <View style={styles.infoContainer}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {merchant.name}
        </Text>

        {/* Address */}
        <Text style={styles.location} numberOfLines={1}>
          {merchant.location}
        </Text>

        {/* Footer Row: Rewards & Price */}
        <View style={styles.footerRow}>
          {/* Reward Pill */}
          <View style={styles.rewardPill}>
            <View style={styles.rewardIconBg}>
              <Text style={styles.rewardIconText}>Q</Text>
            </View>
            <Text style={styles.rewardText}>
              Earn {merchant.earnPoints || 1}
            </Text>
          </View>

          {/* Price */}
          {merchant.price && (
            <Text style={styles.price}>{merchant.price}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // More rounded
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },

  // Image Section
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    // backdropFilter removed as it is not supported in RN
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Info Section
  infoContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#000',
    lineHeight: 22,
    marginBottom: 4,
  },
  location: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0', // Light Gold/Cream
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  rewardIconBg: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF7763', // Brand Primary
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rewardIconText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  rewardText: {
    color: '#D4A054', // Gold text
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  price: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#C7C7CC',
  },
});
