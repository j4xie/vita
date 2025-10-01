import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardEvent,
  AccessibilityInfo,
  DeviceEventEmitter,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
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
import { CenterTabButton } from './CenterTabButton';

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

  // 🔄 实时获取当前路由的嵌套路由名称
  const currentRoute = state.routes[state.index];
  const getFocusedRouteName = (route: any): string => {
    if (route.state) {
      const nestedRoute = route.state.routes[route.state.index];
      return getFocusedRouteName(nestedRoute);
    }
    return route.name;
  };

  const focusedRouteName = getFocusedRouteName(currentRoute);

  // 基础动画值
  const tabBarTranslateY = useSharedValue(0);
  const highlightSweepX = useSharedValue(-100);
  const highlightOpacity = useSharedValue(0);

  // 拖拽气泡动画值系统
  const dragBubbleVisible = useSharedValue(0);
  const bubbleScale = useSharedValue(1);
  const bubbleX = useSharedValue(0);
  const targetTabIndex = useSharedValue(0);
  const highlightGain = useSharedValue(1);
  const rainbowGain = useSharedValue(1);
  const whiteRingOpacity = useSharedValue(0);
  
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

  // 初始化目标Tab索引
  useEffect(() => {
    if (state?.index !== undefined) {
      targetTabIndex.value = state.index;
    }
  }, [state?.index]);

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
      
      // Tab切换触觉反馈
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptics not available:', error);
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
        return focused ? 'storefront' : 'storefront-outline';
      case 'Rewards':
        return focused ? 'card' : 'card-outline';
      case 'Wellbeing':
        return focused ? 'shield' : 'shield-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
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
      case 'Rewards':
        return t('navigation.tabs.rewards');
      case 'Wellbeing':
        return t('navigation.tabs.wellbeing');
      case 'Profile':
        return t('navigation.tabs.profile');
      default:
        return routeName;
    }
  };

  // 动画样式
  const animatedTabBarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: tabBarTranslateY.value },
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
          {/* 4个普通Tab + 中间占位符 */}
          <View style={styles.normalTabsContainer}>
            {state.routes.map((route, index) => {
            if (!route || !route.key) return null;

            const descriptor = descriptors[route.key];
            if (!descriptor) return null;

            const { options } = descriptor;
            const isFocused = state.index === index;

            // 🎯 Rewards Tab - 渲染占位符，实际按钮在外部浮动渲染
            if (route.name === 'Rewards') {
              return <View key={route.key} style={styles.centerPlaceholder} />;
            }

            // 普通Tab渲染
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
                        size={isFocused ? 20 : 18}
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
          </View>
        </Animated.View>
        
        {/* 边框层 */}
        <View style={styles.borderLayer} pointerEvents="none" />
      </View>

      {/* 🎯 浮动中心按钮 - Rewards Tab (在liquidGlassContainer外部) */}
      {(() => {
        const rewardsRoute = state.routes.find(route => route.name === 'Rewards');
        if (!rewardsRoute) return null;

        const rewardsIndex = state.routes.findIndex(route => route.name === 'Rewards');
        const isFocused = state.index === rewardsIndex;

        return (
          <View style={styles.floatingCenterButton}>
            <CenterTabButton
              focused={isFocused}
              onPress={() => handleTabPress(rewardsRoute, isFocused)}
              icon="card"
              badge={0}
            />
          </View>
        );
      })()}
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


  // 图标容器 - 5-tab布局优化间距
  iconContainer: {
    marginBottom: 3, // 5-tab布局：减小到3pt以节省空间
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
    height: 46, // 5-tab布局：减小高度以适配更紧凑的设计
    paddingVertical: 4, // 5-tab布局：减小垂直内边距
  },

  tabIcon: {
    // 图标样式，transform在JSX中动态设置
  },

  tabLabel: {
    fontSize: Platform.OS === 'ios' && (Dimensions.get('window').width >= 768) ? 24 : 10, // 5-tab布局：手机端10pt，iPad保持24pt
    fontWeight: '500', // Medium字重
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' && (Dimensions.get('window').width >= 768) ? 30 : 13, // 5-tab布局：手机端13pt行高
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

  // 🎯 中间占位符 - 为浮动按钮留出空间
  centerPlaceholder: {
    width: 70,
    height: '100%',
  },

  // 🎯 浮动中心按钮容器
  floatingCenterButton: {
    position: 'absolute',
    bottom: 15, // 从TabBar底部向上15px，让60px按钮凸出约25px
    left: '50%',
    marginLeft: -30, // 60px按钮的一半
    zIndex: 1001,
  },
});

export default CustomTabBar;