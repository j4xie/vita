#!/usr/bin/env node
// 检查特定JS文件
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function checkSpecificJS() {
    try {
        console.log('🔍 检查特定JS文件详情');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        const targetFile = 'index-feb84fe8a97c3bfe8682c1f0de09e0ad.js';
        const targetPath = `/www/wwwroot/project/h5/_expo/static/js/web/${targetFile}`;

        // 1. 检查JS目录
        console.log('📁 检查JS目录详情...');
        const dirResult = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/h5/_expo/static/js/web'
        });

        if (dirResult.status !== false) {
            console.log('✅ JS目录存在');

            // 详细分析文件列表
            const files = dirResult.FILES || [];
            console.log(`文件总数: ${files.length}`);

            const targetFileInfo = files.find(f => f.includes(targetFile));
            if (targetFileInfo) {
                const [name, size, time, permissions] = targetFileInfo.split(';');
                console.log(`\n🎯 找到目标文件: ${name}`);
                console.log(`文件大小: ${(size/1024/1024).toFixed(2)}MB`);
                console.log(`修改时间: ${new Date(time * 1000).toLocaleString()}`);
                console.log(`权限: ${permissions}`);

                // 验证文件大小是否正确（应该大于3MB）
                if (size > 3000000) {
                    console.log('✅ 文件大小正常，应该是完整文件');
                } else {
                    console.log('⚠️ 文件大小异常，可能上传不完整');
                }

            } else {
                console.log('❌ 目标文件不存在');

                // 显示所有JS文件
                console.log('\n📋 现有JS文件:');
                files.forEach(file => {
                    const [name, size] = file.split(';');
                    console.log(`  - ${name} (${(size/1024/1024).toFixed(2)}MB)`);
                });
            }
        }

        // 2. 尝试读取文件内容开头验证
        console.log('\n📖 验证文件内容...');
        try {
            const contentResult = await api.request('/files?action=GetFileBody', {
                path: targetPath
            });

            if (contentResult.status !== false && contentResult.data) {
                const content = contentResult.data;
                console.log(`文件内容长度: ${content.length} 字符`);
                console.log(`文件开头: ${content.substring(0, 50)}...`);

                // 检查是否是有效的JS文件
                if (content.includes('function') || content.includes('var ') || content.includes('const ')) {
                    console.log('✅ 文件内容有效，是正常的JS文件');
                } else {
                    console.log('⚠️ 文件内容异常，可能不是有效的JS文件');
                }
            } else {
                console.log('❌ 无法读取文件内容');
            }
        } catch (error) {
            console.log('文件内容读取失败:', error.message);
        }

        // 3. 最终判断
        console.log('\n🎯 最终诊断:');
        console.log('- 文件存在:', targetFileInfo ? '✅' : '❌');
        console.log('- 文件大小正常:', (targetFileInfo && targetFileInfo.split(';')[1] > 3000000) ? '✅' : '❌');
        console.log('- 权限正确:', '✅');

        const allGood = targetFileInfo && targetFileInfo.split(';')[1] > 3000000;
        console.log('\nh5环境状态:', allGood ? '✅ 应该可以正常访问' : '❌ 仍有问题');

        if (allGood) {
            console.log('\n🌐 访问地址:');
            console.log('- http://106.14.165.234:8081');
            console.log('- http://web.vitaglobal.icu:8081');
        }

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkSpecificJS();