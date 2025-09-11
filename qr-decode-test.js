// 简单的二维码解析工具
// 由于无法直接解析图片中的二维码，我们可以手动分析可能的二维码格式

// 常见的活动签到二维码格式
const possibleQRFormats = [
    {
        name: 'JSON格式',
        example: '{"activityId": 123, "type": "signIn"}',
        description: '包含活动ID和操作类型的JSON对象'
    },
    {
        name: 'URL格式',
        example: 'https://www.vitaglobal.icu/app/activity/signIn?activityId=123&userId=456',
        description: '直接包含签到API调用的URL'
    },
    {
        name: '简单格式',
        example: 'ACTIVITY_123_SIGNIN',
        description: '简单的文本格式，包含活动ID和操作类型'
    },
    {
        name: '参数格式',
        example: 'activityId=123&type=signIn',
        description: 'URL查询参数格式'
    }
];

// 模拟解析二维码内容
function analyzeQRContent(qrData) {
    console.log('=== 二维码内容分析 ===');
    console.log('原始数据:', qrData);
    
    let analysis = {
        format: 'unknown',
        activityId: null,
        type: null,
        data: {}
    };
    
    try {
        // 尝试解析JSON格式
        if (qrData.startsWith('{') && qrData.endsWith('}')) {
            const jsonData = JSON.parse(qrData);
            analysis.format = 'JSON';
            analysis.activityId = jsonData.activityId;
            analysis.type = jsonData.type;
            analysis.data = jsonData;
        }
        // 尝试解析URL格式
        else if (qrData.startsWith('http')) {
            const url = new URL(qrData);
            analysis.format = 'URL';
            analysis.activityId = url.searchParams.get('activityId');
            analysis.type = url.pathname.includes('signIn') ? 'signIn' : 'unknown';
            
            url.searchParams.forEach((value, key) => {
                analysis.data[key] = value;
            });
        }
        // 尝试解析参数格式
        else if (qrData.includes('=') && qrData.includes('&')) {
            analysis.format = 'parameters';
            const params = new URLSearchParams(qrData);
            analysis.activityId = params.get('activityId');
            analysis.type = params.get('type');
            
            params.forEach((value, key) => {
                analysis.data[key] = value;
            });
        }
        // 简单文本格式
        else {
            analysis.format = 'text';
            analysis.data.raw = qrData;
            
            // 尝试提取活动ID
            const activityIdMatch = qrData.match(/(\d+)/);
            if (activityIdMatch) {
                analysis.activityId = activityIdMatch[1];
            }
        }
    } catch (error) {
        console.error('解析错误:', error.message);
        analysis.format = 'error';
        analysis.data.error = error.message;
    }
    
    return analysis;
}

// 测试不同格式的二维码
function testQRFormats() {
    console.log('=== 测试不同二维码格式 ===\n');
    
    possibleQRFormats.forEach(format => {
        console.log(`测试格式: ${format.name}`);
        console.log(`示例: ${format.example}`);
        console.log(`描述: ${format.description}`);
        
        const analysis = analyzeQRContent(format.example);
        console.log('解析结果:', analysis);
        console.log('---\n');
    });
}

// 根据二维码内容生成API调用
function generateAPICall(qrAnalysis, userId) {
    if (!qrAnalysis.activityId) {
        return { error: '无法从二维码中提取活动ID' };
    }
    
    return {
        endpoint: '/app/activity/signIn',
        method: 'GET',
        params: {
            activityId: qrAnalysis.activityId,
            userId: userId
        },
        headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE'
        }
    };
}

// 比较二维码活动ID与用户报名活动
function compareWithUserActivities(qrAnalysis, userActivities) {
    console.log('=== 比较二维码活动与用户报名活动 ===');
    
    if (!qrAnalysis.activityId) {
        console.log('❌ 二维码中没有找到活动ID');
        return false;
    }
    
    console.log(`二维码活动ID: ${qrAnalysis.activityId}`);
    
    if (!userActivities || userActivities.length === 0) {
        console.log('❌ 用户没有报名任何活动');
        return false;
    }
    
    console.log('用户已报名的活动:');
    userActivities.forEach(activity => {
        console.log(`- ${activity.activityName} (ID: ${activity.activityId})`);
    });
    
    const matchedActivity = userActivities.find(activity => 
        activity.activityId == qrAnalysis.activityId
    );
    
    if (matchedActivity) {
        console.log(`✅ 找到匹配的活动: ${matchedActivity.activityName}`);
        console.log(`签到状态: ${matchedActivity.signStatus === 1 ? '已签到' : '未签到'}`);
        return true;
    } else {
        console.log('❌ 用户未报名此活动');
        return false;
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzeQRContent,
        testQRFormats,
        generateAPICall,
        compareWithUserActivities
    };
}

// 在浏览器中使用
if (typeof window !== 'undefined') {
    window.qrAnalysis = {
        analyze: analyzeQRContent,
        test: testQRFormats,
        generateAPI: generateAPICall,
        compare: compareWithUserActivities
    };
}

// 运行测试
if (require.main === module) {
    testQRFormats();
}