import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Product, ProductStatus } from '../../types/pointsMall';
import { OptimizedImage } from '../common/OptimizedImage';
import { LoaderOne } from '../ui/LoaderOne';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_MARGIN) / 2;

interface ProductGridCardProps {
  product: Product;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

/**
 * ProductGridCard - 积分商城商品网格卡片
 *
 * 参考Apple Store设计：
 * - 2列网格布局
 * - 白色卡片背景
 * - 大图优先
 * - 简洁信息展示
 * - 右上角收藏按钮
 */
export const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  onPress,
  onFavorite,
  isFavorite = false,
}) => {
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);

  // 库存状态文字
  const getStockStatus = () => {
    if (product.status === ProductStatus.OUT_OF_STOCK || product.stock === 0) {
      return {
        text: t('rewards.mall.out_of_stock', 'Out of Stock'),
        color: '#FF3B30',
      };
    }
    if (product.stock <= 5) {
      return {
        text: t('rewards.mall.low_stock', { count: product.stock }, `Only ${product.stock} left`),
        color: '#FF9500',
      };
    }
    return null;
  };

  const stockStatus = getStockStatus();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        {/* 收藏按钮 */}
        {onFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>
        )}

        {/* 商品图片 */}
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={{ uri: product.primaryImage, priority: 'normal' }}
            style={styles.image}
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View style={styles.imageLoadingContainer}>
              <LoaderOne size="small" color="#666" />
            </View>
          )}
        </View>

        {/* 商品信息 */}
        <View style={styles.infoContainer}>
          {/* 商品标题 */}
          <Text style={styles.title} numberOfLines={2}>
            {product.name}
          </Text>

          {/* 库存状态 */}
          {stockStatus && (
            <Text style={[styles.stockStatus, { color: stockStatus.color }]}>
              {stockStatus.text}
            </Text>
          )}

          {/* 积分价格 */}
          <View style={styles.priceContainer}>
            <Text style={styles.pointsPrice}>
              {product.pointsPrice.toLocaleString()}
            </Text>
            <Text style={styles.pointsLabel}>
              {' '}{t('rewards.menu.points', 'Points')}
            </Text>
          </View>

          {/* 市场价对比（如有） */}
          {product.marketPrice && (
            <Text style={styles.marketPrice}>
              {t('rewards.mall.market_price', { price: product.marketPrice }, `$${product.marketPrice}`)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: CARD_MARGIN,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
  },

  imageContainer: {
    width: '100%',
    aspectRatio: 1, // 1:1正方形
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },

  infoContainer: {
    padding: 12,
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
    lineHeight: 20,
    marginBottom: 4,
  },

  stockStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },

  pointsPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },

  pointsLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#86868B',
  },

  marketPrice: {
    fontSize: 12,
    fontWeight: '400',
    color: '#86868B',
    marginTop: 2,
    textDecorationLine: 'line-through',
  },
});
