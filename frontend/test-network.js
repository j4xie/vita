/**
 * 网络连接测试脚本
 * 直接在Node.js环境中测试API连接
 */

const https = require('https');
const http = require('http');

console.log('🌐 测试API连接...\n');

// 测试生产环境
function testProductionAPI() {
  return new Promise((resolve) => {
    console.log('1️⃣ 测试生产环境 HTTPS API...');
    const startTime = Date.now();

    https.get('https://www.vitaglobal.icu/app/activity/list?pageNum=1&pageSize=1', {
      timeout: 10000,
    }, (res) => {
      const duration = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`   ✅ 成功 - 状态码: ${res.statusCode}, 耗时: ${duration}ms`);
          console.log(`   活动总数: ${json.total}`);
          console.log(`   第一个活动: ${json.rows?.[0]?.name || 'N/A'}`);
          resolve(true);
        } catch (e) {
          console.log(`   ❌ JSON解析失败: ${e.message}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ 请求失败: ${err.message}, 耗时: ${duration}ms`);
      resolve(false);
    }).on('timeout', () => {
      console.log(`   ❌ 请求超时 (>10秒)`);
      resolve(false);
    });
  });
}

// 测试测试环境
function testTestAPI() {
  return new Promise((resolve) => {
    console.log('\n2️⃣ 测试测试环境 HTTP API...');
    const startTime = Date.now();

    http.get('http://106.14.165.234:8085/app/activity/list?pageNum=1&pageSize=1', {
      timeout: 10000,
    }, (res) => {
      const duration = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`   ✅ 成功 - 状态码: ${res.statusCode}, 耗时: ${duration}ms`);
          console.log(`   活动总数: ${json.total}`);
          console.log(`   第一个活动: ${json.rows?.[0]?.name || 'N/A'}`);
          resolve(true);
        } catch (e) {
          console.log(`   ❌ JSON解析失败: ${e.message}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ 请求失败: ${err.message}, 耗时: ${duration}ms`);
      resolve(false);
    }).on('timeout', () => {
      console.log(`   ❌ 请求超时 (>10秒)`);
      resolve(false);
    });
  });
}

// 运行测试
async function runTests() {
  const prodResult = await testProductionAPI();
  const testResult = await testTestAPI();

  console.log('\n' + '='.repeat(50));
  console.log('📊 测试总结');
  console.log('='.repeat(50));
  console.log(`生产环境: ${prodResult ? '✅ 正常' : '❌ 失败'}`);
  console.log(`测试环境: ${testResult ? '✅ 正常' : '❌ 失败'}`);

  if (!prodResult && testResult) {
    console.log('\n💡 建议: 切换到测试环境');
    console.log('   运行: npm run ios:dev');
  } else if (prodResult && testResult) {
    console.log('\n✅ 两个环境都正常');
    console.log('   如果应用仍然空白，可能是:');
    console.log('   1. 应用缓存问题 - 尝试在模拟器中摇晃设备并选择 Reload');
    console.log('   2. 网络权限问题 - 检查 Info.plist 中的网络配置');
    console.log('   3. 代码逻辑问题 - 查看终端中的应用日志');
  } else if (!prodResult && !testResult) {
    console.log('\n❌ 两个环境都无法访问');
    console.log('   请检查:');
    console.log('   1. 网络连接');
    console.log('   2. VPN设置');
    console.log('   3. 防火墙配置');
  }

  console.log('');
}

runTests().catch(err => {
  console.error('测试过程出错:', err);
  process.exit(1);
});