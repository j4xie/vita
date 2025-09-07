import { Animated, Easing } from 'react-native';

// 动画配置常量
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export const EASING = {
  easeInOut: Easing.inOut(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  bounce: Easing.bounce,
  spring: Easing.elastic(1.3),
};

// 通用动画函数
export const createAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATION.normal,
  easing: ((value: number) => number) = EASING.easeInOut
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

// 弹簧动画
export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  tension: number = 100,
  friction: number = 8
) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  });
};

// 序列动画
export const createSequenceAnimation = (animations: Animated.CompositeAnimation[]) => {
  return Animated.sequence(animations);
};

// 并行动画
export const createParallelAnimation = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};

// 淡入动画
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal
) => {
  return createAnimation(animatedValue, 1, duration);
};

// 淡出动画
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal
) => {
  return createAnimation(animatedValue, 0, duration);
};

// 滑入动画（从下方滑入）
export const slideInFromBottom = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal
) => {
  return createAnimation(animatedValue, 0, duration);
};

// 滑出动画（向下滑出）
export const slideOutToBottom = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal
) => {
  return createAnimation(animatedValue, 100, duration);
};

// 缩放动画
export const scaleIn = (
  animatedValue: Animated.Value,
  toValue: number = 1,
  duration: number = ANIMATION_DURATION.normal
) => {
  return createAnimation(animatedValue, toValue, duration);
};

export const scaleOut = (
  animatedValue: Animated.Value,
  toValue: number = 0.8,
  duration: number = ANIMATION_DURATION.fast
) => {
  return createAnimation(animatedValue, toValue, duration, EASING.easeOut);
};

// 弹跳动画
export const bounce = (animatedValue: Animated.Value) => {
  return createSequenceAnimation([
    createAnimation(animatedValue, 1.1, ANIMATION_DURATION.fast),
    createAnimation(animatedValue, 1, ANIMATION_DURATION.fast),
  ]);
};

// 震动动画
export const shake = (animatedValue: Animated.Value) => {
  return createSequenceAnimation([
    createAnimation(animatedValue, 10, 50),
    createAnimation(animatedValue, -10, 50),
    createAnimation(animatedValue, 10, 50),
    createAnimation(animatedValue, -10, 50),
    createAnimation(animatedValue, 0, 50),
  ]);
};

// 呼吸动画（循环缩放）
export const breathe = (
  animatedValue: Animated.Value,
  minScale: number = 0.95,
  maxScale: number = 1.05,
  duration: number = 2000
) => {
  return Animated.loop(
    createSequenceAnimation([
      createAnimation(animatedValue, maxScale, duration / 2),
      createAnimation(animatedValue, minScale, duration / 2),
    ])
  );
};

// 心跳动画
export const heartbeat = (animatedValue: Animated.Value) => {
  return Animated.loop(
    createSequenceAnimation([
      createAnimation(animatedValue, 1.2, 100),
      createAnimation(animatedValue, 1, 100),
      createAnimation(animatedValue, 1.2, 100),
      createAnimation(animatedValue, 1, 100),
      Animated.delay(1000),
    ])
  );
};

// 页面过渡动画配置
export const pageTransitions = {
  // 从右侧滑入
  slideFromRight: {
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      };
    },
  },
  
  // 从底部滑入
  slideFromBottom: {
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
              }),
            },
          ],
        },
      };
    },
  },
  
  // 淡入淡出
  fade: {
    cardStyleInterpolator: ({ current }: any) => {
      return {
        cardStyle: {
          opacity: current.progress,
        },
      };
    },
  },
  
  // 缩放进入
  scale: {
    cardStyleInterpolator: ({ current }: any) => {
      return {
        cardStyle: {
          opacity: current.progress,
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      };
    },
  },
};