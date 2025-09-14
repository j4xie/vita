#!/usr/bin/env node
// 测试简单路径上传
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

async function testSimplePath() {
    const api_sk = 'rbxLQQr0qDBvwcbOxZt9VVPJvy3mIDVN';
    const request_time = Math.floor(Date.now() / 1000);
    const step1 = crypto.createHash('md5').update(api_sk).digest('hex');
    const step2 = request_time.toString() + step1;
    const request_token = crypto.createHash('md5').update(step2).digest('hex');
    
    // 创建极简文件
    const fileName = 'a';
    const filePath = `/tmp/${fileName}`;
    fs.writeFileSync(filePath, 'test');
    
    console.log('🧪 测试不同目标路径');
    
    const testPaths = [
        '/tmp',
        '/www',
        '/www/wwwroot', 
        '/root'
    ];
    
    for (const targetPath of testPaths) {
        try {
            console.log(`\n测试路径: ${targetPath}`);
            
            const formData = new FormData();
            formData.append('request_time', request_time);
            formData.append('request_token', request_token);
            formData.append('path', targetPath);
            formData.append('file', fs.createReadStream(filePath), {
                filename: fileName
            });
            
            const response = await axios.post('https://106.14.165.234:8888/files?action=upload', formData, {
                headers: formData.getHeaders(),
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                }),
                timeout: 15000
            });
            
            console.log('   结果:', response.data);
            
            if (response.data.status !== false) {
                console.log('   🎉 成功的路径:', targetPath);
                break;
            }
            
        } catch (error) {
            console.log('   ❌ 失败:', error.response?.data?.msg || error.message);
        }
    }
    
    // 清理
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

testSimplePath();