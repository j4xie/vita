#!/usr/bin/env node
// 上传最新构建文件
const { execSync } = require('child_process');
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function uploadLatestBuilds() {
    try {
        console.log('🚀 上传最新构建文件到两个环境');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 1. 上传测试环境
        console.log('\n🧪 上传测试环境...');

        // 上传index.html
        const testIndexPath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/index.html';
        const testIndexContent = fs.readFileSync(testIndexPath, 'utf8');

        await api.request('/files?action=SaveFileBody', {
            path: '/www/wwwroot/project/test-h5/index.html',
            data: testIndexContent,
            encoding: 'utf-8'
        });
        console.log('✅ 测试环境index.html更新成功');

        // 上传JS文件 (使用curl)
        const testJSFile = 'index-30f1c30040e1ce967be60e631a6e2ece.js';
        const testJSPath = `/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/_expo/static/js/web/${testJSFile}`;

        if (fs.existsSync(testJSPath)) {
            console.log(`上传测试环境JS文件: ${testJSFile}`);

            const signature = config.generateSignature();
            const curlCommand = `curl -k -X POST \\
                "https://106.14.165.234:8888/files?action=upload" \\
                -F "request_time=${signature.request_time}" \\
                -F "request_token=${signature.request_token}" \\
                -F "f_path=/www/wwwroot/project/test-h5/_expo/static/js/web" \\
                -F "f_name=${testJSFile}" \\
                -F "f_size=$(stat -f%z '${testJSPath}')" \\
                -F "f_start=0" \\
                -F "blob=@${testJSPath}"`;

            const testResult = execSync(curlCommand, {
                encoding: 'utf8',
                timeout: 300000
            });

            console.log('✅ 测试环境JS上传结果:', testResult.trim());
        }

        // 2. 上传生产环境
        console.log('\n🏭 上传生产环境...');

        // 上传index.html
        const prodIndexPath = '/Users/jietaoxie/pomeloX/frontend-web/dist/index.html';
        const prodIndexContent = fs.readFileSync(prodIndexPath, 'utf8');

        await api.request('/files?action=SaveFileBody', {
            path: '/www/wwwroot/project/h5/index.html',
            data: prodIndexContent,
            encoding: 'utf-8'
        });
        console.log('✅ 生产环境index.html更新成功');

        // 上传JS文件 (使用curl)
        const prodJSFile = 'index-cc117d02693bd299fa92f95444cd3a81.js';
        const prodJSPath = `/Users/jietaoxie/pomeloX/frontend-web/dist/_expo/static/js/web/${prodJSFile}`;

        if (fs.existsSync(prodJSPath)) {
            console.log(`上传生产环境JS文件: ${prodJSFile}`);

            const signature2 = config.generateSignature();
            const curlCommand2 = `curl -k -X POST \\
                "https://106.14.165.234:8888/files?action=upload" \\
                -F "request_time=${signature2.request_time}" \\
                -F "request_token=${signature2.request_token}" \\
                -F "f_path=/www/wwwroot/project/h5/_expo/static/js/web" \\
                -F "f_name=${prodJSFile}" \\
                -F "f_size=$(stat -f%z '${prodJSPath}')" \\
                -F "f_start=0" \\
                -F "blob=@${prodJSPath}"`;

            const prodResult = execSync(curlCommand2, {
                encoding: 'utf8',
                timeout: 300000
            });

            console.log('✅ 生产环境JS上传结果:', prodResult.trim());
        }

        // 3. 确保logo文件上传
        console.log('\n🖼️ 确保logo文件上传...');

        // 测试环境logo
        const testLogoPath = '/Users/jietaoxie/pomeloX/frontend-web-testenv/src/assets/logos/pomelo-logo.png';
        if (fs.existsSync(testLogoPath)) {
            try {
                await api.uploadFile(testLogoPath, '/www/wwwroot/project/test-h5/assets/src/assets/logos');
                console.log('✅ 测试环境logo上传成功');
            } catch (error) {
                console.log('❌ 测试环境logo上传失败:', error.message);
            }
        }

        // 生产环境logo
        const prodLogoPath = '/Users/jietaoxie/pomeloX/frontend-web/src/assets/logos/pomelo-logo.png';
        if (fs.existsSync(prodLogoPath)) {
            try {
                await api.uploadFile(prodLogoPath, '/www/wwwroot/project/h5/assets/src/assets/logos');
                console.log('✅ 生产环境logo上传成功');
            } catch (error) {
                console.log('❌ 生产环境logo上传失败:', error.message);
            }
        }

        console.log('\n🎉 最新构建文件和logo上传完成！');
        console.log('📱 访问地址:');
        console.log('- 测试环境: http://106.14.165.234:8086');
        console.log('- 生产环境: https://web.vitaglobal.icu');

    } catch (error) {
        console.error('❌ 上传失败:', error.message);
    }
}

uploadLatestBuilds();