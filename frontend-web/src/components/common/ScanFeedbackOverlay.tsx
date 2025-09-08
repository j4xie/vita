import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { CORE_COLORS } from '../../theme/core';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface QRCodeBounds {
  origin: { x: number; y: number };
  size: { width: number; height: number };
}

interface ScanFeedbackOverlayProps {
  visible: boolean;
  qrCodeBounds?: QRCodeBounds;
  onAnimationComplete?: () => void;
}

export const ScanFeedbackOverlay: React.FC<ScanFeedbackOverlayProps> = ({
  visible,
  qrCodeBounds,
  onAnimationComplete,
}) => {
  // 动画值
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const cameraScale = useSharedValue(1);

  // Web端震动反馈
  const triggerVibration = () => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        // 短促震动 - 类似iOS的轻微震动
        navigator.vibrate(100);
      } catch (error) {
        console.log('🔇 [ScanFeedback] Web振动不受支持:', error);
      }
    }
  };

  // 计算圆圈位置
  const circlePosition = React.useMemo(() => {
    if (!qrCodeBounds) {
      // 默认居中位置
      return {
        x: screenWidth / 2 - 30, // 圆圈半径30
        y: screenHeight / 2 - 30,
      };
    }

    // 计算二维码中心点
    const centerX = qrCodeBounds.origin.x + qrCodeBounds.size.width / 2;
    const centerY = qrCodeBounds.origin.y + qrCodeBounds.size.height / 2;

    return {
      x: centerX - 30, // 圆圈半径30
      y: centerY - 30,
    };
  }, [qrCodeBounds]);

  useEffect(() => {
    if (visible) {
      // 开始扫码识别动画
      console.log('🎯 [ScanFeedback] 开始扫码反馈动画', { circlePosition, qrCodeBounds });
      
      // Web端震动反馈
      triggerVibration();

      // 1. 摄像头轻微放大
      cameraScale.value = withTiming(1.1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });

      // 2. 品牌色圆圈出现
      scale.value = withSequence(
        withTiming(0, { duration: 0 }), // 确保从0开始
        withDelay(200, withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
        }))
      );

      opacity.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(200, withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.quad),
        }))
      );

      // 3. 动画完成回调
      const timer = setTimeout(() => {
        console.log('✅ [ScanFeedback] 扫码反馈动画完成');
        onAnimationComplete?.();
      }, 800); // 总动画时长

      return () => clearTimeout(timer);
    } else {
      // 重置动画值
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      cameraScale.value = withTiming(1, { duration: 300 });
    }
  }, [visible, scale, opacity, cameraScale, onAnimationComplete, circlePosition, qrCodeBounds]);

  // 摄像头缩放动画样式
  const cameraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraScale.value }],
  }), []);

  // 圆圈动画样式
  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }), []);

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* 摄像头缩放覆盖层 */}
      <Animated.View style={[StyleSheet.absoluteFillObject, cameraAnimatedStyle]} 
                     pointerEvents="none">
        {/* 这个视图会被父组件的摄像头填充，我们只提供缩放动画 */}
      </Animated.View>

      {/* 扫码反馈圆圈 */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View
          style={[
            styles.circle,
            {
              left: circlePosition.x,
              top: circlePosition.y,
            },
            circleAnimatedStyle,
          ]}
        >
          {/* 外圈 - 品牌色边框 */}
          <View style={styles.outerCircle} />
          
          {/* 内圈 - 半透明填充 */}
          <View style={styles.innerCircle} />
          
          {/* 中心点 */}
          <View style={styles.centerDot} />
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: 60,
    height: 60,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  outerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: CORE_COLORS.primary, // PomeloX 橙色
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  
  innerCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: `${CORE_COLORS.primary}20`, // 20% 透明度
    position: 'absolute',
  },
  
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CORE_COLORS.primary,
    position: 'absolute',
  },
});

export default ScanFeedbackOverlay;