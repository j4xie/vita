import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from '../../components/web/WebBlurView';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { Glass } from './GlassTheme';

interface SegmentedGlassProps {
  segments: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  disabled?: boolean;
}

export const SegmentedGlass: React.FC<SegmentedGlassProps> = ({
  segments,
  selectedIndex,
  onIndexChange,
  disabled = false,
}) => {
  const indicatorX = useSharedValue(0);
  const indicatorOpacity = useSharedValue(1);
  
  // 计算指示器位置
  const segmentWidth = useRef(0);
  
  const handleSegmentPress = (index: number) => {
    if (disabled || index === selectedIndex) return;
    
    // iOS Haptic反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // 更新选中状态
    onIndexChange(index);
    
    // 移动指示器
    const targetX = index * segmentWidth.current;
    indicatorX.value = withSpring(targetX, {
      damping: Glass.animation.springConfig.damping,
      stiffness: Glass.animation.springConfig.stiffness,
    });
  };

  const onContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    segmentWidth.current = width / segments.length;
    // 初始化指示器位置
    indicatorX.value = selectedIndex * segmentWidth.current;
  };

  // 指示器动画样式
  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    opacity: indicatorOpacity.value,
  }));

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <BlurView intensity={Glass.blur} tint="light" style={styles.blurContainer}>
        {/* 顶部1px高光分隔线 */}
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

        {/* 选中指示器 - 3pt暖色高光条 */}
        <Animated.View 
          style={[styles.indicator, indicatorAnimatedStyle]}
        >
          <LinearGradient
            colors={[
              'rgba(249, 168, 137, 0.8)', // 温和橙色高光
              'rgba(255, 180, 162, 0.8)',
              'rgba(249, 168, 137, 0.8)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorGradient}
          />
        </Animated.View>

        {/* 分段按钮 */}
        <View style={styles.segmentsContainer}>
          {segments.map((segment, index) => {
            const isSelected = index === selectedIndex;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.segmentButton}
                onPress={() => handleSegmentPress(index)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={segment}
                accessibilityState={{
                  selected: isSelected,
                  disabled: disabled,
                }}
              >
                <Animated.Text
                  style={[
                    styles.segmentText,
                    isSelected ? styles.selectedText : styles.unselectedText,
                    { opacity: isSelected ? 1.0 : 0.7 }, // 透明度规格
                  ]}
                  numberOfLines={1}
                >
                  {segment}
                </Animated.Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52, // 调整以适应44pt按钮 + padding
    borderRadius: Glass.radius.capsule,
    overflow: 'hidden',
  },
  
  blurContainer: {
    flex: 1,
    borderRadius: Glass.radius.capsule,
    overflow: 'hidden',
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
    borderRadius: Glass.radius.capsule,
  },

  segmentsContainer: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  segmentButton: {
    flex: 1,
    height: 44, // 满足最小触控区域44pt标准
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },

  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: Glass.textMain,
  },

  selectedText: {
    fontWeight: '700',
  },

  unselectedText: {
    fontWeight: '500',
  },

  // 选中指示器 - 底部3pt高光条
  indicator: {
    position: 'absolute',
    bottom: 4,
    height: 3,
    borderRadius: 1.5,
    zIndex: 10,
  },

  indicatorGradient: {
    flex: 1,
    borderRadius: 1.5,
  },
});

export default SegmentedGlass;