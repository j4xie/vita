import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Keyboard,
  DeviceEventEmitter,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { i18n } from '../../utils/i18n';

import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { getUserPermissionLevel } from '../../types/userPermissions';
import { performTimeEntry, getPersonalVolunteerRecords } from '../../services/volunteerAPI';
import { timeService } from '../../utils/UnifiedTimeService';
import { SafeAlert } from '../../utils/SafeAlert';
import { LoaderOne } from '../../components/ui/LoaderOne';

export const TimeEntryScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const navigation = useNavigation();

  // 只能补录当前登录用户的工时
  const targetUserId = user?.userId;
  const targetUserName = user?.legalName || user?.userName;

  // 状态管理
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 监听日历选择事件
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'CalendarDateSelected',
      (data: { dateString: string; year: number; month: number; day: number }) => {
        // 使用year/month/day构造本地日期，避免时区问题
        const date = new Date(data.year, data.month - 1, data.day, 0, 0, 0, 0);

        console.log('📅 [TIME-ENTRY] 接收日历选择:', {
          received: data,
          parsed: date.toLocaleDateString(),
          year: data.year,
          month: data.month,
          day: data.day
        });

        setSelectedDate(date);

        // 同步更新已选择的时间到新日期
        if (startTime) {
          const newStartTime = new Date(date);
          newStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
          setStartTime(newStartTime);
        }
        if (endTime) {
          const newEndTime = new Date(date);
          newEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
          setEndTime(newEndTime);
        }
      }
    );

    return () => subscription.remove();
  }, [startTime, endTime]);

  // 成功提交后触发数据刷新事件
  const triggerDataRefresh = () => {
    DeviceEventEmitter.emit('TimeEntrySuccess');
  };

  // 日期时间选择器状态
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // 手动输入模式状态
  const [isManualStartTimeInput, setIsManualStartTimeInput] = useState(false);
  const [isManualEndTimeInput, setIsManualEndTimeInput] = useState(false);

  // 手动输入的文本值
  const [manualStartTimeText, setManualStartTimeText] = useState('');
  const [manualEndTimeText, setManualEndTimeText] = useState('');

  // iOS 选择器临时值
  const [tempStartTime, setTempStartTime] = useState<Date>(new Date());
  const [tempEndTime, setTempEndTime] = useState<Date>(new Date());

  // 关闭页面
  const handleClose = () => {
    if (description.trim() || location.trim() || startTime || endTime) {
      SafeAlert.alert(
        t('common.confirm'),
        t('volunteerTimeEntry.confirmClose'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () => navigation.goBack(),
            style: 'destructive'
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // 开始时间选择处理
  const handleStartTimeConfirm = (time: Date) => {
    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(time.getHours());
    combinedDateTime.setMinutes(time.getMinutes());
    combinedDateTime.setSeconds(0);
    combinedDateTime.setMilliseconds(0);

    const now = new Date();
    const tolerance = 5 * 60 * 1000;
    if (selectedDate.toDateString() === now.toDateString() && combinedDateTime > new Date(now.getTime() + tolerance)) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.futureTime')
      );
      setShowStartTimePicker(false);
      return;
    }

    setStartTime(combinedDateTime);
    setShowStartTimePicker(false);
  };

  // 结束时间选择处理
  const handleEndTimeConfirm = (time: Date) => {
    if (!startTime) {
      SafeAlert.alert(t('common.error'), t('volunteerTimeEntry.errors.selectStartFirst'));
      setShowEndTimePicker(false);
      return;
    }

    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(time.getHours());
    combinedDateTime.setMinutes(time.getMinutes());
    combinedDateTime.setSeconds(0);
    combinedDateTime.setMilliseconds(0);

    if (combinedDateTime <= startTime) {
      SafeAlert.alert(t('common.error'), t('volunteerTimeEntry.errors.endBeforeStart'));
      setShowEndTimePicker(false);
      return;
    }

    const durationHours = (combinedDateTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 12) {
      SafeAlert.alert(t('common.error'), t('volunteerTimeEntry.errors.duration'));
      setShowEndTimePicker(false);
      return;
    }

    setEndTime(combinedDateTime);
    setShowEndTimePicker(false);
  };

  // 检查时间重叠
  const checkTimeOverlap = async (): Promise<boolean> => {
    if (!startTime || !endTime || !targetUserId) return false;

    try {
      const response = await getPersonalVolunteerRecords(Number(targetUserId));
      if (response.code === 200 && response.rows) {
        for (const record of response.rows) {
          if (record.startTime && record.endTime) {
            const recordStart = new Date(record.startTime);
            const recordEnd = new Date(record.endTime);

            const hasOverlap = (startTime >= recordStart && startTime < recordEnd) ||
                              (endTime > recordStart && endTime <= recordEnd) ||
                              (startTime <= recordStart && endTime >= recordEnd);

            if (hasOverlap) {
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error('❌ [OVERLAP-CHECK] 检查时间重叠失败:', error);
      return false;
    }
  };

  // 提交补录
  const handleSubmit = async () => {
    if (!startTime || !endTime) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.requiredFields')
      );
      return;
    }

    if (!location.trim()) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.locationRequired')
      );
      return;
    }

    if (!description.trim()) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.descriptionRequired')
      );
      return;
    }

    if (!targetUserId || !user?.id || !user?.legalName) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.userInfoMissing')
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const hasOverlap = await checkTimeOverlap();
      if (hasOverlap) {
        SafeAlert.alert(
          t('common.error'),
          t('volunteerTimeEntry.errors.overlap')
        );
        setIsSubmitting(false);
        return;
      }

      // 合并location和description，格式: [补录] + location: xxx\ndescription
      const remarkPrefix = t('volunteerTimeEntry.descriptionPrefix');
      const fullRemark = `${remarkPrefix} + location: ${location.trim()}\n${description.trim()}`;

      const result = await performTimeEntry(
        Number(targetUserId),
        Number(user.id),
        user.legalName,
        timeService.formatLocalTime(startTime),
        timeService.formatLocalTime(endTime),
        fullRemark
      );

      if (result.success) {
        const duration = timeService.calculateDuration(startTime, endTime);

        const getApprovalStatusMessage = (): string => {
          const userPermission = getUserPermissionLevel(user);
          const entryStartDate = timeService.parseServerTime(timeService.formatLocalTime(startTime));
          const now = new Date();
          const daysSinceEntry = entryStartDate ?
            (now.getTime() - entryStartDate.getTime()) / (1000 * 60 * 60 * 24) : 999;

          const workDurationHours = duration.minutes / 60;

          const willAutoApprove =
            ['manage', 'part_manage'].includes(userPermission) &&
            daysSinceEntry <= 7 &&
            workDurationHours <= 8;

          if (willAutoApprove) {
            return `\n\n✅ ${t('autoApproval.status.autoApproved')}`;
          } else {
            const reason =
              !['manage', 'part_manage'].includes(userPermission) ? t('volunteerTimeEntry.approvalMessages.staffReviewRequired') :
              daysSinceEntry > 7 ? t('volunteerTimeEntry.approvalMessages.overdueReviewRequired') :
              workDurationHours > 8 ? t('volunteerTimeEntry.approvalMessages.overtimeReviewRequired') : t('volunteerTimeEntry.approvalMessages.generalReviewRequired');

            return `\n\n⏸️ ${t('volunteerTimeEntry.approvalMessages.success')}，${reason}`;
          }
        };

        SafeAlert.alert(
          t('volunteerTimeEntry.success'),
          t('volunteerTimeEntry.successMessage', {
            duration: duration.display
          }) + getApprovalStatusMessage(),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                triggerDataRefresh();
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        SafeAlert.alert(
          t('common.error'),
          result.message || t('volunteerTimeEntry.errors.submitFailed')
        );
      }
    } catch (error) {
      console.error('补录提交失败:', error);
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.submitFailed')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 手动输入验证函数
  const validateTimeInput = (timeText: string): Date | null => {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]?\d)$/;
    if (!timeRegex.test(timeText)) return null;

    const [hours, minutes] = timeText.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);

    return time;
  };

  // 智能时间输入处理
  const handleProtectedTimeInput = (text: string, isStartTime: boolean) => {
    if (!text.includes(':')) {
      text = text.length <= 2 ? text + ':' : text.slice(0, 2) + ':' + text.slice(2);
    }

    const parts = text.split(':');
    let hours = parts[0] || '';
    let minutes = parts[1] || '';

    hours = hours.replace(/\D/g, '').slice(0, 2);
    if (hours.length === 2 && parseInt(hours) > 23) {
      hours = '23';
    }

    minutes = minutes.replace(/\D/g, '').slice(0, 2);
    if (minutes.length === 2 && parseInt(minutes) > 59) {
      minutes = '59';
    }

    const formattedText = hours + ':' + minutes;

    if (isStartTime) {
      setManualStartTimeText(formattedText);
    } else {
      setManualEndTimeText(formattedText);
    }
  };

  // 处理手动时间输入确认
  const handleManualStartTimeConfirm = () => {
    const validTime = validateTimeInput(manualStartTimeText);
    if (!validTime) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.invalidTimeFormat')
      );
      return;
    }

    handleStartTimeConfirm(validTime);
    setIsManualStartTimeInput(false);
    setManualStartTimeText('');
  };

  const handleManualEndTimeConfirm = () => {
    const validTime = validateTimeInput(manualEndTimeText);
    if (!validTime) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.invalidTimeFormat')
      );
      return;
    }

    handleEndTimeConfirm(validTime);
    setIsManualEndTimeInput(false);
    setManualEndTimeText('');
  };

  // 获取最早可选日期（30天前）
  const getMinSelectableDate = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return thirtyDaysAgo;
  };

  // 获取最晚可选日期（今天）
  const getMaxSelectableDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };

  // 格式化日期显示
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('common.today', '今天');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('common.yesterday', '昨天');
    }

    const currentLang = i18n.language;
    const locale = currentLang.startsWith('zh') ? 'zh-CN' : 'en-US';

    return date.toLocaleDateString(locale, {
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  // 格式化时间显示
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 计算时长
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    return timeService.calculateDuration(startTime, endTime);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelText}>{t('timeEntry.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('timeEntry.screenTitle')}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 日期选择卡片 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              const formatDateToString = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };

              (navigation as any).navigate('CalendarSelection', {
                selectedDate: formatDateToString(selectedDate),
                minDate: formatDateToString(getMinSelectableDate()),
                maxDate: formatDateToString(getMaxSelectableDate()),
              });
            }}
          >
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>{t('volunteerTimeEntry.dateLabel')}</Text>
              <Text style={styles.cardValue}>{formatDate(selectedDate)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          {/* 开始时间卡片 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setTempStartTime(startTime || new Date());
              setShowStartTimePicker(true);
            }}
          >
            <Ionicons name="time" size={24} color={theme.colors.primary} />
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>{t('volunteerTimeEntry.startTime')}</Text>
              <Text style={[styles.cardValue, !startTime && styles.cardPlaceholder]}>
                {formatTime(startTime)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 结束时间卡片 */}
          <TouchableOpacity
            style={[styles.card, !startTime && styles.cardDisabled]}
            onPress={() => {
              if (startTime) {
                setTempEndTime(endTime || new Date());
                setShowEndTimePicker(true);
              }
            }}
            disabled={!startTime}
          >
            <Ionicons name="time-outline" size={24} color={!startTime ? '#C7C7CC' : theme.colors.primary} />
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, !startTime && styles.cardDisabledText]}>
                {t('volunteerTimeEntry.endTime')}
              </Text>
              <Text style={[styles.cardValue, !endTime && styles.cardPlaceholder, !startTime && styles.cardDisabledText]}>
                {formatTime(endTime)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 工作地点输入卡片 */}
          <View style={styles.card}>
            <Ionicons name="location" size={24} color={theme.colors.primary} />
            <TextInput
              style={styles.cardInput}
              placeholder={t('volunteerTimeEntry.locationPlaceholder')}
              placeholderTextColor="#C7C7CC"
              value={location}
              onChangeText={setLocation}
              maxLength={50}
            />
          </View>

          {/* 工作说明输入卡片 */}
          <View style={[styles.card, styles.descriptionCard]}>
            <Ionicons name="document-text" size={24} color={theme.colors.primary} style={styles.descriptionIcon} />
            <TextInput
              style={styles.cardInputMultiline}
              placeholder={t('volunteerTimeEntry.descriptionPlaceholder')}
              placeholderTextColor="#C7C7CC"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />
          </View>
        </ScrollView>

        {/* 底部固定提交按钮 */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!startTime || !endTime || !location.trim() || !description.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={(!startTime || !endTime || !location.trim() || !description.trim()) ?
                ['#C7C7CC', '#B0B0B5'] :
                [theme.colors.primary, theme.colors.primaryPressed]
              }
              style={styles.submitButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isSubmitting ? (
                <LoaderOne size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t('volunteerTimeEntry.submit')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 选择器覆盖层 */}
      {(showStartTimePicker || showEndTimePicker) && (
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerBackdrop} onPress={() => {
            setShowStartTimePicker(false);
            setShowEndTimePicker(false);
            setIsManualStartTimeInput(false);
            setIsManualEndTimeInput(false);
          }} />

          <View style={styles.pickerContainer}>
            {/* 选择器顶部操作栏 */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity
                style={styles.pickerAction}
                onPress={() => {
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(false);
                  setIsManualStartTimeInput(false);
                  setIsManualEndTimeInput(false);
                }}
              >
                <Text style={styles.pickerActionText}>
                  {t('volunteerTimeEntry.pickerActions.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.enhancedManualInputButton}
                onPress={() => {
                  if (showStartTimePicker) {
                    setIsManualStartTimeInput(true);
                    setManualStartTimeText(formatTime(startTime || new Date()).replace('--:', ''));
                  } else if (showEndTimePicker) {
                    setIsManualEndTimeInput(true);
                    setManualEndTimeText(formatTime(endTime || new Date()).replace('--:', ''));
                  }
                }}
              >
                <Ionicons name="create" size={16} color="white" />
                <Text style={styles.enhancedManualInputText}>
                  {t('volunteerTimeEntry.manualInput')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerAction}
                onPress={() => {
                  if (showStartTimePicker && !isManualStartTimeInput) {
                    handleStartTimeConfirm(tempStartTime);
                  } else if (showEndTimePicker && !isManualEndTimeInput) {
                    handleEndTimeConfirm(tempEndTime);
                  } else if (isManualStartTimeInput) {
                    handleManualStartTimeConfirm();
                  } else if (isManualEndTimeInput) {
                    handleManualEndTimeConfirm();
                  }
                }}
              >
                <Text style={styles.pickerConfirmText}>
                  {t('volunteerTimeEntry.pickerActions.confirm')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 选择器内容区域 */}
            <View style={styles.pickerContent}>
              {(isManualStartTimeInput || isManualEndTimeInput) ? (
                <View style={styles.manualInputContainer}>
                  <View style={styles.manualInputHeader}>
                    <Ionicons
                      name="create-outline"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.manualInputTitle}>
                      {t('volunteerTimeEntry.timeFormat')}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.protectedTimeInput}
                    value={isManualStartTimeInput ? manualStartTimeText : manualEndTimeText}
                    onChangeText={(text) => {
                      handleProtectedTimeInput(text, isManualStartTimeInput);
                    }}
                    placeholder={t('volunteerTimeEntry.timeInputPlaceholder')}
                    placeholderTextColor={theme.colors.text.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={true}
                    keyboardType="number-pad"
                    maxLength={5}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />

                  {/* 完成按钮 - 主操作 */}
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => {
                      Keyboard.dismiss();
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.doneButtonText}>
                      {t('common.done', '完成')}
                    </Text>
                  </TouchableOpacity>

                  {/* 返回选择器按钮 - 次要操作 */}
                  <TouchableOpacity
                    style={styles.backToSelectorButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setIsManualStartTimeInput(false);
                      setIsManualEndTimeInput(false);
                    }}
                  >
                    <Ionicons name="arrow-back" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.backToSelectorText}>
                      {t('volunteerTimeEntry.backToSelector')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={tempStartTime}
                      mode="time"
                      display="spinner"
                      onChange={(_, time) => {
                        if (time) setTempStartTime(time);
                      }}
                      is24Hour={true}
                      style={styles.picker}
                    />
                  )}

                  {showEndTimePicker && (
                    <View style={styles.simpleTimePickerContainer}>
                      <Text style={styles.timePickerTitle}>
                        {t('volunteerTimeEntry.selectEndTimeTitle')}
                      </Text>
                      <DateTimePicker
                        value={tempEndTime}
                        mode="time"
                        display="spinner"
                        onChange={(_, time) => {
                          if (time) setTempEndTime(time);
                        }}
                        is24Hour={true}
                        style={styles.picker}
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 17,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 60,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  // Luma风格卡片基础样式
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  cardPlaceholder: {
    color: '#C7C7CC',
  },
  cardDisabledText: {
    color: '#C7C7CC',
  },
  cardInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  descriptionCard: {
    alignItems: 'flex-start',
    minHeight: 120,
  },
  descriptionIcon: {
    marginTop: 2,
  },
  cardInputMultiline: {
    flex: 1,
    marginLeft: 12,
    fontSize: 17,
    fontWeight: '400',
    color: '#1C1C1E',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 选择器覆盖层样式
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
    backgroundColor: 'rgba(248, 250, 255, 0.95)',
  },
  pickerAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerActionText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  pickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  enhancedManualInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    gap: 6,
  },
  enhancedManualInputText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  pickerContent: {
    backgroundColor: 'white',
    minHeight: 200,
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 0,
  },
  // 手动输入样式
  manualInputContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  manualInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  manualInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  protectedTimeInput: {
    width: '70%',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.text.primary,
    marginBottom: 16,
    backgroundColor: 'rgba(248, 250, 255, 0.5)',
    letterSpacing: 4,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    minWidth: 140,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backToSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    gap: 6,
  },
  backToSelectorText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  simpleTimePickerContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
  },
});
