import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  icon?: keyof typeof Ionicons.glyphMap;
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
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` as any },
    ],
  }));

  // 发光动画样式
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // 焦点状态样式
  const focusedScale = focused ? 1.05 : 1.0;

  return (
    <View style={styles.container}>
      {/* 外发光层 */}
      <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
        <LinearGradient
          colors={['rgba(255, 107, 107, 0.4)', 'rgba(255, 142, 83, 0.4)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowGradient}
        />
      </Animated.View>

      {/* 主按钮 */}
      <AnimatedTouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[styles.button, buttonAnimatedStyle, { transform: [{ scale: focusedScale }] }]}
      >
        {/* 渐变背景 */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* 白色边框 */}
          <View style={styles.border}>
            {/* 图标 */}
            <Ionicons
              name={focused ? icon : `${icon}-outline` as any}
              size={26}
              color="#FFFFFF"
            />

            {/* Badge 通知点 */}
            {badge > 0 && (
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
              </View>
            )}
          </View>
        </LinearGradient>
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

  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },

  // 主按钮
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // 渐变背景
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    padding: 2.5,
  },

  // 白色边框 + 内容区
  border: {
    flex: 1,
    borderRadius: 27.5,
    borderWidth: 2.5,
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
