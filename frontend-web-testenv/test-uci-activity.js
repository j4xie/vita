// 直接测试UCI活动码的智能解析和签到
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'https://www.vitaglobal.icu';
const targetHash = '487f7b22f68312d2c1bbc93b1aea445b';

// 管理员登录信息
const adminCredentials = {
  username: 'admin',
  password: '123456'
};

// 从片段分析得出的候选活动ID
const candidateActivityIds = [2, 21, 46, 72, 146, 210];

async function testUCIActivity() {
  console.log('🚀 开始UCI活动码测试');
  console.log('🎯 目标哈希:', targetHash);
  console.log('🎪 候选活动ID:', candidateActivityIds);
  console.log('\n');

  try {
    // 步骤1: 管理员登录
    console.log('📝 步骤1: 管理员登录...');
    const loginResponse = await fetch(`${API_BASE}/app/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(adminCredentials)
    });

    const loginData = await loginResponse.json();
    
    if (loginData.code !== 200) {
      console.log('❌ 登录失败:', loginData.msg);
      return;
    }

    console.log('✅ 管理员登录成功');
    console.log('👤 用户ID:', loginData.data.userId);
    const token = loginData.data.token;
    const userId = loginData.data.userId;
    
    // 步骤2: 获取活动列表，检查哪些活动存在
    console.log('\n📝 步骤2: 获取活动列表...');
    const activitiesResponse = await fetch(`${API_BASE}/app/activity/list?userId=${userId}&pageNum=1&pageSize=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const activitiesData = await activitiesResponse.json();
    
    if (activitiesData.code === 200) {
      console.log('✅ 获取活动列表成功');
      console.log('📊 总活动数:', activitiesData.total);
      
      if (activitiesData.rows && activitiesData.rows.length > 0) {
        console.log('\n🎯 现有活动:');
        activitiesData.rows.forEach((activity, index) => {
          console.log(`${index + 1}. ID: ${activity.id}, 名称: ${activity.name}, 状态: ${activity.signStatus === 0 ? '未报名' : activity.signStatus === -1 ? '已报名未签到' : '已签到'}`);
        });
      }
    }

    // 步骤3: 测试候选活动ID
    console.log('\n📝 步骤3: 测试候选活动ID...');
    
    for (const activityId of candidateActivityIds) {
      console.log(`\n🔍 测试活动ID: ${activityId}`);
      
      try {
        // 检查报名状态
        const signInfoResponse = await fetch(`${API_BASE}/app/activity/getSignInfo?activityId=${activityId}&userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const signInfo = await signInfoResponse.json();
        
        if (signInfo.code === 200) {
          console.log(`✅ 活动ID ${activityId} 存在！报名状态:`, 
            signInfo.data === 0 ? '未报名' : 
            signInfo.data === -1 ? '已报名未签到' : 
            signInfo.data === 1 ? '已报名已签到' : '未知状态'
          );
          
          // 如果已报名未签到，尝试签到
          if (signInfo.data === -1) {
            console.log(`🎯 尝试签到活动ID: ${activityId}`);
            
            const signinResponse = await fetch(`${API_BASE}/app/activity/signIn?activityId=${activityId}&userId=${userId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            const signinData = await signinResponse.json();
            
            if (signinData.code === 200) {
              console.log(`🎉 活动ID ${activityId} 签到成功!`);
              console.log(`🎯 UCI哈希 ${targetHash} 对应的活动ID是: ${activityId}`);
              return { success: true, activityId, hash: targetHash };
            } else {
              console.log(`❌ 活动ID ${activityId} 签到失败:`, signinData.msg);
            }
          }
          
        } else if (signInfo.code === 500 && signInfo.msg?.includes('不存在')) {
          console.log(`❌ 活动ID ${activityId} 不存在`);
        } else {
          console.log(`⚠️ 活动ID ${activityId} 查询异常:`, signInfo.msg);
        }
        
      } catch (error) {
        console.log(`❌ 测试活动ID ${activityId} 时出错:`, error.message);
      }
      
      // 避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 测试完成');
    console.log('💡 如果没有找到匹配的活动ID，可能需要：');
    console.log('1. 联系UCI活动管理员获取正确的活动ID');
    console.log('2. 检查活动是否已创建并开放报名');
    console.log('3. 确认当前用户是否有权限访问该活动');

  } catch (error) {
    console.error('❌ 测试过程出错:', error);
  }
}

// 运行测试
testUCIActivity().catch(console.error);