import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MembershipTier } from '../../types/pointsMall';
import { BenefitsCarousel } from '../../components/rewards/BenefitsCarousel';
import { useUser } from '../../context/UserContext';
import { calculateTier, getNextTierPoints, generateMembershipInfo } from '../../utils/membershipTierCalculator';
import { MembershipCard } from '../../components/rewards/MembershipCard';
import { theme } from '../../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * PointsMallHomeScreen - Dark Luxury Edition
 * 
 * Design Updates:
 * - Sticky Header with Fade Animation
 * - Fixed z-index layering (Header > Card > Background)
 */
export const PointsMallHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // State
  const [refreshing, setRefreshing] = useState(false);

  // Animation
  const scrollY = useRef(new Animated.Value(0)).current;

  // User Data
  const userPoints = user?.points || 0;
  const currentTier = calculateTier(userPoints);
  const membershipInfo = generateMembershipInfo(user || {}, userPoints);

  // Benefits Data
  const benefits = [
    { id: '1', icon: 'gift-outline', title: t('rewards.benefits.merchant_coupon') },
    { id: '2', icon: 'ticket-outline', title: t('rewards.benefits.platform_coupon') },
    { id: '3', icon: 'storefront-outline', title: t('rewards.benefits.points_mall') },
    { id: '4', icon: 'people-outline', title: t('rewards.benefits.group_buy') },
    { id: '5', icon: 'restaurant-outline', title: t('rewards.benefits.free_meal'), redCardOnly: true },
    { id: '6', icon: 'sparkles', title: t('rewards.benefits.exclusive_coupon'), redCardOnly: true },
    { id: '7', icon: 'trending-up', title: t('rewards.benefits.points_boost'), redCardOnly: true },
  ];

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Header Animation Interpolation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Handlers for missing features
  const handleViewAllBenefits = () => {
    Alert.alert(
      t('common.coming_soon', 'Coming Soon'),
      t('rewards.benefits.more_coming', 'More member benefits are on the way!')
    );
  };

  const handleMyCoupons = () => {
    // API exists (couponAPI.ts) but screen is missing
    Alert.alert(
      t('common.coming_soon', 'Coming Soon'),
      t('rewards.menu.coupons_coming', 'My Coupons screen is under development.')
    );
  };

  const handleReferFriends = () => {
    Alert.alert(
      t('common.coming_soon', 'Coming Soon'),
      t('rewards.menu.referral_coming', 'Referral feature is under development.')
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Fixed Background Decoration (Lowest Layer) */}
      <View style={styles.darkHeaderBg} />

      {/* 2. Sticky Header (Highest Layer) */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top,
            backgroundColor: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(18, 18, 18, 0)', 'rgba(18, 18, 18, 1)']
            })
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) parent.navigate('Explore');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('rewards.title', 'Membership')}</Text>
          </View>

        </View>
      </Animated.View>

      {/* 3. Scrollable Content (Middle Layer) */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 100, // Push content down to reveal background
          paddingBottom: insets.bottom + 40
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" />
        }
      >
        {/* Card Container */}
        <View style={styles.cardContainer}>
          <MembershipCard membershipInfo={membershipInfo} />
        </View>

        {/* Member Benefits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('rewards.benefits.title')}</Text>
            <TouchableOpacity onPress={handleViewAllBenefits}>
              <Text style={styles.seeAllText}>{t('common.see_all', 'View All')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.benefitsContainer}>
            <BenefitsCarousel benefits={benefits} />
          </View>
        </View>

        {/* Services Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('rewards.menu.services', 'Privileges & Services')}</Text>
          </View>

          <View style={styles.menuGrid}>
            {/* Points Mall - Featured */}
            <TouchableOpacity
              style={[styles.gridItem, styles.gridItemFeatured]}
              onPress={() => navigation.navigate('PointsMallList')}
              activeOpacity={0.8}
            >
              <View style={styles.gridContent}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFF9E5' }]}>
                  <Ionicons name="storefront" size={22} color="#D4AF37" />
                </View>
                <View style={styles.gridTextContainer}>
                  <Text style={styles.gridTitle}>{t('rewards.menu.points_mall')}</Text>
                  <Text style={styles.gridSubtitle}>{t('rewards.menu.redeem_rewards', 'Exclusive Rewards')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
            </TouchableOpacity>

            {/* Points Balance */}
            <TouchableOpacity style={styles.gridItem} activeOpacity={0.8}>
              <View style={styles.gridContent}>
                <View style={[styles.iconContainer, { backgroundColor: '#F8F8F8' }]}>
                  <Ionicons name="wallet-outline" size={22} color="#1A1A1A" />
                </View>
                <View style={styles.gridTextContainer}>
                  <Text style={styles.gridTitle}>{t('rewards.menu.points_balance')}</Text>
                  <Text style={styles.gridSubtitle}>{userPoints} {t('rewards.menu.points')}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* My Coupons */}
            <TouchableOpacity
              style={styles.gridItem}
              activeOpacity={0.8}
              onPress={handleMyCoupons}
            >
              <View style={styles.gridContent}>
                <View style={[styles.iconContainer, { backgroundColor: '#F8F8F8' }]}>
                  <Ionicons name="ticket-outline" size={22} color="#1A1A1A" />
                </View>
                <View style={styles.gridTextContainer}>
                  <Text style={styles.gridTitle}>{t('rewards.menu.my_coupons')}</Text>
                  <Text style={styles.gridSubtitle}>{t('rewards.menu.view_coupons', 'View Active')}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Refer Friends */}
            <TouchableOpacity
              style={styles.gridItem}
              activeOpacity={0.8}
              onPress={handleReferFriends}
            >
              <View style={styles.gridContent}>
                <View style={[styles.iconContainer, { backgroundColor: '#F8F8F8' }]}>
                  <Ionicons name="share-social-outline" size={22} color="#1A1A1A" />
                </View>
                <View style={styles.gridTextContainer}>
                  <Text style={styles.gridTitle}>{t('rewards.menu.refer_friends')}</Text>
                  <Text style={styles.gridSubtitle}>{t('rewards.menu.earn_points')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exclusive Tasks - Diamond Only */}
        {currentTier === MembershipTier.DIAMOND && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('rewards.menu.exclusive_tasks', 'Diamond Privileges')}</Text>
              <View style={styles.diamondBadge}>
                <Ionicons name="diamond" size={10} color="#FFFFFF" />
                <Text style={styles.diamondBadgeText}>VIP</Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
                <View style={styles.listItemLeft}>
                  <View style={[styles.listIcon, { backgroundColor: '#1A1A1A' }]}>
                    <Ionicons name="create-outline" size={18} color="#D4AF37" />
                  </View>
                  <View>
                    <Text style={styles.listItemTitle}>{t('rewards.menu.review_tasks')}</Text>
                    <Text style={styles.listItemSubtitle}>{t('rewards.menu.red_card_exclusive')}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
                <View style={styles.listItemLeft}>
                  <View style={[styles.listIcon, { backgroundColor: '#1A1A1A' }]}>
                    <Ionicons name="restaurant-outline" size={18} color="#D4AF37" />
                  </View>
                  <View>
                    <Text style={styles.listItemTitle}>{t('rewards.menu.free_meal_signup')}</Text>
                    <Text style={styles.listItemSubtitle}>{t('rewards.menu.red_card_exclusive')}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCF8',
  },

  // 1. Background Decoration
  darkHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: '#121212',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 0, // Behind everything
  },

  // 2. Sticky Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // On top of everything
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Scroll Content
  scrollView: {
    flex: 1,
    zIndex: 1, // Above background, below header
  },

  cardContainer: {
    marginBottom: 24,
  },

  // Sections
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },

  seeAllText: {
    fontSize: 13,
    color: '#D4AF37', // Gold
    fontWeight: '600',
  },

  // Benefits
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },

  // Grid Menu
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  gridItem: {
    width: '48%', // 2 columns
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    minHeight: 80,
  },

  gridItemFeatured: {
    width: '100%', // Full width for featured item
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)', // Subtle gold border
  },

  gridContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gridTextContainer: {
    flex: 1,
  },

  gridTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },

  gridSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // List Container for Exclusive Tasks
  listContainer: {
    backgroundColor: '#121212', // Dark luxury background for VIP section
    borderRadius: 20,
    overflow: 'hidden',
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },

  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF', // White text on dark bg
  },

  listItemSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 76,
  },

  diamondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },

  diamondBadgeText: {
    color: '#D4AF37', // Gold text
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  }

});
