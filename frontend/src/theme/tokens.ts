/**
 * Liquid-Glass 移动端 UI/UX 规范 v1.2（iPhone 16 Pro 优化版）
 * 增强设计令牌系统 - 基于核心配置扩展
 * 所有尺寸使用 pt（RN 的 dp），自动适配安全区 & 动态岛
 */

import { Platform } from 'react-native';
import * as core from './core';

// 基础系统 - 基于核心配置
export const colors = core.CORE_COLORS;
export const liquidGlass = core.CORE_LIQUID_GLASS;
export const shadows = core.CORE_SHADOWS;
export const typography = core.CORE_TYPOGRAPHY;
export const borderRadius = core.CORE_BORDER_RADIUS;
export const spacing = core.CORE_SPACING;
export const animations = core.CORE_ANIMATIONS;
export const gestures = core.CORE_GESTURES;
export const touchTarget = core.CORE_TOUCH_TARGET;
export const layout = core.CORE_LAYOUT;

// 性能配置 - 扩展配置（可选的增强特性）
export const performance = {
  // 列表优化配置
  flatList: {
    removeClippedSubviews: true,
    windowSize: 12,
    initialNumToRender: 8,
    maxToRenderPerBatch: 5,
    updateCellsBatchingPeriod: 50,
  },
  
  // 图片优化
  image: {
    formats: ['webp', 'avif', 'jpg'] as const,
    skeletonDuration: 1100, // shimmer 动画时长
    loadingTimeout: 300,    // 骨架屏显示阈值
  },
  
  // 降级策略
  degradation: core.CORE_LIQUID_GLASS.degradation,
} as const;

// 平台特定优化 - 基于核心配置
export const platformOptimizations = core.CORE_PLATFORM_OPTIMIZATIONS;

// 导出完整的 v1.2 设计令牌 - 安全检查版本
export const designTokens = {
  colors: colors || {},
  liquidGlass: liquidGlass || {},
  shadows: shadows || {},
  typography: typography || {},
  borderRadius: borderRadius || {},
  spacing: spacing || {},
  animations: animations || {},
  gestures: gestures || {},
  touchTarget: touchTarget || {},
  layout: layout || {},
  performance: performance || {},
  platformOptimizations: platformOptimizations || {},
} as const;

export type DesignTokens = typeof designTokens;