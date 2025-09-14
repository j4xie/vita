#!/usr/bin/env node
// 直接调试上传API
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

async function debugUploadRaw() {
    const api_sk = 'rbxLQQr0qDBvwcbOxZt9VVPJvy3mIDVN';
    const request_time = Math.floor(Date.now() / 1000);
    const step1 = crypto.createHash('md5').update(api_sk).digest('hex');
    const step2 = request_time.toString() + step1;
    const request_token = crypto.createHash('md5').update(step2).digest('hex');
    
    console.log('🔧 调试文件上传API');
    console.log('时间戳:', request_time);
    console.log('签名:', request_token);
    
    // 创建最简单的文件
    const simpleFileName = 'a.txt';
    const simpleFilePath = `/tmp/${simpleFileName}`;
    fs.writeFileSync(simpleFilePath, 'hello');
    
    try {
        const formData = new FormData();
        formData.append('request_time', request_time);
        formData.append('request_token', request_token);
        formData.append('path', '/www/wwwroot/project/test-h5');
        formData.append('file', fs.createReadStream(simpleFilePath), {
            filename: simpleFileName,
            contentType: 'text/plain'
        });
        
        console.log('正在发送上传请求...');
        
        const response = await axios.post('https://106.14.165.234:8888/files?action=upload', formData, {
            headers: formData.getHeaders(),
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            timeout: 30000
        });
        
        console.log('✅ 上传成功!');
        console.log('响应:', response.data);
        
    } catch (error) {
        console.error('❌ 上传失败:', error.message);
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('响应:', error.response.data);
        }
    }
    
    // 清理测试文件
    if (fs.existsSync(simpleFilePath)) {
        fs.unlinkSync(simpleFilePath);
    }
}

debugUploadRaw();