/**
 * 定位服务Hook - 集成权限管理、省电优化、无障碍支持
 */

import { useState, useEffect, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import LocationService, { LocationData, LocationPermissionStatus } from '../services/LocationService';

interface UseLocationServiceOptions {
  enableBackground?: boolean; // 是否启用后台定位（安心计划专用）
  enableGeofencing?: boolean; // 是否启用地理围栏
  lowPowerMode?: boolean; // 省电模式
}

export const useLocationService = (options: UseLocationServiceOptions = {}) => {
  const {
    enableBackground = false,
    enableGeofencing = false,
    lowPowerMode = false,
  } = options;

  // 状态管理
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>(
    LocationPermissionStatus.NOT_DETERMINED
  );
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  // 检查无障碍设置
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
  }, []);

  // 初始化权限检查
  useEffect(() => {
    checkInitialPermissions();
  }, []);

  const checkInitialPermissions = async () => {
    try {
      const status = await LocationService.checkPermissionStatus();
      setPermissionStatus(status);

      // 不再显示Banner，由App.tsx统一处理首次权限请求
      setShowPermissionBanner(false);
    } catch (err) {
      setError('检查定位权限失败');
    }
  };

  // 请求前台权限
  const requestForegroundPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const granted = await LocationService.requestForegroundPermission();
      
      if (granted) {
        setPermissionStatus(LocationPermissionStatus.GRANTED_FOREGROUND);
        setShowPermissionBanner(false);
        setError(null);

        // 自动获取一次位置
        await getCurrentLocation();
        return true;
      } else {
        setPermissionStatus(LocationPermissionStatus.DENIED);
        // 不在这里弹Alert，由调用方决定是否显示
        return false;
      }
    } catch (err) {
      setError('请求定位权限失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 请求后台权限（仅安心计划）
  const requestBackgroundPermission = useCallback(async () => {
    if (!enableBackground) {
      console.warn('后台定位权限仅在安心计划中可用');
      return false;
    }

    try {
      setIsLoading(true);
      const granted = await LocationService.requestBackgroundPermission();
      
      if (granted) {
        setPermissionStatus(LocationPermissionStatus.GRANTED_ALWAYS);
        setError(null);
        return true;
      } else {
        LocationService.showSettingsAlert();
        return false;
      }
    } catch (err) {
      setError('请求后台定位权限失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enableBackground]);

  // 获取当前位置
  const getCurrentLocation = useCallback(async (highAccuracy: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const location = await LocationService.getCurrentLocation({
        useCache: true,
        highAccuracy: lowPowerMode ? false : highAccuracy,
        timeout: lowPowerMode ? 20000 : 15000,
      });
      
      if (location) {
        setCurrentLocation(location);
        return location;
      } else {
        setError('获取位置失败');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '定位服务异常');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [lowPowerMode]);

  // 创建地理围栏
  const createGeofence = useCallback(async (
    identifier: string,
    latitude: number,
    longitude: number,
    radius: number = 100
  ) => {
    if (!enableGeofencing) {
      console.warn('地理围栏功能未启用');
      return false;
    }

    if (permissionStatus !== LocationPermissionStatus.GRANTED_ALWAYS) {
      console.warn('地理围栏需要后台定位权限');
      return false;
    }

    return await LocationService.createGeofence({
      identifier,
      latitude,
      longitude,
      radius,
    });
  }, [enableGeofencing, permissionStatus]);

  // 删除地理围栏
  const removeGeofence = useCallback(async (identifier: string) => {
    return await LocationService.removeGeofence(identifier);
  }, []);

  // 关闭权限提示条
  const dismissPermissionBanner = useCallback(() => {
    setShowPermissionBanner(false);
  }, []);

  // 计算两点距离
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // 格式化距离显示
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }, []);

  return {
    // 状态
    permissionStatus,
    currentLocation,
    isLoading,
    error,
    showPermissionBanner,
    isReduceMotionEnabled,
    
    // 方法
    requestForegroundPermission,
    requestBackgroundPermission,
    getCurrentLocation,
    createGeofence,
    removeGeofence,
    dismissPermissionBanner,
    calculateDistance,
    formatDistance,
    
    // 辅助状态
    hasLocation: !!currentLocation,
    hasPermission: permissionStatus === LocationPermissionStatus.GRANTED_FOREGROUND || 
                   permissionStatus === LocationPermissionStatus.GRANTED_ALWAYS,
    hasBackgroundPermission: permissionStatus === LocationPermissionStatus.GRANTED_ALWAYS,
  };
};