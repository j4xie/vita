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
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
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

  // 获取按钮样式配置
  const getButtonConfig = () => {
    const configs = {
      primary: {
        backgroundColor: theme.colors.primary,
        textColor: theme.colors.text.inverse,
        gradient: gradient || [theme.colors.primary, theme.colors.primaryPressed],
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        textColor: theme.colors.text.inverse,
        gradient: gradient || [theme.colors.secondary, theme.colors.secondaryPressed],
      },
      outline: {
        backgroundColor: 'transparent',
        textColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.primary,
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
        borderRadius: theme.borderRadius.base,
      },
      medium: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        fontSize: theme.typography.fontSize.base,
        borderRadius: theme.borderRadius.button,
      },
      large: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        fontSize: theme.typography.fontSize.lg,
        borderRadius: theme.borderRadius.button,
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

  const buttonStyles = [
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

  // 阴影容器样式 - 分离阴影到外层
  const shadowContainerStyles = [
    variant === 'primary' ? theme.shadows.button : {},
    {
      borderRadius: sizeConfig.borderRadius,
      backgroundColor: 'transparent', // 确保阴影容器透明
    }
  ];

  if (variant === 'outline' || !buttonConfig.gradient) {
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
  }

  // Gradient按钮样式 - 移除shadow避免LinearGradient冲突
  const gradientButtonStyles = [
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

  return (
    <View style={shadowContainerStyles}>
      <LinearGradient
        colors={buttonConfig.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={gradientButtonStyles} // 使用不包含shadow的样式
      >
        <TouchableOpacity
          style={styles.gradientButton}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          {...props}
        >
          {buttonContent}
        </TouchableOpacity>
      </LinearGradient>
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