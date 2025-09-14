#!/usr/bin/env node
// 验证JS文件完整性和logo上传
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function verifyCompleteUpload() {
    try {
        console.log('🔍 验证上传完整性');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 检查测试环境
        console.log('\n🧪 检查测试环境完整性...');
        await checkEnvironment(api, 'test', {
            jsDir: '/www/wwwroot/project/test-h5/_expo/static/js/web',
            logoDir: '/www/wwwroot/project/test-h5/assets/src/assets/logos',
            expectedJS: 'index-30f1c30040e1ce967be60e631a6e2ece.js',
            localJSPath: '/Users/jietaoxie/pomeloX/frontend-web-testenv/dist/_expo/static/js/web/index-30f1c30040e1ce967be60e631a6e2ece.js'
        });

        // 检查生产环境
        console.log('\n🏭 检查生产环境完整性...');
        await checkEnvironment(api, 'prod', {
            jsDir: '/www/wwwroot/project/h5/_expo/static/js/web',
            logoDir: '/www/wwwroot/project/h5/assets/src/assets/logos',
            expectedJS: 'index-cc117d02693bd299fa92f95444cd3a81.js',
            localJSPath: '/Users/jietaoxie/pomeloX/frontend-web/dist/_expo/static/js/web/index-cc117d02693bd299fa92f95444cd3a81.js'
        });

    } catch (error) {
        console.error('❌ 验证失败:', error.message);
    }
}

async function checkEnvironment(api, envName, config) {
    console.log(`\n📊 ${envName === 'test' ? '测试' : '生产'}环境详细检查:`);

    // 1. 检查JS文件
    console.log('📦 检查JS文件...');
    try {
        const jsResult = await api.request('/files?action=GetDir', {
            path: config.jsDir
        });

        if (jsResult.status !== false) {
            const jsFiles = jsResult.FILES || [];
            const targetFile = jsFiles.find(f => f.includes(config.expectedJS));

            if (targetFile) {
                const [name, size, time] = targetFile.split(';');
                const fileSizeMB = (size / 1024 / 1024).toFixed(2);

                console.log(`✅ JS文件存在: ${name}`);
                console.log(`📏 服务器文件大小: ${fileSizeMB}MB`);

                // 与本地文件对比
                if (fs.existsSync(config.localJSPath)) {
                    const localSize = fs.statSync(config.localJSPath).size;
                    const localSizeMB = (localSize / 1024 / 1024).toFixed(2);
                    const sizeMatch = Math.abs(size - localSize) < 1000; // 允许1KB误差

                    console.log(`📏 本地文件大小: ${localSizeMB}MB`);
                    console.log(`🔍 大小匹配: ${sizeMatch ? '✅ 完整' : '❌ 不匹配'}`);

                    if (!sizeMatch) {
                        console.log(`⚠️ 大小差异: ${Math.abs(size - localSize)} 字节`);
                    }
                } else {
                    console.log('❌ 本地文件不存在');
                }

                // 检查文件内容开头
                console.log('📖 验证文件内容...');
                try {
                    const contentResult = await api.request('/files?action=GetFileBody', {
                        path: `${config.jsDir}/${config.expectedJS}`
                    });

                    if (contentResult.status !== false && contentResult.data) {
                        const content = contentResult.data;
                        console.log(`📄 文件内容长度: ${content.length} 字符`);
                        console.log(`📝 文件开头: ${content.substring(0, 60)}...`);

                        // 检查是否是有效的JS文件
                        const isValidJS = content.includes('function') || content.includes('var ') || content.includes('const ') || content.includes('export');
                        console.log(`✅ JS文件有效性: ${isValidJS ? '有效' : '无效'}`);

                        // 检查文件完整性（结尾是否正常）
                        const hasValidEnding = content.trim().endsWith('}') || content.trim().endsWith(';') || content.trim().endsWith(')');
                        console.log(`✅ 文件完整性: ${hasValidEnding ? '完整' : '可能截断'}`);

                    } else {
                        console.log('❌ 无法读取文件内容');
                    }
                } catch (error) {
                    console.log('文件内容检查失败:', error.message);
                }

            } else {
                console.log('❌ JS文件不存在');
            }
        } else {
            console.log('❌ JS目录不存在');
        }

    } catch (error) {
        console.log('JS文件检查失败:', error.message);
    }

    // 2. 检查logo文件
    console.log('\n🖼️ 检查logo文件...');
    try {
        const logoResult = await api.request('/files?action=GetDir', {
            path: config.logoDir
        });

        if (logoResult.status !== false) {
            const logoFiles = (logoResult.FILES || []).map(f => f.split(';')[0]);
            console.log(`✅ logo目录存在，文件数: ${logoFiles.length}`);

            const pomeloLogo = logoFiles.find(f => f.includes('pomelo-logo'));
            if (pomeloLogo) {
                console.log(`✅ pomelo-logo存在: ${pomeloLogo}`);
            } else {
                console.log('❌ pomelo-logo缺失');
            }

            logoFiles.forEach(file => {
                console.log(`  📄 ${file}`);
            });

        } else {
            console.log('❌ logo目录不存在');
        }

    } catch (error) {
        console.log('logo检查失败:', error.message);
    }

    console.log(`\n📋 ${envName === 'test' ? '测试' : '生产'}环境状态总结:`);
    console.log('=' .repeat(40));
}

verifyCompleteUpload();