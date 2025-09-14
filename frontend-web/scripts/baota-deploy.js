#!/usr/bin/env node
// 宝塔面板自动部署脚本
const path = require('path');
const fs = require('fs');
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const DeployUtils = require('./deploy-utils');

class BaotaDeployer {
    constructor() {
        this.env = 'prod'; // 生产环境固定
        this.config = new BaotaConfig();
        this.api = new BaotaAPI(this.config);
        this.projectRoot = process.cwd();
        this.distPath = path.join(this.projectRoot, 'dist');
    }

    async deploy() {
        try {
            DeployUtils.showProgress('开始部署流程', 0, 5);
            
            // 1. 检查依赖
            DeployUtils.checkDependencies();
            DeployUtils.showProgress('检查依赖完成', 1, 5);
            
            // 2. 构建项目
            DeployUtils.buildProject();
            DeployUtils.showProgress('项目构建完成', 2, 5);
            
            // 3. 验证构建文件
            DeployUtils.validateBuildFiles(this.distPath);
            DeployUtils.showProgress('构建文件验证通过', 3, 5);
            
            // 4. 直接上传dist目录到宝塔
            await this.uploadDirectoryToBaota();
            DeployUtils.showProgress('文件上传完成', 4, 5);
            
            DeployUtils.showProgress('部署完成', 5, 5);
            
            DeployUtils.showSuccess(
                `🎉 部署成功！`, 
                `环境: PRODUCTION, 路径: ${this.config.getDeployPath()}`
            );
            
        } catch (error) {
            DeployUtils.showError('部署失败', error);
            process.exit(1);
        }
    }

    async uploadDirectoryToBaota() {
        const targetPath = this.config.getDeployPath();
        
        console.log(`正在直接上传dist目录到: ${targetPath}`);
        
        // 直接上传整个dist目录到目标路径
        await this.api.uploadDirectory(this.distPath, targetPath);
        
        console.log('目录上传完成');
    }

}

// 命令行接口 - 生产环境专用
async function main() {
    console.log('🚀 PomeloX 生产环境部署工具');
    console.log('📦 目标环境: PRODUCTION (固定)');
    console.log('=' .repeat(50));

    const deployer = new BaotaDeployer();
    await deployer.deploy();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        DeployUtils.showError('部署脚本执行失败', error);
        process.exit(1);
    });
}

module.exports = BaotaDeployer;