import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Product, ProductCategory } from '../../types/pointsMall';
import { CategoryTabBar, Category } from '../../components/rewards/CategoryTabBar';
import { ProductGridCard } from '../../components/rewards/ProductGridCard';
import { pointsMallAPI } from '../../services/pointsMallAPI';
import { useUser } from '../../context/UserContext';

/**
 * PointsMallListScreen - 积分商城商品列表页
 *
 * 参考Apple Store设计：
 * - 顶部分类Tab
 * - 2列网格商品展示
 * - 下拉刷新
 * - 上拉加载更多
 * - 空状态提示
 */
export const PointsMallListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // 状态管理
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      const backendCategories = await pointsMallAPI.getCategories();

      const categoryList: Category[] = [
        {
          id: 'all',
          name: t('common.all', '全部'),
        },
        ...backendCategories.map(cat => ({
          id: cat.id.toString(),
          name: cat.catName,
        })),
      ];

      setCategories(categoryList);
    } catch (error) {
      console.error('❌ 加载分类失败:', error);
    }
  }, [t]);

  // 加载商品列表
  const loadProducts = useCallback(async (
    page: number = 1,
    categoryId?: string,
    isRefresh: boolean = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: any = {
        pageNum: page,
        pageSize: 10,
      };

      // 添加分类筛选
      if (categoryId && categoryId !== 'all') {
        params.classifyId = parseInt(categoryId);
      }

      const response = await pointsMallAPI.getProducts(params);

      if (isRefresh || page === 1) {
        setProducts(response.products);
      } else {
        setProducts(prev => [...prev, ...response.products]);
      }

      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('❌ 加载商品失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadCategories();
    loadProducts(1);
  }, []);

  // 切换分类
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    loadProducts(1, categoryId, false);
  }, [loadProducts]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    loadProducts(1, selectedCategoryId, true);
  }, [selectedCategoryId, loadProducts]);

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadProducts(currentPage + 1, selectedCategoryId, false);
    }
  }, [loadingMore, hasMore, loading, currentPage, selectedCategoryId, loadProducts]);

  // 切换收藏
  const handleToggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  // 进入商品详情
  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('PointsMallDetail', { productId: product.id });
  }, [navigation]);

  // 渲染商品卡片
  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductGridCard
      product={item}
      onPress={() => handleProductPress(item)}
      onFavorite={() => handleToggleFavorite(item.id)}
      isFavorite={favorites.has(item.id)}
    />
  ), [favorites, handleProductPress, handleToggleFavorite]);

  // 渲染列表尾部加载器
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#000000" />
      </View>
    );
  };

  // 渲染空状态
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyText}>
          {t('rewards.mall.no_products', '暂无商品')}
        </Text>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>
          {t('rewards.menu.points_mall', '积分商城')}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 分类标签栏 */}
      {categories.length > 0 && (
        <CategoryTabBar
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleCategoryChange}
        />
      )}

      {/* 商品列表 */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000000"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {loading && products.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },

  // 顶部导航
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F7',
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
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

  // 商品列表
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  row: {
    justifyContent: 'space-between',
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#86868B',
    marginTop: 16,
  },
});
