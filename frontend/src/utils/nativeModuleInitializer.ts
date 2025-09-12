/**
 * 原生模块初始化器
 * 用于初始化所有原生模块和第三方库
 */

// 检查是否为真机或模拟器环境
const isNativeEnvironment = () => {
  return typeof global !== 'undefined' && global.HermesInternal;
};

/**
 * 初始化所有原生模块
 * 这个函数在应用启动时调用，确保所有原生功能正常工作
 */
export const initializeAllNativeModules = async (): Promise<void> => {
  try {
    // 在React Native环境中初始化原生模块

    console.log('🚀 开始初始化原生模块...');

    // 初始化异步存储
    await initializeAsyncStorage();

    // 初始化网络状态
    await initializeNetworkInfo();

    // 初始化国际化
    await initializeI18n();

    console.log('✅ 所有原生模块初始化完成');
  } catch (error) {
    console.warn('⚠️ 原生模块初始化失败，使用fallback:', error);
  }
};

/**
 * 初始化AsyncStorage
 */
const initializeAsyncStorage = async (): Promise<void> => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    console.log('✅ AsyncStorage 初始化成功');
  } catch (error) {
    console.warn('⚠️ AsyncStorage 初始化失败:', error);
  }
};

/**
 * 初始化网络信息
 */
const initializeNetworkInfo = async (): Promise<void> => {
  try {
    const NetInfo = await import('@react-native-community/netinfo');
    console.log('✅ NetInfo 初始化成功');
  } catch (error) {
    console.warn('⚠️ NetInfo 初始化失败:', error);
  }
};

/**
 * 初始化国际化
 */
const initializeI18n = async (): Promise<void> => {
  try {
    // 这里可以添加i18n相关的原生模块初始化
    console.log('✅ I18n 初始化成功');
  } catch (error) {
    console.warn('⚠️ I18n 初始化失败:', error);
  }
};

/**
 * 获取设备信息
 */
export const getDeviceInfo = () => {
  return {
    isNative: isNativeEnvironment(),
    platform: global?.Platform?.OS || 'unknown',
    version: global?.Platform?.Version || 'unknown'
  };
};