import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import {
  RegistrationStep1Data,
  RegistrationAPIRequest,
  ValidationErrors,
  OrganizationData
} from '../../types/registration';
import {
  sendEmailVerificationCode,
  verifyEmailCode,
  registerUser,
  validatePhoneNumber
} from '../../services/registrationAPI';
import {
  generateBackendNameData,
} from '../../utils/textValidation';
import { i18n } from '../../utils/i18n';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import LiquidSuccessModal from '../../components/modals/LiquidSuccessModal';
import {
  validateEmail,
  validatePhone,
  validateVerificationCode,
  parseApiError
} from '../../utils/formValidation';
import { LoaderOne } from '../../components/ui/LoaderOne';
import { SixDigitCodeInput } from '../../components/auth/SixDigitCodeInput';

interface RouteParams {
  step1Data: RegistrationStep1Data & {
    legalName: string;
    nickName: string;
    password: string;
    confirmPassword: string;
    sex: '0' | '1' | '2';
    selectedOrganization: OrganizationData | null;
  };
  detectedRegion?: 'zh' | 'en';
  detectionResult?: any;
}

export const StudentEmailRegisterStep2Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();

  const {
    step1Data,
    detectedRegion = 'zh',
    detectionResult
  } = route.params as RouteParams;

  const [loading, setLoading] = useState(false);

  // 邮箱验证相关状态
  const [countdown, setCountdown] = useState(0);
  const [bizId, setBizId] = useState<string>('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [backendVerificationCode, setBackendVerificationCode] = useState<string>(''); // 🔑 后端返回的验证码（用于前端对比）

  // 成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 条款同意状态
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // 🔧 防抖：防止重复点击注册按钮
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const SUBMIT_DEBOUNCE_MS = 2000; // 2秒防抖

  // 🔧 组件挂载状态跟踪 - 防止组件卸载后setState
  const isMountedRef = useRef(true);

  // 🔧 请求去重：缓存最近的请求参数
  const lastRequestRef = useRef<string>('');

  // 邮箱和手机号相关
  const [email, setEmail] = useState(step1Data.generatedEmail); // 预填Step1的邮箱
  const [phoneNumber, setPhoneNumber] = useState('');
  const [areaCode, setAreaCode] = useState<'86' | '1'>('86');
  const [verificationCode, setVerificationCode] = useState('');

  // 实时验证状态
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [phoneNumberValid, setPhoneNumberValid] = useState<boolean | null>(null);
  const [verificationCodeValid, setVerificationCodeValid] = useState<boolean | null>(null);

  // 实时验证状态
  const [realtimeErrors, setRealtimeErrors] = useState<ValidationErrors>({});
  const [errors, setErrors] = useState<ValidationErrors>({});

  // 检查是否有任何验证错误 - 使用 useMemo 优化性能
  const hasValidationErrors = useMemo(() => {
    return Object.keys(realtimeErrors).some(key =>
      realtimeErrors[key as keyof ValidationErrors]
    ) || Object.keys(errors).some(key =>
      errors[key as keyof ValidationErrors]
    );
  }, [realtimeErrors, errors]);

  // 🔧 组件挂载状态管理 - 防止组件卸载后setState
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      console.log('🔄 [EmailRegisterStep2] Component unmounted, cleaning up...');
    };
  }, []);

  // 🔧 Loading超时自动重置 - 兜底保护机制
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn('⚠️ [EmailRegisterStep2] Loading timeout after 30s, auto reset');
          setLoading(false);
        }
      }, 30000); // 30秒后自动重置
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // 调试：检查当前系统语言
  useEffect(() => {
    console.log('🌍 [EmailRegisterStep2] Language detection:', {
      currentLanguage: i18n.language,
      detectedRegion: detectedRegion
    });
  }, []);

  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // 实时验证邮箱
  const validateEmailRealtime = (emailInput: string) => {
    if (emailInput.length === 0) {
      setEmailValid(null);
      return;
    }

    const validation = validateEmail(emailInput, t);
    setEmailValid(validation.isValid);
  };

  // 实时验证手机号（仅格式验证，不发验证码）
  const validatePhoneNumberRealtime = (phone: string) => {
    if (phone.length === 0) {
      setPhoneNumberValid(null);
      return;
    }

    const validation = validatePhone(phone, areaCode, t);
    setPhoneNumberValid(validation.isValid);
  };

  // 实时验证验证码
  const validateVerificationCodeRealtime = (code: string) => {
    if (code.length === 0) {
      setVerificationCodeValid(null);
      return;
    }

    const validation = validateVerificationCode(code, t);
    setVerificationCodeValid(validation.isValid);
  };

  // 邮箱输入处理
  const handleEmailChange = (text: string) => {
    setEmail(text);
    validateEmailRealtime(text);

    // 清除可能的错误状态
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  // 手机号输入处理
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    validatePhoneNumberRealtime(text);

    // 清除可能的错误状态
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  };

  // 验证码输入处理
  const handleVerificationCodeChange = (text: string) => {
    setVerificationCode(text);
    validateVerificationCodeRealtime(text);

    // 清除可能的错误状态
    if (errors.verificationCode) {
      setErrors(prev => ({ ...prev, verificationCode: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 验证邮箱
    const emailValidation = validateEmail(email, t);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errorMessage;
    }

    // 验证手机号（格式验证，不验证真实性）
    const phoneValidation = validatePhone(phoneNumber, areaCode, t);
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.errorMessage;
    }

    // 使用新的验证码验证
    const codeValidation = validateVerificationCode(verificationCode, t);
    if (!codeValidation.isValid) {
      newErrors.verificationCode = codeValidation.errorMessage;
    }

    // 验证条款同意
    if (!agreedToTerms) {
      newErrors.terms = t('validation.must_agree_terms');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendVerificationCode = async () => {
    if (countdown > 0) return;

    console.log('🔥 [sendEmailVerificationCode] 开始发送邮箱验证码流程:', {
      email: email,
      agreedToTerms: agreedToTerms
    });

    // 检查条款同意
    if (!agreedToTerms) {
      console.log('❌ [sendEmailVerificationCode] 条款未同意');
      Alert.alert(
        t('common.error'),
        t('auth.register.must_agree_before_send_code')
      );
      return;
    }

    // 验证邮箱
    if (!email) {
      console.log('❌ [sendEmailVerificationCode] 邮箱为空');
      Alert.alert(t('common.error'), t('validation.email_required'));
      return;
    }

    console.log('🔍 [sendEmailVerificationCode] 开始前端验证邮箱');
    const emailValidation = validateEmail(email, t);
    console.log('🔍 [sendEmailVerificationCode] 前端验证结果:', emailValidation.isValid);

    if (!emailValidation.isValid) {
      console.log('❌ [sendEmailVerificationCode] 前端验证失败');
      Alert.alert(
        t('common.error'),
        emailValidation.errorMessage
      );
      return;
    }

    setLoading(true);
    try {
      console.log('🔥 [sendEmailVerificationCode] 前端验证通过，开始调用后端API');
      const response = await sendEmailVerificationCode(email); // 🔑 调用 /email/vercodeEmail 获取验证码（无需token）

      console.log('📧 [sendEmailVerificationCode] 后端Email API响应:', response);

      if (response.code === 'OK' && response.bizId) {
        console.log('✅ [EmailRegisterStep2] Verification code sent successfully:', {
          bizId: response.bizId,
          verificationCode: response.verificationCode,
        });
        setBizId(response.bizId);
        setBackendVerificationCode(response.verificationCode || ''); // 🔑 保存后端返回的验证码
        setEmailCodeSent(true);

        Alert.alert(
          t('auth.register.email_verification.code_sent_title'),
          t('auth.register.email_verification.code_sent_message', {
            email: email
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
      } else {
        console.error('❌ 邮箱验证码发送失败 - 响应异常:', response);
        Alert.alert(
          t('auth.register.email_verification.send_failed_title'),
          `${t('auth.register.email_verification.send_failed_message')}\n错误: ${response.message || '未知错误'}`
        );
      }
    } catch (error) {
      console.error('❌ 发送邮箱验证码网络错误:', error);
      Alert.alert(
        t('auth.register.email_verification.send_failed_title'),
        `网络连接失败，请检查网络设置\n错误: ${(error as Error).message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // 🔑 关键验证：点击"完成注册"时，先对比邮箱验证码
    if (verificationCode !== backendVerificationCode) {
      console.log('❌ [StudentEmailRegisterStep2] 验证码不匹配:', {
        userInput: verificationCode,
        backendCode: backendVerificationCode
      });
      Alert.alert(
        t('common.error'),
        t('auth.register.email_verification.code_incorrect', '邮箱验证码错误，请重新输入')
      );
      return; // 停止注册流程，不调用注册接口
    }

    console.log('✅ [StudentEmailRegisterStep2] 验证码验证通过，继续注册流程');

    // 🔧 防抖：2秒内只能点击一次
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_DEBOUNCE_MS) {
      console.log('⏱️ [EmailRegisterStep2] Debounce: Ignoring duplicate submit');
      return;
    }
    setLastSubmitTime(now);

    setLoading(true);
    console.log('🚀 [EmailRegisterStep2] Starting email verification registration process...');

    try {
      // 生成符合需求的姓名数据
      const nameData = generateBackendNameData(
        step1Data.firstName,
        step1Data.lastName,
        step1Data.nickName, // 常用名从Step1传递
        true // 学生
      );

      // 构建邮箱验证注册请求数据
      const registrationData: RegistrationAPIRequest = {
        userName: email, // 使用邮箱作为用户名
        legalName: nameData.legalName, // 使用生成的法定姓名
        nickName: nameData.nickName, // 使用生成的昵称（常用名+姓氏拼音）
        password: step1Data.password, // 密码从Step1传递
        phonenumber: phoneNumber, // 手机号从本页面（必填，但不验证）
        email: email, // 邮箱从本页面
        sex: step1Data.sex, // 性别从Step1传递
        deptId: parseInt(step1Data.selectedSchool!.id),
        orgId: step1Data.selectedOrganization!.id, // 组织从Step1传递
        area: detectedRegion, // 地理检测结果（只读）
        areaCode: areaCode, // 区号
        verCode: verificationCode, // 邮箱验证码
        bizId: bizId, // 邮件bizId
        isEmailVerify: '1', // 🔑 告知后端这是邮箱验证注册
      };

      // 🔧 请求去重：检测重复请求
      const requestKey = JSON.stringify(registrationData);
      if (lastRequestRef.current === requestKey) {
        console.warn('⚠️ [EmailRegisterStep2] Duplicate request detected, ignoring');
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }
      lastRequestRef.current = requestKey;

      console.log('[EmailRegisterStep2] Sending registration data:', registrationData);

      // 调用真实的注册API
      const response = await registerUser(registrationData);

      console.log('[EmailRegisterStep2] Registration response:', response);

      if (response.code === 200) {
        console.log('✅ [EmailRegisterStep2] Registration successful! Starting auto login process...');

        try {
          const registrationUserName = registrationData.userName;
          console.log('🔑 [EmailRegisterStep2] Login attempt parameters:', {
            username: registrationUserName,
            password: '[HIDDEN]'
          });

          const loginResult = await login({
            username: registrationUserName,
            password: step1Data.password,
          });

          console.log('📡 [EmailRegisterStep2] Login API response:', {
            code: loginResult.code,
            msg: loginResult.msg,
            hasData: !!loginResult.data
          });

          if (loginResult.code === 200 && loginResult.data) {
            console.log('💾 [EmailRegisterStep2] Starting manual token save to AsyncStorage...');
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());

            console.log('🔄 [EmailRegisterStep2] Calling UserContext.login...');
            await userLogin(loginResult.data.token);
            console.log('✅ [EmailRegisterStep2] Auto login successful! UserContext updated');

            if (isMountedRef.current) {
              setLoading(false);
              setShowSuccessModal(true);
            }
          } else {
            if (isMountedRef.current) {
              setLoading(false);
            }
            Alert.alert(
              t('auth.register.success.title'),
              t('auth.register.success.manual_login_message'),
              [{
                text: t('auth.register.success.go_login'),
                onPress: () => navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                )
              }]
            );
          }
        } catch (loginError) {
          console.error('❌ 自动登录失败:', loginError);
          if (isMountedRef.current) {
            setLoading(false);
          }
          Alert.alert(
            t('auth.register.success.title'),
            t('auth.register.success.manual_login_message'),
            [{
              text: t('auth.register.success.go_login'),
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
        console.error('❌ 注册失败，错误码:', response.code, '错误信息:', response.msg);

        const errorInfo = parseApiError(response, 'register', t);
        const buttons: any[] = [{ text: t('common.cancel'), style: 'cancel' }];

        if (errorInfo.actionType === 'login') {
          buttons.push({
            text: errorInfo.action || t('auth.errors.actions.go_to_login'),
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          });
        } else {
          buttons.push({
            text: errorInfo.action || t('auth.errors.actions.retry'),
            onPress: () => setLoading(false)
          });
        }

        buttons.push({
          text: t('common.back'),
          style: 'cancel',
          onPress: () => navigation.goBack()
        });

        if (isMountedRef.current) {
          setLoading(false);
        }

        Alert.alert(
          errorInfo.title,
          `${errorInfo.message}${errorInfo.suggestion ? '\n\n' + errorInfo.suggestion : ''}`,
          buttons
        );
      }
    } catch (error) {
      console.error('❌ 注册网络错误:', error);

      const errorInfo = parseApiError(error, 'register', t);
      const buttons: any[] = [{ text: t('common.cancel'), style: 'cancel' }];

      if (errorInfo.actionType === 'login') {
        buttons.push({
          text: errorInfo.action || t('auth.errors.actions.go_to_login'),
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        });
      } else {
        buttons.push({
          text: errorInfo.action || t('auth.errors.actions.retry')
        });
      }

      buttons.push({
        text: t('common.back'),
        style: 'cancel',
        onPress: () => navigation.goBack()
      });

      if (isMountedRef.current) {
        setLoading(false);
      }

      Alert.alert(
        errorInfo.title,
        `${errorInfo.message}${errorInfo.suggestion ? '\n\n' + errorInfo.suggestion : ''}`,
        buttons
      );
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // 🔧 统一的成功Modal处理函数
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
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>{t('auth.register.form.progress', { current: 2, total: 2 })}</Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
              setShowScrollHint(!isNearBottom && contentSize.height > layoutMeasurement.height + 50);
            }}
            scrollEventThrottle={100}
          >
          <View style={styles.formContainer}>
            {/* 品牌Logo和名称 */}
            <View style={styles.brandContainer}>
              <Image
                source={require('../../../assets/logos/pomelo-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>
                {t('auth.register.form.brand_name')}
              </Text>
            </View>

            <Text style={styles.stepTitle}>{t('auth.register.form.email_verification')}</Text>
            <Text style={styles.stepSubtitle}>
              {t('auth.register.form.email_verification_desc')}
            </Text>

            {/* 邮箱输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.email_label')}</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError,
                  emailValid === true && styles.inputSuccess,
                  emailValid === false && styles.inputWarning
                ]}
                placeholder="test123@berkeley.edu"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.colors.text.disabled}
                returnKeyType="next"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              {!errors.email && email.length > 0 && (
                <Text style={emailValid === true ? styles.successText : styles.hintText}>
                  {emailValid === true
                    ? '✓ 邮箱格式正确，验证码将发送到此邮箱'
                    : t('validation.email_format_error')
                  }
                </Text>
              )}
            </View>

            {/* 手机号输入（必填，不验证） */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.phone_label_for_contact')}</Text>
              <View style={styles.phoneInputWrapper}>
                <TouchableOpacity
                  style={styles.areaCodeSelector}
                  onPress={() => {
                    const newAreaCode = areaCode === '86' ? '1' : '86';
                    setAreaCode(newAreaCode);
                    setPhoneNumber('');
                    setPhoneNumberValid(null);

                    Alert.alert(
                      t('common.success'),
                      newAreaCode === '1'
                        ? t('auth.register.form.switched_to_us_phone')
                        : t('auth.register.form.switched_to_china_phone')
                    );
                  }}
                >
                  <Text style={styles.areaCodeText}>
                    {areaCode === '86' ? '+86' : '+1'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.phoneInput,
                    errors.phoneNumber && styles.inputError,
                    phoneNumberValid === true && styles.inputSuccess,
                    phoneNumberValid === false && styles.inputWarning
                  ]}
                  placeholder={areaCode === '86' ? '13812345678' : '2025550123'}
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.text.disabled}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {phoneNumberValid === true && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.success}
                    style={styles.validationIcon}
                  />
                )}
                {phoneNumberValid === false && (
                  <Ionicons
                    name="warning"
                    size={20}
                    color="#f59e0b"
                    style={styles.validationIcon}
                  />
                )}
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
              <Text style={styles.hintText}>
                {t('auth.register.form.phone_for_contact_only')}
              </Text>
            </View>

            {/* 条款同意 */}
            <View style={styles.termsContainer}>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  style={styles.checkboxTouchable}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <View style={styles.termsTextWrapper}>
                  <Text style={styles.termsText}>{t('auth.register.form.terms_checkbox')}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                    <Text style={styles.linkText}>{t('auth.register.terms_of_service')}</Text>
                  </TouchableOpacity>
                  <Text style={styles.termsText}>{t('auth.register.form.and')}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
                    <Text style={styles.linkText}>{t('auth.register.privacy_policy')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 黄色提示框 */}
              {!agreedToTerms && (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle" size={16} color="#856404" />
                  <Text style={styles.warningText}>
                    {t('auth.register.form.send_code_hint')}
                  </Text>
                </View>
              )}
            </View>

            {/* 发送验证码按钮 */}
            {!emailCodeSent && (
              <View style={styles.sendCodeSection}>
                <TouchableOpacity
                  style={[
                    styles.sendCodeButtonLarge,
                    !agreedToTerms && styles.sendCodeButtonDisabled
                  ]}
                  onPress={sendVerificationCode}
                  disabled={loading || !agreedToTerms}
                >
                  {loading ? (
                    <LoaderOne size="small" color={theme.colors.text.inverse} />
                  ) : (
                    <Text style={styles.sendCodeTextLarge}>
                      {t('auth.register.form.send_email_code')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 6位验证码输入组件 - 发送验证码后显示 */}
            {emailCodeSent && (
              <View style={styles.codeInputContainer}>
                <Text style={styles.codeTitle}>
                  {t('auth.register.email_verification.verify_email')}
                </Text>
                <Text style={styles.codeSubtitle}>
                  {t('auth.register.email_verification.code_sent_to_email', { email })}
                </Text>

                {/* 6位验证码输入框 */}
                <View style={styles.codeContainer}>
                  <TextInput
                    style={[
                      styles.codeInput,
                      errors.verificationCode && styles.inputError,
                      verificationCodeValid === true && styles.inputSuccess
                    ]}
                    placeholder="123456"
                    value={verificationCode}
                    onChangeText={handleVerificationCodeChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={theme.colors.text.disabled}
                    textAlign="center"
                  />
                  {verificationCodeValid === true && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.success}
                      style={styles.validationIcon}
                    />
                  )}
                </View>

                {errors.verificationCode && (
                  <Text style={styles.errorText}>{errors.verificationCode}</Text>
                )}

                {/* 重新发送倒计时 */}
                <View style={styles.resendContainer}>
                  {countdown > 0 ? (
                    <Text style={styles.countdownText}>
                      {t('auth.verification.resend_countdown', { seconds: countdown })}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={sendVerificationCode}>
                      <Text style={styles.resendText}>
                        {t('auth.verification.resend_code')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Register Button - 跟随内容在表单底部 */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  (loading || hasValidationErrors) && styles.registerButtonDisabled
                ]}
                onPress={handleRegister}
                disabled={loading || hasValidationErrors}
              >
                {loading ? (
                  <LoaderOne color={theme.colors.text.inverse} />
                ) : (
                  <Text style={styles.registerButtonText}>
                    {t('auth.register.form.complete_registration')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>

      {/* 浮动滚动提示 */}
      {showScrollHint && (
        <View style={styles.scrollHintContainer}>
          <TouchableOpacity
            style={styles.scrollHintButton}
            onPress={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
              setShowScrollHint(false);
            }}
          >
            <Text style={styles.scrollHintText}>{t('common.scroll_to_submit')}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* 成功Modal */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('auth.register.success.title')}
        message={t('auth.register.success.message')}
        confirmText={t('auth.register.success.start_using')}
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
  inputSuccess: {
    borderColor: theme.colors.success,
  },
  inputWarning: {
    borderColor: '#f59e0b',
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
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
  hintText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
    fontStyle: 'italic',
  },
  // 手机号输入样式
  phoneInputWrapper: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
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
  // 条款同意样式
  termsContainer: {
    marginBottom: theme.spacing[4],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  checkboxTouchable: {
    padding: theme.spacing[1],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9CA3AF', // 深灰色边框，更明显
    backgroundColor: '#FFFFFF', // 白色背景
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsTextWrapper: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: theme.spacing[2],
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  warningText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#856404',
    marginLeft: theme.spacing[2],
    flex: 1,
    lineHeight: 16,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
    paddingTop: theme.spacing[4],
  },
  brandLogo: {
    width: 60,
    height: 60,
    marginBottom: theme.spacing[3],
  },
  brandName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  // 发送验证码大按钮样式
  sendCodeSection: {
    marginBottom: theme.spacing[4],
  },
  sendCodeButtonLarge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  sendCodeButtonDisabled: {
    opacity: 0.5,
  },
  sendCodeTextLarge: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  // 验证码输入区域
  codeInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    marginBottom: theme.spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  codeSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  codeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  resendContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingTop: theme.spacing[6],
    paddingHorizontal: 0,
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
  // 浮动滚动提示样式
  scrollHintContainer: {
    position: 'absolute',
    bottom: 100,
    right: theme.spacing[4],
    zIndex: 1000,
  },
  scrollHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollHintText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing[1],
  },
}) as any;
