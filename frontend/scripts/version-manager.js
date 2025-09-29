#!/usr/bin/env node

/**
 * PomeloX 版本管理工具
 * 支持beta版本标识和多文件同步
 *
 * 用法:
 *   node scripts/version-manager.js patch          # 1.0.1 -> 1.0.2
 *   node scripts/version-manager.js minor          # 1.0.1 -> 1.1.0
 *   node scripts/version-manager.js major          # 1.0.1 -> 2.0.0
 *   node scripts/version-manager.js beta           # 1.0.1 -> 1.0.2-beta.1
 *   node scripts/version-manager.js release        # 1.0.2-beta.1 -> 1.0.2
 *   node scripts/version-manager.js status         # 显示当前版本信息
 */

const fs = require('fs');
const path = require('path');

// 颜色定义
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[35m'
};

// 日志函数
const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    important: (msg) => console.log(`${colors.purple}[IMPORTANT]${colors.reset} ${msg}`)
};

// 文件路径
const paths = {
    packageJson: path.join(__dirname, '../package.json'),
    appJson: path.join(__dirname, '../app.json'),
    infoPlist: path.join(__dirname, '../ios/PomeloXApp/Info.plist')
};

class VersionManager {
    constructor() {
        this.packageJson = null;
        this.appJson = null;
        this.infoPlist = null;
    }

    // 加载所有配置文件
    loadConfigs() {
        try {
            // 加载 package.json
            this.packageJson = JSON.parse(fs.readFileSync(paths.packageJson, 'utf8'));

            // 加载 app.json
            this.appJson = JSON.parse(fs.readFileSync(paths.appJson, 'utf8'));

            // 加载 Info.plist (如果存在)
            if (fs.existsSync(paths.infoPlist)) {
                this.infoPlist = fs.readFileSync(paths.infoPlist, 'utf8');
            }

            log.success('配置文件加载完成');
            return true;
        } catch (error) {
            log.error(`加载配置文件失败: ${error.message}`);
            return false;
        }
    }

    // 解析版本号
    parseVersion(version) {
        const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-(\w+)\.(\d+))?$/;
        const match = version.match(versionRegex);

        if (!match) {
            throw new Error(`无效的版本号格式: ${version}`);
        }

        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
            patch: parseInt(match[3]),
            prerelease: match[4] || null,
            prereleaseVersion: match[5] ? parseInt(match[5]) : null
        };
    }

    // 生成新版本号
    generateNewVersion(currentVersion, type) {
        const parsed = this.parseVersion(currentVersion);

        switch (type) {
            case 'major':
                return `${parsed.major + 1}.0.0`;

            case 'minor':
                return `${parsed.major}.${parsed.minor + 1}.0`;

            case 'patch':
                return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;

            case 'beta':
                if (parsed.prerelease === 'beta') {
                    // 已经是beta版本，增加beta版本号
                    return `${parsed.major}.${parsed.minor}.${parsed.patch}-beta.${parsed.prereleaseVersion + 1}`;
                } else {
                    // 普通版本升级为beta
                    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-beta.1`;
                }

            case 'release':
                if (parsed.prerelease) {
                    // 从预发布版本升级为正式版本
                    return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
                } else {
                    throw new Error('当前已经是正式版本');
                }

            default:
                throw new Error(`不支持的版本类型: ${type}`);
        }
    }

    // 生成构建号
    generateBuildNumber(version) {
        const parsed = this.parseVersion(version);

        if (parsed.prerelease === 'beta') {
            // Beta版本: 主版本号 + 次版本号 + 补丁号 + beta号
            return `${parsed.major}${parsed.minor.toString().padStart(2, '0')}${parsed.patch.toString().padStart(2, '0')}${parsed.prereleaseVersion.toString().padStart(2, '0')}`;
        } else {
            // 正式版本: 主版本号 + 次版本号 + 补丁号
            return `${parsed.major}${parsed.minor.toString().padStart(2, '0')}${parsed.patch.toString().padStart(2, '0')}`;
        }
    }

    // 更新 package.json
    updatePackageJson(newVersion) {
        this.packageJson.version = newVersion;
        fs.writeFileSync(paths.packageJson, JSON.stringify(this.packageJson, null, 2) + '\n');
        log.success(`已更新 package.json: ${newVersion}`);
    }

    // 更新 app.json
    updateAppJson(newVersion, buildNumber) {
        this.appJson.expo.version = newVersion;
        this.appJson.expo.ios.buildNumber = buildNumber;
        fs.writeFileSync(paths.appJson, JSON.stringify(this.appJson, null, 2) + '\n');
        log.success(`已更新 app.json: ${newVersion} (Build: ${buildNumber})`);
    }

    // 更新 Info.plist
    updateInfoPlist(newVersion, buildNumber) {
        if (!this.infoPlist) {
            log.warning('Info.plist 文件不存在，跳过更新');
            return;
        }

        let updatedPlist = this.infoPlist;

        // 更新 CFBundleShortVersionString
        updatedPlist = updatedPlist.replace(
            /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
            `$1${newVersion}$2`
        );

        // 更新 CFBundleVersion
        updatedPlist = updatedPlist.replace(
            /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
            `$1${buildNumber}$2`
        );

        fs.writeFileSync(paths.infoPlist, updatedPlist);
        log.success(`已更新 Info.plist: ${newVersion} (Build: ${buildNumber})`);
    }

    // 显示版本状态
    showStatus() {
        log.info('当前版本信息:');
        console.log(`  📦 package.json: ${this.packageJson.version}`);
        console.log(`  📱 app.json: ${this.appJson.expo.version} (Build: ${this.appJson.expo.ios.buildNumber})`);

        if (this.infoPlist) {
            const versionMatch = this.infoPlist.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]*)<\/string>/);
            const buildMatch = this.infoPlist.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]*)<\/string>/);

            if (versionMatch && buildMatch) {
                console.log(`  🍎 Info.plist: ${versionMatch[1]} (Build: ${buildMatch[1]})`);
            }
        }

        // 检查版本一致性
        this.checkConsistency();
    }

    // 检查版本一致性
    checkConsistency() {
        const packageVersion = this.packageJson.version;
        const appVersion = this.appJson.expo.version;

        if (packageVersion !== appVersion) {
            log.warning('版本不一致:');
            log.warning(`  package.json: ${packageVersion}`);
            log.warning(`  app.json: ${appVersion}`);
            return false;
        }

        log.success('所有文件版本一致');
        return true;
    }

    // 更新版本
    updateVersion(type) {
        try {
            const currentVersion = this.packageJson.version;
            const newVersion = this.generateNewVersion(currentVersion, type);
            const buildNumber = this.generateBuildNumber(newVersion);

            log.info(`版本更新: ${currentVersion} -> ${newVersion}`);
            log.info(`构建号: ${buildNumber}`);

            // 更新所有文件
            this.updatePackageJson(newVersion);
            this.updateAppJson(newVersion, buildNumber);
            this.updateInfoPlist(newVersion, buildNumber);

            log.success('🎉 版本更新完成!');

            // 显示发布建议
            this.showReleaseAdvice(type, newVersion);

        } catch (error) {
            log.error(`版本更新失败: ${error.message}`);
            process.exit(1);
        }
    }

    // 显示发布建议
    showReleaseAdvice(type, version) {
        console.log('\n📋 发布建议:');

        if (type === 'beta') {
            console.log('  🧪 Beta版本发布到TestFlight:');
            console.log('     npm run testflight:release');
        } else {
            console.log('  🚀 正式版本发布:');
            console.log('     1. 先发布到TestFlight测试:');
            console.log('        npm run testflight:release');
            console.log('     2. 测试通过后发布到App Store:');
            console.log('        npm run appstore:release');
        }

        console.log('\n  📝 记得提交版本更新:');
        console.log(`     git add . && git commit -m "chore: bump version to ${version}"`);
    }
}

// 主函数
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('🔢 PomeloX 版本管理工具');
        console.log('========================');
        console.log('用法:');
        console.log('  node scripts/version-manager.js <command>');
        console.log('');
        console.log('命令:');
        console.log('  patch     补丁版本 (1.0.1 -> 1.0.2)');
        console.log('  minor     次版本 (1.0.1 -> 1.1.0)');
        console.log('  major     主版本 (1.0.1 -> 2.0.0)');
        console.log('  beta      Beta版本 (1.0.1 -> 1.0.2-beta.1)');
        console.log('  release   正式发布 (1.0.2-beta.1 -> 1.0.2)');
        console.log('  status    显示当前版本');
        process.exit(0);
    }

    const command = args[0];
    const versionManager = new VersionManager();

    if (!versionManager.loadConfigs()) {
        process.exit(1);
    }

    switch (command) {
        case 'status':
            versionManager.showStatus();
            break;

        case 'patch':
        case 'minor':
        case 'major':
        case 'beta':
        case 'release':
            versionManager.updateVersion(command);
            break;

        default:
            log.error(`未知命令: ${command}`);
            process.exit(1);
    }
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = VersionManager;