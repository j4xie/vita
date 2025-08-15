/**
 * Hermes 优化主题系统 - 高性能版
 * 使用静态配置和优化的对象结构，充分利用 Hermes 性能优势
 */

import * as core from './core';

// 直接从核心配置创建静态主题对象
export const theme = {
  // 核心配置 - 直接引用，避免动态操作
  colors: core.CORE_COLORS,
  spacing: core.CORE_SPACING,
  borderRadius: core.CORE_BORDER_RADIUS,
  typography: core.CORE_TYPOGRAPHY,
  touchTarget: core.CORE_TOUCH_TARGET,
  liquidGlass: core.CORE_LIQUID_GLASS,
  shadows: core.CORE_SHADOWS,
  animations: core.CORE_ANIMATIONS,
  gestures: core.CORE_GESTURES,
  layout: core.CORE_LAYOUT,
  platformOptimizations: core.CORE_PLATFORM_OPTIMIZATIONS,
  
  // 性能配置 - v1.1 简化版本
  performance: {
    flatList: {
      removeClippedSubviews: true,
      windowSize: 12,
      initialNumToRender: 8,
      maxToRenderPerBatch: 5,
      updateCellsBatchingPeriod: 50,
    },
    image: {
      formats: ['webp', 'avif', 'jpg'] as const,
      skeletonDuration: 1100,
      loadingTimeout: 300,
    },
  },
};

/**
 * 简化的主题Hook - 直接返回静态对象
 */
export const useTheme = () => theme;

/**
 * 主题性能优化工具（Hermes 优化版）
 */
export const optimizeThemeForHermes = () => {
  // Hermes 自动优化，无需手动处理
  return theme;
};

// 类型定义
export type Theme = {
  colors: core.CoreColors;
  spacing: core.CoreSpacing;
  borderRadius: core.CoreBorderRadius;
  typography: core.CoreTypography;
  touchTarget: core.CoreTouchTarget;
  liquidGlass: core.CoreLiquidGlass;
  shadows: core.CoreShadows;
  animations: core.CoreAnimations;
  gestures: core.CoreGestures;
  layout: core.CoreLayout;
  performance: any;
};

// 向后兼容的导出 - 直接从核心配置导出
export const colors = core.CORE_COLORS;
export const typography = core.CORE_TYPOGRAPHY;
export * from './core';