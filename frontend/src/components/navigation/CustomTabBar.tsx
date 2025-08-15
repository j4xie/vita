import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Keyboard,
  KeyboardEvent,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnUI,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { BRAND_GLASS, BRAND_INTERACTIONS, LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { TouchTargetValidator } from '../../utils/accessibilityChecker';
import { useFilter } from '../../context/FilterContext';

const { width } = Dimensions.get('window');

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
  
  // V2.0 新增分层系统配置
  const { getLayerConfig, getBlurFallbackConfig } = usePerformanceDegradation();
  const isDarkMode = false; // 可后续接入系统主题检测
  
  // 获取L1玻璃面板配置(用于容器)
  const L1Config = getLayerConfig('L1', isDarkMode);
  
  // 获取L2品牌玻璃配置(用于选中项)
  const L2Config = getLayerConfig('L2', isDarkMode);
  
  // Accessibility and motion preferences
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  
  // Keyboard state management
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const tabBarTranslateY = useSharedValue(0);
  
  // Check accessibility preferences
  useEffect(() => {
    const checkAccessibilityPreferences = async () => {
      try {
        const [reduceMotion, screenReader] = await Promise.all([
          AccessibilityInfo.isReduceMotionEnabled(),
          AccessibilityInfo.isScreenReaderEnabled(),
        ]);
        setIsReduceMotionEnabled(reduceMotion);
        setIsScreenReaderEnabled(screenReader);
      } catch (error) {
        console.warn('Failed to check accessibility preferences:', error);
      }
    };
    
    checkAccessibilityPreferences();
    
    // Listen for accessibility changes
    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    
    return () => {
      reduceMotionListener?.remove();
      screenReaderListener?.remove();
    };
  }, []);

  // Filter 状态变化时控制导航栏显示/隐藏
  useEffect(() => {
    const targetTranslateY = isFilterOpen ? 120 : 0; // 增加隐藏距离确保完全不可见
    
    tabBarTranslateY.value = withTiming(targetTranslateY, {
      duration: isReduceMotionEnabled ? 120 : 200,
    });
  }, [isFilterOpen, isReduceMotionEnabled]);
  
  // Keyboard event handlers
  useEffect(() => {
    const keyboardWillShow = (e: KeyboardEvent) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
      tabBarTranslateY.value = withTiming(120, { duration: 250 }); // Hide tab bar
    };
    
    const keyboardWillHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      tabBarTranslateY.value = withTiming(0, { duration: 250 }); // Show tab bar
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
  
  
  // Tab bar animation style
  const animatedTabBarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: tabBarTranslateY.value }],
    };
  });
  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Explore': // 原Home改名为Explore，但内容是活动
        return focused ? 'compass' : 'compass-outline';
      case 'Consulting': // 原Explore改名为Consulting
        return focused ? 'chatbubbles' : 'chatbubbles-outline';
      case 'Community': // 新增社区
        return focused ? 'people' : 'people-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
      case 'Wellbeing': // 原Volunteer改名为Wellbeing
        return focused ? 'shield' : 'shield-outline';
      default:
        return 'compass-outline';
    }
  };

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'Explore': // 原Home改名为Explore，显示"探索"
        return t('navigation.tabs.explore');
      case 'Consulting': // 原Explore改名为Consulting，显示"咨询"
        return t('navigation.tabs.consulting');
      case 'Community': // 新增社区
        return t('navigation.tabs.community');
      case 'Profile':
        return t('navigation.tabs.profile');
      case 'Wellbeing': // 原Volunteer改名为Wellbeing，显示"安心"
        return t('navigation.tabs.wellbeing');
      default:
        return routeName;
    }
  };

  return (
    // 美团风格TabBar - 贴底设计，当过滤器打开时隐藏
    <Animated.View style={[
      styles.container, 
      animatedTabBarStyle,
      // 当过滤器打开时完全隐藏但不违反Hooks规则
      isFilterOpen && styles.hidden
    ]}>
      {/* 美团风格容器 - 直接渲染无圆角 */}
      <View style={styles.tabBarWrapper}>
        <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 8 }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = useCallback(() => {
            // Simple haptic feedback
            if (Platform.OS === 'ios') {
              Haptics.selectionAsync();
            }
            
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }, [isFocused, navigation, route, isReduceMotionEnabled]);

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = getIconName(route.name, isFocused);
          const label = getTabLabel(route.name);

          // V2.0 L1/L2分层Tab设计
          return (
            <View
              key={route.key}
              style={styles.tabContainer}
            >
              <TouchableOpacity
                accessibilityRole="tab"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || `${label}${isFocused ? ', selected' : ''}`}
                accessibilityHint={
                  isScreenReaderEnabled 
                    ? (isFocused ? `Current tab: ${label}` : `Navigate to ${label} section`)
                    : (isFocused ? `${label} tab is selected` : `Double tap to open ${label}`)
                }
                accessibilityValue={isScreenReaderEnabled ? { text: `Tab ${index + 1} of ${state.routes.length}` } : undefined}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.tabContentButton,
                  isFocused ? styles.tabContentActiveL2 : styles.tabContentInactiveL1
                ]}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={iconName}
                    size={24} // 统一为24pt
                    color={
                      isFocused 
                        ? '#FFFFFF' // L2品牌玻璃上使用白色图标
                        : '#6B7280' // L1玻璃上使用深灰色图标
                    }
                  />
                </View>
                
                <Text 
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.activeTabLabelL2 : styles.inactiveTabLabelL1
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                  allowFontScaling={true} // 支持动态字体
                >
                  {label}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // 美团风格贴底样式
  container: {
    position: 'absolute',
    bottom: -20, // 向上移动5px，总计向下20px
    left: 0,
    right: 0,
    paddingHorizontal: 0, // 移除水平内边距，完全贴边
    paddingTop: 0,
  },
  
  // V2.0 L1玻璃面板包装器
  tabBarWrapper: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.surface, // 20pt圆角
    marginHorizontal: theme.spacing.md, // 16pt水平边距
    marginBottom: theme.spacing.sm, // 8pt底部边距
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
    // iOS特有的模糊背景支持
    ...(Platform.OS === 'ios' && {
      shadowColor: BRAND_GLASS.glow.primary.color,
      shadowOpacity: 0.1,
    }),
  },
  
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'transparent', // 透明背景，依靠外层wrapper提供背景
    paddingTop: 12, // 增加顶部padding适配圆角设计
    paddingBottom: 12,
    paddingHorizontal: 16, // 增加水平padding
    minHeight: 54, // 略增高度适配新设计
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.surface, // 与wrapper保持一致
  },
  
  /* 贴底系统风样式 - 已注释用于对比
  systemContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  systemTabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
    height: 49,
    backdropFilter: 'blur(20px)',
  },
  */
  
  // Tab容器 - 负责布局和间距
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5.5, // 顶部padding减少2.5px
    paddingBottom: 4, // 底部padding
    paddingHorizontal: 2, // 最小水平内边距
    position: 'relative',
    minHeight: 49, // 与TabBar高度一致
  },
  
  // V2.0 Tab内容按钮基础样式
  tabContentButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: LIQUID_GLASS_LAYERS.L2.borderRadius.compact, // 12pt圆角
    minWidth: 48, // 确保最小触摸目标
    minHeight: 44, // 确保足够的点击区域
    borderWidth: 1,
  },
  
  // V2.0 L1玻璃样式 - 未选中Tab
  tabContentInactiveL1: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // 轻微半透明背景
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...theme.shadows.none, // 无阴影
  },
  
  // V2.0 L2品牌玻璃样式 - 选中Tab
  tabContentActiveL2: {
    backgroundColor: LIQUID_GLASS_LAYERS.L2.background.light, // 西柚橙色轻染
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light, // 西柚橙色描边
    ...theme.shadows[LIQUID_GLASS_LAYERS.L2.shadow],
    // iOS品牌色发光效果
    ...(Platform.OS === 'ios' && {
      shadowColor: LIQUID_GLASS_LAYERS.L2.glow.color,
      shadowOpacity: 0.2,
      shadowRadius: LIQUID_GLASS_LAYERS.L2.glow.radius,
    }),
  },
  
  
  iconContainer: {
    width: 26, // 23pt icon + 3pt padding
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1, // 减少图标与文字间距，因为按钮有padding
  },
  
  tabLabel: {
    fontSize: 12, // 11-12pt 文字大小
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16, // 增加到16pt，提高可读性（≥1.4倍）
    includeFontPadding: false, // Android 优化
    // 动态字体支持
    maxFontSizeMultiplier: 1.3, // 限制最大放大倍数
  },
  
  // V2.0 L1玻璃未选中标签样式
  inactiveTabLabelL1: {
    color: '#6B7280', // 深灰色文字
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // V2.0 L2品牌玻璃选中标签样式
  activeTabLabelL2: {
    color: '#FFFFFF', // 白色文字
    fontWeight: theme.typography.fontWeight.semibold,
    // 添加文字阴影增强可读性
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // 禁用状态样式
  disabledTab: {
    opacity: 0.6,
  },
  
  disabledTabLabel: {
    color: theme.colors.text.disabled,
  },
  
  // 完全隐藏样式 - 避免Hooks违例
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
    transform: [{ translateY: 200 }], // 额外向下移动确保不可见
  },
});