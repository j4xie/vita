/**
 * useDarkMode Hook - 简化的Light Mode主题管理
 * 
 * 仅提供light mode样式支持，移除dark mode功能
 */

import { colors } from '../theme/colors';
import { useTheme as useThemeContext } from '../context/ThemeContext';
import { 
  getDynamicStyle, 
  getMaterialConfig, 
  getLayerConfig, 
  getTextColor, 
  getBackgroundColor,
  SYSTEM_MATERIALS,
} from '../theme/core';

export interface DarkModeStyles {
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
  
  // 材质配置
  material: (type: 'regular' | 'thick' | 'thin' | 'ultraThin' | 'chrome') => {
    background: string;
    border: string;
    blur: number;
    shadow: string;
  };
  
  // 分层配置  
  layer: (type: 'L1' | 'L2' | 'L3') => {
    background: string;
    border: string;
    blur: number;
    shadow: string;
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
 * useDarkMode Hook - 简化版仅支持Light Mode
 */
export const useDarkMode = (): {
  isDarkMode: boolean;
  styles: DarkModeStyles;
  dynamicStyle: (lightValue: any, darkValue: any) => any;
} => {
  const isDarkMode = false; // 固定为false，仅支持light mode
  
  // 背景色获取函数
  const backgroundColor = (level: 'system' | 'secondary' | 'tertiary' | 'elevated') => {
    return getBackgroundColor(level, isDarkMode);
  };
  
  // 文本色获取函数
  const textColor = (level: 'primary' | 'secondary' | 'tertiary' | 'quaternary') => {
    return getTextColor(level, isDarkMode);
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
  
  // 品牌色系 - 仅light mode
  const brandColor = {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    primaryPressed: colors.primaryPressed,
    primaryDisabled: colors.primaryDisabled,
  };
  
  // 功能色系 - 仅light mode
  const functionalColor = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  };
  
  // 材质配置获取函数
  const material = (type: keyof typeof SYSTEM_MATERIALS) => {
    return getMaterialConfig(type, isDarkMode);
  };
  
  // 分层配置获取函数
  const layer = (type: 'L1' | 'L2' | 'L3') => {
    return getLayerConfig(type, isDarkMode);
  };
  
  // 渐变配置 - 仅light mode
  const gradients = {
    brand: colors.gradients.vitaflow,
    background: colors.gradients.background,
    card: colors.gradients.card,
  };
  
  // 阴影配置 - 仅light mode
  const shadows = {
    light: colors.shadow.light,
    medium: colors.shadow.medium,
    heavy: colors.shadow.heavy,
    brand: colors.shadow.vitaOrange,
  };
  
  // 动态样式函数 - 始终返回light值
  const dynamicStyle = (lightValue: any, darkValue: any) => {
    return lightValue;
  };
  
  // 返回完整的样式系统
  const styles: DarkModeStyles = {
    backgroundColor,
    textColor,
    borderColor,
    brandColor,
    functionalColor,
    material,
    layer,
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
 * 简化版Dark Mode Hook - 仅返回基础样式
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
 * BlurView配置Hook - 仅Light Mode
 */
export const useBlurViewConfig = () => {
  return {
    tint: 'light' as 'light' | 'dark',
    intensity: 20,
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  };
};

/**
 * 性能优化版Hook - 仅Light Mode配置
 */
export const useMemoizedDarkMode = () => {
  const isDarkMode = false;
  
  return {
    isDarkMode,
    // Light mode配置
    primaryBackground: '#FFFFFF',
    secondaryBackground: '#F9FAFB',
    elevatedBackground: '#FFFFFF',
    
    // Light mode文本色
    primaryText: '#111827',
    secondaryText: '#4B5563',
    
    // Light mode品牌色
    brandPrimary: '#FF6B35',
    brandSecondary: '#FF4757',
    
    // Light mode功能色
    success: '#2ED573',
    error: '#EF4444',
    warning: '#FFA726',
    
    // BlurView配置
    blurTint: 'light' as 'light' | 'dark',
    blurIntensity: 20,
  };
};

export default useDarkMode;