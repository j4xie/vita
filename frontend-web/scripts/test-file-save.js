#!/usr/bin/env node
// 测试文件保存API
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function testFileSave() {
    try {
        console.log('🧪 测试宝塔面板文件保存API');
        
        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        
        // 测试保存一个简单的HTML文件
        const params = {
            path: '/www/wwwroot/project/test-h5/test.html',
            data: '<!DOCTYPE html><html><body><h1>Hello from PomeloX!</h1></body></html>',
            encoding: 'utf-8'
        };
        
        console.log('正在保存测试文件到:', params.path);
        const result = await api.request('/files?action=SaveFileBody', params);
        
        console.log('✅ 文件保存成功！');
        console.log('结果:', result);
        
    } catch (error) {
        console.error('❌ 文件保存失败:', error.message);
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

testFileSave();