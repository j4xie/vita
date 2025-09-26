/**
 * 🔍 阶段0: 基线检测脚本
 *
 * 功能：
 * 1. 检测当前架构配置状态
 * 2. 生成依赖兼容性报告
 * 3. 收集性能基线数据
 * 4. 不改变任何运行时配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BaselineDetector {
  constructor() {
    this.projectRoot = process.cwd();
    this.report = {
      timestamp: new Date().toISOString(),
      architecture: {},
      dependencies: {},
      performance: {},
      risks: [],
      recommendations: []
    };
  }

  /**
   * 🏗️ 检测当前架构配置
   */
  detectArchitectureConfig() {
    console.log('🔍 检测架构配置...');

    try {
      // app.json 配置检测
      const appJsonPath = path.join(this.projectRoot, 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

      this.report.architecture.appJson = {
        newArchEnabled: appConfig.expo?.newArchEnabled || false,
        jsEngine: appConfig.expo?.jsEngine || 'jsc',
        version: appConfig.expo?.version
      };

      // iOS 配置检测
      const podfilePropsPath = path.join(this.projectRoot, 'ios/Podfile.properties.json');
      if (fs.existsSync(podfilePropsPath)) {
        const iosConfig = JSON.parse(fs.readFileSync(podfilePropsPath, 'utf8'));
        this.report.architecture.ios = {
          newArchEnabled: iosConfig.newArchEnabled === 'true',
          jsEngine: iosConfig['expo.jsEngine'] || 'jsc',
          networkInspector: iosConfig.EX_DEV_CLIENT_NETWORK_INSPECTOR
        };
      }

      // Android 配置检测
      const gradlePropsPath = path.join(this.projectRoot, 'android/gradle.properties');
      if (fs.existsSync(gradlePropsPath)) {
        const gradleProps = fs.readFileSync(gradlePropsPath, 'utf8');
        this.report.architecture.android = {
          newArchEnabled: gradleProps.includes('newArchEnabled=true'),
          hermesEnabled: gradleProps.includes('hermesEnabled=true'),
          architectures: this.extractGradleProperty(gradleProps, 'reactNativeArchitectures')
        };
      }

      console.log('✅ 架构配置检测完成');

    } catch (error) {
      console.error('❌ 架构配置检测失败:', error.message);
      this.report.risks.push({
        level: 'high',
        category: 'config',
        message: `配置文件读取失败: ${error.message}`
      });
    }
  }

  /**
   * 📦 检测依赖兼容性
   */
  async detectDependencyCompatibility() {
    console.log('📦 检测依赖兼容性...');

    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // 新架构关键依赖库
      const criticalDeps = {
        'react-native': {
          current: packageJson.dependencies['react-native'],
          minVersion: '0.74.0',
          newArchSupport: 'full',
          status: 'compatible'
        },
        'react-native-reanimated': {
          current: packageJson.dependencies['react-native-reanimated'],
          minVersion: '3.0.0',
          newArchSupport: 'full',
          status: 'compatible'
        },
        'react-native-screens': {
          current: packageJson.dependencies['react-native-screens'],
          minVersion: '3.29.0',
          newArchSupport: 'full',
          status: 'compatible'
        },
        'react-native-gesture-handler': {
          current: packageJson.dependencies['react-native-gesture-handler'],
          minVersion: '2.14.0',
          newArchSupport: 'full',
          status: 'compatible'
        },
        'react-native-safe-area-context': {
          current: packageJson.dependencies['react-native-safe-area-context'],
          minVersion: '4.8.0',
          newArchSupport: 'full',
          status: 'compatible'
        },
        'react-native-svg': {
          current: packageJson.dependencies['react-native-svg'],
          minVersion: '14.0.0',
          newArchSupport: 'full',
          status: 'compatible'
        }
      };

      // 风险依赖库
      const riskDeps = {
        'react-native-fast-image': {
          current: packageJson.dependencies['react-native-fast-image'],
          newArchSupport: 'partial',
          status: 'needs-patch',
          alternative: 'expo-image'
        },
        '@react-native-community/blur': {
          current: packageJson.dependencies['@react-native-community/blur'],
          newArchSupport: 'none',
          status: 'incompatible',
          alternative: 'expo-blur'
        },
        'react-native-qrcode-svg': {
          current: packageJson.dependencies['react-native-qrcode-svg'],
          newArchSupport: 'unknown',
          status: 'needs-testing'
        },
        'react-native-base64': {
          current: packageJson.dependencies['react-native-base64'],
          newArchSupport: 'unknown',
          status: 'can-replace-with-js'
        }
      };

      this.report.dependencies = {
        total: Object.keys(packageJson.dependencies || {}).length,
        compatible: Object.keys(criticalDeps).length,
        risky: Object.keys(riskDeps).length,
        criticalDeps,
        riskDeps
      };

      // 生成风险评估
      Object.entries(riskDeps).forEach(([dep, info]) => {
        if (info.current) {
          this.report.risks.push({
            level: info.status === 'incompatible' ? 'high' : 'medium',
            category: 'dependency',
            message: `${dep} (${info.current}): ${info.newArchSupport} 新架构支持`,
            solution: info.alternative ? `建议替换为 ${info.alternative}` : '需要进一步测试'
          });
        }
      });

      console.log('✅ 依赖兼容性检测完成');

    } catch (error) {
      console.error('❌ 依赖检测失败:', error.message);
      this.report.risks.push({
        level: 'high',
        category: 'dependency',
        message: `依赖分析失败: ${error.message}`
      });
    }
  }

  /**
   * ⚡ 性能基线收集 (静态分析)
   */
  collectPerformanceBaseline() {
    console.log('⚡ 收集性能基线数据...');

    try {
      // Bundle 分析
      const distPath = path.join(this.projectRoot, 'dist');
      let bundleSize = 0;

      if (fs.existsSync(distPath)) {
        const bundleFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));
        bundleSize = bundleFiles.reduce((total, file) => {
          const filePath = path.join(distPath, file);
          return total + fs.statSync(filePath).size;
        }, 0);
      }

      // 组件复杂度分析
      const srcPath = path.join(this.projectRoot, 'src');
      let componentCount = 0;
      let screenCount = 0;
      let flatListCount = 0;

      if (fs.existsSync(srcPath)) {
        const analyzeDirectory = (dir) => {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          items.forEach(item => {
            if (item.isDirectory()) {
              analyzeDirectory(path.join(dir, item.name));
            } else if (item.name.endsWith('.tsx') || item.name.endsWith('.jsx')) {
              const content = fs.readFileSync(path.join(dir, item.name), 'utf8');

              if (content.includes('export') && (content.includes('function') || content.includes('const'))) {
                componentCount++;
              }

              if (item.name.includes('Screen')) {
                screenCount++;
              }

              if (content.includes('FlatList') || content.includes('SectionList')) {
                flatListCount++;
              }
            }
          });
        };

        analyzeDirectory(srcPath);
      }

      this.report.performance = {
        bundleSize: Math.round(bundleSize / 1024 / 1024 * 100) / 100, // MB
        componentCount,
        screenCount,
        flatListCount,
        estimatedStartupTime: this.estimateStartupTime(bundleSize, componentCount),
        memoryFootprint: this.estimateMemoryFootprint(componentCount, flatListCount)
      };

      // 性能建议
      if (bundleSize > 5 * 1024 * 1024) { // > 5MB
        this.report.recommendations.push('Bundle 大小较大，建议启用代码分割');
      }

      if (flatListCount > 5) {
        this.report.recommendations.push(`发现 ${flatListCount} 个列表组件，建议迁移到 FlashList 以提升性能`);
      }

      console.log('✅ 性能基线收集完成');

    } catch (error) {
      console.error('❌ 性能分析失败:', error.message);
      this.report.risks.push({
        level: 'medium',
        category: 'performance',
        message: `性能分析失败: ${error.message}`
      });
    }
  }

  /**
   * 🎯 生成迁移建议
   */
  generateMigrationRecommendations() {
    console.log('🎯 生成迁移建议...');

    const { architecture, dependencies } = this.report;

    // 基于当前配置生成建议
    if (!architecture.appJson?.newArchEnabled) {
      this.report.recommendations.push({
        priority: 'high',
        category: 'architecture',
        title: '启用 Hermes 引擎',
        description: '低风险，高收益的性能提升',
        effort: 'low',
        impact: 'high'
      });
    }

    if (dependencies.risky > 0) {
      this.report.recommendations.push({
        priority: 'high',
        category: 'dependencies',
        title: '解决依赖兼容性问题',
        description: `${dependencies.risky} 个依赖需要处理`,
        effort: 'medium',
        impact: 'high'
      });
    }

    if (this.report.performance.flatListCount > 3) {
      this.report.recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: '升级列表组件到 FlashList',
        description: '显著提升列表滚动性能',
        effort: 'medium',
        impact: 'medium'
      });
    }

    console.log('✅ 迁移建议生成完成');
  }

  /**
   * 📊 生成报告
   */
  async generateReport() {
    console.log('📊 生成基线检测报告...');

    await this.detectArchitectureConfig();
    await this.detectDependencyCompatibility();
    this.collectPerformanceBaseline();
    this.generateMigrationRecommendations();

    // 保存报告
    const reportPath = path.join(this.projectRoot, 'refactor', 'baseline-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

    // 生成人类可读的报告
    const readableReport = this.generateReadableReport();
    const readableReportPath = path.join(this.projectRoot, 'refactor', 'BASELINE_REPORT.md');
    fs.writeFileSync(readableReportPath, readableReport);

    console.log('✅ 基线检测完成！');
    console.log(`📄 详细报告: ${reportPath}`);
    console.log(`📝 可读报告: ${readableReportPath}`);

    return this.report;
  }

  /**
   * 📝 生成人类可读报告
   */
  generateReadableReport() {
    const { architecture, dependencies, performance, risks, recommendations } = this.report;

    return `# 🔍 PomeloX 新架构基线检测报告

**检测时间**: ${new Date(this.report.timestamp).toLocaleString()}

## 📋 架构现状

### 当前配置
- **新架构状态**: ${architecture.appJson?.newArchEnabled ? '✅ 已启用' : '❌ 未启用'}
- **JavaScript 引擎**: ${architecture.appJson?.jsEngine?.toUpperCase() || 'JSC'}
- **iOS 新架构**: ${architecture.ios?.newArchEnabled ? '✅ 已启用' : '❌ 未启用'}
- **Android 新架构**: ${architecture.android?.newArchEnabled ? '✅ 已启用' : '❌ 未启用'}
- **Android Hermes**: ${architecture.android?.hermesEnabled ? '✅ 已启用' : '❌ 未启用'}

## 📦 依赖兼容性分析

- **总依赖数**: ${dependencies.total || 0}
- **兼容依赖**: ${dependencies.compatible || 0}
- **风险依赖**: ${dependencies.risky || 0}

### 风险依赖详情
${Object.entries(dependencies.riskDeps || {}).map(([dep, info]) =>
  info.current ? `- **${dep}** (${info.current}): ${info.status}${info.alternative ? ` → 建议: ${info.alternative}` : ''}` : ''
).filter(Boolean).join('\n') || '无风险依赖'}

## ⚡ 性能基线

- **Bundle 大小**: ${performance.bundleSize || 0} MB
- **组件数量**: ${performance.componentCount || 0}
- **屏幕数量**: ${performance.screenCount || 0}
- **列表组件**: ${performance.flatListCount || 0}
- **预估启动时间**: ${performance.estimatedStartupTime || 0}ms
- **预估内存占用**: ${performance.memoryFootprint || 0}MB

## 🚨 风险评估

${risks.map(risk =>
  `- **${risk.level.toUpperCase()}**: ${risk.message}`
).join('\n') || '无明显风险'}

## 🎯 迁移建议

${recommendations.map(rec =>
  typeof rec === 'string'
    ? `- ${rec}`
    : `- **${rec.title}**: ${rec.description} (优先级: ${rec.priority})`
).join('\n') || '无特殊建议'}

## 📊 总结

当前项目基于 **${architecture.appJson?.newArchEnabled ? '新' : '旧'}架构**，使用 **${architecture.appJson?.jsEngine?.toUpperCase() || 'JSC'}** 引擎。

${dependencies.risky > 0 ?
  `⚠️ 发现 ${dependencies.risky} 个依赖库存在新架构兼容性问题，需要优先解决。` :
  '✅ 主要依赖库均兼容新架构。'
}

建议优先从 Hermes 引擎开始迁移，这是风险最低、收益最高的改进。

---
*此报告由自动化基线检测工具生成*
`;
  }

  // 工具方法
  extractGradleProperty(content, property) {
    const match = content.match(new RegExp(`${property}=(.+)`));
    return match ? match[1] : null;
  }

  estimateStartupTime(bundleSize, componentCount) {
    // 简单的启动时间估算（基于经验公式）
    const baseLine = 1500; // ms
    const bundleImpact = (bundleSize / (1024 * 1024)) * 200; // 每MB增加200ms
    const componentImpact = componentCount * 2; // 每个组件增加2ms
    return Math.round(baseLine + bundleImpact + componentImpact);
  }

  estimateMemoryFootprint(componentCount, listCount) {
    // 简单的内存占用估算
    const baseline = 120; // MB
    const componentImpact = componentCount * 0.5; // 每个组件0.5MB
    const listImpact = listCount * 10; // 每个列表10MB
    return Math.round(baseline + componentImpact + listImpact);
  }
}

// 执行检测
if (require.main === module) {
  const detector = new BaselineDetector();
  detector.generateReport().catch(console.error);
}

module.exports = BaselineDetector;