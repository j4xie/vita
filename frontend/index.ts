import { registerRootComponent } from 'expo';

import App from './App';

// 🔍 全局错误捕获和调试配置
console.log('🚀 应用启动 - 启用全局错误追踪');

// 捕获未处理的 JavaScript 错误
if (typeof ErrorUtils !== 'undefined') {
  const originalGlobalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('🚨 Global Error Caught:', {
      message: error.message,
      stack: error.stack,
      isFatal,
      name: error.name,
      timestamp: new Date().toISOString(),
      jsEngine: global.HermesInternal ? 'Hermes' : 'JSC'
    });
    
    // 如果是 Object 相关错误，记录额外信息
    if (error.message && error.message.includes('Cannot convert undefined value to object')) {
      console.error('🎯 Target error detected! Details:', {
        errorMessage: error.message,
        stackTrace: error.stack,
        currentStack: new Error().stack,
      });
    }
    
    // 调用原始错误处理器
    if (originalGlobalHandler) {
      originalGlobalHandler(error, isFatal);
    }
  });
}

// 捕获未处理的 Promise rejections
const originalPromiseRejectionHandler = global.onunhandledrejection;
global.onunhandledrejection = function(event) {
  console.error('🚨 未处理的 Promise 错误:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString(),
  });
  
  if (originalPromiseRejectionHandler) {
    originalPromiseRejectionHandler(event);
  }
};

// 添加性能监控
const startTime = Date.now();
console.log('⏱️ 应用加载开始时间:', new Date(startTime).toISOString());

// 监控关键模块加载
const originalRequire = global.__r || global.require;
if (originalRequire) {
  global.__r = function(moduleId) {
    try {
      const module = originalRequire(moduleId);
      
      // 记录主题相关模块的加载
      if (typeof moduleId === 'string' && (
        moduleId.includes('theme') || 
        moduleId.includes('i18n') || 
        moduleId.includes('Context')
      )) {
        console.log('📦 关键模块加载:', moduleId, typeof module);
      }
      
      return module;
    } catch (error) {
      console.error('💥 模块加载失败:', moduleId, error.message);
      throw error;
    }
  };
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

console.log('✅ 应用注册完成, 总耗时:', Date.now() - startTime, 'ms');
