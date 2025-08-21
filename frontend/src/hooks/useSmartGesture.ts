import { useRef, useCallback } from 'react';
import { PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import * as Haptics from 'expo-haptics';

interface SmartGestureConfig {
  // 滑动检测阈值
  swipeThreshold?: number;      // 最小滑动距离 (px)
  velocityThreshold?: number;   // 最小滑动速度 (px/ms)
  timeThreshold?: number;       // 最大点击时间 (ms)
  
  // 触觉反馈
  enableHaptics?: boolean;
  
  // 调试模式
  debug?: boolean;
}

interface SmartGestureCallbacks {
  onPress?: () => void;
  onLongPress?: () => void;
  onSwipeStart?: (direction: 'horizontal' | 'vertical') => void;
  onSwipeEnd?: (direction: 'horizontal' | 'vertical', distance: number) => void;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
}

interface SmartGestureState {
  isPressed: boolean;
  isSwipeActive: boolean;
  swipeDirection: 'horizontal' | 'vertical' | null;
}

const DEFAULT_CONFIG: Required<SmartGestureConfig> = {
  swipeThreshold: 10,        // 10px 开始视为滑动
  velocityThreshold: 0.5,    // 0.5px/ms 速度阈值
  timeThreshold: 500,        // 500ms 长按阈值
  enableHaptics: true,
  debug: false,
};

/**
 * 智能手势检测Hook
 * 精确区分点击、长按和滑动手势，避免滑动时误触发点击事件
 */
export const useSmartGesture = (
  callbacks: SmartGestureCallbacks = {},
  config: SmartGestureConfig = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    onPress,
    onLongPress,
    onSwipeStart,
    onSwipeEnd,
    onGestureStart,
    onGestureEnd,
  } = callbacks;

  // 手势状态追踪
  const gestureState = useRef<SmartGestureState>({
    isPressed: false,
    isSwipeActive: false,
    swipeDirection: null,
  });

  // 触摸开始时间
  const touchStartTime = useRef<number>(0);
  const initialTouch = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  // 重置手势状态
  const resetGestureState = useCallback(() => {
    gestureState.current = {
      isPressed: false,
      isSwipeActive: false,
      swipeDirection: null,
    };
    clearTimers();
  }, [clearTimers]);

  // 计算滑动距离和方向
  const calculateSwipeMetrics = useCallback((gestureState: PanResponderGestureState) => {
    const { dx, dy } = gestureState;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const direction = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    return { distance, direction };
  }, []);

  // 判断是否为滑动手势
  const isSwipeGesture = useCallback((gestureState: PanResponderGestureState) => {
    const { distance } = calculateSwipeMetrics(gestureState);
    const velocity = Math.sqrt(gestureState.vx * gestureState.vx + gestureState.vy * gestureState.vy);
    
    return distance > finalConfig.swipeThreshold || velocity > finalConfig.velocityThreshold;
  }, [finalConfig.swipeThreshold, finalConfig.velocityThreshold]);

  // 处理点击事件
  const handlePress = useCallback(() => {
    if (finalConfig.enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (finalConfig.debug) {
      console.log('SmartGesture: Press detected');
    }
    
    onPress?.();
  }, [onPress, finalConfig.enableHaptics, finalConfig.debug]);

  // 处理长按事件
  const handleLongPress = useCallback(() => {
    if (finalConfig.enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (finalConfig.debug) {
      console.log('SmartGesture: Long press detected');
    }
    
    gestureState.current.isPressed = false; // 阻止后续的点击事件
    onLongPress?.();
  }, [onLongPress, finalConfig.enableHaptics, finalConfig.debug]);

  // PanResponder 配置
  const panResponder = useRef(
    PanResponder.create({
      // 决定是否响应手势开始 - 改为false，让容器的滚动优先
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      
      // 决定是否响应手势移动 - 仅在确实是水平滑动时才接管
      onMoveShouldSetPanResponder: (evt, panGestureState) => {
        // 如果已经开始滑动，继续响应
        if (gestureState.current.isSwipeActive) {
          return true;
        }
        
        // 只有在明确的水平滑动时才接管（ActivityCard的滑动操作）
        const { dx, dy } = panGestureState;
        const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > finalConfig.swipeThreshold;
        
        return isHorizontalSwipe;
      },
      onMoveShouldSetPanResponderCapture: () => false,

      // 手势开始
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { pageX, pageY } = evt.nativeEvent;
        touchStartTime.current = Date.now();
        initialTouch.current = { x: pageX, y: pageY };
        
        gestureState.current.isPressed = true;
        gestureState.current.isSwipeActive = false;
        gestureState.current.swipeDirection = null;

        if (finalConfig.debug) {
          console.log('SmartGesture: Gesture started');
        }

        onGestureStart?.();

        // 设置长按定时器
        longPressTimer.current = setTimeout(() => {
          if (gestureState.current.isPressed && !gestureState.current.isSwipeActive) {
            handleLongPress();
          }
        }, finalConfig.timeThreshold);
      },

      // 手势移动
      onPanResponderMove: (evt: GestureResponderEvent, panGestureState: PanResponderGestureState) => {
        // 检查是否开始滑动
        if (!gestureState.current.isSwipeActive && isSwipeGesture(panGestureState)) {
          gestureState.current.isSwipeActive = true;
          gestureState.current.isPressed = false; // 取消点击状态
          
          const { direction } = calculateSwipeMetrics(panGestureState);
          gestureState.current.swipeDirection = direction as 'horizontal' | 'vertical';
          
          clearTimers(); // 清除长按定时器
          
          if (finalConfig.debug) {
            console.log(`SmartGesture: Swipe started - ${direction}`);
          }
          
          onSwipeStart?.(direction as 'horizontal' | 'vertical');
        }
      },

      // 手势结束
      onPanResponderRelease: (evt: GestureResponderEvent, panGestureState: PanResponderGestureState) => {
        const touchDuration = Date.now() - touchStartTime.current;
        const wasSwipeActive = gestureState.current.isSwipeActive;
        const wasPressed = gestureState.current.isPressed;
        const swipeDirection = gestureState.current.swipeDirection;

        if (finalConfig.debug) {
          console.log('SmartGesture: Gesture ended', {
            wasSwipeActive,
            wasPressed,
            touchDuration,
            swipeDirection,
          });
        }

        // 处理滑动结束
        if (wasSwipeActive && swipeDirection) {
          const { distance } = calculateSwipeMetrics(panGestureState);
          onSwipeEnd?.(swipeDirection as 'horizontal' | 'vertical', distance);
        }
        
        // 处理点击事件（只有在没有滑动且在时间阈值内的情况下）
        else if (wasPressed && touchDuration < finalConfig.timeThreshold) {
          // 添加轻微延迟确保动画完成
          pressTimer.current = setTimeout(() => {
            handlePress();
          }, 50);
        }

        onGestureEnd?.();
        resetGestureState();
      },

      // 手势被中断
      onPanResponderTerminate: () => {
        if (finalConfig.debug) {
          console.log('SmartGesture: Gesture terminated');
        }
        
        onGestureEnd?.();
        resetGestureState();
      },
    })
  ).current;

  // 返回 PanResponder 处理器和当前状态
  return {
    panHandlers: panResponder.panHandlers,
    gestureState: {
      isPressed: gestureState.current.isPressed,
      isSwipeActive: gestureState.current.isSwipeActive,
      swipeDirection: gestureState.current.swipeDirection,
    },
    // 手动控制方法
    resetGesture: resetGestureState,
  };
};

export default useSmartGesture;