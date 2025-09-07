/**
 * useDarkModeStyles - 全局动态样式管理器
 * 解决StyleSheet无法动态化的问题，为所有组件提供统一的dark mode样式
 */

import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { theme } from '../theme';

export interface GlobalDarkModeStyles {
  // 页面级样式
  page: {
    container: any;
    safeArea: any;
    scrollView: any;
    contentContainer: any;
  };
  
  // 卡片级样式
  card: {
    container: any;
    shadowContainer: any;
    touchableContainer: any;
    contentSection: any;
    imageContainer: any;
  };
  
  // 文本级样式
  text: {
    primary: any;
    secondary: any;
    tertiary: any;
    title: any;
    subtitle: any;
    caption: any;
  };
  
  // 交互组件样式
  button: {
    primary: any;
    secondary: any;
    outline: any;
    text: any;
  };
  
  // 模态框样式
  modal: {
    overlay: any;
    container: any;
    header: any;
    content: any;
    footer: any;
  };
  
  // 表单样式
  form: {
    input: any;
    inputContainer: any;
    label: any;
    error: any;
  };
}

/**
 * 全局Dark Mode样式Hook
 * 返回所有常用的动态样式，避免每个组件重复创建
 */
export const useDarkModeStyles = (): GlobalDarkModeStyles => {
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;
  
  // 获取当前模式的基础颜色
  const getCurrentColors = () => {
    if (isDarkMode) {
      return {
        // 背景色系
        primaryBg: colors.darkBackground.systemBackground,           // #000000
        secondaryBg: colors.darkBackground.secondarySystemBackground, // #1C1C1E
        tertiaryBg: colors.darkBackground.tertiarySystemBackground,   // #2C2C2E
        elevatedBg: colors.darkBackground.elevated,                   // #2C2C2E
        surfaceBg: colors.darkBackground.surface,                     // #1C1C1E
        
        // 文本色系
        primaryText: colors.darkText.primary,       // #FFFFFF
        secondaryText: colors.darkText.secondary,   // #EBEBF599
        tertiaryText: colors.darkText.tertiary,     // #EBEBF54D
        disabledText: colors.darkText.disabled,     // #EBEBF540
        
        // 边框色系
        primaryBorder: colors.darkBorder.primary,   // #38383A
        secondaryBorder: colors.darkBorder.secondary, // #48484A
        
        // 品牌色系
        brandPrimary: colors.darkBrand.primary,     // #FF8A65
        brandSecondary: colors.darkBrand.secondary, // #FF6B75
        
        // 功能色系
        success: colors.darkFunctional.success,     // #30D158
        error: colors.darkFunctional.error,         // #FF453A
        warning: colors.darkFunctional.warning,     // #FF9F0A
      };
    } else {
      return {
        // 浅色模式颜色
        primaryBg: colors.white,
        secondaryBg: colors.background.secondary,
        tertiaryBg: colors.background.tertiary,
        elevatedBg: colors.white,
        surfaceBg: colors.white,
        
        primaryText: colors.text.primary,
        secondaryText: colors.text.secondary,
        tertiaryText: colors.text.tertiary,
        disabledText: colors.text.disabled,
        
        primaryBorder: colors.border.primary,
        secondaryBorder: colors.border.secondary,
        
        brandPrimary: colors.primary,
        brandSecondary: colors.secondary,
        
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
      };
    }
  };
  
  const currentColors = getCurrentColors();
  
  // 动态创建所有常用样式
  const dynamicStyles = StyleSheet.create({
    // ==================
    // 页面级样式
    // ==================
    pageContainer: {
      flex: 1,
      backgroundColor: currentColors.primaryBg,
    },
    
    pageSafeArea: {
      flex: 1,
      backgroundColor: currentColors.primaryBg,
    },
    
    pageScrollView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    
    pageContentContainer: {
      backgroundColor: 'transparent',
    },
    
    // ==================
    // 卡片级样式
    // ==================
    cardContainer: {
      backgroundColor: 'transparent',
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    
    cardShadowContainer: {
      backgroundColor: currentColors.elevatedBg,
      borderRadius: theme.borderRadius.lg,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.3 : 0.15,
      shadowRadius: isDarkMode ? 16 : 12,
      elevation: isDarkMode ? 8 : 6,
    },
    
    cardTouchableContainer: {
      backgroundColor: currentColors.elevatedBg,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    },
    
    cardContentSection: {
      backgroundColor: currentColors.elevatedBg,
      padding: theme.spacing.md,
    },
    
    cardImageContainer: {
      backgroundColor: currentColors.secondaryBg,
    },
    
    // ==================
    // 文本级样式
    // ==================
    primaryText: {
      color: currentColors.primaryText,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.regular,
    },
    
    secondaryText: {
      color: currentColors.secondaryText,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.regular,
    },
    
    tertiaryText: {
      color: currentColors.tertiaryText,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.regular,
    },
    
    titleText: {
      color: currentColors.primaryText,
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      lineHeight: 28,
    },
    
    subtitleText: {
      color: currentColors.secondaryText,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
    },
    
    captionText: {
      color: currentColors.tertiaryText,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
    },
    
    // ==================
    // 交互组件样式
    // ==================
    primaryButton: {
      backgroundColor: currentColors.brandPrimary,
      borderRadius: theme.borderRadius.base,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    primaryButtonText: {
      color: colors.white,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    
    secondaryButton: {
      backgroundColor: isDarkMode ? 'rgba(255, 138, 101, 0.16)' : 'rgba(255, 107, 53, 0.14)',
      borderRadius: theme.borderRadius.base,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 138, 101, 0.25)' : 'rgba(255, 107, 53, 0.22)',
    },
    
    secondaryButtonText: {
      color: currentColors.brandPrimary,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    
    outlineButton: {
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.base,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: currentColors.primaryBorder,
    },
    
    outlineButtonText: {
      color: currentColors.primaryText,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
    },
    
    // ==================
    // 模态框样式
    // ==================
    modalOverlay: {
      flex: 1,
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    modalContainer: {
      backgroundColor: currentColors.elevatedBg,
      borderRadius: theme.borderRadius.xl,
      marginHorizontal: theme.spacing.lg,
      maxWidth: 400,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    },
    
    modalHeader: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: currentColors.primaryBorder,
    },
    
    modalContent: {
      padding: theme.spacing.lg,
      backgroundColor: currentColors.elevatedBg,
    },
    
    modalFooter: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: currentColors.primaryBorder,
    },
    
    // ==================
    // 表单样式
    // ==================
    formInputContainer: {
      backgroundColor: isDarkMode ? 'rgba(44, 44, 46, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: theme.borderRadius.base,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : 'rgba(0, 0, 0, 0.1)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    
    formInput: {
      color: currentColors.primaryText,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.regular,
      minHeight: 44,
    },
    
    formLabel: {
      color: currentColors.secondaryText,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      marginBottom: theme.spacing.xs,
    },
    
    formError: {
      color: currentColors.error,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.regular,
      marginTop: theme.spacing.xs,
    },
  });
  
  return {
    page: {
      container: dynamicStyles.pageContainer,
      safeArea: dynamicStyles.pageSafeArea,
      scrollView: dynamicStyles.pageScrollView,
      contentContainer: dynamicStyles.pageContentContainer,
    },
    card: {
      container: dynamicStyles.cardContainer,
      shadowContainer: dynamicStyles.cardShadowContainer,
      touchableContainer: dynamicStyles.cardTouchableContainer,
      contentSection: dynamicStyles.cardContentSection,
      imageContainer: dynamicStyles.cardImageContainer,
    },
    text: {
      primary: dynamicStyles.primaryText,
      secondary: dynamicStyles.secondaryText,
      tertiary: dynamicStyles.tertiaryText,
      title: dynamicStyles.titleText,
      subtitle: dynamicStyles.subtitleText,
      caption: dynamicStyles.captionText,
    },
    button: {
      primary: dynamicStyles.primaryButton,
      secondary: dynamicStyles.secondaryButton,
      outline: dynamicStyles.outlineButton,
      text: dynamicStyles.primaryButtonText,
    },
    modal: {
      overlay: dynamicStyles.modalOverlay,
      container: dynamicStyles.modalContainer,
      header: dynamicStyles.modalHeader,
      content: dynamicStyles.modalContent,
      footer: dynamicStyles.modalFooter,
    },
    form: {
      input: dynamicStyles.formInput,
      inputContainer: dynamicStyles.formInputContainer,
      label: dynamicStyles.formLabel,
      error: dynamicStyles.formError,
    },
  };
};

/**
 * 获取动态渐变色配置
 */
export const useDarkModeGradients = () => {
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;
  
  return {
    // 页面背景渐变
    pageBackground: isDarkMode 
      ? colors.darkGradients.backgroundPrimary 
      : ['#F5F6F7', '#F1F2F3', '#EDEEF0'],
      
    // 卡片背景渐变
    cardBackground: isDarkMode
      ? colors.darkGradients.card
      : colors.gradients.card,
      
    // 表面背景渐变
    surfaceBackground: isDarkMode
      ? colors.darkGradients.surface
      : colors.gradients.background,
      
    // 品牌渐变
    brandGradient: isDarkMode
      ? colors.darkGradients.vitaflow
      : colors.gradients.vitaflow,
      
    // 覆盖层渐变 (用于图片上的文字保护)
    overlayGradient: (isDarkMode ? [
      'rgba(255, 138, 101, 0.05)',  // 深色模式品牌色轻微遮罩
      'rgba(255, 107, 117, 0.12)',  // 中等遮罩
      'rgba(0, 0, 0, 0.8)'           // 底部强遮罩确保文字对比度
    ] : [
      'rgba(255, 107, 53, 0.05)',   // 浅色模式品牌色轻微遮罩
      'rgba(255, 71, 87, 0.15)',    // 中等遮罩
      'rgba(26, 26, 26, 0.75)'      // 底部暗层确保文字对比度
    ]) as readonly [string, string, ...string[]],
  };
};

/**
 * 获取动态图标颜色
 */
export const useDarkModeIcons = () => {
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;
  
  return {
    primary: isDarkMode ? colors.darkText.primary : colors.text.primary,
    secondary: isDarkMode ? colors.darkText.secondary : colors.text.secondary,
    tertiary: isDarkMode ? colors.darkText.tertiary : colors.text.tertiary,
    brand: isDarkMode ? colors.darkBrand.primary : colors.primary,
    success: isDarkMode ? colors.darkFunctional.success : colors.success,
    error: isDarkMode ? colors.darkFunctional.error : colors.error,
    warning: isDarkMode ? colors.darkFunctional.warning : colors.warning,
    
    // Apple标准系统图标色
    systemBlue: isDarkMode ? '#0A84FF' : '#007AFF',
    systemGray: isDarkMode ? '#8E8E93' : '#8E8E93',
    
    // TabBar图标色
    tabActive: isDarkMode ? '#0A84FF' : '#007AFF',
    tabInactive: isDarkMode ? colors.darkText.secondary : colors.text.secondary,
  };
};

/**
 * 获取BlurView动态配置
 */
export const useDarkModeBlur = () => {
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;
  
  return {
    tint: (isDarkMode ? 'dark' : 'light') as 'light' | 'dark',
    intensity: isDarkMode ? 25 : 20,
    style: {
      backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    },
  };
};

/**
 * 一站式Dark Mode样式Hook - 包含所有必需样式
 */
export const useAllDarkModeStyles = () => {
  const styles = useDarkModeStyles();
  const gradients = useDarkModeGradients();
  const icons = useDarkModeIcons();
  const blur = useDarkModeBlur();
  const themeContext = useTheme();
  
  return {
    styles,
    gradients, 
    icons,
    blur,
    isDarkMode: themeContext.isDarkMode,
    // 便捷访问当前模式的基础颜色
    colors: {
      background: themeContext.isDarkMode ? colors.darkBackground : colors.background,
      text: themeContext.isDarkMode ? colors.darkText : colors.text,
      brand: themeContext.isDarkMode ? colors.darkBrand : { primary: colors.primary, secondary: colors.secondary },
      border: themeContext.isDarkMode ? colors.darkBorder : colors.border,
    },
  };
};

export default useDarkModeStyles;