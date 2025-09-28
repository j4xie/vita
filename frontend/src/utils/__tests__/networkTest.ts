/**
 * 网络连通性测试工具
 * 用于诊断iOS开发环境的网络问题
 */

import { getApiUrl } from '../environment';

export const testNetworkConnectivity = async (): Promise<{
  success: boolean;
  details: string;
  suggestions: string[];
}> => {
  console.log('🔍 开始网络连通性测试...');
  
  const tests = [
    {
      name: '测试基础网络',
      url: 'https://httpbin.org/get',
      timeout: 5000
    },
    {
      name: '测试目标域名',
      url: `${getApiUrl()}/app/activity/list`,
      timeout: 10000
    },
    {
      name: '测试简化请求',
      url: getApiUrl(),
      timeout: 5000
    }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🔄 ${test.name}: ${test.url}`);
      
      const startTime = Date.now();
      
      // 最简单的fetch请求，无额外配置
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      
      results.push({
        test: test.name,
        success: true,
        status: response.status,
        duration: `${duration}ms`
      });
      
      console.log(`✅ ${test.name}: ${response.status} (${duration}ms)`);
      
    } catch (error: any) {
      results.push({
        test: test.name,
        success: false,
        error: error.message,
        name: error.name
      });
      
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  // 分析结果
  const successCount = results.filter(r => r.success).length;
  const allSuccess = successCount === tests.length;
  
  let suggestions = [];
  
  if (!allSuccess) {
    if (successCount === 0) {
      suggestions = [
        '完全无法访问网络，检查iOS模拟器网络设置',
        '尝试重启iOS模拟器',
        '检查Mac的网络连接'
      ];
    } else {
      suggestions = [
        '部分网络正常，可能是特定域名问题',
        '尝试使用真机测试',
        '考虑使用Expo Dev Client'
      ];
    }
  } else {
    suggestions = ['网络连通性正常'];
  }
  
  console.log('📊 网络测试结果:', {
    总测试数: tests.length,
    成功数: successCount,
    成功率: `${Math.round(successCount / tests.length * 100)}%`,
    详情: results
  });
  
  return {
    success: allSuccess,
    details: `${successCount}/${tests.length} tests passed`,
    suggestions
  };
};

/**
 * iOS模拟器网络问题诊断
 */
export const diagnoseIOSNetworkIssue = () => {
  console.log('🔍 iOS网络问题诊断:');
  console.log('1. 检查系统网络连接');
  console.log('2. 重启iOS模拟器');
  console.log('3. 清理Expo缓存: npx expo prebuild -p ios --clean');
  console.log('4. 使用真机测试');
  console.log('5. 检查Info.plist的ATS配置');
};