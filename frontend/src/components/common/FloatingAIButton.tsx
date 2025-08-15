import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { BlurView } from 'expo-blur';
import { AIAssistantModal } from '../modals/AIAssistantModal';
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

interface FloatingAIButtonProps {
  isThinking?: boolean;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ 
  isThinking = false 
}) => {
  const insets = useSafeAreaInsets();
  const [showAIModal, setShowAIModal] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const { metrics, getOptimizedStyles } = usePerformanceDegradation();
  const isPerformanceDegraded = metrics.shouldDegrade;
  const optimizedStyles = getOptimizedStyles();
  
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

  // Start animations when component mounts
  useEffect(() => {
    if (optimizedStyles.simplifiedAnimations) {
      // Minimal animations for performance or accessibility
      breathingScale.value = 1;
      glowOpacity.value = 1;
      iconRotation.value = 0;
      shimmerTranslate.value = -100;
      borderColorProgress.value = 0;
      particleProgress.value = 0;
      return;
    }

    // Breathing animation - smooth scale
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(isPerformanceDegraded ? 1.04 : 1.08, { 
          duration: isPerformanceDegraded ? 3000 : 2000, 
          easing: Easing.inOut(Easing.ease) 
        }),
        withTiming(1, { 
          duration: isPerformanceDegraded ? 3000 : 2000, 
          easing: Easing.inOut(Easing.ease) 
        })
      ),
      -1,
      false
    );

    // Glow pulsing effect
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(isPerformanceDegraded ? 0.9 : 1, { 
          duration: isPerformanceDegraded ? 2000 : 1500, 
          easing: Easing.inOut(Easing.ease) 
        }),
        withTiming(0.8, { 
          duration: isPerformanceDegraded ? 2000 : 1500, 
          easing: Easing.inOut(Easing.ease) 
        })
      ),
      -1,
      false
    );

    // Icon rotation (disabled on performance-degraded devices)
    if (!isPerformanceDegraded) {
      iconRotation.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }

    // Shimmer effect (disabled on performance-degraded devices)
    if (!isPerformanceDegraded) {
      shimmerTranslate.value = withRepeat(
        withSequence(
          withTiming(100, { duration: 2500, easing: Easing.linear }),
          withTiming(-100, { duration: 0 })
        ),
        -1,
        false
      );
    }

    // Border color animation (simplified on performance-degraded devices)
    borderColorProgress.value = withRepeat(
      withSequence(
        withTiming(1, { 
          duration: isPerformanceDegraded ? 6000 : 4000, 
          easing: Easing.inOut(Easing.ease) 
        }),
        withTiming(0, { 
          duration: isPerformanceDegraded ? 6000 : 4000, 
          easing: Easing.inOut(Easing.ease) 
        })
      ),
      -1,
      false
    );

    // Particle animation (disabled on performance-degraded devices)
    if (!isPerformanceDegraded) {
      particleProgress.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [optimizedStyles.simplifiedAnimations, isPerformanceDegraded]);

  // Enhanced animations for thinking state
  useEffect(() => {
    if (isThinking) {
      // Faster breathing when thinking
      breathingScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      // Faster glow pulsing
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Return to normal breathing
      breathingScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      // Return to normal glow
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isThinking]);

  // Monitor modal state changes
  useEffect(() => {
    const isModalCurrentlyOpen = showAIModal;
    modalStateRef.current = isModalCurrentlyOpen;
    setIsAnyModalOpen(isModalCurrentlyOpen);
    
    if (isModalCurrentlyOpen) {
      // Modal opened: pause auto-hide timer
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
        autoHideTimer.current = null;
      }
    } else {
      // Modal closed: restart auto-hide timer if button is visible
      if (isVisible.value) {
        resetAutoHideTimer();
      }
    }
  }, [showAIModal]);

  // Global interaction event listeners with initialization delay
  useEffect(() => {
    let globalTouchListener: any;
    let globalScrollListener: any;

    const handleGlobalInteraction = () => {
      // Ignore all interactions if any modal is open
      if (modalStateRef.current || isAnyModalOpen) {
        return;
      }
      
      if (!hasInteracted.value) {
        // First interaction: mark as interacted and start 12-second timer (don't hide immediately)
        hasInteracted.value = true;
        resetAutoHideTimer();
        return;
      }
      
      // Improved interaction logic: only hide if button has been visible for at least 3 seconds
      // and no modal is open
      if (isVisible.value && !modalStateRef.current && !isAnyModalOpen) {
        const timeSinceLastReset = Date.now() - (autoHideTimer.current ? Date.now() - 12000 : 0);
        if (timeSinceLastReset > 3000) {
          hideButton();
        }
      }
      resetAutoHideTimer();
    };

    // Initialize with 1 second delay to avoid triggering on page load
    initializationTimer.current = setTimeout(() => {
      // Start initial 12-second auto-hide timer
      resetAutoHideTimer();
      
      // Only set up listeners if not in performance degraded mode
      if (!optimizedStyles.simplifiedAnimations) {
        globalTouchListener = DeviceEventEmitter.addListener('globalTouch', handleGlobalInteraction);
        globalScrollListener = DeviceEventEmitter.addListener('globalScroll', handleGlobalInteraction);
      }
    }, 1000);

    return () => {
      // Cleanup listeners
      if (globalTouchListener) {
        globalTouchListener.remove();
      }
      if (globalScrollListener) {
        globalScrollListener.remove();
      }
      
      // Clear timers
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
      if (initializationTimer.current) {
        clearTimeout(initializationTimer.current);
      }
    };
  }, [optimizedStyles.simplifiedAnimations]);

  // Define handlePress first
  const handlePress = () => {
    // Always show button when clicked
    if (!isVisible.value) {
      showButton();
    }
    
    // Mark as interacted to prevent immediate hiding
    hasInteracted.value = true;
    
    // Clear any existing timer since we're opening a modal
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    
    // Enhanced haptic feedback for better user experience
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Open modal (timer will be paused by modal state monitoring)
    setShowAIModal(true);
  };

  // Auto-hide animation functions
  const hideButton = () => {
    // Calculate hide distance to show a visible portion for easy re-access
    const buttonSize = 56; // 56px 直径
    const hideDistance = buttonSize * 0.65; // Hide 65% (36px), show 35% (20px) for better visibility
    
    if (isPerformanceDegraded) {
      // Simplified animation for low-end devices
      hideTranslateX.value = withSpring(hideDistance, { damping: 15, stiffness: 120 });
      hideOpacity.value = withSpring(0.8, { damping: 15, stiffness: 120 });
    } else {
      // Full animation with spring physics
      hideTranslateX.value = withSpring(hideDistance, { damping: 18, stiffness: 150 });
      hideOpacity.value = withSpring(0.8, { damping: 18, stiffness: 150 });
    }
    isVisible.value = false;
  };

  const showButton = () => {
    if (isPerformanceDegraded) {
      // Simplified animation
      hideTranslateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      hideOpacity.value = withSpring(1, { damping: 15, stiffness: 120 });
    } else {
      // Full animation with bounce
      hideTranslateX.value = withSpring(0, { damping: 18, stiffness: 150 });
      hideOpacity.value = withSpring(1, { damping: 18, stiffness: 150 });
    }
    isVisible.value = true;
  };

  // Enhanced auto-hide timer management with modal state awareness
  const resetAutoHideTimer = () => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    
    // Only start timer if no modal is currently open
    if (!modalStateRef.current && !isAnyModalOpen) {
      autoHideTimer.current = setTimeout(() => {
        // Double-check modal state before hiding
        if (isVisible.value && !modalStateRef.current && !isAnyModalOpen) {
          hideButton();
        }
      }, 12000);
    }
  };

  // Enhanced press handlers with multi-layer feedback
  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync(); // Immediate tactile feedback
    }
    
    // Always show visual press feedback, regardless of visibility state
    if (isPerformanceDegraded) {
      // Simplified feedback for low-end devices
      pressScale.value = withSpring(0.88, { damping: 12, stiffness: 120 });
    } else {
      // Full multi-layer feedback
      pressScale.value = withSpring(0.88, { damping: 12, stiffness: 120 });
      pressGlowScale.value = withSpring(1.2, { damping: 8, stiffness: 100 });
      pressBorderOpacity.value = withSpring(0.8, { damping: 10, stiffness: 150 });
      pressIconBounce.value = withSpring(-3, { damping: 15, stiffness: 200 });
      pressBlurIntensity.value = withSpring(1.2, { damping: 12, stiffness: 100 });
    }
  };

  const handlePressOut = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Strong impact feedback
    }
    
    if (isPerformanceDegraded) {
      // Simplified bounce back
      pressScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    } else {
      // Multi-layer bounce back with success flash
      pressScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      pressGlowScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }), // Success flash
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      pressBorderOpacity.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 200 }), // Bright flash
        withSpring(0.3, { damping: 12, stiffness: 100 })
      );
      pressIconBounce.value = withSequence(
        withSpring(3, { damping: 8, stiffness: 200 }), // Bounce up
        withSpring(0, { damping: 15, stiffness: 150 }) // Settle down
      );
      pressBlurIntensity.value = withSpring(1, { damping: 12, stiffness: 100 });
    }
    
    handlePress();
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
    borderColor: 'rgba(255, 107, 53, 0.3)', // VitaGlobal 橙色边框
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${iconRotation.value}deg` },
      { scale: 1.1 },
      { translateY: pressIconBounce.value },
    ],
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
    ],
  }));

  return (
    <>
      <Animated.View style={[styles.container, { bottom: insets.bottom + 80 }, containerAnimatedStyle]}>
        {/* Glow layer - animated shadow */}
        <Animated.View
          style={[styles.glowLayer, glowAnimatedStyle]}
          pointerEvents="none"
        />
        
        {/* Particle effects - only on high-performance devices */}
        {!isPerformanceDegraded && !optimizedStyles.simplifiedAnimations && [0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              particleAnimatedStyle(index),
            ]}
            pointerEvents="none"
          />
        ))}

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
            {/* Glass border effect */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.2)',
                'rgba(255, 255, 255, 0.05)',
                'rgba(255, 255, 255, 0.1)',
              ]}
              style={styles.glassBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            
            {/* Main button content with blur */}
            <Animated.View style={styles.blurContainer}>
              <BlurView 
                intensity={Platform.OS === 'android' ? (isPerformanceDegraded ? 30 : 60) : (isPerformanceDegraded ? 60 : 90)} 
                style={styles.blurContainer} 
                tint="light"
              >
              {/* VitaGlobal Background gradient */}
              <LinearGradient
                colors={[
                  'rgba(255, 107, 53, 0.85)',  // VitaGlobal 活力橙
                  'rgba(255, 71, 87, 0.85)',    // VitaGlobal 珊瑚红
                  'rgba(255, 107, 53, 0.85)',  // VitaGlobal 活力橙
                ]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Shimmer effect - only on high-performance devices */}
                {!isPerformanceDegraded && !optimizedStyles.simplifiedAnimations && (
                  <Animated.View
                    style={[styles.shimmer, shimmerAnimatedStyle]}
                    pointerEvents="none"
                  />
                )}
                
                {/* Icon container with rotation */}
                <Animated.View
                  style={[styles.iconContainer, iconAnimatedStyle]}
                >
                  <Ionicons 
                    name={isThinking ? "sync" : "sparkles"} 
                    size={30} 
                    color="#FFFFFF" 
                  />
                </Animated.View>
                
                {/* Inner glow */}
                <View style={styles.innerGlow} pointerEvents="none" />
              </LinearGradient>
              </BlurView>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
      
      {/* AI Assistant Modal */}
      <AIAssistantModal 
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16, // 16px 边距
    width: 56 + 20, // 56px 直径 + 发光空间
    height: 56 + 20,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: 56, // 56px 直径
    height: 56,
  },
  button: {
    width: 56, // 56px 直径
    height: 56,
    borderRadius: 28, // 56/2
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35', // VitaGlobal 橙色阴影
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28, // 56/2
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 28, // 56/2
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
  glowLayer: {
    position: 'absolute',
    width: 66, // 56 + 10
    height: 66, // 56 + 10
    borderRadius: 33, // (56 + 10) / 2
    backgroundColor: 'rgba(255, 107, 53, 0.4)', // VitaGlobal 橙色发光
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35', // VitaGlobal 橙色阴影
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 0, // Glow effect handled via backgroundColor on Android
      },
    }),
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    // transform: [{ skewX: '-20deg' }], // Temporarily disabled - potential syntax issue
  },
  innerGlow: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '60%',
    height: '60%',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default FloatingAIButton;