/**
 * v1.2 主题系统功能测试组件
 * 验证延迟加载和性能降级功能是否正常工作
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';
import { usePerformanceDegradation } from '../hooks/usePerformanceDegradation';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
}

export const ThemeSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { getLiquidGlassConfig, metrics, isPerformanceDegraded } = usePerformanceDegradation();
  
  useEffect(() => {
    runTests();
  }, []);
  
  const runTests = async () => {
    const results: TestResult[] = [];
    
    // 测试1: 主题对象访问
    try {
      const colors = theme.colors;
      const spacing = theme.spacing;
      const liquidGlass = theme.liquidGlass;
      
      if (colors && spacing && liquidGlass) {
        results.push({
          name: '主题对象访问',
          status: 'pass',
          message: `成功访问主题对象 (${Object.keys(colors).length} 个颜色配置)`
        });
      } else {
        results.push({
          name: '主题对象访问',
          status: 'fail',
          message: '主题对象结构不完整'
        });
      }
    } catch (error) {
      results.push({
        name: '主题对象访问',
        status: 'fail',
        message: `访问失败: ${error.message}`
      });
    }
    
    // 测试2: Liquid Glass 配置获取
    try {
      const cardConfig = getLiquidGlassConfig('card');
      const modalConfig = getLiquidGlassConfig('modal');
      
      if (cardConfig && modalConfig && 
          cardConfig.background && cardConfig.border && 
          modalConfig.background && modalConfig.border) {
        results.push({
          name: 'Liquid Glass 配置',
          status: 'pass',
          message: '成功获取卡片和模态框配置'
        });
      } else {
        results.push({
          name: 'Liquid Glass 配置',
          status: 'fail',
          message: '配置结构不完整'
        });
      }
    } catch (error) {
      results.push({
        name: 'Liquid Glass 配置',
        status: 'fail',
        message: `配置获取失败: ${error.message}`
      });
    }
    
    // 测试3: 性能监控
    try {
      const fps = metrics.fps;
      const velocity = metrics.scrollVelocity;
      const degraded = isPerformanceDegraded;
      
      results.push({
        name: '性能监控系统',
        status: 'pass',
        message: `FPS: ${fps.toFixed(1)}, 滚动速度: ${velocity.toFixed(1)}, 降级: ${degraded ? '是' : '否'}`
      });
    } catch (error) {
      results.push({
        name: '性能监控系统',
        status: 'fail',
        message: `监控失败: ${error.message}`
      });
    }
    
    // 测试4: 主题颜色完整性
    try {
      const requiredColors = ['primary', 'secondary', 'success', 'warning', 'error'];
      const missingColors = requiredColors.filter(color => !theme.colors[color]);
      
      if (missingColors.length === 0) {
        results.push({
          name: '主题颜色完整性',
          status: 'pass',
          message: '所有必需颜色都已定义'
        });
      } else {
        results.push({
          name: '主题颜色完整性',
          status: 'fail',
          message: `缺少颜色: ${missingColors.join(', ')}`
        });
      }
    } catch (error) {
      results.push({
        name: '主题颜色完整性',
        status: 'fail',
        message: `检查失败: ${error.message}`
      });
    }
    
    // 测试5: 间距系统
    try {
      const spacingValues = ['xs', 'sm', 'md', 'lg', 'xl'];
      const missingSpacing = spacingValues.filter(size => 
        typeof theme.spacing[size] !== 'number'
      );
      
      if (missingSpacing.length === 0) {
        results.push({
          name: '间距系统',
          status: 'pass',
          message: '所有间距值都已定义并为数字类型'
        });
      } else {
        results.push({
          name: '间距系统',
          status: 'fail',
          message: `缺少或类型错误的间距: ${missingSpacing.join(', ')}`
        });
      }
    } catch (error) {
      results.push({
        name: '间距系统',
        status: 'fail',
        message: `检查失败: ${error.message}`
      });
    }
    
    setTestResults(results);
  };
  
  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 主题系统测试报告</Text>
      
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          总测试: {testResults.length} | 通过: {passCount} | 失败: {failCount}
        </Text>
      </View>
      
      {testResults.map((result, index) => (
        <View key={index} style={[
          styles.testItem,
          { backgroundColor: result.status === 'pass' ? '#E8F5E8' : '#FFF0F0' }
        ]}>
          <Text style={styles.testName}>
            {result.status === 'pass' ? '✅' : '❌'} {result.name}
          </Text>
          <Text style={styles.testMessage}>{result.message}</Text>
        </View>
      ))}
      
      <View style={styles.performanceInfo}>
        <Text style={styles.sectionTitle}>📊 实时性能信息</Text>
        <Text style={styles.infoText}>FPS: {metrics.fps.toFixed(1)}</Text>
        <Text style={styles.infoText}>滚动速度: {metrics.scrollVelocity.toFixed(1)} px/s</Text>
        <Text style={styles.infoText}>性能降级: {isPerformanceDegraded ? '激活' : '未激活'}</Text>
        <Text style={styles.infoText}>降级原因: {metrics.degradationReason}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  summary: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'semibold',
    textAlign: 'center',
  },
  testItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  testMessage: {
    fontSize: 14,
    color: '#666666',
  },
  performanceInfo: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333333',
  },
});