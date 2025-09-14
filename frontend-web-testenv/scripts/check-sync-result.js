#!/usr/bin/env node
// 检查Git同步结果
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function checkSyncResult() {
    try {
        console.log('🔍 检查Git同步结果');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 1. 检查git-repo目录是否创建成功
        console.log('📁 检查git-repo目录...');
        const gitRepoResult = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/git-repo'
        });

        if (gitRepoResult.status !== false) {
            console.log('✅ git-repo目录存在');
            console.log('目录内容:', gitRepoResult.DIR || []);
        } else {
            console.log('❌ git-repo目录不存在');
        }

        // 2. 检查测试环境目录
        console.log('\n📁 检查测试环境 test-h5...');
        const testResult = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/test-h5'
        });

        if (testResult.status !== false) {
            console.log('✅ test-h5目录存在');
            console.log('文件数量:', (testResult.FILES || []).length);
            console.log('目录数量:', (testResult.DIR || []).length);

            // 检查关键文件
            const files = (testResult.FILES || []).map(f => f.split(';')[0]);
            console.log('关键文件检查:');
            console.log('- index.html:', files.includes('index.html') ? '✅' : '❌');
            console.log('- favicon.ico:', files.includes('favicon.ico') ? '✅' : '❌');
        }

        // 3. 检查生产环境目录
        console.log('\n📁 检查生产环境 h5...');
        const prodResult = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/h5'
        });

        if (prodResult.status !== false) {
            console.log('✅ h5目录存在');
            console.log('文件数量:', (prodResult.FILES || []).length);
            console.log('目录数量:', (prodResult.DIR || []).length);
        }

        // 4. 检查JS bundle文件
        console.log('\n📄 检查JS Bundle文件...');
        const jsDirResult = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/test-h5/_expo/static/js/web'
        });

        if (jsDirResult.status !== false) {
            const jsFiles = (jsDirResult.FILES || []).map(f => f.split(';')[0]);
            console.log('JS文件列表:', jsFiles);

            // 检查最新的JS文件
            const hasNewJS = jsFiles.some(f => f.includes('1bd749f3627d57fe7e9b5ad323ffb0dd'));
            console.log('新JS文件 (测试环境):', hasNewJS ? '✅ 已同步' : '❌ 未找到');
        }

        console.log('\n🎯 同步状态总结:');
        console.log('- Git仓库克隆:', gitRepoResult.status !== false ? '✅' : '❌');
        console.log('- 测试环境文件:', testResult.status !== false ? '✅' : '❌');
        console.log('- 生产环境文件:', prodResult.status !== false ? '✅' : '❌');

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkSyncResult();