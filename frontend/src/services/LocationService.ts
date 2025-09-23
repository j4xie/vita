/**
 * 定位服务 - 完整的权限管理和定位功能
 * 支持权限请求、一次性定位、地理围栏、省电优化
 */

import * as Location from 'expo-location';
import { Alert, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number; // 单位：米
}

export enum LocationPermissionStatus {
  DENIED = 'denied',
  GRANTED_FOREGROUND = 'granted_foreground',
  GRANTED_ALWAYS = 'granted_always',
  NOT_DETERMINED = 'not_determined',
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationData | null = null;
  private lastLocationTime: number = 0;
  private locationCache: Map<string, LocationData> = new Map();
  private watchId: string | null = null;
  private geofences: GeofenceRegion[] = [];
  
  // 缓存时间：5-10分钟
  private readonly CACHE_DURATION = 7 * 60 * 1000; // 7分钟
  private readonly LOCATION_TIMEOUT = 15000; // 15秒超时
  private readonly HIGH_ACCURACY_TIMEOUT = 10000; // 高精度10秒超时

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * 检查定位权限状态
   */
  async checkPermissionStatus(): Promise<LocationPermissionStatus> {
    try {
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();

      if (foregroundStatus === 'denied') {
        return LocationPermissionStatus.DENIED;
      }

      if (foregroundStatus === 'granted') {
        // 检查是否有后台定位权限
        const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
          return LocationPermissionStatus.GRANTED_ALWAYS;
        }
        return LocationPermissionStatus.GRANTED_FOREGROUND;
      }

      return LocationPermissionStatus.NOT_DETERMINED;
    } catch (error) {
      console.error('检查定位权限失败:', error);
      return LocationPermissionStatus.DENIED;
    }
  }

  /**
   * 请求前台定位权限（使用期间）
   */
  async requestForegroundPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('请求前台定位权限失败:', error);
      return false;
    }
  }

  /**
   * 请求后台定位权限（始终允许）- 仅在安心计划中使用
   */
  async requestBackgroundPermission(): Promise<boolean> {
    try {
      // 先确保有前台权限
      const foregroundGranted = await this.requestForegroundPermission();
      if (!foregroundGranted) {
        return false;
      }

      const { status } = await Location.requestBackgroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('请求后台定位权限失败:', error);
      return false;
    }
  }

  /**
   * 一次性定位（带缓存和超时）
   */
  async getCurrentLocation(options?: {
    useCache?: boolean;
    highAccuracy?: boolean;
    timeout?: number;
  }): Promise<LocationData | null> {
    const {
      useCache = true,
      highAccuracy = false,
      timeout = this.LOCATION_TIMEOUT
    } = options || {};

    try {
      // 检查权限
      const permissionStatus = await this.checkPermissionStatus();
      if (permissionStatus === LocationPermissionStatus.DENIED) {
        console.log('位置权限被拒绝，无法获取GPS定位');
        return null;
      }

      if (permissionStatus === LocationPermissionStatus.NOT_DETERMINED) {
        console.log('位置权限未确定，需要用户授权');
        return null;
      }

      // 使用缓存（如果启用且有效）
      if (useCache && this.currentLocation) {
        const now = Date.now();
        if (now - this.lastLocationTime < this.CACHE_DURATION) {
          console.log('使用缓存的定位数据');
          return this.currentLocation;
        }
      }

      // 获取新的定位 - 添加try-catch避免权限错误
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: highAccuracy 
            ? Location.Accuracy.BestForNavigation 
            : Location.Accuracy.Balanced,
          maximumAge: useCache ? this.CACHE_DURATION : 0,
          timeout: highAccuracy ? this.HIGH_ACCURACY_TIMEOUT : timeout,
        });
      } catch (locationError) {
        console.log('获取位置失败，可能是权限问题:', locationError);
        return null;
      }

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };

      // 更新缓存
      this.currentLocation = locationData;
      this.lastLocationTime = Date.now();

      // 可选：反向地理编码获取地址
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
        if (addresses.length > 0) {
          const address = addresses[0];
          locationData.address = `${address.city || address.subregion || address.region}`;
        }
      } catch (geocodeError) {
        console.warn('反向地理编码失败:', geocodeError);
      }

      return locationData;
    } catch (error) {
      console.error('获取定位失败:', error);
      return null;
    }
  }

  /**
   * 创建地理围栏
   */
  async createGeofence(region: GeofenceRegion): Promise<boolean> {
    try {
      // 检查是否有后台权限
      const permissionStatus = await this.checkPermissionStatus();
      if (permissionStatus !== LocationPermissionStatus.GRANTED_ALWAYS) {
        console.warn('地理围栏需要后台定位权限');
        return false;
      }

      // 添加到本地列表
      this.geofences.push(region);
      
      // 保存到本地存储
      await AsyncStorage.setItem('geofences', JSON.stringify(this.geofences));
      
      // 启动后台定位监听（如果尚未启动）
      await this.startBackgroundLocationUpdates();
      
      console.log(`地理围栏创建成功: ${region.identifier}`);
      return true;
    } catch (error) {
      console.error('创建地理围栏失败:', error);
      return false;
    }
  }

  /**
   * 删除地理围栏
   */
  async removeGeofence(identifier: string): Promise<boolean> {
    try {
      this.geofences = this.geofences.filter(fence => fence.identifier !== identifier);
      await AsyncStorage.setItem('geofences', JSON.stringify(this.geofences));
      
      console.log(`地理围栏删除成功: ${identifier}`);
      return true;
    } catch (error) {
      console.error('删除地理围栏失败:', error);
      return false;
    }
  }

  /**
   * 启动后台定位更新（用于地理围栏）
   */
  private async startBackgroundLocationUpdates(): Promise<void> {
    try {
      if (this.watchId) {
        return; // 已经在监听
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // 平衡精度和电量
          timeInterval: 30000, // 30秒更新间隔
          distanceInterval: 100, // 100米距离间隔
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );
    } catch (error) {
      console.error('启动后台定位失败:', error);
    }
  }

  /**
   * 处理定位更新（检查地理围栏）
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    const currentLocation: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      timestamp: location.timestamp,
    };

    // 检查是否进入或离开地理围栏
    this.checkGeofenceEvents(currentLocation);
    
    // 更新当前位置
    this.currentLocation = currentLocation;
    this.lastLocationTime = Date.now();
  }

  /**
   * 检查地理围栏事件
   */
  private checkGeofenceEvents(location: LocationData): void {
    this.geofences.forEach(fence => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        fence.latitude,
        fence.longitude
      );

      if (distance <= fence.radius) {
        // 进入地理围栏
        console.log(`进入地理围栏: ${fence.identifier}`);
        // TODO: 发送事件给应用
      }
    });
  }

  /**
   * 计算两点之间的距离（米）
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 停止定位监听
   */
  async stopLocationUpdates(): Promise<void> {
    if (this.watchId) {
      await Location.removeWatchAsync(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * 引导用户到设置页面
   */
  showSettingsAlert(): void {
    Alert.alert(
      '需要定位权限',
      '请在设置中允许访问位置信息，以获取附近的活动',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '去设置',
          onPress: () => {
            // 直接打开系统设置
            Linking.openSettings();
          }
        }
      ]
    );
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.currentLocation = null;
    this.lastLocationTime = 0;
    this.locationCache.clear();
  }

  /**
   * 获取当前缓存的位置
   */
  getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  /**
   * 检查是否支持高精度定位
   */
  async hasLocationHardware(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch {
      return false;
    }
  }

  /**
   * 省电模式：使用低精度定位
   */
  async getLowPowerLocation(): Promise<LocationData | null> {
    return await this.getCurrentLocation({
      useCache: true,
      highAccuracy: false,
      timeout: 20000 // 更长的超时时间
    });
  }
}

export default LocationService.getInstance();