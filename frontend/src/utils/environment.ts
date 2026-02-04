/**
 * App端环境管理工具（React Native）
 * 支持测试环境和正式环境的动态切换
 * 注意：移动端环境配置
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Environment = 'development' | 'production';

export interface EnvironmentConfig {
  environment: Environment;
  displayName: string;
  apiUrl: string;
  wsUrl: string;
  debug: boolean;
  showDevMenu: boolean;
  testMode: boolean;
  analytics: boolean;
  firebaseConfig: {
    projectId: string;
    appId: string;
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    storageBucket: string;
    messagingSenderId: string;
  };
  imagesCdnUrl: string;
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnv: Environment;
  private readonly STORAGE_KEY = '@PomeloX:environment';
  
  private constructor() {
    // 初始化时从环境变量读取当前环境，环境变量优先级最高
    const envFromVariable = process.env.EXPO_PUBLIC_ENVIRONMENT as Environment;
    this.currentEnv = envFromVariable || 'production';

    // 调试日志
    console.log(`🔧 [Environment] 环境管理器初始化:`);
    console.log(`   环境变量: ${envFromVariable || 'undefined'}`);
    console.log(`   当前环境: ${this.currentEnv}`);

    // 只有在没有环境变量时才从AsyncStorage加载
    if (!envFromVariable) {
      console.log(`   将从AsyncStorage加载环境设置`);
      this.loadStoredEnvironment();
    } else {
      console.log(`   使用环境变量设置: ${envFromVariable}`);
    }
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * 从本地存储加载环境设置
   */
  private async loadStoredEnvironment(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored && (stored === 'development' || stored === 'production')) {
        this.currentEnv = stored as Environment;
      }
    } catch (error) {
      console.warn('Failed to load stored environment:', error);
    }
  }

  /**
   * 保存环境设置到本地存储
   */
  private async saveEnvironment(env: Environment): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, env);
    } catch (error) {
      console.warn('Failed to save environment:', error);
    }
  }

  /**
   * 获取当前环境
   */
  getCurrentEnvironment(): Environment {
    return this.currentEnv;
  }

  /**
   * 设置当前环境（开发时使用）
   */
  async setEnvironment(env: Environment): Promise<void> {
    this.currentEnv = env;
    await this.saveEnvironment(env);
    
    // 在开发模式下可以动态切换环境
    if (this.isDebugMode()) {
      console.log(`🌍 环境已切换到: ${this.getDisplayName()}`);
    }
  }

  /**
   * 获取环境显示名称
   */
  getDisplayName(): string {
    return this.currentEnv === 'development' ? '测试环境' : '正式环境';
  }

  /**
   * 获取API基础URL
   */
  getApiUrl(): string {
    const url = this.currentEnv === 'development'
      ? 'http://106.14.165.234:8085'  // 测试环境
      : 'https://www.vitaglobal.icu'; // 生产环境

    // 调试日志
    console.log(`🌍 [Environment] 当前环境: ${this.currentEnv}, API URL: ${url}`);

    return url;
  }

  /**
   * 获取WebSocket URL
   */
  getWsUrl(): string {
    return this.currentEnv === 'development'
      ? 'ws://106.14.165.234:8085/ws'   // 测试环境WebSocket
      : 'wss://www.vitaglobal.icu/ws'; // 生产环境WebSocket
  }

  /**
   * 是否为调试模式
   */
  isDebugMode(): boolean {
    return this.currentEnv === 'development';
  }

  /**
   * 是否显示开发菜单
   */
  shouldShowDevMenu(): boolean {
    return this.currentEnv === 'development';
  }

  /**
   * 是否为测试模式
   */
  isTestMode(): boolean {
    return this.currentEnv === 'development';
  }

  /**
   * 是否启用分析
   */
  isAnalyticsEnabled(): boolean {
    return this.currentEnv === 'production';
  }

  /**
   * 获取Firebase配置（针对移动端）
   */
  getFirebaseConfig() {
    const isProduction = this.currentEnv === 'production';
    const isIOS = Platform.OS === 'ios';
    
    return {
      projectId: isProduction ? 'pomelox' : 'pomelox-test',
      appId: isProduction 
        ? (isIOS ? '1:159140509374:ios:prod123' : '1:159140509374:android:prod123')
        : (isIOS ? '1:159140509374:ios:test123' : '1:159140509374:android:test123'),
      apiKey: isProduction 
        ? (isIOS ? 'AIzaSyProd123456789_iOS' : 'AIzaSyProd123456789_Android')
        : (isIOS ? 'AIzaSyTest123456789_iOS' : 'AIzaSyTest123456789_Android'),
      authDomain: isProduction ? 'pomelox.firebaseapp.com' : 'pomelox-test.firebaseapp.com',
      databaseURL: isProduction 
        ? 'https://pomelox-default-rtdb.firebaseio.com'
        : 'https://pomelox-test-default-rtdb.firebaseio.com',
      storageBucket: isProduction ? 'pomelox.appspot.com' : 'pomelox-test.appspot.com',
      messagingSenderId: '159140509374',
      measurementId: isProduction ? 'G-PROD123' : 'G-TEST123',
    };
  }

  /**
   * 获取图片CDN URL (Cloudflare R2)
   * 美国用户加载速度 <100ms
   */
  getImagesCdnUrl(): string {
    // 统一使用 vitaimage bucket
    return 'https://pub-9281f44aadcf48da8a2c7ac3df13f475.r2.dev';
  }

  /**
   * 获取完整环境配置
   */
  getConfig(): EnvironmentConfig {
    return {
      environment: this.currentEnv,
      displayName: this.getDisplayName(),
      apiUrl: this.getApiUrl(),
      wsUrl: this.getWsUrl(),
      debug: this.isDebugMode(),
      showDevMenu: this.shouldShowDevMenu(),
      testMode: this.isTestMode(),
      analytics: this.isAnalyticsEnabled(),
      firebaseConfig: this.getFirebaseConfig(),
      imagesCdnUrl: this.getImagesCdnUrl(),
    };
  }

  /**
   * 获取所有可用环境
   */
  getAvailableEnvironments(): { value: Environment; label: string }[] {
    return [
      { value: 'development', label: '测试环境' },
      { value: 'production', label: '正式环境' },
    ];
  }

  /**
   * 检查是否可以切换环境（仅在开发模式下允许）
   */
  canSwitchEnvironment(): boolean {
    return __DEV__ || this.isDebugMode();
  }

  /**
   * 获取环境信息用于显示
   */
  getEnvironmentInfo() {
    const config = this.getConfig();
    return {
      current: config.displayName,
      apiUrl: config.apiUrl,
      debug: config.debug,
      platform: Platform.OS,
      version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      buildDate: process.env.EXPO_PUBLIC_BUILD_DATE || new Date().toISOString(),
    };
  }

  /**
   * 重置到默认环境
   */
  async resetToDefault(): Promise<void> {
    await this.setEnvironment('production');
  }
}

// 导出单例实例
export const environmentManager = EnvironmentManager.getInstance();

// 便捷导出函数
export const getCurrentEnvironment = () => environmentManager.getCurrentEnvironment();
export const getApiUrl = () => environmentManager.getApiUrl();
export const getWsUrl = () => environmentManager.getWsUrl();
export const isDebugMode = () => environmentManager.isDebugMode();
export const getFirebaseConfig = () => environmentManager.getFirebaseConfig();
export const getImagesCdnUrl = () => environmentManager.getImagesCdnUrl();
export const getEnvironmentConfig = () => environmentManager.getConfig();

// 默认导出
export default environmentManager;