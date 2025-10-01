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
import { useSchoolData } from '../../hooks/useSchoolData';
import { LoaderOne } from '../../components/ui/LoaderOne';
import { FloatingSearchButton } from '../../components/navigation/FloatingSearchButton';
import { FloatingFilterButton } from '../../components/community/FloatingFilterButton';
import {
  CommunityMerchantFilterModal,
  MerchantFilterOptions,
} from '../../components/modals/CommunityMerchantFilterModal';
import merchantAPI, { Merchant } from '../../services/merchantAPI';
import { MerchantDetailModal } from '../../components/modals/MerchantDetailModal';

export const CommunityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { schools, loading: schoolsLoading, loadSchools } = useSchoolData();

  // 商家数据状态
  const [merchantsBySchool, setMerchantsBySchool] = useState<Record<string, Merchant[]>>({});
  const [loadingMerchants, setLoadingMerchants] = useState(false);

  // 调试日志
  React.useEffect(() => {
    console.log('🔍 [CommunityScreen] 数据状态:', {
      schoolsLoading,
      schoolsCount: schools.length,
      hasSchools: schools.length > 0,
      merchantsCount: Object.keys(merchantsBySchool).length,
    });
  }, [schoolsLoading, schools, merchantsBySchool]);

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
    selectedSchools: [],
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

  // 加载商家数据
  const loadMerchantsForSchools = useCallback(async () => {
    if (schools.length === 0) return;

    setLoadingMerchants(true);
    console.log('🏪 [CommunityScreen] 开始加载商家数据，学校数量:', schools.length);

    try {
      const merchantsData: Record<string, Merchant[]> = {};

      // 并行加载所有学校的商家
      const promises = schools.map(async (school) => {
        try {
          const merchants = await merchantAPI.getMerchantsBySchool(school.deptId);
          merchantsData[school.id] = merchants;
          console.log(`✅ [CommunityScreen] ${school.name} 商家数量:`, merchants.length);
        } catch (error) {
          console.warn(`⚠️ [CommunityScreen] ${school.name} 商家加载失败:`, error);
          merchantsData[school.id] = [];
        }
      });

      await Promise.all(promises);

      setMerchantsBySchool(merchantsData);
      console.log('✅ [CommunityScreen] 所有商家数据加载完成');
    } catch (error) {
      console.error('❌ [CommunityScreen] 加载商家数据失败:', error);
    } finally {
      setLoadingMerchants(false);
    }
  }, [schools]);

  // 学校加载完成后加载商家
  React.useEffect(() => {
    if (schools.length > 0 && Object.keys(merchantsBySchool).length === 0) {
      loadMerchantsForSchools();
    }
  }, [schools, merchantsBySchool, loadMerchantsForSchools]);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSchools();
    await loadMerchantsForSchools();
    setIsRefreshing(false);
  }, [loadSchools, loadMerchantsForSchools]);

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

  // View More 点击
  const handleViewMore = useCallback((schoolId: string) => {
    console.log('📋 View more for school:', schoolId);
    // TODO: 导航到学校商家列表
  }, []);

  // 商家类型转换为分类
  const getMerchantCategory = (merchantType?: number): string => {
    // 根据 merchantType 转换为分类
    // -1, 0, 1, 2 等可能代表不同类型
    switch (merchantType) {
      case 0: return 'restaurant';
      case 1: return 'cafe';
      case 2: return 'shopping';
      case 3: return 'fitness';
      case 4: return 'study';
      default: return 'food';
    }
  };

  // 应用筛选
  const applyFilters = useCallback((filters: MerchantFilterOptions) => {
    setCurrentFilters(filters);
    console.log('🔍 应用筛选:', filters);
  }, []);

  // 为每个学校生成分类数据（多样化图标和颜色）
  const iconColors = ['#FF3B30', '#FFD60A', '#34C759', '#007AFF', '#AF52DE', '#FF9500'];
  const icons = ['home', 'star', 'school', 'briefcase', 'cafe', 'gift'];

  // 生成并筛选分类数据 - 使用真实API数据
  const allCategories = schools.map((school, index) => {
    // 获取该学校的真实商家数据
    const schoolMerchants = merchantsBySchool[school.id] || [];

    // 转换API数据格式为UI所需格式
    const formattedMerchants = schoolMerchants.map(merchant => {
      // 调试：打印原始商家数据
      console.log('🏪 [数据映射] 商家原始数据:', {
        id: merchant.id,
        merchantName: merchant.merchantName,
        merchantAddress: merchant.merchantAddress,
        logo: merchant.logo,
        shopImg: merchant.shopImg,
        merchantType: merchant.merchantType,
      });

      return {
        id: merchant.id.toString(),
        name: merchant.merchantName || '未命名商家', // 使用 merchantName 字段
        location: merchant.merchantAddress || '', // 使用 merchantAddress 字段
        price: merchant.price || 'Contact for price', // 价格信息
        earnPoints: merchant.earnPoints || 1, // 积分
        image: merchant.shopImg || merchant.logo || merchant.businessLicense || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
        category: getMerchantCategory(merchant.merchantType), // 根据类型转换分类
      };
    });

    return {
      id: school.id,
      name: school.name,
      icon: icons[index % icons.length],
      iconColor: iconColors[index % iconColors.length],
      merchants: formattedMerchants,
    };
  });

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

  return (
    <View style={styles.wrapper}>
      {/* 设置状态栏为深色内容 */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 顶部导航栏 - 只有标题 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>{t('community.merchantCommunityTitle', '商家社区')}</Text>
      </View>

      {/* 主内容区 - 设置背景色 */}
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
        {(schoolsLoading && schools.length === 0) || loadingMerchants ? (
          // 加载状态 - 使用 LoaderOne 组件
          <View style={styles.loadingContainer}>
            <LoaderOne size="large" color="#D4A054" />
            <Text style={styles.loadingText}>
              {schoolsLoading ? 'Loading schools...' : 'Loading merchants...'}
            </Text>
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
            <Text style={styles.emptyText}>No schools available</Text>
          </View>
        )}

        {/* 底部品牌标识区域 - 只在有数据且无搜索时显示 */}
        {categories.length > 0 && !searchText.trim() && (
        <View style={styles.footerBrand}>
          <View style={styles.brandIconContainer}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>P</Text>
            </View>
            <Text style={styles.brandName}>PomeloX</Text>
          </View>

          <View style={styles.curatedByContainer}>
            <Text style={styles.curatedByText}>curated by</Text>
            <View style={styles.mobbinLogo}>
              <Text style={styles.mobbinText}>PomeloX Team</Text>
            </View>
          </View>
        </View>
        )}
        </ScrollView>
      </View>

      {/* 浮动搜索按钮 - 参考 Explore 页面 */}
      <FloatingSearchButton />

      {/* 浮动筛选按钮 - 在搜索按钮下方 */}
      <FloatingFilterButton
        bottom={insets.bottom + 78 + 44 + 12} // TabBar上方 + 搜索按钮高度 + 间距
        onPress={() => setFilterModalVisible(true)}
      />

      {/* 筛选模态框 */}
      <CommunityMerchantFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={applyFilters}
        initialFilters={currentFilters}
        schools={schools.map(s => ({ id: s.id, name: s.name }))}
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
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 整个页面背景白色
  },

  // 顶部导航栏 - 只有标题
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
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

  // 底部品牌标识区域
  footerBrand: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 40,
  },

  brandIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#D4A054',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  brandIconText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  brandName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  curatedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  curatedByText: {
    fontSize: 11,
    color: '#999',
  },

  mobbinLogo: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },

  mobbinText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
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
    paddingVertical: 60,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
