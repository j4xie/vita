/**
 * 地域检测服务 - 自动判断用户所在地域（中国/美国）
 * 支持GPS定位检测和IP地址检测两种方式
 */

import LocationService, { LocationData } from './LocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RegionCode = 'zh' | 'en'; // zh-中国，en-美国

export interface RegionDetectionResult {
  region: RegionCode;
  confidence: 'high' | 'medium' | 'low'; // 检测可信度
  method: 'gps' | 'ip' | 'default'; // 检测方法
  location?: {
    country: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  error?: string;
}

interface IPLocationResponse {
  // 通用字段
  country_code?: string;
  country_name?: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  ip?: string;
  
  // 新增API的特殊字段
  // api.country.is
  country_name_official?: string;
  // geojs.io
  name?: string; // 国家名称
  code?: string; // 国家代码
}

// 预计算的时区映射表 - O(1)查询优化
const TIMEZONE_REGION_MAP = new Map<string, { region: RegionCode; confidence: 'high' | 'medium' | 'low'; country: string }>([
  // 中国及港澳台时区（高置信度）
  ['Asia/Shanghai', { region: 'zh', confidence: 'high', country: 'China' }],
  ['Asia/Beijing', { region: 'zh', confidence: 'high', country: 'China' }],
  ['Asia/Chongqing', { region: 'zh', confidence: 'high', country: 'China' }],
  ['Asia/Harbin', { region: 'zh', confidence: 'high', country: 'China' }],
  ['Asia/Hong_Kong', { region: 'zh', confidence: 'high', country: 'Hong Kong' }],
  ['Asia/Macao', { region: 'zh', confidence: 'high', country: 'Macao' }],
  ['Asia/Taipei', { region: 'zh', confidence: 'high', country: 'Taiwan' }],
  ['Asia/Urumqi', { region: 'zh', confidence: 'high', country: 'China' }],
  
  // 美国时区（高置信度）
  ['America/New_York', { region: 'en', confidence: 'high', country: 'United States' }],
  ['America/Los_Angeles', { region: 'en', confidence: 'high', country: 'United States' }],
  ['America/Chicago', { region: 'en', confidence: 'high', country: 'United States' }],
  ['America/Denver', { region: 'en', confidence: 'high', country: 'United States' }],
  ['America/Phoenix', { region: 'en', confidence: 'high', country: 'United States' }],
  ['America/Anchorage', { region: 'en', confidence: 'high', country: 'United States' }],
  ['Pacific/Honolulu', { region: 'en', confidence: 'high', country: 'United States' }],
  
  // 亚洲其他地区（中等置信度）
  ['Asia/Tokyo', { region: 'zh', confidence: 'medium', country: 'Japan' }],
  ['Asia/Seoul', { region: 'zh', confidence: 'medium', country: 'South Korea' }],
  ['Asia/Singapore', { region: 'zh', confidence: 'medium', country: 'Singapore' }],
]);

class RegionDetectionService {
  private static instance: RegionDetectionService;
  private cachedResult: RegionDetectionResult | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存
  private readonly IP_API_TIMEOUT = 1000; // IP检测1秒超时（极限优化）
  private readonly GPS_TIMEOUT = 3000; // GPS检测3秒超时（极限优化）
  private readonly ULTRA_FAST_TIMEOUT = 500; // 500ms极速检测
  private readonly STORAGE_KEY = 'region_detection_cache';

  private constructor() {}

  static getInstance(): RegionDetectionService {
    if (!RegionDetectionService.instance) {
      RegionDetectionService.instance = new RegionDetectionService();
    }
    return RegionDetectionService.instance;
  }

  /**
   * 主要检测方法 - 优化的多层检测策略
   */
  async detectRegion(): Promise<RegionDetectionResult> {
    try {
      // Level 1: 检查缓存（最快）
      const cachedResult = await this.getCachedResultFromStorage();
      if (cachedResult) {
        console.log('🚀 使用缓存的地域检测结果');
        this.cachedResult = cachedResult;
        return cachedResult;
      }

      // Level 2: 时区推断（极快）
      const timezoneResult = this.detectByTimezone();
      if (timezoneResult.confidence === 'high') {
        console.log('⚡ 使用时区推断结果');
        await this.saveCachedResult(timezoneResult);
        return timezoneResult;
      }

      // Level 3: 并行IP检测（优化）
      console.log('🌍 启动并行IP地址检测...');
      const ipResult = await this.detectByIPParallel();
      if (ipResult && ipResult.confidence !== 'low') {
        this.cachedResult = ipResult;
        await this.saveCachedResult(ipResult);
        return ipResult;
      }

      // Level 4: 快速回退到默认值
      console.log('⚡ 使用默认地域设置（中国）');
      const defaultResult: RegionDetectionResult = {
        region: 'zh',
        confidence: 'medium', // 提高默认置信度
        method: 'default',
        location: { country: 'China' },
      };
      
      await this.saveCachedResult(defaultResult);
      return defaultResult;
    } catch (error) {
      console.error('地域检测失败:', error);
      const errorResult = {
        region: 'zh' as RegionCode,
        confidence: 'low' as const,
        method: 'default' as const,
        location: { country: 'China' },
        error: error.message,
      };
      await this.saveCachedResult(errorResult);
      return errorResult;
    }
  }

  /**
   * 通过GPS定位检测地域
   */
  private async detectByGPS(): Promise<RegionDetectionResult | null> {
    try {
      console.log('🌍 开始GPS地域检测...');
      
      // 检查定位权限
      const permissionStatus = await LocationService.checkPermissionStatus();
      if (permissionStatus === 'denied') {
        console.log('定位权限被拒绝，跳过GPS检测');
        return null;
      }

      // 获取当前位置（低功耗模式，快速检测）
      const location = await Promise.race([
        LocationService.getCurrentLocation({
          useCache: true,
          highAccuracy: false,
          timeout: this.GPS_TIMEOUT
        }),
        new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), this.GPS_TIMEOUT)
        )
      ]);

      if (!location) {
        console.log('GPS定位超时或失败');
        return null;
      }

      // 判断是否在中国境内
      const isInChina = this.isLocationInChina(location.latitude, location.longitude);
      
      const result: RegionDetectionResult = {
        region: isInChina ? 'zh' : 'en',
        confidence: 'high',
        method: 'gps',
        location: {
          country: isInChina ? 'China' : 'Other',
          city: location.address,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        }
      };

      console.log('🎯 GPS地域检测成功:', result);
      return result;
    } catch (error) {
      console.error('GPS地域检测失败:', error);
      return null;
    }
  }

  /**
   * 通过IP地址检测地域 - 并行多个API优化版
   */
  private async detectByIPParallel(): Promise<RegionDetectionResult | null> {
    try {
      console.log('🌐 开始并行IP地域检测...');
      
      // 多个超速免费API并行检测
      const apiPromises = [
        this.fetchIPLocation('https://api.country.is'), // 专门的国家检测，极快
        this.fetchIPLocation('https://ipapi.co/country_code/'), // 只返回国家代码，更快
        this.fetchIPLocation('https://get.geojs.io/v1/ip/country.json'), // 轻量级API
        this.fetchIPLocation('https://ipapi.co/json/'), // 原有主要API
      ];

      // 并行请求，取第一个成功的结果
      const raceResult = await Promise.race([
        ...apiPromises.map(p => p.catch(err => ({ error: err }))),
        new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), this.IP_API_TIMEOUT)
        )
      ]);

      if (!raceResult || 'error' in raceResult) {
        throw new Error('All IP APIs failed or timeout');
      }

      const data = raceResult as IPLocationResponse;
      const isChina = data.country_code === 'CN';
      
      const result: RegionDetectionResult = {
        region: isChina ? 'zh' : 'en',
        confidence: isChina ? 'high' : 'medium',
        method: 'ip',
        location: {
          country: data.country_name || data.country || 'Unknown',
          city: data.city,
          coordinates: data.latitude && data.longitude ? {
            latitude: data.latitude,
            longitude: data.longitude,
          } : undefined,
        }
      };

      console.log('🎯 并行IP检测成功:', result);
      return result;
    } catch (error) {
      console.error('IP地域检测失败:', error);
      return null;
    }
  }

  /**
   * 单个IP API请求封装 - 极速优化版
   */
  private async fetchIPLocation(url: string): Promise<IPLocationResponse> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PomeloX/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 统一不同 API 的响应格式
    const normalizedData: IPLocationResponse = {
      country_code: data.country_code || data.code || data.country || 'Unknown',
      country_name: data.country_name || data.name || data.country_name_official || 'Unknown',
      country: data.country || data.country_name || 'Unknown',
      city: data.city || 'Unknown',
      region: data.region,
      latitude: data.latitude || (data as any).lat,
      longitude: data.longitude || (data as any).lon || (data as any).lng,
      ip: data.ip
    };

    return normalizedData;
  }

  /**
   * 通过IP地址检测地域 - 原始单一API方法（保留作为备用）
   */
  private async detectByIP(): Promise<RegionDetectionResult | null> {
    try {
      console.log('🌐 开始IP地域检测...');
      
      const response = await Promise.race([
        fetch('https://ipapi.co/json/'),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('IP检测超时')), this.IP_API_TIMEOUT)
        )
      ]);

      if (!response.ok) {
        throw new Error(`IP API请求失败: ${response.status}`);
      }

      const data: IPLocationResponse = await response.json();
      
      const isChina = data.country_code === 'CN';
      
      const result: RegionDetectionResult = {
        region: isChina ? 'zh' : 'en',
        confidence: isChina ? 'high' : 'medium',
        method: 'ip',
        location: {
          country: data.country_name,
          city: data.city,
          coordinates: data.latitude && data.longitude ? {
            latitude: data.latitude,
            longitude: data.longitude,
          } : undefined,
        }
      };

      console.log('🎯 IP地域检测成功:', result);
      return result;
    } catch (error) {
      console.error('IP地域检测失败:', error);
      return null;
    }
  }

  /**
   * 通过设备时区极速推断地域（O(1)查询优化）
   */
  private detectByTimezone(): RegionDetectionResult {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('⏰ 设备时区:', timezone);

      // O(1) Map查询，极速执行
      const mappedResult = TIMEZONE_REGION_MAP.get(timezone);
      if (mappedResult) {
        const result: RegionDetectionResult = {
          ...mappedResult,
          method: 'default',
          location: {
            country: mappedResult.country,
            city: timezone.split('/').pop() || 'Unknown'
          }
        };
        
        // 验证结果合理性
        if (this.validateResult(result)) {
          console.log('⚡️ O(1)时区映射命中:', result);
          return result;
        }
      }

      // 回退策略：使用模式匹配
      let region: RegionCode;
      let confidence: 'high' | 'medium' | 'low';
      let country: string;

      if (timezone.startsWith('Asia/')) {
        region = 'zh';
        confidence = 'medium';
        country = 'Asia (Unknown)';
      } else if (timezone.startsWith('America/') || timezone.startsWith('US/') || timezone.startsWith('Pacific/')) {
        region = 'en';
        confidence = 'medium';
        country = 'Americas (Unknown)';
      } else {
        region = 'zh'; // 默认中国
        confidence = 'low';
        country = 'Unknown';
      }

      const result: RegionDetectionResult = {
        region,
        confidence,
        method: 'default',
        location: { 
          country,
          city: timezone.split('/').pop() || 'Unknown'
        }
      };

      console.log('⚡ 时区模式匹配结果:', result);
      return result;
    } catch (error) {
      console.error('时区推断失败:', error);
      return {
        region: 'zh',
        confidence: 'low',
        method: 'default',
        location: { country: 'China' }
      };
    }
  }

  /**
   * 判断GPS坐标是否在中国境内
   * 使用简化的中国边界判断（包含港澳台）
   */
  private isLocationInChina(latitude: number, longitude: number): boolean {
    try {
      // 检查坐标数值有效性
      if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
          isNaN(latitude) || isNaN(longitude) ||
          latitude < -90 || latitude > 90 ||
          longitude < -180 || longitude > 180) {
        console.warn('IP地域检测失败: 无效的坐标数据', { latitude, longitude });
        return false;
      }
    // 中国大陆及港澳台地区的大致边界
    const chinaBounds = {
      north: 55.8271, // 黑龙江最北
      south: 3.8520,  // 南海最南（包含南沙群岛）
      east: 135.0857, // 黑龙江最东
      west: 73.4994   // 新疆最西
    };

    // 基本边界检查
    if (latitude < chinaBounds.south || latitude > chinaBounds.north ||
        longitude < chinaBounds.west || longitude > chinaBounds.east) {
      return false;
    }

    // 特殊区域检查（港澳台）
    const specialRegions = [
      // 香港
      { name: 'HongKong', north: 22.6, south: 22.1, east: 114.5, west: 113.8 },
      // 澳门  
      { name: 'Macau', north: 22.25, south: 22.1, east: 113.65, west: 113.5 },
      // 台湾
      { name: 'Taiwan', north: 25.3, south: 21.9, east: 122.0, west: 119.3 }
    ];

    // 检查是否在特殊区域内
    try {
      for (const region of specialRegions) {
        if (latitude >= region.south && latitude <= region.north &&
            longitude >= region.west && longitude <= region.east) {
          return true;
        }
      }
    } catch (error) {
      console.warn('特殊区域检查出错:', error);
      // 出错时跳过特殊区域检查，继续基础检查
    }

    // 排除明显的海外区域（简单过滤）
    const overseasExclusions = [
      // 日本大致区域
      { north: 46, south: 30, east: 146, west: 129 },
      // 韩国大致区域  
      { north: 39, south: 33, east: 130, west: 124 },
      // 俄罗斯西伯利亚和远东地区
      { north: 72, south: 50, east: 180, west: 60 },
      // 印度北部（接近中国边境但属于印度）
      { north: 35, south: 25, east: 85, west: 72 },
    ];

    for (const exclusion of overseasExclusions) {
      if (latitude >= exclusion.south && latitude <= exclusion.north &&
          longitude >= exclusion.west && longitude <= exclusion.east) {
        return false;
      }
    }

      return true; // 在中国境内
    } catch (error) {
      console.error('IP地域检测出错:', error);
      // 出错时默认返回中国（保守做法）
      return true;
    }
  }

  /**
   * 从 AsyncStorage 获取缓存的检测结果
   */
  private async getCachedResultFromStorage(): Promise<RegionDetectionResult | null> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!cached) return null;

      const { result, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // 检查缓存是否过期
      if (now - timestamp > this.CACHE_DURATION) {
        console.log('⏰ 地域检测缓存已过期');
        await AsyncStorage.removeItem(this.STORAGE_KEY);
        return null;
      }

      console.log('📦 使用缓存的地域检测结果');
      return result as RegionDetectionResult;
    } catch (error) {
      console.error('读取缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存检测结果到 AsyncStorage
   */
  private async saveCachedResult(result: RegionDetectionResult): Promise<void> {
    try {
      const cacheData = {
        result,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
      this.cachedResult = result;
      console.log('📦 地域检测结果已缓存');
    } catch (error) {
      console.error('保存缓存失败:', error);
      // 保存失败不影响主流程
    }
  }

  /**
   * 获取缓存的检测结果（内存）
   */
  getCachedResult(): RegionDetectionResult | null {
    return this.cachedResult;
  }

  /**
   * 清除所有缓存
   */
  async clearCache(): Promise<void> {
    this.cachedResult = null;
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ 已清除地域检测缓存');
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  /**
   * 预检测 - App启动时后台运行
   */
  async preDetect(): Promise<void> {
    try {
      console.log('🔄 启动后台预检测...');
      // 静默检测，不阻塞主流程
      const result = await this.detectRegion();
      console.log('✅ 预检测完成:', result.region, result.confidence);
    } catch (error) {
      console.warn('预检测失败，不影响主流程:', error);
    }
  }

  /**
   * 快速地域检测（仅使用IP，用于快速判断）
   */
  async quickDetect(): Promise<RegionCode> {
    try {
      const result = await this.detectByIP();
      return result?.region || 'zh';
    } catch {
      return 'zh'; // 默认中国
    }
  }

  /**
   * 验证检测结果的合理性
   */
  private validateResult(result: RegionDetectionResult): boolean {
    // 基本验证
    if (!result.region || !['zh', 'en'].includes(result.region)) {
      return false;
    }

    // 置信度验证
    if (!['high', 'medium', 'low'].includes(result.confidence)) {
      return false;
    }

    return true;
  }
}

export default RegionDetectionService.getInstance();