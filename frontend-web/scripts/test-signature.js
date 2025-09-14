#!/usr/bin/env node
// 测试签名算法
const crypto = require('crypto');

function testSignature() {
    const api_sk = 'rbxLQQr0qDBvwcbOxZt9VVPJvy3mIDVN';
    const request_time = Math.floor(Date.now() / 1000);
    
    console.log('🔐 测试宝塔API签名算法');
    console.log('API密钥:', api_sk);
    console.log('请求时间:', request_time);
    
    // 按照文档的算法生成签名
    const step1 = crypto.createHash('md5').update(api_sk).digest('hex');
    console.log('Step1 - md5(api_sk):', step1);
    
    const step2 = request_time + step1;
    console.log('Step2 - request_time + md5(api_sk):', step2);
    
    const request_token = crypto.createHash('md5').update(step2).digest('hex');
    console.log('Step3 - md5(step2):', request_token);
    
    return {
        request_time,
        request_token
    };
}

// 执行测试并生成curl命令
const { request_time, request_token } = testSignature();

console.log('\n🧪 生成的测试curl命令:');
console.log(`curl -k -X POST 'https://106.14.165.234:8888/system?action=GetSystemTotal' -d 'request_time=${request_time}&request_token=${request_token}'`);

testSignature();