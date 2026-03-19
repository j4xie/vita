/**
 * MyCouponsScreen - Redesigned My Coupons
 *
 * Features:
 * - Blue gradient points card
 * - Two-tab navigation (Unused / Used·Expired)
 * - Ticket-shaped coupon cards grouped by merchant, 2-per-row
 * - Pull-to-refresh + pagination
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useUser } from '../../context/UserContext';
import { couponAPI, Coupon } from '../../services/couponAPI';
import { SCHOOL_COORDINATES, calculateDistance } from '../../utils/locationUtils';
import LocationService from '../../services/LocationService';

// --------------- Constants ---------------

const PAGE_SIZE = 10;
const STATUS_UNUSED = 1;
const STATUS_USED = -1;
const STATUS_EXPIRED = 2;

// Tab keys: 'unused' | 'used_expired'
type TabKey = 'unused' | 'used_expired';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_PADDING = 20;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

// Used/Expired card: SVG dimensions (164×170), content zones
const USED_SVG_WIDTH = 164;
const USED_SVG_HEIGHT = 170;
const USED_DASH_Y = 84; // dashed line at y=82-86, midpoint 84
const USED_BOTTOM_Y = 138; // bottom points section starts here

// --------------- Helper ---------------

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  } catch {
    return dateStr;
  }
};

// --------------- Merchant Location Helper ---------------

/**
 * Try to match a merchant name to a known school by checking keywords.
 * Returns the school code and its coordinates, or null if no match.
 */
const matchMerchantToSchool = (merchantName: string): { school: string; lat: number; lng: number } | null => {
  if (!merchantName) return null;
  const nameLower = merchantName.toLowerCase();
  for (const [code, info] of Object.entries(SCHOOL_COORDINATES)) {
    if (info.keywords.some(kw => nameLower.includes(kw.toLowerCase()))) {
      return { school: code, lat: info.lat, lng: info.lng };
    }
  }
  return null;
};

/**
 * Format distance in miles (convert from km).
 */
const formatDistanceMi = (km: number): string => {
  const mi = km * 0.621371;
  return mi < 0.1 ? '< 0.1 mi' : `${mi.toFixed(1)} mi`;
};

// --------------- VerifyLog type ---------------

interface VerifyLog {
  id?: number;
  userCouponId?: number;
  remark?: string;
  couponName?: string;
  couponNo?: string;
  userId?: number;
  verifyById?: number;
  verifyMerchantName?: string;
  createTime?: string;
  create_time?: string;
}

// --------------- Points Card ---------------

interface PointsCardProps {
  points: number;
  cardTier: string;
  t: (key: string, opts?: any) => string;
}

const PointsCard: React.FC<PointsCardProps> = React.memo(({ points, cardTier, t }) => (
  <LinearGradient
    colors={['#2B7CEE', '#3D8DFF', '#5299FD']}
    locations={[0, 0.48, 1]}
    start={{ x: 0, y: 0.5 }}
    end={{ x: 1, y: 0.5 }}
    style={styles.pointsCard}
  >
    <Text style={styles.pointsLabel}>
      {t('rewards.coupons.available_points')}
    </Text>
    <View style={styles.pointsRow}>
      <Text style={styles.pointsNumber}>{points.toLocaleString()}</Text>
      <Text style={styles.pointsSuffix}> {t('rewards.coupons.pts')}</Text>
    </View>
    <View style={styles.cardBadge}>
      <Text style={styles.cardBadgeText}>{cardTier}</Text>
    </View>
  </LinearGradient>
));
PointsCard.displayName = 'PointsCard';

// --------------- Tab Bar ---------------

interface TabBarProps {
  activeTab: TabKey;
  unusedCount: number;
  onTabChange: (tab: TabKey) => void;
  t: (key: string, opts?: any) => string;
}

const TabBar: React.FC<TabBarProps> = React.memo(({ activeTab, unusedCount, onTabChange, t }) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity
      style={[styles.tabButton, activeTab === 'unused' && styles.tabButtonActive]}
      onPress={() => onTabChange('unused')}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, activeTab === 'unused' && styles.tabTextActive]} numberOfLines={1}>
        {t('rewards.coupons.tab_unused')}{unusedCount > 0 ? ` (${unusedCount})` : ''}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.tabButton, activeTab === 'used_expired' && styles.tabButtonActive]}
      onPress={() => onTabChange('used_expired')}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, activeTab === 'used_expired' && styles.tabTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {t('rewards.coupons.tab_used_expired')}
      </Text>
    </TouchableOpacity>
  </View>
));
TabBar.displayName = 'TabBar';

// --------------- SVG Card Background ---------------

// The SVG path defines a ticket shape (164×170) with:
//   - Rounded corners (20px radius)
//   - Semi-circle cutouts at left/right edges (y=29–53, radius=12)
//   - Dashed separator at y=82–86
//   - Content zones: top (0–84), middle (84–138), bottom (138–170)
const CARD_SVG_PATH =
  'M144 -1C155.046 -1 164 7.95431 164 19V29C157.373 29 152 34.3726 152 41C152 47.6274 157.373 53 164 53V150C164 161.046 155.046 170 144 170H20C8.95431 170 0 161.046 0 150V86H5.09375V82H0V53C6.62742 53 12 47.6274 12 41C12 34.3726 6.62742 29 0 29V19C0 7.95431 8.95431 -1 20 -1H144ZM15.2812 86H25.4688V82H15.2812V86ZM35.6562 86H45.8438V82H35.6562V86ZM56.0312 86H66.2188V82H56.0312V86ZM76.4062 86H86.5938V82H76.4062V86ZM96.7812 86H106.969V82H96.7812V86ZM117.156 86H127.344V82H117.156V86ZM137.531 86H147.719V82H137.531V86ZM157.906 86H163V82H157.906V86Z';

// Top-only path: same as full card but only the area above the dashed line (y=-1 to y=86)
// Used for overlaying color on the top portion of unused cards
const CARD_TOP_SVG_PATH =
  'M144 -1C155.046 -1 164 7.95431 164 19V29C157.373 29 152 34.3726 152 41C152 47.6274 157.373 53 164 53V86H157.906V82H147.719V86H137.531V82H127.344V86H117.156V82H106.969V86H96.7812V82H86.5938V86H76.4062V82H66.2188V86H56.0312V82H45.8438V86H35.6562V82H25.4688V86H15.2812V82H5.09375V86H0V53C6.62742 53 12 47.6274 12 41C12 34.3726 6.62742 29 0 29V19C0 7.95431 8.95431 -1 20 -1H144Z';

interface CardSvgBackgroundProps {
  width: number;
  height: number;
  fill?: string;
}

const CardSvgBackground: React.FC<CardSvgBackgroundProps> = React.memo(({ width, height, fill = 'white' }) => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 -1 ${USED_SVG_WIDTH} ${USED_SVG_HEIGHT + 1}`}
    style={StyleSheet.absoluteFill}
  >
    <Path d={CARD_SVG_PATH} fill={fill} />
  </Svg>
));
CardSvgBackground.displayName = 'CardSvgBackground';

// Colored top overlay for unused cards
const CardTopOverlay: React.FC<CardSvgBackgroundProps> = React.memo(({ width, height, fill = '#F0A58C' }) => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 -1 ${USED_SVG_WIDTH} ${USED_SVG_HEIGHT + 1}`}
    style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
  >
    <Path d={CARD_TOP_SVG_PATH} fill={fill} />
  </Svg>
));
CardTopOverlay.displayName = 'CardTopOverlay';

// --------------- Ticket Coupon Card ---------------

interface TicketCouponCardProps {
  coupon: Coupon;
  t: (key: string, opts?: any) => string;
}

const TicketCouponCard: React.FC<TicketCouponCardProps> = React.memo(({ coupon, t }) => {
  const status = coupon.status ?? STATUS_UNUSED;
  const isUnused = status === STATUS_UNUSED;
  const isUsed = status === STATUS_USED;
  // coupon_type: 1=代金券(fixed discount), 2=折扣券(percentage)
  const isPercentage = coupon.couponType === 2 || (coupon as any).coupon_type === 2;

  // Scale SVG to card width, maintain aspect ratio
  const cardHeight = CARD_WIDTH * (USED_SVG_HEIGHT / USED_SVG_WIDTH);
  const scale = CARD_WIDTH / USED_SVG_WIDTH;
  const dashY = USED_DASH_Y * scale;
  const bottomY = USED_BOTTOM_Y * scale;

  // --- Real data from API ---
  const couponPrice = coupon.couponPrice ?? coupon.discount ?? 0;
  const couponLimit = coupon.couponLimit ?? coupon.minAmount ?? 0;

  // Discount display text
  const discountText = isPercentage
    ? `${coupon.discountRate ?? Math.round(couponPrice)}% off`
    : `Flat $${couponPrice} off`;

  // Min order threshold
  const minAmountLabel = couponLimit > 0
    ? `Orders over $${couponLimit}`
    : t('rewards.coupons.no_minimum') || 'No minimum';

  // Validity date
  const validEndStr = coupon.validEnd ?? coupon.validTo ?? '';
  const validityLabel = validEndStr
    ? `Valid thru ${formatDate(validEndStr)}`
    : '';

  // Top section color: salmon for fixed discount, gray for percentage, muted for used/expired
  const topColor = !isUnused
    ? (isPercentage ? '#A8A8A8' : '#C4C4C4')
    : (isPercentage ? '#9E9E9E' : '#F0A58C');

  // ---- Used / Expired card ----
  if (!isUnused) {
    const stampLabel = isUsed ? 'REDEEMED' : 'EXPIRED';

    return (
      <View style={[styles.svgCard, { width: CARD_WIDTH, height: cardHeight }]}>
        <CardSvgBackground width={CARD_WIDTH} height={cardHeight} fill="white" />
        <CardTopOverlay width={CARD_WIDTH} height={cardHeight} fill={topColor} />

        {/* Top: discount text */}
        <View style={[styles.svgTopContent, { height: dashY, zIndex: 2 }]}>
          <Text style={styles.svgDiscountTextUsed} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>
            {discountText}
          </Text>
        </View>

        {/* Middle: details */}
        <View style={[styles.svgMiddleContent, { top: dashY, height: bottomY - dashY }]}>
          <Text style={styles.svgDetailBold} numberOfLines={1}>{minAmountLabel}</Text>
          {validityLabel !== '' && (
            <Text style={styles.svgDetailLight} numberOfLines={1}>{validityLabel}</Text>
          )}
        </View>

        {/* Stamp overlay */}
        <View style={[styles.stampOverlay, { height: bottomY }]}>
          <View style={[styles.stampBorder, !isUsed && styles.stampBorderExpired]}>
            <Text style={[styles.stampText, !isUsed && styles.stampTextExpired]}>{stampLabel}</Text>
          </View>
        </View>

        {/* Bottom: coupon source */}
        <View style={[styles.svgBottomContent, { top: bottomY, height: cardHeight - bottomY }]}>
          <Text style={styles.svgBottomLabel} numberOfLines={1}>
            {coupon.sourceFrom === 1 ? t('rewards.coupons.source_merchant') : t('rewards.coupons.source_platform')}
          </Text>
        </View>
      </View>
    );
  }

  // ---- Unused card (same SVG shape, colored top) ----
  return (
    <View style={[styles.svgCard, { width: CARD_WIDTH, height: cardHeight }]}>
      {/* White base shape */}
      <CardSvgBackground width={CARD_WIDTH} height={cardHeight} fill="white" />
      {/* Colored top overlay */}
      <CardTopOverlay width={CARD_WIDTH} height={cardHeight} fill={topColor} />

      {/* Top: discount */}
      <View style={[styles.svgTopContent, { height: dashY, zIndex: 2 }]}>
        <Text
          style={styles.svgDiscountTextUnused}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {discountText}
        </Text>
      </View>

      {/* Middle: order min + validity */}
      <View style={[styles.svgMiddleContent, { top: dashY, height: bottomY - dashY }]}>
        <Text style={styles.svgDetailBold} numberOfLines={1}>{minAmountLabel}</Text>
        {validityLabel !== '' && (
          <Text style={styles.svgDetailLight} numberOfLines={1}>{validityLabel}</Text>
        )}
      </View>

      {/* Bottom: coupon source */}
      <View style={[styles.svgBottomContent, { top: bottomY, height: cardHeight - bottomY }]}>
        <Text style={styles.svgBottomLabel} numberOfLines={1}>
          {coupon.sourceFrom === 1 ? t('rewards.coupons.source_merchant') : t('rewards.coupons.source_platform')}
        </Text>
      </View>
    </View>
  );
});
TicketCouponCard.displayName = 'TicketCouponCard';

// --------------- Merchant Section ---------------

interface MerchantLocationInfo {
  schoolName: string;
  distance?: string; // formatted, e.g. "1.2 mi"
}

interface MerchantSectionProps {
  merchantName: string;
  coupons: Coupon[];
  t: (key: string, opts?: any) => string;
  locationInfo?: MerchantLocationInfo | null;
}

const MerchantSection: React.FC<MerchantSectionProps> = React.memo(({ merchantName, coupons, t, locationInfo }) => {
  // Chunk coupons into rows of 2
  const rows: Coupon[][] = [];
  for (let i = 0; i < coupons.length; i += 2) {
    rows.push(coupons.slice(i, i + 2));
  }

  return (
    <View style={styles.merchantSection}>
      {/* Section header: merchant name + location */}
      <View style={styles.merchantHeader}>
        <Text style={styles.merchantName} numberOfLines={1}>{merchantName}</Text>
        {locationInfo && (
          <View style={styles.merchantLocation}>
            <Ionicons name="school-outline" size={14} color="#888" />
            <Text style={styles.merchantLocationText}>
              {locationInfo.schoolName}{locationInfo.distance ? ` · ${locationInfo.distance}` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Card grid */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.cardRow}>
          {row.map((coupon) => (
            <TicketCouponCard key={coupon.id} coupon={coupon} t={t} />
          ))}
          {/* Spacer if odd number in last row */}
          {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
        </View>
      ))}
    </View>
  );
});
MerchantSection.displayName = 'MerchantSection';

// --------------- Main Screen ---------------

export const MyCouponsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const userId = user?.userId ?? (user as any)?.id;

  // Tab-level cache to avoid flash on tab switch
  interface TabCacheEntry {
    coupons: Coupon[];
    currentPage: number;
    hasMore: boolean;
    verifyLogs: Record<number, VerifyLog>;
  }
  const tabCacheRef = useRef<Map<TabKey, TabCacheEntry>>(new Map());

  const updateTabCache = useCallback((tab: TabKey, data: Partial<TabCacheEntry>) => {
    const existing = tabCacheRef.current.get(tab) || { coupons: [], currentPage: 1, hasMore: true, verifyLogs: {} };
    tabCacheRef.current.set(tab, { ...existing, ...data });
  }, []);

  // State
  const [activeTab, setActiveTab] = useState<TabKey>('unused');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [unusedCount, setUnusedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [verifyLogs, setVerifyLogs] = useState<Record<number, VerifyLog>>({});

  // User location for merchant distance calculation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(() => {
    // Initialize from user's school coordinates synchronously
    const schoolName = typeof (user as any)?.school === 'object'
      ? (user as any)?.school?.name
      : (user as any)?.school;
    if (schoolName) {
      const code = schoolName.replace('总部', '').trim();
      const coords = SCHOOL_COORDINATES[code] || SCHOOL_COORDINATES[schoolName];
      if (coords) return { lat: coords.lat, lng: coords.lng };
    }
    return null;
  });

  useEffect(() => {
    // Try to get more accurate GPS location
    LocationService.getCurrentLocation({ useCache: true, timeout: 5000 })
      .then(loc => {
        if (loc?.latitude && loc?.longitude) {
          setUserCoords({ lat: loc.latitude, lng: loc.longitude });
        }
      })
      .catch(() => { /* GPS unavailable, keep school-based coords */ });
  }, []);

  // Resolve merchant → school location mapping
  const merchantLocations = useMemo(() => {
    const result = new Map<string, MerchantLocationInfo>();
    const uniqueMerchants = new Set<string>();
    coupons.forEach(c => {
      const key = c.merchantName || c.purposeMerchantName || 'Other';
      uniqueMerchants.add(key);
    });

    // User's school name and coordinates (fallback for merchants with no keyword match)
    const userSchoolName = typeof (user as any)?.school === 'object'
      ? (user as any)?.school?.name
      : (user as any)?.school;
    const userSchoolCode = userSchoolName?.replace('总部', '').trim();
    const userSchoolCoords = userSchoolCode
      ? SCHOOL_COORDINATES[userSchoolCode] || SCHOOL_COORDINATES[userSchoolName]
      : null;

    uniqueMerchants.forEach(name => {
      // 1. Try keyword match from merchant name
      const match = matchMerchantToSchool(name);
      if (match) {
        const dist = userCoords
          ? formatDistanceMi(calculateDistance(userCoords.lat, userCoords.lng, match.lat, match.lng))
          : undefined;
        result.set(name, { schoolName: match.school, distance: dist });
        return;
      }
      // 2. Fallback: assume merchant is near user's school
      if (userSchoolCoords && userSchoolCode) {
        const dist = userCoords
          ? formatDistanceMi(calculateDistance(userCoords.lat, userCoords.lng, userSchoolCoords.lat, userSchoolCoords.lng))
          : undefined;
        result.set(name, { schoolName: userSchoolCode, distance: dist });
      }
    });
    return result;
  }, [coupons, userCoords, user]);

  // User points (from user context)
  const userPoints = useMemo(() => {
    return (user as any)?.points ?? (user as any)?.totalPoints ?? 0;
  }, [user]);

  const cardTier = useMemo(() => {
    return t('rewards.coupons.blue_card');
  }, [t]);

  // Load coupons
  const loadCoupons = useCallback(
    async (page: number = 1, isRefresh: boolean = false) => {
      if (!userId) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        if (activeTab === 'unused') {
          // Single status fetch
          const response = await couponAPI.getUserCouponList({
            userId,
            status: STATUS_UNUSED,
            pageNum: page,
            pageSize: PAGE_SIZE,
          });

          if (response.code === 200) {
            const list = response.data || response.rows || [];
            const items = Array.isArray(list) ? list : [];

            if (isRefresh || page === 1) {
              setCoupons(items);
              // Store total unused count
              if (response.total != null) {
                setUnusedCount(response.total);
              } else {
                setUnusedCount(items.length);
              }
            } else {
              setCoupons((prev) => [...prev, ...items]);
            }

            let newHasMore: boolean;
            if (items.length === 0) {
              newHasMore = false;
            } else if (response.total != null) {
              newHasMore = page * PAGE_SIZE < response.total;
            } else {
              newHasMore = items.length >= PAGE_SIZE;
            }
            setHasMore(newHasMore);
            setCurrentPage(page);

            // Update cache on page 1 / refresh for instant tab-switch restore
            if (isRefresh || page === 1) {
              updateTabCache('unused', { coupons: items, currentPage: page, hasMore: newHasMore });
            }
          } else {
            if (page === 1) setCoupons([]);
            setHasMore(false);
          }
        } else {
          // Fetch both used and expired in parallel
          const [usedRes, expiredRes] = await Promise.all([
            couponAPI.getUserCouponList({
              userId,
              status: STATUS_USED,
              pageNum: page,
              pageSize: PAGE_SIZE,
            }),
            couponAPI.getUserCouponList({
              userId,
              status: STATUS_EXPIRED,
              pageNum: page,
              pageSize: PAGE_SIZE,
            }),
          ]);

          const usedItems = usedRes.code === 200
            ? (Array.isArray(usedRes.data || usedRes.rows) ? (usedRes.data || usedRes.rows || []) : [])
            : [];
          const expiredItems = expiredRes.code === 200
            ? (Array.isArray(expiredRes.data || expiredRes.rows) ? (expiredRes.data || expiredRes.rows || []) : [])
            : [];

          const merged = [...(usedItems as Coupon[]), ...(expiredItems as Coupon[])];

          if (isRefresh || page === 1) {
            setCoupons(merged);
          } else {
            setCoupons((prev) => [...prev, ...merged]);
          }

          // Fetch verify logs for used coupons
          const usedOnly = merged.filter(c => c.status === STATUS_USED);
          if (usedOnly.length > 0) {
            fetchVerifyLogsForItems(usedOnly);
          }

          const usedHasMore = (usedItems as Coupon[]).length >= PAGE_SIZE;
          const expiredHasMore = (expiredItems as Coupon[]).length >= PAGE_SIZE;
          const newHasMore = usedHasMore || expiredHasMore;
          setHasMore(newHasMore);
          setCurrentPage(page);

          if (merged.length === 0 && page === 1) {
            setCoupons([]);
          }

          // Update cache for page 1 / refresh
          if (isRefresh || page === 1) {
            updateTabCache('used_expired', { coupons: merged, currentPage: page, hasMore: newHasMore });
          }
        }
      } catch (error) {
        console.error('[MyCoupons] Load failed:', error);
        if (page === 1) setCoupons([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [userId, activeTab],
  );

  // Fetch verify logs for used coupons
  const fetchVerifyLogsForItems = useCallback(async (couponList: Coupon[]) => {
    try {
      const logMap: Record<number, VerifyLog> = {};
      await Promise.all(
        couponList.map(async (coupon) => {
          try {
            const res = await couponAPI.verifyCouponById(coupon.id);
            if (res.code === 200 && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
              logMap[coupon.id] = res.data;
            }
          } catch {
            // Skip individual failures
          }
        })
      );
      setVerifyLogs((prev) => {
        const merged = { ...prev, ...logMap };
        // Also update cache for used_expired tab
        updateTabCache('used_expired', { verifyLogs: merged });
        return merged;
      });
    } catch (error) {
      console.error('[MyCoupons] Fetch verify logs failed:', error);
    }
  }, [updateTabCache]);

  // Also fetch unused count on mount
  useEffect(() => {
    if (!userId) return;
    couponAPI.getUserCouponList({
      userId,
      status: STATUS_UNUSED,
      pageNum: 1,
      pageSize: 1,
    }).then(res => {
      if (res.code === 200 && res.total != null) {
        setUnusedCount(res.total);
      }
    }).catch(() => {});
  }, [userId]);

  // Reload on tab change — restore from cache if available
  useEffect(() => {
    const cached = tabCacheRef.current.get(activeTab);
    if (cached && cached.coupons.length > 0) {
      // Restore cached data instantly — no loading flash
      setCoupons(cached.coupons);
      setCurrentPage(cached.currentPage);
      setHasMore(cached.hasMore);
      setVerifyLogs(cached.verifyLogs);
      setLoading(false);
    } else {
      // First visit to this tab — fetch with loading
      setCoupons([]);
      setCurrentPage(1);
      setHasMore(true);
      setVerifyLogs({});
      loadCoupons(1);
    }
  }, [activeTab, loadCoupons]);

  // Handlers
  const handleRefresh = useCallback(() => {
    // Clear cache for current tab so fresh data replaces it
    tabCacheRef.current.delete(activeTab);
    loadCoupons(1, true);
  }, [activeTab, loadCoupons]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadCoupons(currentPage + 1);
    }
  }, [loadingMore, hasMore, loading, currentPage, loadCoupons]);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  // Group coupons by merchant
  const groupedCoupons = useMemo(() => {
    const groups = new Map<string, Coupon[]>();
    coupons.forEach(c => {
      const key = c.merchantName || c.purposeMerchantName || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    });
    return Array.from(groups.entries());
  }, [coupons]);

  // FlatList data - each item is a merchant group
  const renderMerchantGroup = useCallback(
    ({ item }: { item: [string, Coupon[]] }) => (
      <MerchantSection
        merchantName={item[0]}
        coupons={item[1]}
        t={t}
        locationInfo={merchantLocations.get(item[0]) || null}
      />
    ),
    [t, merchantLocations],
  );

  const keyExtractor = useCallback((item: [string, Coupon[]]) => item[0], []);

  // Footer
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4A90D9" />
      </View>
    );
  }, [loadingMore]);

  // Empty state
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    const msgKey = activeTab === 'unused'
      ? 'rewards.coupons.empty_unused'
      : 'rewards.coupons.empty_used_expired';
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="ticket-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyText}>{t(msgKey)}</Text>
      </View>
    );
  }, [loading, activeTab, t]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('rewards.coupons.title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Points Card */}
      <View style={styles.pointsCardWrapper}>
        <PointsCard points={userPoints} cardTier={cardTier} t={t} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBarWrapper}>
        <TabBar
          activeTab={activeTab}
          unusedCount={unusedCount}
          onTabChange={handleTabChange}
          t={t}
        />
      </View>

      {/* Coupon List grouped by merchant */}
      <FlatList
        data={groupedCoupons}
        renderItem={renderMerchantGroup}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4A90D9"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={4}
        windowSize={7}
      />

      {/* Loading overlay — only on first load, not when switching to a cached tab */}
      {loading && coupons.length === 0 && !tabCacheRef.current.has(activeTab) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={styles.loadingText}>
            {t('common.loading')}
          </Text>
        </View>
      )}
    </View>
  );
};

// --------------- Styles ---------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 42, // Balance the back button
  },
  headerRight: {
    width: 0,
  },

  // Points Card
  pointsCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pointsCard: {
    borderRadius: 30,
    paddingHorizontal: 25,
    paddingVertical: 20,
    gap: 3,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  pointsNumber: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 45,
  },
  pointsSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 29,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 7,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 16,
  },

  // Tab Bar
  tabBarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(223,223,223,0.5)',
    borderRadius: 10,
    height: 42,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#949494',
    lineHeight: 20,
  },
  tabTextActive: {
    color: '#FF7763',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // Merchant Section
  merchantSection: {
    marginBottom: 22,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  merchantLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  merchantLocationText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888',
  },

  // Card grid
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },

  // ---- SVG Ticket Card (shared shape for unused + used/expired) ----
  svgCard: {
    shadowColor: '#BBBBBB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  svgTopContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgDiscountTextUnused: {
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  svgDiscountTextUsed: {
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },

  // Middle content (details between dashed line and bottom)
  svgMiddleContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 6,
    justifyContent: 'center',
  },
  svgDetailBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  svgDetailLight: {
    fontSize: 11,
    fontWeight: '400',
    color: '#666',
  },

  // Bottom content (points)
  svgBottomContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgBottomLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },

  // Stamp overlay (used/expired only)
  stampOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  stampBorder: {
    transform: [{ rotate: '-16deg' }],
    borderWidth: 4,
    borderColor: '#9A9A9A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 0.4,
  },
  stampBorderExpired: {
    borderColor: '#C87864',
  },
  stampText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#9A9A9A',
    letterSpacing: 3,
  },
  stampTextExpired: {
    color: '#C87864',
  },

  // Footer
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Loading
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 14,
    color: '#949494',
    marginTop: 12,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#949494',
    marginTop: 16,
  },
});

export default MyCouponsScreen;
