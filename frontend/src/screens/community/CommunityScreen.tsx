import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
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
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useSchoolData } from '../../hooks/useSchoolData';
import { useTheme } from '../../context/ThemeContext';
import { LoaderOne } from '../../components/ui/LoaderOne';
import {
  CommunityMerchantFilterModal,
  MerchantFilterOptions,
} from '../../components/modals/CommunityMerchantFilterModal';
import merchantAPI, { Merchant } from '../../services/merchantAPI';
import { CommunityMerchantCard } from '../../components/cards/CommunityMerchantCard';
import { FeaturedMerchantCard } from '../../components/cards/FeaturedMerchantCard';
import { CommunitySearchModal } from '../../components/modals/CommunitySearchModal';
import LocationService, { LocationData } from '../../services/LocationService';

const { width: screenWidth } = Dimensions.get('window');

// Design Colors matching Figma Explore
const COLORS = {
  bg: '#FAF3F1',
  primary: '#FF7763',
  textMain: '#111111',
  textSecondary: '#8C8C8C',
  sectionTitle: '#949494',
  filterActiveBg: '#FF7763',
  filterActiveText: '#FFFFFF',
  filterInactiveBg: '#FFFFFF',
  filterInactiveText: '#949494',
  separator: '#E9E2DD',
  scrollTrack: '#E0E0E0',
};

// Card dimensions for carousel (same as Explore)
const CARD_WIDTH = Math.round(screenWidth * 0.56);
const CARD_MARGIN = 23;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;
const SCROLL_TRACK_WIDTH = Math.min(screenWidth - 40, 340);

// School coordinates (lat, lng)
const SCHOOL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ucb': { lat: 37.8719, lng: -122.2585 },
  'ucd': { lat: 38.5382, lng: -121.7617 },
  'uci': { lat: 33.6405, lng: -117.8443 },
  'ucla': { lat: 34.0689, lng: -118.4452 },
  'ucsb': { lat: 34.4140, lng: -119.8489 },
  'ucsc': { lat: 36.9914, lng: -122.0609 },
  'ucsd': { lat: 32.8801, lng: -117.2340 },
  'umn': { lat: 44.9778, lng: -93.2650 },
  'usc': { lat: 34.0224, lng: -118.2851 },
  'uw': { lat: 47.6553, lng: -122.3035 },
  'nyu': { lat: 40.7295, lng: -73.9965 },
  'cornell': { lat: 42.4534, lng: -76.4735 },
  'rutgers': { lat: 40.5008, lng: -74.4474 },
};

const MAX_DISTANCE_METERS = 160934; // 100 miles

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getSchoolCoordinates = (aprName?: string | null): { lat: number; lng: number } | null => {
  if (!aprName) return null;
  const key = aprName.toLowerCase();
  return SCHOOL_COORDINATES[key] || null;
};

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

// Filter tab pill - matching Figma Explore style
const FilterTab = memo(({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.filterTab, active ? styles.filterTabActive : styles.filterTabInactive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.filterTabText, active ? styles.filterTabTextActive : styles.filterTabTextInactive]}>
      {label}
    </Text>
  </TouchableOpacity>
));

export const CommunityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const { schools: allSchools, loading: schoolsLoading, loadSchools } = useSchoolData();
  const scrollX = React.useRef(new Animated.Value(0)).current;

  // Location state
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'nearby' | 'popular'>('nearby');
  const [currentFilters, setCurrentFilters] = useState<MerchantFilterOptions>({
    category: null,
    priceRange: 'all',
    sortBy: 'points-high',
    selectedSchools: [],
    selectedMerchantTypes: [],
  });

  // Merchant data
  const [merchantsBySchool, setMerchantsBySchool] = useState<Record<string, Merchant[]>>({});
  const [loadingMerchants, setLoadingMerchants] = useState(false);
  const merchantsLoadedRef = React.useRef(false);

  // Get user location
  useEffect(() => {
    const fetchLocation = async () => {
      setLocationLoading(true);
      try {
        const location = await LocationService.getCurrentLocation({ useCache: true });
        setUserLocation(location);
      } catch (error) {
        console.warn('[CommunityScreen] Location failed:', error);
      } finally {
        setLocationLoading(false);
      }
    };
    fetchLocation();
  }, []);

  // Listen for search text changes
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'searchTextChanged',
      (data: { searchText: string }) => {
        setSearchText(data.searchText);
      }
    );
    return () => subscription.remove();
  }, []);

  // Filter nearby schools
  const nearbySchools = useMemo(() => {
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

    if (userLocation) {
      filtered = filtered.filter(school => {
        const coords = getSchoolCoordinates(school.aprName);
        if (!coords) {
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

      if (filtered.length === 0 && user?.deptId) {
        const userSchool = allSchools.find(s => s.deptId.toString() === user.deptId?.toString());
        if (userSchool) {
          filtered = [userSchool];
        }
      }
    }

    return filtered;
  }, [allSchools, userLocation, user?.deptId]);

  // Load merchants for schools
  const loadMerchantsForSchools = useCallback(async () => {
    if (nearbySchools.length === 0) return;

    setLoadingMerchants(true);
    try {
      const merchantsData: Record<string, Merchant[]> = {};
      const promises = nearbySchools.map(async (school) => {
        try {
          const merchants = await merchantAPI.getMerchantsBySchool(school.deptId);
          merchantsData[school.id] = merchants;
        } catch (error) {
          merchantsData[school.id] = [];
        }
      });
      await Promise.all(promises);
      setMerchantsBySchool(merchantsData);
    } catch (error) {
      console.error('[CommunityScreen] Load merchants failed:', error);
    } finally {
      setLoadingMerchants(false);
    }
  }, [nearbySchools]);

  // Load merchants when schools change
  useEffect(() => {
    if (merchantsLoadedRef.current) return;
    if (nearbySchools.length > 0 && !locationLoading) {
      merchantsLoadedRef.current = true;
      loadMerchantsForSchools();
    }
  }, [nearbySchools, locationLoading]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    merchantsLoadedRef.current = false;
    await loadSchools();
    await loadMerchantsForSchools();
    setIsRefreshing(false);
  }, [loadSchools, loadMerchantsForSchools]);

  // Flatten all merchants
  const allMerchants = useMemo(() => {
    let merchants: any[] = [];

    const schoolsToShow = currentFilters.selectedSchools.length > 0
      ? nearbySchools.filter(s => currentFilters.selectedSchools.includes(s.id))
      : nearbySchools;

    schoolsToShow.forEach(school => {
      const schoolMerchants = merchantsBySchool[school.id] || [];
      schoolMerchants.forEach((merchant, index) => {
        merchants.push({
          id: `${school.id}-${merchant.id}-${index}`,
          merchantId: merchant.id,
          title: merchant.merchantName || 'Merchant',
          name: merchant.merchantName || 'Merchant',
          location: merchant.merchantAddress || '',
          image: merchant.shopImg || merchant.logo || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
          earnPoints: merchant.earnPoints || 1,
          schoolName: school.aprName || school.shortName || school.name,
          schoolId: school.id,
          category: getMerchantCategory(merchant.merchantType),
          rating: 0,
          reviewCount: 0,
          distance: (() => {
            const coords = getSchoolCoordinates(school.aprName);
            if (userLocation && coords) {
              const meters = calculateDistance(
                userLocation.latitude, userLocation.longitude,
                coords.lat, coords.lng
              );
              const miles = meters / 1609.34;
              return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
            }
            return '';
          })(),
          tags: [getMerchantCategory(merchant.merchantType)],
        });
      });
    });

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      merchants = merchants.filter(m =>
        m.title.toLowerCase().includes(search) ||
        m.location.toLowerCase().includes(search) ||
        m.schoolName?.toLowerCase().includes(search)
      );
    }

    // Merchant type filter
    if (currentFilters.selectedMerchantTypes.length > 0) {
      merchants = merchants.filter(m =>
        currentFilters.selectedMerchantTypes.includes(m.category)
      );
    }

    // Points range filter
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

    // Sort
    merchants.sort((a, b) => {
      switch (currentFilters.sortBy) {
        case 'points-high': return (b.earnPoints || 0) - (a.earnPoints || 0);
        case 'points-low': return (a.earnPoints || 0) - (b.earnPoints || 0);
        default: return 0;
      }
    });

    return merchants;
  }, [nearbySchools, merchantsBySchool, currentFilters, searchText, userLocation]);

  // FEATURED = top merchants sorted by earnPoints
  const featuredMerchants = useMemo(() => {
    return [...allMerchants]
      .sort((a, b) => (b.earnPoints || 0) - (a.earnPoints || 0))
      .slice(0, 10);
  }, [allMerchants]);

  // Filtered merchant list based on active tab
  const displayMerchants = useMemo(() => {
    if (activeTab === 'popular') {
      return [...allMerchants].sort((a, b) => (b.earnPoints || 0) - (a.earnPoints || 0));
    }
    return allMerchants;
  }, [allMerchants, activeTab]);

  // Navigate to merchant detail
  const handleMerchantPress = useCallback((merchant: any) => {
    navigation.navigate('MerchantDetail', {
      merchantId: merchant.merchantId,
      merchant: merchant,
    });
  }, [navigation]);

  // Apply filters
  const applyFilters = useCallback((filters: MerchantFilterOptions) => {
    setCurrentFilters(filters);
  }, []);

  const isLoading = (schoolsLoading && allSchools.length === 0) || loadingMerchants || locationLoading;

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentFilters.selectedSchools.length > 0) count++;
    if (currentFilters.selectedMerchantTypes.length > 0) count++;
    if (currentFilters.priceRange !== 'all') count++;
    return count;
  }, [currentFilters]);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#000' : COLORS.bg} />

      {/* Header - Figma Explore style */}
      <View style={[styles.headerContainer, isDarkMode && styles.headerContainerDark, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.greetingText, isDarkMode && styles.textWhite]}>
            Hi, {user?.nickName || user?.userName || 'Guest'}
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              testID="community-search-button"
              accessibilityLabel="community-search-button"
              style={[styles.circleIconButton, isDarkMode && styles.circleIconButtonDark]}
              onPress={() => setSearchModalVisible(true)}
            >
              <Ionicons name="search-outline" size={24} color={isDarkMode ? '#ccc' : '#888888'} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.sectionTitle, isDarkMode && { color: '#666' }]}>
          {t('community.favorites', 'FEATURED MERCHANTS')}
        </Text>
      </View>

      {/* Main Content */}
      {!user ? (
        <ScrollView contentContainerStyle={styles.loginPromptContainer} style={{ backgroundColor: isDarkMode ? '#000' : COLORS.bg }}>
          <LinearGradient
            colors={isDarkMode ? ['#2A1510', '#1a1a1a'] : ['#FFF5F0', '#FFE8DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginCard}
          >
            <View style={styles.loginPromptIcon}>
              <Ionicons name="storefront-outline" size={40} color="#FF7763" />
            </View>
            <Text style={[styles.loginPromptTitle, isDarkMode && styles.textWhite]}>
              {t('community.loginRequired.title')}
            </Text>
            <Text style={[styles.loginPromptDesc, isDarkMode && styles.textGray]}>
              {t('community.loginRequired.description')}
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FF7763', '#FF9A8B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>{t('community.loginRequired.button')}</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      ) : isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#000' : COLORS.bg }]}>
          <LoaderOne size="large" color="#FF7763" />
          <Text style={[styles.loadingText, isDarkMode && styles.textGray]}>
            {locationLoading
              ? t('community.locating', 'Getting location...')
              : t('community.loadingMerchants', 'Loading merchants...')}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
          style={{ backgroundColor: isDarkMode ? '#000' : COLORS.bg }}
        >
          {/* Featured Carousel */}
          {featuredMerchants.length > 0 && (
            <>
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
                {featuredMerchants.map((item) => (
                  <FeaturedMerchantCard
                    key={item.id}
                    merchant={item}
                    onPress={() => handleMerchantPress(item)}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </ScrollView>

              {/* Scroll Indicator */}
              <View style={styles.scrollIndicatorContainer}>
                <View style={[styles.scrollIndicatorTrack, isDarkMode && { backgroundColor: '#333' }]}>
                  <Animated.View
                    style={[
                      styles.scrollIndicatorFill,
                      {
                        transform: [{
                          translateX: scrollX.interpolate({
                            inputRange: [0, Math.max(1, (featuredMerchants.length - 1) * SNAP_INTERVAL)],
                            outputRange: [0, SCROLL_TRACK_WIDTH - 100],
                            extrapolate: 'clamp',
                          })
                        }]
                      }
                    ]}
                  />
                </View>
              </View>
            </>
          )}

          {/* Section Separator */}
          <View style={[styles.sectionSeparator, isDarkMode && { backgroundColor: '#333' }]} />

          {/* ALL MERCHANTS Section Title */}
          <Text style={[styles.merchantsSectionTitle, isDarkMode && { color: '#666' }]}>
            {t('community.merchantsLabel', 'ALL MERCHANTS')}
          </Text>

          {/* Filter Row - Figma Explore style */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              testID="community-filter-button"
              accessibilityLabel="community-filter-button"
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
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={[styles.filterDivider, isDarkMode && { backgroundColor: '#333' }]} />

            <View style={styles.filterTabsRow}>
              <FilterTab
                label={t('community.nearby', 'Nearby')}
                active={activeTab === 'nearby'}
                onPress={() => setActiveTab('nearby')}
              />
              <FilterTab
                label={t('community.popular', 'Popular')}
                active={activeTab === 'popular'}
                onPress={() => setActiveTab('popular')}
              />
            </View>
          </View>

          {/* Merchant List */}
          <View style={styles.listContainer}>
            {displayMerchants.length > 0 ? (
              displayMerchants.map((item) => (
                <CommunityMerchantCard
                  key={item.id}
                  merchant={item}
                  onPress={() => handleMerchantPress(item)}
                  isDarkMode={isDarkMode}
                />
              ))
            ) : (
              <View style={[styles.emptyStateCard, isDarkMode && styles.emptyStateCardDark]}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="storefront-outline" size={40} color={isDarkMode ? '#555' : '#CCC'} />
                </View>
                <Text style={[styles.emptyStateText, isDarkMode && styles.textWhite]}>
                  {t('community.noMerchants', 'No merchants yet')}
                </Text>
                <Text style={[styles.emptyStateSubtext, isDarkMode && styles.textGray]}>
                  {t('community.comingSoon', 'Coming Soon')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Filter Modal */}
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

      {/* Search Modal */}
      <CommunitySearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        merchants={allMerchants}
        onMerchantPress={(merchant) => {
          setSearchModalVisible(false);
          handleMerchantPress(merchant);
        }}
        onViewMore={(schoolKey) => {
          setSearchModalVisible(false);
        }}
        schools={nearbySchools}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  containerDark: {
    backgroundColor: '#000000',
  },

  // Header - matching Figma Explore
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.bg,
  },
  headerContainerDark: {
    backgroundColor: '#000000',
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
    lineHeight: 45,
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
  circleIconButtonDark: {
    backgroundColor: '#1c1c1e',
  },
  sectionTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.sectionTitle,
    marginBottom: 4,
    textTransform: 'uppercase',
    lineHeight: 19.5,
  },

  // Carousel
  carouselContent: {
    paddingLeft: 20,
    paddingRight: screenWidth - 20 - CARD_WIDTH,
    paddingBottom: 12,
    paddingTop: 8,
  },

  // Scroll Indicator
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
    backgroundColor: COLORS.scrollTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scrollIndicatorFill: {
    height: '100%',
    width: 100,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Section Separator
  sectionSeparator: {
    height: 1,
    backgroundColor: COLORS.separator,
    marginHorizontal: 20,
    marginBottom: 16,
  },

  // Merchants section title
  merchantsSectionTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.sectionTitle,
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 10,
    textTransform: 'uppercase',
    lineHeight: 19.5,
  },

  // Filter Section - matching Figma Explore
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
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

  // List
  listContainer: {
    paddingHorizontal: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#999',
    marginTop: 12,
  },

  // Empty State
  emptyStateCard: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  emptyStateCardDark: {
    backgroundColor: '#1c1c1e',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 119, 99, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    marginBottom: 20,
  },

  // Login Prompt
  loginPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  loginCard: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  loginPromptIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 119, 99, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Dark mode text helpers
  textWhite: {
    color: '#fff',
  },
  textGray: {
    color: '#777',
  },
});
