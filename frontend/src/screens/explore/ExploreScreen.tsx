import React, { useState, useCallback, useRef } from 'react';
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
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // 功能未实现提示
  const { showFeature, FeatureModal } = useUnimplementedFeature();

  // 加载活动数据
  useEffect(() => {
    loadActivities();
  }, []);

  // 防抖定时器引用
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 监听来自CustomTabBar的搜索事件
  useEffect(() => {
    console.log('🎧 注册搜索事件监听器');
    const subscription = DeviceEventEmitter.addListener('searchTextChanged', (text: string) => {
      console.log('🔍 [EVENT] 收到搜索事件:', { receivedText: text, currentSearchText: searchText });
      setSearchText(text);
    });

    return () => {
      console.log('🎧 移除搜索事件监听器');
      subscription.remove();
    };
  }, []);

  // 监听活动注册状态变化事件
  useEffect(() => {
    console.log('🎧 注册活动状态变化事件监听器');
    const subscription = DeviceEventEmitter.addListener('activityRegistrationChanged', (eventData: any) => {
      console.log('🔄 [EVENT] 收到活动状态变化事件:', eventData);
      
      // 使用防抖机制避免频繁刷新
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('🔄 [REFRESH] 刷新探索页面活动数据');
        loadActivities(searchText.trim() || undefined);
      }, 500); // 500ms防抖延迟
    });

    return () => {
      console.log('🎧 移除活动状态变化事件监听器');
      subscription.remove();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [searchText]);

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
      
      const adaptedData = adaptActivityList(result, 'zh');
      
      if (adaptedData.success) {
        setActivities(adaptedData.activities);
        console.log('✅ 活动数据加载成功:', {
          searchQuery,
          totalActivities: adaptedData.activities.length,
          activities: adaptedData.activities.map(a => ({ 
            id: a.id, 
            title: a.title, 
            location: a.location 
          }))
        });
      } else {
        console.warn('⚠️ 活动数据加载失败:', adaptedData.message);
        setActivities([]);
      }
    } catch (error) {
      console.error('❌ 加载活动数据错误:', error);
      setActivities([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Real categories using translations
  const realCategories = [
    { id: 'all', name: t('filters.categories.all') || '全部活动', icon: 'apps-outline', count: 0 },
    { id: 'upcoming', name: t('filters.status.available') || '可报名', icon: 'time-outline', count: 0 },
    { id: 'ended', name: t('filters.status.ended') || '已结束', icon: 'checkmark-circle-outline', count: 0 },
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

  // 前端搜索过滤（确保搜索结果准确）
  const getFilteredActivities = (): FrontendActivity[] => {
    if (!searchText.trim()) {
      console.log('🔍 无搜索文本，返回所有活动:', activities.length);
      return activities; // 无搜索文本，返回所有活动
    }

    const query = searchText.toLowerCase().trim();
    console.log('🔍 开始前端过滤:', { searchText, query, totalActivities: activities.length });
    
    const filtered = activities.filter(activity => {
      const title = activity.title.toLowerCase();
      const location = activity.location.toLowerCase();
      const matches = title.includes(query) || location.includes(query);
      
      console.log(`🔍 活动过滤:`, { 
        title: activity.title, 
        location: activity.location, 
        matches 
      });
      
      return matches;
    });
    
    console.log('🔍 过滤结果:', {
      searchQuery: query,
      originalCount: activities.length,
      filteredCount: filtered.length,
      filteredActivities: filtered.map(a => a.title)
    });
    
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

  // Handle category press
  const handleCategoryPress = (categoryId: string) => {
    // 显示功能未实现提示
    const categoryName = realCategories.find(c => c.id === categoryId)?.name || t('explore.category_fallback');
    showFeature(categoryName, t('explore.category_developing_message', { category: categoryName }));
  };

  // Handle activity press
  const handleActivityPress = (activity: any) => {
    navigation.navigate('ActivityDetail', { activity });
  };

  // School data removed - feature not implemented

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            title={t('common.loading')}
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
            <Text style={styles.headerTitle}>{t('explore.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('explore.subtitle')}</Text>
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
          <Text style={styles.sectionTitle}>{t('explore.activity_categories')}</Text>
          <View style={styles.categoriesGrid}>
            {realCategories.map((category) => (
              // Shadow容器 - 使用solid background优化阴影渲染
              <View
                key={category.id}
                style={styles.categoryCardShadowContainer}
              >
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <LinearGradient
                    colors={['rgba(255, 107, 53, 0.1)', 'rgba(255, 71, 87, 0.05)']} // PomeloX 橙红渐变
                    style={styles.categoryCardGradient}
                  >
                  <View style={styles.categoryIcon}>
                    <Ionicons 
                      name={category.icon as any} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{t('explore.activities_count', { count: category.count })}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
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
              DEBUG: searchText="{searchText}" activities={activities.length}
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
          
          {/* Activities List */}
          {!loading && !searchLoading && (() => {
            const filteredAndSorted = getSortedActivities();
            return (
              <View>
                {/* 调试过滤结果 */}
                <Text style={{ fontSize: 10, color: 'blue', padding: 5 }}>
                  过滤结果: {filteredAndSorted.length}个活动 (原始:{activities.length})
                  {filteredAndSorted.length > 0 && ` - 显示: ${filteredAndSorted.map(a => a.title).join(', ')}`}
                </Text>
                
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
  categoryName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});