import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  DeviceEventEmitter,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useTabBarVerification } from '../../hooks/useTabBarStateGuard';
import { DynamicFormRenderer } from '../../components/activity/DynamicFormRenderer';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import formAutoFill from '../../utils/formAutoFill';
import { FormField } from '../../hooks/useAIFormFilling';
import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../../components/common/KeyboardDismissWrapper';

interface RegistrationFormData {
  legalName: string;
  nickName: string;
  phone: string;
  email: string;
  schoolName: string;
}

// ... (keep usage of RegisterFormData and other existing logic as fallback)

// Activity Info Banner Component
const ActivityInfoBanner = memo(({ activity, isDarkMode, t }: {
  activity: any;
  isDarkMode: boolean;
  t: (key: string, fallback?: string) => string;
}) => (
  <View style={[
    bannerStyles.container,
    isDarkMode && bannerStyles.containerDark,
  ]}>
    <LinearGradient
      colors={isDarkMode
        ? ['rgba(255, 107, 53, 0.15)', 'rgba(255, 107, 53, 0.05)'] as const
        : ['rgba(255, 107, 53, 0.08)', 'rgba(255, 107, 53, 0.02)'] as const}
      style={bannerStyles.gradient}
    >
      <Text style={[
        bannerStyles.activityName,
        isDarkMode && bannerStyles.textDark,
      ]} numberOfLines={2}>
        {activity?.title || activity?.name}
      </Text>
      <View style={bannerStyles.metaRow}>
        {activity?.date && (
          <View style={bannerStyles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={isDarkMode ? '#F9A889' : '#FF6B35'} />
            <Text style={[bannerStyles.metaText, isDarkMode && bannerStyles.metaTextDark]}>
              {activity.date}
            </Text>
          </View>
        )}
        {(activity?.location || activity?.address) && (
          <View style={[bannerStyles.metaItem, { marginLeft: 16 }]}>
            <Ionicons name="location-outline" size={14} color={isDarkMode ? '#F9A889' : '#FF6B35'} />
            <Text style={[bannerStyles.metaText, isDarkMode && bannerStyles.metaTextDark]} numberOfLines={1}>
              {activity.location || activity.address}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  </View>
));

const bannerStyles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  containerDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  textDark: {
    color: '#F3F4F6',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaTextDark: {
    color: '#9CA3AF',
  },
});

export const ActivityRegistrationFormScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const activity = route.params?.activity;
  const shareUserId = route.params?.shareUserId as number | undefined;

  // Static Form State
  const [formData, setFormData] = useState<RegistrationFormData>({
    legalName: '',
    nickName: '',
    phone: '',
    email: '',
    schoolName: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Parse form schema from modelContent
  const formSchema: FormField[] = useMemo(() => {
    if (!activity?.modelContent) return [];
    try {
      const parsed = JSON.parse(activity.modelContent);
      return parsed.fields || [];
    } catch {
      return [];
    }
  }, [activity?.modelContent]);



  // Auto-fill initial data for DynamicFormRenderer (uses smart matching for select/radio)
  const initialData = useMemo(() => {
    if (!user || !formSchema.length) return {};
    const { autoFilled } = formAutoFill.getAutoFillData(formSchema, user);
    return autoFilled;
  }, [formSchema, user]);

  // 🛡️ TabBar状态守护：确保报名表单页面TabBar始终隐藏
  useTabBarVerification('ActivityRegistrationForm', { debugLogs: false });

  // 自动填充用户信息
  useEffect(() => {
    if (user) {
      setFormData({
        legalName: user.legalName || '',
        nickName: user.nickName || '',
        phone: user.phonenumber || '',
        email: user.email || '',
        schoolName: user.dept?.deptName || '',
      });
    }
  }, [user]);

  // Dynamic Form Logic
  const hasDynamicForm = !!activity?.modelContent;

  const validateForm = (): boolean => {
    // Only validate static form if dynamic form is NOT present
    if (hasDynamicForm) return true;

    const newErrors: Partial<RegistrationFormData> = {};

    if (!formData.legalName.trim()) {
      newErrors.legalName = t('validation.errors.legal_name_required');
    }
    if (!formData.nickName.trim()) {
      newErrors.nickName = t('validation.errors.nickname_required');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.errors.phone_required');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('validation.errors.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.errors.email_format');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStaticSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (!user || !user.id) {
        Alert.alert(t('activities.registration.failed_title'), t('activities.registration.auth_failed'));
        return;
      }

      const activityIdInt = parseInt(activity.id);
      const userIdInt = parseInt(user.id);

      if (isNaN(activityIdInt) || isNaN(userIdInt) || userIdInt <= 0) {
        Alert.alert(t('activities.registration.failed_title'), t('activities.registration.param_error'));
        return;
      }

      const result = await pomeloXAPI.enrollActivity(activityIdInt, userIdInt, false, shareUserId);

      if (result.code === 200 && result.data != null && result.data > 0) {
        setShowSuccessModal(true);
      } else {
        Alert.alert(t('activities.registration.failed_title'), result.msg || t('activities.registration.failed_message'));
      }
    } catch (error: any) {
      const isAlreadyEnrolled = error.message && error.message.includes('报名信息已存在');
      Alert.alert(t('activities.registration.failed_title'), isAlreadyEnrolled ? error.message.replace('活动报名失败: ', '') : t('common.network_error'));
    } finally {
      setLoading(false);
    }
  };


  const handleDynamicSubmit = async (dynamicFormData: any) => {
    setLoading(true);
    try {
      if (!user || !user.id) {
        Alert.alert(t('activities.registration.failed_title'), t('activities.registration.auth_failed'));
        return;
      }

      const activityIdInt = parseInt(activity.id);
      const userIdInt = parseInt(user.id);

      if (isNaN(activityIdInt) || isNaN(userIdInt) || userIdInt <= 0) {
        Alert.alert(t('activities.registration.failed_title'), t('activities.registration.param_error'));
        return;
      }

      const result = await pomeloXAPI.submitActivityRegistration(activityIdInt, userIdInt, dynamicFormData, shareUserId);

      if (result.code === 200 && result.data != null && Number(result.data) > 0) {
        setShowSuccessModal(true);
      } else {
        Alert.alert(t('activities.registration.failed_title'), result.msg || t('activities.registration.failed_message'));
      }
    } catch (error: any) {
      Alert.alert(t('activities.registration.failed_title'), error.message || t('common.upload_failed'));
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    navigation.goBack();
  };


  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);

    // ✅ 发送报名成功事件，使用统一的事件格式
    console.log('📡 [报名] 发送activityRegistrationChanged事件:', { activityId: activity.id });
    DeviceEventEmitter.emit('activityRegistrationChanged', {
      activityId: activity.id,
      action: 'register',
      timestamp: Date.now()
    });

    // ✅ 返回活动详情页面
    console.log('🔙 [报名] 返回活动详情页面');
    navigation.goBack();
  };

  const updateFormField = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const dk = isDarkMode;

  return (
    <SafeAreaView style={[styles.container, dk && styles.containerDark]}>
      <View style={styles.contentView}>
        {/* Header */}
        <View style={[styles.header, dk && styles.headerDark]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={dk ? '#F3F4F6' : theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dk && styles.headerTitleDark]}>
            {t('activities.registration.form_title')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Activity Info */}
        <ActivityInfoBanner activity={activity} isDarkMode={dk} t={t} />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.form}>
                <Text style={[styles.formTitle, dk && styles.textDark]}>
                  {t('activities.registration.registration_info')}
                </Text>
                <Text style={[styles.formSubtitle, dk && styles.subtitleDark]}>
                  {t('activities.registration.form_subtitle')}
                </Text>

                {hasDynamicForm ? (
                  <DynamicFormRenderer
                    modelContent={activity.modelContent}
                    onSubmit={handleDynamicSubmit}
                    submitLabel={t('activities.registration.submit_button')}
                    loading={loading}
                    initialData={initialData}
                  />
                ) : (
                <>
                  {/* Legal Name */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, dk && styles.labelDark]}>{t('auth.register.form.legal_name_label')}</Text>
                    <TextInput
                      style={[styles.input, dk && styles.inputDark, errors.legalName && styles.inputError]}
                      value={formData.legalName}
                      onChangeText={(value) => updateFormField('legalName', value)}
                      placeholder={t('auth.register.form.legal_name_placeholder')}
                      placeholderTextColor={dk ? '#6B7280' : theme.colors.text.disabled}
                      inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                    />
                    {errors.legalName && <Text style={styles.errorText}>{errors.legalName}</Text>}
                  </View>

                  {/* Nickname */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, dk && styles.labelDark]}>{t('auth.register.form.nickname_label')}</Text>
                    <TextInput
                      style={[styles.input, dk && styles.inputDark, errors.nickName && styles.inputError]}
                      value={formData.nickName}
                      onChangeText={(value) => updateFormField('nickName', value)}
                      placeholder={t('auth.register.form.nickname_placeholder')}
                      placeholderTextColor={dk ? '#6B7280' : theme.colors.text.disabled}
                      inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                    />
                    {errors.nickName && <Text style={styles.errorText}>{errors.nickName}</Text>}
                  </View>

                  {/* Phone */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, dk && styles.labelDark]}>{t('auth.register.form.phone_label')}</Text>
                    <TextInput
                      style={[styles.input, dk && styles.inputDark, errors.phone && styles.inputError]}
                      value={formData.phone}
                      onChangeText={(value) => updateFormField('phone', value)}
                      placeholder={t('auth.register.form.phone_placeholder')}
                      placeholderTextColor={dk ? '#6B7280' : theme.colors.text.disabled}
                      keyboardType="phone-pad"
                      inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                    />
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                  </View>

                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, dk && styles.labelDark]}>{t('auth.register.form.email_label')}</Text>
                    <TextInput
                      style={[styles.input, dk && styles.inputDark, errors.email && styles.inputError]}
                      value={formData.email}
                      onChangeText={(value) => updateFormField('email', value)}
                      placeholder={t('auth.register.form.email_placeholder')}
                      placeholderTextColor={dk ? '#6B7280' : theme.colors.text.disabled}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>

                  {/* School */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, dk && styles.labelDark]}>{t('auth.register.form.school_label')}</Text>
                    <TextInput
                      style={[styles.input, dk && styles.inputDark, errors.schoolName && styles.inputError]}
                      value={formData.schoolName}
                      onChangeText={(value) => updateFormField('schoolName', value)}
                      placeholder={t('auth.register.form.school_placeholder')}
                      placeholderTextColor={dk ? '#6B7280' : theme.colors.text.disabled}
                      editable={false}
                      inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                    />
                  </View>

                  <Text style={[styles.note, dk && styles.noteDark]}>
                    {t('activities.registration.info_note')}
                  </Text>
                </>
              )}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
      </View>

      {/* Fixed Submit Button - Only show generic submit if Static Form */}
      {!hasDynamicForm && (
        <View style={[styles.fixedBottomContainer, dk && styles.fixedBottomDark]}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleStaticSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? t('common.loading') : t('activities.registration.submit_button')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 液态玻璃成功提示模态框 */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('activities.registration.success_title')}
        message={
          shareUserId && activity?.sharePoint
            ? t('activities.registration.success_message_with_points', {
                points: activity.sharePoint,
                defaultValue: `${t('activities.registration.success_message')}\n+${activity.sharePoint} ${t('rewards.menu.points', 'Points')}`,
              })
            : t('activities.registration.success_message')
        }
        confirmText={t('common.confirm')}
        icon="checkmark-circle"
      />
      <KeyboardDoneAccessory />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerTitleDark: {
    color: '#F3F4F6',
  },
  contentView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[4] + 120,
  },
  formTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  textDark: {
    color: '#F3F4F6',
  },
  formSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[6],
    lineHeight: 20,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  inputGroup: {
    marginBottom: theme.spacing[4],
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  labelDark: {
    color: '#D1D5DB',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: '#FFFFFF',
  },
  inputDark: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#1C1C1E',
    color: '#F3F4F6',
  },
  inputError: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  note: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
    marginTop: theme.spacing[4],
    textAlign: 'center',
  },
  noteDark: {
    color: '#6B7280',
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    paddingBottom: theme.spacing[3] + 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  fixedBottomDark: {
    backgroundColor: 'rgba(28, 28, 30, 0.98)',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});

export default ActivityRegistrationFormScreen;