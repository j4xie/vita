/**
 * 注册功能测试工具
 * 用于验证API调用和数据格式
 */

import { 
  fetchSchoolList, 
  fetchOrganizationList, 
  sendSMSVerificationCode,
  registerUser 
} from '../services/registrationAPI';
import { RegistrationAPIRequest } from '../types/registration';

export const testRegistrationAPIs = async () => {
  console.log('🧪 开始测试注册相关API...');

  try {
    // 测试学校列表API
    console.log('📚 测试学校列表API...');
    const schoolsResponse = await fetchSchoolList();
    console.log('学校列表响应:', schoolsResponse);

    // 测试组织列表API
    console.log('🏢 测试组织列表API...');
    const orgsResponse = await fetchOrganizationList();
    console.log('组织列表响应:', orgsResponse);

    // 测试短信验证码API（注意：这会真的发送短信）
    console.log('📱 测试短信验证码API...');
    // const smsResponse = await sendSMSVerificationCode('13800138000');
    // console.log('短信验证码响应:', smsResponse);

    console.log('✅ API测试完成');
  } catch (error) {
    console.error('❌ API测试失败:', error);
  }
};

export const createTestRegistrationData = (): RegistrationAPIRequest => {
  return {
    userName: 'testuser123',
    legalName: '张 三',
    nickName: 'John Zhang',
    password: 'test123456',
    phonenumber: '13800138000',
    email: 'testuser123@ucla.edu',
    sex: '0',
    deptId: 202,
    verCode: '123456',
    bizId: 'test-biz-id',
    orgId: 1,
  };
};

/**
 * 验证注册数据格式
 */
export const validateRegistrationData = (data: RegistrationAPIRequest): string[] => {
  const errors: string[] = [];

  // 验证用户名
  if (!data.userName || data.userName.length < 6 || data.userName.length > 20) {
    errors.push('用户名长度必须为6-20位');
  }
  if (!/^[a-zA-Z0-9]+$/.test(data.userName)) {
    errors.push('用户名只能包含字母和数字');
  }

  // 验证法定姓名
  if (!data.legalName || data.legalName.length > 50) {
    errors.push('法定姓名不能超过50位');
  }

  // 验证昵称
  if (!data.nickName || data.nickName.length > 50) {
    errors.push('昵称不能超过50位');
  }

  // 验证密码
  if (!data.password || data.password.length < 6 || data.password.length > 20) {
    errors.push('密码长度必须为6-20位');
  }

  // 验证手机号（注意字段名是phonenumber）
  if (!data.phonenumber || !/^1[3-9]\d{9}$/.test(data.phonenumber)) {
    errors.push('手机号格式不正确');
  }

  // 验证邮箱
  if (!data.email || !data.email.includes('@') || !data.email.endsWith('.edu')) {
    errors.push('邮箱必须是.edu结尾的学校邮箱');
  }

  // 验证性别
  if (!['0', '1', '2'].includes(data.sex)) {
    errors.push('性别值必须为0、1或2');
  }

  // 验证学校ID
  if (!data.deptId || data.deptId <= 0) {
    errors.push('学校ID必须大于0');
  }

  // 验证验证码
  if (!data.verCode || !/^\d{6}$/.test(data.verCode)) {
    errors.push('验证码必须为6位数字');
  }

  // 验证组织ID
  if (!data.orgId || data.orgId <= 0) {
    errors.push('组织ID必须大于0');
  }

  return errors;
};

/**
 * 打印注册数据调试信息
 */
export const debugRegistrationData = (data: RegistrationAPIRequest) => {
  console.log('📝 注册数据检查:');
  console.log('用户名:', data.userName, `(长度: ${data.userName?.length})`);
  console.log('法定姓名:', data.legalName, `(长度: ${data.legalName?.length})`);
  console.log('昵称:', data.nickName, `(长度: ${data.nickName?.length})`);
  console.log('密码:', '***', `(长度: ${data.password?.length})`);
  console.log('手机号:', data.phonenumber);
  console.log('邮箱:', data.email);
  console.log('性别:', data.sex);
  console.log('学校ID:', data.deptId);
  console.log('验证码:', data.verCode);
  console.log('短信业务ID:', data.bizId);
  console.log('组织ID:', data.orgId);

  const errors = validateRegistrationData(data);
  if (errors.length > 0) {
    console.log('❌ 数据验证错误:');
    errors.forEach(error => console.log('  -', error));
  } else {
    console.log('✅ 数据格式验证通过');
  }
};