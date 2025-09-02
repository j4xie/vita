/**
 * useDarkMode Hook - 统一的Dark Mode样式管理
 * 
 * 提供完整的dark mode样式支持，包括：
 * - Apple标准色彩系统
 * - 动态材质配置
 * - 分层玻璃效果
 * - 统一样式工具
 */

import { useColorScheme } from 'react-native';
import { colors } from '../theme/colors';
import { useTheme as useThemeContext } from '../context/ThemeContext';  // 重命名避免冲突
import { 
  getDynamicStyle, 
  getMaterialConfig, 
  getLayerConfig, 
  getTextColor, 
  getBackgroundColor,
  SYSTEM_MATERIALS,
  LIQUID_GLASS_LAYERS 
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
 * useDarkMode Hook - 核心Dark Mode管理
 * 使用ThemeContext作为唯一真实来源
 */
export const useDarkMode = (): {
  isDarkMode: boolean;
  styles: DarkModeStyles;
  dynamicStyle: (lightValue: any, darkValue: any) => any;
} => {
  const themeContext = useThemeContext();
  const isDarkMode = themeContext.isDarkMode;  // 使用ThemeContext的isDarkMode
  
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
    if (isDarkMode) {
      switch (level) {
        case 'primary': return colors.darkBorder.primary;
        case 'secondary': return colors.darkBorder.secondary;
        case 'tertiary': return colors.darkBorder.tertiary;
        default: return colors.darkBorder.primary;
      }
    } else {
      switch (level) {
        case 'primary': return colors.border.primary;
        case 'secondary': return colors.border.secondary;
        case 'tertiary': return colors.border.light;
        default: return colors.border.primary;
      }
    }
  };
  
  // 品牌色系
  const brandColor = {
    primary: isDarkMode ? colors.darkBrand.primary : colors.primary,
    secondary: isDarkMode ? colors.darkBrand.secondary : colors.secondary,
    accent: isDarkMode ? colors.darkBrand.accent : colors.accent,
    primaryPressed: isDarkMode ? colors.darkBrand.primaryPressed : colors.primaryPressed,
    primaryDisabled: isDarkMode ? colors.darkBrand.primaryDisabled : colors.primaryDisabled,
  };
  
  // 功能色系
  const functionalColor = {
    success: isDarkMode ? colors.darkFunctional.success : colors.success,
    warning: isDarkMode ? colors.darkFunctional.warning : colors.warning,
    error: isDarkMode ? colors.darkFunctional.error : colors.error,
    info: isDarkMode ? colors.darkFunctional.info : colors.info,
  };
  
  // 材质配置获取函数
  const material = (type: keyof typeof SYSTEM_MATERIALS) => {
    return getMaterialConfig(type, isDarkMode);
  };
  
  // 分层配置获取函数
  const layer = (type: 'L1' | 'L2' | 'L3') => {
    return getLayerConfig(type, isDarkMode);
  };
  
  // 渐变配置
  const gradients = {
    brand: isDarkMode ? colors.darkGradients.vitaflow : colors.gradients.vitaflow,
    background: isDarkMode ? colors.darkGradients.backgroundPrimary : colors.gradients.background,
    card: isDarkMode ? colors.darkGradients.card : colors.gradients.card,
  };
  
  // 阴影配置
  const shadows = {
    light: isDarkMode ? colors.darkShadows.light : colors.shadow.light,
    medium: isDarkMode ? colors.darkShadows.medium : colors.shadow.medium,
    heavy: isDarkMode ? colors.darkShadows.heavy : colors.shadow.heavy,
    brand: isDarkMode ? colors.darkShadows.brandPrimary : colors.shadow.vitaOrange,
  };
  
  // 动态样式函数
  const dynamicStyle = (lightValue: any, darkValue: any) => {
    return getDynamicStyle(lightValue, darkValue, isDarkMode);
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
 * BlurView Dark Mode 配置Hook
 * 使用ThemeContext作为唯一真实来源
 */
export const useBlurViewConfig = () => {
  const themeContext = useThemeContext();
  const isDarkMode = themeContext.isDarkMode;
  
  return {
    tint: (isDarkMode ? 'dark' : 'light') as 'light' | 'dark',
    intensity: isDarkMode ? 25 : 20,
    style: {
      backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    },
  };
};

/**
 * 性能优化版Dark Mode Hook - 仅在必要时重新计算
 * 使用ThemeContext作为唯一真实来源
 */
export const useMemoizedDarkMode = () => {
  const themeContext = useThemeContext();
  const isDarkMode = themeContext.isDarkMode;  // 使用ThemeContext的isDarkMode
  
  // 返回最常用的样式配置，减少计算开销
  return {
    isDarkMode,
    // 最常用的背景色
    primaryBackground: isDarkMode ? '#000000' : '#FFFFFF',
    secondaryBackground: isDarkMode ? '#1C1C1E' : '#F9FAFB',
    elevatedBackground: isDarkMode ? '#2C2C2E' : '#FFFFFF',
    
    // 最常用的文本色
    primaryText: isDarkMode ? '#FFFFFF' : '#111827',
    secondaryText: isDarkMode ? '#EBEBF599' : '#4B5563',
    
    // 最常用的品牌色
    brandPrimary: isDarkMode ? '#FF8A65' : '#FF6B35',
    brandSecondary: isDarkMode ? '#FF6B75' : '#FF4757',
    
    // 最常用的功能色
    success: isDarkMode ? '#30D158' : '#2ED573',
    error: isDarkMode ? '#FF453A' : '#EF4444',
    warning: isDarkMode ? '#FF9F0A' : '#FFA726',
    
    // BlurView配置
    blurTint: (isDarkMode ? 'dark' : 'light') as 'light' | 'dark',
    blurIntensity: isDarkMode ? 25 : 20,
  };
};

export default useDarkMode;