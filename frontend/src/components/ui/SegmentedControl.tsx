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

  // 更新选中索引动画
  useEffect(() => {
    const duration = isReduceMotionEnabled ? 120 : 200;
    
    animatedIndex.value = withTiming(selectedIndex, {
      duration,
      easing: Easing.out(Easing.cubic),
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

  // 容器布局回调
  const onContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    segmentWidth.value = (width - 2 * 2) / segments.length; // 减去间距
  };

  // 选中指示器动画样式
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const translateX = animatedIndex.value * segmentWidth.value + animatedIndex.value * 2; // 包含2pt间距
    const indicatorWidth = 18; // 固定指示器宽度
    const centerOffset = (segmentWidth.value - indicatorWidth) / 2; // 计算居中偏移
    
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
      {/* 选中指示器 - 底部横线 */}
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
    height: 38, // 统一高度
    borderRadius: 19, // 高度的一半
    padding: 2,
    position: 'relative',
    alignItems: 'center',
  },
  
  // 容器背景 - 临时添加背景色以便看到边框效果
  containerLight: {
    backgroundColor: 'rgba(245, 246, 247, 0.5)', // 轻微背景色便于调试
  },
  containerDark: {
    backgroundColor: 'rgba(28, 28, 30, 0.5)', // 深色模式背景
  },
  
  // 选中指示器 - 简洁底部横线
  selectedIndicator: {
    position: 'absolute',
    height: 3, // 3px高度Dawn细条
    width: 18, // 缩短宽度，从24改为18pt
    backgroundColor: '#F9A889',
    bottom: 0,
    borderRadius: 1.5, // 微圆角
    // 移除alignSelf和marginLeft，由动画逻辑控制居中
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
    height: 34, // 匹配指示器高度
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    marginHorizontal: 1,
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
  
  // 选中文字 - 黑色
  selectedText: {
    color: '#111827', // 深黑色
  },
  
  // 未选中文字 - 灰色
  unselectedTextLight: {
    color: '#9CA3AF', // 中等灰色
  },
  unselectedTextDark: {
    color: '#9CA3AF', // 保持一致的灰色
  },
});