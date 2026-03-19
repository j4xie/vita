import React, { useState, useEffect, useMemo } from 'react';
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
import {
  validatePhoneNumber,
  sendSMSVerificationCode,
  registerUser
} from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import LiquidSuccessModal from '../../components/modals/LiquidSuccessModal';
import { AreaCodePickerModal, getPhonePlaceholder } from '../../components/common/AreaCodePickerModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  validateTextByLanguage,
  TextType,
  generateBackendNameData,
  createRealtimeValidator
} from '../../utils/textValidation';
import { i18n } from '../../utils/i18n';

interface ParentNormalFormData {
  firstName: string;          // 家长名字
  lastName: string;           // 家长姓氏
  email: string;              // 邮箱（同时作为用户名）
  phoneNumber: string;        // 手机号
  password: string;           // 密码
  confirmPassword: string;    // 确认密码
  sex: '0' | '1' | '2';       // 性别
  selectedSchool: SchoolData | null; // 孩子的学校
  areaCode: '86' | '1';       // 区号
  verificationCode: string;   // 验证码
  // SchoolSelector需要的字段
  selectedSchoolId: string;
  selectedSchoolName: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  selectedSchool?: string;
  verificationCode?: string;
}

export const ParentNormalRegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [bizId, setBizId] = useState<string>('');

  const [formData, setFormData] = useState<ParentNormalFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    sex: '2', // 默认未知
    selectedSchool: null,
    areaCode: '86', // 默认中国
    verificationCode: '',
    // SchoolSelector需要的字段
    selectedSchoolId: '',
    selectedSchoolName: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // 实时验证状态
  const [realtimeErrors, setRealtimeErrors] = useState<ValidationErrors>({});
  
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
  
  // 🔧 成功弹窗状态 - 与其他注册页面保持一致
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAreaCodeModal, setShowAreaCodeModal] = useState(false);



  const updateFormData = <K extends keyof ParentNormalFormData>(
    field: K,
    value: ParentNormalFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  // 处理学校选择
  const handleSchoolSelect = (school: any) => {
    // 构建SchoolData对象以保持兼容性
    const schoolData: SchoolData = {
      id: school.deptId.toString(),
      name: school.deptName,
      abbreviation: school.aprName || school.deptName,
      emailDomain: school.mailDomain || ''
    };

    // 更新相关状态
    setFormData(prev => ({
      ...prev,
      selectedSchool: schoolData,
      selectedSchoolId: school.deptId.toString(),
      selectedSchoolName: school.deptName
    }));

    // 清除学校选择相关错误
    setErrors(prev => ({ ...prev, selectedSchool: undefined }));
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

    // 验证手机号
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t('validation.phone_required');
    } else if (!validatePhoneNumber(formData.phoneNumber, formData.areaCode)) {
      newErrors.phoneNumber = formData.areaCode === '86' 
        ? t('validation.phone_china_invalid')
        : t('validation.phone_us_invalid');
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

    // 验证验证码
    if (!formData.verificationCode.trim()) {
      newErrors.verificationCode = t('validation.verification_code_required');
    } else if (!/^\d{6}$/.test(formData.verificationCode)) {
      newErrors.verificationCode = t('validation.verification_code_format');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendVerificationCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      console.log('🔥 [ParentNormalRegister] Sending verification code, phone:', formData.phoneNumber);
      const response = await sendSMSVerificationCode(formData.phoneNumber, formData.areaCode);
      
      console.log('📱 [ParentNormalRegister] SMS API response:', response);
      
      if (response.code === 'OK' && response.bizId) {
        console.log('✅ [ParentNormalRegister] Verification code sent successfully, bizId:', response.bizId);
        setBizId(response.bizId);
        
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        console.error('❌ [ParentNormalRegister] Failed to send verification code:', response);
      }
    } catch (error) {
      console.error('❌ [ParentNormalRegister] Network error sending verification code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    console.log('🚀 [ParentNormalRegister] Starting normal parent registration process...');

    try {
      // 生成符合需求的家长姓名数据
      const nameData = generateBackendNameData(
        formData.firstName,
        formData.lastName,
        undefined, // 家长无常用名
        false // 非学生
      );

      // 构建家长普通注册请求数据
      const registrationData = {
        identity: 2, // 家长身份
        userName: formData.email, // 邮箱作为用户名
        legalName: nameData.legalName, // 使用生成的法定姓名
        nickName: nameData.nickName, // 使用生成的昵称
        password: formData.password,
        email: formData.email,
        phonenumber: formData.phoneNumber,
        sex: formData.sex,
        deptId: parseInt(formData.selectedSchool!.id),
        areaCode: formData.areaCode,
        area: 'zh', // 默认中国
        verCode: formData.verificationCode,
        bizId: bizId,
      };

      console.log('[ParentNormalRegister] Registration data:', {
        ...registrationData,
        password: '[HIDDEN]'
      });

      const response = await registerUser(registrationData);
      
      if (response.code === 200) {
        console.log('✅ [ParentNormalRegister] Registration successful! Starting auto login...');

        try {
          // 🔧 关键修复：使用与注册API完全相同的userName值
          const registrationUserName = registrationData.userName;
          console.log('🔑 [ParentNormalRegister] Login attempt parameters:', {
            username: registrationUserName,
            password: '[HIDDEN]',
            registrationUserName: registrationData.userName,
            registrationEmail: registrationData.email,
            formDataEmail: formData.email
          });
          
          const loginResult = await login({
            username: registrationUserName, // 使用注册时的实际userName
            password: formData.password,
          });
          
          console.log('📡 [ParentNormalRegister] Login API response:', {
            code: loginResult.code,
            msg: loginResult.msg,
            hasData: !!loginResult.data,
            tokenPreview: loginResult.data?.token?.substring(0, 20) + '...' || 'No token'
          });
          
          if (loginResult.code === 200 && loginResult.data) {
            // 🔧 Web端解决方案：手动保存token到AsyncStorage
            console.log('💾 [ParentNormalRegister] Starting manual token save...');
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());
            
            // 验证token保存
            const savedToken = await AsyncStorage.getItem('@pomelox_token');
            console.log('✅ [ParentNormalRegister] Token save verification:', {
              tokenSaved: !!savedToken,
              tokenMatch: savedToken === loginResult.data.token
            });
            
            await userLogin(loginResult.data.token);
            console.log('✅ [ParentNormalRegister] Auto login successful!');
            
            // 🔧 使用LiquidSuccessModal替代Alert
            setLoading(false);
            setShowSuccessModal(true);
          } else {
            // 登录失败，但注册成功
            console.log('❌ [ParentNormalRegister] Auto login failed, but registration successful:', loginResult);
            setLoading(false);
          }
        } catch (loginError) {
          console.error('❌ [ParentNormalRegister] Auto login failed:', loginError);
          setLoading(false);
        }
      } else {
        console.error('❌ [ParentNormalRegister] Registration failed:', response);
      }
    } catch (error) {
      console.error('❌ [ParentNormalRegister] Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // 🔧 统一的成功Modal处理函数 - 与其他注册页面保持一致
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // 🎯 跳转到Profile页面，与其他注册页面保持一致
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{
          name: 'Main',
          state: {
            routes: [
              { name: 'Explore' },
              { name: 'Community' },
              { name: 'Wellbeing' },
              { name: 'Profile' }
            ],
            index: 3, // Profile标签页的索引
          }
        }],
      })
    );
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
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder={t('auth.register.parent.email_placeholder')}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.text.disabled}
                inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* 手机号 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.parent.phone_label')}</Text>
              <View style={styles.phoneInputWrapper}>
                <TouchableOpacity
                  style={styles.areaCodeSelector}
                  onPress={() => setShowAreaCodeModal(true)}
                >
                  <Text style={styles.areaCodeText}>
                    +{formData.areaCode}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
                  placeholder="13812345678"
                  value={formData.phoneNumber}
                  onChangeText={(text) => updateFormData('phoneNumber', text)}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.text.disabled}
                  inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                />
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>

            {/* 验证码 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.verification_code_label')}</Text>
              <View style={styles.verificationContainer}>
                <TextInput
                  style={[styles.verificationInput, errors.verificationCode && styles.inputError]}
                  placeholder={t('auth.register.form.verification_code_placeholder')}
                  value={formData.verificationCode}
                  onChangeText={(text) => updateFormData('verificationCode', text)}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={theme.colors.text.disabled}
                  inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                />
                <TouchableOpacity
                  style={[styles.sendCodeButton, countdown > 0 && styles.sendCodeButtonDisabled]}
                  onPress={sendVerificationCode}
                  disabled={countdown > 0 || loading}
                >
                  {loading ? (
                    <LoaderOne size="small" color={theme.colors.text.inverse} />
                  ) : (
                    <Text style={styles.sendCodeText}>
                      {countdown > 0
                        ? `${countdown}s`
                        : t('auth.register.form.send_code')
                      }
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {errors.verificationCode && <Text style={styles.errorText}>{errors.verificationCode}</Text>}
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

            {/* 注册按钮 */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <LoaderOne color={theme.colors.text.inverse} />
                ) : (
                  <Text style={styles.registerButtonText}>
                    {t('auth.register.parent.register_button')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
      
      <AreaCodePickerModal
        visible={showAreaCodeModal}
        selectedCode={formData.areaCode}
        onSelect={(code) => updateFormData('areaCode', code)}
        onClose={() => setShowAreaCodeModal(false)}
      />

      {/* 🔧 成功Modal - 与其他注册页面保持一致的体验 */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('auth.register.parent.success_title')}
        message={t('auth.register.parent.success_message')}
        confirmText={t('auth.register.parent.start_using')}
        icon="checkmark-circle"
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
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  helpText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
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