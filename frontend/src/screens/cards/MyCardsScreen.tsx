/**
 * 我的会员卡页面
 * 显示用户的所有会员卡，支持分类、搜索、筛选等功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { theme } from '../../theme';
// import { useOrganization } from '../../context/OrganizationContext'; // 移除组织功能
import { membershipCardService } from '../../services/MembershipCardService';
// MockAPI import removed - using real data only
import { 
  CardDisplayInfo, 
  CardGroupCollection, 
  MyCardsScreenState,
  EmptyCardState,
  CardErrorState 
} from '../../types/cards';
import { MembershipCard } from '../../types/organization';

// ==================== 主组件 ====================

export const MyCardsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // 移除组织依赖，简化为本地状态
  const currentOrganization = null;
  const membershipCards: any[] = [];
  const isLoading = false;
  const refreshOrganizations = async () => {};

  // ==================== 状态管理 ====================

  const [state, setState] = useState<MyCardsScreenState>({
    cards: [],
    groups: {
      organizationCards: {
        id: 'organization',
        title: t('cards.organization_cards'),
        cards: [],
        count: 0
      },
      merchantCards: {
        dining: { id: 'dining', title: t('cards.categories.dining'), cards: [], count: 0 },
        retail: { id: 'retail', title: t('cards.categories.retail'), cards: [], count: 0 },
        service: { id: 'service', title: t('cards.categories.service'), cards: [], count: 0 },
        education: { id: 'education', title: t('cards.categories.education'), cards: [], count: 0 },
        entertainment: { id: 'entertainment', title: t('cards.categories.entertainment'), cards: [], count: 0 },
        other: { id: 'other', title: t('cards.categories.other'), cards: [], count: 0 }
      },
      totalCount: 0,
      recentlyUsed: [],
      expiringSoon: []
    },
    loading: false,
    refreshing: false,
    searchQuery: '',
    activeFilters: {
      activeFilters: {
        text: '',
        category: 'all'
      },
      availableCategories: [],
      availableOrganizations: []
    },
    showActionSheet: false,
    syncStatus: {
      lastSyncTime: '',
      pendingSync: [],
      syncErrors: [],
      isOnline: true
    }
  });

  const [selectedTab, setSelectedTab] = useState<'all' | 'organization' | 'merchant'>('all');
  const [showSearch, setShowSearch] = useState(false);

  // ==================== 数据处理 ====================

  const loadCards = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: undefined }));

      // 暂时返回空数据，不使用Mock API
      const allCards: any[] = [];

      // 转换为显示格式 - 空数组
      const displayCards: any[] = [];

      // 分组 - 空分组
      const groups = membershipCardService.groupCards(displayCards);

      setState(prev => ({
        ...prev,
        cards: displayCards,
        groups,
        loading: false
      }));

    } catch (error) {
      console.error('Error loading cards:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          type: 'NETWORK_ERROR',
          title: t('common.load_failed'),
          subtitle: t('cards.feature_developing'),
          retryAction: {
            label: t('common.retry'),
            onPress: loadCards
          }
        }
      }));
    }
  }, [currentOrganization]);

  const refreshCards = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    
    try {
      await Promise.all([
        loadCards(),
        refreshOrganizations()
      ]);
    } catch (error) {
      console.error('Error refreshing cards:', error);
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [loadCards, refreshOrganizations]);

  // ==================== 筛选和搜索 ====================

  const filteredCards = useMemo(() => {
    let filtered = state.cards;

    // 按Tab筛选
    if (selectedTab === 'organization') {
      filtered = filtered.filter(card => card.category === 'organization');
    } else if (selectedTab === 'merchant') {
      filtered = filtered.filter(card => card.category !== 'organization');
    }

    // 按搜索词筛选
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(card => 
        card.title.toLowerCase().includes(query) ||
        card.subtitle.toLowerCase().includes(query) ||
        card.cardNumber.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [state.cards, selectedTab, state.searchQuery]);

  const groupedFilteredCards = useMemo(() => {
    return membershipCardService.groupCards(filteredCards);
  }, [filteredCards]);

  // ==================== 事件处理 ====================

  const handleCardPress = useCallback((card: CardDisplayInfo) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    navigation.navigate('CardDetail', { cardId: card.id });
  }, [navigation]);

  const handleAddCardPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // 显示功能暂未开放提示
    Alert.alert(t('alerts.feature_not_implemented'), t('cards.feature_developing'));
  }, []);

  const handleSearchToggle = useCallback(() => {
    setShowSearch(prev => !prev);
    if (showSearch && state.searchQuery) {
      setState(prev => ({ ...prev, searchQuery: '' }));
    }
  }, [showSearch, state.searchQuery]);

  const handleTabChange = useCallback((tab: typeof selectedTab) => {
    setSelectedTab(tab);
    
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  }, []);

  // ==================== 生命周期 ====================

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useFocusEffect(
    useCallback(() => {
      // 页面聚焦时刷新数据
      loadCards();
    }, [loadCards])
  );

  // ==================== 渲染方法 ====================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('cards.my_cards')}</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleSearchToggle}
          >
            <Ionicons 
              name={showSearch ? "close" : "search"} 
              size={22} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleAddCardPress}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 搜索栏 */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('cards.search_placeholder')}
            placeholderTextColor={theme.colors.text.secondary}
            value={state.searchQuery}
            onChangeText={(text) => setState(prev => ({ ...prev, searchQuery: text }))}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        <TabButton
          title={t('cards.all_cards')}
          count={state.groups.totalCount}
          active={selectedTab === 'all'}
          onPress={() => handleTabChange('all')}
        />
        <TabButton
          title={t('cards.organization_cards')}
          count={state.groups.organizationCards.count}
          active={selectedTab === 'organization'}
          onPress={() => handleTabChange('organization')}
        />
        <TabButton
          title={t('cards.merchant_cards')}
          count={Object.values(state.groups.merchantCards).reduce((sum, group) => sum + group.count, 0)}
          active={selectedTab === 'merchant'}
          onPress={() => handleTabChange('merchant')}
        />
      </View>
    </View>
  );

  const renderEmptyState = () => {
    const emptyState: EmptyCardState = {
      type: filteredCards.length === 0 && state.searchQuery ? 'NO_SEARCH_RESULTS' : 'NO_CARDS',
      title: state.searchQuery ? t('cards.no_search_results') : t('cards.no_cards'),
      subtitle: state.searchQuery 
        ? t('cards.try_different_search') 
        : t('cards.start_collecting_cards'),
      action: !state.searchQuery ? {
        label: t('cards.scan_qr_code'),
        onPress: handleAddCardPress
      } : undefined
    };

    return (
      <View style={styles.emptyState}>
        <Ionicons 
          name={state.searchQuery ? "search" : "card-outline"} 
          size={64} 
          color={theme.colors.text.disabled} 
        />
        <Text style={styles.emptyTitle}>{emptyState.title}</Text>
        <Text style={styles.emptySubtitle}>{emptyState.subtitle}</Text>
        
        {emptyState.action && (
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={emptyState.action.onPress}
          >
            <Text style={styles.emptyActionText}>{emptyState.action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCardList = () => {
    if (filteredCards.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.cardListContainer}>
        {/* 组织会员卡 */}
        {(selectedTab === 'all' || selectedTab === 'organization') && 
         groupedFilteredCards.organizationCards.count > 0 && (
          <CardSection
            group={groupedFilteredCards.organizationCards}
            onCardPress={handleCardPress}
          />
        )}

        {/* 商家会员卡 */}
        {(selectedTab === 'all' || selectedTab === 'merchant') && 
         Object.values(groupedFilteredCards.merchantCards).some(group => group.count > 0) && (
          <>
            {Object.entries(groupedFilteredCards.merchantCards).map(([key, group]) => (
              group.count > 0 && (
                <CardSection
                  key={key}
                  group={group}
                  onCardPress={handleCardPress}
                />
              )
            ))}
          </>
        )}
      </View>
    );
  };

  // ==================== 主渲染 ====================

  return (
    <SafeAreaView style={styles.container}>
      {/* 背景渐变 */}
      <LinearGradient
        colors={['#F5F6F7', '#F1F2F3', '#EDEEF0']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={refreshCards}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {state.loading ? (
          <LoadingState />
        ) : state.error ? (
          <ErrorState error={state.error} />
        ) : (
          renderCardList()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== 子组件 ====================

interface TabButtonProps {
  title: string;
  count: number;
  active: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, count, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
      {title}
    </Text>
    {count > 0 && (
      <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
        <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
          {count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

interface CardSectionProps {
  group: {
    id: string;
    title: string;
    cards: CardDisplayInfo[];
    count: number;
    icon?: string;
    color?: string;
  };
  onCardPress: (card: CardDisplayInfo) => void;
}

const CardSection: React.FC<CardSectionProps> = ({ group, onCardPress }) => (
  <View style={styles.cardSection}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        {group.icon && (
          <Ionicons 
            name={group.icon as any} 
            size={18} 
            color={group.color || theme.colors.text.secondary} 
          />
        )}
        <Text style={styles.sectionTitle}>{group.title}</Text>
      </View>
      <Text style={styles.sectionCount}>{group.count} {t('cards.cards_count_unit', '张')}</Text>
    </View>

    <View style={styles.cardGrid}>
      {group.cards.map((card) => (
        <MembershipCardItem
          key={card.id}
          card={card}
          onPress={onCardPress}
        />
      ))}
    </View>
  </View>
);

interface MembershipCardItemProps {
  card: CardDisplayInfo;
  onPress: (card: CardDisplayInfo) => void;
}

const MembershipCardItem: React.FC<MembershipCardItemProps> = ({ card, onPress }) => (
  <TouchableOpacity
    style={styles.cardItem}
    onPress={() => onPress(card)}
    activeOpacity={0.7}
  >
    <LinearGradient
      colors={
        card.brandColors.gradient && card.brandColors.gradient.length >= 2
          ? card.brandColors.gradient as [string, string, ...string[]]
          : [card.brandColors.primary, card.brandColors.secondary]
      }
      style={styles.cardBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* 卡片内容 */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {card.title}
          </Text>
          {card.addedToWallet && (
            <Ionicons name="wallet" size={16} color="rgba(255,255,255,0.8)" />
          )}
        </View>

        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {card.subtitle}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.cardPoints}>
            <Text style={styles.cardPointsLabel}>{t('profile.points_label')}</Text>
            <Text style={styles.cardPointsValue}>{card.points}</Text>
          </View>
          
          <Text style={styles.cardLevel}>
            {card.membershipLevelLabel}
          </Text>
        </View>
      </View>

      {/* 过期标识 */}
      {card.isExpired && (
        <View style={styles.expiredBadge}>
          <Text style={styles.expiredText}>{t('cards.expired', '已过期')}</Text>
        </View>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

const LoadingState: React.FC = () => (
  <View style={styles.loadingState}>
    <Text style={styles.loadingText}>{t('common.loading')}</Text>
  </View>
);

interface ErrorStateProps {
  error: CardErrorState;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => (
  <View style={styles.errorState}>
    <Ionicons name="alert-circle-outline" size={48} color={theme.colors.danger} />
    <Text style={styles.errorTitle}>{error.title}</Text>
    <Text style={styles.errorSubtitle}>{error.subtitle}</Text>
    
    {error.retryAction && (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={error.retryAction.onPress}
      >
        <Text style={styles.retryButtonText}>{error.retryAction.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ==================== 样式定义 ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 8,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },

  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },

  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },

  tabButtonTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },

  tabBadge: {
    backgroundColor: theme.colors.text.disabled,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },

  tabBadgeActive: {
    backgroundColor: theme.colors.primary,
  },

  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  cardListContainer: {
    // 卡片列表容器
  },

  cardSection: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },

  sectionCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },

  cardItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },

  cardBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 120,
  },

  cardContent: {
    padding: 16,
    flex: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  cardPoints: {
    flex: 1,
  },

  cardPointsLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },

  cardPointsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cardLevel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  expiredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  expiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  emptyAction: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  emptyActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },

  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },

  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },

  errorSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MyCardsScreen;