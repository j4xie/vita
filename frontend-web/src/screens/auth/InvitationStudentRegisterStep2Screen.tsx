import React, { useState, useEffect, useRef } from 'react';
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
import { ForceNativeInput } from '../../components/web/ForceNativeInput';
import { WebTextInput } from '../../components/web/WebTextInput';
import { WebOrganizationSelector } from '../../components/web/WebOrganizationSelector';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from '../../components/web/WebLinearGradient';

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
  checkEmailAvailability
} from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RouteParams {
  step1Data: RegistrationStep1Data & { legalName: string };
  referralCode?: string;
  hasReferralCode?: boolean;
  registrationType?: 'phone' | 'invitation';
  detectedRegion?: 'zh' | 'en';
  detectionResult?: any;
}

export const InvitationStudentRegisterStep2Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();

  // 智能输入组件选择器 - Web环境使用ForceNativeInput，保证输入正常工作
  const SmartTextInput = Platform.OS === 'web' ? ForceNativeInput : WebTextInput;
  
  const { 
    step1Data, 
    referralCode, 
    hasReferralCode = false, 
    registrationType = 'phone',
    detectedRegion = 'zh',
    detectionResult
  } = route.params as RouteParams;

  const [loading, setLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [bizId, setBizId] = useState<string>('');
  // Modal removed - using dropdown selector instead
  
  // 实时验证状态
  const [userNameChecking, setUserNameChecking] = useState(false);
  const [userNameAvailable, setUserNameAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  
  // 成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [formData, setFormData] = useState<RegistrationStep2Data>({
    email: step1Data.generatedEmail,
    userName: '',
    nickName: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    selectedOrganization: null,
    sex: '2', // 默认未知
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // 加载组织列表
  useEffect(() => {
    loadOrganizations();
  }, []);

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

  const loadOrganizations = async () => {
    try {
      setOrganizationsLoading(true);
      const response = await fetchOrganizationList();
      
      if (response.code === 200 && response.data) {
        setOrganizations(response.data);
      } else {
        Alert.alert(t('common.error'), t('auth.register.errors.organization_load_failed'));
      }
    } catch (error) {
      console.error('加载组织列表失败:', error);
      Alert.alert(t('common.error'), t('auth.register.errors.organization_load_failed'));
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const updateFormData = <K extends keyof RegistrationStep2Data>(
    field: K, 
    value: RegistrationStep2Data[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 验证邮箱（作为用户名）
    if (!formData.email.trim()) {
      newErrors.email = t('validation.email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.email_invalid');
    }

    // 验证昵称
    if (!formData.nickName.trim()) {
      newErrors.nickName = t('validation.nickname_required');
    } else if (formData.nickName.length > 50) {
      newErrors.nickName = t('validation.nickname_length');
    }

    // 验证密码
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    // 验证确认密码
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.password_mismatch');
    }

    // 验证验证码（暂时跳过，因为短信服务未配置）
    // if (!formData.verificationCode.trim()) {
    //   newErrors.verificationCode = t('validation.verification_code_required');
    // } else if (!/^\d{6}$/.test(formData.verificationCode)) {
    //   newErrors.verificationCode = t('validation.verification_code_format');
    // }

    // 验证组织选择
    if (!formData.selectedOrganization) {
      newErrors.selectedOrganization = t('validation.organization_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendVerificationCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      console.log('🔥 开始发送验证码，手机号:', step1Data.phoneNumber, '区号:', step1Data.areaCode);
      
      // 格式化手机号：区号+手机号
      const fullPhoneNumber = step1Data.areaCode === '86' 
        ? step1Data.phoneNumber // 中国手机号直接使用
        : `${step1Data.areaCode}${step1Data.phoneNumber}`; // 其他区号需要加前缀
      
      const response = await sendSMSVerificationCode(fullPhoneNumber, step1Data.areaCode);
      
      console.log('📱 短信接口响应:', response);
      
      if (response.code === 'OK' && response.bizId) {
        console.log('✅ 验证码发送成功, bizId:', response.bizId);
        setBizId(response.bizId);
        setSmsCodeSent(true);
        
        Alert.alert(
          t('auth.register.sms.code_sent_title'),
          t('auth.register.sms.code_sent_message', {
            countryCode: step1Data.areaCode,
            phoneNumber: step1Data.phoneNumber
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
        `${t('auth.register.errors.network_connection_failed')}\n错误: ${(error as Error).message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    console.log('🚀 开始注册流程...');
    
    // 显示进度提示
    Alert.alert(
      t('auth.register.errors.registration_progress'),
      t('auth.register.errors.registration_progress_message'),
      [],
      { cancelable: false }
    );
    
    try {
      // 构建注册请求数据 - 根据注册类型决定字段
      let registrationData: RegistrationAPIRequest;

      if (registrationType === 'invitation') {
        // ②邀请码注册：手机号和邮箱可填可不填，verCode不填
        registrationData = {
          identity: 1, // 学生身份
          userName: formData.email, // 使用邮箱作为用户名
          legalName: step1Data.legalName,
          nickName: formData.nickName,
          password: formData.password,
          email: formData.email, // 邮箱必填
          sex: formData.sex,
          deptId: parseInt(step1Data.selectedSchool!.id),
          orgId: formData.selectedOrganization!.id,
          invCode: referralCode!, // 邀请码注册必须有invCode
          area: detectedRegion, // 地理检测结果（只读）
          areaCode: detectedRegion === 'zh' ? '86' : '1', // 根据检测地区设置区号
          // 可选字段
          ...(step1Data.phoneNumber && { phonenumber: step1Data.phoneNumber }),
          // 不包含 verCode 和 bizId
        };
      } else {
        // ①手机验证码注册：invCode不填
        registrationData = {
          identity: 1, // 学生身份
          userName: formData.email, // 使用邮箱作为用户名
          legalName: step1Data.legalName,
          nickName: formData.nickName,
          password: formData.password,
          phonenumber: step1Data.phoneNumber, // 手机号必填
          email: formData.email, // 邮箱必填
          sex: formData.sex,
          deptId: parseInt(step1Data.selectedSchool!.id),
          orgId: formData.selectedOrganization!.id,
          area: detectedRegion, // 地理检测结果（只读）
          areaCode: step1Data.areaCode, // 使用用户选择的区号
          // 手机验证码注册必需字段
          verCode: formData.verificationCode,
          bizId: bizId,
          // 不包含 invCode
        };
      }

      console.log('发送注册数据:', registrationData); // 调试信息

      // 调用真实的注册API
      const response = await registerUser(registrationData);
      
      console.log('注册响应:', response); // 调试信息
      
      if (response.code === 200) {
        console.log('✅ 注册成功！开始自动登录流程...');
        
        // 显示登录进度
        Alert.alert(
          '🔐 ' + t('auth.register.auto_login_title'),
          t('auth.register.auto_login_message'),
          [],
          { cancelable: false }
        );
        
        // 注册成功后自动登录
        try {
          console.log('开始自动登录，邮箱用户名:', formData.email);
          console.log('API Base URL:', process.env.EXPO_PUBLIC_API_URL);
          
          // 使用真实的登录API，直接调用https://www.vitaglobal.icu/app/login
          const formData_login = new URLSearchParams();
          formData_login.append('username', formData.email);
          formData_login.append('password', formData.password);
          
          const loginResponse = await fetch('https://www.vitaglobal.icu/app/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData_login.toString(),
          });
          
          const loginResult = await loginResponse.json();
          
          console.log('登录响应:', loginResult);
          console.log('登录响应详情:', {
            code: loginResult.code,
            hasData: !!loginResult.data,
            dataKeys: loginResult.data ? Object.keys(loginResult.data) : [],
          });
          
          if (loginResult.code === 200 && loginResult.data) {
            // 手动保存token和userId到正确的存储位置
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());
            
            console.log('✅ Token已保存到本地存储');
            
            // 登录成功，更新用户状态
            console.log('🔐 开始调用userLogin，token:', loginResult.data.token?.substring(0, 20) + '...');
            await userLogin(loginResult.data.token);
            console.log('✅ 自动登录成功！');
            
            // 显示成功信息并自动跳转
            console.log('🎉 注册和登录都成功！正在显示成功Alert...');
            
            // 显示成功弹窗而不是Alert
            setLoading(false);
            setShowSuccessModal(true);
          } else {
            console.warn('⚠️ 自动登录失败，但注册成功');
            // 登录失败，但注册成功
            Alert.alert(
              '✅ ' + t('auth.register.success.title'),
              t('auth.register.success.account_created', { username: formData.userName }),
              [{
                text: t('common.go_login'),
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
          // 登录失败，但注册成功
          Alert.alert(
            '✅ ' + t('auth.register.success.title'),
            t('auth.register.success.account_created', { username: formData.userName }),
            [{
              text: t('common.go_login'),
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

        // 先关闭进度对话框
        Alert.alert('');

        // 详细的错误处理
        let errorTitle = t('auth.register.errors.registration_failed_title');
        let errorMessage = response.msg || t('auth.register.errors.register_failed_message');
        let suggestions = [];

        // 根据错误消息和错误码提供具体的解决建议
        // 首先检查具体的错误消息
        if (response.msg) {
          // 检查是否是邮箱或手机号已注册
          if (response.msg.includes('邮箱已被注册') || response.msg.includes('email already registered') ||
              response.msg.includes('Email already exists') || response.msg.includes('该邮箱已存在')) {
            errorTitle = t('auth.register.errors.email_already_registered_title');
            errorMessage = t('auth.register.errors.email_already_registered_message');
            suggestions = [
              `✓ ${t('auth.register.errors.suggestions.use_different_email')}`,
              `✓ ${t('auth.register.errors.suggestions.try_login_instead')}`,
              `✓ ${t('auth.register.errors.suggestions.reset_password')}`
            ];
          } else if (response.msg.includes('手机号已被注册') || response.msg.includes('phone number already registered') ||
                     response.msg.includes('Phone already exists') || response.msg.includes('该手机号已存在')) {
            errorTitle = t('auth.register.errors.phone_already_registered_title');
            errorMessage = t('auth.register.errors.phone_already_registered_message');
            suggestions = [
              `✓ ${t('auth.register.errors.suggestions.use_different_phone')}`,
              `✓ ${t('auth.register.errors.suggestions.try_login_instead')}`,
              `✓ ${t('auth.register.errors.suggestions.contact_support')}`
            ];
          } else if (response.msg.includes('用户名已存在') || response.msg.includes('username already exists') ||
                     response.msg.includes('Username taken')) {
            errorTitle = t('auth.register.errors.username_already_exists_title');
            errorMessage = t('auth.register.errors.username_already_exists_message');
            suggestions = [
              `✓ ${t('auth.register.errors.suggestions.try_different_username')}`,
              `✓ ${t('auth.register.errors.suggestions.use_different_email')}`,
              `✓ ${t('auth.register.errors.suggestions.try_login_instead')}`
            ];
          }
        }

        // 如果没有匹配的特定错误消息，则根据错误码处理
        if (!response.msg || suggestions.length === 0) {
          switch (response.code) {
            case 500:
              errorTitle = t('auth.register.errors.server_error_title');
              errorMessage = t('auth.register.errors.server_temporarily_unavailable');
              suggestions = [`✓ ${t('auth.register.errors.suggestions.check_network')}`, `✓ ${t('auth.register.errors.suggestions.retry_later')}`, `✓ ${t('auth.register.errors.suggestions.contact_support')}`];
              break;
            case 400:
              errorTitle = t('auth.register.errors.error_titles.information_format_error');
              errorMessage = t('auth.register.errors.registration_data_invalid');
              suggestions = [`✓ ${t('auth.register.errors.suggestions.check_username_format')}`, `✓ ${t('auth.register.errors.suggestions.check_password_strength')}`, `✓ ${t('auth.register.errors.suggestions.check_email_format')}`];
              break;
            case 409:
              errorTitle = t('auth.register.errors.error_titles.information_exists');
              errorMessage = t('auth.register.errors.username_or_email_exists');
              suggestions = [`✓ ${t('auth.register.errors.suggestions.try_different_username')}`, `✓ ${t('auth.register.errors.suggestions.check_registered_email')}`, `✓ ${t('auth.register.errors.suggestions.contact_support_account')}`];
              break;
            default:
              errorMessage = t('auth.register.errors.error_messages.registration_failed_generic', { code: response.code });
              suggestions = [`✓ ${t('auth.register.errors.suggestions.retry_later')}`, `✓ ${t('auth.register.errors.suggestions.contact_support')}`];
          }
        } else {
          // 特殊错误消息处理
          if (errorMessage.includes('注册功能') || errorMessage.includes('暂未开启')) {
            errorTitle = t('auth.register.errors.error_titles.service_suspended');
            errorMessage = t('auth.register.errors.error_messages.service_suspended');
            suggestions = [`✓ ${t('auth.register.errors.suggestions.contact_admin_enable')}`, `✓ ${t('auth.register.errors.suggestions.use_referral_code')}`];
          } else if (errorMessage.includes('用户名')) {
            errorTitle = t('auth.register.errors.error_titles.username_problem');
            errorMessage = t('auth.register.errors.error_messages.username_issue');
            suggestions = [`✓ ${t('auth.register.errors.suggestions.try_different_username')}`, `✓ ${t('auth.register.errors.suggestions.check_username_format')}`];
          } else if (errorMessage.includes('验证码')) {
            errorTitle = t('auth.register.errors.error_titles.verification_code_error');
            errorMessage = t('auth.register.errors.error_messages.verification_code_error');
            suggestions = [`✓ ${t('auth.register.errors.suggestions.get_new_code')}`, `✓ ${t('auth.register.errors.suggestions.check_sms')}`];
          } else if (errorMessage.includes('邮箱')) {
            errorTitle = t('auth.register.errors.error_titles.email_problem');
            errorMessage = t('auth.register.errors.error_messages.email_issue');
            suggestions = [`✓ ${t('auth.register.errors.suggestions.check_email_format')}`, `✓ ${t('auth.register.errors.suggestions.try_different_email')}`];
          }
        }
        
        const fullMessage = errorMessage + 
          (suggestions.length > 0 ? `\n\n${t('common.suggestions')}:\n` + suggestions.join('\n') : '');
        
        Alert.alert(
          errorTitle,
          fullMessage,
          [
            { text: t('common.retry'), onPress: () => setLoading(false) },
            { text: t('common.back'), style: 'cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ 注册网络错误:', error);
      
      // 先关闭进度对话框
      Alert.alert('');
      
      // 网络错误的具体处理
      let errorTitle = t('auth.register.errors.network_error_title');
      let errorMessage = t('auth.register.errors.network_connection_failed');
      let suggestions = [`✓ ${t('auth.register.errors.suggestions.check_wifi_data')}`, `✓ ${t('auth.register.errors.suggestions.restart_network')}`, `✓ ${t('auth.register.errors.suggestions.retry_later')}`];
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = t('auth.register.errors.error_messages.network_ssl_error');
          suggestions = [`✓ ${t('auth.register.errors.suggestions.check_network')}`, `✓ ${t('common.switch_network')}`, `✓ ${t('auth.register.errors.suggestions.contact_support')}`];
        } else if (error.message.includes('timeout')) {
          errorMessage = t('auth.register.errors.error_messages.timeout_message');
          suggestions = [`✓ ${t('auth.register.errors.suggestions.retry_later')}`, `✓ ${t('auth.register.errors.suggestions.check_network_speed')}`];
        } else if (error.message.includes('500')) {
          errorTitle = t('auth.register.errors.server_error_title');
          errorMessage = t('auth.register.errors.error_messages.server_error_message');
          suggestions = [`✓ ${t('auth.register.errors.suggestions.retry_later')}`, `✓ ${t('auth.register.errors.suggestions.contact_support')}`];
        }
      }
      
      const fullMessage = errorMessage + `\n\n${t('common.suggestions')}:\n` + suggestions.join('\n');
      
      Alert.alert(
        errorTitle,
        fullMessage,
        [
          { text: t('common.retry'), onPress: () => setLoading(false) },
          { text: t('common.back'), style: 'cancel', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // 处理成功弹窗关闭后的跳转
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    
    // 跳转到主页面，并设置初始Tab为Profile
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

  const handleBack = () => {
    navigation.goBack();
  };

  const renderOrganizationSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.organization_label')}</Text>
      <WebOrganizationSelector
        organizations={organizations}
        selectedOrganization={formData.selectedOrganization}
        onOrganizationSelect={(organization) => updateFormData('selectedOrganization', organization)}
        placeholder={t('auth.register.form.organization_placeholder')}
        loading={organizationsLoading}
        error={!!errors.selectedOrganization}
        accessibilityLabel={t('auth.register.form.organization_label')}
      />
      {errors.selectedOrganization && <Text style={styles.errorText}>{errors.selectedOrganization}</Text>}
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

  // Modal removed - using WebOrganizationSelector dropdown instead

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

        <Pressable onPress={Keyboard.dismiss}>
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
            <Text style={styles.stepTitle}>{t('auth.register.form.account_setup')}</Text>
            <Text style={styles.stepSubtitle}>
              {registrationType === 'invitation' 
                ? t('auth.register.form.invitation_step2_description')
                : t('auth.register.form.step2_description')
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

            {/* 邮箱显示 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.email_label')}</Text>
              <SmartTextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.email}
                editable={false}
                placeholderTextColor={theme.colors.text.disabled}
              />
              <Text style={styles.helpText}>{t('auth.register.form.email_help')}</Text>
            </View>

            {/* 用户名提示（邮箱即用户名） */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.login_info_label')}</Text>
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>
                  {t('auth.register.form.email_as_username_info')}
                </Text>
              </View>
            </View>

            {/* 昵称 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.nickname_label')}</Text>
              <SmartTextInput
                style={[styles.input, errors.nickName && styles.inputError]}
                placeholder={t('auth.register.form.nickname_placeholder')}
                value={formData.nickName}
                onChangeText={(text) => updateFormData('nickName', text)}
                placeholderTextColor={theme.colors.text.disabled}
              />
              {errors.nickName && <Text style={styles.errorText}>{errors.nickName}</Text>}
            </View>

            {/* 密码 */}
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

            {/* 确认密码 */}
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
            {renderGenderSelector()}

            {/* 组织选择 */}
            {renderOrganizationSelector()}

            {/* 手机验证码 - 只对普通注册用户显示 */}
            {registrationType === 'phone' && (
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
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.text.inverse} />
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
            )}
            {/* Register Button - 跟随内容在表单底部 */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.text.inverse} />
                ) : (
                  <Text style={styles.registerButtonText}>
                    {t('auth.register.form.register')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </Pressable>
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
      
      {/* 组织选择Modal */}
      {/* Modal removed - now using dropdown selector */}

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
    borderColor: 'transparent',
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
    borderBottomColor: theme.colors.border,
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
});