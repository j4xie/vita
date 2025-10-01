import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OptimizedImage } from '../common/OptimizedImage';
import { LoaderOne } from '../ui/LoaderOne';

const { width: screenWidth } = Dimensions.get('window');
const CARD_HEIGHT = 380;

interface CommunityEventCardLargeProps {
  event: {
    id: string;
    title: string;
    location: string;
    dateRange: string;
    price?: number | string;
    currency?: string;
    image?: string;
    organizerName?: string;
    status?: 'available' | 'sold_out' | 'upcoming';
  };
  onPress: () => void;
}

export const CommunityEventCardLarge: React.FC<CommunityEventCardLargeProps> = ({
  event,
  onPress,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 格式化价格显示
  const formatPrice = () => {
    if (!event.price) return null;
    const currency = event.currency || 'USD';
    const price = typeof event.price === 'number' ? event.price : event.price;

    return {
      amount: `From ${currency} ${price}`,
      suffix: 'per night'
    };
  };

  const priceData = formatPrice();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.98}
    >
      {/* 背景图片 - 全屏 */}
      <View style={styles.imageContainer}>
        {event.image && !imageError ? (
          <>
            <OptimizedImage
              source={{
                uri: event.image,
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
                <LoaderOne size="small" color="#FFFFFF" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.5)" />
          </View>
        )}
      </View>

      {/* 底部深色渐变遮罩 - 增强版 */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(0, 0, 0, 0.2)',
          'rgba(0, 0, 0, 0.5)',
          'rgba(0, 0, 0, 0.75)',
          'rgba(0, 0, 0, 0.85)',
        ]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* 左上角装饰图标 - 层叠效果 */}
      <View style={styles.decorIcon}>
        <Ionicons name="layers-outline" size={18} color="#FFFFFF" />
      </View>

      {/* 右上角价格标签 - 完全匹配 Shangri-La */}
      {priceData && (
        <View style={styles.priceTag}>
          <Text style={styles.priceAmount}>{priceData.amount}</Text>
          <Text style={styles.priceSuffix}>{priceData.suffix}</Text>
        </View>
      )}

      {/* 状态标签 - Sold Out 等 */}
      {event.status === 'sold_out' && (
        <View style={styles.soldOutBadge}>
          <Text style={styles.soldOutText}>Sold Out</Text>
        </View>
      )}

      {/* 底部信息区 - 叠加在照片上 */}
      <View style={styles.infoOverlay} pointerEvents="none">
        {/* 组织者徽章（如 JEN） */}
        {event.organizerName && (
          <View style={styles.organizerBadge}>
            <Text style={styles.organizerText}>{event.organizerName}</Text>
          </View>
        )}

        {/* 活动标题 - 大号粗体白字 */}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        {/* 地址 - 小号白字 + 图标 */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#FFFFFF" />
          <Text style={styles.location} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: CARD_HEIGHT,
    backgroundColor: '#2C2C2E',
    position: 'relative',
    marginBottom: 0, // 紧密堆叠
    borderRadius: 0, // 无圆角
  },

  // 图片容器 - 全屏
  imageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2C2C2E',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
  },

  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
  },

  // 底部深色渐变遮罩 - 增强版
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.45,
    zIndex: 1,
  },

  // 左上角装饰图标 - 层叠效果
  decorIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  // 右上角价格标签 - 完全匹配 Shangri-La 橙黄色
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FDB022',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'flex-end',
    zIndex: 2,
  },

  priceAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 18,
  },

  priceSuffix: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1A1A1A',
    marginTop: 2,
    lineHeight: 13,
  },

  // Sold Out 标签
  soldOutBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    zIndex: 3,
  },

  soldOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // 底部信息区 - 叠加在照片上
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    zIndex: 2,
  },

  // 组织者徽章（如 JEN）
  organizerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 10,
  },

  organizerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // 标题 - 大号粗体白字，带阴影
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 地址行
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  location: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
