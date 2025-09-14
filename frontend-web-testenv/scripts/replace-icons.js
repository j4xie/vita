#!/usr/bin/env node
// 批量替换图标导入
const fs = require('fs');
const path = require('path');

function replaceIconImports() {
    console.log('🔄 批量替换图标导入...');

    let filesProcessed = 0;
    let replacements = 0;

    function processDirectory(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                processDirectory(fullPath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let modified = false;

                // 替换@expo/vector-icons导入为轻量级版本
                const oldImport = /import\s*{\s*Ionicons\s*}\s*from\s*['"]@expo\/vector-icons['"];?/g;
                if (content.match(oldImport)) {
                    content = content.replace(
                        oldImport,
                        "import { Ionicons } from '../../../utils/LightweightIcons';"
                    );
                    modified = true;
                    replacements++;
                }

                // 处理不同层级的相对路径
                const patterns = [
                    { from: '../../../utils/', to: '../../../utils/' },
                    { from: '../../utils/', to: '../../../utils/' },
                    { from: '../utils/', to: '../../utils/' },
                    { from: './utils/', to: '../utils/' }
                ];

                // 根据文件层级调整导入路径
                const relativePath = fullPath.replace('./src/', '');
                const depth = relativePath.split('/').length - 1;
                let correctPath = '';

                for (let i = 0; i < depth; i++) {
                    correctPath += '../';
                }
                correctPath += 'utils/LightweightIcons';

                if (modified) {
                    // 修正导入路径
                    content = content.replace(
                        /import\s*{\s*Ionicons\s*}\s*from\s*['"][^'"]*LightweightIcons['"];?/g,
                        `import { Ionicons } from '${correctPath}';`
                    );

                    fs.writeFileSync(fullPath, content, 'utf8');
                    filesProcessed++;

                    console.log(`✅ 处理: ${fullPath.replace('./src/', 'src/')}`);
                }
            }
        }
    }

    processDirectory('./src');

    console.log(`\n🎉 图标导入替换完成!`);
    console.log(`📊 处理文件数: ${filesProcessed}`);
    console.log(`🔄 替换次数: ${replacements}`);
    console.log(`💾 预期节省: ~2.7MB (去除所有非Ionicons字体)`);
}

replaceIconImports();