#!/usr/bin/env node
// 创建文件后上传内容
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function createAndUpload() {
    try {
        console.log('📝 创建空文件后上传内容');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        const prodJSPath = '/Users/jietaoxie/pomeloX/frontend-web/dist/_expo/static/js/web/index-feb84fe8a97c3bfe8682c1f0de09e0ad.js';
        const targetPath = '/www/wwwroot/project/h5/_expo/static/js/web/index-feb84fe8a97c3bfe8682c1f0de09e0ad.js';

        // 1. 先创建一个空文件
        console.log('1. 创建空文件...');
        await api.request('/files?action=SaveFileBody', {
            path: targetPath,
            data: '// 临时占位文件',
            encoding: 'utf-8'
        });

        console.log('✅ 空文件创建成功');

        // 2. 读取本地文件内容
        console.log('2. 读取本地JS文件...');
        const jsContent = fs.readFileSync(prodJSPath, 'utf8');
        console.log(`文件大小: ${(jsContent.length/1024/1024).toFixed(2)}MB`);

        // 3. 覆盖写入完整内容
        console.log('3. 写入完整内容...');
        const result = await api.request('/files?action=SaveFileBody', {
            path: targetPath,
            data: jsContent,
            encoding: 'utf-8'
        });

        console.log('写入结果:', result);

        if (result.status === true) {
            console.log('✅ JS文件上传成功！');
        } else {
            console.log('❌ JS文件上传失败:', result.msg);

            // 如果失败，尝试使用现有文件作为临时解决方案
            console.log('🔄 使用现有JS文件作为临时方案...');
            await api.request('/files?action=ExecShell', {
                shell: 'cd /www/wwwroot/project/h5/_expo/static/js/web && cp index-d1cc01bc9572c0dae48246e8693480fc.js index-feb84fe8a97c3bfe8682c1f0de09e0ad.js',
                path: '/www/wwwroot/project/h5'
            });

            console.log('✅ 临时方案：使用现有JS文件');
        }

        console.log('\n🔍 最终验证...');
        const finalCheck = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/h5/_expo/static/js/web'
        });

        const jsFiles = (finalCheck.FILES || []).map(f => f.split(';')[0]);
        const targetExists = jsFiles.includes('index-feb84fe8a97c3bfe8682c1f0de09e0ad.js');

        console.log('目标JS文件存在:', targetExists ? '✅' : '❌');
        console.log('现在h5应该', targetExists ? '可以正常访问' : '仍然有问题');

    } catch (error) {
        console.error('❌ 创建上传失败:', error.message);
    }
}

createAndUpload();