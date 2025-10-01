#!/usr/bin/env node

/**
 * 活动列表加载问题诊断脚本
 * 用于快速诊断为什么活动界面加载不出任何活动
 */

const https = require('https');
const http = require('http');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// 测试API连接
async function testAPI(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    log(`\n测试: ${description}`, 'blue');
    log(`URL: ${url}`, 'blue');

    const startTime = Date.now();

    const req = protocol.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PomeloX-Diagnostic/1.0',
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          log(`✅ 响应成功`, 'green');
          log(`   状态码: ${res.statusCode}`, 'green');
          log(`   响应时间: ${duration}ms`, 'green');
          log(`   活动总数: ${json.total || 0}`, 'green');
          log(`   活动数量: ${json.rows?.length || 0}`, 'green');

          if (json.rows && json.rows.length > 0) {
            log(`   第一个活动: ${json.rows[0].name}`, 'green');
          }

          resolve({ success: true, data: json, duration });
        } catch (e) {
          log(`❌ JSON解析失败: ${e.message}`, 'red');
          log(`   原始数据: ${data.substring(0, 200)}`, 'yellow');
          resolve({ success: false, error: 'JSON解析失败' });
        }
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      log(`❌ 请求失败: ${err.message}`, 'red');
      log(`   耗时: ${duration}ms`, 'red');
      resolve({ success: false, error: err.message, duration });
    });

    req.on('timeout', () => {
      req.destroy();
      log(`❌ 请求超时 (>10秒)`, 'red');
      resolve({ success: false, error: '请求超时' });
    });
  });
}

// 主诊断函数
async function diagnose() {
  log('🔍 PomeloX 活动列表加载诊断工具', 'cyan');
  log('   开始时间: ' + new Date().toLocaleString('zh-CN'), 'cyan');

  // 1. 测试生产环境API
  section('1. 生产环境API测试');
  const prodResult = await testAPI(
    'https://www.vitaglobal.icu/app/activity/list?pageNum=1&pageSize=10',
    '生产环境活动列表'
  );

  // 2. 测试测试环境API
  section('2. 测试环境API测试');
  const testResult = await testAPI(
    'http://106.14.165.234:8085/app/activity/list?pageNum=1&pageSize=10',
    '测试环境活动列表'
  );

  // 3. 环境配置检查
  section('3. 环境配置检查');
  const fs = require('fs');
  const path = require('path');

  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    log('✅ .env文件存在', 'green');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const apiUrlMatch = envContent.match(/EXPO_PUBLIC_API_URL=(.*)/);
    const envMatch = envContent.match(/EXPO_PUBLIC_ENVIRONMENT=(.*)/);

    if (apiUrlMatch) {
      log(`   API URL: ${apiUrlMatch[1]}`, 'blue');
    }
    if (envMatch) {
      log(`   环境: ${envMatch[1]}`, 'blue');
    }
  } else {
    log('⚠️  .env文件不存在', 'yellow');
  }

  // 4. 总结和建议
  section('4. 诊断总结');

  if (prodResult.success && testResult.success) {
    log('✅ 两个环境的API都正常工作', 'green');
    log('\n可能的原因:', 'yellow');
    log('   1. App端缓存问题 - 建议清理缓存后重启', 'yellow');
    log('   2. 用户未登录 - 检查登录状态', 'yellow');
    log('   3. AsyncStorage数据问题 - 可能需要清除本地数据', 'yellow');
    log('\n建议操作:', 'green');
    log('   1. 停止Expo开发服务器', 'green');
    log('   2. 运行: npm run start:cache (清理缓存启动)', 'green');
    log('   3. 或在Expo Go中摇晃手机，选择"清除缓存并重新加载"', 'green');
  } else if (!prodResult.success) {
    log('❌ 生产环境API无法访问', 'red');
    log('\n建议:', 'yellow');
    log('   1. 检查网络连接', 'yellow');
    log('   2. 确认API服务器状态', 'yellow');
    log('   3. 尝试切换到测试环境: npm run ios:dev', 'yellow');
  } else if (!testResult.success) {
    log('⚠️  测试环境API无法访问', 'yellow');
    log('   生产环境正常，建议使用生产环境', 'green');
  }

  // 5. 快速修复命令
  section('5. 快速修复命令');
  log('# 清理缓存并重启开发服务器', 'cyan');
  log('npm run start:cache', 'green');
  log('\n# 切换到测试环境', 'cyan');
  log('npm run ios:dev', 'green');
  log('\n# 切换到生产环境', 'cyan');
  log('npm run ios:prod', 'green');

  log('\n诊断完成 ✅', 'cyan');
}

// 运行诊断
diagnose().catch(err => {
  log(`诊断过程出错: ${err.message}`, 'red');
  process.exit(1);
});