import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Product, ProductStatus } from '../../types/pointsMall';
import { PointsBadge } from './PointsBadge';
import { FavoriteButton } from './FavoriteButton';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HORIZONTAL_MARGIN = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - (CARD_HORIZONTAL_MARGIN * 2) - CARD_GAP) / 2;

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onFavoriteToggle: (product: Product) => void;
}

/**
 * ProductCard - 商品卡片组件
 *
 * 设计参考：Shopify商品卡片
 * - 商品图片（16:9比例）
 * - 积分徽章（左上角）
 * - 收藏按钮（右上角）
 * - 商品名称
 * - 积分价格
 * - 库存状态
 */
export const ProductCard: React.FC<ProductCardProps> = memo(
  ({ product, onPress, onFavoriteToggle }) => {
    const isOutOfStock = product.status === ProductStatus.OUT_OF_STOCK;

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress(product)}
        activeOpacity={0.8}
        disabled={isOutOfStock}
      >
        {/* 商品图片容器 */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.primaryImage }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* 缺货遮罩 */}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>已兑完</Text>
            </View>
          )}

          {/* 积分徽章 - 左上角 */}
          {product.earnPoints && (
            <PointsBadge
              points={product.pointsPrice}
              earnPercentage={product.earnPoints}
              style={styles.pointsBadge}
            />
          )}

          {/* 收藏按钮 - 右上角 */}
          <FavoriteButton
            isFavorite={product.isFavorite || false}
            onPress={() => onFavoriteToggle(product)}
            size={36}
            style={styles.favoriteButton}
          />
        </View>

        {/* 商品信息 */}
        <View style={styles.infoContainer}>
          {/* 商品名称 */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* 商品描述 */}
          <Text style={styles.productDescription} numberOfLines={1}>
            {product.description}
          </Text>

          {/* 价格信息 */}
          <View style={styles.priceContainer}>
            <Text style={styles.pointsPrice}>{product.pointsPrice}积分</Text>
            {product.marketPrice && (
              <Text style={styles.marketPrice}>
                ¥{product.marketPrice.toFixed(2)}
              </Text>
            )}
          </View>

          {/* 库存状态 */}
          {product.stock > 0 && product.stock <= 10 && (
            <Text style={styles.lowStockText}>
              仅剩{product.stock}件
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  // 图片区域
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.85, // 接近16:9比例
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // 积分徽章位置
  pointsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },

  // 收藏按钮位置
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // 信息区域
  infoContainer: {
    padding: 12,
  },

  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20,
  },

  productDescription: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
  },

  // 价格区域
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  pointsPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginRight: 8,
  },

  marketPrice: {
    fontSize: 13,
    color: '#999999',
    textDecorationLine: 'line-through',
  },

  lowStockText: {
    fontSize: 12,
    color: '#FF8E53',
    fontWeight: '500',
  },
});

export { CARD_WIDTH, CARD_GAP };
