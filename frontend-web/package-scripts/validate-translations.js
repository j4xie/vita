#!/usr/bin/env node

/**
 * 翻译键验证工具
 * 验证zh-CN和en-US翻译文件的一致性，确保所有翻译键都存在
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const ZH_CN_FILE = path.join(LOCALES_DIR, 'zh-CN/translation.json');
const EN_US_FILE = path.join(LOCALES_DIR, 'en-US/translation.json');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 递归获取所有翻译键路径
function getAllKeys(obj, prefix = '') {
  const keys = new Set();
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // 递归处理嵌套对象
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    } else {
      // 叶子节点，添加完整路径
      keys.add(fullKey);
    }
  }
  
  return keys;
}

// 检查特定键是否存在
function keyExists(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return typeof current === 'string' && current.length > 0;
}

// 主验证函数
function validateTranslations() {
  colorLog('cyan', '\n🌍 翻译键验证工具');
  colorLog('cyan', '=====================================');

  try {
    // 读取翻译文件
    const zhCnContent = fs.readFileSync(ZH_CN_FILE, 'utf8');
    const enUsContent = fs.readFileSync(EN_US_FILE, 'utf8');

    let zhCnData, enUsData;

    try {
      zhCnData = JSON.parse(zhCnContent);
      colorLog('green', '✅ zh-CN/translation.json JSON语法正确');
    } catch (e) {
      colorLog('red', `❌ zh-CN/translation.json JSON语法错误: ${e.message}`);
      return false;
    }

    try {
      enUsData = JSON.parse(enUsContent);
      colorLog('green', '✅ en-US/translation.json JSON语法正确');
    } catch (e) {
      colorLog('red', `❌ en-US/translation.json JSON语法错误: ${e.message}`);
      return false;
    }

    // 获取所有翻译键
    const zhKeys = getAllKeys(zhCnData);
    const enKeys = getAllKeys(enUsData);

    colorLog('blue', `\n📊 统计信息:`);
    colorLog('blue', `   中文键数量: ${zhKeys.size}`);
    colorLog('blue', `   英文键数量: ${enKeys.size}`);

    // 查找缺失的键
    const missingInEn = Array.from(zhKeys).filter(key => !enKeys.has(key));
    const missingInZh = Array.from(enKeys).filter(key => !zhKeys.has(key));

    // 检查空值
    const emptyInZh = Array.from(zhKeys).filter(key => {
      const value = keyExists(zhCnData, key);
      return !value;
    });

    const emptyInEn = Array.from(enKeys).filter(key => {
      const value = keyExists(enUsData, key);
      return !value;
    });

    let hasErrors = false;

    // 报告缺失的键
    if (missingInEn.length > 0) {
      hasErrors = true;
      colorLog('red', `\n❌ 英文翻译中缺失的键 (${missingInEn.length}个):`);
      missingInEn.forEach(key => colorLog('red', `   • ${key}`));
    }

    if (missingInZh.length > 0) {
      hasErrors = true;
      colorLog('red', `\n❌ 中文翻译中缺失的键 (${missingInZh.length}个):`);
      missingInZh.forEach(key => colorLog('red', `   • ${key}`));
    }

    // 报告空值
    if (emptyInZh.length > 0) {
      hasErrors = true;
      colorLog('yellow', `\n⚠️  中文翻译中的空值 (${emptyInZh.length}个):`);
      emptyInZh.forEach(key => colorLog('yellow', `   • ${key}`));
    }

    if (emptyInEn.length > 0) {
      hasErrors = true;
      colorLog('yellow', `\n⚠️  英文翻译中的空值 (${emptyInEn.length}个):`);
      emptyInEn.forEach(key => colorLog('yellow', `   • ${key}`));
    }

    // 特别检查问题键
    const problemKey = 'profile.account.logout';
    colorLog('magenta', `\n🔍 特别检查问题键: ${problemKey}`);
    
    const zhHasKey = keyExists(zhCnData, problemKey);
    const enHasKey = keyExists(enUsData, problemKey);
    
    colorLog(zhHasKey ? 'green' : 'red', `   中文: ${zhHasKey ? '✅ 存在' : '❌ 缺失'}`);
    colorLog(enHasKey ? 'green' : 'red', `   英文: ${enHasKey ? '✅ 存在' : '❌ 缺失'}`);

    if (zhHasKey && enHasKey) {
      const zhValue = problemKey.split('.').reduce((obj, key) => obj?.[key], zhCnData);
      const enValue = problemKey.split('.').reduce((obj, key) => obj?.[key], enUsData);
      colorLog('green', `   中文值: "${zhValue}"`);
      colorLog('green', `   英文值: "${enValue}"`);
    }

    // 最终结果
    if (!hasErrors) {
      colorLog('green', '\n🎉 所有翻译键验证通过！');
      colorLog('green', '=====================================');
      return true;
    } else {
      colorLog('red', '\n💥 翻译验证失败，请修复上述问题');
      colorLog('red', '=====================================');
      return false;
    }

  } catch (error) {
    colorLog('red', `❌ 验证过程中发生错误: ${error.message}`);
    return false;
  }
}

// 运行验证
if (require.main === module) {
  const isValid = validateTranslations();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateTranslations };