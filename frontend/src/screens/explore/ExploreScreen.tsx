import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { adaptActivityList, FrontendActivity } from '../../utils/activityAdapter';
import { useUser } from '../../context/UserContext';
import { FeaturedActivityCard } from '../../components/cards/FeaturedActivityCard';
import { SmallActivityCard } from '../../components/cards/SmallActivityCard';
import { ActivityFilterModal, ActivityFilterOptions } from '../../components/modals/ActivityFilterModal';
import { ActivitySearchModal } from '../../components/modals/ActivitySearchModal';

const { width: screenWidth } = Dimensions.get('window');

// Design Colors from Figma/Screenshot
const COLORS = {
  bg: '#FDF4EF', // Warm beige background
  headerBg: '#FDF4EF', // Same as page background
  primary: '#FF8A72', // Soft coral
  textMain: '#111111',
  textSecondary: '#8C8C8C',
  filterActiveBg: '#FF8A72',
  filterActiveText: '#FFFFFF',
  filterInactiveBg: '#FFFFFF',
  filterInactiveText: '#8C8C8C',
};

const FilterTab = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[
      styles.filterTab,
      active ? styles.filterTabActive : styles.filterTabInactive
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[
      styles.filterTabText,
      active ? styles.filterTabTextActive : styles.filterTabTextInactive
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Card dimensions for scroll calculation (must match FeaturedActivityCard)
const CARD_WIDTH = screenWidth * 0.85;
const CARD_MARGIN = 16; // marginRight in FeaturedActivityCard
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

export const ExploreScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'available' | 'ended'>('all');
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = React.useRef(new Animated.Value(0)).current;

  // #region agent log
  useEffect(() => {
    const listenerId = scrollX.addListener((value) => {
      if (Math.round(value.value) % 50 === 0) { // Log every 50px to avoid flooding
        fetch('http://127.0.0.1:7242/ingest/cb8adb4d-6adc-47b5-b326-06c6fae7db0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExploreScreen.tsx:75',message:'scrollX value change',data:{value:value.value},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      }
    });
    return () => scrollX.removeListener(listenerId);
  }, []);
  // #endregion

  // Filter and Search modal states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActivityFilterOptions>({
    priceRange: 'all',
    activityTypes: [],
    availability: 'all',
    location: { type: 'all' },
  });

  useEffect(() => { loadActivities(); }, []);

  const loadActivities = async (forceRefresh: boolean = false) => {
    const startTime = Date.now();
    try {
      setLoading(true);
      const isLoggedIn = !!(user?.id);
      const params: any = { pageNum: 1, pageSize: 20, userId: isLoggedIn ? parseInt(user.id) : undefined };
      if (forceRefresh) params._t = Date.now();
      
      console.log('🚀 [PERF] 开始获取活动列表...', { params });
      const result = await pomeloXAPI.getActivityList(params);
      const fetchEndTime = Date.now();
      console.log(`⏱️ [PERF] API 请求耗时: ${fetchEndTime - startTime}ms`);

      const responseData = result.data || result;
      const rows = (responseData as any).rows || [];
      const total = (responseData as any).total || 0;
      
      const adaptStartTime = Date.now();
      const adapted = adaptActivityList({ total, rows, code: result.code, msg: result.msg }, 'zh', forceRefresh);
      const adaptEndTime = Date.now();
      console.log(`⏱️ [PERF] 数据适配耗时: ${adaptEndTime - adaptStartTime}ms`);

      if (adapted.success) setActivities(adapted.activities);
    } catch (e) {
      console.error('❌ [PERF] 加载失败:', e);
      setActivities([]);
    } finally {
      setLoading(false);
      console.log(`🏁 [PERF] 整个加载流程总耗时: ${Date.now() - startTime}ms`);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivities(true);
    setRefreshing(false);
  }, []);

  // Apply filters using useMemo for performance
  const filteredList = useMemo(() => {
    const now = new Date();
    return activities.filter(a => {
      // 1. 严格对齐适配器的结束时间计算逻辑
      // 如果有 endDate，取 endDate 的当天 23:59:59
      // 如果没有，取 date 的当天 23:59:59
      const endDateStr = a.endDate || a.date;
      const activityEndTime = endDateStr ? new Date(`${endDateStr.replace(/-/g, '/')} 23:59:59`) : null;
      
      const isActivityEnded = activityEndTime && activityEndTime < now;

      // 根据活动时间区分 Available 和 Ended
      if (selectedCategory === 'available' && isActivityEnded) return false;
      if (selectedCategory === 'ended' && !isActivityEnded) return false;

      // 2. 弹窗内的可用性筛选也同步逻辑
      if (activeFilters.availability === 'available' && isActivityEnded) return false;
      
      // 3. 价格筛选逻辑
      if (activeFilters.priceRange !== 'all') {
        const price = a.price || 0;
        switch (activeFilters.priceRange) {
          case 'free': if (price !== 0) return false; break;
          case 'under10': if (price >= 10 || price === 0) return false; break;
          case '10to30': if (price < 10 || price > 30) return false; break;
          case '30to50': if (price < 30 || price > 50) return false; break;
          case '50plus': if (price <= 50) return false; break;
        }
      }

      // 4. 类型筛选逻辑
      if (activeFilters.activityTypes.length > 0) {
        const activityCategory = a.category?.toLowerCase() || '';
        if (!activeFilters.activityTypes.some(t => activityCategory.includes(t))) return false;
      }

      // 5. 地点筛选逻辑
      if (activeFilters.location.type !== 'all') {
        const activityLocation = (a.location || '').toLowerCase();
        const filterValue = (activeFilters.location.value || '').toLowerCase();

        switch (activeFilters.location.type) {
          case 'current':
          case 'school':
            // 匹配地点值
            if (filterValue && !activityLocation.includes(filterValue)) return false;
            break;
          case 'city':
            // 根据城市ID匹配城市名
            const cityMap: Record<string, string[]> = {
              'los_angeles': ['los angeles', 'la', 'california', 'ca'],
              'new_york': ['new york', 'ny', 'nyc', 'manhattan', 'brooklyn'],
              'san_francisco': ['san francisco', 'sf', 'bay area'],
              'boston': ['boston', 'ma', 'massachusetts'],
            };
            const cityKeywords = cityMap[filterValue] || [];
            if (cityKeywords.length > 0 && !cityKeywords.some(kw => activityLocation.includes(kw))) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }, [activities, selectedCategory, activeFilters]);

  // Check if any filters are active (for button highlight)
  const hasActiveFilters = useMemo(() => {
    return (
      activeFilters.priceRange !== 'all' ||
      activeFilters.activityTypes.length > 0 ||
      activeFilters.availability !== 'all' ||
      activeFilters.location.type !== 'all'
    );
  }, [activeFilters]);

  // Handle filter apply
  const handleApplyFilters = useCallback((filters: ActivityFilterOptions) => {
    setActiveFilters(filters);
  }, []);

  // Handle activity selection from search
  const handleSelectActivity = useCallback((activity: FrontendActivity) => {
    setSearchModalVisible(false);
    navigation.navigate('ActivityDetail', { activity });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.headerBg} />

      {/* Header Area - Custom Background Color */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
          {/* Greeting: Mixed Style */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingHi}>Hi, </Text>
            <Text style={styles.greetingName}>{user?.nickName || user?.userName || ''}</Text>
          </View>

          <View style={styles.headerIcons}>
            {/* Scan Icon - White Circle Button */}
            <TouchableOpacity
              style={styles.circleIconButton}
              onPress={() => navigation.navigate('QRScanner', { purpose: 'scan' })}
            >
              <Ionicons name="scan-outline" size={18} color="#8C8C8C" />
            </TouchableOpacity>

            {/* Search Icon - White Circle Button */}
            <TouchableOpacity
              style={styles.circleIconButton}
              onPress={() => setSearchModalVisible(true)}
            >
              <Ionicons name="search-outline" size={18} color="#8C8C8C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title BEST FOR YOU - IBM Plex Mono */}
        <Text style={styles.sectionTitle}>BEST FOR YOU</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        style={{ backgroundColor: COLORS.bg }}
      >
        {/* Featured Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          decelerationRate="fast"
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { 
              useNativeDriver: false,
              listener: (event: any) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/cb8adb4d-6adc-47b5-b326-06c6fae7db0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExploreScreen.tsx:212',message:'onScroll triggered',data:{x:event.nativeEvent.contentOffset.x},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
              }
            }
          )}
          scrollEventThrottle={16}
        >
          {activities.slice(0, 5).map((item) => (
            <FeaturedActivityCard
              key={item.id}
              activity={item}
              onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
            />
          ))}
        </ScrollView>

        {/* Multi-Colored Scroll Indicator */}
        <View style={styles.scrollIndicatorContainer}>
          <View style={styles.scrollIndicatorTrack}>
            <Animated.View 
              style={[
                styles.scrollIndicatorFill,
                {
                  transform: [{
                    translateX: scrollX.interpolate({
                      // Input: from 0 to the maximum scrollable width of the carousel
                      inputRange: [0, Math.max(1, (activities.slice(0, 5).length - 1) * SNAP_INTERVAL)],
                      // Output: from 0 to (trackWidth - fillWidth)
                      outputRange: [0, (screenWidth - 40) - 80], // Adjusted for 80px fill width
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]} 
            />
          </View>
        </View>

        {/* Horizontal Separator */}
        <View style={styles.sectionSeparator} />

        {/* ACTIVITIES Section Title */}
        <Text style={styles.activitiesSectionTitle}>ACTIVITIES</Text>

        {/* Filters Section - 新设计 */}
        <View style={styles.filterSection}>
          {/* Filter Icon Button */}
          <TouchableOpacity
            style={[
              styles.filterIconButton,
              hasActiveFilters && styles.filterIconButtonActive
            ]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name={hasActiveFilters ? "filter" : "filter-outline"}
              size={20}
              color={hasActiveFilters ? "#FFFFFF" : COLORS.primary}
            />
          </TouchableOpacity>

          {/* Vertical Divider */}
          <View style={styles.filterDivider} />

          {/* Filter Tabs - 均匀分布 */}
          <View style={styles.filterTabsRow}>
            <FilterTab label="All" active={selectedCategory === 'all'} onPress={() => setSelectedCategory('all')} />
            <FilterTab label="Available" active={selectedCategory === 'available'} onPress={() => setSelectedCategory('available')} />
            <FilterTab label="Ended" active={selectedCategory === 'ended'} onPress={() => setSelectedCategory('ended')} />
          </View>
        </View>

        {/* Vertical List */}
        <View style={styles.listContainer}>
          {loading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : (
            filteredList.map((item) => (
              <SmallActivityCard
                key={item.id}
                activity={item}
                onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
              />
            ))
          )}
          {!loading && filteredList.length === 0 && (
            <Text style={styles.emptyText}>{t('explore.noActivities', 'No activities found')}</Text>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <ActivityFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />

      {/* Search Modal */}
      <ActivitySearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectActivity={handleSelectActivity}
        activities={activities}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.headerBg, // Light tint
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 6,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  greetingHi: {
    fontFamily: 'Poppins-Medium',
    fontSize: 32,
    color: '#9B9B9B',
  },
  greetingName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: COLORS.textMain,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  circleIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    fontWeight: '600',
    color: '#A0A0A0',
    letterSpacing: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  carouselContent: {
    paddingLeft: (screenWidth - screenWidth * 0.85) / 2,
    paddingRight: (screenWidth - screenWidth * 0.85) / 2,
    paddingBottom: 12,
    paddingTop: 8,
  },
  scrollIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  scrollIndicatorTrack: {
    height: 2,
    width: screenWidth - 40, // Full width minus padding
    backgroundColor: '#F3E9E3',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scrollIndicatorFill: {
    height: '100%',
    width: 80, // Increased from 40 to 80 (double the length)
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#E9E2DD',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  activitiesSectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0A0',
    letterSpacing: 1.2,
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 2,
    marginBottom: 14,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconButtonActive: {
    backgroundColor: '#FF8A72',
    borderColor: '#FF8A72',
  },
  filterDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E6DED8',
    marginHorizontal: 12,
  },
  filterTabsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.filterActiveBg,
    borderWidth: 0,
  },
  filterTabInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DED8',
  },
  filterTabText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: COLORS.filterActiveText,
  },
  filterTabTextInactive: {
    color: COLORS.filterInactiveText,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 20,
    fontFamily: 'Poppins-Regular',
  },
});