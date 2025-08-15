import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface FormData {
  legalName: string;
  englishNickname: string;
  university: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneType: 'CN' | 'US';
  phoneNumber: string;
  referralCode?: string;
}

export const RegisterFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  
  const referralCode = route.params?.referralCode;
  const hasReferralCode = route.params?.hasReferralCode ?? !!referralCode;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    legalName: '',
    englishNickname: '',
    university: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneType: 'CN',
    phoneNumber: '',
    referralCode: referralCode || '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  };

  const validateStep1 = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.legalName) {
      newErrors.legalName = t('validation.legal_name_required');
    }
    
    if (!formData.englishNickname) {
      newErrors.englishNickname = t('validation.english_nickname_required');
    }
    
    if (!formData.university) {
      newErrors.university = t('validation.university_required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.email) {
      newErrors.email = t('validation.email_required');
    } else if (!formData.email.includes('@') || !formData.email.includes('.edu')) {
      newErrors.email = t('validation.email_school_invalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.password_required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('validation.password_min_length_8');
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.password_mismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t('validation.phone_required');
    } else {
      const phoneRegex = formData.phoneType === 'CN' 
        ? /^1[3-9]\d{9}$/
        : /^\d{10}$/;
      
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = formData.phoneType === 'CN' 
          ? t('validation.phone_china_invalid')
          : t('validation.phone_usa_invalid');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }
    
    if (isValid) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        sendVerificationCode();
      }
    }
  };

  const handleSkip = () => {
    navigation.navigate('Main');
  };

  const sendVerificationCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      // TODO: 调用发送验证码API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        t('auth.register.sms.code_sent_title'),
        t('auth.register.sms.code_sent_message', {
          countryCode: formData.phoneType === 'CN' ? '86' : '1',
          phoneNumber: formData.phoneNumber
        })
      );
      
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
      
      navigation.navigate('Verification', { 
        formData,
        phoneNumber: formData.phoneNumber,
        phoneType: formData.phoneType 
      });
    } catch (error) {
      Alert.alert(t('auth.register.sms.send_failed_title'), t('auth.register.sms.send_failed_message'));
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{t('auth.register.form.progress', { current: currentStep, total: 3 })}</Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.register.form.basic_info')}</Text>
      <Text style={styles.stepSubtitle}>{t('auth.register.form.basic_info_desc')}</Text>

      {hasReferralCode && (
        <View style={styles.referralBadge}>
          <Ionicons name="gift" size={20} color={theme.colors.primary} />
          <Text style={styles.referralText}>{t('auth.register.form.referral_code', { code: formData.referralCode })}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.legal_name_label')}</Text>
        <TextInput
          style={[styles.input, errors.legalName && styles.inputError]}
          placeholder={t('auth.register.form.legal_name_placeholder')}
          value={formData.legalName}
          onChangeText={(text) => updateFormData('legalName', text)}
          placeholderTextColor={theme.colors.text.disabled}
        />
        {errors.legalName && <Text style={styles.errorText}>{errors.legalName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.english_nickname_label')}</Text>
        <TextInput
          style={[styles.input, errors.englishNickname && styles.inputError]}
          placeholder={t('auth.register.form.english_nickname_placeholder')}
          value={formData.englishNickname}
          onChangeText={(text) => updateFormData('englishNickname', text)}
          placeholderTextColor={theme.colors.text.disabled}
        />
        {errors.englishNickname && <Text style={styles.errorText}>{errors.englishNickname}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.university_label')}</Text>
        <TextInput
          style={[styles.input, errors.university && styles.inputError]}
          placeholder={t('auth.register.form.university_placeholder')}
          value={formData.university}
          onChangeText={(text) => updateFormData('university', text)}
          placeholderTextColor={theme.colors.text.disabled}
        />
        {errors.university && <Text style={styles.errorText}>{errors.university}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.register.form.account_setup')}</Text>
      <Text style={styles.stepSubtitle}>设置您的登录账号和密码</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.email_label')}</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="example@university.edu"
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={theme.colors.text.disabled}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

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
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.register.form.contact_info')}</Text>
      <Text style={styles.stepSubtitle}>{t('auth.register.form.contact_info_desc')}</Text>

      <View style={styles.phoneTypeContainer}>
        <TouchableOpacity
          style={[styles.phoneTypeButton, formData.phoneType === 'CN' && styles.phoneTypeActive]}
          onPress={() => updateFormData('phoneType', 'CN')}
        >
          <Text style={[styles.phoneTypeText, formData.phoneType === 'CN' && styles.phoneTypeTextActive]}>
            {t('auth.register.form.phone_china')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.phoneTypeButton, formData.phoneType === 'US' && styles.phoneTypeActive]}
          onPress={() => updateFormData('phoneType', 'US')}
        >
          <Text style={[styles.phoneTypeText, formData.phoneType === 'US' && styles.phoneTypeTextActive]}>
            {t('auth.register.form.phone_usa')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.phone_label')}</Text>
        <View style={styles.phoneInputWrapper}>
          <Text style={styles.phonePrefix}>
            +{formData.phoneType === 'CN' ? '86' : '1'}
          </Text>
          <TextInput
            style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
            placeholder={formData.phoneType === 'CN' ? '13812345678' : '2025551234'}
            value={formData.phoneNumber}
            onChangeText={(text) => updateFormData('phoneNumber', text)}
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.text.disabled}
          />
        </View>
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>

      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
          {agreedToTerms && (
            <Ionicons name="checkmark" size={16} color={theme.colors.text.inverse} />
          )}
        </View>
        <Text style={styles.termsText}>
          {t('auth.register.form.terms_checkbox')}
          <Text style={styles.termsLink}> 服务条款 </Text>
          和
          <Text style={styles.termsLink}> 隐私政策</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('auth.register.form.register')}</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('auth.login.skip')}</Text>
          </TouchableOpacity>
        </View>

        {renderProgressBar()}

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              loading && styles.nextButtonDisabled,
              currentStep === 3 && !agreedToTerms && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={loading || (currentStep === 3 && !agreedToTerms)}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? t('auth.register.form.send_code') : t('auth.register.form.next_step')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  skipButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    minWidth: 40,
    alignItems: 'center',
  },
  skipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border.secondary,
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
  },
  stepContainer: {
    paddingVertical: theme.spacing[4],
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
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  phoneTypeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing[4],
  },
  phoneTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginHorizontal: theme.spacing[1],
  },
  phoneTypeActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  phoneTypeText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  phoneTypeTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.medium,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
  },
  phonePrefix: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing[2],
  },
  phoneInput: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[2],
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bottomContainer: {
    padding: theme.spacing[6],
    backgroundColor: theme.colors.text.inverse,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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