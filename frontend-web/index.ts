import { registerRootComponent } from 'expo';

import App from './App';

// 🧪 加载QR权限测试工具
import './src/utils/qrScanPermissionTest';
import './src/utils/manualQRTest';

// 🔍 全局错误捕获和调试配置
console.log('[STARTUP] 应用启动 - 启用全局错误追踪');

// 临时禁用全局错误处理器 - 防止Alert.alert引起的Text渲染错误
// 志愿者功能的Text渲染错误来源于此，暂时禁用

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
console.log('[PERF] 应用加载开始时间:', new Date(startTime).toISOString());

// 监控关键模块加载
const originalRequire = global.__r || global.require;
if (originalRequire && typeof originalRequire === 'function') {
  try {
    global.__r = function(moduleId: any) {
      try {
        const module = originalRequire(moduleId);
        
        // 记录主题相关模块的加载
        if (typeof moduleId === 'string' && (
          moduleId.includes('theme') || 
          moduleId.includes('i18n') || 
          moduleId.includes('Context')
        )) {
          console.log('[MODULE] 关键模块加载:', moduleId, typeof module);
        }
        
        return module;
      } catch (error: any) {
        console.error('[MODULE-ERROR] 模块加载失败:', moduleId, error?.message || error);
        throw error;
      }
    };
  } catch (err) {
    console.warn('Failed to set module loader:', err);
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

console.log('[READY] 应用注册完成, 总耗时:', Date.now() - startTime, 'ms');
