#!/usr/bin/env node
// 测试基本API连接
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function testBasicAPI() {
    try {
        console.log('🧪 测试宝塔面板基本API连接');
        
        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        
        // 测试最简单的API调用 - 获取系统状态
        console.log('正在测试系统状态API...');
        const result = await api.request('/system?action=GetSystemTotal');
        
        console.log('✅ API连接成功！');
        console.log('系统信息:', {
            system: result.system,
            version: result.version,
            cpuNum: result.cpuNum
        });
        
    } catch (error) {
        console.error('❌ API连接失败:', error.message);
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

testBasicAPI();