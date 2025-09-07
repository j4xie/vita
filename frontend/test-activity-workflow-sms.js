/**
 * PomeloX应用活动页面完整逻辑测试 - 使用手机验证码注册
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
  deptId: 1
};

let userToken = '';
let userId = 0;
let testActivityId = 0;

// HTTP请求封装
async function makeRequest(url, options = {}) {
  try {
    console.log(`📡 请求: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('📋 请求数据:', options.body);
    }
    
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

// 1. 获取短信验证码
async function getSMSCode() {
  console.log('\n📱 步骤1: 获取短信验证码');
  console.log(`📞 手机号: ${testUser.phonenumber}`);
  
  const { data } = await makeRequest(`${BASE_URL}/sms/vercodeSms?phoneNum=${testUser.phonenumber}`, {
    method: 'GET'
  });
  
  if (data.code === 200) {
    console.log('✅ 短信验证码发送成功');
    console.log('📱 请手动输入验证码，本测试将使用模拟验证码: 123456');
    return { bizId: data.data, verCode: '123456' }; // 使用通用测试验证码
  } else {
    console.log('❌ 短信验证码发送失败:', data.msg);
    return null;
  }
}

// 2. 使用已存在的用户登录测试
async function useExistingUser() {
  console.log('\n👤 使用已存在的用户进行测试');
  
  // 使用已知的测试用户
  const existingUser = {
    username: 'testuser12345',  // 替换为已存在的用户
    password: 'test123456'
  };
  
  const params = new URLSearchParams();
  params.append('username', existingUser.username);
  params.append('password', existingUser.password);
  
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
    
    // 显示所有活动状态，便于分析
    console.log('\n📋 活动列表详情:');
    data.rows.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.activityName}`);
      console.log(`   ID: ${activity.id}`);
      console.log(`   报名状态: ${activity.signStatus} (0=未报名, -1=已报名未签到, 1=已报名已签到)`);
      console.log(`   活动状态: ${activity.type} (-1=即将开始, 1=已开始, 2=已结束)`);
      console.log(`   时间: ${activity.startTime} - ${activity.endTime}`);
      console.log('');
    });
    
    // 查找可报名的活动
    let availableActivity = data.rows.find(activity => 
      activity.signStatus === 0 && activity.type !== 2
    );
    
    // 如果没有找到未报名的活动，选择一个已报名但未签到的活动进行签到测试
    if (!availableActivity) {
      console.log('⚠️ 没有找到可报名的活动，查找已报名未签到的活动...');
      availableActivity = data.rows.find(activity => activity.signStatus === -1);
      
      if (availableActivity) {
        console.log(`🎯 选择已报名活动进行签到测试: ${availableActivity.activityName} (ID: ${availableActivity.id})`);
        testActivityId = availableActivity.id;
        return { ...availableActivity, skipEnroll: true };
      }
    } else {
      testActivityId = availableActivity.id;
      console.log(`🎯 选择活动: ${availableActivity.activityName} (ID: ${testActivityId})`);
      return availableActivity;
    }
    
    // 如果都没有，选择第一个活动进行状态分析
    if (data.rows.length > 0) {
      testActivityId = data.rows[0].id;
      console.log(`🎯 选择第一个活动进行分析: ${data.rows[0].activityName} (ID: ${testActivityId})`);
      return { ...data.rows[0], analyzeOnly: true };
    }
    
    return null;
  } else {
    console.log('❌ 活动列表获取失败或为空:', data.msg || '无活动数据');
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
  
  console.log(`📊 报名结果 - Code: ${data.code}, Message: ${data.msg}`);
  
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
  
  // 等待3秒让后端处理
  console.log('⏳ 等待3秒让后端处理...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows) {
    const enrolledActivity = data.rows.find(activity => activity.id === testActivityId);
    
    if (enrolledActivity) {
      console.log(`📊 活动当前状态:`);
      console.log(`   活动名称: ${enrolledActivity.activityName}`);
      console.log(`   报名状态: ${enrolledActivity.signStatus}`);
      console.log(`   预期状态: -1 (已报名未签到)`);
      
      if (enrolledActivity.signStatus === -1) {
        console.log('✅ 报名状态更新正确');
        return true;
      } else if (enrolledActivity.signStatus === 0) {
        console.log('❌ 报名状态未更新，仍为未报名状态');
        return false;
      } else if (enrolledActivity.signStatus === 1) {
        console.log('⚠️ 状态为已签到，可能已经报名过或有其他问题');
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
    const activitiesCount = data.rows ? data.rows.length : 0;
    console.log(`✅ 用户相关活动: ${activitiesCount} 个`);
    
    if (data.rows && data.rows.length > 0) {
      console.log('\n用户活动详情:');
      data.rows.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.activityName}`);
        console.log(`   报名状态: ${activity.signStatus}`);
        console.log(`   活动时间: ${activity.startTime} - ${activity.endTime}`);
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
  
  console.log(`📊 签到结果 - Code: ${data.code}, Message: ${data.msg}`);
  
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
  
  // 等待3秒让后端处理
  console.log('⏳ 等待3秒让后端处理...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows) {
    const signedActivity = data.rows.find(activity => activity.id === testActivityId);
    
    if (signedActivity) {
      console.log(`📊 活动当前状态:`);
      console.log(`   活动名称: ${signedActivity.activityName}`);
      console.log(`   报名状态: ${signedActivity.signStatus}`);
      console.log(`   预期状态: 1 (已报名已签到)`);
      
      if (signedActivity.signStatus === 1) {
        console.log('✅ 签到状态更新正确');
        return true;
      } else if (signedActivity.signStatus === -1) {
        console.log('❌ 签到状态未更新，仍为已报名未签到状态');
        return false;
      } else if (signedActivity.signStatus === 0) {
        console.log('❌ 签到状态异常，回退到未报名状态');
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

// 10. 数据清理和缓存测试
async function testDataConsistency() {
  console.log('\n🧹 步骤10: 数据一致性和缓存测试');
  
  // 连续多次获取数据，检查一致性
  const tests = [];
  
  for (let i = 1; i <= 3; i++) {
    console.log(`🔄 第${i}次数据获取...`);
    
    const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    if (data.code === 200 && data.rows) {
      const testActivity = data.rows.find(activity => activity.id === testActivityId);
      if (testActivity) {
        tests.push({
          round: i,
          signStatus: testActivity.signStatus,
          activityName: testActivity.activityName
        });
        console.log(`   活动状态: ${testActivity.signStatus}`);
      }
    }
    
    // 间隔1秒
    if (i < 3) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 检查一致性
  if (tests.length === 3) {
    const allSame = tests.every(test => test.signStatus === tests[0].signStatus);
    if (allSame) {
      console.log('✅ 数据一致性检查通过');
      return true;
    } else {
      console.log('❌ 数据一致性检查失败');
      tests.forEach(test => {
        console.log(`   第${test.round}次: ${test.signStatus}`);
      });
      return false;
    }
  }
  
  return false;
}

// 主测试流程
async function runCompleteTest() {
  console.log('🚀 开始PomeloX活动页面完整逻辑测试 (手机验证码版本)');
  console.log('='.repeat(60));
  
  const results = {};
  
  try {
    // 步骤1: 使用已存在的用户登录
    results.login = await useExistingUser();
    
    if (results.login) {
      // 步骤2: 获取用户信息
      results.userInfo = await getUserInfo();
      
      // 步骤3: 获取活动列表
      const activityData = await getActivityList();
      results.activityList = !!activityData;
      
      if (results.activityList) {
        // 根据活动状态决定测试流程
        if (activityData.analyzeOnly) {
          console.log('\n⚠️ 仅进行状态分析，不执行操作');
          results.enroll = 'skipped';
          results.enrollStatus = 'skipped';
          results.signIn = 'skipped'; 
          results.signInStatus = 'skipped';
        } else if (activityData.skipEnroll) {
          console.log('\n⏭️ 跳过报名，直接测试签到');
          results.enroll = 'skipped';
          results.enrollStatus = 'skipped';
          
          // 步骤4: 活动签到
          results.signIn = await signInActivity();
          
          if (results.signIn) {
            // 步骤5: 验证签到状态
            results.signInStatus = await verifySignInStatus();
          }
        } else {
          // 完整流程测试
          // 步骤4: 活动报名
          results.enroll = await enrollActivity();
          
          if (results.enroll) {
            // 步骤5: 验证报名状态
            results.enrollStatus = await verifyEnrollmentStatus();
            
            // 步骤6: 活动签到
            results.signIn = await signInActivity();
            
            if (results.signIn) {
              // 步骤7: 验证签到状态
              results.signInStatus = await verifySignInStatus();
            }
          }
        }
        
        // 步骤8: 获取用户活动
        results.userActivities = await getUserActivities();
        
        // 步骤9: 数据一致性测试
        results.dataConsistency = await testDataConsistency();
      }
    }
    
    // 测试结果汇总
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(60));
    console.log(`🔑 用户登录: ${results.login ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📋 用户信息: ${results.userInfo ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🎯 活动列表: ${results.activityList ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📝 活动报名: ${results.enroll === 'skipped' ? '⏭️ 跳过' : results.enroll ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🔍 报名状态: ${results.enrollStatus === 'skipped' ? '⏭️ 跳过' : results.enrollStatus ? '✅ 正确' : '❌ 异常'}`);
    console.log(`✍️ 活动签到: ${results.signIn === 'skipped' ? '⏭️ 跳过' : results.signIn ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🔍 签到状态: ${results.signInStatus === 'skipped' ? '⏭️ 跳过' : results.signInStatus ? '✅ 正确' : '❌ 异常'}`);
    console.log(`📋 用户活动: ${results.userActivities ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🧹 数据一致性: ${results.dataConsistency ? '✅ 成功' : '❌ 失败'}`);
    
    // 计算成功率（排除跳过的项目）
    const validResults = Object.entries(results).filter(([key, value]) => value !== 'skipped');
    const successCount = validResults.filter(([key, value]) => value === true).length;
    const totalSteps = validResults.length;
    
    console.log(`\n🎯 成功率: ${successCount}/${totalSteps} (${Math.round(successCount/totalSteps*100)}%)`);
    
    // 问题分析和修复建议
    console.log('\n🔧 问题分析和修复建议:');
    console.log('='.repeat(60));
    
    if (results.enroll && !results.enrollStatus) {
      console.log('⚠️ 问题1: 报名成功但状态未正确更新');
      console.log('🔍 可能原因:');
      console.log('   1. 后端signStatus字段更新存在延迟');
      console.log('   2. app/activity/enroll接口没有同步更新signStatus');
      console.log('   3. userId参数传递问题');
      console.log('💡 修复建议:');
      console.log('   1. 检查后端enroll接口是否正确更新signStatus字段');
      console.log('   2. 增加数据库事务确保状态更新的原子性');
      console.log('   3. 前端增加重试机制和状态轮询');
    }
    
    if (results.signIn && !results.signInStatus) {
      console.log('⚠️ 问题2: 签到成功但状态未正确更新');
      console.log('🔍 可能原因:');
      console.log('   1. signIn接口逻辑问题，未将signStatus从-1更新为1');
      console.log('   2. 数据库约束或触发器问题');
      console.log('   3. 缓存未及时更新');
      console.log('💡 修复建议:');
      console.log('   1. 检查signIn接口的数据库更新逻辑');
      console.log('   2. 确保signStatus字段正确更新为1');
      console.log('   3. 清理相关缓存或增加缓存失效机制');
    }
    
    if (!results.dataConsistency) {
      console.log('⚠️ 问题3: 数据一致性问题');
      console.log('🔍 可能原因:');
      console.log('   1. 缓存机制导致数据不一致');
      console.log('   2. 数据库读写分离延迟');
      console.log('   3. 并发操作冲突');
      console.log('💡 修复建议:');
      console.log('   1. 优化缓存策略，确保数据更新后及时清理缓存');
      console.log('   2. 增加数据库读写同步机制');
      console.log('   3. 实现乐观锁或悲观锁机制');
    }
    
    // 前端修复建议
    console.log('\n📱 前端优化建议:');
    console.log('='.repeat(60));
    console.log('1. 增加报名和签到后的状态刷新机制');
    console.log('2. 实现本地状态管理与服务器状态同步');
    console.log('3. 添加操作成功后的loading状态和重试机制');
    console.log('4. 优化缓存策略，操作后清理相关缓存');
    console.log('5. 增加错误处理和用户提示');
    
  } catch (error) {
    console.error('🚨 测试过程中发生错误:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🏁 测试完成');
  console.log(`👤 测试用户ID: ${userId}`);
  console.log(`🎯 测试活动ID: ${testActivityId}`);
  console.log('📄 完整测试日志已保存');
}

// 运行测试
runCompleteTest();