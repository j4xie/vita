#!/usr/bin/env node
// Git同步部署脚本 - 生产环境
const { execSync } = require('child_process');
const path = require('path');

async function gitDeploy() {
    try {
        console.log('🚀 Git同步部署 - 生产环境');

        // 1. 构建项目
        console.log('📦 构建项目...');
        execSync('npm run web:build', { stdio: 'inherit' });

        // 2. 添加构建文件到Git
        console.log('📁 添加构建文件到Git...');
        process.chdir('/Users/jietaoxie/pomeloX');

        execSync('git add frontend-web/dist/', { stdio: 'inherit' });

        // 3. 提交构建文件
        console.log('💾 提交构建文件...');
        const timestamp = new Date().toLocaleString('zh-CN');
        execSync(`git commit -m "chore: 更新生产环境构建文件 ${timestamp}"`, { stdio: 'inherit' });

        // 4. 推送到远程仓库
        console.log('⬆️ 推送到GitHub...');
        execSync('git push origin main', { stdio: 'inherit' });

        console.log('✅ Git同步完成！');
        console.log('');
        console.log('🔗 下一步：在服务器端执行git pull');
        console.log('   cd /www/wwwroot/project');
        console.log('   git pull origin main');
        console.log('   cp frontend-web/dist/* h5/');

    } catch (error) {
        console.error('❌ Git同步失败:', error.message);
    }
}

gitDeploy();