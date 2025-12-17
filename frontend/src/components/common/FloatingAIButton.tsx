import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons'; // 替换为可爱PomeloX图标
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { BlurView } from 'expo-blur';
import { AILoginPromptModal } from '../modals/AILoginPromptModal';
import { RESTRAINED_COLORS } from '../../theme/core';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../../context/UserContext';
// import { useRestrainedColors } from '../../hooks/useRestrainedColors'; // 暂时移除避免hooks错误
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { GrapefruitIcon } from './icons/GrapefruitIcon';

interface FloatingAIButtonProps {
  isThinking?: boolean;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({
  isThinking = false
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useUser();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { metrics, getOptimizedStyles } = usePerformanceDegradation();
  const isPerformanceDegraded = metrics.shouldDegrade;
  const optimizedStyles = getOptimizedStyles();

  // 简化的平台配置
  const isDarkMode = false;
  const isAndroid = Platform.OS === 'android';

  // Reanimated 3 shared values
  const breathingScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.8);
  const iconRotation = useSharedValue(0);
  const shimmerTranslate = useSharedValue(-100);
  const borderColorProgress = useSharedValue(0);
  const particleProgress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Enhanced press feedback animations
  const pressGlowScale = useSharedValue(1);
  const pressBorderOpacity = useSharedValue(0.3);
  const pressIconBounce = useSharedValue(0);
  const pressBlurIntensity = useSharedValue(1);

  // Auto-hide functionality
  const hideTranslateX = useSharedValue(0);
  const hideOpacity = useSharedValue(1);
  const isVisible = useSharedValue(true);
  const hasInteracted = useSharedValue(false);
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);
  const initializationTimer = useRef<NodeJS.Timeout | null>(null);
  const modalStateRef = useRef(false);
  const isTouchingButton = useRef(false); // New ref to track button interaction

  // ... (useEffect animations remain same)

  // Enhanced animations for thinking state
  useEffect(() => {
    if (isThinking) {
      // ... (thinking animations same)
      breathingScale.value = withRepeat(
        withTiming(1.12, { duration: 800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1, true
      );
      glowOpacity.value = withRepeat(
        withTiming(1.2, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1, true
      );
    } else {
      // ... (normal animations same)
      breathingScale.value = withRepeat(
        withTiming(1.08, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1, true
      );
      glowOpacity.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1, true
      );
    }
  }, [isThinking]);

  // Monitor modal state changes
  useEffect(() => {
    const isModalCurrentlyOpen = showLoginPrompt;
    modalStateRef.current = isModalCurrentlyOpen;
    setIsAnyModalOpen(isModalCurrentlyOpen);

    if (isModalCurrentlyOpen) {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
        autoHideTimer.current = null;
      }
    } else {
      if (isVisible.value) {
        resetAutoHideTimer();
      }
    }
  }, [showLoginPrompt]);

  // Global interaction event listeners
  useEffect(() => {
    let globalTouchListener: any;
    let globalScrollListener: any;

    const handleGlobalInteraction = () => {
      // Ignore if modal is open or user is currently touching the button
      if (modalStateRef.current || isAnyModalOpen || isTouchingButton.current) {
        return;
      }

      // If user clicks elsewhere or scrolls, hide immediately
      if (isVisible.value) {
        hideButton();
      }
    };

    // Initialize with 1 second delay
    initializationTimer.current = setTimeout(() => {
      resetAutoHideTimer(); // Start initial timer

      if (!optimizedStyles.simplifiedAnimations) {
        globalTouchListener = DeviceEventEmitter.addListener('globalTouch', handleGlobalInteraction);
        globalScrollListener = DeviceEventEmitter.addListener('globalScroll', handleGlobalInteraction);
      }
    }, 1000);

    return () => {
      if (globalTouchListener) globalTouchListener.remove();
      if (globalScrollListener) globalScrollListener.remove();
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
      if (initializationTimer.current) clearTimeout(initializationTimer.current);
    };
  }, [optimizedStyles.simplifiedAnimations]);

  const handlePress = () => {
    // If hidden, just show it (pop out)
    if (!isVisible.value) {
      showButton();
      // Reset timer but DO NOT open modal
      resetAutoHideTimer();
      return;
    }

    // If visible, navigate to AI Chat or show login prompt
    resetAutoHideTimer();

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Check if user is logged in
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      navigation.navigate('AIChat');
    }
  };

  const handleLogin = () => {
    setShowLoginPrompt(false);
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    setShowLoginPrompt(false);
    navigation.navigate('Register');
  };

  // Auto-hide animation functions
  const hideButton = () => {
    // Hide to the LEFT (negative value) since button is on the left
    const hideDistance = -45; // Move left by 45px (width is ~66, so leaves ~20px visible)

    if (isPerformanceDegraded) {
      hideTranslateX.value = withSpring(hideDistance, { damping: 15, stiffness: 120 });
      hideOpacity.value = withSpring(0.5, { damping: 15, stiffness: 120 });
    } else {
      hideTranslateX.value = withSpring(hideDistance, { damping: 18, stiffness: 150 });
      hideOpacity.value = withSpring(0.5, { damping: 18, stiffness: 150 });
    }
    isVisible.value = false;
  };

  const showButton = () => {
    if (isPerformanceDegraded) {
      hideTranslateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      hideOpacity.value = withSpring(1, { damping: 15, stiffness: 120 });
    } else {
      hideTranslateX.value = withSpring(0, { damping: 18, stiffness: 150 });
      hideOpacity.value = withSpring(1, { damping: 18, stiffness: 150 });
    }
    isVisible.value = true;
  };

  // 3-second auto-hide timer
  const resetAutoHideTimer = () => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }

    if (!modalStateRef.current && !isAnyModalOpen) {
      autoHideTimer.current = setTimeout(() => {
        if (isVisible.value && !modalStateRef.current && !isAnyModalOpen && !isTouchingButton.current) {
          hideButton();
        }
      }, 3000); // 3 seconds timeout
    }
  };

  // Enhanced press handlers with multi-layer feedback
  const handlePressIn = () => {
    isTouchingButton.current = true; // Mark as touching
    setIsPressed(true);
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync(); // Immediate tactile feedback
    }

    // Always show visual press feedback, regardless of visibility state
    if (isPerformanceDegraded) {
      pressScale.value = withSpring(0.88, { damping: 12, stiffness: 120 });
    } else {
      pressScale.value = withSpring(0.88, { damping: 12, stiffness: 120 });
      pressGlowScale.value = withSpring(1.2, { damping: 8, stiffness: 100 });
      pressBorderOpacity.value = withSpring(0.8, { damping: 10, stiffness: 150 });
      pressIconBounce.value = withSpring(-3, { damping: 15, stiffness: 200 });
      pressBlurIntensity.value = withSpring(1.2, { damping: 12, stiffness: 100 });
    }
  };

  const handlePressOut = () => {
    isTouchingButton.current = false; // Mark as not touching
    setIsPressed(false);

    // Check if we should open modal or just show button (moved logic from handlePress to here or keep in handlePress?)
    // handlePress handles the logic, here we just do animations.

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (isPerformanceDegraded) {
      pressScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    } else {
      pressScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      pressGlowScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      pressBorderOpacity.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 200 }),
        withSpring(0.3, { damping: 12, stiffness: 100 })
      );
      pressIconBounce.value = withSequence(
        withSpring(3, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 15, stiffness: 150 })
      );
      pressBlurIntensity.value = withSpring(1, { damping: 12, stiffness: 100 });
    }

    // handlePress is called by onPress prop, so we don't need to call it here explicitly unless we want to control timing.
    // TouchableOpacity calls onPress after onPressOut usually.
  };



  // Animated styles using Reanimated 3
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hideTranslateX.value }],
    opacity: hideOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: breathingScale.value * pressGlowScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value * pressScale.value }],
    borderColor: 'rgba(249, 168, 137, 0.4)', // 恢复更明显的橙色边框
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${iconRotation.value}deg` },
      { scale: 1.1 },
      { translateY: pressIconBounce.value },
    ] as any,
  }));

  const particleAnimatedStyle = (index: number) => useAnimatedStyle(() => ({
    opacity: interpolate(
      particleProgress.value,
      [0, 0.5, 1],
      [0, 0.6, 0]
    ),
    transform: [
      { translateY: interpolate(particleProgress.value, [0, 1], [0, -30]) },
      { translateX: interpolate(particleProgress.value, [0, 1], [0, index === 0 ? -20 : index === 1 ? 20 : 0]) },
      { scale: 0.5 + index * 0.2 },
    ] as any,
  }));

  return (
    <>
      <Animated.View style={[styles.container, { bottom: insets.bottom + 70 }, containerAnimatedStyle]}>
        {/* 温和发光效果 - 克制版本 */}
        {!isPerformanceDegraded && (
          <>
            {/* 外层柔和发光 - 温和版 */}
            <Animated.View
              style={[styles.glowLayerOuter, glowAnimatedStyle]}
              pointerEvents="none"
            />
            {/* 内层强化发光 - 温和版 */}
            <Animated.View
              style={[styles.glowLayer, glowAnimatedStyle]}
              pointerEvents="none"
            />
          </>
        )}

        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={1}
          style={styles.touchable}
        >
          <Animated.View
            style={[
              styles.button,
              buttonAnimatedStyle,
              { borderWidth: 2 },
            ]}
          >
            {/* 温和玻璃边框效果 */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.15)', // 更温和的边框
                'rgba(255, 255, 255, 0.03)',
                'rgba(255, 255, 255, 0.08)',
              ]}
              style={styles.glassBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* 主按钮内容 */}
            <Animated.View style={styles.blurContainer}>
              <BlurView
                intensity={Platform.OS === 'android' ? (isPerformanceDegraded ? 30 : 60) : (isPerformanceDegraded ? 60 : 90)}
                style={styles.blurContainer}
                tint="light"
              >
                {/* 温和品牌渐变背景 */}
                <LinearGradient
                  colors={[
                    'rgba(249, 168, 137, 0.85)',  // 恢复原来的橙色强度
                    'rgba(255, 180, 162, 0.85)',  // 恢复原来的珊瑚色强度
                    'rgba(249, 168, 137, 0.85)',  // 恢复原来的橙色强度
                  ]}
                  style={styles.gradientBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* 微妙Shimmer效果 - 保留但降低强度 */}
                  {!isPerformanceDegraded && !optimizedStyles.simplifiedAnimations && (
                    <Animated.View
                      style={[styles.shimmer, shimmerAnimatedStyle]}
                      pointerEvents="none"
                    />
                  )}

                  {/* PomeloX图标 */}
                  <Animated.View
                    style={[styles.iconContainer, iconAnimatedStyle]}
                  >
                    <GrapefruitIcon
                      size={56}
                      isThinking={isThinking}
                      isPressed={isPressed}
                    />
                  </Animated.View>

                  {/* 温和内发光 */}
                  <View style={styles.innerGlow} pointerEvents="none" />
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* AI Login Prompt Modal */}
      <AILoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8.5, // Moved to left side
    width: 70, // 恢复原尺寸
    height: 68,
    zIndex: 9999,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 2,
    paddingLeft: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },
  touchable: {
    width: 66, // 恢复原尺寸
    height: 64,
  },
  button: {
    width: 66, // 恢复原尺寸
    height: 64,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // 更温和的背景
    ...Platform.select({
      ios: {
        shadowColor: '#F9A889', // 温和的橙色阴影
        shadowOffset: { width: 0, height: 2 }, // Reduced from 4 to 2
        shadowOpacity: 0.12, // Reduced from 0.18 to 0.12
        shadowRadius: 8, // Reduced from 12 to 8
      },
      android: {
        elevation: 4, // Reduced from 8 to 4
      },
    }),
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  // 温和发光层 - 降低强度
  glowLayerOuter: {
    position: 'absolute',
    top: -9,
    left: -9,
    width: 84,
    height: 82,
    borderRadius: 28,
    backgroundColor: 'rgba(249, 168, 137, 0.05)', // 大幅降低发光强度
    ...Platform.select({
      ios: {
        shadowColor: '#F9A889',
        shadowOffset: { width: 0, height: 2 }, // Reduced from 4 to 2
        shadowOpacity: 0.05, // Reduced from 0.08 to 0.05
        shadowRadius: 12, // Reduced from 20 to 12
      },
      android: {
        elevation: 2, // Reduced from 3 to 2
      },
    }),
  },
  glowLayer: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 72,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 168, 137, 0.08)', // 降低内层发光
    ...Platform.select({
      ios: {
        shadowColor: '#F9A889',
        shadowOffset: { width: 0, height: 2 }, // Reduced from 3 to 2
        shadowOpacity: 0.08, // Reduced from 0.12 to 0.08
        shadowRadius: 8, // Reduced from 12 to 8
      },
      android: {
        elevation: 3, // Reduced from 6 to 3
      },
    }),
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.18)', // 降低shimmer强度
  },
  innerGlow: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '60%',
    height: '60%',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.06)', // 降低内发光强度
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08, // Reduced from 0.15 to 0.08
        shadowRadius: 4, // Reduced from 8 to 4
      },
      android: {
        elevation: 0,
      },
    }),
  },
});

export default FloatingAIButton;