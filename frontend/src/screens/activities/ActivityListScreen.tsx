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
  Alert,
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
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { BRAND_GLASS, BRAND_INTERACTIONS, BRAND_GRADIENT, LIQUID_GLASS_LAYERS, DAWN_GRADIENTS, DAWN_OVERLAYS } from '../../theme/core';
import { SimpleActivityCard } from '../../components/cards/SimpleActivityCard';
import { GridActivityCard } from '../../components/cards/GridActivityCard';
import { LiquidGlassTab } from '../../components/ui/LiquidGlassTab';
import { FilterBottomSheet } from '../../components/ui/FilterBottomSheet';
import { ListSkeleton } from '../../components/ui/SkeletonScreen';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { adaptActivityList, FrontendActivity } from '../../utils/activityAdapter';
import { ACTIVITY_CATEGORIES, getCategoryName } from '../../data/activityCategories';
// import { getActivityListSimple } from '../../utils/networkHelper'; // 废弃：不带token的简化版本
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useFilter } from '../../context/FilterContext';
import { useTabBarVerification } from '../../hooks/useTabBarStateGuard';
// import { OrganizationProvider, useOrganization } from '../../context/OrganizationContext'; // 移除组织功能
// import { OrganizationSwitcher } from '../../components/organization/OrganizationSwitcher'; // 移除组织切换器
import { activityStatsService } from '../../services/activityStatsService';
import { useUser } from '../../context/UserContext';
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
  const { user } = useUser(); // Fixed user initialization order
  
  // 🛡️ TabBar状态守护：ActivityList作为Tab根页面，通常由TabNavigator自动管理
  // 只在需要调试时启用
  useTabBarVerification('ActivityList', { debugLogs: false });
  // V2.0 性能降级策略和分层配置
  const { handleScrollEvent: performanceScrollHandler, isPerformanceDegraded, getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', false); // 假设浅色模式
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'zh' | 'en';
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const refreshAnimation = useSharedValue(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(0); // Changed to index for CategoryBar
  const [searchText, setSearchText] = useState(''); // 搜索文本状态
  const [tabBarSearchText, setTabBarSearchText] = useState(''); // TabBar搜索文本状态
  // ✅ 状态缓存机制：缓存已确认的报名状态
  const [activityStatusCache, setActivityStatusCache] = useState<Map<string, 'registered' | 'checked_in'>>(new Map());
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list'); // 布局模式状态
  
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
  
  // 监听布局切换事件
  useEffect(() => {
    const layoutChangeSubscription = DeviceEventEmitter.addListener('activityLayoutChanged', (newLayout: 'list' | 'grid') => {
      console.log(`📱 收到布局切换事件: ${newLayout}`);
      console.log(`📱 当前布局: ${viewLayout} -> 新布局: ${newLayout}`);
      setViewLayout(newLayout);
    });

    return () => {
      layoutChangeSubscription?.remove();
    };
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

  // 🆕 监听TabBar搜索事件 - 实现当前页面内搜索
  useEffect(() => {
    const searchListener = DeviceEventEmitter.addListener('searchTextChanged', (data: { searchText: string; timestamp: number }) => {
      console.log('🔍 [ACTIVITY-LIST] 收到TabBar搜索事件:', {
        searchText: data.searchText,
        timestamp: data.timestamp,
        currentSearchText: searchText
      });
      
      setTabBarSearchText(data.searchText);
      
      // 搜索防抖：清除之前的延时器，300ms后执行搜索
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        console.log('🔍 [ACTIVITY-LIST] 防抖执行搜索:', data.searchText);
        setSearchText(data.searchText);
      }, 300);
    });
    
    return () => {
      searchListener?.remove();
      // 清理搜索防抖定时器
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [searchText]);

  // ✅ 增强状态缓存和同步机制 - 监听报名成功事件
  useEffect(() => {
    const registrationListener = DeviceEventEmitter.addListener('activityRegistered', (data: { activityId: string, newRegisteredCount?: number, source?: string }) => {
      console.log('📋 [ActivityList] 收到活动报名成功事件:', {
        activityId: data.activityId,
        newRegisteredCount: data.newRegisteredCount,
        source: data.source,
        currentActivitiesCount: activities.length,
        timestamp: new Date().toISOString(),
        hasUserLogin: !!(user?.id || user?.userId)
      });
      
      // ✅ 立即更新本地状态缓存
      setActivityStatusCache(prev => {
        const newCache = new Map(prev);
        newCache.set(data.activityId, 'registered');
        console.log('📋 [ActivityList] 更新状态缓存:', {
          activityId: data.activityId,
          newStatus: 'registered',
          cacheSize: newCache.size
        });
        return newCache;
      });
      
      // ✅ 更新活动列表中的数据
      setActivities(prevActivities => {
        const updatedActivities = prevActivities.map(activity => {
          if (activity.id === data.activityId) {
            const updatedActivity = {
              ...activity,
              status: 'registered' as const,
              // ✅ 如果有新的报名人数，立即更新
              ...(data.newRegisteredCount !== undefined && {
                registeredCount: data.newRegisteredCount,
                attendees: data.newRegisteredCount
              })
            };
            
            console.log('✅ [ActivityList] 立即更新活动数据:', {
              id: activity.id,
              title: activity.title,
              oldStatus: activity.status,
              newStatus: updatedActivity.status,
              oldRegisteredCount: activity.registeredCount,
              newRegisteredCount: updatedActivity.registeredCount
            });
            
            return updatedActivity;
          }
          return activity;
        });
        
        return updatedActivities;
      });
      
      // ✅ 延迟重新获取数据以确保后端状态已同步
      setTimeout(() => {
        console.log('🔄 [ActivityList] 延迟重新获取活动数据以确保状态同步');
        if ((user?.id || user?.userId)) {
          fetchActivities(1, true); // 强制刷新第一页
        }
      }, 2000); // 增加到2秒，给后端更多时间处理
    });

    // ✅ 监听活动签到成功事件
    const signinListener = DeviceEventEmitter.addListener('activitySignedIn', (data: { activityId: string }) => {
      console.log('📋 [ActivityList] 收到活动签到成功事件:', {
        activityId: data.activityId,
        timestamp: new Date().toISOString()
      });
      
      // ✅ 更新状态缓存
      setActivityStatusCache(prev => {
        const newCache = new Map(prev);
        newCache.set(data.activityId, 'checked_in');
        return newCache;
      });
      
      // ✅ 更新本地状态
      setActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === data.activityId 
            ? { ...activity, status: 'checked_in' as const }
            : activity
        )
      );
      
      // ✅ 延迟重新获取数据确保同步
      setTimeout(() => {
        console.log('🔄 [ActivityList] 延迟重新获取活动数据以确保签到状态同步');
        if ((user?.id || user?.userId)) {
          fetchActivities(1, true); // 强制刷新第一页
        }
      }, 1000); // 签到操作延迟较短
    });

    return () => {
      registrationListener?.remove();
      signinListener?.remove();
    };
  }, [user?.id, user?.userId, activities.length]); // 移除fetchActivities依赖避免循环依赖
  

  // 优化自定义刷新动画样式
  const refreshAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      refreshAnimation.value,
      [0, 0.3, 0.7, 1],
      [1, 1.15, 1.05, 1],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      refreshAnimation.value,
      [0, 0.2, 0.8, 1],
      [0.7, 1, 1, 0.9],
      Extrapolate.CLAMP
    );
    
    const rotate = interpolate(
      refreshAnimation.value,
      [0, 1],
      [0, 720],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { scale },
        { rotate: `${rotate}deg` }
      ],
      opacity,
    };
  });

  // Animation now handled by LiquidGlassTab component
  
  // 修改为基于时间的3个状态 - 使用翻译函数
  const filterTabs = ['all', 'upcoming', 'ended'];
  const segmentLabels = [
    t('filters.status.all') || '全部',
    t('filters.status.upcoming') || '即将开始',
    t('filters.status.ended') || '已结束',
  ];

  // V1.1 规范: BottomSheet 过滤器选项配置 - 使用翻译系统
  const categoryFilters = [
    { id: 'academic', label: t('filters.categories.academic') || '学术', icon: 'school-outline', count: 0, color: theme.colors.primary },
    { id: 'social', label: t('filters.categories.social') || '社交', icon: 'people-outline', count: 0, color: theme.colors.secondary },
    { id: 'career', label: t('filters.categories.career') || '职业', icon: 'briefcase-outline', count: 0, color: theme.colors.success },
    { id: 'sports', label: t('filters.categories.sports') || '运动', icon: 'fitness-outline', count: 0, color: theme.colors.warning },
    { id: 'culture', label: t('filters.categories.culture') || '文化', icon: 'library-outline', count: 0, color: theme.colors.primary },
    { id: 'volunteer', label: t('filters.categories.volunteer') || '志愿', icon: 'heart-outline', count: 0, color: theme.colors.danger },
  ];

  const statusFilters = [
    { id: 'upcoming', label: t('filters.status.upcoming') || '即将开始', icon: 'time-outline' },
    { id: 'ended', label: t('filters.status.ended') || '已结束', icon: 'close-circle-outline' },
  ];

  const locationFilters = [];

  const dateFilters = [];

  
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
      
      // 🔧 支持访客模式和个性化模式 - 修复用户ID获取逻辑
      const isLoggedIn = !!(user?.id || user?.userId);
      const userIdToUse = isLoggedIn ? (user.id || user.userId) : undefined;
      const parsedUserId = userIdToUse ? parseInt(String(userIdToUse)) : undefined;
      
      // 🔧 验证用户ID有效性
      const isValidUserId = parsedUserId && !isNaN(parsedUserId) && parsedUserId > 0;
      
      console.log('📋 [FETCH-ACTIVITIES] 准备获取活动列表:', {
        page,
        isRefresh,
        isLoggedIn,
        userIdToUse,
        parsedUserId,
        isValidUserId,
        mode: isValidUserId ? '个性化模式' : '访客模式',
        category: selectedCategory?.name || '全部',
        searchText: searchText || '无搜索'
      });
      
      const result = await pomeloXAPI.getActivityList({
        pageNum: page,
        pageSize: 20,
        userId: isValidUserId ? parsedUserId : undefined, // 🔧 修复：确保传递有效的数字ID
        name: searchText || undefined,
        categoryId: selectedCategory?.id || undefined,
      });
      
      console.log('📋 [FETCH-ACTIVITIES] API响应状态:', {
        success: result.code === 200,
        dataLength: result.data?.rows?.length || 0,
        hasPersonalizedData: result.data?.rows?.[0]?.signStatus !== undefined,
        sampleActivity: result.data?.rows?.[0] ? {
          id: result.data.rows[0].id,
          title: result.data.rows[0].activityName,
          signStatus: result.data.rows[0].signStatus
        } : null
      });

      const adaptedData = adaptActivityList(result, currentLanguage);
      
      // 调试：检查适配后的活动状态
      console.log('🎯 活动数据适配结果:', {
        success: adaptedData.success,
        total: adaptedData.total,
        activitiesCount: adaptedData.activities.length,
        statusSample: adaptedData.activities.slice(0, 3).map(activity => ({
          id: activity.id,
          title: activity.title,
          status: activity.status
        }))
      });

      if (adaptedData.success) {
        // ✅ 应用缓存状态的活动数据 - 增强调试信息
        console.log('🔍 [FETCH-ACTIVITIES] 当前状态缓存:', {
          cacheSize: activityStatusCache.size,
          cachedActivities: Array.from(activityStatusCache.entries()),
          activitiesCount: adaptedData.activities.length
        });
        
        const activitiesWithCachedStatus = adaptedData.activities.map(activity => {
          const cachedStatus = activityStatusCache.get(activity.id);
          
          // ✅ 详细记录每个活动的处理过程
          console.log('📊 [FETCH-ACTIVITIES] 处理活动:', {
            activityId: activity.id,
            title: activity.title?.substring(0, 10) + '...',
            originalStatus: activity.status,
            cachedStatus: cachedStatus,
            willApplyCache: !!(cachedStatus && cachedStatus !== 'upcoming')
          });
          
          // ✅ 关键修复：优先级判断 - 缓存状态 > API状态
          let finalStatus = activity.status;
          
          // 如果有缓存状态且不是upcoming，优先使用缓存
          if (cachedStatus && cachedStatus !== 'upcoming') {
            finalStatus = cachedStatus;
            console.log('✅ [FETCH-ACTIVITIES] 应用缓存状态:', {
              activityId: activity.id,
              title: activity.title,
              originalStatus: activity.status,
              cachedStatus: cachedStatus,
              finalStatus: finalStatus
            });
          } 
          // 如果没有缓存但API返回了报名状态，也要缓存起来
          else if (activity.status === 'registered' || activity.status === 'checked_in') {
            setActivityStatusCache(prev => {
              const newCache = new Map(prev);
              newCache.set(activity.id, activity.status as 'registered' | 'checked_in');
              console.log('✅ [FETCH-ACTIVITIES] 缓存API状态:', {
                activityId: activity.id,
                status: activity.status,
                cacheSize: newCache.size
              });
              return newCache;
            });
            finalStatus = activity.status;
          } 
          else {
            // 调试：记录未应用缓存的情况
            console.log('🔍 [FETCH-ACTIVITIES] 未应用缓存:', {
              activityId: activity.id,
              title: activity.title,
              originalStatus: activity.status,
              cachedStatus: cachedStatus,
              finalStatus: finalStatus,
              reason: !cachedStatus ? '无缓存状态' : cachedStatus === 'upcoming' ? '缓存状态为upcoming' : '未知原因'
            });
          }
          
          return { ...activity, status: finalStatus };
        });
        
        if (page === 1 || isRefresh) {
          console.log('🔄 [FETCH-ACTIVITIES] 设置活动列表:', {
            totalActivities: activitiesWithCachedStatus.length,
            registeredActivities: activitiesWithCachedStatus.filter(a => a.status === 'registered').length,
            checkedInActivities: activitiesWithCachedStatus.filter(a => a.status === 'checked_in').length,
            upcomingActivities: activitiesWithCachedStatus.filter(a => a.status === 'upcoming').length
          });
          setActivities(activitiesWithCachedStatus);
        } else {
          // 防止重复数据，使用Set去重
          setActivities(prev => {
            const existingIds = new Set(prev.map(activity => activity.id));
            const newActivities = activitiesWithCachedStatus.filter(activity => !existingIds.has(activity.id));
            return [...prev, ...newActivities];
          });
        }
        setTotal(adaptedData.total);
        setHasMore(adaptedData.activities.length === 20); // 如果返回数据等于pageSize，说明可能还有更多
      } else {
        console.error('获取活动列表失败:', adaptedData.message);
        setError(t('common.api_error') + ': ' + adaptedData.message);
        if (page === 1) {
          setActivities([]);
        }
      }
    } catch (error: any) {
      // 优化错误日志，避免在用户界面显示技术错误
      console.warn('获取活动数据失败:', error.message || error);
      
      // 判断错误类型并设置用户友好的错误信息
      if (error.name === 'AbortError') {
        setError(t('common.network_timeout'));
      } else if (error.message?.includes('Network request failed')) {
        setError(t('common.network_connection_error'));
      } else if (error.message?.includes('fetch')) {
        setError(t('common.server_connection_failed'));
      } else {
        setError(t('common.load_failed'));
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
  }, [activeFilter, searchText, currentLanguage, user?.id, user?.userId, activityStatusCache]); // 🔧 添加用户ID和状态缓存到依赖项

  // 调试：打印API响应
  useEffect(() => {
    console.log('当前活动数据:', activities.length, '条活动');
    if (activities.length > 0) {
      console.log('第一个活动:', activities[0]);
    }
  }, [activities]);

  

  // 下拉刷新 - 完整优化版本，使用硬编码文本避免翻译问题
  const onRefresh = useCallback(async () => {
    try {
      // 触感反馈 - 开始刷新
      if (Platform.OS === 'ios') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
          // 静默处理触感反馈错误
        }
      }
      
      // 开始刷新动画
      setRefreshing(true);
      setRefreshProgress(0);
      refreshAnimation.value = withTiming(1, {
        duration: 250,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      });

      // 优化渐进式刷新进度
      const progressSteps = [0.3, 0.6, 0.9, 1.0];
      const stepDurations = [100, 120, 100, 80];
      
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
        setRefreshProgress(progressSteps[i]);
        
        // 在中间步骤添加轻微的触感反馈
        if (i === 1 && Platform.OS === 'ios') {
          try {
            Haptics.selectionAsync();
          } catch (e) {}
        }
      }

      // 执行实际的数据获取
      await fetchActivities(1, true);
      
      // 成功反馈
      if (Platform.OS === 'ios') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }
      
      // 延迟展示完成状态
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 结束动画
      refreshAnimation.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      
      setRefreshProgress(0);
    } catch (error) {
      console.error('刷新失败:', error);
      setRefreshProgress(0);
      
      // 错误触感反馈
      if (Platform.OS === 'ios') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
      }
    } finally {
      // 重置刷新状态
      setTimeout(() => {
        setRefreshing(false);
      }, 100);
    }
  }, [fetchActivities, refreshAnimation]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(currentPage + 1);
      setCurrentPage(prev => prev + 1);
    }
  }, [loading, hasMore, currentPage, fetchActivities]);

  // 加载用户布局偏好
  useEffect(() => {
    const loadLayoutPreference = async () => {
      try {
        const savedLayout = await AsyncStorage.getItem('activity_view_layout');
        if (savedLayout && (savedLayout === 'list' || savedLayout === 'grid')) {
          setViewLayout(savedLayout);
        }
      } catch (error) {
        console.warn('Failed to load layout preference:', error);
      }
    };
    
    loadLayoutPreference();
  }, []);

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
        // 状态过滤 - 使用后端type字段（高效）
        if (statusFilters.some(f => f.id === filterId)) {
          // 使用相同的前端实时计算逻辑
          const now = new Date();
          const activityStart = new Date(activity.date + ' ' + (activity.time || '00:00'));
          const activityEnd = activity.endDate ? new Date(activity.endDate + ' 23:59:59') : activityStart;
          
          if (filterId === 'upcoming') {
            return activityStart.getTime() > now.getTime();
          } else if (filterId === 'ended') {
            return activityEnd.getTime() < now.getTime();
          }
          return false;
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
    
    // 调试搜索逻辑
    if (searchText.length > 0 && !matchesSearch) {
      console.log('🔍 [SEARCH-DEBUG] 活动被搜索过滤掉:', {
        title: activity.title,
        location: activity.location,
        searchText
      });
    }
    
    // 基于时间的状态匹配 - 前端实时计算确保准确性
    const currentFilterKey = filterTabs[activeFilter];
    let matchesFilter = true;
    
    if (currentFilterKey !== 'all') {
      const now = new Date();
      const activityStart = new Date(activity.date + ' ' + (activity.time || '00:00'));
      const activityEnd = activity.endDate ? new Date(activity.endDate + ' 23:59:59') : activityStart;
      
      // 前端实时计算活动状态，不依赖后端可能过时的状态
      switch(currentFilterKey) {
        case 'upcoming':
          // 即将开始：活动开始时间在现在之后
          matchesFilter = activityStart.getTime() > now.getTime();
          break;
        case 'ended':
          // 已结束：活动结束时间在现在之前
          matchesFilter = activityEnd.getTime() < now.getTime();
          break;
        default:
          matchesFilter = true;
      }
    }
    
    // 过滤器匹配
    if (activeFilters.length > 0) {
      const matchesActiveFilters = activeFilters.some(filterId => {
        if (categoryFilters.some(f => f.id === filterId)) {
          return activity.category === filterId;
        }
        if (statusFilters.some(f => f.id === filterId)) {
          // 使用相同的前端实时计算逻辑
          const now = new Date();
          const activityStart = new Date(activity.date + ' ' + (activity.time || '00:00'));
          const activityEnd = activity.endDate ? new Date(activity.endDate + ' 23:59:59') : activityStart;
          
          if (filterId === 'upcoming') {
            return activityStart.getTime() > now.getTime();
          } else if (filterId === 'ended') {
            return activityEnd.getTime() < now.getTime();
          }
          return false;
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
    console.log('🔍 [ActivityList] 点击活动，传递的数据:', {
      hasActivity: !!activity,
      activityKeys: activity ? Object.keys(activity) : [],
      activitySample: activity ? {
        id: activity.id,
        title: activity.title,
        location: activity.location,
        date: activity.date,
        attendees: activity.attendees,
        maxAttendees: activity.maxAttendees
      } : null
    });
    navigation.navigate('ActivityDetail', { activity });
  };

  // V1.1 规范: 滑动操作处理函数
  const handleShare = (activity: any) => {
    console.log('分享活动:', activity.title);
    // TODO: 实现分享功能
  };

  const handleBookmark = async (activity: any) => {
    if (!user?.id) {
      Alert.alert(t('auth.login_required'), t('auth.login_required_message'));
      return;
    }
    
    try {
      const isBookmarked = await activityStatsService.toggleBookmark(user.id, activity.id);
      console.log(`${isBookmarked ? '收藏' : '取消收藏'}活动:`, activity.title);
      
      // 触觉反馈
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // TODO: 可以添加Toast提示
    } catch (error) {
      console.error('收藏操作失败:', error);
      Alert.alert(t('common.operation_failed'), t('activities.bookmark_unavailable'));
    }
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

  // 布局切换处理函数
  const handleLayoutChange = async (layout: 'list' | 'grid') => {
    console.log(`🔄 布局切换: ${viewLayout} -> ${layout}`);
    setViewLayout(layout);
    
    // 保存用户偏好
    try {
      await AsyncStorage.setItem('activity_view_layout', layout);
      console.log(`💾 布局偏好已保存: ${layout}`);
    } catch (error) {
      console.warn('Failed to save layout preference:', error);
    }
  };

  // CategoryBar - SectionHeader (仅包含CategoryBar)
  const renderListHeader = () => null;

  // 移除CategoryBar - 现在所有功能都在header中
  const renderSectionHeader = () => null;

  // 计算活动卡片的动态高度（用于瀑布流）
  const calculateActivityHeight = (activity: FrontendActivity) => {
    const baseHeight = 180; // 基础高度
    const titleLength = activity.title.length;
    const locationLength = activity.location.length;
    
    // 标题长度影响高度
    const titleHeightAddition = titleLength > 20 ? 25 : 
                               titleLength > 15 ? 15 : 
                               titleLength > 10 ? 10 : 0;
    
    // 地点长度影响高度
    const locationHeightAddition = locationLength > 15 ? 20 : 
                                  locationLength > 10 ? 10 : 0;
    
    // 基于活动ID的随机变化（确保一致性）
    const seed = parseInt(activity.id) % 7; // 0-6
    const randomAddition = seed * 15; // 0-90的高度变化
    
    return Math.min(300, Math.max(160, baseHeight + titleHeightAddition + locationHeightAddition + randomAddition));
  };

  // 瀑布流布局算法 - 分配到高度较低的列
  const formatWaterfallData = (activities: FrontendActivity[]) => {
    const leftColumn: FrontendActivity[] = [];
    const rightColumn: FrontendActivity[] = [];
    let leftHeight = 0;
    let rightHeight = 0;
    
    activities.forEach(activity => {
      const cardHeight = calculateActivityHeight(activity);
      
      // 将卡片分配到较矮的列
      if (leftHeight <= rightHeight) {
        leftColumn.push(activity);
        leftHeight += cardHeight;
      } else {
        rightColumn.push(activity);
        rightHeight += cardHeight;
      }
    });
    
    return { leftColumn, rightColumn };
  };

  // 获取瀑布流列数据
  const waterfallData = viewLayout === 'grid' ? formatWaterfallData(filteredActivities) : null;

  // 为 SectionList 格式化数据
  const sectionData = viewLayout === 'grid' 
    ? [{
        title: 'activities',
        data: waterfallData ? [{ type: 'waterfall', columns: waterfallData }] : [],
      }]
    : [{
        title: 'activities',
        data: filteredActivities,
      }];

  // 自定义刷新指示器组件 - 使用硬编码文本避免翻译键显示问题
  const CustomRefreshIndicator = () => (
    <View style={styles.customRefreshContainer}>
      <Reanimated.View style={[styles.customRefreshIcon, refreshAnimatedStyle]}>
        <Ionicons 
          name="refresh" 
          size={24} 
          color={theme.colors.primary} 
        />
      </Reanimated.View>
      {refreshProgress > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${refreshProgress * 100}%` }]} />
        </View>
      )}
      <Text style={styles.refreshText}>
        {refreshProgress === 0 ? t('activities.list.refresh') : 
         refreshProgress === 1 ? t('activities.list.refresh_complete') : t('activities.list.refreshing')}
      </Text>
    </View>
  );

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
          <View style={styles.headerContent}>
            {/* 状态筛选按钮组 */}
            <View style={styles.filterButtonsContainer}>
              {segmentLabels.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.filterButton}
                  onPress={() => handleSegmentChange(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.filterButtonText,
                    activeFilter === index && styles.filterButtonTextActive
                  ]}>
                    {label}
                  </Text>
                  {/* 底部指示器 */}
                  {activeFilter === index && (
                    <View style={styles.filterButtonIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {/* 右侧按钮组 */}
            <View style={styles.rightButtonsContainer}>
              {/* Web刷新按钮 */}
              {Platform.OS === 'web' && (
                <TouchableOpacity 
                  onPress={onRefresh} 
                  style={[styles.webRefreshButton, { opacity: refreshing ? 0.6 : 1 }]}
                  disabled={refreshing}
                >
                  <Reanimated.View style={[refreshAnimatedStyle]}>
                    <Ionicons 
                      name={refreshing ? "refresh" : "refresh-outline"} 
                      size={18} 
                      color="#F9A889" 
                    />
                  </Reanimated.View>
                </TouchableOpacity>
              )}
              
              {/* 扫码按钮 */}
              <TouchableOpacity onPress={handleScan} style={styles.scanButton}>
                <Ionicons name="scan-outline" size={20} color="#F9A889" />
              </TouchableOpacity>
            </View>
          </View>
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
        keyExtractor={(item: any) => {
          if (viewLayout === 'grid' && item.type === 'waterfall') {
            return 'waterfall-grid';
          }
          return item.id;
        }}
        renderItem={({ item, index }) => {
          if (viewLayout === 'grid' && item.type === 'waterfall') {
            // 瀑布流布局 - 渲染两列
            const { leftColumn, rightColumn } = item.columns;
            return (
              <View style={styles.waterfallContainer}>
                {/* 左列 */}
                <View style={styles.waterfallColumn}>
                  {leftColumn.map((activity: FrontendActivity) => (
                    <View key={activity.id} style={styles.waterfallItem}>
                      <GridActivityCard
                        activity={activity}
                        onPress={() => handleActivityPress(activity)}
                        onBookmark={user?.id ? handleBookmark : undefined}
                        isBookmarked={false}
                      />
                    </View>
                  ))}
                </View>
                
                {/* 右列 */}
                <View style={styles.waterfallColumn}>
                  {rightColumn.map((activity: FrontendActivity) => (
                    <View key={activity.id} style={styles.waterfallItem}>
                      <GridActivityCard
                        activity={activity}
                        onPress={() => handleActivityPress(activity)}
                        onBookmark={user?.id ? handleBookmark : undefined}
                        isBookmarked={false}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          } else {
            // 列表布局
            return (
              <SimpleActivityCard
                activity={item}
                onPress={() => handleActivityPress(item)}
              />
            );
          }
        }}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={true}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={[
          styles.listContent,
          { 
            paddingTop: 60 + insets.top, // 调整为适配新的header设计
            paddingBottom: 120 + insets.bottom,
          }
        ]}
        ItemSeparatorComponent={() => <View style={{ height: -14 }} />} // 再减少5px，总计-14px，卡片会有更明显的重叠
        {...(Platform.OS !== 'web' && {
          refreshControl: (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary, '#F9A889', '#FF8A65', theme.colors.secondary]}
              tintColor={theme.colors.primary}
              progressBackgroundColor="rgba(255, 255, 255, 0.95)"
              progressViewOffset={insets.top + 60}
              titleColor={theme.colors.text.secondary}
              title={
                refreshProgress === 0 ? t('activities.list.refresh') : 
                refreshProgress === 1 ? t('activities.list.refresh_complete') : 
                t('activities.list.refreshing')
              }
              {...(Platform.OS === 'ios' && {
                style: { 
                  backgroundColor: 'rgba(249, 168, 137, 0.05)',
                },
              })}
            />
          )
        })}
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
                <Text style={styles.emptyText}>{t('common.network_error')}</Text>
                <Text style={styles.emptySubtext}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchActivities(1, true)}
                >
                  <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </>
            ) : searchText.length > 0 ? (
              <>
                <Ionicons name="search-outline" size={64} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyText}>未找到搜索结果</Text>
                <Text style={styles.emptySubtext}>没有找到包含"{searchText}"的活动</Text>
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
                  ? (t('location.select_state') || '选择州') 
                  : (t('location.select_city_in_state', { state: selectedState }) || `选择城市 - ${selectedState}`)
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

// 组织切换器已移除 - 简化为空组件
const OrganizationSwitcherWrapper: React.FC = () => {
  return null;
};

// ==================== 主导出组件 ====================

const ActivityListScreenWithProvider: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ActivityListScreen />
    </GestureHandlerRootView>
  );
};

// 导出简化后的组件
export { ActivityListScreenWithProvider as ActivityListScreen };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Nearly invisible but solid for shadow calculation
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Nearly invisible but solid for shadow calculation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: 8,
    borderBottomWidth: 0,
    height: 60, // 增加高度以容纳按钮组
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
  // 移除categoryBarContainer样式，不再需要
  nearbyChipContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-evenly', // 更均匀的分布
    alignItems: 'center',
    marginRight: 12, // 增加与扫码按钮的间距
  },
  filterButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flex: 1, // 让每个按钮均匀占据空间
  },
  filterButtonActive: {
    // 移除背景色，使用底部指示器
  },
  filterButtonText: {
    fontSize: 14,
    color: '#8E8E93', // 未选中状态的灰色
    fontWeight: '500',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#1D1D1F', // 选中状态的深色
    fontWeight: '600',
  },
  filterButtonIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -9, // 宽度的一半，实现居中
    height: 3,
    width: 18,
    backgroundColor: '#F9A889',
    borderRadius: 1.5,
  },
  rightButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webRefreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F9A889',
    backgroundColor: 'rgba(249, 168, 137, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9A889',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  scanButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#F9A889',
    backgroundColor: 'rgba(249, 168, 137, 0.08)', // 添加微妙的橙色背景
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9A889',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
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
  
  // scanButton样式已在上面定义
  
  
  // List Container
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  
  
  // 列表内容样式
  listContent: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: 0, // 重置为0，由contentContainerStyle控制
    paddingBottom: 120,
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Nearly invisible but solid for shadow calculation
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
  
  // 瀑布流布局样式
  waterfallContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // 重要：让两列顶部对齐，允许不同高度
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  waterfallColumn: {
    width: '48%', // 两列各占48%，留2%间距
  },
  waterfallItem: {
    width: '100%',
    marginBottom: 8, // 卡片间距
  },
  
  // 自定义刷新指示器样式 - 优化版
  customRefreshContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#F9A889',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 168, 137, 0.1)',
  },
  customRefreshIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(249, 168, 137, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#F9A889',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  progressContainer: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(249, 168, 137, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#F9A889',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F9A889',
    borderRadius: 2,
    shadowColor: '#F9A889',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});