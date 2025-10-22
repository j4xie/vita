import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from '../common/OptimizedImage';
import { LoaderOne } from '../ui/LoaderOne';

interface MerchantListCardProps {
  merchant: {
    id: string;
    name: string;
    location: string;
    price?: string;
    earnPoints?: number;
    image?: string;
    category?: string;
    rating?: number;
    monthSales?: number;
    distance?: string;
    tags?: string[];
  };
  onPress: () => void;
}

export const MerchantListCard: React.FC<MerchantListCardProps> = ({
  merchant,
  onPress,
}) => {
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 生成一些美团风格的标签
  const displayTags = merchant.tags || ['高评分', '商家直送'];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* 左侧图片 */}
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
            {/* 图片渐变遮罩 */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.15)']}
              style={styles.imageGradient}
            />
            {imageLoading && (
              <View style={styles.loadingContainer}>
                <LoaderOne size="small" color="#999" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="storefront-outline" size={40} color="#D0D0D0" />
          </View>
        )}
      </View>

      {/* 右侧信息 */}
      <View style={styles.infoContainer}>
        {/* 商家名称 + 品牌标识 */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {merchant.name}
          </Text>
          {merchant.rating && merchant.rating >= 4.8 && (
            <View style={styles.brandBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#FFB800" />
            </View>
          )}
        </View>

        {/* 评分和销量 */}
        <View style={styles.ratingRow}>
          {merchant.rating && (
            <>
              <View style={styles.starContainer}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={styles.ratingText}>{merchant.rating.toFixed(1)}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}
          {merchant.monthSales && (
            <Text style={styles.salesText}>月售{merchant.monthSales}</Text>
          )}
        </View>

        {/* 标签行 */}
        {displayTags.length > 0 && (
          <View style={styles.tagsRow}>
            {displayTags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 地址 + 距离 */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color="#999" />
          <Text style={styles.location} numberOfLines={1}>
            {merchant.location}
          </Text>
        </View>

        {/* 底部信息 */}
        <View style={styles.bottomRow}>
          {/* Earn 标签 + 积分 */}
          <View style={styles.earnContainer}>
            <LinearGradient
              colors={['#FFD700', '#D4A054']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.earnBadge}
            >
              <Ionicons name="gift" size={10} color="#FFF" />
              <Text style={styles.earnText}>赚{merchant.earnPoints || 1}积分</Text>
            </LinearGradient>
          </View>

          {/* 价格 */}
          {merchant.price && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>¥</Text>
              <Text style={styles.price}>{merchant.price.replace('Contact for price', '咨询')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 右侧箭头 */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={16} color="#CCC" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // 左侧图片区域
  imageContainer: {
    width: 110,
    height: 110,
    backgroundColor: '#F8F8F8',
    position: 'relative',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
  },

  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },

  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },

  // 右侧信息区
  infoContainer: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 8,
    justifyContent: 'space-between',
  },

  // 商家名称行
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 4,
  },

  brandBadge: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 评分和销量行
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF8800',
    marginLeft: 2,
  },

  divider: {
    width: 1,
    height: 10,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },

  salesText: {
    fontSize: 11,
    color: '#999',
  },

  // 标签行
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },

  tag: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 2,
  },

  tagText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '500',
  },

  // 地址行
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  location: {
    fontSize: 12,
    color: '#999',
    marginLeft: 2,
    flex: 1,
  },

  // 底部行
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Earn 容器
  earnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Earn 标签 - 渐变背景
  earnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },

  earnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 价格容器
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
  },

  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B35',
  },

  // 右侧箭头
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
});
