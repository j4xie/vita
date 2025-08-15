/**
 * v1.2 性能压力测试
 * 验证性能监控、降级系统和边界条件处理
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Button, 
  FlatList,
  Animated,
  Dimensions 
} from 'react-native';
import { ActivityCard } from '../components/cards/ActivityCard';
import { usePerformanceDegradation } from '../hooks/usePerformanceDegradation';

const { width } = Dimensions.get('window');

// 生成大量模拟数据用于压力测试
const generateMockActivities = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `stress-test-${index}`,
    title: `压力测试活动 ${index + 1}`,
    subtitle: `性能监控测试用例 #${index + 1}`,
    location: `测试地点 ${index % 10 + 1}`,
    date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString(),
    time: `${(index % 12 + 10)}:00`,
    image: `https://picsum.photos/400/240?random=${index}`,
    attendees: Math.floor(Math.random() * 50),
    maxAttendees: 50,
    status: ['upcoming', 'ongoing', 'almost_full'][index % 3],
    price: index % 3 === 0 ? 0 : Math.floor(Math.random() * 200) + 50,
    isFree: index % 3 === 0,
    category: ['technology', 'business', 'social', 'education'][index % 4],
    organizer: {
      name: `测试机构 ${index % 5 + 1}`,
      verified: index % 2 === 0,
    },
  }));
};

export const PerformanceStressTest: React.FC = () => {
  const [activities, setActivities] = useState(generateMockActivities(10));
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [cardCount, setCardCount] = useState(10);
  
  const { 
    metrics, 
    isPerformanceDegraded, 
    handleScrollEvent,
    resetMetrics,
    getLiquidGlassConfig,
    getOptimizedStyles 
  } = usePerformanceDegradation();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const animatedValues = useRef<Animated.Value[]>([]);
  
  // 初始化动画值
  useEffect(() => {
    animatedValues.current = activities.map(() => new Animated.Value(1));
  }, [activities.length]);
  
  const addTestResult = (result: string) => {
    setTestResults(prev => [
      `${new Date().toLocaleTimeString()}: ${result}`,
      ...prev.slice(0, 19) // 保持最多20条记录
    ]);
  };
  
  // 压力测试：增加卡片数量
  const runCardStressTest = (count: number) => {
    setCardCount(count);
    setActivities(generateMockActivities(count));
    addTestResult(`📦 创建 ${count} 个ActivityCard组件`);
  };
  
  // 压力测试：模拟高频滚动
  const runScrollStressTest = () => {
    setIsStressTesting(true);
    addTestResult('🏃‍♂️ 开始高频滚动压力测试');
    
    let scrollPosition = 0;
    const scrollInterval = setInterval(() => {
      scrollPosition += 50;
      
      // 模拟滚动事件
      const mockEvent = {
        nativeEvent: {
          contentOffset: { y: scrollPosition }
        }
      };
      
      handleScrollEvent(mockEvent);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: scrollPosition, animated: true });
      }
      
      // 测试10秒后停止
      if (scrollPosition > 2000) {
        clearInterval(scrollInterval);
        setIsStressTesting(false);
        addTestResult('✅ 高频滚动测试完成');
      }
    }, 50); // 每50ms滚动一次，模拟快速滚动
  };
  
  // 动画压力测试
  const runAnimationStressTest = () => {
    addTestResult('🎭 开始动画压力测试');
    
    // 同时触发所有卡片的动画
    const animations = animatedValues.current.map((animValue, index) => 
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(animValue, {
          toValue: 1,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
      ])
    );
    
    Animated.stagger(100, animations).start(() => {
      addTestResult('✅ 动画压力测试完成');
    });
  };
  
  // 边界条件测试
  const runBoundaryTests = () => {
    addTestResult('🔍 开始边界条件测试');
    
    // 测试1: 空主题访问
    try {
      const config = getLiquidGlassConfig('nonexistent' as any);
      addTestResult(`✅ 空主题处理: ${config ? '有降级' : '无降级'}`);
    } catch (error) {
      addTestResult(`❌ 空主题处理失败: ${error.message}`);
    }
    
    // 测试2: 极端性能参数
    try {
      const styles = getOptimizedStyles();
      addTestResult(`✅ 性能样式获取: ${JSON.stringify(styles).length} 字符`);
    } catch (error) {
      addTestResult(`❌ 性能样式失败: ${error.message}`);
    }
    
    // 测试3: 重置功能
    try {
      resetMetrics();
      addTestResult('✅ 性能指标重置成功');
    } catch (error) {
      addTestResult(`❌ 重置失败: ${error.message}`);
    }
  };
  
  // 清空测试结果
  const clearResults = () => {
    setTestResults([]);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚡ 性能压力测试</Text>
      
      {/* 实时性能指标 */}
      <View style={[
        styles.metricsPanel,
        isPerformanceDegraded && styles.degradedPanel
      ]}>
        <Text style={styles.metricsTitle}>
          📊 实时性能指标 {isPerformanceDegraded ? '⚠️ 降级激活' : '✅ 正常'}
        </Text>
        <Text style={styles.metricText}>FPS: {metrics.fps.toFixed(1)}</Text>
        <Text style={styles.metricText}>
          滚动速度: {metrics.scrollVelocity.toFixed(1)} px/s
        </Text>
        <Text style={styles.metricText}>降级原因: {metrics.degradationReason}</Text>
        <Text style={styles.metricText}>卡片数量: {cardCount}</Text>
      </View>
      
      {/* 测试控制按钮 */}
      <ScrollView horizontal style={styles.buttonContainer}>
        <Button
          title="10 卡片"
          onPress={() => runCardStressTest(10)}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="50 卡片"
          onPress={() => runCardStressTest(50)}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="100 卡片"
          onPress={() => runCardStressTest(100)}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="滚动测试"
          onPress={runScrollStressTest}
          disabled={isStressTesting}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="动画测试"
          onPress={runAnimationStressTest}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="边界测试"
          onPress={runBoundaryTests}
        />
      </ScrollView>
      
      {/* 测试结果日志 */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>📋 测试日志</Text>
          <Button title="清空" onPress={clearResults} />
        </View>
        <ScrollView style={styles.resultsList}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultItem}>{result}</Text>
          ))}
        </ScrollView>
      </View>
      
      {/* 活动卡片列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.cardsContainer}
        onScroll={handleScrollEvent}
        scrollEventThrottle={16}
      >
        <Text style={styles.cardsTitle}>
          📱 ActivityCard 列表 ({activities.length} 项)
        </Text>
        {activities.map((activity, index) => (
          <Animated.View
            key={activity.id}
            style={[
              styles.cardWrapper,
              { transform: [{ scale: animatedValues.current[index] || 1 }] }
            ]}
          >
            <ActivityCard
              activity={activity}
              onPress={() => addTestResult(`点击: ${activity.title}`)}
              onFavorite={() => addTestResult(`收藏: ${activity.title}`)}
              onRegister={() => addTestResult(`注册: ${activity.title}`)}
            />
          </Animated.View>
        ))}
        
        {/* 底部填充，确保可以滚动测试 */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#1A1A1A',
  },
  metricsPanel: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4ADE80',
  },
  degradedPanel: {
    backgroundColor: '#FFF0F0',
    borderColor: '#EF4444',
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  metricText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  buttonSpacer: {
    width: 8,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 200,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  resultsList: {
    flex: 1,
    padding: 8,
  },
  resultItem: {
    fontSize: 12,
    color: '#333333',
    marginBottom: 4,
    lineHeight: 16,
  },
  cardsContainer: {
    flex: 1,
  },
  cardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333333',
  },
  cardWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomPadding: {
    height: 200,
  },
});