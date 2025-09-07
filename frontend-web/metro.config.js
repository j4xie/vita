const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🚀 简化Metro配置 - 仅保留必要设置
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,  // 保留函数名用于调试
  },
};

// 🎯 基础别名配置
config.resolver = {
  ...config.resolver,
  alias: {
    '@': './src',
    '@components': './src/components',
    '@screens': './src/screens',
    '@services': './src/services',
    '@utils': './src/utils',
    '@types': './src/types',
    '@assets': './assets'
  },
};

module.exports = config;