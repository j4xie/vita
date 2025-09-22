/**
 * 后端修复验证测试
 * 测试SQL错误是否修复，重复报名防护是否生效，完整流程是否正常
 */

const BASE_URL = 'https://www.vitaglobal.icu';

let userToken = '';
let userId = 0;
let testActivityId = 0;

// HTTP请求封装
async function makeRequest(url, options = {}) {
  try {
    console.log(`📡 请求: ${options.method || 'GET'} ${url}`);
    if (options.body && options.body.length < 150) {
      console.log('📋 参数:', options.body);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers
      }
    });
    
    const data = await response.json();
    console.log(`✅ 状态: ${response.status}, 结果: ${data.code === 200 ? '成功' : '失败'}`);
    if (data.code !== 200 && data.msg) {
      const errorMsg = data.msg.length > 100 ? data.msg.substring(0, 100) + '...' : data.msg;
      console.log('📋 响应:', errorMsg);
    }
    
    return { response, data };
  } catch (error) {
    console.error('❌ 请求异常:', error.message);
    throw error;
  }
}

// 登录
async function login() {
  console.log('\n🔑 登录获取token...');
  
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
    console.log(`✅ 登录成功，用户ID: ${userId}`);
    return true;
  }
  return false;
}

// 测试1: 验证活动列表API修复
async function testActivityListAPI() {
  console.log('\n🧪 测试1: 验证活动列表API是否修复');
  console.log('='.repeat(50));
  
  try {
    // 测试原有的带userId的API
    const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=10&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    if (data.code === 200) {
      console.log('✅ API修复成功！无SQL错误');
      console.log(`📊 获取到 ${data.rows ? data.rows.length : 0} 个活动`);
      
      if (data.rows && data.rows.length > 0) {
        // 显示前3个活动的状态信息
        console.log('\n📋 活动状态预览:');
        data.rows.slice(0, 3).forEach((activity, index) => {
          const statusText = {
            0: '未报名',
            '-1': '已报名未签到',
            1: '已报名已签到'
          }[activity.signStatus] || '未知';
          
          console.log(`${index + 1}. ${activity.activityName || activity.name}`);
          console.log(`   ID: ${activity.id}, 状态: ${activity.signStatus} (${statusText})`);
        });
        
        // 选择第一个活动进行后续测试
        testActivityId = data.rows[0].id;
        console.log(`\n🎯 选择测试活动: ${data.rows[0].activityName || data.rows[0].name} (ID: ${testActivityId})`);
        
        return { success: true, activities: data.rows };
      }
    } else {
      console.log('❌ API仍有问题:', data.msg);
      
      // 检查是否还是SQL错误
      if (data.msg && data.msg.includes('Subquery returns more than 1 row')) {
        console.log('🚨 SQL错误未修复！');
        return { success: false, error: 'SQL_ERROR_NOT_FIXED' };
      } else {
        console.log('⚠️ 其他类型错误:', data.msg);
        return { success: false, error: 'OTHER_ERROR', message: data.msg };
      }
    }
  } catch (error) {
    console.log('❌ API调用异常:', error.message);
    return { success: false, error: 'API_EXCEPTION', message: error.message };
  }
}

// 测试2: 验证完整报名流程
async function testEnrollmentFlow(activityId) {
  console.log('\n🧪 测试2: 验证完整报名流程');
  console.log('='.repeat(50));
  
  // 获取初始状态
  const initialStatus = await getActivityStatus(activityId);
  console.log(`📊 初始状态: ${initialStatus.signStatus} (${getStatusText(initialStatus.signStatus)})`);
  
  let testResult = {
    initialStatus: initialStatus.signStatus,
    enrollSuccess: false,
    statusUpdated: false,
    signInSuccess: false,
    finalStatus: null
  };
  
  try {
    // 如果已报名，先测试签到；如果未报名，测试报名
    if (initialStatus.signStatus === 0) {
      console.log('\n📝 执行报名测试...');
      
      const { data } = await makeRequest(`${BASE_URL}/app/activity/enroll?activityId=${activityId}&userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      console.log(`📊 报名API响应: ${data.code} - ${data.msg}`);
      testResult.enrollSuccess = data.code === 200;
      
      if (testResult.enrollSuccess) {
        // 等待状态更新
        console.log('⏳ 等待状态更新...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 验证状态更新
        const afterEnrollStatus = await getActivityStatus(activityId);
        console.log(`📊 报名后状态: ${afterEnrollStatus.signStatus} (${getStatusText(afterEnrollStatus.signStatus)})`);
        
        testResult.statusUpdated = afterEnrollStatus.signStatus === -1;
        
        if (testResult.statusUpdated) {
          console.log('✅ 报名状态更新正确！');
          
          // 继续测试签到
          console.log('\n✍️ 执行签到测试...');
          
          const signInResult = await makeRequest(`${BASE_URL}/app/activity/signIn?activityId=${activityId}&userId=${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${userToken}`
            }
          });
          
          console.log(`📊 签到API响应: ${signInResult.data.code} - ${signInResult.data.msg}`);
          testResult.signInSuccess = signInResult.data.code === 200;
          
          if (testResult.signInSuccess) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const finalStatus = await getActivityStatus(activityId);
            console.log(`📊 签到后状态: ${finalStatus.signStatus} (${getStatusText(finalStatus.signStatus)})`);
            testResult.finalStatus = finalStatus.signStatus;
            
            if (finalStatus.signStatus === 1) {
              console.log('✅ 签到状态更新正确！');
            } else {
              console.log('❌ 签到状态更新异常');
            }
          }
        } else {
          console.log('❌ 报名状态更新失败');
        }
      }
      
    } else if (initialStatus.signStatus === -1) {
      console.log('\n✍️ 用户已报名，直接测试签到...');
      
      const signInResult = await makeRequest(`${BASE_URL}/app/activity/signIn?activityId=${activityId}&userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      console.log(`📊 签到API响应: ${signInResult.data.code} - ${signInResult.data.msg}`);
      testResult.signInSuccess = signInResult.data.code === 200;
      
      if (testResult.signInSuccess) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const finalStatus = await getActivityStatus(activityId);
        console.log(`📊 签到后状态: ${finalStatus.signStatus} (${getStatusText(finalStatus.signStatus)})`);
        testResult.finalStatus = finalStatus.signStatus;
      }
      
    } else if (initialStatus.signStatus === 1) {
      console.log('⚠️ 用户已签到，跳过流程测试');
      testResult.finalStatus = 1;
    }
    
  } catch (error) {
    console.error('❌ 流程测试异常:', error.message);
  }
  
  return testResult;
}

// 测试3: 防重复报名机制
async function testDuplicateEnrollmentPrevention(activityId) {
  console.log('\n🧪 测试3: 验证防重复报名机制');
  console.log('='.repeat(50));
  
  try {
    // 连续发送两次报名请求
    console.log('📝 发送第一次报名请求...');
    
    const firstRequest = await makeRequest(`${BASE_URL}/app/activity/enroll?activityId=${activityId}&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    console.log(`📊 第一次报名: ${firstRequest.data.code} - ${firstRequest.data.msg}`);
    
    // 立即发送第二次报名请求
    console.log('📝 发送第二次报名请求...');
    
    const secondRequest = await makeRequest(`${BASE_URL}/app/activity/enroll?activityId=${activityId}&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    console.log(`📊 第二次报名: ${secondRequest.data.code} - ${secondRequest.data.msg}`);
    
    // 分析结果
    if (secondRequest.data.code === 200 && secondRequest.data.msg.includes('已存在')) {
      console.log('✅ 防重复报名机制工作正常！');
      return { success: true, duplicatePrevented: true };
    } else if (secondRequest.data.code !== 200) {
      console.log('✅ 重复报名被拦截！');
      return { success: true, duplicatePrevented: true };
    } else {
      console.log('❌ 防重复报名机制可能有问题');
      return { success: false, duplicatePrevented: false };
    }
    
  } catch (error) {
    console.error('❌ 重复报名测试异常:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试4: 数据一致性检查
async function testDataConsistency(activityId) {
  console.log('\n🧪 测试4: 数据一致性检查');
  console.log('='.repeat(50));
  
  const tests = [];
  
  try {
    for (let i = 1; i <= 5; i++) {
      console.log(`🔄 第${i}次一致性检查...`);
      
      const status = await getActivityStatus(activityId);
      if (status) {
        tests.push({
          round: i,
          signStatus: status.signStatus,
          time: new Date().toLocaleTimeString()
        });
        console.log(`   状态: ${status.signStatus} (${getStatusText(status.signStatus)}) - ${tests[tests.length-1].time}`);
      }
      
      if (i < 5) await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // 分析一致性
    if (tests.length >= 3) {
      const allSame = tests.every(test => test.signStatus === tests[0].signStatus);
      
      if (allSame) {
        console.log('✅ 数据一致性检查通过 - 所有查询结果一致');
        return { success: true, consistent: true, finalStatus: tests[0].signStatus };
      } else {
        console.log('❌ 数据一致性检查失败 - 状态不一致:');
        tests.forEach(test => {
          console.log(`   第${test.round}次: ${test.signStatus} (${test.time})`);
        });
        return { success: false, consistent: false, tests };
      }
    }
    
  } catch (error) {
    console.error('❌ 一致性测试异常:', error.message);
    return { success: false, error: error.message };
  }
}

// 辅助函数：获取活动状态
async function getActivityStatus(activityId) {
  try {
    const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=50&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    if (data.code === 200 && data.rows) {
      const activity = data.rows.find(a => a.id === activityId);
      return activity;
    }
  } catch (error) {
    console.error('获取活动状态失败:', error);
  }
  return null;
}

// 辅助函数：状态文本转换
function getStatusText(status) {
  const map = {
    0: '未报名',
    '-1': '已报名未签到',
    1: '已报名已签到'
  };
  return map[status] || '未知状态';
}

// 主测试流程
async function runBackendFixVerification() {
  console.log('🚀 开始后端修复验证测试');
  console.log('='.repeat(70));
  
  const results = {
    login: false,
    apiFixed: false,
    enrollmentFlow: null,
    duplicatePrevention: null,
    dataConsistency: null
  };
  
  try {
    // 登录
    results.login = await login();
    
    if (!results.login) {
      console.log('❌ 登录失败，无法进行后续测试');
      return results;
    }
    
    // 测试1: API修复验证
    const apiTest = await testActivityListAPI();
    results.apiFixed = apiTest.success;
    
    if (!results.apiFixed) {
      console.log('❌ 活动列表API仍有问题，停止后续测试');
      console.log('🔧 请检查后端修复是否完成');
      return results;
    }
    
    // 测试2: 完整流程验证
    if (testActivityId) {
      results.enrollmentFlow = await testEnrollmentFlow(testActivityId);
      
      // 测试3: 防重复报名
      results.duplicatePrevention = await testDuplicateEnrollmentPrevention(testActivityId);
      
      // 测试4: 数据一致性
      results.dataConsistency = await testDataConsistency(testActivityId);
    }
    
    // 测试结果汇总
    console.log('\n📊 后端修复验证结果汇总');
    console.log('='.repeat(70));
    
    console.log(`🔑 用户登录: ${results.login ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🎯 活动列表API: ${results.apiFixed ? '✅ 修复成功' : '❌ 仍有问题'}`);
    
    if (results.enrollmentFlow) {
      const flow = results.enrollmentFlow;
      console.log(`📝 报名功能: ${flow.enrollSuccess ? '✅ 成功' : flow.initialStatus === 0 ? '❌ 失败' : '⏭️ 跳过'}`);
      console.log(`🔄 状态更新: ${flow.statusUpdated ? '✅ 正确' : flow.initialStatus === 0 ? '❌ 异常' : '⏭️ 跳过'}`);
      console.log(`✍️ 签到功能: ${flow.signInSuccess ? '✅ 成功' : '❌ 失败'}`);
    }
    
    if (results.duplicatePrevention) {
      console.log(`🛡️ 防重复报名: ${results.duplicatePrevention.duplicatePrevented ? '✅ 生效' : '❌ 失效'}`);
    }
    
    if (results.dataConsistency) {
      console.log(`🧹 数据一致性: ${results.dataConsistency.consistent ? '✅ 通过' : '❌ 异常'}`);
    }
    
    // 修复效果评估
    console.log('\n🎯 修复效果评估');
    console.log('='.repeat(50));
    
    if (results.apiFixed) {
      console.log('✅ 关键问题已解决：');
      console.log('   • SQL子查询错误已修复');
      console.log('   • 活动列表可以正常显示用户状态');
    }
    
    if (results.duplicatePrevention?.duplicatePrevented) {
      console.log('✅ 重复报名防护已生效');
    }
    
    if (results.enrollmentFlow?.statusUpdated) {
      console.log('✅ 报名状态同步正常');
    }
    
    if (results.dataConsistency?.consistent) {
      console.log('✅ 数据一致性良好');
    }
    
    // 前端优化建议
    console.log('\n📱 前端优化建议');
    console.log('='.repeat(40));
    
    if (results.apiFixed) {
      console.log('🔄 可以移除API降级方案');
      console.log('📊 恢复使用原有的带userId的活动列表API');
    }
    
    if (!results.duplicatePrevention?.duplicatePrevented) {
      console.log('⚠️ 建议前端保留防重复点击机制');
    }
    
    if (!results.dataConsistency?.consistent) {
      console.log('🔄 建议保留状态轮询机制');
    }
    
    console.log('✨ 建议优化用户体验：');
    console.log('   • 添加操作loading状态');
    console.log('   • 优化成功/失败提示信息');
    console.log('   • 实现乐观更新机制');
    
  } catch (error) {
    console.error('🚨 验证测试异常:', error.message);
  }
  
  console.log('\n🏁 后端修复验证测试完成');
  console.log(`👤 测试用户ID: ${userId}`);
  console.log(`🎯 测试活动ID: ${testActivityId}`);
  console.log(`⏰ 测试时间: ${new Date().toLocaleString()}`);
  
  return results;
}

// 运行验证测试
runBackendFixVerification().catch(console.error);