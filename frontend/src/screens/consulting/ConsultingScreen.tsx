import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { NewStudentIcon, RentalsIcon, PickupIcon, CommunityIcon, HeartIcon, ArchiveBookIcon } from '../../components/common/icons/ConsultingServiceIcons';

const CHINESEUNION_BASE_URL = 'https://www.chineseunion.org';

interface ConsultingScreenProps {
  isTabRoot?: boolean;
}

/* ─── Circular Service Icon Button ─── */
const ServiceIconButton = memo(({
  IconComponent,
  iconSize = 28,
  label,
  onPress,
  isDarkMode,
}: {
  IconComponent: React.FC<{ size?: number; color?: string }>;
  iconSize?: number;
  label: string;
  onPress: () => void;
  isDarkMode: boolean;
}) => (
  <TouchableOpacity
    style={styles.serviceIconButton}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.serviceCircle, isDarkMode && styles.serviceCircleDark]}>
      <IconComponent size={iconSize} color="#FF7763" />
    </View>
    <Text
      style={[styles.serviceLabel, isDarkMode && styles.textMutedDark]}
      numberOfLines={2}
    >
      {label}
    </Text>
  </TouchableOpacity>
));

/* ─── Quick Link Card ─── */
const QuickLinkCard = memo(({
  IconComponent,
  label,
  onPress,
  isDarkMode,
}: {
  IconComponent: React.FC<{ size?: number; color?: string }>;
  label: string;
  onPress: () => void;
  isDarkMode: boolean;
}) => (
  <TouchableOpacity
    style={[styles.quickLinkCard, isDarkMode && styles.quickLinkCardDark]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styles.quickLinkTopRow}>
      <IconComponent size={24} color="#FF7763" />
      <View style={[styles.quickLinkArrow, isDarkMode && styles.quickLinkArrowDark]}>
        <Ionicons name="arrow-forward" size={14} color={isDarkMode ? '#fff' : '#000'} style={{ transform: [{ rotate: '-45deg' }] }} />
      </View>
    </View>
    <Text
      style={[styles.quickLinkCardText, isDarkMode && styles.textWhite]}
      numberOfLines={2}
    >
      {label}
    </Text>
  </TouchableOpacity>
));

/* ─── Main Screen ─── */
export const ConsultingScreen: React.FC<ConsultingScreenProps> = ({ isTabRoot = false }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();

  const handleGoBack = useCallback(() => {
    if (Platform.OS === 'ios') Haptics.selectionAsync();
    navigation.goBack();
  }, [navigation]);

  const handleOpenUrl = useCallback((url: string) => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(url);
  }, []);

  const services = [
    {
      IconComponent: NewStudentIcon,
      labelKey: 'consulting.services.new_student',
      url: `${CHINESEUNION_BASE_URL}/%e5%ad%a6%e7%94%9f%e6%9c%8d%e5%8a%a1-3/%e6%96%b0%e7%94%9f%e9%80%9a%e9%81%93/`,
    },
    {
      IconComponent: RentalsIcon,
      labelKey: 'consulting.services.rentals',
      url: `${CHINESEUNION_BASE_URL}/%e6%a0%a1%e5%a4%96%e7%a7%9f%e6%88%bf-3/`,
    },
    {
      IconComponent: PickupIcon,
      iconSize: 24,
      labelKey: 'consulting.services.pickup',
      url: `${CHINESEUNION_BASE_URL}/%e6%8e%a5%e6%9c%ba%e6%9c%8d%e5%8a%a1-2/`,
    },
    {
      IconComponent: CommunityIcon,
      labelKey: 'consulting.services.community_group',
      url: `${CHINESEUNION_BASE_URL}/%e6%96%b0%e7%94%9f%e8%a7%81%e9%9d%a2%e4%bc%9a/`,
    },
  ];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Minimal header (back button only, no center title) */}
      {!isTabRoot && (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      )}

      {/* If used as tab root, add top safe-area spacing */}
      {isTabRoot && <View style={{ height: insets.top }} />}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ── Page Title ── */}
        <Text style={[styles.pageTitle, isDarkMode && styles.textWhite]}>
          {t('consulting.page_title')}
        </Text>

        {/* ── Hero Banner ── */}
        <TouchableOpacity
          style={styles.heroBannerWrap}
          onPress={() => handleOpenUrl(CHINESEUNION_BASE_URL)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isDarkMode
              ? ['#8B3A2A', '#A06040']
              : ['#FF7763', '#F9A789']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            {/* 3D consulting illustration – soft-light blend simulated via opacity */}
            <Image
              source={require('../../../assets/images/consulting-hero.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />

            <View style={styles.heroContent}>
              <Text style={styles.heroBannerTitle}>
                {t('consulting.hero_banner_title')}
              </Text>
            </View>

            {/* Arrow circle button */}
            <View style={styles.heroArrowCircle}>
              <Ionicons name="arrow-forward" size={16} color="#000" style={{ transform: [{ rotate: '-45deg' }] }} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── OUR SERVICES ── */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>
            {t('consulting.our_services')}
          </Text>
          <View style={styles.servicesRow}>
            {services.map((service, index) => (
              <ServiceIconButton
                key={index}
                IconComponent={service.IconComponent}
                iconSize={'iconSize' in service ? service.iconSize : undefined}
                label={t(service.labelKey)}
                onPress={() => handleOpenUrl(service.url)}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>
        </View>

        {/* ── QUICK LINKS ── */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>
            {t('consulting.quick_links_title')}
          </Text>
          <View style={styles.quickLinksRow}>
            <QuickLinkCard
              IconComponent={HeartIcon}
              label={t('consulting.links.safety_plan')}
              onPress={() => handleOpenUrl(`${CHINESEUNION_BASE_URL}/%e5%ae%89%e5%bf%83%e8%ae%a1%e5%88%92%ef%bc%88new%ef%bc%89/`)}
              isDarkMode={isDarkMode}
            />
            <QuickLinkCard
              IconComponent={ArchiveBookIcon}
              label={t('consulting.links.student_notes')}
              onPress={() => handleOpenUrl(`${CHINESEUNION_BASE_URL}/%e6%96%b0%e7%94%9f%e7%ac%94%e8%ae%b0-%e3%80%90%e5%ad%90%e8%8f%9c%e5%8d%95%e3%80%91/`)}
              isDarkMode={isDarkMode}
            />
          </View>
        </View>

        {/* ── Fresher's Album Banner ── */}
        <View style={styles.sectionWrap}>
          <TouchableOpacity
            style={[styles.albumBanner, isDarkMode && styles.albumBannerDark]}
            onPress={() => handleOpenUrl(`${CHINESEUNION_BASE_URL}/%e6%96%b0%e7%94%9f%e7%9b%b8%e5%86%8c%e3%80%90%e5%ad%90%e8%8f%9c%e5%8d%95%e3%80%91/`)}
            activeOpacity={0.8}
          >
            {/* Campus building photo on the right with gradient overlay */}
            <View style={styles.albumImageWrap}>
              <Image
                source={require('../../../assets/images/campus-building.jpg')}
                style={styles.albumImage}
                resizeMode="cover"
                blurRadius={2}
              />
              <LinearGradient
                colors={isDarkMode
                  ? ['#1c1c1e', 'rgba(28,28,30,0)', 'transparent']
                  : ['#FFFFFF', 'rgba(255,255,255,0)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0, 0.739, 1]}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
            <View style={styles.albumContent}>
              <Text style={[styles.albumTitle, isDarkMode && styles.textWhite]}>
                {t('consulting.links.freshers_album')}
              </Text>
              <Text style={[styles.albumSubtitle, isDarkMode && styles.textMutedDark]}>
                {t('consulting.album_subtitle')}
              </Text>
            </View>
            <View style={[styles.albumArrowCircle, isDarkMode && styles.albumArrowCircleDark]}>
              <Ionicons name="arrow-forward" size={16} color={isDarkMode ? '#fff' : '#000'} style={{ transform: [{ rotate: '-45deg' }] }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Footer Info ── */}
        <View style={[styles.footerCard, isDarkMode && styles.footerCardDark]}>
          <Ionicons name="information-circle-outline" size={18} color={isDarkMode ? '#666' : '#9CA3AF'} />
          <Text style={[styles.footerText, isDarkMode && styles.textMutedDark]}>
            {t('consulting.contact_info')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

/* ════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  /* ── Layout ── */
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },

  /* ── Header (back button only) ── */
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  /* ── Page Title ── */
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#000',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    letterSpacing: -0.3,
  },

  /* ── Hero Banner ── */
  heroBannerWrap: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  heroBanner: {
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    height: 166,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 24,
    paddingBottom: 28,
    paddingRight: 70,
  },
  heroBannerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 32,
  },
  heroImage: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 280,
    height: 252,
    opacity: 0.55,
  },
  heroArrowCircle: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 41,
    height: 41,
    borderRadius: 20.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  /* ── Section ── */
  sectionWrap: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#949494',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  sectionLabelDark: {
    color: '#666',
  },

  /* ── Service Icon Buttons ── */
  servicesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceIconButton: {
    alignItems: 'center',
    width: 80,
    gap: 1,
  },
  serviceCircle: {
    width: 59,
    height: 59,
    borderRadius: 37,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F7A587',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 11.5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  serviceCircleDark: {
    backgroundColor: '#1c1c1e',
  },
  serviceLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 28,
  },

  /* ── Quick Link Cards ── */
  quickLinksRow: {
    flexDirection: 'row',
    gap: 13,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 26,
    paddingTop: 14,
    paddingRight: 10,
    paddingBottom: 29,
    paddingLeft: 15,
    height: 122,
    justifyContent: 'space-between',
  },
  quickLinkCardDark: {
    backgroundColor: '#1c1c1e',
  },
  quickLinkTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickLinkCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    lineHeight: 16,
  },
  quickLinkArrow: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    backgroundColor: '#FAF3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkArrowDark: {
    backgroundColor: '#2c2c2e',
  },

  /* ── Fresher's Album Banner ── */
  albumBanner: {
    backgroundColor: '#fff',
    borderRadius: 26,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 16,
    minHeight: 122,
    position: 'relative',
  },
  albumBannerDark: {
    backgroundColor: '#1c1c1e',
  },
  albumImageWrap: {
    position: 'absolute',
    top: -15,
    right: 0,
    width: 205,
    height: 137,
    overflow: 'hidden',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumContent: {
    flex: 1,
    zIndex: 2,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#000',
    marginBottom: 4,
  },
  albumSubtitle: {
    fontSize: 12,
    fontWeight: '300',
    color: '#949494',
    lineHeight: 14.4,
  },
  albumArrowCircle: {
    width: 41,
    height: 41,
    borderRadius: 21,
    backgroundColor: '#FAF3F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    zIndex: 2,
  },
  albumArrowCircleDark: {
    backgroundColor: 'rgba(44,44,46,0.9)',
  },

  /* ── Footer ── */
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

  /* ── Shared text modifiers ── */
  textWhite: {
    color: '#fff',
  },
  textMutedDark: {
    color: '#777',
  },
});
