import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';
import { GlassCapsule } from '../../components/consulting/GlassCapsule';
import { getSchoolLogo } from '../../utils/schoolLogos';

// 扩展志愿者数据模型 - 包含完整签到历史
const mockVolunteers = [
  {
    id: '1',
    name: '张小明',
    avatar: null,
    hours: 45,
    level: 'Senior',
    status: 'online',
    major: '计算机科学',
    checkInStatus: 'checked_in',
    checkInTime: '2025-08-15T09:30:00',
    totalHours: 45.5,
    lastCheckInTime: '2025-08-14T14:30:00',
    lastCheckOutTime: '2025-08-14T18:00:00',
  },
  {
    id: '2', 
    name: '李小红',
    avatar: null,
    hours: 32,
    level: 'Junior',
    status: 'offline',
    major: '商科',
    checkInStatus: 'not_checked_in',
    totalHours: 32.0,
    lastCheckInTime: '2025-08-13T10:00:00',
    lastCheckOutTime: '2025-08-13T15:00:00',
  },
  {
    id: '3',
    name: '王小强',
    avatar: null,
    hours: 67,
    level: 'Senior',
    status: 'online', 
    major: '工程学',
    checkInStatus: 'checked_out',
    checkInTime: '2025-08-15T08:00:00',
    checkOutTime: '2025-08-15T12:00:00',
    duration: 240,
    totalHours: 67.5,
    lastCheckInTime: '2025-08-14T09:00:00',
    lastCheckOutTime: '2025-08-14T17:30:00',
  },
  {
    id: '4',
    name: 'Sarah Chen',
    avatar: null,
    hours: 23,
    level: 'Sophomore',
    status: 'online',
    major: '心理学',
    checkInStatus: 'checked_in',
    checkInTime: '2025-08-15T14:30:00',
    totalHours: 23.0,
    lastCheckInTime: '2025-08-13T16:00:00',
    lastCheckOutTime: '2025-08-13T19:00:00',
  },
];

export const SchoolDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const school = (route.params as any)?.school;
  const [volunteers, setVolunteers] = useState(mockVolunteers);
  const [expandedVolunteer, setExpandedVolunteer] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  if (!school) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{t('school.not_found_message')}</Text>
      </SafeAreaView>
    );
  }

  const logoSource = getSchoolLogo(school.id);

  // 处理签到签出
  const handleCheckIn = (volunteerId: string) => {
    setVolunteers(prev => prev.map(v => 
      v.id === volunteerId 
        ? { ...v, checkInStatus: 'checked_in', checkInTime: new Date().toISOString() }
        : v
    ));
    Alert.alert(t('volunteerCheckIn.alerts.checkInSuccess'), t('volunteerCheckIn.alerts.checkInSuccessMessage', { name: volunteerName }));
  };

  const handleCheckOut = (volunteerId: string) => {
    setVolunteers(prev => prev.map(v => 
      v.id === volunteerId 
        ? { 
            ...v, 
            checkInStatus: 'checked_out', 
            checkOutTime: new Date().toISOString(),
            duration: v.checkInTime ? Math.round((Date.now() - new Date(v.checkInTime).getTime()) / 60000) : 0
          }
        : v
    ));
    Alert.alert(t('volunteerCheckIn.alerts.checkOutSuccess'), t('volunteerCheckIn.alerts.checkOutSuccessMessage', { name: volunteerName, hours: 0, minutes: 0 }));
  };

  // 中文日期格式化函数 - 15日-8月-09:30格式
  const formatChineseDateTime = (timeString: string) => {
    const date = new Date(timeString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const time = date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${day}日-${month}月-${time}`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderVolunteerItem = ({ item }: { item: any }) => {
    const isExpanded = expandedVolunteer === item.id;
    
    return (
      <View style={styles.volunteerItemContainer}>
        <TouchableOpacity 
          style={styles.volunteerItem}
          onPress={() => {
            console.log('点击志愿者:', item.name);
            setExpandedVolunteer(isExpanded ? null : item.id);
          }}
          activeOpacity={0.8}
        >
      <BlurView intensity={Glass.blur} tint="light" style={styles.volunteerBlur}>
        {/* 高光分隔线 */}
        <LinearGradient 
          colors={[Glass.hairlineFrom, Glass.hairlineTo]}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }} 
          style={{ height: 1 }}
        />
        
        {/* 白系叠色 */}
        <LinearGradient 
          colors={[Glass.overlayTop, Glass.overlayBottom]}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.volunteerContent}>
          {/* 头像 */}
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={Glass.textWeak} />
          </View>

          {/* 信息 */}
          <View style={styles.volunteerInfo}>
            <Text style={styles.volunteerName}>{item.name}</Text>
            <Text style={styles.volunteerMajor}>{item.major}</Text>
            <Text style={styles.volunteerHours}>{item.hours}{t('wellbeing.volunteer.hours')} • {item.level}</Text>
          </View>

          {/* 状态和chevron */}
          <View style={styles.rightSection}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'online' ? '#34D399' : '#9CA3AF' }
            ]}>
              <Text style={styles.statusText}>
                {item.status === 'online' ? t('common.online', 'Online') : t('common.offline', 'Offline')}
              </Text>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={Glass.textWeak} 
              style={{ marginLeft: 8 }} 
            />
          </View>
        </View>
      </BlurView>
        </TouchableOpacity>

        {/* 展开的签到信息 */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <BlurView intensity={Glass.blur} tint="light" style={styles.expandedBlur}>
              <LinearGradient 
                colors={[Glass.hairlineFrom, Glass.hairlineTo]}
                start={{ x: 0, y: 0 }} 
                end={{ x: 0, y: 1 }} 
                style={{ height: 1 }}
              />
              <LinearGradient 
                colors={[Glass.overlayTop, Glass.overlayBottom]}
                start={{ x: 0, y: 0 }} 
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.expandedContent}>
                {/* 完整签到状态信息 - 7项 */}
                <View style={styles.checkInInfo}>
                  {/* 1. 签到状态 */}
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>{t('volunteer_status.check_in_time_label')}</Text>
                    <Text style={[
                      styles.statusValue,
                      { color: 
                        item.checkInStatus === 'checked_in' ? '#34D399' : 
                        item.checkInStatus === 'checked_out' ? '#9CA3AF' : 
                        '#F59E0B'
                      }
                    ]}>
                      {item.checkInStatus === 'checked_in' ? t('volunteer_status.checked_in') : 
                       item.checkInStatus === 'checked_out' ? t('volunteer_status.checked_out') : 
                       t('volunteer_status.not_checked_in')}
                    </Text>
                  </View>

                  {/* 2. 今日签到时间 (完整格式) */}
                  {item.checkInTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.check_in_time_label')}</Text>
                      <Text style={styles.statusValue}>{formatChineseDateTime(item.checkInTime)}</Text>
                    </View>
                  )}

                  {/* 3. 今日签出时间 (完整格式) */}
                  {item.checkOutTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.check_out_time_label')}</Text>
                      <Text style={styles.statusValue}>{formatChineseDateTime(item.checkOutTime)}</Text>
                    </View>
                  )}

                  {/* 4. 今日时长 */}
                  {item.duration && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.today_duration_label')}</Text>
                      <Text style={styles.statusValue}>{Math.round(item.duration / 60 * 10) / 10}{t('wellbeing.volunteer.hours')}</Text>
                    </View>
                  )}

                  {/* 5. 总计时长 */}
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>{t('volunteer_status.total_duration_label')}</Text>
                    <Text style={styles.statusValue}>{item.totalHours}{t('wellbeing.volunteer.hours')}</Text>
                  </View>

                  {/* 6. 上次签到时间 */}
                  {item.lastCheckInTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.last_check_in_label')}</Text>
                      <Text style={styles.statusValue}>{formatChineseDateTime(item.lastCheckInTime)}</Text>
                    </View>
                  )}

                  {/* 7. 上次签出时间 */}
                  {item.lastCheckOutTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.last_check_out_label')}</Text>
                      <Text style={styles.statusValue}>{formatChineseDateTime(item.lastCheckOutTime)}</Text>
                    </View>
                  )}
                </View>

                {/* 签到签出按钮 */}
                <View style={styles.actionButtons}>
                  {item.checkInStatus === 'not_checked_in' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.checkInBtn]}
                      onPress={() => handleCheckIn(item.id)}
                    >
                      <Text style={styles.actionButtonText}>{t('volunteer_status.check_in_button')}</Text>
                    </TouchableOpacity>
                  )}
                  
                  {item.checkInStatus === 'checked_in' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.checkOutBtn]}
                      onPress={() => handleCheckOut(item.id)}
                    >
                      <Text style={styles.actionButtonText}>{t('volunteer_status.check_out_button')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </BlurView>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 背景渐变 */}
      <LinearGradient
        colors={[Glass.pageBgTop, Glass.pageBgBottom, '#F8F9FA', '#F1F3F4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.7, 1]}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Glass.textMain} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{t('school.volunteer_details_title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 学校信息卡片 */}
        <View style={styles.schoolCard}>
          <BlurView intensity={Glass.blur} tint="light" style={styles.schoolCardBlur}>
            <LinearGradient 
              colors={[Glass.hairlineFrom, Glass.hairlineTo]}
              start={{ x: 0, y: 0 }} 
              end={{ x: 0, y: 1 }} 
              style={{ height: 1 }}
            />
            <LinearGradient 
              colors={[Glass.overlayTop, Glass.overlayBottom]}
              start={{ x: 0, y: 0 }} 
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.schoolInfo}>
              {/* 校徽 */}
              <View style={styles.schoolLogo}>
                {logoSource ? (
                  <Image 
                    source={logoSource}
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.logoText}>{school.shortName}</Text>
                )}
              </View>

              <View style={styles.schoolTextInfo}>
                <Text style={styles.schoolNameCN}>{school.nameCN}</Text>
                <Text style={styles.schoolNameEN}>{school.nameEN}</Text>
                <Text style={styles.schoolLocation}>{school.city}, {school.state}</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* 统计信息 */}
        <View style={styles.statsSection}>
          <GlassCapsule
            items={[
              { value: school.volunteers?.toString() || '156', label: t('school.volunteers_label') },
              { value: '12', label: t('school.activities_count_label') },
              { value: '4.8', label: t('school.rating_label') },
            ]}
          />
        </View>

        {/* 志愿者列表 */}
        <View style={styles.volunteersSection}>
          <Text style={styles.sectionTitle}>{t('school.active_volunteers_title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('school.click_volunteer_instruction')}</Text>
          
          <FlatList
            data={volunteers}
            renderItem={renderVolunteerItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    paddingTop: 12,
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Glass.textMain,
  },

  // 学校信息卡片
  schoolCard: {
    marginHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 20,
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
    ...Glass.shadows.sm.ios,
    elevation: Glass.shadows.sm.android.elevation,
  },

  schoolCardBlur: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
  },

  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },

  schoolLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    ...Glass.shadows.xs.ios,
    elevation: Glass.shadows.xs.android.elevation,
  },

  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: Glass.textMain,
  },

  schoolTextInfo: {
    flex: 1,
  },

  schoolNameCN: {
    fontSize: 18,
    fontWeight: '700',
    color: Glass.textMain,
    marginBottom: 4,
  },

  schoolNameEN: {
    fontSize: 14,
    fontWeight: '500',
    color: Glass.textWeak,
    marginBottom: 4,
  },

  schoolLocation: {
    fontSize: 12,
    color: Glass.textWeak,
  },

  // 统计区域
  statsSection: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 24,
  },

  // 志愿者区域
  volunteersSection: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 40,
  },

  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Glass.textMain,
    marginBottom: 8,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: Glass.textWeak,
    marginBottom: 16,
  },

  // 志愿者列表项
  volunteerItem: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
    ...Glass.shadows.xs.ios,
    elevation: Glass.shadows.xs.android.elevation,
  },

  volunteerBlur: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
  },

  volunteerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  volunteerInfo: {
    flex: 1,
  },

  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Glass.textMain,
    marginBottom: 2,
  },

  volunteerMajor: {
    fontSize: 14,
    color: Glass.textWeak,
    marginBottom: 2,
  },

  volunteerHours: {
    fontSize: 12,
    color: Glass.textWeak,
  },

  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 展开区域样式
  volunteerItemContainer: {
    marginBottom: 8,
  },

  expandedSection: {
    marginTop: 4,
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
    ...Glass.shadows.xs.ios,
    elevation: Glass.shadows.xs.android.elevation,
  },

  expandedBlur: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
  },

  expandedContent: {
    padding: 16,
  },

  checkInInfo: {
    marginBottom: 16,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  statusLabel: {
    fontSize: 14,
    color: Glass.textWeak,
    fontWeight: '500',
  },

  statusValue: {
    fontSize: 14,
    color: Glass.textMain,
    fontWeight: '600',
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    ...Glass.shadows.xs.ios,
    elevation: Glass.shadows.xs.android.elevation,
  },

  checkInBtn: {
    backgroundColor: '#34D399',
  },

  checkOutBtn: {
    backgroundColor: '#F59E0B',
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SchoolDetailScreen;