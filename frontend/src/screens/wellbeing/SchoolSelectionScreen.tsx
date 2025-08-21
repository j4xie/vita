import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Animated,
  Platform,
  useColorScheme,
  Dimensions,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, BRAND_GLASS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { mockSchools, School } from '../../data/mockData';

interface SchoolSelectionScreenProps {
  onSchoolSelect: (school: School) => void;
}

export const SchoolSelectionScreen: React.FC<SchoolSelectionScreenProps> = ({ onSchoolSelect }) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);

  // 本地化学校名称显示函数
  const getLocalizedSchoolDisplay = (school: School) => {
    const isChineseUI = t('common.brand.name') === '西柚'; // 通过品牌名判断当前语言
    return {
      primary: isChineseUI ? school.name : school.englishName,
      secondary: isChineseUI ? school.englishName : school.name,
    };
  };

  const [searchText, setSearchText] = useState('');
  const [filteredSchools, setFilteredSchools] = useState<School[]>(mockSchools);
  
  // 学校卡片放大跳转动画系统
  const [cardLayouts, setCardLayouts] = useState<Map<string, any>>(new Map());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  
  // 动画值 - v2方案
  const transitionProgress = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const cardX = useSharedValue(0);
  const cardY = useSharedValue(0);
  const cornerRadius = useSharedValue(16);
  const blurGain = useSharedValue(0);
  const highlightGain = useSharedValue(1);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredSchools(mockSchools);
    } else {
      const filtered = mockSchools.filter(school =>
        school.name.toLowerCase().includes(text.toLowerCase()) ||
        school.englishName.toLowerCase().includes(text.toLowerCase()) ||
        school.location.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, []);

  // 记录卡片布局信息
  const handleCardLayout = useCallback((schoolId: string, event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setCardLayouts(prev => new Map(prev.set(schoolId, { x, y, width, height })));
  }, []);
  
  // 学校卡片点击 - v2方案放大跳转
  const handleSchoolPress = useCallback((school: School) => {
    if (isTransitioning) return; // 防止重复点击
    
    const cardLayout = cardLayouts.get(school.id);
    if (!cardLayout) {
      // 没有布局信息，直接切换
      onSchoolSelect(school);
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
  }, [isTransitioning, cardLayouts, onSchoolSelect]);
  
  // Morph-to-Header动画执行
  const startMorphAnimation = useCallback((school: School, layout: any) => {
    console.log('🎬 开始Morph动画到Header位置');
    
    // 计算目标Header坐标
    const screenWidth = Dimensions.get('window').width;
    const targetX = 16; // 页面左边距
    const targetY = insets.top + 16; // Header顶部位置
    
    // 阶段1: 放大跳出 (100-320ms) - 克制放大1.12-1.18
    const animationDuration = 220; // spring表观时长
    
    // 同步执行多个动画
    cardScale.value = withSpring(1.15, { // 克制在1.12-1.18
      damping: 20,
      stiffness: 220,
      mass: 1
    });
    
    cardOpacity.value = withSequence(
      withTiming(0.85, { duration: animationDuration * 0.7 }), // 70%进度降到0.85
      withTiming(0.2, { duration: animationDuration * 0.3 })   // 最终到0.2
    );
    
    // 移动到目标Header位置
    cardX.value = withSpring(targetX - layout.x, {
      damping: 20,
      stiffness: 220
    });
    cardY.value = withSpring(targetY - layout.y, {
      damping: 20, 
      stiffness: 220
    });
    
    // 材质联动: 角半径16→0
    cornerRadius.value = withTiming(0, { duration: animationDuration });
    
    // 玻璃强度+4, 高光+15%
    blurGain.value = withSequence(
      withTiming(4, { duration: animationDuration * 0.4 }), // 0.3-0.7内增加
      withTiming(0, { duration: animationDuration * 0.3 })  // 然后回归
    );
    highlightGain.value = withTiming(1.15, { duration: animationDuration * 0.5 });
    
    // 阶段2: 页面切换 - 提前到45%启动
    setTimeout(() => {
      console.log('🚀 45%进度，开始页面切换');
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // 这里触发页面切换
      onSchoolSelect(school);
    }, animationDuration * 0.45); // 45%进度启动
    
    // 完成清理
    setTimeout(() => {
      setIsTransitioning(false);
      setSelectedSchoolId(null);
      // 重置所有动画值
      cardScale.value = 1;
      cardOpacity.value = 1;
      cardX.value = 0;
      cardY.value = 0;
      cornerRadius.value = 16;
      blurGain.value = 0;
      highlightGain.value = 1;
    }, 500); // 总时长500ms
  }, [insets.top, onSchoolSelect]);

  const renderSchoolCard = useCallback(({ item }: { item: School }) => {
    const animatedValue = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(animatedValue, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    // 动画样式 - 仅对选中卡片应用
    const isAnimatingCard = selectedSchoolId === item.id;
    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: isAnimatingCard ? cardX.value : 0 },
        { translateY: isAnimatingCard ? cardY.value : 0 },
        { scale: isAnimatingCard ? cardScale.value : animatedValue }
      ],
      opacity: isAnimatingCard ? cardOpacity.value : 1,
      borderRadius: isAnimatingCard ? cornerRadius.value : 16,
    }));

    return (
      <Reanimated.View style={animatedCardStyle}>
        <TouchableOpacity
          style={[styles.schoolCard, styles.schoolCardGlass]}
          onPress={() => handleSchoolPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLayout={(event) => handleCardLayout(item.id, event)} // 布局追踪
          activeOpacity={0.9}
          disabled={isTransitioning} // 动画期间禁用其他卡片
        >
          <LinearGradient
            colors={[item.color + '20', item.color + '10']}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.schoolInfo}>
                <View style={[styles.logoContainer, { backgroundColor: item.color + '30' }]}>
                  <View style={[styles.logoPlaceholder, { backgroundColor: item.color }]}>
                    <Ionicons 
                      name="school-outline" 
                      size={28} 
                      color="white" 
                    />
                  </View>
                </View>
                
                <View style={styles.schoolDetails}>
                  {(() => {
                    const schoolDisplay = getLocalizedSchoolDisplay(item);
                    return (
                      <>
                        <Text style={[styles.schoolName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                          {schoolDisplay.primary}
                        </Text>
                        <Text style={[styles.schoolEnglishName, { color: isDarkMode ? '#a1a1aa' : '#6b7280' }]}>
                          {schoolDisplay.secondary}
                        </Text>
                      </>
                    );
                  })()}
                  <View style={styles.locationRow}>
                    <Ionicons 
                      name="location-outline" 
                      size={14} 
                      color={isDarkMode ? '#a1a1aa' : '#9ca3af'} 
                    />
                    <Text style={[styles.location, { color: isDarkMode ? '#a1a1aa' : '#9ca3af' }]}>
                      {item.location}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rightSection}>
                <View style={[styles.studentCountBadge, { backgroundColor: item.color + '20' }]}>
                  <Text style={[styles.studentCount, { color: item.color }]}>
                    {item.studentCount}{t('wellbeing.volunteer.volunteersCount')}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDarkMode ? '#a1a1aa' : '#9ca3af'} 
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Reanimated.View>
    );
  }, [isDarkMode, handleSchoolPress]);

  const ItemSeparator = useCallback(() => <View style={{ height: 12 }} />, []);

  // 计算内容底部边距（避免被底栏遮挡）
  const contentInsetBottom = 56 + 12 + insets.bottom; // tabBar高度 + 间距 + 安全区域

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#f2f2f7' }]}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff' }]}>
          <Ionicons name="search" size={20} color={isDarkMode ? '#a1a1aa' : '#9ca3af'} />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? '#ffffff' : '#000000' }]}
            placeholder={t('placeholders.searchSchools')}
            placeholderTextColor={isDarkMode ? '#a1a1aa' : '#9ca3af'}
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={isDarkMode ? '#a1a1aa' : '#9ca3af'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 学校列表 */}
      <FlatList
        data={filteredSchools}
        renderItem={renderSchoolCard}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ItemSeparator}
        style={styles.list}
        contentContainerStyle={{
          paddingTop: 8, // 从16减少到8，缩小与搜索栏的间距
          paddingHorizontal: 16,
          paddingBottom: contentInsetBottom,
        }}
        onScroll={() => {}} // 显式提供onScroll函数避免错误
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="school-outline" 
              size={64} 
              color={isDarkMode ? '#3a3a3c' : '#e5e7eb'} 
            />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#8e8e93' : '#6b7280' }]}>
              未找到匹配的学校
            </Text>
            <Text style={[styles.emptySubtext, { color: isDarkMode ? '#636366' : '#9ca3af' }]}>
              尝试修改搜索条件
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 4, // 减少顶部间距
    paddingBottom: 8, // 从16减少到8，缩小与下方列表的间距
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  list: {
    flex: 1,
  },
  schoolCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schoolInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolDetails: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  schoolEnglishName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  studentCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  studentCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
  
  // V2.0 L1玻璃学校卡片样式
  schoolCardGlass: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.surface, // 20pt圆角
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
  },
});

export default SchoolSelectionScreen;