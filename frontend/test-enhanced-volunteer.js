const BASE_URL = 'http://106.14.165.234:8085';

// 获取token
async function getToken() {
  const response = await fetch(`${BASE_URL}/app/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=admin&password=123456',
  });
  const data = await response.json();
  return data.data?.token;
}

// 模拟增强版的getLastVolunteerRecord
async function getLastRecordEnhanced(token, userId) {
  console.log(`🔍 [ENHANCED] 获取用户${userId}最后记录...`);
  
  try {
    // 方案1: lastRecordList
    const response = await fetch(`${BASE_URL}/app/hour/lastRecordList?userId=${userId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 200 && result.data) {
        console.log('✅ [ENHANCED] 主API成功:', result.data);
        return result;
      }
    }
    
    console.log('⚠️ [ENHANCED] 主API失败，使用备用方案...');
    
    // 方案2: 从recordList获取
    const recordsResponse = await fetch(`${BASE_URL}/app/hour/recordList`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (recordsResponse.ok) {
      const recordsData = await recordsResponse.json();
      if (recordsData.code === 200 && recordsData.rows) {
        const userRecords = recordsData.rows
          .filter(r => r.userId === userId)
          .sort((a, b) => new Date(b.startTime || '2020-01-01').getTime() - new Date(a.startTime || '2020-01-01').getTime());

        if (userRecords.length > 0) {
          console.log('✅ [ENHANCED] 备用方案成功:', userRecords[0]);
          return { code: 200, msg: '操作成功', data: userRecords[0] };
        }
      }
    }
    
    console.log('❌ [ENHANCED] 所有方案都失败');
    return { code: 404, msg: '未找到记录' };
    
  } catch (error) {
    console.error('❌ [ENHANCED] 异常:', error);
    return { code: 500, msg: '网络错误' };
  }
}

// 测试完整流程
async function testEnhancedFlow() {
  const token = await getToken();
  console.log('🧪 开始增强版志愿者API测试\\n');
  
  // 1. 测试获取最后记录（应该使用备用方案）
  const lastRecord = await getLastRecordEnhanced(token, 102);
  console.log('📋 获取最后记录结果:', lastRecord);
  
  // 2. 执行签到测试
  const checkInTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log('\\n📍 执行签到测试...');
  
  const signInResult = await fetch(`${BASE_URL}/app/hour/signRecord`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${token}`,
    },
    body: `userId=102&type=1&startTime=${checkInTime}&operateUserId=102&operateLegalName=增强测试`,
  });
  
  const signInData = await signInResult.json();
  console.log('📤 签到结果:', signInData);
  
  if (signInData.code === 200) {
    // 3. 等待3秒
    console.log('⏱️ 等待3秒...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. 使用增强版获取记录ID
    const newRecord = await getLastRecordEnhanced(token, 102);
    console.log('📋 获取新记录结果:', newRecord);
    
    if (newRecord.code === 200 && newRecord.data?.id) {
      // 5. 执行签退
      const checkOutTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.log('\\n📍 执行签退测试...');
      
      const signOutResult = await fetch(`${BASE_URL}/app/hour/signRecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: `id=${newRecord.data.id}&userId=102&type=2&endTime=${checkOutTime}&operateUserId=102&operateLegalName=增强测试`,
      });
      
      const signOutData = await signOutResult.json();
      console.log('📤 签退结果:', signOutData);
      
      console.log('\\n🎉 增强版测试完成！');
    } else {
      console.log('❌ 无法获取记录ID，签退测试跳过');
    }
  } else {
    console.log('❌ 签到失败，后续测试跳过');
  }
}

testEnhancedFlow().catch(console.error);
