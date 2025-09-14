#!/usr/bin/env node
// 测试最简单的文件上传
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function testSimpleFileUpload() {
    try {
        console.log('🧪 测试最简单的文件上传');
        
        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        
        // 使用最简单的文件名和路径
        const filePath = '/tmp/test.txt';
        const targetPath = '/www/wwwroot/project/test-h5';
        
        console.log(`正在上传: ${filePath} -> ${targetPath}`);
        
        const result = await api.uploadFile(filePath, targetPath);
        
        console.log('✅ 文件上传成功！');
        console.log('结果:', result);
        
    } catch (error) {
        console.error('❌ 上传失败:', error.message);
        if (error.response && error.response.data) {
            console.error('服务器响应:', error.response.data);
        }
    }
}

testSimpleFileUpload();