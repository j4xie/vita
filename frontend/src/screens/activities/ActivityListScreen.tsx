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
import { Platform, DeviceEventEmitter } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { BRAND_GLASS, BRAND_INTERACTIONS, BRAND_GRADIENT, LIQUID_GLASS_LAYERS, DAWN_GRADIENTS, DAWN_OVERLAYS } from '../../theme/core';
import { SimpleActivityCard } from '../../components/cards/SimpleActivityCard';
import { LiquidGlassTab } from '../../components/ui/LiquidGlassTab';
import { FilterBottomSheet } from '../../components/ui/FilterBottomSheet';
import CategoryBar from '../../components/ui/CategoryBar';
import { ListSkeleton } from '../../components/ui/SkeletonScreen';
import { vitaGlobalAPI } from '../../services/VitaGlobalAPI';
import { adaptActivityList, FrontendActivity } from '../../utils/activityAdapter';
import { ACTIVITY_CATEGORIES, getCategoryName } from '../../data/activityCategories';
import { getActivityListSimple } from '../../utils/networkHelper';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useFilter } from '../../context/FilterContext';
import { OrganizationProvider, useOrganization } from '../../context/OrganizationContext';
import { OrganizationSwitcher } from '../../components/organization/OrganizationSwitcher';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// 定位相关import暂时移除，等后端就绪后启用
// import { LocationPermissionBanner } from '../../components/location/LocationPermissionBanner';
// import { NearbyFilterChip } from '../../components/location/NearbyFilterChip';
// import { useLocationService } from '../../hooks/useLocationService';

// Using LiquidGlassTab component for V1.1 compliance

export const ActivityListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { setIsFilterOpen } = useFilter();
  // V2.0 性能降级策略和分层配置
  const { handleScrollEvent: performanceScrollHandler, isPerformanceDegraded, getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', false); // 假设浅色模式
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'zh' | 'en';
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(0); // Changed to index for CategoryBar
  const [searchText, setSearchText] = useState(''); // 搜索文本状态
  
  // V1.1 规范: BottomSheet 过滤器状态
  const [showFilterBottomSheet, setShowFilterBottomSheet] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // 新增: Header 显隐状态
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  
  // SectionList引用，用于滚动到顶部
  const sectionListRef = useRef<SectionList>(null);
  
  // 地理位置选择状态 - 两层结构
  const [selectedState, setSelectedState] = useState('NY');
  const [selectedCity, setSelectedCity] = useState('纽约');
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [currentStep, setCurrentStep] = useState<'state' | 'city'>('state');
  
  // 美国州和城市数据 - 按字母顺序排列，补充完整城市
  const statesCities = {
    'AL': ['伯明翰', '蒙哥马利', '亨茨维尔', '莫比尔', '图斯卡卢萨', '奥本'],
    'AZ': ['凤凰城', '图森', '梅萨', '钱德勒', '斯科茨代尔', '坦佩', '格伦代尔'],
    'CA': ['洛杉矶', '旧金山', '圣地亚哥', '奥克兰', '萨克拉门托', '圣何塞', '弗雷斯诺', '长滩', '安纳海姆', '贝克斯菲尔德', '河滨', '斯托克顿', '欧文', '帕萨迪纳', '伯克利', '戴维斯'],
    'CO': ['丹佛', '科罗拉多斯普林斯', '奥罗拉', '博尔德', '韦斯敏斯特', '普韦布洛', '阿瓦达'],
    'CT': ['哈特福德', '纽黑文', '斯坦福德', '布里奇波特', '沃特伯里', '诺沃克'],
    'FL': ['迈阿密', '奥兰多', '坦帕', '杰克逊维尔', '塔拉哈西', '圣彼得堡', '海厄利亚', '彭布罗克派恩斯', '好莱坞', '盖恩斯维尔', '科勒尔盖布尔斯'],
    'GA': ['亚特兰大', '萨凡纳', '奥古斯塔', '哥伦布', '雅典', '奥尔巴尼', '梅肯'],
    'IL': ['芝加哥', '奥罗拉', '洛克福德', '皮奥里亚', '春田', '埃尔金', '尚佩恩', '厄巴纳'],
    'IN': ['印第安纳波利斯', '韦恩堡', '埃文斯维尔', '南本德', '加里', '布卢明顿', '西拉法叶'],
    'KY': ['路易斯维尔', '列克星敦', '鲍灵格林', '欧文斯伯勒', '科温顿', '法兰克福'],
    'LA': ['新奥尔良', '巴吞鲁日', '什里夫波特', '拉斐特', '莱克查尔斯', '门罗'],
    'MA': ['波士顿', '伍斯特', '春田', '剑桥', '洛厄尔', '布罗克顿', '牛顿', '萨默维尔', '昆西'],
    'MD': ['巴尔的摩', '安纳波利斯', '弗雷德里克', '盖瑟斯堡', '罗克维尔', '黑格斯敦'],
    'MI': ['底特律', '大急流城', '安娜堡', '兰辛', '弗林特', '沃伦', '斯特林海茨', '迪尔伯恩'],
    'MN': ['明尼阿波利斯', '圣保罗', '罗切斯特', '德卢斯', '布卢明顿', '普利茅斯'],
    'MO': ['堪萨斯城', '圣路易斯', '春田', '哥伦比亚', '独立', '杰斐逊城'],
    'NC': ['夏洛特', '罗利', '格林斯博罗', '达勒姆', '教堂山', '阿什维尔', '温斯顿-塞勒姆', '费耶特维尔'],
    'NJ': ['纽瓦克', '泽西城', '帕特森', '伊丽莎白', '普林斯顿', '新不伦瑞克', '特伦顿'],
    'NV': ['拉斯维加斯', '雷诺', '亨德森', '北拉斯维加斯', '斯帕克斯', '卡森城'],
    'NY': ['纽约', '布法罗', '罗切斯特', '扬克斯', '锡拉丘兹', '奥尔巴尼', '新罗谢尔', '弗农山', '斯克内克塔迪', '尤蒂卡', '白平原', '伊萨卡'],
    'OH': ['哥伦布', '克利夫兰', '辛辛那提', '托莱多', '阿克伦', '代顿', '扬斯敦', '阿森斯'],
    'OK': ['俄克拉荷马城', '塔尔萨', '诺曼', '布罗肯阿罗', '劳顿', '埃德蒙'],
    'OR': ['波特兰', '尤金', '塞勒姆', '格雷沙姆', '比弗顿', '本德', '科瓦利斯'],
    'PA': ['费城', '匹兹堡', '艾伦镇', '伊利', '雷丁', '斯克兰顿', '贝思利恒', '哈里斯堡', '兰开斯特', '约克'],
    'SC': ['哥伦比亚', '查尔斯顿', '格林维尔', '罗克希尔', '萨姆特', '斯帕坦堡'],
    'TN': ['纳什维尔', '孟菲斯', '诺克斯维尔', '查塔努加', '克拉克斯维尔', '默弗里斯伯勒'],
    'TX': ['休斯顿', '达拉斯', '奥斯汀', '圣安东尼奥', '沃思堡', '埃尔帕索', '阿灵顿', '科珀斯克里斯蒂', '普莱诺', '拉伯克', '加兰', '欧文', '大学城'],
    'UT': ['盐湖城', '西瓦利城', '普罗沃', '奥格登', '西约旦', '奥雷姆'],
    'VA': ['弗吉尼亚海滩', '诺福克', '里士满', '亚历山德里亚', '纽波特纽斯', '朴茨茅斯', '夏洛茨维尔', '布莱克斯堡'],
    'WA': ['西雅图', '斯波坎', '塔科马', '贝尔维尤', '埃弗里特', '肯特', '伦顿', '普尔曼'],
    'WI': ['密尔沃基', '麦迪逊', '格林贝', '基诺沙', '拉辛', '阿普尔顿', '奥什科什'],
  };
  
  // 定位服务暂时禁用，等后端就绪后启用
  // const {
  //   permissionStatus,
  //   currentLocation,
  //   showPermissionBanner,
  //   requestForegroundPermission,
  //   dismissPermissionBanner,
  //   getCurrentLocation,
  //   formatDistance,
  //   hasLocation,
  //   hasPermission,
  // } = useLocationService({ lowPowerMode: isPerformanceDegraded });
  
  // 附近筛选状态（暂时禁用）
  // const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  
  
  
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
  
  // 监听TabBar的滚动到顶部和刷新事件
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('scrollToTopAndRefresh', () => {
      // 滚动到顶部
      sectionListRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: true,
      });
      
      // 执行刷新
      onRefresh();
    });

    return () => {
      subscription?.remove();
    };
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

  

  // 获取活动数据
  const fetchActivities = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      setError(null); // 清除之前的错误
      
      if (isRefresh) {
        setRefreshing(true);
        setCurrentPage(1);
      } else if (page === 1) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const selectedCategory = activeFilter > 0 ? ACTIVITY_CATEGORIES[activeFilter - 1] : null;
      
      // 使用简化的网络请求
      const result = await getActivityListSimple({
        pageNum: page,
        pageSize: 20,
        name: searchText || undefined,
        categoryId: selectedCategory?.id || undefined,
      });

      const adaptedData = adaptActivityList(result, currentLanguage);

      if (adaptedData.success) {
        if (page === 1 || isRefresh) {
          setActivities(adaptedData.activities);
        } else {
          // 防止重复数据，使用Set去重
          setActivities(prev => {
            const existingIds = new Set(prev.map(activity => activity.id));
            const newActivities = adaptedData.activities.filter(activity => !existingIds.has(activity.id));
            return [...prev, ...newActivities];
          });
        }
        setTotal(adaptedData.total);
        setHasMore(adaptedData.activities.length === 20); // 如果返回数据等于pageSize，说明可能还有更多
      } else {
        console.error('获取活动列表失败:', adaptedData.message);
        setError('API错误: ' + adaptedData.message);
        if (page === 1) {
          setActivities([]);
        }
      }
    } catch (error: any) {
      console.error('获取活动数据错误:', error);
      
      // 判断错误类型并设置用户友好的错误信息
      if (error.name === 'AbortError') {
        setError('请求超时，请检查网络连接');
        console.log('请求被取消或超时');
      } else if (error.message?.includes('Network request failed')) {
        setError('网络连接失败，请检查网络设置');
        console.log('网络连接失败');
      } else {
        setError('未知错误: ' + (error.message || '请求失败'));
        console.log('其他错误:', error.message);
      }
      
      // 网络错误时显示空列表
      if (page === 1) {
        setActivities([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, [activeFilter, searchText, currentLanguage]);

  // 调试：打印API响应
  useEffect(() => {
    console.log('当前活动数据:', activities.length, '条活动');
    if (activities.length > 0) {
      console.log('第一个活动:', activities[0]);
    }
  }, [activities]);

  // 下拉刷新
  const onRefresh = useCallback(() => {
    fetchActivities(1, true);
  }, [fetchActivities]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(currentPage + 1);
      setCurrentPage(prev => prev + 1);
    }
  }, [loading, hasMore, currentPage, fetchActivities]);

  // 初始加载数据
  useEffect(() => {
    fetchActivities(1);
  }, []); // 只在组件挂载时执行一次

  // 当筛选条件变化时重新加载
  useEffect(() => {
    if (!initialLoading) {
      setCurrentPage(1);
      fetchActivities(1);
    }
  }, [activeFilter, searchText]);

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
      
      {/* 附近筛选chip暂时禁用，等定位功能就绪后启用 */}
    </View>
  );

  // 为 SectionList 格式化数据
  const sectionData = [{
    title: 'activities',
    data: filteredActivities,
  }];

  return (
    <SafeAreaView style={styles.container}>
      {/* 应用背景渐变层 - 调灰版本 */}
      <LinearGradient
        colors={[
          '#F5F6F7', // 稍灰的顶部
          '#F1F2F3', // 中等灰度
          '#EDEEF0', // 更明显的底部灰色
        ]}
        style={styles.backgroundGradient}
        locations={[0, 0.5, 1]}
      />
      {/* Absolute Header */}
      <Reanimated.View style={[styles.absoluteHeader, { top: insets.top }]}>
        {/* V2.0 页头朝霞氛围背景层 - 已移除背景色 */}
        
        <View style={[styles.header, styles.headerGlass]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.locationSelector}
              onPress={() => {
                setShowLocationSelector(true);
                setCurrentStep('state'); // 从州开始选择
                DeviceEventEmitter.emit('hideTabBar', true); // 隐藏TabBar
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={18} color="#F9A889" />
              <Text style={styles.locationText}>{selectedCity}</Text>
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {/* Scan Button - 线条样式 */}
          <TouchableOpacity onPress={handleScan} style={styles.scanButton}>
            <Ionicons name="scan-outline" size={24} color="#F9A889" />
          </TouchableOpacity>
        </View>
      </Reanimated.View>

      {/* 定位权限由系统提示处理，移除自定义提示条 */}

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
        ref={sectionListRef}
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
            {error ? (
              <>
                <Ionicons name="wifi-outline" size={64} color={theme.colors.danger} />
                <Text style={styles.emptyText}>网络连接问题</Text>
                <Text style={styles.emptySubtext}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchActivities(1, true)}
                >
                  <Text style={styles.retryButtonText}>重试</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="calendar-outline" size={64} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyText}>{t('activities.empty')}</Text>
                <Text style={styles.emptySubtext}>{t('activities.pullToRefresh')}</Text>
              </>
            )}
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
      
      {/* 地理位置选择底部弹层 - 两层结构 */}
      {showLocationSelector && (
        <View style={styles.locationModal}>
          <TouchableOpacity 
            style={styles.locationModalBackdrop}
            onPress={() => {
              setShowLocationSelector(false);
              DeviceEventEmitter.emit('hideTabBar', false); // 显示TabBar
            }}
            activeOpacity={1}
          />
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeader}>
              {currentStep === 'city' && (
                <TouchableOpacity 
                  onPress={() => setCurrentStep('state')}
                  style={styles.backButton}
                >
                  <Ionicons name="chevron-back" size={20} color="#F9A889" />
                </TouchableOpacity>
              )}
              <Text style={styles.locationModalTitle}>
                {currentStep === 'state' 
                  ? t('location.select_state', '选择州') 
                  : t('location.select_city_in_state', '选择城市 - {{state}}', { state: selectedState })
                }
              </Text>
              <TouchableOpacity onPress={() => {
                setShowLocationSelector(false);
                DeviceEventEmitter.emit('hideTabBar', false); // 显示TabBar
              }}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.locationList}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {currentStep === 'state' ? (
                // 显示州列表
                Object.keys(statesCities).map((state) => (
                  <TouchableOpacity
                    key={state}
                    style={[
                      styles.locationItem,
                      selectedState === state && styles.locationItemSelected
                    ]}
                    onPress={() => {
                      setSelectedState(state);
                      setCurrentStep('city'); // 进入城市选择步骤
                    }}
                  >
                    <Text style={[
                      styles.locationItemText,
                      selectedState === state && styles.locationItemTextSelected
                    ]}>
                      {state}
                    </Text>
                    {selectedState === state && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark" size={20} color="#F9A889" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                // 显示城市列表
                statesCities[selectedState as keyof typeof statesCities]?.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.locationItem,
                      selectedCity === city && styles.locationItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCity(city);
                      setShowLocationSelector(false);
                      DeviceEventEmitter.emit('hideTabBar', false); // 显示TabBar
                    }}
                  >
                    <Text style={[
                      styles.locationItemText,
                      selectedCity === city && styles.locationItemTextSelected
                    ]}>
                      {city}
                    </Text>
                    {selectedCity === city && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark" size={20} color="#F9A889" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 组织轮盘切换器 */}
      <OrganizationSwitcherWrapper />

    </SafeAreaView>
  );
};

// ==================== 组织切换器包装组件 ====================

const OrganizationSwitcherWrapper: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  // 安全地获取组织context
  let orgContext;
  try {
    orgContext = useOrganization();
    console.log('OrganizationContext loaded:', !!orgContext.currentOrganization);
  } catch (error) {
    console.log('OrganizationContext not available, skipping switcher');
    return null;
  }
  
  const {
    currentOrganization,
    organizations,
    isSwitching,
    switchOrganization,
    isInitialized
  } = orgContext;

  console.log('Switcher render check:', {
    isInitialized,
    currentOrganization: currentOrganization?.name,
    organizationCount: organizations?.length,
    isSwitching
  });

  const handleOrganizationChange = useCallback(async (organizationId: string) => {
    try {
      console.log('Switching to organization:', organizationId);
      const result = await switchOrganization(organizationId);
      if (result.success) {
        console.log('Organization switched successfully:', result.newOrganization?.displayNameZh);
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  }, [switchOrganization]);

  // 更宽松的显示条件，优先显示轮盘
  if (!organizations || organizations.length <= 1) {
    console.log('Switcher hidden - not enough organizations:', organizations?.length);
    return null;
  }

  // 如果没有当前组织，使用第一个作为默认值
  const displayOrganization = currentOrganization || organizations[0];
  
  console.log('Switcher will render with:', {
    isInitialized,
    currentOrg: displayOrganization?.name,
    orgCount: organizations?.length,
    isSwitching
  });

  console.log('Rendering organization switcher with org:', displayOrganization?.name);
  return (
    <OrganizationSwitcher
      topOffset={undefined} // 使用默认位置
      onOrganizationChange={handleOrganizationChange}
      currentOrganization={displayOrganization}
      organizations={organizations}
      disabled={isSwitching || false}
      testID="explore-organization-switcher"
    />
  );
};

// ==================== 主导出组件 ====================

const ActivityListScreenWithProvider: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OrganizationProvider userId="user_123">
        <ActivityListScreen />
      </OrganizationProvider>
    </GestureHandlerRootView>
  );
};

// 导出包装后的组件
export { ActivityListScreenWithProvider as ActivityListScreen };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },
  
  // 应用主背景渐变
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1, // 放在最底层
  },
  // Absolute Header
  absoluteHeader: {
    position: 'absolute',
    top: 0, // 这个值会被动态覆盖
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // 确保垂直居中对齐
    paddingHorizontal: theme.spacing[4],
    paddingVertical: 12, // 使用统一的垂直内边距确保对齐
    borderBottomWidth: 0,
    height: 56, // 固定高度确保对齐
  },
  
  // V2.0 朝霞氛围背景层
  headerAtmosphere: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100, // 80-120pt范围内
    zIndex: 0, // 置于最底层
  },
  
  // V2.0 白雾叠加层
  headerMistOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DAWN_OVERLAYS.mistEffect.medium, // 8-10%白雾
  },
  
  // V2.0 L1玻璃面板样式 (置于氛围层之上) - 强制固定样式
  headerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // 强制固定玻璃背景
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)', // 强制固定边框颜色
    borderRadius: 20, // 固定圆角
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs - 5, // 单独调整顶部边距，向上移动5px
    marginBottom: theme.spacing.xs, // 保持底部边距
    paddingVertical: 0, // 移除内边距，由header自己控制
    // 强制固定阴影效果
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
    zIndex: 1, // 置于氛围层之上
  },
  // CategoryBar 容器 - 完全匹配headerGlass的边距
  categoryBarContainer: {
    marginTop: -19.5, // 再向下移动5px，从-24.5改为-19.5
    paddingTop: 0, // 进一步减少上Header间距，从4改为0
    paddingBottom: 16, // 恢复原来的底部间距
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation // 透明背景，使用页面的渐变背景
    paddingHorizontal: 0, // 移除padding，让CategoryBar自己控制边距
    marginHorizontal: theme.spacing.md - 13.5, // 再加宽2px，从-11.5改为-13.5
  },
  nearbyChipContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center', // 垂直居中
    alignItems: 'flex-start', // 水平靠左对齐
  },
  // 地理位置选择器 - 精确触发区域
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // 减少垂直内边距确保与扫码按钮对齐
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start', // 改回flex-start确保靠左对齐
    // 轻微背景提示触发区域
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    height: 44, // 固定高度与扫码按钮一致
  },
  locationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginHorizontal: 6,
    fontWeight: '500',
  },
  
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 22, // 圆形按钮
    borderWidth: 2, // 2px橙色边框
    borderColor: '#F9A889', // 适中饱和度的橙色边框
    backgroundColor: 'transparent', // 透明背景
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center', // 确保在父容器中垂直居中
    // 微妙阴影增强立体感
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  
  // List Container
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  
  
  // 列表内容样式
  listContent: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: -94.5, // 再向上移动15px，从-79.5改为-94.5
    paddingBottom: 120, // 从100增加到120，基础值会被动态覆盖以适配安全区域
  },
  loadingFooter: {
    paddingVertical: theme.spacing[4],
    alignItems: 'center',
  },
  
  // 地理位置选择弹层样式
  locationModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  locationModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  locationModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '70%', // 增加高度容纳更多内容
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
    minHeight: 24, // 确保有足够空间给返回按钮
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  locationList: {
    paddingHorizontal: 4,
    maxHeight: 320, // 限制高度，确保可以滑动
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'center', // 居中对齐
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
    position: 'relative', // 为选中图标定位
  },
  locationItemSelected: {
    backgroundColor: 'rgba(249, 168, 137, 0.1)',
  },
  locationItemText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '400',
  },
  locationItemTextSelected: {
    fontWeight: '600',
    color: '#F9A889',
  },
  checkmarkContainer: {
    position: 'absolute',
    right: 16, // 固定在右侧，不影响文字居中
    top: '50%',
    marginTop: -10, // 垂直居中
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
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing[4],
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});