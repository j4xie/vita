import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '../common/OptimizedImage';
import { LoaderOne } from '../ui/LoaderOne';

const CARD_WIDTH = 280;
const CARD_HEIGHT = 360;
const IMAGE_HEIGHT = 200;

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
      activeOpacity={0.95}
    >
      {/* 顶部图片区域 */}
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
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#CCC" />
          </View>
        )}
      </View>

      {/* 底部信息区 - 白色背景 */}
      <View style={styles.infoContainer}>
        {/* 商家名称 */}
        <Text style={styles.title} numberOfLines={2}>
          {merchant.name}
        </Text>

        {/* Earn 标签 + Q logo + 数字选择器 */}
        <View style={styles.earnContainer}>
          <View style={styles.earnBadge}>
            <Text style={styles.earnText}>{t('community.earn', 'Earn')}</Text>
          </View>

          <View style={styles.qPointsContainer}>
            <View style={styles.qLogo}>
              <Text style={styles.qLogoText}>Q</Text>
            </View>
            <Text style={styles.pointsNumber}>{merchant.earnPoints || 1}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </View>

        {/* 地址 */}
        <Text style={styles.location} numberOfLines={1}>
          {merchant.location}
        </Text>

        {/* 价格 */}
        {merchant.price && (
          <Text style={styles.price} numberOfLines={1}>
            {merchant.price}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // 图片区域
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
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
    backgroundColor: '#F5F5F5',
  },

  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },

  // 底部信息区 - 白色背景
  infoContainer: {
    flex: 1,
    padding: 12,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  // 商家名称
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 10,
  },

  // Earn 容器
  earnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Earn 标签
  earnBadge: {
    backgroundColor: '#D4A054',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },

  earnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Q Points 容器
  qPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    gap: 6,
  },

  // Q Logo
  qLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qLogoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  pointsNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // 地址
  location: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },

  // 价格
  price: {
    fontSize: 11,
    color: '#999',
  },
});
