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
  icon = 'crown-outline',
  badge = 0,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }

    scale.value = withSequence(
      withTiming(0.88, { duration: 100, easing: Easing.out(Easing.quad) }),
      withSpring(1.02, { damping: 12, stiffness: 400 }),
      withTiming(1.0, { duration: 150, easing: Easing.out(Easing.cubic) })
    );

    glowOpacity.value = withSequence(
      withTiming(0.6, { duration: 100 }),
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    rotation.value = withSequence(
      withTiming(-3, { duration: 80 }),
      withSpring(0, { damping: 12, stiffness: 300 })
    );

    onPress();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ] as const,
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const focusedScale = focused ? 1.05 : 1.0;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Glow layer */}
      <Animated.View style={[styles.glowContainer, glowAnimatedStyle]} pointerEvents="none">
        <View style={styles.glowView} />
      </Animated.View>

      {/* Main button - solid black circle, no white border */}
      <AnimatedTouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        accessibilityLabel="Rewards"
        accessibilityRole="button"
        style={[styles.button, buttonAnimatedStyle, { transform: [{ scale: focusedScale }] }]}
      >
        <View style={styles.solidCircle}>
          <MaterialCommunityIcons
            name="crown-outline"
            size={26}
            color="#FF8A72"
          />

          {badge > 0 && (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          )}
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

  // Solid black circle - no white border
  solidCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
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
