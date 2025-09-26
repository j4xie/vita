/**
 * 🔄 新架构回滚开关机制
 *
 * 功能：
 * 1. 一键切换架构配置
 * 2. 自动备份当前配置
 * 3. 验证配置一致性
 * 4. 生成回滚报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RollbackSwitch {
  constructor() {
    this.projectRoot = process.cwd();
    this.configBackupPath = path.join(this.projectRoot, 'refactor', 'config-backups');
    this.currentConfig = {};
    this.targetConfig = {};

    // 确保备份目录存在
    if (!fs.existsSync(this.configBackupPath)) {
      fs.mkdirSync(this.configBackupPath, { recursive: true });
    }
  }

  /**
   * 📝 配置文件路径映射
   */
  getConfigFiles() {
    return {
      appJson: path.join(this.projectRoot, 'app.json'),
      podfileProps: path.join(this.projectRoot, 'ios/Podfile.properties.json'),
      gradleProps: path.join(this.projectRoot, 'android/gradle.properties'),
      packageJson: path.join(this.projectRoot, 'package.json')
    };
  }

  /**
   * 🔍 读取当前配置
   */
  readCurrentConfig() {
    console.log('🔍 读取当前架构配置...');

    const files = this.getConfigFiles();
    const config = {};

    // app.json
    if (fs.existsSync(files.appJson)) {
      const appJson = JSON.parse(fs.readFileSync(files.appJson, 'utf8'));
      config.appJson = {
        newArchEnabled: appJson.expo?.newArchEnabled || false,
        jsEngine: appJson.expo?.jsEngine || 'jsc'
      };
    }

    // iOS配置
    if (fs.existsSync(files.podfileProps)) {
      const iosConfig = JSON.parse(fs.readFileSync(files.podfileProps, 'utf8'));
      config.ios = {
        newArchEnabled: iosConfig.newArchEnabled,
        jsEngine: iosConfig['expo.jsEngine']
      };
    }

    // Android配置
    if (fs.existsSync(files.gradleProps)) {
      const gradleProps = fs.readFileSync(files.gradleProps, 'utf8');
      config.android = {
        newArchEnabled: gradleProps.includes('newArchEnabled=true'),
        hermesEnabled: gradleProps.includes('hermesEnabled=true')
      };
    }

    this.currentConfig = config;
    return config;
  }

  /**
   * 💾 备份当前配置
   */
  backupCurrentConfig() {
    console.log('💾 备份当前配置...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.configBackupPath, timestamp);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const files = this.getConfigFiles();
    Object.entries(files).forEach(([key, filePath]) => {
      if (fs.existsSync(filePath)) {
        const fileName = path.basename(filePath);
        const backupPath = path.join(backupDir, fileName);
        fs.copyFileSync(filePath, backupPath);
        console.log(`  ✅ 备份: ${fileName}`);
      }
    });

    // 保存配置摘要
    const summary = {
      timestamp,
      config: this.currentConfig,
      files: Object.keys(files)
    };
    fs.writeFileSync(
      path.join(backupDir, 'config-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log(`✅ 配置已备份到: ${backupDir}`);
    return backupDir;
  }

  /**
   * 🔄 切换到新架构 (JSC)
   */
  enableNewArchitecture() {
    console.log('🚀 切换到新架构 (JSC引擎)...');

    this.targetConfig = {
      newArchEnabled: true,
      jsEngine: 'jsc' // 保持JSC，不切换到Hermes
    };

    return this.applyConfig(this.targetConfig);
  }

  /**
   * 🔄 切换到旧架构
   */
  disableNewArchitecture() {
    console.log('↩️ 切换回旧架构...');

    this.targetConfig = {
      newArchEnabled: false,
      jsEngine: 'jsc'
    };

    return this.applyConfig(this.targetConfig);
  }

  /**
   * 🔄 启用Hermes (独立开关)
   */
  enableHermes() {
    console.log('🔥 启用 Hermes 引擎...');

    // 注意：应在新架构稳定后才启用Hermes
    this.targetConfig = {
      jsEngine: 'hermes',
      // 保持当前的新架构状态
      newArchEnabled: this.currentConfig.appJson?.newArchEnabled || false
    };

    return this.applyConfig(this.targetConfig);
  }

  /**
   * 🔄 禁用Hermes，回到JSC
   */
  disableHermes() {
    console.log('↩️ 切换回 JSC 引擎...');

    this.targetConfig = {
      jsEngine: 'jsc',
      // 保持当前的新架构状态
      newArchEnabled: this.currentConfig.appJson?.newArchEnabled || false
    };

    return this.applyConfig(this.targetConfig);
  }

  /**
   * ⚙️ 应用配置
   */
  applyConfig(config) {
    console.log('⚙️ 应用新配置...');

    const files = this.getConfigFiles();

    try {
      // 更新 app.json
      if (fs.existsSync(files.appJson)) {
        const appJson = JSON.parse(fs.readFileSync(files.appJson, 'utf8'));
        if (!appJson.expo) appJson.expo = {};

        if (config.newArchEnabled !== undefined) {
          appJson.expo.newArchEnabled = config.newArchEnabled;
        }
        if (config.jsEngine) {
          appJson.expo.jsEngine = config.jsEngine;
        }

        fs.writeFileSync(files.appJson, JSON.stringify(appJson, null, 2));
        console.log('  ✅ 更新 app.json');
      }

      // 更新 iOS 配置
      if (fs.existsSync(files.podfileProps)) {
        const iosConfig = JSON.parse(fs.readFileSync(files.podfileProps, 'utf8'));

        if (config.newArchEnabled !== undefined) {
          iosConfig.newArchEnabled = config.newArchEnabled.toString();
        }
        if (config.jsEngine) {
          iosConfig['expo.jsEngine'] = config.jsEngine;
        }

        fs.writeFileSync(files.podfileProps, JSON.stringify(iosConfig, null, 2));
        console.log('  ✅ 更新 iOS 配置');
      }

      // 更新 Android 配置
      if (fs.existsSync(files.gradleProps)) {
        let gradleProps = fs.readFileSync(files.gradleProps, 'utf8');

        if (config.newArchEnabled !== undefined) {
          gradleProps = gradleProps.replace(
            /newArchEnabled=\w+/,
            `newArchEnabled=${config.newArchEnabled}`
          );
        }

        if (config.jsEngine === 'hermes') {
          gradleProps = gradleProps.replace(
            /hermesEnabled=\w+/,
            'hermesEnabled=true'
          );
        } else if (config.jsEngine === 'jsc') {
          gradleProps = gradleProps.replace(
            /hermesEnabled=\w+/,
            'hermesEnabled=false'
          );
        }

        fs.writeFileSync(files.gradleProps, gradleProps);
        console.log('  ✅ 更新 Android 配置');
      }

      console.log('✅ 配置应用成功！');
      return true;

    } catch (error) {
      console.error('❌ 配置应用失败:', error);
      return false;
    }
  }

  /**
   * 🏗️ 重建项目
   */
  rebuildProject(platform = 'all') {
    console.log(`🏗️ 重建项目 (${platform})...`);

    try {
      if (platform === 'ios' || platform === 'all') {
        console.log('  📱 重建 iOS...');
        execSync('cd ios && pod install', { stdio: 'inherit' });
        console.log('  ✅ iOS 重建完成');
      }

      if (platform === 'android' || platform === 'all') {
        console.log('  🤖 清理 Android 缓存...');
        execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
        console.log('  ✅ Android 清理完成');
      }

      console.log('✅ 项目重建完成！');
      console.log('⚠️ 请重新启动 Metro bundler 和应用');

      return true;
    } catch (error) {
      console.error('❌ 项目重建失败:', error);
      return false;
    }
  }

  /**
   * ✅ 验证配置一致性
   */
  validateConfig() {
    console.log('✅ 验证配置一致性...');

    const config = this.readCurrentConfig();
    const issues = [];

    // 检查 iOS 和 app.json 一致性
    if (config.appJson?.newArchEnabled !== (config.ios?.newArchEnabled === 'true')) {
      issues.push('⚠️ iOS 新架构配置与 app.json 不一致');
    }

    if (config.appJson?.jsEngine !== config.ios?.jsEngine) {
      issues.push('⚠️ iOS JS引擎配置与 app.json 不一致');
    }

    // 检查 Android 配置
    if (config.appJson?.newArchEnabled !== config.android?.newArchEnabled) {
      issues.push('⚠️ Android 新架构配置与 app.json 不一致');
    }

    const androidHermes = config.android?.hermesEnabled;
    const expectHermes = config.appJson?.jsEngine === 'hermes';
    if (androidHermes !== expectHermes) {
      issues.push('⚠️ Android Hermes 配置与 app.json 不一致');
    }

    if (issues.length === 0) {
      console.log('✅ 所有配置一致');
      return true;
    } else {
      console.log('❌ 发现配置不一致:');
      issues.forEach(issue => console.log(`  ${issue}`));
      return false;
    }
  }

  /**
   * 📊 生成状态报告
   */
  generateStatusReport() {
    const config = this.readCurrentConfig();

    const report = `
# 🔄 架构配置状态报告

**生成时间**: ${new Date().toISOString()}

## 当前配置

### 整体状态
- **新架构**: ${config.appJson?.newArchEnabled ? '✅ 已启用' : '❌ 未启用'}
- **JS引擎**: ${config.appJson?.jsEngine?.toUpperCase() || 'JSC'}

### iOS 配置
- **新架构**: ${config.ios?.newArchEnabled === 'true' ? '✅ 已启用' : '❌ 未启用'}
- **JS引擎**: ${config.ios?.jsEngine?.toUpperCase() || 'JSC'}

### Android 配置
- **新架构**: ${config.android?.newArchEnabled ? '✅ 已启用' : '❌ 未启用'}
- **Hermes**: ${config.android?.hermesEnabled ? '✅ 已启用' : '❌ 未启用'}

## 配置一致性
${this.validateConfig() ? '✅ 所有配置一致' : '⚠️ 存在配置不一致，请检查'}

## 可用操作

### 架构切换
- \`npm run arch:enable\` - 启用新架构 (JSC)
- \`npm run arch:disable\` - 禁用新架构

### 引擎切换 (独立控制)
- \`npm run hermes:enable\` - 启用 Hermes
- \`npm run hermes:disable\` - 回到 JSC

### 工具命令
- \`npm run arch:status\` - 查看当前状态
- \`npm run arch:validate\` - 验证配置
- \`npm run arch:backup\` - 备份当前配置
`;

    const reportPath = path.join(this.projectRoot, 'refactor', 'ARCHITECTURE_STATUS.md');
    fs.writeFileSync(reportPath, report);

    console.log(report);
    console.log(`\n📄 报告已保存到: ${reportPath}`);

    return report;
  }
}

// CLI 命令处理
if (require.main === module) {
  const switcher = new RollbackSwitch();
  const command = process.argv[2];

  // 先读取当前配置
  switcher.readCurrentConfig();

  switch (command) {
    case 'enable':
      switcher.backupCurrentConfig();
      switcher.enableNewArchitecture();
      switcher.rebuildProject();
      break;

    case 'disable':
      switcher.backupCurrentConfig();
      switcher.disableNewArchitecture();
      switcher.rebuildProject();
      break;

    case 'enable-hermes':
      switcher.backupCurrentConfig();
      switcher.enableHermes();
      switcher.rebuildProject();
      break;

    case 'disable-hermes':
      switcher.backupCurrentConfig();
      switcher.disableHermes();
      switcher.rebuildProject();
      break;

    case 'status':
      switcher.generateStatusReport();
      break;

    case 'validate':
      switcher.validateConfig();
      break;

    case 'backup':
      switcher.backupCurrentConfig();
      break;

    default:
      console.log(`
🔄 新架构回滚开关

使用方法:
  node rollback-switch.js [命令]

命令:
  enable          启用新架构 (JSC引擎)
  disable         禁用新架构
  enable-hermes   启用 Hermes 引擎
  disable-hermes  禁用 Hermes，回到 JSC
  status          查看当前状态
  validate        验证配置一致性
  backup          备份当前配置

示例:
  node rollback-switch.js enable    # 启用新架构
  node rollback-switch.js status    # 查看状态
`);
  }
}

module.exports = RollbackSwitch;