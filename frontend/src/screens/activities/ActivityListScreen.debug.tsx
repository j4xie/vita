/**
 * ActivityListScreen 调试版本
 *
 * 这是一个极简版本，用于快速测试问题所在
 * 如果这个版本能工作，说明问题在于复杂的状态管理或逻辑
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { pomeloXAPI } from '../../services/PomeloXAPI';

export const ActivityListScreenDebug: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  console.log('🔥 [DEBUG] 组件开始渲染');

  // 简单的数据获取
  const loadData = async (showAlert: boolean = false) => {
    try {
      console.log('🔥 [DEBUG] 开始获取数据');
      if (showAlert) {
        Alert.alert('调试', '开始获取数据...');
      }

      setLoading(true);
      setError(null);

      // 直接调用API，不传userId（访客模式）
      const result = await pomeloXAPI.getActivityList({
        pageNum: 1,
        pageSize: 20,
      });

      console.log('🔥 [DEBUG] API响应:', {
        code: result.code,
        total: result.data?.total,
        count: result.data?.rows?.length,
      });

      if (result.code === 200 && result.data?.rows) {
        const activities = result.data.rows.map((item: any) => ({
          id: item.id,
          name: item.name,
          address: item.address,
          startTime: item.startTime,
        }));

        console.log('🔥 [DEBUG] 设置活动数据:', activities.length);
        setActivities(activities);

        if (showAlert) {
          Alert.alert('成功', `获取到 ${activities.length} 个活动`);
        }
      } else {
        throw new Error(result.msg || '数据格式错误');
      }
    } catch (err: any) {
      console.error('🔥 [DEBUG] 错误:', err);
      setError(err.message || '加载失败');

      if (showAlert) {
        Alert.alert('错误', err.message || '加载失败');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    console.log('🔥 [DEBUG] useEffect触发 - 开始加载');
    Alert.alert('调试', '组件已挂载，即将加载数据');
    loadData(true);
  }, []);

  // 下拉刷新
  const onRefresh = () => {
    console.log('🔥 [DEBUG] 下拉刷新');
    setRefreshing(true);
    loadData(false);
  };

  console.log('🔥 [DEBUG] 当前状态:', {
    loading,
    error,
    activitiesCount: activities.length,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>调试版 - 活动列表</Text>
        <Text style={styles.subtitle}>
          {loading ? '加载中...' : `${activities.length} 个活动`}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>错误: {error}</Text>
        </View>
      )}

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.activityTitle}>{item.name}</Text>
            <Text style={styles.activityInfo}>📍 {item.address}</Text>
            <Text style={styles.activityInfo}>📅 {item.startTime}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>加载中...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {error ? '加载失败，请下拉刷新' : '暂无活动'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  activityInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

// 默认导出
export default ActivityListScreenDebug;