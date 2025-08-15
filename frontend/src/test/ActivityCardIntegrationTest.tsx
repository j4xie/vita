/**
 * ActivityCard 集成测试
 * 验证卡片组件在新主题系统和性能降级下的工作情况
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import { ActivityCard } from '../components/cards/ActivityCard';

// 模拟活动数据
const mockActivity = {
  id: 'test-activity-1',
  title: '测试活动：主题系统验证',
  subtitle: 'v1.2 Liquid Glass UI 测试',
  location: '上海市浦东新区',
  date: '2025-08-15T10:00:00Z',
  time: '10:00',
  image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
  attendees: 15,
  maxAttendees: 50,
  status: 'upcoming',
  price: 0,
  isFree: true,
  category: 'technology',
  organizer: {
    name: '测试机构',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    verified: true,
  },
};

const mockActivity2 = {
  id: 'test-activity-2',
  title: '付费活动测试',
  subtitle: '性能监控与降级验证',
  location: '北京市海淀区',
  date: '2025-08-20T14:00:00Z',
  time: '14:00',
  image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400',
  attendees: 45,
  maxAttendees: 50,
  status: 'almost_full',
  price: 99,
  isFree: false,
  category: 'business',
  organizer: {
    name: '商务活动组',
    verified: false,
  },
};

export const ActivityCardIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };
  
  const handleCardPress = (activityId: string) => {
    addTestResult(`✅ 卡片点击测试通过 - Activity ID: ${activityId}`);
  };
  
  const handleFavorite = (activityId: string) => {
    addTestResult(`💖 收藏功能测试通过 - Activity ID: ${activityId}`);
  };
  
  const handleRegister = (activityId: string) => {
    addTestResult(`📝 注册功能测试通过 - Activity ID: ${activityId}`);
  };
  
  const handleShare = (activityId: string) => {
    addTestResult(`🔗 分享功能测试通过 - Activity ID: ${activityId}`);
  };
  
  const handleBookmark = (activityId: string) => {
    addTestResult(`🔖 书签功能测试通过 - Activity ID: ${activityId}`);
  };
  
  const handleNotifyMe = (activityId: string) => {
    addTestResult(`🔔 提醒功能测试通过 - Activity ID: ${activityId}`);
  };
  
  const clearResults = () => {
    setTestResults([]);
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎴 ActivityCard 集成测试</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>测试场景 1: 免费活动卡片</Text>
        <ActivityCard
          activity={mockActivity}
          onPress={() => handleCardPress(mockActivity.id)}
          onFavorite={() => handleFavorite(mockActivity.id)}
          onRegister={() => handleRegister(mockActivity.id)}
          onShare={() => handleShare(mockActivity.id)}
          onBookmark={() => handleBookmark(mockActivity.id)}
          onNotifyMe={() => handleNotifyMe(mockActivity.id)}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>测试场景 2: 付费活动卡片（几乎满员）</Text>
        <ActivityCard
          activity={mockActivity2}
          onPress={() => handleCardPress(mockActivity2.id)}
          onFavorite={() => handleFavorite(mockActivity2.id)}
          onRegister={() => handleRegister(mockActivity2.id)}
          onShare={() => handleShare(mockActivity2.id)}
          onBookmark={() => handleBookmark(mockActivity2.id)}
          onNotifyMe={() => handleNotifyMe(mockActivity2.id)}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>测试场景 3: 空数据处理</Text>
        <ActivityCard
          activity={null}
          onPress={() => addTestResult('❌ 空数据测试失败 - 不应该触发')}
        />
        <Text style={styles.note}>
          ↑ 空数据卡片应该不显示任何内容（测试数据安全性）
        </Text>
      </View>
      
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>📋 测试结果记录</Text>
          <Button title="清空" onPress={clearResults} />
        </View>
        
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>
            点击上面的卡片来测试交互功能...
          </Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultItem}>
              {result}
            </Text>
          ))
        )}
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>💡 测试指引</Text>
        <Text style={styles.instructionItem}>• 点击卡片主体测试导航功能</Text>
        <Text style={styles.instructionItem}>• 点击心形图标测试收藏功能</Text>
        <Text style={styles.instructionItem}>• 点击注册按钮测试注册功能</Text>
        <Text style={styles.instructionItem}>• 左滑卡片显示分享和书签操作</Text>
        <Text style={styles.instructionItem}>• 右滑卡片显示提醒操作</Text>
        <Text style={styles.instructionItem}>• 观察液态玻璃效果和阴影渲染</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1A1A1A',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'semibold',
    marginBottom: 16,
    color: '#333333',
  },
  note: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  resultsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  noResults: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  resultItem: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F0F8F0',
    borderRadius: 4,
  },
  instructions: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFE066',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#B8860B',
  },
  instructionItem: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
    lineHeight: 20,
  },
});