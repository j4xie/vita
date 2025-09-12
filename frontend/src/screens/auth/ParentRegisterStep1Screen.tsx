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
  SchoolData, 
  createSchoolDataFromBackend 
} from '../../utils/schoolData';
import { 
  fetchSchoolList
} from '../../services/registrationAPI';

interface RouteParams {
  registrationType?: 'phone' | 'invitation';
  referralCode?: string;
  hasReferralCode?: boolean;
  detectedRegion?: 'zh' | 'en';
  detectionResult?: any;
  identity: 2; // 家长
}

export interface ParentStep1Data {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  sex: '0' | '1' | '2';
  selectedSchool: SchoolData | null;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  selectedSchool?: string;
}

export const ParentRegisterStep1Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  const {
    registrationType = 'phone',
    referralCode,
    hasReferralCode = false,
    detectedRegion = 'zh',
    detectionResult
  } = route.params as RouteParams || {};

  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);

  const [formData, setFormData] = useState<ParentStep1Data>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    sex: '2', // 默认未知
    selectedSchool: null,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // 加载学校列表
  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setSchoolsLoading(true);
      const response = await fetchSchoolList();
      
      if (response.code === 200 && response.data) {
        const schoolData = createSchoolDataFromBackend(response.data);
        // 过滤掉非学校的组织机构（如CU总部等）- 家长的孩子应该在真实学校
        const filteredSchools = schoolData.filter(school => {
          const excludedOrganizations = ['CU', '总部', 'Headquarters', 'Chinese Union'];
          const schoolInfo = `${school.abbreviation} ${school.name}`.toLowerCase();
          
          return !excludedOrganizations.some(org => 
            schoolInfo.includes(org.toLowerCase())
          );
        });
        setSchools(filteredSchools);
      } else {
        Alert.alert(t('common.error'), t('auth.register.errors.school_load_failed'));
      }
    } catch (error) {
      console.error('加载学校列表失败:', error);
      Alert.alert(t('common.error'), t('auth.register.errors.school_load_failed'));
    } finally {
      setSchoolsLoading(false);
    }
  };

  const updateFormData = <K extends keyof ParentStep1Data>(
    field: K, 
    value: ParentStep1Data[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 验证家长名字
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.parent_first_name_required');
    } else if (formData.firstName.length > 25) {
      newErrors.firstName = t('validation.first_name_too_long');
    }

    // 验证家长姓氏
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.parent_last_name_required');
    } else if (formData.lastName.length > 25) {
      newErrors.lastName = t('validation.last_name_too_long');
    }

    // 验证邮箱
    if (!formData.email.trim()) {
      newErrors.email = t('validation.email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.email_invalid');
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = t('validation.password_required');
    } else if (formData.password.length < 6 || formData.password.length > 20) {
      newErrors.password = t('validation.password_length');
    }

    // 验证确认密码
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.password_mismatch');
    }

    // 验证学校
    if (!formData.selectedSchool) {
      newErrors.selectedSchool = t('validation.child_school_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    // 导航到ParentRegisterStep2Screen进行手机验证
    navigation.navigate('ParentRegisterStep2', {
      step1Data: formData,
      registrationType,
      referralCode,
      hasReferralCode,
      detectedRegion,
      detectionResult
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderSchoolPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.parent.child_school_label')}</Text>
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
              label={t('auth.register.parent.child_school_placeholder')} 
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

  const renderGenderSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.gender_label')}</Text>
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[styles.genderButton, formData.sex === '0' && styles.genderActive]}
          onPress={() => updateFormData('sex', '0')}
        >
          <Text style={[styles.genderText, formData.sex === '0' && styles.genderTextActive]}>
            {t('auth.register.form.gender_male')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, formData.sex === '1' && styles.genderActive]}
          onPress={() => updateFormData('sex', '1')}
        >
          <Text style={[styles.genderText, formData.sex === '1' && styles.genderTextActive]}>
            {t('auth.register.form.gender_female')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, formData.sex === '2' && styles.genderActive]}
          onPress={() => updateFormData('sex', '2')}
        >
          <Text style={[styles.genderText, formData.sex === '2' && styles.genderTextActive]}>
            {t('auth.register.form.gender_unknown')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      
      <View style={styles.contentView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('auth.register.parent.title')}</Text>
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
              <Text style={styles.stepTitle}>{t('auth.register.parent.form_title')}</Text>
              <Text style={styles.stepSubtitle}>
                {registrationType === 'invitation' 
                  ? t('auth.register.parent.invitation_description')
                  : t('auth.register.parent.description')
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

              {/* 家长姓名 - 分成两个字段 */}
              <View style={styles.nameRowContainer}>
                <View style={[styles.inputContainer, styles.nameFieldContainer]}>
                  <Text style={styles.label}>{t('auth.register.parent.first_name_label')}</Text>
                  <TextInput
                    style={[styles.input, errors.firstName && styles.inputError]}
                    placeholder={t('auth.register.parent.first_name_placeholder')}
                    value={formData.firstName}
                    onChangeText={(text) => updateFormData('firstName', text)}
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>
                
                <View style={[styles.inputContainer, styles.nameFieldContainer]}>
                  <Text style={styles.label}>{t('auth.register.parent.last_name_label')}</Text>
                  <TextInput
                    style={[styles.input, errors.lastName && styles.inputError]}
                    placeholder={t('auth.register.parent.last_name_placeholder')}
                    value={formData.lastName}
                    onChangeText={(text) => updateFormData('lastName', text)}
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>
              </View>

              {/* 邮箱（作为用户名） */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.parent.email_label')}</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder={t('auth.register.parent.email_placeholder')}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                <Text style={styles.helpText}>{t('auth.register.parent.email_help')}</Text>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* 密码 */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.form.password_label')}</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder={t('auth.register.form.password_placeholder')}
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  secureTextEntry
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* 确认密码 */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.form.confirm_password_label')}</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder={t('auth.register.form.confirm_password_placeholder')}
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateFormData('confirmPassword', text)}
                  secureTextEntry
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              {/* 性别选择 */}
              {renderGenderSelector()}

              {/* 孩子学校选择 */}
              {renderSchoolPicker()}

              {/* 下一步按钮 */}
              <View style={styles.bottomContainer}>
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
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
    paddingBottom: theme.spacing[6],
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
    lineHeight: theme.typography.fontSize.base * 1.4,
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
  nameRowContainer: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[5],
  },
  nameFieldContainer: {
    flex: 1,
    marginBottom: 0,
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
    paddingVertical: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 52,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  helpText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
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
  genderContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  genderButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  genderActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  genderTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bottomContainer: {
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[4],
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
});