#!/usr/bin/env node
// 测试通过API执行Git命令
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function testGitCommands() {
    try {
        console.log('🧪 测试Git命令执行');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 测试基本命令
        const commands = [
            'ls -la',
            'pwd',
            'which git',
            'git --version'
        ];

        for (const cmd of commands) {
            try {
                console.log(`\n执行: ${cmd}`);
                const result = await api.request('/files?action=ExecShell', {
                    shell: cmd,
                    path: '/www/wwwroot/project'
                });
                console.log('结果:', result);
            } catch (error) {
                console.log('失败:', error.message);
            }
        }

        // 如果Git可用，测试克隆仓库
        console.log('\n🔗 测试Git克隆...');
        const cloneResult = await api.request('/files?action=ExecShell', {
            shell: 'git clone https://github.com/j4xie/vita.git git-repo',
            path: '/www/wwwroot/project'
        });
        console.log('克隆结果:', cloneResult);

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testGitCommands();