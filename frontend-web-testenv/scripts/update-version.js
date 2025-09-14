#!/usr/bin/env node

/**
 * 自动更新版本号脚本
 * 同步更新app.json和iOS原生Info.plist
 */

const fs = require('fs');
const path = require('path');

function updateVersion(type = 'patch') {
  console.log(`📝 开始${type}版本更新...`);
  
  try {
    // 1. 读取当前版本
    const appJsonPath = path.join(__dirname, '../app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const currentVersion = appJson.expo.version;
    const currentBuildNumber = parseInt(appJson.expo.ios.buildNumber);
    
    console.log(`📊 当前版本: ${currentVersion} (${currentBuildNumber})`);
    
    // 2. 计算新版本号
    const versionParts = currentVersion.split('.').map(Number);
    let newVersion, newBuildNumber;
    
    switch (type) {
      case 'major':
        newVersion = `${versionParts[0] + 1}.0.0`;
        newBuildNumber = currentBuildNumber + 1;
        break;
      case 'minor':
        newVersion = `${versionParts[0]}.${versionParts[1] + 1}.0`;
        newBuildNumber = currentBuildNumber + 1;
        break;
      case 'patch':
      default:
        newVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`;
        newBuildNumber = currentBuildNumber + 1;
        break;
    }
    
    console.log(`🎯 新版本: ${newVersion} (${newBuildNumber})`);
    
    // 3. 更新app.json
    appJson.expo.version = newVersion;
    appJson.expo.ios.buildNumber = newBuildNumber.toString();
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ 已更新app.json');
    
    // 4. 更新iOS原生Info.plist
    const infoPlistPath = path.join(__dirname, '../ios/PomeloX/Info.plist');
    
    if (fs.existsSync(infoPlistPath)) {
      let plistContent = fs.readFileSync(infoPlistPath, 'utf8');
      
      // 更新CFBundleShortVersionString (使用更安全的替换)
      const versionRegex = /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/;
      plistContent = plistContent.replace(versionRegex, `$1${newVersion}$2`);
      
      // 更新CFBundleVersion
      const buildRegex = /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/;
      plistContent = plistContent.replace(buildRegex, `$1${newBuildNumber}$2`);
      
      fs.writeFileSync(infoPlistPath, plistContent);
      console.log('✅ 已更新iOS Info.plist');
    } else {
      console.log('⚠️ iOS Info.plist文件未找到，跳过原生版本更新');
    }
    
    console.log(`🎉 版本更新完成: ${currentVersion} → ${newVersion}`);
    return { newVersion, newBuildNumber };
  } catch (error) {
    console.error('❌ 版本更新失败:', error);
    process.exit(1);
  }
}

// 命令行调用
if (require.main === module) {
  const type = process.argv[2] || 'patch';
  updateVersion(type);
}

module.exports = { updateVersion };