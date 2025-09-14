#!/usr/bin/env node
// 检查网站详细配置
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function checkSiteDetails() {
    try {
        console.log('🔍 检查网站详细配置');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 获取网站列表
        const sitesResult = await api.request('/data?action=getData&table=sites', {
            limit: 50
        });

        if (sitesResult.data) {
            const h5Site = sitesResult.data.find(site =>
                site.path && site.path.includes('/www/wwwroot/project/h5')
            );

            if (h5Site) {
                console.log('🎯 生产环境网站配置:');
                console.log(`网站名: ${h5Site.name}`);
                console.log(`网站路径: ${h5Site.path}`);
                console.log(`网站ID: ${h5Site.id}`);
                console.log(`状态: ${h5Site.status === '1' ? '✅ 运行中' : '❌ 已停止'}`);

                // 获取域名信息
                console.log('\n🌐 获取域名配置...');
                const domainResult = await api.request('/data?action=getData&table=domain', {
                    search: h5Site.id,
                    list: true
                });

                if (domainResult.status !== false) {
                    console.log('域名列表:');
                    domainResult.forEach(domain => {
                        console.log(`  - ${domain.name}:${domain.port}`);
                    });
                }

                // 检查网站是否启用
                console.log('\n🔧 检查网站状态...');
                if (h5Site.status !== '1') {
                    console.log('⚠️ 网站已停止，尝试启用...');
                    const startResult = await api.request('/site?action=SiteStart', {
                        id: h5Site.id,
                        name: h5Site.name
                    });
                    console.log('启用结果:', startResult);
                }

            } else {
                console.log('❌ 未找到h5网站配置');
            }

            // 同样检查测试环境
            const testSite = sitesResult.data.find(site =>
                site.path && site.path.includes('/www/wwwroot/project/test-h5')
            );

            if (testSite) {
                console.log('\n🧪 测试环境网站配置:');
                console.log(`网站名: ${testSite.name}`);
                console.log(`状态: ${testSite.status === '1' ? '✅ 运行中' : '❌ 已停止'}`);
            }
        }

        console.log('\n💡 访问建议:');
        console.log('如果配置了域名，请通过域名访问');
        console.log('如果是IP访问，可能需要特定端口');
        console.log('检查宝塔面板网站配置中的访问地址');

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkSiteDetails();