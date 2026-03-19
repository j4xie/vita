import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { LoaderOne } from '../../components/ui/LoaderOne';
import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../../components/common/KeyboardDismissWrapper';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import {
  SchoolData,
  createSchoolDataFromBackend
} from '../../utils/schoolData';
import { SchoolSelector } from '../../components/common/SchoolSelector';
import { AreaCodePickerModal, getPhonePlaceholder } from '../../components/common/AreaCodePickerModal';
import {
  fetchSchoolList,
  validatePhoneNumber,
  sendSMSVerificationCode,
  registerUser,
  checkEmailAvailability
} from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import LiquidSuccessModal from '../../components/modals/LiquidSuccessModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  validateTextByLanguage,
  TextType,
  generateBackendNameData,
  createRealtimeValidator
} from '../../utils/textValidation';
import { i18n } from '../../utils/i18n';
import { checkPhoneAvailability } from '../../services/registrationAPI';

interface ParentStep1FormData {
  firstName: string;          // 家长名字
  lastName: string;           // 家长姓氏
  email: string;              // 邮箱（同时作为用户名）
  password: string;           // 密码
  confirmPassword: string;    // 确认密码
  sex: '0' | '1' | '2';       // 性别
  selectedSchool: SchoolData | null; // 孩子的学校
  // SchoolSelector需要的字段
  selectedSchoolId: string;
  selectedSchoolName: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  selectedSchool?: string;
  phoneNumber?: string;
}

export const ParentNormalRegisterStep1Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();

  const [loading, setLoading] = useState(false);

  // 验证方式：统一使用手机验证，邮箱验证注册后在会员卡处进行
  const [verifyMethod, setVerifyMethod] = useState<'phone' | 'email'>('phone');

  // 邮箱验证路径下的手机号（无需验证，仅收集）
  const [emailPathPhoneNumber, setEmailPathPhoneNumber] = useState('');
  const [emailPathAreaCode, setEmailPathAreaCode] = useState<'86' | '1'>('86');
  const [showEmailPathAreaCodeModal, setShowEmailPathAreaCodeModal] = useState(false);

  const [formData, setFormData] = useState<ParentStep1FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    sex: '2', // 默认未知
    selectedSchool: null,
    // SchoolSelector需要的字段
    selectedSchoolId: '',
    selectedSchoolName: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // 实时验证状态
  const [realtimeErrors, setRealtimeErrors] = useState<ValidationErrors>({});

  // 🔧 邮箱实时验证状态
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  
  // 检查是否有任何验证错误 - 使用 useMemo 优化性能
  const hasValidationErrors = useMemo(() => {
    return Object.keys(realtimeErrors).some(key =>
      realtimeErrors[key as keyof ValidationErrors]
    ) || Object.keys(errors).some(key =>
      errors[key as keyof ValidationErrors]
    );
  }, [realtimeErrors, errors]);
  
  // Debug: Check current system language
  useEffect(() => {
    console.log('🌍 [ParentNormalRegister] Language detection:', {
      currentLanguage: i18n.language,
    });
  }, []);

  // 🔧 实时邮箱验证（防抖1秒）- 防止并发重复注册
  useEffect(() => {
    if (!formData.email || !formData.email.includes('@')) {
      setEmailAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const result = await checkEmailAvailability(formData.email);
        setEmailAvailable(result.available);
        if (!result.available && result.message) {
          setErrors(prev => ({ ...prev, email: result.message || '此邮箱已被注册' }));
        } else {
          // 清除错误
          setErrors(prev => ({ ...prev, email: undefined }));
        }
      } catch (error) {
        console.error('邮箱验证失败:', error);
      } finally {
        setEmailChecking(false);
      }
    }, 1000); // 1秒防抖

    return () => clearTimeout(timer);
  }, [formData.email]);
  
  // 创建实时验证处理器
  const handleFirstNameChange = createRealtimeValidator(
    TextType.FIRST_NAME,
    (isValid, message) => {
      setRealtimeErrors(prev => ({
        ...prev,
        firstName: isValid ? undefined : message
      }));
    }
  );
  
  const handleLastNameChange = createRealtimeValidator(
    TextType.LAST_NAME,
    (isValid, message) => {
      setRealtimeErrors(prev => ({
        ...prev,
        lastName: isValid ? undefined : message
      }));
    }
  );
  

  // 处理学校选择
  const handleSchoolSelect = (school: any) => {
    // 构建SchoolData对象以保持兼容性
    const schoolData: SchoolData = {
      id: school.deptId.toString(),
      name: school.deptName,
      abbreviation: school.aprName || school.deptName,
      emailDomain: school.mailDomain || '' // 使用后端返回的邮箱域名
    };

    // 更新相关状态
    setFormData(prev => ({
      ...prev,
      selectedSchool: schoolData,
      selectedSchoolId: school.deptId.toString(),
      selectedSchoolName: school.deptName
    }));

    // 清除学校选择相关错误
    if (errors.selectedSchool) {
      setErrors(prev => ({ ...prev, selectedSchool: undefined }));
    }
  };

  const updateFormData = <K extends keyof ParentStep1FormData>(
    field: K,
    value: ParentStep1FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 验证姓名 - 使用智能验证
    const firstNameValidation = validateTextByLanguage(
      formData.firstName,
      TextType.FIRST_NAME,
      t
    );
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.message;
    }

    const lastNameValidation = validateTextByLanguage(
      formData.lastName,
      TextType.LAST_NAME,
      t
    );
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.message;
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
      newErrors.password = t('validation.password_length_6_20');
    }

    // 验证确认密码
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.password_mismatch');
    }

    // 验证学校
    if (!formData.selectedSchool) {
      newErrors.selectedSchool = t('validation.university_required');
    }

    // 邮箱验证路径：额外验证手机号格式（仅格式检查，无需短信验证）
    if (verifyMethod === 'email') {
      if (!emailPathPhoneNumber.trim()) {
        newErrors.phoneNumber = t('validation.phone_required');
      } else if (!validatePhoneNumber(emailPathPhoneNumber, emailPathAreaCode)) {
        newErrors.phoneNumber = emailPathAreaCode === '86'
          ? t('validation.phone_china_invalid')
          : t('validation.phone_us_invalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    try {
      // 唯一性检查：邮箱和手机号
      if (verifyMethod === 'email') {
        if (formData.email) {
          const emailCheck = await checkEmailAvailability(formData.email);
          if (!emailCheck.available) {
            setErrors(prev => ({ ...prev, email: t('auth.register.errors.email_already_registered', { defaultValue: '该邮箱已被注册' }) }));
            return;
          }
        }
        if (emailPathPhoneNumber) {
          const phoneCheck = await checkPhoneAvailability(emailPathPhoneNumber);
          if (!phoneCheck.available) {
            setErrors(prev => ({ ...prev, phoneNumber: t('auth.register.errors.phone_already_registered', { defaultValue: '该手机号已被注册' }) }));
            return;
          }
        }
      } else {
        if (formData.email) {
          const emailCheck = await checkEmailAvailability(formData.email);
          if (!emailCheck.available) {
            setErrors(prev => ({ ...prev, email: t('auth.register.errors.email_already_registered', { defaultValue: '该邮箱已被注册' }) }));
            return;
          }
        }
      }

      // 导航到Step2，传递Step1的数据
      navigation.navigate('ParentNormalRegisterStep2', {
        step1Data: {
          ...formData,
          verifyMethod: verifyMethod,
          phoneNumber: verifyMethod === 'email' ? emailPathPhoneNumber : undefined,
          areaCode: verifyMethod === 'email' ? emailPathAreaCode : undefined,
        }
      });
    } catch (error) {
      console.warn('手机号检查失败，继续注册:', error);
      navigation.navigate('ParentNormalRegisterStep2', {
        step1Data: {
          ...formData,
          verifyMethod: verifyMethod,
          phoneNumber: verifyMethod === 'email' ? emailPathPhoneNumber : undefined,
          areaCode: verifyMethod === 'email' ? emailPathAreaCode : undefined,
        }
      });
    }
  };

  // 处理邮箱验证路径手机号输入
  const handleEmailPathPhoneChange = useCallback((text: string) => {
    setEmailPathPhoneNumber(text);
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  }, [errors.phoneNumber]);

  // 验证方式选择器
  const renderVerifyMethodSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.verify_method_label')}</Text>
      <View style={styles.studentTypeContainer}>
        <TouchableOpacity
          style={[styles.studentTypeButton, verifyMethod === 'phone' && styles.studentTypeButtonActive]}
          onPress={() => setVerifyMethod('phone')}
        >
          <Text style={[styles.studentTypeButtonText, verifyMethod === 'phone' && styles.studentTypeButtonTextActive]}>
            {t('auth.register.form.verify_phone')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.studentTypeButton, verifyMethod === 'email' && styles.studentTypeButtonActive]}
          onPress={() => setVerifyMethod('email')}
        >
          <Text style={[styles.studentTypeButtonText, verifyMethod === 'email' && styles.studentTypeButtonTextActive]}>
            {t('auth.register.form.verify_email')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 邮箱验证路径：手机号输入（无需验证，仅收集）
  const renderEmailPathPhoneInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.phone_number_label')}</Text>
      <View style={styles.phoneInputWrapper}>
        <TouchableOpacity
          style={styles.areaCodeSelector}
          onPress={() => setShowEmailPathAreaCodeModal(true)}
        >
          <Text style={styles.areaCodeText}>+{emailPathAreaCode}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TextInput
          style={[
            styles.phoneInput,
            errors.phoneNumber && styles.inputError,
          ]}
          placeholder={getPhonePlaceholder(emailPathAreaCode)}
          value={emailPathPhoneNumber}
          onChangeText={handleEmailPathPhoneChange}
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.text.disabled}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
        />
      </View>
      {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
    </View>
  );

  const handleBack = () => {
    navigation.goBack();
  };


  const renderSchoolSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.parent.child_school_label')} *</Text>
      <SchoolSelector
        value={formData.selectedSchoolName}
        selectedId={formData.selectedSchoolId}
        onSelect={handleSchoolSelect}
        placeholder={t('auth.register.parent.child_school_placeholder')}
        error={errors.selectedSchool}
      />
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

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          <View style={styles.formContainer}>
            <Text style={styles.stepTitle}>{t('auth.register.parent.form_title')}</Text>
            <Text style={styles.stepSubtitle}>{t('auth.register.parent.description')}</Text>

            {/* 验证方式选择器 */}
            {renderVerifyMethodSelector()}

            {/* 家长姓名 */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.last_name_label')}</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder={t('auth.register.form.last_name_placeholder')}
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  placeholderTextColor={theme.colors.text.disabled}
                  inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
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
                  inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
            </View>

            {/* 邮箱 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.parent.email_label')}</Text>
              <Text style={styles.helpText}>{t('auth.register.parent.email_help')}</Text>
              <View style={styles.emailInputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                    emailAvailable === true && styles.inputSuccess,
                    emailAvailable === false && styles.inputError
                  ]}
                  placeholder={t('auth.register.parent.email_placeholder')}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={theme.colors.text.disabled}
                  inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                />
                {emailChecking && (
                  <View style={styles.validationIcon}>
                    <LoaderOne size="small" color={theme.colors.primary} />
                  </View>
                )}
                {!emailChecking && emailAvailable === true && (
                  <View style={styles.validationIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  </View>
                )}
                {!emailChecking && emailAvailable === false && (
                  <View style={styles.validationIcon}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.danger} />
                  </View>
                )}
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              {!errors.email && emailAvailable === true && (
                <Text style={styles.successText}>✓ 邮箱可用</Text>
              )}
              {!errors.email && emailAvailable === false && (
                <Text style={styles.errorText}>此邮箱已注册，<Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>去登录</Text></Text>
              )}
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
                autoComplete="off"
                textContentType="none"
                passwordRules=""
                inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
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
                autoComplete="off"
                textContentType="none"
                passwordRules=""
                inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* 性别选择 */}
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

            {/* 孩子学校选择 */}
            {renderSchoolSelector()}

            {/* 手机号输入（仅邮箱验证路径，当前已隐藏） */}
            {/* {verifyMethod === 'email' && renderEmailPathPhoneInput()} */}

            {/* 下一步按钮 */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <LoaderOne color={theme.colors.text.inverse} />
                ) : (
                  <Text style={styles.registerButtonText}>
                    {t('auth.register.form.next_step')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>

      <AreaCodePickerModal
        visible={showEmailPathAreaCodeModal}
        selectedCode={emailPathAreaCode}
        onSelect={setEmailPathAreaCode}
        onClose={() => setShowEmailPathAreaCodeModal(false)}
      />

      <KeyboardDoneAccessory />
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
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow.light],
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
    paddingVertical: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    minHeight: 52,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  inputSuccess: {
    borderColor: theme.colors.success,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  successText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success,
    marginTop: theme.spacing[1],
    fontWeight: theme.typography.fontWeight.medium,
  },
  helpText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  emailInputWrapper: {
    position: 'relative',
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
    fontWeight: theme.typography.fontWeight.medium,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    overflow: 'hidden',
  },
  areaCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.background.tertiary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.primary,
  },
  areaCodeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing[1],
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  verificationContainer: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  verificationInput: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  sendCodeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  sendCodeButtonDisabled: {
    opacity: 0.5,
  },
  sendCodeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.inverse,
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
    borderColor: theme.colors.border.primary,
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
  studentTypeContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  studentTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  studentTypeButtonActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  studentTypeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  studentTypeButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  pickerContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
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
  bottomContainer: {
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[4],
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
}) as any;