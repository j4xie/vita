#!/usr/bin/env node
// 字体优化脚本 - 直接删除大字体文件
const fs = require('fs');
const path = require('path');

function optimizeFonts() {
    console.log('🗜️ 开始字体优化 - 删除大字体文件');

    // 查找所有可能的字体文件位置
    const fontPaths = [
        'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts',
        'node_modules/@expo/vector-icons/src/vendor/react-native-vector-icons/Fonts',
        'node_modules/@expo/vector-icons/vendor/react-native-vector-icons/Fonts',
        // 可能的其他位置
        'node_modules/react-native-vector-icons/Fonts',
        'node_modules/@expo/vector-icons/Fonts'
    ];

    // 要删除的大字体文件
    const fontFilesToRemove = [
        'MaterialCommunityIcons.ttf',    // 1.1MB
        'FontAwesome6_Solid.ttf',        // 414KB
        'FontAwesome5_Solid.ttf',        // 198KB
        'Fontisto.ttf',                  // 306KB
        'MaterialIcons.ttf',             // 348KB
        'Foundation.ttf',                // 56KB
        'Octicons.ttf',                  // 48KB
        'EvilIcons.ttf',                 // 13KB
        'Zocial.ttf',                    // 25KB
        'FontAwesome6_Brands.ttf',       // 204KB
        'FontAwesome5_Brands.ttf',       // 131KB
        'FontAwesome6_Regular.ttf',      // 66KB
        'FontAwesome5_Regular.ttf',      // 33KB
        'FontAwesome.ttf',               // 162KB
        'AntDesign.ttf',                 // 69KB
        'Entypo.ttf',                    // 65KB
        'Feather.ttf',                   // 55KB
        'SimpleLineIcons.ttf'            // 53KB
    ];

    let totalSaved = 0;
    let filesProcessed = 0;

    for (const fontDir of fontPaths) {
        if (fs.existsSync(fontDir)) {
            console.log(`\n📁 处理目录: ${fontDir}`);

            for (const fontFile of fontFilesToRemove) {
                const fullPath = path.join(fontDir, fontFile);

                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    const sizeKB = (stats.size / 1024).toFixed(0);

                    // 备份并删除
                    const backupPath = fullPath + '.backup';

                    try {
                        // 先备份
                        if (!fs.existsSync(backupPath)) {
                            fs.copyFileSync(fullPath, backupPath);
                        }

                        // 删除原文件
                        fs.unlinkSync(fullPath);

                        console.log(`  ✅ 删除: ${fontFile} (${sizeKB}KB)`);
                        totalSaved += parseInt(sizeKB);
                        filesProcessed++;

                    } catch (error) {
                        console.log(`  ❌ 删除失败: ${fontFile} - ${error.message}`);
                    }
                } else {
                    console.log(`  ⚪ 不存在: ${fontFile}`);
                }
            }
        }
    }

    console.log(`\n🎉 字体优化完成!`);
    console.log(`📊 删除文件数: ${filesProcessed}`);
    console.log(`💾 节省空间: ${(totalSaved / 1024).toFixed(1)}MB`);
    console.log(`✅ 只保留Ionicons字体 (~432KB)`);

    // 显示剩余的字体文件
    console.log(`\n📋 剩余字体文件:`);
    for (const fontDir of fontPaths) {
        if (fs.existsSync(fontDir)) {
            const remainingFiles = fs.readdirSync(fontDir).filter(f => f.endsWith('.ttf'));
            remainingFiles.forEach(file => {
                const fullPath = path.join(fontDir, file);
                const stats = fs.statSync(fullPath);
                const sizeKB = (stats.size / 1024).toFixed(0);
                console.log(`  ✅ 保留: ${file} (${sizeKB}KB)`);
            });
        }
    }
}

optimizeFonts();