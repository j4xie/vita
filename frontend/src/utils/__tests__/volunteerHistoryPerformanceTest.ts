/**
 * 志愿者历史记录功能性能测试套件
 * 确保所有用户场景的性能符合优化标准
 */

import { getVolunteerHistoryRecords } from '../../services/volunteerAPI';
import { getUserPermissionLevel } from '../../types/userPermissions';

interface PerformanceMetrics {
  apiCallTime: number;
  dataProcessingTime: number;
  renderTime: number;
  memoryUsage: number;
}

/**
 * 测试API调用性能
 */
const testAPIPerformance = async (
  userId: number,
  days: 1 | 3 | 7 | 30,
  permission: 'manage' | 'part_manage' | 'staff'
): Promise<PerformanceMetrics> => {
  const startTime = performance.now();
  const memoryStart = (performance as any).memory?.usedJSHeapSize || 0;

  try {
    // 测试API调用
    const apiStartTime = performance.now();
    const result = await getVolunteerHistoryRecords(userId, days, permission);
    const apiEndTime = performance.now();

    // 测试数据处理
    const processStartTime = performance.now();
    const records = result.rows || [];
    
    // 模拟复杂数据处理 (排序、格式化等)
    const processedRecords = records
      .map(record => ({
        ...record,
        formattedStartTime: new Date(record.startTime).toLocaleDateString(),
        duration: record.endTime ? 
          Math.floor((new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / (1000 * 60)) : 
          null
      }))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    const processEndTime = performance.now();
    const renderEndTime = performance.now(); // 模拟渲染时间
    
    const memoryEnd = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      apiCallTime: apiEndTime - apiStartTime,
      dataProcessingTime: processEndTime - processStartTime,
      renderTime: renderEndTime - startTime,
      memoryUsage: memoryEnd - memoryStart
    };
  } catch (error) {
    console.error('性能测试失败:', error);
    return {
      apiCallTime: -1,
      dataProcessingTime: -1, 
      renderTime: -1,
      memoryUsage: -1
    };
  }
};

/**
 * 测试不同权限用户的性能表现
 */
export const testVolunteerHistoryPerformance = async () => {
  console.log('🚀 [PERFORMANCE-TEST] 开始志愿者历史记录性能测试...');

  const testScenarios = [
    // Staff用户场景
    { userId: 104, permission: 'staff' as const, days: 1 as const, scenario: 'Staff查询1天记录' },
    { userId: 104, permission: 'staff' as const, days: 7 as const, scenario: 'Staff查询7天记录' },
    
    // 分管理员场景  
    { userId: 102, permission: 'part_manage' as const, days: 1 as const, scenario: '分管理员查询1天记录' },
    { userId: 102, permission: 'part_manage' as const, days: 7 as const, scenario: '分管理员查询7天记录' },
    
    // 总管理员场景
    { userId: 101, permission: 'manage' as const, days: 7 as const, scenario: '总管理员查询7天记录' },
    { userId: 101, permission: 'manage' as const, days: 30 as const, scenario: '总管理员查询30天记录' },
  ];

  const results: Array<{
    scenario: string;
    metrics: PerformanceMetrics;
    passed: boolean;
  }> = [];

  for (const test of testScenarios) {
    try {
      console.log(`🧪 [TEST-SCENARIO] 执行测试: ${test.scenario}`);
      
      const metrics = await testAPIPerformance(test.userId, test.days, test.permission);
      
      // 性能基准检查
      const passed = (
        metrics.apiCallTime >= 0 && metrics.apiCallTime < 2000 &&  // API调用 <2秒
        metrics.dataProcessingTime >= 0 && metrics.dataProcessingTime < 100 && // 数据处理 <100ms
        metrics.renderTime >= 0 && metrics.renderTime < 300 && // 总渲染时间 <300ms
        metrics.memoryUsage < 5 * 1024 * 1024 // 内存使用 <5MB
      );
      
      results.push({
        scenario: test.scenario,
        metrics,
        passed
      });

      console.log(`📊 [METRICS] ${test.scenario}:`, {
        API调用时间: `${metrics.apiCallTime.toFixed(1)}ms`,
        数据处理时间: `${metrics.dataProcessingTime.toFixed(1)}ms`, 
        总渲染时间: `${metrics.renderTime.toFixed(1)}ms`,
        内存使用: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        性能达标: passed ? '✅' : '❌'
      });

    } catch (error) {
      console.error(`❌ [TEST-ERROR] ${test.scenario} 测试失败:`, error);
      results.push({
        scenario: test.scenario,
        metrics: { apiCallTime: -1, dataProcessingTime: -1, renderTime: -1, memoryUsage: -1 },
        passed: false
      });
    }
  }

  // 性能测试总结
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const performanceScore = (passedTests / totalTests) * 100;

  console.log('📈 [PERFORMANCE-SUMMARY] 志愿者历史记录性能测试结果:', {
    总测试数: totalTests,
    通过测试数: passedTests,
    性能得分: `${performanceScore.toFixed(1)}%`,
    整体评级: performanceScore >= 90 ? '优秀' : 
             performanceScore >= 80 ? '良好' : 
             performanceScore >= 70 ? '及格' : '需要优化',
    详细结果: results.map(r => ({
      场景: r.scenario,
      通过: r.passed ? '✅' : '❌',
      API时间: `${r.metrics.apiCallTime.toFixed(1)}ms`,
      渲染时间: `${r.metrics.renderTime.toFixed(1)}ms`
    }))
  });

  return {
    performanceScore,
    passedTests,
    totalTests,
    results
  };
};

/**
 * 测试内存使用情况
 */
export const testMemoryUsage = () => {
  if (!(performance as any).memory) {
    console.warn('⚠️ [MEMORY-TEST] 当前环境不支持内存监控');
    return null;
  }

  const memory = (performance as any).memory;
  const memoryUsage = {
    used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
    usagePercent: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1) + '%'
  };

  console.log('🧠 [MEMORY-USAGE] 当前内存使用情况:', memoryUsage);
  
  // 内存警告阈值
  const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  if (usagePercent > 80) {
    console.warn('⚠️ [MEMORY-WARNING] 内存使用率超过80%，建议优化');
  }

  return memoryUsage;
};

/**
 * 运行完整的历史记录功能测试套件
 */
export const runVolunteerHistoryTests = async () => {
  console.log('🚀 [HISTORY-TESTS] 开始志愿者历史记录功能测试...');
  
  try {
    // 1. 性能测试
    const performanceResult = await testVolunteerHistoryPerformance();
    
    // 2. 内存使用测试
    const memoryResult = testMemoryUsage();
    
    // 3. 综合评估
    const overallScore = performanceResult.performanceScore;
    const memoryHealth = memoryResult ? parseFloat(memoryResult.usagePercent) < 80 : true;
    
    console.log('🎯 [TEST-CONCLUSION] 志愿者历史记录功能测试完成:', {
      性能得分: `${overallScore.toFixed(1)}%`,
      内存健康: memoryHealth ? '✅ 良好' : '⚠️ 需要优化',
      功能状态: overallScore >= 80 && memoryHealth ? '✅ 可上线' : '⚠️ 需要优化',
      建议: overallScore >= 90 ? '性能优秀，可以上线' :
           overallScore >= 80 ? '性能良好，建议监控' :
           '需要进一步性能优化'
    });

    return {
      performanceScore: overallScore,
      memoryHealth,
      canDeploy: overallScore >= 80 && memoryHealth
    };
    
  } catch (error) {
    console.error('❌ [TEST-FAILURE] 历史记录功能测试失败:', error);
    return {
      performanceScore: 0,
      memoryHealth: false, 
      canDeploy: false
    };
  }
};