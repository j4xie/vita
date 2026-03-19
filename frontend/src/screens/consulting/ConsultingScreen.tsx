import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

const CHINESEUNION_BASE_URL = 'https://www.chineseunion.org';

interface ConsultingScreenProps {
  isTabRoot?: boolean;
}

// 2x2 grid service card
const ServiceCard = memo(({
  icon,
  title,
  desc,
  color,
  onPress,
  isDarkMode,
  cardWidth,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  color: string;
  onPress: () => void;
  isDarkMode: boolean;
  cardWidth: number;
}) => (
  <TouchableOpacity
    style={[styles.gridCard, { width: cardWidth }, isDarkMode && styles.gridCardDark]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.gridIconWrap, { backgroundColor: color + '12' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.gridCardTitle, isDarkMode && styles.textWhite]} numberOfLines={2}>
      {title}
    </Text>
    <Text style={[styles.gridCardDesc, isDarkMode && styles.textGrayDark]} numberOfLines={3}>
      {desc}
    </Text>
    <View style={styles.gridCardArrow}>
      <Ionicons name="arrow-forward" size={14} color={color} />
    </View>
  </TouchableOpacity>
));

// Quick link pill
const QuickLink = memo(({
  icon,
  label,
  onPress,
  isDarkMode,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isDarkMode: boolean;
}) => (
  <TouchableOpacity
    style={[styles.quickLink, isDarkMode && styles.quickLinkDark]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={16} color={theme.colors.primary} />
    <Text style={[styles.quickLinkText, isDarkMode && styles.textWhite]}>{label}</Text>
    <Ionicons name="open-outline" size={12} color={isDarkMode ? '#666' : '#bbb'} />
  </TouchableOpacity>
));

export const ConsultingScreen: React.FC<ConsultingScreenProps> = ({ isTabRoot = false }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const gridCardWidth = useMemo(() => (windowWidth - 40 - GRID_GAP) / 2, [windowWidth]);

  const handleGoBack = () => {
    if (Platform.OS === 'ios') Haptics.selectionAsync();
    navigation.goBack();
  };

  const handleOpenUrl = (url: string) => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(url);
  };

  const services = [
    {
      icon: 'compass-outline' as const,
      titleKey: 'consulting.services.academic',
      descKey: 'consulting.services.academic_desc',
      color: '#4285F4',
      url: `${CHINESEUNION_BASE_URL}/%e5%ad%a6%e7%94%9f%e6%9c%8d%e5%8a%a1-3/%e6%96%b0%e7%94%9f%e9%80%9a%e9%81%93/`,
    },
    {
      icon: 'home-outline' as const,
      titleKey: 'consulting.services.housing',
      descKey: 'consulting.services.housing_desc',
      color: '#34A853',
      url: `${CHINESEUNION_BASE_URL}/%e6%a0%a1%e5%a4%96%e7%a7%9f%e6%88%bf-3/`,
    },
    {
      icon: 'airplane-outline' as const,
      titleKey: 'consulting.services.arrival',
      descKey: 'consulting.services.arrival_desc',
      color: '#E8A317',
      url: `${CHINESEUNION_BASE_URL}/%e6%8e%a5%e6%9c%ba%e6%9c%8d%e5%8a%a1-2/`,
    },
    {
      icon: 'hand-left-outline' as const,
      titleKey: 'consulting.services.community',
      descKey: 'consulting.services.community_desc',
      color: '#EA4335',
      url: `${CHINESEUNION_BASE_URL}/%e6%96%b0%e7%94%9f%e8%a7%81%e9%9d%a2%e4%bc%9a/`,
    },
  ];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark, { paddingTop: insets.top + 8 }]}>
        {isTabRoot ? (
          <View style={styles.backButton} />
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          {t('consulting.page_title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Hero Banner */}
        <View style={styles.heroBannerWrap}>
          <LinearGradient
            colors={isDarkMode
              ? ['#2A1A10', '#1a1a1a']
              : ['#FFF5F0', '#FFE8DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            {/* Decorative circles */}
            <View style={[styles.heroCircle, styles.heroCircle1]} />
            <View style={[styles.heroCircle, styles.heroCircle2]} />

            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Ionicons name="school" size={14} color={theme.colors.primary} />
                <Text style={styles.heroBadgeText}>ChineseUnion</Text>
              </View>
              <Text style={[styles.heroTitle, isDarkMode && styles.textWhite]}>
                {t('consulting.hero_title')}
              </Text>
              <Text style={[styles.heroSubtitle, isDarkMode && styles.textGrayDark]}>
                {t('consulting.hero_subtitle')}
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => handleOpenUrl(CHINESEUNION_BASE_URL)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF8F65']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  <Ionicons name="globe-outline" size={18} color="#fff" />
                  <Text style={styles.ctaText}>{t('consulting.visit_website')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.85)" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Services Grid */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>
            {t('consulting.services_title')}
          </Text>
          <View style={styles.gridContainer}>
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                icon={service.icon}
                title={t(service.titleKey)}
                desc={t(service.descKey)}
                color={service.color}
                onPress={() => handleOpenUrl(service.url)}
                isDarkMode={isDarkMode}
                cardWidth={gridCardWidth}
              />
            ))}
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>
            {t('consulting.quick_links')}
          </Text>
          <QuickLink
            icon="shield-checkmark-outline"
            label={t('consulting.links.safety_plan')}
            onPress={() => handleOpenUrl(`${CHINESEUNION_BASE_URL}/%e5%ae%89%e5%bf%83%e8%ae%a1%e5%88%92%ef%bc%88new%ef%bc%89/`)}
            isDarkMode={isDarkMode}
          />
          <QuickLink
            icon="book-outline"
            label={t('consulting.links.student_notes')}
            onPress={() => handleOpenUrl(`${CHINESEUNION_BASE_URL}/%e6%96%b0%e7%94%9f%e7%ac%94%e8%ae%b0-%e3%80%90%e5%ad%90%e8%8f%9c%e5%8d%95%e3%80%91/`)}
            isDarkMode={isDarkMode}
          />
          <QuickLink
            icon="images-outline"
            label={t('consulting.links.freshers_album')}
            onPress={() => handleOpenUrl(`${CHINESEUNION_BASE_URL}/%e6%96%b0%e7%94%9f%e7%9b%b8%e5%86%8c%e3%80%90%e5%ad%90%e8%8f%9c%e5%8d%95%e3%80%91/`)}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Footer Info */}
        <View style={[styles.footerCard, isDarkMode && styles.footerCardDark]}>
          <Ionicons name="information-circle-outline" size={18} color={isDarkMode ? '#666' : '#9CA3AF'} />
          <Text style={[styles.footerText, isDarkMode && styles.textGrayDark]}>
            {t('consulting.contact_info')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const GRID_GAP = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },
  containerDark: {
    backgroundColor: '#000000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  headerDark: {
    backgroundColor: '#000000',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  // Hero Banner
  heroBannerWrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
    marginBottom: 24,
  },
  heroBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  heroCircle1: {
    width: 180,
    height: 180,
    top: -60,
    right: -40,
  },
  heroCircle2: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -20,
  },
  heroContent: {
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B35',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 20,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Section
  sectionWrap: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    minHeight: 170,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  gridCardDark: {
    backgroundColor: '#1c1c1e',
  },
  gridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 17,
    flex: 1,
  },
  gridCardArrow: {
    alignSelf: 'flex-end',
    marginTop: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quick Links
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  quickLinkDark: {
    backgroundColor: '#1c1c1e',
  },
  quickLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  // Footer
  footerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  footerCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },

  // Shared text modifiers
  textWhite: {
    color: '#fff',
  },
  textGrayDark: {
    color: '#777',
  },
});
