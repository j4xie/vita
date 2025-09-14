#!/usr/bin/env node
// 诊断h5目录问题
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function diagnoseH5() {
    try {
        console.log('🔍 诊断h5目录问题');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 1. 检查生产环境h5目录
        console.log('📁 检查生产环境 h5 目录...');
        const h5Result = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/h5'
        });

        if (h5Result.status !== false) {
            console.log('✅ h5目录存在');
            console.log('文件列表:');
            (h5Result.FILES || []).forEach(file => {
                const [name, size] = file.split(';');
                console.log(`  - ${name} (${(size/1024).toFixed(1)}KB)`);
            });

            console.log('子目录:');
            (h5Result.DIR || []).forEach(dir => {
                console.log(`  + ${dir.split(';')[0]}/`);
            });

            // 检查关键文件
            const files = (h5Result.FILES || []).map(f => f.split(';')[0]);
            console.log('\n🔍 关键文件检查:');
            console.log('- index.html:', files.includes('index.html') ? '✅' : '❌ 缺失');
            console.log('- favicon.ico:', files.includes('favicon.ico') ? '✅' : '❌ 缺失');

        } else {
            console.log('❌ h5目录不存在');
            return;
        }

        // 2. 检查index.html内容
        console.log('\n📄 检查index.html内容...');
        try {
            const indexResult = await api.request('/files?action=GetFileBody', {
                path: '/www/wwwroot/project/h5/index.html'
            });

            if (indexResult.status !== false) {
                console.log('✅ index.html可读取');
                console.log('文件大小:', indexResult.data ? indexResult.data.length + ' 字符' : '未知');

                // 检查是否包含JS引用
                if (indexResult.data) {
                    const hasJSRef = indexResult.data.includes('_expo/static/js/web/');
                    console.log('JS文件引用:', hasJSRef ? '✅' : '❌ 缺失');

                    // 提取JS文件名
                    const jsMatch = indexResult.data.match(/index-([a-f0-9]+)\.js/);
                    if (jsMatch) {
                        console.log('引用的JS文件:', jsMatch[0]);
                    }
                }
            } else {
                console.log('❌ index.html不可读:', indexResult.msg);
            }
        } catch (error) {
            console.log('❌ 读取index.html失败:', error.message);
        }

        // 3. 检查JS目录
        console.log('\n📦 检查JS文件目录...');
        try {
            const jsResult = await api.request('/files?action=GetDir', {
                path: '/www/wwwroot/project/h5/_expo/static/js/web'
            });

            if (jsResult.status !== false) {
                const jsFiles = (jsResult.FILES || []).map(f => f.split(';')[0]);
                console.log('✅ JS目录存在');
                console.log('JS文件数量:', jsFiles.length);
                console.log('JS文件列表:');
                jsFiles.forEach(file => {
                    console.log(`  - ${file}`);
                });

                // 检查最新的JS文件
                const latestJS = jsFiles.find(f => f.includes('84e17e4694c67bd8d8e9c2a6037f3ea2'));
                console.log('最新JS文件:', latestJS ? '✅ 存在' : '❌ 缺失');

            } else {
                console.log('❌ JS目录不存在');
            }
        } catch (error) {
            console.log('❌ 检查JS目录失败:', error.message);
        }

        // 4. 检查权限
        console.log('\n🔒 检查文件权限...');
        try {
            const permResult = await api.request('/files?action=GetFileAccess', {
                filename: '/www/wwwroot/project/h5/index.html'
            });
            console.log('文件权限结果:', permResult);
        } catch (error) {
            console.log('权限检查:', error.message);
        }

    } catch (error) {
        console.error('❌ 诊断失败:', error.message);
    }
}

diagnoseH5();