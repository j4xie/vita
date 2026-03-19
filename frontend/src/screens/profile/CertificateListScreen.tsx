import React, { useState, useCallback, memo } from 'react';
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

// Certificate type icon mapping
const getCertificateIcon = (name: string): { icon: string; gradient: readonly [string, string] } => {
  const lower = name.toLowerCase();
  if (lower.includes('pvsa') || lower.includes('president') || lower.includes('volunteer service')) {
    return { icon: 'ribbon-outline', gradient: ['#FFD700', '#FFA500'] as const };
  }
  if (lower.includes('volunteer') || lower.includes('志愿')) {
    return { icon: 'heart-outline', gradient: ['#FF6B6B', '#EE5A24'] as const };
  }
  if (lower.includes('honor') || lower.includes('荣誉')) {
    return { icon: 'trophy-outline', gradient: ['#A855F7', '#7C3AED'] as const };
  }
  return { icon: 'document-text-outline', gradient: ['#FF6B35', '#FF4757'] as const };
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

// Memoized card component
const CertificateCard = memo(({
  item,
  index,
  isDarkMode,
  onPress,
  t,
}: {
  item: CertificateActivity;
  index: number;
  isDarkMode: boolean;
  onPress: (activity: CertificateActivity) => void;
  t: (key: string, fallback?: string) => string;
}) => {
  const isActive = item.enabled === 1;
  const signEndDate = item.signEndTime ? formatDate(item.signEndTime) : '';
  const signStartDate = item.signStartTime ? formatDate(item.signStartTime) : '';
  const { icon, gradient } = getCertificateIcon(item.name);

  // Calculate enrollment progress
  const enrollmentProgress = (item.enrollment && item.registerCount)
    ? Math.min(item.registerCount / item.enrollment, 1)
    : 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400).springify()}>
      <TouchableOpacity
        style={[
          styles.card,
          isDarkMode && styles.cardDark,
          !isActive && styles.cardInactive,
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        {/* Top section: icon badge + info */}
        <View style={styles.cardTop}>
          {/* Certificate type icon */}
          <LinearGradient
            colors={isActive ? gradient : ['#D1D5DB', '#9CA3AF'] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.certIconBadge}
          >
            <Ionicons name={icon as any} size={24} color="#fff" />
          </LinearGradient>

          <View style={styles.cardTitleArea}>
            <Text
              style={[
                styles.cardTitle,
                isDarkMode && styles.cardTitleDark,
                !isActive && styles.textInactive,
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>

            {/* Status badge inline with title */}
            <View
              style={[
                styles.statusBadge,
                isActive ? styles.statusActive : styles.statusInactiveBadge,
              ]}
            >
              <View style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#34C759' : '#8E8E93' },
              ]} />
              <Text style={[
                styles.statusText,
                isActive ? styles.statusActiveText : styles.statusInactiveText,
              ]}>
                {isActive
                  ? t('profile.certificate.status_active')
                  : t('profile.certificate.status_inactive')
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Info pills */}
        <View style={styles.infoPills}>
          {signStartDate && signEndDate ? (
            <View style={[styles.infoPill, isDarkMode && styles.infoPillDark]}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
              <Text style={[styles.infoPillText, isDarkMode && styles.infoPillTextDark]}>
                {signStartDate} - {signEndDate}
              </Text>
            </View>
          ) : signEndDate ? (
            <View style={[styles.infoPill, isDarkMode && styles.infoPillDark]}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
              <Text style={[styles.infoPillText, isDarkMode && styles.infoPillTextDark]}>
                {t('profile.certificate.deadline')}: {signEndDate}
              </Text>
            </View>
          ) : null}

          {typeof item.price === 'number' && item.price > 0 && (
            <View style={[styles.infoPill, styles.pricePill]}>
              <Text style={styles.priceText}>
                ${item.price}
              </Text>
            </View>
          )}
        </View>

        {/* Enrollment progress bar */}
        {typeof item.registerCount === 'number' && item.enrollment > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${enrollmentProgress * 100}%`,
                    backgroundColor: enrollmentProgress > 0.8
                      ? '#FF9500'
                      : isActive ? theme.colors.primary : '#D1D5DB',
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, isDarkMode && styles.progressTextDark]}>
              {item.registerCount}/{item.enrollment} {t('profile.certificate.applicants', 'applicants')}
            </Text>
          </View>
        )}

        {/* Action row */}
        <View style={[styles.cardAction, isDarkMode && styles.cardActionDark]}>
          <Text style={[
            styles.actionText,
            !isActive && styles.actionTextInactive,
          ]}>
            {isActive
              ? t('profile.certificate.apply_now')
              : t('profile.certificate.status_inactive')
            }
          </Text>
          <View style={[
            styles.actionArrow,
            isActive ? styles.actionArrowActive : styles.actionArrowInactive,
          ]}>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={isActive ? '#fff' : '#bbb'}
            />
          </View>
        </View>
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
      // Has dynamic form - go directly to registration form
      navigation.navigate('ActivityRegistrationForm', { activity });
    } else {
      // No form - go to activity detail
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
      isDarkMode={isDarkMode}
      onPress={handleActivityPress}
      t={t}
    />
  ), [isDarkMode, handleActivityPress, t]);

  const renderHeader = useCallback(() => (
    <View style={styles.heroSection}>
      <LinearGradient
        colors={isDarkMode
          ? ['#1C1C1E', '#2C2C2E'] as any
          : [theme.colors.primary, '#FF4757'] as any
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="ribbon" size={32} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={styles.heroTextArea}>
            <Text style={styles.heroTitle}>
              {t('profile.certificate.hero_title', 'Certificate & Awards')}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('profile.certificate.hero_subtitle', 'Apply for certificates to recognize your achievements')}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNumber}>
              {activities.filter(a => a.enabled === 1).length}
            </Text>
            <Text style={styles.heroStatLabel}>
              {t('profile.certificate.stat_open', 'Open')}
            </Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNumber}>
              {activities.length}
            </Text>
            <Text style={styles.heroStatLabel}>
              {t('profile.certificate.stat_total', 'Total')}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  ), [isDarkMode, activities, t]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBg, isDarkMode && styles.emptyIconBgDark]}>
        <Ionicons
          name="document-outline"
          size={48}
          color={isDarkMode ? '#555' : '#D1D5DB'}
        />
      </View>
      <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
        {t('profile.certificate.no_certificates')}
      </Text>
      <Text style={[styles.emptyDesc, isDarkMode && styles.emptyDescDark]}>
        {t('profile.certificate.no_certificates_desc')}
      </Text>
    </View>
  ), [isDarkMode, t]);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={isDarkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          {t('profile.certificate.title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderActivityCard}
          ListHeaderComponent={activities.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            activities.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
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

  // Hero section
  heroSection: {
    marginBottom: 20,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroTextArea: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
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
  cardDark: {
    backgroundColor: '#1c1c1e',
  },
  cardInactive: {
    opacity: 0.65,
  },

  // Card top section
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  certIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    lineHeight: 22,
    marginBottom: 6,
  },
  cardTitleDark: {
    color: '#fff',
  },
  textInactive: {
    color: '#999',
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  statusInactiveBadge: {
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusActiveText: {
    color: '#34C759',
  },
  statusInactiveText: {
    color: '#8E8E93',
  },

  // Info pills
  infoPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  infoPillDark: {
    backgroundColor: '#2C2C2E',
  },
  infoPillText: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoPillTextDark: {
    color: '#9CA3AF',
  },
  pricePill: {
    backgroundColor: '#FFF7ED',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Progress bar
  progressSection: {
    marginBottom: 14,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  progressTextDark: {
    color: '#6B7280',
  },

  // Action
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 14,
  },
  cardActionDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actionTextInactive: {
    color: '#bbb',
  },
  actionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionArrowActive: {
    backgroundColor: theme.colors.primary,
  },
  actionArrowInactive: {
    backgroundColor: '#E5E7EB',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
  emptyIconBgDark: {
    backgroundColor: '#1C1C1E',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyTitleDark: {
    color: '#fff',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyDescDark: {
    color: '#777',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
