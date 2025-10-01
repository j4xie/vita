import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { i18n } from '../../utils/i18n';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme';
import { getVolunteerHistoryRecords, VolunteerRecord } from '../../services/volunteerAPI';
import { timeService } from '../../utils/UnifiedTimeService';
import { SafeText } from '../../components/common/SafeText';
import { Loading } from '../../components/ui/Loading';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

// Navigation types
type VolunteerHistoryRouteParams = {
  userId: number;
  userName: string;
  userPermission?: 'manage' | 'part_manage' | 'staff';
};

type VolunteerHistoryRouteProp = RouteProp<
  { VolunteerHistory: VolunteerHistoryRouteParams },
  'VolunteerHistory'
>;

// Time range options
interface TimeRangeOption {
  days: 1 | 3 | 7 | 30;
  label: string;
  key: string;
}

// History record item component - Using React.memo for optimization
const HistoryRecordItem = React.memo<{
  record: VolunteerRecord;
  isDarkMode: boolean;
}>(({ record, isDarkMode }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate work duration and overtime detection
  const durationInfo = useMemo(() => {
    if (!record.startTime || !record.endTime) return null;

    const startDate = timeService.parseServerTime(record.startTime);
    const endDate = timeService.parseServerTime(record.endTime);
    const durationResult = startDate && endDate ? timeService.calculateDuration(startDate, endDate) : null;

    const result = durationResult ? {
      duration: durationResult.display,
      isInvalid: !durationResult.isValid,
      isOvertime: durationResult.isOvertime,
      hours: Math.floor(durationResult.minutes / 60)
    } : {
      duration: '--:--',
      isInvalid: true,
      isOvertime: false,
      hours: 0
    };
    return {
      duration: result.duration,
      isOvertime: result.isOvertime,
      isInvalid: result.isInvalid,
      hours: result.hours
    };
  }, [record.startTime, record.endTime]);

  // Status information
  const statusInfo = useMemo(() => {
    if (record.status !== undefined) {
      switch (record.status) {
        case -1:
          return {
            label: t('wellbeing.volunteer.history.status.pending'),
            color: '#FF9500',
            backgroundColor: '#FF950020',
            icon: 'time-outline'
          };
        case 1:
          return {
            label: t('wellbeing.volunteer.history.status.approved'),
            color: theme.colors.success,
            backgroundColor: theme.colors.success + '20',
            icon: 'checkmark-circle-outline'
          };
        case 2:
          return {
            label: t('wellbeing.volunteer.history.status.rejected'),
            color: '#FF3B30',
            backgroundColor: '#FF3B3020',
            icon: 'close-circle-outline'
          };
        default:
          return {
            label: t('wellbeing.volunteer.history.status.unknown'),
            color: '#8E8E93',
            backgroundColor: '#8E8E9320',
            icon: 'help-circle-outline'
          };
      }
    }

    const isCompleted = record.endTime !== null;
    if (isCompleted) {
      return {
        label: t('wellbeing.volunteer.history.status.pending'),
        color: '#FF9500',
        backgroundColor: '#FF950020',
        icon: 'time-outline'
      };
    } else {
      return {
        label: t('wellbeing.volunteer.history.inProgress'),
        color: theme.colors.warning,
        backgroundColor: theme.colors.warning + '20',
        icon: 'play-circle-outline'
      };
    }
  }, [record.status, record.endTime, theme.colors, t]);

  return (
    <View style={[
      styles.recordItem,
      { backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff' }
    ]}>
      {/* Date header */}
      <View style={styles.recordHeader}>
        <View style={styles.dateInfo}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={theme.colors.text.secondary}
          />
          <SafeText style={[styles.recordDate, { color: theme.colors.text.primary }]} fallback="日期未知">
            {new Date(record.startTime).toLocaleDateString(
              i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
              month: '2-digit',
              day: '2-digit',
              weekday: 'short'
            })}
          </SafeText>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>

          {/* Overtime warning badge */}
          {durationInfo?.isOvertime && (
            <View style={[styles.warningBadge, { backgroundColor: '#FBA6A6' }]}>
              <Ionicons name="warning-outline" size={12} color="#DC2626" />
              <Text style={[styles.warningText, { color: '#DC2626' }]}>
                {t('wellbeing.volunteer.history.overtime.abnormal')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Time information */}
      <View style={styles.timeInfo}>
        <View style={styles.timeRow}>
          <Ionicons name="log-in-outline" size={14} color={theme.colors.success} />
          <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
            {t('wellbeing.volunteer.history.checkInTime')}
          </Text>
          <SafeText style={[styles.timeValue, { color: theme.colors.text.primary }]} fallback="--:--">
            {timeService.formatForDisplay(timeService.parseServerTime(record.startTime), { showDate: true, showTime: true }) || '--:--'}
          </SafeText>
        </View>

        {record.endTime && (
          <View style={styles.timeRow}>
            <Ionicons name="log-out-outline" size={14} color={theme.colors.primary} />
            <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
              {t('wellbeing.volunteer.history.checkOutTime')}
            </Text>
            <SafeText style={[styles.timeValue, { color: theme.colors.text.primary }]} fallback="--:--">
              {timeService.formatForDisplay(timeService.parseServerTime(record.endTime), { showDate: true, showTime: true }) || '--:--'}
            </SafeText>
          </View>
        )}

        {record.endTime && durationInfo && !durationInfo?.isInvalid && (
          <View style={styles.durationRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={durationInfo.isInvalid ? '#DC2626' : (durationInfo.isOvertime ? '#DC2626' : theme.colors.warning)}
            />
            <Text style={[styles.durationLabel, { color: theme.colors.text.secondary }]}>
              {t('wellbeing.volunteer.history.workDuration')}
            </Text>
            <View style={styles.durationValueContainer}>
              <Text style={[
                styles.durationValue,
                {
                  color: durationInfo.isInvalid ? '#DC2626' : (durationInfo.isOvertime ? '#DC2626' : theme.colors.primary),
                  fontWeight: '600'
                }
              ]}>
                {durationInfo.duration}
              </Text>
              {durationInfo.isOvertime && (
                <View style={styles.overtimeWarning}>
                  <Ionicons name="warning" size={12} color="#DC2626" />
                  <Text style={[styles.overtimeText, { color: '#DC2626' }]}>
                    {t('wellbeing.volunteer.history.overtime.warning')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Detail expand button - only show when there's remark content */}
      {record.remark && (
        <View style={styles.detailSection}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isExpanded ? "chevron-down" : "chevron-forward"}
              size={16}
              color={theme.colors.text.secondary}
            />
            <Text style={[styles.detailButtonText, { color: theme.colors.text.secondary }]}>
              {t('wellbeing.volunteer.history.detail', '详情')}
            </Text>
          </TouchableOpacity>

          {/* Work description expanded content */}
          {isExpanded && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionLabel, { color: theme.colors.text.secondary }]}>
                {t('wellbeing.volunteer.history.workDescription', '工作描述')}:
              </Text>
              <Text style={[styles.descriptionText, { color: theme.colors.text.primary }]}>
                {record.remark || t('wellbeing.volunteer.history.noDescription', '暂无描述')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.record.id === nextProps.record.id &&
         prevProps.isDarkMode === nextProps.isDarkMode;
});

export const VolunteerHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<VolunteerHistoryRouteProp>();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

  // Get params from navigation
  const { userId, userName, userPermission = 'staff' } = route.params;

  // State management
  const [selectedDays, setSelectedDays] = useState<1 | 3 | 7 | 30>(7);
  const [records, setRecords] = useState<VolunteerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Refs for memory management
  const loadingRef = useRef(false);

  // Calculate total statistics
  const statistics = useMemo(() => {
    const totalMinutes = records.reduce((sum, record) => {
      if (!record.startTime || !record.endTime) return sum;
      const startDate = timeService.parseServerTime(record.startTime);
      const endDate = timeService.parseServerTime(record.endTime);
      const duration = startDate && endDate ? timeService.calculateDuration(startDate, endDate) : null;
      return sum + (duration?.minutes || 0);
    }, 0);

    return {
      totalHours: Math.floor(totalMinutes / 60),
      totalRecords: records.length
    };
  }, [records]);

  // Load history records
  const loadHistoryRecords = useCallback(async (days: 1 | 3 | 7 | 30) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError('');
      console.log(`🔍 [HISTORY-LOAD] Loading ${userName}'s ${days}-day history`);
      const result = await getVolunteerHistoryRecords(userId, days, userPermission);

      if (result.code === 200 && result.rows) {
        setRecords(result.rows || []);
        console.log(`✅ [HISTORY-LOAD] Successfully loaded ${result.rows?.length || 0} records`);
      } else {
        console.error('❌ [HISTORY-LOAD] Load failed:', result.msg);
        setError(result.msg || t('wellbeing.volunteer.history.loadError'));
      }
    } catch (error) {
      console.error('❌ [HISTORY-LOAD] Network error:', error);
      setError(t('common.network_error'));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [userId, userName, userPermission, t]);

  // Time range options based on permissions
  const timeRangeOptions = useMemo((): TimeRangeOption[] => {
    const baseOptions: TimeRangeOption[] = [
      { days: 1, label: t('wellbeing.volunteer.history.timeRange.1day'), key: '1d' },
      { days: 3, label: t('wellbeing.volunteer.history.timeRange.3days'), key: '3d' },
      { days: 7, label: t('wellbeing.volunteer.history.timeRange.7days'), key: '7d' },
    ];

    if (userPermission === 'manage') {
      baseOptions.push({
        days: 30,
        label: t('wellbeing.volunteer.history.timeRange.30days'),
        key: '30d'
      });
    }

    return baseOptions;
  }, [userPermission, t]);

  // Handle time range selection
  const handleTimeRangeSelect = useCallback((days: 1 | 3 | 7 | 30) => {
    setSelectedDays(days);
    loadHistoryRecords(days);
  }, [loadHistoryRecords]);

  // Load initial data
  useEffect(() => {
    loadHistoryRecords(selectedDays);
  }, []);

  // Component cleanup
  useEffect(() => {
    return () => {
      loadingRef.current = false;
      setRecords([]);
      setError('');
    };
  }, []);

  // Render record item
  const renderRecord = useCallback(({ item }: { item: VolunteerRecord }) => (
    <HistoryRecordItem record={item} isDarkMode={isDarkMode} />
  ), [isDarkMode]);

  // List item separator
  const ItemSeparator = useCallback(() => <View style={{ height: 12 }} />, []);

  // Render empty component
  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-outline"
        size={64}
        color={isDarkMode ? '#8e8e93' : '#8e8e93'}
      />
      <Text style={[styles.emptyText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
        {error || t('wellbeing.volunteer.history.noRecords')}
      </Text>
    </View>
  ), [error, isDarkMode, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#F5F5F5' }]}>
      {/* Header section - Clean iOS style */}
      <View style={[styles.headerSection, { backgroundColor: isDarkMode ? '#1c1c1e' : '#FFFFFF' }]}>
        {/* Navigation bar */}
        <View style={styles.navigationBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={28} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {t('wellbeing.volunteer.history.pageTitle', 'Volunteer History')}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Statistics section - Card style */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2c2c2e' : '#F8F9FA' }]}>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#8E8E93' : '#6B7280' }]}>
              {t('wellbeing.volunteer.history.totalHours', 'TOTAL HOURS')}
            </Text>
            <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
              {statistics.totalHours}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2c2c2e' : '#F8F9FA' }]}>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#8E8E93' : '#6B7280' }]}>
              {t('wellbeing.volunteer.history.totalRecords', 'TOTAL RECORDS')}
            </Text>
            <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
              {statistics.totalRecords}
            </Text>
          </View>
        </View>

        {/* Time range selector */}
        <View style={styles.timeRangeContainer}>
          <View style={styles.timeRangeSelector}>
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.timeRangeButton,
                  {
                    backgroundColor: selectedDays === option.days
                      ? (isDarkMode ? theme.colors.primary : theme.colors.primary)
                      : (isDarkMode ? 'transparent' : 'transparent'),
                    borderColor: selectedDays === option.days
                      ? theme.colors.primary
                      : (isDarkMode ? '#3a3a3c' : '#D1D5DB')
                  }
                ]}
                onPress={() => handleTimeRangeSelect(option.days)}
                disabled={loading}
              >
                <Text style={[
                  styles.timeRangeText,
                  {
                    color: selectedDays === option.days
                      ? '#FFFFFF'
                      : (isDarkMode ? '#8E8E93' : '#6B7280')
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Records list */}
      <View style={styles.recordsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Loading size="small" color={theme.colors.primary} text={t('wellbeing.volunteer.history.loading', 'Loading history...')} />
          </View>
        ) : (
          <FlatList
            data={records}
            renderItem={renderRecord}
            keyExtractor={(item) => `${item.id}-${item.startTime}`}
            ItemSeparatorComponent={ItemSeparator}
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={styles.recordsListContent}
            showsVerticalScrollIndicator={false}
            // Performance optimization
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={8}
            windowSize={10}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header section - Clean iOS style
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },

  // Navigation bar
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 36,
  },

  // Statistics section - Card style
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
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
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
  },

  // Time range selector
  timeRangeContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Records container
  recordsContainer: {
    flex: 1,
    paddingTop: 16,
  },
  recordsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Record item styles
  recordItem: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },

  // Time information
  timeInfo: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 22,
  },
  timeLabel: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  durationLabel: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  durationValueContainer: {
    alignItems: 'flex-end',
  },
  durationValue: {
    fontSize: 16,
  },
  overtimeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  overtimeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 3,
  },

  // Detail expand section
  detailSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailButtonText: {
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 10,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Loading and empty states
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default VolunteerHistoryScreen;
