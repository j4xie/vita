/**
 * 测试注册功能（无短信验证版本）
 */

import { registerUser } from '../services/registrationAPI';
import { RegistrationAPIRequest } from '../types/registration';

export const testRegistrationWithoutSMS = async () => {
  const testData: RegistrationAPIRequest = {
    userName: 'testuser2025',
    legalName: '张 三',
    nickName: 'John Zhang',
    password: 'test123456',
    phonenumber: '13800138000',
    email: 'testuser2025@ucla.edu',
    sex: '0',
    deptId: 214, // UCLA的真实ID
    // 不包含 verCode 和 bizId，因为短信服务未配置
    orgId: 1, // 学联组织
  };

  console.log('🧪 测试无短信验证的注册功能...');
  console.log('测试数据:', testData);

  try {
    const response = await registerUser(testData);
    console.log('✅ 注册响应:', response);
    
    if (response.code === 200) {
      console.log('🎉 注册成功！');
    } else {
      console.log('❌ 注册失败:', response.msg);
    }
  } catch (error) {
    console.error('💥 注册异常:', error);
  }
};

// 可以在浏览器控制台中调用：
// import('./utils/testRegistration').then(m => m.testRegistrationWithoutSMS());