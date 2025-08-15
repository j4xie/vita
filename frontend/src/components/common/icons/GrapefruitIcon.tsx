import React from 'react';
import { View, Text } from 'react-native';
import Svg, { 
  Circle, 
  Ellipse, 
  Path, 
  G, 
  Defs, 
  RadialGradient, 
  Stop,
  LinearGradient as SvgLinearGradient 
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GrapefruitIconProps {
  size?: number;
  isThinking?: boolean;
  isPressed?: boolean;
}

export const GrapefruitIcon: React.FC<GrapefruitIconProps> = ({ 
  size = 30, 
  isThinking = false,
  isPressed = false 
}) => {
  const breathingScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);
  const rotationValue = useSharedValue(0);
  
  // 流畅呼吸动画
  React.useEffect(() => {
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { 
          duration: 2000, 
          easing: Easing.bezier(0.4, 0, 0.2, 1) // Material Design 标准缓动
        }),
        withTiming(0.94, { 
          duration: 2000, 
          easing: Easing.bezier(0.4, 0, 0.2, 1) // 确保往返一致
        })
      ),
      -1,
      true
    );
  }, []);

  // 柔和果肉闪烁
  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { 
          duration: 2500, 
          easing: Easing.bezier(0.25, 0.1, 0.25, 1) // 更柔和的缓动
        }),
        withTiming(0.7, { 
          duration: 2500, 
          easing: Easing.bezier(0.25, 0.1, 0.25, 1) // 一致的缓动曲线
        })
      ),
      -1,
      true
    );
  }, []);

  // 流畅思考旋转
  React.useEffect(() => {
    if (isThinking) {
      rotationValue.value = withRepeat(
        withTiming(360, { 
          duration: 4000, // 延长到4秒，更温和
          easing: Easing.bezier(0.4, 0, 0.6, 1) // 更流畅的缓动
        }),
        -1,
        false
      );
    } else {
      rotationValue.value = withTiming(0, { 
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) // 柔和停止
      });
    }
  }, [isThinking]);

  // 流畅按下摇摆
  React.useEffect(() => {
    if (isPressed) {
      rotationValue.value = withSequence(
        withTiming(-4, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(4, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 120, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [isPressed]);

  const animatedSvgProps = useAnimatedProps(() => ({
    transform: [
      { scale: breathingScale.value },
      { rotate: `${rotationValue.value}deg` }
    ],
  }));

  const animatedPulseProps = useAnimatedProps(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <AnimatedSvg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        animatedProps={animatedSvgProps}
      >
        <Defs>
          {/* 西柚外皮渐变 - VitaGlobal 橙红风格 */}
          <RadialGradient id="grapefruitGradient" cx="0.3" cy="0.3" r="0.8">
            <Stop offset="0%" stopColor="#FFD1C7" stopOpacity="1" />
            <Stop offset="70%" stopColor="#FFB399" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8A65" stopOpacity="1" />
          </RadialGradient>
          
          {/* 果肉渐变 - 温暖橙色调 */}
          <RadialGradient id="pulpGradient" cx="0.5" cy="0.5" r="0.6">
            <Stop offset="0%" stopColor="#FFF3E0" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#FFCC80" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFB74D" stopOpacity="0.7" />
          </RadialGradient>

          {/* 高光渐变 */}
          <SvgLinearGradient id="highlightGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
          </SvgLinearGradient>
        </Defs>

        {/* 主要西柚形状 */}
        <Ellipse
          cx="22"
          cy="22"
          rx="19"
          ry="18"
          fill="url(#grapefruitGradient)"
          stroke="#FF6B35"
          strokeWidth="0.9"
        />

        {/* 内部果肉分瓣 */}
        <G>
          {/* 中央分瓣 */}
          <AnimatedEllipse
            cx="22"
            cy="22"
            rx="15"
            ry="14"
            fill="url(#pulpGradient)"
            animatedProps={animatedPulseProps}
          />
          
          {/* 分割线 */}
          <Path
            d="M 22 4 L 22 40"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.2"
          />
          <Path
            d="M 4 22 L 40 22"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.2"
          />
          <Path
            d="M 10 10 L 34 34"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.0"
          />
          <Path
            d="M 34 10 L 10 34"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.0"
          />
        </G>

        {/* 可爱的小纹理点 */}
        <G opacity="0.4">
          <Circle cx="15" cy="15" r="0.9" fill="#FF6B35" />
          <Circle cx="29" cy="17" r="0.7" fill="#FF6B35" />
          <Circle cx="17" cy="29" r="0.8" fill="#FF6B35" />
          <Circle cx="27" cy="14" r="0.7" fill="#FF6B35" />
          <Circle cx="13" cy="27" r="0.6" fill="#FF6B35" />
          <Circle cx="31" cy="24" r="0.5" fill="#FF6B35" />
          <Circle cx="19" cy="12" r="0.5" fill="#FF6B35" />
        </G>

        {/* 顶部高光 */}
        <Ellipse
          cx="18"
          cy="16"
          rx="6.5"
          ry="4"
          fill="url(#highlightGradient)"
          opacity="0.6"
        />

        {/* 思考时的果汁滴落效果 */}
        {isThinking && (
          <AnimatedCircle
            cx="22"
            cy="39"
            r="1.8"
            fill="#FF6B35"
            opacity="0.7"
            animatedProps={useAnimatedProps(() => ({
              cy: interpolate(rotationValue.value % 60, [0, 30, 60], [39, 41, 39]),
              opacity: interpolate(rotationValue.value % 60, [0, 30, 60], [0.7, 0.3, 0.7]),
            }))}
          />
        )}
      </AnimatedSvg>

      {/* AI标识 - 移动到左边，隐藏时可见 */}
      <View
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          borderRadius: 10,
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.85)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2.5 },
          shadowOpacity: 0.18,
          shadowRadius: 3.5,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '900',
            color: 'rgba(0, 0, 0, 0.82)',
            textAlign: 'center',
            lineHeight: 11,
          }}
        >
          AI
        </Text>
      </View>
    </View>
  );
};