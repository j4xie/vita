#!/usr/bin/env node
// 检查服务器Git仓库状态
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function checkGitRepo() {
    try {
        console.log('🔍 检查服务器Git仓库状态');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        // 1. 检查git-repo目录内容
        console.log('📁 检查git-repo目录...');
        const gitRepoResult = await api.request('/files?action=GetDir', {
            path: '/www/wwwroot/project/git-repo'
        });

        if (gitRepoResult.status !== false) {
            console.log('✅ git-repo目录存在');
            console.log('子目录:');
            (gitRepoResult.DIR || []).forEach(dir => {
                console.log(`  + ${dir.split(';')[0]}/`);
            });

            // 检查是否有frontend-web目录
            const dirs = (gitRepoResult.DIR || []).map(d => d.split(';')[0]);
            console.log('关键目录检查:');
            console.log('- frontend-web:', dirs.includes('frontend-web') ? '✅' : '❌');
            console.log('- frontend-web-testenv:', dirs.includes('frontend-web-testenv') ? '✅' : '❌');
            console.log('- .git:', dirs.includes('.git') ? '✅' : '❌');

        } else {
            console.log('❌ git-repo目录不存在或为空');
        }

        // 2. 检查Git仓库是否有最新代码
        if (gitRepoResult.status !== false) {
            console.log('\n📦 检查frontend-web-testenv目录...');
            const testenvResult = await api.request('/files?action=GetDir', {
                path: '/www/wwwroot/project/git-repo/frontend-web-testenv'
            });

            if (testenvResult.status !== false) {
                console.log('✅ frontend-web-testenv存在');

                // 检查是否有src目录
                const testenvDirs = (testenvResult.DIR || []).map(d => d.split(';')[0]);
                console.log('- src目录:', testenvDirs.includes('src') ? '✅' : '❌');
                console.log('- scripts目录:', testenvDirs.includes('scripts') ? '✅' : '❌');
                console.log('- package.json:', (testenvResult.FILES || []).some(f => f.includes('package.json')) ? '✅' : '❌');

            } else {
                console.log('❌ frontend-web-testenv不存在');
            }
        }

        // 3. 检查构建是否完成
        console.log('\n🏗️ 检查服务器端构建结果...');
        try {
            const buildDirResult = await api.request('/files?action=GetDir', {
                path: '/www/wwwroot/project/git-repo/frontend-web/dist'
            });

            if (buildDirResult.status !== false) {
                console.log('✅ 生产环境构建目录存在');
                const buildFiles = (buildDirResult.FILES || []).map(f => f.split(';')[0]);
                console.log('构建文件:', buildFiles);
            } else {
                console.log('❌ 生产环境构建目录不存在');
            }
        } catch (error) {
            console.log('构建检查失败:', error.message);
        }

        // 4. 强制重新拉取代码
        console.log('\n🔄 强制重新拉取最新代码...');
        const pullResult = await api.request('/files?action=ExecShell', {
            shell: 'cd /www/wwwroot/project/git-repo && git pull origin main --force',
            path: '/www/wwwroot/project'
        });

        console.log('Git pull结果:', pullResult);

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkGitRepo();