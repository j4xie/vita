import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Pressable,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { SchoolSelector } from '../../components/common/SchoolSelector';
import { OrganizationSelector } from '../../components/common/OrganizationSelector';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import SchoolEmailService, { APISchoolData } from '../../services/schoolEmailService';
import RegionDetectionService, { RegionDetectionResult } from '../../services/RegionDetectionService';
import { getWebInputStyles, getWebInputProps } from '../../utils/webInputStyles';
import { SafeAlert } from '../../utils/SafeAlert';
import { WebTextInput } from '../../components/web/WebTextInput';
import { ForceNativeInput } from '../../components/web/ForceNativeInput';
import { validateInvitationCode } from '../../services/registrationAPI';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  area: 'zh' | 'en'; // 地域选择：zh-中国，en-美国
}

export const RegisterFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const { login: userLogin } = useUser();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients } = darkModeSystem;
  
  const referralCode = route.params?.referralCode;
  const hasReferralCode = route.params?.hasReferralCode ?? !!referralCode;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToSMS, setAgreedToSMS] = useState(false);
  
  // 成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // 地域检测状态
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
    sex: '2', // 默认未知
    referralCode: referralCode || '',
    organization: '',
    organizationId: '',
    bizId: '',
    privacyConsent: true, // 用户从RegisterChoice页面来时已经同意了隐私协议
    area: 'zh', // 默认选择中国
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // 推荐码信息调试日志
  useEffect(() => {
    console.log('🎫 推荐码信息检查:', {
      routeParams: route.params,
      referralCode: referralCode,
      hasReferralCode: hasReferralCode,
      formDataReferralCode: formData.referralCode
    });
  }, [route.params, referralCode, hasReferralCode, formData.referralCode]);

  // 自动地域检测
  useEffect(() => {
    detectUserRegion();
  }, []);

  const detectUserRegion = async () => {
    setRegionDetecting(true);
    try {
      console.log('🌍 开始自动地域检测...');
      const result = await RegionDetectionService.detectRegion();
      
      setRegionDetectionResult(result);
      
      // 自动设置检测到的地域（只读，不可修改）
      updateFormData('area', result.region);
      
      console.log('🎯 地域检测完成:', result);
    } catch (error) {
      console.error('地域检测失败:', error);
      // 检测失败时使用默认值（中国），不提供手动选择
      updateFormData('area', 'zh');
    } finally {
      setRegionDetecting(false);
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
      const domain = SchoolEmailService.getEmailDomainByName(formData.university);
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
    
    // 推荐码注册时手机号为可选，普通注册时为必填
    if (!hasReferralCode) {
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
    } else {
      // 推荐码注册时，如果填写了手机号则验证格式
      if (formData.phoneNumber) {
        const phoneRegex = formData.phoneType === 'CN' 
          ? /^1[3-9]\d{9}$/
          : /^\d{10}$/;
        
        if (!phoneRegex.test(formData.phoneNumber)) {
          newErrors.phoneNumber = formData.phoneType === 'CN' 
            ? t('validation.phone_china_invalid')
            : t('validation.phone_usa_invalid');
        }
      }
    }

    // 验证合规勾选
    if (!agreedToPrivacy) {
      SafeAlert.alert(t('common.error'), t('auth.register.sms.terms_privacy_checkbox'));
      return false;
    }
    
    if (!agreedToSMS) {
      SafeAlert.alert(t('common.error'), t('auth.register.sms.sms_consent_checkbox'));
      return false;
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
        
        SafeAlert.alert(
          t('auth.register.sms.code_sent_title'),
          t('auth.register.sms.code_sent_message', {
            countryCode: formData.phoneType === 'CN' ? '86' : '1',
            phoneNumber: formData.phoneNumber
          }),
          [{
            text: t('common.confirm'),
            onPress: () => {
              // 在确认后导航到验证码页面
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
        SafeAlert.alert(t('auth.register.sms.send_failed_title'), t('auth.register.sms.send_failed_message'));
      }
    } catch (error) {
      console.error('发送验证码错误:', error);
      SafeAlert.alert(t('auth.register.sms.send_failed_title'), t('auth.register.sms.send_failed_message'));
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

  // 智能输入组件选择器 - Web环境使用ForceNativeInput，保证输入正常工作
  const SmartTextInput = Platform.OS === 'web' ? ForceNativeInput : WebTextInput;

  // 根据学校更新邮箱域名
  const handleSchoolSelect = (school: any) => {
    // 🌍 根据当前语言保存对应的学校名称，确保邮箱域名映射正确
    const isEnglish = i18n.language === 'en-US';
    const schoolName = (isEnglish && school.engName) 
      ? school.engName 
      : school.deptName;
    
    updateFormData('university', schoolName);
    updateFormData('universityId', school.deptId.toString());
    
    // 清空之前的邮箱数据
    updateFormData('emailPrefix', '');
    updateFormData('email', '');
  };

  // 处理邮箱前缀输入
  const handleEmailPrefixChange = (prefix: string) => {
    updateFormData('emailPrefix', prefix);
    
    const domain = SchoolEmailService.getEmailDomainByName(formData.university);
    if (domain && prefix) {
      updateFormData('email', `${prefix}@${domain}`);
    } else {
      updateFormData('email', prefix);
    }
  };

  // 处理条款和隐私政策点击
  const handleTermsPress = (type: 'terms' | 'privacy') => {
    navigation.navigate('Terms', { type, area: formData.area });
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

  // 解析注册错误为用户友好提示
  const parseRegistrationError = (errorMsg: string): string => {
    console.log('🔍 [注册错误解析] 原始错误信息:', errorMsg);
    
    // 添加更多具体的错误匹配模式
    if (errorMsg.includes('userName') || errorMsg.includes('用户名')) {
      if (errorMsg.includes('已存在') || errorMsg.includes('失败') || errorMsg.includes('exist')) {
        return '用户名已被使用，请换一个用户名';
      }
      return t('validation.username_already_exists');
    }
    if (errorMsg.includes('phonenumber') || errorMsg.includes('手机号')) {
      if (errorMsg.includes('已存在') || errorMsg.includes('exist')) {
        return '手机号已被注册，请使用其他手机号或尝试找回密码';
      }
      return t('validation.phone_format_error');
    }
    if (errorMsg.includes('email') || errorMsg.includes('邮箱')) {
      if (errorMsg.includes('已存在') || errorMsg.includes('exist')) {
        return '邮箱已被注册，请使用其他邮箱';
      }
      return t('validation.email_format_error');
    }
    if (errorMsg.includes('Duplicate entry')) return t('validation.duplicate_registration');
    if (errorMsg.includes('too long')) return t('validation.field_too_long');
    if (errorMsg.includes('constraint')) return t('validation.data_constraint_error');
    
    // 邀请码相关错误
    if (errorMsg.includes('invCode') || errorMsg.includes('邀请码')) {
      if (errorMsg.includes('不存在') || errorMsg.includes('无效') || errorMsg.includes('invalid')) {
        return t('auth.register.errors.invitation_code_invalid');
      }
      if (errorMsg.includes('已使用') || errorMsg.includes('used')) {
        return t('auth.register.errors.invitation_code_used');
      }
      if (errorMsg.includes('过期') || errorMsg.includes('expired')) {
        return t('auth.register.errors.invitation_code_expired');
      }
      return t('auth.register.errors.invitation_code_verification_failed');
    }
    
    return t('auth.register.error_message');
  };

  // 完成注册（推荐码用户）
  const completeRegistration = async () => {
    setLoading(true);
    setLoadingMessage(t('auth.register.processing_registration'));
    try {
      const phoneNumber = formData.phoneNumber ? (
        formData.phoneType === 'CN' 
          ? formData.phoneNumber // 中国手机号直接使用11位格式
          : `1${formData.phoneNumber}` // 美国号码保持+1前缀
      ) : '';

      const registrationData = {
        userName: formData.userName,
        legalName: formData.legalName,
        nickName: formData.englishNickname,
        password: formData.password,
        email: formData.email,
        sex: formData.sex,
        deptId: formData.universityId, // 传递学校ID，确保用户关联正确的学校
        orgId: formData.organizationId,
        invCode: formData.referralCode,
        area: formData.area, // 地域字段
        areaCode: formData.area, // API期望areaCode字段，映射相同值
        // 推荐码注册时手机号可选，只在有值时传递
        ...(phoneNumber && { phonenumber: phoneNumber }),
      };

      console.log('📋 邀请码注册数据:', {
        ...registrationData,
        password: '[HIDDEN]',
        selectedSchool: formData.university,
        deptId: formData.universityId
      });

      // 详细的数据验证日志
      console.log('🔍 详细字段检查:', {
        userName: `"${registrationData.userName}" (length: ${registrationData.userName?.length})`,
        legalName: `"${registrationData.legalName}" (length: ${registrationData.legalName?.length})`,
        nickName: `"${registrationData.nickName}" (length: ${registrationData.nickName?.length})`,
        email: `"${registrationData.email}" (length: ${registrationData.email?.length})`,
        phonenumber: `"${registrationData.phonenumber}" (length: ${registrationData.phonenumber?.length})`,
        sex: `"${registrationData.sex}"`,
        deptId: `"${registrationData.deptId}" (type: ${typeof registrationData.deptId})`,
        orgId: `"${registrationData.orgId}" (type: ${typeof registrationData.orgId})`,
        invCode: `"${registrationData.invCode}" (length: ${registrationData.invCode?.length})`,
        areaCode: `"${registrationData.areaCode}"`
      });

      // 关键字段空值检查
      const emptyFields = [];
      if (!registrationData.userName) emptyFields.push('userName');
      if (!registrationData.legalName) emptyFields.push('legalName');
      if (!registrationData.nickName) emptyFields.push('nickName');
      if (!registrationData.email) emptyFields.push('email');
      if (!registrationData.phonenumber) emptyFields.push('phonenumber');
      if (!registrationData.sex) emptyFields.push('sex');
      if (!registrationData.deptId) emptyFields.push('deptId');
      if (!registrationData.orgId) emptyFields.push('orgId');
      
      if (emptyFields.length > 0) {
        console.error('❌ 发现空值字段:', emptyFields);
        SafeAlert.alert(t('auth.register.error_title'), `${t('auth.register.errors.required_fields_empty')}: ${emptyFields.join(', ')}`);
        return;
      } else {
        console.log('✅ 所有必填字段都有值');
      }

      // 邀请码有效性验证由后端在注册时进行
      // 根据API文档，接口14需要管理员权限，普通用户无法调用验证
      if (registrationData.invCode) {
        console.log('🎫 邀请码将在注册时进行后端验证:', registrationData.invCode);
      }

      const result = await pomeloXAPI.register(registrationData);
      
      console.log('🌐 API响应结果:', {
        code: result.code,
        msg: result.msg,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : null
      });
      
      if (result.code === 200) {
        // 注册成功后自动登录
        try {
          console.log('注册成功，开始自动登录...');
          setLoadingMessage(t('auth.register.auto_login_processing'));
          
          // 使用真实的登录API，直接调用https://www.vitaglobal.icu/app/login
          console.log('🔐 自动登录参数:', { username: formData.email, password: '[HIDDEN]' });
          
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
          
          console.log('🔐 登录API响应:', {
            code: loginResult.code,
            msg: loginResult.msg,
            hasToken: !!loginResult.data?.token,
            hasUserId: !!loginResult.data?.userId
          });
          
          if (loginResult.code === 200 && loginResult.data) {
            // 手动保存token和userId到正确的存储位置
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());
            
            console.log('✅ Token已保存到本地存储');
            
            // 登录成功，更新用户状态
            await userLogin(loginResult.data.token);
            
            // 强制刷新用户信息，确保UserContext状态正确
            console.log('🔄 强制刷新用户信息...');
            await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟确保状态更新
            
            // 🔧 发送注册完成事件，用于TabBar位置修复
            DeviceEventEmitter.emit('registrationCompleted', { 
              userId: result.data?.id,
              timestamp: Date.now()
            });
            
            // 🔧 发送页面跳转完成事件
            DeviceEventEmitter.emit('navigationCompleted', { 
              from: 'RegisterForm',
              to: 'Profile',
              timestamp: Date.now()
            });
            
            // 显示成功弹窗，不区分平台，统一使用LiquidSuccessModal
            setLoading(false);
            setShowSuccessModal(true);
          } else {
            // 登录失败，但注册成功 - 添加详细错误日志
            console.error('❌ 自动登录失败:', {
              code: loginResult.code,
              msg: loginResult.msg,
              usedEmail: formData.email,
              timestamp: new Date().toISOString()
            });
            SafeAlert.alert(
              t('auth.register.success_title'),
              t('auth.register.success_please_login'),
              [{
                text: t('common.confirm'),
                onPress: () => navigation.navigate('Login')
              }]
            );
          }
        } catch (loginError) {
          console.error('❌ 自动登录异常:', {
            error: loginError instanceof Error ? loginError.message : String(loginError),
            usedEmail: formData.email,
            stack: loginError instanceof Error ? loginError.stack : null,
            timestamp: new Date().toISOString()
          });
          // 登录失败，但注册成功
          SafeAlert.alert(
            t('auth.register.success_title'),
            t('auth.register.success_please_login'),
            [{
              text: t('common.confirm'),
              onPress: () => navigation.navigate('Login')
            }]
          );
        }
      } else {
        const friendlyError = parseRegistrationError(result.msg || '');
        SafeAlert.alert(t('auth.register.error_title'), friendlyError);
      }
    } catch (error) {
      console.error('🚨 Registration failed with complete error info:', {
        error: error,
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Check if it's a network error
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        SafeAlert.alert(t('auth.register.error_title'), t('auth.register.errors.network_connection_failed'));
      } else {
        const friendlyError = parseRegistrationError(error.message || '');
        SafeAlert.alert(t('auth.register.error_title'), friendlyError);
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
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

      {/* 移除Region Detection显示区域 - 地理检测在后台静默进行 */}

      {hasReferralCode && (
        <View style={styles.referralBadge}>
          <Ionicons name="gift" size={20} color={theme.colors.primary} />
          <Text style={styles.referralText}>{t('auth.register.form.referral_code', { code: formData.referralCode })}</Text>
        </View>
      )}

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
          secureTextEntry={false}
          textContentType="username"
          autoComplete="username-new"
        />
        {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.legal_name_label')}</Text>
        <Text style={styles.fieldDescription}>{t('auth.register.form.legal_name_description')}</Text>
        <SmartTextInput
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
        <SmartTextInput
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
        {SchoolEmailService.getEmailDomainByName(formData.university) ? (
          <View style={styles.emailInputWrapper}>
            <SmartTextInput
              style={[styles.emailPrefixInput, errors.email && styles.inputError]}
              placeholder={t('auth.register.form.email_prefix_placeholder')}
              value={formData.emailPrefix}
              onChangeText={handleEmailPrefixChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={theme.colors.text.disabled}
              textContentType="emailAddress"
              autoComplete="email"
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
            textContentType="emailAddress"
            autoComplete="email"
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

      {/* 移动到第2步的性别选择 */}
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

      {/* 移动到第2步的推荐组织 */}
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
            SafeAlert.alert(
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
        <Text style={styles.label}>
          {t('auth.register.form.phone_label')} {hasReferralCode ? t('common.optional') : '*'}
        </Text>
        <View style={styles.phoneInputWrapper}>
          <Text style={styles.phonePrefix}>
            +{formData.phoneType === 'CN' ? '86' : '1'}
          </Text>
          <SmartTextInput
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

      {/* 合规勾选区域 */}
      <View style={styles.complianceContainer}>
        {/* 服务条款和隐私政策勾选 */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, agreedToPrivacy && styles.checkboxChecked]}>
              {agreedToPrivacy && (
                <Ionicons name="checkmark" size={16} color={theme.colors.text.inverse} />
              )}
            </View>
            <View style={styles.checkboxTextContainer}>
              <View style={styles.termsTextRow}>
                <Text style={styles.checkboxText}>{t('auth.register.form.terms_checkbox')}</Text>
                <TouchableOpacity onPress={() => handleTermsPress('terms')}>
                  <Text style={styles.termsLink}>《{t('auth.register.sms.service_terms')}》</Text>
                </TouchableOpacity>
                <Text style={styles.checkboxText}>{t('auth.register.and')}</Text>
                <TouchableOpacity onPress={() => handleTermsPress('privacy')}>
                  <Text style={styles.termsLink}>《{t('auth.register.sms.privacy_policy')}》</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 短信接收同意勾选 */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            onPress={() => setAgreedToSMS(!agreedToSMS)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, agreedToSMS && styles.checkboxChecked]}>
              {agreedToSMS && (
                <Ionicons name="checkmark" size={16} color={theme.colors.text.inverse} />
              )}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxText}>
                {t('auth.register.sms.sms_consent_checkbox')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 合规说明文本 */}
        <View style={styles.complianceNoticeContainer}>
          <Text style={styles.complianceNotice}>
            {t('auth.register.sms.compliance_notice')}
          </Text>
        </View>
      </View>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={isDarkMode ? dmGradients.page.background : DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      <View style={styles.contentView}>
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

        <Pressable onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentInsetAdjustmentBehavior="automatic"
          >
          <View style={styles.formContainer}>
            {renderStepContent()}
            
            {/* Register Button - 跟随内容在表单底部 */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  loading && styles.nextButtonDisabled,
                  currentStep === 3 && (!agreedToPrivacy || !agreedToSMS) && styles.nextButtonDisabled
                ]}
                onPress={handleNext}
                disabled={loading || (currentStep === 3 && (!agreedToPrivacy || !agreedToSMS))}
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
                    {currentStep === 3 
                      ? (hasReferralCode ? t('auth.register.form.complete_registration') : t('auth.register.form.send_code'))
                      : t('auth.register.form.next_step')}
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
    // Web环境下确保容器不阻挡点击事件
    ...(Platform.OS === 'web' && {
      pointerEvents: 'auto',
    }),
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
    borderColor: 'transparent',
    minHeight: 52, // 设置最小高度，让输入框更舒适
    // Web环境下的兼容性修复
    ...getWebInputStyles(),
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  fieldDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
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
    paddingVertical: theme.spacing[4], // 增加垂直内边距
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 52, // 设置最小高度
    // Web环境下的兼容性修复
    ...getWebInputStyles(),
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
    paddingVertical: theme.spacing[4], // 增加垂直内边距
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 52, // 设置最小高度
    // Web环境下的兼容性修复
    ...getWebInputStyles(),
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
  areaDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
  },
  areaContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing[2],
  },
  areaButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginHorizontal: theme.spacing[1],
    backgroundColor: theme.colors.background.secondary,
  },
  areaActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  areaButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  areaButtonTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  areaDetectingContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  detectingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
  },
  areaResultContainer: {
    marginBottom: theme.spacing[2],
  },
  areaDetectedCard: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    marginBottom: theme.spacing[3],
  },
  areaResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  areaResultIcon: {
    fontSize: 28,
    marginRight: theme.spacing[3],
  },
  areaResultTextContainer: {
    flex: 1,
  },
  areaResultTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  areaResultSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
  },
  areaChangeButton: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.secondary,
  },
  areaChangeButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  areaManualContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
  },
  areaManualLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  areaFallbackContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  areaFallbackText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  bottomContainer: {
    paddingTop: theme.spacing[8], // 表单与按钮间的间距
    paddingHorizontal: 0, // 已经在scrollContent中设置
    paddingBottom: theme.spacing[6], // 表单底部留白
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
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
    marginTop: theme.spacing[2],
    textAlign: 'center',
  },
  // 合规勾选区域样式
  complianceContainer: {
    marginTop: theme.spacing[4],
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  complianceTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
    textAlign: 'center',
  },
  checkboxContainer: {
    marginBottom: theme.spacing[3],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: theme.spacing[3],
  },
  checkboxText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    fontWeight: theme.typography.fontWeight.medium,
  },
  complianceNoticeContainer: {
    marginTop: theme.spacing[4],
    padding: theme.spacing[3],
    backgroundColor: '#fff3cd',
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  complianceNotice: {
    fontSize: theme.typography.fontSize.xs,
    color: '#856404',
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
    textAlign: 'left',
  },
  termsTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsLink: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginHorizontal: theme.spacing[1],
  },
});