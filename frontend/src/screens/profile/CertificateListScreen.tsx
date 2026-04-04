import React, { useState, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';

import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { pomeloXAPI } from '../../services/PomeloXAPI';

interface CertificateActivity {
  id: number;
  name: string;
  icon: string;
  startTime: string;
  endTime: string;
  address: string;
  enrollment: number;
  detail: string;
  signStartTime: string;
  signEndTime: string;
  enabled: number;
  type?: number;
  timeZone?: string;
  registerCount?: number;
  modelContent?: string;
  price?: number;
}

// Award icon component (from Figma)
// Paths are offset (40,32) from original Figma coords. Icon bounds: x 8.26-23.74, y 4-23.7
// Center: (16, 13.85). Use viewBox "4 1.7 24 24" to center the icon.
const AwardIcon = memo(({ size = 24, color = '#fff', sw = 1.5 }: { size?: number; color?: string; sw?: number }) => (
  <Svg width={size} height={size} viewBox="4 1.7 24 24" fill="none">
    <Path
      d="M8.26 13.02V17.99C8.26 19.81 8.26 19.81 9.98 20.97L14.71 23.7C15.42 24.11 16.58 24.11 17.29 23.7L22.02 20.97C23.74 19.81 23.74 19.81 23.74 17.99V13.02C23.74 11.2 23.74 11.2 22.02 10.04L17.29 7.31C16.58 6.9 15.42 6.9 14.71 7.31L9.98 10.04C8.26 11.2 8.26 11.2 8.26 13.02Z"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21.5 9.63V7C21.5 5 20.5 4 18.5 4H13.5C11.5 4 10.5 5 10.5 7V9.56"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.63 12.99L17.2 13.88C17.29 14.02 17.49 14.16 17.64 14.2L18.66 14.46C19.29 14.62 19.46 15.16 19.05 15.66L18.38 16.47C18.28 16.6 18.2 16.83 18.21 16.99L18.27 18.04C18.31 18.69 17.85 19.02 17.25 18.78L16.27 18.39C16.12 18.33 15.87 18.33 15.72 18.39L14.74 18.78C14.14 19.02 13.68 18.68 13.72 18.04L13.78 16.99C13.79 16.83 13.71 16.59 13.61 16.47L12.94 15.66C12.53 15.16 12.7 14.62 13.33 14.46L14.35 14.2C14.51 14.16 14.71 14.01 14.79 13.88L15.36 12.99C15.72 12.45 16.28 12.45 16.63 12.99Z"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Lovely/Heart icon (from Figma)
const LovelyIcon = memo(({ size = 24, color = '#FF7763' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <Path
      d="M22.36 12.59C22.36 13.01 22.33 13.42 22.28 13.81C21.82 13.61 21.32 13.5 20.79 13.5C19.57 13.5 18.49 14.09 17.82 14.99C17.14 14.09 16.06 13.5 14.84 13.5C12.79 13.5 11.13 15.17 11.13 17.24C11.13 19.92 12.55 21.97 14.13 23.36C14.08 23.39 14.03 23.4 13.98 23.42C13.68 23.53 13.18 23.53 12.88 23.42C10.29 22.53 4.5 18.85 4.5 12.59C4.5 9.83 6.72 7.6 9.46 7.6C11.09 7.6 12.53 8.38 13.43 9.59C14.34 8.38 15.78 7.6 17.4 7.6C20.14 7.6 22.36 9.83 22.36 12.59Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M24.5 17.24C24.5 21.92 20.17 24.68 18.23 25.34C18 25.42 17.63 25.42 17.4 25.34C16.57 25.06 15.3 24.39 14.13 23.36C12.55 21.97 11.13 19.92 11.13 17.24C11.13 15.17 12.79 13.5 14.84 13.5C16.06 13.5 17.14 14.09 17.82 14.99C18.49 14.09 19.57 13.5 20.79 13.5C21.32 13.5 21.82 13.61 22.28 13.81C23.59 14.39 24.5 15.7 24.5 17.24Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Folder-open icon (from Figma) - paths span x:0.82-13.72 y:3.35-16.67
const FolderIcon = memo(({ size = 16, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="-0.5 2.5 15.5 15.5" fill="none">
    <Path
      d="M13.717 11.533L13.45 14.867C13.35 15.887 13.27 16.667 11.464 16.667H3.077C1.27 16.667 1.19 15.887 1.09 14.867L0.824 11.533C0.77 10.98 0.944 10.467 1.257 10.073C1.264 10.067 1.264 10.067 1.27 10.06C1.637 9.613 2.19 9.333 2.81 9.333H11.73C12.35 9.333 12.897 9.613 13.257 10.047C13.264 10.053 13.27 10.06 13.27 10.067C13.597 10.46 13.777 10.973 13.717 11.533Z"
      stroke={color}
      strokeWidth={1.5}
      strokeMiterlimit={10}
    />
    <Path
      d="M1.604 9.62V6.187C1.604 3.92 2.17 3.353 4.437 3.353H5.284C6.13 3.353 6.324 3.607 6.644 4.033L7.49 5.167C7.704 5.447 7.83 5.62 8.397 5.62H10.097C12.364 5.62 12.93 6.187 12.93 8.453V9.647"
      stroke={color}
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.557 13.333H8.983"
      stroke={color}
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Mouse-circle icon (from Figma) - paths span x:-2.67-10.91 y:3.33-16.93
const MouseCircleIcon = memo(({ size = 16, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="-3.5 2.5 15.5 15.5" fill="none">
    <Path
      d="M9.9733 13.893L8.8866 14.26C8.5866 14.36 8.3466 14.593 8.2466 14.9L7.8799 15.987C7.5666 16.927 6.2466 16.907 5.9533 15.967L4.72 12C4.48 11.213 5.2066 10.48 5.9866 10.727L9.96 11.96C10.8933 12.253 10.9066 13.58 9.9733 13.893Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.6668 10C10.6668 6.32 7.6802 3.333 4.0002 3.333C0.3202 3.333 -2.6665 6.32 -2.6665 10C-2.6665 13.68 0.3202 16.667 4.0002 16.667"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Calendar icon (from Figma design)
const CalendarIcon = memo(({ size = 19.2, color = '#949494' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 19.2 19.2" fill="none">
    <Path
      d="M6.4 2.5V4.9"
      stroke={color}
      strokeWidth={1.2}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.8 2.5V4.9"
      stroke={color}
      strokeWidth={1.2}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.8 8.172H16.4"
      stroke={color}
      strokeWidth={1.2}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.8 7.7V14.5C16.8 16.9 15.6 18.5 12.8 18.5H6.4C3.6 18.5 2.4 16.9 2.4 14.5V7.7C2.4 5.3 3.6 3.7 6.4 3.7H12.8C15.6 3.7 16.8 5.3 16.8 7.7Z"
      stroke={color}
      strokeWidth={1.2}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12.556 11.86H12.563" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12.556 14.26H12.563" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.597 11.86H9.604" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.597 14.26H9.604" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6.636 11.86H6.643" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6.636 14.26H6.643" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));

const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

// Memoized certificate card - Figma design
const CertificateCard = memo(({
  item,
  index,
  onPress,
  t,
}: {
  item: CertificateActivity;
  index: number;
  onPress: (activity: CertificateActivity) => void;
  t: (key: string, fallback?: string) => string;
}) => {
  const isActive = item.enabled === 1;
  const signEndDate = item.signEndTime ? formatDateShort(item.signEndTime) : '';
  const signStartDate = item.signStartTime ? formatDateShort(item.signStartTime) : '';

  const regCount = item.registerCount ?? 0;
  const enrollmentProgress = item.enrollment > 0
    ? Math.min(regCount / item.enrollment, 1)
    : 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400).springify()}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        {/* Main row: icon + info + arrow */}
        <View style={styles.cardMainRow}>
          {/* Left: Icon circle */}
          <View style={styles.cardIconCircle}>
            <LovelyIcon size={24} color="#FF7763" />
          </View>

          {/* Center: Title + Status */}
          <View style={styles.cardCenterContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.name}
            </Text>

            {/* Status pill */}
            <View style={[
              styles.statusPill,
              isActive ? styles.statusPillActive : styles.statusPillInactive,
            ]}>
              <View style={[
                styles.statusDot,
                isActive ? styles.statusDotActive : styles.statusDotInactive,
              ]} />
              <Text style={[
                styles.statusText,
                isActive ? styles.statusTextActive : styles.statusTextInactive,
              ]}>
                {isActive
                  ? t('profile.certificate.status_active')
                  : t('profile.certificate.status_inactive')
                }
              </Text>
            </View>
          </View>

          {/* Right: Arrow button */}
          <View style={styles.cardArrowCircle}>
            <View style={styles.arrowLine}>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </View>
          </View>
        </View>

        {/* Date pill */}
        {(signStartDate || signEndDate) && (
          <View style={styles.datePillRow}>
            <View style={styles.datePill}>
              <CalendarIcon size={19.2} color="#949494" />
              <Text style={styles.datePillText}>
                {signStartDate && signEndDate
                  ? `${signStartDate} - ${signEndDate}`
                  : signEndDate
                    ? `${t('profile.certificate.deadline')}: ${signEndDate}`
                    : signStartDate
                }
              </Text>
            </View>
          </View>
        )}

        {/* Progress bar - always show when enrollment exists */}
        {item.enrollment > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${enrollmentProgress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {regCount}/{item.enrollment} {t('profile.certificate.people_registered', 'People Registered')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

export const CertificateListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, permissions } = useUser();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

  const [activities, setActivities] = useState<CertificateActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const openCount = useMemo(() => activities.filter(a => a.enabled === 1).length, [activities]);

  const fetchCertificateActivities = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const roleKey = permissions.getPermissionLevel();
      const response = await pomeloXAPI.getActivityList({
        userId: Number(user.id),
        pageNum: 1,
        pageSize: 50,
        accessRoleKey: roleKey,
        actType: 4,
      });

      const rows = response.data?.rows ?? (response as any).rows;
      if (response.code === 200 && rows) {
        setActivities(rows);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Failed to fetch certificate activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, permissions]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchCertificateActivities();
    }, [fetchCertificateActivities])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCertificateActivities();
  }, [fetchCertificateActivities]);

  const handleActivityPress = useCallback((activity: CertificateActivity) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    if (activity.enabled !== 1) {
      Alert.alert(
        t('profile.certificate.not_application_season'),
        t('profile.certificate.not_application_season_desc'),
        [{ text: t('common.got_it') }]
      );
      return;
    }

    const pvsaKeywords = ['PVSA', '总统', '志愿者证书', 'President', 'Volunteer Service Award'];
    const isPVSA = pvsaKeywords.some(keyword =>
      activity.name.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isPVSA) {
      navigation.navigate('PVSADynamicForm', { activity });
    } else if (activity.modelContent) {
      navigation.navigate('ActivityRegistrationForm', { activity });
    } else {
      navigation.navigate('ActivityDetail', { activity });
    }
  }, [navigation, t]);

  const handleGoBack = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    navigation.goBack();
  }, [navigation]);

  const renderActivityCard = useCallback(({ item, index }: { item: CertificateActivity; index: number }) => (
    <CertificateCard
      item={item}
      index={index}
      onPress={handleActivityPress}
      t={t}
    />
  ), [handleActivityPress, t]);

  const renderHeader = useCallback(() => (
    <View style={styles.listHeader}>
      {/* Hero gradient card */}
      <LinearGradient
        colors={['#FF7763', '#F9A789'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        {/* Decorative large award icon - bottom right */}
        <View style={styles.heroDecorativeIcon}>
          <AwardIcon size={125} color="rgba(255,255,255,1)" sw={2.4} />
        </View>

        {/* Content */}
        <View style={styles.heroContent}>
          {/* Small award icon badge */}
          <View style={styles.heroIconBadge}>
            <AwardIcon size={24} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>
            {t('profile.certificate.hero_title', 'Certificate & Awards')}
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            {t('profile.certificate.hero_subtitle_full', 'Apply for certificates to recognize your achievements.')}
          </Text>

          {/* Divider + Stats */}
          <View style={styles.heroDivider} />
          <View style={styles.heroStatsRow}>
            {/* Open stat */}
            <View style={styles.heroStatItem}>
              <MouseCircleIcon size={16} color="#fff" />
              <Text style={styles.heroStatText}>
                {openCount} {t('profile.certificate.stat_open', 'Open').toUpperCase()}
              </Text>
            </View>

            {/* Dot separator */}
            <View style={styles.heroStatDot} />

            {/* Total stat */}
            <View style={styles.heroStatItem}>
              <FolderIcon size={16} color="#fff" />
              <Text style={styles.heroStatText}>
                {activities.length} {t('profile.certificate.stat_total', 'Total').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Section label */}
      <Text style={styles.sectionLabel}>
        {t('profile.certificate.available_applications', 'AVAILABLE APPLICATIONS')}
      </Text>
    </View>
  ), [activities, openCount, t]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Ionicons
          name="document-outline"
          size={48}
          color="#D1D5DB"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {t('profile.certificate.no_certificates')}
      </Text>
      <Text style={styles.emptyDesc}>
        {t('profile.certificate.no_certificates_desc')}
      </Text>
    </View>
  ), [t]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('profile.certificate.title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7763" />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderActivityCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            activities.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FF7763"
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header - Figma style
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  headerRight: {
    width: 42,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },
  listHeader: {
    marginBottom: 12,
  },

  // Hero card - Figma gradient card
  heroCard: {
    borderRadius: 26,
    padding: 24,
    minHeight: 254,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(255, 128, 82, 1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroDecorativeIcon: {
    position: 'absolute',
    right: -21,
    bottom: -16,
    opacity: 0.2,
  },
  heroContent: {
    zIndex: 1,
    minHeight: 206,
  },
  heroIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 3,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 23,
    marginBottom: 24,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 100,
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroStatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // Section label - Figma: parent has gap:12 between label and card
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#949494',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Certificate card - Figma: padding 7px 15px, border-radius 31
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 31,
    paddingVertical: 7,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
  },
  cardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCenterContent: {
    flex: 1,
    gap: 7,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 17,
  },

  // Status pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    borderRadius: 104,
    height: 20,
    gap: 6,
  },
  statusPillActive: {
    backgroundColor: '#E4FBE7',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#4BC27E',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(75, 194, 126, 0.6)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5.95,
      },
    }),
  },
  statusDotInactive: {
    backgroundColor: '#8E8E93',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 20,
  },
  statusTextActive: {
    color: '#4BC27E',
  },
  statusTextInactive: {
    color: '#8E8E93',
  },

  // Arrow button
  cardArrowCircle: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowLine: {
    transform: [{ rotate: '-45deg' }],
  },

  // Date pill - Figma: gap 16.8 from main row, padding 7.2px, border-radius 17.2
  datePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 16.8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 17.2,
    paddingVertical: 7.2,
    paddingHorizontal: 10,
    gap: 8,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#949494',
    lineHeight: 18,
  },

  // Progress bar - Figma: gap 15 from date row, 6px gap between bar and text
  progressSection: {
    marginTop: 15,
    gap: 6,
  },
  progressBarTrack: {
    height: 2,
    backgroundColor: '#E0E0E0',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF7763',
    borderRadius: 1,
  },
  progressText: {
    fontSize: 12,
    color: '#949494',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
