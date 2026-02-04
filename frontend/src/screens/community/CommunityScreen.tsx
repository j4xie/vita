import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  DeviceEventEmitter,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useSchoolData } from '../../hooks/useSchoolData';
import { LoaderOne } from '../../components/ui/LoaderOne';
import {
  CommunityMerchantFilterModal,
  MerchantFilterOptions,
} from '../../components/modals/CommunityMerchantFilterModal';
import merchantAPI, { Merchant } from '../../services/merchantAPI';
import { MerchantDetailModal } from '../../components/modals/MerchantDetailModal';
import { CommunityMerchantCard } from '../../components/cards/CommunityMerchantCard';
import LocationService, { LocationData } from '../../services/LocationService';

const { width: screenWidth } = Dimensions.get('window');

// 学校坐标数据 (纬度, 经度)
const SCHOOL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ucb': { lat: 37.8719, lng: -122.2585 },    // UC Berkeley
  'ucd': { lat: 38.5382, lng: -121.7617 },    // UC Davis
  'uci': { lat: 33.6405, lng: -117.8443 },    // UC Irvine
  'ucla': { lat: 34.0689, lng: -118.4452 },   // UCLA
  'ucsb': { lat: 34.4140, lng: -119.8489 },   // UC Santa Barbara
  'ucsc': { lat: 36.9914, lng: -122.0609 },   // UC Santa Cruz
  'ucsd': { lat: 32.8801, lng: -117.2340 },   // UC San Diego
  'umn': { lat: 44.9778, lng: -93.2650 },     // University of Minnesota
  'usc': { lat: 34.0224, lng: -118.2851 },    // USC
  'uw': { lat: 47.6553, lng: -122.3035 },     // University of Washington
  'nyu': { lat: 40.7295, lng: -73.9965 },     // NYU
  'cornell': { lat: 42.4534, lng: -76.4735 }, // Cornell
  'rutgers': { lat: 40.5008, lng: -74.4474 }, // Rutgers
};

// 100 英里 = 160934 米
const MAX_DISTANCE_METERS = 160934;

// 计算两点之间的距离（米）
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 获取学校坐标（通过缩写名匹配）
const getSchoolCoordinates = (aprName?: string | null): { lat: number; lng: number } | null => {
  if (!aprName) return null;
  const key = aprName.toLowerCase();
  return SCHOOL_COORDINATES[key] || null;
};

export const CommunityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const { schools: allSchools, loading: schoolsLoading, loadSchools } = useSchoolData();

  // 用户位置
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // 获取用户位置
  useEffect(() => {
    const fetchLocation = async () => {
      setLocationLoading(true);
      try {
        const location = await LocationService.getCurrentLocation({ useCache: true });
        setUserLocation(location);
        console.log('📍 [CommunityScreen] 用户位置:', location);
      } catch (error) {
        console.warn('⚠️ [CommunityScreen] 获取位置失败:', error);
      } finally {
        setLocationLoading(false);
      }
    };
    fetchLocation();
  }, []);

  // 过滤学校：排除总部，并基于位置筛选 100 英里内的学校
  const nearbySchools = React.useMemo(() => {
    // 1. 过滤掉非学校机构
    let filtered = allSchools.filter(school => {
      const name = school.name.toLowerCase();
      const isHeadquarters =
        name.includes('hq') ||
        name.includes('headquarters') ||
        name.includes('总部') ||
        school.parentId === 0 ||
        school.parentId === 100;
      return !isHeadquarters;
    });

    // 2. 如果有用户位置，基于距离筛选
    if (userLocation) {
      filtered = filtered.filter(school => {
        const coords = getSchoolCoordinates(school.aprName);
        if (!coords) {
          // 没有坐标的学校，默认显示用户所属学校
          return user?.deptId?.toString() === school.deptId.toString();
        }
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          coords.lat,
          coords.lng
        );
        return distance <= MAX_DISTANCE_METERS;
      });

      // 如果没有找到附近学校，至少显示用户所属学校
      if (filtered.length === 0 && user?.deptId) {
        const userSchool = allSchools.find(s => s.deptId.toString() === user.deptId?.toString());
        if (userSchool) {
          filtered = [userSchool];
        }
      }
    }

    console.log('🏫 [CommunityScreen] 附近学校:', filtered.map(s => s.aprName || s.name));
    return filtered;
  }, [allSchools, userLocation, user?.deptId]);

  // 商家数据状态
  const [merchantsBySchool, setMerchantsBySchool] = useState<Record<string, Merchant[]>>({});
  const [loadingMerchants, setLoadingMerchants] = useState(false);

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
  const merchantsLoadedRef = React.useRef(false);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'searchTextChanged',
      (data: { searchText: string }) => {
        setSearchText(data.searchText);
      }
    );
    return () => subscription.remove();
  }, []);

  // 加载商家数据 - 只加载附近学校的商家
  const loadMerchantsForSchools = useCallback(async () => {
    if (nearbySchools.length === 0) return;

    setLoadingMerchants(true);
    console.log('🏪 [CommunityScreen] 开始加载商家数据，学校数量:', nearbySchools.length);

    try {
      const merchantsData: Record<string, Merchant[]> = {};

      const promises = nearbySchools.map(async (school) => {
        try {
          const merchants = await merchantAPI.getMerchantsBySchool(school.deptId);
          merchantsData[school.id] = merchants;
          console.log(`✅ [CommunityScreen] ${school.aprName || school.name} 商家数量:`, merchants.length);
        } catch (error) {
          console.warn(`⚠️ [CommunityScreen] ${school.name} 商家加载失败:`, error);
          merchantsData[school.id] = [];
        }
      });

      await Promise.all(promises);
      setMerchantsBySchool(merchantsData);
    } catch (error) {
      console.error('❌ [CommunityScreen] 加载商家数据失败:', error);
    } finally {
      setLoadingMerchants(false);
    }
  }, [nearbySchools]);

  // 当附近学校列表变化时加载商家
  useEffect(() => {
    if (merchantsLoadedRef.current) return;
    if (nearbySchools.length > 0 && !locationLoading) {
      merchantsLoadedRef.current = true;
      loadMerchantsForSchools();
    }
  }, [nearbySchools, locationLoading]);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    merchantsLoadedRef.current = false;
    await loadSchools();
    await loadMerchantsForSchools();
    setIsRefreshing(false);
  }, [loadSchools, loadMerchantsForSchools]);

  // 商家类型转换 (移到 useMemo 之前避免 hoisting 问题)
  const getMerchantCategory = (merchantType?: number): string => {
    switch (merchantType) {
      case 0: return 'restaurant';
      case 1: return 'cafe';
      case 2: return 'shopping';
      case 3: return 'fitness';
      case 4: return 'study';
      default: return 'food';
    }
  };

  // 合并所有商家为平铺列表
  const allMerchants = React.useMemo(() => {
    let merchants: any[] = [];

    // 确定要显示的学校（Filter 选中的学校或附近学校）
    const schoolsToShow = currentFilters.selectedSchools.length > 0
      ? nearbySchools.filter(s => currentFilters.selectedSchools.includes(s.id))
      : nearbySchools;

    // 合并所有学校的商家
    schoolsToShow.forEach(school => {
      const schoolMerchants = merchantsBySchool[school.id] || [];
      schoolMerchants.forEach((merchant, index) => {
        merchants.push({
          id: `${school.id}-${merchant.id}-${index}`, // 🔧 组合学校ID、商家ID和索引确保唯一
          merchantId: merchant.id, // 保留原始商家ID用于API调用
          title: merchant.merchantName || '未命名商家',
          name: merchant.merchantName || '未命名商家',
          location: merchant.merchantAddress || '',
          image: merchant.shopImg || merchant.logo || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
          earnPoints: merchant.earnPoints || 1,
          schoolName: school.aprName || school.shortName || school.name,
          schoolId: school.id,
          category: getMerchantCategory(merchant.merchantType),
        });
      });
    });

    // 搜索筛选
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      merchants = merchants.filter(m =>
        m.title.toLowerCase().includes(search) ||
        m.location.toLowerCase().includes(search) ||
        m.schoolName?.toLowerCase().includes(search)
      );
    }

    // 商家类型筛选
    if (currentFilters.selectedMerchantTypes.length > 0) {
      merchants = merchants.filter(m =>
        currentFilters.selectedMerchantTypes.includes(m.category)
      );
    }

    // 积分范围筛选
    if (currentFilters.priceRange !== 'all') {
      merchants = merchants.filter(m => {
        const points = m.earnPoints || 0;
        switch (currentFilters.priceRange) {
          case 'free': return points === 0;
          case 'under-10': return points < 10;
          case '10-30': return points >= 10 && points <= 30;
          case '30-50': return points >= 30 && points <= 50;
          case '50-plus': return points >= 50;
          default: return true;
        }
      });
    }

    // 排序
    merchants.sort((a, b) => {
      switch (currentFilters.sortBy) {
        case 'points-high': return (b.earnPoints || 0) - (a.earnPoints || 0);
        case 'points-low': return (a.earnPoints || 0) - (b.earnPoints || 0);
        default: return 0;
      }
    });

    return merchants;
  }, [nearbySchools, merchantsBySchool, currentFilters, searchText, getMerchantCategory]);

  // 商家卡片点击
  const handleMerchantPress = useCallback((merchant: any) => {
    setSelectedMerchant(merchant);
    setMerchantDetailVisible(true);
  }, []);

  // 应用筛选
  const applyFilters = useCallback((filters: MerchantFilterOptions) => {
    setCurrentFilters(filters);
    console.log('🔍 应用筛选:', filters);
  }, []);

  // 渲染商家卡片
  const renderMerchantItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.merchantItemWrapper, index % 2 === 1 && styles.merchantItemRight]}>
      <CommunityMerchantCard
        merchant={item}
        onPress={() => handleMerchantPress(item)}
      />
    </View>
  );

  // 计算位置提示文字
  const locationHint = React.useMemo(() => {
    if (locationLoading) return t('community.locating', 'Locating...');
    if (!userLocation) return t('community.locationUnavailable', 'Location unavailable');
    if (nearbySchools.length === 0) return t('community.noNearbySchools', 'No schools nearby');
    return `${nearbySchools.length} ${t('community.schoolsNearby', 'schools within 100 miles')}`;
  }, [locationLoading, userLocation, nearbySchools.length, t]);

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Merchant</Text>
            <Text style={styles.headerTitleBold}>Community</Text>
            {/* 位置提示 */}
            <View style={styles.locationHint}>
              <Ionicons name="location-outline" size={12} color="#999" />
              <Text style={styles.locationHintText}>{locationHint}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.circleIconButton} onPress={() => setFilterModalVisible(true)}>
              <Ionicons name="options-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 主内容区 */}
      <View style={styles.scrollViewWrapper}>
        {!user ? (
          // 未登录状态
          <View style={styles.loginPromptContainer}>
            <View style={styles.loginPromptIcon}>
              <Ionicons name="storefront-outline" size={48} color="#FF7763" />
            </View>
            <Text style={styles.loginPromptTitle}>{t('community.loginRequired.title')}</Text>
            <Text style={styles.loginPromptDesc}>{t('community.loginRequired.description')}</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>{t('community.loginRequired.button')}</Text>
            </TouchableOpacity>
          </View>
        ) : (schoolsLoading && allSchools.length === 0) || loadingMerchants || locationLoading ? (
          <View style={styles.loadingContainer}>
            <LoaderOne size="large" color="#FF7763" />
            <Text style={styles.loadingText}>
              {locationLoading ? t('community.locating', 'Getting location...') : t('community.loadingMerchants', 'Loading merchants...')}
            </Text>
          </View>
        ) : allMerchants.length > 0 ? (
          <FlatList
            data={allMerchants}
            renderItem={renderMerchantItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.merchantListContent,
              { paddingBottom: insets.bottom + 100 }
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#FF7763"
              />
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#FF7763"
              />
            }
          >
            <View style={styles.emptyStateIcon}>
              <Ionicons name="storefront-outline" size={48} color="#CCCCCC" />
            </View>
            <Text style={styles.emptyStateText}>{t('community.noMerchants', 'No merchants yet')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('community.comingSoon', 'Coming Soon')}</Text>
            <TouchableOpacity
              style={styles.filterPromptButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterPromptText}>{t('community.selectOtherSchools', 'Select other schools')}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* 筛选模态框 */}
      <CommunityMerchantFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={applyFilters}
        initialFilters={currentFilters}
        schools={allSchools.filter(s => {
          const name = s.name.toLowerCase();
          return !name.includes('hq') && !name.includes('headquarters') && !name.includes('总部');
        }).map(s => ({ id: s.id, name: s.aprName || s.shortName || s.name }))}
      />

      {/* 商家详情模态框 */}
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
    backgroundColor: '#FFFFFF',
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },

  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
  },

  titleContainer: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 28,
    color: '#1A1A1A',
    lineHeight: 34,
  },

  headerTitleBold: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#1A1A1A',
    lineHeight: 34,
  },

  locationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  locationHintText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },

  headerIcons: {
    flexDirection: 'row',
  },

  circleIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  scrollViewWrapper: {
    flex: 1,
    backgroundColor: '#F8F6F4',
  },

  merchantListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  merchantItemWrapper: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
  },

  merchantItemRight: {
    marginLeft: 16,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#999',
    marginTop: 12,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },

  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyStateText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },

  emptyStateSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },

  filterPromptButton: {
    backgroundColor: '#FF7763',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },

  filterPromptText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },

  loginPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },

  loginPromptIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 119, 99, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  loginPromptTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },

  loginPromptDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  loginButton: {
    backgroundColor: '#FF7763',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 25,
    shadowColor: '#FF7763',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  loginButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
