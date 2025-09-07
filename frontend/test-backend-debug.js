/**
 * 后端API调试和问题诊断测试
 * 发现的问题：活动列表API存在SQL查询错误
 */

const BASE_URL = 'https://www.vitaglobal.icu';

let userToken = '';
let userId = 0;

// HTTP请求封装
async function makeRequest(url, options = {}) {
  try {
    console.log(`📡 测试: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers
      }
    });
    
    const data = await response.json();
    console.log(`✅ 状态: ${response.status}`);
    console.log(`📊 结果: ${data.code === 200 ? '成功' : '失败'} - ${data.msg || 'N/A'}`);
    
    return { response, data, success: data.code === 200 };
  } catch (error) {
    console.error('❌ 请求异常:', error.message);
    return { error: error.message, success: false };
  }
}

// 登录获取token
async function login() {
  console.log('🔑 登录获取token...');
  const params = new URLSearchParams();
  params.append('username', 'admin');
  params.append('password', '123456');
  
  const { data } = await makeRequest(`${BASE_URL}/app/login`, {
    method: 'POST',
    body: params.toString()
  });
  
  if (data.code === 200 && data.data) {
    userToken = data.data.token;
    userId = data.data.userId;
    console.log(`✅ 登录成功, 用户ID: ${userId}`);
    return true;
  }
  return false;
}

// 测试不同的API接口
async function testAllAPIs() {
  console.log('\n🧪 开始后端API调试测试');
  console.log('='.repeat(60));
  
  if (!await login()) {
    console.log('❌ 登录失败，无法进行后续测试');
    return;
  }
  
  const tests = [
    {
      name: '活动列表API (有问题)',
      url: `${BASE_URL}/app/activity/list?pageNum=1&pageSize=5&userId=${userId}`,
      method: 'GET',
      expectedIssue: 'SQL子查询返回多行错误'
    },
    {
      name: '活动列表API (不带userId)',
      url: `${BASE_URL}/app/activity/list?pageNum=1&pageSize=5`,
      method: 'GET',
      expectedIssue: '可能避免SQL问题'
    },
    {
      name: '活动列表API (不同用户ID)',
      url: `${BASE_URL}/app/activity/list?pageNum=1&pageSize=5&userId=1`,
      method: 'GET',
      expectedIssue: '测试其他用户ID'
    },
    {
      name: '用户相关活动API',
      url: `${BASE_URL}/app/activity/userActivitylist?userId=${userId}`,
      method: 'GET',
      expectedIssue: '可能绕过主列表问题'
    },
    {
      name: '用户相关活动API (不同用户)',
      url: `${BASE_URL}/app/activity/userActivitylist?userId=1`,
      method: 'GET',
      expectedIssue: '测试其他用户的活动'
    },
    {
      name: '组织列表API',
      url: `${BASE_URL}/app/organization/list`,
      method: 'GET',
      expectedIssue: '测试其他API是否正常'
    },
    {
      name: '学校列表API',
      url: `${BASE_URL}/app/dept/list`,
      method: 'GET',
      expectedIssue: '测试基础数据API'
    }
  ];
  
  const results = {};
  
  for (const test of tests) {
    console.log(`\n🧪 测试: ${test.name}`);
    console.log(`🎯 预期: ${test.expectedIssue}`);
    console.log('-'.repeat(50));
    
    const result = await makeRequest(test.url, {
      method: test.method,
      headers: test.method === 'GET' ? { 'Authorization': `Bearer ${userToken}` } : {}
    });
    
    results[test.name] = result;
    
    if (result.success) {
      console.log('✅ 此API工作正常');
      if (result.data?.rows) {
        console.log(`📊 返回数据: ${result.data.rows.length} 条记录`);
        // 显示第一条记录的结构（如果存在）
        if (result.data.rows.length > 0) {
          const firstItem = result.data.rows[0];
          const keys = Object.keys(firstItem).slice(0, 5);
          console.log(`🔍 数据结构: ${keys.join(', ')}${keys.length < Object.keys(firstItem).length ? '...' : ''}`);
        }
      }
    } else {
      console.log('❌ 此API存在问题');
      if (result.data?.msg && result.data.msg.includes('SQL')) {
        console.log('🚨 发现SQL错误');
      }
    }
    
    // 添加短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 测试结果汇总
  console.log('\n📊 API测试结果汇总');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result.success ? '✅ 正常' : '❌ 异常';
    console.log(`${status} ${name}`);
    if (!result.success && result.data?.msg) {
      if (result.data.msg.includes('Subquery returns more than 1 row')) {
        console.log('   🚨 SQL子查询多行错误');
      } else if (result.data.msg.includes('SQL')) {
        console.log('   🚨 SQL语法错误');
      } else {
        console.log(`   📋 错误: ${result.data.msg.substring(0, 50)}...`);
      }
    }
  });
  
  // 问题分析
  console.log('\n🔧 问题分析');
  console.log('='.repeat(40));
  
  const activityListResults = Object.entries(results).filter(([name]) => 
    name.includes('活动列表API')
  );
  
  const hasSQL错误 = activityListResults.some(([name, result]) => 
    result.data?.msg?.includes('Subquery returns more than 1 row')
  );
  
  if (hasSQL错误) {
    console.log('🚨 确认问题：活动列表API的SQL查询存在子查询返回多行错误');
    console.log('');
    console.log('📋 SQL错误详情:');
    console.log('• 错误类型: Subquery returns more than 1 row');
    console.log('• 涉及表: activity_ex_user (活动报名表)');
    console.log('• 问题SQL: COALESCE((SELECT sign_status FROM activity_ex_user aeu WHERE act.id = aeu.activity_id AND aeu.user_id = ?), 0)');
    console.log('');
    console.log('🔍 根本原因分析:');
    console.log('1. activity_ex_user表中同一用户对同一活动有多条记录');
    console.log('2. 子查询期望返回单行，但实际返回了多行');
    console.log('3. 可能是数据重复或者表设计问题');
    console.log('');
    console.log('💡 修复建议:');
    console.log('1. 【立即修复】SQL查询改为 LIMIT 1 或使用聚合函数');
    console.log('2. 【数据清理】检查activity_ex_user表是否有重复记录');
    console.log('3. 【表约束】添加唯一约束防止重复报名');
    console.log('4. 【临时方案】使用MAX()或MIN()函数获取单一值');
  }
  
  // 前端应对策略
  console.log('\n📱 前端应对策略');
  console.log('='.repeat(40));
  
  const workingAPIs = Object.entries(results).filter(([name, result]) => result.success);
  
  if (workingAPIs.length > 0) {
    console.log('✅ 可用的替代API:');
    workingAPIs.forEach(([name, result]) => {
      console.log(`• ${name}`);
      if (result.data?.rows?.length) {
        console.log(`  📊 数据量: ${result.data.rows.length} 条`);
      }
    });
    console.log('');
    console.log('🔄 建议的前端修复策略:');
    console.log('1. 添加API错误重试机制');
    console.log('2. 使用可用的替代API获取数据');
    console.log('3. 实现优雅的错误降级处理');
    console.log('4. 显示用户友好的错误信息');
    console.log('5. 添加"刷新重试"按钮');
  }
  
  // 具体的SQL修复建议
  console.log('\n🛠️ SQL修复建议 (给后端开发)');
  console.log('='.repeat(50));
  console.log('原问题SQL:');
  console.log('COALESCE((SELECT sign_status FROM activity_ex_user aeu WHERE act.id = aeu.activity_id AND aeu.user_id = ?), 0)');
  console.log('');
  console.log('修复方案1 - 使用LIMIT:');
  console.log('COALESCE((SELECT sign_status FROM activity_ex_user aeu WHERE act.id = aeu.activity_id AND aeu.user_id = ? LIMIT 1), 0)');
  console.log('');
  console.log('修复方案2 - 使用MAX聚合:');
  console.log('COALESCE((SELECT MAX(sign_status) FROM activity_ex_user aeu WHERE act.id = aeu.activity_id AND aeu.user_id = ?), 0)');
  console.log('');
  console.log('修复方案3 - 添加排序取最新:');
  console.log('COALESCE((SELECT sign_status FROM activity_ex_user aeu WHERE act.id = aeu.activity_id AND aeu.user_id = ? ORDER BY create_time DESC LIMIT 1), 0)');
  
  console.log('\n🏁 诊断测试完成');
}

// 运行测试
testAllAPIs().catch(console.error);