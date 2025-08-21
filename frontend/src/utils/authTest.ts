/**
 * 认证功能完整测试工具
 */

import { login } from '../services/authAPI';
import { registerUser } from '../services/registrationAPI';
import { RegistrationAPIRequest } from '../types/registration';

export const testAuthFlow = async () => {
  console.log('🧪 开始测试完整的认证流程...');

  // 测试1：邀请码注册
  console.log('\n=== 测试邀请码注册 ===');
  const invitationData: RegistrationAPIRequest = {
    userName: 'invite2025demo',
    legalName: '邀请 演示用户',
    nickName: 'Invite Demo',
    password: 'demo123456',
    sex: '0',
    deptId: 214, // UCLA
    orgId: 4, // Chinese Union
    invCode: '2G7KKG49', // 您提供的邀请码
    // 邀请码注册：不包含 verCode, bizId, phonenumber, email
  };

  try {
    console.log('📤 发送邀请码注册数据:', invitationData);
    const registerResult = await registerUser(invitationData);
    console.log('📥 邀请码注册响应:', registerResult);

    if (registerResult.code === 200) {
      console.log('✅ 邀请码注册成功！');
      
      // 测试2：用注册的账号登录
      console.log('\n=== 测试登录 ===');
      const loginResult = await login({
        username: invitationData.userName,
        password: invitationData.password
      });
      
      console.log('📥 登录响应:', loginResult);
      
      if (loginResult.code === 200) {
        console.log('✅ 登录成功！Token:', loginResult.data?.token?.substring(0, 20) + '...');
      } else {
        console.log('❌ 登录失败:', loginResult.msg);
      }
    } else {
      console.log('❌ 邀请码注册失败:', registerResult.msg);
    }
  } catch (error) {
    console.error('💥 认证流程测试异常:', error);
  }

  // 测试3：普通注册（如果需要）
  console.log('\n=== 测试普通注册 ===');
  const normalData: RegistrationAPIRequest = {
    userName: 'normal2025demo',
    legalName: '普通 演示用户',
    nickName: 'Normal Demo',
    password: 'demo123456',
    phonenumber: '13800138001',
    email: 'normal2025demo@ucla.edu',
    sex: '1',
    deptId: 214, // UCLA
    orgId: 1, // 学联组织
    // 普通注册：不包含 invCode
    // verCode 和 bizId 暂时跳过（短信服务未配置）
  };

  try {
    console.log('📤 发送普通注册数据:', normalData);
    const normalRegisterResult = await registerUser(normalData);
    console.log('📥 普通注册响应:', normalRegisterResult);

    if (normalRegisterResult.code === 200) {
      console.log('✅ 普通注册成功！');
    } else {
      console.log('❌ 普通注册失败:', normalRegisterResult.msg);
    }
  } catch (error) {
    console.error('💥 普通注册测试异常:', error);
  }

  console.log('\n🎯 测试完成！');
};

export const testRegistrationDataFormat = () => {
  console.log('📊 验证注册数据格式...');
  
  const invitationFormat = {
    userName: 'invite2025',
    legalName: '邀请 用户',
    nickName: 'Invite User',
    password: 'test123456',
    sex: '0',
    deptId: 214,
    orgId: 4,
    invCode: '2G7KKG49',
    // 邀请码注册特点：
    // ✅ 不包含 verCode
    // ✅ 不包含 bizId  
    // ✅ 不包含 phonenumber (可选)
    // ✅ 不包含 email (可选)
  };

  const phoneFormat = {
    userName: 'phone2025',
    legalName: '手机 用户',
    nickName: 'Phone User',
    password: 'test123456',
    phonenumber: '13800138000',
    email: 'phone2025@ucla.edu',
    sex: '1',
    deptId: 214,
    orgId: 1,
    // verCode: '123456', // 短信验证码（暂时跳过）
    // bizId: 'sms-biz-id', // 短信业务ID（暂时跳过）
    // 手机注册特点：
    // ✅ 不包含 invCode
    // ❌ 需要 verCode (短信服务未配置)
    // ❌ 需要 bizId (短信服务未配置)
  };

  console.log('邀请码注册格式:', invitationFormat);
  console.log('手机注册格式:', phoneFormat);
  
  return { invitationFormat, phoneFormat };
};

// 在浏览器控制台中使用：
// import('./utils/authTest').then(m => m.testAuthFlow())