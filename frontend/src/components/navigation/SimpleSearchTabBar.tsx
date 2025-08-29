import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardEvent,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useAnimatedGestureHandler,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';

const { width: screenWidth } = Dimensions.get('window');

// 基于参考图的精确比例常量 - 优化气泡饱满度
const TAB_BAR_WIDTH_RATIO = 0.75; // tab bar占屏幕75%
const SEARCH_BUTTON_WIDTH_RATIO = 0.15; // 搜索按钮占15%
const BUBBLE_WIDTH_RATIO = 0.88; // 气泡占单个tab的88%，更符合参考图
const BUBBLE_HEIGHT_RATIO = 0.75; // 进一步增加到75%，更饱满匹配参考图
const CONTAINER_MARGIN = 16; // 容器边距
const TAB_BAR_HEIGHT = 60; // tab bar高度
const SEARCH_HEIGHT = 50; // 搜索框高度

type UIState = 'tabs' | 'search';

interface SimpleSearchTabBarProps extends BottomTabBarProps {}

// 气泡状态保护接口
interface BubbleState {
  position: number;
  tabIndex: number;
  isValid: boolean;
}

export const SimpleSearchTabBar: React.FC<SimpleSearchTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [uiState, setUIState] = useState<UIState>('tabs');
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  
  // 气泡状态保护
  const bubbleStateRef = useRef<BubbleState>({
    position: 0,
    tabIndex: 0,
    isValid: false
  });

  // 基于参考图的精确几何计算 - 支持自适应宽度
  const geometry = useMemo(() => {
    // 根据是否显示搜索按钮调整TabBar宽度
    const tabBarWidth = showSearchButton 
      ? screenWidth * TAB_BAR_WIDTH_RATIO  // 探索页面：75%宽度
      : screenWidth - (CONTAINER_MARGIN * 2); // 其他页面：占满宽度

    const searchButtonWidth = showSearchButton ? screenWidth * SEARCH_BUTTON_WIDTH_RATIO : 0;
    const tabWidth = tabBarWidth / 4; // 4个原始tab
    const bubbleWidth = tabWidth * BUBBLE_WIDTH_RATIO;
    const bubbleHeight = TAB_BAR_HEIGHT * BUBBLE_HEIGHT_RATIO;
    const searchBarWidth = screenWidth - (searchButtonWidth + CONTAINER_MARGIN * 3);
    
    return {
      tabBarWidth,
      searchButtonWidth,
      tabWidth,
      bubbleWidth,
      bubbleHeight,
      searchBarWidth
    };
  }, [screenWidth, showSearchButton]);

  // 主动画状态
  const tabBarScale = useSharedValue(1);
  const tabBarOpacity = useSharedValue(1);
  const searchBarScale = useSharedValue(0);
  const searchBarOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(1);
  
  // 气泡动画状态
  const bubbleX = useSharedValue(0);
  const bubbleOpacity = useSharedValue(1);
  const bubbleScale = useSharedValue(1);
  const currentTabIndex = useSharedValue(state.index || 0);

  // Tab配置 - 保持原来的4个中文tab
  const tabs = [
    { key: 'Explore', label: '探索', icon: 'compass-outline', iconFocused: 'compass' },
    { key: 'Community', label: '社区', icon: 'people-outline', iconFocused: 'people' },
    { key: 'Wellbeing', label: '安心', icon: 'shield-outline', iconFocused: 'shield' },
    { key: 'Profile', label: '个人', icon: 'person-outline', iconFocused: 'person' },
  ];

  // 页面检测 - 只在探索页面显示搜索按钮
  const currentRoute = state.routes[state.index];
  const isExplorePage = currentRoute?.name === 'Explore';
  const showSearchButton = isExplorePage;

  // 搜索按钮显示调试
  console.log('🔍 搜索按钮显示检查:', {
    currentRouteName: currentRoute?.name,
    stateIndex: state.index,
    routesCount: state.routes.length,
    isExplorePage,
    showSearchButton,
    allRoutes: state.routes.map(r => r.name)
  });

  // 气泡状态保护机制
  const saveBubbleState = useCallback(() => {
    bubbleStateRef.current = {
      position: bubbleX.value,
      tabIndex: currentTabIndex.value,
      isValid: true
    };
  }, []);
  
  const restoreBubbleState = useCallback(() => {
    if (bubbleStateRef.current.isValid) {
      const correctPosition = bubbleStateRef.current.tabIndex * geometry.tabWidth + 
                            (geometry.tabWidth - geometry.bubbleWidth) / 2;
      bubbleX.value = withSpring(correctPosition, {
        damping: 20,
        stiffness: 300
      });
      currentTabIndex.value = bubbleStateRef.current.tabIndex;
    }
  }, [geometry]);

  // 气泡位置计算系统
  const calculateBubblePosition = useCallback((tabIndex: number) => {
    return tabIndex * geometry.tabWidth + (geometry.tabWidth - geometry.bubbleWidth) / 2;
  }, [geometry]);

  // 初始化气泡位置
  useEffect(() => {
    const initialIndex = Math.min(state.index || 0, tabs.length - 1);
    currentTabIndex.value = initialIndex;
    const initialPosition = calculateBubblePosition(initialIndex);
    bubbleX.value = initialPosition;
    
    // 保存初始状态
    bubbleStateRef.current = {
      position: initialPosition,
      tabIndex: initialIndex,
      isValid: true
    };
  }, [state.index, geometry, calculateBubblePosition]);

  // 监听导航状态变化，同步气泡位置
  useEffect(() => {
    const currentIndex = Math.min(state.index || 0, tabs.length - 1);
    
    console.log('📊 导航状态监控:', {
      stateIndex: state.index,
      currentIndex,
      uiState,
      currentTabIndex: currentTabIndex.value,
      needsSync: uiState === 'tabs' && currentTabIndex.value !== currentIndex
    });
    
    if (uiState === 'tabs' && currentTabIndex.value !== currentIndex) {
      console.log('🔄 同步气泡位置:', currentTabIndex.value, '→', currentIndex);
      
      currentTabIndex.value = currentIndex;
      const targetPosition = calculateBubblePosition(currentIndex);
      
      console.log('🫧 气泡同步到位置:', targetPosition);
      bubbleX.value = withSpring(targetPosition, {
        damping: 20,
        stiffness: 300
      });
      
      // 更新保存的状态
      bubbleStateRef.current = {
        position: targetPosition,
        tabIndex: currentIndex,
        isValid: true
      };
    }
  }, [state.index, uiState, calculateBubblePosition, tabs.length]);

  // 键盘事件监听 - 简化版本
  useEffect(() => {
    const keyboardWillShow = () => {
      if (uiState === 'search') {
        // 搜索状态时轻微上移
        backgroundOpacity.value = withTiming(0.95, { duration: 250 });
      }
    };
    
    const keyboardWillHide = () => {
      backgroundOpacity.value = withTiming(1, { duration: 250 });
    };
    
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );
    
    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [uiState]);

  // 精简的手势处理 - 只用于气泡滑动
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      bubbleScale.value = withSpring(1.1, { damping: 15, stiffness: 400 });
    },
    onActive: (event) => {
      const currentPosition = currentTabIndex.value * geometry.tabWidth + (geometry.tabWidth - geometry.bubbleWidth) / 2;
      const newPosition = currentPosition + event.translationX;
      
      // 边界限制
      const minPosition = 0;
      const maxPosition = (tabs.length - 1) * geometry.tabWidth + (geometry.tabWidth - geometry.bubbleWidth) / 2;
      bubbleX.value = Math.max(minPosition, Math.min(newPosition, maxPosition));
    },
    onEnd: (event) => {
      // 计算最近的tab索引
      const velocity = event.velocityX;
      let targetIndex = Math.round((bubbleX.value - (geometry.tabWidth - geometry.bubbleWidth) / 2) / geometry.tabWidth);
      
      // 基于速度调整
      if (Math.abs(velocity) > 500) {
        targetIndex += velocity > 0 ? 1 : -1;
      }
      
      targetIndex = Math.max(0, Math.min(targetIndex, tabs.length - 1));
      currentTabIndex.value = targetIndex;
      
      const targetPosition = calculateBubblePosition(targetIndex);
      bubbleX.value = withSpring(targetPosition, {
        damping: 20,
        stiffness: 300
      });
      
      bubbleScale.value = withSpring(1, { damping: 15, stiffness: 400 });
      
      // 触发导航
      const targetRoute = state.routes.find(route => 
        tabs.find(tab => tab.key === route.name && tabs.indexOf(tab) === targetIndex)
      );
      if (targetRoute && state.index !== targetIndex) {
        setTimeout(() => navigation.navigate(targetRoute.name), 100);
      }
    },
  });

  // 搜索按钮点击处理
  const handleSearchPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    saveBubbleState();
    setUIState('search');
    
    // 动画到搜索状态
    tabBarScale.value = withTiming(0, { duration: 300 });
    tabBarOpacity.value = withTiming(0, { duration: 200 });
    searchBarScale.value = withDelay(100, withSpring(1, { damping: 20, stiffness: 300 }));
    searchBarOpacity.value = withDelay(150, withTiming(1, { duration: 200 }));
    
    // 聚焦输入框
    setTimeout(() => searchInputRef.current?.focus(), 250);
  }, [saveBubbleState]);

  // 取消搜索处理
  const handleCancel = useCallback(() => {
    setUIState('tabs');
    setSearchText('');
    Keyboard.dismiss();
    
    // 动画回tab状态
    searchBarScale.value = withTiming(0, { duration: 200 });
    searchBarOpacity.value = withTiming(0, { duration: 150 });
    tabBarScale.value = withDelay(100, withSpring(1, { damping: 20, stiffness: 300 }));
    tabBarOpacity.value = withDelay(150, withTiming(1, { duration: 200 }));
    
    // 恢复气泡状态
    setTimeout(() => restoreBubbleState(), 300);
  }, [restoreBubbleState]);

  // Tab点击处理 - 添加详细调试和简化逻辑
  const handleTabPress = useCallback((route: any, isFocused: boolean, targetIndex: number) => {
    console.log('🔍 Tab点击调试:', {
      routeName: route.name,
      isFocused,
      targetIndex,
      uiState,
      canProcess: !isFocused && uiState === 'tabs'
    });

    if (isFocused) {
      console.log('⏸️ 已选中Tab，跳过处理');
      return;
    }
    
    if (uiState !== 'tabs') {
      console.log('⏸️ 非tabs状态，当前状态:', uiState);
      return;
    }
    
    console.log('✅ 开始处理Tab点击');

    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    console.log('📡 导航事件状态:', {
      defaultPrevented: event.defaultPrevented,
      targetRoute: route.name
    });

    if (!event.defaultPrevented) {
      console.log('🎯 执行Tab切换到:', route.name);
      
      currentTabIndex.value = targetIndex;
      const targetPosition = calculateBubblePosition(targetIndex);
      
      console.log('🫧 气泡动画到位置:', targetPosition);
      bubbleX.value = withSpring(targetPosition, {
        damping: 20,
        stiffness: 300
      });
      
      console.log('🚀 执行导航切换');
      navigation.navigate(route.name);
    } else {
      console.log('🚫 导航事件被阻止');
    }
  }, [uiState, calculateBubblePosition, navigation]);

  // 动画样式
  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tabBarScale.value }],
    opacity: tabBarOpacity.value,
  }));

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
    opacity: searchBarOpacity.value,
  }));

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bubbleX.value },
      { scale: bubbleScale.value }
    ] as any,
    opacity: bubbleOpacity.value,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // 渲染Tab状态
  const renderTabsState = () => (
    <Animated.View style={[styles.tabBarContainer, tabBarAnimatedStyle]}>
      <View style={[styles.tabBar, { width: geometry.tabBarWidth }]}>
        {/* 灰色气泡背景 - 匹配参考图 */}
        <Animated.View 
          style={[
            styles.bubble, 
            {
              width: geometry.bubbleWidth,
              height: geometry.bubbleHeight,
            },
            bubbleAnimatedStyle
          ]} 
        />
        
        {/* 手势区域 */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const route = state.routes.find(r => r.name === tab.key);
              if (!route) return null;
              
              const routeIndex = state.routes.findIndex(r => r.name === tab.key);
              const isFocused = state.index === routeIndex;
              
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, { width: geometry.tabWidth }]}
                  onPress={() => {
                    console.log('🖱️ 直接点击Tab:', tab.label, route.name);
                    if (!isFocused) {
                      navigation.navigate(route.name);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isFocused ? tab.iconFocused as any : tab.icon as any}
                    size={22}
                    color={isFocused ? '#007AFF' : '#333333'}
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isFocused ? '#007AFF' : '#333333' }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </PanGestureHandler>
      </View>
      
      {/* 搜索按钮 - 临时强制显示用于调试 */}
      {(showSearchButton || true) && (
        <TouchableOpacity
          style={[
            styles.searchButton, 
            { width: geometry.searchButtonWidth }
          ]}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color="#007AFF" />
          {/* 临时显示按钮状态 */}
          <Text style={{fontSize: 8, color: '#007AFF'}}>
            {showSearchButton ? 'Show' : 'Hide'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  // 渲染搜索状态
  const renderSearchState = () => (
    <Animated.View style={[styles.searchContainer, searchBarAnimatedStyle]}>
      {/* 退出按钮 */}
      <TouchableOpacity
        style={[
          styles.exitButton, 
          { width: geometry.searchButtonWidth }
        ]}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Ionicons name="apps" size={20} color="#007AFF" />
      </TouchableOpacity>
      
      {/* 搜索框 */}
      <View style={[styles.searchBar, { width: geometry.searchBarWidth }]}>
        <Ionicons name="search" size={18} color="#666666" />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder={t('common.search_placeholder')}
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleCancel}
        >
          <Ionicons name="close" size={18} color="#666666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <Animated.View style={[
      styles.container, 
      { bottom: insets.bottom - 7 },
      backgroundAnimatedStyle
    ]}>
      {/* 白色半透明毛玻璃背景 - 恢复参考图效果 */}
      <View style={styles.glassContainer}>
        <BlurView
          intensity={95}
          tint="extraLight"
          style={styles.blurBackground}
        />
        
        {/* 移除深色渐变，保持明亮效果 */}
        
        {/* 内容区域 */}
        <View style={styles.contentArea}>
          {uiState === 'tabs' ? renderTabsState() : renderSearchState()}
        </View>
        
        {/* 边框层 */}
        <View style={styles.borderLayer} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: CONTAINER_MARGIN,
    right: CONTAINER_MARGIN,
    height: TAB_BAR_HEIGHT + 10,
    zIndex: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.01)', // 添加subtle背景色优化shadow性能
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  
  glassContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 恢复白色半透明基底
  },

  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  // Tabs状态样式
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  tabBar: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
  },

  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.12)', // 改为灰色，匹配参考图
    borderRadius: 20, // 增加圆角，更饱满圆润
    top: (TAB_BAR_HEIGHT - (TAB_BAR_HEIGHT * BUBBLE_HEIGHT_RATIO)) / 2,
    left: 0,
    zIndex: 1,
    shadowColor: 'rgba(0, 0, 0, 0.1)', // 阴影也改为灰色
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  tabsContainer: {
    flexDirection: 'row',
    height: '100%',
    zIndex: 2,
  },

  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  searchButton: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 搜索状态样式
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  exitButton: {
    height: SEARCH_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    paddingHorizontal: 12,
    height: SEARCH_HEIGHT,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
    height: SEARCH_HEIGHT,
  },

  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  borderLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
  },
});