/**
 * MerchantDetailScreen
 *
 * Full-screen merchant detail with Coupons / Menu / About tabs.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import merchantAPI, { Merchant } from '../../services/merchantAPI';
import couponAPI, { Coupon } from '../../services/couponAPI';
import menuAPI, { MenuItem } from '../../services/menuAPI';
import { useUser } from '../../context/UserContext';

const { width: screenWidth } = Dimensions.get('window');
const HERO_HEIGHT = 267;
const COUPON_CARD_GAP = 12;
const COUPON_CARD_WIDTH = (screenWidth - 40 - COUPON_CARD_GAP) / 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = 'coupons' | 'menu' | 'about';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Star rating row */
const StarRating = React.memo(
  ({ rating, reviewCount }: { rating: number; reviewCount: number }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={20} color="#F3C562" />
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <Ionicons key={i} name="star-half" size={20} color="#F3C562" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={20} color="#F3C562" />
        );
      }
    }

    return (
      <View style={styles.ratingRow}>
        {stars}
        <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
        <Text style={styles.ratingCount}>({reviewCount} reviews)</Text>
      </View>
    );
  }
);

/** Single coupon card for 2-column grid */
const CouponCard = React.memo(
  ({
    coupon,
    onUse,
    useLoading,
  }: {
    coupon: Coupon;
    onUse?: (coupon: Coupon) => void;
    useLoading?: boolean;
  }) => {
    const { t } = useTranslation();
    const discountLabel = coupon.discountRate
      ? `${coupon.discountRate}% OFF`
      : coupon.discount
      ? `$${coupon.discount} OFF`
      : '';

    return (
      <View style={styles.couponCard}>
        <View style={styles.couponDiscountBadge}>
          <Text style={styles.couponDiscountText}>{discountLabel}</Text>
        </View>
        <Text style={styles.couponName} numberOfLines={2}>
          {coupon.couponName}
        </Text>
        {coupon.description ? (
          <Text style={styles.couponDesc} numberOfLines={2}>
            {coupon.description}
          </Text>
        ) : null}
        {coupon.minAmount ? (
          <Text style={styles.couponMinSpend}>
            Min. ${coupon.minAmount}
          </Text>
        ) : null}
        {onUse && coupon.code ? (
          <TouchableOpacity
            style={styles.couponUseButton}
            onPress={() => onUse(coupon)}
            disabled={useLoading}
            activeOpacity={0.7}
          >
            {useLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.couponUseButtonText}>
                {t('community.merchantDetail.useCoupon', 'Use')}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
);

/** Menu item row */
const MenuItemRow = React.memo(({ item }: { item: MenuItem }) => {
  const displayName = item.menuName || item.name || '';
  const displayPrice =
    item.price !== undefined && item.price !== null
      ? `$${Number(item.price).toFixed(2)}`
      : '';

  return (
    <View style={styles.menuItemRow}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.menuItemImage} />
      ) : (
        <View style={[styles.menuItemImage, styles.menuItemImagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={24} color="#ccc" />
        </View>
      )}
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName} numberOfLines={1}>
          {displayName}
        </Text>
        {item.description ? (
          <Text style={styles.menuItemDesc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      {displayPrice ? (
        <Text style={styles.menuItemPrice}>{displayPrice}</Text>
      ) : null}
    </View>
  );
});

/** About info row */
const AboutRow = React.memo(
  ({
    icon,
    label,
    value,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string | null;
  }) => {
    if (!value) return null;
    return (
      <View style={styles.aboutRow}>
        <View style={styles.aboutIconContainer}>
          <Ionicons name={icon} size={19} color="#FF7763" />
        </View>
        <View style={styles.aboutTextWrap}>
          <Text style={styles.aboutLabel}>{label}</Text>
          <Text style={styles.aboutValue}>{value}</Text>
        </View>
      </View>
    );
  }
);

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

const MerchantDetailScreenInner: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // Route params
  const merchantId: number = route.params?.merchantId;
  const passedMerchant: Merchant | undefined = route.params?.merchant;

  // State
  const [merchant, setMerchant] = useState<Merchant | null>(passedMerchant ?? null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('coupons');
  const [bookmarked, setBookmarked] = useState(false);

  // Tab data
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  const [writingOffId, setWritingOffId] = useState<number | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchMerchantDetail = useCallback(async () => {
    if (!merchantId) return;
    try {
      setLoading(true);
      const response = await merchantAPI.getMerchantDetail(merchantId);
      if (response.code === 200 && response.data) {
        setMerchant(response.data);
      }
    } catch (error) {
      console.error('[MerchantDetail] Failed to load merchant:', error);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  const fetchCoupons = useCallback(async () => {
    if (!merchantId) return;
    try {
      setCouponsLoading(true);
      const userId = user?.id || (user as any)?.userId;
      const data = await couponAPI.getMerchantCoupons(merchantId, userId);
      setCoupons(data);
    } catch (error) {
      console.error('[MerchantDetail] Failed to load coupons:', error);
    } finally {
      setCouponsLoading(false);
    }
  }, [merchantId, user]);

  const fetchMenu = useCallback(async () => {
    if (!merchantId) return;
    try {
      setMenuLoading(true);
      const data = await menuAPI.getMenuByMerchant(merchantId);
      setMenuItems(data);
    } catch (error) {
      console.error('[MerchantDetail] Failed to load menu:', error);
    } finally {
      setMenuLoading(false);
    }
  }, [merchantId]);

  // Initial load
  useEffect(() => {
    fetchMerchantDetail();
  }, [fetchMerchantDetail]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons();
    } else if (activeTab === 'menu') {
      fetchMenu();
    }
  }, [activeTab, fetchCoupons, fetchMenu]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const earnMultiplier = merchant?.earnPoints ?? 1;
  const isEarnBoosted = earnMultiplier > 1;

  /** Unique menu categories for chip filter */
  const menuCategories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  /** Filtered menu items by selected category */
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleToggleBookmark = useCallback(() => {
    setBookmarked((prev) => !prev);
  }, []);

  const handleTabPress = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  const handleCategoryPress = useCallback((cat: string) => {
    setSelectedCategory(cat);
  }, []);

  const handleWriteOff = useCallback(
    (coupon: Coupon) => {
      const couponCode = coupon.code;
      const userId = user?.id || (user as any)?.userId;
      if (!couponCode || !userId) return;

      Alert.alert(
        t('community.merchantDetail.writeOffConfirmTitle', 'Use Coupon'),
        t('community.merchantDetail.writeOffConfirmMsg', 'Are you sure you want to use this coupon? This action cannot be undone.'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.confirm', 'Confirm'),
            style: 'destructive',
            onPress: async () => {
              try {
                setWritingOffId(coupon.id);
                const result = await couponAPI.writeOffCoupon({
                  couponNo: couponCode,
                  merchantId: merchantId,
                  userId: parseInt(String(userId)),
                });
                if (result.code === 200) {
                  Alert.alert(
                    t('common.success', 'Success'),
                    t('community.merchantDetail.writeOffSuccess', 'Coupon used successfully!')
                  );
                  fetchCoupons();
                } else {
                  Alert.alert(
                    t('common.error', 'Error'),
                    result.msg || t('community.merchantDetail.writeOffFailed', 'Failed to use coupon')
                  );
                }
              } catch (error) {
                console.error('[MerchantDetail] Write-off failed:', error);
                Alert.alert(
                  t('common.error', 'Error'),
                  t('community.merchantDetail.writeOffFailed', 'Failed to use coupon')
                );
              } finally {
                setWritingOffId(null);
              }
            },
          },
        ]
      );
    },
    [merchantId, user, t, fetchCoupons]
  );

  // -------------------------------------------------------------------------
  // Tab definitions
  // -------------------------------------------------------------------------

  const tabs: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: 'coupons', label: t('community.merchantDetail.coupons', 'Coupons') },
      { key: 'menu', label: t('community.merchantDetail.menu', 'Menu') },
      { key: 'about', label: t('community.merchantDetail.about', 'About') },
    ],
    [t]
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderCouponsTab = useCallback(() => {
    if (couponsLoading) {
      return (
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="small" color="#FF7763" />
        </View>
      );
    }

    if (coupons.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {t('community.merchantDetail.noCoupons', 'No coupons available')}
          </Text>
        </View>
      );
    }

    // 2-column grid via simple row pairing
    const rows: Coupon[][] = [];
    for (let i = 0; i < coupons.length; i += 2) {
      rows.push(coupons.slice(i, i + 2));
    }

    return (
      <View style={styles.couponGrid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.couponRow}>
            {row.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onUse={handleWriteOff}
                useLoading={writingOffId === coupon.id}
              />
            ))}
            {row.length === 1 && <View style={{ width: COUPON_CARD_WIDTH }} />}
          </View>
        ))}
      </View>
    );
  }, [coupons, couponsLoading, handleWriteOff, writingOffId, t]);

  const renderMenuTab = useCallback(() => {
    if (menuLoading) {
      return (
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="small" color="#FF7763" />
        </View>
      );
    }

    if (menuItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {t('community.merchantDetail.noMenu', 'No menu items')}
          </Text>
        </View>
      );
    }

    return (
      <View>
        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryChipsScroll}
          contentContainerStyle={styles.categoryChipsContent}
        >
          {menuCategories.map((cat) => {
            const isActive = cat === selectedCategory;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryPress(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Menu items */}
        {filteredMenuItems.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </View>
    );
  }, [
    menuItems,
    menuLoading,
    menuCategories,
    filteredMenuItems,
    selectedCategory,
    handleCategoryPress,
    t,
  ]);

  const renderAboutTab = useCallback(() => {
    return (
      <View style={styles.aboutContainer}>
        <AboutRow
          icon="time-outline"
          label={t('community.merchantDetail.open', 'Open')}
          value={merchant?.remark || null}
        />
        <AboutRow
          icon="location-outline"
          label={t('community.merchantDetail.address', 'Address')}
          value={merchant?.merchantAddress || null}
        />
        <AboutRow
          icon="globe-outline"
          label={t('community.merchantDetail.website', 'Website')}
          value={merchant?.email || null}
        />
        <AboutRow
          icon="call-outline"
          label={t('community.merchantDetail.phone', 'Phone')}
          value={merchant?.phonenumber || null}
        />

        {merchant?.merchantDesc ? (
          <>
            <View style={styles.aboutDivider} />
            <Text style={styles.fromOwnersHeader}>
              {t('community.merchantDetail.fromOwners', 'FROM THE OWNERS')}
            </Text>
            <Text style={styles.aboutDescription}>{merchant.merchantDesc}</Text>
          </>
        ) : null}
      </View>
    );
  }, [merchant, t]);

  // -------------------------------------------------------------------------
  // Full-screen loading
  // -------------------------------------------------------------------------

  if (loading && !merchant) {
    return (
      <View style={[styles.container, styles.centeredLoader]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#FF7763" />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const merchantImage = merchant?.shopImg || merchant?.logo;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Hero Section ---- */}
        <View style={styles.heroContainer}>
          {merchantImage ? (
            <Image
              source={{ uri: merchantImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="storefront-outline" size={56} color="#fff" />
            </View>
          )}

          {/* Gradient-like overlay at bottom of hero */}
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity
            style={[styles.heroButton, styles.heroButtonLeft, { top: insets.top + 8 }]}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>

          {/* Bookmark button */}
          <TouchableOpacity
            style={[styles.heroButton, styles.heroButtonRight, { top: insets.top + 8 }]}
            onPress={handleToggleBookmark}
            activeOpacity={0.7}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={bookmarked ? '#FF7763' : '#000'}
            />
          </TouchableOpacity>
        </View>

        {/* ---- Merchant Info ---- */}
        <View style={styles.infoSection}>
          {/* Earn badge - only show when multiplier > 1 */}
          {isEarnBoosted && (
            <View style={styles.earnBadgeRow}>
              <View
                style={[
                  styles.earnBadge,
                  { backgroundColor: '#EF4741' },
                ]}
              >
                <Ionicons name="flame" size={14} color="#fff" />
                <Text style={styles.earnBadgeText}>
                  {t('community.merchantDetail.earn', 'Earn')}{' '}
                  x{earnMultiplier}
                </Text>
              </View>
            </View>
          )}

          {/* Merchant name */}
          <Text style={styles.merchantName}>
            {merchant?.merchantName || ''}
          </Text>

          {/* Category tags */}
          {(merchant?.category || merchant?.userName) ? (
            <View style={styles.categoryTagRow}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>
                  {merchant?.category || merchant?.userName || ''}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Star rating - only show when backend provides real data */}
          {((merchant as any)?.rating ?? 0) > 0 && ((merchant as any)?.reviewCount ?? 0) > 0 && (
            <StarRating rating={(merchant as any).rating} reviewCount={(merchant as any).reviewCount} />
          )}
        </View>

        {/* ---- Tab Bar ---- */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ---- Tab Content ---- */}
        <View style={styles.tabContent}>
          {activeTab === 'coupons' && renderCouponsTab()}
          {activeTab === 'menu' && renderMenuTab()}
          {activeTab === 'about' && renderAboutTab()}
        </View>
      </ScrollView>
    </View>
  );
};

export const MerchantDetailScreen = React.memo(MerchantDetailScreenInner);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },
  scrollView: {
    flex: 1,
  },

  // Hero
  heroContainer: {
    width: screenWidth,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: '#FF7763',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: '#FAF3F1',
    opacity: 0.65,
  },
  heroButton: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  heroButtonLeft: {
    left: 16,
  },
  heroButtonRight: {
    right: 16,
  },

  // Info section
  infoSection: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  earnBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  earnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  earnBadgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  merchantName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 30,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  categoryTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#EEEEEE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryTagText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 8,
    color: '#444444',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#000',
    marginLeft: 6,
  },
  ratingCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: '#444444',
    marginLeft: 2,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    gap: 19,
  },
  tabItem: {
    paddingBottom: 10,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#949494',
  },
  tabTextActive: {
    color: '#FF7763',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FF7763',
    borderRadius: 1,
  },

  // Tab content
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Shared
  centeredLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#949494',
    marginTop: 12,
  },

  // Coupons
  couponGrid: {
    gap: COUPON_CARD_GAP,
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: COUPON_CARD_GAP,
  },
  couponCard: {
    width: COUPON_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  couponDiscountBadge: {
    backgroundColor: '#FF776315',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  couponDiscountText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#FF7763',
  },
  couponName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  couponDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#949494',
    marginBottom: 4,
  },
  couponMinSpend: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#949494',
  },
  couponUseButton: {
    backgroundColor: '#FF7763',
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  couponUseButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#fff',
  },

  // Menu
  categoryChipsScroll: {
    marginBottom: 12,
  },
  categoryChipsContent: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE6E3',
  },
  categoryChipActive: {
    backgroundColor: '#FF7763',
    borderColor: '#FF7763',
  },
  categoryChipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#949494',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 73,
    marginBottom: 8,
  },
  menuItemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  menuItemImagePlaceholder: {
    backgroundColor: '#F0ECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  menuItemName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#000',
  },
  menuItemDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#949494',
    marginTop: 2,
  },
  menuItemPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FF7763',
    marginLeft: 8,
  },

  // About
  aboutContainer: {
    gap: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aboutIconContainer: {
    width: 34.4,
    height: 34.4,
    borderRadius: 17.2,
    backgroundColor: 'rgba(249, 167, 137, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aboutTextWrap: {
    flex: 1,
  },
  aboutLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#000',
  },
  aboutValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#949494',
    marginTop: 2,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: '#EDE6E3',
    marginVertical: 4,
  },
  fromOwnersHeader: {
    fontFamily: 'IBMPlexMono-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#949494',
    letterSpacing: 1,
    lineHeight: 15.6,
  },
  aboutDescription: {
    fontFamily: 'Poppins-Light',
    fontSize: 15,
    fontWeight: '300',
    color: '#333',
    lineHeight: 22.5,
  },
});
