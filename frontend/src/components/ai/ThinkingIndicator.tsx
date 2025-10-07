import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

interface ThinkingIndicatorProps {
  estimatedTime?: number; // 预计等待时间（秒）
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  estimatedTime = 3,
}) => {
  const { t } = useTranslation();
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const textOpacity = useSharedValue(0.6);

  useEffect(() => {
    // 旋转动画 - 橙色加载圈
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // 脉动动画
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // 文字呼吸动画
    textOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <BlurView intensity={60} style={styles.card} tint="light">
        <LinearGradient
          colors={['rgba(249, 168, 137, 0.08)', 'rgba(255, 180, 162, 0.05)']}
          style={styles.gradient}
        >
          {/* 脉动背景圆 */}
          <Animated.View style={[styles.pulseCircle, pulseStyle]} />

          <View style={styles.content}>
            {/* 旋转的橙色渐变圆环 */}
            <Animated.View style={[styles.spinnerContainer, spinnerStyle]}>
              <LinearGradient
                colors={['#F9A889', '#FFB4A2', 'transparent', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.spinner}
              >
                <View style={styles.spinnerInner} />
              </LinearGradient>
            </Animated.View>

            {/* 思考文字 */}
            <View style={styles.textContainer}>
              <Animated.Text style={[styles.thinkingText, textStyle]}>
                {t('ai.thinking')}
              </Animated.Text>
              <Text style={styles.timeText}>({estimatedTime}s)</Text>
            </View>

            {/* 提示文字 */}
            <Text style={styles.tapHint}>Tap to read my mind</Text>
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(249, 168, 137, 0.2)',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  pulseCircle: {
    position: 'absolute',
    top: 8,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(249, 168, 137, 0.15)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinnerContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thinkingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  timeText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 12,
    color: '#8e8e93',
    fontStyle: 'italic',
    marginLeft: 8,
  },
});

export default ThinkingIndicator;
