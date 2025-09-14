// 部署工具函数
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

class DeployUtils {
    // 压缩dist目录为zip文件
    static async compressDistFolder(distPath, outputPath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(distPath)) {
                reject(new Error(`构建目录不存在: ${distPath}`));
                return;
            }

            console.log('正在压缩构建文件...');
            
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // 最高压缩级别
            });

            output.on('close', () => {
                const fileSize = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`压缩完成: ${fileSize}MB`);
                resolve(outputPath);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(distPath, false); // false表示不包含根目录
            archive.finalize();
        });
    }

    // 构建项目 - 生产环境固定
    static buildProject() {
        console.log('正在构建生产环境项目...');
        
        try {
            const buildCommand = 'npm run web:build';
            
            execSync(buildCommand, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            console.log('项目构建完成');
            return true;
        } catch (error) {
            console.error('构建失败:', error.message);
            throw error;
        }
    }

    // 清理临时文件
    static cleanupTempFiles(...filePaths) {
        filePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`已清理临时文件: ${path.basename(filePath)}`);
                } catch (error) {
                    console.warn(`清理文件失败: ${filePath}`, error.message);
                }
            }
        });
    }

    // 生成唯一的文件名
    static generateUniqueFileName(baseName, extension = '.zip') {
        // 使用更简单的时间戳：年月日时分秒
        const now = new Date();
        const timestamp = now.getFullYear().toString().slice(-2) + 
                         (now.getMonth() + 1).toString().padStart(2, '0') +
                         now.getDate().toString().padStart(2, '0') +
                         now.getHours().toString().padStart(2, '0') +
                         now.getMinutes().toString().padStart(2, '0');
        
        // 只使用字母和数字，避免特殊字符
        const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return `${cleanBaseName}${timestamp}${extension}`;
    }

    // 检查必需的依赖
    static checkDependencies() {
        const requiredDeps = ['archiver', 'axios', 'form-data'];
        const missingDeps = [];
        
        requiredDeps.forEach(dep => {
            try {
                require.resolve(dep);
            } catch (error) {
                missingDeps.push(dep);
            }
        });
        
        if (missingDeps.length > 0) {
            console.error('缺少必需的依赖包，请安装:');
            console.error(`npm install ${missingDeps.join(' ')}`);
            process.exit(1);
        }
    }

    // 验证构建文件
    static validateBuildFiles(distPath) {
        if (!fs.existsSync(distPath)) {
            throw new Error('构建目录不存在，请先运行构建命令');
        }

        const indexPath = path.join(distPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
            throw new Error('构建文件不完整，缺少 index.html');
        }

        const stats = fs.statSync(distPath);
        const files = fs.readdirSync(distPath);
        
        console.log(`构建文件验证通过: ${files.length} 个文件/目录`);
        return true;
    }

    // 显示进度
    static showProgress(message, step = 0, total = 0) {
        if (total > 0) {
            const progress = Math.round((step / total) * 100);
            console.log(`[${progress}%] ${message}`);
        } else {
            console.log(`🔄 ${message}`);
        }
    }

    // 显示成功消息
    static showSuccess(message, details = '') {
        console.log(`✅ ${message}`);
        if (details) {
            console.log(`   ${details}`);
        }
    }

    // 显示错误消息
    static showError(message, error = null) {
        console.error(`❌ ${message}`);
        if (error) {
            console.error(`   错误详情: ${error.message}`);
        }
    }
}

module.exports = DeployUtils;