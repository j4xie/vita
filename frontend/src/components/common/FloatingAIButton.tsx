import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
  TextInput,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { shouldShowAIButton } from '../../config/aiButtonConfig';
// import { Ionicons } from '@expo/vector-icons'; // 替换为可爱PomeloX图标
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { BlurView } from 'expo-blur';
import { AILoginPromptModal } from '../modals/AILoginPromptModal';
import { RESTRAINED_COLORS } from '../../theme/core';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
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
  const { t } = useTranslation();
  const { user } = useUser();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<TextInput>(null);
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

  // 展开输入框变形动画
  const inputOpacity = useSharedValue(0);
  const containerScale = useSharedValue(1);
  const morphWidth = useSharedValue(66); // 宽度变形：66 → 屏幕宽度-32
  const morphBorderRadius = useSharedValue(26); // 圆角变形：26 → 32
  const iconOpacity = useSharedValue(1); // 图标淡出
  
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

    // Breathing animation - smooth seamless loop
    breathingScale.value = withRepeat(
      withTiming(isPerformanceDegraded ? 1.04 : 1.08, { 
        duration: isPerformanceDegraded ? 3000 : 2000, 
        easing: Easing.bezier(0.4, 0, 0.6, 1) // 平滑缓动曲线
      }),
      -1,
      true // reverse = true 确保完全无缝循环
    );

    // Glow pulsing effect - seamless loop
    glowOpacity.value = withRepeat(
      withTiming(isPerformanceDegraded ? 0.9 : 1, { 
        duration: isPerformanceDegraded ? 2000 : 1500, 
        easing: Easing.bezier(0.4, 0, 0.6, 1) // 平滑缓动曲线
      }),
      -1,
      true // reverse = true 确保完全无缝循环
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
      // Faster breathing when thinking - seamless loop
      breathingScale.value = withRepeat(
        withTiming(1.12, { 
          duration: 800, 
          easing: Easing.bezier(0.4, 0, 0.6, 1) // 平滑缓动曲线
        }),
        -1,
        true // reverse = true 确保完全无缝循环
      );
      
      // Faster glow pulsing - seamless loop
      glowOpacity.value = withRepeat(
        withTiming(1.2, { 
          duration: 600, 
          easing: Easing.bezier(0.4, 0, 0.6, 1) // 平滑缓动曲线
        }),
        -1,
        true // reverse = true 确保完全无缝循环
      );
    } else {
      // Return to normal breathing - seamless loop
      breathingScale.value = withRepeat(
        withTiming(1.08, { 
          duration: 2000, 
          easing: Easing.bezier(0.4, 0, 0.6, 1) // 平滑缓动曲线
        }),
        -1,
        true // reverse = true 确保完全无缝循环
      );
      
      // Return to normal glow - seamless loop
      glowOpacity.value = withRepeat(
        withTiming(1, { 
          duration: 1500, 
          easing: Easing.bezier(0.4, 0, 0.6, 1) // 平滑缓动曲线
        }),
        -1,
        true // reverse = true 确保完全无缝循环
      );
    }
  }, [isThinking]);


  // Global interaction event listeners with initialization delay
  useEffect(() => {
    let globalTouchListener: any;
    let globalScrollListener: any;

    const handleGlobalInteraction = () => {
      // 忽略所有交互的情况：展开输入框时
      if (isExpanded) {
        return;
      }

      if (!hasInteracted.value) {
        // First interaction: mark as interacted and start 12-second timer (don't hide immediately)
        hasInteracted.value = true;
        resetAutoHideTimer();
        return;
      }

      // Improved interaction logic: only hide if button has been visible for at least 3 seconds
      // and no expansion is active
      if (isVisible.value && !isExpanded) {
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
  }, [optimizedStyles.simplifiedAnimations, isExpanded]);

  // 展开输入框（带丝滑变形动画）
  const expandInput = () => {
    // 检查用户登录状态
    if (!user) {
      // 访客模式 - 显示登录提示
      setShowLoginPrompt(true);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    setIsExpanded(true);
    hasInteracted.value = true;

    // 清除自动隐藏计时器
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }

    // 确保按钮完全显示（重置hideTranslateX）
    hideTranslateX.value = withSpring(0, { damping: 18, stiffness: 150 });
    hideOpacity.value = withSpring(1, { damping: 18, stiffness: 150 });
    isVisible.value = true;

    // 🎨 丝滑变形动画
    const screenWidth = Dimensions.get('window').width;

    // 图标淡出
    iconOpacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });

    // 宽度展开（圆形 → 长条）
    morphWidth.value = withSpring(screenWidth - 32, {
      damping: 20,
      stiffness: 140,
      mass: 0.8, // 更流畅的质感
    });

    // 圆角变化（26 → 32）
    morphBorderRadius.value = withSpring(32, {
      damping: 18,
      stiffness: 120
    });

    // 输入框内容淡入（延迟200ms，等待变形开始）
    setTimeout(() => {
      inputOpacity.value = withSpring(1, { damping: 15, stiffness: 120 });
    }, 200);

    // 延迟聚焦输入框，等待动画完成
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // 收起输入框（反向变形动画）
  const collapseInput = () => {
    Keyboard.dismiss();
    setInputText('');

    // 🎨 反向变形动画
    // 输入框内容淡出
    inputOpacity.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });

    // 延迟变形，等待内容淡出
    setTimeout(() => {
      // 宽度收缩（长条 → 圆形）
      morphWidth.value = withSpring(66, {
        damping: 20,
        stiffness: 140,
        mass: 0.8,
      });

      // 圆角恢复
      morphBorderRadius.value = withSpring(26, {
        damping: 18,
        stiffness: 120
      });

      // 图标淡入
      iconOpacity.value = withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) });

      // 变形完成后更新状态
      setTimeout(() => {
        setIsExpanded(false);
      }, 300);
    }, 150);

    // 收起后重新启动自动隐藏计时器
    setTimeout(() => {
      resetAutoHideTimer();
    }, 650); // 等待完整动画完成
  };

  // 处理发送消息
  const handleSendMessage = () => {
    const message = inputText.trim();
    if (!message) return;

    // 收起输入框
    collapseInput();

    // 延迟导航，等待收起动画完成
    setTimeout(() => {
      navigation.navigate('AIChat', { initialMessage: message });
    }, 300);

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  // Define handlePress first
  const handlePress = () => {
    // 如果按钮是隐藏状态，先显示再展开（一气呵成）
    if (!isVisible.value) {
      showButton();
      // 等待显示动画完成后，自动展开输入框
      setTimeout(() => {
        expandInput();
      }, 400); // 400ms后展开，衔接显示动画
      return;
    }

    // 按钮已完全显示时，直接展开输入框
    expandInput();
  };

  // Auto-hide animation functions
  const hideButton = () => {
    // Calculate hide distance to show a visible portion for easy re-access
    const buttonSize = 66; // 66px 宽度 (自适应尺寸)
    const hideDistance = -buttonSize * 0.65; // 向左隐藏 65% (使用负值)

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

    // 禁用条件：展开输入框时
    if (isExpanded) {
      return; // 不启动自动隐藏
    }

    // Only start timer if no expansion is active
    autoHideTimer.current = setTimeout(() => {
      // Double-check state before hiding
      if (isVisible.value && !isExpanded) {
        hideButton();
      }
    }, 12000);
  };

  // Enhanced press handlers with multi-layer feedback
  const handlePressIn = () => {
    setIsPressed(true);
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
    setIsPressed(false);
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

  // 展开时使用的容器样式（不应用hideTranslateX）
  const expandedContainerAnimatedStyle = useAnimatedStyle(() => ({
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
    opacity: iconOpacity.value, // 添加淡出效果
    transform: [
      { rotate: `${iconRotation.value}deg` },
      { scale: 1.1 },
      { translateY: pressIconBounce.value },
    ] as any,
  }));

  // 变形动画样式
  const morphAnimatedStyle = useAnimatedStyle(() => ({
    width: morphWidth.value,
    borderRadius: morphBorderRadius.value,
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

  // 输入框动画样式
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  // 获取当前路由名，判断是否显示AI按钮（必须在所有其他hooks之后，return之前）
  const currentRouteName = useNavigationState(state => {
    const route = state?.routes?.[state.index];
    return route?.state?.routes?.[route.state.index]?.name || route?.name;
  });

  // 处理登录/注册导航
  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleRegister = () => {
    navigation.navigate('RegisterChoice' as never);
  };

  // 判断是否显示（在所有hooks之后）
  // 初始加载时如果路由名未定义，默认显示（假设在主页）
  const shouldShow = currentRouteName ? shouldShowAIButton(currentRouteName) : true;

  // 如果不应该显示，直接返回null
  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <Animated.View style={[
        styles.container,
        { bottom: insets.bottom + 70 },
        isExpanded ? expandedContainerAnimatedStyle : containerAnimatedStyle,
        isExpanded && styles.expandedContainerPosition,
      ]}>
        {/* 温和发光效果 - 克制版本 */}
        {isPerformanceDegraded === false && isExpanded === false && (
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

        {/* 统一变形容器（按钮 ↔ 输入框）*/}
        <TouchableOpacity
          onPressIn={isExpanded === false ? handlePressIn : undefined}
          onPressOut={isExpanded === false ? handlePressOut : undefined}
          onPress={isExpanded === false ? handlePress : undefined}
          activeOpacity={1}
          style={styles.touchable}
          disabled={isExpanded === true}
        >
          <Animated.View
            style={[
              styles.button,
              isExpanded === false && buttonAnimatedStyle,
              morphAnimatedStyle, // 应用变形动画
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
                  'rgba(249, 168, 137, 0.85)',
                  'rgba(255, 180, 162, 0.85)',
                  'rgba(249, 168, 137, 0.85)',
                ]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* 按钮内容（未展开时显示）*/}
                {isExpanded === false && (
                  <>
                    {/* 微妙Shimmer效果 */}
                    {isPerformanceDegraded === false && optimizedStyles.simplifiedAnimations === false && (
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
                  </>
                )}

                {/* 输入框内容（展开时显示）*/}
                {isExpanded === true && (
                  <Animated.View style={[styles.inputContentContainer, inputAnimatedStyle]}>
                    <TextInput
                      ref={inputRef}
                      style={styles.input}
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder={t('ai.inputPlaceholder')}
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      onSubmitEditing={handleSendMessage}
                      returnKeyType="send"
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleSendMessage}
                      disabled={!inputText.trim()}
                    >
                      <Ionicons
                        name="send"
                        size={20}
                        color={inputText.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.closeInputButton}
                      onPress={collapseInput}
                    >
                      <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.8)" />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </LinearGradient>
              </BlurView>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* 访客登录提示模态框 */}
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
    left: 8.5, // 默认移动到左侧（未展开状态）
    height: 64,
    zIndex: 9999,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
    overflow: 'visible', // 允许内容溢出
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
    alignItems: 'center', // 图标居中对齐
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
  // 展开输入框样式
  expandedContainer: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#F9A889',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // 展开时的定位调整（响应式）
  expandedContainerPosition: {
    left: 16, // 重新定位到左侧16px
    right: 16, // 右侧也16px
    width: undefined, // 移除固定宽度，使用left+right自动计算
  },
  expandedBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  expandedGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeInputButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  // 输入框内容容器
  inputContentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
});

export default FloatingAIButton;