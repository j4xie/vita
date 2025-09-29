/**
 * 测试特定用户的志愿者状态API - 简化版
 * 用户: lt2692@nyu.edu
 */

const fetch = require('node-fetch');

// 生产环境API地址
const API_BASE_URL = 'https://www.vitaglobal.icu';

// 测试用户信息
const TEST_USER = {
  email: 'lt2692@nyu.edu',
  password: 'CQTtlt12345!'
};

// 获取Bearer Token
async function loginAndGetToken() {
  try {
    console.log('🔐 [LOGIN] 尝试登录用户:', TEST_USER.email);
    console.log('🌐 [ENV] 使用生产环境API:', API_BASE_URL);

    const loginResponse = await fetch(`${API_BASE_URL}/app/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: `username=${encodeURIComponent(TEST_USER.email)}&password=${encodeURIComponent(TEST_USER.password)}`
    });

    console.log('📡 [LOGIN] 响应状态:', {
      status: loginResponse.status,
      statusText: loginResponse.statusText
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login HTTP error: ${loginResponse.status} - ${errorText}`);
    }

    const loginData = await loginResponse.json();
    console.log('📝 [LOGIN] 登录响应:', {
      code: loginData.code,
      msg: loginData.msg,
      hasToken: !!loginData.token,
      tokenLength: loginData.token?.length,
      hasUserData: !!loginData.user,
      userId: loginData.user?.userId || loginData.userId
    });

    if (loginData.code !== 200) {
      throw new Error(`Login failed: ${loginData.msg}`);
    }

    return {
      token: loginData.token,
      userId: loginData.user?.userId || loginData.userId,
      userData: loginData.user
    };

  } catch (error) {
    console.error('❌ [LOGIN] 登录失败:', error);
    throw error;
  }
}

// 测试lastRecordList接口
async function testLastRecordList(token, userId) {
  try {
    console.log(`\n🔍 [API-TEST] 测试用户${userId}的lastRecordList接口...`);

    const url = `${API_BASE_URL}/app/hour/lastRecordList?userId=${userId}`;
    console.log('📡 [API-TEST] 请求URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    console.log('📊 [API-TEST] API响应状态:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API-TEST] API请求失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });

      // 如果是500错误，很可能是SQL错误
      if (response.status === 500) {
        console.log('🚨 [SQL-ERROR] 检测到500错误，可能是user_id歧义问题');
      }

      return { error: true, status: response.status, message: errorText };
    }

    const data = await response.json();
    console.log('📊 [API-TEST] API返回数据:', JSON.stringify(data, null, 2));

    return { error: false, data };

  } catch (error) {
    console.error('❌ [API-TEST] 接口测试异常:', error);
    return { error: true, message: error.message };
  }
}

// 备用：测试recordList接口
async function testRecordList(token, userId) {
  try {
    console.log(`\n🔄 [BACKUP-API] 测试备用recordList接口...`);

    const response = await fetch(`${API_BASE_URL}/app/hour/recordList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: `userId=${userId}&pageNum=1&pageSize=5`
    });

    console.log('📊 [BACKUP-API] 响应状态:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [BACKUP-API] 备用API请求失败:', {
        status: response.status,
        errorText: errorText
      });
      return { error: true, status: response.status, message: errorText };
    }

    const data = await response.json();
    console.log('📊 [BACKUP-API] 备用API返回数据:', JSON.stringify(data, null, 2));

    return { error: false, data };

  } catch (error) {
    console.error('❌ [BACKUP-API] 备用接口测试异常:', error);
    return { error: true, message: error.message };
  }
}

// 分析用户状态并给出建议
function analyzeUserStatus(apiData) {
  console.log('\n=== 📋 用户状态分析 ===');

  if (!apiData || apiData.code !== 200) {
    console.log('🟢 [建议] 无有效记录 → 显示"签到计时"按钮');
    console.log('💡 [操作] 用户可以正常签到');
    return 'show_checkin';
  }

  const record = apiData.data;
  if (!record) {
    console.log('🟢 [建议] 记录为空 → 显示"签到计时"按钮');
    console.log('💡 [操作] 用户可以正常签到');
    return 'show_checkin';
  }

  console.log('📊 [记录详情]', {
    recordId: record.id,
    userId: record.userId,
    startTime: record.startTime,
    endTime: record.endTime,
    type: record.type,
    legalName: record.legalName
  });

  // 判断签到状态
  if (record.endTime === null || record.endTime === undefined || record.endTime === '') {
    console.log('🟡 [建议] 用户已签到但未签退 → 显示"签退"按钮');

    // 检查签到时间是否异常
    try {
      const startTime = new Date(record.startTime.replace(' ', 'T'));
      const now = new Date();
      const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      console.log('⏰ [时长检查]', {
        签到时间: record.startTime,
        当前时间: now.toLocaleString('zh-CN'),
        工作小时数: hoursElapsed.toFixed(2),
        是否异常: hoursElapsed > 24 ? '是（超过24小时）' : '否'
      });

      if (hoursElapsed > 24) {
        console.log('⚠️ [异常警告] 检测到超长工作时间，建议重置状态而非正常签退');
        return 'need_reset';
      }

      console.log('💡 [操作] 用户应该点击"签退"按钮');
      return 'show_checkout';

    } catch (timeError) {
      console.error('❌ [时间解析错误]', timeError);
      console.log('⚠️ [建议] 时间格式异常，建议重置状态');
      return 'need_reset';
    }

  } else {
    console.log('🟢 [建议] 用户已签退 → 显示"签到计时"按钮');
    console.log('💡 [操作] 用户可以重新签到');
    return 'show_checkin';
  }
}

// 主测试函数
async function main() {
  try {
    console.log('🚀 [TEST] 开始测试生产环境用户志愿者状态...');
    console.log('🌐 [ENV] 当前API地址:', API_BASE_URL);

    // 1. 登录获取token
    const authResult = await loginAndGetToken();
    console.log('✅ [AUTH] 认证成功:', {
      userId: authResult.userId,
      userName: authResult.userData?.userName,
      legalName: authResult.userData?.legalName
    });

    // 2. 测试主接口
    console.log('\n=== 🔍 测试主接口 lastRecordList ===');
    const mainResult = await testLastRecordList(authResult.token, authResult.userId);

    let finalStatus = null;

    if (mainResult.error) {
      console.log('\n=== 🔄 主接口失败，测试备用接口 recordList ===');
      const backupResult = await testRecordList(authResult.token, authResult.userId);

      if (!backupResult.error) {
        console.log('✅ [RESULT] 备用接口成功');
        finalStatus = analyzeUserStatus(backupResult.data);
      } else {
        console.log('❌ [RESULT] 所有接口都失败');
        console.log('🛠️ [建议] 需要清理本地缓存并显示"签到计时"按钮');
        finalStatus = 'clear_cache_show_checkin';
      }
    } else {
      console.log('✅ [RESULT] 主接口成功');
      finalStatus = analyzeUserStatus(mainResult.data);
    }

    // 最终建议
    console.log('\n=== 🎯 最终建议 ===');
    switch (finalStatus) {
      case 'show_checkin':
        console.log('🟢 [UI建议] 显示"签到计时"按钮');
        break;
      case 'show_checkout':
        console.log('🟡 [UI建议] 显示"签退"按钮');
        break;
      case 'need_reset':
        console.log('🔴 [UI建议] 突出显示"重置状态"按钮，隐藏或禁用签退按钮');
        break;
      case 'clear_cache_show_checkin':
        console.log('🔧 [UI建议] 清理缓存后显示"签到计时"按钮');
        break;
      default:
        console.log('❓ [UI建议] 默认显示"签到计时"按钮');
    }

  } catch (error) {
    console.error('❌ [TEST] 测试失败:', error);
    console.log('🛠️ [兜底建议] 显示"签到计时"按钮，提示用户检查网络');
  }
}

// 运行测试
main().catch(console.error);