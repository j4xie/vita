const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to add Swift VolunteerManager to Xcode project
 */
const withVolunteerManager = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    
    console.log('🔧 [Plugin] 添加Swift VolunteerManager文件到Xcode项目...');
    
    // 添加Swift文件到项目
    const sourceFiles = [
      'VolunteerManager.swift',
      'VolunteerManagerBridge.h',
      'VolunteerManagerBridge.m'
    ];
    
    sourceFiles.forEach(fileName => {
      // 添加文件引用
      const fileRef = xcodeProject.generateUuid();
      const buildFile = xcodeProject.generateUuid();
      
      // 添加到文件引用
      xcodeProject.addToPbxFileReferenceSection({
        uuid: fileRef,
        basename: fileName,
        group: 'PomeloX',
        path: fileName,
        fileEncoding: 4,
        lastKnownFileType: fileName.endsWith('.swift') ? 'sourcecode.swift' : 
                           fileName.endsWith('.h') ? 'sourcecode.c.h' : 'sourcecode.c.objc'
      });
      
      // 添加到构建文件
      if (!fileName.endsWith('.h')) { // 头文件不需要编译
        xcodeProject.addToPbxBuildFileSection({
          uuid: buildFile,
          fileRef: fileRef
        });
        
        // 添加到源文件构建阶段
        xcodeProject.addToPbxSourcesBuildPhase({
          uuid: buildFile
        });
      }
      
      console.log(`✅ [Plugin] 已添加 ${fileName} 到Xcode项目`);
    });
    
    // 确保Swift支持
    const target = xcodeProject.getFirstTarget();
    const targetUuid = target.uuid;
    
    // 设置Swift版本
    xcodeProject.addToBuildSettings('SWIFT_VERSION', '5.0', 'Debug');
    xcodeProject.addToBuildSettings('SWIFT_VERSION', '5.0', 'Release');
    
    // 启用Swift支持 - 修复语法
    xcodeProject.addToBuildSettings('SWIFT_OBJC_BRIDGING_HEADER', '"$(SRCROOT)/$(TARGET_NAME)/PomeloX-Bridging-Header.h"', 'Debug');
    xcodeProject.addToBuildSettings('SWIFT_OBJC_BRIDGING_HEADER', '"$(SRCROOT)/$(TARGET_NAME)/PomeloX-Bridging-Header.h"', 'Release');
    
    console.log('✅ [Plugin] Swift支持配置完成');
    
    return config;
  });
};

module.exports = withVolunteerManager;