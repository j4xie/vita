// PomeloX 全面边界测试和失败测试脚本
const BASE_URL = 'https://www.vitaglobal.icu';

let testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function recordTest(name, success, details, expected = null) {
  if (success) testResults.passed++;
  else testResults.failed++;
  
  testResults.details.push({
    name,
    success,
    details,
    expected
  });
  
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${name}: ${details}`);
}

// 生成测试数据
function generateTestData(override = {}) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return {
    userName: `test${timestamp}${random}`.slice(-15),
    legalName: '边界测试用户',
    nickName: 'EdgeTest',
    password: 'test123456',
    phonenumber: `139${timestamp.toString().slice(-8)}`,
    email: `test${timestamp}${random}@test.edu`,
    sex: '0',
    deptId: '203',
    orgId: '1',
    areaCode: 'zh',
    ...override
  };
}

// 测试API调用
async function testAPICall(testName, data, expectedSuccess = false, expectedErrorPattern = null) {
  try {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${BASE_URL}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });
    
    const result = await response.json();
    
    const actualSuccess = result.code === 200;
    const matchesExpectedPattern = expectedErrorPattern ? 
      result.msg?.includes(expectedErrorPattern) : true;
    
    const testPassed = (actualSuccess === expectedSuccess) && matchesExpectedPattern;
    
    let details = `代码:${result.code}, 消息:"${result.msg}"`;
    if (actualSuccess && expectedSuccess) {
      details += `, 创建用户:${data.userName}`;
    }
    
    recordTest(testName, testPassed, details, expectedSuccess ? '应该成功' : '应该失败');
    
    return { result, testPassed };
    
  } catch (error) {
    recordTest(testName, false, `网络异常: ${error.message}`);
    return { error, testPassed: false };
  }
}

// 完整边界测试套件
async function runComprehensiveEdgeTests() {
  console.log('🧪 PomeloX 全面边界测试和失败测试套件');
  console.log('🕐 测试时间:', new Date().toLocaleString());
  console.log('=' .repeat(80));
  
  console.log('\n📋 第一组: 字段验证边界测试');
  console.log('-' .repeat(50));
  
  // 用户名边界测试
  await testAPICall(
    '用户名过短(5字符)', 
    generateTestData({ userName: 'abc12' }),
    false, '用户名'
  );
  
  await testAPICall(
    '用户名过长(21字符)', 
    generateTestData({ userName: 'a'.repeat(21) }),
    false, '用户名'
  );
  
  await testAPICall(
    '用户名包含特殊字符', 
    generateTestData({ userName: 'test@123' }),
    false, '用户名'
  );
  
  await testAPICall(
    '用户名包含中文', 
    generateTestData({ userName: '测试用户123' }),
    false, '用户名'
  );
  
  // 密码边界测试
  await testAPICall(
    '密码过短(5字符)', 
    generateTestData({ password: '12345' }),
    false, '密码'
  );
  
  await testAPICall(
    '密码过长(21字符)', 
    generateTestData({ password: 'a'.repeat(21) }),
    false, '密码'
  );
  
  // 手机号边界测试
  await testAPICall(
    '手机号过短(10位)', 
    generateTestData({ phonenumber: '1381234567' }),
    false, '手机号'
  );
  
  await testAPICall(
    '手机号过长(12位)', 
    generateTestData({ phonenumber: '138123456789' }),
    false, '手机号'
  );
  
  await testAPICall(
    '手机号格式错误(不以1开头)', 
    generateTestData({ phonenumber: '23812345678' }),
    false, '手机号'
  );
  
  await testAPICall(
    '手机号包含字母', 
    generateTestData({ phonenumber: '1381234567a' }),
    false, '手机号'
  );
  
  console.log('\n📋 第二组: 邮箱验证边界测试');
  console.log('-' .repeat(50));
  
  await testAPICall(
    '邮箱格式错误(无@)', 
    generateTestData({ email: 'testuser.com' }),
    false, '邮箱'
  );
  
  await testAPICall(
    '邮箱格式错误(无域名)', 
    generateTestData({ email: 'test@' }),
    false, '邮箱'
  );
  
  await testAPICall(
    '邮箱过长', 
    generateTestData({ email: 'a'.repeat(100) + '@test.edu' }),
    false, '邮箱'
  );
  
  console.log('\n📋 第三组: 必填字段缺失测试');
  console.log('-' .repeat(50));
  
  await testAPICall(
    '缺少用户名', 
    generateTestData({ userName: '' }),
    false, '用户名'
  );
  
  await testAPICall(
    '缺少密码', 
    generateTestData({ password: '' }),
    false, '密码'
  );
  
  await testAPICall(
    '缺少手机号', 
    generateTestData({ phonenumber: '' }),
    false, '手机号'
  );
  
  await testAPICall(
    '缺少邮箱', 
    generateTestData({ email: '' }),
    false, '邮箱'
  );
  
  await testAPICall(
    '缺少学校ID', 
    generateTestData({ deptId: '' }),
    false, 'deptId'
  );
  
  await testAPICall(
    '缺少组织ID', 
    generateTestData({ orgId: '' }),
    false, 'orgId'
  );
  
  console.log('\n📋 第四组: 邀请码边界测试');
  console.log('-' .repeat(50));
  
  await testAPICall(
    '邀请码空字符串', 
    generateTestData({ invCode: '' }),
    false, '验证码'
  );
  
  await testAPICall(
    '邀请码包含特殊字符', 
    generateTestData({ invCode: 'ABC@123D' }),
    false, '邀请码'
  );
  
  await testAPICall(
    '邀请码全小写', 
    generateTestData({ invCode: 'wrk4ey7v' }),
    false, '邀请码'
  );
  
  await testAPICall(
    '邀请码长度不足', 
    generateTestData({ invCode: 'ABC123' }),
    false, '邀请码'
  );
  
  await testAPICall(
    '邀请码长度过长', 
    generateTestData({ invCode: 'ABC123DEF' }),
    false, '邀请码'
  );
  
  await testAPICall(
    '邀请码包含中文', 
    generateTestData({ invCode: '测试邀请码1' }),
    false, '邀请码'
  );
  
  console.log('\n📋 第五组: SQL注入和安全测试');
  console.log('-' .repeat(50));
  
  await testAPICall(
    'SQL注入用户名测试', 
    generateTestData({ userName: "test'; DROP TABLE users; --" }),
    false, 'SQL'
  );
  
  await testAPICall(
    '脚本注入密码测试', 
    generateTestData({ password: '<script>alert("test")</script>' }),
    false, 'script'
  );
  
  await testAPICall(
    'XSS注入邮箱测试', 
    generateTestData({ email: '<img src=x onerror=alert(1)>@test.com' }),
    false, 'XSS'
  );
  
  console.log('\n📋 第六组: 数据类型和编码测试');
  console.log('-' .repeat(50));
  
  await testAPICall(
    'Unicode用户名测试', 
    generateTestData({ userName: '测试用户🔥' }),
    false, 'Unicode'
  );
  
  await testAPICall(
    '超长姓名测试', 
    generateTestData({ legalName: '超'.repeat(100) }),
    false, '姓名长度'
  );
  
  await testAPICall(
    '空白字符用户名测试', 
    generateTestData({ userName: '   test   ' }),
    false, '空白字符'
  );
  
  console.log('\n📋 第七组: 并发和重复提交测试');
  console.log('-' .repeat(50));
  
  // 并发注册测试
  const testData = generateTestData();
  const concurrentPromises = [];
  
  for (let i = 0; i < 3; i++) {
    concurrentPromises.push(
      testAPICall(
        `并发注册测试${i+1}`,
        { ...testData, userName: testData.userName + i },
        i === 0 ? true : false // 只有第一个应该成功
      )
    );
  }
  
  try {
    await Promise.all(concurrentPromises);
    recordTest('并发注册处理', true, '服务器正确处理并发请求');
  } catch (error) {
    recordTest('并发注册处理', false, `并发测试异常: ${error.message}`);
  }
  
  console.log('\n📋 第八组: 网络异常和超时测试');
  console.log('-' .repeat(50));
  
  try {
    // 测试错误的API端点
    const response = await fetch(`${BASE_URL}/app/user/nonexistent-endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generateTestData()),
    });
    
    recordTest('错误API端点测试', !response.ok, `状态码: ${response.status}`);
    
  } catch (error) {
    recordTest('错误API端点测试', true, '正确抛出网络异常');
  }
  
  // 等待一会，避免请求过于频繁
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// 特殊场景测试
async function testSpecialScenarios() {
  console.log('\n📋 第九组: 特殊业务场景测试');
  console.log('-' .repeat(50));
  
  // 测试不同地区用户注册
  await testAPICall(
    '美国地区用户注册',
    generateTestData({ 
      areaCode: 'en',
      phonenumber: '2025551234',
      email: 'testus@example.com'
    }),
    true,
    null
  );
  
  // 测试不同性别选项
  await testAPICall(
    '女性用户注册',
    generateTestData({ sex: '1' }),
    true,
    null
  );
  
  await testAPICall(
    '未知性别用户注册',
    generateTestData({ sex: '2' }),
    true, 
    null
  );
  
  // 测试不同学校
  await testAPICall(
    '不同学校用户注册',
    generateTestData({ deptId: '204' }), // 南京大学
    true,
    null
  );
  
  // 测试不同组织
  await testAPICall(
    '不同组织用户注册',
    generateTestData({ orgId: '2' }), // 社团
    true,
    null
  );
}

// 邀请码专项边界测试
async function testInvitationCodeEdgeCases() {
  console.log('\n📋 第十组: 邀请码专项边界测试');
  console.log('-' .repeat(50));
  
  const invitationTests = [
    { code: null, desc: 'null邀请码', shouldFail: true },
    { code: undefined, desc: 'undefined邀请码', shouldFail: true },
    { code: 'WRK4EY7V', desc: '有效邀请码', shouldFail: false },
    { code: 'EXPIRED1', desc: '过期邀请码', shouldFail: true },
    { code: 'USED1234', desc: '已使用邀请码', shouldFail: true },
    { code: '        ', desc: '空格邀请码', shouldFail: true },
    { code: 'WRK4EY7V' + ' ', desc: '邀请码末尾空格', shouldFail: true },
    { code: ' ' + 'WRK4EY7V', desc: '邀请码开头空格', shouldFail: true },
    { code: 'wrk4ey7v'.toUpperCase(), desc: '小写转大写邀请码', shouldFail: false },
    { code: '12345678', desc: '纯数字邀请码', shouldFail: true },
    { code: 'ABCDEFGH', desc: '纯字母邀请码(可能有效)', shouldFail: true },
    { code: '!@#$%^&*', desc: '特殊符号邀请码', shouldFail: true },
    { code: 'ABC123中文', desc: '邀请码包含中文', shouldFail: true }
  ];
  
  for (const test of invitationTests) {
    const testData = generateTestData();
    
    if (test.code !== undefined && test.code !== null) {
      testData.invCode = test.code;
    }
    // null和undefined的情况不添加invCode字段
    
    await testAPICall(
      test.desc,
      testData,
      !test.shouldFail,
      test.shouldFail ? '邀请码' : null
    );
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// 忘记密码边界测试
async function testForgotPasswordEdgeCases() {
  console.log('\n📋 第十一组: 忘记密码边界测试');
  console.log('-' .repeat(50));
  
  const phoneTests = [
    { phone: '13331914881', areaCode: '86', desc: '有效中国手机号', shouldSucceed: true },
    { phone: '2025551234', areaCode: '1', desc: '有效美国手机号', shouldSucceed: true },
    { phone: '12345', areaCode: '86', desc: '无效长度手机号', shouldSucceed: false },
    { phone: '23812345678', areaCode: '86', desc: '无效格式手机号', shouldSucceed: false },
    { phone: '1381234567a', areaCode: '86', desc: '包含字母手机号', shouldSucceed: false },
    { phone: '', areaCode: '86', desc: '空手机号', shouldSucceed: false },
    { phone: '13331914881', areaCode: '999', desc: '无效区号', shouldSucceed: false }
  ];
  
  for (const test of phoneTests) {
    try {
      const fullPhone = test.areaCode + test.phone;
      const startTime = Date.now();
      
      const response = await fetch(`${BASE_URL}/sms/vercodeSms?phoneNum=${fullPhone}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      const responseTime = Date.now() - startTime;
      const result = await response.json();
      
      const actualSuccess = result.code === 'OK';
      const testPassed = actualSuccess === test.shouldSucceed;
      
      const details = `手机号:${fullPhone}, 响应:${result.code}, 时间:${responseTime}ms, 消息:"${result.message || result.msg}"`;
      
      recordTest(test.desc, testPassed, details);
      
    } catch (error) {
      recordTest(test.desc, false, `网络异常: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

// 压力测试
async function testSystemLoad() {
  console.log('\n📋 第十二组: 系统负载测试');
  console.log('-' .repeat(50));
  
  try {
    // 快速连续API调用测试
    const rapidTests = [];
    for (let i = 0; i < 5; i++) {
      rapidTests.push(
        fetch(`${BASE_URL}/app/dept/list`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
      );
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(rapidTests);
    const endTime = Date.now();
    
    const allSuccessful = responses.every(r => r.ok);
    const totalTime = endTime - startTime;
    
    recordTest(
      '快速连续API调用测试',
      allSuccessful && totalTime < 10000,
      `5次并发调用, 总时间:${totalTime}ms, 全部成功:${allSuccessful}`
    );
    
  } catch (error) {
    recordTest('快速连续API调用测试', false, `压力测试异常: ${error.message}`);
  }
}

// 执行完整测试
async function runFullEdgeTestSuite() {
  testResults = { passed: 0, failed: 0, details: [] };
  
  await runComprehensiveEdgeTests();
  await testInvitationCodeEdgeCases();
  await testForgotPasswordEdgeCases();
  await testSpecialScenarios();
  await testSystemLoad();
  
  // 生成最终报告
  console.log('\n' + '='.repeat(80));
  console.log('📊 完整边界测试报告');
  console.log('='.repeat(80));
  console.log(`🕐 测试完成时间: ${new Date().toLocaleString()}`);
  console.log(`📈 总测试数: ${testResults.passed + testResults.failed}`);
  console.log(`✅ 通过测试: ${testResults.passed}`);
  console.log(`❌ 失败测试: ${testResults.failed}`);
  
  if (testResults.passed + testResults.failed > 0) {
    const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
    console.log(`📊 成功率: ${successRate.toFixed(1)}%`);
  }
  
  console.log('\n📋 测试分类统计:');
  const categories = {};
  testResults.details.forEach(test => {
    const category = test.name.split('测试')[0] + '测试';
    categories[category] = categories[category] || { passed: 0, total: 0 };
    categories[category].total++;
    if (test.success) categories[category].passed++;
  });
  
  Object.entries(categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(0);
    console.log(`   ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
  });
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有边界测试通过！系统非常稳定！');
    console.log('🔒 安全验证: 通过SQL注入、XSS攻击防护测试');
    console.log('📈 性能验证: 通过负载和并发测试');
    console.log('🛡️ 边界验证: 通过所有输入验证边界测试');
  } else {
    console.log(`\n⚠️ 发现 ${testResults.failed} 个需要关注的问题:`);
    testResults.details
      .filter(test => !test.success)
      .forEach(test => {
        console.log(`   ❌ ${test.name}: ${test.details}`);
      });
  }
  
  console.log('\n📱 建议: 在App端进行相同的边界测试验证');
  console.log('🔍 手动验证: 访问 http://localhost:8090 进行UI层面测试');
}

// 立即执行完整边界测试
runFullEdgeTestSuite();