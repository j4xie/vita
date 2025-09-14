#!/usr/bin/env node
// 测试各种可能的文件上传API
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function testFileAPIs() {
    try {
        console.log('🧪 测试各种文件API接口');
        
        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        
        // 创建一个简单的测试文件
        const testContent = '<h1>Hello PomeloX Test</h1>';
        const testPath = '/www/wwwroot/project/test-h5/test.html';
        
        console.log('\n1. 测试 SaveFileBody 创建新文件...');
        try {
            const result = await api.request('/files?action=SaveFileBody', {
                path: testPath,
                data: testContent,
                encoding: 'utf-8'
            });
            console.log('   结果:', result);
        } catch (error) {
            console.log('   失败:', error.message);
        }
        
        console.log('\n2. 测试文件管理相关API...');
        
        // 尝试获取目录列表
        try {
            console.log('   测试获取目录列表...');
            const dirResult = await api.request('/files?action=GetDir', {
                path: '/www/wwwroot/project'
            });
            console.log('   目录列表成功:', dirResult.status !== false);
        } catch (error) {
            console.log('   目录列表失败:', error.message);
        }
        
        // 尝试创建目录
        try {
            console.log('   测试创建目录...');
            const mkdirResult = await api.request('/files?action=CreateDir', {
                path: '/www/wwwroot/project/test-api-upload'
            });
            console.log('   创建目录结果:', mkdirResult);
        } catch (error) {
            console.log('   创建目录失败:', error.message);
        }
        
        console.log('\n3. 测试可能的文件上传接口...');
        
        // 常见的上传接口名称
        const uploadEndpoints = [
            '/files?action=UploadFile',
            '/files?action=upload',
            '/files?action=Upload', 
            '/ajax?action=upload',
            '/ajax?action=UploadFile'
        ];
        
        for (const endpoint of uploadEndpoints) {
            try {
                console.log(`   尝试: ${endpoint}`);
                // 只发送基本参数测试接口是否存在
                const result = await api.request(endpoint, {
                    path: '/www/wwwroot/project/test-h5'
                });
                console.log(`   ✅ ${endpoint} 接口存在:`, result);
                break; // 如果找到了，就停止
            } catch (error) {
                console.log(`   ❌ ${endpoint}:`, error.response?.data?.msg || error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testFileAPIs();