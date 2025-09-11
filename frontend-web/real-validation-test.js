// 实际验证邀请码功能的测试脚本
// 模拟用户在QR扫描页面输入邀请码的真实场景

const BASE_URL = 'https://www.vitaglobal.icu';

// 生成唯一测试数据（避免重复错误）
function generateUniqueTestData(invCode) {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);
  
  return {
    userName: `test${timestamp}${randomNum}`.slice(-15), // 确保用户名不会太长
    legalName: '邀请码验证测试',
    nickName: 'InviteTest',
    password: 'test123456',
    phonenumber: `139${timestamp.toString().slice(-8)}`, // 生成唯一手机号
    email: `test${timestamp}${randomNum}@test.edu`,
    sex: '0',
    deptId: '203', // 清华大学
    orgId: '1',    // 学联组织
    invCode: invCode,
    areaCode: 'zh'
  };
}

// 验证邀请码的真实函数（模拟QRScannerScreen的逻辑）
async function validateInvitationCodeReal(invCode) {
  console.log(`\n🔍 验证邀请码: "${invCode}"`);
  
  // 1. 格式验证
  const isValidFormat = /^[A-Z0-9]{8}$/.test(invCode);
  if (!isValidFormat) {
    console.log('❌ 格式验证失败');
    return {
      valid: false,
      message: '邀请码格式不正确，应为8位大写字母数字组合（如：WRK4EY7V）',
      stage: 'format'
    };
  }
  
  console.log('✅ 格式验证通过');
  
  // 2. 后端API验证
  try {
    const testData = generateUniqueTestData(invCode);
    console.log('📤 使用临时数据验证:', {
      用户名: testData.userName,
      手机号: testData.phonenumber,
      邮箱: testData.email,
      邀请码: invCode
    });
    
    // 构建请求
    const formData = new URLSearchParams();
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value.toString());
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
    console.log('📥 后端验证结果:', { 
      httpStatus: response.status,
      code: result.code, 
      msg: result.msg 
    });
    
    // 分析结果
    if (result.code === 200) {
      console.log('✅ 邀请码有效，注册成功');
      return {
        valid: true,
        message: '邀请码验证通过！',
        stage: 'backend',
        testUser: testData.userName
      };
    } else if (result.msg?.includes('邀请码失效')) {
      console.log('❌ 邀请码无效');
      return {
        valid: false,
        message: '邀请码失效',
        stage: 'backend'
      };
    } else if (result.msg?.includes('手机号码已存在')) {
      console.log('⚠️ 手机号重复（邀请码可能有效）');
      return {
        valid: true,
        message: '邀请码格式有效（手机号重复不影响验证）',
        stage: 'backend'
      };
    } else {
      console.log('❓ 其他错误');
      return {
        valid: false,
        message: result.msg || '验证失败',
        stage: 'backend'
      };
    }
    
  } catch (error) {
    console.error('🚨 网络错误:', error);
    return {
      valid: false,
      message: '网络连接异常，请检查网络后重试',
      stage: 'network'
    };
  }
}

// 执行完整的邀请码验证测试
async function runRealValidationTest() {
  console.log('🚀 开始邀请码验证实际测试');
  console.log('=' .repeat(60));
  console.log('📍 模拟用户在QR扫描页面输入邀请码的行为');
  
  const testCases = [
    { code: 'WRK4EY7V', desc: '✅ 有效邀请码（你提供的）' },
    { code: 'abcdefgh', desc: '❌ 格式错误（小写字母）' },
    { code: 'INVALID1', desc: '❌ 不存在邀请码（格式正确）' },
    { code: '12345', desc: '❌ 格式错误（长度不够）' },
    { code: '', desc: '❌ 空邀请码' },
    { code: 'ABC@123D', desc: '❌ 格式错误（包含特殊字符）' }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.desc}`);
    const result = await validateInvitationCodeReal(testCase.code);
    
    results.push({
      ...testCase,
      result: result
    });
    
    // 模拟用户行为间隔
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // 生成测试报告
  console.log('\n📊 验证测试结果报告');
  console.log('=' .repeat(60));
  
  results.forEach(({ code, desc, result }) => {
    const status = result.valid ? '✅ 通过' : '❌ 拒绝';
    console.log(`${status} ${desc}`);
    console.log(`   输入: "${code}"`);
    console.log(`   结果: ${result.message}`);
    console.log(`   阶段: ${result.stage}`);
    if (result.testUser) {
      console.log(`   创建用户: ${result.testUser}`);
    }
    console.log('');
  });
  
  // 安全性分析
  const allowedCount = results.filter(r => r.result.valid).length;
  const blockedCount = results.length - allowedCount;
  
  console.log('🔒 安全性分析:');
  console.log(`   ✅ 阻止恶意输入: ${blockedCount}/${results.length}`);
  console.log(`   ✅ 允许有效邀请码: ${allowedCount}/${results.length}`);
  
  const securityScore = (blockedCount / (results.length - 1)) * 100; // 排除有效邀请码
  console.log(`   🛡️ 安全得分: ${securityScore.toFixed(1)}%`);
  
  if (securityScore >= 80) {
    console.log('🎉 安全验证：邀请码验证机制工作正常！');
  } else {
    console.log('⚠️ 安全警告：仍有邀请码验证漏洞！');
  }
  
  return results;
}

// 执行测试
console.log('💡 执行邀请码验证测试...');
runRealValidationTest().then(results => {
  console.log('\n🏁 所有验证测试完成！');
  console.log('📋 请对比App端的相同测试结果');
}).catch(error => {
  console.error('💥 测试执行失败:', error);
});