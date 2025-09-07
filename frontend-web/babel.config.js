module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      'babel-preset-expo',
    ],
    plugins: [
      // 🚀 路径别名支持 - 显著减少模块解析时间
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens', 
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types',
            '@assets': './assets'
          },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json']
        }
      ],
      // 🚨 保持Reanimated插件在最后 - 确保动画功能正常
      'react-native-reanimated/plugin',
    ],
  };
};