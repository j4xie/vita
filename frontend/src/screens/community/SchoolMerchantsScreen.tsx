import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import merchantAPI, { Merchant } from '../../services/merchantAPI';
import { MerchantListCard } from '../../components/cards/MerchantListCard';
import { MerchantDetailModal } from '../../components/modals/MerchantDetailModal';
import { theme } from '../../theme';

interface RouteParams {
  schoolId: string;
  schoolName: string;
  deptId: number; // 学校ID（legacy）
  categoryId?: string;
  categoryName?: string;
  isRegionMode?: boolean; // 新增：是否为地区模式
}

export const SchoolMerchantsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { schoolId, schoolName, deptId, categoryId, categoryName, isRegionMode } = route.params as RouteParams;

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [merchantDetailVisible, setMerchantDetailVisible] = useState(false);

  // 从地址中提取地区名称（与 CommunityScreen 保持一致）
  const extractRegion = (address: string): string => {
    if (!address) return '未知地区';

    const districtMatch = address.match(/([^市]+市)?([^区县]+[区县])/);
    if (districtMatch) {
      return districtMatch[2];
    }

    const cityMatch = address.match(/([^省]+省)?([^市]+市)/);
    if (cityMatch) {
      return cityMatch[2];
    }

    return address.substring(0, 15);
  };

  // 加载商家数据
  useEffect(() => {
    loadMerchants();
  }, [deptId, categoryId, isRegionMode]);

  const loadMerchants = async () => {
    setLoading(true);
    console.log('🏪 [SchoolMerchantsScreen] 开始加载商家:', {
      schoolId,
      schoolName,
      deptId,
      categoryId,
      isRegionMode,
    });

    try {
      // 获取所有商家
      const allMerchants = await merchantAPI.getAllMerchants();

      console.log('✅ [SchoolMerchantsScreen] API返回商家数量:', allMerchants.length);

      // 如果是地区模式，按地区过滤
      let filteredMerchants = allMerchants;
      if (isRegionMode) {
        filteredMerchants = allMerchants.filter(merchant => {
          const region = extractRegion(merchant.merchantAddress || '');
          return region === schoolName; // schoolName 在地区模式下实际上是地区名称
        });
        console.log(`📍 [SchoolMerchantsScreen] 地区 "${schoolName}" 商家数量:`, filteredMerchants.length);
      }

      // 格式化商家数据（使用过滤后的列表）
      const formattedMerchants = filteredMerchants.map(merchant => ({
        ...merchant,
        id: merchant.id.toString(),
        name: merchant.merchantName || '未命名商家',
        location: merchant.merchantAddress || '',
        price: merchant.price || 'Contact for price',
        earnPoints: merchant.earnPoints || 1,
        image: merchant.shopImg || merchant.logo || merchant.businessLicense || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
        // 添加模拟的评分和销量数据（可根据实际API字段调整）
        rating: 4.5 + Math.random() * 0.5, // 4.5-5.0分
        monthSales: Math.floor(50 + Math.random() * 250), // 50-300销量
      }));

      // 如果有分类ID，过滤商家
      if (categoryId) {
        const filtered = formattedMerchants.filter(m => m.category === categoryId);
        console.log(`📋 [SchoolMerchantsScreen] 过滤后商家数量 (分类 ${categoryId}):`, filtered.length);
        setMerchants(filtered);
      } else {
        console.log('📋 [SchoolMerchantsScreen] 显示全部商家:', formattedMerchants.length);
        setMerchants(formattedMerchants);
      }
    } catch (error) {
      console.error('❌ [SchoolMerchantsScreen] 加载商家失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantPress = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setMerchantDetailVisible(true);
  };

  const renderMerchant = ({ item }: { item: any }) => (
    <MerchantListCard
      merchant={item}
      onPress={() => handleMerchantPress(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryName || schoolName}
          </Text>
          {categoryName && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {schoolName}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 商家数量提示 */}
      {!loading && merchants.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            共{merchants.length}家商家
          </Text>
          <View style={styles.statsDivider} />
          <Text style={styles.statsHint}>
            消费可赚积分
          </Text>
        </View>
      )}

      {/* 商家列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      ) : merchants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>
            {t('community.no_merchants', 'No merchants found')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={merchants}
          renderItem={renderMerchant}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 商家详情弹窗 */}
      <MerchantDetailModal
        visible={merchantDetailVisible}
        merchant={selectedMerchant}
        onClose={() => {
          setMerchantDetailVisible(false);
          setSelectedMerchant(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // 顶部导航
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  searchButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
  },

  // 统计栏
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF9E6',
  },

  statsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },

  statsDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#DDD',
    marginHorizontal: 12,
  },

  statsHint: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },

  // 商家列表
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },

  // 加载状态
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  // 空状态
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});
