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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            Haptics.selectionAsync();
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

  // Tab点击处理 - 添加图标文字动画
  const handleTabPress = useCallback((route: any, isFocused: boolean) => {
    console.log('🔥 Tab clicked:', route.name, 'isFocused:', isFocused);
    
    // 触发高光扫过
    triggerHighlightSweep();
    
    // 简洁的点击反馈动画 - 图标轻微弹跳
    if (!isFocused) {
      // 目标Tab的图标会在状态切换时自动放大
      // 这里可以添加额外的点击反馈
    }
    
    // iOS Haptic反馈
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      console.log('🚀 Navigating to:', route.name);
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

  // Keyboard handlers
  useEffect(() => {
    const keyboardWillShow = (e: KeyboardEvent) => {
      tabBarTranslateY.value = withTiming(120, { duration: 250 });
    };
    
    const keyboardWillHide = () => {
      tabBarTranslateY.value = withTiming(0, { duration: 250 });
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

  // TabBar隐藏事件
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('hideTabBar', (shouldHide: boolean) => {
      if (shouldHide) {
        tabBarTranslateY.value = withTiming(100, { duration: 300 });
      } else {
        tabBarTranslateY.value = withTiming(0, { duration: 300 });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Explore':
        return focused ? 'compass' : 'compass-outline';
      case 'Consulting':
        return focused ? 'chatbubbles' : 'chatbubbles-outline';
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
      case 'Consulting':
        return t('navigation.tabs.consulting');
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
    transform: [{ translateY: tabBarTranslateY.value }],
  }));

  const highlightSweepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightSweepX.value }],
    opacity: highlightOpacity.value,
  }));

  // 拖拽气泡动画样式
  const dragBubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bubbleX.value },
      { scale: bubbleScale.value }
    ],
    opacity: dragBubbleVisible.value,
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

  if (!state || !state.routes || !descriptors) {
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
          intensity={Platform.OS === 'android' ? 16 : Glass.blur}
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
        <View style={styles.tabBarContainer}>
          {state.routes.map((route, index) => {
            if (!route || !route.key) return null;
            
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            
            const { options } = descriptor;
            const isFocused = state.index === index;
            const iconName = getIconName(route.name, isFocused);
            const label = getTabLabel(route.name);

            return (
              <View key={route.key} style={styles.tabContainer}>
                {/* 简洁的选中指示 - 移除复杂胶囊和气泡 */}

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
                    {/* 图标动画 - 选中时放大 */}
                    <Animated.View style={[
                      styles.iconContainer,
                      {
                        transform: [{ scale: isFocused ? 1.1 : 1.0 }],
                      }
                    ]}>
                      <Ionicons
                        name={iconName}
                        size={22}
                        color={isFocused ? '#007AFF' : '#000000'}
                        style={styles.tabIcon}
                      />
                    </Animated.View>
                    
                    {/* 文字动画 - 选中时高亮 + 智能缩放 */}
                    <Animated.Text
                      style={[
                        styles.tabLabel,
                        { 
                          color: isFocused ? '#007AFF' : '#000000',
                          opacity: isFocused ? 1.0 : 0.7,
                          fontWeight: isFocused ? '600' : '500',
                          transform: [{ scale: isFocused ? 1.05 : 1.0 }],
                        }
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true} // 智能字体缩放
                      minimumFontScale={0.7} // 最小缩放到70%
                      allowFontScaling={true} // 允许系统字体缩放
                    >
                      {label}
                    </Animated.Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        
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
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
    paddingVertical: 6, // 从8pt减到6pt，优化垂直分布
    paddingHorizontal: 2, // 从8pt减到2pt，给文字更多空间
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
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
});

export default CustomTabBar;