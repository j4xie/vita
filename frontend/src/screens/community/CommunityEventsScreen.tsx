import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CommunityEventCardLarge } from '../../components/cards/CommunityEventCardLarge';
import { CommunityFilterModal, FilterOptions } from '../../components/modals/CommunityFilterModal';
import { theme } from '../../theme';
import { Glass } from '../../ui/glass/GlassTheme';

// 示例数据结构
interface CommunityEvent {
  id: string;
  title: string;
  location: string;
  dateRange: string;
  price?: number | string;
  currency?: string;
  image?: string;
  organizerName?: string;
  organizerAvatar?: string;
  category?: string;
  timestamp?: number;
  status?: 'available' | 'sold_out' | 'upcoming';
}

export const CommunityEventsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // 从导航参数获取学校信息
  const schoolName = route.params?.schoolName || t('community.events.defaultTitle', 'Community Events');
  const schoolId = route.params?.schoolId;

  // 调试：页面加载
  React.useEffect(() => {
    console.log('📱 [CommunityEventsScreen] 页面已加载', {
      schoolName,
      schoolId,
      allParams: route.params
    });
  }, []);

  // 调试：监听参数变化
  React.useEffect(() => {
    console.log('🔄 [CommunityEventsScreen] 参数更新', {
      schoolName,
      schoolId
    });
  }, [schoolName, schoolId]);

  // 状态管理
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CommunityEvent[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    sortBy: 'date',
    priceRange: 'all',
    category: null,
    location: null,
    dateRange: null,
  });

  // 模拟数据加载
  const loadEvents = useCallback(async () => {
    setIsLoading(true);

    // TODO: 替换为真实 API 调用
    // const response = await pomeloXAPI.getCommunityEvents({ schoolId });

    // 示例数据
    const mockEvents: CommunityEvent[] = [
      {
        id: '1',
        title: 'Shangri-La Singapore',
        location: '22 Orange Grove Road 258350 Singapore',
        dateRange: 'Mar 15 - Apr 7',
        price: 231,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        organizerName: '',
        category: 'social',
        timestamp: Date.now() + 86400000 * 10,
        status: 'available',
      },
      {
        id: '2',
        title: 'JEN Singapore Orchardgateway by Shangri-La',
        location: '277 Orchard Road 238858 Singapore',
        dateRange: 'Apr 20 - Apr 21',
        price: 195,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        organizerName: 'JEN',
        category: 'career',
        timestamp: Date.now() + 86400000 * 30,
        status: 'available',
      },
      {
        id: '3',
        title: 'JEN Singapore Tanglin by Shangri-La',
        location: '1A Cuscaden Road 249716 Singapore',
        dateRange: 'May 5',
        price: 134,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        organizerName: 'JEN',
        category: 'culture',
        timestamp: Date.now() + 86400000 * 45,
        status: 'available',
      },
      {
        id: '4',
        title: 'Shangri-La Rasa Sentosa Resort & Spa',
        location: '101 Siloso Road 098970 Singapore',
        dateRange: 'May 10',
        price: 289,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        organizerName: '',
        category: 'culture',
        timestamp: Date.now() + 86400000 * 50,
        status: 'sold_out', // Sold Out 状态
      },
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, [schoolId]);

  // 初始加载
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  }, [loadEvents]);

  // 应用筛选
  const applyFilters = useCallback((filters: FilterOptions) => {
    let filtered = [...events];

    // 价格筛选
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(event => {
        if (!event.price || event.price === 'Free') return filters.priceRange === 'under-100';
        const price = typeof event.price === 'number' ? event.price : parseFloat(event.price);

        switch (filters.priceRange) {
          case 'under-100':
            return price < 100;
          case '100-250':
            return price >= 100 && price <= 250;
          case '250-plus':
            return price > 250;
          default:
            return true;
        }
      });
    }

    // 类别筛选
    if (filters.category) {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    // 排序
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        break;
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = typeof a.price === 'number' ? a.price : (a.price === 'Free' ? 0 : 999);
          const priceB = typeof b.price === 'number' ? b.price : (b.price === 'Free' ? 0 : 999);
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = typeof a.price === 'number' ? a.price : (a.price === 'Free' ? 0 : 999);
          const priceB = typeof b.price === 'number' ? b.price : (b.price === 'Free' ? 0 : 999);
          return priceB - priceA;
        });
        break;
      default: // 'date'
        filtered.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }

    setFilteredEvents(filtered);
    setCurrentFilters(filters);
  }, [events]);

  // 收藏切换
  const toggleBookmark = useCallback((eventId: string) => {
    setBookmarkedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  }, []);

  // 事件详情导航
  const handleEventPress = useCallback((event: CommunityEvent) => {
    // TODO: 导航到事件详情页
    console.log('Event pressed:', event.id);
  }, []);

  // 渲染卡片
  const renderEvent = useCallback(({ item }: { item: CommunityEvent }) => (
    <CommunityEventCardLarge
      event={item}
      onPress={() => handleEventPress(item)}
    />
  ), [handleEventPress]);

  // 渲染空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={theme.colors.text.tertiary} />
      <Text style={styles.emptyText}>
        {t('community.events.empty', 'No events found')}
      </Text>
      <Text style={styles.emptySubtext}>
        {t('community.events.emptySubtext', 'Try adjusting your filters')}
      </Text>
    </View>
  );

  // 状态：List/Map 切换
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航栏 - Shangri-La 风格 */}
      <View style={styles.header}>
        {/* 第一行：返回按钮 + 城市/日期 + 货币选择器 */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.cityName} numberOfLines={1}>
              {schoolName}
            </Text>
            <Text style={styles.dateRange}>
              13 DEC-14 DEC
            </Text>
          </View>

          <TouchableOpacity style={styles.currencyButton}>
            <Ionicons name="wallet-outline" size={20} color="#1A1A1A" />
            <Text style={styles.currencyText}>USD</Text>
          </TouchableOpacity>
        </View>

        {/* 第二行：List/Map 切换 + 筛选按钮 */}
        <View style={styles.tabsContainer}>
          <View style={styles.viewModeTabs}>
            <TouchableOpacity
              style={[styles.viewModeTab, viewMode === 'list' && styles.viewModeTabActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list"
                size={20}
                color={viewMode === 'list' ? '#1A1A1A' : '#999'}
              />
              <Text style={[
                styles.viewModeTabText,
                viewMode === 'list' && styles.viewModeTabTextActive
              ]}>
                List
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeTab, viewMode === 'map' && styles.viewModeTabActive]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons
                name="map-outline"
                size={20}
                color={viewMode === 'map' ? '#1A1A1A' : '#999'}
              />
              <Text style={[
                styles.viewModeTabText,
                viewMode === 'map' && styles.viewModeTabTextActive
              ]}>
                Map
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.filterButtonCompact}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={22} color="#1A1A1A" />
            {(currentFilters.priceRange !== 'all' || currentFilters.category) && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 事件列表 - 完全无边距 */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.listStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FDB022"
          />
        }
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        ListFooterComponent={() => (
          // 底部品牌标识区域 - Shangri-La 风格
          <View style={styles.footerBrand}>
            <View style={styles.brandIconContainer}>
              <View style={styles.brandIcon}>
                <Text style={styles.brandIconText}>P</Text>
              </View>
              <Text style={styles.brandName}>PomeloX</Text>
            </View>

            <View style={styles.curatedByContainer}>
              <Text style={styles.curatedByText}>curated by</Text>
              <View style={styles.mobbinLogo}>
                <Text style={styles.mobbinText}>PomeloX Team</Text>
              </View>
            </View>
          </View>
        )}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={8}
        ItemSeparatorComponent={null}
      />

      {/* 筛选模态框 */}
      <CommunityFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={applyFilters}
        initialFilters={currentFilters}
        resultCount={filteredEvents.length}
      />

      {/* 浮动聊天按钮 - Shangri-La 风格 */}
      <TouchableOpacity
        style={[styles.floatingChatButton, { bottom: insets.bottom + 80 }]}
        onPress={() => {
          console.log('💬 Chat button pressed');
          // TODO: 打开聊天功能
        }}
      >
        <View style={styles.chatButtonInner}>
          <Ionicons name="chatbubble" size={24} color="#1A1A1A" />
        </View>
        <Text style={styles.chatButtonLabel}>Chat</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },

  // 顶部导航栏 - Shangri-La 风格
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 0,
  },

  // 第一行：返回 + 城市/日期 + 货币
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    height: 56,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  dateRange: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: 4,
  },

  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // 第二行：List/Map 切换 + 筛选
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },

  viewModeTabs: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },

  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  viewModeTabActive: {
    borderBottomColor: '#FDB022',
  },

  viewModeTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },

  viewModeTabTextActive: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  filterButtonCompact: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 8,
  },

  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FDB022',
  },

  // 列表 - 完全无边距
  listStyle: {
    flex: 1,
  },

  listContent: {
    flexGrow: 1,
    paddingHorizontal: 0, // 无左右边距
    paddingTop: 0, // 无顶部边距
  },

  // 底部品牌标识区域
  footerBrand: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 40,
  },

  brandIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FDB022',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  brandIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  curatedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  curatedByText: {
    fontSize: 12,
    color: '#999',
  },

  mobbinLogo: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },

  mobbinText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // 空状态
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
  },

  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },

  // 浮动聊天按钮 - Shangri-La 风格
  floatingChatButton: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },

  chatButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDB022',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  chatButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 4,
  },
});
