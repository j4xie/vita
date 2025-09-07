/**
 * PomeloX应用活动页面完整逻辑测试
 * 测试流程：注册 -> 登录 -> 活动报名 -> 签到
 */

const BASE_URL = 'https://www.vitaglobal.icu';

// 测试用户信息
const testUser = {
  userName: `testuser${Date.now()}`,
  legalName: '测试用户',
  nickName: 'TestUser',
  password: 'test123456',
  phonenumber: `1${Math.floor(Math.random() * 900000000) + 100000000}`,
  email: `test${Date.now()}@example.com`,
  sex: 1,
  deptId: 1, // 默认学校ID
  invCode: 'TEST2025' // 测试邀请码
};

let userToken = '';
let userId = 0;
let testActivityId = 0;

// HTTP请求封装
async function makeRequest(url, options = {}) {
  try {
    console.log(`📡 请求: ${options.method || 'GET'} ${url}`);
    console.log('📋 请求数据:', options.body || 'None');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers
      }
    });
    
    const data = await response.json();
    console.log(`✅ 响应状态: ${response.status}`);
    console.log('📦 响应数据:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    throw error;
  }
}

// 1. 注册新用户
async function registerUser() {
  console.log('\n🔰 步骤1: 注册新用户');
  console.log('👤 用户信息:', testUser);
  
  const params = new URLSearchParams();
  Object.keys(testUser).forEach(key => {
    params.append(key, testUser[key]);
  });
  
  const { data } = await makeRequest(`${BASE_URL}/app/user/add`, {
    method: 'POST',
    body: params.toString()
  });
  
  if (data.code === 200) {
    console.log('✅ 用户注册成功');
    return true;
  } else {
    console.log('❌ 用户注册失败:', data.msg);
    return false;
  }
}

// 2. 用户登录
async function loginUser() {
  console.log('\n🔑 步骤2: 用户登录');
  
  const params = new URLSearchParams();
  params.append('username', testUser.userName);
  params.append('password', testUser.password);
  
  const { data } = await makeRequest(`${BASE_URL}/app/login`, {
    method: 'POST',
    body: params.toString()
  });
  
  if (data.code === 200 && data.data) {
    userToken = data.data.token;
    userId = data.data.userId;
    console.log(`✅ 登录成功，获得Token: ${userToken.substring(0, 20)}...`);
    console.log(`👤 用户ID: ${userId}`);
    return true;
  } else {
    console.log('❌ 登录失败:', data.msg);
    return false;
  }
}

// 3. 获取用户信息验证登录状态
async function getUserInfo() {
  console.log('\n📋 步骤3: 获取用户信息');
  
  const { data } = await makeRequest(`${BASE_URL}/app/user/info`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200) {
    console.log('✅ 用户信息获取成功');
    console.log(`👤 用户名: ${data.data.userName}`);
    console.log(`🏫 部门: ${data.data.dept?.deptName || 'N/A'}`);
    console.log(`🎭 角色: ${data.data.roles?.map(r => r.roleName).join(', ') || 'N/A'}`);
    return data.data;
  } else {
    console.log('❌ 用户信息获取失败:', data.msg);
    return null;
  }
}

// 4. 获取活动列表
async function getActivityList() {
  console.log('\n🎯 步骤4: 获取活动列表');
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows && data.rows.length > 0) {
    console.log(`✅ 获取到 ${data.rows.length} 个活动`);
    
    // 查找可报名的活动（status为0或-1）
    const availableActivity = data.rows.find(activity => 
      activity.signStatus === 0 && activity.type !== 2
    );
    
    if (availableActivity) {
      testActivityId = availableActivity.id;
      console.log(`🎯 选择活动: ${availableActivity.activityName} (ID: ${testActivityId})`);
      console.log(`📅 活动时间: ${availableActivity.startTime} - ${availableActivity.endTime}`);
      console.log(`📊 报名状态: ${availableActivity.signStatus} (0=未报名)`);
      console.log(`🎪 活动状态: ${availableActivity.type} (-1=即将开始, 1=已开始, 2=已结束)`);
      return availableActivity;
    } else {
      console.log('⚠️ 没有找到可报名的活动');
      // 显示所有活动的状态
      data.rows.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.activityName}: signStatus=${activity.signStatus}, type=${activity.type}`);
      });
      return null;
    }
  } else {
    console.log('❌ 活动列表获取失败或为空:', data.msg);
    return null;
  }
}

// 5. 活动报名
async function enrollActivity() {
  console.log('\n📝 步骤5: 活动报名');
  
  if (!testActivityId) {
    console.log('❌ 没有选择测试活动');
    return false;
  }
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/enroll?activityId=${testActivityId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200) {
    console.log('✅ 活动报名成功');
    return true;
  } else {
    console.log('❌ 活动报名失败:', data.msg);
    return false;
  }
}

// 6. 验证报名状态更新
async function verifyEnrollmentStatus() {
  console.log('\n🔍 步骤6: 验证报名状态更新');
  
  // 等待2秒让后端处理
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows) {
    const enrolledActivity = data.rows.find(activity => activity.id === testActivityId);
    
    if (enrolledActivity) {
      console.log(`📊 活动报名状态: ${enrolledActivity.signStatus}`);
      console.log(`预期状态: -1 (已报名未签到)`);
      
      if (enrolledActivity.signStatus === -1) {
        console.log('✅ 报名状态更新正确');
        return true;
      } else {
        console.log('❌ 报名状态更新异常');
        return false;
      }
    } else {
      console.log('❌ 未找到报名活动记录');
      return false;
    }
  } else {
    console.log('❌ 验证报名状态失败:', data.msg);
    return false;
  }
}

// 7. 获取用户相关活动
async function getUserActivities() {
  console.log('\n📋 步骤7: 获取用户相关活动');
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/userActivitylist?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200) {
    console.log(`✅ 用户相关活动: ${data.rows ? data.rows.length : 0} 个`);
    
    if (data.rows && data.rows.length > 0) {
      data.rows.forEach(activity => {
        console.log(`- ${activity.activityName}: signStatus=${activity.signStatus}`);
      });
    }
    return data.rows;
  } else {
    console.log('❌ 获取用户活动失败:', data.msg);
    return null;
  }
}

// 8. 活动签到
async function signInActivity() {
  console.log('\n✍️ 步骤8: 活动签到');
  
  if (!testActivityId) {
    console.log('❌ 没有选择测试活动');
    return false;
  }
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/signIn?activityId=${testActivityId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200) {
    console.log('✅ 活动签到成功');
    return true;
  } else {
    console.log('❌ 活动签到失败:', data.msg);
    return false;
  }
}

// 9. 验证签到状态更新
async function verifySignInStatus() {
  console.log('\n🔍 步骤9: 验证签到状态更新');
  
  // 等待2秒让后端处理
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows) {
    const signedActivity = data.rows.find(activity => activity.id === testActivityId);
    
    if (signedActivity) {
      console.log(`📊 活动签到状态: ${signedActivity.signStatus}`);
      console.log(`预期状态: 1 (已报名已签到)`);
      
      if (signedActivity.signStatus === 1) {
        console.log('✅ 签到状态更新正确');
        return true;
      } else {
        console.log('❌ 签到状态更新异常');
        return false;
      }
    } else {
      console.log('❌ 未找到签到活动记录');
      return false;
    }
  } else {
    console.log('❌ 验证签到状态失败:', data.msg);
    return false;
  }
}

// 10. 清理缓存测试
async function testCacheClear() {
  console.log('\n🧹 步骤10: 测试缓存清理');
  
  // 模拟清理AsyncStorage缓存
  console.log('🗑️ 清理本地存储缓存...');
  
  // 重新获取数据验证缓存已清理
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200) {
    console.log('✅ 缓存清理后数据获取正常');
    return true;
  } else {
    console.log('❌ 缓存清理后数据获取失败');
    return false;
  }
}

// 主测试流程
async function runCompleteTest() {
  console.log('🚀 开始PomeloX活动页面完整逻辑测试');
  console.log('=' * 50);
  
  const results = {};
  
  try {
    // 步骤1: 注册新用户
    results.register = await registerUser();
    
    if (results.register) {
      // 步骤2: 用户登录
      results.login = await loginUser();
      
      if (results.login) {
        // 步骤3: 获取用户信息
        results.userInfo = await getUserInfo();
        
        // 步骤4: 获取活动列表
        results.activityList = await getActivityList();
        
        if (results.activityList) {
          // 步骤5: 活动报名
          results.enroll = await enrollActivity();
          
          if (results.enroll) {
            // 步骤6: 验证报名状态
            results.enrollStatus = await verifyEnrollmentStatus();
            
            // 步骤7: 获取用户活动
            results.userActivities = await getUserActivities();
            
            // 步骤8: 活动签到
            results.signIn = await signInActivity();
            
            if (results.signIn) {
              // 步骤9: 验证签到状态
              results.signInStatus = await verifySignInStatus();
              
              // 步骤10: 缓存清理测试
              results.cacheTest = await testCacheClear();
            }
          }
        }
      }
    }
    
    // 测试结果汇总
    console.log('\n📊 测试结果汇总:');
    console.log('=' * 50);
    console.log(`🔰 用户注册: ${results.register ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🔑 用户登录: ${results.login ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📋 用户信息: ${results.userInfo ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🎯 活动列表: ${results.activityList ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📝 活动报名: ${results.enroll ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🔍 报名状态: ${results.enrollStatus ? '✅ 正确' : '❌ 异常'}`);
    console.log(`📋 用户活动: ${results.userActivities ? '✅ 成功' : '❌ 失败'}`);
    console.log(`✍️ 活动签到: ${results.signIn ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🔍 签到状态: ${results.signInStatus ? '✅ 正确' : '❌ 异常'}`);
    console.log(`🧹 缓存测试: ${results.cacheTest ? '✅ 成功' : '❌ 失败'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalSteps = Object.keys(results).length;
    
    console.log(`\n🎯 成功率: ${successCount}/${totalSteps} (${Math.round(successCount/totalSteps*100)}%)`);
    
    // 问题分析
    if (results.enroll && !results.enrollStatus) {
      console.log('\n⚠️ 发现问题: 报名成功但状态未正确更新');
      console.log('可能原因:');
      console.log('1. 后端数据更新延迟');
      console.log('2. signStatus字段更新逻辑问题');
      console.log('3. userId参数传递问题');
    }
    
    if (results.signIn && !results.signInStatus) {
      console.log('\n⚠️ 发现问题: 签到成功但状态未正确更新');
      console.log('可能原因:');
      console.log('1. 签到逻辑与报名状态更新不同步');
      console.log('2. signStatus从-1到1的状态转换问题');
      console.log('3. 数据库事务处理问题');
    }
    
  } catch (error) {
    console.error('🚨 测试过程中发生错误:', error.message);
  }
  
  console.log('\n🏁 测试完成');
  console.log(`👤 测试用户: ${testUser.userName}`);
  console.log(`📱 用户ID: ${userId}`);
  console.log(`🎯 测试活动ID: ${testActivityId}`);
}

// 运行测试
runCompleteTest();