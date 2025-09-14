// 邀请码注册测试脚本
// 测试有效邀请码 WRK4EY7V 和各种边缘情况

const BASE_URL = 'https://www.vitaglobal.icu';

// 模拟注册数据
const createTestRegistrationData = (invCode) => ({
  userName: 'testuser' + Math.floor(Math.random() * 1000),
  legalName: '测试用户',
  nickName: 'TestUser',
  password: 'test123',
  phonenumber: '13812345678',
  email: 'test@example.com',
  sex: '0',
  deptId: '203', // 清华大学
  orgId: '1',   // 学联组织
  invCode: invCode,
  areaCode: 'zh'
});

// 测试邀请码注册
async function testInvitationCodeRegistration(invCode, testName) {
  console.log(`\n🧪 测试: ${testName}`);
  console.log(`📱 邀请码: ${invCode}`);
  
  try {
    const registrationData = createTestRegistrationData(invCode);
    
    // 构建form-data
    const formData = new URLSearchParams();
    Object.entries(registrationData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    console.log('📤 发送注册请求...');
    const response = await fetch(`${BASE_URL}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });
    
    const result = await response.json();
    
    console.log('📥 API响应:', {
      status: response.status,
      code: result.code,
      msg: result.msg,
      hasData: !!result.data
    });
    
    if (result.code === 200) {
      console.log('✅ 注册成功!');
      return { success: true, message: result.msg, data: result.data };
    } else {
      console.log('❌ 注册失败:', result.msg);
      return { success: false, message: result.msg, code: result.code };
    }
    
  } catch (error) {
    console.error('🚨 请求错误:', error.message);
    return { success: false, message: error.message, error: true };
  }
}

// 执行测试套件
async function runInvitationCodeTests() {
  console.log('🚀 开始邀请码注册测试');
  console.log('=' .repeat(50));
  
  const tests = [
    // 1. 测试有效邀请码
    { code: 'WRK4EY7V', name: '有效邀请码测试' },
    
    // 2. 测试无效格式
    { code: 'invalid', name: '无效格式-小写字母' },
    { code: '12345', name: '无效格式-长度不足' },
    { code: 'ABC123DEF', name: '无效格式-长度过长' },
    { code: 'ABC@123D', name: '无效格式-特殊字符' },
    
    // 3. 测试不存在的邀请码（格式正确）
    { code: 'INVALID1', name: '不存在邀请码1' },
    { code: 'FAKE1234', name: '不存在邀请码2' },
    { code: 'WRONG999', name: '不存在邀请码3' },
    
    // 4. 测试边界情况
    { code: '', name: '空邀请码' },
    { code: ' WRK4EY7V ', name: '邀请码前后有空格' },
    { code: 'wrk4ey7v', name: '有效邀请码-小写' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testInvitationCodeRegistration(test.code, test.name);
    results.push({ ...test, result });
    
    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 总结测试结果
  console.log('\n📊 测试结果总结');
  console.log('=' .repeat(50));
  
  results.forEach(({ name, code, result }) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${name}: ${code} - ${result.message}`);
  });
  
  // 分类统计
  const successCount = results.filter(r => r.result.success).length;
  const failCount = results.length - successCount;
  
  console.log(`\n📈 统计: ${successCount}个成功, ${failCount}个失败`);
  
  return results;
}

// 在浏览器控制台中执行
if (typeof window !== 'undefined') {
  window.testInvitationCodes = runInvitationCodeTests;
  console.log('💡 在浏览器控制台执行: testInvitationCodes()');
} else {
  // Node.js环境下直接执行
  runInvitationCodeTests();
}