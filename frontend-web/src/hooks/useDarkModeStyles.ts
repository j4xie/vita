/**
 * useDarkModeStyles - 简化为Light Mode样式管理器
 * 移除dark mode功能，仅提供light mode样式
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
    quaternary: any;
    brand: any;
    success: any;
    warning: any;
    error: any;
  };
  
  // 输入框样式
  input: {
    container: any;
    textInput: any;
    placeholder: any;
    focused: any;
    error: any;
  };
  
  // 按钮样式
  button: {
    primary: any;
    secondary: any;
    text: any;
    outline: any;
    disabled: any;
  };
  
  // 边框样式
  border: {
    primary: any;
    secondary: any;
    light: any;
  };
  
  // 分隔线样式
  separator: {
    horizontal: any;
    vertical: any;
  };
  
  // 状态样式
  status: {
    success: any;
    warning: any;
    error: any;
    info: any;
  };
}

/**
 * 简化的样式管理Hook - 仅Light Mode
 */
export const useAllDarkModeStyles = (): {
  isDarkMode: boolean;
  styles: GlobalLightModeStyles;
  gradients: any;
} => {
  const isDarkMode = false; // 固定为false

  // Light Mode样式定义
  const lightStyles: GlobalLightModeStyles = {
    // 页面级样式
    page: {
      container: StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#FFFFFF',
        }
      }).container,
      safeArea: StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: '#F9FAFB',
        }
      }).safeArea,
      scrollView: StyleSheet.create({
        scrollView: {
          flex: 1,
          backgroundColor: '#F9FAFB',
        }
      }).scrollView,
      contentContainer: StyleSheet.create({
        contentContainer: {
          paddingHorizontal: 16,
          paddingVertical: 20,
        }
      }).contentContainer,
    },
    
    // 卡片级样式
    card: {
      container: StyleSheet.create({
        container: {
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          marginHorizontal: 16,
          marginVertical: 8,
        }
      }).container,
      shadowContainer: StyleSheet.create({
        shadowContainer: {
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }
      }).shadowContainer,
      touchableContainer: StyleSheet.create({
        touchableContainer: {
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
        }
      }).touchableContainer,
      contentSection: StyleSheet.create({
        contentSection: {
          backgroundColor: '#FFFFFF',
          padding: 16,
        }
      }).contentSection,
      imageContainer: StyleSheet.create({
        imageContainer: {
          backgroundColor: '#F3F4F6',
          borderRadius: 8,
        }
      }).imageContainer,
    },
    
    // 文本级样式
    text: {
      primary: StyleSheet.create({
        primary: {
          color: '#111827',
          fontSize: 16,
        }
      }).primary,
      secondary: StyleSheet.create({
        secondary: {
          color: '#4B5563',
          fontSize: 14,
        }
      }).secondary,
      tertiary: StyleSheet.create({
        tertiary: {
          color: '#6B7280',
          fontSize: 12,
        }
      }).tertiary,
      quaternary: StyleSheet.create({
        quaternary: {
          color: '#9CA3AF',
          fontSize: 11,
        }
      }).quaternary,
      brand: StyleSheet.create({
        brand: {
          color: colors.primary,
          fontWeight: '600',
        }
      }).brand,
      success: StyleSheet.create({
        success: {
          color: colors.success,
        }
      }).success,
      warning: StyleSheet.create({
        warning: {
          color: colors.warning,
        }
      }).warning,
      error: StyleSheet.create({
        error: {
          color: colors.error,
        }
      }).error,
    },
    
    // 输入框样式
    input: {
      container: StyleSheet.create({
        container: {
          backgroundColor: '#FFFFFF',
          borderColor: '#D1D5DB',
          borderWidth: 1,
          borderRadius: 8,
        }
      }).container,
      textInput: StyleSheet.create({
        textInput: {
          color: '#111827',
          fontSize: 16,
        }
      }).textInput,
      placeholder: StyleSheet.create({
        placeholder: {
          color: '#9CA3AF',
        }
      }).placeholder,
      focused: StyleSheet.create({
        focused: {
          borderColor: colors.primary,
          borderWidth: 2,
        }
      }).focused,
      error: StyleSheet.create({
        error: {
          borderColor: colors.error,
          borderWidth: 2,
        }
      }).error,
    },
    
    // 按钮样式
    button: {
      primary: StyleSheet.create({
        primary: {
          backgroundColor: colors.primary,
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 20,
        }
      }).primary,
      secondary: StyleSheet.create({
        secondary: {
          backgroundColor: '#F3F4F6',
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 20,
        }
      }).secondary,
      text: StyleSheet.create({
        text: {
          backgroundColor: 'transparent',
          paddingVertical: 12,
          paddingHorizontal: 20,
        }
      }).text,
      outline: StyleSheet.create({
        outline: {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 1,
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 20,
        }
      }).outline,
      disabled: StyleSheet.create({
        disabled: {
          backgroundColor: '#E5E7EB',
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 20,
        }
      }).disabled,
    },
    
    // 边框样式
    border: {
      primary: StyleSheet.create({
        primary: {
          borderColor: '#D1D5DB',
          borderWidth: StyleSheet.hairlineWidth,
        }
      }).primary,
      secondary: StyleSheet.create({
        secondary: {
          borderColor: '#E5E7EB',
          borderWidth: StyleSheet.hairlineWidth,
        }
      }).secondary,
      light: StyleSheet.create({
        light: {
          borderColor: '#F3F4F6',
          borderWidth: StyleSheet.hairlineWidth,
        }
      }).light,
    },
    
    // 分隔线样式
    separator: {
      horizontal: StyleSheet.create({
        horizontal: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: '#E5E7EB',
        }
      }).horizontal,
      vertical: StyleSheet.create({
        vertical: {
          width: StyleSheet.hairlineWidth,
          backgroundColor: '#E5E7EB',
        }
      }).vertical,
    },
    
    // 状态样式
    status: {
      success: StyleSheet.create({
        success: {
          backgroundColor: colors.success,
          color: '#FFFFFF',
        }
      }).success,
      warning: StyleSheet.create({
        warning: {
          backgroundColor: colors.warning,
          color: '#FFFFFF',
        }
      }).warning,
      error: StyleSheet.create({
        error: {
          backgroundColor: colors.error,
          color: '#FFFFFF',
        }
      }).error,
      info: StyleSheet.create({
        info: {
          backgroundColor: colors.info,
          color: '#FFFFFF',
        }
      }).info,
    },
  };

  // Light Mode渐变样式
  const lightGradients = {
    primary: colors.gradients.vitaflow,
    secondary: colors.gradients.background,
    card: colors.gradients.card,
    brand: colors.gradients.vitaflow,
  };

  return {
    isDarkMode,
    styles: lightStyles,
    gradients: lightGradients,
  };
};

// 为了保持向后兼容性，保留原名称
export const useDarkModeStyles = useAllDarkModeStyles;

export default useAllDarkModeStyles;