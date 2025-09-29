import { Platform } from 'react-native';
import { RESTRAINED_COLORS } from '../theme/core';

/**
 * V2.0 克制化颜色系统Hook
 * 处理深色模式适配和Android降级策略
 */
export const useRestrainedColors = () => {
  const isDarkMode = false;
  const isAndroid = Platform.OS === 'android';

  // L1容器配置
  const getL1Container = () => ({
    background: RESTRAINED_COLORS.L1_CONTAINER.background.light,
    border: {
      color: RESTRAINED_COLORS.L1_CONTAINER.border.color.light,
      width: RESTRAINED_COLORS.L1_CONTAINER.border.width,
    },
    innerRim: RESTRAINED_COLORS.L1_CONTAINER.innerRim.light,
    shadow: RESTRAINED_COLORS.L1_CONTAINER.shadow,
    borderRadius: RESTRAINED_COLORS.L1_CONTAINER.borderRadius,
  });

  // L2品牌强调配置
  const getL2Emphasis = () => {
    const baseConfig = {
      background: RESTRAINED_COLORS.L2_EMPHASIS.background.light,
      border: {
        color: RESTRAINED_COLORS.L2_EMPHASIS.border.color.light,
        width: RESTRAINED_COLORS.L2_EMPHASIS.border.width,
      },
      textColor: RESTRAINED_COLORS.L2_EMPHASIS.textColor.light,
      shadow: RESTRAINED_COLORS.L2_EMPHASIS.shadow,
      borderRadius: RESTRAINED_COLORS.L2_EMPHASIS.borderRadius,
    };

    // Android降级策略 - 纯色替代
    if (isAndroid) {
      return {
        ...baseConfig,
        background: RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.background,
        border: {
          ...baseConfig.border,
          color: RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.border,
        },
        textColor: RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.textColor,
        pressEffect: RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.pressEffect,
      };
    }

    return baseConfig;
  };

  // Dawn胶囊配置
  const getDawnPill = (size: 'small' | 'medium' | 'large' = 'medium') => {
    const pillConfig = RESTRAINED_COLORS.DAWN_PILL[size];
    
    // Android降级策略
    if (isAndroid) {
      return {
        ...pillConfig,
        background: RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.background,
        border: RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.border,
        textColor: RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.textColor,
      };
    }

    return pillConfig;
  };

  // FAB系统配置
  const getFABSystem = () => ({
    container: {
      ...RESTRAINED_COLORS.FAB_SYSTEM.container,
      background: RESTRAINED_COLORS.L1_CONTAINER.background.light,
      border: RESTRAINED_COLORS.L1_CONTAINER.border.color.light,
    },
    icon: {
      ...RESTRAINED_COLORS.FAB_SYSTEM.icon,
      background: isAndroid 
        ? RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.background
        : RESTRAINED_COLORS.FAB_SYSTEM.icon.background,
      border: isAndroid
        ? RESTRAINED_COLORS.ANDROID_FALLBACK.L2_SOLID.border
        : RESTRAINED_COLORS.FAB_SYSTEM.icon.border,
    },
    glow: RESTRAINED_COLORS.FAB_SYSTEM.glow,
    externalShadow: RESTRAINED_COLORS.FAB_SYSTEM.externalShadow,
    rays: RESTRAINED_COLORS.FAB_SYSTEM.rays,
  });

  // 照片遮罩配置
  const getPhotoOverlay = () => RESTRAINED_COLORS.PHOTO_OVERLAY;

  // 平台信息
  const getPlatformInfo = () => ({
    isDarkMode,
    isAndroid,
    shouldUseBlur: !RESTRAINED_COLORS.ANDROID_FALLBACK.disableBlur || !isAndroid,
    maxShadow: isAndroid ? RESTRAINED_COLORS.ANDROID_FALLBACK.maxShadow : 'lg',
  });

  return {
    getL1Container,
    getL2Emphasis,
    getDawnPill,
    getFABSystem,
    getPhotoOverlay,
    getPlatformInfo,
    
    // 便捷访问
    isDarkMode,
    isAndroid,
  };
};

export default useRestrainedColors;