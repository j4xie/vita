/**
 * Light Mode Styles - Fixed light mode styling
 * Simplified version with only light mode support
 */

import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { theme } from '../theme';

export interface GlobalLightModeStyles {
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
 * Light Mode样式Hook
 */
export const useDarkModeStyles = (): GlobalLightModeStyles => {
  const isDarkMode = false; // Always false

  // Light mode colors only
  const currentColors = {
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

  // Static light mode styles
  const dynamicStyles = StyleSheet.create({
    // Page styles
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

    // Card styles
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
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },

    cardTouchableContainer: {
      backgroundColor: currentColors.elevatedBg,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.8)',
    },

    cardContentSection: {
      backgroundColor: currentColors.elevatedBg,
      padding: theme.spacing.md,
    },

    cardImageContainer: {
      backgroundColor: currentColors.secondaryBg,
    },

    // Text styles
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

    // Button styles
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
      backgroundColor: 'rgba(255, 107, 53, 0.14)',
      borderRadius: theme.borderRadius.base,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 107, 53, 0.22)',
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

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
      borderColor: 'rgba(255, 255, 255, 0.8)',
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

    // Form styles
    formInputContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: theme.borderRadius.base,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
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
 * Light mode gradients
 */
export const useDarkModeGradients = () => {
  return {
    pageBackground: ['#F5F6F7', '#F1F2F3', '#EDEEF0'],
    cardBackground: colors.gradients.card,
    surfaceBackground: colors.gradients.background,
    brandGradient: colors.gradients.vitaflow,
    overlayGradient: [
      'rgba(255, 107, 53, 0.05)',
      'rgba(255, 71, 87, 0.15)',
      'rgba(26, 26, 26, 0.75)'
    ] as readonly [string, string, ...string[]],
  };
};

/**
 * Light mode icons
 */
export const useDarkModeIcons = () => {
  return {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    tertiary: colors.text.tertiary,
    brand: colors.primary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,

    systemBlue: '#007AFF',
    systemGray: '#8E8E93',

    tabActive: '#007AFF',
    tabInactive: colors.text.secondary,
  };
};

/**
 * Light mode blur
 */
export const useDarkModeBlur = () => {
  return {
    tint: 'light' as const,
    intensity: 20,
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  };
};

/**
 * All light mode styles
 */
export const useAllDarkModeStyles = () => {
  const styles = useDarkModeStyles();
  const gradients = useDarkModeGradients();
  const icons = useDarkModeIcons();
  const blur = useDarkModeBlur();

  return {
    styles,
    gradients,
    icons,
    blur,
    isDarkMode: false,
    colors: {
      background: colors.background,
      text: colors.text,
      brand: { primary: colors.primary, secondary: colors.secondary },
      border: colors.border,
    },
  };
};

export default useDarkModeStyles;