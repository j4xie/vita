#!/usr/bin/env node
// 重新设置Git仓库
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function setupGitFresh() {
    try {
        console.log('🔄 重新设置Git仓库');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 1. 删除旧的git-repo目录
        console.log('🗑️ 清理旧的git-repo...');
        await api.request('/files?action=DeleteFile', {
            path: '/www/wwwroot/project/git-repo'
        });

        // 2. 重新克隆仓库
        console.log('📥 重新克隆GitHub仓库...');
        const cloneResult = await api.request('/files?action=ExecShell', {
            shell: 'cd /www/wwwroot/project && git clone https://github.com/j4xie/vita.git git-repo',
            path: '/www/wwwroot/project'
        });

        console.log('克隆结果:', cloneResult);

        // 3. 等待一下让克隆完成
        console.log('⏱️ 等待克隆完成...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 4. 检查克隆结果
        console.log('🔍 检查克隆结果...');
        const checkResult = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/git-repo'
        });

        if (checkResult.status !== false) {
            const dirs = (checkResult.DIR || []).map(d => d.split(';')[0]);
            console.log('克隆的目录:', dirs);
            console.log('- .git目录:', dirs.includes('.git') ? '✅ Git仓库正常' : '❌ Git仓库失败');
            console.log('- frontend-web:', dirs.includes('frontend-web') ? '✅' : '❌');
            console.log('- frontend-web-testenv:', dirs.includes('frontend-web-testenv') ? '✅' : '❌');
        }

        // 5. 如果克隆成功，直接复制dist文件
        if (checkResult.status !== false) {
            console.log('📂 复制构建文件...');

            // 复制已有的dist文件到目标目录
            const copyResult = await api.request('/files?action=ExecShell', {
                shell: `cd /www/wwwroot/project &&
                       if [ -d "git-repo/frontend-web/dist" ]; then
                           cp -r git-repo/frontend-web/dist/* h5/;
                           echo "生产环境同步完成";
                       fi &&
                       if [ -d "git-repo/frontend-web-testenv/dist" ]; then
                           cp -r git-repo/frontend-web-testenv/dist/* test-h5/;
                           echo "测试环境同步完成";
                       fi`,
                path: '/www/wwwroot/project'
            });

            console.log('复制结果:', copyResult);
        }

        console.log('✅ Git仓库重新设置完成！');

    } catch (error) {
        console.error('❌ 设置失败:', error.message);
    }
}

setupGitFresh();