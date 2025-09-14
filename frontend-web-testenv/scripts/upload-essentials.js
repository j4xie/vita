#!/usr/bin/env node
// 上传除大JS文件外的所有文件
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const path = require('path');
const fs = require('fs');

async function uploadEssentials() {
    try {
        console.log('📦 上传基本文件 - 跳过大JS文件');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        const distPath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist';
        const targetPath = '/www/wwwroot/project/test-h5';

        // 要上传的文件列表（跳过大JS文件）
        const filesToUpload = [
            'index.html',
            'favicon.ico',
            'metadata.json',
            '_expo/static/css/web-scroll-fix-c2bbaa67f0fe10cc6b41063a4ee57d79.css'
        ];

        console.log('上传基本文件...');
        for (const relativeFilePath of filesToUpload) {
            const fullPath = path.join(distPath, relativeFilePath);
            if (fs.existsSync(fullPath)) {
                const targetDir = path.posix.join(targetPath, path.posix.dirname(relativeFilePath));
                console.log(`上传: ${relativeFilePath}`);
                await api.uploadFile(fullPath, targetDir);
            }
        }

        console.log('\n📁 上传图片资源...');

        // 上传图片资源（通常较小）
        const assetsDir = path.join(distPath, 'assets');
        if (fs.existsSync(assetsDir)) {
            await api.uploadDirectory(assetsDir, path.posix.join(targetPath, 'assets'));
        }

        console.log('✅ 基本文件上传完成！');
        console.log('⚠️  大JS文件需要单独处理');

    } catch (error) {
        console.error('❌ 上传失败:', error.message);
    }
}

uploadEssentials();