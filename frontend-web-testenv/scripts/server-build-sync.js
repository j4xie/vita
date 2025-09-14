#!/usr/bin/env node
// 服务器端构建和同步脚本
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function serverBuildSync() {
    try {
        console.log('🏗️ 服务器端构建和同步');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 创建服务器端构建脚本
        const buildSyncScript = `#!/bin/bash
cd /www/wwwroot/project

echo "=== 拉取最新代码 ==="
if [ ! -d "git-repo/.git" ]; then
    echo "首次克隆仓库..."
    rm -rf git-repo
    git clone https://github.com/j4xie/vita.git git-repo
else
    echo "更新现有仓库..."
    cd git-repo
    git pull origin main
    cd ..
fi

echo "=== 构建测试环境 ==="
if [ -d "git-repo/frontend-web-testenv" ]; then
    cd git-repo/frontend-web-testenv

    # 检查是否有node_modules，如果没有则安装
    if [ ! -d "node_modules" ]; then
        echo "安装依赖..."
        npm ci
    fi

    echo "构建测试环境..."
    npm run web:build

    echo "同步到测试目录..."
    cd /www/wwwroot/project
    cp -r git-repo/frontend-web-testenv/dist/* test-h5/ 2>/dev/null || echo "拷贝部分文件可能失败，继续..."

    echo "测试环境同步完成"
fi

echo "=== 构建生产环境 ==="
if [ -d "git-repo/frontend-web" ]; then
    cd git-repo/frontend-web

    # 检查是否有node_modules，如果没有则安装
    if [ ! -d "node_modules" ]; then
        echo "安装依赖..."
        npm ci
    fi

    echo "构建生产环境..."
    npm run web:build

    echo "同步到生产目录..."
    cd /www/wwwroot/project
    cp -r git-repo/frontend-web/dist/* h5/ 2>/dev/null || echo "拷贝部分文件可能失败，继续..."

    echo "生产环境同步完成"
fi

echo "=== 构建同步完成 ==="
`;

        console.log('💾 保存服务器端构建脚本...');
        await api.request('/files?action=SaveFileBody', {
            path: '/www/wwwroot/project/build-sync.sh',
            data: buildSyncScript,
            encoding: 'utf-8'
        });

        console.log('🚀 执行服务器端构建...');
        const result = await api.request('/files?action=ExecShell', {
            shell: 'bash /www/wwwroot/project/build-sync.sh',
            path: '/www/wwwroot/project'
        });

        console.log('执行结果:', result);

        if (result.status === true) {
            console.log('✅ 服务器端构建已启动！');
            console.log('⏱️ 请等待3-5分钟完成构建和同步');
        }

    } catch (error) {
        console.error('❌ 服务器端构建失败:', error.message);
    }
}

serverBuildSync();