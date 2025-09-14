#!/usr/bin/env node
// 检查网站配置
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function checkWebsiteConfig() {
    try {
        console.log('🌐 检查网站配置');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 1. 获取网站列表
        console.log('📋 获取网站列表...');
        const sitesResult = await api.request('/data?action=getData&table=sites', {
            limit: 50
        });

        if (sitesResult.status !== false && sitesResult.data) {
            console.log('✅ 找到网站列表');

            sitesResult.data.forEach((site, index) => {
                console.log(`${index + 1}. ${site.name} - ${site.path} (状态: ${site.status === '1' ? '运行' : '停止'})`);
            });

            // 查找与我们目录相关的网站
            const projectSite = sitesResult.data.find(site =>
                site.path && site.path.includes('/www/wwwroot/project')
            );

            if (projectSite) {
                console.log(`\n🎯 找到项目网站: ${projectSite.name}`);
                console.log(`路径: ${projectSite.path}`);
                console.log(`状态: ${projectSite.status === '1' ? '✅ 运行中' : '❌ 已停止'}`);
            } else {
                console.log('\n⚠️ 未找到配置的项目网站');
                console.log('可能需要在宝塔面板中配置网站指向 /www/wwwroot/project/h5/');
            }

        } else {
            console.log('❌ 获取网站列表失败');
        }

        // 2. 检查文件权限
        console.log('\n🔒 检查h5目录权限...');
        try {
            const permResult = await api.request('/files?action=GetFileAccess', {
                filename: '/www/wwwroot/project/h5'
            });
            console.log('目录权限:', permResult);
        } catch (error) {
            console.log('权限检查失败:', error.message);
        }

        // 3. 检查index.html访问权限
        console.log('\n📄 检查index.html权限...');
        try {
            const indexPermResult = await api.request('/files?action=GetFileAccess', {
                filename: '/www/wwwroot/project/h5/index.html'
            });
            console.log('index.html权限:', indexPermResult);
        } catch (error) {
            console.log('index.html权限检查失败:', error.message);
        }

        // 4. 尝试设置正确权限
        console.log('\n🛠️ 设置正确权限...');
        try {
            const chmodResult = await api.request('/files?action=SetFileAccess', {
                filename: '/www/wwwroot/project/h5',
                user: 'www',
                access: '755'
            });
            console.log('设置目录权限结果:', chmodResult);

            const chmodIndexResult = await api.request('/files?action=SetFileAccess', {
                filename: '/www/wwwroot/project/h5/index.html',
                user: 'www',
                access: '644'
            });
            console.log('设置index.html权限结果:', chmodIndexResult);

        } catch (error) {
            console.log('设置权限失败:', error.message);
        }

    } catch (error) {
        console.error('❌ 网站配置检查失败:', error.message);
    }
}

checkWebsiteConfig();