#!/usr/bin/env node
// 通过宝塔API检查Git环境和执行命令
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

class ServerCommandAPI extends BaotaAPI {
    // 执行服务器命令
    async executeCommand(command, workDir = '/www/wwwroot/project') {
        console.log(`🔧 执行命令: ${command}`);

        try {
            // 尝试通过文件操作API来模拟命令执行
            // 创建一个临时脚本文件然后执行
            const scriptContent = `#!/bin/bash
cd ${workDir}
${command}
echo "Command executed: ${command}"
`;

            const scriptPath = `/tmp/cmd_${Date.now()}.sh`;

            // 保存脚本到服务器
            const saveResult = await this.request('/files?action=SaveFileBody', {
                path: scriptPath,
                data: scriptContent,
                encoding: 'utf-8'
            });

            console.log('脚本保存结果:', saveResult);

            // 尝试其他可能的命令执行API
            const commandAPIs = [
                '/ajax?action=exec_shell',
                '/system?action=ExecShell',
                '/ajax?action=exec',
                '/files?action=ExecShell'
            ];

            for (const api of commandAPIs) {
                try {
                    console.log(`尝试API: ${api}`);
                    const result = await this.request(api, {
                        shell: command,
                        path: workDir
                    });
                    console.log(`${api} 结果:`, result);
                } catch (error) {
                    console.log(`${api} 失败:`, error.response?.data?.msg || error.message);
                }
            }

        } catch (error) {
            console.error('命令执行失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 检查Git是否安装
    async checkGit() {
        console.log('🔍 检查Git环境...');
        return await this.executeCommand('which git && git --version');
    }

    // 检查项目目录
    async checkProjectDir() {
        console.log('📁 检查项目目录...');

        try {
            const result = await this.request('/files?action=GetDir', {
                path: '/www/wwwroot/project'
            });

            console.log('项目目录状态:', result.status !== false ? '存在' : '不存在');
            if (result.status !== false) {
                console.log('目录内容:', result);
            }

            return result;
        } catch (error) {
            console.error('检查目录失败:', error.message);
            return null;
        }
    }
}

async function checkGitEnvironment() {
    try {
        console.log('🧪 通过API检查服务器Git环境');

        const config = new BaotaConfig();
        const api = new ServerCommandAPI(config);

        // 1. 检查项目目录
        await api.checkProjectDir();

        // 2. 检查Git环境
        await api.checkGit();

        // 3. 尝试创建测试目录
        console.log('📂 尝试创建测试目录...');
        await api.createDirectory('/www/wwwroot/project/git-test');

        console.log('✅ API测试完成');

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkGitEnvironment();