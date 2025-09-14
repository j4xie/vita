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
  DeviceEventEmitter,
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
  const { user, isAuthenticated } = useUser();
  const navigation = useNavigation<any>();
  const insets = useWebSafeAreaInsets();
  
  // 状态管理
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  // 移除viewLayout状态，固定使用grid视图
  
  // 🚫 滚动保护机制
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // 过滤标签 - 使用翻译系统
  const filterTabs = ['all', 'available', 'ended'];
  const filterLabels = [
    t('filters.status.all', 'All'),
    t('filters.status.available', 'Available'),
    t('filters.status.ended', 'Ended')
  ];

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

  // 扫码处理
  const handleScanPress = useCallback(() => {
    navigation.navigate('QRScanner', {
      purpose: 'scan', // 通用扫码功能
      returnScreen: 'Explore' // 扫码完成后返回到首页
    });
  }, [navigation]);

  // 过滤活动 - 使用实时状态计算和互斥逻辑
  const filteredActivities = activities.filter(activity => {
    const currentFilter = filterTabs[activeFilter];
    
    // ✅ 实时计算活动真实状态，不依赖可能过时的activity.status
    const now = new Date();
    const activityEnd = activity.endTime ? new Date(activity.endTime) : new Date(activity.startTime);
    const isActivityEnded = activityEnd.getTime() < now.getTime();
    
    // 🎯 Debug: USC活动状态检查 - 增强调试信息
    if (activity.title.includes('USC')) {
      console.log(`🎯 USC活动实时状态检查: ${activity.title}`, {
        originalStatus: activity.status,
        calculatedEnded: isActivityEnded,
        currentFilter,
        endTime: activityEnd.toISOString(),
        currentTime: now.toISOString(),
        shouldShow: currentFilter === 'all' || 
                   (currentFilter === 'available' && !isActivityEnded) ||
                   (currentFilter === 'ended' && isActivityEnded)
      });
    }
    
    // ✅ 互斥过滤逻辑：ended和available绝对不会重复显示
    if (currentFilter === 'all') return true;
    if (currentFilter === 'available') return !isActivityEnded; // 只显示未结束的活动
    if (currentFilter === 'ended') return isActivityEnded;      // 只显示已结束的活动
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

  // 监听活动状态变化事件
  useEffect(() => {
    const registrationListener = DeviceEventEmitter.addListener('activityRegistered', (data: { activityId: string, newRegisteredCount?: number, source?: string }) => {
      console.log('📋 [Web-ActivityList] 收到活动报名成功事件:', {
        activityId: data.activityId,
        newRegisteredCount: data.newRegisteredCount,
        source: data.source,
        currentActivitiesCount: activities.length,
        timestamp: new Date().toISOString()
      });

      // 更新对应活动的状态
      setActivities(prev => 
        prev.map(activity => {
          if (activity.id === data.activityId) {
            const updated = {
              ...activity,
              status: 'registered',
              registeredCount: data.newRegisteredCount || activity.registeredCount
            };
            console.log('📋 [Web-ActivityList] 更新活动状态:', {
              activityId: activity.id,
              title: activity.title,
              oldStatus: activity.status,
              newStatus: 'registered',
              oldRegisteredCount: activity.registeredCount,
              newRegisteredCount: updated.registeredCount
            });
            return updated;
          }
          return activity;
        })
      );

      // 延迟重新加载以获取服务器最新数据
      setTimeout(() => {
        console.log('📋 [Web-ActivityList] 延迟重新加载活动数据');
        loadActivities();
      }, 2000);
    });

    // 监听活动签到成功事件
    const signinListener = DeviceEventEmitter.addListener('activitySignedIn', (data: { activityId: string }) => {
      console.log('📋 [Web-ActivityList] 收到活动签到成功事件:', {
        activityId: data.activityId,
        timestamp: new Date().toISOString()
      });

      // 立即更新活动状态为已签到
      setActivities(prev => 
        prev.map(activity => {
          if (activity.id === data.activityId) {
            const updated = {
              ...activity,
              status: 'checked_in'
            };
            console.log('📋 [Web-ActivityList] 更新活动为已签到:', {
              activityId: activity.id,
              title: activity.title,
              oldStatus: activity.status,
              newStatus: 'checked_in'
            });
            return updated;
          }
          return activity;
        })
      );

      // 延迟重新加载以确保数据同步
      setTimeout(() => {
        console.log('📋 [Web-ActivityList] 签到后重新加载活动数据');
        loadActivities();
      }, 1500);
    });

    return () => {
      registrationListener.remove();
      signinListener.remove();
    };
  }, [activities.length]);

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
          onScanPress={handleScanPress}
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
            // 固定网格布局 - 两列显示
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
    paddingBottom: 2, // 最小化底部间距，让category bar和活动卡片几乎贴合
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