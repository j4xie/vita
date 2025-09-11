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
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ success: true, data: jsonData, status: res.statusCode });
                } catch (error) {
                    resolve({ success: false, error: `JSON解析失败: ${error.message}`, rawData: data });
                }
            });
        });
        
        req.on('error', (error) => {
            reject({ success: false, error: error.message });
        });
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runDiagnosis() {
    console.log('=== 活动报名签到问题诊断 ===\n');
    
    try {
        // 1. 获取用户信息
        console.log('1️⃣ 获取用户信息...');
        const userInfo = await makeRequest('/app/user/info');
        
        if (!userInfo.success) {
            console.log('❌ 获取用户信息失败:', userInfo.error);
            return;
        }
        
        console.log('✅ 用户信息获取成功');
        const userId = userInfo.data?.data?.userId;
        const userName = userInfo.data?.data?.userName;
        const roleKey = userInfo.data?.data?.roleKey;
        
        console.log(`   用户ID: ${userId}`);
        console.log(`   用户名: ${userName}`);
        console.log(`   权限: ${roleKey}`);
        console.log();
        
        if (!userId) {
            console.log('❌ 无法获取用户ID，停止检测');
            return;
        }
        
        // 2. 获取用户已报名活动
        console.log('2️⃣ 检查已报名活动...');
        const userActivities = await makeRequest('/app/activity/userActivitylist', { userId });
        
        if (!userActivities.success) {
            console.log('❌ 获取用户活动失败:', userActivities.error);
        } else {
            const activities = userActivities.data?.data || [];
            console.log(`✅ 已报名活动数量: ${activities.length}`);
            
            const uciActivities = activities.filter(activity => 
                activity.activityName && activity.activityName.toLowerCase().includes('uci')
            );
            
            console.log(`✅ UCI相关已报名活动: ${uciActivities.length}个`);
            
            if (uciActivities.length > 0) {
                console.log('   UCI活动详情:');
                uciActivities.forEach(activity => {
                    console.log(`   - ${activity.activityName} (ID: ${activity.activityId})`);
                    console.log(`     签到状态: ${activity.signStatus === 1 ? '已签到' : '未签到'}`);
                    console.log(`     报名时间: ${activity.createTime || '未知'}`);
                });
            } else {
                console.log('   ⚠️  没有找到已报名的UCI活动！');
            }
        }
        console.log();
        
        // 3. 获取所有可用活动
        console.log('3️⃣ 检查所有可用活动...');
        const allActivities = await makeRequest('/app/activity/list', { 
            userId, 
            pageNum: 1, 
            pageSize: 20 
        });
        
        if (!allActivities.success) {
            console.log('❌ 获取活动列表失败:', allActivities.error);
        } else {
            const activities = allActivities.data?.data?.rows || [];
            console.log(`✅ 系统中活动总数: ${activities.length}`);
            
            const uciActivities = activities.filter(activity => 
                activity.activityName && activity.activityName.toLowerCase().includes('uci')
            );
            
            console.log(`✅ 系统中UCI活动数量: ${uciActivities.length}`);
            
            if (uciActivities.length > 0) {
                console.log('   所有UCI活动:');
                uciActivities.forEach(activity => {
                    console.log(`   - ${activity.activityName} (ID: ${activity.activityId})`);
                    console.log(`     开始时间: ${activity.startTime}`);
                    console.log(`     结束时间: ${activity.endTime}`);
                    console.log(`     是否可用: ${activity.isActive === '1' ? '是' : '否'}`);
                });
                
                // 4. 测试第一个UCI活动的签到
                const testActivity = uciActivities[0];
                console.log(`\n4️⃣ 测试签到活动: ${testActivity.activityName} (ID: ${testActivity.activityId})`);
                
                const signInTest = await makeRequest('/app/activity/signIn', { 
                    activityId: testActivity.activityId, 
                    userId 
                });
                
                if (!signInTest.success) {
                    console.log('❌ 签到API调用失败:', signInTest.error);
                } else {
                    console.log('✅ 签到API调用成功');
                    console.log(`   响应码: ${signInTest.data?.code}`);
                    console.log(`   响应消息: ${signInTest.data?.msg}`);
                    
                    if (signInTest.data?.msg?.includes('尚未报名')) {
                        console.log('   🎯 确认问题: 显示"尚未报名该活动"');
                    } else if (signInTest.data?.code === 200) {
                        console.log('   ✅ 签到成功!');
                    }
                }
            }
        }
        console.log();
        
        // 5. 诊断结论
        console.log('📋 诊断结论:');
        
        if (userActivities.success) {
            const enrolledActivities = userActivities.data?.data || [];
            const hasUCIEnrolled = enrolledActivities.some(activity => 
                activity.activityName && activity.activityName.toLowerCase().includes('uci')
            );
            
            if (!hasUCIEnrolled) {
                console.log('❌ 核心问题: 用户确实没有报名任何UCI活动');
                console.log('💡 建议: 需要重新报名UCI活动');
                console.log('💡 或者检查报名流程是否存在问题');
            } else {
                console.log('✅ 用户已报名UCI活动，问题可能在活动ID匹配上');
                console.log('💡 建议: 检查二维码中的活动ID是否与报名的活动ID一致');
            }
        }
        
    } catch (error) {
        console.log('❌ 诊断过程中发生错误:', error.message);
    }
}

// 运行诊断
runDiagnosis();