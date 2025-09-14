#!/usr/bin/env node
// 修复域名配置
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function fixDomainConfig() {
    try {
        console.log('🔧 修复生产环境域名配置');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 找到生产环境网站ID
        const sitesResult = await api.request('/data?action=getData&table=sites', {
            limit: 50
        });

        const h5Site = sitesResult.data.find(site =>
            site.path && site.path.includes('/www/wwwroot/project/h5')
        );

        if (h5Site) {
            console.log(`找到生产环境网站: ${h5Site.name} (ID: ${h5Site.id})`);

            // 尝试添加标准80端口的域名
            console.log('🌐 添加标准端口域名...');

            try {
                const addDomainResult = await api.request('/site?action=AddDomain', {
                    id: h5Site.id,
                    webname: h5Site.name,
                    domain: 'web.vitaglobal.icu:80'
                });

                console.log('添加80端口域名结果:', addDomainResult);

                if (addDomainResult.status === true) {
                    console.log('✅ 现在可以通过 http://web.vitaglobal.icu 访问');
                }

            } catch (error) {
                console.log('添加域名失败:', error.message);
            }

            // 尝试添加HTTPS 443端口
            try {
                const addHTTPSResult = await api.request('/site?action=AddDomain', {
                    id: h5Site.id,
                    webname: h5Site.name,
                    domain: 'web.vitaglobal.icu:443'
                });

                console.log('添加443端口域名结果:', addHTTPSResult);

                if (addHTTPSResult.status === true) {
                    console.log('✅ 现在可以通过 https://web.vitaglobal.icu 访问');
                }

            } catch (error) {
                console.log('添加HTTPS域名失败:', error.message);
            }

        } else {
            console.log('❌ 未找到生产环境网站');
        }

        console.log('\n🎯 当前可用的访问地址:');
        console.log('测试环境: http://106.14.165.234:8086');
        console.log('生产环境: https://web.vitaglobal.icu (如果配置成功)');
        console.log('生产环境备用: http://web.vitaglobal.icu:8081');

    } catch (error) {
        console.error('❌ 修复失败:', error.message);
    }
}

fixDomainConfig();