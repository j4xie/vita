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
import Svg, { Path, Rect } from 'react-native-svg';
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
  bg: '#FAF3F1', // Warm beige background
  headerBg: '#FAF3F1', // Same as page background
  primary: '#FF7763', // Figma primary coral
  textMain: '#111111',
  textSecondary: '#8C8C8C',
  filterActiveBg: '#FF7763',
  filterActiveText: '#FFFFFF',
  filterInactiveBg: '#FFFFFF',
  filterInactiveText: '#949494',
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
const CARD_WIDTH = Math.round(screenWidth * 0.56);
const CARD_MARGIN = 23; // Figma gap between cards
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;
const SCROLL_TRACK_WIDTH = Math.min(screenWidth - 40, 340);

export const ExploreScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'available' | 'ended'>('all');
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = React.useRef(new Animated.Value(0)).current;

  // Filter and Search modal states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActivityFilterOptions>({
    priceRange: 'all',
    activityTypes: [],
    availability: 'all',
    location: { type: 'all' },
  });

  const loadActivities = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      const isLoggedIn = !!(user?.id);
      const params: any = { pageNum: 1, pageSize: 20, userId: isLoggedIn ? parseInt(user.id) : undefined };
      if (forceRefresh) params._t = Date.now();

      const result = await pomeloXAPI.getActivityList(params);

      const responseData = result.data || result;
      const rows = (responseData as any).rows || [];
      const total = (responseData as any).total || 0;

      const adapted = adaptActivityList({ total, rows, code: result.code, msg: result.msg }, i18n.language?.startsWith('en') ? 'en' : 'zh', forceRefresh);

      if (adapted.success) setActivities(adapted.activities);
    } catch (e) {
      console.error('Load activities failed:', e);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, i18n.language]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivities(true);
    setRefreshing(false);
  }, [loadActivities]);

  // Apply filters using useMemo for performance
  const filteredList = useMemo(() => {
    const now = new Date();
    return activities.filter(a => {
      // 1. 严格对齐适配器的结束时间计算逻辑
      const endDateStr = a.endDate || a.date;
      const activityEndTime = endDateStr ? new Date(endDateStr + ' 23:59:59') : null;

      const isActivityEnded = activityEndTime ? activityEndTime.getTime() < now.getTime() : false;

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
          {/* Greeting: Unified black per Figma */}
          <Text style={styles.greetingText}>Hi, {user?.nickName || user?.userName || 'Guest'}</Text>

          <View style={styles.headerIcons}>
            {/* Scan Icon - White Circle Button */}
            <TouchableOpacity
              style={styles.circleIconButton}
              onPress={() => navigation.navigate('QRScanner', { purpose: 'scan' })}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
                {/* Outer corners */}
                <Ionicons name="scan-outline" size={28} color="#888888" />
                
                {/* Inner rounded rectangle */}
                <View style={{
                  position: 'absolute',
                  width: 13,
                  height: 13,
                  borderWidth: 1.8,
                  borderColor: '#888888',
                  borderRadius: 4.5,
                }} />
                
                {/* Horizontal line */}
                <View style={{
                  position: 'absolute',
                  width: 17,
                  height: 1.5,
                  backgroundColor: '#888888',
                  borderRadius: 1
                }} />
              </View>
            </TouchableOpacity>

            {/* Search Icon - White Circle Button */}
            <TouchableOpacity
              testID="explore-search-button"
              accessibilityLabel="explore-search-button"
              style={styles.circleIconButton}
              onPress={() => setSearchModalVisible(true)}
            >
              <Ionicons name="search-outline" size={24} color="#888888" />
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
            { useNativeDriver: false }
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
                      outputRange: [0, SCROLL_TRACK_WIDTH - 100],
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
            testID="explore-filter-button"
            accessibilityLabel="explore-filter-button"
            style={styles.filterIconButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <Rect width="34" height="34" rx="17" fill="#FF7763"/>
              <Path 
                d="M10.4 7.09998H23.6C24.7 7.09998 25.6 7.99998 25.6 9.09998V11.3C25.6 12.1 25.1 13.1 24.6 13.6L20.3 17.4C19.7 17.9 19.3 18.9 19.3 19.7V24C19.3 24.6 18.9 25.4 18.4 25.7L17 26.6C15.7 27.4 13.9 26.5 13.9 24.9V19.6C13.9 18.9 13.5 18 13.1 17.5L9.30002 13.5C8.80002 13 8.40002 12.1 8.40002 11.5V9.19998C8.40002 7.99998 9.30002 7.09998 10.4 7.09998Z" 
                stroke="white" 
                strokeWidth="1.5" 
                strokeMiterlimit="10" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <Path 
                d="M15.93 7.09998L11 15" 
                stroke="white" 
                strokeWidth="1.5" 
                strokeMiterlimit="10" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </Svg>
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
  greetingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    color: '#000000',
    lineHeight: 45, // 1.5em
  },
  headerIcons: {
    flexDirection: 'row',
  },
  circleIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 15,
    fontWeight: '600',
    color: '#949494',
    marginBottom: 4,
    textTransform: 'uppercase',
    lineHeight: 19.5, // 1.3em
  },
  carouselContent: {
    paddingLeft: 20,
    paddingRight: screenWidth - 20 - CARD_WIDTH,
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
    width: SCROLL_TRACK_WIDTH,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scrollIndicatorFill: {
    height: '100%',
    width: 100, // Figma: 100px fill indicator
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
    fontFamily: 'IBM Plex Mono',
    fontSize: 15,
    fontWeight: '600',
    color: '#949494',
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 10,
    textTransform: 'uppercase',
    lineHeight: 19.5, // 1.3em
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 2,
    marginBottom: 14,
  },
  filterIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    // backgroundColor: COLORS.primary, // Removed as SVG handles background
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterIconButtonActive: {
    // 如果需要区分激活状态，可以加深颜色或改变阴影
    backgroundColor: '#E67A64', 
  },
  filterDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  filterTabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterTab: {
    paddingVertical: 5,
    paddingHorizontal: 17,
    borderRadius: 53,
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
  },
  filterTabText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    fontWeight: '500',
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