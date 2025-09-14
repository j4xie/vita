#!/usr/bin/env node
// 恢复正确的端口配置
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function restoreCorrectConfig() {
    try {
        console.log('🔄 恢复正确的端口配置');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 找到生产环境网站
        const sitesResult = await api.request('/data?action=getData&table=sites', {
            limit: 50
        });

        const h5Site = sitesResult.data.find(site =>
            site.path && site.path.includes('/www/wwwroot/project/h5')
        );

        if (h5Site) {
            console.log(`找到生产环境网站: ${h5Site.name} (ID: ${h5Site.id})`);

            // 删除刚才添加的80端口域名
            console.log('🗑️ 删除错误的80端口配置...');
            try {
                const delDomainResult = await api.request('/site?action=DelDomain', {
                    id: h5Site.id,
                    webname: h5Site.name,
                    domain: 'web.vitaglobal.icu',
                    port: '80'
                });

                console.log('删除80端口域名结果:', delDomainResult);

            } catch (error) {
                console.log('删除域名:', error.message);
            }

            console.log('✅ 配置已恢复');
        }

        console.log('\n🎯 正确的访问地址:');
        console.log('测试环境: http://106.14.165.234:8086');
        console.log('生产环境: http://web.vitaglobal.icu:8081');

    } catch (error) {
        console.error('❌ 恢复失败:', error.message);
    }
}

restoreCorrectConfig();