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
  Modal,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../../components/common/KeyboardDismissWrapper';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import {
  RegistrationStep1Data,
  RegistrationStep2Data,
  RegistrationFormData,
  RegistrationAPIRequest,
  ValidationErrors,
  OrganizationData
} from '../../types/registration';
import {
  sendSMSVerificationCode,
  fetchOrganizationList,
  registerUser,
  validatePassword,
  checkUserNameAvailability,
  checkEmailAvailability,
  validatePhoneNumber
} from '../../services/registrationAPI';
import emailAPI from '../../services/emailAPI';
import {
  validateTextByLanguage,
  TextType,
  generateBackendNameData,
  createRealtimeValidator,
  getInputPlaceholder
} from '../../utils/textValidation';
import { i18n } from '../../utils/i18n';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import LiquidSuccessModal from '../../components/modals/LiquidSuccessModal';
import { AreaCodePickerModal, getPhonePlaceholder } from '../../components/common/AreaCodePickerModal';
import {
  validateEmail,
  validatePassword as validatePasswordNew,
  validatePhone,
  validateUsername,
  validateVerificationCode,
  parseApiError
} from '../../utils/formValidation';
import { LoaderOne } from '../../components/ui/LoaderOne';

interface RouteParams {
  step1Data: RegistrationStep1Data & {
    legalName: string;
    nickName: string;
    password: string;
    confirmPassword: string;
    sex: '0' | '1' | '2';
    selectedOrganization: OrganizationData | null;
    verifyMethod?: 'phone' | 'email';
    phoneNumber?: string;
    areaCode?: '86' | '1';
  };
  detectedRegion?: 'zh' | 'en';
  detectionResult?: any;
}

export const StudentNormalRegisterStep2Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();
  
  const {
    step1Data,
    detectedRegion = 'zh',
    detectionResult
  } = route.params as RouteParams;

  // 验证方式：默认 'phone' 保持向后兼容
  const verifyMethod = step1Data.verifyMethod ?? 'phone';

  const [loading, setLoading] = useState(false);

  // 验证码相关状态（手机和邮箱共用）
  const [countdown, setCountdown] = useState(0);
  const [bizId, setBizId] = useState<string>('');
  const [smsCodeSent, setSmsCodeSent] = useState(false);

  // 邮箱验证相关状态
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCodeValid, setEmailCodeValid] = useState<boolean | null>(null);
  const [emailExpectedCode, setEmailExpectedCode] = useState<string>(''); // 后端返回的正确验证码

  // 成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 条款同意状态
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToSMS, setAgreedToSMS] = useState(false);

  // 🔧 防抖：防止重复点击注册按钮
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const SUBMIT_DEBOUNCE_MS = 2000; // 2秒防抖

  // 🔧 组件挂载状态跟踪 - 防止组件卸载后setState
  const isMountedRef = useRef(true);

  // 🔧 请求去重：缓存最近的请求参数
  const lastRequestRef = useRef<string>('');

  // 手机号相关
  const [phoneNumber, setPhoneNumber] = useState('');
  const [areaCode, setAreaCode] = useState<'86' | '1'>('86');
  const [showAreaCodeModal, setShowAreaCodeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // 实时验证状态
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
      console.log('🔄 [RegisterStep2] Component unmounted, cleaning up...');
    };
  }, []);

  // 🔧 Loading超时自动重置 - 兜底保护机制
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn('⚠️ [RegisterStep2] Loading timeout after 30s, auto reset');
          setLoading(false);
        }
      }, 30000); // 30秒后自动重置
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // 调试：检查当前系统语言
  useEffect(() => {
    console.log('🌍 [RegisterStep2] Language detection:', {
      currentLanguage: i18n.language,
      detectedRegion: detectedRegion
    });
  }, []);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // 实时验证手机号
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

  // 实时验证功能暂时禁用，跳过重复检查约束
  // 等后端接口完善后再启用
  
  // // 实时用户名验证（防抖）
  // useEffect(() => {
  //   if (!formData.userName || formData.userName.length < 6) {
  //     setUserNameAvailable(null);
  //     return;
  //   }

  //   const timer = setTimeout(async () => {
  //     setUserNameChecking(true);
  //     try {
  //       const result = await checkUserNameAvailability(formData.userName);
  //       setUserNameAvailable(result.available);
  //       if (!result.available && result.message) {
  //         setErrors(prev => ({ ...prev, userName: result.message }));
  //       }
  //     } catch (error) {
  //       console.error('用户名验证失败:', error);
  //     } finally {
  //       setUserNameChecking(false);
  //     }
  //   }, 1000); // 1秒防抖

  //   return () => clearTimeout(timer);
  // }, [formData.userName]);

  // // 实时邮箱验证（防抖）
  // useEffect(() => {
  //   if (!formData.email || !formData.email.includes('@')) {
  //     setEmailAvailable(null);
  //     return;
  //   }

  //   const timer = setTimeout(async () => {
  //     setEmailChecking(true);
  //     try {
  //       const result = await checkEmailAvailability(formData.email);
  //       setEmailAvailable(result.available);
  //       if (!result.available && result.message) {
  //         setErrors(prev => ({ ...prev, email: result.message }));
  //       }
  //     } catch (error) {
  //       console.error('邮箱验证失败:', error);
  //     } finally {
  //       setEmailChecking(false);
  //     }
  //   }, 1000); // 1秒防抖

  //   return () => clearTimeout(timer);
  // }, [formData.email]);


  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (verifyMethod === 'phone') {
      // 手机验证路径：验证手机号和验证码
      const phoneValidation = validatePhone(phoneNumber, areaCode, t);
      if (!phoneValidation.isValid) {
        newErrors.phoneNumber = phoneValidation.errorMessage;
      }

      const codeValidation = validateVerificationCode(verificationCode, t);
      if (!codeValidation.isValid) {
        newErrors.verificationCode = codeValidation.errorMessage;
      }
    } else {
      // 邮箱验证路径：验证邮箱验证码
      const codeValidation = validateVerificationCode(emailVerificationCode, t);
      if (!codeValidation.isValid) {
        newErrors.verificationCode = codeValidation.errorMessage;
      }
    }

    // 验证条款同意
    if (!agreedToTerms) {
      newErrors.terms = t('validation.must_agree_terms');
    }
    if (!agreedToSMS) {
      newErrors.sms = t('validation.must_agree_sms');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendVerificationCode = async () => {
    if (countdown > 0) return;

    console.log('🔥 [sendVerificationCode] 开始发送验证码流程:', {
      phoneNumber: phoneNumber,
      areaCode: areaCode,
      agreedToTerms: agreedToTerms,
      agreedToSMS: agreedToSMS
    });

    // 检查条款同意
    if (!agreedToTerms || !agreedToSMS) {
      console.log('❌ [sendVerificationCode] 条款未同意');
      Alert.alert(
        t('common.error'),
        t('auth.register.must_agree_before_send_code')
      );
      return;
    }

    // 验证手机号
    if (!phoneNumber) {
      console.log('❌ [sendVerificationCode] 手机号为空');
      Alert.alert(t('common.error'), t('validation.phone_required'));
      return;
    }

    console.log('🔍 [sendVerificationCode] 开始前端验证手机号');
    const isValid = validatePhoneNumber(phoneNumber, areaCode);
    console.log('🔍 [sendVerificationCode] 前端验证结果:', isValid);

    if (!isValid) {
      console.log('❌ [sendVerificationCode] 前端验证失败');
      Alert.alert(
        t('common.error'),
        areaCode === '86' ? t('validation.phone_china_invalid') : t('validation.phone_us_invalid')
      );
      return;
    }

    setLoading(true);
    try {
      console.log('🔥 [sendVerificationCode] 前端验证通过，开始调用后端API');
      const response = await sendSMSVerificationCode(phoneNumber, areaCode);

      console.log('📱 [sendVerificationCode] 后端SMS API响应:', response);
      
      if (response.code === 'OK' && response.bizId) {
        console.log('✅ [RegisterStep2] Verification code sent successfully, bizId:', response.bizId);
        setBizId(response.bizId);
        setSmsCodeSent(true);
        
        Alert.alert(
          t('auth.register.sms.code_sent_title'),
          t('auth.register.sms.code_sent_message', {
            countryCode: areaCode,
            phoneNumber: phoneNumber
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
        console.error('❌ 验证码发送失败 - 响应异常:', response);
        Alert.alert(
          t('auth.register.sms.send_failed_title'), 
          `${t('auth.register.sms.send_failed_message')}\n错误: ${response.message || '未知错误'}`
        );
      }
    } catch (error) {
      console.error('❌ 发送验证码网络错误:', error);
      Alert.alert(
        t('auth.register.sms.send_failed_title'), 
        `网络连接失败，请检查网络设置\n错误: ${(error as Error).message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // 邮箱验证码输入处理
  const handleEmailVerificationCodeChange = (text: string) => {
    setEmailVerificationCode(text);
    if (errors.verificationCode) {
      setErrors(prev => ({ ...prev, verificationCode: undefined }));
    }
    // 实时验证：格式检查 + 与后端返回的验证码比对
    if (text.length === 0) {
      setEmailCodeValid(null);
    } else if (!/^\d{6}$/.test(text)) {
      setEmailCodeValid(false);
    } else if (emailExpectedCode) {
      setEmailCodeValid(text === emailExpectedCode);
    } else {
      setEmailCodeValid(true); // 没有期望值时仅做格式校验
    }
  };

  // 发送邮箱验证码
  const sendEmailVerificationCode = async () => {
    if (countdown > 0) return;

    if (!agreedToTerms || !agreedToSMS) {
      Alert.alert(t('common.error'), t('auth.register.must_agree_before_send_code'));
      return;
    }

    const email = step1Data.generatedEmail;
    if (!email) {
      Alert.alert(t('common.error'), t('validation.email_required'));
      return;
    }

    setLoading(true);
    try {
      const response = await emailAPI.sendEmailVercode(email);
      console.log('📧 [sendEmailVerificationCode] Response:', response);

      if (response.errorCode === 0 && response.message === 'OK') {
        setEmailCodeSent(true);
        // 保存后端返回的验证码，用于前端校验
        if (response.code) {
          setEmailExpectedCode(String(response.code));
        }
        Alert.alert(
          t('auth.register.email.code_sent_title'),
          t('auth.register.email.code_sent_message', { email })
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
        Alert.alert(
          t('auth.register.email.send_failed_title'),
          t('auth.register.email.send_failed_message')
        );
      }
    } catch (error) {
      console.error('❌ 发送邮箱验证码失败:', error);
      Alert.alert(
        t('auth.register.email.send_failed_title'),
        `${t('auth.register.email.send_failed_message')}\n${(error as Error).message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // 邮箱验证码前端校验
    if (verifyMethod === 'email' && emailExpectedCode && emailVerificationCode !== emailExpectedCode) {
      Alert.alert(t('common.error'), t('auth.register.email.code_mismatch', { defaultValue: '验证码不正确，请重新输入' }));
      return;
    }

    // 🔧 防抖：2秒内只能点击一次
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_DEBOUNCE_MS) {
      console.log('⏱️ [RegisterStep2] Debounce: Ignoring duplicate submit');
      return;
    }
    setLastSubmitTime(now);

    setLoading(true);
    console.log('🚀 [RegisterStep2] Starting registration process...');

    // 注册处理中（不显示弹窗，避免多个弹窗）

    try {
      // 生成符合需求的姓名数据
      const nameData = generateBackendNameData(
        step1Data.firstName,
        step1Data.lastName,
        step1Data.nickName, // 常用名从Step1传递
        true // 学生
      );

      // 构建普通注册请求数据
      const registrationData: RegistrationAPIRequest = {
        userName: step1Data.generatedEmail, // 使用邮箱作为用户名
        legalName: nameData.legalName, // 使用生成的法定姓名
        nickName: nameData.nickName, // 使用生成的昵称（常用名+姓氏拼音）
        password: step1Data.password, // 密码从Step1传递
        phonenumber: verifyMethod === 'phone' ? phoneNumber : (step1Data.phoneNumber ?? ''),
        email: step1Data.generatedEmail, // 邮箱从Step1传递
        sex: step1Data.sex, // 性别从Step1传递
        deptId: parseInt(step1Data.selectedSchool!.id),
        orgId: step1Data.selectedOrganization!.id, // 组织从Step1传递
        area: detectedRegion, // 地理检测结果（只读）
        areaCode: verifyMethod === 'phone' ? areaCode : (step1Data.areaCode ?? '86'),
        // 手机验证传 SMS 验证码；邮箱验证传邮箱验证码
        ...(verifyMethod === 'phone'
          ? { verCode: verificationCode, bizId: bizId }
          : { verCode: emailVerificationCode, isEmailVerify: 1 }),
      };

      // 🔧 请求去重：检测重复请求
      const requestKey = JSON.stringify(registrationData);
      if (lastRequestRef.current === requestKey) {
        console.warn('⚠️ [RegisterStep2] Duplicate request detected, ignoring');
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }
      lastRequestRef.current = requestKey;

      console.log('[RegisterStep2] Sending registration data:', registrationData); // Debug info

      // 调用真实的注册API
      const response = await registerUser(registrationData);
      
      console.log('[RegisterStep2] Registration response:', response); // Debug info
      
      if (response.code === 200) {
        console.log('✅ [RegisterStep2] Registration successful! Starting auto login process...');
        
        try {
          // 🔧 关键修复：使用与注册API完全相同的userName值
          const registrationUserName = registrationData.userName; // 使用实际发送给后端的userName
          console.log('🔑 [RegisterStep2] Login attempt parameters:', {
            username: registrationUserName,
            password: '[HIDDEN]',
            registrationUserName: registrationData.userName,
            registrationEmail: registrationData.email,
            step1GeneratedEmail: step1Data.generatedEmail
          });
          
          const loginResult = await login({
            username: registrationUserName, // 使用注册时的实际userName
            password: step1Data.password, // 使用Step1的密码
          });
          
          console.log('📡 [RegisterStep2] Login API response:', {
            code: loginResult.code,
            msg: loginResult.msg,
            hasData: !!loginResult.data,
            tokenPreview: loginResult.data?.token?.substring(0, 20) + '...' || 'No token'
          });
          
          if (loginResult.code === 200 && loginResult.data) {
            // 🔧 Web端解决方案：手动保存token到AsyncStorage
            console.log('💾 [RegisterStep2] Starting manual token save to AsyncStorage...');
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());
            
            // 验证token是否正确保存
            const savedToken = await AsyncStorage.getItem('@pomelox_token');
            const savedUserId = await AsyncStorage.getItem('@pomelox_user_id');
            console.log('✅ [RegisterStep2] Token save verification:', {
              tokenSaved: !!savedToken,
              userIdSaved: !!savedUserId,
              tokenMatch: savedToken === loginResult.data.token,
              userIdMatch: savedUserId === loginResult.data.userId.toString()
            });
            
            // 然后调用UserContext的login方法
            console.log('🔄 [RegisterStep2] Calling UserContext.login...');
            await userLogin(loginResult.data.token);
            console.log('✅ [RegisterStep2] Auto login successful! UserContext updated');
            
            // 🔧 使用LiquidSuccessModal替代Alert
            if (isMountedRef.current) {
              setLoading(false);
              setShowSuccessModal(true);
            }
          } else {
            // 登录失败，但注册成功
            console.log('❌ [RegisterStep2] Auto login failed, but registration successful:', loginResult);
            // 🔧 Alert显示前先重置loading，防止Alert关闭时loading卡住
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
          // 🔧 Alert显示前先重置loading，防止Alert关闭时loading卡住
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

        // 🔧 使用新的API错误解析
        const errorInfo = parseApiError(response, 'register', t);

        const buttons: any[] = [
          { text: t('common.cancel'), style: 'cancel' }
        ];

        // 根据错误类型添加不同的按钮
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

        // 🔧 Alert显示前先重置loading，防止Alert关闭时loading卡住
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

      // 🔧 使用新的API错误解析
      const errorInfo = parseApiError(error, 'register', t);

      const buttons: any[] = [
        { text: t('common.cancel'), style: 'cancel' }
      ];

      // 根据错误类型添加不同的按钮
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

      // 🔧 Alert显示前先重置loading，防止Alert关闭时loading卡住
      if (isMountedRef.current) {
        setLoading(false);
      }

      Alert.alert(
        errorInfo.title,
        `${errorInfo.message}${errorInfo.suggestion ? '\n\n' + errorInfo.suggestion : ''}`,
        buttons
      );
    } finally {
      // 🔧 Finally块兜底：确保loading总能重置
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
    // 🎯 跳转到Profile页面，与Web端保持一致
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

            <Text style={styles.stepTitle}>
              {verifyMethod === 'email'
                ? t('auth.register.form.email_verification')
                : t('auth.register.form.phone_verification')
              }
            </Text>
            <Text style={styles.stepSubtitle}>
              {verifyMethod === 'email'
                ? t('auth.register.form.email_verification_desc')
                : t('auth.register.form.phone_verification_desc')
              }
            </Text>

            {verifyMethod === 'email' ? (
              /* 邮箱验证路径：邮箱显示 */
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.form.your_email')}</Text>
                <View style={styles.emailConfirmContainer}>
                  <Ionicons name="mail" size={20} color={theme.colors.primary} style={styles.emailConfirmIcon} />
                  <Text style={styles.emailConfirmValue}>{step1Data.generatedEmail}</Text>
                </View>
                <View style={styles.emailConfirmNotice}>
                  <Ionicons name="information-circle-outline" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.emailConfirmNoticeText}>
                    {t('auth.register.form.email_confirm_notice')}
                  </Text>
                </View>
              </View>
            ) : (
              /* 手机验证路径：手机号输入 */
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.form.phone_label')}</Text>
                <View style={styles.phoneInputWrapper}>
                  <TouchableOpacity
                    style={styles.areaCodeSelector}
                    onPress={() => setShowAreaCodeModal(true)}
                  >
                    <Text style={styles.areaCodeText}>
                      +{areaCode}
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
                    placeholder={getPhonePlaceholder(areaCode)}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.colors.text.disabled}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
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
                {!errors.phoneNumber && phoneNumber.length > 0 && (
                  <Text style={phoneNumberValid === true ? styles.successText : styles.hintText}>
                    {phoneNumberValid === true
                      ? t('auth.errors.form_validation.phone_valid')
                      : t('auth.errors.form_validation.phone_format_hint_cn')
                    }
                  </Text>
                )}
                {phoneNumber.length === 0 && (
                  <Text style={styles.hintText}>
                    {t('auth.errors.form_validation.phone_example_cn')}
                  </Text>
                )}
              </View>
            )}

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

              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  onPress={() => setAgreedToSMS(!agreedToSMS)}
                  style={styles.checkboxTouchable}
                >
                  <View style={[styles.checkbox, agreedToSMS && styles.checkboxChecked]}>
                    {agreedToSMS && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.smsText}>
                  {t('auth.register.form.agree_sms')}
                </Text>
              </View>

              {/* 黄色提示框 */}
              {(!agreedToTerms || !agreedToSMS) && (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle" size={16} color="#856404" />
                  <Text style={styles.warningText}>
                    {t('auth.register.form.send_code_hint')}
                  </Text>
                </View>
              )}
            </View>

            {/* 邮箱验证码输入 - 条款同意之后 */}
            {verifyMethod === 'email' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.form.verification_code_label')}</Text>
                <View style={styles.verificationContainer}>
                  <TextInput
                    style={[
                      styles.verificationInput,
                      errors.verificationCode && styles.inputError,
                      emailCodeValid === true && styles.inputSuccess,
                      emailCodeValid === false && styles.inputWarning
                    ]}
                    placeholder={t('auth.register.form.verification_code_placeholder')}
                    value={emailVerificationCode}
                    onChangeText={handleEmailVerificationCodeChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={theme.colors.text.disabled}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                  />
                  {emailCodeValid === true && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} style={styles.validationIconCode} />
                  )}
                  {emailCodeValid === false && (
                    <Ionicons name="warning" size={20} color="#f59e0b" style={styles.validationIconCode} />
                  )}
                  <TouchableOpacity
                    style={[
                      styles.sendCodeButton,
                      (countdown > 0 || !agreedToTerms || !agreedToSMS) && styles.sendCodeButtonDisabled
                    ]}
                    onPress={sendEmailVerificationCode}
                    disabled={countdown > 0 || loading || !agreedToTerms || !agreedToSMS}
                  >
                    {loading ? (
                      <LoaderOne size="small" color={theme.colors.text.inverse} />
                    ) : (
                      <Text style={styles.sendCodeText}>
                        {countdown > 0 ? `${countdown}s` : t('auth.register.form.send_code')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                {errors.verificationCode && <Text style={styles.errorText}>{errors.verificationCode}</Text>}
                {!errors.verificationCode && emailVerificationCode.length > 0 && (
                  <Text style={emailCodeValid === true ? styles.successText : emailCodeValid === false ? styles.errorText : styles.hintText}>
                    {emailCodeValid === true
                      ? t('auth.register.email.code_correct', { defaultValue: '验证码正确' })
                      : emailCodeValid === false
                        ? t('auth.register.email.code_incorrect', { defaultValue: '验证码不正确，请检查邮箱' })
                        : t('auth.register.email.code_format_hint', { defaultValue: '请输入6位数字验证码' })
                    }
                  </Text>
                )}
              </View>
            )}

            {verifyMethod === 'phone' && (
              <>
                {/* 短信服务条款 */}
                <View style={styles.smsTermsContainer}>
                  <Text style={styles.smsTermsText}>
                    {t('auth.register.form.sms_terms_notice')}
                  </Text>
                </View>

                {/* 验证码输入 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.register.form.verification_code_label')}</Text>
                  <View style={styles.verificationContainer}>
                    <TextInput
                      style={[
                        styles.verificationInput,
                        errors.verificationCode && styles.inputError,
                        verificationCodeValid === true && styles.inputSuccess,
                        verificationCodeValid === false && styles.inputWarning
                      ]}
                      placeholder={t('auth.register.form.verification_code_placeholder')}
                      value={verificationCode}
                      onChangeText={handleVerificationCodeChange}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholderTextColor={theme.colors.text.disabled}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                    />
                    {verificationCodeValid === true && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.success}
                        style={styles.validationIconCode}
                      />
                    )}
                    {verificationCodeValid === false && (
                      <Ionicons
                        name="warning"
                        size={20}
                        color="#f59e0b"
                        style={styles.validationIconCode}
                      />
                    )}
                    <TouchableOpacity
                      style={[
                        styles.sendCodeButton,
                        (countdown > 0 || !agreedToTerms || !agreedToSMS) && styles.sendCodeButtonDisabled
                      ]}
                      onPress={sendVerificationCode}
                      disabled={countdown > 0 || loading || !agreedToTerms || !agreedToSMS}
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
                  {!errors.verificationCode && verificationCode.length > 0 && (
                    <Text style={verificationCodeValid === true ? styles.successText : styles.hintText}>
                      {verificationCodeValid === true
                        ? t('auth.errors.form_validation.verification_code_valid')
                        : t('auth.errors.form_validation.verification_code_format_hint')
                      }
                    </Text>
                  )}
                  {verificationCode.length === 0 && (
                    <Text style={styles.hintText}>
                      {t('auth.errors.form_validation.verification_code_example')}
                    </Text>
                  )}
                </View>
              </>
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
      
      {/* 🔧 成功Modal */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('auth.register.success.title')}
        message={t('auth.register.success.message')}
        confirmText={t('auth.register.success.start_using')}
        icon="checkmark-circle"
      />

      <AreaCodePickerModal
        visible={showAreaCodeModal}
        selectedCode={areaCode}
        onSelect={setAreaCode}
        onClose={() => setShowAreaCodeModal(false)}
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
    paddingBottom: theme.spacing[6], // 正常底部间距，按钮在ScrollView内部
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
    borderColor: theme.colors.border.primary,
    minHeight: 52,
  },
  inputDisabled: {
    backgroundColor: theme.colors.background.tertiary,
    color: theme.colors.text.disabled,
  },
  emailConfirmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    gap: theme.spacing[3],
  },
  emailConfirmIcon: {
    flexShrink: 0,
  },
  emailConfirmValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  emailConfirmNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
  },
  emailConfirmNoticeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
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
  inputWithValidation: {
    position: 'relative',
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
  helpText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
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
  validationIconCode: {
    position: 'absolute',
    right: 80, // 为发送验证码按钮留出空间
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  organizationSelector: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: 48,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text.disabled,
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
  bottomContainer: {
    paddingTop: theme.spacing[6],
    paddingHorizontal: 0, // 已经在scrollContent中设置
    paddingBottom: theme.spacing[4], // 表单底部留白
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
  // Modal样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '30',
  },
  organizationItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  organizationItemText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  organizationItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[2],
    flex: 1,
    lineHeight: theme.typography.fontSize.sm * 1.4,
  },
  // 手机号输入样式
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
    padding: theme.spacing[1], // 增加点击区域
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginLeft: theme.spacing[2],
    alignItems: 'center',
  },
  termsTextWrapper: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: theme.spacing[2],
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  termsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  smsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginLeft: theme.spacing[2],
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
  smsTermsContainer: {
    marginBottom: theme.spacing[4],
    paddingHorizontal: theme.spacing[2],
  },
  smsTermsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 16,
    textAlign: 'left',
  },
}) as any;