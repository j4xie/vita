import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { fetchSchoolList } from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { getSchoolVolunteerStats } from '../../services/volunteerAPI';
import { getSchoolVolunteerCount } from '../../services/userStatsAPI';
import { SegmentedGlass } from '../../ui/glass/SegmentedGlass';
import { GlassSearchBar } from '../../ui/glass/GlassSearchBar';
import { LiquidGlassListItem } from '../../ui/glass/LiquidGlassListItem';
import { Glass } from '../../ui/glass/GlassTheme';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { i18n } from '../../utils/i18n';

// Mock schools data removed - using real API data only

export const VolunteerListLiquidScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { permissions, user } = useUser(); // 获取用户权限和用户信息
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [schools, setSchools] = useState<any[]>([]); // 初始为空，避免显示Mock数据
  const [loading, setLoading] = useState(true); // 显示loading状态
  
  // 🚀 滚动状态管理防止误触
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // 学校卡片放大跳转动画系统 - v2方案
  const [cardLayouts, setCardLayouts] = useState<Map<string, any>>(new Map());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  
  // 动画值
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const cardX = useSharedValue(0);
  const cardY = useSharedValue(0);
  const cornerRadius = useSharedValue(16);
  const blurGain = useSharedValue(0);
  const highlightGain = useSharedValue(1);

  // 加载真实学校数据
  const loadSchoolData = useCallback(async () => {
    try {
      setLoading(true); // 显示loading状态
      const result = await fetchSchoolList();
      
      if (result.code === 200 && result.data) {
        // 根据用户权限过滤学校数据
        let filteredSchools = result.data.filter(school => school.deptId >= 210);
        
        // 分管理员：只能看到自己的学校
        if (permissions.getDataScope() === 'school') {
          const userDeptId = user?.deptId;
          if (userDeptId) {
            filteredSchools = filteredSchools.filter(school => school.deptId === userDeptId);
            console.log('📊 [SCHOOL-FILTER] 分管理员权限：只显示本校', { userDeptId, filteredCount: filteredSchools.length });
          }
        }
        
        // 🌍 FIXED: 将学校数据转换为组件需要的格式，保留API原始字段
        const realSchools = filteredSchools.map(school => ({
            id: school.deptId.toString(),
            // 🚨 FIX: 保留API原始字段，让接收组件根据语言选择显示
            deptId: school.deptId,
            deptName: school.deptName,      // 中文名称
            engName: school.engName,        // 英文名称  
            aprName: school.aprName,        // 缩写名称
            // 🔄 向后兼容：提供nameCN/nameEN字段
            nameCN: school.deptName,
            nameEN: school.engName || school.deptName,
            // 🗑️ 根据用户要求移除位置显示，但保留数据用于搜索
            city: getSchoolCity(school.deptName),
            state: getSchoolState(school.deptName),
            volunteers: 0, // 将通过API获取真实数据
            tint: getSchoolColor(school.deptName),
          }));
        
        // 为每个学校获取真实的用户统计数据（包括各角色）
        const schoolsWithStats = await Promise.all(
          realSchools.map(async (school) => {
            try {
              // 使用真实的用户统计API，计算各角色用户
              const volunteerCount = await getSchoolVolunteerCount(school.deptId);
              
              console.log(`学校${school.deptName}(ID:${school.deptId})志愿者数量:`, volunteerCount);
              
              return {
                ...school,
                volunteers: volunteerCount, // 真实的志愿者数量（内部员工+管理员）
              };
            } catch (error) {
              console.warn(`获取学校${school.deptName}用户统计失败:`, error);
              return {
                ...school,
                volunteers: 0, // 失败时显示0
              };
            }
          })
        );
        
        setSchools(schoolsWithStats);
      } else {
        // API失败时显示空状态
        console.warn('学校数据加载失败');
        setSchools([]);
      }
    } catch (error) {
      console.error('加载学校数据失败:', error);
      // API失败时显示空状态
      setSchools([]);
    } finally {
      setLoading(false); // 恢复loading状态管理
    }
  }, []);

  // 组件加载时立即获取数据 - 避免初始显示"没有学校"
  React.useEffect(() => {
    loadSchoolData();
  }, []); // 只在组件加载时执行一次

  // 学校显示名称映射
  const getSchoolDisplayName = (deptName: string): string => {
    const nameMap: Record<string, string> = {
      'UCD': '加州大学戴维斯分校',
      'UCB': '加州大学伯克利分校',
      'UCLA': '加州大学洛杉矶分校',
      'USC': '南加州大学',
      'UCI': '加州大学尔湾分校',
      'UCSD': '加州大学圣地亚哥分校',
      'UCSB': '加州大学圣芭芭拉分校',
      'UCSC': '加州大学圣克鲁兹分校',
      'UW': '华盛顿大学',
      'UMN': '明尼苏达大学',
      'U Berklee Music': '伯克利音乐学院',
    };
    return nameMap[deptName] || deptName;
  };

  // 学校城市映射
  const getSchoolCity = (deptName: string): string => {
    const cityMap: Record<string, string> = {
      'UCD': '戴维斯', 'UCB': '伯克利', 'UCLA': '洛杉矶', 'USC': '洛杉矶',
      'UCI': '尔湾', 'UCSD': '圣地亚哥', 'UCSB': '圣芭芭拉', 'UCSC': '圣克鲁兹',
      'UW': '西雅图', 'UMN': '明尼阿波利斯', 'U Berklee Music': '波士顿',
    };
    return cityMap[deptName] || '未知城市';
  };

  // 学校州映射
  const getSchoolState = (deptName: string): string => {
    const stateMap: Record<string, string> = {
      'UCD': 'CA', 'UCB': 'CA', 'UCLA': 'CA', 'USC': 'CA',
      'UCI': 'CA', 'UCSD': 'CA', 'UCSB': 'CA', 'UCSC': 'CA',
      'UW': 'WA', 'UMN': 'MN', 'U Berklee Music': 'MA',
    };
    return stateMap[deptName] || 'Unknown';
  };

  // 学校颜色映射
  const getSchoolColor = (deptName: string): string => {
    const colorMap: Record<string, string> = {
      'UCD': '#8F8CF0', 'UCB': '#F0A1A1', 'UCLA': '#A1E3F0', 'USC': '#F0E1A1',
      'UCI': '#F6E39B', 'UCSD': '#D1C4E9', 'UCSB': '#C8E6C9', 'UCSC': '#FFCDD2',
      'UW': '#E1BEE7', 'UMN': '#FFCDD2', 'U Berklee Music': '#FFE0B2',
    };
    return colorMap[deptName] || '#E0E0E0';
  };
  
  // 动画样式 - 仅原位置缩放
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value } // 仅缩放，不移动位置
    ],
    opacity: cardOpacity.value,
  }));

  // 🌍 FIXED: 过滤学校数据 - 使用正确的字段名
  const filteredSchools = schools.filter(school => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      school.deptName?.toLowerCase().includes(query) ||
      school.engName?.toLowerCase().includes(query) ||
      school.aprName?.toLowerCase().includes(query) ||
      school.city?.toLowerCase().includes(query)
    );
  });

  // 下拉刷新 - 使用真实API
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSchoolData();
    setRefreshing(false);
  }, [loadSchoolData]);

  // 处理学校选择
  // 记录卡片布局信息
  const handleCardLayout = useCallback((schoolId: string, event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setCardLayouts(prev => new Map(prev.set(schoolId, { x, y, width, height })));
  }, []);
  
  // 学校卡片点击 - v2方案放大跳转动画
  const handleSchoolPress = useCallback((school: any) => {
    if (isTransitioning) return; // 防止重复点击
    
    const cardLayout = cardLayouts.get(school.id);
    console.log('🎬 点击学校:', school.nameCN, '布局信息:', cardLayout);
    
    if (!cardLayout) {
      // 没有布局信息，直接切换
      navigation.navigate('SchoolDetail' as never, { school } as never);
      return;
    }
    
    setIsTransitioning(true);
    setSelectedSchoolId(school.id);
    
    // 阶段0: 按压反馈 (0-100ms)
    cardScale.value = withTiming(0.98, { 
      duration: 120, 
      easing: Easing.bezier(0.2, 0.9, 0.2, 1) 
    });
    
    // haptic反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // 延迟执行主动画
    setTimeout(() => {
      startMorphAnimation(school, cardLayout);
    }, 100);
  }, [isTransitioning, cardLayouts, navigation]);

  // 🚀 滚动状态处理函数
  const handleScrollBegin = () => {
    setIsScrolling(true);
    console.log('📜 [VOLUNTEER-LIQUID] 开始滚动，禁用学校卡片点击');
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleScrollEnd = () => {
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      console.log('📜 [VOLUNTEER-LIQUID] 滚动结束，重新启用学校卡片点击');
    }, 100); // 缩短到100ms，更快恢复点击
  };

  const handleScrollEvent = () => {
    if (!isScrolling) {
      setIsScrolling(true);
    }
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 100); // 缩短到100ms，更快恢复点击
  };

  // 🧹 清理滚动定时器
  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Morph-to-Header动画执行
  const startMorphAnimation = useCallback((school: any, layout: any) => {
    console.log('🎬 开始Morph动画到Header位置');
    
    // 计算目标Header坐标 (志愿者列表页面顶部)
    const targetX = 16; // 页面左边距
    const targetY = insets.top + 16; // Header顶部位置
    
    // 阶段1: 放大跳出 (100-320ms) - 克制放大1.15
    const animationDuration = 220;
    
    cardScale.value = withSpring(1.15, { // 克制在1.12-1.18
      damping: 20,
      stiffness: 220,
      mass: 1
    });
    
    cardOpacity.value = withSequence(
      withTiming(0.85, { duration: animationDuration * 0.7 }),
      withTiming(0.2, { duration: animationDuration * 0.3 })
    );
    
    // 修正: 不移动位置，仅在原位置放大
    cardX.value = 0; // 不移动X坐标
    cardY.value = 0; // 不移动Y坐标
    
    // 材质联动
    cornerRadius.value = withTiming(0, { duration: animationDuration });
    blurGain.value = withSequence(
      withTiming(4, { duration: animationDuration * 0.4 }),
      withTiming(0, { duration: animationDuration * 0.3 })
    );
    highlightGain.value = withTiming(1.15, { duration: animationDuration * 0.5 });
    
    // 阶段2: 页面切换 - 45%启动，无slide动画
    setTimeout(() => {
      console.log('🚀 45%进度，开始页面切换');
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // 使用自定义动画或无动画切换
      navigation.navigate('SchoolDetail' as never, { 
        school,
        // 禁用默认slide动画
        animationEnabled: false
      } as never);
    }, animationDuration * 0.45);
    
    // 完成清理
    setTimeout(() => {
      setIsTransitioning(false);
      setSelectedSchoolId(null);
      cardScale.value = 1;
      cardOpacity.value = 1;
      cardX.value = 0;
      cardY.value = 0;
      cornerRadius.value = 16;
      blurGain.value = 0;
      highlightGain.value = 1;
    }, 500);
  }, [insets.top, navigation]);

  // 🌍 FIXED: 渲染列表项 - 传递正确的API字段给组件
  const renderSchoolItem = ({ item }: { item: any }) => {
    const isAnimatingCard = selectedSchoolId === item.id;
    
    return (
      <View onLayout={(event) => handleCardLayout(item.id, event)}>
        {isAnimatingCard ? (
          <Animated.View style={animatedCardStyle}>
            <LiquidGlassListItem
              id={item.id}
              nameCN={item.nameCN}
              nameEN={item.nameEN}
              deptName={item.deptName}
              engName={item.engName}
              aprName={item.aprName}
              city={item.city}
              state={item.state}
              volunteers={item.volunteers}
              tint={item.tint}
              schoolId={item.id}
              onPress={() => handleSchoolPress(item)}
              disabled={isTransitioning}
              isScrolling={isScrolling}  // 🚀 传递滚动状态
            />
          </Animated.View>
        ) : (
          <LiquidGlassListItem
            id={item.id}
            nameCN={item.nameCN}
            nameEN={item.nameEN}
            deptName={item.deptName}
            engName={item.engName}
            aprName={item.aprName}
            city={item.city}
            state={item.state}
            volunteers={item.volunteers}
            tint={item.tint}
            schoolId={item.id}
            onPress={() => handleSchoolPress(item)}
            disabled={isTransitioning}
            isScrolling={isScrolling}  // 🚀 传递滚动状态
          />
        )}
      </View>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('school.no_volunteers_found')}</Text>
      <Text style={styles.emptySubtext}>{t('explore.category_developing_message', { category: t('wellbeing.title') })}</Text>
    </View>
  );

  return (
    <View style={[styles.container, dmStyles.page.container]}>
      {/* 移除背景渐变，由父组件WellbeingScreen提供 */}

      <View style={styles.content}>
        {/* 搜索框 - 直接显示，不需要Tab判断 */}
        <View style={styles.searchSection}>
          <GlassSearchBar
            placeholder={t('common.search_schools')}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 志愿者学校列表 - 直接显示 */}
        <View style={styles.listContainer}>
          <FlatList
            data={filteredSchools}
            renderItem={renderSchoolItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={handleScrollBegin}     // 开始拖动滚动
            onScrollEndDrag={handleScrollEnd}         // 拖动结束
            onMomentumScrollBegin={handleScrollBegin} // 惯性滚动开始
            onMomentumScrollEnd={handleScrollEnd}     // 惯性滚动结束
            onScroll={handleScrollEvent}              // 任何滚动变化
            scrollEventThrottle={1}                   // 高频检测
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Glass.textWeak}
                title={t('common.loading')}
              />
            }
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: insets.bottom + 80,
              }
            ]}
            ListEmptyComponent={renderEmptyState}
            // 性能优化
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            initialNumToRender={8}
            windowSize={7}
            getItemLayout={(data, index) => ({
              length: 96, // 固定行高包含阴影
              offset: 96 * index,
              index,
            })}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  // 搜索区域
  searchSection: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    paddingTop: 16, // 顶部间距
    marginBottom: 16,
  },

  // 列表容器
  listContainer: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
  },

  // 空状态
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Glass.textMain,
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: Glass.textWeak,
    textAlign: 'center',
  },
});

export default VolunteerListLiquidScreen;