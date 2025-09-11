import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { 
  RegistrationStep1Data, 
  ValidationErrors 
} from '../../types/registration';
import { 
  SchoolData, 
  createSchoolDataFromBackend,
  validateEduEmail 
} from '../../utils/schoolData';
import SchoolEmailService from '../../services/schoolEmailService';
import { 
  fetchSchoolList,
  validatePhoneNumber 
} from '../../services/registrationAPI';
import RegionDetectionService from '../../services/RegionDetectionService';
import UserRegionPreferences from '../../services/UserRegionPreferences';

export const RegisterStep1Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  // 获取邀请码相关参数
  const referralCode = route.params?.referralCode;
  const hasReferralCode = route.params?.hasReferralCode ?? !!referralCode;
  const registrationType = route.params?.registrationType || 'phone'; // 'phone' 或 'invitation'

  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  
  const [formData, setFormData] = useState<RegistrationStep1Data & { areaCode: '86' | '1' }>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    selectedSchool: null,
    generatedEmail: '',
    areaCode: detectedRegion === 'zh' ? '86' : '1', // 根据地理检测设置默认区号
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [emailUsername, setEmailUsername] = useState('');

  // 加载学校列表
  useEffect(() => {
    loadSchools();
  }, []);

  // 生成邮箱地址
  useEffect(() => {
    if (emailUsername && formData.selectedSchool) {
      // 使用统一的邮箱域名服务生成邮箱地址
      const emailDomain = formData.selectedSchool.emailDomain;
      const generatedEmail = emailDomain ? `${emailUsername}@${emailDomain}` : '';
      setFormData(prev => ({ ...prev, generatedEmail }));
    } else {
      setFormData(prev => ({ ...prev, generatedEmail: '' }));
    }
  }, [emailUsername, formData.selectedSchool]);

  const loadSchools = async () => {
    try {
      setSchoolsLoading(true);
      const response = await fetchSchoolList();
      
      if (response.code === 200 && response.data) {
        const schoolData = createSchoolDataFromBackend(response.data);
        setSchools(schoolData);
      } else {
        console.error('加载学校列表失败:', response);
        Alert.alert(t('common.error'), t('auth.register.errors.school_load_failed'));
      }
    } catch (error) {
      console.error('加载学校列表失败:', error);
      Alert.alert(t('common.error'), t('auth.register.errors.school_load_failed'));
    } finally {
      setSchoolsLoading(false);
    }
  };

  const updateFormData = <K extends keyof RegistrationStep1Data>(
    field: K, 
    value: RegistrationStep1Data[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 验证姓名
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.first_name_required');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.last_name_required');
    }

    // 验证手机号（邀请码注册时可选）
    if (registrationType === 'invitation') {
      // 邀请码注册：手机号可选
      if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber, formData.areaCode)) {
        newErrors.phoneNumber = formData.areaCode === '86' 
          ? t('validation.phone_china_invalid')
          : t('validation.phone_us_invalid');
      }
    } else {
      // 手机验证码注册：手机号必填
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = t('validation.phone_required');
      } else if (!validatePhoneNumber(formData.phoneNumber, formData.areaCode)) {
        newErrors.phoneNumber = formData.areaCode === '86' 
          ? t('validation.phone_china_invalid')
          : t('validation.phone_us_invalid');
      }
    }

    // 验证学校
    if (!formData.selectedSchool) {
      newErrors.selectedSchool = t('validation.university_required');
    }

    // 验证邮箱用户名（邀请码注册时可选）
    if (registrationType === 'invitation') {
      // 邀请码注册：邮箱可选
      if (emailUsername && emailUsername.length < 3) {
        newErrors.email = t('validation.email_username_too_short');
      } else if (emailUsername && !/^[a-zA-Z0-9._-]+$/.test(emailUsername)) {
        newErrors.email = t('validation.email_username_invalid');
      }
    } else {
      // 手机验证码注册：邮箱必填
      if (!emailUsername.trim()) {
        newErrors.email = t('validation.email_username_required');
      } else if (emailUsername.length < 3) {
        newErrors.email = t('validation.email_username_too_short');
      } else if (!/^[a-zA-Z0-9._-]+$/.test(emailUsername)) {
        newErrors.email = t('validation.email_username_invalid');
      }
    }

    // 验证生成的邮箱
    if (formData.generatedEmail && !validateEduEmail(formData.generatedEmail)) {
      newErrors.email = t('validation.email_school_invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        
        // 执行地理位置检测（用于初始化区域偏好）
        console.log('注册流程：开始地理位置检测...');
        const detectionResult = await RegionDetectionService.detectRegion();
        console.log('注册流程：地理位置检测结果:', detectionResult);
        
        // 初始化用户区域偏好
        await UserRegionPreferences.initializePreferences(detectionResult.region);
        console.log('注册流程：用户区域偏好初始化完成');
        
        // 导航到第二步，传递第一步的数据、邀请码信息和地理检测结果
        navigation.navigate('RegisterStep2', { 
          step1Data: {
            ...formData,
            legalName: `${formData.lastName} ${formData.firstName}`.trim(),
          },
          referralCode,
          hasReferralCode,
          registrationType,
          regionDetection: detectionResult, // 传递地理检测结果
        });
      } catch (error) {
        console.error('注册流程地理位置检测失败:', error);
        // 即使地理检测失败也继续注册流程，使用默认设置
        navigation.navigate('RegisterStep2', { 
          step1Data: {
            ...formData,
            legalName: `${formData.lastName} ${formData.firstName}`.trim(),
          },
          referralCode,
          hasReferralCode,
          registrationType,
          regionDetection: null, // 检测失败
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderSchoolPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.university_label')}</Text>
      <View style={[styles.pickerContainer, errors.selectedSchool && styles.inputError]}>
        {schoolsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('auth.register.form.loading_schools')}</Text>
          </View>
        ) : (
          <Picker
            selectedValue={formData.selectedSchool?.id || ''}
            onValueChange={(itemValue) => {
              if (itemValue) {
                const school = schools.find(s => s.id === itemValue);
                if (school) {
                  updateFormData('selectedSchool', school);
                }
              } else {
                updateFormData('selectedSchool', null);
              }
            }}
            style={styles.picker}
          >
            <Picker.Item 
              label={t('auth.register.form.university_placeholder')} 
              value="" 
              color={theme.colors.text.disabled}
            />
            {schools.map((school) => (
              <Picker.Item
                key={school.id}
                label={`${school.abbreviation} - ${school.name}`}
                value={school.id}
                color={theme.colors.text.primary}
              />
            ))}
          </Picker>
        )}
      </View>
      {errors.selectedSchool && <Text style={styles.errorText}>{errors.selectedSchool}</Text>}
    </View>
  );

  const renderEmailPreview = () => {
    if (!formData.selectedSchool) return null;

    return (
      <View style={styles.emailPreviewContainer}>
        <Text style={styles.label}>{t('auth.register.form.school_email_preview')}</Text>
        <View style={styles.emailInputWrapper}>
          <TextInput
            style={[styles.emailUsernameInput, errors.email && styles.inputError]}
            placeholder={t('auth.register.form.email_username_placeholder')}
            value={emailUsername}
            onChangeText={setEmailUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={theme.colors.text.disabled}
          />
          <Text style={styles.emailDomain}>@{formData.selectedSchool.emailDomain}</Text>
        </View>
        {formData.generatedEmail && (
          <Text style={styles.emailPreview}>
            {t('auth.register.form.complete_email')}: {formData.generatedEmail}
          </Text>
        )}
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      
      <View style={styles.contentView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('auth.register.form.register')}</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>{t('auth.register.form.progress', { current: 1, total: 2 })}</Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          <View style={styles.formContainer}>
            <Text style={styles.stepTitle}>{t('auth.register.form.basic_info')}</Text>
            <Text style={styles.stepSubtitle}>
              {registrationType === 'invitation' 
                ? t('auth.register.form.invitation_step1_description')
                : t('auth.register.form.step1_description')
              }
            </Text>

            {/* 邀请码提示 */}
            {hasReferralCode && (
              <View style={styles.referralBadge}>
                <Ionicons name="gift" size={20} color={theme.colors.primary} />
                <Text style={styles.referralText}>
                  {t('auth.register.form.referral_code', { code: referralCode })}
                </Text>
              </View>
            )}

            {/* 姓名输入 */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.last_name_label')}</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder={t('auth.register.form.last_name_placeholder')}
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>

              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.first_name_label')}</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder={t('auth.register.form.first_name_placeholder')}
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
            </View>

            {/* 学校选择 */}
            {renderSchoolPicker()}

            {/* 邮箱预览 */}
            {renderEmailPreview()}

            {/* 手机号输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {registrationType === 'invitation' 
                  ? t('auth.register.form.phone_label_optional')
                  : t('auth.register.form.phone_label')
                }
              </Text>
              <View style={styles.phoneInputWrapper}>
                <TouchableOpacity 
                  style={styles.areaCodeSelector}
                  onPress={() => {
                    Alert.alert(
                      t('auth.register.parent.select_area_code'),
                      '',
                      [
                        { text: t('auth.register.parent.area_code_china'), onPress: () => updateFormData('areaCode', '86') },
                        { text: t('auth.register.parent.area_code_usa'), onPress: () => updateFormData('areaCode', '1') },
                        { text: t('common.cancel'), style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={styles.areaCodeText}>
                    {formData.areaCode === '86' ? t('auth.register.parent.area_code_china') : t('auth.register.parent.area_code_usa')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
                  placeholder={formData.areaCode === '86' ? '13812345678' : '(555) 123-4567'}
                  value={formData.phoneNumber}
                  onChangeText={(text) => updateFormData('phoneNumber', text)}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>

      {/* Fixed Bottom Button */}
      <View style={styles.fixedBottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.nextButtonText}>
              {t('auth.register.form.next_step')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[2],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing[6],
    paddingBottom: 120, // 增加更多空间避免键盘遮挡内容
  },
  formContainer: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    padding: theme.spacing.lg,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
  },
  stepTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  stepSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[6],
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing[5],
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4], // 增加垂直内边距
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 52, // 设置最小高度，让输入框更舒适
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  pickerContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  picker: {
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
  },
  loadingText: {
    marginLeft: theme.spacing[2],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  emailPreviewContainer: {
    marginBottom: theme.spacing[5],
  },
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emailUsernameInput: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  emailDomain: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emailPreview: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing[2],
    fontStyle: 'italic',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  phonePrefix: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3], // 减少垂直间距
    paddingBottom: theme.spacing[3] + 20, // 显著减少底部间距，更贴近底部
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  referralBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[4],
  },
  referralText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[2],
  },
  areaCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.background.tertiary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  areaCodeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing[1],
  },
});