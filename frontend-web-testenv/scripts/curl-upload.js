#!/usr/bin/env node
// 使用curl上传大文件
const { execSync } = require('child_process');
const BaotaConfig = require('./baota-config');
const fs = require('fs');
const crypto = require('crypto');

async function curlUpload() {
    try {
        console.log('🌐 使用curl上传大文件');

        const config = new BaotaConfig();
        const signature = config.generateSignature();

        const testJSPath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/_expo/static/js/web/index-f57af0ade29cda0cab8f14d5805451bf.js';
        const fileName = 'index-f57af0ade29cda0cab8f14d5805451bf.js';

        console.log(`文件: ${fileName}`);
        console.log(`大小: ${(fs.statSync(testJSPath).size/1024/1024).toFixed(2)}MB`);

        // 构建curl命令 - 上传到测试环境
        const curlCommand = `curl -k -X POST \\
            "https://106.14.165.234:8888/files?action=upload" \\
            -F "request_time=${signature.request_time}" \\
            -F "request_token=${signature.request_token}" \\
            -F "f_path=/www/wwwroot/project/test-h5/_expo/static/js/web" \\
            -F "f_name=${fileName}" \\
            -F "f_size=$(stat -f%z '${testJSPath}')" \\
            -F "f_start=0" \\
            -F "blob=@${testJSPath}"`;

        console.log('\n🚀 执行curl上传...');
        console.log('命令预览:', curlCommand.substring(0, 100) + '...');

        try {
            const result = execSync(curlCommand, {
                encoding: 'utf8',
                timeout: 300000 // 5分钟超时
            });

            console.log('✅ curl上传结果:', result);

            // 验证上传结果
            const config2 = new BaotaConfig();
            const BaotaAPI = require('./baota-api');
            const api = new BaotaAPI(config2);

            const verifyResult = await api.request('/files?action=GetDir', {
                path: '/www/wwwroot/project/test-h5/_expo/static/js/web'
            });

            const files = (verifyResult.FILES || []).map(f => f.split(';')[0]);
            const uploaded = files.includes(fileName);

            console.log('文件验证:', uploaded ? '✅ 上传成功' : '❌ 上传失败');

            if (uploaded) {
                console.log('🎉 大文件curl上传成功！h5现在应该可以访问了');
            }

        } catch (error) {
            console.error('❌ curl上传失败:', error.message);
        }

    } catch (error) {
        console.error('❌ curl上传脚本失败:', error.message);
    }
}

curlUpload();