#!/usr/bin/env node
// 测试不同的参数组合
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

async function testDifferentParams() {
    const api_sk = 'rbxLQQr0qDBvwcbOxZt9VVPJvy3mIDVN';
    const request_time = Math.floor(Date.now() / 1000);
    const step1 = crypto.createHash('md5').update(api_sk).digest('hex');
    const step2 = request_time.toString() + step1;
    const request_token = crypto.createHash('md5').update(step2).digest('hex');
    
    // 创建极简文件
    const fileName = 'a';  // 没有扩展名
    const filePath = `/tmp/${fileName}`;
    fs.writeFileSync(filePath, 'test');
    
    console.log('🧪 测试不同参数组合');
    
    const testCases = [
        {
            name: '测试1: 不传filename',
            formData: (fd) => {
                fd.append('request_time', request_time);
                fd.append('request_token', request_token);
                fd.append('path', '/www/wwwroot/project/test-h5');
                fd.append('file', fs.createReadStream(filePath));
            }
        },
        {
            name: '测试2: 使用f_name参数',
            formData: (fd) => {
                fd.append('request_time', request_time);
                fd.append('request_token', request_token);
                fd.append('path', '/www/wwwroot/project/test-h5');
                fd.append('f_name', 'a');
                fd.append('file', fs.createReadStream(filePath));
            }
        },
        {
            name: '测试3: 使用name参数',
            formData: (fd) => {
                fd.append('request_time', request_time);
                fd.append('request_token', request_token);
                fd.append('path', '/www/wwwroot/project/test-h5');
                fd.append('name', 'a');
                fd.append('file', fs.createReadStream(filePath));
            }
        }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`\n${testCase.name}:`);
            
            const formData = new FormData();
            testCase.formData(formData);
            
            const response = await axios.post('https://106.14.165.234:8888/files?action=upload', formData, {
                headers: formData.getHeaders(),
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                }),
                timeout: 15000
            });
            
            console.log('   ✅ 结果:', response.data);
            
            if (response.data.status !== false) {
                console.log('   🎉 找到工作的参数组合！');
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

testDifferentParams();