import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { CategoryRow } from '../../components/community/CategoryRow';
import { LoaderOne } from '../../components/ui/LoaderOne';
import { FloatingSearchButton } from '../../components/navigation/FloatingSearchButton';
import { FloatingFilterButton } from '../../components/community/FloatingFilterButton';
import {
  CommunityMerchantFilterModal,
  MerchantFilterOptions,
} from '../../components/modals/CommunityMerchantFilterModal';
import merchantAPI, { Merchant } from '../../services/merchantAPI';
import { MerchantDetailModal } from '../../components/modals/MerchantDetailModal';
import { useUser } from '../../context/UserContext';
import { getCurrentToken } from '../../services/authAPI';

export const CommunityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, permissions } = useUser();
  const isMerchant = permissions.isMerchant();

  // 商家数据状态 - 改为直接存储所有商家
  const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(false);
  const [authError, setAuthError] = useState(false); // 认证错误状态

  // 调试日志
  React.useEffect(() => {
    console.log('🔍 [CommunityScreen] 数据状态:', {
      loadingMerchants,
      merchantsCount: allMerchants.length,
      hasMerchants: allMerchants.length > 0,
    });
  }, [loadingMerchants, allMerchants]);

  // 状态管理
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [merchantDetailVisible, setMerchantDetailVisible] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<MerchantFilterOptions>({
    category: null,
    priceRange: 'all',
    sortBy: 'points-high',
    selectedSchools: [], // 保留以支持筛选模态框
    selectedMerchantTypes: [],
  });

  // 监听搜索文本变化
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'searchTextChanged',
      (data: { searchText: string }) => {
        setSearchText(data.searchText);
        console.log('🔍 搜索文本:', data.searchText);

        // 有搜索文本时，滚动到顶部
        if (data.searchText.trim() && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }
    );

    return () => subscription.remove();
  }, []);

  // 加载所有商家数据
  const loadMerchants = useCallback(async () => {
    // 检查登录状态
    const token = await getCurrentToken();
    if (!token) {
      console.warn('⚠️ [CommunityScreen] 用户未登录，无法加载商家数据');
      setAuthError(true);
      setLoadingMerchants(false);
      return;
    }

    setAuthError(false);
    setLoadingMerchants(true);
    console.log('🏪 [CommunityScreen] 开始加载所有商家数据...');

    try {
      const merchants = await merchantAPI.getAllMerchants();
      setAllMerchants(merchants);
      setAuthError(false);
      console.log(`✅ [CommunityScreen] 成功加载 ${merchants.length} 个商家`);
    } catch (error: any) {
      console.error('❌ [CommunityScreen] 加载商家数据失败:', error);

      // 检查是否为认证错误
      if (
        error.message?.includes('AUTH_FAILED') ||
        error.message?.includes('认证失败') ||
        error.message?.includes('无法访问系统资源')
      ) {
        console.warn('⚠️ [CommunityScreen] Token已过期或无效，需要重新登录');

        // 清除过期的token
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.multiRemove(['@pomelox_token', '@pomelox_user_id']);
          console.log('🗑️ [CommunityScreen] 已清除过期token');
        } catch (clearError) {
          console.error('清除token失败:', clearError);
        }

        setAuthError(true);
      }

      setAllMerchants([]);
    } finally {
      setLoadingMerchants(false);
    }
  }, []);

  // 组件加载时获取商家数据
  React.useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMerchants();
    setIsRefreshing(false);
  }, [loadMerchants]);

  // 商家类型转换为分类（必须在useMemo之前定义）
  const getMerchantCategory = useCallback((merchantType?: number): string => {
    switch (merchantType) {
      case 0: return 'restaurant';
      case 1: return 'cafe';
      case 2: return 'shopping';
      case 3: return 'fitness';
      case 4: return 'study';
      default: return 'food';
    }
  }, []);

  // 从地址中提取地区名称
  const extractRegion = useCallback((address: string): string => {
    if (!address) return '未知地区';

    // 匹配常见的中国地区模式：XX市XX区
    const districtMatch = address.match(/([^市]+市)?([^区县]+[区县])/);
    if (districtMatch) {
      // 返回区/县名称，如 "闵行区"、"徐汇区"
      return districtMatch[2];
    }

    // 如果没有匹配到区，尝试匹配市
    const cityMatch = address.match(/([^省]+省)?([^市]+市)/);
    if (cityMatch) {
      return cityMatch[2];
    }

    // 如果都没匹配到，返回前15个字符作为地区
    return address.substring(0, 15);
  }, []);

  // 为每个地区生成分类数据（多样化图标和颜色）
  const iconColors = ['#FF3B30', '#FFD60A', '#34C759', '#007AFF', '#AF52DE', '#FF9500'];
  const icons = ['location', 'business', 'storefront', 'restaurant', 'cafe', 'cart'];

  // 按地区分组并生成分类数据 - 使用真实API数据
  const allCategories = React.useMemo(() => {
    // 按地区分组商家
    const merchantsByRegion: Record<string, Merchant[]> = {};

    allMerchants.forEach(merchant => {
      const region = extractRegion(merchant.merchantAddress || '');
      if (!merchantsByRegion[region]) {
        merchantsByRegion[region] = [];
      }
      merchantsByRegion[region].push(merchant);
    });

    console.log('📍 [CommunityScreen] 地区分组结果:', {
      totalMerchants: allMerchants.length,
      regions: Object.keys(merchantsByRegion),
      merchantsByRegion: Object.entries(merchantsByRegion).map(([region, merchants]) => ({
        region,
        count: merchants.length,
      })),
    });

    // 转换为UI所需的分类格式
    return Object.entries(merchantsByRegion).map(([region, merchants], index) => {
      const formattedMerchants = merchants.map(merchant => {
        return {
          id: merchant.id.toString(),
          name: merchant.merchantName || '未命名商家',
          location: merchant.merchantAddress || '',
          price: merchant.price || 'Contact for price',
          earnPoints: merchant.earnPoints || 1,
          image: merchant.shopImg || merchant.logo || merchant.businessLicense || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
          category: getMerchantCategory(merchant.merchantType),
        };
      });

      return {
        id: region,
        name: region,
        icon: icons[index % icons.length],
        iconColor: iconColors[index % iconColors.length],
        merchants: formattedMerchants,
      };
    });
  }, [allMerchants, getMerchantCategory, extractRegion]);

  // 商家卡片点击 - 打开商家详情和优惠券
  const handleMerchantPress = useCallback((merchantId: string) => {
    console.log('🏪 Merchant pressed:', merchantId);

    // 从所有分类中找到该商家
    let foundMerchant = null;
    for (const category of allCategories) {
      const merchant = category.merchants.find(m => m.id === merchantId);
      if (merchant) {
        foundMerchant = merchant;
        break;
      }
    }

    if (foundMerchant) {
      setSelectedMerchant(foundMerchant);
      setMerchantDetailVisible(true);
    }
  }, [allCategories]);

  // View More 点击 - 按地区查看更多商家
  const handleViewMore = useCallback((categoryId: string) => {
    console.log('📋 View more for region:', categoryId);

    // 找到对应的地区分类
    const category = allCategories.find(cat => cat.id === categoryId);
    if (!category) {
      console.error('❌ Region category not found:', categoryId);
      return;
    }

    console.log('📍 导航到地区商家列表:', {
      regionName: category.name,
      merchantCount: category.merchants.length,
    });

    // 导航到地区商家列表页面（复用 SchoolMerchants 屏幕）
    // 传递地区名称而不是 deptId
    navigation.navigate('SchoolMerchants', {
      schoolId: category.id,
      schoolName: category.name,
      deptId: -1, // 标记为地区模式，不是学校模式
      isRegionMode: true, // 新增标志位，表示按地区显示
    });
  }, [navigation, allCategories]);

  // 应用筛选
  const applyFilters = useCallback((filters: MerchantFilterOptions) => {
    setCurrentFilters(filters);
    console.log('🔍 应用筛选:', filters);
  }, []);

  // 应用搜索和筛选
  const categories = React.useMemo(() => {
    let filtered = [...allCategories];

    // 1. 搜索文本筛选
    if (searchText.trim()) {
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(searchText.toLowerCase()) ||
        cat.merchants.some(m => m.name.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // 2. 学校筛选
    if (currentFilters.selectedSchools.length > 0) {
      filtered = filtered.filter(cat =>
        currentFilters.selectedSchools.includes(cat.id)
      );
    }

    // 3. 筛选每个分类中的商家
    filtered = filtered.map(cat => ({
      ...cat,
      merchants: cat.merchants.filter(merchant => {
        // 商家类型筛选
        if (currentFilters.selectedMerchantTypes.length > 0) {
          if (!currentFilters.selectedMerchantTypes.includes(merchant.category || '')) {
            return false;
          }
        }

        // 类别筛选（兼容旧逻辑）
        if (currentFilters.category && merchant.category !== currentFilters.category) {
          return false;
        }

        // 价格筛选
        if (currentFilters.priceRange !== 'all') {
          const priceMatch = merchant.price?.match(/\d+/);
          const price = priceMatch ? parseInt(priceMatch[0]) : 0;

          switch (currentFilters.priceRange) {
            case 'free':
              if (price > 0) return false;
              break;
            case 'under-10':
              if (price >= 10) return false;
              break;
            case '10-30':
              if (price < 10 || price > 30) return false;
              break;
            case '30-50':
              if (price < 30 || price > 50) return false;
              break;
            case '50-plus':
              if (price < 50) return false;
              break;
          }
        }

        return true;
      }).sort((a, b) => {
        // 排序
        switch (currentFilters.sortBy) {
          case 'points-high':
            return (b.earnPoints || 0) - (a.earnPoints || 0);
          case 'points-low':
            return (a.earnPoints || 0) - (b.earnPoints || 0);
          case 'price-low':
          case 'price-high':
            const priceA = parseInt(a.price?.match(/\d+/)?.[0] || '0');
            const priceB = parseInt(b.price?.match(/\d+/)?.[0] || '0');
            return currentFilters.sortBy === 'price-low' ? priceA - priceB : priceB - priceA;
          default:
            return 0;
        }
      }),
    })).filter(cat => cat.merchants.length > 0); // 移除没有商家的分类

    return filtered;
  }, [allCategories, searchText, currentFilters]);

  // 商家用户视图 - 显示管理面板
  if (isMerchant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* 商家管理视图 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('merchant.management', '商家管理')}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* 商家信息卡片 */}
          <View style={styles.merchantDashboard}>
            <View style={styles.welcomeCard}>
              <Ionicons name="storefront" size={48} color="#D4A054" />
              <Text style={styles.welcomeTitle}>
                {t('merchant.welcome', '欢迎回来')}
              </Text>
              <Text style={styles.merchantName}>
                {user?.legalName || user?.userName || t('merchant.merchant_user', '商家用户')}
              </Text>
            </View>

            {/* 快速操作按钮 */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('MerchantScan' as never)}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="qr-code-outline" size={28} color="#D4A054" />
                </View>
                <Text style={styles.actionButtonText}>
                  {t('merchant.scan_coupon', '扫码核销')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('MerchantRecords' as never)}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="receipt-outline" size={28} color="#D4A054" />
                </View>
                <Text style={styles.actionButtonText}>
                  {t('merchant.records', '核销记录')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('MerchantStats' as never)}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="stats-chart-outline" size={28} color="#D4A054" />
                </View>
                <Text style={styles.actionButtonText}>
                  {t('merchant.statistics', '统计数据')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 提示信息 */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                {t('merchant.info', '您可以在此管理商家优惠券和查看核销记录')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 普通用户视图 - 显示商家列表
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 设置状态栏为深色内容 */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 顶部导航栏 - 只有标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('community.merchantCommunityTitle', '商家社区')}</Text>
      </View>

      {/* 主内容区 - 设置背景色 */}
      <View style={styles.wrapper}>
        <View style={styles.scrollViewWrapper}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#D4A054"
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
        >
        {/* 分类列表 */}
        {loadingMerchants ? (
          // 加载状态 - 使用 LoaderOne 组件
          <View style={styles.loadingContainer}>
            <LoaderOne size="large" color="#D4A054" />
            <Text style={styles.loadingText}>
              {t('community.loading_merchants', '加载商家中...')}
            </Text>
          </View>
        ) : authError ? (
          // 认证错误 - 需要登录或登录已过期
          <View style={styles.emptyContainer}>
            <Ionicons name="lock-closed-outline" size={80} color="#D4A054" />
            <Text style={styles.emptyTitle}>
              {user ? t('community.session_expired', '登录已过期') : t('auth.login_required', '请先登录')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {user
                ? t('community.session_expired_message', '您的登录已过期，请重新登录以继续浏览')
                : t('community.login_required_message', '登录后即可浏览商家优惠信息')
              }
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.loginButtonText}>
                {user ? t('auth.relogin', '重新登录') : t('auth.login.login_button', '登录')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : categories.length > 0 ? (
          // 有数据时显示分类
          categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onMerchantPress={handleMerchantPress}
              onViewMore={() => handleViewMore(category.id)}
            />
          ))
        ) : (
          // 无数据时的空状态
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={80} color="#CCC" />
            <Text style={styles.emptyTitle}>
              {t('community.no_merchants_title', '暂无商家')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('community.no_merchants_subtitle', '目前还没有商家入驻，敬请期待')}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>
                {t('common.retry', '重试')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        </ScrollView>
        </View>

        {/* 浮动搜索按钮 - 只在有商家数据时显示 */}
        {!authError && !loadingMerchants && categories.length > 0 && (
          <FloatingSearchButton />
        )}

        {/* 浮动筛选按钮 - 只在有商家数据时显示 */}
        {!authError && !loadingMerchants && categories.length > 0 && (
          <FloatingFilterButton
            bottom={insets.bottom + 78 + 44 + 12} // TabBar上方 + 搜索按钮高度 + 间距
            onPress={() => setFilterModalVisible(true)}
          />
        )}

        {/* 筛选模态框 */}
        <CommunityMerchantFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={applyFilters}
          initialFilters={currentFilters}
          schools={[]} // 不再按学校筛选，传递空数组
        />

        {/* 商家详情模态框 - 显示优惠券和核销功能 */}
        <MerchantDetailModal
          visible={merchantDetailVisible}
          onClose={() => {
            setMerchantDetailVisible(false);
            setSelectedMerchant(null);
          }}
          merchant={selectedMerchant}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // 顶部导航栏 - 只有标题
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // ScrollView 外层容器
  scrollViewWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // 滚动区域
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
  },

  // 加载和空状态
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },

  loadingText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },

  emptyContainer: {
    flex: 1,
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
  },

  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#D4A054',
    borderRadius: 24,
  },

  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  loginButton: {
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 14,
    backgroundColor: '#D4A054',
    borderRadius: 24,
    shadowColor: '#D4A054',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // 商家管理视图样式
  merchantDashboard: {
    padding: 20,
  },

  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },

  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },

  merchantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D4A054',
    marginTop: 8,
  },

  quickActions: {
    gap: 16,
  },

  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});
