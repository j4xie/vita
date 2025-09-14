import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Platform,
  AccessibilityInfo,
  useColorScheme,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  style?: any;
  disabled?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onIndexChange,
  style,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = React.useState(false);
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L2Config = getLayerConfig('L2', isDarkMode);
  
  // 动画值
  const animatedIndex = useSharedValue(selectedIndex);
  const segmentWidth = useSharedValue(0);
  
  // 检查无障碍设置
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
  }, []);

  // 更新选中索引动画 - 增强流畅度
  useEffect(() => {
    const duration = isReduceMotionEnabled ? 120 : 300; // 延长动画时间
    
    animatedIndex.value = withTiming(selectedIndex, {
      duration,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design 标准缓动
    });
  }, [selectedIndex, isReduceMotionEnabled]);

  // 触觉反馈
  const triggerHapticFeedback = () => {
    if (Platform.OS === 'ios') {
      // iOS轻触觉反馈
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Android振动反馈
      Vibration.vibrate(10);
    }
  };

  // 处理分段选择
  const handleSegmentPress = (index: number) => {
    if (disabled || index === selectedIndex) return;
    
    runOnJS(triggerHapticFeedback)();
    onIndexChange(index);
  };

  // 容器布局回调 - 优化气泡宽度计算
  const onContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    // 恢复正常的宽度计算，不强制增加宽度
    segmentWidth.value = (width - 2 * 2) / segments.length; // 考虑padding的宽度计算
  };

  // 选中指示器动画样式 - 线条指示器
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const translateX = animatedIndex.value * segmentWidth.value + animatedIndex.value * 2; // 包含padding
    const indicatorWidth = 18;
    const centerOffset = (segmentWidth.value - indicatorWidth) / 2;
    
    return {
      transform: [{ translateX: translateX + centerOffset }],
      width: indicatorWidth,
    };
  });

  // 动态样式
  const containerStyles = [
    styles.container,
    isDarkMode ? styles.containerDark : styles.containerLight,
    style,
  ];

  const getSegmentTextStyle = (index: number) => [
    styles.segmentText,
    index === selectedIndex
      ? styles.selectedText
      : (isDarkMode ? styles.unselectedTextDark : styles.unselectedTextLight),
  ];

  const getSegmentButtonStyle = (index: number) => [
    styles.segmentButton,
    disabled && styles.disabledSegment,
  ];

  return (
    <View style={containerStyles} onLayout={onContainerLayout}>
      {/* 选中指示器 - 椭圆背景 */}
      <Animated.View
        style={[
          styles.selectedIndicator,
          indicatorAnimatedStyle,
        ]}
      />
      
      {/* 分段按钮 */}
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={index}
          style={getSegmentButtonStyle(index)}
          onPress={() => handleSegmentPress(index)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={segment}
          accessibilityState={{
            selected: index === selectedIndex,
            disabled: disabled,
          }}
          testID={`segment-${index}`}
          hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
        >
          <Text
            style={getSegmentTextStyle(index)}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 38, // 恢复正常高度
    borderRadius: 19, // 高度的一半
    padding: 2, // 恢复padding
    position: 'relative',
    alignItems: 'center',
  },
  
  // 容器背景 - 透明背景
  containerLight: {
    backgroundColor: 'transparent',
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  
  // 选中指示器 - 恢复底部线条样式
  selectedIndicator: {
    position: 'absolute',
    height: 3, // 细线条指示器
    width: 18, // 固定寽度
    backgroundColor: '#F9A889', // 品牌色
    bottom: 0, // 底部对齐
    borderRadius: 1.5, // 微圆角
  },
  
  selectedIndicatorLight: {
    // Styles are now token-based and applied directly
  },
  
  selectedIndicatorDark: {
    // Styles are now token-based and applied directly
  },
  
  // 分段按钮
  segmentButton: {
    flex: 1,
    height: 34, // 恢复正常高度
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    marginHorizontal: 1, // 恢复边距
  },
  
  disabledSegment: {
    opacity: 0.6,
  },
  
  // 文字样式
  segmentText: {
    fontSize: 14, // 系统标准字号
    fontWeight: '600', // 半粗体
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // 选中文字 - 深色
  selectedText: {
    color: '#1D1D1F', // 更深的黑色
    fontWeight: '600',
  },
  
  // 未选中文字 - 灰色
  unselectedTextLight: {
    color: '#8E8E93', // iOS标准灰色
    fontWeight: '500',
  },
  unselectedTextDark: {
    color: '#8E8E93', // 保持一致的灰色
    fontWeight: '500',
  },
});