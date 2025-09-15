/**
 * 测试用户注册脚本 - 验证邀请码自动清理功能
 * 创建5个UCB测试用户，验证邀请码XEOWE7MK
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://www.vitaglobal.icu';
const INVITATION_CODE = 'XEOWE7MK';

// UCB (加州大学伯克利分校) 通常对应的deptId
const UCB_DEPT_ID = '200'; // 需要根据实际情况调整

// 创建测试用户数据
const createTestUser = (index) => {
  const timestamp = Date.now() + index; // 确保唯一性
  return {
    userName: `ucbtest${timestamp}`,
    legalName: `UCB测试用户${index + 1}`,
    nickName: `UCBTest${index + 1}`,
    password: 'test123456',
    phonenumber: `135${String(timestamp).slice(-8)}`,
    email: `ucbtest${timestamp}@berkeley.edu`,
    sex: index % 2 === 0 ? '0' : '1', // 交替男女
    deptId: UCB_DEPT_ID,
    orgId: '1',
    invCode: INVITATION_CODE,
    areaCode: '1', // 美国区号
    identity: '1', // 学生身份
    area: 'en'
  };
};

// 注册单个用户
async function registerUser(userData) {
  try {
    console.log(`\n📝 正在创建用户: ${userData.legalName} (${userData.userName})`);

    const formData = new URLSearchParams();
    Object.entries(userData).forEach(([key, value]) => {
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

    if (result.code === 200) {
      console.log(`✅ 用户创建成功: ${userData.legalName}`);
      console.log(`   用户ID: ${result.data?.userId || 'N/A'}`);
      console.log(`   用户名: ${userData.userName}`);
      console.log(`   邮箱: ${userData.email}`);
      return {
        success: true,
        userId: result.data?.userId,
        userData: userData,
        response: result
      };
    } else {
      console.log(`❌ 用户创建失败: ${userData.legalName}`);
      console.log(`   错误信息: ${result.msg}`);
      return {
        success: false,
        error: result.msg,
        userData: userData
      };
    }

  } catch (error) {
    console.error(`🚨 创建用户时出错: ${userData.legalName}`, error.message);
    return {
      success: false,
      error: error.message,
      userData: userData
    };
  }
}

// 主测试函数
async function testUserRegistration() {
  console.log('🚀 开始创建5个UCB测试用户');
  console.log(`📋 邀请码: ${INVITATION_CODE}`);
  console.log(`🏫 学校ID: ${UCB_DEPT_ID} (UCB)`);
  console.log('=' * 50);

  const results = [];

  for (let i = 0; i < 5; i++) {
    const userData = createTestUser(i);
    const result = await registerUser(userData);
    results.push(result);

    // 间隔1秒，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 统计结果
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log('\n📊 测试结果统计:');
  console.log(`✅ 成功创建: ${successCount} 个用户`);
  console.log(`❌ 创建失败: ${failCount} 个用户`);

  if (successCount > 0) {
    console.log('\n✅ 成功创建的用户:');
    results.filter(r => r.success).forEach((result, index) => {
      console.log(`${index + 1}. ${result.userData.legalName} (ID: ${result.userId})`);
    });
  }

  if (failCount > 0) {
    console.log('\n❌ 创建失败的用户:');
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`${index + 1}. ${result.userData.legalName} - ${result.error}`);
    });
  }

  console.log('\n🔍 邀请码验证测试完成!');
  console.log('💡 如果看到"邀请码失效"错误，说明XEOWE7MK已过期');
  console.log('💡 如果看到"手机号已存在"，说明需要更换手机号');
  console.log('💡 成功创建的用户可用于功能测试');

  return results;
}

// 执行测试
testUserRegistration().catch(console.error);