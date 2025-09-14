#!/usr/bin/env node
// 检查正确的访问地址配置
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function checkCorrectAddresses() {
    try {
        console.log('🔍 检查正确的访问地址配置');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 获取所有网站配置
        const sitesResult = await api.request('/data?action=getData&table=sites', {
            limit: 50
        });

        if (sitesResult.data) {
            console.log('📋 所有网站配置:');

            sitesResult.data.forEach((site, index) => {
                console.log(`${index + 1}. 网站名: ${site.name}`);
                console.log(`   路径: ${site.path}`);
                console.log(`   状态: ${site.status === '1' ? '✅ 运行' : '❌ 停止'}`);
                console.log('');
            });

            // 检查域名配置
            for (const site of sitesResult.data) {
                if (site.path && (site.path.includes('/h5') || site.path.includes('/test-h5'))) {
                    console.log(`🌐 检查网站 "${site.name}" 的域名配置:`);

                    try {
                        const domainResult = await api.request('/data?action=getData&table=domain', {
                            search: site.id,
                            list: true
                        });

                        if (domainResult && domainResult.length > 0) {
                            domainResult.forEach(domain => {
                                const isH5Prod = site.path.includes('/h5') && !site.path.includes('/test-h5');
                                const isH5Test = site.path.includes('/test-h5');

                                console.log(`  - ${domain.name}:${domain.port}`);

                                if (isH5Prod) {
                                    console.log(`    🎯 生产环境访问: http://${domain.name}${domain.port !== '80' ? ':' + domain.port : ''}`);
                                }
                                if (isH5Test) {
                                    console.log(`    🧪 测试环境访问: http://${domain.name}${domain.port !== '80' ? ':' + domain.port : ''}`);
                                }
                            });
                        } else {
                            console.log('  - 无域名配置');
                        }
                    } catch (error) {
                        console.log(`  - 域名查询失败: ${error.message}`);
                    }
                    console.log('');
                }
            }

            console.log('🎯 根据您提供的正确地址:');
            console.log('测试环境: http://106.14.165.234:8086');
            console.log('生产环境: https://web.vitaglobal.icu');
            console.log('');
            console.log('请尝试这些地址访问您的h5应用！');
        }

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkCorrectAddresses();