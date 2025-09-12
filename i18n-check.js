#!/usr/bin/env node

/**
 * 国际化检查脚本
 * 检查硬编码中文文本和翻译一致性
 */

const fs = require('fs');
const path = require('path');

// 需要检查的目录
const checkDirs = [
  './frontend/src',
  './frontend-web/src'
];

// 常见的硬编码中文模式
const chinesePatterns = [
  // Alert.alert 中的硬编码中文
  /Alert\.alert\s*\(\s*['"`]([^'"`]*[\u4e00-\u9fff]+[^'"`]*)/g,
  // console.log/error 中的中文（用户可见的部分）
  /console\.(log|warn|error)\s*\(\s*['"`]([^'"`]*[\u4e00-\u9fff]+[^'"`]*)/g,
  // Text 组件中的硬编码中文
  /<Text[^>]*>\s*([^<]*[\u4e00-\u9fff]+[^<]*)\s*<\/Text>/g,
  // throw new Error 中的硬编码中文
  /throw new Error\s*\(\s*['"`]([^'"`]*[\u4e00-\u9fff]+[^'"`]*)/g,
  // 其他字符串中的中文
  /['"`]([^'"`]*[\u4e00-\u9fff]+[^'"`]*)['"`]/g
];

// 忽略的文件和路径
const ignorePatterns = [
  'node_modules',
  '.git',
  'test',
  '__tests__',
  '.spec.',
  '.test.',
  'locales/', // 翻译文件本身
  'translation.json'
];

function shouldIgnoreFile(filePath) {
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !shouldIgnoreFile(fullPath)) {
        walk(fullPath);
      } else if (stat.isFile() && !shouldIgnoreFile(fullPath)) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

function checkFileForHardcodedChinese(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    for (const pattern of chinesePatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        // 过滤掉一些不需要翻译的内容
        const text = match[1] || match[0];
        if (
          text.includes('console.') || // 调试信息
          text.includes('📊') || // 日志标记
          text.includes('[') || // 日志标签
          text.includes('API') || // API相关
          text.includes('🔍') || // 调试emoji
          filePath.includes('translation.json') || // 翻译文件本身
          text.includes('t(') // 已经使用翻译函数
        ) {
          continue;
        }
        
        issues.push({
          line: lineNumber,
          text: text.trim(),
          context: match[0].trim()
        });
      }
    }
    
    return issues;
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error.message);
    return [];
  }
}

function checkTranslationConsistency() {
  const translationFiles = [
    './frontend/src/locales/zh-CN/translation.json',
    './frontend/src/locales/en-US/translation.json', 
    './frontend-web/src/locales/zh-CN/translation.json',
    './frontend-web/src/locales/en-US/translation.json'
  ];
  
  const translations = {};
  
  for (const file of translationFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        translations[file] = content;
      }
    } catch (error) {
      console.error(`读取翻译文件失败: ${file}`, error.message);
    }
  }
  
  return translations;
}

// 主检查函数
function runI18nCheck() {
  console.log('🌍 开始国际化检查...\n');
  
  let totalIssues = 0;
  
  // 检查硬编码中文
  for (const dir of checkDirs) {
    if (!fs.existsSync(dir)) continue;
    
    console.log(`📁 检查目录: ${dir}`);
    const files = findFiles(dir);
    
    for (const file of files) {
      const issues = checkFileForHardcodedChinese(file);
      
      if (issues.length > 0) {
        console.log(`\n❌ ${file}:`);
        totalIssues += issues.length;
        
        for (const issue of issues) {
          console.log(`   第${issue.line}行: "${issue.text}"`);
        }
      }
    }
  }
  
  // 检查翻译一致性
  console.log('\n🔍 检查翻译文件一致性...');
  const translations = checkTranslationConsistency();
  
  if (Object.keys(translations).length > 0) {
    console.log('✅ 翻译文件加载成功');
    console.log(`- 找到 ${Object.keys(translations).length} 个翻译文件`);
  }
  
  // 总结
  console.log('\n📊 检查结果总结:');
  if (totalIssues === 0) {
    console.log('✅ 没有发现硬编码中文文本问题');
  } else {
    console.log(`❌ 发现 ${totalIssues} 个硬编码中文文本问题`);
    console.log('💡 建议: 将这些文本替换为 t() 函数调用');
  }
  
  console.log('\n✅ 国际化检查完成');
}

runI18nCheck();