// 邀请码测试 - 使用唯一手机号避免重复错误
const BASE_URL = 'https://www.vitaglobal.icu';

// 生成唯一手机号（基于时间戳）
function generateUniquePhone() {
  const timestamp = Date.now().toString().slice(-8);
  return `138${timestamp}`;
}

// 生成唯一用户名
function generateUniqueUsername() {
  const timestamp = Date.now().toString().slice(-6);
  return `test${timestamp}`;
}

// 创建测试注册数据
const createUniqueTestData = (invCode) => {
  const uniquePhone = generateUniquePhone();
  const uniqueUsername = generateUniqueUsername();
  
  return {
    userName: uniqueUsername,
    legalName: '邀请码测试用户',
    nickName: 'InviteTest',
    password: 'test123456',
    phonenumber: uniquePhone,
    email: `${uniqueUsername}@test.edu`,
    sex: '0',
    deptId: '203', // 清华大学
    orgId: '1',    // 学联组织
    invCode: invCode,
    areaCode: 'zh'
  };
};

// 测试单个邀请码
async function testSingleInvitationCode(invCode, testName) {
  console.log(`\n🧪 ${testName}`);
  console.log(`📱 邀请码: "${invCode}"`);
  
  try {
    const testData = createUniqueTestData(invCode);
    console.log(`👤 测试用户: ${testData.userName}, 手机: ${testData.phonenumber}`);
    
    // 构建请求
    const formData = new URLSearchParams();
    Object.entries(testData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });
    
    console.log('📤 发送注册请求...');
    console.log('📋 请求参数:', [...formData.entries()].reduce((acc, [k, v]) => {
      acc[k] = k === 'password' ? '[HIDDEN]' : v;
      return acc;
    }, {}));
    
    const response = await fetch(`${BASE_URL}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });
    
    const result = await response.json();
    
    console.log('📥 完整API响应:', {
      httpStatus: response.status,
      code: result.code,
      msg: result.msg,
      data: result.data
    });
    
    return {
      success: result.code === 200,
      code: result.code,
      message: result.msg,
      data: result.data,
      testData: testData
    };
    
  } catch (error) {
    console.error('🚨 请求错误:', error);
    return {
      success: false,
      message: `网络错误: ${error.message}`,
      error: true
    };
  }
}

// 执行核心测试
async function runCoreTests() {
  console.log('🔥 开始邀请码核心测试');
  console.log('=' .repeat(60));
  
  // 测试1: 有效邀请码 WRK4EY7V
  const validResult = await testSingleInvitationCode('WRK4EY7V', '✅ 有效邀请码测试');
  await new Promise(r => setTimeout(r, 2000));
  
  // 测试2: 无效邀请码（格式错误）
  const invalidFormatResult = await testSingleInvitationCode('invalid', '❌ 无效格式测试');
  await new Promise(r => setTimeout(r, 2000));
  
  // 测试3: 不存在的邀请码（格式正确）
  const nonExistentResult = await testSingleInvitationCode('NOTEXIST', '❓ 不存在邀请码测试');
  await new Promise(r => setTimeout(r, 2000));
  
  // 测试4: 空邀请码（普通注册）
  const emptyResult = await testSingleInvitationCode('', '📝 空邀请码测试（普通注册）');
  
  console.log('\n📊 核心测试结果汇总');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: '有效邀请码 WRK4EY7V', result: validResult },
    { name: '无效格式邀请码', result: invalidFormatResult },
    { name: '不存在邀请码', result: nonExistentResult },
    { name: '空邀请码（普通注册）', result: emptyResult }
  ];
  
  tests.forEach(({ name, result }) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${name}:`);
    console.log(`   消息: ${result.message}`);
    console.log(`   代码: ${result.code}`);
    if (result.success) {
      console.log(`   用户: ${result.testData?.userName}`);
    }
    console.log('');
  });
  
  return tests;
}

// 执行测试
runCoreTests().then(results => {
  console.log('🏁 所有测试完成!');
}).catch(error => {
  console.error('💥 测试执行失败:', error);
});