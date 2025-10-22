import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Product, ProductStatus } from '../../types/pointsMall';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import { ColorSelector } from '../../components/rewards/ColorSelector';
import { pointsMallAPI } from '../../services/pointsMallAPI';
import { useUser } from '../../context/UserContext';
import { LoaderOne } from '../../components/ui/LoaderOne';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * PointsMallDetailScreen - 商品详情页
 *
 * 参考Apple Store产品详情页：
 * - 大图轮播
 * - 商品标题
 * - 积分价格
 * - 颜色选择器
 * - 库存状态
 * - 商品描述
 * - 黑色大按钮兑换
 */
export const PointsMallDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user, refreshUserPoints } = useUser();

  const productId = route.params?.productId;

  // 状态管理
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 加载商品详情
  useEffect(() => {
    const loadProductDetail = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const productData = await pointsMallAPI.getProductDetail(productId);
        setProduct(productData);

        // 如果有规格，默认选中第一个有库存的
        if (productData.variants && productData.variants.length > 0) {
          const firstAvailable = productData.variants.find(v => v.stock > 0);
          if (firstAvailable) {
            setSelectedVariantId(firstAvailable.id);
          }
        }
      } catch (error) {
        console.error('❌ 加载商品详情失败:', error);
        Alert.alert(
          t('common.error', '错误'),
          t('rewards.mall.load_failed', '加载商品详情失败'),
          [
            {
              text: t('common.confirm', '确认'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    loadProductDetail();
  }, [productId, navigation, t]);

  // 切换收藏
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    // TODO: 保存到AsyncStorage
  }, []);

  // 处理兑换
  const handleExchange = useCallback(() => {
    if (!product) return;

    // 检查库存
    if (product.status === ProductStatus.OUT_OF_STOCK || product.stock === 0) {
      Alert.alert(
        t('common.error', '错误'),
        t('rewards.mall.out_of_stock', '商品已兑完')
      );
      return;
    }

    // 检查积分是否足够（TODO: 从用户信息获取实际积分）
    const userPoints = user?.points || 0;
    if (userPoints < product.pointsPrice) {
      Alert.alert(
        t('rewards.mall.insufficient_points', '积分不足'),
        t('rewards.mall.insufficient_points_desc', '您的积分不足以兑换此商品')
      );
      return;
    }

    // 跳转到订单确认页（选择地址、确认订单）
    navigation.navigate('OrderConfirmation', { product });
  }, [product, user, t, navigation]);

  // 库存状态
  const getStockText = () => {
    if (!product) return null;

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
    return {
      text: t('rewards.mall.stock_available', 'In Stock'),
      color: '#34C759',
    };
  };

  const stockStatus = getStockText();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoaderOne size="large" color="#000000" />
      </View>
    );
  }

  if (!product) {
    return null;
  }

  const canExchange = product.status === ProductStatus.AVAILABLE && product.stock > 0;

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 主滚动区域 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 商品图片 */}
        <View style={styles.imageSection}>
          <OptimizedImage
            source={{ uri: product.primaryImage, priority: 'high' }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* 商品信息 */}
        <View style={styles.infoSection}>
          {/* 商品标题 */}
          <Text style={styles.title}>{product.name}</Text>

          {/* 积分价格 */}
          <View style={styles.priceRow}>
            <Text style={styles.pointsPrice}>
              {product.pointsPrice.toLocaleString()}
            </Text>
            <Text style={styles.pointsLabel}>
              {' '}{t('rewards.menu.points', 'Points')}
            </Text>
          </View>

          {/* 市场价对比 */}
          {product.marketPrice && (
            <Text style={styles.marketPrice}>
              {t('rewards.mall.market_price', { price: product.marketPrice }, `Market Price $${product.marketPrice}`)}
            </Text>
          )}

          {/* 库存状态 */}
          {stockStatus && (
            <View style={styles.stockContainer}>
              <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
          )}

          {/* 颜色选择器 */}
          {product.variants && product.variants.length > 0 && (
            <View style={styles.variantsSection}>
              <ColorSelector
                variants={product.variants}
                selectedId={selectedVariantId}
                onSelect={setSelectedVariantId}
              />
            </View>
          )}

          {/* 配送信息 */}
          <View style={styles.deliverySection}>
            <View style={styles.deliveryRow}>
              <Ionicons name="location-outline" size={20} color="#86868B" />
              <Text style={styles.deliveryText}>
                {t('rewards.mall.delivery_info', 'Free Shipping | Delivery: In stock')}
              </Text>
            </View>
          </View>

          {/* 商品描述 */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>
                {t('rewards.mall.product_description', 'Product Description')}
              </Text>
              <Text style={styles.descriptionText}>
                {product.description}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部兑换按钮 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.exchangeButton,
            !canExchange && styles.exchangeButtonDisabled,
          ]}
          onPress={handleExchange}
          disabled={!canExchange}
          activeOpacity={0.8}
        >
          <Text style={styles.exchangeButtonText}>
            {canExchange
              ? t('rewards.mall.exchange_now', `Exchange (${product.pointsPrice.toLocaleString()} Points)`)
              : t('rewards.mall.out_of_stock', 'Out of Stock')
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  // 顶部导航
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },

  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },

  // 图片区域
  imageSection: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  // 信息区域
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
    lineHeight: 34,
    marginBottom: 12,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },

  pointsPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },

  pointsLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#86868B',
  },

  marketPrice: {
    fontSize: 15,
    fontWeight: '400',
    color: '#86868B',
    textDecorationLine: 'line-through',
    marginBottom: 16,
  },

  // 库存状态
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },

  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  stockText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // 规格选择区域
  variantsSection: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },

  // 配送信息
  deliverySection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },

  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  deliveryText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1D1D1F',
  },

  // 商品描述
  descriptionSection: {
    paddingVertical: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 12,
  },

  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1D1D1F',
    lineHeight: 22,
  },

  // 底部兑换按钮
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },

  exchangeButton: {
    backgroundColor: '#000000',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  exchangeButtonDisabled: {
    backgroundColor: '#E5E5E7',
  },

  exchangeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
