import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { adaptActivityList, FrontendActivity } from '../../utils/activityAdapter';
import { useUser } from '../../context/UserContext';
import { SmallActivityCard } from '../../components/cards/SmallActivityCard';
import { sortActivitiesByLocation, findNearestSchool, LocationInfo } from '../../utils/locationUtils';

const COLORS = {
  bg: '#FAF3F1',
  primary: '#FF8A72',
  primaryLight: '#FFF0ED',
  textMain: '#111111',
  textSecondary: '#8C8C8C',
  cardBg: '#FFFFFF',
  border: '#F0F0F0',
  pillActive: '#FF8A72',
  pillInactive: '#FFFFFF',
  success: '#34C759',
  successLight: '#E8F9EE',
};

type FilterKey = 'all' | 'upcoming' | 'ongoing' | 'past';

interface FilterPill {
  key: FilterKey;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FILTER_PILLS: FilterPill[] = [
  { key: 'all', labelKey: 'merchant.activities.filterAll', icon: 'apps-outline' },
  { key: 'upcoming', labelKey: 'merchant.activities.filterUpcoming', icon: 'time-outline' },
  { key: 'ongoing', labelKey: 'merchant.activities.filterOngoing', icon: 'radio-button-on-outline' },
  { key: 'past', labelKey: 'merchant.activities.filterPast', icon: 'checkmark-done-outline' },
];

// ─── Filter logic ─────────────────────────────────────────────────────────────

function filterActivities(activities: FrontendActivity[], filter: FilterKey): FrontendActivity[] {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  return activities.filter(a => {
    const start = a.date || '';
    const end = a.endDate || a.date || '';
    // "全部"默认隐藏过期活动，只有"已结束"tab 显示过期
    if (filter === 'all') return end >= today;
    if (filter === 'upcoming') return start > today;
    if (filter === 'ongoing') return start <= today && end >= today;
    if (filter === 'past') return end < today;
    return true;
  });
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

interface FilterPillButtonProps {
  pill: FilterPill;
  active: boolean;
  count: number;
  onPress: () => void;
}

const FilterPillButton = memo(({ pill, active, count, onPress }: FilterPillButtonProps) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.94, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
    onPress();
  }, [onPress, scale]);

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          styles.filterPill,
          active ? styles.filterPillActive : styles.filterPillInactive,
        ]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Ionicons
          name={pill.icon}
          size={13}
          color={active ? '#FFFFFF' : COLORS.textSecondary}
        />
        <Text style={[
          styles.filterPillText,
          active ? styles.filterPillTextActive : styles.filterPillTextInactive,
        ]}>
          {t(pill.labelKey)}
        </Text>
        {count > 0 && (
          <View style={[
            styles.filterPillBadge,
            { backgroundColor: active ? 'rgba(255,255,255,0.3)' : COLORS.primaryLight },
          ]}>
            <Text style={[
              styles.filterPillBadgeText,
              { color: active ? '#FFFFFF' : COLORS.primary },
            ]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyActivities = memo(({ filtered }: { filtered: boolean }) => {
  const { t } = useTranslation();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="calendar-outline" size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>
        {filtered ? t('merchant.activities.noFilteredActivities') : t('merchant.activities.noActivities')}
      </Text>
      <Text style={styles.emptyHint}>
        {filtered ? t('merchant.activities.noFilteredHint') : t('merchant.activities.noActivitiesHint')}
      </Text>
    </Animated.View>
  );
});

// ─── List Header ──────────────────────────────────────────────────────────────

interface ListHeaderProps {
  totalCount: number;
  filteredCount: number;
  filter: FilterKey;
  refreshing: boolean;
}

const ListHeader = memo(({ totalCount, filteredCount, filter, refreshing }: ListHeaderProps) => {
  const { t } = useTranslation();
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.listHeader}>
      <View style={styles.listHeaderLeft}>
        <Text style={styles.listHeaderCount}>
          {filteredCount}
        </Text>
        <Text style={styles.listHeaderLabel}>
          {t('merchant.activities.activitiesCount', { count: filteredCount })}
        </Text>
      </View>
      {refreshing && (
        <View style={styles.refreshingBadge}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.refreshingText}>{t('merchant.activities.refreshing')}</Text>
        </View>
      )}
    </Animated.View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const MerchantActivitiesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [userLocation, setUserLocation] = useState<LocationInfo | null>(null);

  // 获取用户地理位置（用于按距离排序）
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const nearest = findNearestSchool(loc.coords.latitude, loc.coords.longitude);
        setUserLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          school: nearest?.school,
          source: 'gps',
        });
      } catch (e) {
        // 定位失败，使用用户所属学校作为回退
        const deptName = user?.dept?.deptName || user?.deptName;
        if (deptName) {
          setUserLocation({ school: deptName, source: 'userSchool' });
        }
      }
    })();
  }, [user]);

  const fetchActivities = useCallback(async () => {
    try {
      const userId = user?.userId ?? user?.id;
      const result = await pomeloXAPI.getActivityList({
        userId: userId ? Number(userId) : undefined,
        pageNum: 1,
        pageSize: 50,
      });

      if (result.code === 200) {
        const responseData = (result.data || result) as { rows?: any[]; total?: number };
        const rows = responseData.rows || [];
        // 过滤掉证书类活动（actType=4），只显示学校活动
        const filteredRows = rows.filter((r: any) => r.actType !== 4);
        const total = filteredRows.length;
        const adapted = adaptActivityList({ total, rows: filteredRows, code: result.code, msg: result.msg });
        if (adapted.success) {
          // 按学校地理位置排序，过期活动排到最后
          const sorted = sortActivitiesByLocation(adapted.activities, user?.dept?.deptName, userLocation);
          setActivities(sorted);
        }
      }
    } catch (error) {
      console.error('❌ [MerchantActivities] 加载活动失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, userLocation]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
  }, [fetchActivities]);

  const handleActivityPress = useCallback((activity: FrontendActivity) => {
    if (!activity.id) return;
    navigation.navigate('ActivityDetail', { activityId: activity.id });
  }, [navigation]);

  // Filtered list + counts per filter
  const filteredActivities = useMemo(
    () => filterActivities(activities, activeFilter),
    [activities, activeFilter]
  );

  const pillCounts = useMemo(() => ({
    all: activities.length,
    upcoming: filterActivities(activities, 'upcoming').length,
    ongoing: filterActivities(activities, 'ongoing').length,
    past: filterActivities(activities, 'past').length,
  }), [activities]);

  const renderItem = useCallback(({ item, index }: { item: FrontendActivity; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(300).springify()}
      style={styles.cardWrapper}
    >
      <SmallActivityCard
        activity={item}
        onPress={() => handleActivityPress(item)}
      />
    </Animated.View>
  ), [handleActivityPress]);

  const keyExtractor = useCallback((item: FrontendActivity) => String(item.id), []);

  const ListHeaderComponent = useMemo(() => (
    <ListHeader
      totalCount={activities.length}
      filteredCount={filteredActivities.length}
      filter={activeFilter}
      refreshing={refreshing}
    />
  ), [activities.length, filteredActivities.length, activeFilter, refreshing]);

  const ListEmptyComponent = useMemo(() => (
    <EmptyActivities filtered={activeFilter !== 'all'} />
  ), [activeFilter]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('merchant.activities.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('merchant.activities.subtitle', { count: activities.length })}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={22} color={COLORS.primary} />
        </View>
      </Animated.View>

      {/* ── Filter Pills ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(80).duration(350)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={styles.filtersScroll}
        >
          {FILTER_PILLS.map(pill => (
            <FilterPillButton
              key={pill.key}
              pill={pill}
              active={activeFilter === pill.key}
              count={pillCounts[pill.key]}
              onPress={() => setActiveFilter(pill.key)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Activity List ────────────────────────────────────────────── */}
      <FlatList
        data={filteredActivities}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={[
          styles.listContent,
          filteredActivities.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={6}
        windowSize={8}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Filter Pills ──────────────────────────────────────────────────────────
  filtersScroll: {
    flexGrow: 0,
  },
  filtersRow: {
    paddingLeft: 20,
    paddingRight: 40,
    gap: 8,
    paddingBottom: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  filterPillInactive: {
    backgroundColor: COLORS.cardBg,
    shadowColor: '#000',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: COLORS.textSecondary,
  },
  filterPillBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  filterPillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ── List Header ───────────────────────────────────────────────────────────
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  listHeaderCount: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 28,
  },
  listHeaderLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  refreshingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  refreshingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // tab bar (56) + safe area + spacing
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  cardWrapper: {
    // SmallActivityCard itself has marginBottom: 20 in its styles
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MerchantActivitiesScreen;
