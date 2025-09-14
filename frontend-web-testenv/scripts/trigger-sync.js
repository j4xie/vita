#!/usr/bin/env node
// 触发服务器Git同步
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function triggerSync() {
    try {
        console.log('🔄 触发服务器Git同步');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 执行Git同步脚本
        const result = await api.request('/files?action=ExecShell', {
            shell: 'bash /www/wwwroot/project/git-sync.sh',
            path: '/www/wwwroot/project'
        });

        console.log('同步触发结果:', result);

        if (result.status === true) {
            console.log('✅ Git同步已触发！');
            console.log('📋 同步内容：');
            console.log('- 从GitHub拉取最新代码');
            console.log('- 同步测试环境到 test-h5/');
            console.log('- 同步生产环境到 h5/');
            console.log('\n⏱️ 请等待1-2分钟让同步完成');
        }

    } catch (error) {
        console.error('❌ 同步触发失败:', error.message);
    }
}

triggerSync();