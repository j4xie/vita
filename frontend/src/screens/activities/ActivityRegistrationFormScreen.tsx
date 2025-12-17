import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useTabBarVerification } from '../../hooks/useTabBarStateGuard';
import { DynamicFormRenderer } from '../../components/activity/DynamicFormRenderer';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import { FormModeSelector } from '../../components/activity/FormModeSelector';
import formAutoFill from '../../utils/formAutoFill';
import { FormField } from '../../hooks/useAIFormFilling';

interface RegistrationFormData {
  legalName: string;
  nickName: string;
  phone: string;
  email: string;
  schoolName: string;
}

// ... (keep usage of RegisterFormData and other existing logic as fallback)

export const ActivityRegistrationFormScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useUser();
  const activity = route.params?.activity;

  // Mode Selection State
  const [modeSelected, setModeSelected] = useState(false);

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

  // Calculate auto-fill data and recommendation
  const { remainingFields, autoFilledLabels } = useMemo(() => {
    return formAutoFill.getAutoFillData(formSchema, user);
  }, [formSchema, user]);

  const { recommend: recommendAI } = useMemo(() => {
    return formAutoFill.shouldRecommendAI(formSchema, user);
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
        Alert.alert(t('activities.registration.failed_title'), '用户身份验证失败，请重新登录');
        return;
      }

      const activityIdInt = parseInt(activity.id);
      const userIdInt = parseInt(user.id);

      if (isNaN(activityIdInt) || isNaN(userIdInt) || userIdInt <= 0) {
        Alert.alert(t('activities.registration.failed_title'), '参数解析失败，请重试');
        return;
      }

      const result = await pomeloXAPI.enrollActivity(activityIdInt, userIdInt);

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
        Alert.alert(t('activities.registration.failed_title'), '用户身份验证失败，请重新登录');
        return;
      }

      const activityIdInt = parseInt(activity.id);
      const userIdInt = parseInt(user.id);

      if (isNaN(activityIdInt) || isNaN(userIdInt) || userIdInt <= 0) {
        Alert.alert(t('activities.registration.failed_title'), '参数解析失败，请重试');
        return;
      }

      const result = await pomeloXAPI.submitActivityRegistration(activityIdInt, userIdInt, dynamicFormData);

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
    if (modeSelected && hasDynamicForm) {
      // If mode was selected, go back to mode selection
      setModeSelected(false);
    } else {
      navigation.goBack();
    }
  };

  // Handle AI mode selection - navigate to AIFormFillerScreen
  const handleSelectAIMode = () => {
    navigation.navigate('AIFormFiller', {
      activity,
      formSchema,
    });
  };

  // Handle traditional mode selection - show the form
  const handleSelectTraditionalMode = () => {
    setModeSelected(true);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('activities.registration.form_title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Activity Info */}
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{activity?.title || activity?.name}</Text>
          <View style={styles.activityMeta}>
            <Ionicons name="calendar" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.activityTime}>{activity?.date}</Text>
            <Ionicons name="location" size={16} color={theme.colors.text.secondary} style={{ marginLeft: 16 }} />
            <Text style={styles.activityLocation}>{activity?.location || activity?.address}</Text>
          </View>
        </View>

        {hasDynamicForm && !modeSelected ? (
          <FormModeSelector
            onSelectAI={handleSelectAIMode}
            onSelectTraditional={handleSelectTraditionalMode}
            recommendAI={recommendAI}
            autoFilledCount={autoFilledLabels.length}
            remainingCount={remainingFields.length}
          />
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.form}>
                <Text style={styles.formTitle}>
                  {t('activities.registration.registration_info') || '报名信息'}
                </Text>
                <Text style={styles.formSubtitle}>{t('activities.registration.form_subtitle')}</Text>

                {hasDynamicForm ? (
                  <DynamicFormRenderer
                    modelContent={activity.modelContent}
                    onSubmit={handleDynamicSubmit}
                    submitLabel={t('activities.registration.submit_button')}
                    loading={loading}
                  />
                ) : (
                <>
                  {/* Legal Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('auth.register.form.legal_name_label')}</Text>
                    <TextInput
                      style={[styles.input, errors.legalName && styles.inputError]}
                      value={formData.legalName}
                      onChangeText={(value) => updateFormField('legalName', value)}
                      placeholder={t('auth.register.form.legal_name_placeholder')}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                    {errors.legalName && <Text style={styles.errorText}>{errors.legalName}</Text>}
                  </View>

                  {/* Nickname */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('auth.register.form.nickname_label')}</Text>
                    <TextInput
                      style={[styles.input, errors.nickName && styles.inputError]}
                      value={formData.nickName}
                      onChangeText={(value) => updateFormField('nickName', value)}
                      placeholder={t('auth.register.form.nickname_placeholder')}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                    {errors.nickName && <Text style={styles.errorText}>{errors.nickName}</Text>}
                  </View>

                  {/* Phone */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('auth.register.form.phone_label')}</Text>
                    <TextInput
                      style={[styles.input, errors.phone && styles.inputError]}
                      value={formData.phone}
                      onChangeText={(value) => updateFormField('phone', value)}
                      placeholder={t('auth.register.form.phone_placeholder')}
                      placeholderTextColor={theme.colors.text.disabled}
                      keyboardType="phone-pad"
                    />
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                  </View>

                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('auth.register.form.email_label')}</Text>
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      value={formData.email}
                      onChangeText={(value) => updateFormField('email', value)}
                      placeholder={t('auth.register.form.email_placeholder')}
                      placeholderTextColor={theme.colors.text.disabled}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>

                  {/* School */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('auth.register.form.school_label')}</Text>
                    <TextInput
                      style={[styles.input, errors.schoolName && styles.inputError]}
                      value={formData.schoolName}
                      onChangeText={(value) => updateFormField('schoolName', value)}
                      placeholder={t('auth.register.form.school_placeholder')}
                      placeholderTextColor={theme.colors.text.disabled}
                      editable={false}
                    />
                  </View>

                  <Text style={styles.note}>
                    {t('activities.registration.info_note')}
                  </Text>
                </>
              )}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        )}
      </View>

      {/* Fixed Submit Button - Only show generic submit if Static Form */}
      {!hasDynamicForm && (
        <View style={styles.fixedBottomContainer}>
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
        message={t('activities.registration.success_message')}
        confirmText={t('common.confirm')}
        icon="checkmark-circle"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
  activityInfo: {
    padding: theme.spacing[4],
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  activityLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  contentView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[4] + 120, // 为固定按钮留出空间
  },
  formTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  formSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[6],
    lineHeight: 20,
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
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3], // 减少垂直间距
    paddingBottom: theme.spacing[3] + 20, // 显著减少底部间距，更贴近底部
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
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