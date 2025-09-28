import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { i18n } from '../../utils/i18n';

import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { performTimeEntry, getPersonalVolunteerRecords } from '../../services/volunteerAPI';
import { timeService } from '../../utils/UnifiedTimeService';
import { SafeAlert } from '../../utils/SafeAlert';

interface VolunteerTimeEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VolunteerTimeEntryModal: React.FC<VolunteerTimeEntryModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useUser();

  // 只能补录当前登录用户的工时
  const targetUserId = user?.userId;
  const targetUserName = user?.legalName || user?.userName;

  // 状态管理
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 日期时间选择器状态
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // 手动输入模式状态
  const [isManualDateInput, setIsManualDateInput] = useState(false);
  const [isManualStartTimeInput, setIsManualStartTimeInput] = useState(false);
  const [isManualEndTimeInput, setIsManualEndTimeInput] = useState(false);

  // 手动输入的文本值
  const [manualDateText, setManualDateText] = useState('');
  const [manualStartTimeText, setManualStartTimeText] = useState('');
  const [manualEndTimeText, setManualEndTimeText] = useState('');

  // iOS 选择器临时值
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempStartTime, setTempStartTime] = useState<Date>(new Date());
  const [tempEndTime, setTempEndTime] = useState<Date>(new Date());

  // 重置表单
  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime(null);
    setEndTime(null);
    setDescription('');
  };

  // 关闭模态框
  const handleClose = () => {
    if (description.trim() || startTime || endTime) {
      SafeAlert.alert(
        t('common.confirm'),
        t('volunteerTimeEntry.confirmClose'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () => {
              resetForm();
              onClose();
            },
            style: 'destructive'
          }
        ]
      );
    } else {
      resetForm();
      onClose();
    }
  };

  // 日期选择处理
  const handleDateConfirm = (date: Date) => {
    // 验证日期范围（过去7天至今天）
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    if (date > today) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.futureDate')
      );
      setShowDatePicker(false);
      return;
    }

    if (date < sevenDaysAgo) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.dateRange')
      );
      setShowDatePicker(false);
      return;
    }

    setSelectedDate(date);

    // 同步更新已选择的时间到新日期
    if (startTime) {
      const newStartTime = new Date(date);
      newStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      setStartTime(newStartTime);
      console.log('🔄 [DATE-SYNC] 同步开始时间到新日期:', newStartTime.toISOString());
    }

    if (endTime) {
      const newEndTime = new Date(date);
      newEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      setEndTime(newEndTime);
      console.log('🔄 [DATE-SYNC] 同步结束时间到新日期:', newEndTime.toISOString());
    }

    setShowDatePicker(false);
  };

  // 开始时间选择处理
  const handleStartTimeConfirm = (time: Date) => {
    // 将选择的时间应用到选定日期
    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(time.getHours());
    combinedDateTime.setMinutes(time.getMinutes());
    combinedDateTime.setSeconds(0);
    combinedDateTime.setMilliseconds(0);

    // 如果是今天，允许稍微未来的时间（5分钟容差）
    const now = new Date();
    const tolerance = 5 * 60 * 1000; // 5分钟容差
    if (selectedDate.toDateString() === now.toDateString() && combinedDateTime > new Date(now.getTime() + tolerance)) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.futureTime')
      );
      setShowStartTimePicker(false);
      return;
    }

    console.log('🕐 [DEBUG] 开始时间验证:', {
      selectedDate: selectedDate.toISOString(),
      time: time.toISOString(),
      combinedDateTime: combinedDateTime.toISOString(),
      now: now.toISOString(),
      isToday: selectedDate.toDateString() === now.toDateString(),
      timeDiff: combinedDateTime.getTime() - now.getTime()
    });

    setStartTime(combinedDateTime);
    setShowStartTimePicker(false);
  };

  // 结束时间选择处理（简化版，基本验证）
  const handleEndTimeConfirm = (time: Date) => {
    if (!startTime) {
      SafeAlert.alert(t('common.error'), t('volunteerTimeEntry.errors.selectStartFirst'));
      setShowEndTimePicker(false);
      return;
    }

    // 将选择的时间应用到选定日期
    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(time.getHours());
    combinedDateTime.setMinutes(time.getMinutes());
    combinedDateTime.setSeconds(0);
    combinedDateTime.setMilliseconds(0);

    // 基本验证：结束时间必须晚于开始时间
    if (combinedDateTime <= startTime) {
      SafeAlert.alert(t('common.error'), t('volunteerTimeEntry.errors.endBeforeStart'));
      setShowEndTimePicker(false);
      return;
    }

    // 基本验证：不超过12小时
    const durationHours = (combinedDateTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 12) {
      SafeAlert.alert(t('common.error'), t('volunteerTimeEntry.errors.duration'));
      setShowEndTimePicker(false);
      return;
    }

    console.log('🕐 [DEBUG] 设置结束时间:', {
      selectedTime: combinedDateTime.toISOString(),
      startTime: startTime.toISOString(),
      durationMinutes: (combinedDateTime.getTime() - startTime.getTime()) / (1000 * 60)
    });

    setEndTime(combinedDateTime);
    setShowEndTimePicker(false);
  };

  // 检查时间重叠
  const checkTimeOverlap = async (): Promise<boolean> => {
    if (!startTime || !endTime || !targetUserId) return false;

    try {
      console.log('🔍 [OVERLAP-CHECK] 开始检查时间重叠:', {
        newStartTime: startTime.toISOString(),
        newEndTime: endTime.toISOString(),
        selectedDate: selectedDate.toISOString(),
        userId: targetUserId
      });

      // 获取用户7天内的记录
      const response = await getPersonalVolunteerRecords(targetUserId);
      if (response.code === 200 && response.rows) {
        console.log('🔍 [OVERLAP-CHECK] 获取到历史记录:', response.rows.length, '条');

        // 检查是否有时间重叠
        for (const record of response.rows) {
          if (record.startTime && record.endTime) {
            const recordStart = new Date(record.startTime);
            const recordEnd = new Date(record.endTime);

            console.log('🔍 [OVERLAP-CHECK] 检查记录:', {
              recordId: record.id,
              recordStart: recordStart.toISOString(),
              recordEnd: recordEnd.toISOString(),
              recordStartTime: recordStart.toTimeString(),
              recordEndTime: recordEnd.toTimeString()
            });

            // 检查重叠：新记录的开始或结束时间在现有记录范围内
            const hasOverlap = (startTime >= recordStart && startTime < recordEnd) ||
                              (endTime > recordStart && endTime <= recordEnd) ||
                              (startTime <= recordStart && endTime >= recordEnd);

            if (hasOverlap) {
              console.log('❌ [OVERLAP-CHECK] 发现重叠:', {
                conflict: '时间段重叠',
                existingRecord: `${recordStart.toLocaleString()} - ${recordEnd.toLocaleString()}`,
                newRecord: `${startTime.toLocaleString()} - ${endTime.toLocaleString()}`
              });
              return true; // 有重叠
            }
          }
        }
      }

      console.log('✅ [OVERLAP-CHECK] 无重叠，可以补录');
      return false; // 无重叠
    } catch (error) {
      console.error('❌ [OVERLAP-CHECK] 检查时间重叠失败:', error);
      return false; // 出错时允许继续
    }
  };

  // 提交补录
  const handleSubmit = async () => {
    // 验证必填项
    if (!startTime || !endTime) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.requiredFields')
      );
      return;
    }

    // 验证描述必填
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
      // 检查时间重叠
      const hasOverlap = await checkTimeOverlap();
      if (hasOverlap) {
        SafeAlert.alert(
          t('common.error'),
          t('volunteerTimeEntry.errors.overlap')
        );
        setIsSubmitting(false);
        return;
      }

      // 准备补录说明（添加【补录】前缀）
      const remarkPrefix = t('volunteerTimeEntry.descriptionPrefix');
      const fullRemark = description.trim()
        ? `${remarkPrefix}${description.trim()}`
        : remarkPrefix;

      // 调用补录API
      const result = await performTimeEntry(
        targetUserId,
        user.id, // operateUserId
        user.legalName, // operateLegalName
        timeService.formatLocalTime(startTime),
        timeService.formatLocalTime(endTime),
        fullRemark
      );

      if (result.success) {
        // 计算时长用于显示
        const duration = timeService.calculateDuration(startTime, endTime);

        SafeAlert.alert(
          t('volunteerTimeEntry.success'),
          t('volunteerTimeEntry.successMessage', {
            duration: duration.display
          }),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                resetForm();
                onSuccess();
                onClose();
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
  const validateDateInput = (dateText: string): Date | null => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateText)) return null;

    const date = new Date(dateText + 'T00:00:00');
    if (isNaN(date.getTime())) return null;

    // 验证日期范围
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    if (date > today || date < sevenDaysAgo) return null;

    return date;
  };

  const validateTimeInput = (timeText: string): Date | null => {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]?\d)$/;
    if (!timeRegex.test(timeText)) return null;

    const [hours, minutes] = timeText.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);

    return time;
  };

  // 智能时间输入处理（保护冒号）
  const handleProtectedTimeInput = (text: string, isStartTime: boolean) => {
    // 确保冒号始终存在
    if (!text.includes(':')) {
      text = text.length <= 2 ? text + ':' : text.slice(0, 2) + ':' + text.slice(2);
    }

    // 分离小时和分钟部分
    const parts = text.split(':');
    let hours = parts[0] || '';
    let minutes = parts[1] || '';

    // 限制小时部分（00-23）
    hours = hours.replace(/\D/g, '').slice(0, 2);
    if (hours.length === 2 && parseInt(hours) > 23) {
      hours = '23';
    }

    // 限制分钟部分（00-59）
    minutes = minutes.replace(/\D/g, '').slice(0, 2);
    if (minutes.length === 2 && parseInt(minutes) > 59) {
      minutes = '59';
    }

    // 重新组合为 HH:MM 格式
    const formattedText = hours + ':' + minutes;

    // 更新对应的状态
    if (isStartTime) {
      setManualStartTimeText(formattedText);
    } else {
      setManualEndTimeText(formattedText);
    }
  };

  // 处理手动日期输入确认
  const handleManualDateConfirm = () => {
    const validDate = validateDateInput(manualDateText);
    if (!validDate) {
      SafeAlert.alert(
        t('common.error'),
        t('volunteerTimeEntry.errors.invalidDateFormat')
      );
      return;
    }

    handleDateConfirm(validDate);
    setIsManualDateInput(false);
    setManualDateText('');
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

  // 生成可选的7天日期列表
  const getSelectableDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }

    return dates;
  };

  // 生成可选的结束时间列表（基于开始时间）
  const getSelectableEndTimes = () => {
    if (!startTime) return [];

    const endTimes = [];
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    // 计算一天中的结束范围
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    // 计算最大结束时间（开始时间+12小时 或 当天结束 或 当前时间+5分钟，取最小值）
    const maxEndTime = new Date(Math.min(
      startTime.getTime() + 12 * 60 * 60 * 1000, // 12小时后
      dayEnd.getTime(), // 当天结束
      isToday ? now.getTime() + 5 * 60 * 1000 : dayEnd.getTime() // 如果是今天，当前时间+5分钟
    ));

    // 从开始时间后1分钟开始，每5分钟一个选项
    const startMillis = startTime.getTime() + 60 * 1000; // +1分钟
    const endMillis = maxEndTime.getTime();

    for (let time = startMillis; time <= endMillis; time += 5 * 60 * 1000) { // 每5分钟
      endTimes.push(new Date(time));
    }

    console.log('🕐 [DEBUG] 生成结束时间列表:', {
      startTime: startTime.toISOString(),
      maxEndTime: maxEndTime.toISOString(),
      isToday,
      count: endTimes.length,
      firstOption: endTimes[0]?.toISOString(),
      lastOption: endTimes[endTimes.length - 1]?.toISOString()
    });

    return endTimes;
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

    // 根据当前语言动态选择格式
    const currentLang = i18n.language;
    const locale = currentLang.startsWith('zh') ? 'zh-CN' : 'en-US';

    return date.toLocaleDateString(locale, {
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  // 格式化日期选择器中的显示
  const formatDateForPicker = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('common.today', '今天');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('common.yesterday', '昨天');
    }

    // 根据当前语言动态选择格式
    const currentLang = i18n.language;
    const locale = currentLang.startsWith('zh') ? 'zh-CN' : 'en-US';

    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
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

  const duration = calculateDuration();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.modalContainer}
          >
            <BlurView intensity={95} tint="light" style={styles.blurContainer}>
              <View style={styles.modalContent}>
                {/* 头部 */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                  <Text style={styles.title}>{t('volunteerTimeEntry.title')}</Text>
                  <View style={styles.placeholder} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
                  {/* 用户信息 */}
                  <View style={styles.userInfo}>
                    <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
                    <Text style={styles.userName}>{targetUserName}</Text>
                  </View>

                  {/* 日期选择 */}
                  <View style={styles.section}>
                    <Text style={styles.label}>{t('volunteerTimeEntry.dateLabel')}</Text>
                    <Text style={styles.hint}>{t('volunteerTimeEntry.dateRangeHint')}</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        setTempDate(selectedDate);
                        setIsManualDateInput(false);
                        setShowDatePicker(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                      <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                      <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  {/* 时间选择 */}
                  <View style={styles.timeSection}>
                    <View style={styles.timeField}>
                      <Text style={styles.label}>{t('volunteerTimeEntry.startTime')}</Text>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => {
                          setTempStartTime(startTime || new Date());
                          setShowStartTimePicker(true);
                        }}
                      >
                        <Text style={[
                          styles.timeText,
                          !startTime && styles.placeholderText
                        ]}>
                          {formatTime(startTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.timeSeparator}>
                      <Ionicons name="arrow-forward" size={20} color={theme.colors.text.tertiary} />
                    </View>

                    <View style={styles.timeField}>
                      <Text style={styles.label}>{t('volunteerTimeEntry.endTime')}</Text>
                      <TouchableOpacity
                        style={[
                          styles.timeButton,
                          !startTime && styles.disabledButton
                        ]}
                        onPress={() => {
                          if (startTime) {
                            setTempEndTime(endTime || new Date());
                            setShowEndTimePicker(true);
                          }
                        }}
                        disabled={!startTime}
                      >
                        <Text style={[
                          styles.timeText,
                          !endTime && styles.placeholderText
                        ]}>
                          {formatTime(endTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 实时时长计算显示 */}
                  {startTime && endTime && (
                    <View style={styles.durationHighlight}>
                      <View style={styles.durationIcon}>
                        <Ionicons name="timer" size={20} color="white" />
                      </View>
                      <View style={styles.durationInfo}>
                        <Text style={styles.durationLabel}>
                          {t('volunteerTimeEntry.workDuration')}
                        </Text>
                        <Text style={styles.durationValue}>
                          {(() => {
                            const calc = calculateDuration();
                            return calc ? calc.display : t('common.loading', '计算中...');
                          })()}
                        </Text>
                      </View>
                      <View style={styles.durationCheck}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      </View>
                    </View>
                  )}

                  {/* 工作说明 - 必填 */}
                  <View style={styles.section}>
                    <View style={styles.labelContainer}>
                      <Text style={styles.label}>{t('volunteerTimeEntry.description')}</Text>
                      <Text style={styles.requiredMark}>*</Text>
                    </View>
                    <View style={styles.inputContainer}>
                      <View style={styles.prefixContainer}>
                        <Text style={styles.prefixText}>
                          {t('volunteerTimeEntry.descriptionPrefix')}
                        </Text>
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('volunteerTimeEntry.descriptionPlaceholder')}
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        maxLength={100}
                      />
                    </View>
                    <Text style={styles.charCount}>
                      {description.length}/100
                    </Text>
                  </View>

                  {/* 提交按钮 */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!startTime || !endTime || !description.trim() || isSubmitting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={(!startTime || !endTime || !description.trim()) ?
                        ['#C7C7CC', '#B0B0B5'] :
                        [theme.colors.primary, theme.colors.primaryDark || theme.colors.primary]
                      }
                      style={styles.submitButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {t('volunteerTimeEntry.submit')}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* 选择器覆盖层 */}
        {(showDatePicker || showStartTimePicker || showEndTimePicker) && (
          <View style={styles.pickerOverlay}>
            <Pressable style={styles.pickerBackdrop} onPress={() => {
              setShowDatePicker(false);
              setShowStartTimePicker(false);
              setShowEndTimePicker(false);
              setIsManualDateInput(false);
              setIsManualStartTimeInput(false);
              setIsManualEndTimeInput(false);
            }} />

            <View style={styles.pickerContainer}>
              {/* 选择器顶部操作栏 */}
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  style={styles.pickerAction}
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowStartTimePicker(false);
                    setShowEndTimePicker(false);
                    setIsManualDateInput(false);
                    setIsManualStartTimeInput(false);
                    setIsManualEndTimeInput(false);
                  }}
                >
                  <Text style={styles.pickerActionText}>
                    {t('volunteerTimeEntry.pickerActions.cancel')}
                  </Text>
                </TouchableOpacity>

                {/* 只在时间选择器时显示Manual Input按钮 */}
                {(showStartTimePicker || showEndTimePicker) && (
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
                )}

                <TouchableOpacity
                  style={styles.pickerAction}
                  onPress={() => {
                    if (showDatePicker && !isManualDateInput) {
                      handleDateConfirm(tempDate);
                    } else if (showStartTimePicker && !isManualStartTimeInput) {
                      handleStartTimeConfirm(tempStartTime);
                    } else if (showEndTimePicker && !isManualEndTimeInput) {
                      // 对于自定义结束时间选择器，直接使用选中的时间
                      handleEndTimeConfirm(tempEndTime);
                    } else if (isManualDateInput) {
                      handleManualDateConfirm();
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
                {/* 手动输入模式 */}
                {(isManualDateInput || isManualStartTimeInput || isManualEndTimeInput) ? (
                  <View style={styles.manualInputContainer}>
                    <View style={styles.manualInputHeader}>
                      <Ionicons
                        name="create-outline"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.manualInputTitle}>
                        {isManualDateInput ? t('volunteerTimeEntry.dateFormat') :
                         t('volunteerTimeEntry.timeFormat')}
                      </Text>
                    </View>
                    {/* 智能时间输入组件 */}
                    {isManualStartTimeInput || isManualEndTimeInput ? (
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
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    ) : (
                      /* 日期输入（保持原样） */
                      <TextInput
                        style={styles.manualInput}
                        value={manualDateText}
                        onChangeText={setManualDateText}
                        placeholder={t('volunteerTimeEntry.dateInputPlaceholder')}
                        placeholderTextColor={theme.colors.text.tertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus={true}
                      />
                    )}
                    <TouchableOpacity
                      style={styles.backToSelectorButton}
                      onPress={() => {
                        setIsManualDateInput(false);
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
                  /* 选择器模式 */
                  <>
                    {/* 自定义7天日期选择器 - 两列布局 */}
                    {showDatePicker && (
                      <View style={styles.customDatePicker}>
                        <Text style={styles.datePickerTitle}>
                          {t('volunteerTimeEntry.selectDateTitle', '选择补录日期')}
                        </Text>
                        <View style={styles.dateGrid}>
                          {getSelectableDates().map((date, index) => {
                            const isSelected = date.toDateString() === tempDate.toDateString();
                            return (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.dateGridItem,
                                  isSelected && styles.dateGridItemSelected
                                ]}
                                onPress={() => setTempDate(date)}
                              >
                                <Text style={[
                                  styles.dateGridText,
                                  isSelected && styles.dateGridTextSelected
                                ]}>
                                  {formatDateForPicker(date)}
                                </Text>
                                <Text style={[
                                  styles.dateGridDate,
                                  isSelected && styles.dateGridDateSelected
                                ]}>
                                  {date.toLocaleDateString('zh-CN', {
                                    month: '2-digit',
                                    day: '2-digit'
                                  })}
                                </Text>
                                {isSelected && (
                                  <View style={styles.selectedIndicator}>
                                    <Ionicons name="checkmark" size={16} color="white" />
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* 开始时间选择器 */}
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={tempStartTime}
                        mode="time"
                        display="spinner"
                        onChange={(event, time) => {
                          if (time) setTempStartTime(time);
                        }}
                        is24Hour={true}
                        style={styles.picker}
                      />
                    )}

                    {/* 结束时间选择器 - 简单滑动选择 */}
                    {showEndTimePicker && (
                      <View style={styles.simpleTimePickerContainer}>
                        <Text style={styles.timePickerTitle}>
                          {t('volunteerTimeEntry.selectEndTimeTitle')}
                        </Text>
                        <DateTimePicker
                          value={tempEndTime}
                          mode="time"
                          display="spinner"
                          onChange={(event, time) => {
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  blurContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  timeField: {
    flex: 1,
  },
  timeSeparator: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  timeButton: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  placeholderText: {
    color: theme.colors.text.tertiary,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  durationText: {
    fontSize: 14,
    color: theme.colors.success,
    marginLeft: 6,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    overflow: 'hidden',
  },
  prefixContainer: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  textInput: {
    padding: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 提示文字样式
  hint: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  // 必填标记容器
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requiredMark: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '600',
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
    maxHeight: '65%',
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
  // 增强的Manual Input按钮
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
  // 实时时长显示样式
  durationHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  durationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  durationInfo: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 2,
  },
  durationValue: {
    fontSize: 18,
    color: '#047857',
    fontWeight: '700',
  },
  durationCheck: {
    marginLeft: 8,
  },
  pickerContent: {
    backgroundColor: 'white',
    minHeight: 200,
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 0,
  },
  // 自定义日期选择器样式 - 两列网格
  customDatePicker: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateGridItem: {
    width: '48%',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  dateGridItemSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateGridText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  dateGridTextSelected: {
    color: 'white',
  },
  dateGridDate: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  dateGridDateSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  manualInput: {
    width: '85%',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.text.primary,
    marginBottom: 20,
    backgroundColor: 'rgba(248, 250, 255, 0.5)',
  },
  backToSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // 保护时间输入样式
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
    marginBottom: 20,
    backgroundColor: 'rgba(248, 250, 255, 0.5)',
    letterSpacing: 4,
  },
  // 自定义时间选择器样式
  customTimePicker: {
    backgroundColor: 'white',
    paddingVertical: 16,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  timeList: {
    maxHeight: 200,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.background.secondary,
  },
  timeItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  timeItemContent: {
    flex: 1,
  },
  timeItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  timeItemTextSelected: {
    color: 'white',
  },
  timeItemDuration: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  timeItemDurationSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // 简化的时间选择器样式
  simpleTimePickerContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
  },
});