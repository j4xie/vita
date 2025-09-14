#!/usr/bin/env node
// 通过API设置Git同步
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function setupGitSync() {
    try {
        console.log('🔧 通过API设置Git同步');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 1. 在项目目录创建git目录
        console.log('📁 创建Git工作目录...');
        await api.createDirectory('/www/wwwroot/project/git-repo');

        // 2. 创建Git同步脚本
        console.log('📝 创建Git同步脚本...');
        const gitSyncScript = `#!/bin/bash
# Git同步脚本
cd /www/wwwroot/project

# 如果没有git仓库，则克隆
if [ ! -d "git-repo/.git" ]; then
    echo "首次克隆仓库..."
    rm -rf git-repo
    git clone https://github.com/j4xie/vita.git git-repo
else
    echo "更新现有仓库..."
    cd git-repo
    git pull origin main
fi

# 同步构建文件到测试环境
echo "同步测试环境文件..."
cd /www/wwwroot/project
if [ -d "git-repo/frontend-web-testenv/dist" ]; then
    cp -r git-repo/frontend-web-testenv/dist/* test-h5/
    echo "测试环境同步完成"
fi

# 同步构建文件到生产环境
echo "同步生产环境文件..."
if [ -d "git-repo/frontend-web/dist" ]; then
    cp -r git-repo/frontend-web/dist/* h5/
    echo "生产环境同步完成"
fi

echo "Git同步完成！"
`;

        // 保存脚本到服务器
        const scriptPath = '/www/wwwroot/project/git-sync.sh';
        await api.request('/files?action=SaveFileBody', {
            path: scriptPath,
            data: gitSyncScript,
            encoding: 'utf-8'
        });

        console.log('✅ Git同步脚本已创建');

        // 3. 测试执行脚本
        console.log('🧪 测试执行Git同步...');
        const execResult = await api.request('/files?action=ExecShell', {
            shell: 'bash /www/wwwroot/project/git-sync.sh',
            path: '/www/wwwroot/project'
        });

        console.log('执行结果:', execResult);

        if (execResult.status === true) {
            console.log('🎉 Git同步设置成功！');
            console.log('\n📋 使用方法：');
            console.log('1. 推送代码到GitHub');
            console.log('2. 执行API命令: bash /www/wwwroot/project/git-sync.sh');
            console.log('3. 自动同步构建文件到Web目录');
        }

    } catch (error) {
        console.error('❌ 设置失败:', error.message);
    }
}

setupGitSync();