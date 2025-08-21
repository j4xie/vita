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
import { SegmentedGlass } from '../../ui/glass/SegmentedGlass';
import { GlassSearchBar } from '../../ui/glass/GlassSearchBar';
import { LiquidGlassListItem } from '../../ui/glass/LiquidGlassListItem';
import { Glass } from '../../ui/glass/GlassTheme';

// 模拟学校数据
const mockSchools = [
  {
    id: 'uw',
    nameCN: '华盛顿大学',
    nameEN: 'University of Washington',
    city: '西雅图',
    state: 'WA',
    volunteers: 156,
    tint: '#8F8CF0',
  },
  {
    id: 'usc',
    nameCN: '南加州大学',
    nameEN: 'University of Southern California',
    city: '洛杉矶',
    state: 'CA',
    volunteers: 203,
    tint: '#F0A1A1',
  },
  {
    id: 'ucla',
    nameCN: '加州大学洛杉矶分校',
    nameEN: 'UC Los Angeles',
    city: '洛杉矶',
    state: 'CA',
    volunteers: 287,
    tint: '#BBD6F6',
  },
  {
    id: 'ucb',
    nameCN: '加州大学伯克利分校',
    nameEN: 'UC Berkeley',
    city: '伯克利',
    state: 'CA',
    volunteers: 194,
    tint: '#B3E5FC',
  },
  {
    id: 'ucd',
    nameCN: '加州大学戴维斯分校',
    nameEN: 'UC Davis',
    city: '戴维斯',
    state: 'CA',
    volunteers: 142,
    tint: '#8FB7CA',
  },
  {
    id: 'uci',
    nameCN: '加州大学尔湾分校',
    nameEN: 'UC Irvine',
    city: '尔湾',
    state: 'CA',
    volunteers: 178,
    tint: '#F6E39B',
  },
  {
    id: 'ucsd',
    nameCN: '加州大学圣地亚哥分校',
    nameEN: 'UC San Diego',
    city: '圣地亚哥',
    state: 'CA',
    volunteers: 225,
    tint: '#D1C4E9',
  },
  {
    id: 'umn',
    nameCN: '明尼苏达大学',
    nameEN: 'University of Minnesota',
    city: '明尼阿波利斯',
    state: 'MN',
    volunteers: 134,
    tint: '#FFCDD2',
  },
];

export const VolunteerListLiquidScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [schools, setSchools] = useState(mockSchools);
  
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
  
  // 动画样式 - 仅原位置缩放
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value } // 仅缩放，不移动位置
    ],
    opacity: cardOpacity.value,
  }));

  // 过滤学校数据
  const filteredSchools = schools.filter(school => {
    if (!searchQuery) return true;
    return (
      school.nameCN.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.nameEN.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // 下拉刷新
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // 模拟API调用
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

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

  // 渲染列表项 - Hook修复版
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
              city={item.city}
              state={item.state}
              volunteers={item.volunteers}
              tint={item.tint}
              schoolId={item.id}
              onPress={() => handleSchoolPress(item)}
              disabled={isTransitioning}
            />
          </Animated.View>
        ) : (
          <LiquidGlassListItem
            id={item.id}
            nameCN={item.nameCN}
            nameEN={item.nameEN}
            city={item.city}
            state={item.state}
            volunteers={item.volunteers}
            tint={item.tint}
            schoolId={item.id}
            onPress={() => handleSchoolPress(item)}
            disabled={isTransitioning}
          />
        )}
      </View>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No schools found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 移除背景渐变，由父组件WellbeingScreen提供 */}

      <View style={styles.content}>
        {/* 搜索框 - 直接显示，不需要Tab判断 */}
        <View style={styles.searchSection}>
          <GlassSearchBar
            placeholder="Search schools..."
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Glass.textWeak}
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
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
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