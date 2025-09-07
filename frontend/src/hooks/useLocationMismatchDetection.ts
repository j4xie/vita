/**
 * 位置不匹配检测Hook
 * 在应用启动时检测用户当前位置是否与设置的区域匹配
 */

import { useState, useEffect } from 'react';
import UserRegionPreferences, { UserRegionCode } from '../services/UserRegionPreferences';

interface LocationMismatchDetectionResult {
  shouldShowAlert: boolean;
  currentRegion?: UserRegionCode;
  settingsRegion?: UserRegionCode;
  isChecking: boolean;
  error?: string;
}

export const useLocationMismatchDetection = (
  enabled: boolean = true,
  checkOnMount: boolean = true
) => {
  const [result, setResult] = useState<LocationMismatchDetectionResult>({
    shouldShowAlert: false,
    isChecking: false,
  });

  const checkLocationMismatch = async () => {
    if (!enabled) return;

    try {
      setResult(prev => ({ ...prev, isChecking: true, error: undefined }));

      // 检查位置不匹配
      const mismatchResult = await UserRegionPreferences.checkLocationMismatch();
      
      setResult({
        shouldShowAlert: mismatchResult.shouldAlert,
        currentRegion: mismatchResult.currentRegion,
        settingsRegion: mismatchResult.settingsRegion,
        isChecking: false,
      });

      console.log('位置不匹配检测结果:', mismatchResult);
      
    } catch (error) {
      console.error('位置不匹配检测失败:', error);
      setResult({
        shouldShowAlert: false,
        isChecking: false,
        error: error instanceof Error ? error.message : '检测失败',
      });
    }
  };

  const dismissAlert = async () => {
    try {
      // 更新提醒时间
      await UserRegionPreferences.updateMismatchAlertTime();
      
      setResult(prev => ({
        ...prev,
        shouldShowAlert: false,
      }));
    } catch (error) {
      console.error('更新提醒时间失败:', error);
    }
  };

  const resetCheck = () => {
    setResult({
      shouldShowAlert: false,
      isChecking: false,
    });
  };

  // 在组件挂载时自动检测
  useEffect(() => {
    if (checkOnMount && enabled) {
      // 延迟一点时间，避免阻塞应用启动
      const timer = setTimeout(() => {
        checkLocationMismatch();
      }, 2000); // 2秒延迟

      return () => clearTimeout(timer);
    }
  }, [enabled, checkOnMount]);

  return {
    ...result,
    checkLocationMismatch,
    dismissAlert,
    resetCheck,
  };
};

/**
 * 简化版本的位置不匹配检测Hook
 * 只在特定条件下启用检测
 */
export const useConditionalLocationMismatchDetection = (
  conditions: {
    userLoggedIn?: boolean;
    hasLocationPermission?: boolean;
    isFirstLaunch?: boolean;
  } = {}
) => {
  const {
    userLoggedIn = true,
    hasLocationPermission = true,
    isFirstLaunch = false,
  } = conditions;

  // 只有当用户已登录、有位置权限且不是首次启动时才启用检测
  const shouldEnable = userLoggedIn && hasLocationPermission && !isFirstLaunch;

  return useLocationMismatchDetection(shouldEnable, shouldEnable);
};