import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  SectionList,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
// Added Animated for sticky filter bar
import Reanimated, {
  FlatList as ReanimatedFlatList,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { BRAND_GLASS, BRAND_INTERACTIONS, BRAND_GRADIENT } from '../../theme/core';
import { SimpleActivityCard } from '../../components/cards/SimpleActivityCard';
import { LiquidGlassTab } from '../../components/ui/LiquidGlassTab';
import { FilterBottomSheet } from '../../components/ui/FilterBottomSheet';
import CategoryBar from '../../components/ui/CategoryBar';
import { ListSkeleton } from '../../components/ui/SkeletonScreen';
import { mockActivities, activityCategories } from '../../data/mockData';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useFilter } from '../../context/FilterContext';

// Using LiquidGlassTab component for V1.1 compliance

export const ActivityListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { setIsFilterOpen } = useFilter();
  // v1.2 性能降级策略
  const { handleScrollEvent: performanceScrollHandler, isPerformanceDegraded } = usePerformanceDegradation();
  const [activities, setActivities] = useState(mockActivities);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // v1.2: 初始加载状态
  const [activeFilter, setActiveFilter] = useState(0); // Changed to index for CategoryBar
  const [searchText, setSearchText] = useState(''); // 搜索文本状态
  
  // V1.1 规范: BottomSheet 过滤器状态
  const [showFilterBottomSheet, setShowFilterBottomSheet] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // 新增: Header 显隐状态
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  
  
  
  // v1.2: 模拟初始数据加载
  useEffect(() => {
    // 显示骨架屏一段时间后加载数据
    const timer = setTimeout(() => {
      try {
        setInitialLoading(false);
      } catch (error) {
        console.error('Error in loading timer:', error);
        setInitialLoading(false); // Ensure state is set even if error occurs
      }
    }, theme.performance?.image?.loadingTimeout || 300); // 300ms fallback
    
    return () => clearTimeout(timer);
  }, []);
  
  // Header 动画值和配置
  const HEADER_HEIGHT = 54;
  const HIDE_THRESHOLD = 50; // 开始隐藏的滚动距离
  const SHOW_THRESHOLD = 20; // 显示 Header 的滚动距离
  
  const scrollY = useSharedValue(0);
  const lastScrollY = useRef(0);
  const headerTranslateY = useSharedValue(0);
  
  // 检测减少动态效果设置
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
  }, []);
  
  // Animation now handled by LiquidGlassTab component
  
  const filterTabs = ['all', 'ongoing', 'upcoming', 'ended'];
  const segmentLabels = [
    t('activities.filters.all'),
    t('activities.filters.ongoing'), 
    t('activities.filters.upcoming'),
    t('activities.filters.ended'),
  ];

  // V1.1 规范: BottomSheet 过滤器选项配置 - 使用翻译系统
  const categoryFilters = [
    { id: 'academic', label: t('filters.categories.academic', '学术'), icon: 'school-outline', count: 12, color: theme.colors.primary },
    { id: 'social', label: t('filters.categories.social', '社交'), icon: 'people-outline', count: 8, color: theme.colors.secondary },
    { id: 'career', label: t('filters.categories.career', '职业'), icon: 'briefcase-outline', count: 5, color: theme.colors.success },
    { id: 'sports', label: t('filters.categories.sports', '运动'), icon: 'fitness-outline', count: 15, color: theme.colors.warning },
    { id: 'culture', label: t('filters.categories.culture', '文化'), icon: 'library-outline', count: 7, color: theme.colors.primary },
    { id: 'volunteer', label: t('filters.categories.volunteer', '志愿'), icon: 'heart-outline', count: 3, color: theme.colors.danger },
  ];

  const statusFilters = [
    { id: 'available', label: t('filters.status.available', '可报名'), icon: 'checkmark-circle-outline', count: 25 },
    { id: 'almost-full', label: t('filters.status.almostFull', '即将满员'), icon: 'warning-outline', count: 8 },
    { id: 'waitlist', label: t('filters.status.waitlist', '等待列表'), icon: 'time-outline', count: 4 },
    { id: 'ended', label: t('filters.status.ended', '已结束'), icon: 'close-circle-outline', count: 12 },
  ];

  const locationFilters = [
    { id: 'campus', label: t('filters.location.campus', '校内'), icon: 'business-outline', count: 18 },
    { id: 'downtown', label: t('filters.location.downtown', '市中心'), icon: 'location-outline', count: 12 },
    { id: 'online', label: t('filters.location.online', '线上'), icon: 'desktop-outline', count: 15 },
    { id: 'offsite', label: t('filters.location.offsite', '校外'), icon: 'car-outline', count: 5 },
  ];

  const dateFilters = [
    { id: 'today', label: t('filters.date.today', '今天'), count: 3 },
    { id: 'tomorrow', label: t('filters.date.tomorrow', '明天'), count: 5 },
    { id: 'this-week', label: t('filters.date.thisWeek', '本周'), count: 18 },
    { id: 'this-month', label: t('filters.date.thisMonth', '本月'), count: 42 },
    { id: 'next-month', label: t('filters.date.nextMonth', '下个月'), count: 8 },
  ];

  
  // Handle segment change for CategoryBar
  const handleSegmentChange = useCallback((index: number) => {
    setActiveFilter(index);
  }, []);


  // Header 滚动处理器 - 使用安全的处理方式避免 Reanimated 冲突
  const handleScroll = useCallback((event: any) => {
    try {
      // 确保事件对象存在
      if (!event || !event.nativeEvent || typeof event.nativeEvent.contentOffset?.y !== 'number') {
        return;
      }
      
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const lastY = lastScrollY.current;
      
      // 安全地更新Reanimated值
      if (scrollY && typeof scrollY.value !== 'undefined') {
        scrollY.value = currentScrollY;
      }
      
      // 滚动方向判断
      const scrollDirection = currentScrollY > lastY ? 'down' : 'up';
      
      // Header 隐藏/显示逻辑 - 使用安全的动画调用
      if (headerTranslateY && typeof headerTranslateY.value !== 'undefined') {
        if (scrollDirection === 'down' && currentScrollY > HIDE_THRESHOLD) {
          // 向下滚动且超过阈值 -> 隐藏 Header
          headerTranslateY.value = withTiming(-HEADER_HEIGHT, {
            duration: isReduceMotionEnabled ? 120 : 200,
            easing: Easing.out(Easing.cubic),
          });
        } else if (currentScrollY <= SHOW_THRESHOLD) {
          // 滚动到顶部附近 -> 显示 Header
          headerTranslateY.value = withTiming(0, {
            duration: isReduceMotionEnabled ? 120 : 200,
            easing: Easing.out(Easing.cubic),
          });
        }
      }
      
      lastScrollY.current = currentScrollY;
    } catch (error) {
      console.warn('Scroll handler error:', error);
      // 静默失败，不影响滚动性能
    }
  }, [scrollY, headerTranslateY, isReduceMotionEnabled]);


  // Header 动画样式
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  

  // 下拉刷新 - 简化版本
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Header 现在由 sticky 机制自然处理，不需要手动控制
    
    // 模拟API调用
    setTimeout(() => {
      setActivities(mockActivities);
      setRefreshing(false);
    }, 1500);
  }, []);

  // 加载更多
  const loadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    // 模拟加载更多
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, [loading]);

  // 计算滤后的活动数量 - 用于传递给FilterBottomSheet
  const calculateFilteredCount = useCallback((filters: string[], search: string) => {
    return activities.filter(activity => {
      // 搜索匹配
      const matchesSearch = !search || 
        activity.title.toLowerCase().includes(search.toLowerCase()) ||
        activity.location.toLowerCase().includes(search.toLowerCase());
      
      // 过滤器匹配
      if (filters.length === 0) {
        return matchesSearch;
      }
      
      // 检查是否匹配任何一个过滤条件
      const matchesFilters = filters.some(filterId => {
        // 分类过滤
        if (categoryFilters.some(f => f.id === filterId)) {
          return activity.category === filterId;
        }
        // 状态过滤
        if (statusFilters.some(f => f.id === filterId)) {
          return activity.status === filterId;
        }
        // 地点过滤
        if (locationFilters.some(f => f.id === filterId)) {
          return activity.locationType === filterId;
        }
        // 日期过滤
        if (dateFilters.some(f => f.id === filterId)) {
          // 简化的日期匹配逻辑
          const activityDate = new Date(activity.startTime);
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          switch(filterId) {
            case 'today':
              return activityDate.toDateString() === today.toDateString();
            case 'tomorrow':
              return activityDate.toDateString() === tomorrow.toDateString();
            case 'this-week':
              const weekFromNow = new Date(today);
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return activityDate >= today && activityDate <= weekFromNow;
            case 'this-month':
              return activityDate.getMonth() === today.getMonth() && 
                     activityDate.getFullYear() === today.getFullYear();
            case 'next-month':
              const nextMonth = new Date(today);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              return activityDate.getMonth() === nextMonth.getMonth() && 
                     activityDate.getFullYear() === nextMonth.getFullYear();
            default:
              return false;
          }
        }
        return false;
      });
      
      return matchesSearch && matchesFilters;
    }).length;
  }, [activities, categoryFilters, statusFilters, locationFilters, dateFilters]);
  
  // 搜索和状态过滤
  const filteredActivities = activities.filter(activity => {
    // 搜索匹配 - 匹配标题和地点
    const matchesSearch = searchText.length === 0 || 
      activity.title.toLowerCase().includes(searchText.toLowerCase()) ||
      activity.location.toLowerCase().includes(searchText.toLowerCase());
    
    // 状态匹配
    const currentFilterKey = filterTabs[activeFilter];
    const matchesFilter = currentFilterKey === 'all' || activity.status === currentFilterKey;
    
    // 过滤器匹配
    if (activeFilters.length > 0) {
      const matchesActiveFilters = activeFilters.some(filterId => {
        if (categoryFilters.some(f => f.id === filterId)) {
          return activity.category === filterId;
        }
        if (statusFilters.some(f => f.id === filterId)) {
          return activity.status === filterId;
        }
        if (locationFilters.some(f => f.id === filterId)) {
          return activity.locationType === filterId;
        }
        return false;
      });
      return matchesSearch && matchesFilter && matchesActiveFilters;
    }
    
    return matchesSearch && matchesFilter;
  });

  // 扫码功能
  const handleScan = () => {
    navigation.navigate('QRScanner');
  };

  // 活动详情
  const handleActivityPress = (activity: any) => {
    navigation.navigate('ActivityDetail', { activity });
  };

  // V1.1 规范: 滑动操作处理函数
  const handleShare = (activity: any) => {
    console.log('分享活动:', activity.title);
    // TODO: 实现分享功能
  };

  const handleBookmark = (activity: any) => {
    console.log('收藏活动:', activity.title);
    // TODO: 实现收藏功能
  };

  const handleNotifyMe = (activity: any) => {
    console.log('提醒我:', activity.title);
    // TODO: 实现通知提醒功能
  };

  // V1.1 规范: BottomSheet 过滤器处理函数 - 冻结CategoryBar状态
  const handleShowFilters = () => {
    setShowFilterBottomSheet(true);
    setIsFilterOpen(true); // 通知导航栏隐藏
    // 冻结CategoryBar状态，不触发Header显隐
  };

  const handleCloseFilters = () => {
    setShowFilterBottomSheet(false);
    setIsFilterOpen(false); // 通知导航栏显示
    // 恢复正常滚动行为
  };

  const handleFiltersChange = (filters: string[]) => {
    setActiveFilters(filters);
    // TODO: 应用过滤器到活动列表
  };

  // 搜索处理函数
  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  // CategoryBar - SectionHeader (仅包含CategoryBar)
  const renderListHeader = () => null;

  // CategoryBar - SectionHeader (sticky)
  const renderSectionHeader = () => (
    <View style={styles.categoryBarContainer}>
      <CategoryBar
        selectedSegment={activeFilter}
        onSegmentChange={handleSegmentChange}
        onFilterPress={handleShowFilters}
        hasActiveFilters={activeFilters.length > 0}
        activeFiltersCount={activeFilters.length}
      />
    </View>
  );

  // 为 SectionList 格式化数据
  const sectionData = [{
    title: 'activities',
    data: filteredActivities,
  }];

  return (
    <SafeAreaView style={styles.container}>
      {/* Absolute Header */}
      <Reanimated.View style={[styles.absoluteHeader, { top: insets.top }]}>
        <LinearGradient
          colors={['rgba(248, 250, 255, 0.95)', 'rgba(240, 247, 255, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{t('common.brand_name')}</Text>
            <Text style={styles.headerSubtitle}>{t('activities.discover')}</Text>
          </View>
          {/* Scan Button - Shadow优化 - 向上提高12.5px */}
          <View style={[styles.scanButtonShadowContainer, { marginTop: -12.5 }]}>
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scanButton}
            >
              <TouchableOpacity onPress={handleScan} style={styles.scanButtonInner}>
                <Ionicons name="scan-outline" size={24} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </LinearGradient>
      </Reanimated.View>




      {/* Container for list */}
      <View style={styles.listContainer}>


      {/* Activity List with v1.2 Skeleton Screen */}
      {initialLoading ? (
        <ListSkeleton 
          count={3} 
          showShimmer={!isPerformanceDegraded} // v1.2: 性能降级时禁用shimmer
        />
      ) : (
      <SectionList
        sections={sectionData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SimpleActivityCard
            activity={item}
            onPress={() => handleActivityPress(item)}
          />
        )}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={true}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={[
          styles.listContent,
          { 
            paddingTop: 23 + insets.top, // 从25减少2px到23，精确微调顶部间距
            paddingBottom: 120 + insets.bottom, // 从100增加到120+安全区域，防止TabBar遮挡
          }
        ]}
        ItemSeparatorComponent={() => <View style={{ height: -14 }} />} // 再减少5px，总计-14px，卡片会有更明显的重叠
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        // 使用普通滚动处理器避免 Reanimated 冲突
        onScroll={handleScroll}
        scrollEventThrottle={16}
        // v1.2 规范: FlatList 性能优化配置
        removeClippedSubviews={true}
        maxToRenderPerBatch={theme.performance.flatList.maxToRenderPerBatch}        // v1.2: 5
        initialNumToRender={theme.performance.flatList.initialNumToRender}         // v1.2: 8
        windowSize={theme.performance.flatList.windowSize}                         // v1.2: 12
        updateCellsBatchingPeriod={theme.performance.flatList.updateCellsBatchingPeriod} // v1.2: 50ms
        getItemLayout={(data, index) => {
          const ITEM_HEIGHT = 240; // 新设计卡片高度
          const SEPARATOR_HEIGHT = 16;
          const TOTAL_ITEM_HEIGHT = ITEM_HEIGHT + SEPARATOR_HEIGHT;
          return {
            length: TOTAL_ITEM_HEIGHT,
            offset: TOTAL_ITEM_HEIGHT * index,
            index,
          };
        }}
        // 减少重新渲染
        disableVirtualization={false}
        // 改善滑动性能 (scrollEventThrottle already set above)
        ListFooterComponent={() => loading ? (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : null}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyText}>{t('activities.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('activities.pullToRefresh')}</Text>
          </View>
        )}
      />
      )}
      </View>

      {/* V1.1 规范: BottomSheet 过滤器 with 搜索功能 */}
      <FilterBottomSheet
        visible={showFilterBottomSheet}
        onClose={handleCloseFilters}
        activeFilters={activeFilters}
        onFiltersChange={handleFiltersChange}
        categoryFilters={categoryFilters}
        statusFilters={statusFilters}
        locationFilters={locationFilters}
        dateFilters={dateFilters}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        getFilteredCount={calculateFilteredCount}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  // Absolute Header
  absoluteHeader: {
    position: 'absolute',
    top: 0, // 这个值会被动态覆盖
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3], // 保持上边距
    paddingBottom: 0, // 彻底移除底部间距
    borderBottomWidth: 0,
    borderBottomColor: 'rgba(248, 250, 255, 0.5)',
  },
  // CategoryBar 容器
  categoryBarContainer: {
    marginTop: -22, // 从-20减少2px到-22，精确微调紧凑布局
    paddingTop: 0, // 进一步减少上Header间距，从4改为0
    paddingBottom: 3, // 从8px减少到3px，缩短与卡片的距离5px
    backgroundColor: theme.colors.background.secondary, // 确保背景一致
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  // Scan Button Shadow容器 - 解决LinearGradient阴影冲突 - 向上10px
  scanButtonShadowContainer: {
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary, // solid background用于阴影优化
    padding: 2, // 内边距给LinearGradient
    ...theme.shadows.button,
    // marginTop: -10 在组件内联样式中设置
  },
  
  scanButton: {
    borderRadius: theme.borderRadius.full,
    // 移除阴影，由scanButtonShadowContainer处理
  },
  
  scanButtonInner: {
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  
  // List Container
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  
  
  // 列表内容样式
  listContent: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: 23, // 从25减少2px到23，基础值会被动态覆盖以适配安全区域
    paddingBottom: 120, // 从100增加到120，基础值会被动态覆盖以适配安全区域
  },
  loadingFooter: {
    paddingVertical: theme.spacing[4],
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[20],
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing[4],
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
  },
});