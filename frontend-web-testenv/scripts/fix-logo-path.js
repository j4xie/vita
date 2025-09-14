#!/usr/bin/env node
// 修复logo路径问题
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function fixLogoPath() {
    try {
        console.log('🔧 修复logo路径问题');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 根据JS文件中的引用，正确路径应该是 /assets/assets/logos/
        const environments = [
            {
                name: '测试环境',
                basePath: '/www/wwwroot/project/test-h5',
                localLogoPath: '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/assets/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png'
            },
            {
                name: '生产环境',
                basePath: '/www/wwwroot/project/h5',
                localLogoPath: '/Users/jietaoxie/pomeloX/frontend-web/dist/assets/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png'
            }
        ];

        for (const env of environments) {
            console.log(`\n🔧 修复${env.name}logo路径...`);

            // 1. 检查当前logo位置
            console.log('📍 检查当前logo位置...');

            // 检查错误位置
            try {
                const wrongPathResult = await api.request('/files?action=GetDir', {
                    path: `${env.basePath}/assets/src/assets/logos`
                });

                if (wrongPathResult.status !== false) {
                    console.log('⚠️ 发现错误位置的logo文件');
                }
            } catch (error) {
                console.log('错误位置检查:', error.message);
            }

            // 检查正确位置
            try {
                const correctPathResult = await api.request('/files?action=GetDir', {
                    path: `${env.basePath}/assets/assets/logos`
                });

                if (correctPathResult.status !== false) {
                    const logoFiles = (correctPathResult.FILES || []).map(f => f.split(';')[0]);
                    const hasCorrectLogo = logoFiles.some(f => f.includes('pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png'));

                    console.log(`✅ 正确位置logo: ${hasCorrectLogo ? '存在' : '缺失'}`);

                    if (!hasCorrectLogo && fs.existsSync(env.localLogoPath)) {
                        console.log('📤 上传logo到正确位置...');
                        await api.uploadFile(env.localLogoPath, `${env.basePath}/assets/assets/logos`);
                        console.log('✅ logo上传到正确位置成功');
                    }

                } else {
                    console.log('❌ 正确位置目录不存在，创建并上传...');

                    // 创建目录并上传
                    await api.createDirectory(`${env.basePath}/assets/assets/logos`);

                    if (fs.existsSync(env.localLogoPath)) {
                        await api.uploadFile(env.localLogoPath, `${env.basePath}/assets/assets/logos`);
                        console.log('✅ 创建目录并上传logo成功');
                    }
                }

            } catch (error) {
                console.log('正确位置检查失败:', error.message);
            }

            console.log(`📱 ${env.name}logo路径修复完成`);
        }

        console.log('\n🎉 logo路径修复完成！');
        console.log('📋 logo现在应该在正确的路径：');
        console.log('- /assets/assets/logos/pomelo-logo.3d6653e45ce7856f621e9b0a3e5ea240.png');

    } catch (error) {
        console.error('❌ 修复失败:', error.message);
    }
}

fixLogoPath();