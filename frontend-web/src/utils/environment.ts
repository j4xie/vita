/**
 * Web端环境管理工具
 * 支持测试环境和正式环境的动态切换
 */

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
  };
  imagesCdnUrl: string;
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnv: Environment;
  
  private constructor() {
    // 初始化时从环境变量读取当前环境
    this.currentEnv = (process.env.EXPO_PUBLIC_ENVIRONMENT as Environment) || 'production';
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
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
  setEnvironment(env: Environment): void {
    this.currentEnv = env;
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
    // 🚨 生产环境强制使用生产API - 修复Mixed Content错误
    return 'https://www.vitaglobal.icu';
  }

  /**
   * 获取WebSocket URL
   */
  getWsUrl(): string {
    return this.currentEnv === 'development'
      ? 'wss://test.vitaglobal.icu/ws'
      : 'wss://www.vitaglobal.icu/ws';
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
   * 获取Firebase配置
   */
  getFirebaseConfig() {
    const isProduction = this.currentEnv === 'production';
    
    return {
      projectId: isProduction ? 'pomelox' : 'pomelox-test',
      appId: isProduction ? '1:159140509374:web:prod123' : '1:159140509374:web:test123',
      apiKey: isProduction ? 'AIzaSyProd123456789' : 'AIzaSyTest123456789',
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
   * 获取图片CDN URL
   */
  getImagesCdnUrl(): string {
    return this.currentEnv === 'development'
      ? 'https://test-pub-578670e517644aad94f4f68695b605b9.r2.dev'
      : 'https://pub-578670e517644aad94f4f68695b605b9.r2.dev';
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
      version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      buildDate: process.env.EXPO_PUBLIC_BUILD_DATE || new Date().toISOString(),
    };
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