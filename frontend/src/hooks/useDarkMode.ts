/**
 * Light Mode Styles Hook - Light mode only styling
 *
 * Provides light mode styling support only
 */

import { colors } from '../theme/colors';

export interface LightModeStyles {
  // 基础样式获取
  backgroundColor: (level: 'system' | 'secondary' | 'tertiary' | 'elevated') => string;
  textColor: (level: 'primary' | 'secondary' | 'tertiary' | 'quaternary') => string;
  borderColor: (level: 'primary' | 'secondary' | 'tertiary') => string;

  // 品牌色系
  brandColor: {
    primary: string;
    secondary: string;
    accent: string;
    primaryPressed: string;
    primaryDisabled: string;
  };

  // 功能色系
  functionalColor: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // 渐变配置
  gradients: {
    brand: string[];
    background: string[];
    card: string[];
  };

  // 阴影配置
  shadows: {
    light: string;
    medium: string;
    heavy: string;
    brand: string;
  };
}

/**
 * useDarkMode Hook - Light mode only (legacy name for compatibility)
 */
export const useDarkMode = (): {
  isDarkMode: boolean;
  styles: LightModeStyles;
  dynamicStyle: (lightValue: any, darkValue: any) => any;
} => {
  const isDarkMode = false; // Always false - light mode only

  // 背景色获取函数
  const backgroundColor = (level: 'system' | 'secondary' | 'tertiary' | 'elevated') => {
    switch (level) {
      case 'system': return '#FFFFFF';
      case 'secondary': return '#F9FAFB';
      case 'tertiary': return '#F3F4F6';
      case 'elevated': return '#FFFFFF';
      default: return '#FFFFFF';
    }
  };

  // 文本色获取函数
  const textColor = (level: 'primary' | 'secondary' | 'tertiary' | 'quaternary') => {
    switch (level) {
      case 'primary': return '#111827';
      case 'secondary': return '#4B5563';
      case 'tertiary': return '#6B7280';
      case 'quaternary': return '#9CA3AF';
      default: return '#111827';
    }
  };

  // 边框色获取函数
  const borderColor = (level: 'primary' | 'secondary' | 'tertiary') => {
    switch (level) {
      case 'primary': return colors.border.primary;
      case 'secondary': return colors.border.secondary;
      case 'tertiary': return colors.border.light;
      default: return colors.border.primary;
    }
  };

  // 品牌色系
  const brandColor = {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    primaryPressed: colors.primaryPressed,
    primaryDisabled: colors.primaryDisabled,
  };

  // 功能色系
  const functionalColor = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  };

  // 渐变配置
  const gradients = {
    brand: [...colors.gradients.vitaflow],
    background: [...colors.gradients.background],
    card: [...colors.gradients.card],
  };

  // 阴影配置
  const shadows = {
    light: colors.shadow.light,
    medium: colors.shadow.medium,
    heavy: colors.shadow.heavy,
    brand: colors.shadow.vitaOrange,
  };

  // 动态样式函数 - always returns light value
  const dynamicStyle = (lightValue: any, darkValue: any) => {
    return lightValue;
  };

  // 返回完整的样式系统
  const styles: LightModeStyles = {
    backgroundColor,
    textColor,
    borderColor,
    brandColor,
    functionalColor,
    gradients,
    shadows,
  };

  return {
    isDarkMode,
    styles,
    dynamicStyle,
  };
};

/**
 * 简化版Hook - 仅返回基础样式
 */
export const useBasicDarkMode = () => {
  const { isDarkMode, styles } = useDarkMode();

  return {
    isDarkMode,
    backgroundColor: styles.backgroundColor('system'),
    textColor: styles.textColor('primary'),
    secondaryTextColor: styles.textColor('secondary'),
    borderColor: styles.borderColor('primary'),
    brandColor: styles.brandColor.primary,
  };
};

/**
 * BlurView配置Hook - Light mode only
 */
export const useBlurViewConfig = () => {
  return {
    tint: 'light' as const,
    intensity: 20,
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  };
};

/**
 * Light mode Hook
 */
export const useMemoizedDarkMode = () => {
  const isDarkMode = false;

  return {
    isDarkMode,
    // Light mode backgrounds
    primaryBackground: '#FFFFFF',
    secondaryBackground: '#F9FAFB',
    elevatedBackground: '#FFFFFF',

    // Light mode text colors
    primaryText: '#111827',
    secondaryText: '#4B5563',

    // Light mode brand colors
    brandPrimary: '#FF6B35',
    brandSecondary: '#FF4757',

    // Light mode functional colors
    success: '#2ED573',
    error: '#EF4444',
    warning: '#FFA726',

    // BlurView configuration
    blurTint: 'light' as const,
    blurIntensity: 20,
  };
};

export default useDarkMode;