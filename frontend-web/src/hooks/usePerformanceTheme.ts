import { useMemo } from 'react';
import { usePerformanceMode, getPerformanceAdjustedTheme } from '../context/PerformanceContext';
import { theme as baseTheme } from '../theme';

/**
 * V1.1 规范: 性能优化主题 Hook
 * 根据性能设置动态调整主题
 */
export const usePerformanceTheme = () => {
  const { settings } = usePerformanceMode();
  
  const adjustedTheme = useMemo(() => {
    return getPerformanceAdjustedTheme(baseTheme, settings);
  }, [settings]);
  
  return adjustedTheme;
};

/**
 * 性能优化的样式工厂
 * 根据性能设置返回条件样式
 */
export const usePerformanceStyles = () => {
  const { settings } = usePerformanceMode();
  
  return {
    // 条件阴影
    conditionalShadow: (shadowStyle: any) => {
      return settings.enableShadows ? shadowStyle : {};
    },
    
    // 条件模糊背景
    conditionalBlur: (blurStyle: any, fallbackStyle: any) => {
      return settings.enableBlur ? blurStyle : fallbackStyle;
    },
    
    // 条件玻璃效果
    conditionalGlass: (glassStyle: any, opaqueStyle: any) => {
      return settings.enableGlassEffects ? glassStyle : opaqueStyle;
    },
    
    // 简化的动画时长
    animationDuration: (duration: number) => {
      return settings.reducedMotion ? Math.min(duration * 0.5, 150) : duration;
    },
    
    // 条件透明度
    conditionalOpacity: (opacity: number) => {
      return settings.simplifiedUI ? Math.min(opacity + 0.2, 1) : opacity;
    },
  };
};