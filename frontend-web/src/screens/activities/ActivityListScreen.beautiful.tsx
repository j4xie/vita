import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useWebSafeAreaInsets } from '../../hooks/useWebSafeArea';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { adaptActivityList, FrontendActivity } from '../../utils/activityAdapter';
import { useUser } from '../../context/UserContext';
import { GridActivityCard } from '../../components/cards/GridActivityCard';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SimpleCategoryBar } from '../../components/ui/SimpleCategoryBar';

export const BeautifulActivityListScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const insets = useWebSafeAreaInsets();
  
  // 状态管理
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list');
  
  // 🚫 滚动保护机制
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // 过滤标签 - 使用硬编码避免翻译键显示问题
  const filterTabs = ['all', 'upcoming', 'ongoing', 'ended'];
  const filterLabels = ['All', 'Upcoming', 'Ongoing', 'Ended'];

  // 加载活动数据
  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [BEAUTIFUL] 加载活动数据');
      
      const result = await pomeloXAPI.getActivityList({
        pageNum: 1,
        pageSize: 20,
        userId: user?.id ? parseInt(user.id) : undefined,
      });
      
      console.log('📊 [BEAUTIFUL] API响应:', {
        code: result.code,
        total: result.total || 0,
        rowsCount: result.rows?.length || 0
      });
      
      const adaptedData = adaptActivityList(result, 'zh');
      
      if (adaptedData.success) {
        setActivities(adaptedData.activities);
        console.log('✅ [BEAUTIFUL] Activities设置成功:', adaptedData.activities.length);
      } else {
        setError(adaptedData.message);
      }
    } catch (err) {
      console.error('❌ [BEAUTIFUL] 加载失败:', err);
      setError('网络连接失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  // 刷新处理
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadActivities();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 过滤活动
  const filteredActivities = activities.filter(activity => {
    if (filterTabs[activeFilter] === 'all') return true;
    if (filterTabs[activeFilter] === 'upcoming') return activity.status === 'upcoming';
    if (filterTabs[activeFilter] === 'ongoing') return activity.status === 'ongoing';
    if (filterTabs[activeFilter] === 'ended') return activity.status === 'ended';
    return true;
  });

  // 🚫 滚动保护事件处理
  const handleScrollBegin = useCallback(() => {
    setIsScrolling(true);
  }, []);

  const handleScrollEnd = useCallback(() => {
    // 滚动结束后等待300ms再启用点击
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 300);
  }, []);

  const handleScrollMove = useCallback(() => {
    // 任何滚动都立即禁用点击
    if (!isScrolling) {
      setIsScrolling(true);
    }
    
    // 重置计时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 500);
  }, [isScrolling]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 活动点击处理 - 带滚动保护
  const handleActivityPress = (activity: FrontendActivity) => {
    // 🚫 滚动保护：滚动时忽略点击
    if (isScrolling) {
      return;
    }
    navigation.navigate('ActivityDetail', { activity });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Web端优化的CategoryBar */}
      <View style={styles.categoryBarContainer}>
        <SimpleCategoryBar
          selectedIndex={activeFilter}
          onIndexChange={setActiveFilter}
          onScanPress={() => console.log('扫码功能暂未实现')}
          viewLayout={viewLayout}
          onLayoutChange={setViewLayout}
        />
      </View>

      {/* Loading状态 */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>正在加载活动...</Text>
        </View>
      )}

      {/* Error状态 */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={theme.colors.warning} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadActivities} style={styles.retryButton}>
            <Text style={styles.retryText}>重新加载</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 活动列表 - 使用ScrollView */}
      {!loading && !error && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScrollMove}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollBegin={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {filteredActivities.length > 0 ? (
            viewLayout === 'grid' ? (
              // 网格布局 - 两列显示
              <View style={styles.gridContainer}>
                {filteredActivities.map((activity) => (
                  <View key={activity.id} style={styles.gridItem}>
                    <GridActivityCard
                      activity={activity}
                      onPress={() => handleActivityPress(activity)}
                      onBookmark={user?.id ? () => console.log('收藏:', activity.title) : undefined}
                      isBookmarked={false}
                      isScrolling={isScrolling} // 🚫 传递滚动状态
                    />
                  </View>
                ))}
              </View>
            ) : (
              // 列表布局 - 单列显示
              filteredActivities.map((activity) => (
                <View key={activity.id} style={styles.cardContainer}>
                  <GridActivityCard
                    activity={activity}
                    onPress={() => handleActivityPress(activity)}
                    onBookmark={user?.id ? () => console.log('收藏:', activity.title) : undefined}
                    isBookmarked={false}
                    isScrolling={isScrolling} // 🚫 传递滚动状态
                  />
                </View>
              ))
            )
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>暂无活动</Text>
              <Text style={styles.emptySubtitle}>当前没有符合条件的活动</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  categoryBarContainer: {
    paddingHorizontal: 8, // 减少容器边距，让CategoryBar更宽
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
});

export default BeautifulActivityListScreen;