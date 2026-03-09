import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { useUser } from '../../context/UserContext';
import { couponAPI, Coupon } from '../../services/couponAPI';

const COLORS = {
  bg: '#FAF3F1',
  primary: '#FF8A72',
  primaryLight: '#FFF0ED',
  primaryMedium: '#FFCDC4',
  textMain: '#111111',
  textSecondary: '#8C8C8C',
  cardBg: '#FFFFFF',
  success: '#34C759',
  successLight: '#E8F9EE',
  warning: '#FF9500',
  warningLight: '#FFF4E5',
  border: '#F0F0F0',
  statsBg: '#F7F7F7',
};

interface WriteOffRecord {
  id?: number;
  couponName?: string;
  couponNo?: string;
  verifyTime?: string;
  userName?: string;
}

// ─── Sub-components (memoized for performance) ──────────────────────────────

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  value: string | number;
  label: string;
  delay?: number;
}

const StatCard = memo(({ icon, iconColor, iconBg, value, label, delay = 0 }: StatCardProps) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(400).springify()}
    style={styles.statCard}
  >
    <View style={[styles.statIconCircle, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
  </Animated.View>
));

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  hint?: string;
}

const EmptyState = memo(({ icon, text, hint }: EmptyStateProps) => (
  <View style={styles.emptyCard}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name={icon} size={32} color={COLORS.primaryMedium} />
    </View>
    <Text style={styles.emptyText}>{text}</Text>
    {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
  </View>
));

interface CouponRowProps {
  coupon: Coupon;
  index: number;
}

const CouponRow = memo(({ coupon, index }: CouponRowProps) => {
  const { t } = useTranslation();
  const isActive = coupon.status === 1; // CANUSE=1
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350).springify()}
      style={styles.couponCard}
    >
      <View style={[styles.couponAccent, { backgroundColor: isActive ? COLORS.success : COLORS.warning }]} />
      <View style={styles.couponLeft}>
        <View style={[
          styles.couponBadge,
          isActive ? styles.couponBadgeActive : styles.couponBadgeExpired,
        ]}>
          <Text style={[
            styles.couponBadgeText,
            isActive ? styles.couponBadgeTextActive : styles.couponBadgeTextExpired,
          ]}>
            {isActive ? t('merchant.dashboard.valid') : t('merchant.dashboard.expired')}
          </Text>
        </View>
        <Text style={styles.couponName} numberOfLines={1}>{coupon.couponName}</Text>
        {coupon.discount != null && (
          <Text style={styles.couponDiscount}>
            ¥{coupon.discount}
            {coupon.minAmount ? ` · ${t('merchant.writeOff.couponDiscount')} ¥${coupon.minAmount}+` : ''}
          </Text>
        )}
      </View>
      <View style={[styles.couponIconBg, { backgroundColor: isActive ? COLORS.successLight : COLORS.warningLight }]}>
        <Ionicons name="ticket-outline" size={20} color={isActive ? COLORS.success : COLORS.warning} />
      </View>
    </Animated.View>
  );
});

interface WriteOffRowProps {
  record: WriteOffRecord;
  index: number;
}

const WriteOffRow = memo(({ record, index }: WriteOffRowProps) => (
  <Animated.View
    entering={FadeInDown.delay(index * 50).duration(300).springify()}
    style={styles.writeOffItem}
  >
    <View style={styles.writeOffIconBg}>
      <Ionicons name="checkmark" size={14} color={COLORS.success} />
    </View>
    <View style={styles.writeOffInfo}>
      <Text style={styles.writeOffName} numberOfLines={1}>
        {record.couponName || record.couponNo || '-'}
      </Text>
      <Text style={styles.writeOffTime}>{record.verifyTime || '-'}</Text>
    </View>
    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
  </Animated.View>
));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayDateString(lang?: string): string {
  const now = new Date();
  if (lang === 'zh-CN' || lang === 'zh') {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${now.getMonth() + 1}月${now.getDate()}日 周${weekDays[now.getDay()]}`;
  }
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${weekDays[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

function countTodayWriteOffs(records: WriteOffRecord[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return records.filter(r => r.verifyTime && r.verifyTime.startsWith(today)).length;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const MerchantDashboardScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [writeOffs, setWriteOffs] = useState<WriteOffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [couponError, setCouponError] = useState(false);

  // Scan button press animation
  const scanScale = useSharedValue(1);
  const scanAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanScale.value }],
  }));

  const handleScanPress = useCallback(() => {
    scanScale.value = withSequence(
      withTiming(0.96, { duration: 90 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    navigation.navigate('MerchantWriteOff');
  }, [navigation, scanScale]);

  const fetchData = useCallback(async () => {
    try {
      setCouponError(false);
      const [couponRes, writeOffRes] = await Promise.allSettled([
        couponAPI.getMerchantCouponTemplates({ pageSize: 20 }),
        couponAPI.getWriteOffHistory({ pageSize: 5 }),
      ]);

      if (couponRes.status === 'fulfilled') {
        const result = couponRes.value;
        if (result.code === 200) {
          const list = result.data || result.rows || [];
          setCoupons(Array.isArray(list) ? list : []);
        } else if (result.code === 403) {
          setCouponError(true);
          setCoupons([]);
        }
      }

      if (writeOffRes.status === 'fulfilled') {
        const result = writeOffRes.value;
        if (result.code === 200) {
          const list = result.data || result.rows || [];
          setWriteOffs(Array.isArray(list) ? list.slice(0, 5) : []);
        } else {
          console.warn('⚠️ [MerchantDashboard] 核销记录加载失败:', result.msg);
          setWriteOffs([]);
        }
      }
    } catch (error) {
      console.error('❌ [MerchantDashboard] 加载数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const displayName = user?.nickName || user?.legalName || user?.userName || t('merchant.dashboard.defaultName');
  const todayCount = useMemo(() => countTodayWriteOffs(writeOffs), [writeOffs]);
  const activeCouponsCount = useMemo(() => coupons.filter(c => c.status === 1).length, [coupons]); // CANUSE=1
  const dateString = useMemo(() => getTodayDateString(i18n.language), [i18n.language]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{dateString}</Text>
            <Text style={styles.welcomeText}>
              {t('merchant.dashboard.welcome', { name: displayName })}
            </Text>
            <Text style={styles.subtitleText}>{t('merchant.dashboard.title')}</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="storefront" size={22} color={COLORS.primary} />
          </View>
        </Animated.View>

        {/* ── Stats Row ────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-done-outline"
            iconColor={COLORS.primary}
            iconBg={COLORS.primaryLight}
            value={todayCount}
            label={t('merchant.dashboard.stats.todayWriteOffs')}
            delay={80}
          />
          <View style={styles.statsDivider} />
          <StatCard
            icon="ticket-outline"
            iconColor={COLORS.success}
            iconBg={COLORS.successLight}
            value={activeCouponsCount}
            label={t('merchant.dashboard.stats.activeCoupons')}
            delay={160}
          />
          <View style={styles.statsDivider} />
          <StatCard
            icon="bar-chart-outline"
            iconColor={COLORS.warning}
            iconBg={COLORS.warningLight}
            value={writeOffs.length}
            label={t('merchant.dashboard.stats.totalWriteOffs')}
            delay={240}
          />
        </View>

        {/* ── Scan CTA ─────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400).springify()}
          style={scanAnimStyle}
        >
          <TouchableOpacity
            style={styles.scanButton}
            activeOpacity={1}
            onPress={handleScanPress}
            testID="scan-button"
          >
            {/* Decorative circles */}
            <View style={styles.scanDecoCircleLarge} />
            <View style={styles.scanDecoCircleSmall} />

            <View style={styles.scanButtonContent}>
              <View style={styles.scanIconCircle}>
                <Ionicons name="scan-outline" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.scanTextContainer}>
                <Text style={styles.scanButtonTitle}>{t('merchant.writeOff.title')}</Text>
                <Text style={styles.scanButtonSubtitle}>{t('merchant.dashboard.scanToVerify')}</Text>
              </View>
            </View>
            <View style={styles.scanArrow}>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Coupon Overview ──────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('merchant.dashboard.couponOverview')}</Text>
            {coupons.length > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{coupons.length}</Text>
              </View>
            )}
          </View>

          {couponError ? (
            <EmptyState
              icon="lock-closed-outline"
              text={t('merchant.dashboard.noCouponsHint')}
            />
          ) : coupons.length === 0 ? (
            <EmptyState
              icon="ticket-outline"
              text={t('merchant.dashboard.noCoupons')}
              hint={t('merchant.dashboard.contactAdmin')}
            />
          ) : (
            <>
              {coupons.map((coupon, index) => (
                <CouponRow key={coupon.id || index} coupon={coupon} index={index} />
              ))}
              <Text style={styles.contactAdminText}>{t('merchant.dashboard.contactAdmin')}</Text>
            </>
          )}
        </Animated.View>

        {/* ── Recent Write-offs ────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(400).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('merchant.dashboard.recentWriteOffs')}</Text>
            {writeOffs.length > 0 && (
              <View style={[styles.sectionBadge, { backgroundColor: COLORS.successLight }]}>
                <Text style={[styles.sectionBadgeText, { color: COLORS.success }]}>
                  {writeOffs.length}
                </Text>
              </View>
            )}
          </View>

          {writeOffs.length === 0 ? (
            <EmptyState
              icon="checkmark-done-outline"
              text={t('merchant.dashboard.noWriteOffs')}
            />
          ) : (
            <View style={styles.writeOffList}>
              {writeOffs.map((record, index) => (
                <WriteOffRow key={record.id || index} record={record} index={index} />
              ))}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 56 + insets.bottom + 20 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── Stats Row ─────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  // ── Scan Button ───────────────────────────────────────────────────────────
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  // Decorative circles inside scan button
  scanDecoCircleLarge: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scanDecoCircleSmall: {
    position: 'absolute',
    right: 40,
    bottom: -16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scanIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  scanButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  scanArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textMain,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.75,
  },

  // ── Coupon Cards ──────────────────────────────────────────────────────────
  couponCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    paddingLeft: 18,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  couponAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  couponLeft: {
    flex: 1,
  },
  couponBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  couponBadgeActive: {
    backgroundColor: COLORS.successLight,
  },
  couponBadgeExpired: {
    backgroundColor: COLORS.warningLight,
  },
  couponBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  couponBadgeTextActive: {
    color: COLORS.success,
  },
  couponBadgeTextExpired: {
    color: COLORS.warning,
  },
  couponName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 3,
  },
  couponDiscount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  couponIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  contactAdminText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.7,
  },

  // ── Write-off Records ─────────────────────────────────────────────────────
  writeOffList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  writeOffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  writeOffIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  writeOffInfo: {
    flex: 1,
  },
  writeOffName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMain,
    marginBottom: 2,
  },
  writeOffTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});

export default MerchantDashboardScreen;
