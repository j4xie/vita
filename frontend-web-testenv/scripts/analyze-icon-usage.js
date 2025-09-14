#!/usr/bin/env node
// 分析图标使用情况
const fs = require('fs');
const path = require('path');

function analyzeIconUsage() {
    console.log('🔍 分析图标使用情况');

    const iconLibraries = {
        'Ionicons': { count: 0, files: [] },
        'MaterialCommunityIcons': { count: 0, files: [] },
        'FontAwesome': { count: 0, files: [] },
        'FontAwesome5': { count: 0, files: [] },
        'FontAwesome6': { count: 0, files: [] },
        'MaterialIcons': { count: 0, files: [] },
        'AntDesign': { count: 0, files: [] },
        'Feather': { count: 0, files: [] },
        'Entypo': { count: 0, files: [] },
        'Fontisto': { count: 0, files: [] }
    };

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                const content = fs.readFileSync(fullPath, 'utf8');

                // 检查每个图标库的使用
                for (const [libName, data] of Object.entries(iconLibraries)) {
                    // 检查导入
                    const importRegex = new RegExp(`import.*${libName}.*from.*vector-icons`, 'g');
                    const importMatches = content.match(importRegex);

                    // 检查使用
                    const usageRegex = new RegExp(`<${libName}|${libName}\\s*name=`, 'g');
                    const usageMatches = content.match(usageRegex);

                    if (importMatches || usageMatches) {
                        const totalMatches = (importMatches?.length || 0) + (usageMatches?.length || 0);
                        data.count += totalMatches;

                        if (!data.files.includes(fullPath)) {
                            data.files.push(fullPath);
                        }
                    }
                }
            }
        }
    }

    scanDirectory('./src');

    console.log('\n📊 图标库使用统计:');
    console.log('=' .repeat(50));

    for (const [libName, data] of Object.entries(iconLibraries)) {
        if (data.count > 0) {
            console.log(`✅ ${libName}: ${data.count}次使用，${data.files.length}个文件`);

            // 显示使用文件
            data.files.slice(0, 3).forEach(file => {
                console.log(`   - ${file.replace('./src/', 'src/')}`);
            });
            if (data.files.length > 3) {
                console.log(`   ... 还有${data.files.length - 3}个文件`);
            }
        } else {
            console.log(`❌ ${libName}: 未使用`);
        }
    }

    // 计算可节省的空间
    const fontSizes = {
        'MaterialCommunityIcons': 1150, // KB
        'FontAwesome6': 424,
        'FontAwesome5': 203,
        'MaterialIcons': 357,
        'Fontisto': 314,
        'FontAwesome': 166,
        'AntDesign': 70,
        'Feather': 56,
        'Entypo': 66
    };

    let totalSavings = 0;
    console.log('\n💾 可优化的字体包:');
    for (const [libName, data] of Object.entries(iconLibraries)) {
        if (data.count === 0 && fontSizes[libName]) {
            console.log(`🗜️ ${libName}: ${fontSizes[libName]}KB (未使用，可移除)`);
            totalSavings += fontSizes[libName];
        }
    }

    console.log(`\n🎯 总计可节省: ${(totalSavings / 1024).toFixed(1)}MB`);
    console.log(`📦 优化后预期大小: ${(3270 - totalSavings) / 1024}MB`);
}

analyzeIconUsage();