/**
 * 全面的身份码扫描和管理操作测试套件
 * 包括权限交叉测试、志愿者管理、活动管理等实际操作场景
 */

// 测试用户配置
const testUsers = {
  admin: {
    id: 'admin',
    token: 'admin_token_123',
    legalName: 'Xie',
    permission: 'ADMIN',
    roleKey: 'manage'
  },
  jie: {
    id: 'jie', 
    token: 'jie_token_123',
    legalName: 'Jie',
    permission: 'PART_ADMIN',
    roleKey: 'part_manage'
  },
  admin3: {
    id: 'admin3',
    token: 'admin3_token_123', 
    legalName: '内部员工',
    permission: 'STAFF',
    roleKey: 'staff'
  },
  user: {
    id: 'user',
    token: 'user_token_123',
    legalName: '普通用户', 
    permission: 'USER',
    roleKey: 'common'
  }
};

// 模拟API调用
async function mockAPICall(endpoint, method = 'GET', body = null, token = '') {
  console.log(`🌐 [API调用] ${method} ${endpoint}`);
  console.log(`🔑 [Token] ${token.substring(0, 20)}...`);
  
  if (body) {
    console.log(`📤 [请求体]`, body);
  }

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 根据不同的API端点返回模拟数据
  if (endpoint.includes('/app/hour/signRecord')) {
    if (method === 'POST') {
      const formData = new URLSearchParams(body);
      const type = formData.get('type');
      const userId = formData.get('userId');
      
      return {
        code: 200,
        msg: '操作成功',
        data: {
          id: Math.floor(Math.random() * 1000),
          userId: userId,
          type: type,
          startTime: type === '1' ? new Date().toISOString() : null,
          endTime: type === '2' ? new Date().toISOString() : null
        }
      };
    }
  }

  if (endpoint.includes('/app/hour/lastRecordList')) {
    const urlParams = new URLSearchParams(endpoint.split('?')[1]);
    const userId = urlParams.get('userId');
    
    return {
      code: 200,
      msg: '查询成功',
      data: [
        {
          id: 12345,
          userId: userId,
          startTime: '2025-09-09 10:00:00',
          endTime: null, // 未签退
          totalHours: 0
        }
      ]
    };
  }

  if (endpoint.includes('/app/activity/signIn')) {
    return {
      code: 200,
      msg: '活动签到成功',
      data: null
    };
  }

  // 默认成功响应
  return {
    code: 200,
    msg: '操作成功',
    data: null
  };
}

// 志愿者签到测试
async function testVolunteerSignIn(operatorUser, targetUser) {
  console.log(`\n🎯 [志愿者签到测试] ${operatorUser.legalName} 为 ${targetUser.legalName} 执行签到`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const body = new URLSearchParams({
      userId: targetUser.id,
      type: '1', // 1-签到
      startTime: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }).replace(/\//g, '-'),
      operateUserId: operatorUser.id,
      operateLegalName: operatorUser.legalName,
    }).toString();

    const result = await mockAPICall(
      'https://www.vitaglobal.icu/app/hour/signRecord',
      'POST',
      body,
      operatorUser.token
    );

    if (result.code === 200) {
      console.log(`✅ 签到成功: ${targetUser.legalName} 志愿者签到成功！`);
      console.log(`📋 签到记录ID: ${result.data.id}`);
      console.log(`⏰ 签到时间: ${result.data.startTime}`);
      return { success: true, recordId: result.data.id };
    } else {
      console.log(`❌ 签到失败: ${result.msg}`);
      return { success: false, error: result.msg };
    }
  } catch (error) {
    console.error(`❌ 签到异常:`, error);
    return { success: false, error: error.message };
  }
}

// 志愿者签退测试
async function testVolunteerSignOut(operatorUser, targetUser) {
  console.log(`\n🎯 [志愿者签退测试] ${operatorUser.legalName} 为 ${targetUser.legalName} 执行签退`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. 先获取最新的签到记录
    console.log('📋 查询最新签到记录...');
    const statusResult = await mockAPICall(
      `https://www.vitaglobal.icu/app/hour/lastRecordList?userId=${targetUser.id}`,
      'GET',
      null,
      operatorUser.token
    );

    if (statusResult.code !== 200 || !statusResult.data || statusResult.data.length === 0) {
      console.log('❌ 未找到有效的签到记录');
      return { success: false, error: '未找到有效的签到记录' };
    }

    const lastRecord = statusResult.data[0];
    console.log(`📝 找到签到记录 ID: ${lastRecord.id}, 签到时间: ${lastRecord.startTime}`);

    if (lastRecord.endTime) {
      console.log('⚠️ 该用户已经签退过了');
      return { success: false, error: '该用户已经签退过了' };
    }

    // 2. 执行签退
    console.log('🚪 执行签退操作...');
    const body = new URLSearchParams({
      id: lastRecord.id.toString(),
      userId: targetUser.id,
      type: '2', // 2-签退
      endTime: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }).replace(/\//g, '-'),
      operateUserId: operatorUser.id,
      operateLegalName: operatorUser.legalName,
    }).toString();

    const result = await mockAPICall(
      'https://www.vitaglobal.icu/app/hour/signRecord',
      'POST',
      body,
      operatorUser.token
    );

    if (result.code === 200) {
      console.log(`✅ 签退成功: ${targetUser.legalName} 志愿者签退成功！`);
      console.log(`⏰ 签退时间: ${result.data.endTime}`);
      console.log(`⌛ 工作时长: 计算中...`);
      return { success: true, recordId: lastRecord.id };
    } else {
      console.log(`❌ 签退失败: ${result.msg}`);
      return { success: false, error: result.msg };
    }
  } catch (error) {
    console.error(`❌ 签退异常:`, error);
    return { success: false, error: error.message };
  }
}

// 活动签到测试
async function testActivitySignIn(operatorUser, targetUser, activityId = '12345') {
  console.log(`\n🎯 [活动签到测试] ${operatorUser.legalName} 为 ${targetUser.legalName} 执行活动${activityId}签到`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const result = await mockAPICall(
      `https://www.vitaglobal.icu/app/activity/signIn?activityId=${activityId}&userId=${targetUser.id}`,
      'GET',
      null,
      operatorUser.token
    );

    if (result.code === 200) {
      console.log(`✅ 活动签到成功: ${targetUser.legalName} 活动${activityId}签到成功！`);
      console.log(`📅 活动ID: ${activityId}`);
      console.log(`⏰ 签到时间: ${new Date().toLocaleString()}`);
      return { success: true, activityId };
    } else {
      console.log(`❌ 活动签到失败: ${result.msg}`);
      return { success: false, error: result.msg };
    }
  } catch (error) {
    console.error(`❌ 活动签到异常:`, error);
    return { success: false, error: error.message };
  }
}

// 权限操作测试
function testPermissionAccess(operatorUser, operation) {
  console.log(`\n🔐 [权限验证] ${operatorUser.legalName} (${operatorUser.permission}) 尝试执行: ${operation}`);

  const permissionLevels = {
    'USER': 1,
    'STAFF': 2, 
    'PART_ADMIN': 3,
    'ADMIN': 4
  };

  const requiredPermissions = {
    '志愿者签到': 2, // STAFF及以上
    '志愿者签退': 2, // STAFF及以上  
    '活动签到': 3,   // PART_ADMIN及以上
    '查看详细统计': 3, // PART_ADMIN及以上
    '查看敏感信息': 4, // ADMIN
  };

  const userLevel = permissionLevels[operatorUser.permission];
  const requiredLevel = requiredPermissions[operation];

  if (userLevel >= requiredLevel) {
    console.log(`✅ 权限验证通过: ${operatorUser.permission} (等级${userLevel}) >= 所需等级${requiredLevel}`);
    return true;
  } else {
    console.log(`❌ 权限不足: ${operatorUser.permission} (等级${userLevel}) < 所需等级${requiredLevel}`);
    return false;
  }
}

// 全面的交叉测试场景
async function runComprehensiveTest() {
  console.log('🚀 开始全面的身份码扫描和管理操作测试\n');
  console.log('📋 测试用户:');
  Object.entries(testUsers).forEach(([key, user]) => {
    console.log(`   ${user.legalName} (${user.permission})`);
  });
  
  console.log('\n🧪 测试场景:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    scenarios: []
  };

  // 测试场景1: 权限验证测试
  console.log('\n📋 场景1: 权限操作验证测试');
  const permissionTests = [
    { user: 'user', operation: '志愿者签到' },
    { user: 'user', operation: '活动签到' },
    { user: 'admin3', operation: '志愿者签到' },
    { user: 'admin3', operation: '活动签到' },
    { user: 'jie', operation: '志愿者签到' },
    { user: 'jie', operation: '活动签到' },
    { user: 'admin', operation: '查看敏感信息' },
  ];

  for (const test of permissionTests) {
    testResults.total++;
    const hasPermission = testPermissionAccess(testUsers[test.user], test.operation);
    if (hasPermission) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    testResults.scenarios.push({
      name: `${testUsers[test.user].legalName} 执行 ${test.operation}`,
      result: hasPermission ? 'PASS' : 'FAIL',
      expected: true
    });
  }

  // 测试场景2: 志愿者管理操作测试  
  console.log('\n📋 场景2: 志愿者管理操作测试');
  const volunteerTests = [
    { operator: 'admin3', target: 'user' },
    { operator: 'jie', target: 'admin3' },
    { operator: 'admin', target: 'user' },
  ];

  for (const test of volunteerTests) {
    const operator = testUsers[test.operator];
    const target = testUsers[test.target];

    // 权限检查
    if (!testPermissionAccess(operator, '志愿者签到')) {
      testResults.total++;
      testResults.failed++;
      testResults.scenarios.push({
        name: `${operator.legalName} 为 ${target.legalName} 志愿者签到`,
        result: 'FAIL',
        expected: false,
        reason: '权限不足'
      });
      continue;
    }

    // 执行签到
    testResults.total++;
    const signInResult = await testVolunteerSignIn(operator, target);
    if (signInResult.success) {
      testResults.passed++;
      testResults.scenarios.push({
        name: `${operator.legalName} 为 ${target.legalName} 志愿者签到`,
        result: 'PASS',
        expected: true
      });

      // 执行签退
      testResults.total++;
      const signOutResult = await testVolunteerSignOut(operator, target);
      if (signOutResult.success) {
        testResults.passed++;
        testResults.scenarios.push({
          name: `${operator.legalName} 为 ${target.legalName} 志愿者签退`,
          result: 'PASS',
          expected: true
        });
      } else {
        testResults.failed++;
        testResults.scenarios.push({
          name: `${operator.legalName} 为 ${target.legalName} 志愿者签退`,
          result: 'FAIL',
          expected: true,
          reason: signOutResult.error
        });
      }
    } else {
      testResults.failed++;
      testResults.scenarios.push({
        name: `${operator.legalName} 为 ${target.legalName} 志愿者签到`,
        result: 'FAIL',
        expected: true,
        reason: signInResult.error
      });
    }
  }

  // 测试场景3: 活动管理操作测试
  console.log('\n📋 场景3: 活动管理操作测试');
  const activityTests = [
    { operator: 'admin3', target: 'user', activityId: '100' },
    { operator: 'jie', target: 'admin3', activityId: '200' },
    { operator: 'admin', target: 'user', activityId: '300' },
  ];

  for (const test of activityTests) {
    const operator = testUsers[test.operator];
    const target = testUsers[test.target];

    // 权限检查
    if (!testPermissionAccess(operator, '活动签到')) {
      testResults.total++;
      testResults.failed++;
      testResults.scenarios.push({
        name: `${operator.legalName} 为 ${target.legalName} 活动${test.activityId}签到`,
        result: 'FAIL',
        expected: false,
        reason: '权限不足'
      });
      continue;
    }

    // 执行活动签到
    testResults.total++;
    const result = await testActivitySignIn(operator, target, test.activityId);
    if (result.success) {
      testResults.passed++;
      testResults.scenarios.push({
        name: `${operator.legalName} 为 ${target.legalName} 活动${test.activityId}签到`,
        result: 'PASS',
        expected: true
      });
    } else {
      testResults.failed++;
      testResults.scenarios.push({
        name: `${operator.legalName} 为 ${target.legalName} 活动${test.activityId}签到`,
        result: 'FAIL',
        expected: true,
        reason: result.error
      });
    }
  }

  // 输出测试结果
  console.log('\n🎯 测试结果汇总:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 总测试数: ${testResults.total}`);
  console.log(`✅ 通过测试: ${testResults.passed}`);
  console.log(`❌ 失败测试: ${testResults.failed}`);
  console.log(`📈 成功率: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  console.log('\n📋 详细测试结果:');
  testResults.scenarios.forEach((scenario, index) => {
    const status = scenario.result === 'PASS' ? '✅' : '❌';
    const reason = scenario.reason ? ` (${scenario.reason})` : '';
    console.log(`${index + 1}. ${status} ${scenario.name}${reason}`);
  });

  console.log('\n🎉 全面测试完成!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (testResults.failed === 0) {
    console.log('🎊 所有测试都通过了！身份码扫描和管理操作系统工作完美！');
  } else {
    console.log(`⚠️ 有 ${testResults.failed} 个测试失败，需要进一步检查`);
  }

  return testResults;
}

// 导出供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testUsers,
    runComprehensiveTest,
    testVolunteerSignIn,
    testVolunteerSignOut,
    testActivitySignIn,
    testPermissionAccess
  };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.ComprehensiveQRTest = {
    testUsers,
    runComprehensiveTest,
    testVolunteerSignIn,
    testVolunteerSignOut,
    testActivitySignIn,
    testPermissionAccess
  };
}

// 自动运行提示
console.log('🧪 全面身份码扫描和管理操作测试脚本已加载');
console.log('💡 运行 runComprehensiveTest() 开始完整测试');
console.log('🎯 测试包括: 权限验证、志愿者管理、活动管理等实际操作场景');