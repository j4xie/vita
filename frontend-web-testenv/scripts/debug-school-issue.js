#!/usr/bin/env node
// 调试学校选择器问题
const fs = require('fs');

function debugSchoolIssue() {
    console.log('🔍 调试Web端学校选择器问题');

    // 1. 检查WebSchoolSelector组件
    console.log('\n📋 检查WebSchoolSelector组件...');

    const webSchoolSelector = fs.readFileSync('../frontend-web/src/components/web/WebSchoolSelector.tsx', 'utf8');

    // 检查关键功能
    const hasFlatList = webSchoolSelector.includes('FlatList');
    const hasRenderItem = webSchoolSelector.includes('renderItem');
    const hasKeyExtractor = webSchoolSelector.includes('keyExtractor');
    const hasWebOptimization = webSchoolSelector.includes('Platform.OS === \'web\'');

    console.log('- FlatList使用:', hasFlatList ? '✅' : '❌');
    console.log('- renderItem配置:', hasRenderItem ? '✅' : '❌');
    console.log('- keyExtractor配置:', hasKeyExtractor ? '✅' : '❌');
    console.log('- Web端优化:', hasWebOptimization ? '✅' : '❌');

    // 2. 检查API调用
    console.log('\n📡 检查API调用...');

    const registrationScreen = fs.readFileSync('../frontend-web/src/screens/auth/NormalParentRegisterScreen.tsx', 'utf8');

    const hasFetchSchoolList = registrationScreen.includes('fetchSchoolList');
    const hasErrorHandling = registrationScreen.includes('catch.*error');
    const hasLoadingState = registrationScreen.includes('setSchoolsLoading');
    const hasDataFiltering = registrationScreen.includes('filteredSchools');

    console.log('- fetchSchoolList调用:', hasFetchSchoolList ? '✅' : '❌');
    console.log('- 错误处理:', hasErrorHandling ? '✅' : '❌');
    console.log('- 加载状态:', hasLoadingState ? '✅' : '❌');
    console.log('- 数据过滤:', hasDataFiltering ? '✅' : '❌');

    // 3. 检查学校数据类型
    console.log('\n📚 检查学校数据结构...');

    try {
        const schoolDataFile = fs.readFileSync('../frontend-web/src/utils/schoolData.ts', 'utf8');

        const hasSchoolInterface = schoolDataFile.includes('interface SchoolData');
        const hasCreateFunction = schoolDataFile.includes('createSchoolDataFromBackend');

        console.log('- SchoolData接口:', hasSchoolInterface ? '✅' : '❌');
        console.log('- 数据转换函数:', hasCreateFunction ? '✅' : '❌');

    } catch (error) {
        console.log('- 学校数据文件:', '❌ 不存在');
    }

    // 4. 可能的问题原因
    console.log('\n🚨 可能的问题原因:');
    console.log('1. API请求失败 - 检查网络控制台');
    console.log('2. CORS问题 - 检查服务器CORS设置');
    console.log('3. Web端FlatList兼容性 - 需要WebFlatList');
    console.log('4. 数据过滤过度 - filteredSchools为空');
    console.log('5. Modal渲染问题 - Web端Modal可能有问题');

    // 5. 推荐修复方案
    console.log('\n💡 推荐修复方案:');
    console.log('1. 替换FlatList为Web兼容的列表组件');
    console.log('2. 添加调试日志检查schools数据');
    console.log('3. 检查API响应和错误处理');
    console.log('4. 使用Web原生select替代Modal');
}

debugSchoolIssue();