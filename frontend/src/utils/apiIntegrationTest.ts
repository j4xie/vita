/**
 * APP接口联调测试工具
 */

import { login, getCurrentToken } from '../services/authAPI';
import { fetchSchoolList, fetchOrganizationList } from '../services/registrationAPI';

const BASE_URL = 'http://106.14.165.234:8085';

export const testAllAPIs = async () => {
  console.log('🚀 开始APP接口联调测试...\n');

  try {
    // 1. 测试登录接口
    console.log('=== 1. 测试登录接口 ===');
    const loginResult = await login({
      username: 'test001',
      password: '123456'
    });

    if (loginResult.code === 200) {
      console.log('✅ 登录成功');
      console.log('User ID:', loginResult.data?.userId);
      console.log('Token预览:', loginResult.data?.token?.substring(0, 30) + '...');
      
      const token = loginResult.data?.token;
      
      // 2. 测试用户信息接口
      console.log('\n=== 2. 测试用户信息接口 ===');
      const userInfoResponse = await fetch(`${BASE_URL}/app/user/info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userInfo = await userInfoResponse.json();
      console.log('用户信息:', userInfo.code === 200 ? '✅ 成功' : '❌ 失败', userInfo.msg);

      // 3. 测试活动列表接口
      console.log('\n=== 3. 测试活动列表接口 ===');
      const activitiesResponse = await fetch(`${BASE_URL}/app/activity/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const activities = await activitiesResponse.json();
      console.log('活动列表:', activities.code === 200 ? '✅ 成功' : '❌ 失败');
      if (activities.code === 200) {
        console.log('活动数量:', activities.total);
        console.log('第一个活动:', activities.rows?.[0]?.name);
      }

      // 4. 测试活动报名接口
      if (activities.code === 200 && activities.rows?.length > 0) {
        console.log('\n=== 4. 测试活动报名接口 ===');
        const activityId = activities.rows[0].id;
        const enrollResponse = await fetch(`${BASE_URL}/app/activity/enroll?activityId=${activityId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const enrollResult = await enrollResponse.json();
        console.log('活动报名:', enrollResult.code === 200 ? '✅ 成功' : '❌ 失败', enrollResult.msg);
      }

      // 5. 测试志愿者相关接口
      console.log('\n=== 5. 测试志愿者接口 ===');
      const volunteerResponse = await fetch(`${BASE_URL}/app/hour/recordList`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const volunteerData = await volunteerResponse.json();
      console.log('志愿者记录:', volunteerData.code === 200 ? '✅ 成功' : '❌ 失败', volunteerData.msg);

    } else {
      console.log('❌ 登录失败:', loginResult.msg);
    }

    // 6. 测试无需认证的接口
    console.log('\n=== 6. 测试公开接口 ===');
    
    const schoolsResult = await fetchSchoolList();
    console.log('学校列表:', schoolsResult.code === 200 ? '✅ 成功' : '❌ 失败');
    if (schoolsResult.code === 200) {
      console.log('学校数量:', schoolsResult.data?.length);
    }

    const orgsResult = await fetchOrganizationList();
    console.log('组织列表:', orgsResult.code === 200 ? '✅ 成功' : '❌ 失败');
    if (orgsResult.code === 200) {
      console.log('组织数量:', orgsResult.data?.length);
    }

  } catch (error) {
    console.error('💥 联调测试异常:', error);
  }

  console.log('\n🎯 联调测试完成！');
};

export const testRegistrationAPIs = async () => {
  console.log('🧪 测试注册相关接口...\n');

  // 测试form-data格式注册
  const testFormDataRegistration = async (userData: any, description: string) => {
    console.log(`--- ${description} ---`);
    
    const formData = new URLSearchParams();
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(`${BASE_URL}/app/user/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await response.json();
      console.log('响应:', result);
      return result;
    } catch (error) {
      console.error('请求异常:', error);
      return null;
    }
  };

  // 测试1：邀请码注册
  await testFormDataRegistration({
    userName: 'invite2025test',
    legalName: '邀请测试用户',
    nickName: 'InviteTest',
    password: '123456',
    sex: '0',
    deptId: 214,
    orgId: 1,
    invCode: '2G7KKG49'
  }, '邀请码注册测试');

  // 测试2：普通注册（最小字段）
  await testFormDataRegistration({
    userName: 'normal2025test',
    password: '123456'
  }, '最小字段注册测试');

  // 测试3：完整普通注册
  await testFormDataRegistration({
    userName: 'full2025test',
    legalName: '完整测试用户',
    nickName: 'FullTest',
    password: '123456',
    phonenumber: '13800138003',
    email: 'full2025@ucla.edu',
    sex: '1',
    deptId: 214,
    orgId: 1
  }, '完整普通注册测试');
};

// 可以在控制台运行：
// import('./utils/apiIntegrationTest').then(m => m.testAllAPIs())