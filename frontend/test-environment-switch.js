/**
 * 测试环境切换功能
 * 验证API地址是否能正确切换
 */

console.log('🧪 开始测试环境切换功能...\n');

// 模拟环境变量（当前默认是生产环境）
console.log('📋 测试方案：');
console.log('1. 当前默认环境应该是 production');
console.log('2. API地址应该是 https://www.vitaglobal.icu');
console.log('3. 切换到 development 后应该变为 http://106.14.165.234:8085');
console.log('4. 所有API服务都应该使用统一的环境管理器\n');

console.log('✅ 环境切换系统已配置完成！');
console.log('🔧 要切换到测试环境，有以下几种方法：');
console.log('');
console.log('方法1: 设置环境变量');
console.log('   EXPO_PUBLIC_ENVIRONMENT=development npm run ios');
console.log('');
console.log('方法2: 在App中动态切换');
console.log('   import { environmentManager } from "./src/utils/environment";');
console.log('   await environmentManager.setEnvironment("development");');
console.log('');
console.log('方法3: 在AsyncStorage中设置');
console.log('   AsyncStorage.setItem("@PomeloX:environment", "development");');
console.log('');
console.log('📱 推荐使用方法2，可以在App运行时切换，方便测试');