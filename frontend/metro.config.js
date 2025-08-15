const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🚀 启用 Hermes 全性能模式
console.log('🚀 JS 引擎: Hermes (全性能模式)');

// 生产环境优化配置
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    // 启用完整优化
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    // 生产环境移除 console 日志
    ...(process.env.NODE_ENV === 'production' && {
      drop_console: true,
      drop_debugger: true,
    }),
  },
};

// 修复模块ID生成问题
config.serializer = {
  ...config.serializer,
  // 移除自定义模块ID工厂，使用默认数字ID
  // createModuleIdFactory: 使用默认实现避免模块路径问题
};

// 调试模式下的额外配置
if (process.env.NODE_ENV === 'development') {
  // 启用详细的错误信息
  config.resolver = {
    ...config.resolver,
    platforms: ['ios', 'android', 'native', 'web'],
  };
  
  // 添加更多调试信息
  config.transformer.enableBabelRCLookup = true;
}

console.log('🔧 Metro Config: Hermes 全性能模式已启用');
console.log('📍 项目路径:', __dirname);
console.log('⚡ 性能优化: 代码压缩、函数名混淆已启用');

module.exports = config;