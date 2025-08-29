const BASE_URL = 'http://106.14.165.234:8085';

async function getToken() {
  const response = await fetch(`${BASE_URL}/app/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=admin&password=123456',
  });
  return (await response.json()).data?.token;
}

async function testSimplifiedAPI() {
  const token = await getToken();
  console.log('🧪 测试简化后的API参数\n');
  
  // 1. 简化签到 - 只包含文档要求的参数
  const startTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log('📍 简化签到测试...');
  console.log('参数:', { userId: 102, type: 1, startTime });
  
  const signInForm = new URLSearchParams();
  signInForm.append('userId', '102');
  signInForm.append('type', '1');
  signInForm.append('startTime', startTime);
  
  const signInResult = await fetch(`${BASE_URL}/app/hour/signRecord`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${token}`,
    },
    body: signInForm.toString(),
  });
  
  const signInData = await signInResult.json();
  console.log('📤 签到结果:', signInData);
  console.log('📤 请求体:', signInForm.toString());
  
  if (signInData.code === 200) {
    // 2. 等待3秒
    console.log('\n⏱️ 等待3秒...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. 获取记录ID (使用备用方案)
    console.log('\n📋 获取记录ID...');
    const recordsResponse = await fetch(`${BASE_URL}/app/hour/recordList`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const recordsData = await recordsResponse.json();
    const userRecords = recordsData.rows?.filter(r => r.userId === 102) || [];
    const latestRecord = userRecords.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0];
    
    if (latestRecord?.id) {
      console.log('📋 找到记录ID:', latestRecord.id);
      
      // 4. 简化签退 - 只包含文档要求的参数
      const endTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.log('\n📍 简化签退测试...');
      console.log('参数:', { userId: 102, type: 2, endTime, id: latestRecord.id });
      
      const signOutForm = new URLSearchParams();
      signOutForm.append('userId', '102');
      signOutForm.append('type', '2');
      signOutForm.append('endTime', endTime);
      signOutForm.append('id', String(latestRecord.id));
      
      const signOutResult = await fetch(`${BASE_URL}/app/hour/signRecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: signOutForm.toString(),
      });
      
      const signOutData = await signOutResult.json();
      console.log('📤 签退结果:', signOutData);
      console.log('📤 请求体:', signOutForm.toString());
      
      console.log('\n🎉 简化API测试完成！');
    } else {
      console.log('❌ 无法获取记录ID');
    }
  } else {
    console.log('❌ 签到失败，跳过签退测试');
  }
}

testSimplifiedAPI().catch(console.error);
