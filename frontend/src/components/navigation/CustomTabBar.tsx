import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardEvent,
  AccessibilityInfo,
  DeviceEventEmitter,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PanGestureHandler,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { useFilter } from '../../context/FilterContext';
import { Glass } from '../../ui/glass/GlassTheme';
import { shouldShowTabBar } from '../../config/tabBarConfig';

interface CustomTabBarProps extends BottomTabBarProps {
  // 可以添加额外的自定义属性
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isFilterOpen } = useFilter();
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  
  // 页面检测 - 只在探索页面显示搜索按钮
  const currentRoute = state.routes[state.index];
  const isExplorePage = currentRoute?.name === 'Explore';
  const showSearchButton = isExplorePage;
  
  // 🔄 实时获取当前路由的嵌套路由名称
  const getFocusedRouteName = (route: any): string => {
    if (route.state) {
      const nestedRoute = route.state.routes[route.state.index];
      return getFocusedRouteName(nestedRoute);
    }
    return route.name;
  };
  
  const focusedRouteName = getFocusedRouteName(currentRoute);
  
  console.log('🔍 TabBar页面检测:', {
    tabRouteName: currentRoute?.name,
    focusedRouteName,
    isExplorePage,
    showSearchButton,
    stateIndex: state.index
  });
  
  // 搜索功能状态
  const [searchMode, setSearchMode] = useState<'default' | 'expanded' | 'input'>('default');
  const [searchText, setSearchText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchInputRef = useRef<TextInput>(null);

  // 键盘适应动画值
  const keyboardOffset = useSharedValue(0);
  
  // 基础动画值
  const tabBarTranslateY = useSharedValue(0);
  const highlightSweepX = useSharedValue(-100);
  const highlightOpacity = useSharedValue(0);
  
  // 拖拽气泡动画值系统
  const dragBubbleVisible = useSharedValue(0); // 单一可信状态
  const bubbleScale = useSharedValue(1); // 1.0 → 1.06放大
  const bubbleX = useSharedValue(0); // 拖拽位置
  const targetTabIndex = useSharedValue(0); // 目标Tab
  const highlightGain = useSharedValue(1); // 高光增益
  const rainbowGain = useSharedValue(1); // 彩虹增益
  const whiteRingOpacity = useSharedValue(0); // 白描边
  
  // 搜索功能动画值 - 重新设计
  const tabsOpacity = useSharedValue(1); // 4个Tab的透明度
  const compactButtonOpacity = useSharedValue(0); // 圆形按钮的透明度
  const searchOverlayWidth = useSharedValue(0); // 搜索覆盖层宽度
  const searchInputOpacity = useSharedValue(0); // 搜索输入框透明度

  // 移除复杂Tab动画值
  // 保持简洁的Tab切换
  
  // 手势状态
  const [isDragging, setIsDragging] = useState(false);
  const [previewTabIndex, setPreviewTabIndex] = useState(-1);
  const longPressRef = useRef(null);
  const panRef = useRef(null);
  const watchdogTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Check accessibility preferences
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
  }, []);

  // 移除气泡初始化代码
  // useEffect(() => {
  //   // 气泡初始化逻辑已移除
  // }, [state.index, showSearchButton]);

  // 键盘事件监听 - 确保TabBar不被遮挡
  useEffect(() => {
    const keyboardWillShow = (event: KeyboardEvent) => {
      const keyboardHeight = event.endCoordinates?.height || 0;
      setKeyboardHeight(keyboardHeight);
      
      // TabBar向上移动，避免被键盘遮挡
      keyboardOffset.value = withTiming(-keyboardHeight * 0.3, { 
        duration: event.duration || 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
    };
    
    const keyboardWillHide = (event: KeyboardEvent) => {
      setKeyboardHeight(0);
      
      // TabBar恢复原位置
      keyboardOffset.value = withTiming(0, { 
        duration: event.duration || 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
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
  }, []);

  // 初始化目标Tab索引
  useEffect(() => {
    if (state?.index !== undefined) {
      targetTabIndex.value = state.index;
    }
  }, [state?.index]);

  // 搜索功能处理
  const handleSearchPress = useCallback(() => {
    console.log('🔍 搜索按钮被点击，当前模式:', searchMode);
    
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }

    if (searchMode === 'default') {
      // 第一次点击：展开搜索框
      console.log('🎬 开始搜索展开动画');
      setSearchMode('expanded');
      
      // 阶段1：4个Tab淡出
      tabsOpacity.value = withTiming(0, { duration: 200 });
      
      // 阶段2：圆形按钮出现  
      compactButtonOpacity.value = withDelay(150, withSpring(1, { 
        damping: 20, 
        stiffness: 300 
      }));
      
      // 阶段3：搜索覆盖层展开 - 调整宽度为左侧按钮留出空间
      searchOverlayWidth.value = withDelay(200, withTiming(Dimensions.get('window').width - 116, { 
        duration: 300, 
        easing: Easing.bezier(0.4, 0, 0.2, 1) 
      }));
      
      // 阶段4：搜索框内容显示
      searchInputOpacity.value = withDelay(400, withTiming(1, { duration: 200 }));
      
      console.log('📊 Tab→圆形动画已启动');
      
    } else if (searchMode === 'expanded') {
      // 第二次点击：进入输入模式
      console.log('🔍 [TABBAR] 切换到输入模式');
      setSearchMode('input');
      
      setTimeout(() => {
        console.log('🔍 [TABBAR] 搜索框获得焦点');
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [searchMode]);

  // 新增：只清空搜索内容的函数
  const handleSearchClear = useCallback(() => {
    console.log('🔍 [TABBAR] 清空搜索内容');
    setSearchText('');
    
    // 发送清空搜索事件到ActivityListScreen
    console.log('🔍 [TABBAR] 发送清空搜索事件到ActivityListScreen');
    DeviceEventEmitter.emit('searchTextChanged', { 
      searchText: '',
      timestamp: Date.now()
    });
    
    // 保持搜索模式，不退出
    // 搜索框保持焦点，用户可以继续输入
  }, []);

  const handleSearchCancel = useCallback(() => {
    console.log('❌ 取消搜索，当前模式:', searchMode);
    setSearchMode('default');
    setSearchText('');
    
    // 发送清空搜索事件到ActivityListScreen
    console.log('🔍 [TABBAR] 发送清空搜索事件到ActivityListScreen');
    DeviceEventEmitter.emit('searchTextChanged', { 
      searchText: '',
      timestamp: Date.now()
    });
    
    Keyboard.dismiss();
    
    // 逆向恢复动画
    searchInputOpacity.value = withTiming(0, { duration: 150 });
    searchOverlayWidth.value = withTiming(0, { duration: 250 });
    compactButtonOpacity.value = withTiming(0, { duration: 200 });
    tabsOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
    
    console.log('📊 圆形→Tab恢复动画已启动');
  }, [searchMode]);

  // 统一清理函数 - 解决气泡残留
  const clearDragState = useCallback(() => {
    'worklet';
    dragBubbleVisible.value = 0;
    bubbleScale.value = withSpring(1, { damping: 20, stiffness: 220 });
    bubbleX.value = withSpring(0, { damping: 20, stiffness: 220 });
    highlightGain.value = withTiming(1, { duration: 180 });
    rainbowGain.value = withTiming(1, { duration: 180 });
    whiteRingOpacity.value = withTiming(0, { duration: 180 });
    
    runOnJS(() => {
      setIsDragging(false);
      setPreviewTabIndex(-1);
      if (watchdogTimer.current) {
        clearTimeout(watchdogTimer.current);
        watchdogTimer.current = null;
      }
    })();
  }, []);

  // 看门狗定时器 - 400ms强制清理
  const startWatchdog = useCallback(() => {
    if (watchdogTimer.current) {
      clearTimeout(watchdogTimer.current);
    }
    watchdogTimer.current = setTimeout(() => {
      console.log('🚨 看门狗强制清理拖拽状态');
      clearDragState();
    }, 400);
  }, [clearDragState]);

  // 长按手势处理 - useAnimatedGestureHandler
  const longPressGestureHandler = useAnimatedGestureHandler({
    onStart: (event) => {
      console.log('🫧 长按开始检测');
    },
    onActive: (event) => {
      console.log('🫧 长按成功，进入拖拽模式');
      
      // 计算初始位置 (UI线程)
      const screenWidth = Dimensions.get('window').width;
      const tabBarWidth = screenWidth - 32;
      const tabWidth = tabBarWidth / 5;
      const currentIndex = targetTabIndex.value;
      const initialCenterX = tabWidth * currentIndex + tabWidth / 2;
      
      // 显示拖拽气泡
      dragBubbleVisible.value = 1;
      bubbleX.value = initialCenterX - 39; // 78pt宽度的一半
      
      // 1.06倍放大 + 高亮增强 (150ms)
      bubbleScale.value = withTiming(1.06, { duration: 150 });
      highlightGain.value = withTiming(1.2, { duration: 150 });
      rainbowGain.value = withTiming(1.2, { duration: 150 });
      whiteRingOpacity.value = withTiming(1, { duration: 150 });
      
      // 启动看门狗
      runOnJS(startWatchdog)();
      
      // 触觉反馈
      runOnJS(() => {
        if (Platform.OS === 'ios') {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (error) {
            console.warn('Haptics not available:', error);
          }
        }
      })();
    },
    onEnd: () => {
      runOnJS(clearDragState)();
    },
    onCancel: () => {
      runOnJS(clearDragState)();
    },
    onFail: () => {
      runOnJS(clearDragState)();
    },
  });

  // 拖拽手势处理 - 目标-跟随者模型
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (event) => {
      runOnJS(setIsDragging)(true);
    },
    onActive: (event) => {
      if (dragBubbleVisible.value === 0) return;
      
      // 立即解构，避免事件复用错误
      const translationX = event.translationX;
      
      // 计算目标Tab (目标-跟随者模型)
      const screenWidth = Dimensions.get('window').width;
      const tabBarWidth = screenWidth - 32;
      const tabWidth = tabBarWidth / 5;
      const currentIndex = targetTabIndex.value;
      const currentCenterX = tabWidth * currentIndex + tabWidth / 2;
      
      // 计算新的目标Tab
      const newTargetX = currentCenterX + translationX;
      const newTargetIndex = Math.round(newTargetX / tabWidth);
      const clampedIndex = Math.max(0, Math.min(newTargetIndex, 4));
      
      // 目标位置 (磁吸中心)
      const targetBubbleX = tabWidth * clampedIndex + tabWidth / 2 - 39;
      
      // 弹簧追随 (粘滞感) - damping:21, stiffness:240
      bubbleX.value = withSpring(targetBubbleX, {
        damping: 21,
        stiffness: 240,
      });
      
      // 预览反馈
      if (clampedIndex !== targetTabIndex.value) {
        targetTabIndex.value = clampedIndex;
        runOnJS(() => {
          setPreviewTabIndex(clampedIndex);
          console.log('🫧 预览Tab:', clampedIndex);
          if (Platform.OS === 'ios') {
            try {
              Haptics.selectionAsync();
            } catch (error) {
              console.warn('Haptics not available:', error);
            }
          }
        })();
      }
    },
    onEnd: () => {
      // 智能切换到预览Tab
      const finalTargetIndex = targetTabIndex.value;
      if (finalTargetIndex !== state?.index) {
        const targetRoute = state?.routes?.[finalTargetIndex];
        if (targetRoute) {
          runOnJS(() => {
            console.log('🚀 拖拽切换到:', targetRoute.name);
            navigation.navigate(targetRoute.name);
          })();
        }
      }
      runOnJS(clearDragState)();
    },
    onCancel: () => {
      runOnJS(clearDragState)();
    },
    onFail: () => {
      runOnJS(clearDragState)();
    },
  });

  // 高光扫过动画
  const triggerHighlightSweep = useCallback(() => {
    if (isReduceMotionEnabled) return;
    
    highlightSweepX.value = -100;
    highlightOpacity.value = 0;
    
    // 扫光从左至右，时长 250ms
    highlightSweepX.value = withTiming(400, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
    
    highlightOpacity.value = withSequence(
      withTiming(0.08, { duration: 80 }), // 淡入
      withTiming(0.08, { duration: 90 }), // 保持
      withTiming(0, { duration: 80 }) // 淡出
    );
  }, [isReduceMotionEnabled]);

  // 每个Tab的动画值
  const tabScales = useRef(
    Array.from({ length: 5 }, () => useSharedValue(1))
  ).current;
  
  // Tab点击处理 - 增强动画反馈
  const handleTabPress = useCallback((route: any, isFocused: boolean) => {
    console.log('🔥 Tab clicked:', route.name, 'isFocused:', isFocused);
    
    const tabIndex = state.routes.findIndex(r => r.key === route.key);
    
    // 触发高光扫过
    triggerHighlightSweep();
    
    // 增强的点击反馈动画
    if (!isFocused && tabIndex >= 0 && tabIndex < tabScales.length) {
      // 当前Tab的弹跳动画
      tabScales[tabIndex].value = withSequence(
        withTiming(0.9, { duration: 100, easing: Easing.out(Easing.quad) }),
        withSpring(1.05, { damping: 12, stiffness: 400 }),
        withTiming(1.0, { duration: 150, easing: Easing.out(Easing.cubic) })
      );
    }
    
    // 全局TabBar轻微震动效果
    if (!isFocused) {
      tabBarTranslateY.value = withSequence(
        withTiming(-1, { duration: 80, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 15, stiffness: 300 })
      );
    }
    
    // iOS Haptic反馈
    if (Platform.OS === 'ios') {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
    
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      console.log('🚀 Navigating to:', route.name);
      
      // 简化Tab切换 - 只保留触觉反馈
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
          console.warn('Haptics not available:', error);
        }
      }
      console.log('🔥 Tab切换:', route.name);
      
      navigation.navigate(route.name, route.params);
    } else if (isFocused && route.name === 'Explore') {
      console.log('📜 Scroll to top and refresh');
      DeviceEventEmitter.emit('scrollToTopAndRefresh');
    }
  }, [navigation, triggerHighlightSweep]);

  // Filter 状态变化时控制导航栏显示/隐藏
  useEffect(() => {
    const targetTranslateY = isFilterOpen ? 120 : 0;
    tabBarTranslateY.value = withTiming(targetTranslateY, {
      duration: isReduceMotionEnabled ? 120 : 200,
    });
  }, [isFilterOpen, isReduceMotionEnabled]);

  // 🎯 智能键盘处理：只在应该显示TabBar的页面响应键盘事件
  useEffect(() => {
    const keyboardWillShow = (e: KeyboardEvent) => {
      // 🔍 获取当前页面路由名
      const currentRoute = state.routes[state.index];
      const currentRouteName = currentRoute?.name || 'unknown';
      
      console.log('⌨️ [KEYBOARD] 键盘弹出，当前页面:', currentRouteName);
      
      // 🛡️ 只有在应该显示TabBar的页面才隐藏TabBar（避免在已隐藏的页面重复操作）
      if (shouldShowTabBar(currentRouteName)) {
        console.log('⌨️ [KEYBOARD] 隐藏TabBar');
        tabBarTranslateY.value = withTiming(120, { duration: 250 });
      } else {
        console.log('⌨️ [KEYBOARD] 页面已隐藏TabBar，无需处理');
      }
    };
    
    const keyboardWillHide = () => {
      // 🔍 获取当前页面路由名
      const currentRoute = state.routes[state.index];
      const currentRouteName = currentRoute?.name || 'unknown';
      
      console.log('⌨️ [KEYBOARD] 键盘收起，当前页面:', currentRouteName);
      
      // 🛡️ 只有在应该显示TabBar的页面才恢复TabBar
      if (shouldShowTabBar(currentRouteName)) {
        console.log('⌨️ [KEYBOARD] 恢复TabBar');
        tabBarTranslateY.value = withTiming(0, { duration: 250 });
      } else {
        console.log('⌨️ [KEYBOARD] 页面应隐藏TabBar，保持隐藏状态');
      }
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
  }, [state]); // 添加state依赖，确保获取最新路由


  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Explore':
        return focused ? 'compass' : 'compass-outline';
      case 'Community':
        return focused ? 'people' : 'people-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
      case 'Wellbeing':
        return focused ? 'shield' : 'shield-outline';
      default:
        return 'compass-outline';
    }
  };

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'Explore':
        return t('navigation.tabs.explore');
      case 'Community':
        return t('navigation.tabs.community');
      case 'Profile':
        return t('navigation.tabs.profile');
      case 'Wellbeing':
        return t('navigation.tabs.wellbeing');
      default:
        return routeName;
    }
  };

  // 动画样式
  const animatedTabBarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: tabBarTranslateY.value },
      { translateY: keyboardOffset.value }  // 添加键盘偏移
    ],
  }));

  const highlightSweepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightSweepX.value }],
    opacity: highlightOpacity.value,
  }));

  // 拖拽气泡动画样式 - 完全移除scale避免错误
  const dragBubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bubbleX.value },
    ],
    opacity: Math.max(0, Math.min(1, dragBubbleVisible.value)), // 限制opacity范围
  }));

  // 搜索区域动画样式 - 修复Reanimated用法
  const searchAreaAnimatedStyle = useAnimatedStyle(() => ({
    width: searchOverlayWidth.value,
    opacity: searchInputOpacity.value,
  }));

  // 移除气泡动画样式
  // const selectedBubbleAnimatedStyle = useAnimatedStyle(() => ({
  //   opacity: 0, // 隐藏气泡
  // }));

  // Tab区域动画样式 - 简化
  const tabsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tabsOpacity.value,
  }));

  // 圆形按钮动画样式 - 移除scale避免错误
  const compactButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: compactButtonOpacity.value,
  }));

  // 高光增强样式
  const dragHighlightAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.25 * highlightGain.value, // 基础25% × 增益
  }));

  // 彩虹边框动画样式
  const dragRainbowAnimatedStyle = useAnimatedStyle(() => ({
    borderLeftColor: `rgba(106, 208, 255, ${0.22 * rainbowGain.value})`,
    borderRightColor: `rgba(216, 137, 255, ${0.22 * rainbowGain.value})`,
    opacity: rainbowGain.value,
  }));

  // 白描边+外发光样式
  const whiteRingAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 255, 255, ${whiteRingOpacity.value})`,
    shadowOpacity: whiteRingOpacity.value * 0.12,
  }));
  
  // TabBar 容器动画样式
  const tabBarContainerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: tabBarTranslateY.value },
    ],
  }));

  if (!state || !state.routes || !descriptors) {
    return null;
  }

  // 🚨 检查tabBarStyle.display，如果设置为none则不渲染TabBar
  const tabBarStyle = descriptors[currentRoute?.key]?.options?.tabBarStyle;
  const shouldHideByStyle = tabBarStyle && typeof tabBarStyle === 'object' && 'display' in tabBarStyle && tabBarStyle.display === 'none';
  
  // 🛡️ 双重保护：使用实际焦点路由名称检查是否应该显示TabBar
  const shouldShowByConfig = shouldShowTabBar(focusedRouteName);
  
  console.log('🔍 [CUSTOM-TABBAR] TabBar渲染检查:', {
    tabRouteName: currentRoute?.name,
    focusedRouteName,
    shouldHideByStyle,
    shouldShowByConfig,
    finalDecision: shouldHideByStyle ? 'style-hide' : (shouldShowByConfig ? 'show' : 'config-hide'),
    tabBarStyle
  });
  
  // 🚨 最终决策：样式隐藏 OR 配置不允许显示 = 隐藏
  if (shouldHideByStyle || !shouldShowByConfig) {
    console.log('🚫 [CUSTOM-TABBAR] TabBar隐藏 -', shouldHideByStyle ? 'Style隐藏' : `配置不允许显示(${focusedRouteName})`);
    return null;
  }

  return (
    <Animated.View style={[
      styles.container, 
      { bottom: insets.bottom - 7 }, // 再往下移动5px (从-2改为-7)
      animatedTabBarStyle,
      isFilterOpen && styles.hidden
    ]}>
      {/* Liquid Glass 容器 */}
      <View style={styles.liquidGlassContainer}>
        {/* 背景模糊层 */}
        <BlurView
          intensity={Platform.OS === 'android' ? 22 : Glass.blur}
          style={styles.blurBackground}
          tint="light"
        />
        
        {/* 顶部高光分隔线 */}
        <LinearGradient 
          colors={[Glass.hairlineFrom, Glass.hairlineTo]}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }} 
          style={styles.hairline}
        />
        
        {/* 白系叠色渐变 */}
        <LinearGradient 
          colors={[Glass.overlayTop, Glass.overlayBottom]}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }}
          style={styles.overlay}
        />
        
        {/* 高光扫过效果 */}
        <Animated.View style={[styles.sweepHighlight, highlightSweepAnimatedStyle]} pointerEvents="none">
          <LinearGradient
            colors={[
              'transparent',
              'rgba(255,255,255,0.08)',
              'rgba(255,255,255,0.04)',
              'transparent'
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sweepGradient}
          />
        </Animated.View>

        {/* Tab容器 */}
        <Animated.View style={[styles.tabBarContainer, tabBarContainerAnimatedStyle]}>
          {/* 默认模式：4个Tab */}
          <Animated.View style={[styles.normalTabsContainer, tabsAnimatedStyle]}>
            {state.routes.map((route, index) => {
            if (!route || !route.key) return null;
            
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            
            const { options } = descriptor;
            const isFocused = state.index === index;
            const iconName = getIconName(route.name, isFocused);
            const label = getTabLabel(route.name);

            // 简化Tab动画，避免scale错误
            const tabAnimatedStyle = { transform: [{ scale: 1 }] };

            return (
              <Animated.View 
                key={route.key} 
                style={[styles.tabContainer, tabAnimatedStyle]}
              >
                {/* 移除选中气泡背景 */}

                {/* 触摸区域 - 拖拽时禁用点击 */}
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={`${label}${isFocused ? ', selected' : ''}`}
                  onPress={() => handleTabPress(route, isFocused)}
                  disabled={isDragging} // 拖拽时禁用点击
                  style={styles.tabTouchable}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabContent}>
                    {/* 图标 - 简化动画避免scale错误 */}
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={iconName}
                        size={isFocused ? 24 : 22}
                        color={isFocused ? '#007AFF' : '#000000'}
                        style={styles.tabIcon}
                      />
                    </View>
                    
                    {/* 文字 - 简化避免动画错误 */}
                    <Text
                      style={[
                        styles.tabLabel,
                        { 
                          color: isFocused ? '#007AFF' : '#000000',
                          opacity: isFocused ? 1.0 : 0.7,
                          fontWeight: isFocused ? '600' : '500',
                        }
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.7}
                      allowFontScaling={true}
                    >
                      {label}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
          </Animated.View>

          {/* 紧凑模式：圆形按钮 */}
          <Animated.View style={[styles.compactButton, compactButtonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.compactButtonTouch}
              onPress={handleSearchCancel}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid"
                size={18}
                color="#1C1C1E"
              />
            </TouchableOpacity>
          </Animated.View>
          
          {/* 搜索按钮 - 只在探索页面和默认状态显示 */}
          {showSearchButton && searchMode === 'default' && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <View style={styles.searchButtonContent}>
                <Ionicons
                  name="search"
                  size={22}
                  color="#007AFF"
                />
              </View>
            </TouchableOpacity>
          )}

          {/* 取消按钮 - 只在输入状态显示 */}
          {searchMode === 'input' && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchCancel}
              activeOpacity={0.7}
            >
              <View style={styles.searchButtonContent}>
                <Ionicons
                  name="close"
                  size={22}
                  color="#007AFF"
                />
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* 搜索覆盖层 - 独立层级，匹配参考图效果 */}
        <Animated.View style={[
          styles.searchOverlay,
          searchAreaAnimatedStyle
        ]}>
          {/* 简洁白色背景 */}
          
          <View style={styles.searchOverlayContent}>
            <Ionicons name="search" size={18} color="#666666" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchOverlayInput}
              placeholder={t('common.search_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={(text) => {
                console.log('🔍 [TABBAR] 搜索文本输入:', { oldText: searchText, newText: text, currentMode: searchMode });
                setSearchText(text);
                
                // 发送搜索事件到ActivityListScreen进行当前页面内筛选
                console.log('🔍 [TABBAR] 发送搜索事件到ActivityListScreen:', text);
                DeviceEventEmitter.emit('searchTextChanged', { 
                  searchText: text.trim(),
                  timestamp: Date.now()
                });
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {/* 条件显示叉叉按钮 - 只有当搜索框有内容时才显示 */}
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.searchOverlayClear}
                onPress={handleSearchClear}
              >
                <Ionicons name="close" size={18} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
        
        {/* 边框层 */}
        <View style={styles.borderLayer} pointerEvents="none" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 66,
    zIndex: 999,
    backgroundColor: 'transparent', // 恢复透明背景保持玻璃效果
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 }, // Reduced from 8 to 4
    shadowOpacity: 0.08, // Reduced from 0.15 to 0.08
    shadowRadius: 8, // Reduced from 16 to 8
    elevation: 4, // Reduced from 8 to 4
  },

  liquidGlassContainer: {
    flex: 1,
    borderRadius: Glass.radius.tabbar,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },

  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Glass.radius.tabbar,
  },

  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Glass.radius.tabbar,
  },

  sweepHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    borderRadius: Glass.radius.tabbar,
  },

  sweepGradient: {
    flex: 1,
    borderRadius: Glass.radius.tabbar,
  },

  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // 恢复为space-between，让Tab居中
    backgroundColor: 'transparent',
    paddingVertical: 6, // 从8pt减到6pt，优化垂直分布
    paddingHorizontal: 8, // 给搜索按钮留出空间
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  tabContainer: {
    flex: 1, // 恢复为flex: 1，让Tab均匀分布
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },

  // 默认Tab容器
  normalTabsContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around', // 让4个Tab均匀分布
    height: '100%',
    paddingHorizontal: 16, // 添加水平内边距，让Tab不贴边
  },

  // 紧凑圆形按钮 - 修复垂直对齐
  compactButton: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -25, // 调整为-25，与搜索框完美对齐
    width: 50, // 稍微增大，匹配参考图
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  compactButtonTouch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Liquid Glass半透明白色
    alignItems: 'center',
    justifyContent: 'center',
    // 添加独立阴影
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // 图标容器 - 进一步调整间距
  iconContainer: {
    marginBottom: 6, // 从4pt增加到6pt，进一步增加图标和文字间距
    // transform在JSX中动态设置
  },

  tabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6, // 从8pt减到6pt
    paddingVertical: 12, // 从8pt增加到12pt，增加垂直空间
    minHeight: 48,
    minWidth: 44,
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center', // 改回center，使用marginBottom控制间距
    height: 54, // 增加高度从50pt到54pt
    paddingVertical: 6, // 增加垂直内边距到6pt
  },

  tabIcon: {
    // 图标样式，transform在JSX中动态设置
  },

  tabLabel: {
    fontSize: 11, // 恢复到11pt
    textAlign: 'center',
    lineHeight: 13, // 恢复行高
    // transform和color在JSX中动态设置
  },

  borderLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Glass.radius.tabbar,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'transparent',
  },

  hidden: {
    opacity: 0,
    pointerEvents: 'none',
    transform: [{ translateY: 200 }],
  },

  // 搜索按钮样式
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  searchButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 搜索区域样式
  searchArea: {
    height: 44,
    justifyContent: 'center',
    marginRight: 8,
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 44,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
    height: 44,
  },
  
  searchClearButton: {
    padding: 4,
    marginLeft: 8,
  },

  // 移除气泡样式定义

  // 搜索覆盖层样式 - 优化宽度匹配参考图
  searchOverlay: {
    position: 'absolute',
    left: 62, // 增加左边距，为左侧按钮留出空间
    right: 54, // 减少右边距，让搜索框更宽
    top: 11,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 简洁白色背景
    borderRadius: 22,
    justifyContent: 'center',
    overflow: 'hidden',
    // 适度的阴影效果
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  searchOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },

  searchOverlayInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
    marginRight: 8,
  },

  searchOverlayClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomTabBar;