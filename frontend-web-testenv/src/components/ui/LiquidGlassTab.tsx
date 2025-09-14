import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnUI,
} from 'react-native-reanimated';
import { BlurView } from '../../components/web/WebBlurView';
import { theme } from '../../theme';
import { BRAND_GLASS, BRAND_INTERACTIONS } from '../../theme/core';

interface LiquidGlassTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  style?: any; // Support external styling for container
}

export const LiquidGlassTab: React.FC<LiquidGlassTabProps> = ({
  label,
  isActive,
  onPress,
  disabled = false,
  testID,
  style,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = React.useState(false);
  
  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
  }, []);

  // Performance monitoring for Android blur degradation
  const [shouldUseBlur, setShouldUseBlur] = React.useState(true);
  
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Simulate performance monitoring - in real app, use frame rate monitoring
      const performanceCheck = () => {
        // In production, implement actual FPS monitoring
        // For now, assume blur is supported on Android 8+
        setShouldUseBlur(Platform.Version >= 26);
      };
      performanceCheck();
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    
    runOnUI(() => {
      'worklet';
      if (isReduceMotionEnabled) {
        // Reduced motion: simple opacity change
        opacity.value = withTiming(0.7, { 
          duration: theme.animations.durations.micro 
        });
      } else {
        // Full animation with V1.1 spring presets
        scale.value = withSpring(0.95, theme.animations.springs.appear);
        opacity.value = withTiming(0.8, { 
          duration: theme.animations.durations.micro 
        });
      }
    })();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    runOnUI(() => {
      'worklet';
      if (isReduceMotionEnabled) {
        opacity.value = withTiming(1, { 
          duration: theme.animations.durations.quick 
        });
      } else {
        scale.value = withSpring(1, theme.animations.springs.appear);
        opacity.value = withTiming(1, { 
          duration: theme.animations.durations.quick 
        });
      }
    })();
  };

  // Determine if we should render blur effect
  // 临时禁用BlurView以确保文字可见性，使用Fallback渲染
  const renderWithBlur = false; // shouldUseBlur && !isActive && Platform.OS === 'ios';

  if (renderWithBlur) {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          style={[
            styles.container,
            disabled && styles.disabled
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={0.9}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          testID={testID}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
          accessibilityHint="Double tap to switch category"
        >
          <BlurView
            intensity={15}
            style={[
              styles.blurContainer,
              styles.inactiveGlass
            ]}
          >
            <Text
              style={[
                styles.text,
                styles.textInactive,
                disabled && styles.textDisabled
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75} // 进一步降低最小字体以适应更长的英文单词
              allowFontScaling={false} // 保持固定字体大小，优先扩展按钮宽度
            >
              {label}
            </Text>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Fallback: Non-blur or active tab
  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        style={[
          styles.container,
          isActive ? styles.active : styles.inactive,
          disabled && styles.disabled
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        testID={testID}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityHint="Double tap to switch category"
      >
        <Text
          style={[
            styles.text,
            isActive ? styles.textActive : styles.textInactive,
            disabled && styles.textDisabled
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.75} // 进一步降低最小字体以适应更长的英文单词
          allowFontScaling={false} // 保持固定字体大小，优先扩展按钮宽度
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // V1.1 规范: 最小触达区域 48x48dp
    minHeight: 48,
    paddingHorizontal: 12, // 减少水平padding给文字更多空间
    paddingVertical: 10, // 减少垂直padding优化空间利用
    borderRadius: 12, // V1.1 规范: 小组件 12px 圆角
    alignItems: 'center',
    justifyContent: 'center',
    // Remove fixed widths and margins for flexible layout
  },
  
  // 非激活状态 - Liquid Glass 效果  
  inactive: {
    backgroundColor: 'rgba(229, 231, 235, 0.95)', // 更不透明的浅灰色背景
    borderWidth: 1.5, // 更粗的边框
    borderColor: 'rgba(107, 114, 128, 0.8)', // 更深的边框颜色
    ...theme.shadows.xs, // V1.1 规范: 标签使用 xs 级阴影
  },
  
  // 激活状态 - 实色但保留玻璃质感
  active: {
    backgroundColor: BRAND_INTERACTIONS.navigation.active.text, // PomeloX #FF6B35
    borderWidth: 1,
    borderColor: theme.liquidGlass.primaryGlass.border,
    ...theme.shadows.xs,
    // V1.1 规范: 激活状态轻微缩放
    transform: [{ scale: 1.02 }],
    // 增强阴影但符合性能要求
    ...(Platform.OS === 'ios' && {
      shadowColor: BRAND_INTERACTIONS.navigation.active.text,
    }),
  },
  
  // 禁用状态
  disabled: {
    backgroundColor: theme.colors.primaryDisabled, // #FFB399
    opacity: 0.6,
  },
  
  // BlurView 容器（仅 iOS 非激活标签）
  blurContainer: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12, // 减少padding与container保持一致
    paddingVertical: 10,
  },
  
  inactiveGlass: {
    backgroundColor: 'rgba(229, 231, 235, 0.8)', // BlurView上的更不透明背景
    borderWidth: 1.5,
    borderColor: 'rgba(107, 114, 128, 0.8)',
  },
  
  // 文本样式
  text: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * 1.4,
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 1,
  },
  
  textInactive: {
    color: '#000000', // 使用纯黑色确保最大对比度
    fontWeight: theme.typography.fontWeight.bold, // 使用最粗的字体
    // 添加强烈的白色文字阴影
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    // 确保文字在任何情况下都可见
    opacity: 1,
  },
  
  textActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
    // 激活状态文字阴影提升可读性
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  textDisabled: {
    opacity: 0.6, // V1.1 规范: 禁用文本 60% 不透明度
  },
});