/**
 * v1.2 无障碍触摸组件
 * 确保所有触摸目标符合最小触达标准，支持屏幕阅读器
 */

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  Text,
  Platform,
  AccessibilityInfo,
  StyleSheet,
} from 'react-native';
import { theme } from '../../theme';
import { validateTouchTarget } from '../../utils/safeAreaHelpers';

interface AccessibleTouchableProps extends TouchableOpacityProps {
  // 无障碍属性
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'image' | 'text' | 'none';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
  
  // v1.2 增强属性
  minTouchSize?: number; // 最小触摸尺寸（默认48pt）
  autoHitSlop?: boolean; // 自动计算hitSlop
  hapticFeedback?: boolean; // 触觉反馈
  
  // 视觉指示器
  showFocusIndicator?: boolean;
  focusIndicatorColor?: string;
  
  children?: React.ReactNode;
}

/**
 * v1.2 无障碍触摸组件
 * 自动确保最小触达面积和无障碍支持
 */
export const AccessibleTouchable: React.FC<AccessibleTouchableProps> = ({
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  minTouchSize = theme.touchTarget.minimum,
  autoHitSlop = true,
  hapticFeedback = false,
  showFocusIndicator = true,
  focusIndicatorColor = theme.colors.primary,
  onPress,
  children,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = React.useState(false);

  // 检测屏幕阅读器状态
  React.useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };
    
    checkScreenReader();
    
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // 测量组件尺寸
  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    
    // 调用原始onLayout
    if (props.onLayout) {
      props.onLayout(event);
    }
  };

  // v1.2: 自动计算hitSlop以满足最小触达标准
  const calculatedHitSlop = React.useMemo(() => {
    if (!autoHitSlop || dimensions.width === 0 || dimensions.height === 0) {
      return props.hitSlop;
    }
    
    const validation = validateTouchTarget(dimensions.width, dimensions.height);
    return validation.isValid ? props.hitSlop : validation.recommendedHitSlop;
  }, [dimensions, autoHitSlop, props.hitSlop]);

  // 增强的按下处理
  const enhancedOnPress = React.useCallback((event: any) => {
    // v1.2: 触觉反馈
    if (hapticFeedback && Platform.OS === 'ios') {
      // iOS触觉反馈（需要导入Haptics API）
      // HapticFeedback.impact(HapticFeedback.ImpactFeedbackStyle.Light);
    }
    
    if (onPress) {
      onPress(event);
    }
  }, [onPress, hapticFeedback]);

  // 焦点处理
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // 合并样式
  const containerStyle = [
    style,
    dimensions.width < minTouchSize && styles.minSizeContainer,
    isFocused && showFocusIndicator && {
      borderWidth: 2,
      borderColor: focusIndicatorColor,
    },
  ];

  // v1.2: 无障碍属性增强
  const accessibilityProps = {
    accessible: true,
    accessibilityLabel: accessibilityLabel || (typeof children === 'string' ? children : undefined),
    accessibilityHint,
    accessibilityRole,
    accessibilityState: {
      ...accessibilityState,
      // 屏幕阅读器焦点状态
      selected: isFocused,
    },
    // iOS VoiceOver特定属性
    ...(Platform.OS === 'ios' && {
      accessibilityIgnoresInvertColors: true,
    }),
    // Android TalkBack特定属性
    ...(Platform.OS === 'android' && {
      importantForAccessibility: 'yes' as const,
    }),
  };

  return (
    <TouchableOpacity
      {...props}
      {...accessibilityProps}
      style={containerStyle}
      onLayout={onLayout}
      onPress={enhancedOnPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      hitSlop={calculatedHitSlop}
    >
      {/* 确保最小尺寸的内部容器 */}
      <View style={[
        styles.innerContainer,
        dimensions.width < minTouchSize && {
          minWidth: minTouchSize,
          minHeight: minTouchSize,
        }
      ]}>
        {children}
      </View>
      
      {/* 屏幕阅读器模式下的额外提示 - 使用无障碍语义，不需要可视文本 */}
    </TouchableOpacity>
  );
};

/**
 * v1.2 无障碍图标按钮
 * 专门为图标按钮优化的无障碍组件
 */
export const AccessibleIconButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
}> = ({
  icon,
  label,
  hint,
  onPress,
  size = theme.touchTarget.minimum,
  color = theme.colors.primary,
  disabled = false,
}) => {
  return (
    <AccessibleTouchable
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.iconButton,
        {
          width: size,
          height: size,
          opacity: disabled ? 0.5 : 1,
        }
      ]}
      hapticFeedback
    >
      {icon}
    </AccessibleTouchable>
  );
};

/**
 * v1.2 无障碍文本按钮
 * 确保文本按钮符合Dynamic Type和对比度要求
 */
export const AccessibleTextButton: React.FC<{
  title: string;
  hint?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
}> = ({
  title,
  hint,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
}) => {
  // Dynamic Type支持的字体大小
  const fontSize = {
    small: theme.typography.fontSize.sm,
    medium: theme.typography.fontSize.base,
    large: theme.typography.fontSize.lg,
  }[size];
  
  // 按钮高度（支持Dynamic Type）
  const buttonHeight = {
    small: theme.layout.dynamicType.button.minHeight - 8,
    medium: theme.layout.dynamicType.button.minHeight,
    large: theme.layout.dynamicType.button.largeHeight,
  }[size];
  
  // 变体样式
  const variantStyles = {
    primary: {
      backgroundColor: disabled ? theme.colors.primaryDisabled : theme.colors.primary,
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: disabled ? theme.colors.border.secondary : theme.colors.secondary,
    },
    text: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  }[variant];
  
  const textColor = variant === 'primary' 
    ? theme.colors.text.inverse 
    : disabled 
      ? theme.colors.text.disabled 
      : variant === 'secondary' 
        ? theme.colors.secondary 
        : theme.colors.primary;

  return (
    <AccessibleTouchable
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.textButton,
        variantStyles,
        {
          height: buttonHeight,
          minWidth: fullWidth ? '100%' : theme.layout.dynamicType.button.minWidth,
        },
        fullWidth && styles.fullWidth,
        // 只有primary变体才应用阴影，避免透明背景阴影性能问题
        variant === 'primary' ? theme.shadows.sm : {},
      ]}
      hapticFeedback
    >
      <Text style={[
        styles.textButtonText,
        {
          fontSize,
          color: textColor,
          // v1.2: 确保文字对比度
          textShadowColor: variant === 'primary' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }
      ]}>
        {title}
      </Text>
    </AccessibleTouchable>
  );
};

const styles = StyleSheet.create({
  minSizeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  screenReaderHint: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  
  textButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.base,
    borderWidth: 2,
    // 移除通用阴影，改为条件应用
  },
  
  fullWidth: {
    width: '100%',
  },
  
  textButtonText: {
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default {
  AccessibleTouchable,
  AccessibleIconButton,
  AccessibleTextButton,
};