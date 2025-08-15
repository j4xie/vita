/**
 * v1.2 Dynamic Type支持的文本组件
 * 自动适配系统字体缩放，确保可读性
 */

import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  PixelRatio,
  Platform,
  View,
} from 'react-native';
import { theme } from '../../theme';

interface DynamicTextProps extends RNTextProps {
  variant?: 'title' | 'section' | 'body' | 'bodySmall' | 'caption' | 'captionSmall';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  
  // v1.2 无障碍增强
  highContrast?: boolean; // 高对比度模式
  scalable?: boolean; // 是否支持Dynamic Type缩放
  maxScale?: number; // 最大缩放比例
  
  // 可读性增强
  lineSpacing?: 'tight' | 'normal' | 'relaxed';
  letterSpacing?: number;
}

/**
 * v1.2 Dynamic Type文本组件
 * 支持系统字体缩放和高对比度模式
 */
export const DynamicText: React.FC<DynamicTextProps> = ({
  style,
  variant = 'body',
  weight = 'regular',
  color,
  align = 'left',
  highContrast = false,
  scalable = true,
  maxScale = 1.5,
  lineSpacing = 'normal',
  letterSpacing,
  children,
  ...props
}) => {
  // 获取系统字体缩放
  const fontScale = scalable ? PixelRatio.getFontScale() : 1;
  const adjustedScale = Math.min(fontScale, maxScale);
  
  // v1.2 字体大小映射
  const baseFontSize = {
    title: theme.typography.fontSize.title,
    section: theme.typography.fontSize.section,
    body: theme.typography.fontSize.body,
    bodySmall: theme.typography.fontSize.bodySmall,
    caption: theme.typography.fontSize.caption,
    captionSmall: theme.typography.fontSize.captionSmall,
  }[variant];
  
  // 应用Dynamic Type缩放
  const scaledFontSize = baseFontSize * adjustedScale;
  
  // v1.2 字重映射
  const fontWeight = theme.typography.fontWeight[weight];
  
  // v1.2 行高映射
  const lineHeight = {
    tight: theme.typography.lineHeight.tight,
    normal: theme.typography.lineHeight.normal,
    relaxed: theme.typography.lineHeight.relaxed,
  }[lineSpacing];
  
  // v1.2 颜色处理（高对比度模式）
  const textColor = highContrast
    ? theme.colors.text.primary // 强制使用最高对比度颜色
    : color || getDefaultColor(variant);
  
  // 合并样式
  const textStyle = [
    styles.base,
    {
      fontSize: scaledFontSize,
      fontWeight,
      color: textColor,
      textAlign: align,
      lineHeight: scaledFontSize * lineHeight,
      letterSpacing: letterSpacing || (variant === 'title' ? 0.5 : 0),
    },
    // 高对比度模式增强
    highContrast && styles.highContrast,
    style,
  ];
  
  // 无障碍属性
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'text' as const,
    // iOS动态字体支持
    ...(Platform.OS === 'ios' && {
      allowFontScaling: scalable,
      adjustsFontSizeToFit: false,
      minimumFontScale: 0.8,
    }),
    // Android字体缩放支持
    ...(Platform.OS === 'android' && {
      allowFontScaling: scalable,
    }),
  };
  
  return (
    <RNText
      {...props}
      {...accessibilityProps}
      style={textStyle}
    >
      {children}
    </RNText>
  );
};

/**
 * 获取变体的默认颜色
 */
function getDefaultColor(variant: string): string {
  switch (variant) {
    case 'title':
    case 'section':
      return theme.colors.text.primary;
    case 'body':
    case 'bodySmall':
      return theme.colors.text.secondary;
    case 'caption':
    case 'captionSmall':
      return theme.colors.text.tertiary;
    default:
      return theme.colors.text.primary;
  }
}

/**
 * v1.2 标题文本组件
 */
export const Title: React.FC<Omit<DynamicTextProps, 'variant'>> = (props) => (
  <DynamicText {...props} variant="title" weight="semibold" />
);

/**
 * v1.2 章节标题组件
 */
export const SectionTitle: React.FC<Omit<DynamicTextProps, 'variant'>> = (props) => (
  <DynamicText {...props} variant="section" weight="semibold" />
);

/**
 * v1.2 正文文本组件
 */
export const Body: React.FC<Omit<DynamicTextProps, 'variant'>> = (props) => (
  <DynamicText {...props} variant="body" />
);

/**
 * v1.2 辅助文本组件
 */
export const Caption: React.FC<Omit<DynamicTextProps, 'variant'>> = (props) => (
  <DynamicText {...props} variant="caption" />
);

/**
 * v1.2 高对比度标签组件
 * 用于重要信息和警告
 */
export const HighContrastLabel: React.FC<{
  type: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  size?: 'small' | 'medium';
}> = ({ type, children, size = 'medium' }) => {
  const colors = {
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.danger,
    info: theme.colors.primary,
  };
  
  const backgroundColor = colors[type];
  const fontSize = size === 'small' 
    ? theme.typography.fontSize.captionSmall 
    : theme.typography.fontSize.caption;
  
  return (
    <View style={[
      styles.label,
      { backgroundColor },
    ]}>
      <DynamicText
        variant={size === 'small' ? 'captionSmall' : 'caption'}
        weight="semibold"
        color={theme.colors.text.inverse}
        highContrast
      >
        {children}
      </DynamicText>
    </View>
  );
};


const styles = StyleSheet.create({
  base: {
    // 基础文本样式
    includeFontPadding: false, // Android文本对齐优化
  },
  
  highContrast: {
    // 高对比度模式样式
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  label: {
    paddingHorizontal: theme.spacing['2'],
    paddingVertical: theme.spacing['1'],
    borderRadius: theme.borderRadius.xs,
    alignSelf: 'flex-start',
  },
});

export default {
  DynamicText,
  Title,
  SectionTitle,
  Body,
  Caption,
  HighContrastLabel,
};