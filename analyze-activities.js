const https = require('https');
const querystring = require('querystring');

const TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiBYaWUiLCJsb2dpbl91c2VyX2tleSI6IjE3OWI3MzkyLWY3NGYtNDhjNS1iOTNhLTBkNDk1ZmQ2YTgwNyJ9.nK2PtFEQwfm43gigDJIKBAYE54irPeZc5JTqhlwFuePSxelLRI94rS153j5gV9PKVwGm2C6qPjbLP_EJe5vquA';

function makeRequest(path, params = {}) {
    return new Promise((resolve, reject) => {
        let requestPath = path;
        if (Object.keys(params).length > 0) {
            requestPath += '?' + querystring.stringify(params);
        }
        
        const options = {
            hostname: 'www.vitaglobal.icu',
            port: 443,
            path: requestPath,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ success: true, data: jsonData });
                } catch (error) {
                    resolve({ success: false, error: error.message, rawData: data });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

async function analyzeActivities() {
    console.log('=== 详细分析活动数据 ===\n');
    
    try {
        // 获取完整活动列表
        console.log('📋 获取系统中所有活动...');
        const activities = await makeRequest('/app/activity/list', { 
            userId: 1, 
            pageNum: 1, 
            pageSize: 50  // 增加页面大小
        });
        
        if (activities.success && activities.data.rows) {
            const activityList = activities.data.rows;
            console.log(`✅ 系统中共有 ${activityList.length} 个活动\n`);
            
            console.log('📋 所有活动列表:');
            activityList.forEach((activity, index) => {
                console.log(`${index + 1}. ${activity.name || activity.activityName}`);
                console.log(`   ID: ${activity.id || activity.activityId}`);
                console.log(`   开始时间: ${activity.startTime}`);
                console.log(`   结束时间: ${activity.endTime}`);
                console.log(`   创建时间: ${activity.createTime}`);
                console.log(`   状态: ${activity.isActive || activity.status}`);
                console.log('   ---');
            });
            
            // 查找UCI相关活动
            const uciActivities = activityList.filter(activity => {
                const name = activity.name || activity.activityName || '';
                return name.toLowerCase().includes('uci');
            });
            
            console.log(`\n🎯 UCI相关活动 (${uciActivities.length}个):`);
            if (uciActivities.length > 0) {
                uciActivities.forEach(activity => {
                    console.log(`- ${activity.name || activity.activityName} (ID: ${activity.id || activity.activityId})`);
                });
                
                // 测试UCI活动签到
                const uciActivity = uciActivities[0];
                const activityId = uciActivity.id || uciActivity.activityId;
                
                console.log(`\n🔍 测试UCI活动签到 (ID: ${activityId})...`);
                
                const signInTest = await makeRequest('/app/activity/signIn', { 
                    activityId: activityId, 
                    userId: 1 
                });
                
                if (signInTest.success) {
                    console.log('API响应:');
                    console.log(`  代码: ${signInTest.data.code}`);
                    console.log(`  消息: ${signInTest.data.msg}`);
                    
                    if (signInTest.data.msg && signInTest.data.msg.includes('尚未报名')) {
                        console.log('  🎯 确认: 显示"尚未报名该活动"');
                        console.log('  💡 原因: 管理员账户(用户ID:1)确实没有报名此活动');
                    }
                }
            } else {
                console.log('❌ 没有找到UCI相关活动');
                
                // 检查是否有其他类似名称的活动
                console.log('\n🔍 检查是否有其他接机活动:');
                const pickupActivities = activityList.filter(activity => {
                    const name = activity.name || activity.activityName || '';
                    return name.includes('接机') || name.includes('pickup') || name.toLowerCase().includes('airport');
                });
                
                if (pickupActivities.length > 0) {
                    console.log('找到接机相关活动:');
                    pickupActivities.forEach(activity => {
                        console.log(`- ${activity.name || activity.activityName} (ID: ${activity.id || activity.activityId})`);
                    });
                } else {
                    console.log('❌ 也没有找到其他接机活动');
                }
            }
            
            console.log('\n📋 问题分析总结:');
            console.log('1. 当前Token是管理员账户 (admin Xie)');
            console.log('2. 管理员账户没有报名任何活动 (这是正常的)');
            console.log('3. 需要使用实际报名用户的账户来测试');
            console.log('4. 或者需要先让管理员报名活动再测试签到');
            
            console.log('\n💡 建议解决方案:');
            console.log('1. 使用普通用户账户重新测试');
            console.log('2. 或者检查普通用户是否真的完成了报名流程');
            console.log('3. 检查前端报名功能是否正确调用了后端API');
            
        } else {
            console.log('❌ 获取活动列表失败');
        }
        
    } catch (error) {
        console.log('❌ 分析过程发生错误:', error.message);
    }
}

analyzeActivities();