import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ShareIcon, CalendarIcon, LocationIcon } from '../../components/icons/ActivityIcons';
import { PriceFilterIcon, AvailabilityFilterIcon, MapIcon, SunIcon, DiagonalArrowIcon } from '../../components/common/icons/FilterIcons';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter } from 'react-native';
import { theme } from '../../theme';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import { timeService } from '../../utils/UnifiedTimeService';
import { weatherAPI } from '../../services/weatherAPI';
import { useRegisteredAvatars, getAvatarColor } from '../../hooks/useRegisteredAvatars';
import { schoolService } from '../../services/schoolService';
import { MapSelectorModal } from '../../components/modals/MapSelectorModal';
import { activityToOrderItem } from '../../types/order';
import Svg, { Path } from 'react-native-svg';
import ActivityShareModal from '../../components/modals/ActivityShareModal';
import { adaptActivity } from '../../utils/activityAdapter';

const { width: screenWidth } = Dimensions.get('window');

const VerifiedBadge = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.5599 10.74L20.1999 9.16C19.9399 8.86 19.7299 8.3 19.7299 7.9V6.2C19.7299 5.14 18.8599 4.27 17.7999 4.27H16.0999C15.7099 4.27 15.1399 4.06 14.8399 3.8L13.2599 2.44C12.5699 1.85 11.4399 1.85 10.7399 2.44L9.16988 3.81C8.86988 4.06 8.29988 4.27 7.90988 4.27H6.17988C5.11988 4.27 4.24988 5.14 4.24988 6.2V7.91C4.24988 8.3 4.03988 8.86 3.78988 9.16L2.43988 10.75C1.85988 11.44 1.85988 12.56 2.43988 13.25L3.78988 14.84C4.03988 15.14 4.24988 15.7 4.24988 16.09V17.8C4.24988 18.86 5.11988 19.73 6.17988 19.73H7.90988C8.29988 19.73 8.86988 19.94 9.16988 20.2L10.7499 21.56C11.4399 22.15 12.5699 22.15 13.2699 21.56L14.8499 20.2C15.1499 19.94 15.7099 19.73 16.1099 19.73H17.8099C18.8699 19.73 19.7399 18.86 19.7399 17.8V16.1C19.7399 15.71 19.9499 15.14 20.2099 14.84L21.5699 13.26C22.1499 12.57 22.1499 11.43 21.5599 10.74ZM16.1599 10.11L11.3299 14.94C11.1899 15.08 10.9999 15.16 10.7999 15.16C10.5999 15.16 10.4099 15.08 10.2699 14.94L7.84988 12.52C7.55988 12.23 7.55988 11.75 7.84988 11.46C8.13988 11.17 8.61988 11.17 8.90988 11.46L10.7999 13.35L15.0999 9.05C15.3899 8.76 15.8699 8.76 16.1599 9.05C16.4499 9.34 16.4499 9.82 16.1599 10.11Z"
      fill="#2FD573"
    />
  </Svg>
);

// Info Row Component (Icon, Title, Subtitle)
const InfoRow = ({ icon, IconComponent, title, subtitle, color = '#FF6B35', showProgress, attending, maxAttending }: any) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIconContainer, { backgroundColor: `${color}15` }]}>
      {IconComponent ? (
        <IconComponent size={20} color={color} />
      ) : (
        <Ionicons name={icon} size={20} color={color} />
      )}
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

  const [activity, setActivity] = useState(() => {
    const a = route.params?.activity || {};
    return {
      ...a,
      id: a.id ?? null,
      title: a.title ?? '',
      date: a.date ?? '',
      endDate: a.endDate ?? '',
      time: a.time ?? '',
      endTime: a.endTime ?? '',
      timeZone: a.timeZone ?? '',
      location: a.location ?? '',
      address: a.address ?? '',
      image: a.image ?? '',
      images: a.images ?? [],
      price: a.price ?? 0,
      category: a.category ?? '',
      status: a.status ?? '',
      detail: a.detail ?? '',
      description: a.description ?? '',
      registeredCount: a.registeredCount ?? 0,
      maxAttendees: a.maxAttendees ?? 0,
      deptName: a.deptName ?? '',
      organizer: a.organizer ?? {},
      organizerAvatar: a.organizerAvatar ?? '',
      sharePoint: a.sharePoint ?? 0,
    };
  });
  const shareUserId = route.params?.shareUserId as number | undefined;
  const deepLinkActivityId = route.params?.activityId as string | undefined;
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'upcoming' | 'registered' | 'checked_in'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);

  // 获取报名用户真实头像
  const { users: registeredUsers } = useRegisteredAvatars(activity.id?.toString());

  // Modals
  const [showCheckinSuccessModal, setShowCheckinSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // --- LOGIC SECTION (Preserved functionality) --- //

  // Deep link: fetch activity by ID if only activityId is provided (no full activity object)
  useEffect(() => {
    if (activity.id || !deepLinkActivityId) return;
    const fetchActivity = async () => {
      try {
        const userId = user?.id ? parseInt(user.id) : undefined;
        const backendActivity = await pomeloXAPI.getActivityById(
          parseInt(deepLinkActivityId),
          userId,
        );
        if (backendActivity) {
          const adapted = adaptActivity(backendActivity, i18n.language);
          setActivity(adapted);
        }
      } catch (e) {
        console.warn('[ActivityDetail] Deep link fetch failed:', e);
      }
    };
    fetchActivity();
  }, [deepLinkActivityId]);

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

  // Format date display: "Oct 01 - Oct 10, 2025"
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDetailDate = () => {
    if (!activity.date) return '';
    const [y1, m1, d1] = activity.date.split('-').map(Number);
    const startMonth = MONTH_NAMES[m1 - 1];
    const startDay = String(d1).padStart(2, '0');

    if (activity.endDate && activity.endDate !== activity.date) {
      const [y2, m2, d2] = activity.endDate.split('-').map(Number);
      const endMonth = MONTH_NAMES[m2 - 1];
      const endDay = String(d2).padStart(2, '0');
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${y2}`;
    }
    return `${startMonth} ${startDay}, ${y1}`;
  };

  // Format time subtitle: "10:00 - 23:00 PM (GMT -04:00)"
  const formatDetailTime = () => {
    const startTime = activity.time || '';
    const endTime = activity.endTime || '';
    if (!startTime) return '';
    const timeParts = [];
    timeParts.push(startTime);
    if (endTime && endTime !== '00:00') {
      const hour = parseInt(endTime.split(':')[0], 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      timeParts.push(`${endTime} ${ampm}`);
    }
    const tz = activity.timeZone || '';
    const tzDisplay = tz ? ` (${tz})` : '';
    return timeParts.join(' - ') + tzDisplay;
  };

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
        shareUserId,
      });
      return;
    }
    // 免费活动 → 报名表单
    navigation.navigate('ActivityRegistrationForm', { activity, shareUserId });
  };

  const handleBack = () => navigation.goBack();

  const handleShare = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { returnTo: 'ActivityDetail', activityId: activity.id });
      return;
    }
    setShowShareModal(true);
  };

  // --- RENDER SECTION (New UI) --- //

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Scrollable Content */}
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Cover Image Carousel */}
        <View style={styles.coverImage}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActiveImageIndex(idx);
            }}
            scrollEventThrottle={16}
          >
            {(activity.images && activity.images.length > 0
              ? activity.images
              : [activity.image]
            ).map((uri: string, index: number) => (
              <ImageBackground
                key={index}
                source={{ uri }}
                style={{ width: screenWidth, height: 380 }}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.4)']}
                  style={styles.gradientOverlay}
                />
              </ImageBackground>
            ))}
          </ScrollView>
          {/* Floating pagination dots */}
          <View style={styles.paginationDotsOverlay}>
            {(activity.images && activity.images.length > 1
              ? activity.images
              : []
            ).map((_: any, index: number) => (
              <View key={index} style={[styles.dot, index === activeImageIndex && styles.activeDot]} />
            ))}
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Title Section */}
          <View style={styles.section}>
            {/* Status Badge */}
            <View style={styles.badgeRow}>
              <View style={[
                styles.statusBadge,
                activity.status === 'ended' && styles.statusBadgeEnded,
                (activity.status === 'registered' || activity.status === 'checked_in') && styles.statusBadgeRegistered,
              ]}>
                <Text style={styles.statusBadgeText}>
                  {(() => {
                    if (activity.status === 'ended') return t('activityDetail.ended', 'ended');
                    if (activity.status === 'checked_in') return t('activityDetail.checkedIn', 'checked-in');
                    if (activity.status === 'registered') return t('activityDetail.registered', 'registered');
                    // available: distinguish upcoming vs on-going by startTime
                    try {
                      const now = new Date();
                      const start = new Date(activity.date);
                      if (start.getTime() > now.getTime()) return t('activityDetail.upcoming', 'upcoming');
                    } catch {}
                    return t('activityDetail.ongoing', 'on-going');
                  })()}
                </Text>
              </View>
            </View>

            <Text style={styles.titleText}>{activity.title}</Text>

            {/* Tags & Avatars */}
            <View style={styles.tagsRow}>
              {activity.category ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>{activity.category}</Text>
                </View>
              ) : null}
              {/* Avatar Stack */}
              <View style={styles.avatarStack}>
                {(() => {
                  const registeredCount = activity.registeredCount || 0;
                  const FALLBACK_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#F4C4A8', '#A78BFA'];
                  const FALLBACK_INITIALS = ['A', 'B', 'C', 'D', 'E'];
                  const hasRealUsers = registeredUsers.length > 0;

                  if (registeredCount === 0 && !hasRealUsers) {
                    return <Text style={styles.goingText}>0 users going</Text>;
                  }

                  const avatarElements = hasRealUsers
                    ? registeredUsers.slice(0, 3).map((user, i) => (
                        user.avatar ? (
                          <Image
                            key={user.userId}
                            source={{ uri: user.avatar }}
                            style={[styles.miniAvatar, { zIndex: 3 - i, marginLeft: i > 0 ? -10 : 0 }]}
                          />
                        ) : (
                          <View
                            key={user.userId}
                            style={[
                              styles.miniAvatar,
                              styles.miniAvatarFallback,
                              { zIndex: 3 - i, marginLeft: i > 0 ? -10 : 0, backgroundColor: getAvatarColor(user.userId) },
                            ]}
                          >
                            <Text style={styles.miniAvatarInitial}>{user.initial}</Text>
                          </View>
                        )
                      ))
                    : Array.from({ length: Math.min(registeredCount, 3) }, (_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.miniAvatar,
                            styles.miniAvatarFallback,
                            { zIndex: 3 - i, marginLeft: i > 0 ? -10 : 0, backgroundColor: FALLBACK_COLORS[i] },
                          ]}
                        >
                          <Text style={styles.miniAvatarInitial}>{FALLBACK_INITIALS[i]}</Text>
                        </View>
                      ));

                  return (
                    <>
                      {avatarElements.length > 0 && (
                        <View style={styles.avatarPill}>
                          {avatarElements}
                        </View>
                      )}
                      <Text style={styles.goingText}>
                        +{registeredCount} {registeredCount === 1 ? 'user' : 'users'} going
                      </Text>
                    </>
                  );
                })()}
              </View>
            </View>
          </View>

          {/* Info List */}
          <View style={styles.infoList}>
            {/* Date */}
            <InfoRow
              IconComponent={CalendarIcon}
              title={formatDetailDate()}
              subtitle={formatDetailTime()}
              color="#FF6B35"
            />
            {/* Location */}
            <InfoRow
              IconComponent={LocationIcon}
              title={activity.location?.split(',')[0] || ''}
              subtitle={activity.location || ''}
              color="#FF6B35"
            />
            {/* Price */}
            <InfoRow
              IconComponent={PriceFilterIcon}
              title={(!activity.price || activity.price == 0) ? "Free" : `$${activity.price}`}
              color="#FF6B35"
            />
            {/* Registered */}
            <InfoRow
              IconComponent={AvailabilityFilterIcon}
              title={`${activity.registeredCount ?? 0}/${activity.maxAttendees ?? 0} People Registered`}
              color="#FF6B35"
              showProgress
              attending={activity.registeredCount ?? 0}
              maxAttending={activity.maxAttendees ?? 0}
            />
          </View>

          <View style={styles.divider} />

          {/* Organizer */}
          <View style={styles.organizerSection}>
            <Text style={styles.sectionHeaderLabel}>ORGANIZER</Text>
            <View style={styles.organizerRow}>
              <View style={styles.organizerAvatarContainer}>
                <Text style={styles.organizerInitial}>
                  {i18n.language === 'zh' ? '官' : 'CU'}
                </Text>
              </View>
              <Text style={styles.organizerName} numberOfLines={2}>
                {i18n.language === 'zh' ? '官方活动' : 'CU Official Event'}
              </Text>
              {activity.organizer?.verified !== false && (
                <View style={styles.verifiedRow}>
                  <VerifiedBadge size={20} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* University */}
          <View style={styles.universitySection}>
            <Text style={styles.sectionHeaderLabel}>UNIVERSITY</Text>
            <View style={styles.universityRow}>
              {schoolLoading ? (
                <Text style={styles.uniName}>...</Text>
              ) : (() => {
                const uniName = school ? schoolService.getSchoolDisplayName(school) : activity.deptName || activity.location || 'Unknown University';
                const logoUrl = (school ? schoolService.getSchoolLogoUrl(school) : null) || activity.organizer?.avatar || activity.organizerAvatar;
                return (
                  <>
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.uniLogo} resizeMode="contain" />
                    ) : (
                      <View style={styles.uniLogoFallback}>
                        <Text style={styles.uniLogoInitial}>{uniName[0]?.toUpperCase() || 'U'}</Text>
                      </View>
                    )}
                    <Text style={styles.uniName}>{uniName}</Text>
                  </>
                );
              })()}
            </View>
          </View>

          <View style={styles.divider} />

          {/* About Event */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionHeaderLabel}>ABOUT EVENT</Text>
            <Text style={styles.aboutText}>
              {(activity.detail || activity.description || t('activity.detail.noDescription', 'No description available.')).replace(/<[^>]*>/g, '')}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Location */}
          <View style={styles.linkSection}>
            <Text style={styles.sectionHeaderLabel}>LOCATION</Text>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => setShowMapSelector(true)}
            >
              <View style={styles.linkLeft}>
                <MapIcon size={24} color="#000000" />
                <Text style={styles.linkText}>Open in Maps</Text>
              </View>
              <DiagonalArrowIcon size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.linkDivider} />

          {/* Weather */}
          <View style={styles.linkSection}>
            <Text style={styles.sectionHeaderLabel}>WEATHER</Text>
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
              <View style={styles.linkLeft}>
                <SunIcon size={24} color="#D6650E" />
                <Text style={styles.linkText}>
                  {weatherLoading ? '...' : (weather ? weatherAPI.formatTemperatureRange(weather) : '...')}
                </Text>
                <Text style={styles.linkDateText}>
                  |  {activity.date ? new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : ''}
                </Text>
              </View>
              <DiagonalArrowIcon size={18} color="#000000" />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Floating Header Buttons - always visible */}
      <View style={[styles.floatingHeaderBar, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.roundButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.roundButton} onPress={handleShare}>
          <ShareIcon size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

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

      <ActivityShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        activityId={activity.id}
        activityImage={activity.image}
        sharePoint={activity.sharePoint}
        userId={user?.id || ''}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },
  coverImage: {
    width: '100%',
    height: 380,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  paginationDotsOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  floatingHeaderBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#FFFFFF',
  },
  activeDot: {
    width: 47,
    borderRadius: 5.5,
    backgroundColor: '#FF7763',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FAF3F1',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
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
  statusBadgeEnded: {
    backgroundColor: '#95A5A6',
  },
  statusBadgeRegistered: {
    backgroundColor: '#3498DB',
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
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249,167,137,0.2)',
    borderRadius: 17.5,
    paddingRight: 4,
    paddingVertical: 2,
    paddingLeft: 2,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  miniAvatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  goingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#8E8E93',
  },

  // Info List
  infoList: {
    marginBottom: 0,
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
    marginTop: 10,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  organizerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(177,177,177,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  organizerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  organizerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 14,
    color: '#2FD573',
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
    borderRadius: 20,
    marginRight: 12,
  },
  uniLogoFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uniLogoInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
  linkSection: {
    marginBottom: 0,
  },
  linkDivider: {
    height: 1,
    backgroundColor: '#949494',
    opacity: 0.4,
    marginVertical: 16,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 51,
    backgroundColor: '#FFFFFF',
    borderRadius: 25.5,
    paddingHorizontal: 15,
    marginTop: 8,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 15,
  },
  linkText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  linkDateText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    fontWeight: '500',
    color: '#949494',
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
    height: 50,
    borderRadius: 12,
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