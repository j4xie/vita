import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  Dimensions,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import { WebRefreshControl } from '../../components/web/WebRefreshControl';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { ActivityCard } from '../../components/cards/ActivityCard';
import { useUnimplementedFeature } from '../../components/common/UnimplementedFeature';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { adaptActivityList, FrontendActivity } from '../../utils/activityAdapter';
import { useUser } from '../../context/UserContext';

const { width: screenWidth } = Dimensions.get('window');

// Mock data removed - using real data from APIs
// Real categories - moved to component render to access t() function

export const ExploreScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser(); // 🆕 新增用户上下文
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 🆕 添加分类状态管理

  // 为Web端添加CSS旋转动画
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, []);

  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 功能未实现提示
  const { showFeature, FeatureModal } = useUnimplementedFeature();

  // 加载活动数据
  useEffect(() => {
    loadActivities();
  }, []);

  // 监听来自CustomTabBar的搜索事件
  useEffect(() => {
    console.log('🎧 注册搜索事件监听器');
    const searchSubscription = DeviceEventEmitter.addListener('searchTextChanged', (text: string) => {
      console.log('🔍 [EVENT] 收到搜索事件:', { receivedText: text, currentSearchText: searchText });
      setSearchText(text);
    });

    return () => {
      console.log('🎧 移除搜索事件监听器');
      searchSubscription.remove();
    };
  }, []);

  // 🆕 监听双击TabBar刷新事件
  useEffect(() => {
    console.log('🎧 注册双击刷新事件监听器');
    const doubleTabSubscription = DeviceEventEmitter.addListener('exploreDoubleTabRefresh', () => {
      console.log('🔥🔥 [EVENT] 收到双击TabBar刷新事件，开始刷新活动列表');
      
      // 强制刷新活动列表
      setRefreshing(true);
      loadActivities(searchText.trim() || undefined).finally(() => {
        setRefreshing(false);
      });
    });

    return () => {
      console.log('🎧 移除双击刷新事件监听器');
      doubleTabSubscription.remove();
    };
  }, [searchText]);

  // 🆕 监听单击TabBar滚动到顶部并刷新事件
  useEffect(() => {
    console.log('🎧 注册滚动到顶部并刷新事件监听器');
    const scrollToTopSubscription = DeviceEventEmitter.addListener('scrollToTopAndRefresh', () => {
      console.log('📜 [EVENT] 收到单击TabBar滚动到顶部并刷新事件');
      
      // 因为Explore页面使用的是ScrollView，我们直接刷新数据
      // 页面会自动滚动到顶部显示新数据
      onRefresh();
    });

    return () => {
      console.log('🎧 移除滚动到顶部并刷新事件监听器');
      scrollToTopSubscription.remove();
    };
  }, [onRefresh]);

  // 搜索防抖效果
  useEffect(() => {
    console.log('🔍 [SEARCH-EFFECT] 搜索文本变化:', { searchText, trimmed: searchText.trim() });
    
    const timeoutId = setTimeout(() => {
      if (searchText.trim()) {
        console.log('🔍 [SEARCH-EFFECT] 执行搜索:', searchText.trim());
        loadActivities(searchText.trim());
      } else {
        console.log('🔍 [SEARCH-EFFECT] 搜索为空，加载所有活动');
        loadActivities(); // 搜索为空时加载所有活动
      }
    }, 300); // 300ms防抖

    return () => {
      console.log('🔍 [SEARCH-EFFECT] 清除防抖定时器');
      clearTimeout(timeoutId);
    };
  }, [searchText]);

  const loadActivities = async (searchQuery?: string) => {
    try {
      if (searchQuery) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      setError(null); // 清除之前的错误
      console.log('🔍 加载活动数据:', { searchQuery });
      
      // 🔧 支持访客模式浏览 - userId可选
      const isLoggedIn = !!(user?.id);
      
      const result = await pomeloXAPI.getActivityList({
        pageNum: 1,
        pageSize: 20,
        userId: isLoggedIn ? parseInt(user.id) : undefined, // 🔧 可选参数
        name: searchQuery, // 使用name字段进行搜索
      });
      
      console.log('🌍 Explore模式:', {
        mode: isLoggedIn ? '个性化浏览' : '访客浏览',
        searchQuery
      });
      
      console.log('📊 活动数据响应:', {
        code: result.code,
        total: result.total || 0,
        activitiesCount: result.rows?.length || 0
      });
      
      console.log('🔄 开始适配活动数据:', {
        rowsCount: result.rows?.length || 0,
        resultCode: result.code,
        resultMsg: result.msg
      });
      
      const adaptedData = adaptActivityList(result, 'zh');
      
      console.log('📊 适配后数据:', {
        success: adaptedData.success,
        activitiesCount: adaptedData.activities.length,
        message: adaptedData.message,
        total: adaptedData.total
      });
      
      if (adaptedData.success) {
        console.log('🚀 准备设置activities状态:', adaptedData.activities);
        setActivities(adaptedData.activities);
        console.log('✅ activities状态已设置，长度:', adaptedData.activities.length);
      } else {
        console.warn('⚠️ 活动数据加载失败:', adaptedData.message);
        setActivities([]);
      }
    } catch (error) {
      console.error('❌ 加载活动数据错误:', error);
      
      // Web端网络错误的特殊处理
      if (Platform.OS === 'web') {
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          setError('网络连接失败，请检查网络设置或稍后重试');
          console.warn('🌐 Web端网络访问受限，可能是CORS或SSL证书问题');
        } else {
          setError('数据加载失败，请重新尝试');
        }
      } else {
        setError('数据加载失败，请重新尝试');
      }
      
      setActivities([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // 🆕 精确的活动结束判断逻辑
  const getActivityStatus = (activity: FrontendActivity): 'upcoming' | 'ended' => {
    const now = new Date();
    
    try {
      let activityEndTime: Date;
      
      if (activity.endDate) {
        // 如果有 endDate，使用 endDate + 23:59:59 作为结束时间
        activityEndTime = new Date(activity.endDate);
        activityEndTime.setHours(23, 59, 59, 999);
      } else {
        // 如果没有 endDate，使用 date + time 作为结束时间
        const activityDateTime = new Date(`${activity.date} ${activity.time || '23:59:59'}`);
        activityEndTime = activityDateTime;
      }
      
      // 检查日期解析是否成功
      if (isNaN(activityEndTime.getTime())) {
        return 'upcoming';
      }
      
      // 当前时间超过活动结束时间即判断为已结束
      return now > activityEndTime ? 'ended' : 'upcoming';
    } catch (error) {
      return 'upcoming'; // 出错时默认为upcoming
    }
  };

  // 🆕 计算每个分类的活动数量
  const getCategoryCount = (categoryId: string): number => {
    if (categoryId === 'all') {
      return activities.length;
    }
    return activities.filter(activity => getActivityStatus(activity) === categoryId).length;
  };

  // Real categories using translations with dynamic counts
  const realCategories = [
    { id: 'all', name: t('filters.categories.all') || '全部活动', icon: 'apps-outline', count: getCategoryCount('all') },
    { id: 'upcoming', name: t('filters.status.upcoming') || '即将开始', icon: 'time-outline', count: getCategoryCount('upcoming') },
    { id: 'ended', name: t('filters.status.ended') || '已结束', icon: 'checkmark-circle-outline', count: getCategoryCount('ended') },
  ];

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadActivities(searchText.trim() || undefined);
    } catch (error) {
      console.error('刷新活动数据失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, [searchText]);

  // Handle school selection
  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchool(schoolId);
  };

  // Handle activity press
  const handleActivityPress = (activity: FrontendActivity) => {
    navigation.navigate('ActivityDetail', { activity });
  };

  // 前端搜索和分类过滤（确保搜索结果准确）
  const getFilteredActivities = (): FrontendActivity[] => {
    let filtered = [...activities];

    // 1. 首先按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(activity => {
        const status = getActivityStatus(activity);
        return status === selectedCategory;
      });
    }

    // 2. 然后按搜索文本筛选
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      filtered = filtered.filter(activity => {
        const title = activity.title.toLowerCase();
        const location = activity.location.toLowerCase();
        return title.includes(query) || location.includes(query);
      });
    }
    
    return filtered;
  };

  // 排序搜索结果
  const getSortedActivities = (): FrontendActivity[] => {
    const filtered = getFilteredActivities();
    
    if (!searchText.trim()) {
      // 无搜索时按时间排序（即将开始的优先）
      return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    const query = searchText.toLowerCase().trim();
    
    // 有搜索时按相关性排序
    return filtered.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      // 完全匹配的优先
      const aExactMatch = aTitle === query;
      const bExactMatch = bTitle === query;
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // 开头匹配的优先
      const aStartsWith = aTitle.startsWith(query);
      const bStartsWith = bTitle.startsWith(query);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // 其他按时间排序
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  // 🆕 Handle category press - 实现真正的分类筛选
  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Handle activity press
  const handleActivityPress = (activity: any) => {
    navigation.navigate('ActivityDetail', { activity });
  };

  // School data removed - feature not implemented

  return (
    <SafeAreaView style={styles.container}>
      {/* 🚨 强制显示的代码更新标识 */}
      <View style={{
        backgroundColor: '#ff0000',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 5,
        borderBottomColor: '#ffffff'
      }}>
        <Text style={{ 
          color: '#ffffff', 
          fontSize: 18, 
          fontWeight: 'bold' 
        }}>
          ✅ FRONTEND-WEB 代码已更新 - 分类:{selectedCategory} - 活动:{activities.length}
        </Text>
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        refreshControl={
          <WebRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['rgba(248, 250, 255, 0.95)', 'rgba(240, 247, 255, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{t('explore.title')} - 筛选:{selectedCategory}</Text>
                <Text style={styles.headerSubtitle}>
                  {t('explore.subtitle')} | 活动:{activities.length} | 已结束:{getCategoryCount('ended')}
                </Text>
              </View>
              
              {/* Web端刷新按钮 */}
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <View style={[
                  styles.refreshIconContainer,
                  refreshing && Platform.OS === 'web' && { 
                    // @ts-ignore - Web specific CSS animation
                    animation: 'spin 1s linear infinite'
                  }
                ]}>
                  <Ionicons
                    name={refreshing ? "refresh" : "refresh-outline"}
                    size={24}
                    color={refreshing ? '#999' : theme.colors.primary}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Search Status */}
          {searchText.trim() && (
            <View style={styles.searchStatusContainer}>
              <View style={styles.searchStatusContent}>
                <Ionicons 
                  name={searchLoading ? "hourglass-outline" : "search"} 
                  size={16} 
                  color={theme.colors.primary} 
                />
                <Text style={styles.searchStatusText}>
                  {searchLoading 
                    ? t('explore.searching', { query: searchText.trim() })
                    : t('explore.searchResults', { 
                        query: searchText.trim(), 
                        count: getFilteredActivities().length 
                      })
                  }
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setSearchText('');
                    // 通知TabBar清空搜索
                    DeviceEventEmitter.emit('searchTextChanged', '');
                  }}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Search Bar - 保留现有搜索框但隐藏，TabBar搜索优先 */}
          <View style={[styles.searchContainer, { display: 'none' }]}>
            <Ionicons name="search" size={20} color={theme.colors.text.disabled} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('placeholders.searchSchoolsAndActivities')}
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={theme.colors.text.disabled}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.text.disabled} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* School Selection - Feature Not Available */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('explore.choose_school')}</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('explore.school_selection_unavailable') || '学校选择功能暂未开放'}</Text>
          </View>
        </View>

        {/* Activity Categories */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>{t('explore.activity_categories')}</Text>
          </View>
          
          <View style={styles.categoriesGrid}>
            {realCategories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                // Shadow容器 - 使用solid background优化阴影渲染
                <View
                  key={category.id}
                  style={[
                    styles.categoryCardShadowContainer,
                    isSelected && styles.categoryCardShadowContainerSelected
                  ]}
                >
                  <TouchableOpacity
                    style={styles.categoryCard}
                    onPress={() => handleCategoryPress(category.id)}
                  >
                    <LinearGradient
                      colors={
                        isSelected 
                          ? ['rgba(255, 107, 53, 0.2)', 'rgba(255, 71, 87, 0.15)'] // 选中时更深的渐变
                          : ['rgba(255, 107, 53, 0.1)', 'rgba(255, 71, 87, 0.05)'] // 默认渐变
                      }
                      style={styles.categoryCardGradient}
                    >
                      <View style={[
                        styles.categoryIcon,
                        isSelected && styles.categoryIconSelected
                      ]}>
                        <Ionicons 
                          name={category.icon as any} 
                          size={24} 
                          color={isSelected ? '#ffffff' : theme.colors.primary} 
                        />
                      </View>
                      <Text style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameSelected
                      ]}>
                        {category.name}
                      </Text>
                      <Text style={[
                        styles.categoryCount,
                        isSelected && styles.categoryCountSelected
                      ]}>
                        {t('explore.activities_count', { count: category.count })}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Activities List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchText.trim() ? `"${searchText}"的搜索结果` : t('explore.recommended_activities')}
            </Text>
            {/* 调试信息显示 */}
            <Text style={{ fontSize: 10, color: 'red' }}>
              DEBUG: searchText="{searchText}" activities={activities.length} loading={loading.toString()} error={error || 'null'}
            </Text>
            {!searchText.trim() && (
              <TouchableOpacity onPress={() => showFeature(t('explore.recommended_activities'), t('explore.features.recommendations_developing'))}>
                <Text style={styles.seeMoreText}>{t('explore.view_more')}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Loading state */}
          {(loading || searchLoading) && (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>
                {searchText.trim() ? '搜索中...' : t('common.loading')}
              </Text>
            </View>
          )}
          
          {/* Error state */}
          {!loading && !searchLoading && error && (
            <View style={styles.errorState}>
              <Ionicons name="warning-outline" size={48} color={theme.colors.warning} style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => loadActivities()} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>重新加载</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Activities List */}
          {!loading && !searchLoading && !error && (() => {
            const filteredAndSorted = getSortedActivities();
            return (
              <View>
                
                {filteredAndSorted.length > 0 ? (
                  <View style={styles.activitiesList}>
                    {filteredAndSorted.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onPress={() => handleActivityPress(activity)}
                        style={styles.activityCard}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons 
                      name={searchText.trim() ? "search-outline" : "calendar-outline"} 
                      size={48} 
                      color={theme.colors.text.disabled} 
                      style={styles.emptyIcon}
                    />
                    <Text style={styles.emptyText}>
                      {searchText.trim() 
                        ? t('explore.noSearchResults', { query: searchText.trim() })
                        : (t('explore.no_activities_available') || '暂无活动数据')
                      }
                    </Text>
                    <Text style={styles.emptySubtext}>
                      {searchText.trim() 
                        ? '尝试其他搜索词或浏览所有活动'
                        : (t('explore.coming_soon') || '更多功能即将上线')
                      }
                    </Text>
                    {searchText.trim() && (
                      <TouchableOpacity 
                        style={styles.clearSearchBtn}
                        onPress={() => {
                          setSearchText('');
                          DeviceEventEmitter.emit('searchTextChanged', '');
                        }}
                      >
                        <Text style={styles.clearSearchBtnText}>
                          {t('explore.clearSearch')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      </ScrollView>
      
      {/* 功能未实现提示组件 */}
      <FeatureModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  // Header
  header: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 250, 255, 0.5)',
  },
  headerContent: {
    marginBottom: theme.spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshIconContainer: {
    // 图标容器样式
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg + 2,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 255, 0.8)',
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing[2],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  
  // Search Status
  searchStatusContainer: {
    marginTop: theme.spacing[3],
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
  },
  searchStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  searchStatusText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginLeft: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
  },
  clearSearchButton: {
    padding: theme.spacing[1],
    marginLeft: theme.spacing[2],
  },

  // Sections
  section: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  seeMoreText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Loading state
  loadingState: {
    paddingVertical: theme.spacing[6],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Error state
  errorState: {
    paddingVertical: theme.spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    marginBottom: theme.spacing[3],
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Activities list
  activitiesList: {
    gap: theme.spacing[3],
  },
  activityCard: {
    marginBottom: theme.spacing[3],
  },

  // Empty state
  emptyState: {
    padding: theme.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    margin: theme.spacing[2],
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[1],
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.disabled,
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: theme.spacing[3],
    alignSelf: 'center',
  },
  clearSearchBtn: {
    marginTop: theme.spacing[4],
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    alignSelf: 'center',
  },
  clearSearchBtnText: {
    color: 'white',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing[3],
  },
  
  // Shadow容器 - 解决LinearGradient阴影冲突 (Categories)
  categoryCardShadowContainer: {
    width: (screenWidth - theme.spacing[4] * 2 - theme.spacing[3]) / 2,
    marginBottom: theme.spacing[3],
    borderRadius: theme.borderRadius.lg + 2,
    backgroundColor: theme.liquidGlass.card.background, // solid background用于阴影优化
    ...theme.shadows.xs,
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
  },
  categoryCardShadowContainerSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.md, // 选中时更明显的阴影
  },
  
  categoryCard: {
    width: '100%',
    borderRadius: theme.borderRadius.lg + 2,
    overflow: 'hidden',
    // 移除阴影，由categoryCardShadowContainer处理
  },
  categoryCardGradient: {
    padding: theme.spacing[4],
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 107, 53, 0.1)', // PomeloX 橙色
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  categoryIconSelected: {
    backgroundColor: theme.colors.primary, // 选中时使用主题色背景
  },
  categoryName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: theme.colors.primary, // 选中时使用主题色文字
    fontWeight: theme.typography.fontWeight.bold,
  },
  categoryCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  categoryCountSelected: {
    color: theme.colors.primary, // 选中时使用主题色
    fontWeight: theme.typography.fontWeight.semibold,
  },
});