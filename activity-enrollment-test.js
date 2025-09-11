// 活动报名签到问题诊断测试脚本

const BASE_URL = 'https://www.vitaglobal.icu';

// 测试用户token - 需要使用实际的用户token
const TEST_TOKEN = 'YOUR_TEST_TOKEN_HERE';

// 测试函数
async function makeRequest(endpoint, params = {}, method = 'GET') {
    const url = new URL(endpoint, BASE_URL);
    
    let requestOptions = {
        method: method,
        headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    
    if (method === 'GET' && Object.keys(params).length > 0) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    } else if (method === 'POST') {
        const formData = new URLSearchParams();
        Object.keys(params).forEach(key => formData.append(key, params[key]));
        requestOptions.body = formData;
    }
    
    try {
        const response = await fetch(url, requestOptions);
        const data = await response.json();
        return { success: true, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 1. 获取用户信息
async function getUserInfo() {
    console.log('=== 获取用户信息 ===');
    const result = await makeRequest('/app/user/info');
    console.log('用户信息:', JSON.stringify(result, null, 2));
    return result;
}

// 2. 获取活动列表
async function getActivityList(userId) {
    console.log('=== 获取活动列表 ===');
    const result = await makeRequest('/app/activity/list', { userId, pageNum: 1, pageSize: 20 });
    console.log('活动列表:', JSON.stringify(result, null, 2));
    return result;
}

// 3. 获取用户相关活动（查看报名状态）
async function getUserActivities(userId) {
    console.log('=== 获取用户相关活动 ===');
    const result = await makeRequest('/app/activity/userActivitylist', { userId });
    console.log('用户活动:', JSON.stringify(result, null, 2));
    return result;
}

// 4. 测试活动报名
async function enrollActivity(activityId, userId) {
    console.log('=== 测试活动报名 ===');
    const result = await makeRequest('/app/activity/enroll', { activityId, userId });
    console.log('报名结果:', JSON.stringify(result, null, 2));
    return result;
}

// 5. 测试活动签到
async function signInActivity(activityId, userId) {
    console.log('=== 测试活动签到 ===');
    const result = await makeRequest('/app/activity/signIn', { activityId, userId });
    console.log('签到结果:', JSON.stringify(result, null, 2));
    return result;
}

// 主测试流程
async function runDiagnostic() {
    console.log('开始活动报名签到问题诊断...\n');
    
    // 1. 获取用户信息
    const userInfo = await getUserInfo();
    if (!userInfo.success) {
        console.error('无法获取用户信息，请检查token是否有效');
        return;
    }
    
    const userId = userInfo.data?.data?.userId;
    if (!userId) {
        console.error('用户信息中没有找到userId');
        return;
    }
    
    console.log(`当前测试用户ID: ${userId}\n`);
    
    // 2. 获取活动列表
    const activities = await getActivityList(userId);
    
    // 3. 查找UCI相关活动
    if (activities.success && activities.data?.data?.rows) {
        const uciActivity = activities.data.data.rows.find(activity => 
            activity.activityName && activity.activityName.includes('UCI')
        );
        
        if (uciActivity) {
            console.log(`找到UCI活动: ${uciActivity.activityName} (ID: ${uciActivity.activityId})\n`);
            
            // 4. 检查用户报名状态
            await getUserActivities(userId);
            
            // 5. 测试签到（使用UCI活动ID）
            await signInActivity(uciActivity.activityId, userId);
        } else {
            console.log('未找到UCI相关活动，显示所有活动:');
            activities.data.data.rows.forEach((activity, index) => {
                console.log(`${index + 1}. ${activity.activityName} (ID: ${activity.activityId})`);
            });
        }
    }
    
    console.log('\n诊断完成');
}

// 如果需要手动测试特定活动ID
async function testSpecificActivity(activityId, userId) {
    console.log(`=== 测试特定活动 ID: ${activityId} ===`);
    
    // 先检查报名状态
    await getUserActivities(userId);
    
    // 尝试签到
    await signInActivity(activityId, userId);
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runDiagnostic,
        testSpecificActivity,
        makeRequest,
        getUserInfo,
        getActivityList,
        getUserActivities,
        enrollActivity,
        signInActivity
    };
}

// 在浏览器中运行
if (typeof window !== 'undefined') {
    window.activityTest = {
        runDiagnostic,
        testSpecificActivity,
        setToken: (token) => { TEST_TOKEN = token; }
    };
    
    console.log('活动测试工具已加载。使用 activityTest.setToken("your_token") 设置token，然后运行 activityTest.runDiagnostic()');
}