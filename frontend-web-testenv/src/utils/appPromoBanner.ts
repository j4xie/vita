/**
 * App推广横幅管理工具 - Web端专用
 * 处理横幅显示逻辑、用户行为记录和App跳转
 */

import WebStorageService from '../services/WebStorageService';
import { pomeloXAPI } from '../services/PomeloXAPI';

// Web端存储适配器
const AsyncStorage = new WebStorageService('local');

// App Store链接配置
export const APP_STORE_CONFIG = {
  APP_ID: '6751477195',
  UNIVERSAL_LINK: 'pomeloX://open', // 使用自定义scheme避免认证问题
  FALLBACK_UNIVERSAL_LINK: 'https://www.vitaglobal.icu/app/open',
  CUSTOM_SCHEME: 'pomeloX://',
  REGIONS: {
    CN: {
      APP_STORE_URL: 'https://apps.apple.com/cn/app/西柚pomelo/id6751477195',
      TEST_ICON_URL: 'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/f8/19/87/f8198766-0a2e-8c7e-3f4e-4d9e5c7b8a3f/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/60x60bb.jpg',
      NAME: '西柚Pomelo'
    },
    US: {
      APP_STORE_URL: 'https://apps.apple.com/us/app/pomelo-vita/id6751477195',
      TEST_ICON_URL: 'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/f8/19/87/f8198766-0a2e-8c7e-3f4e-4d9e5c7b8a3f/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/60x60bb.jpg',
      NAME: 'Pomelo Vita'
    }
  }
};

// 横幅显示状态管理
export interface BannerState {
  hasShown: boolean;
  dismissedAt: number | null;
  showCount: number;
  lastShownAt: number | null;
}

// 用户行为记录
export interface UserBehavior {
  action: string;
  timestamp: number;
  userAgent: string;
  url: string;
  source: 'top_banner' | 'floating_button';
  data?: any;
}

// App Store区域类型
export type AppStoreRegion = 'CN' | 'US';

// 区域检测结果
export interface RegionDetectionResult {
  region: AppStoreRegion;
  confidence: 'high' | 'medium' | 'low';
  method: 'silent_test' | 'language_fallback' | 'user_selection';
  testDuration?: number;
}

/**
 * 获取横幅显示状态
 */
export const getBannerState = async (): Promise<BannerState> => {
  try {
    const state = await AsyncStorage.getItem('app_download_banner_state');
    if (state) {
      return JSON.parse(state);
    }
  } catch (error) {
    console.error('❌ 获取横幅状态失败:', error);
  }

  // 默认状态
  return {
    hasShown: false,
    dismissedAt: null,
    showCount: 0,
    lastShownAt: null,
  };
};

/**
 * 更新横幅显示状态
 */
export const updateBannerState = async (updates: Partial<BannerState>): Promise<void> => {
  try {
    const currentState = await getBannerState();
    const newState = { ...currentState, ...updates };
    await AsyncStorage.setItem('app_download_banner_state', JSON.stringify(newState));
  } catch (error) {
    console.error('❌ 更新横幅状态失败:', error);
  }
};

/**
 * 检查是否应该显示顶部横幅
 */
export const shouldShowTopBanner = async (): Promise<boolean> => {
  const state = await getBannerState();

  // 如果用户已经关闭过横幅，则不再显示
  if (state.dismissedAt !== null) {
    return false;
  }

  // 首次访问显示
  if (!state.hasShown) {
    return true;
  }

  // 可以添加更多逻辑，比如过一段时间后重新显示
  return false;
};

/**
 * 标记横幅已显示
 */
export const markBannerAsShown = async (): Promise<void> => {
  const state = await getBannerState();
  await updateBannerState({
    hasShown: true,
    showCount: state.showCount + 1,
    lastShownAt: Date.now(),
  });
};

/**
 * 标记横幅已关闭
 */
export const markBannerAsDismissed = async (): Promise<void> => {
  await updateBannerState({
    dismissedAt: Date.now(),
  });
};

/**
 * 获取用户偏好的App Store区域
 */
export const getUserPreferredRegion = async (): Promise<AppStoreRegion | null> => {
  try {
    const region = await AsyncStorage.getItem('preferred_appstore_region');
    return region === 'CN' || region === 'US' ? region : null;
  } catch (error) {
    console.error('❌ 获取用户偏好区域失败:', error);
    return null;
  }
};

/**
 * 保存用户偏好的App Store区域
 */
export const saveUserPreferredRegion = async (region: AppStoreRegion): Promise<void> => {
  try {
    await AsyncStorage.setItem('preferred_appstore_region', region);
    console.log('✅ 用户偏好区域已保存:', region);
  } catch (error) {
    console.error('❌ 保存用户偏好区域失败:', error);
  }
};

/**
 * 静默测试App Store区域可访问性（实时检测，无缓存）
 */
export const silentRegionTest = (region: AppStoreRegion): Promise<boolean> => {
  return new Promise((resolve) => {
    const config = APP_STORE_CONFIG.REGIONS[region];
    const testUrl = config.TEST_ICON_URL;

    let resolved = false;
    const cleanup = () => {
      if (testImg.parentNode) {
        testImg.parentNode.removeChild(testImg);
      }
    };

    // 创建隐藏的测试图片
    const testImg = new Image();
    testImg.style.position = 'absolute';
    testImg.style.left = '-9999px';
    testImg.style.top = '-9999px';
    testImg.style.width = '1px';
    testImg.style.height = '1px';
    testImg.style.opacity = '0';

    // 关键：禁用缓存，确保每次都是实时检测
    testImg.crossOrigin = 'anonymous';

    // 成功加载 = 该区域可访问
    testImg.onload = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        console.log(`✅ ${region}区App Store可访问`);
        resolve(true);
      }
    };

    // 加载失败 = 该区域不可访问
    testImg.onerror = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        console.log(`❌ ${region}区App Store不可访问`);
        resolve(false);
      }
    };

    // 缩短超时时间到800ms，提升检测速度
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        console.log(`⏰ ${region}区App Store检测超时`);
        resolve(false);
      }
    }, 800);

    // 添加到DOM并开始测试，每次都使用新的时间戳
    document.body.appendChild(testImg);
    testImg.src = testUrl + '?cache_bust=' + Date.now() + '&r=' + Math.random();
  });
};

/**
 * 智能检测App Store区域（每次都实时检测）
 */
export const detectAppStoreRegion = async (): Promise<RegionDetectionResult> => {
  const startTime = Date.now();

  // 每次都进行实时检测，不使用缓存
  try {
    console.log('🔍 开始实时检测App Store区域...');

    // 1. 优先测试中国区可访问性（大多数中国用户使用中国区）
    const cnAccessible = await silentRegionTest('CN');
    console.log('🇨🇳 中国区检测结果:', cnAccessible);

    if (cnAccessible) {
      // 中国区可访问，返回中国区
      return {
        region: 'CN',
        confidence: 'high',
        method: 'silent_test',
        testDuration: Date.now() - startTime
      };
    } else {
      // 中国区不可访问，测试美国区
      const usAccessible = await silentRegionTest('US');
      console.log('🇺🇸 美国区检测结果:', usAccessible);

      if (usAccessible) {
        return {
          region: 'US',
          confidence: 'high',
          method: 'silent_test',
          testDuration: Date.now() - startTime
        };
      }
    }
  } catch (error) {
    console.error('❌ 静默区域测试失败:', error);
  }

  // 兜底方案：基于语言判断
  const language = navigator.language || navigator.languages?.[0] || 'en-US';
  const fallbackRegion: AppStoreRegion = language.startsWith('zh') ? 'CN' : 'US';

  console.log('🔄 使用语言兜底方案:', { language, fallbackRegion });

  return {
    region: fallbackRegion,
    confidence: 'low',
    method: 'language_fallback',
    testDuration: Date.now() - startTime
  };
};

/**
 * 记录用户行为
 */
export const trackUserBehavior = async (
  action: string,
  source: 'top_banner' | 'floating_button',
  data?: any
): Promise<void> => {
  const behaviorData: UserBehavior = {
    action,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    source,
    data,
  };

  try {
    // 存储到本地（立即生效）
    const existingLogs = await AsyncStorage.getItem('app_download_behaviors') || '[]';
    const logs: UserBehavior[] = JSON.parse(existingLogs);
    logs.push(behaviorData);

    // 保留最近100条记录
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    await AsyncStorage.setItem('app_download_behaviors', JSON.stringify(logs));

    console.log('📊 用户行为记录:', behaviorData);

    // 可选：发送到后端（如果需要）
    try {
      await pomeloXAPI.post('/app/analytics/behavior', behaviorData);
    } catch (error) {
      console.log('📊 Analytics upload failed, stored locally');
    }
  } catch (error) {
    console.error('❌ 记录用户行为失败:', error);
  }
};

/**
 * 尝试打开App（简化版，避免认证问题）
 */
export const tryOpenApp = (): Promise<boolean> => {
  return new Promise((resolve) => {
    let resolved = false;

    // 缩短超时时间到1.5秒
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false); // 假设App未安装，直接跳转App Store
      }
    }, 1500);

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (document.hidden && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(true); // App已打开
      }
    };

    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 尝试多种方式打开App
    try {
      // 优先使用自定义scheme
      window.location.href = APP_STORE_CONFIG.UNIVERSAL_LINK;
    } catch (error) {
      console.log('🔗 自定义scheme失败，可能App未安装');
      cleanup();
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(false);
      }
    }

    // 清理
    setTimeout(cleanup, 2000);
  });
};

/**
 * 处理App下载/打开逻辑（升级版 - 支持智能区域检测）
 */
export const handleAppDownload = async (
  source: 'top_banner' | 'floating_button' = 'floating_button',
  forceRegion?: AppStoreRegion
): Promise<void> => {
  try {
    // 记录点击行为
    await trackUserBehavior('app_download_clicked', source);

    // 1. 智能检测或使用强制指定的区域
    let detectionResult: RegionDetectionResult;

    if (forceRegion) {
      detectionResult = {
        region: forceRegion,
        confidence: 'high',
        method: 'user_selection',
        testDuration: 0
      };
    } else {
      detectionResult = await detectAppStoreRegion();
    }

    console.log('📍 App Store区域检测结果:', detectionResult);

    // iOS Safari特殊处理 - 添加Smart App Banner Meta标签
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isSafari) {
      const existingMeta = document.querySelector('meta[name="apple-itunes-app"]');
      if (!existingMeta) {
        const metaTag = document.createElement('meta');
        metaTag.name = 'apple-itunes-app';
        metaTag.content = `app-id=${APP_STORE_CONFIG.APP_ID}, app-argument=${APP_STORE_CONFIG.UNIVERSAL_LINK}`;
        document.head.appendChild(metaTag);
      }
    }

    // 2. 直接跳转到检测的App Store区域（简化方案，避免认证问题）
    const regionConfig = APP_STORE_CONFIG.REGIONS[detectionResult.region];
    const targetUrl = regionConfig.APP_STORE_URL;

    console.log(`🎯 跳转到${detectionResult.region}区App Store:`, targetUrl);

    window.location.href = targetUrl;

    await trackUserBehavior('redirected_to_app_store', source, {
      detectionResult,
      targetUrl,
      appName: regionConfig.NAME
    });

  } catch (error) {
    console.error('❌ App下载处理失败:', error);

    // 出错时使用兜底方案：基于语言选择区域
    const language = navigator.language || 'en-US';
    const fallbackRegion: AppStoreRegion = language.startsWith('zh') ? 'CN' : 'US';
    const fallbackUrl = APP_STORE_CONFIG.REGIONS[fallbackRegion].APP_STORE_URL;

    window.location.href = fallbackUrl;
    await trackUserBehavior('error_fallback_to_app_store', source, {
      error: error.message,
      fallbackRegion,
      fallbackUrl
    });
  }
};

/**
 * 显示区域选择界面（当检测失败或用户需要手动选择时）
 */
export const showRegionSelectionModal = (
  source: 'top_banner' | 'floating_button',
  onRegionSelected?: (region: AppStoreRegion) => void
): void => {
  // 这个函数将在组件中实现，这里提供接口定义
  console.log('📱 显示区域选择界面:', { source });

  // 记录显示区域选择的行为
  trackUserBehavior('region_selection_modal_shown', source);
};

/**
 * 获取用户行为统计
 */
export const getUserBehaviorStats = async (): Promise<{
  totalClicks: number;
  bannerClicks: number;
  buttonClicks: number;
  appOpens: number;
  storeRedirects: number;
}> => {
  try {
    const logs = await AsyncStorage.getItem('app_download_behaviors') || '[]';
    const behaviors: UserBehavior[] = JSON.parse(logs);

    return {
      totalClicks: behaviors.filter(b => b.action === 'app_download_clicked').length,
      bannerClicks: behaviors.filter(b => b.action === 'app_download_clicked' && b.source === 'top_banner').length,
      buttonClicks: behaviors.filter(b => b.action === 'app_download_clicked' && b.source === 'floating_button').length,
      appOpens: behaviors.filter(b => b.action === 'app_opened_successfully').length,
      storeRedirects: behaviors.filter(b => b.action === 'redirected_to_app_store').length,
    };
  } catch (error) {
    console.error('❌ 获取行为统计失败:', error);
    return {
      totalClicks: 0,
      bannerClicks: 0,
      buttonClicks: 0,
      appOpens: 0,
      storeRedirects: 0,
    };
  }
};

/**
 * 重置横幅状态（调试用）
 */
export const resetBannerState = async (): Promise<void> => {
  await AsyncStorage.removeItem('app_download_banner_state');
  await AsyncStorage.removeItem('app_download_behaviors');
  console.log('🔄 横幅状态已重置');
};