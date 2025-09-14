#!/usr/bin/env node
// 直接写入文件内容
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const path = require('path');
const fs = require('fs');

async function directWrite() {
    try {
        console.log('📝 直接写入文件内容 - 测试环境');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        const jsFilePath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/_expo/static/js/web/index-1bd749f3627d57fe7e9b5ad323ffb0dd.js';
        const targetPath = '/www/wwwroot/project/test-h5/_expo/static/js/web/index-1bd749f3627d57fe7e9b5ad323ffb0dd.js';

        console.log('读取文件内容...');
        const fileContent = fs.readFileSync(jsFilePath, 'utf8');

        console.log(`文件大小: ${(fileContent.length/1024/1024).toFixed(2)}MB`);
        console.log('正在直接写入文件...');

        // 使用SaveFileBody直接写入整个文件
        const result = await api.request('/files?action=SaveFileBody', {
            path: targetPath,
            data: fileContent,
            encoding: 'utf-8'
        });

        if (result.status === false) {
            throw new Error(`写入失败: ${result.msg}`);
        }

        console.log('✅ 直接写入成功！');
        console.log('结果:', result);

    } catch (error) {
        console.error('❌ 直接写入失败:', error.message);
        if (error.response && error.response.data) {
            console.error('服务器响应:', error.response.data);
        }
    }
}

directWrite();