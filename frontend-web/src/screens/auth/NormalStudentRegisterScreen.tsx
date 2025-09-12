import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { WebSchoolSelector } from '../../components/web/WebSchoolSelector';
import { WebOrganizationSelector } from '../../components/web/WebOrganizationSelector';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { ForceNativeInput } from '../../components/web/ForceNativeInput';
import { WebTextInput } from '../../components/web/WebTextInput';
import SchoolEmailService, { APISchoolData } from '../../services/schoolEmailService';
import RegionDetectionService, { RegionDetectionResult } from '../../services/RegionDetectionService';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormData {
  userName: string;
  legalName: string;
  englishNickname: string;
  university: string;
  universityId: string;
  email: string;
  emailPrefix: string;
  password: string;
  confirmPassword: string;
  phoneType: 'CN' | 'US';
  phoneNumber: string;
  sex: '0' | '1' | '2';
  organization: string;
  organizationId: string;
  bizId?: string;
  area: 'zh' | 'en';
  verificationCode: string;
}

interface ValidationErrors {
  userName?: string;
  legalName?: string;
  englishNickname?: string;
  university?: string;
  organization?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  verificationCode?: string;
}

export const NormalStudentRegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const { login: userLogin } = useUser();
  
  const SmartTextInput = Platform.OS === 'web' ? ForceNativeInput : WebTextInput;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToSMS, setAgreedToSMS] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [regionDetecting, setRegionDetecting] = useState(false);
  const [regionDetectionResult, setRegionDetectionResult] = useState<RegionDetectionResult | null>(null);
  
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
    sex: '2',
    organization: '',
    organizationId: '',
    area: 'zh',
    verificationCode: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // 自动地域检测
  useEffect(() => {
    detectUserRegion();
  }, []);

  const detectUserRegion = async () => {
    setRegionDetecting(true);
    try {
      console.log('🌍 普通学生注册 - 开始自动地域检测...');
      const result = await RegionDetectionService.detectRegion();
      setRegionDetectionResult(result);
      updateFormData('area', result.region);
      console.log('🎯 地域检测完成:', result);
    } catch (error) {
      console.error('地域检测失败:', error);
      updateFormData('area', 'zh');
    } finally {
      setRegionDetecting(false);
    }
  };

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  };

  const validateStep1 = () => {
    const newErrors: ValidationErrors = {};
    
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

    if (!formData.organization) {
      newErrors.organization = t('validation.organization_required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.email) {
      newErrors.email = t('validation.email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.email_invalid');
    }

    if (!formData.password) {
      newErrors.password = t('validation.password_required');
    } else if (formData.password.length < 6 || formData.password.length > 20) {
      newErrors.password = t('validation.password_length');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.password_mismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: ValidationErrors = {};
    
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

    if (!formData.verificationCode.trim()) {
      newErrors.verificationCode = t('validation.verification_code_required');
    } else if (!/^\d{6}$/.test(formData.verificationCode)) {
      newErrors.verificationCode = t('validation.verification_code_format');
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
        if (isValid) {
          sendVerificationCode(); // 🔧 对标App端：发送验证码并跳转到VerificationScreen
          return;
        }
        break;
    }
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // 🔧 Web端新增：发送验证码并跳转到验证码页面，对标App端流程
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
        
        // 🔧 对标App端：显示成功提示并跳转到独立的VerificationScreen页面
        Alert.alert(
          t('auth.register.sms.code_sent_title'),
          t('auth.register.sms.code_sent_message', {
            countryCode: formData.phoneType === 'CN' ? '86' : '1',
            phoneNumber: formData.phoneNumber
          }),
          [{
            text: t('common.confirm'),
            onPress: () => {
              navigation.navigate('Verification', { 
                formData: {
                  ...formData,
                  bizId: result.bizId
                },
                phoneNumber: formData.phoneNumber,
                phoneType: formData.phoneType 
              });
            }
          }]
        );
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

  const handleRegister = async () => {
    setLoading(true);
    setLoadingMessage(t('auth.register.processing_registration'));

    try {
      // 构建普通学生注册请求数据
      const registrationData = {
        identity: 1, // 学生
        userName: formData.userName,
        legalName: formData.legalName,
        nickName: formData.englishNickname,
        password: formData.password,
        email: formData.email,
        sex: formData.sex,
        deptId: parseInt(formData.universityId),
        phonenumber: formData.phoneNumber,
        verCode: formData.verificationCode,
        bizId: formData.bizId,
        areaCode: '86', // 普通注册只支持中国手机号
        area: formData.area,
      };

      console.log('Web端普通学生注册数据:', registrationData);

      const response = await pomeloXAPI.post('/app/register', registrationData);
      
      if (response.code === 200) {
        console.log('✅ Web端普通学生注册成功！开始自动登录...');
        setLoadingMessage(t('auth.register.auto_login_processing'));
        
        try {
          const formData_login = new URLSearchParams();
          formData_login.append('username', formData.userName);
          formData_login.append('password', formData.password);
          
          const loginResponse = await fetch('https://www.vitaglobal.icu/app/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData_login.toString(),
          });
          
          const loginResult = await loginResponse.json();
          
          if (loginResult.code === 200 && loginResult.data) {
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());
            
            await userLogin(loginResult.data.token);
            console.log('✅ Web端普通学生账户自动登录成功！');
            
            setLoading(false);
            setShowSuccessModal(true);
          } else {
            throw new Error('Login failed');
          }
        } catch (loginError) {
          console.error('❌ Web端自动登录失败:', loginError);
          Alert.alert(
            '✅ ' + t('auth.register.success_title'),
            t('auth.register.success_please_login'),
            [{
              text: t('auth.register.go_login'),
              onPress: () => navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              )
            }]
          );
        }
      } else {
        Alert.alert(
          '❌ ' + t('auth.register.error_title'),
          response.msg || t('auth.register.error_message')
        );
      }
    } catch (error) {
      console.error('❌ Web端普通学生注册网络错误:', error);
      Alert.alert(
        '🌐 ' + t('common.network_error'),
        t('auth.register.error_message')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
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

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.username_label')}</Text>
        <SmartTextInput
          style={[styles.input, errors.userName && styles.inputError]}
          placeholder={t('auth.register.form.username_placeholder')}
          value={formData.userName}
          onChangeText={(text) => updateFormData('userName', text)}
          placeholderTextColor={theme.colors.text.disabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.legal_name_label')}</Text>
        <SmartTextInput
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
        <SmartTextInput
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
        <WebSchoolSelector
          schools={[]} // 需要加载学校数据
          selectedSchool={formData.university ? {id: formData.universityId, name: formData.university, domain: ''} : null}
          onSchoolSelect={(school) => {
            updateFormData('university', school.name);
            updateFormData('universityId', school.id);
          }}
          placeholder={t('auth.register.form.university_placeholder')}
          error={!!errors.university}
        />
        {errors.university && <Text style={styles.errorText}>{errors.university}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.organization_label')}</Text>
        <WebOrganizationSelector
          value={formData.organization}
          selectedId={formData.organizationId}
          onSelect={(organization) => {
            updateFormData('organization', organization.name);
            updateFormData('organizationId', organization.id.toString());
          }}
          placeholder={t('auth.register.form.organization_placeholder')}
          error={errors.organization}
        />
        {errors.organization && <Text style={styles.errorText}>{errors.organization}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.register.form.account_setup')}</Text>
      <Text style={styles.stepSubtitle}>{t('auth.register.form.step2_description')}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.email_label')}</Text>
        {SchoolEmailService.getEmailDomainByName(formData.university) ? (
          <View style={styles.emailInputWrapper}>
            <SmartTextInput
              style={[styles.emailPrefixInput, errors.email && styles.inputError]}
              placeholder="your-username"
              value={formData.emailPrefix}
              onChangeText={(text) => {
                updateFormData('emailPrefix', text);
                updateFormData('email', `${text}@${SchoolEmailService.getEmailDomainByName(formData.university)}`);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={theme.colors.text.disabled}
            />
            <Text style={styles.emailDomain}>@{SchoolEmailService.getEmailDomainByName(formData.university)}</Text>
          </View>
        ) : (
          <SmartTextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder={t('auth.register.form.email_placeholder')}
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={theme.colors.text.disabled}
          />
        )}
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.password_label')}</Text>
        <SmartTextInput
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
        <SmartTextInput
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
        <SmartTextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder={t('auth.register.form.phone_placeholder')}
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData('phoneNumber', text)}
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.text.disabled}
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.verification_code_label')}</Text>
        <View style={styles.verificationContainer}>
          <SmartTextInput
            style={[styles.verificationInput, errors.verificationCode && styles.inputError]}
            placeholder={t('auth.register.form.verification_code_placeholder')}
            value={formData.verificationCode}
            onChangeText={(text) => updateFormData('verificationCode', text)}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor={theme.colors.text.disabled}
          />
          <TouchableOpacity
            style={[styles.sendCodeButton, countdown > 0 && styles.sendCodeButtonDisabled]}
            onPress={sendVerificationCode}
            disabled={countdown > 0 || loading}
          >
            <Text style={styles.sendCodeText}>
              {countdown > 0 ? `${countdown}s` : t('auth.register.sms.send_code')}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.verificationCode && <Text style={styles.errorText}>{errors.verificationCode}</Text>}
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
          <Text style={styles.headerTitle}>{t('auth.register.form.register')}</Text>
          <View style={styles.headerRight} />
        </View>

        {renderProgressBar()}

        <Pressable onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              {renderStepContent()}
              
              {/* 下一步/注册按钮 */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.nextButton, loading && styles.nextButtonDisabled]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color={theme.colors.text.inverse} />
                      {loadingMessage && (
                        <Text style={styles.loadingText}>{loadingMessage}</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.nextButtonText}>
                      {currentStep === 3 ? t('auth.register.form.register') : t('common.next')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </View>

      {/* 注册成功弹窗 */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('auth.register.success_title')}
        message={t('auth.register.success_message')}
        confirmText={t('common.confirm')}
        icon="checkmark-circle"
      />
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
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 2,
    marginBottom: theme.spacing[2],
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
  stepContainer: {
    marginBottom: theme.spacing[6],
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
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  emailPrefixInput: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  emailDomain: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing[3],
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
  phoneTypeContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  phoneTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
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
    borderColor: 'transparent',
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
  buttonContainer: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[6],
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.inverse,
  },
});