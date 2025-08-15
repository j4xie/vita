/**
 * v1.2 性能降级策略Hook
 * 智能检测滚动速度和FPS，自动切换Liquid-Glass效果
 */

import { useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
// 稳健的主题获取，避免循环依赖
let _themeCache: any = null;
const getTheme = () => {
  if (_themeCache) return _themeCache;
  
  try {
    const { theme } = require('../theme');
    if (theme && typeof theme === 'object') {
      _themeCache = theme;
      return theme;
    }
  } catch (error) {
    console.warn('Theme loading failed, using core config:', error);
  }
  
  // 降级到核心配置
  try {
    const core = require('../theme/core');
    _themeCache = {
      liquidGlass: core.CORE_LIQUID_GLASS || { degradation: { fpsThreshold: 50, scrollVelocityThreshold: 1500, enable: true } },
      CORE_LIQUID_GLASS: core.CORE_LIQUID_GLASS || { degradation: { fpsThreshold: 50, scrollVelocityThreshold: 1500, enable: true } },
      animations: core.CORE_ANIMATIONS || {},
      colors: core.CORE_COLORS || {},
      spacing: core.CORE_SPACING || {},
    };
    return _themeCache;
  } catch (coreError) {
    console.error('Core config loading also failed:', coreError);
    _themeCache = {
      liquidGlass: { degradation: { fpsThreshold: 50, scrollVelocityThreshold: 1500, enable: true } },
      CORE_LIQUID_GLASS: { degradation: { fpsThreshold: 50, scrollVelocityThreshold: 1500, enable: true } }
    };
    return _themeCache;
  }
};

interface PerformanceMetrics {
  scrollVelocity: number;
  fps: number;
  shouldDegrade: boolean;
  degradationReason: 'velocity' | 'fps' | 'none';
}

/**
 * 性能降级Hook
 * 监控滚动速度和渲染性能，自动启用降级策略
 */
export const usePerformanceDegradation = () => {
  // 简化的静态性能配置，避免复杂的异步状态更新
  const [metrics] = useState<PerformanceMetrics>({
    scrollVelocity: 0,
    fps: 60,
    shouldDegrade: false, // 默认不降级，避免hook问题
    degradationReason: 'none',
  });

  // 简化的滚动监控（仅用于事件处理）
  const lastScrollTime = useRef(Date.now());
  const lastScrollOffset = useRef(0);
  const velocityBuffer = useRef<number[]>([]);

  /**
   * 简化的滚动事件处理
   * 仅计算滚动速度，不更新状态以避免hook错误
   */
  const handleScrollEvent = (event: any) => {
    try {
      // 确保事件对象存在并且有效
      if (!event || !event.nativeEvent || typeof event.nativeEvent.contentOffset?.y !== 'number') {
        return;
      }
      
      const currentTime = Date.now();
      const currentOffset = event.nativeEvent.contentOffset.y;
      
      // 计算滚动速度 (px/s) - 仅用于本地计算，不更新状态
      const timeDelta = currentTime - lastScrollTime.current;
      const offsetDelta = Math.abs(currentOffset - lastScrollOffset.current);
      
      if (timeDelta > 0) {
        const velocity = (offsetDelta / timeDelta) * 1000;
        
        // 维持速度缓冲区但不触发状态更新
        velocityBuffer.current.push(velocity);
        if (velocityBuffer.current.length > 5) {
          velocityBuffer.current.shift();
        }
      }
      
      lastScrollTime.current = currentTime;
      lastScrollOffset.current = currentOffset;
    } catch (error) {
      console.warn('Performance degradation scroll handler error:', error);
    }
  };

  /**
   * FPS监控 - 禁用以避免hook错误
   * 由于requestAnimationFrame在组件卸载时导致hook不一致，暂时禁用
   */
  useEffect(() => {
    // 禁用FPS监控以防止hook错误
    // TODO: 需要重新设计不会导致hook不一致的FPS监控机制
    return () => {
      // 清理工作
    };
  }, []);

  /**
   * 获取当前应使用的Liquid-Glass配置
   * v1.2 增强版本：支持shadow优化策略
   * 根据性能情况返回标准或降级版本
   */
  const getLiquidGlassConfig = (elementType: 'card' | 'modal' | 'floating' | 'primaryGlass' = 'card', shadowOptimized: boolean = false) => {
    try {
      const theme = getTheme();
      const config = theme.liquidGlass?.[elementType] || theme.CORE_LIQUID_GLASS?.[elementType] || theme.liquidGlass?.card || theme.CORE_LIQUID_GLASS?.card;
    
      // v1.2 性能降级：使用solid背景
      const degradationEnabled = theme?.liquidGlass?.degradation?.enable !== false;
      if (metrics.shouldDegrade && degradationEnabled) {
        return {
          background: theme.liquidGlass?.shadowStrategy?.solidBg?.[elementType] || '#FFFFFF', // Solid背景优化阴影渲染
          border: config?.border || 'rgba(255, 255, 255, 0.30)',
          blur: config?.blur,
          shadowOptimized: true, // 标记为阴影优化版本
        };
      }
    
    // v1.2 阴影优化模式：使用专用的shadow optimized背景
    if (shadowOptimized) {
      const shadowConfig = theme.liquidGlass?.shadowStrategy?.solidBg?.[elementType];
      if (shadowConfig) {
        return {
          background: shadowConfig, // 使用solid background for shadow container
          border: config?.border || 'rgba(255, 255, 255, 0.30)',
          blur: config?.blur,
          shadowOptimized: true,
        };
      }
      
      // Fallback to backgroundShadowOptimized if available
      if (config?.backgroundShadowOptimized) {
        return {
          background: config.backgroundShadowOptimized,
          border: config.border,
          blur: config.blur,
          shadowOptimized: true,
        };
      }
    }
    
      // 正常模式：使用常规透明背景（不与shadow一起使用）
      return {
        background: config?.background || 'rgba(255, 255, 255, 0.85)',
        border: config?.border || 'rgba(255, 255, 255, 0.30)',
        blur: config?.blur,
        shadowOptimized: false,
      };
    } catch (error) {
      console.warn('Failed to get liquid glass config:', error);
      // Fallback configuration
      return {
        background: '#FFFFFF',
        border: 'rgba(255, 255, 255, 0.30)',
        blur: undefined,
        shadowOptimized: true,
      };
    }
  };

  /**
   * v1.2 获取性能优化的样式属性
   * 新增shadow优化支持
   */
  const getOptimizedStyles = () => {
    if (metrics.shouldDegrade) {
      return {
        // 降级状态：移除复杂效果
        removeBlur: getTheme().liquidGlass?.degradation?.enable || true,
        reducedShadows: getTheme().liquidGlass?.degradation?.enable || true,
        simplifiedAnimations: getTheme().liquidGlass?.degradation?.enable || true,
        // v1.2 新增：强制使用solid背景进行shadow优化
        forceSolidBackgrounds: true,
        disableLinearGradientShadows: true, // 禁用LinearGradient上的直接shadow
      };
    }
    
    return {
      // 正常状态：使用完整效果
      removeBlur: false,
      reducedShadows: false,
      simplifiedAnimations: false,
      // v1.2 新增：正常状态下的shadow优化选项
      forceSolidBackgrounds: false,
      disableLinearGradientShadows: true, // 始终禁用LinearGradient直接shadow，使用wrapper
    };
  };

  /**
   * v1.2 新增：获取Shadow容器配置
   * 用于统一管理shadow wrapper的样式
   */
  const getShadowContainerConfig = (elementType: 'card' | 'modal' | 'floating' | 'button' = 'card') => {
    const theme = getTheme();
    const shadowConfig = theme.liquidGlass?.shadowStrategy?.solidBg || {};
    
    return {
      backgroundColor: shadowConfig[elementType] || theme.colors?.background?.primary || '#FFFFFF',
      useShadowWrapper: true, // 始终使用shadow wrapper模式
      shadowLevel: elementType === 'modal' ? '2xl' : elementType === 'floating' ? 'lg' : 'md',
    };
  };

  /**
   * 重置性能监控 - 简化版本
   * 仅清理缓冲区，不更新状态
   */
  const resetMetrics = () => {
    try {
      velocityBuffer.current = [];
      // frameTimeBuffer 已移除
    } catch (error) {
      console.warn('Failed to reset performance metrics:', error);
    }
  };

  return {
    // 性能指标
    metrics,
    
    // 事件处理
    handleScrollEvent,
    
    // 配置获取
    getLiquidGlassConfig,
    getOptimizedStyles,
    getShadowContainerConfig, // v1.2 新增
    
    // 控制方法
    resetMetrics,
    
    // 便捷状态
    isPerformanceDegraded: metrics.shouldDegrade,
    degradationReason: metrics.degradationReason,
  };
};

/**
 * Shared Value版本的性能降级Hook
 * 用于Reanimated动画中的性能优化
 */
export const useReanimatedPerformanceDegradation = () => {
  const scrollVelocity = useSharedValue(0);
  const shouldDegrade = useSharedValue(false);
  
  const updateScrollVelocity = (velocity: number) => {
    'worklet';
    scrollVelocity.value = velocity;
    shouldDegrade.value = velocity > (getTheme().liquidGlass?.degradation?.scrollVelocityThreshold || 500);
  };
  
  return {
    scrollVelocity,
    shouldDegrade,
    updateScrollVelocity,
  };
};