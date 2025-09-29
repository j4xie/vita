/**
 * 测试特定用户的志愿者状态API
 * 用户: lt2692@nyu.edu
 */

const { getApiUrl } = require('./src/utils/environment');

// 测试用户信息
const TEST_USER = {
  email: 'lt2692@nyu.edu',
  password: 'CQTtlt12345!'
};

// 获取Bearer Token
async function loginAndGetToken() {
  try {
    console.log('🔐 [LOGIN] 尝试登录用户:', TEST_USER.email);

    const loginResponse = await fetch(`${getApiUrl()}/app/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: `username=${encodeURIComponent(TEST_USER.email)}&password=${encodeURIComponent(TEST_USER.password)}`
    });

    if (!loginResponse.ok) {
      throw new Error(`Login HTTP error: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('📝 [LOGIN] 登录响应:', {
      code: loginData.code,
      msg: loginData.msg,
      hasToken: !!loginData.token,
      tokenLength: loginData.token?.length
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
    console.log(`🔍 [API-TEST] 测试用户${userId}的lastRecordList接口...`);

    const response = await fetch(`${getApiUrl()}/app/hour/lastRecordList?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    console.log('📡 [API-TEST] API响应状态:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API-TEST] API请求失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
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
    console.log(`🔄 [BACKUP-API] 测试备用recordList接口...`);

    const response = await fetch(`${getApiUrl()}/app/hour/recordList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: `userId=${userId}&pageNum=1&pageSize=10`
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

    // 如果有记录，返回最新的一条
    if (data.code === 200 && data.rows && data.rows.length > 0) {
      const latestRecord = data.rows[0]; // 假设第一条是最新的
      console.log('📌 [BACKUP-API] 最新记录:', {
        id: latestRecord.id,
        userId: latestRecord.userId,
        startTime: latestRecord.startTime,
        endTime: latestRecord.endTime,
        type: latestRecord.type
      });

      return { error: false, data: { code: 200, data: latestRecord } };
    }

    return { error: false, data };

  } catch (error) {
    console.error('❌ [BACKUP-API] 备用接口测试异常:', error);
    return { error: true, message: error.message };
  }
}

// 主测试函数
async function main() {
  try {
    console.log('🚀 [TEST] 开始测试用户志愿者状态...');
    console.log('🌐 [ENV] 当前API地址:', getApiUrl());

    // 1. 登录获取token
    const authResult = await loginAndGetToken();
    console.log('✅ [AUTH] 认证成功:', {
      userId: authResult.userId,
      userName: authResult.userData?.userName,
      legalName: authResult.userData?.legalName
    });

    // 2. 测试主接口
    console.log('\n=== 测试主接口 lastRecordList ===');
    const mainResult = await testLastRecordList(authResult.token, authResult.userId);

    // 3. 如果主接口失败，测试备用接口
    if (mainResult.error) {
      console.log('\n=== 主接口失败，测试备用接口 recordList ===');
      const backupResult = await testRecordList(authResult.token, authResult.userId);

      if (!backupResult.error) {
        console.log('✅ [RESULT] 备用接口成功，用户状态基于备用数据');
        analyzeUserStatus(backupResult.data);
      } else {
        console.log('❌ [RESULT] 所有接口都失败，需要清理本地缓存');
      }
    } else {
      console.log('✅ [RESULT] 主接口成功，用户状态基于主接口数据');
      analyzeUserStatus(mainResult.data);
    }

  } catch (error) {
    console.error('❌ [TEST] 测试失败:', error);
  }
}

// 分析用户状态并给出建议
function analyzeUserStatus(apiData) {
  console.log('\n=== 用户状态分析 ===');

  if (!apiData || apiData.code !== 200) {
    console.log('📋 [STATUS] 无有效记录 → 显示"签到计时"按钮');
    return;
  }

  const record = apiData.data;
  if (!record) {
    console.log('📋 [STATUS] 记录为空 → 显示"签到计时"按钮');
    return;
  }

  console.log('📊 [STATUS] 记录详情:', {
    recordId: record.id,
    startTime: record.startTime,
    endTime: record.endTime,
    type: record.type,
    status: record.status
  });

  // 判断签到状态
  if (record.endTime === null || record.endTime === undefined) {
    console.log('🟡 [STATUS] 用户已签到但未签退 → 显示"签退"按钮');

    // 检查签到时间是否异常
    const startTime = new Date(record.startTime.replace(' ', 'T'));
    const now = new Date();
    const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    console.log('⏰ [STATUS] 工作时长检查:', {
      startTime: record.startTime,
      hoursElapsed: hoursElapsed.toFixed(2),
      isAbnormal: hoursElapsed > 24
    });

    if (hoursElapsed > 24) {
      console.log('⚠️ [WARNING] 检测到异常长工作时间，建议重置状态');
    }

  } else {
    console.log('🟢 [STATUS] 用户已签退 → 显示"签到计时"按钮');
  }
}

// 运行测试
main().catch(console.error);