#!/usr/bin/env node
// 检查logo文件上传情况
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function checkLogoFiles() {
    try {
        console.log('🖼️ 检查logo文件上传情况');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 检查两个环境的logo目录
        const environments = [
            { name: '测试环境', path: '/www/wwwroot/project/test-h5' },
            { name: '生产环境', path: '/www/wwwroot/project/h5' }
        ];

        for (const env of environments) {
            console.log(`\n🔍 检查${env.name}的logo文件...`);

            // 检查assets/logos目录
            try {
                const logosDirResult = await api.request('/files?action=GetDir', {
                    path: `${env.path}/assets/assets/logos`
                });

                if (logosDirResult.status !== false) {
                    const logoFiles = (logosDirResult.FILES || []).map(f => f.split(';')[0]);
                    console.log(`✅ logos目录存在，文件数: ${logoFiles.length}`);
                    logoFiles.forEach(file => {
                        console.log(`  - ${file}`);
                    });

                    // 检查特定的pomelo-logo文件
                    const pomeloLogo = logoFiles.find(f => f.includes('pomelo-logo'));
                    console.log(`pomelo-logo: ${pomeloLogo ? '✅ 存在' : '❌ 缺失'}`);

                } else {
                    console.log('❌ logos目录不存在');
                }

            } catch (error) {
                console.log(`logos目录检查失败: ${error.message}`);
            }

            // 检查src/assets目录（可能的另一个位置）
            try {
                const srcLogoResult = await api.request('/files?action=GetDir', {
                    path: `${env.path}/assets/src/assets/logos`
                });

                if (srcLogoResult.status !== false) {
                    const srcLogoFiles = (srcLogoResult.FILES || []).map(f => f.split(';')[0]);
                    console.log(`✅ src/assets/logos目录存在，文件数: ${srcLogoFiles.length}`);
                    srcLogoFiles.forEach(file => {
                        console.log(`  - ${file}`);
                    });
                }

            } catch (error) {
                console.log(`src/assets目录检查: ${error.message}`);
            }
        }

        // 检查本地logo文件并上传缺失的
        console.log('\n📤 上传缺失的logo文件...');

        const localLogos = [
            '/Users/jietaoxie/pomeloX/frontend-web/dist/assets/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png',
            '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/assets/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png'
        ];

        for (let i = 0; i < localLogos.length; i++) {
            const logoPath = localLogos[i];
            const isTestEnv = logoPath.includes('testenv');
            const targetDir = isTestEnv ?
                '/www/wwwroot/project/test-h5/assets/assets/logos' :
                '/www/wwwroot/project/h5/assets/assets/logos';

            console.log(`\n上传${isTestEnv ? '测试' : '生产'}环境logo...`);

            if (require('fs').existsSync(logoPath)) {
                try {
                    await api.uploadFile(logoPath, targetDir);
                    console.log(`✅ ${isTestEnv ? '测试' : '生产'}环境logo上传成功`);
                } catch (error) {
                    console.log(`❌ logo上传失败: ${error.message}`);
                }
            } else {
                console.log(`❌ 本地logo文件不存在: ${logoPath}`);
            }
        }

        console.log('\n🎉 logo文件检查和上传完成！');

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkLogoFiles();