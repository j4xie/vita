/**
 * 定位优化策略提供者
 * 处理省电模式、无障碍支持、降级策略
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityInfo, AppState, AppStateStatus } from 'react-native';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';

interface LocationOptimizationContextType {
  // 省电策略
  isLowPowerMode: boolean;
  shouldUseCache: boolean;
  locationUpdateInterval: number;
  
  // 无障碍支持
  isReduceMotionEnabled: boolean;
  shouldShowMinimalAnimations: boolean;
  
  // 降级策略
  isPerformanceDegraded: boolean;
  shouldUseBasicLocationOnly: boolean;
}

const LocationOptimizationContext = createContext<LocationOptimizationContextType | null>(null);

interface LocationOptimizationProviderProps {
  children: ReactNode;
}

export const LocationOptimizationProvider: React.FC<LocationOptimizationProviderProps> = ({
  children,
}) => {
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  
  const { isPerformanceDegraded } = usePerformanceDegradation();

  // 检查省电模式
  useEffect(() => {
    const checkPowerMode = async () => {
      try {
        // 检测设备是否处于低电量模式
        // React Native没有直接的API，我们通过性能降级来推断
        setIsLowPowerMode(isPerformanceDegraded);
      } catch (error) {
        console.warn('检查省电模式失败:', error);
      }
    };

    checkPowerMode();
  }, [isPerformanceDegraded]);

  // 检查无障碍设置
  useEffect(() => {
    const checkAccessibility = async () => {
      try {
        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        setIsReduceMotionEnabled(reduceMotion);
      } catch (error) {
        console.warn('检查无障碍设置失败:', error);
      }
    };

    checkAccessibility();

    // 监听设置变化
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  // 监听应用状态变化
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription?.remove();
  }, []);

  // 计算优化策略
  const shouldUseCache = isLowPowerMode || appState !== 'active';
  const locationUpdateInterval = isLowPowerMode ? 60000 : 30000; // 1分钟 vs 30秒
  const shouldShowMinimalAnimations = isReduceMotionEnabled;
  const shouldUseBasicLocationOnly = isPerformanceDegraded || isLowPowerMode;

  const value: LocationOptimizationContextType = {
    // 省电策略
    isLowPowerMode,
    shouldUseCache,
    locationUpdateInterval,
    
    // 无障碍支持
    isReduceMotionEnabled,
    shouldShowMinimalAnimations,
    
    // 降级策略
    isPerformanceDegraded,
    shouldUseBasicLocationOnly,
  };

  return (
    <LocationOptimizationContext.Provider value={value}>
      {children}
    </LocationOptimizationContext.Provider>
  );
};

export const useLocationOptimization = (): LocationOptimizationContextType => {
  const context = useContext(LocationOptimizationContext);
  if (!context) {
    throw new Error('useLocationOptimization must be used within LocationOptimizationProvider');
  }
  return context;
};