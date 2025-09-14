/**
 * Web端位置不匹配检测Hook
 * 在Web应用启动时检测用户当前位置是否与设置的区域匹配
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

      console.log('Web端位置不匹配检测结果:', mismatchResult);

      // Web端特有：如果有不匹配且应该提醒，发送浏览器通知
      if (mismatchResult.shouldAlert && mismatchResult.currentRegion && mismatchResult.settingsRegion) {
        await UserRegionPreferences.notifyLocationMismatch(
          mismatchResult.currentRegion,
          mismatchResult.settingsRegion
        );
      }
      
    } catch (error) {
      console.error('Web端位置不匹配检测失败:', error);
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
      // Web端稍微延迟一点，等待页面完全加载
      const timer = setTimeout(() => {
        checkLocationMismatch();
      }, 3000); // 3秒延迟

      return () => clearTimeout(timer);
    }
  }, [enabled, checkOnMount]);

  // Web端特有：监听页面可见性变化
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      // 当页面重新变为可见时，检查位置
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          checkLocationMismatch();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  return {
    ...result,
    checkLocationMismatch,
    dismissAlert,
    resetCheck,
  };
};

/**
 * Web端条件性位置不匹配检测Hook
 */
export const useConditionalLocationMismatchDetection = (
  conditions: {
    userLoggedIn?: boolean;
    hasLocationPermission?: boolean;
    isFirstVisit?: boolean;
  } = {}
) => {
  const {
    userLoggedIn = true,
    hasLocationPermission = true,
    isFirstVisit = false,
  } = conditions;

  // Web端的检测条件
  const shouldEnable = userLoggedIn && !isFirstVisit;

  return useLocationMismatchDetection(shouldEnable, shouldEnable);
};