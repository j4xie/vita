import { useState, useEffect } from 'react';
import { Platform, Dimensions, AccessibilityInfo } from 'react-native';
import { Glass } from '../ui/glass/GlassTheme';

interface GlassPerformanceConfig {
  shouldUseBlur: boolean;
  blurIntensity: number;
  shouldUseGradients: boolean;
  shouldUseAnimations: boolean;
  shouldUseShadows: boolean;
  fallbackBackground: string;
  fallbackBorder: string;
}

export const useGlassPerformance = (): GlassPerformanceConfig => {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] = useState(false);
  
  // 检查可访问性设置
  useEffect(() => {
    const checkAccessibilitySettings = async () => {
      try {
        const [reduceMotion, reduceTransparency] = await Promise.all([
          AccessibilityInfo.isReduceMotionEnabled(),
          Platform.OS === 'ios' 
            ? AccessibilityInfo.isReduceTransparencyEnabled?.() || Promise.resolve(false)
            : Promise.resolve(false)
        ]);
        
        setIsReduceMotionEnabled(reduceMotion);
        setIsReduceTransparencyEnabled(reduceTransparency);
      } catch (error) {
        console.warn('Failed to check accessibility settings:', error);
      }
    };

    checkAccessibilitySettings();

    // 监听设置变化
    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    let reduceTransparencyListener: any;
    if (Platform.OS === 'ios' && AccessibilityInfo.addEventListener) {
      reduceTransparencyListener = AccessibilityInfo.addEventListener(
        'reduceTransparencyChanged',
        setIsReduceTransparencyEnabled
      );
    }

    return () => {
      reduceMotionListener?.remove();
      reduceTransparencyListener?.remove();
    };
  }, []);

  // 设备性能评估
  const getDevicePerformanceLevel = (): 'high' | 'medium' | 'low' => {
    const { width, height } = Dimensions.get('window');
    const pixelCount = width * height;
    
    if (Platform.OS === 'ios') {
      // iOS设备通常性能较好，但考虑老设备
      if (pixelCount > 2000000) return 'high';    // iPhone 12 Pro及以上
      if (pixelCount > 1500000) return 'medium';  // iPhone X-11系列
      return 'low';                               // iPhone 8及以下
    } else {
      // Android设备性能差异较大，保守评估
      if (pixelCount > 2500000) return 'medium';  // 高分辨率Android
      return 'low';                               // 大部分Android设备
    }
  };

  const performanceLevel = getDevicePerformanceLevel();
  const isAndroid = Platform.OS === 'android';

  // 生成性能配置
  const config: GlassPerformanceConfig = {
    // 是否使用模糊效果
    shouldUseBlur: !isReduceTransparencyEnabled && (
      Platform.OS === 'ios' || 
      (isAndroid && performanceLevel !== 'low')
    ),
    
    // 模糊强度调整
    blurIntensity: isReduceTransparencyEnabled ? 0 : (
      isAndroid 
        ? Math.max(16, Glass.blur - 10) // Android降低10点强度
        : Glass.blur
    ),
    
    // 是否使用渐变
    shouldUseGradients: performanceLevel !== 'low',
    
    // 是否使用动画
    shouldUseAnimations: !isReduceMotionEnabled && performanceLevel !== 'low',
    
    // 是否使用阴影
    shouldUseShadows: Platform.OS === 'ios' && performanceLevel === 'high',
    
    // 降级回退样式
    fallbackBackground: isReduceTransparencyEnabled 
      ? Glass.system.backgroundFallback 
      : Glass.overlayBottom,
    
    fallbackBorder: isReduceTransparencyEnabled 
      ? Glass.system.borderFallback 
      : 'transparent',
  };

  return config;
};

export default useGlassPerformance;