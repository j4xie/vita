#!/usr/bin/env node
// 分块上传大文件
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const path = require('path');
const fs = require('fs');

async function chunkedUpload() {
    try {
        console.log('🔗 分块上传大文件 - 测试环境');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        const jsFilePath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/_expo/static/js/web/index-1bd749f3627d57fe7e9b5ad323ffb0dd.js';
        const targetDir = '/www/wwwroot/project/test-h5/_expo/static/js/web';
        const fileName = path.basename(jsFilePath);

        const fileStats = fs.statSync(jsFilePath);
        const fileSize = fileStats.size;
        const chunkSize = 1024 * 1024; // 1MB 分块
        const totalChunks = Math.ceil(fileSize / chunkSize);

        console.log(`文件大小: ${(fileSize/1024/1024).toFixed(2)}MB`);
        console.log(`分块数量: ${totalChunks}`);

        // 使用SaveFileBody API逐步构建文件
        let uploadedContent = '';

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileSize);
            const chunk = fs.readFileSync(jsFilePath, {
                encoding: 'utf8',
                start: start,
                end: end - 1
            });

            uploadedContent += chunk;

            console.log(`上传分块 ${i + 1}/${totalChunks} (${((end/fileSize)*100).toFixed(1)}%)`);

            try {
                // 每次都上传累积的内容
                await api.request('/files?action=SaveFileBody', {
                    path: `${targetDir}/${fileName}`,
                    data: uploadedContent,
                    encoding: 'utf-8'
                });

                console.log(`✅ 分块 ${i + 1} 上传成功`);

            } catch (error) {
                // 如果是"文件不存在"错误，继续尝试
                if (error.message.includes('指定文件不存在')) {
                    console.log(`⚠️ 分块 ${i + 1}: 文件不存在，继续...`);
                } else {
                    throw error;
                }
            }
        }

        console.log('🎉 分块上传完成！');

    } catch (error) {
        console.error('❌ 分块上传失败:', error.message);
    }
}

chunkedUpload();