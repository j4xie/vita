#!/usr/bin/env node
// 测试简单文件上传
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function testSimpleUpload() {
    try {
        console.log('🧪 测试简单文件上传');
        
        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        
        // 测试上传 index.html（文件名简单）
        const filePath = '/Users/jietaoxie/pomeloX/frontend-web/dist/index.html';
        const targetPath = '/www/wwwroot/project/test-h5';
        
        console.log(`正在上传: ${filePath} -> ${targetPath}`);
        
        // 确保目标目录存在
        await api.createDirectory(targetPath);
        
        // 上传文件
        await api.uploadFile(filePath, targetPath);
        
        console.log('✅ 简单文件上传成功！');
        
    } catch (error) {
        console.error('❌ 上传失败:', error.message);
        if (error.response && error.response.data) {
            console.error('服务器响应:', error.response.data);
        }
    }
}

testSimpleUpload();