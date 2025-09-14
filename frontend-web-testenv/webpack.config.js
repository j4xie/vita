// Webpack配置 - 优化字体包
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      // 只允许Ionicons，其他图标库重定向到空模块
      '@expo/vector-icons/MaterialCommunityIcons': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
      '@expo/vector-icons/FontAwesome': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
      '@expo/vector-icons/FontAwesome5': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
      '@expo/vector-icons/FontAwesome6': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
      '@expo/vector-icons/MaterialIcons': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
      '@expo/vector-icons/AntDesign': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
      '@expo/vector-icons/Feather': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
      '@expo/vector-icons/Entypo': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
      '@expo/vector-icons/Fontisto': path.resolve(__dirname, 'src/components/icons/EmptyIcon.js'),
    }
  },

  // 排除大字体文件
  externals: [
    function(context, request, callback) {
      // 排除所有非Ionicons的字体文件
      if (request.includes('.ttf') && !request.includes('Ionicons.ttf')) {
        return callback(null, 'empty-module');
      }
      callback();
    }
  ]
};