// 专门测试UCSD活动码 - 只使用取模25算法
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'https://www.vitaglobal.icu';
const ucsdHash = '487f7b22f68312d2c1bbc93b1aea445b';

// 管理员登录信息
const adminCredentials = {
  username: 'admin',
  password: '123456'
};

// 核心算法：取模25
function extractActivityIdFromHash(hash) {
  const front8 = hash.substring(0, 8);
  const decimal = parseInt(front8, 16);
  const activityId = decimal % 25;
  
  console.log('🧮 哈希破解计算:');
  console.log(`前8位哈希: ${front8}`);
  console.log(`转十进制: ${decimal}`);
  console.log(`取模25: ${decimal} % 25 = ${activityId}`);
  
  return activityId;
}

async function testUCSDActivity() {
  console.log('🎯 UCSD活动码专项测试');
  console.log('📍 哈希:', ucsdHash);
  console.log('🔢 预计算结果:', extractActivityIdFromHash(ucsdHash));
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
    const token = loginData.data.token;
    const userId = loginData.data.userId;
    
    // 步骤2: 计算UCSD活动ID
    const activityId = extractActivityIdFromHash(ucsdHash);
    console.log(`\n🎯 根据算法，UCSD活动ID应该是: ${activityId}`);
    
    // 步骤3: 检查这个活动是否存在
    console.log(`\n📝 步骤2: 检查活动ID ${activityId} 是否存在...`);
    
    const signInfoResponse = await fetch(`${API_BASE}/app/activity/getSignInfo?activityId=${activityId}&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const signInfo = await signInfoResponse.json();
    
    if (signInfo.code === 200) {
      console.log(`✅ 活动ID ${activityId} 存在！`);
      console.log('📊 报名状态:', 
        signInfo.data === 0 ? '未报名' : 
        signInfo.data === -1 ? '已报名未签到' : 
        signInfo.data === 1 ? '已报名已签到' : `未知状态(${signInfo.data})`
      );
      
      // 步骤4: 获取活动详情确认是UCSD
      console.log('\n📝 步骤3: 获取活动详情确认是否为UCSD...');
      const activitiesResponse = await fetch(`${API_BASE}/app/activity/list?userId=${userId}&pageNum=1&pageSize=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const activitiesData = await activitiesResponse.json();
      
      if (activitiesData.code === 200 && activitiesData.rows) {
        const targetActivity = activitiesData.rows.find(activity => activity.id === activityId);
        
        if (targetActivity) {
          console.log(`🎯 找到活动: ${targetActivity.name}`);
          console.log(`📍 活动ID: ${targetActivity.id}`);
          console.log(`📅 开始时间: ${targetActivity.startTime}`);
          console.log(`📅 结束时间: ${targetActivity.endTime}`);
          
          if (targetActivity.name.includes('UCSD')) {
            console.log('🎉 确认是UCSD活动！算法正确！');
            
            // 如果已报名未签到，尝试签到
            if (signInfo.data === -1) {
              console.log('\n📝 步骤4: 尝试签到...');
              
              const signinResponse = await fetch(`${API_BASE}/app/activity/signIn?activityId=${activityId}&userId=${userId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              const signinData = await signinResponse.json();
              
              if (signinData.code === 200) {
                console.log('🎉🎉🎉 UCSD活动签到成功！');
                console.log('✅ 哈希破解算法完全有效！');
                return { success: true, activityId, activityName: targetActivity.name };
              } else {
                console.log('❌ 签到失败:', signinData.msg);
              }
            } else if (signInfo.data === 1) {
              console.log('ℹ️ 用户已经签到过了');
            } else if (signInfo.data === 0) {
              console.log('⚠️ 用户还没有报名这个活动');
            }
          } else {
            console.log('⚠️ 这不是UCSD活动，活动名称:', targetActivity.name);
          }
        } else {
          console.log('❌ 在活动列表中没找到ID为', activityId, '的活动');
        }
      }
      
    } else {
      console.log(`❌ 活动ID ${activityId} 不存在或查询失败:`, signInfo.msg);
    }

  } catch (error) {
    console.error('❌ 测试过程出错:', error);
  }
}

// 运行测试
console.log('🚀 开始UCSD哈希破解专项测试...\n');
testUCSDActivity().catch(console.error);