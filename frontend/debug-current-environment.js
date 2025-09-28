/**
 * 调试当前环境配置
 * 检查环境变量和API地址
 */

console.log('🔍 环境调试信息:');
console.log('');

// 检查环境变量
console.log('📋 环境变量:');
console.log('EXPO_PUBLIC_ENVIRONMENT:', process.env.EXPO_PUBLIC_ENVIRONMENT || '未设置');
console.log('NODE_ENV:', process.env.NODE_ENV || '未设置');
console.log('');

// 检查当前生效的环境
const currentEnv = process.env.EXPO_PUBLIC_ENVIRONMENT || 'production';
console.log('🎯 当前环境:', currentEnv);
console.log('');

// 根据环境逻辑显示API地址
const apiUrl = currentEnv === 'development'
  ? 'http://106.14.165.234:8085'  // 测试环境
  : 'https://www.vitaglobal.icu'; // 生产环境

console.log('📡 API地址:', apiUrl);
console.log('');

// 检查问题可能的原因
console.log('🔧 可能的问题:');
if (currentEnv === 'development') {
  console.log('✅ 环境变量设置正确，应该使用测试环境');
  console.log('🤔 如果仍显示生产数据，可能是:');
  console.log('   1. API服务在初始化时就固化了URL');
  console.log('   2. AsyncStorage中缓存了旧的环境设置');
  console.log('   3. 需要完全重启应用');
} else {
  console.log('❌ 环境变量未正确设置，仍在使用生产环境');
  console.log('💡 解决方案: 确保启动时设置 EXPO_PUBLIC_ENVIRONMENT=development');
}
console.log('');

console.log('🚀 建议操作:');
console.log('1. 完全退出应用');
console.log('2. 清理React Native缓存: npx react-native start --reset-cache');
console.log('3. 重新启动: EXPO_PUBLIC_ENVIRONMENT=development npm run ios');
console.log('4. 或者在应用内手动切换环境');