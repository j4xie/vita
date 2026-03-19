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
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Rect, Line, Defs, ClipPath, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import merchantAPI, { Merchant } from '../../services/merchantAPI';
import couponAPI, { Coupon } from '../../services/couponAPI';
import menuAPI, { MenuItem } from '../../services/menuAPI';
import { getUserExLevelInfo } from '../../services/membershipAPI';
import { useUser } from '../../context/UserContext';
import {
  FlameIcon,
  SchoolMarkerIcon,
  BookmarkAddIcon,
  ExternalLinkIcon,
} from '../../components/common/icons/CommunityIcons';

const { width: screenWidth } = Dimensions.get('window');
const HERO_HEIGHT = 267;
const COUPON_CARD_GAP = 12;
const COUPON_CARD_WIDTH = (screenWidth - 40 - COUPON_CARD_GAP) / 2;

// Ticket SVG constants
const TICKET_VB_W = 164;
const TICKET_VB_H = 170;
const TICKET_CARD_HEIGHT = COUPON_CARD_WIDTH * (TICKET_VB_H / TICKET_VB_W);

const TICKET_CLIP_PATH =
  'M20 0 H144 C155.046 0 164 8.954 164 20 V30 ' +
  'C157.373 30 152 35.373 152 42 C152 48.627 157.373 54 164 54 ' +
  'V150 C164 161.046 155.046 170 144 170 H20 ' +
  'C8.954 170 0 161.046 0 150 V54 ' +
  'C6.627 54 12 48.627 12 42 C12 35.373 6.627 30 0 30 ' +
  'V20 C0 8.954 8.954 0 20 0 Z';

type TabKey = 'coupons' | 'menu' | 'about';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Filled star icon */
const StarIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M11.4417 2.925L12.9084 5.85833C13.1084 6.26667 13.6417 6.65833 14.0917 6.73333L16.75 7.175C18.45 7.45833 18.85 8.69167 17.6251 9.90833L15.5584 11.975C15.2084 12.325 15.0167 13 15.1251 13.4833L15.7167 16.0417C16.1834 18.0667 15.1084 18.85 13.3167 17.7917L10.8251 16.3167C10.3751 16.05 9.63341 16.05 9.17508 16.3167L6.68341 17.7917C4.90008 18.85 3.81674 18.0583 4.28341 16.0417L4.87508 13.4833C4.98341 13 4.79174 12.325 4.44174 11.975L2.37508 9.90833C1.15841 8.69167 1.55008 7.45833 3.25008 7.175L5.90841 6.73333C6.35008 6.65833 6.88341 6.26667 7.08341 5.85833L8.55008 2.925C9.35008 1.33333 10.6501 1.33333 11.4417 2.925Z"
      fill="#F3C562"
    />
  </Svg>
);

/** SVG ticket background for coupon card */
const TicketBackground = React.memo(
  ({ width, height }: { width: number; height: number }) => (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${TICKET_VB_W} ${TICKET_VB_H}`}
      style={StyleSheet.absoluteFillObject}
    >
      <Defs>
        <ClipPath id="ticketClip">
          <Path d={TICKET_CLIP_PATH} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#ticketClip)">
        <Rect x="0" y="0" width={TICKET_VB_W} height="85" fill="#F9A789" />
        <Rect x="0" y="85" width={TICKET_VB_W} height="85" fill="#FFFFFF" />
        <Line x1="0" y1="139" x2={TICKET_VB_W} y2="139" stroke="#ECE7F8" strokeWidth="0.8" />
      </G>
      <Line x1="14" y1="85" x2="150" y2="85" stroke="#E8D5CF" strokeWidth="1.5" strokeDasharray="6,5" />
    </Svg>
  )
);

/** Coupon card */
const CouponCard = React.memo(
  ({ coupon, pointRate, onPress, loading }: {
    coupon: Coupon; pointRate?: number; onPress?: (coupon: Coupon) => void; loading?: boolean;
  }) => {
    const { t } = useTranslation();
    const discountAmount = coupon.couponPrice ?? coupon.discount ?? 0;
    const discountLabel = discountAmount > 0 ? `Flat $${discountAmount} off` : coupon.couponName;
    const minSpend = coupon.couponLimit ?? coupon.minAmount ?? 0;
    const conditionText = minSpend > 0 ? `Orders over $${minSpend}` : '';
    const showEarnBadge = (pointRate ?? 0) > 1;
    const earnBackPoints = discountAmount > 0 && pointRate ? Math.round(discountAmount * pointRate) : 0;

    return (
      <TouchableOpacity style={s.couponCard} onPress={() => onPress?.(coupon)} activeOpacity={0.85} disabled={loading}>
        <TicketBackground width={COUPON_CARD_WIDTH} height={TICKET_CARD_HEIGHT} />
        <View style={s.couponOverlay}>
          <View style={s.couponTopContent}>
            {showEarnBadge && (
              <View style={s.couponEarnRow}>
                <FlameIcon size={14} />
                <LinearGradient colors={['#F9701A', '#EF4741']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.couponEarnBadge}>
                  <Text style={s.couponEarnBadgeText}>Earn × {pointRate}</Text>
                </LinearGradient>
              </View>
            )}
            <Text style={s.couponDiscountLabel} numberOfLines={2}>{discountLabel}</Text>
          </View>
          <View style={s.couponMiddleContent}>
            <Text style={s.couponConditionText} numberOfLines={1}>{conditionText || coupon.couponName}</Text>
            {earnBackPoints > 0 && (
              <Text style={s.couponEarnBackText}>
                Earn back <Text style={s.couponEarnBackBold}>{earnBackPoints} points</Text>
              </Text>
            )}
          </View>
          <View style={s.couponBottomContent}>
            {loading ? (
              <ActivityIndicator size="small" color="#FF7763" />
            ) : (
              <Text style={s.couponBottomLabel}>
                {coupon.couponPrice ? `${coupon.couponPrice} Points` : t('community.merchantDetail.useCoupon', 'Use')}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

/** Menu item row */
const MenuItemRow = React.memo(({ item }: { item: MenuItem }) => {
  const displayName = item.menuName || item.name || '';
  const displayPrice = item.price !== undefined && item.price !== null ? `$ ${Number(item.price).toFixed(2)}` : '';

  return (
    <View style={s.menuItemRow}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={s.menuItemImage} />
      ) : (
        <View style={[s.menuItemImage, s.menuItemImagePlaceholder]} />
      )}
      <View style={s.menuItemInfo}>
        <Text style={s.menuItemName} numberOfLines={1}>{displayName}</Text>
        {item.description && <Text style={s.menuItemDesc} numberOfLines={1}>{item.description}</Text>}
        {displayPrice ? <Text style={s.menuItemPrice}>{displayPrice}</Text> : null}
      </View>
    </View>
  );
});

/** About info row with circular icon */
const AboutRow = React.memo(
  ({ icon, title, subtitle, color }: {
    icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string | null; color?: string;
  }) => {
    if (!title && !subtitle) return null;
    return (
      <View style={s.aboutRow}>
        <View style={s.aboutIconCircle}>
          <Ionicons name={icon} size={19} color="#FF7763" />
        </View>
        <View style={s.aboutTextWrap}>
          <Text style={[s.aboutTitle, color ? { color } : null]}>{title}</Text>
          {subtitle ? <Text style={s.aboutSubtitle}>{subtitle}</Text> : null}
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

  const merchantId: number = route.params?.merchantId;
  const passedMerchant: any = route.params?.merchant;

  const [merchant, setMerchant] = useState<Merchant | null>(passedMerchant ?? null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('coupons');
  const [bookmarked, setBookmarked] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [writingOffId, setWritingOffId] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pointRate, setPointRate] = useState<number>(1);

  // Data fetching
  const fetchMerchantDetail = useCallback(async () => {
    if (!merchantId) return;
    try {
      setLoading(true);
      const response = await merchantAPI.getMerchantDetail(merchantId);
      if (response.code === 200 && response.data) setMerchant(response.data);
    } catch (error) {
      console.error('[MerchantDetail] Failed:', error);
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
      console.error('[MerchantDetail] Coupons failed:', error);
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
      console.error('[MerchantDetail] Menu failed:', error);
    } finally {
      setMenuLoading(false);
    }
  }, [merchantId]);

  useEffect(() => { fetchMerchantDetail(); }, [fetchMerchantDetail]);

  useEffect(() => {
    const userId = user?.id || (user as any)?.userId;
    if (!userId) return;
    getUserExLevelInfo(userId)
      .then((info) => { const rate = info?.sysUserLevel?.pointRate; if (rate && rate > 0) setPointRate(rate); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeTab === 'coupons') fetchCoupons();
    else if (activeTab === 'menu') fetchMenu();
  }, [activeTab, fetchCoupons, fetchMenu]);

  // Derived
  const earnMultiplier = merchant?.earnPoints ?? passedMerchant?.earnPoints ?? 1;
  const merchantName = merchant?.merchantName || passedMerchant?.title || passedMerchant?.name || '';
  const schoolName = passedMerchant?.schoolName || '';
  const distance = passedMerchant?.distance || '';
  const merchantImage = merchant?.shopImg || merchant?.logo || passedMerchant?.image;
  const category = merchant?.category || passedMerchant?.category || '';
  const tags = passedMerchant?.tags || (category ? category.split(',').map((t: string) => t.trim()).filter(Boolean) : []);

  const menuCategories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach((item) => { if (item.category) cats.add(item.category); });
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  // Handlers
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleToggleBookmark = useCallback(() => setBookmarked((p) => !p), []);
  const handleTabPress = useCallback((tab: TabKey) => setActiveTab(tab), []);

  const handleWriteOff = useCallback(
    (coupon: Coupon) => {
      const couponCode = coupon.code;
      const userId = user?.id || (user as any)?.userId;
      if (!couponCode || !userId) return;
      Alert.alert(
        t('community.merchantDetail.writeOffConfirmTitle', 'Use Coupon'),
        t('community.merchantDetail.writeOffConfirmMsg', 'Are you sure you want to use this coupon?'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.confirm', 'Confirm'), style: 'destructive',
            onPress: async () => {
              try {
                setWritingOffId(coupon.id);
                const result = await couponAPI.writeOffCoupon({ couponNo: couponCode, merchantId, userId: parseInt(String(userId)) });
                if (result.code === 200) {
                  Alert.alert(t('common.success', 'Success'), t('community.merchantDetail.writeOffSuccess', 'Coupon used!'));
                  fetchCoupons();
                } else {
                  Alert.alert(t('common.error', 'Error'), result.msg || t('community.merchantDetail.writeOffFailed', 'Failed'));
                }
              } catch { Alert.alert(t('common.error', 'Error'), t('community.merchantDetail.writeOffFailed', 'Failed'));
              } finally { setWritingOffId(null); }
            },
          },
        ]
      );
    },
    [merchantId, user, t, fetchCoupons]
  );

  const tabs: { key: TabKey; label: string }[] = useMemo(() => [
    { key: 'coupons', label: t('community.merchantDetail.coupons', 'Coupons') },
    { key: 'menu', label: t('community.merchantDetail.menu', 'Menu') },
    { key: 'about', label: t('community.merchantDetail.about', 'About') },
  ], [t]);

  // Render tabs
  const renderCouponsTab = useCallback(() => {
    if (couponsLoading) return <View style={s.centeredLoader}><ActivityIndicator size="small" color="#FF7763" /></View>;
    if (coupons.length === 0) return (
      <View style={s.emptyState}>
        <Ionicons name="ticket-outline" size={48} color="#ccc" />
        <Text style={s.emptyText}>{t('community.merchantDetail.noCoupons', 'No coupons available')}</Text>
      </View>
    );
    const rows: Coupon[][] = [];
    for (let i = 0; i < coupons.length; i += 2) rows.push(coupons.slice(i, i + 2));
    return (
      <View>
        {rows.map((row, idx) => (
          <View key={idx} style={s.couponRow}>
            {row.map((c) => <CouponCard key={c.id} coupon={c} pointRate={pointRate} onPress={handleWriteOff} loading={writingOffId === c.id} />)}
            {row.length === 1 && <View style={{ width: COUPON_CARD_WIDTH }} />}
          </View>
        ))}
      </View>
    );
  }, [coupons, couponsLoading, pointRate, handleWriteOff, writingOffId, t]);

  const renderMenuTab = useCallback(() => {
    if (menuLoading) return <View style={s.centeredLoader}><ActivityIndicator size="small" color="#FF7763" /></View>;
    if (menuItems.length === 0) return (
      <View style={s.emptyState}>
        <Ionicons name="restaurant-outline" size={48} color="#ccc" />
        <Text style={s.emptyText}>{t('community.merchantDetail.noMenu', 'No menu items')}</Text>
      </View>
    );

    // Group by category
    const grouped = filteredMenuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
      const cat = item.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    return (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryChipsScroll} contentContainerStyle={s.categoryChipsContent}>
          {menuCategories.map((cat) => {
            const isActive = cat === selectedCategory;
            return (
              <TouchableOpacity key={cat} style={[s.categoryChip, isActive && s.categoryChipActive]} onPress={() => setSelectedCategory(cat)} activeOpacity={0.7}>
                <Text style={[s.categoryChipText, isActive && s.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {Object.entries(grouped).map(([catName, items]) => (
          <View key={catName}>
            <Text style={s.menuCategoryTitle}>{catName}</Text>
            {items.map((item) => <MenuItemRow key={item.id} item={item} />)}
          </View>
        ))}
      </View>
    );
  }, [menuItems, menuLoading, menuCategories, filteredMenuItems, selectedCategory, t]);

  const renderAboutTab = useCallback(() => {
    return (
      <View style={s.aboutContainer}>
        {merchant?.remark && (
          <AboutRow icon="time-outline" title={t('community.merchantDetail.open', 'Open')} subtitle={merchant.remark} color="#4CAF50" />
        )}
        {merchant?.merchantAddress && (
          <AboutRow icon="location-outline" title={merchant.merchantAddress} subtitle={null} />
        )}
        {merchant?.email && (
          <AboutRow icon="globe-outline" title={merchant.email} />
        )}
        {merchant?.phonenumber && (
          <AboutRow icon="call-outline" title={merchant.phonenumber} />
        )}
        {merchant?.merchantDesc && (
          <>
            <View style={s.aboutDivider} />
            <Text style={s.fromOwnersHeader}>{t('community.merchantDetail.fromOwners', 'FROM THE OWNERS')}</Text>
            <Text style={s.aboutDescription}>{merchant.merchantDesc}</Text>
          </>
        )}
      </View>
    );
  }, [merchant, t]);

  // Loading state
  if (loading && !merchant) {
    return (
      <View style={[s.container, s.centeredLoader]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#FF7763" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={s.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>

        {/* ---- Hero Section ---- */}
        <View style={s.heroContainer}>
          {merchantImage ? (
            <Image source={{ uri: merchantImage }} style={s.heroImage} resizeMode="cover" />
          ) : (
            <View style={[s.heroImage, s.heroPlaceholder]}>
              <Ionicons name="storefront-outline" size={56} color="#fff" />
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity style={[s.heroBtn, s.heroBtnLeft, { top: insets.top + 8 }]} onPress={handleGoBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>

          {/* Right buttons: Share + Bookmark */}
          <View style={[s.heroBtnRightGroup, { top: insets.top + 8 }]}>
            <TouchableOpacity style={s.heroBtn} activeOpacity={0.7}>
              <ExternalLinkIcon size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={s.heroBtn} onPress={handleToggleBookmark} activeOpacity={0.7}>
              <BookmarkAddIcon size={22} color={bookmarked ? '#FF7763' : '#000'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ---- Merchant Info ---- */}
        <View style={s.infoSection}>
          {/* Earn badge */}
          <View style={s.earnRow}>
            {earnMultiplier > 1 && <FlameIcon size={18} />}
            {earnMultiplier > 1 ? (
              <LinearGradient colors={['#F9701A', '#EF4741']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.earnBadge}>
                <Text style={s.earnBadgeText}>Earn × {earnMultiplier}</Text>
              </LinearGradient>
            ) : (
              <View style={s.earnBadgeSimple}>
                <Text style={s.earnBadgeText}>Earn</Text>
              </View>
            )}
          </View>

          {/* Name row + Rating */}
          <View style={s.nameRow}>
            <Text style={s.merchantName} numberOfLines={1}>{merchantName}</Text>
            {/* Rating hidden until API supports */}
          </View>

          {/* School/Distance + Tags row */}
          <View style={s.metaRow}>
            <View style={s.schoolRow}>
              <SchoolMarkerIcon size={13} color="#949494" />
              <Text style={s.schoolText}>{schoolName}{schoolName && distance ? ' · ' : ''}{distance}</Text>
            </View>
            {tags.length > 0 && (
              <View style={s.tagsRow}>
                {tags.slice(0, 3).map((tag: string, i: number) => (
                  <View key={`${tag}-${i}`} style={s.categoryTag}>
                    <Text style={s.categoryTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ---- Tab Bar ---- */}
        <View style={s.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => handleTabPress(tab.key)} activeOpacity={0.7}>
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
                {isActive && <View style={s.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ---- Tab Content ---- */}
        <View style={s.tabContent}>
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
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF3F1' },
  scrollView: { flex: 1 },

  // Hero
  heroContainer: { width: screenWidth, height: HERO_HEIGHT, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { backgroundColor: '#FF7763', alignItems: 'center', justifyContent: 'center' },
  heroBtn: {
    position: 'absolute',
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  heroBtnLeft: { left: 16 },
  heroBtnRightGroup: {
    position: 'absolute', right: 16,
    flexDirection: 'row', gap: 10,
  },

  // Info section
  infoSection: { paddingHorizontal: 20, marginTop: -20, backgroundColor: '#FAF3F1', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16 },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  earnBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  earnBadgeSimple: { backgroundColor: '#F1B22B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  earnBadgeText: { fontFamily: 'Poppins_500Medium', fontWeight: '500', fontSize: 12, color: '#FFFFFF', lineHeight: 18 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  merchantName: { fontFamily: 'Poppins_700Bold', fontWeight: '700', fontSize: 28, color: '#000', flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  schoolText: { fontFamily: 'Poppins_500Medium', fontWeight: '500', fontSize: 11, color: '#949494', lineHeight: 15 },
  tagsRow: { flexDirection: 'row', gap: 6 },
  categoryTag: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#E0E0E0' },
  categoryTagText: { fontFamily: 'Poppins_500Medium', fontSize: 10, color: '#444' },

  // Tab bar
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', gap: 24, marginTop: 12 },
  tabItem: { paddingBottom: 10, alignItems: 'center' },
  tabText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#949494' },
  tabTextActive: { color: '#FF7763' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#FF7763', borderRadius: 1 },
  tabContent: { paddingHorizontal: 20, paddingTop: 16 },

  // Shared
  centeredLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#949494', marginTop: 12 },

  // Coupons
  couponRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: COUPON_CARD_GAP },
  couponCard: { width: COUPON_CARD_WIDTH, height: TICKET_CARD_HEIGHT },
  couponOverlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 14 },
  couponTopContent: { flex: 50, justifyContent: 'flex-end', paddingBottom: 10 },
  couponEarnRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  couponEarnBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  couponEarnBadgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: '#fff' },
  couponDiscountLabel: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#FFFFFF', fontStyle: 'italic', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  couponMiddleContent: { flex: 32, justifyContent: 'center', paddingTop: 4 },
  couponConditionText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#393540', marginBottom: 2 },
  couponEarnBackText: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#5B5760', marginTop: 2 },
  couponEarnBackBold: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: '#5B5760' },
  couponBottomContent: { flex: 18, alignItems: 'center', justifyContent: 'center' },
  couponBottomLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#000' },

  // Menu
  categoryChipsScroll: { marginBottom: 16 },
  categoryChipsContent: { gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE6E3' },
  categoryChipActive: { backgroundColor: '#FF7763', borderColor: '#FF7763' },
  categoryChipText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#949494' },
  categoryChipTextActive: { color: '#fff' },
  menuCategoryTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#000', marginTop: 8, marginBottom: 12 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0ECEA' },
  menuItemImage: { width: 70, height: 70, borderRadius: 10 },
  menuItemImagePlaceholder: { backgroundColor: '#E8E8E8' },
  menuItemInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  menuItemName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#000' },
  menuItemDesc: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#949494', marginTop: 2 },
  menuItemPrice: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#000', marginTop: 4 },

  // About
  aboutContainer: { gap: 20 },
  aboutRow: { flexDirection: 'row', alignItems: 'center' },
  aboutIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(249, 167, 137, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  aboutTextWrap: { flex: 1 },
  aboutTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#000' },
  aboutSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#949494', marginTop: 2 },
  aboutDivider: { height: 1, backgroundColor: '#EDE6E3' },
  fromOwnersHeader: { fontFamily: 'IBMPlexMono_600SemiBold', fontSize: 12, fontWeight: '600', color: '#949494', letterSpacing: 1, lineHeight: 16 },
  aboutDescription: { fontFamily: 'Poppins_300Light', fontSize: 15, fontWeight: '300', color: '#333', lineHeight: 23 },
});
