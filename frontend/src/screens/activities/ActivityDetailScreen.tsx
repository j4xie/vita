import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ImageBackground,
  StatusBar,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter } from 'react-native';
import { theme } from '../../theme';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import { timeService } from '../../utils/UnifiedTimeService';
import { weatherAPI } from '../../services/weatherAPI';
import { schoolService } from '../../services/schoolService';
import { MapSelectorModal } from '../../components/modals/MapSelectorModal';
import { activityToOrderItem } from '../../types/order';

const { width: screenWidth } = Dimensions.get('window');

// Info Row Component (Icon, Title, Subtitle)
const InfoRow = ({ icon, title, subtitle, color = '#FF6B35', showProgress, attending, maxAttending }: any) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIconContainer, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoTitle}>{title}</Text>
      {subtitle && <Text style={styles.infoSubtitle}>{subtitle}</Text>}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${Math.min((attending / maxAttending) * 100, 100)}%` }]} />
        </View>
      )}
    </View>
  </View>
);

export const ActivityDetailScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useUser();

  const [activity, setActivity] = useState(route.params?.activity || {});
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'upcoming' | 'registered' | 'checked_in'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);

  // Modals
  const [showCheckinSuccessModal, setShowCheckinSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });
  const [showMapSelector, setShowMapSelector] = useState(false);

  // --- LOGIC SECTION (Preserved functionality) --- //

  // Initial Status Check
  useEffect(() => {
    const verifyInitialStatus = async () => {
      const userId = user?.id || user?.userId;
      const activityId = activity.id;
      if (!userId || !activityId) {
        // Fallback from passed params
        if (activity.status === 'registered' || activity.status === 'checked_in') {
          setRegistrationStatus(activity.status);
          setIsRegistered(true);
        }
        return;
      }

      try {
        const signInfo = await pomeloXAPI.getSignInfo(parseInt(activityId), parseInt(String(userId)));
        if (signInfo.code === 200) {
          const statusMap = { [-1]: 'registered', [1]: 'checked_in' };
          const newStatus = statusMap[signInfo.data as keyof typeof statusMap] || 'upcoming';
          setRegistrationStatus(newStatus as any);
          setIsRegistered(newStatus !== 'upcoming');
        }
      } catch (e) { console.warn('Status check failed', e); }
    };
    verifyInitialStatus();
  }, [activity.id, user]);

  // 🌤️ Fetch Weather Data
  useEffect(() => {
    const fetchWeather = async () => {
      if (!activity.location) {
        console.warn('⚠️ 活动没有地点信息');
        return;
      }

      setWeatherLoading(true);
      try {
        const weatherData = await weatherAPI.getWeatherByCity(activity.location, i18n.language);
        if (weatherData) {
          setWeather(weatherData);
        }
      } catch (error) {
        console.error('❌ 获取天气失败:', error);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [activity.location, i18n.language]);

  // 🏫 Fetch School Data
  useEffect(() => {
    const fetchSchool = async () => {
      if (!activity.location) {
        console.warn('⚠️ 活动没有地点信息');
        return;
      }

      setSchoolLoading(true);
      try {
        const schoolData = await schoolService.findSchoolByLocation(activity.location);
        if (schoolData) {
          setSchool(schoolData);
        }
      } catch (error) {
        console.error('❌ 获取学校信息失败:', error);
      } finally {
        setSchoolLoading(false);
      }
    };

    fetchSchool();
  }, [activity.location]);

  // Check Expiry
  const isActivityEnded = () => {
    try {
      const now = new Date();
      const end = activity.endDate ? new Date(activity.endDate) : new Date(activity.date);
      return end.getTime() < now.getTime();
    } catch { return false; }
  };

  // Actions
  const handleRegister = () => {
    if (loading) return;
    if (isActivityEnded()) {
      setErrorModalData({ title: 'Ended', message: 'Activity has ended.' });
      setShowErrorModal(true);
      return;
    }
    if (!isAuthenticated) {
      navigation.navigate('Login', { returnTo: 'ActivityDetail', activityId: activity.id });
      return;
    }
    // 付费活动 → OrderConfirmGlobal (RootStack level)
    if (activity.price && activity.price > 0) {
      navigation.navigate('OrderConfirmGlobal', {
        orderItem: activityToOrderItem(activity),
      });
      return;
    }
    // 免费活动 → 报名表单
    navigation.navigate('ActivityRegistrationForm', { activity });
  };

  const handleBack = () => navigation.goBack();

  const handleShare = async () => {
    try {
      const title = activity.title || activity.name || '';
      const date = activity.date || activity.startTime || '';
      const location = activity.location || activity.address || '';

      let message = title;
      if (date) message += `\n${t('activity.detail.date')}: ${date}`;
      if (location) message += `\n${t('activity.detail.location')}: ${location}`;
      message += `\n\n${t('activity.share.download_app', 'Download Vita App to join!')}`;

      await Share.share(
        Platform.OS === 'ios'
          ? { message }
          : { title, message }
      );
    } catch (error) {
      // User cancelled share - no action needed
    }
  };

  // --- RENDER SECTION (New UI) --- //

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Scrollable Content */}
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Cover Image & Header */}
        <ImageBackground
          source={{ uri: activity.image }}
          style={styles.coverImage}
          resizeMode="cover"
        >
          <LinearGradient // Gradient for text readability
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.4)']}
            style={styles.gradientOverlay}
          >
            <View style={[styles.headerBar, { marginTop: insets.top }]}>
              <TouchableOpacity style={styles.roundButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {/* Pagination Dots - Only show when multiple images exist */}
            {activity.images && activity.images.length > 1 && (
              <View style={styles.paginationDots}>
                {activity.images.map((_, index: number) => (
                  <View key={index} style={[styles.dot, index === 0 && styles.activeDot]} />
                ))}
              </View>
            )}
          </LinearGradient>
        </ImageBackground>

        <View style={styles.contentContainer}>
          {/* Title Section */}
          <View style={styles.section}>
            {/* On-going Badge */}
            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>on-going</Text>
              </View>
            </View>

            <Text style={styles.titleText}>{activity.title}</Text>

            {/* Tags & Avatars */}
            <View style={styles.tagsRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>Festival</Text>
              </View>
              {/* Avatar Stack Mock */}
              <View style={styles.avatarStack}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?img=1' }} style={[styles.miniAvatar, { zIndex: 3 }]} />
                <Image source={{ uri: 'https://i.pravatar.cc/100?img=2' }} style={[styles.miniAvatar, { zIndex: 2, marginLeft: -10 }]} />
                <Text style={styles.goingText}>+9 users going</Text>
              </View>
            </View>
          </View>

          {/* Info List */}
          <View style={styles.infoList}>
            {/* Date */}
            <InfoRow
              icon="calendar-outline"
              title={`${activity.date} - ${activity.endDate || activity.date}`}
              subtitle={`${activity.time || '18:00'} - 23:00 PM (GMT -04:00)`}
              color="#FF6B35"
            />
            {/* Location */}
            <InfoRow
              icon="location-outline"
              title={activity.location.split(',')[0]}
              subtitle={activity.location}
              color="#FF6B35"
            />
            {/* Price */}
            <InfoRow
              icon="ticket-outline"
              title={(!activity.price || activity.price == 0) ? "Free" : `$${activity.price}`}
              color="#FF6B35"
            />
            {/* Registered */}
            <InfoRow
              icon="people-outline"
              title={`${activity.registeredCount || 48}/${activity.maxAttendees || 100} People Registered`}
              color="#FF6B35"
              showProgress
              attending={activity.registeredCount || 48}
              maxAttending={activity.maxAttendees || 100}
            />
          </View>

          <View style={styles.divider} />

          {/* Organizer */}
          <View style={styles.organizerSection}>
            <Text style={styles.sectionHeaderLabel}>ORGANIZER</Text>
            <View style={styles.organizerRow}>
              <View style={styles.organizerAvatarContainer}>
                <Text style={styles.organizerInitial}>
                  {(activity.createName || activity.organizer?.name || 'O')?.[0]?.toUpperCase() || 'O'}
                </Text>
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>{activity.createName || activity.organizer?.name || '官方活动'}</Text>
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#2ECC71" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* University */}
          <View style={styles.universitySection}>
            <Text style={styles.sectionHeaderLabel}>UNIVERSITY</Text>
            <View style={styles.universityRow}>
              {schoolLoading ? (
                <Text style={styles.uniName}>加载中...</Text>
              ) : school ? (
                <>
                  <Image
                    source={{ uri: schoolService.getSchoolLogoUrl(school) }}
                    style={styles.uniLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.uniName}>{schoolService.getSchoolDisplayName(school)}</Text>
                </>
              ) : (
                <Text style={styles.uniName}>{activity.location || 'Unknown University'}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* About Event */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionHeaderLabel}>ABOUT EVENT</Text>
            <Text style={styles.aboutText}>
              {activity.description || "在这次活动中，我们为大家准备了精美的中秋礼物，并设置了丰富有趣的游戏，让同学们在轻松愉快的氛围中结识新朋友，增进彼此交流。\n\n中秋节象征着团圆与分享。"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Links */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => setShowMapSelector(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="map-outline" size={20} color="#1A1A1A" />
              <Text style={styles.linkText}>Open in Maps</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => {
              const city = activity.location || activity.address || '';
              if (city) {
                const query = encodeURIComponent(city + ' weather');
                Linking.openURL(`https://www.google.com/search?q=${query}`);
              }
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sunny-outline" size={20} color="#FFA500" />
              <Text style={styles.linkText}>
                {weatherLoading ? '加载中...' : (weather ? weatherAPI.formatTemperatureRange(weather) : '获取天气中...')} | {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#1A1A1A" />
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.bookButton, isActivityEnded() && styles.disabledButton, registrationStatus !== 'upcoming' && styles.registeredButton]}
          onPress={handleRegister}
          disabled={isActivityEnded()}
        >
          <Text style={styles.bookButtonText}>
            {isActivityEnded() ? 'Ended' : (registrationStatus === 'upcoming' ? 'Book Event' : 'Registered')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <LiquidSuccessModal
        visible={showCheckinSuccessModal}
        onClose={() => setShowCheckinSuccessModal(false)}
        title={t('activityDetail.checkin_success') || '签到成功'}
        message={'Successfully Checked In'}
        confirmText={t('common.confirm') || 'Confirm'}
        icon="checkmark-circle"
      />
      <LiquidSuccessModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorModalData.title}
        message={errorModalData.message}
        confirmText={'Confirm'}
        icon="alert-circle"
      />
      <MapSelectorModal
        visible={showMapSelector}
        address={activity.location || ''}
        onClose={() => setShowMapSelector(false)}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F2', // Pinkish white background
  },
  coverImage: {
    width: '100%',
    height: 380, // Tall header image
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    width: 24, // Elongated
    backgroundColor: '#FF6B35',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFF5F2',
    borderTopLeftRadius: 30, // Curved overlap if needed, but image is full width
    marginTop: -20, // Slightly overlap image? No, let's keep it simple
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Section 1: Title
  section: {
    marginBottom: 24,
  },
  badgeRow: {
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    lineHeight: 44,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagPill: {
    borderWidth: 1,
    borderColor: '#FFA500',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
  },
  tagText: {
    color: '#FFA500',
    fontWeight: '600',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  goingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#8E8E93',
  },

  // Info List
  infoList: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginTop: 8,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },

  // Headers
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginBottom: 16,
    letterSpacing: 1,
  },

  // Organizer
  organizerSection: {},
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', // Light gray bg for card
    padding: 16,
    borderRadius: 12,
  },
  organizerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  organizerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#2ECC71',
    marginLeft: 4,
    fontWeight: '600',
  },

  // University
  universitySection: {},
  universityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  uniLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  uniName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },

  // About
  aboutSection: {},
  aboutText: {
    lineHeight: 24,
    color: '#4A4A4A',
    fontSize: 15,
  },

  // Links
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#1A1A1A',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bookButton: {
    backgroundColor: '#FF6B35',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  registeredButton: {
    backgroundColor: '#2ECC71',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});