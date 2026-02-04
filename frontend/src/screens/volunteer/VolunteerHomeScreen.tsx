import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  RefreshControl,
  ScrollView,
  Platform,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LoaderOne } from '../../components/ui/LoaderOne';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useUser } from '../../context/UserContext';
import { useVolunteerContext } from '../../context/VolunteerContext';
import { VolunteerSchoolListScreen } from './VolunteerSchoolListScreen';
import { FloatingSearchButton } from '../../components/navigation/FloatingSearchButton';
import {
  getVolunteerRecords,
  getLastVolunteerRecord,
  getPersonalVolunteerHours,
  getPersonalVolunteerRecords,
  volunteerSignRecord,
  performVolunteerCheckIn,
  performVolunteerCheckOut,
  getVolunteerStatus,
  VolunteerRecord
} from '../../services/volunteerAPI';
import { useSchoolData } from '../../hooks/useSchoolData';
import { timeService } from '../../utils/UnifiedTimeService';
import { SafeAlert } from '../../utils/SafeAlert';

const { width: screenWidth } = Dimensions.get('window');

// --- Helper Components ---

const QuickActions: React.FC<{ onCheckIn: () => void; onLogHours: () => void }> = ({ onCheckIn, onLogHours }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useAllDarkModeStyles();

  return (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={[styles.quickActionCard, { backgroundColor: '#FF6F61' }]} // Vibrant orange
        onPress={onCheckIn}
        activeOpacity={0.8}
      >
        <View style={styles.quickActionIconContainer}>
          <Ionicons name="time" size={24} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.quickActionLabel}>{t('volunteer.checkin_timer') || 'Check in Timer'}</Text>
          <Text style={styles.quickActionSublabel}>Start volunteering</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickActionCard, { backgroundColor: '#4A90E2' }]} // Tech blue
        onPress={onLogHours}
        activeOpacity={0.8}
      >
        <View style={styles.quickActionIconContainer}>
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.quickActionLabel}>{t('volunteer.log_hours') || 'Log Hours'}</Text>
          <Text style={styles.quickActionSublabel}>Enter past work</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const SchoolItem: React.FC<{ name: string; logo?: string | null; onPress: () => void }> = ({ name, logo, onPress }) => {
  const { isDarkMode } = useAllDarkModeStyles();
  return (
    <TouchableOpacity
      style={[styles.schoolItem, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.schoolInfoRow}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.schoolLogo} resizeMode="contain" />
        ) : (
          <View style={styles.schoolIconPlaceholder}>
            <Ionicons name="business" size={20} color="#FF6F61" />
          </View>
        )}
        <Text style={[styles.schoolName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{name}</Text>
      </View>
      <View style={styles.schoolActionIcon}>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
};

// --- Main Screen ---

export const VolunteerHomeScreen: React.FC = () => {
  const { user, permissionLevel, permissions } = useUser();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useAllDarkModeStyles();
  const { schools, loading: schoolsLoading } = useSchoolData();

  const [loading, setLoading] = useState(true);
  const [personalData, setPersonalData] = useState<any>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Timer modal states
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [volunteerStatus, setVolunteerStatus] = useState<'not_signed_in' | 'signed_in' | 'signed_out'>('not_signed_in');
  const [lastRecord, setLastRecord] = useState<VolunteerRecord | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workDescription, setWorkDescription] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine view mode based on permissions
  // Scope 'self' = Staff view (Personal data)
  // Scope 'school' or 'all' = Admin view (Management)
  const isAdminView = permissions.isAdmin() || permissionLevel === 'part_manage' || permissionLevel === 'manage';

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (!user?.userId) return;

      const userId = parseInt(String(user.userId));

      // Fetch stats for self always as a summary
      const [hoursResult, recordsResult] = await Promise.all([
        getPersonalVolunteerHours(userId),
        getPersonalVolunteerRecords(userId),
      ]);

      if (hoursResult.code === 200) {
        setPersonalData(hoursResult.data);
      }

      // Get total record count from records response
      if (recordsResult.code === 200 && recordsResult.data) {
        const data = recordsResult.data as any;
        const records = Array.isArray(data) ? data : (data.records || []);
        setRecordCount(records.length);
      }
    } catch (error) {
      console.error('Error loading volunteer data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load volunteer status
  const loadVolunteerStatus = async () => {
    if (!user?.userId) return;

    try {
      const userId = parseInt(String(user.userId));
      const result = await getLastVolunteerRecord(userId);

      if (result.code === 200 && result.data) {
        setLastRecord(result.data);
        const status = getVolunteerStatus(result.data);
        setVolunteerStatus(status);

        // Calculate elapsed time if signed in
        if (status === 'signed_in' && result.data.startTime) {
          const startTime = timeService.parseServerTime(result.data.startTime);
          if (startTime) {
            const now = new Date();
            const diffSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            setElapsedSeconds(Math.max(0, diffSeconds));
          }
        }
      } else {
        setVolunteerStatus('not_signed_in');
        setLastRecord(null);
      }
    } catch (error) {
      console.error('Error loading volunteer status:', error);
      setVolunteerStatus('not_signed_in');
    }
  };

  // Timer effect
  useEffect(() => {
    if (volunteerStatus === 'signed_in' && timerModalVisible) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [volunteerStatus, timerModalVisible]);

  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle sign in
  const handleSignIn = async () => {
    if (!user?.userId || !user?.legalName) {
      SafeAlert.alert(t('common.error') || 'Error', t('volunteer.user_info_missing') || 'User information missing');
      return;
    }

    setIsProcessing(true);
    try {
      const userId = parseInt(String(user.userId));
      const result = await performVolunteerCheckIn(userId, userId, user.legalName);

      if (result.code === 200) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        SafeAlert.alert(
          t('volunteer.signin_success') || 'Sign-in Successful',
          t('volunteer.signin_success_msg', { name: user.legalName }) || `${user.legalName} signed in successfully!`
        );
        await loadVolunteerStatus();
        setElapsedSeconds(0);
      } else {
        SafeAlert.alert(t('common.error') || 'Error', result.msg || t('volunteer.signin_operation_failed') || 'Sign-in failed');
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      SafeAlert.alert(t('common.error') || 'Error', error instanceof Error ? error.message : t('volunteer.signin_operation_failed') || 'Sign-in failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    if (!user?.userId || !user?.legalName) {
      SafeAlert.alert(t('common.error') || 'Error', t('volunteer.user_info_missing') || 'User information missing');
      return;
    }

    if (!workDescription.trim()) {
      SafeAlert.alert(
        t('volunteer.description_required') || 'Description Required',
        t('volunteer.please_enter_description') || 'Please enter a work description before signing out'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const userId = parseInt(String(user.userId));
      const result = await performVolunteerCheckOut(userId, userId, user.legalName, workDescription.trim());

      if (result.code === 200) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        SafeAlert.alert(
          t('volunteer.signout_success') || 'Sign-out Successful',
          t('volunteer.signout_success_msg', { name: user.legalName }) || `${user.legalName} signed out successfully!`
        );
        setTimerModalVisible(false);
        setWorkDescription('');
        setElapsedSeconds(0);
        await loadData(true);
        await loadVolunteerStatus();
      } else {
        SafeAlert.alert(t('common.error') || 'Error', result.msg || t('volunteer.signout_failed') || 'Sign-out failed');
      }
    } catch (error) {
      console.error('Sign-out error:', error);
      SafeAlert.alert(t('common.error') || 'Error', error instanceof Error ? error.message : t('volunteer.signout_failed') || 'Sign-out failed');
    } finally {
      setIsProcessing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      loadVolunteerStatus();
    }, [])
  );

  const handleCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimerModalVisible(true);
  };

  const handleLogHours = () => {
    navigation.navigate('TimeEntry');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#FDF7F2' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {isAdminView ? t('volunteer.management_title') || 'Volunteer Management' : t('volunteer.personal_title') || 'My Volunteering'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
      >
        {/* Quick Actions Card Section */}
        <QuickActions onCheckIn={handleCheckIn} onLogHours={handleLogHours} />

        {/* Stats Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#FF6F61' }]}>{((personalData?.totalMinutes || 0) / 60).toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('volunteer.total_hours') || 'Total Hours'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#4A90E2' }]}>{recordCount}</Text>
            <Text style={styles.statLabel}>{t('volunteer.records') || 'Records'}</Text>
          </View>
        </View>

        {/* Conditional Sections based on User Scope/Permissions */}
        {isAdminView ? (
          <View style={styles.adminSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('volunteer.school_section') || 'SCHOOL MANAGEMENT'}</Text>
            </View>

            {/* Dynamic school list from API */}
            <View style={styles.schoolListContainer}>
              {schoolsLoading ? (
                <View style={styles.emptyStateContainer}>
                  <LoaderOne size={24} />
                </View>
              ) : schools.length > 0 ? (
                schools.map((school) => (
                  <SchoolItem
                    key={school.deptId}
                    name={school.deptName || school.aprName || 'Unknown School'}
                    logo={school.logo}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate('VolunteerSchoolDetail', {
                        schoolId: school.deptId,
                        schoolName: school.deptName || school.aprName,
                      });
                    }}
                  />
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="business-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyStateText}>{t('volunteer.no_schools') || 'No schools available'}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.staffSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('volunteer.recent_activity') || 'RECENT ACTIVITY'}</Text>
            </View>
            <View style={styles.emptyStateContainer}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>{t('volunteer.no_work_record') || 'No recent records found'}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {isAdminView && <FloatingSearchButton />}

      {/* Check-in Timer Modal */}
      <Modal
        visible={timerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTimerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                {volunteerStatus === 'signed_in'
                  ? t('volunteer.currently_volunteering') || 'Currently Volunteering'
                  : t('volunteer.start_volunteering') || 'Start Volunteering'}
              </Text>
              <TouchableOpacity
                onPress={() => setTimerModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
              <Text style={[styles.timerDisplay, { color: volunteerStatus === 'signed_in' ? '#4CAF50' : '#94A3B8' }]}>
                {formatElapsedTime(elapsedSeconds)}
              </Text>
              <Text style={[styles.timerLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                {volunteerStatus === 'signed_in'
                  ? t('volunteer.time_elapsed') || 'Time Elapsed'
                  : t('volunteer.ready_to_start') || 'Ready to Start'}
              </Text>
            </View>

            {/* Sign-in Button or Sign-out Form */}
            {volunteerStatus !== 'signed_in' ? (
              <TouchableOpacity
                style={[styles.signInButton, isProcessing && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="play" size={24} color="#FFFFFF" />
                    <Text style={styles.signInButtonText}>{t('volunteer.start_timer') || 'Start Timer'}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.signOutSection}>
                {/* Work Description Input */}
                <Text style={[styles.inputLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {t('volunteer.work_description') || 'Work Description'} *
                </Text>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    {
                      backgroundColor: isDarkMode ? '#2C2C2E' : '#F5F5F5',
                      color: isDarkMode ? '#FFFFFF' : '#000000',
                    },
                  ]}
                  placeholder={t('volunteer.enter_work_description') || 'Enter what you worked on...'}
                  placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                  value={workDescription}
                  onChangeText={setWorkDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={100}
                />
                <Text style={styles.characterCount}>
                  {workDescription.length}/100
                </Text>

                {/* Sign Out Button */}
                <TouchableOpacity
                  style={[styles.signOutButton, isProcessing && styles.buttonDisabled]}
                  onPress={handleSignOut}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="stop" size={24} color="#FFFFFF" />
                      <Text style={styles.signOutButtonText}>{t('volunteer.stop_timer') || 'Stop Timer'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Start Time Info */}
            {volunteerStatus === 'signed_in' && lastRecord?.startTime && (
              <View style={styles.startTimeInfo}>
                <Text style={[styles.startTimeLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                  {t('volunteer.started_at') || 'Started at'}:
                </Text>
                <Text style={[styles.startTimeValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {timeService.formatForDisplay(timeService.parseServerTime(lastRecord.startTime) || new Date(), { showTime: true })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    height: 140,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quickActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickActionSublabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  schoolListContainer: {
    gap: 12,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  schoolInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  schoolIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolLogo: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '600',
  },
  schoolActionIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  adminSection: {
    marginBottom: 20,
  },
  staffSection: {
    marginBottom: 20,
  },
  // Timer Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutSection: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6F61',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  startTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  startTimeLabel: {
    fontSize: 14,
  },
  startTimeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VolunteerHomeScreen;