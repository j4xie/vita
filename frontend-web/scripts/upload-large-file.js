#!/usr/bin/env node
// 大文件上传工具 - 增加超时和重试
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const path = require('path');

// 修改BaotaAPI的超时设置
class LargeBaotaAPI extends BaotaAPI {
    constructor(config) {
        super(config);
        // 增加超时时间到5分钟
        this.client.defaults.timeout = 300000;
    }

    async uploadFileWithRetry(filePath, targetPath, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`尝试 ${attempt}/${maxRetries}: ${path.basename(filePath)}`);

                const result = await this.uploadFile(filePath, targetPath);
                console.log(`✅ 第${attempt}次尝试成功！`);
                return result;

            } catch (error) {
                lastError = error;
                console.log(`❌ 第${attempt}次尝试失败: ${error.message}`);

                if (attempt < maxRetries) {
                    console.log(`等待3秒后重试...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }

        throw lastError;
    }
}

async function uploadLargeFile() {
    try {
        console.log('🚀 大文件上传工具 - 生产环境');

        const config = new BaotaConfig();
        const api = new LargeBaotaAPI(config);

        const jsFilePath = '/Users/jietaoxie/pomeloX/frontend-web/dist/_expo/static/js/web/index-d1cc01bc9572c0dae48246e8693480fc.js';
        const targetDir = '/www/wwwroot/project/h5/_expo/static/js/web';

        console.log('文件大小:', (require('fs').statSync(jsFilePath).size / 1024 / 1024).toFixed(2) + 'MB');

        await api.uploadFileWithRetry(jsFilePath, targetDir, 3);

        console.log('🎉 大文件上传成功！');

    } catch (error) {
        console.error('💥 最终上传失败:', error.message);
        console.log('\n💡 建议尝试手动上传或使用其他方式');
    }
}

uploadLargeFile();