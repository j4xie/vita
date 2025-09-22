/**
 * PomeloX应用活动页面完整逻辑测试 - 使用admin用户
 * 测试流程：登录 -> 活动报名 -> 签到 -> 状态验证
 */

const BASE_URL = 'https://www.vitaglobal.icu';

let userToken = '';
let userId = 0;
let testActivityId = 0;
let userInfo = null;

// HTTP请求封装
async function makeRequest(url, options = {}) {
  try {
    console.log(`📡 请求: ${options.method || 'GET'} ${url}`);
    if (options.body && options.body.length < 200) {
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

// 1. 使用admin用户登录
async function loginAsAdmin() {
  console.log('\n🔑 步骤1: Admin用户登录');
  
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
    console.log(`✅ 登录成功，获得Token: ${userToken.substring(0, 20)}...`);
    console.log(`👤 用户ID: ${userId}`);
    return true;
  } else {
    console.log('❌ 登录失败:', data.msg);
    return false;
  }
}

// 2. 获取用户信息
async function getUserInfo() {
  console.log('\n📋 步骤2: 获取用户信息');
  
  const { data } = await makeRequest(`${BASE_URL}/app/user/info`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200) {
    if (data.data && typeof data.data === 'object') {
      userInfo = data.data;
      console.log('✅ 用户信息获取成功');
      console.log(`👤 用户名: ${data.data.userName || 'N/A'}`);
      console.log(`🏫 部门: ${data.data.dept?.deptName || 'N/A'}`);
      console.log(`🎭 角色: ${data.data.roles?.map(r => r.roleName).join(', ') || 'N/A'}`);
      console.log(`🔑 权限等级: ${data.data.roles?.map(r => r.key).join(', ') || 'N/A'}`);
      return data.data;
    } else {
      console.log('⚠️ 用户信息响应成功但data字段为空');
      console.log('🔍 响应详情:', JSON.stringify(data, null, 2));
      // 设置默认用户信息
      userInfo = { userName: 'admin', userId: userId };
      return userInfo;
    }
  } else {
    console.log('❌ 用户信息获取失败:', data.msg);
    // 设置默认用户信息以便继续测试
    userInfo = { userName: 'admin', userId: userId };
    return null;
  }
}

// 3. 获取活动列表并分析状态
async function analyzeActivityList() {
  console.log('\n🎯 步骤3: 获取和分析活动列表');
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows && data.rows.length > 0) {
    console.log(`✅ 获取到 ${data.rows.length} 个活动`);
    
    console.log('\n📋 活动状态分析:');
    console.log('='.repeat(80));
    
    data.rows.forEach((activity, index) => {
      const statusText = {
        0: '未报名',
        '-1': '已报名未签到', 
        1: '已报名已签到'
      }[activity.signStatus] || '未知状态';
      
      const typeText = {
        '-1': '即将开始',
        1: '进行中',
        2: '已结束'
      }[activity.type] || '未知类型';
      
      console.log(`${index + 1}. 【${activity.activityName}】`);
      console.log(`   ID: ${activity.id}`);
      console.log(`   报名状态: ${activity.signStatus} (${statusText})`);
      console.log(`   活动状态: ${activity.type} (${typeText})`);
      console.log(`   开始时间: ${activity.startTime}`);
      console.log(`   结束时间: ${activity.endTime}`);
      console.log(`   最大人数: ${activity.maxPeople || 'N/A'}`);
      console.log(`   已报名: ${activity.enrolledCount || 'N/A'}`);
      console.log('');
    });
    
    // 查找可以测试的活动
    const testCandidates = [];
    
    // 未报名且未结束的活动
    const unregistered = data.rows.filter(a => a.signStatus === 0 && a.type !== 2);
    if (unregistered.length > 0) {
      testCandidates.push({
        activity: unregistered[0],
        testType: 'full',
        description: '完整测试：报名 -> 签到'
      });
    }
    
    // 已报名未签到的活动
    const registered = data.rows.filter(a => a.signStatus === -1);
    if (registered.length > 0) {
      testCandidates.push({
        activity: registered[0],
        testType: 'signIn',
        description: '签到测试：直接签到'
      });
    }
    
    // 已签到的活动（用于状态验证）
    const signedIn = data.rows.filter(a => a.signStatus === 1);
    if (signedIn.length > 0) {
      testCandidates.push({
        activity: signedIn[0],
        testType: 'verify',
        description: '状态验证：检查数据一致性'
      });
    }
    
    console.log('🎯 测试计划:');
    console.log('='.repeat(40));
    if (testCandidates.length > 0) {
      testCandidates.forEach((candidate, index) => {
        console.log(`${index + 1}. ${candidate.activity.activityName}`);
        console.log(`   测试类型: ${candidate.description}`);
        console.log(`   活动ID: ${candidate.activity.id}`);
      });
      
      // 选择第一个测试候选
      const selectedTest = testCandidates[0];
      testActivityId = selectedTest.activity.id;
      console.log(`\n✅ 选择测试活动: ${selectedTest.activity.activityName}`);
      console.log(`🎯 测试类型: ${selectedTest.description}`);
      
      return selectedTest;
    } else {
      console.log('⚠️ 没有找到合适的测试活动');
      if (data.rows.length > 0) {
        testActivityId = data.rows[0].id;
        console.log(`🎯 将使用第一个活动进行分析: ${data.rows[0].activityName}`);
        return {
          activity: data.rows[0],
          testType: 'analyze',
          description: '仅分析状态'
        };
      }
      return null;
    }
  } else {
    console.log('❌ 活动列表获取失败或为空:', data.msg || '无数据');
    return null;
  }
}

// 4. 执行活动报名
async function enrollInActivity() {
  console.log('\n📝 步骤4: 执行活动报名');
  console.log(`🎯 目标活动ID: ${testActivityId}`);
  
  // 报名前状态
  const beforeEnroll = await getActivityStatus();
  console.log(`📊 报名前状态: ${beforeEnroll?.signStatus}`);
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/enroll?activityId=${testActivityId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  console.log(`📊 报名API响应 - Code: ${data.code}, Message: ${data.msg}`);
  
  if (data.code === 200) {
    console.log('✅ 活动报名API调用成功');
    
    // 等待3秒让后端处理
    console.log('⏳ 等待3秒让后端处理状态更新...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 验证状态更新
    const afterEnroll = await getActivityStatus();
    console.log(`📊 报名后状态: ${afterEnroll?.signStatus}`);
    
    if (afterEnroll && afterEnroll.signStatus === -1) {
      console.log('✅ 报名状态更新正确 (0 -> -1)');
      return true;
    } else if (afterEnroll && afterEnroll.signStatus === beforeEnroll?.signStatus) {
      console.log('❌ 报名状态未更新');
      return false;
    } else {
      console.log(`⚠️ 报名状态异常: ${beforeEnroll?.signStatus} -> ${afterEnroll?.signStatus}`);
      return false;
    }
  } else {
    console.log('❌ 活动报名失败:', data.msg);
    return false;
  }
}

// 5. 执行活动签到
async function signInToActivity() {
  console.log('\n✍️ 步骤5: 执行活动签到');
  console.log(`🎯 目标活动ID: ${testActivityId}`);
  
  // 签到前状态
  const beforeSignIn = await getActivityStatus();
  console.log(`📊 签到前状态: ${beforeSignIn?.signStatus}`);
  
  const { data } = await makeRequest(`${BASE_URL}/app/activity/signIn?activityId=${testActivityId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  console.log(`📊 签到API响应 - Code: ${data.code}, Message: ${data.msg}`);
  
  if (data.code === 200) {
    console.log('✅ 活动签到API调用成功');
    
    // 等待3秒让后端处理
    console.log('⏳ 等待3秒让后端处理状态更新...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 验证状态更新
    const afterSignIn = await getActivityStatus();
    console.log(`📊 签到后状态: ${afterSignIn?.signStatus}`);
    
    if (afterSignIn && afterSignIn.signStatus === 1) {
      console.log('✅ 签到状态更新正确 (-1 -> 1)');
      return true;
    } else if (afterSignIn && afterSignIn.signStatus === beforeSignIn?.signStatus) {
      console.log('❌ 签到状态未更新');
      return false;
    } else {
      console.log(`⚠️ 签到状态异常: ${beforeSignIn?.signStatus} -> ${afterSignIn?.signStatus}`);
      return false;
    }
  } else {
    console.log('❌ 活动签到失败:', data.msg);
    return false;
  }
}

// 辅助函数：获取特定活动的当前状态
async function getActivityStatus() {
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=50&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows) {
    const activity = data.rows.find(a => a.id === testActivityId);
    return activity;
  }
  return null;
}

// 6. 数据一致性测试
async function testDataConsistency() {
  console.log('\n🧹 步骤6: 数据一致性验证');
  
  const tests = [];
  
  for (let i = 1; i <= 5; i++) {
    console.log(`🔄 第${i}次数据获取...`);
    
    const activity = await getActivityStatus();
    if (activity) {
      tests.push({
        round: i,
        signStatus: activity.signStatus,
        activityName: activity.activityName,
        timestamp: new Date().toLocaleTimeString()
      });
      console.log(`   状态: ${activity.signStatus}, 时间: ${tests[tests.length-1].timestamp}`);
    }
    
    // 间隔1秒
    if (i < 5) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 分析一致性
  if (tests.length >= 3) {
    const statuses = tests.map(t => t.signStatus);
    const allSame = statuses.every(status => status === statuses[0]);
    
    if (allSame) {
      console.log('✅ 数据一致性检查通过 - 所有5次查询状态相同');
      return true;
    } else {
      console.log('❌ 数据一致性检查失败 - 状态不一致:');
      tests.forEach(test => {
        console.log(`   第${test.round}次: ${test.signStatus} (${test.timestamp})`);
      });
      return false;
    }
  }
  
  return false;
}

// 7. 获取用户相关活动验证
async function verifyUserActivities() {
  console.log('\n📋 步骤7: 验证用户相关活动');
  
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
      console.log('\n用户活动清单:');
      data.rows.forEach((activity, index) => {
        const statusText = {
          0: '未报名',
          '-1': '已报名未签到',
          1: '已报名已签到'
        }[activity.signStatus] || '未知';
        
        console.log(`${index + 1}. ${activity.activityName}`);
        console.log(`   状态: ${activity.signStatus} (${statusText})`);
        console.log(`   时间: ${activity.startTime}`);
      });
      
      // 检查测试活动是否在用户活动列表中
      const testActivity = data.rows.find(a => a.id === testActivityId);
      if (testActivity) {
        console.log(`\n✅ 测试活动在用户活动列表中，状态: ${testActivity.signStatus}`);
        return testActivity;
      } else {
        console.log('\n⚠️ 测试活动未出现在用户活动列表中');
        return null;
      }
    }
    return data.rows;
  } else {
    console.log('❌ 获取用户活动失败:', data.msg);
    return null;
  }
}

// 主测试流程
async function runActivityWorkflowTest() {
  console.log('🚀 开始PomeloX活动页面完整逻辑测试 (Admin用户版)');
  console.log('='.repeat(70));
  
  const results = {};
  let testPlan = null;
  
  try {
    // 步骤1: 登录
    results.login = await loginAsAdmin();
    
    if (results.login) {
      // 步骤2: 获取用户信息
      results.userInfo = await getUserInfo();
      
      // 步骤3: 分析活动列表
      testPlan = await analyzeActivityList();
      results.activityAnalysis = !!testPlan;
      
      if (testPlan) {
        // 根据测试计划执行不同的测试
        switch (testPlan.testType) {
          case 'full':
            console.log('\n🎯 执行完整测试流程...');
            results.enroll = await enrollInActivity();
            if (results.enroll) {
              results.signIn = await signInToActivity();
            }
            break;
            
          case 'signIn':
            console.log('\n🎯 执行签到测试...');
            results.signIn = await signInToActivity();
            results.enroll = 'skipped';
            break;
            
          case 'verify':
            console.log('\n🎯 执行状态验证...');
            results.enroll = 'skipped';
            results.signIn = 'skipped';
            break;
            
          case 'analyze':
            console.log('\n🎯 仅执行状态分析...');
            results.enroll = 'skipped';
            results.signIn = 'skipped';
            break;
        }
        
        // 步骤6: 数据一致性测试
        results.dataConsistency = await testDataConsistency();
        
        // 步骤7: 用户活动验证
        results.userActivities = await verifyUserActivities();
      }
    }
    
    // 测试结果汇总
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(70));
    console.log(`🔑 用户登录: ${results.login ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📋 用户信息: ${results.userInfo ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🎯 活动分析: ${results.activityAnalysis ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📝 活动报名: ${results.enroll === 'skipped' ? '⏭️ 跳过' : results.enroll ? '✅ 成功' : '❌ 失败'}`);
    console.log(`✍️ 活动签到: ${results.signIn === 'skipped' ? '⏭️ 跳过' : results.signIn ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🧹 数据一致性: ${results.dataConsistency ? '✅ 通过' : '❌ 失败'}`);
    console.log(`📋 用户活动: ${results.userActivities ? '✅ 验证通过' : '❌ 验证失败'}`);
    
    // 计算成功率
    const validResults = Object.entries(results).filter(([key, value]) => value !== 'skipped');
    const successCount = validResults.filter(([key, value]) => value === true).length;
    const totalSteps = validResults.length;
    
    console.log(`\n🎯 总体成功率: ${successCount}/${totalSteps} (${Math.round(successCount/totalSteps*100)}%)`);
    
    // 问题诊断
    console.log('\n🔧 问题诊断和修复建议:');
    console.log('='.repeat(70));
    
    if (results.enroll === false) {
      console.log('⚠️ 【报名问题】活动报名成功但状态未更新');
      console.log('🔍 可能原因:');
      console.log('  1. 后端 /app/activity/enroll 接口未正确更新 signStatus 字段');
      console.log('  2. 数据库事务问题导致状态更新失败');
      console.log('  3. 用户权限问题或活动状态限制');
      console.log('💡 建议检查:');
      console.log('  - 后端日志中是否有数据库更新错误');
      console.log('  - 活动的最大人数限制是否已满');
      console.log('  - signStatus字段的数据库约束');
    }
    
    if (results.signIn === false) {
      console.log('⚠️ 【签到问题】活动签到成功但状态未更新');
      console.log('🔍 可能原因:');
      console.log('  1. 后端 /app/activity/signIn 接口未正确更新状态');
      console.log('  2. signStatus从-1更新到1的逻辑有问题');
      console.log('  3. 签到时间验证失败导致更新被阻止');
      console.log('💡 建议检查:');
      console.log('  - 签到时间是否在活动时间范围内');
      console.log('  - 数据库字段是否支持状态转换');
      console.log('  - 并发签到的处理逻辑');
    }
    
    if (!results.dataConsistency) {
      console.log('⚠️ 【数据一致性问题】多次查询结果不一致');
      console.log('🔍 可能原因:');
      console.log('  1. 缓存延迟导致读取到旧数据');
      console.log('  2. 数据库主从同步延迟');
      console.log('  3. 后端API缓存策略不当');
      console.log('💡 建议优化:');
      console.log('  - 操作后立即清理相关缓存');
      console.log('  - 使用数据库事务确保一致性');
      console.log('  - 实现前端状态的乐观更新');
    }
    
    // 前端改进建议
    console.log('\n📱 前端改进建议:');
    console.log('='.repeat(50));
    console.log('1. 🔄 添加操作后的状态轮询机制');
    console.log('   - 报名/签到成功后每1秒查询一次状态，最多查询10次');
    console.log('2. 🎯 实现乐观更新策略');
    console.log('   - 操作成功后立即更新本地状态，避免等待服务器响应');
    console.log('3. ⚠️ 增强错误处理和重试机制');
    console.log('   - API调用失败时自动重试3次');
    console.log('   - 显示详细的错误信息和操作建议');
    console.log('4. 🧹 优化缓存管理');
    console.log('   - 活动操作后清理ActivityList相关缓存');
    console.log('   - 实现缓存失效和自动刷新机制');
    console.log('5. 📊 添加操作状态指示器');
    console.log('   - 显示"正在报名..."、"正在签到..."等loading状态');
    console.log('   - 操作完成后显示确认信息');
    
  } catch (error) {
    console.error('🚨 测试过程中发生严重错误:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n🏁 测试完成');
  if (testPlan) {
    console.log(`🎯 测试计划: ${testPlan.description}`);
    console.log(`📱 测试活动: ${testPlan.activity.activityName} (ID: ${testActivityId})`);
  }
  console.log(`👤 测试用户: ${userInfo?.userName || 'admin'} (ID: ${userId})`);
  console.log(`⏰ 测试时间: ${new Date().toLocaleString()}`);
}

// 运行测试
runActivityWorkflowTest().catch(console.error);