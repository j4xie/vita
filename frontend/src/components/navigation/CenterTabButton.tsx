import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * CenterTabButton - 突出显示的中心Tab按钮
 *
 * 设计规格:
 * - 尺寸: 64x64px 圆形按钮
 * - 位置: 向上抬起 20px
 * - 背景: 渐变 #FF6B6B → #FF8E53
 * - 边框: 3px 白色边框
 * - 图标: 28px 白色卡片图标
 * - 动画: 点击缩放 + 发光效果
 * - 阴影: 柔和的下阴影
 */

interface CenterTabButtonProps {
  focused: boolean;
  onPress: () => void;
  icon?: string;
  badge?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const CenterTabButton: React.FC<CenterTabButtonProps> = ({
  focused,
  onPress,
  icon = 'card',
  badge = 0,
}) => {
  // 动画值
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    // 触觉反馈
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }

    // 点击动画：缩小 → 弹回 → 轻微旋转
    scale.value = withSequence(
      withTiming(0.88, { duration: 100, easing: Easing.out(Easing.quad) }),
      withSpring(1.02, { damping: 12, stiffness: 400 }),
      withTiming(1.0, { duration: 150, easing: Easing.out(Easing.cubic) })
    );

    // 发光效果
    glowOpacity.value = withSequence(
      withTiming(0.6, { duration: 100 }),
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    // 轻微旋转效果
    rotation.value = withSequence(
      withTiming(-3, { duration: 80 }),
      withSpring(0, { damping: 12, stiffness: 300 })
    );

    onPress();
  };

  // 按钮动画样式
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ] as const,
    };
  });

  // 发光动画样式
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // 焦点状态样式
  const focusedScale = focused ? 1.05 : 1.0;

  return (
    <View style={styles.container}>
      {/* 外发光层 - subtle black glow */}
      <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
        <View style={styles.glowView} />
      </Animated.View>

      {/* 主按钮 */}
      <AnimatedTouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[styles.button, buttonAnimatedStyle, { transform: [{ scale: focusedScale }] }]}
      >
        {/* 纯黑色背景 */}
        <View style={styles.solidBackground}>
          {/* 白色边框 */}
          <View style={styles.border}>
            {/* Crown 图标 */}
            <MaterialCommunityIcons
              name="crown"
              size={24}
              color="#FF8A72"
            />

            {/* Badge 通知点 */}
            {badge > 0 && (
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
              </View>
            )}
          </View>
        </View>
      </AnimatedTouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // 外发光层
  glowContainer: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  glowView: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },

  // 主按钮
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  // 纯黑色背景
  solidBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    padding: 2.5,
    backgroundColor: '#1A1A1A',
  },

  // 白色边框 + 内容区
  border: {
    flex: 1,
    borderRadius: 27.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Badge 通知点
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
});
