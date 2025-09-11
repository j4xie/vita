const https = require('https');

const TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiBYaWUiLCJsb2dpbl91c2VyX2tleSI6IjE3OWI3MzkyLWY3NGYtNDhjNS1iOTNhLTBkNDk1ZmQ2YTgwNyJ9.nK2PtFEQwfm43gigDJIKBAYE54irPeZc5JTqhlwFuePSxelLRI94rS153j5gV9PKVwGm2C6qPjbLP_EJe5vquA';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.vitaglobal.icu',
            port: 443,
            path: path,
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
                console.log(`\n=== API响应调试 ${path} ===`);
                console.log(`状态码: ${res.statusCode}`);
                console.log(`响应头:`, res.headers);
                console.log(`原始响应:`);
                console.log(data);
                console.log('=================\n');
                
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

async function debugAPI() {
    console.log('开始调试API响应格式...\n');
    
    // 测试用户信息API
    try {
        const userInfo = await makeRequest('/app/user/info');
        console.log('用户信息API解析结果:');
        console.log(JSON.stringify(userInfo, null, 2));
    } catch (error) {
        console.log('用户信息API调用失败:', error.message);
    }
}

debugAPI();