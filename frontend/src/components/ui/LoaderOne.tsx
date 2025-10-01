import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface LoaderOneProps {
  /**
   * Size of the loader
   * - 'small': 20px (for buttons)
   * - 'large': 36px (for full screen)
   * - number: custom size
   */
  size?: 'small' | 'large' | number;
  /**
   * Color of the loader
   * Defaults to theme primary color
   */
  color?: string;
  /**
   * Additional style for the container
   */
  style?: ViewStyle;
}

/**
 * LoaderOne - Elegant loading animation component
 *
 * Inspired by Aceternity UI, built for React Native using Reanimated 3
 * Features a smooth rotating circle with pulsing dots animation
 */
export const LoaderOne: React.FC<LoaderOneProps> = ({
  size = 'large',
  color = '#F9A889',
  style,
}) => {
  const rotation = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  // Parse size to number
  const sizeValue = typeof size === 'number' ? size : size === 'small' ? 20 : 36;
  const dotSize = sizeValue / 5; // Proportional dot size

  useEffect(() => {
    // Rotation animation - smooth continuous spin
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Pulsing dots with staggered timing
    const pulseDuration = 600;
    const pulseConfig = {
      duration: pulseDuration,
      easing: Easing.bezier(0.4, 0, 0.6, 1),
    };

    scale1.value = withRepeat(
      withSequence(
        withTiming(1.3, pulseConfig),
        withTiming(1, pulseConfig)
      ),
      -1,
      false
    );

    // Delay second dot
    setTimeout(() => {
      scale2.value = withRepeat(
        withSequence(
          withTiming(1.3, pulseConfig),
          withTiming(1, pulseConfig)
        ),
        -1,
        false
      );
    }, 200);

    // Delay third dot
    setTimeout(() => {
      scale3.value = withRepeat(
        withSequence(
          withTiming(1.3, pulseConfig),
          withTiming(1, pulseConfig)
        ),
        -1,
        false
      );
    }, 400);

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(scale1);
      cancelAnimation(scale2);
      cancelAnimation(scale3);
    };
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const dot1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
  }));

  const dot2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
  }));

  const dot3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
  }));

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[
          styles.container,
          containerAnimatedStyle,
          { width: sizeValue, height: sizeValue },
        ]}
      >
        {/* Dot 1 - Top */}
        <Animated.View
          style={[
            styles.dot,
            dot1AnimatedStyle,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              top: 0,
              left: '50%',
              marginLeft: -dotSize / 2,
            },
          ]}
        />

        {/* Dot 2 - Bottom Right */}
        <Animated.View
          style={[
            styles.dot,
            dot2AnimatedStyle,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              bottom: 0,
              right: 0,
            },
          ]}
        />

        {/* Dot 3 - Bottom Left */}
        <Animated.View
          style={[
            styles.dot,
            dot3AnimatedStyle,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              bottom: 0,
              left: 0,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});

export default LoaderOne;
