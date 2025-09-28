#!/usr/bin/env node

/**
 * 通过登录测试志愿者API
 */

const https = require('https');

// 测试账号
const TEST_ACCOUNT = {
  username: 'stevenj4xie',
  password: '123456'
};

// 简单的fetch实现
function fetchData(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testBackendFix() {
  console.log('========================================');
  console.log('测试后端是否已修复SQL问题');
  console.log('========================================\n');

  // 步骤1：登录获取token
  console.log('1. 尝试登录获取token...');
  try {
    const loginResponse = await fetchData('https://www.vitaglobal.icu/app/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: TEST_ACCOUNT.username,
        password: TEST_ACCOUNT.password
      })
    });

    if (loginResponse.data.code !== 200) {
      console.log('   ❌ 登录失败:', loginResponse.data.msg);
      console.log('   请修改脚本中的TEST_ACCOUNT为有效账号');
      return;
    }

    const token = loginResponse.data.data?.token;
    const userId = loginResponse.data.data?.userInfo?.userId || 1;

    console.log('   ✅ 登录成功');
    console.log(`   用户ID: ${userId}`);
    console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'null'}`);

    // 步骤2：测试有问题的API
    console.log('\n2. 测试 /app/hour/lastRecordList 接口...');

    const testResponse = await fetchData(`https://www.vitaglobal.icu/app/hour/lastRecordList?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   状态码: ${testResponse.status}`);

    if (testResponse.status === 500) {
      console.log('   ❌ 后端返回500错误');
      const errorMsg = testResponse.data?.msg || testResponse.data;
      console.log('   错误信息:', errorMsg);

      if (typeof errorMsg === 'string' && (errorMsg.includes('ambiguous') || errorMsg.includes('Column'))) {
        console.log('\n   🔴 SQL歧义错误仍然存在 - 后端未修复');
      }
    } else if (testResponse.status === 200) {
      console.log('   ✅ API正常返回');
      if (testResponse.data?.code === 200) {
        console.log('   🟢 后端已修复SQL问题！');
        console.log('   数据:', testResponse.data?.data);
      } else if (testResponse.data?.code === 500) {
        console.log('   ⚠️  API返回业务错误:', testResponse.data?.msg);
      } else {
        console.log('   响应:', testResponse.data);
      }
    }

  } catch (error) {
    console.log('测试失败:', error.message);
  }

  console.log('\n========================================');
}

// 不需要登录的快速测试
async function quickTest() {
  console.log('执行快速测试（无需登录）...\n');

  // 故意使用无效token来触发后端错误
  const testResponse = await fetchData(`https://www.vitaglobal.icu/app/hour/lastRecordList?userId=1`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid_token_to_trigger_error',
      'Content-Type': 'application/json'
    }
  });

  console.log('响应状态:', testResponse.status);
  console.log('响应内容:', JSON.stringify(testResponse.data, null, 2));

  // 分析响应
  if (testResponse.status === 500) {
    const msg = testResponse.data?.msg || '';
    if (msg.includes('ambiguous') || msg.includes('Column')) {
      console.log('\n🔴 检测到SQL歧义错误 - 后端仍未修复');
      console.log('建议：保留降级代码，继续使用recordList接口');
    } else {
      console.log('\n其他500错误:', msg);
    }
  } else if (testResponse.status === 200 && testResponse.data?.code === 401) {
    console.log('\n认证失败（预期的）');
    console.log('📌 无法通过此方法确定SQL问题是否修复');
    console.log('需要提供有效的测试账号才能完整测试');
  }
}

// 执行测试
if (TEST_ACCOUNT.username === 'test') {
  console.log('请先修改TEST_ACCOUNT为有效的测试账号\n');
  quickTest();
} else {
  testBackendFix();
}