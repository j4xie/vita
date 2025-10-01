/**
 * 快速调试脚本 - 检查ActivityListScreen是否正确加载
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 快速代码检查...\n');

// 检查关键文件是否存在
const filesToCheck = [
  'src/screens/activities/ActivityListScreen.tsx',
  'src/services/PomeloXAPI.ts',
  'src/utils/environment.ts',
  'src/utils/activityAdapter.ts',
  '.env'
];

console.log('1️⃣ 检查关键文件:');
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n2️⃣ 检查环境配置:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line =>
    line.includes('EXPO_PUBLIC_ENVIRONMENT') ||
    line.includes('EXPO_PUBLIC_API_URL')
  );
  lines.forEach(line => console.log(`   ${line}`));
} else {
  console.log('   ❌ .env文件不存在');
}

console.log('\n3️⃣ 检查ActivityListScreen代码问题:');
const screenPath = path.join(__dirname, 'src/screens/activities/ActivityListScreen.tsx');
if (fs.existsSync(screenPath)) {
  const content = fs.readFileSync(screenPath, 'utf8');

  // 检查关键代码
  const checks = [
    { name: 'fetchActivities函数', pattern: /const fetchActivities = useCallback/i },
    { name: '初始加载useEffect', pattern: /useEffect\(\(\) => \{[^}]*fetchActivities\(1\)/i },
    { name: 'pomeloXAPI导入', pattern: /import.*pomeloXAPI.*from.*PomeloXAPI/i },
    { name: 'FlatList或SectionList', pattern: /<SectionList|<FlatList/i },
    { name: 'ListEmptyComponent', pattern: /ListEmptyComponent/i }
  ];

  checks.forEach(({ name, pattern }) => {
    const found = pattern.test(content);
    console.log(`   ${found ? '✅' : '❌'} ${name}`);
  });

  // 检查是否有明显的错误
  if (content.includes('console.log') && content.includes('[FETCH-ACTIVITIES]')) {
    console.log('   ✅ 调试日志已添加');
  } else {
    console.log('   ⚠️  调试日志可能不完整');
  }
} else {
  console.log('   ❌ ActivityListScreen.tsx文件不存在');
}

console.log('\n4️⃣ 常见问题检查:');

// 检查是否有语法错误
const checkSyntax = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // 简单的语法检查
    const issues = [];

    // 检查未闭合的括号
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`括号不匹配 (${openBraces} 个 { vs ${closeBraces} 个 })`);
    }

    // 检查未闭合的引号（简单检查）
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      issues.push('可能有未闭合的引号');
    }

    return issues;
  } catch (e) {
    return [`读取文件失败: ${e.message}`];
  }
};

const syntaxIssues = checkSyntax(screenPath);
if (syntaxIssues.length === 0) {
  console.log('   ✅ 没有明显的语法错误');
} else {
  console.log('   ⚠️  可能的问题:');
  syntaxIssues.forEach(issue => console.log(`      - ${issue}`));
}

console.log('\n5️⃣ 建议的调试步骤:');
console.log('   1. 在模拟器中打开应用');
console.log('   2. 按 Cmd+D 打开开发菜单');
console.log('   3. 选择 "Enable Remote JS Debugging"');
console.log('   4. 在Chrome DevTools Console中查看日志');
console.log('   5. 查找 "[ACTIVITY-LIST]" 和 "[FETCH-ACTIVITIES]" 日志');
console.log('\n   或者，查看Metro Bundler终端输出中的日志');

console.log('\n============================================');
console.log('检查完成！');
console.log('============================================\n');