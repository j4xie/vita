import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { theme } from '../../theme';
import { BRAND_GLASS, BRAND_INTERACTIONS, BRAND_GRADIENT, RESTRAINED_COLORS } from '../../theme/core';
import { scaleIn, scaleOut, bounce } from '../../utils/animations';

interface AnimatedButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  gradient?: string[];
  icon?: React.ReactNode;
  animationType?: 'scale' | 'bounce' | 'none';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  gradient,
  icon,
  animationType = 'scale',
  onPress,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // 按钮按下动画
  const handlePressIn = () => {
    if (animationType === 'scale') {
      scaleOut(scaleAnim).start();
    } else if (animationType === 'bounce') {
      bounce(scaleAnim).start();
    }
  };

  // 按钮释放动画
  const handlePressOut = () => {
    if (animationType === 'scale') {
      scaleIn(scaleAnim).start();
    }
  };

  // 按钮点击处理
  const handlePress = (event: any) => {
    if (animationType === 'bounce') {
      bounce(scaleAnim).start();
    }
    onPress?.(event);
  };

  // 禁用状态动画
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: disabled || loading ? 0.6 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [disabled, loading, opacityAnim]);

  // V2.0 获取克制化按钮样式配置
  const getButtonConfig = () => {
    const configs = {
      // Primary → L2品牌玻璃系统
      primary: {
        backgroundColor: RESTRAINED_COLORS.L2_EMPHASIS.background.light,
        textColor: RESTRAINED_COLORS.L2_EMPHASIS.textColor.light,
        borderWidth: RESTRAINED_COLORS.L2_EMPHASIS.border.width,
        borderColor: RESTRAINED_COLORS.L2_EMPHASIS.border.color.light,
        useGradient: false, // 不使用渐变，避免超出颜色预算
      },
      // Secondary → L1容器 + Dawn描边
      secondary: {
        backgroundColor: RESTRAINED_COLORS.L1_CONTAINER.background.light,
        textColor: '#FF6B35', // Dawn文字色
        borderWidth: RESTRAINED_COLORS.L1_CONTAINER.border.width,
        borderColor: RESTRAINED_COLORS.L2_EMPHASIS.border.color.light, // Dawn描边
      },
      // Outline → 透明底 + Dawn描边
      outline: {
        backgroundColor: 'transparent',
        textColor: '#FF6B35', // Dawn文字色
        borderWidth: 2,
        borderColor: RESTRAINED_COLORS.L2_EMPHASIS.border.color.light, // Dawn描边
      },
    };
    return configs[variant];
  };

  // 获取尺寸配置
  const getSizeConfig = () => {
    const configs = {
      small: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.typography.fontSize.sm,
        borderRadius: RESTRAINED_COLORS.L2_EMPHASIS.borderRadius.compact,
      },
      medium: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        fontSize: theme.typography.fontSize.base,
        borderRadius: RESTRAINED_COLORS.L2_EMPHASIS.borderRadius.button,
      },
      large: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        fontSize: theme.typography.fontSize.lg,
        borderRadius: RESTRAINED_COLORS.L2_EMPHASIS.borderRadius.button,
      },
    };
    return configs[size];
  };

  const buttonConfig = getButtonConfig();
  const sizeConfig = getSizeConfig();

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  const buttonContent = (
    <Animated.View style={[styles.content, animatedStyle]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          styles.text,
          {
            color: buttonConfig.textColor,
            fontSize: sizeConfig.fontSize,
          },
          textStyle,
        ]}
      >
        {loading ? '加载中...' : title}
      </Text>
    </Animated.View>
  );

  const buttonStyles: any[] = [
    styles.button,
    {
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderRadius: sizeConfig.borderRadius,
      backgroundColor: buttonConfig.backgroundColor,
      borderWidth: buttonConfig.borderWidth || 0,
      borderColor: buttonConfig.borderColor,
      width: fullWidth ? '100%' : 'auto',
    },
    style,
  ];

  // V2.0 克制化阴影容器 - 仅XS阴影
  const shadowContainerStyles = [
    variant === 'primary' ? {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    } : {},
    {
      borderRadius: sizeConfig.borderRadius,
      backgroundColor: 'rgba(255, 255, 255, 0.02)', // Nearly invisible but solid for shadow calculation
    }
  ];

  // V2.0 统一按钮渲染 - 不使用渐变，确保颜色克制
  return (
    <View style={shadowContainerStyles}>
      <TouchableOpacity
        style={buttonStyles}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        {buttonContent}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // 保证触摸目标大小
  },
  gradientButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});