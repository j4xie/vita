/**
 * PomeloX活动页面修复方案测试
 * 绕过后端SQL错误，使用替代方案完成活动流程测试
 */

const BASE_URL = 'https://www.vitaglobal.icu';

let userToken = '';
let userId = 0;
let testActivityId = 0;

// HTTP请求封装
async function makeRequest(url, options = {}) {
  try {
    console.log(`📡 请求: ${options.method || 'GET'} ${url}`);
    if (options.body && options.body.length < 100) {
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
    if (data.code !== 200) {
      console.log('❌ 错误:', data.msg?.substring(0, 100) + '...');
    }
    
    return { response, data };
  } catch (error) {
    console.error('❌ 请求异常:', error.message);
    throw error;
  }
}

// 1. 登录
async function login() {
  console.log('\n🔑 步骤1: 用户登录');
  
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
  } else {
    console.log('❌ 登录失败:', data.msg);
    return false;
  }
}

// 2. 获取活动列表（使用修复方案）
async function getActivityListWorkaround() {
  console.log('\n🎯 步骤2: 获取活动列表（修复方案）');
  
  // 方案：不带userId参数，避免SQL子查询错误
  const { data } = await makeRequest(`${BASE_URL}/app/activity/list?pageNum=1&pageSize=20`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows && data.rows.length > 0) {
    console.log(`✅ 成功获取 ${data.rows.length} 个活动（绕过SQL错误）`);
    
    console.log('\n📋 活动列表:');
    data.rows.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.activityName || activity.name}`);
      console.log(`   ID: ${activity.id}`);
      console.log(`   状态: ${activity.type} (${getActivityTypeText(activity.type)})`);
      console.log(`   时间: ${activity.startTime} - ${activity.endTime}`);
      // 注意：由于绕过了SQL查询，这里不会有signStatus字段
      console.log(`   报名状态: 需要单独查询`);
      console.log('');
    });
    
    // 选择第一个活动进行测试
    testActivityId = data.rows[0].id;
    console.log(`🎯 选择测试活动: ${data.rows[0].activityName || data.rows[0].name} (ID: ${testActivityId})`);
    
    return data.rows;
  } else {
    console.log('❌ 活动列表获取失败:', data.msg);
    return null;
  }
}

// 3. 获取用户对特定活动的状态（单独查询）
async function getUserActivityStatus(activityId) {
  console.log(`\n🔍 步骤3: 查询活动 ${activityId} 的用户状态`);
  
  // 使用用户相关活动API
  const { data } = await makeRequest(`${BASE_URL}/app/activity/userActivitylist?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (data.code === 200 && data.rows) {
    const userActivity = data.rows.find(activity => activity.id === activityId);
    
    if (userActivity) {
      console.log(`✅ 找到用户活动状态: ${userActivity.signStatus}`);
      console.log(`📊 状态含义: ${getSignStatusText(userActivity.signStatus)}`);
      return userActivity.signStatus;
    } else {
      console.log('📄 用户未报名此活动 (状态: 0)');
      return 0; // 未报名状态
    }
  } else {
    console.log('❌ 用户活动状态查询失败:', data.msg);
    return null;
  }
}

// 4. 执行活动报名
async function enrollActivity() {
  console.log('\n📝 步骤4: 执行活动报名');
  
  // 报名前检查状态
  const beforeStatus = await getUserActivityStatus(testActivityId);
  console.log(`📊 报名前状态: ${beforeStatus} (${getSignStatusText(beforeStatus)})`);
  
  if (beforeStatus === 0) {
    console.log('✅ 可以报名，执行报名操作...');
    
    const { data } = await makeRequest(`${BASE_URL}/app/activity/enroll?activityId=${testActivityId}&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    console.log(`📊 报名API响应: ${data.code} - ${data.msg}`);
    
    if (data.code === 200) {
      console.log('✅ 报名API调用成功');
      
      // 等待3秒后验证状态
      console.log('⏳ 等待3秒后验证状态更新...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const afterStatus = await getUserActivityStatus(testActivityId);
      console.log(`📊 报名后状态: ${afterStatus} (${getSignStatusText(afterStatus)})`);
      
      if (afterStatus === -1) {
        console.log('✅ 报名状态更新正确！(0 -> -1)');
        return true;
      } else if (afterStatus === beforeStatus) {
        console.log('❌ 报名状态未更新，可能存在数据同步问题');
        return false;
      } else {
        console.log(`⚠️ 报名状态异常: ${beforeStatus} -> ${afterStatus}`);
        return false;
      }
    } else {
      console.log('❌ 报名失败:', data.msg);
      return false;
    }
  } else if (beforeStatus === -1) {
    console.log('⚠️ 用户已报名此活动，跳过报名步骤');
    return 'already_enrolled';
  } else if (beforeStatus === 1) {
    console.log('⚠️ 用户已签到此活动，跳过报名步骤');
    return 'already_signed_in';
  } else {
    console.log('❌ 无法确定活动状态，取消报名');
    return false;
  }
}

// 5. 执行活动签到
async function signInActivity() {
  console.log('\n✍️ 步骤5: 执行活动签到');
  
  // 签到前检查状态
  const beforeStatus = await getUserActivityStatus(testActivityId);
  console.log(`📊 签到前状态: ${beforeStatus} (${getSignStatusText(beforeStatus)})`);
  
  if (beforeStatus === -1) {
    console.log('✅ 用户已报名未签到，可以签到');
    
    const { data } = await makeRequest(`${BASE_URL}/app/activity/signIn?activityId=${testActivityId}&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    console.log(`📊 签到API响应: ${data.code} - ${data.msg}`);
    
    if (data.code === 200) {
      console.log('✅ 签到API调用成功');
      
      // 等待3秒后验证状态
      console.log('⏳ 等待3秒后验证状态更新...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const afterStatus = await getUserActivityStatus(testActivityId);
      console.log(`📊 签到后状态: ${afterStatus} (${getSignStatusText(afterStatus)})`);
      
      if (afterStatus === 1) {
        console.log('✅ 签到状态更新正确！(-1 -> 1)');
        return true;
      } else if (afterStatus === beforeStatus) {
        console.log('❌ 签到状态未更新，可能存在数据同步问题');
        return false;
      } else {
        console.log(`⚠️ 签到状态异常: ${beforeStatus} -> ${afterStatus}`);
        return false;
      }
    } else {
      console.log('❌ 签到失败:', data.msg);
      return false;
    }
  } else if (beforeStatus === 0) {
    console.log('❌ 用户未报名，无法签到');
    return 'not_enrolled';
  } else if (beforeStatus === 1) {
    console.log('⚠️ 用户已签到此活动，跳过签到步骤');
    return 'already_signed_in';
  } else {
    console.log('❌ 无法确定活动状态，取消签到');
    return false;
  }
}

// 6. 数据一致性验证
async function verifyDataConsistency() {
  console.log('\n🧹 步骤6: 数据一致性验证');
  
  const tests = [];
  
  for (let i = 1; i <= 3; i++) {
    console.log(`🔄 第${i}次一致性检查...`);
    
    const status = await getUserActivityStatus(testActivityId);
    if (status !== null) {
      tests.push({
        round: i,
        status: status,
        time: new Date().toLocaleTimeString()
      });
      console.log(`   状态: ${status} (${getSignStatusText(status)}) - ${tests[tests.length-1].time}`);
    }
    
    if (i < 3) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 分析一致性
  if (tests.length >= 2) {
    const allSame = tests.every(test => test.status === tests[0].status);
    
    if (allSame) {
      console.log('✅ 数据一致性检查通过 - 所有查询结果一致');
      return true;
    } else {
      console.log('❌ 数据一致性检查失败 - 状态不一致:');
      tests.forEach(test => {
        console.log(`   第${test.round}次: ${test.status} (${test.time})`);
      });
      return false;
    }
  }
  
  return false;
}

// 辅助函数
function getActivityTypeText(type) {
  const map = {
    '-1': '即将开始',
    '1': '进行中',
    '2': '已结束'
  };
  return map[type] || '未知状态';
}

function getSignStatusText(status) {
  const map = {
    0: '未报名',
    '-1': '已报名未签到',
    '1': '已报名已签到'
  };
  return map[status] || '未知状态';
}

// 主测试流程
async function runActivityWorkflowWithWorkaround() {
  console.log('🚀 开始PomeloX活动页面完整逻辑测试 (修复方案版)');
  console.log('🔧 绕过后端SQL错误，使用前端状态管理');
  console.log('='.repeat(70));
  
  const results = {};
  
  try {
    // 步骤1: 登录
    results.login = await login();
    
    if (results.login) {
      // 步骤2: 获取活动列表
      const activities = await getActivityListWorkaround();
      results.activityList = !!activities;
      
      if (results.activityList) {
        // 步骤3: 获取初始状态
        const initialStatus = await getUserActivityStatus(testActivityId);
        results.statusQuery = initialStatus !== null;
        
        console.log(`\n🎯 开始测试流程 - 初始状态: ${initialStatus} (${getSignStatusText(initialStatus)})`);
        
        if (initialStatus === 0) {
          // 完整流程：报名 -> 签到
          console.log('🎯 执行完整测试流程: 报名 -> 签到');
          
          results.enroll = await enrollActivity();
          
          if (results.enroll === true) {
            results.signIn = await signInActivity();
          } else if (results.enroll === 'already_enrolled') {
            results.signIn = await signInActivity();
          }
          
        } else if (initialStatus === -1) {
          // 仅签到测试
          console.log('🎯 执行签到测试流程');
          results.enroll = 'skipped';
          results.signIn = await signInActivity();
          
        } else if (initialStatus === 1) {
          // 状态验证
          console.log('🎯 执行状态验证流程');
          results.enroll = 'skipped';
          results.signIn = 'skipped';
          
        } else {
          console.log('⚠️ 无法确定初始状态，跳过操作测试');
          results.enroll = 'skipped';
          results.signIn = 'skipped';
        }
        
        // 步骤6: 数据一致性验证
        results.consistency = await verifyDataConsistency();
      }
    }
    
    // 测试结果汇总
    console.log('\n📊 测试结果汇总');
    console.log('='.repeat(70));
    console.log(`🔑 用户登录: ${results.login ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🎯 活动列表: ${results.activityList ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🔍 状态查询: ${results.statusQuery ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📝 活动报名: ${formatResult(results.enroll)}`);
    console.log(`✍️ 活动签到: ${formatResult(results.signIn)}`);
    console.log(`🧹 数据一致性: ${results.consistency ? '✅ 通过' : '❌ 失败'}`);
    
    // 计算成功率
    const validResults = Object.entries(results).filter(([key, value]) => 
      !['skipped', 'already_enrolled', 'already_signed_in', 'not_enrolled'].includes(value)
    );
    const successCount = validResults.filter(([key, value]) => value === true).length;
    const totalSteps = validResults.length;
    
    console.log(`\n🎯 总体成功率: ${successCount}/${totalSteps} (${Math.round(successCount/totalSteps*100)}%)`);
    
    // 修复方案效果评估
    console.log('\n🔧 修复方案效果评估');
    console.log('='.repeat(50));
    
    if (results.activityList) {
      console.log('✅ 成功绕过后端SQL错误');
      console.log('🎯 活动列表获取正常，无"Subquery returns more than 1 row"错误');
    }
    
    if (results.statusQuery) {
      console.log('✅ 用户状态查询机制工作正常');
      console.log('🔍 通过单独API查询避免了SQL子查询问题');
    }
    
    if (results.consistency) {
      console.log('✅ 数据一致性良好');
      console.log('📊 多次查询结果保持一致');
    }
    
    // 问题分析
    if (results.enroll === false || results.signIn === false) {
      console.log('\n⚠️ 发现的问题:');
      
      if (results.enroll === false) {
        console.log('❌ 报名操作存在问题');
        console.log('   - 可能是报名API本身的问题');
        console.log('   - 或者状态更新延迟过长');
      }
      
      if (results.signIn === false) {
        console.log('❌ 签到操作存在问题');
        console.log('   - 可能是签到API本身的问题');
        console.log('   - 或者状态同步机制有缺陷');
      }
    }
    
    // 前端实施建议
    console.log('\n📱 前端实施建议');
    console.log('='.repeat(50));
    console.log('1. 🔄 修改ActivityListScreen.tsx:');
    console.log('   - 使用不带userId的activity/list API');
    console.log('   - 单独调用userActivitylist获取用户状态');
    console.log('   - 在前端合并数据');
    
    console.log('\n2. 🎯 优化状态管理:');
    console.log('   - 实现本地状态缓存机制');
    console.log('   - 操作成功后立即更新本地状态');
    console.log('   - 定期后台同步服务器状态');
    
    console.log('\n3. ⚠️ 错误处理增强:');
    console.log('   - 检测"Subquery returns more than 1 row"错误');
    console.log('   - 自动切换到修复方案');
    console.log('   - 向用户显示友好错误信息');
    
    console.log('\n4. 🧹 缓存策略优化:');
    console.log('   - 报名/签到成功后清理相关缓存');
    console.log('   - 实现智能缓存失效机制');
    console.log('   - 避免显示过期状态');
    
  } catch (error) {
    console.error('🚨 测试过程中发生错误:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n🏁 修复方案测试完成');
  console.log(`👤 测试用户ID: ${userId}`);
  console.log(`🎯 测试活动ID: ${testActivityId}`);
  console.log(`⏰ 测试时间: ${new Date().toLocaleString()}`);
}

function formatResult(result) {
  if (result === true) return '✅ 成功';
  if (result === false) return '❌ 失败';
  if (result === 'skipped') return '⏭️ 跳过';
  if (result === 'already_enrolled') return '⚠️ 已报名';
  if (result === 'already_signed_in') return '⚠️ 已签到';
  if (result === 'not_enrolled') return '❌ 未报名';
  return '❓ 未知';
}

// 运行修复方案测试
runActivityWorkflowWithWorkaround().catch(console.error);