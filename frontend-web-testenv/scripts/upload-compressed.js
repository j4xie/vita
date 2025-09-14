#!/usr/bin/env node
// 压缩上传大文件
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

async function compressFile(filePath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log('正在压缩文件...');

        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // 最高压缩级别
        });

        output.on('close', () => {
            const originalSize = fs.statSync(filePath).size;
            const compressedSize = archive.pointer();
            const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

            console.log(`压缩完成: ${(originalSize/1024/1024).toFixed(2)}MB → ${(compressedSize/1024/1024).toFixed(2)}MB (节省${compressionRatio}%)`);
            resolve(outputPath);
        });

        archive.on('error', reject);

        archive.pipe(output);
        archive.file(filePath, { name: path.basename(filePath) });
        archive.finalize();
    });
}

async function uploadCompressed() {
    try {
        console.log('🗜️ 压缩上传 - 测试环境大文件');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        const jsFilePath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/_expo/static/js/web/index-1bd749f3627d57fe7e9b5ad323ffb0dd.js';
        const zipFilePath = '/tmp/testenv-bundle.zip';
        const targetDir = '/www/wwwroot/project/test-h5/_expo/static/js/web';

        // 1. 压缩文件
        await compressFile(jsFilePath, zipFilePath);

        // 2. 上传压缩文件
        console.log('正在上传压缩文件...');
        await api.uploadFile(zipFilePath, targetDir);

        // 3. 在服务器端解压
        console.log('正在解压文件...');
        await api.extractFile(`${targetDir}/testenv-bundle.zip`, targetDir);

        // 4. 删除服务器端的zip文件
        await api.deleteFile(`${targetDir}/testenv-bundle.zip`);

        // 5. 清理本地临时文件
        if (fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath);
        }

        console.log('✅ 测试环境大文件上传完成！');

    } catch (error) {
        console.error('❌ 压缩上传失败:', error.message);
    }
}

uploadCompressed();