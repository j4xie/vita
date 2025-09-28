/**
 * 实时调试API调用
 * 验证环境切换是否真正生效
 */

// 模拟环境变量设置
process.env.EXPO_PUBLIC_ENVIRONMENT = 'development';

console.log('🔍 实时API调试:');
console.log('');

console.log('📋 环境变量状态:');
console.log('EXPO_PUBLIC_ENVIRONMENT:', process.env.EXPO_PUBLIC_ENVIRONMENT);
console.log('');

// 测试环境管理器逻辑
console.log('🧪 测试环境管理器逻辑:');
const currentEnv = process.env.EXPO_PUBLIC_ENVIRONMENT || 'production';
console.log('当前环境:', currentEnv);

const expectedUrl = currentEnv === 'development'
  ? 'http://106.14.165.234:8085'  // 测试环境
  : 'https://www.vitaglobal.icu'; // 生产环境

console.log('期望API地址:', expectedUrl);
console.log('');

console.log('🔧 可能的问题:');
if (currentEnv === 'development') {
  console.log('✅ 环境变量正确');
  console.log('🤔 但仍显示生产数据，可能原因:');
  console.log('   1. 应用启动时环境变量未传递到JavaScript层');
  console.log('   2. AsyncStorage中有缓存的环境设置覆盖了环境变量');
  console.log('   3. 某些API调用还在使用旧的实现');
  console.log('   4. 应用需要完全重启（而不是热重载）');
} else {
  console.log('❌ 环境变量未正确设置');
}
console.log('');

console.log('🚀 建议的调试步骤:');
console.log('1. 在应用中添加环境显示组件');
console.log('2. 在网络请求中添加console.log确认URL');
console.log('3. 检查AsyncStorage中是否有环境缓存');
console.log('4. 完全关闭应用重新启动');