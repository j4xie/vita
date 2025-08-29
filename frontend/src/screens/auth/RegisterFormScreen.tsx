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
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { SchoolSelector } from '../../components/common/SchoolSelector';
import { OrganizationSelector } from '../../components/common/OrganizationSelector';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { TermsModal } from '../../components/modals/TermsModal';

// 学校名称到邮箱域名的映射表
const SCHOOL_EMAIL_DOMAINS: Record<string, string> = {
  'UC Berkeley': 'berkeley.edu',
  'UC Santa Cruz': 'ucsc.edu',  
  'U Southern California': 'usc.edu',
  'UC Los Angeles': 'ucla.edu',
  'UC Irvine': 'uci.edu',
  'UC San Diego': 'ucsd.edu',
  'U of Minnesota Twin Cities': 'umn.edu',
  'University of Washington': 'uw.edu',
  'U Berklee Music': 'berklee.edu',
  'UC Santa Barbara': 'ucsb.edu',
  'UC Davis': 'ucdavis.edu',
};

interface FormData {
  userName: string;
  legalName: string;
  englishNickname: string;
  university: string;
  universityId: string;
  email: string;
  emailPrefix: string; // 邮箱前缀部分
  password: string;
  confirmPassword: string;
  phoneType: 'CN' | 'US';
  phoneNumber: string;
  sex: '0' | '1' | '2'; // 0-男，1-女，2-未知
  referralCode?: string;
  organization: string; // 组织名称
  organizationId: string; // 组织ID
  bizId?: string; // SMS验证码接口返回的字段
  privacyConsent: boolean; // 隐私协议同意状态
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
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy'>('terms');
  
  const [formData, setFormData] = useState<FormData>({
    userName: '',
    legalName: '',
    englishNickname: '',
    university: '',
    universityId: '',
    email: '',
    emailPrefix: '',
    password: '',
    confirmPassword: '',
    phoneType: 'CN',
    phoneNumber: '',
    sex: '2', // 默认未知
    referralCode: referralCode || '',
    organization: '',
    organizationId: '',
    bizId: '',
    privacyConsent: true, // 用户从RegisterChoice页面来时已经同意了隐私协议
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
    
    if (!formData.userName) {
      newErrors.userName = t('validation.username_required');
    } else if (formData.userName.length < 6 || formData.userName.length > 20) {
      newErrors.userName = t('validation.username_length');
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.userName)) {
      newErrors.userName = t('validation.username_format');
    }
    
    if (!formData.legalName) {
      newErrors.legalName = t('validation.legal_name_required');
    } else if (formData.legalName.length > 50) {
      newErrors.legalName = t('validation.legal_name_length');
    }
    
    if (!formData.englishNickname) {
      newErrors.englishNickname = t('validation.english_nickname_required');
    } else if (formData.englishNickname.length > 50) {
      newErrors.englishNickname = t('validation.english_nickname_length');
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
    } else {
      const domain = SCHOOL_EMAIL_DOMAINS[formData.university];
      if (domain) {
        // 对于有固定域名的学校，验证前缀是否为空
        if (!formData.emailPrefix) {
          newErrors.email = t('validation.email_required');
        } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.emailPrefix)) {
          newErrors.email = t('validation.email_prefix_invalid');
        }
      } else {
        // 对于没有固定域名的学校，验证完整邮箱格式
        if (!formData.email.includes('@') || !formData.email.includes('.edu')) {
          newErrors.email = t('validation.email_school_invalid');
        }
      }
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.password_required');
    } else if (formData.password.length < 6 || formData.password.length > 20) {
      newErrors.password = t('validation.password_length_6_20');
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
        // 第3步：根据是否有推荐码决定流程
        if (hasReferralCode) {
          completeRegistration();
        } else {
          sendVerificationCode();
        }
      }
    }
  };

  const handleSkip = () => {
    // 重置导航栈，避免页面叠加问题
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  const sendVerificationCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const phoneNumber = formData.phoneType === 'CN' 
        ? `86${formData.phoneNumber}` // SMS API需要86前缀
        : `1${formData.phoneNumber}`;
      
      // 调用发送验证码API
      const result = await pomeloXAPI.sendSMSVerification(phoneNumber);
      
      if (result.code === 'OK' && result.bizId) {
        // 保存bizId到表单数据
        updateFormData('bizId', result.bizId);
        
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
          formData: {
            ...formData,
            bizId: result.bizId
          },
          phoneNumber: formData.phoneNumber,
          phoneType: formData.phoneType 
        });
      } else {
        Alert.alert(t('auth.register.sms.send_failed_title'), t('auth.register.sms.send_failed_message'));
      }
    } catch (error) {
      console.error('发送验证码错误:', error);
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

  // 根据学校更新邮箱域名
  const handleSchoolSelect = (school: any) => {
    updateFormData('university', school.deptName);
    updateFormData('universityId', school.deptId.toString());
    
    // 清空之前的邮箱数据
    updateFormData('emailPrefix', '');
    updateFormData('email', '');
  };

  // 处理邮箱前缀输入
  const handleEmailPrefixChange = (prefix: string) => {
    updateFormData('emailPrefix', prefix);
    
    const domain = SCHOOL_EMAIL_DOMAINS[formData.university];
    if (domain && prefix) {
      updateFormData('email', `${prefix}@${domain}`);
    } else {
      updateFormData('email', prefix);
    }
  };

  // 处理条款和隐私政策点击
  const handleTermsPress = (type: 'terms' | 'privacy') => {
    setTermsModalType(type);
    setTermsModalVisible(true);
  };

  // 解析注册错误为用户友好提示
  const parseRegistrationError = (errorMsg: string): string => {
    if (errorMsg.includes('phonenumber')) return t('validation.phone_format_error');
    if (errorMsg.includes('email')) return t('validation.email_format_error');
    if (errorMsg.includes('userName')) return t('validation.username_already_exists');
    if (errorMsg.includes('Duplicate entry')) return t('validation.duplicate_registration');
    if (errorMsg.includes('too long')) return t('validation.field_too_long');
    if (errorMsg.includes('constraint')) return t('validation.data_constraint_error');
    return t('auth.register.error_message');
  };

  // 完成注册（推荐码用户）
  const completeRegistration = async () => {
    setLoading(true);
    try {
      const phoneNumber = formData.phoneType === 'CN' 
        ? formData.phoneNumber // 中国手机号直接使用11位格式
        : `1${formData.phoneNumber}`; // 美国号码保持+1前缀

      const registrationData = {
        userName: formData.userName,
        legalName: formData.legalName,
        nickName: formData.englishNickname,
        password: formData.password,
        phonenumber: phoneNumber,
        email: formData.email,
        sex: formData.sex,
        deptId: formData.universityId,
        orgId: formData.organizationId,
        invCode: formData.referralCode,
      };

      const result = await pomeloXAPI.register(registrationData);
      
      if (result.code === 200) {
        Alert.alert(
          t('auth.register.success_title'),
          t('auth.register.success_message'),
          [{
            text: t('common.confirm'),
            onPress: () => navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })
            )
          }]
        );
      } else {
        const friendlyError = parseRegistrationError(result.msg || '');
        Alert.alert(t('auth.register.error_title'), friendlyError);
      }
    } catch (error) {
      console.error('注册失败:', error);
      const friendlyError = parseRegistrationError(error.message || '');
      Alert.alert(t('auth.register.error_title'), friendlyError);
    } finally {
      setLoading(false);
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

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
        <Text style={styles.label}>{t('auth.register.form.username_label')}</Text>
        <TextInput
          style={[styles.input, errors.userName && styles.inputError]}
          placeholder={t('auth.register.form.username_placeholder')}
          value={formData.userName}
          onChangeText={(text) => updateFormData('userName', text)}
          placeholderTextColor={theme.colors.text.disabled}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={false}
          textContentType="username"
          autoComplete="username-new"
        />
        {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.legal_name_label')}</Text>
        <TextInput
          style={[styles.input, errors.legalName && styles.inputError]}
          placeholder={t('auth.register.form.legal_name_placeholder')}
          value={formData.legalName}
          onChangeText={(text) => updateFormData('legalName', text)}
          placeholderTextColor={theme.colors.text.disabled}
          secureTextEntry={false}
          textContentType="name"
          autoComplete="name"
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
          secureTextEntry={false}
          textContentType="nickname"
          autoComplete="off"
        />
        {errors.englishNickname && <Text style={styles.errorText}>{errors.englishNickname}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.university_label')}</Text>
        <SchoolSelector
          value={formData.university}
          selectedId={formData.universityId}
          onSelect={handleSchoolSelect}
          placeholder={t('auth.register.form.university_placeholder')}
          error={errors.university}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.register.form.account_setup')}</Text>
      <Text style={styles.stepSubtitle}>{t('auth.register.form.step2_description')}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.email_label')}</Text>
        {SCHOOL_EMAIL_DOMAINS[formData.university] ? (
          <View style={styles.emailInputWrapper}>
            <TextInput
              style={[styles.emailPrefixInput, errors.email && styles.inputError]}
              placeholder="your-username"
              value={formData.emailPrefix}
              onChangeText={handleEmailPrefixChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={theme.colors.text.disabled}
              textContentType="emailAddress"
              autoComplete="email"
            />
            <Text style={styles.emailDomain}>@{SCHOOL_EMAIL_DOMAINS[formData.university]}</Text>
          </View>
        ) : (
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="example@university.edu"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={theme.colors.text.disabled}
            textContentType="emailAddress"
            autoComplete="email"
          />
        )}
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
          onPress={() => {
            Alert.alert(
              t('auth.register.form.us_phone_not_supported_title'),
              `${t('auth.register.form.us_phone_not_supported_message')}\n\n${t('auth.register.form.us_phone_contact_info')}`,
              [{ text: t('common.confirm'), style: 'default' }]
            );
          }}
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

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.organization_label')}</Text>
        <OrganizationSelector
          value={formData.organization}
          selectedId={formData.organizationId}
          onSelect={(organization) => {
            updateFormData('organization', organization.name);
            updateFormData('organizationId', organization.id.toString());
          }}
          placeholder={t('auth.register.form.organization_placeholder')}
          error={errors.organization}
        />
      </View>

      <View style={styles.termsContainer}>
        <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)}>
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && (
              <Ionicons name="checkmark" size={16} color={theme.colors.text.inverse} />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.termsTextContainer}>
          <Text style={styles.termsText}>
            {t('auth.register.form.terms_checkbox')}
            <TouchableOpacity onPress={() => handleTermsPress('terms')}>
              <Text style={styles.termsLink}> {t('auth.register.terms_of_service')} </Text>
            </TouchableOpacity>
            {t('auth.register.and')}
            <TouchableOpacity onPress={() => handleTermsPress('privacy')}>
              <Text style={styles.termsLink}> {t('auth.register.privacy_policy')}</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
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
          <View style={styles.formContainer}>
            {renderStepContent()}
          </View>
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
                {currentStep === 3 
                  ? (hasReferralCode ? t('auth.register.form.complete_registration') : t('auth.register.form.send_code'))
                  : t('auth.register.form.next_step')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <TermsModal
        visible={termsModalVisible}
        type={termsModalType}
        onClose={() => setTermsModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    borderBottomColor: theme.colors.border.primary,
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
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light,
  },
  skipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
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
  formContainer: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    padding: theme.spacing.lg,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
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
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingRight: theme.spacing[4],
  },
  emailPrefixInput: {
    flex: 0,
    minWidth: 120,
    maxWidth: 180,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  emailDomain: {
    paddingLeft: theme.spacing[1],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    backgroundColor: 'transparent',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing[2],
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: theme.spacing[2],
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
  genderContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing[2],
  },
  genderButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginHorizontal: theme.spacing[1],
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
    padding: theme.spacing[6],
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
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