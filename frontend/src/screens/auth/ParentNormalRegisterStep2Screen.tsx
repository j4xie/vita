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
} from 'react-native';
import { LoaderOne } from '../../components/ui/LoaderOne';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import {
  ValidationErrors
} from '../../types/registration';
import {
  SchoolData
} from '../../utils/schoolData';
import {
  sendSMSVerificationCode,
  fetchOrganizationList,
  registerUser,
  validatePassword,
  checkUserNameAvailability,
  checkEmailAvailability,
  validatePhoneNumber
} from '../../services/registrationAPI';
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

interface RouteParams {
  step1Data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    sex: '0' | '1' | '2';
    selectedSchool: SchoolData | null;
  };
}

export const ParentNormalRegisterStep2Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();
  
  const { step1Data } = route.params as RouteParams;

  const [loading, setLoading] = useState(false);

  // 区域检测
  const [detectedRegion, setDetectedRegion] = useState<'zh' | 'en'>('zh');

  // 短信验证相关状态
  const [countdown, setCountdown] = useState(0);
  const [bizId, setBizId] = useState<string>('');
  const [smsCodeSent, setSmsCodeSent] = useState(false);

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

    // 验证手机号
    if (!phoneNumber) {
      newErrors.phoneNumber = t('validation.phone_required');
    } else if (!validatePhoneNumber(phoneNumber, areaCode)) {
      newErrors.phoneNumber = areaCode === '86'
        ? t('validation.phone_china_invalid')
        : t('validation.phone_us_invalid');
    }

    // 验证验证码
    if (!verificationCode.trim()) {
      newErrors.verificationCode = t('validation.verification_code_required');
    } else if (!/^\d{6}$/.test(verificationCode)) {
      newErrors.verificationCode = t('validation.verification_code_format');
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

  const handleRegister = async () => {
    if (!validateForm()) return;

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
        '', // 家长没有nickName
        false // 家长
      );

      // 构建普通注册请求数据
      const registrationData = {
        identity: 2, // 家长身份
        userName: step1Data.email, // 使用邮箱作为用户名
        legalName: nameData.legalName, // 使用生成的法定姓名
        nickName: nameData.nickName, // 使用生成的昵称（姓名拼音）
        password: step1Data.password, // 密码从Step1传递
        phonenumber: phoneNumber, // 手机号从本页面
        email: step1Data.email, // 邮箱从Step1传递
        sex: step1Data.sex, // 性别从Step1传递
        deptId: parseInt(step1Data.selectedSchool!.id),
        area: detectedRegion, // 地理检测结果（只读）
        areaCode: areaCode, // 使用本页面选择的区号
        verCode: verificationCode, // 验证码从本页面
        bizId: bizId,
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
            formDataEmail: step1Data.email
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
        
        // 详细的错误处理
        let errorTitle = t('auth.register.errors.register_failed');
        let errorMessage = response.msg || t('auth.register.errors.register_failed_message');
        let suggestions = [];
        
        // 根据错误码和消息提供具体的解决建议
        if (!response.msg) {
          switch (response.code) {
            case 500:
              errorTitle = '🔧 服务器错误';
              errorMessage = '服务器暂时不可用，请稍后重试';
              suggestions = ['✓ 检查网络连接', '✓ 稍后重试', '✓ 联系客服'];
              break;
            case 400:
              errorTitle = '📝 信息格式错误';
              errorMessage = '注册信息格式不正确，请检查后重试';
              suggestions = ['✓ 检查用户名格式(6-20位)', '✓ 检查密码强度', '✓ 确认邮箱格式'];
              break;
            case 409:
              errorTitle = '👥 信息已存在';
              errorMessage = '用户名或邮箱已被使用';
              suggestions = ['✓ 尝试其他用户名', '✓ 检查邮箱是否已注册', '✓ 联系客服找回账户'];
              break;
            default:
              errorMessage = `注册失败 (错误码: ${response.code})`;
              suggestions = ['✓ 稍后重试', '✓ 联系客服'];
          }
        } else {
          // 特殊错误消息处理
          if (errorMessage.includes('注册功能') || errorMessage.includes('暂未开启')) {
            errorTitle = '🚫 服务暂停';
            errorMessage = '注册功能暂未开启';
            suggestions = ['✓ 联系管理员开启', '✓ 使用推荐码注册'];
          } else if (errorMessage.includes('用户名')) {
            errorTitle = '👤 用户名问题';
            errorMessage = '用户名已存在或格式不正确';
            suggestions = ['✓ 尝试其他用户名', '✓ 6-20位字母数字组合'];
          } else if (errorMessage.includes('验证码')) {
            errorTitle = t('auth.register.errors.verification_code_error_title');
            errorMessage = t('auth.register.errors.verification_code_error_message');
            const retrySolutions = t('auth.register.errors.retry_solutions');
            suggestions = Array.isArray(retrySolutions) ? retrySolutions.map((solution: string) => `✓ ${solution}`) : ['✓ 重新获取验证码', '✓ 检查手机号'];
          } else if (errorMessage.includes('邮箱')) {
            errorTitle = '📧 邮箱问题';
            errorMessage = '邮箱格式不正确或已被使用';
            suggestions = ['✓ 检查邮箱格式', '✓ 尝试其他邮箱'];
          }
        }
        
        const fullMessage = errorMessage +
          (suggestions.length > 0 ? '\n\n建议解决方案:\n' + suggestions.join('\n') : '');

        // 🔧 Alert显示前先重置loading，防止Alert关闭时loading卡住
        if (isMountedRef.current) {
          setLoading(false);
        }

        Alert.alert(
          errorTitle,
          fullMessage,
          [
            { text: '重试' },
            { text: t('common.back'), style: 'cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ 注册网络错误:', error);

      // 网络错误的具体处理
      let errorTitle = '🌐 网络错误';
      let errorMessage = '网络连接失败，请检查网络后重试';
      let suggestions = ['✓ 检查WiFi/数据连接', '✓ 重启网络', '✓ 稍后重试'];

      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = 'SSL证书验证失败或网络不可达';
          suggestions = ['✓ 检查网络连接', '✓ 尝试切换网络', '✓ 联系客服'];
        } else if (error.message.includes('timeout') || error.message.includes('超时')) {
          errorMessage = '注册请求超时（30秒无响应），网络不稳定或服务器繁忙';
          suggestions = ['✓ 检查网络连接', '✓ 稍后重试', '✓ 联系客服'];
        } else if (error.message.includes('500')) {
          errorTitle = '🔧 服务器错误';
          errorMessage = '服务器内部错误，请稍后重试';
          suggestions = ['✓ 稍后重试', '✓ 联系客服'];
        }
      }

      const fullMessage = errorMessage + '\n\n解决建议:\n' + suggestions.join('\n');

      // 🔧 Alert显示前先重置loading，防止Alert关闭时loading卡住
      if (isMountedRef.current) {
        setLoading(false);
      }

      Alert.alert(
        errorTitle,
        fullMessage,
        [
          { text: '重试' },
          { text: t('common.back'), style: 'cancel', onPress: () => navigation.goBack() }
        ]
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

            <Text style={styles.stepTitle}>{t('auth.register.form.phone_verification')}</Text>
            <Text style={styles.stepSubtitle}>
              {t('auth.register.form.phone_verification_desc')}
            </Text>

            {/* 手机号输入 */}
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
                  style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
                  placeholder={getPhonePlaceholder(areaCode)}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
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
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxTextNormal}>
                    {t('auth.register.form.terms_checkbox')}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                    <Text style={styles.linkText}> {t('auth.register.terms_of_service')} </Text>
                  </TouchableOpacity>
                  <Text style={styles.checkboxTextNormal}>
                    {t('auth.register.form.and')}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
                    <Text style={styles.linkText}> {t('auth.register.privacy_policy')} </Text>
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
                <Text style={[styles.checkboxTextNormal, { marginLeft: theme.spacing[2] }]}>
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
                  style={[styles.verificationInput, errors.verificationCode && styles.inputError]}
                  placeholder={t('auth.register.form.verification_code_placeholder')}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={theme.colors.text.disabled}
                />
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
            </View>
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
      
      {/* 🔧 成功Modal - 与Web端保持一致的体验 */}
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
    paddingVertical: theme.spacing[4], // 增加垂直内边距
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    minHeight: 52, // 设置最小高度，让输入框更舒适
  },
  inputDisabled: {
    backgroundColor: theme.colors.background.tertiary,
    color: theme.colors.text.disabled,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  inputSuccess: {
    borderColor: theme.colors.success,
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
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginLeft: theme.spacing[2],
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
  checkboxTextNormal: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
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