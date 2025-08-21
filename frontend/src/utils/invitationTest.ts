/**
 * 邀请码注册测试工具
 */

import { RegistrationAPIRequest } from '../types/registration';

const BASE_URL = 'http://106.14.165.234:8085';

export const testInvitationRegistration = async () => {
  console.log('🧪 测试邀请码注册功能');
  console.log('邀请码: 2G7KKG49');

  // 测试数据 - 符合邀请码注册规范
  const invitationData: RegistrationAPIRequest = {
    userName: 'invite2025',
    legalName: '邀请 用户',
    nickName: 'Invite User',
    password: 'invite123',
    sex: '0',
    deptId: 214, // UCLA
    orgId: 1, // 学联组织
    invCode: '2G7KKG49',
    // 注意：邀请码注册不包含 verCode, bizId
    // phonenumber 和 email 是可选的
  };

  console.log('📤 发送邀请码注册数据:', invitationData);

  try {
    const response = await fetch(`${BASE_URL}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invitationData),
    });

    const result = await response.json();
    console.log('📥 邀请码注册响应:', result);

    if (result.code === 200) {
      console.log('✅ 邀请码注册成功！');
    } else {
      console.log('❌ 邀请码注册失败:', result.msg);
    }

    return result;
  } catch (error) {
    console.error('💥 邀请码注册异常:', error);
    throw error;
  }
};

export const testPhoneRegistration = async () => {
  console.log('🧪 测试手机验证码注册功能');

  // 测试数据 - 符合手机验证码注册规范
  const phoneData: RegistrationAPIRequest = {
    userName: 'phone2025',
    legalName: '手机 用户',
    nickName: 'Phone User',
    password: 'phone123',
    phonenumber: '13800138000', // 手机号必填
    email: 'phone2025@ucla.edu', // 邮箱必填
    sex: '1',
    deptId: 214, // UCLA
    orgId: 2, // 社团
    // 注意：手机验证码注册不包含 invCode
    // verCode 和 bizId 需要先获取验证码
  };

  console.log('📤 发送手机注册数据:', phoneData);

  try {
    const response = await fetch(`${BASE_URL}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(phoneData),
    });

    const result = await response.json();
    console.log('📥 手机注册响应:', result);

    if (result.code === 200) {
      console.log('✅ 手机注册成功！');
    } else {
      console.log('❌ 手机注册失败:', result.msg);
    }

    return result;
  } catch (error) {
    console.error('💥 手机注册异常:', error);
    throw error;
  }
};

export const compareRegistrationMethods = async () => {
  console.log('📊 对比两种注册方式');
  
  try {
    console.log('\n=== 1. 测试邀请码注册 ===');
    await testInvitationRegistration();
    
    console.log('\n=== 2. 测试手机验证码注册 ===');
    await testPhoneRegistration();
    
  } catch (error) {
    console.error('对比测试失败:', error);
  }
};