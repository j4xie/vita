import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
  ImageBackground,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { calculateTier, getNextTierPoints } from '../../utils/membershipTierCalculator';
import { theme } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

// Mock Data for Benefits
const BENEFITS = [
  { id: '1', title: 'Merchant\nCoupons', icon: 'gift-outline' },
  { id: '2', title: 'Platform\nCoupons', icon: 'ticket-outline' },
  { id: '3', title: 'Points\nMall', icon: 'storefront-outline' },
  { id: '4', title: 'Group\nBuy', icon: 'people-outline' },
];

// Mock Data for Services (Bottom Section)
const SERVICES = [
  { id: '1', title: 'Points\nBalance', subtitle: '0 Points', icon: 'wallet-outline' },
  { id: '2', title: 'My\nCoupons', subtitle: 'View Active', icon: 'pricetag-outline' },
  { id: '3', title: 'Refer\nFriends', subtitle: 'Earn', icon: 'share-social-outline' },
];

// Login Prompt Perks Preview Data
const PERKS_PREVIEW = [
  { id: '1', titleKey: 'rewards.loginPrompt.perks.points', icon: 'star-outline' },
  { id: '2', titleKey: 'rewards.loginPrompt.perks.coupons', icon: 'ticket-outline' },
  { id: '3', titleKey: 'rewards.loginPrompt.perks.rewards', icon: 'gift-outline' },
  { id: '4', titleKey: 'rewards.loginPrompt.perks.discounts', icon: 'pricetag-outline' },
];

// Login Prompt Section Component
interface LoginPromptSectionProps {
  onLogin: () => void;
  t: (key: string) => string;
}

const LoginPromptSection: React.FC<LoginPromptSectionProps> = React.memo(({ onLogin, t }) => {
  return (
    <View style={loginPromptStyles.container}>
      {/* Hero Section */}
      <View style={loginPromptStyles.heroSection}>
        <View style={loginPromptStyles.iconCircle}>
          <Ionicons name="gift-outline" size={48} color="#D4AF37" />
        </View>

        <Text style={loginPromptStyles.title}>
          {t('rewards.loginPrompt.title')}
        </Text>

        <Text style={loginPromptStyles.description}>
          {t('rewards.loginPrompt.description')}
        </Text>

        {/* Login Button */}
        <TouchableOpacity onPress={onLogin} activeOpacity={0.8}>
          <LinearGradient
            colors={['#A67C52', '#EEDC82', '#A67C52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={loginPromptStyles.loginButton}
          >
            <Text style={loginPromptStyles.loginButtonText}>
              {t('rewards.loginPrompt.button')}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Perks Preview Section */}
      <View style={loginPromptStyles.perksSection}>
        <View style={loginPromptStyles.dividerContainer}>
          <View style={loginPromptStyles.dividerLine} />
          <Text style={loginPromptStyles.dividerText}>
            {t('rewards.loginPrompt.perksPreview')}
          </Text>
          <View style={loginPromptStyles.dividerLine} />
        </View>

        <View style={loginPromptStyles.perksGrid}>
          {PERKS_PREVIEW.map((perk) => (
            <View key={perk.id} style={loginPromptStyles.perkItem}>
              <View style={loginPromptStyles.perkIconCircle}>
                <Ionicons name={perk.icon as any} size={24} color="#D4AF37" />
              </View>
              <Text style={loginPromptStyles.perkText}>{t(perk.titleKey)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

export const PointsMallHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const userPoints = user?.points || 0;
  // Simple Tier Logic for Display
  const currentTier = 'BRONZE MEMBER'; // Default
  const nextTierPoints = 100;
  const progressPercent = Math.min((userPoints / nextTierPoints) * 100, 100);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleBenefitPress = (id: string) => {
    if (id === '3') { // Points Mall
      navigation.navigate('PointsMallList');
    } else {
      Alert.alert('Coming Soon', 'This feature is under development.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dark Header Background */}
      <View style={styles.darkHeaderBg}>
        <View style={[styles.header, { marginTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Membership</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Show Login Prompt or Membership Content based on user state */}
        {!user ? (
          <LoginPromptSection onLogin={() => navigation.navigate('Login')} t={t} />
        ) : (
          <>
        {/* Membership Card */}
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#A67C52', '#EEDC82', '#A67C52']} // Gold Gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.membershipCard}
          >
            {/* Pattern Overlay (Optional) */}
            <View style={styles.cardPattern} />

            <View style={styles.cardTop}>
              <Text style={styles.cardBrand}>POMELOX  ::::::::::</Text>
            </View>

            <View style={styles.cardMiddle}>
              <Text style={styles.tierText}>{currentTier}</Text>
            </View>

            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.pointsValue}>{userPoints}</Text>
                <Text style={styles.pointsLabel}>POINTS</Text>
              </View>
              <View style={styles.progressSection}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progressPercent)}% to Next Tier</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Member Benefits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MEMBER BENEFITS</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.benefitsGrid}>
            {BENEFITS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.benefitItem} onPress={() => handleBenefitPress(item.id)}>
                <View style={styles.benefitIconContainer}>
                  <Ionicons name={item.icon as any} size={24} color="#D4AF37" />
                </View>
                <Text style={styles.benefitText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privileges & Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVILEGES & SERVICES</Text>

          {/* Big Banner Button */}
          <TouchableOpacity style={styles.mallBanner} onPress={() => navigation.navigate('PointsMallList')}>
            <View style={styles.mallIconCircle}>
              <Ionicons name="storefront-outline" size={24} color="#000" />
            </View>
            <View style={styles.mallTextContent}>
              <Text style={styles.mallTitle}>Points Mall</Text>
              <Text style={styles.mallSubtitle}>Exclusive Rewards</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={16} color="#000" style={{ transform: [{ rotate: '-45deg' }] }} />
            </View>
          </TouchableOpacity>

          {/* Services Row */}
          <View style={styles.servicesRow}>
            {SERVICES.map((item) => (
              <TouchableOpacity key={item.id} style={styles.serviceCard}>
                <View style={styles.serviceIconCircle}>
                  <Ionicons name={item.icon as any} size={24} color="#8E8E93" />
                </View>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                {item.subtitle && <Text style={styles.serviceSubtitle}>{item.subtitle}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
          </>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F2', // Pinkish background
  },
  darkHeaderBg: {
    backgroundColor: '#111', // Dark background for the top part
    paddingBottom: 60, // Extend behind the card
    borderBottomLeftRadius: 30, // Rounded bottom
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    marginTop: -40, // Pull up over the dark header
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  membershipCard: {
    borderRadius: 20,
    padding: 24,
    height: 200, // Fixed height
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
    // Add customized pattern logic here if needed
  },
  cardTop: {},
  cardBrand: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  tierText: {
    fontSize: 28, // Large serif font
    fontWeight: '400',
    color: '#FFF',
    letterSpacing: 1,
    fontFamily: 'Georgia', // Using system serif font as fallback
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '400',
    color: '#FFF',
  },
  pointsLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    marginTop: 4,
  },
  progressSection: {
    width: 120,
    alignItems: 'flex-end',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  progressText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },

  // Benefits
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  benefitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  benefitItem: {
    alignItems: 'center',
    width: 70,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000', // Black circle
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 11,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },

  // Privileges
  mallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 40, // Pill shape
    padding: 12,
    paddingRight: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4AF37', // Gold border
  },
  mallIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF9E6', // Light gold
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mallTextContent: {
    flex: 1,
  },
  mallTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  mallSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  serviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

// Login Prompt Styles
const loginPromptStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 28,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  perksSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  perkItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  perkIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  perkText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'center',
  },
});
