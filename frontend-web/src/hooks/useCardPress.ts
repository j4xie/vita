import { useRef, useCallback } from 'react';
import { PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { WebHaptics as Haptics } from '../utils/WebHaptics';

interface CardPressConfig {
  // 点击检测阈值
  maxMoveThreshold?: number;    // 最大允许移动距离 (px)
  maxTimeThreshold?: number;    // 最大点击时间 (ms)
  enableHaptics?: boolean;
  debug?: boolean;
}

interface CardPressCallbacks {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

const DEFAULT_CONFIG: Required<CardPressConfig> = {
  maxMoveThreshold: 10,     // 10px 内的移动仍视为点击
  maxTimeThreshold: 300,    // 300ms 内视为点击
  enableHaptics: true,
  debug: false,
};

/**
 * 卡片点击检测Hook - 专门用于简单的点击检测，不干扰滚动
 * 比TouchableOpacity更智能，但不会阻止容器的滚动行为
 */
export const useCardPress = (
  callbacks: CardPressCallbacks = {},
  config: CardPressConfig = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { onPress, onPressIn, onPressOut } = callbacks;

  // 触摸状态追踪
  const touchState = useRef({
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    isPressed: false,
    hasMoved: false,
  });

  // 计算移动距离
  const getDistance = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }, []);

  // 手势处理函数
  const handleTouchStart = useCallback((evt: any) => {
    const { pageX, pageY } = evt.nativeEvent;
    
    touchState.current = {
      startTime: Date.now(),
      startPosition: { x: pageX, y: pageY },
      isPressed: true,
      hasMoved: false,
    };

    if (finalConfig.debug) {
      console.log('CardPress: Touch started');
    }

    onPressIn?.();
  }, [onPressIn, finalConfig.debug]);

  const handleTouchMove = useCallback((evt: any) => {
    if (!touchState.current.isPressed) return;

    const { pageX, pageY } = evt.nativeEvent;
    const distance = getDistance(
      touchState.current.startPosition.x,
      touchState.current.startPosition.y,
      pageX,
      pageY
    );

    if (distance > finalConfig.maxMoveThreshold) {
      touchState.current.hasMoved = true;
      touchState.current.isPressed = false;
      
      if (finalConfig.debug) {
        console.log('CardPress: Movement detected, canceling press');
      }
      
      onPressOut?.();
    }
  }, [onPressOut, getDistance, finalConfig.maxMoveThreshold, finalConfig.debug]);

  const handleTouchEnd = useCallback(() => {
    const touchDuration = Date.now() - touchState.current.startTime;
    const shouldTriggerPress = 
      touchState.current.isPressed && 
      !touchState.current.hasMoved && 
      touchDuration <= finalConfig.maxTimeThreshold;

    if (finalConfig.debug) {
      console.log('CardPress: Touch ended', {
        shouldTriggerPress,
        duration: touchDuration,
        hasMoved: touchState.current.hasMoved,
      });
    }

    if (shouldTriggerPress) {
      if (finalConfig.enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // 延迟触发点击，确保动画完成
      setTimeout(() => {
        onPress?.();
      }, 50);
    }

    onPressOut?.();
    
    // 重置状态
    touchState.current = {
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      isPressed: false,
      hasMoved: false,
    };
  }, [onPress, onPressOut, finalConfig.maxTimeThreshold, finalConfig.enableHaptics, finalConfig.debug]);

  // 返回简单的触摸事件处理器而不是PanResponder
  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: () => {
        touchState.current.isPressed = false;
        onPressOut?.();
      }
    },
    isPressed: touchState.current.isPressed,
  };

};

export default useCardPress;