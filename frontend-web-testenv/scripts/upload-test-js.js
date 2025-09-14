#!/usr/bin/env node
// 上传测试环境JS文件
const { execSync } = require('child_process');
const BaotaConfig = require('./baota-config');
const fs = require('fs');

async function uploadTestJS() {
    try {
        console.log('🧪 上传测试环境JS文件');

        const config = new BaotaConfig();
        const signature = config.generateSignature();

        const testJSPath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/_expo/static/js/web/index-905790b35c554c19e9295b2c006f6d21.js';
        const fileName = 'index-905790b35c554c19e9295b2c006f6d21.js';

        console.log(`文件: ${fileName}`);
        console.log(`大小: ${(fs.statSync(testJSPath).size/1024/1024).toFixed(2)}MB`);

        const curlCommand = `curl -k -X POST \\
            "https://106.14.165.234:8888/files?action=upload" \\
            -F "request_time=${signature.request_time}" \\
            -F "request_token=${signature.request_token}" \\
            -F "f_path=/www/wwwroot/project/test-h5/_expo/static/js/web" \\
            -F "f_name=${fileName}" \\
            -F "f_size=$(stat -f%z '${testJSPath}')" \\
            -F "f_start=0" \\
            -F "blob=@${testJSPath}"`;

        console.log('🚀 执行curl上传...');

        const result = execSync(curlCommand, {
            encoding: 'utf8',
            timeout: 300000
        });

        console.log('✅ 测试环境上传结果:', result);

        console.log('🎉 测试环境JS文件上传完成！');

    } catch (error) {
        console.error('❌ 测试环境上传失败:', error.message);
    }
}

uploadTestJS();