/**
 * Web端用户区域偏好管理服务
 * 使用localStorage管理用户的地域设置、隐私条款签署状态等偏好信息
 */

import { WebAsyncStorage } from './WebStorageService';
import RegionDetectionService, { RegionCode } from './RegionDetectionService';

export type UserRegionCode = 'china' | 'usa';

export interface UserRegionPreferences {
  // 用户当前设置的区域
  currentRegion: UserRegionCode;
  // 用户注册时检测到的区域（用于对比）
  registrationRegion: UserRegionCode;
  // 已签署隐私条款的区域列表
  privacySignedRegions: UserRegionCode[];
  // 最后更新时间
  lastUpdated: number;
  // 用户是否手动设置过区域（区分自动检测和手动设置）
  isManuallySet: boolean;
  // 上次位置不匹配提醒的时间（用于避免频繁提醒）
  lastMismatchAlert?: number;
}

class UserRegionPreferencesService {
  private static instance: UserRegionPreferencesService;
  private readonly STORAGE_KEY = '@user_region_preferences_web';
  private readonly MISMATCH_ALERT_COOLDOWN = 24 * 60 * 60 * 1000; // 24小时冷却时间
  private cachedPreferences: UserRegionPreferences | null = null;

  private constructor() {}

  static getInstance(): UserRegionPreferencesService {
    if (!UserRegionPreferencesService.instance) {
      UserRegionPreferencesService.instance = new UserRegionPreferencesService();
    }
    return UserRegionPreferencesService.instance;
  }

  /**
   * 初始化用户区域偏好（首次注册或访问时调用）
   */
  async initializePreferences(detectedRegion?: RegionCode): Promise<UserRegionPreferences> {
    try {
      // 检查是否已经有偏好设置
      const existing = await this.getPreferences();
      if (existing) {
        console.log('用户区域偏好已存在，跳过初始化');
        return existing;
      }

      // 转换检测到的区域代码
      const userRegion = this.convertRegionCodeToUserRegion(
        detectedRegion || await this.detectCurrentRegion()
      );

      // 创建初始偏好
      const initialPreferences: UserRegionPreferences = {
        currentRegion: userRegion,
        registrationRegion: userRegion,
        privacySignedRegions: [], // 初始化为空，需要用户签署
        lastUpdated: Date.now(),
        isManuallySet: false,
      };

      await this.savePreferences(initialPreferences);
      console.log('Web端初始化用户区域偏好:', initialPreferences);
      
      return initialPreferences;
    } catch (error) {
      console.error('Web端初始化用户区域偏好失败:', error);
      // 返回默认偏好
      const defaultPreferences: UserRegionPreferences = {
        currentRegion: 'china',
        registrationRegion: 'china',
        privacySignedRegions: [],
        lastUpdated: Date.now(),
        isManuallySet: false,
      };
      
      await this.savePreferences(defaultPreferences);
      return defaultPreferences;
    }
  }

  /**
   * 获取用户区域偏好
   */
  async getPreferences(): Promise<UserRegionPreferences | null> {
    try {
      // 先检查内存缓存
      if (this.cachedPreferences) {
        return this.cachedPreferences;
      }

      const preferences = await WebAsyncStorage.getObject<UserRegionPreferences>(this.STORAGE_KEY);
      if (!preferences) {
        return null;
      }
      
      // 验证数据完整性
      if (!this.validatePreferences(preferences)) {
        console.warn('用户区域偏好数据不完整，需要重新初始化');
        return null;
      }

      this.cachedPreferences = preferences;
      return preferences;
    } catch (error) {
      console.error('获取用户区域偏好失败:', error);
      return null;
    }
  }

  /**
   * 保存用户区域偏好
   */
  async savePreferences(preferences: UserRegionPreferences): Promise<void> {
    try {
      preferences.lastUpdated = Date.now();
      await WebAsyncStorage.setObject(this.STORAGE_KEY, preferences);
      this.cachedPreferences = preferences;
      console.log('Web端保存用户区域偏好成功');
    } catch (error) {
      console.error('Web端保存用户区域偏好失败:', error);
      throw error;
    }
  }

  /**
   * 更新当前区域（用户手动切换时）
   */
  async updateCurrentRegion(newRegion: UserRegionCode): Promise<UserRegionPreferences> {
    const preferences = await this.getPreferences();
    if (!preferences) {
      throw new Error('用户区域偏好未初始化');
    }

    const updated: UserRegionPreferences = {
      ...preferences,
      currentRegion: newRegion,
      isManuallySet: true,
      lastUpdated: Date.now(),
    };

    await this.savePreferences(updated);
    console.log(`Web端用户区域已更新为: ${newRegion}`);
    
    return updated;
  }

  /**
   * 标记用户已签署指定区域的隐私条款
   */
  async markPrivacySigned(region: UserRegionCode): Promise<UserRegionPreferences> {
    const preferences = await this.getPreferences();
    if (!preferences) {
      throw new Error('用户区域偏好未初始化');
    }

    // 避免重复添加
    if (!preferences.privacySignedRegions.includes(region)) {
      preferences.privacySignedRegions.push(region);
    }

    const updated = {
      ...preferences,
      privacySignedRegions: preferences.privacySignedRegions,
      lastUpdated: Date.now(),
    };

    await this.savePreferences(updated);
    console.log(`Web端用户已签署${region}区域隐私条款`);
    
    return updated;
  }

  /**
   * 检查用户是否已签署指定区域的隐私条款
   */
  async hasSignedPrivacyFor(region: UserRegionCode): Promise<boolean> {
    const preferences = await this.getPreferences();
    return preferences?.privacySignedRegions.includes(region) ?? false;
  }

  /**
   * 检查当前位置与设置的区域是否匹配（Web端专用）
   */
  async checkLocationMismatch(): Promise<{
    hasMismatch: boolean;
    currentRegion?: UserRegionCode;
    settingsRegion?: UserRegionCode;
    shouldAlert: boolean;
  }> {
    try {
      const preferences = await this.getPreferences();
      if (!preferences) {
        return { hasMismatch: false, shouldAlert: false };
      }

      // Web端检测当前位置
      const detectedRegion = await this.detectCurrentRegion();
      const currentUserRegion = this.convertRegionCodeToUserRegion(detectedRegion);
      
      // 比较当前位置和设置
      const hasMismatch = currentUserRegion !== preferences.currentRegion;
      
      // 检查是否应该显示提醒（避免频繁提醒）
      let shouldAlert = false;
      if (hasMismatch) {
        const now = Date.now();
        const lastAlert = preferences.lastMismatchAlert || 0;
        shouldAlert = (now - lastAlert) > this.MISMATCH_ALERT_COOLDOWN;
      }

      console.log('Web端位置匹配检查结果:', {
        detectedRegion,
        currentUserRegion,
        settingsRegion: preferences.currentRegion,
        hasMismatch,
        shouldAlert,
      });

      return {
        hasMismatch,
        currentRegion: currentUserRegion,
        settingsRegion: preferences.currentRegion,
        shouldAlert,
      };
    } catch (error) {
      console.error('Web端位置匹配检查失败:', error);
      return { hasMismatch: false, shouldAlert: false };
    }
  }

  /**
   * 更新位置不匹配提醒时间（用户看到提醒后调用）
   */
  async updateMismatchAlertTime(): Promise<void> {
    const preferences = await this.getPreferences();
    if (!preferences) return;

    const updated = {
      ...preferences,
      lastMismatchAlert: Date.now(),
    };

    await this.savePreferences(updated);
  }

  /**
   * 获取区域的显示名称
   */
  getRegionDisplayName(region: UserRegionCode, language: 'zh' | 'en' = 'zh'): string {
    const displayNames = {
      china: {
        zh: '中国',
        en: 'China',
      },
      usa: {
        zh: '美国',
        en: 'United States',
      },
    };

    return displayNames[region][language];
  }

  /**
   * 获取区域的图标
   */
  getRegionIcon(region: UserRegionCode): string {
    return region === 'china' ? '🇨🇳' : '🇺🇸';
  }

  /**
   * 清除所有偏好设置（用于测试或重置）
   */
  async clearPreferences(): Promise<void> {
    try {
      await WebAsyncStorage.removeItem(this.STORAGE_KEY);
      this.cachedPreferences = null;
      console.log('Web端已清除用户区域偏好设置');
    } catch (error) {
      console.error('Web端清除用户区域偏好失败:', error);
    }
  }

  /**
   * 检测当前区域
   */
  private async detectCurrentRegion(): Promise<RegionCode> {
    try {
      const result = await RegionDetectionService.detectRegion();
      return result.region;
    } catch (error) {
      console.error('Web端检测当前区域失败:', error);
      return 'zh'; // 默认中国
    }
  }

  /**
   * 转换区域代码：RegionCode -> UserRegionCode
   */
  private convertRegionCodeToUserRegion(regionCode: RegionCode): UserRegionCode {
    return regionCode === 'zh' ? 'china' : 'usa';
  }

  /**
   * 验证偏好设置数据的完整性
   */
  private validatePreferences(preferences: any): boolean {
    if (!preferences || typeof preferences !== 'object') {
      return false;
    }

    const required = ['currentRegion', 'registrationRegion', 'privacySignedRegions', 'lastUpdated', 'isManuallySet'];
    for (const field of required) {
      if (!(field in preferences)) {
        return false;
      }
    }

    // 验证区域代码有效性
    const validRegions = ['china', 'usa'];
    if (!validRegions.includes(preferences.currentRegion) || 
        !validRegions.includes(preferences.registrationRegion)) {
      return false;
    }

    // 验证已签署区域列表
    if (!Array.isArray(preferences.privacySignedRegions)) {
      return false;
    }

    return true;
  }

  /**
   * 获取用户当前区域（快速访问）
   */
  async getCurrentRegion(): Promise<UserRegionCode> {
    const preferences = await this.getPreferences();
    return preferences?.currentRegion || 'china';
  }

  /**
   * 获取用户注册时的区域（快速访问）
   */
  async getRegistrationRegion(): Promise<UserRegionCode> {
    const preferences = await this.getPreferences();
    return preferences?.registrationRegion || 'china';
  }

  /**
   * 检查用户是否手动设置过区域
   */
  async isManuallySet(): Promise<boolean> {
    const preferences = await this.getPreferences();
    return preferences?.isManuallySet ?? false;
  }

  /**
   * 导出设置（用于备份或调试）
   */
  async exportPreferences(): Promise<string> {
    const preferences = await this.getPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * 导入设置（用于恢复或测试）
   */
  async importPreferences(preferencesJson: string): Promise<void> {
    try {
      const preferences = JSON.parse(preferencesJson);
      if (!this.validatePreferences(preferences)) {
        throw new Error('导入的偏好设置格式无效');
      }
      
      await this.savePreferences(preferences);
      console.log('Web端用户区域偏好导入成功');
    } catch (error) {
      console.error('Web端用户区域偏好导入失败:', error);
      throw error;
    }
  }

  /**
   * Web端特有：通过浏览器通知API提醒用户
   */
  async notifyLocationMismatch(currentRegion: UserRegionCode, settingsRegion: UserRegionCode): Promise<void> {
    try {
      // 检查浏览器通知权限
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('位置变化提醒', {
          body: `检测到您的位置从${this.getRegionDisplayName(settingsRegion)}变为${this.getRegionDisplayName(currentRegion)}，建议更新设置`,
          icon: '/favicon.ico',
          badge: '/badge-icon.png',
          tag: 'region-mismatch',
        });

        // 3秒后自动关闭
        setTimeout(() => notification.close(), 3000);
      }
    } catch (error) {
      console.error('Web端通知失败:', error);
    }
  }

  /**
   * 请求浏览器通知权限
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('浏览器不支持通知');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        console.warn('通知权限被拒绝');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }
}

export default UserRegionPreferencesService.getInstance();