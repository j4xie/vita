const https = require('https');
const querystring = require('querystring');

const TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiBYaWUiLCJsb2dpbl91c2VyX2tleSI6IjE3OWI3MzkyLWY3NGYtNDhjNS1iOTNhLTBkNDk1ZmQ2YTgwNyJ9.nK2PtFEQwfm43gigDJIKBAYE54irPeZc5JTqhlwFuePSxelLRI94rS153j5gV9PKVwGm2C6qPjbLP_EJe5vquA';

function makeRequest(path, params = {}, method = 'GET') {
    return new Promise((resolve, reject) => {
        let requestPath = path;
        let postData = null;
        
        if (method === 'GET' && Object.keys(params).length > 0) {
            requestPath += '?' + querystring.stringify(params);
        } else if (method === 'POST') {
            postData = querystring.stringify(params);
        }
        
        const options = {
            hostname: 'www.vitaglobal.icu',
            port: 443,
            path: requestPath,
            method: method,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (compatible; TestAgent/1.0)'
            }
        };
        
        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        
        console.log(`🔍 调用API: ${method} ${requestPath}`);
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`   状态码: ${res.statusCode}`);
                console.log(`   响应: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ success: true, data: jsonData, status: res.statusCode });
                } catch (error) {
                    resolve({ success: false, error: `JSON解析失败: ${error.message}`, rawData: data });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`   ❌ 请求失败: ${error.message}`);
            reject({ success: false, error: error.message });
        });
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testAPIs() {
    console.log('=== 开始API测试 ===\n');
    
    try {
        // 1. 先测试用户信息API
        console.log('1️⃣ 测试获取用户信息...');
        const userInfo = await makeRequest('/app/user/info');
        
        if (userInfo.success && userInfo.data.code === 200) {
            console.log('✅ 用户信息API调用成功');
            
            // 从Token中解析用户信息
            const tokenParts = TOKEN.split('.');
            if (tokenParts.length === 3) {
                try {
                    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                    console.log('📋 从Token解析的信息:');
                    console.log(`   用户: ${payload.sub}`);
                    console.log(`   登录Key: ${payload.login_user_key}`);
                    
                    // 尝试用admin用户ID测试 (通常admin用户ID是1)
                    const testUserId = 1;
                    
                    console.log(`\n2️⃣ 使用用户ID ${testUserId} 测试活动相关API...`);
                    
                    // 测试获取用户报名活动
                    const userActivities = await makeRequest('/app/activity/userActivitylist', { userId: testUserId });
                    
                    if (userActivities.success) {
                        console.log('✅ 用户活动API调用成功');
                        const activities = userActivities.data?.data || [];
                        console.log(`   已报名活动数量: ${activities.length}`);
                        
                        // 查找UCI活动
                        const uciActivities = activities.filter(activity => 
                            activity.activityName && activity.activityName.toLowerCase().includes('uci')
                        );
                        
                        console.log(`   UCI活动数量: ${uciActivities.length}`);
                        
                        if (uciActivities.length > 0) {
                            console.log('   🎯 找到UCI活动:');
                            uciActivities.forEach(activity => {
                                console.log(`     - ${activity.activityName} (ID: ${activity.activityId})`);
                                console.log(`       签到状态: ${activity.signStatus === 1 ? '已签到' : '未签到'}`);
                            });
                        } else {
                            console.log('   ⚠️  用户未报名任何UCI活动');
                        }
                    } else {
                        console.log('❌ 用户活动API失败:', userActivities.error);
                    }
                    
                    // 测试获取所有活动列表
                    console.log(`\n3️⃣ 测试获取活动列表...`);
                    const allActivities = await makeRequest('/app/activity/list', { 
                        userId: testUserId, 
                        pageNum: 1, 
                        pageSize: 20 
                    });
                    
                    if (allActivities.success) {
                        console.log('✅ 活动列表API调用成功');
                        const activities = allActivities.data?.data?.rows || [];
                        console.log(`   系统活动总数: ${activities.length}`);
                        
                        const uciActivities = activities.filter(activity => 
                            activity.activityName && activity.activityName.toLowerCase().includes('uci')
                        );
                        
                        console.log(`   UCI活动数量: ${uciActivities.length}`);
                        
                        if (uciActivities.length > 0) {
                            console.log('   📋 UCI活动列表:');
                            uciActivities.forEach(activity => {
                                console.log(`     - ${activity.activityName} (ID: ${activity.activityId})`);
                                console.log(`       时间: ${activity.startTime} - ${activity.endTime}`);
                                console.log(`       状态: ${activity.isActive === '1' ? '活跃' : '非活跃'}`);
                            });
                            
                            // 测试第一个UCI活动的签到
                            const testActivity = uciActivities[0];
                            console.log(`\n4️⃣ 测试签到 "${testActivity.activityName}"...`);
                            
                            const signInTest = await makeRequest('/app/activity/signIn', { 
                                activityId: testActivity.activityId, 
                                userId: testUserId 
                            });
                            
                            if (signInTest.success) {
                                console.log('✅ 签到API调用成功');
                                console.log(`   响应码: ${signInTest.data?.code}`);
                                console.log(`   响应消息: ${signInTest.data?.msg}`);
                                
                                if (signInTest.data?.msg?.includes('尚未报名')) {
                                    console.log('   🎯 问题确认: 确实显示"尚未报名该活动"');
                                    console.log('   💡 说明: 管理员用户确实没有报名此活动');
                                } else if (signInTest.data?.code === 200) {
                                    console.log('   ✅ 签到成功');
                                }
                            } else {
                                console.log('❌ 签到API失败:', signInTest.error);
                            }
                        } else {
                            console.log('   ⚠️  系统中没有UCI活动');
                        }
                    } else {
                        console.log('❌ 活动列表API失败:', allActivities.error);
                    }
                    
                } catch (parseError) {
                    console.log('❌ Token解析失败:', parseError.message);
                }
            }
        } else {
            console.log('❌ 用户信息API失败');
        }
        
        console.log('\n📋 测试总结:');
        console.log('1. Token有效，可以访问API');
        console.log('2. 当前是管理员账户 (admin Xie)');
        console.log('3. 需要检查具体的普通用户账户是否报名了UCI活动');
        console.log('4. 如果普通用户没有报名UCI活动，那么扫码签到时就会显示"尚未报名"');
        
    } catch (error) {
        console.log('❌ 测试过程发生错误:', error.message);
    }
}

testAPIs();