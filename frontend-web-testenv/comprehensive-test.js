// PomeloX Web端功能全面测试脚本
const BASE_URL = 'https://www.vitaglobal.icu';

// 生成测试数据
function generateTestData() {
  const timestamp = Date.now();
  return {
    uniqueUser: `test${timestamp}`,
    uniquePhone: `139${timestamp.toString().slice(-8)}`,
    uniqueEmail: `test${timestamp}@test.edu`,
    testPhone: '13331914881'
  };
}

// 测试1: 邀请码验证功能
async function testInvitationCodeValidation() {
  console.log('\n🧪 测试1: 邀请码验证功能');
  console.log('=' .repeat(50));
  
  const testCases = [
    { code: 'WRK4EY7V', desc: '✅ 有效邀请码', shouldPass: true },
    { code: 'abcdefgh', desc: '❌ 格式错误(小写)', shouldPass: false },
    { code: 'INVALID1', desc: '❌ 不存在邀请码', shouldPass: false },
    { code: '12345', desc: '❌ 格式错误(长度)', shouldPass: false }
  ];
  
  for (const test of testCases) {
    const testData = generateTestData();
    
    try {
      const formData = new URLSearchParams();
      formData.append('userName', testData.uniqueUser);
      formData.append('legalName', '测试用户');
      formData.append('nickName', 'TestUser');
      formData.append('password', 'test123456');
      formData.append('phonenumber', testData.uniquePhone);
      formData.append('email', testData.uniqueEmail);
      formData.append('sex', '0');
      formData.append('deptId', '203');
      formData.append('orgId', '1');
      formData.append('invCode', test.code);
      formData.append('areaCode', 'zh');
      
      const response = await fetch(`${BASE_URL}/app/user/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      
      const result = await response.json();
      
      const actualPass = result.code === 200;
      const status = actualPass === test.shouldPass ? '✅' : '❌';
      
      console.log(`${status} ${test.desc}:`);
      console.log(`   邀请码: ${test.code}`);
      console.log(`   预期: ${test.shouldPass ? '成功' : '失败'}`);
      console.log(`   实际: ${actualPass ? '成功' : '失败'}`);
      console.log(`   消息: ${result.msg}`);
      
      if (actualPass && test.shouldPass) {
        console.log(`   ✅ 创建用户: ${testData.uniqueUser}`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${test.desc}: 网络错误 - ${error.message}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
}

// 测试2: 忘记密码功能  
async function testForgotPasswordFunction() {
  console.log('\n🧪 测试2: 忘记密码功能');
  console.log('=' .repeat(50));
  
  const testData = generateTestData();
  
  try {
    const phoneNumber = `86${testData.testPhone}`;
    const response = await fetch(`${BASE_URL}/sms/vercodeSms?phoneNum=${phoneNumber}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    const result = await response.json();
    
    console.log('📱 忘记密码验证码测试:');
    console.log(`   手机号: ${testData.testPhone} (${phoneNumber})`);
    console.log(`   API响应: ${response.status}`);
    console.log(`   结果码: ${result.code}`);
    console.log(`   消息: ${result.message || result.msg}`);
    
    if (result.code === 'OK') {
      console.log('   ✅ 验证码发送成功');
      console.log(`   📝 验证码: ${result.message}`);
      console.log(`   🔐 BizId: ${result.bizId}`);
    } else {
      console.log('   ❌ 验证码发送失败');
    }
    
  } catch (error) {
    console.log(`❌ 忘记密码功能测试失败: ${error.message}`);
  }
}

// 测试3: 注册错误信息
async function testRegistrationErrorMessages() {
  console.log('\n🧪 测试3: 注册错误信息测试');
  console.log('=' .repeat(50));
  
  // 使用已知的重复数据测试错误信息
  const duplicateTests = [
    { 
      field: 'userName',
      value: '123123', // 之前测试成功的用户名
      desc: '用户名重复错误'
    },
    {
      field: 'phonenumber', 
      value: '13868086120', // 之前测试成功的手机号
      desc: '手机号重复错误'
    }
  ];
  
  for (const test of duplicateTests) {
    try {
      const testData = generateTestData();
      const formData = new URLSearchParams();
      
      // 使用重复的字段值，其他字段用唯一值
      formData.append('userName', test.field === 'userName' ? test.value : testData.uniqueUser);
      formData.append('phonenumber', test.field === 'phonenumber' ? test.value : testData.uniquePhone);
      formData.append('email', testData.uniqueEmail);
      formData.append('legalName', '测试用户');
      formData.append('nickName', 'TestUser');
      formData.append('password', 'test123456');
      formData.append('sex', '0');
      formData.append('deptId', '203');
      formData.append('orgId', '1');
      formData.append('areaCode', 'zh');
      
      const response = await fetch(`${BASE_URL}/app/user/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      
      const result = await response.json();
      
      console.log(`📋 ${test.desc}:`);
      console.log(`   字段: ${test.field} = "${test.value}"`);
      console.log(`   结果码: ${result.code}`);
      console.log(`   错误消息: ${result.msg}`);
      
      if (result.code === 500 && result.msg) {
        console.log(`   ✅ 预期的错误响应`);
      } else {
        console.log(`   ❓ 非预期的响应`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${test.desc}测试失败: ${error.message}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
}

// 执行全面测试
async function runComprehensiveTest() {
  console.log('🚀 开始PomeloX Web端功能全面测试');
  console.log('📍 测试URL: http://localhost:8090');
  console.log('📍 API URL: https://www.vitaglobal.icu');
  console.log('🕐 测试时间:', new Date().toLocaleString());
  console.log('=' .repeat(60));
  
  try {
    await testInvitationCodeValidation();
    await testForgotPasswordFunction();
    await testRegistrationErrorMessages();
    
    console.log('\n🎉 全面测试完成!');
    console.log('📋 请检查上述结果确认功能是否正常');
    
  } catch (error) {
    console.error('💥 测试执行失败:', error);
  }
}

// 立即执行测试
runComprehensiveTest();