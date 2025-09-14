#!/usr/bin/env node
// 同步最新构建文件
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function syncLatest() {
    try {
        console.log('🚀 同步最新构建文件');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 1. 同步生产环境
        console.log('🏭 同步生产环境...');
        const prodIndexPath = '/Users/jietaoxie/pomeloX/frontend-web/dist/index.html';
        const prodJSPath = '/Users/jietaoxie/pomeloX/frontend-web/dist/_expo/static/js/web/index-feb84fe8a97c3bfe8682c1f0de09e0ad.js';

        if (fs.existsSync(prodIndexPath)) {
            const indexContent = fs.readFileSync(prodIndexPath, 'utf8');
            await api.request('/files?action=SaveFileBody', {
                path: '/www/wwwroot/project/h5/index.html',
                data: indexContent,
                encoding: 'utf-8'
            });
            console.log('✅ 生产环境index.html已更新');
        }

        if (fs.existsSync(prodJSPath)) {
            const jsContent = fs.readFileSync(prodJSPath, 'utf8');
            console.log(`生产环境JS文件大小: ${(jsContent.length/1024/1024).toFixed(2)}MB`);

            await api.request('/files?action=SaveFileBody', {
                path: '/www/wwwroot/project/h5/_expo/static/js/web/index-feb84fe8a97c3bfe8682c1f0de09e0ad.js',
                data: jsContent,
                encoding: 'utf-8'
            });
            console.log('✅ 生产环境JS文件已更新');
        }

        // 2. 同步测试环境
        console.log('\n🧪 同步测试环境...');
        const testIndexPath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/index.html';
        const testJSPath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/_expo/static/js/web/index-905790b35c554c19e9295b2c006f6d21.js';

        if (fs.existsSync(testIndexPath)) {
            const indexContent = fs.readFileSync(testIndexPath, 'utf8');
            await api.request('/files?action=SaveFileBody', {
                path: '/www/wwwroot/project/test-h5/index.html',
                data: indexContent,
                encoding: 'utf-8'
            });
            console.log('✅ 测试环境index.html已更新');
        }

        if (fs.existsSync(testJSPath)) {
            const jsContent = fs.readFileSync(testJSPath, 'utf8');
            console.log(`测试环境JS文件大小: ${(jsContent.length/1024/1024).toFixed(2)}MB`);

            await api.request('/files?action=SaveFileBody', {
                path: '/www/wwwroot/project/test-h5/_expo/static/js/web/index-905790b35c554c19e9295b2c006f6d21.js',
                data: jsContent,
                encoding: 'utf-8'
            });
            console.log('✅ 测试环境JS文件已更新');
        }

        console.log('\n🎉 最新构建文件同步完成！');
        console.log('📱 两个环境现在都包含您的最新改动');

    } catch (error) {
        console.error('❌ 同步失败:', error.message);
    }
}

syncLatest();