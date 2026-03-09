import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  InputAccessoryView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { Glass } from '../../ui/glass/GlassTheme';
import { useUser } from '../../context/UserContext';
import { useVolunteerContext } from '../../context/VolunteerContext';
import { performVolunteerCheckOut } from '../../services/volunteerAPI';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { timeService } from '../../utils/UnifiedTimeService';
import { apiCache } from '../../services/apiCache';
import { LoaderOne } from '../../components/ui/LoaderOne';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 志愿者记录类型定义
interface VolunteerRecord {
  userId?: string | number;
  name: string;
  school: string;
  checkInTime: any;
  status: 'checked_in';
}

interface QuickOption {
  id: number;
  label: string;
  text: string;
}

interface RouteParams {
  volunteer: VolunteerRecord;
}

export const VolunteerCheckOutScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user: currentUser } = useUser();
  const volunteerContext = useVolunteerContext();
  const darkModeSystem = useAllDarkModeStyles();

  // 🔍 调试翻译系统
  useEffect(() => {
    console.log('🔍 [TRANSLATION-DEBUG] 翻译系统详细状态:', {
      currentLanguage: i18n.language,
      titleTranslation: t('volunteerCheckIn.checkoutTitle', 'TITLE_FALLBACK'),
      timeStatisticsTranslation: t('volunteerCheckIn.timeStatistics', 'STATS_FALLBACK'),
      checkInTimeTranslation: t('volunteerCheckIn.time.checkInTime', 'CHECKIN_FALLBACK'),

      // 测试其他已知有效的翻译键
      commonCancel: t('common.cancel', 'CANCEL_FALLBACK'),
      commonConfirm: t('common.confirm', 'CONFIRM_FALLBACK'),

      // 检查翻译数据结构
      hasVolunteerSection: !!i18n.store?.data?.[i18n.language]?.volunteer,
      hasCheckoutKeys: !!i18n.store?.data?.[i18n.language]?.volunteerCheckIn?.checkoutTitle,

      // 直接检查原始数据
      rawVolunteerData: i18n.store?.data?.[i18n.language]?.volunteerCheckIn ?
        Object.keys(i18n.store.data[i18n.language].volunteerCheckIn) : 'NO_VOLUNTEERID_SECTION'
    });
  }, [t, i18n.language]);
  const { isDarkMode, styles: dmStyles } = darkModeSystem;

  const { volunteer } = route.params as RouteParams;

  // 状态管理
  const [description, setDescription] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 调试: 监控description变化
  useEffect(() => {
    console.log('📝 [DEBUG] description状态变化:', description);
  }, [description]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // 键盘工具栏ID (iOS)
  const inputAccessoryViewID = 'volunteer-checkout-input';

  // 动画值
  const buttonScale = useSharedValue(1);
  const cardScale = useSharedValue(0.95);

  // 快捷选项配置 - 支持国际化
  const quickOptions: QuickOption[] = [
    {
      id: 1,
      label: t('wellbeing.volunteer.signOut.quickOptions.departmentActivity', '分部活动'),
      text: t('wellbeing.volunteer.signOut.quickOptions.departmentActivity', '分部活动组织与协调')
    },
    {
      id: 2,
      label: t('wellbeing.volunteer.signOut.quickOptions.airportPickup', '接机活动'),
      text: t('wellbeing.volunteer.signOut.quickOptions.airportPickup', '机场接机志愿服务')
    },
    {
      id: 3,
      label: t('wellbeing.volunteer.signOut.quickOptions.departmentBooth', '分部摆摊'),
      text: t('wellbeing.volunteer.signOut.quickOptions.departmentBooth', '分部宣传摆摊活动')
    },
    {
      id: 4,
      label: t('wellbeing.volunteer.signOut.quickOptions.meetAndGreet', '见面会'),
      text: t('wellbeing.volunteer.signOut.quickOptions.meetAndGreet', '新生见面会活动支持')
    }
  ];

  // 动画样式
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(cardScale.value, { damping: 20 }) }]
  }));

  useEffect(() => {
    // 页面加载动画
    cardScale.value = withSpring(1, { damping: 15 });

    // 键盘监听
    const keyboardWillShowSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowSub.remove();
      keyboardWillHideSub.remove();
    };
  }, []);

  // 处理键盘收起
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
  }, []);

  // 计算工作时长
  const calculateWorkDuration = useCallback(() => {
    // 🔍 调试：检查接收到的签到时间
    console.log('🔍 [CHECKOUT-DEBUG] ========== 签退页面数据调试 ==========');
    console.log('🔍 [CHECKOUT-DEBUG] 完整volunteer对象:', volunteer);
    console.log('🔍 [CHECKOUT-DEBUG] volunteer.checkInTime:', volunteer.checkInTime);
    console.log('🔍 [CHECKOUT-DEBUG] checkInTime类型:', typeof volunteer.checkInTime);
    console.log('🔍 [CHECKOUT-DEBUG] volunteer.userId:', volunteer.userId);
    console.log('🔍 [CHECKOUT-DEBUG] volunteer.name:', volunteer.name);
    console.log('🔍 [CHECKOUT-DEBUG] 当前时间:', new Date().toString());
    console.log('🔍 [CHECKOUT-DEBUG] ================================================');

    if (!volunteer.checkInTime) return { hours: 0, minutes: 0, display: t('common.time.zeroHoursMinutes', '0小时0分钟'), hasError: false, errorMessage: '' };

    // 🆕 使用统一时间服务进行时间解析
    try {
      const startTime = timeService.parseServerTime(volunteer.checkInTime);
      const endTime = new Date();

      console.log('🕐 [签退页面] 开始时间(UnifiedTimeService):', startTime?.toISOString());
      console.log('🕐 [签退页面] 结束时间(当前):', endTime.toISOString());

      if (!startTime || isNaN(startTime.getTime())) {
        return { hours: 0, minutes: 0, display: t('common.time.parseError'), hasError: true, errorMessage: t('volunteer.checkout.checkInTimeAbnormal', '签到时间记录异常') };
      }

      // 计算时间差（分钟）
      const diffMs = endTime.getTime() - startTime.getTime();
      const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // 简单的时长显示
      let display = '';
      if (hours > 0) {
        display = minutes > 0 ? t('common.time.hoursAndMinutes', { hours, minutes }) : t('common.time.hours', { hours });
      } else if (minutes > 0) {
        display = t('common.time.minutes', { minutes });
      } else {
        display = t('common.time.lessThanOneMinute');
      }

      console.log('🕐 [签退页面] 计算结果:', { totalMinutes, hours, minutes, display });

      const duration = { minutes: totalMinutes, display, isValid: true };

      // 返回计算结果
      return {
        hours,
        minutes: minutes,
        display,
        hasError: false,
        errorMessage: ''
      };
    } catch (error) {
      console.error('工作时长计算失败:', error);
      return { hours: 0, minutes: 0, display: t('volunteer.checkout.calculationError', '计算错误'), hasError: true, errorMessage: t('volunteer.checkout.durationCalculationFailed', '时长计算失败') };
    }
  }, [volunteer.checkInTime]);

  const workDuration = calculateWorkDuration();

  // 格式化时间显示 - 将后端时间转换为本地时间显示
  const formatTime = (dateString?: string) => {
    // 🔍 调试：检查格式化的输入
    console.log('🕐 [formatTime] 输入dateString:', dateString);

    if (!dateString) return '--:--';

    // 使用新的统一时间服务
    const parsedDate = timeService.parseServerTime(dateString);
    console.log('🕐 [formatTime] 解析后Date对象:', parsedDate);
    console.log('🕐 [formatTime] UTC时间:', parsedDate?.toUTCString());

    if (!parsedDate) return '--:--';

    // formatForDisplay默认只显示时间，会自动转换为本地时间
    const result = timeService.formatForDisplay(parsedDate, { showDate: false, showTime: true });
    console.log('🕐 [formatTime] 最终显示:', result);
    return result;
  };

  // 处理快捷选择
  const handleQuickSelect = useCallback((text: string) => {
    if (description.trim() === '') {
      setDescription(text);
    } else {
      // 如果已有内容，在后面追加
      if (description.endsWith('，') || description.endsWith(',')) {
        setDescription(description + text);
      } else {
        setDescription(description + '，' + text);
      }
    }

    // 聚焦输入框
    textInputRef.current?.focus();

    // iOS触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  }, [description]);

  // 处理取消
  const handleCancel = useCallback(() => {
    if (description.trim()) {
      Alert.alert(
        t('common.confirm'),
        t('volunteer.checkout.confirmDiscard', '确定要放弃当前输入的内容吗？'),
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
  }, [description, navigation, t]);

  // 处理提交
  const handleSubmit = useCallback(async () => {
    // 先检查描述是否为空
    console.log('🔍 [DEBUG] 描述值检查:', {
      description,
      trimmed: description.trim(),
      length: description.length,
      isEmpty: !description.trim()
    });

    if (!description.trim()) {
      console.log('❌ [DEBUG] 描述为空，显示提示');
      Alert.alert(t('common.hint', '提示'), t('volunteer.checkout.workDescriptionRequired', '请输入工作内容描述'));
      return; // 直接返回，不设置isSubmitting，因为还没开始提交
    }

    // 检查时间异常
    if (workDuration.hasError) {
      Alert.alert(
        t('volunteer.checkout.timeAbnormal', '时间异常'),
        workDuration.errorMessage || t('volunteer.checkout.timeAbnormalMessage', '签到时间记录异常，无法完成签退'),
        [
          {
            text: t('common.back', '返回'),
            onPress: () => navigation.goBack(),
            style: 'cancel'
          },
          {
            text: t('volunteer.checkout.contactAdmin', '联系管理员'),
            onPress: () => {
              Alert.alert(t('common.hint', '提示'), t('volunteer.checkout.contactAdminMessage', '请联系管理员处理时间异常问题'));
            }
          }
        ]
      );
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      const operateUserIdRaw = currentUser?.userId;
      const operateLegalName = currentUser?.legalName;

      if (!operateUserIdRaw || !operateLegalName) {
        Alert.alert(t('common.error'), t('volunteer.checkout.cannotGetOperatorInfo', '无法获取操作用户信息'));
        setIsSubmitting(false);
        return;
      }

      const userId = typeof volunteer.userId === 'string' ? parseInt(volunteer.userId) : (volunteer.userId || 0);
      if (!userId || userId <= 0) {
        Alert.alert(t('common.error'), t('volunteer.checkout.invalidUserId', 'Invalid user ID'));
        setIsSubmitting(false);
        return;
      }
      const operateUserId = typeof operateUserIdRaw === 'string' ? parseInt(operateUserIdRaw) : operateUserIdRaw;

      console.log('📤 [DEBUG] 提交签退参数:', {
        userId,
        operateUserId,
        operateLegalName,
        remark: description.trim(),
        remarkLength: description.trim().length
      });

      const result = await performVolunteerCheckOut(
        userId,
        operateUserId,
        operateLegalName,
        description.trim() // 传递工作描述
      );

      if (result && result.code === 200) {
        // 成功反馈
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // 清除该志愿者的缓存记录
        try {
          apiCache.clearKey(`volunteerRecord:${volunteer?.userId}`);
          apiCache.clearByPattern(`volunteerRecord:*`);
          console.log(`🗑️ [SIGN-OUT] 清除志愿者${volunteer?.userId}的缓存记录`);
        } catch (e) {
          console.warn('[SIGN-OUT] 清除缓存失败:', e);
        }

        // 🚀 立即更新VolunteerContext状态，并触发数据刷新
        volunteerContext.updateStatus('signed_out', null);
        // 强制刷新状态，确保历史记录也会更新
        volunteerContext.refreshStatus();
        console.log('✅ [SIGN-OUT] 签退成功，已更新全局状态并触发数据刷新');

        // 手动构建时长显示，确保语言一致
        const formatDurationForDialog = () => {
          if (workDuration.hours > 0) {
            if (workDuration.minutes > 0) {
              return t('common.time.hoursAndMinutes', {
                hours: workDuration.hours,
                minutes: workDuration.minutes
              });
            } else {
              return t('common.time.hours', { hours: workDuration.hours });
            }
          } else if (workDuration.minutes > 0) {
            return t('common.time.minutes', { minutes: workDuration.minutes });
          } else {
            return t('common.time.lessThanOneMinute');
          }
        };

        // 显示成功提示并返回
        Alert.alert(
          t('wellbeing.volunteer.checkout.checkOutSuccess') || '签退成功',
          t('wellbeing.volunteer.checkout.workDurationResult', {
            duration: formatDurationForDialog()
          }) || `工作时长：${formatDurationForDialog()}`,
          [
            {
              text: t('common.confirm') || '确定',
              onPress: async () => {
                console.log('✅ [SIGN-OUT] 签退成功，清理缓存并返回');

                // 🆕 清除自动签退状态
                try {
                  await volunteerContext.clearAutoCheckout(volunteer.userId.toString());
                  console.log('✅ [CHECKOUT-SUCCESS] 已清除自动签退状态');
                } catch (autoCheckoutError) {
                  console.error('❌ [CHECKOUT-SUCCESS] 清除自动签退状态失败:', autoCheckoutError);
                }

                // 清理所有相关缓存，确保所有页面获取最新数据
                try {
                  apiCache.clearByPattern(`volunteerRecord:${volunteer.userId}`);
                  apiCache.clearKey('volunteerRecords');
                  apiCache.clearKey('volunteerHours');
                  console.log('✅ [CHECKOUT-SUCCESS] 已清理缓存');
                } catch (error) {
                  console.warn('签退成功后缓存清理失败:', error);
                }

                // 简化导航：直接返回，让页面自动刷新
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        const errorMsg = result?.msg || t('volunteer.checkout.checkOutFailed', '签退失败，请重试');
        Alert.alert(t('volunteer.checkout.checkOutFailedTitle', '签退失败'), errorMsg);
      }
    } catch (error) {
      console.error('签退失败:', error);
      Alert.alert(t('volunteer.checkout.checkOutFailedTitle', '签退失败'), t('common.network_error_retry', '网络错误，请稍后重试'));
    } finally {
      setIsSubmitting(false);
    }
  }, [description, volunteer, currentUser, workDuration, navigation, t]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Liquid Glass 背景 */}
      <LinearGradient
        colors={['#F8F9FA', '#FFFFFF', '#F5F5F7']}  // 浅色渐变背景
        style={StyleSheet.absoluteFill}
      />

      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
        {/* Liquid Glass 头部 */}
        <BlurView
          intensity={85}  // 增强毛玻璃效果
          tint="light"
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
              <Text style={styles.backText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {t('wellbeing.volunteer.signOut.title', '志愿者签退')}
            </Text>
            <View style={styles.placeholder} />
          </View>
        </BlurView>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 用户信息 */}
          <Animated.View entering={FadeIn.delay(100)} style={styles.userInfoSection}>
            <Text style={styles.userName}>
              <Ionicons name="person" size={20} color={theme.colors.text.secondary} />
              {'  '}{volunteer.name}
            </Text>
            <Text style={styles.userSchool}>
              <Ionicons name="school" size={18} color={theme.colors.text.secondary} />
              {'  '}{volunteer.school}
            </Text>
          </Animated.View>

          {/* Liquid Glass 时间统计卡片 */}
          <Animated.View
            style={[styles.glassCard, animatedCardStyle]}
            entering={FadeIn.delay(200)}
          >
            <BlurView
              intensity={92}  // 增强毛玻璃效果
              tint="light"
              style={styles.blurContainer}
            >
              <View style={styles.timeCardContent}>
                <View style={styles.timeCardHeader}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.timeCardTitle, isDarkMode && styles.textDark]}>
                    {t('wellbeing.volunteer.work_status', '工作时间统计')}
                  </Text>
                </View>

                <View style={styles.timeCardDivider} />

                <View style={styles.timeRow}>
                  <Text style={[styles.timeLabel, isDarkMode && styles.textSecondaryDark]}>
                    {t('volunteerCheckIn.time.checkInTime', '签到时间')}
                  </Text>
                  <Text style={[styles.timeValue, isDarkMode && styles.textDark]}>
                    {volunteer.checkInTime ?
                      timeService.formatForDisplay(timeService.parseServerTime(volunteer.checkInTime), { showDate: false, showTime: true })
                      : '--:--'}
                  </Text>
                </View>

                <View style={styles.timeRow}>
                  <Text style={[styles.timeLabel, isDarkMode && styles.textSecondaryDark]}>
                    {t('volunteerCheckIn.time.checkOutTime', '签退时间')}
                  </Text>
                  <Text style={[styles.timeValue, isDarkMode && styles.textDark]}>
                    {timeService.formatForDisplay(new Date(), { showDate: false, showTime: true })}
                  </Text>
                </View>

                <View style={[styles.timeRow, styles.durationRow]}>
                  <Text style={[styles.timeLabel, isDarkMode && styles.textSecondaryDark]}>
                    {t('volunteerCheckIn.time.worked', '工作时长')}
                  </Text>
                  <Text style={[
                    styles.timeValue,
                    styles.durationValue,
                    workDuration.hasError && styles.errorText
                  ]}>
                    {workDuration.display}
                  </Text>
                </View>

                {workDuration.hasError && workDuration.errorMessage && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                    <Text style={styles.errorMessage}>
                      {workDuration.errorMessage}
                    </Text>
                  </View>
                )}
              </View>
            </BlurView>
          </Animated.View>

          {/* 工作描述输入区 */}
          <Animated.View
            style={styles.descriptionSection}
            entering={FadeIn.delay(300)}
          >
            <View style={styles.descriptionHeader}>
              <View style={styles.descriptionLabelContainer}>
                <Text style={styles.descriptionLabel}>
                  {t('wellbeing.volunteer.history.workDescription', '工作内容描述')}
                </Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              {/* 键盘收起按钮 */}
              {keyboardHeight > 0 && (
                <TouchableOpacity
                  onPress={dismissKeyboard}
                  style={styles.keyboardDismissButton}
                >
                  <Text style={styles.keyboardDismissText}>{t('common.done', '完成')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                multiline
                placeholder={t('wellbeing.volunteer.signOut.placeholder', '请描述您今天的志愿工作内容...')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={description}
                onChangeText={setDescription}
                maxLength={100}
                editable={!isSubmitting}
                textAlignVertical="top"
                inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            {/* 字符计数器 - 放在输入框下方 */}
            <Text style={styles.charCount}>
              {description.length}/100
            </Text>

            {/* 快速选择按钮 - 单行显示 */}
            <View style={styles.quickButtonsContainer}>
              <View style={styles.quickButtonsRow}>
                  {quickOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => handleQuickSelect(option.text)}
                      disabled={isSubmitting}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#F8F9FA', '#F2F2F7']}  // 浅灰渐变背景增强对比
                        style={styles.quickButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                      >
                        <Text style={styles.quickButtonText}>
                          {option.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Liquid Glass 提交按钮 */}
        <Animated.View
          style={styles.submitSection}
          entering={FadeIn.delay(400)}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!description.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={!description.trim() ?
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
                  {t('wellbeing.volunteer.signOut.confirmButton', '确认签退')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* iOS 键盘工具栏 */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={styles.inputAccessoryContainer}>
            <TouchableOpacity
              onPress={dismissKeyboard}
              style={styles.inputAccessoryButton}
            >
              <Text style={styles.inputAccessoryButtonText}>{t('common.done', '完成')}</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  flex: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,  // 统一左右边距
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backText: {
    fontSize: 17,
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    flex: 1,
    marginTop: 65,  // 优化顶部间距
  },
  scrollContentContainer: {
    paddingHorizontal: 20,  // 统一水平内边距
    paddingTop: 8,  // 稍微增加顶部padding
    paddingBottom: 150,  // 增加底部padding给按钮和键盘更多空间
  },
  userInfoSection: {
    marginBottom: 16,  // 略微减少间距，让整体更紧凑
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  userSchool: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  glassCard: {
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    marginBottom: 24,      // 增加底部间距
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,   // 增强阴影
    shadowRadius: 16,
    elevation: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',  // 添加背景色
  },
  blurContainer: {
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
  },
  timeCardContent: {
    padding: 16,
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  timeCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  durationRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  descriptionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionLabel: {
    fontSize: 17,          // 增大标签字体
    fontWeight: '700',     // 加粗
    color: theme.colors.text.primary,
    letterSpacing: 0.3,    // 增加字间距
  },
  requiredMark: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,    // 增强阴影
    shadowRadius: 16,       // 增大阴影范围
    elevation: 6,
    padding: 14,            // 增加内边距
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',  // 添加细边框
  },
  textInput: {
    fontSize: 15,
    color: theme.colors.text.primary,
    minHeight: 100,
    maxHeight: 150,
  },
  charCount: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '500',
  },
  quickButtonsContainer: {
    marginTop: 8,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',        // 允许换行
    justifyContent: 'flex-start',  // 左对齐
    gap: 8,                  // 按钮间距
  },
  quickButton: {
    minWidth: 80,            // 最小宽度
    paddingHorizontal: 12,   // 水平padding
    paddingVertical: 10,     // 垂直padding
    borderRadius: 12,        // 圆角
    alignItems: 'center',    // 内容居中
    borderWidth: 1,          // 边框
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',     // 阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  quickButtonText: {
    fontSize: 13,           // 稍微增大字体提高可读性
    color: theme.colors.text.primary,  // 使用黑色文字
    fontWeight: '600',      // 加粗字体
  },
  submitSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,  // 适配安全区域
    backgroundColor: 'transparent',
  },
  submitButton: {
    height: 52,
    borderRadius: 12, // button radius from theme
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  errorMessage: {
    fontSize: 13,
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  errorText: {
    color: '#FF3B30',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textSecondaryDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  keyboardDismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  keyboardDismissText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputAccessoryContainer: {
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  inputAccessoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputAccessoryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VolunteerCheckOutScreen;