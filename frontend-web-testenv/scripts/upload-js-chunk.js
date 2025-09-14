#!/usr/bin/env node
// 分块上传JS文件
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function uploadJSChunk() {
    try {
        console.log('🔗 分块上传JS文件');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 生产环境JS文件
        const prodJSPath = '/Users/jietaoxie/pomeloX/frontend-web/dist/_expo/static/js/web/index-feb84fe8a97c3bfe8682c1f0de09e0ad.js';
        const targetPath = '/www/wwwroot/project/h5/_expo/static/js/web/index-feb84fe8a97c3bfe8682c1f0de09e0ad.js';

        if (!fs.existsSync(prodJSPath)) {
            console.error('❌ 本地JS文件不存在');
            return;
        }

        const jsContent = fs.readFileSync(prodJSPath, 'utf8');
        const fileSize = jsContent.length;
        const chunkSize = 500000; // 500KB分块
        const totalChunks = Math.ceil(fileSize / chunkSize);

        console.log(`文件大小: ${(fileSize/1024/1024).toFixed(2)}MB`);
        console.log(`分块数量: ${totalChunks}`);

        // 首先删除现有文件（如果存在）
        try {
            await api.request('/files?action=DeleteFile', {
                path: targetPath
            });
            console.log('删除旧文件');
        } catch (error) {
            console.log('旧文件不存在，继续...');
        }

        // 分块上传
        let uploadedContent = '';

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileSize);
            const chunk = jsContent.substring(start, end);

            uploadedContent += chunk;

            console.log(`上传分块 ${i + 1}/${totalChunks} (${((end/fileSize)*100).toFixed(1)}%)`);

            try {
                const result = await api.request('/files?action=SaveFileBody', {
                    path: targetPath,
                    data: uploadedContent,
                    encoding: 'utf-8'
                });

                if (result.status === false && result.msg.includes('指定文件不存在') && i === 0) {
                    // 第一次可能会报文件不存在，这是正常的
                    console.log(`分块 ${i + 1}: 初始创建文件`);
                } else if (result.status === true) {
                    console.log(`✅ 分块 ${i + 1} 上传成功`);
                } else {
                    console.log(`⚠️ 分块 ${i + 1}: ${result.msg}`);
                }

            } catch (error) {
                console.error(`❌ 分块 ${i + 1} 失败:`, error.message);

                // 如果超时，等待一下继续
                if (error.message.includes('timeout')) {
                    console.log('等待5秒后继续...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        console.log('🎉 分块上传完成！');

        // 验证文件是否存在
        try {
            const checkResult = await api.request('/files?action=GetFileBody', {
                path: targetPath
            });

            if (checkResult.status !== false) {
                console.log('✅ 文件验证成功，h5应该可以访问了！');
            } else {
                console.log('❌ 文件验证失败');
            }
        } catch (error) {
            console.log('文件验证:', error.message);
        }

    } catch (error) {
        console.error('❌ 分块上传失败:', error.message);
    }
}

uploadJSChunk();