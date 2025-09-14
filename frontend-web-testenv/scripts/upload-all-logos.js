#!/usr/bin/env node
// 上传所有logo文件到正确位置
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function uploadAllLogos() {
    try {
        console.log('🖼️ 上传所有logo文件到正确位置');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        const logoMappings = [
            // 测试环境
            {
                env: '测试环境',
                localPath: '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/assets/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png',
                serverPath: '/www/wwwroot/project/test-h5/assets/assets/logos'
            },
            {
                env: '测试环境(src路径)',
                localPath: '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/assets/src/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png',
                serverPath: '/www/wwwroot/project/test-h5/assets/src/assets/logos'
            },
            // 生产环境
            {
                env: '生产环境',
                localPath: '/Users/jietaoxie/pomeloX/frontend-web/dist/assets/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png',
                serverPath: '/www/wwwroot/project/h5/assets/assets/logos'
            },
            {
                env: '生产环境(src路径)',
                localPath: '/Users/jietaoxie/pomeloX/frontend-web/dist/assets/src/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png',
                serverPath: '/www/wwwroot/project/h5/assets/src/assets/logos'
            }
        ];

        for (const mapping of logoMappings) {
            console.log(`\n📤 上传${mapping.env}logo...`);

            if (fs.existsSync(mapping.localPath)) {
                try {
                    // 确保目录存在
                    await api.createDirectory(mapping.serverPath);

                    // 上传logo文件
                    await api.uploadFile(mapping.localPath, mapping.serverPath);

                    console.log(`✅ ${mapping.env}logo上传成功`);
                    console.log(`   路径: ${mapping.serverPath}`);

                } catch (error) {
                    console.log(`❌ ${mapping.env}logo上传失败: ${error.message}`);
                }
            } else {
                console.log(`❌ 本地文件不存在: ${mapping.localPath}`);
            }
        }

        // 验证所有位置的logo
        console.log('\n🔍 验证所有logo位置...');

        const checkPaths = [
            '/www/wwwroot/project/test-h5/assets/assets/logos',
            '/www/wwwroot/project/test-h5/assets/src/assets/logos',
            '/www/wwwroot/project/h5/assets/assets/logos',
            '/www/wwwroot/project/h5/assets/src/assets/logos'
        ];

        for (const checkPath of checkPaths) {
            try {
                const result = await api.request('/files?action=GetDir', {
                    path: checkPath
                });

                if (result.status !== false) {
                    const logoFiles = (result.FILES || []).map(f => f.split(';')[0]);
                    const hasLogo = logoFiles.some(f => f.includes('pomelo-logo'));

                    console.log(`${checkPath}: ${hasLogo ? '✅ 有logo' : '❌ 无logo'}`);
                } else {
                    console.log(`${checkPath}: ❌ 目录不存在`);
                }
            } catch (error) {
                console.log(`${checkPath}: ❌ 检查失败`);
            }
        }

        console.log('\n🎉 所有logo文件上传完成！');
        console.log('现在横幅和浮动按钮的logo应该都能正常显示了');

    } catch (error) {
        console.error('❌ logo上传失败:', error.message);
    }
}

uploadAllLogos();