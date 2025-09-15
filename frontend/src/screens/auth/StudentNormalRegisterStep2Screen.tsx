import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
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

interface RouteParams {
  step1Data: RegistrationStep1Data & { legalName: string };
  referralCode?: string;
  hasReferralCode?: boolean;
  registrationType?: 'phone' | 'invitation';
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
    referralCode, 
    hasReferralCode = false, 
    registrationType = 'phone',
    detectedRegion = 'zh',
    detectionResult
  } = route.params as RouteParams;

  const [loading, setLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [organizationModalVisible, setOrganizationModalVisible] = useState(false);
  
  // 短信验证相关状态
  const [countdown, setCountdown] = useState(0);
  const [bizId, setBizId] = useState<string>('');
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  
  // 成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // 实时验证状态
  const [userNameChecking, setUserNameChecking] = useState(false);
  const [userNameAvailable, setUserNameAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  
  // 实时验证状态
  const [realtimeErrors, setRealtimeErrors] = useState<ValidationErrors>({});
  
  // 检查是否有任何验证错误
  const hasValidationErrors = () => {
    return Object.keys(realtimeErrors).some(key => 
      realtimeErrors[key as keyof ValidationErrors]
    ) || Object.keys(errors).some(key => 
      errors[key as keyof ValidationErrors]
    );
  };
  
  // 调试：检查当前系统语言
  useEffect(() => {
    console.log('🌍 [RegisterStep2] Language detection:', {
      currentLanguage: i18n.language,
      detectedRegion: detectedRegion
    });
  }, []);
  
  // 创建常用名实时验证处理器
  const handleNickNameChange = createRealtimeValidator(
    TextType.COMMON_NAME,
    (isValid, message) => {
      setRealtimeErrors(prev => ({
        ...prev,
        nickName: isValid ? undefined : message
      }));
    }
  );
  
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

    // 验证常用名（昵称）- 使用智能验证
    const nickNameValidation = validateTextByLanguage(
      formData.nickName,
      TextType.COMMON_NAME,
      t
    );
    if (!nickNameValidation.isValid) {
      newErrors.nickName = nickNameValidation.message;
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

    // 验证验证码（只在普通注册时需要）
    if (registrationType === 'phone') {
      if (!formData.verificationCode.trim()) {
        newErrors.verificationCode = t('validation.verification_code_required');
      } else if (!/^\d{6}$/.test(formData.verificationCode)) {
        newErrors.verificationCode = t('validation.verification_code_format');
      }
    }

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
      console.log('🔥 [RegisterStep2] Starting to send verification code, phone:', step1Data.phoneNumber);
      const response = await sendSMSVerificationCode(step1Data.phoneNumber);
      
      console.log('📱 [RegisterStep2] SMS API response:', response);
      
      if (response.code === 'OK' && response.bizId) {
        console.log('✅ [RegisterStep2] Verification code sent successfully, bizId:', response.bizId);
        setBizId(response.bizId);
        setSmsCodeSent(true);
        
        Alert.alert(
          t('auth.register.sms.code_sent_title'),
          t('auth.register.sms.code_sent_message', {
            countryCode: '86',
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
        `网络连接失败，请检查网络设置\n错误: ${(error as Error).message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // 注释掉：推荐码注册流程不需要第三步，直接在第二步完成注册
  // const handleNext = () => {
  //   if (!validateForm()) return;
  //
  //   // 导航到第三步，传递所需数据
  //   navigation.navigate('RegisterStep3', {
  //     step1Data,
  //     step2Data: formData,
  //     referralCode,
  //     hasReferralCode,
  //     registrationType,
  //     detectedRegion,
  //     detectionResult
  //   });
  // };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    console.log('🚀 [RegisterStep2] Starting registration process...');
    
    // 注册处理中（不显示弹窗，避免多个弹窗）
    
    try {
      // 构建注册请求数据 - 根据注册类型决定字段
      let registrationData: RegistrationAPIRequest;

      if (registrationType === 'invitation') {
        // 生成符合需求的姓名数据
        const nameData = generateBackendNameData(
          step1Data.firstName,
          step1Data.lastName,
          formData.nickName, // 常用名
          true // 学生
        );
        
        // ②邀请码注册：手机号和邮箱可填可不填，verCode不填
        registrationData = {
          identity: 1, // 学生身份
          userName: formData.email, // 使用邮箱作为用户名
          legalName: nameData.legalName, // 使用生成的法定姓名
          nickName: nameData.nickName, // 使用生成的昵称（常用名+姓氏拼音）
          password: formData.password,
          email: formData.email, // 邮箱必填
          sex: formData.sex,
          deptId: parseInt(step1Data.selectedSchool!.id),
          orgId: formData.selectedOrganization!.id,
          invCode: referralCode!, // 邀请码注册必须有invCode
          area: detectedRegion, // 地理检测结果（只读）
          areaCode: (step1Data as any).areaCode || (detectedRegion === 'zh' ? '86' : '1'), // 使用Step1选择的区号
          // 可选字段
          ...(step1Data.phoneNumber && { phonenumber: step1Data.phoneNumber }),
          // 不包含 verCode 和 bizId
        };
      } else {
        // 生成符合需求的姓名数据
        const nameData = generateBackendNameData(
          step1Data.firstName,
          step1Data.lastName,
          formData.nickName, // 常用名
          true // 学生
        );
        
        // ①手机验证码注册：invCode不填
        registrationData = {
          identity: 1, // 学生身份
          userName: formData.email, // 使用邮箱作为用户名
          legalName: nameData.legalName, // 使用生成的法定姓名
          nickName: nameData.nickName, // 使用生成的昵称（常用名+姓氏拼音）
          password: formData.password,
          phonenumber: step1Data.phoneNumber, // 手机号必填
          email: formData.email, // 邮箱必填
          sex: formData.sex,
          deptId: parseInt(step1Data.selectedSchool!.id),
          orgId: formData.selectedOrganization!.id,
          area: detectedRegion, // 地理检测结果（只读）
          areaCode: (step1Data as any).areaCode || (detectedRegion === 'zh' ? '86' : '1'), // 使用Step1选择的区号
          // 只在普通注册时包含验证码验证
          ...(registrationType === 'phone' && {
            verCode: formData.verificationCode,
            bizId: bizId,
          }),
          // 不包含 invCode
        };
      }

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
            formDataEmail: formData.email,
            step1GeneratedEmail: step1Data.generatedEmail
          });
          
          const loginResult = await login({
            username: registrationUserName, // 使用注册时的实际userName
            password: formData.password,
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
            setLoading(false);
            setShowSuccessModal(true);
          } else {
            // 登录失败，但注册成功
            console.log('❌ [RegisterStep2] Auto login failed, but registration successful:', loginResult);
            setLoading(false);
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
          setLoading(false);
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
        let errorTitle = '❌ 注册失败';
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
            errorTitle = '📱 验证码错误';
            errorMessage = '验证码错误或已过期';
            suggestions = ['✓ 重新获取验证码', '✓ 检查短信'];
          } else if (errorMessage.includes('邮箱')) {
            errorTitle = '📧 邮箱问题';
            errorMessage = '邮箱格式不正确或已被使用';
            suggestions = ['✓ 检查邮箱格式', '✓ 尝试其他邮箱'];
          }
        }
        
        const fullMessage = errorMessage + 
          (suggestions.length > 0 ? '\n\n建议解决方案:\n' + suggestions.join('\n') : '');
        
        Alert.alert(
          errorTitle,
          fullMessage,
          [
            { text: '重试', onPress: () => setLoading(false) },
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
        } else if (error.message.includes('timeout')) {
          errorMessage = '请求超时，服务器响应缓慢';
          suggestions = ['✓ 稍后重试', '✓ 检查网络速度'];
        } else if (error.message.includes('500')) {
          errorTitle = '🔧 服务器错误';
          errorMessage = '服务器内部错误，请稍后重试';
          suggestions = ['✓ 稍后重试', '✓ 联系客服'];
        }
      }
      
      const fullMessage = errorMessage + '\n\n解决建议:\n' + suggestions.join('\n');
      
      Alert.alert(
        errorTitle,
        fullMessage,
        [
          { text: '重试', onPress: () => setLoading(false) },
          { text: t('common.back'), style: 'cancel', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
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

  const renderOrganizationSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.organization_label')}</Text>
      <TouchableOpacity
        style={[styles.organizationSelector, errors.selectedOrganization && styles.inputError]}
        onPress={() => {
          if (!organizationsLoading && organizations.length > 0) {
            setOrganizationModalVisible(true);
          }
        }}
        disabled={organizationsLoading}
      >
        {organizationsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('auth.register.form.loading_organizations')}</Text>
          </View>
        ) : (
          <View style={styles.selectorContent}>
            <Text style={[styles.selectorText, !formData.selectedOrganization && styles.placeholderText]}>
              {formData.selectedOrganization?.name || t('auth.register.form.organization_placeholder')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
          </View>
        )}
      </TouchableOpacity>
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

  const renderOrganizationModal = () => (
    <Modal
      visible={organizationModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setOrganizationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('auth.register.form.organization_label')}</Text>
            <TouchableOpacity
              onPress={() => setOrganizationModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={organizations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.organizationItem,
                  formData.selectedOrganization?.id === item.id && styles.organizationItemSelected
                ]}
                onPress={() => {
                  updateFormData('selectedOrganization', item);
                  setOrganizationModalVisible(false);
                }}
              >
                <Text style={[
                  styles.organizationItemText,
                  formData.selectedOrganization?.id === item.id && styles.organizationItemTextSelected
                ]}>
                  {item.name}
                </Text>
                {formData.selectedOrganization?.id === item.id && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
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
              <TextInput
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
              <TextInput
                style={[
                  styles.input, 
                  (errors.nickName || realtimeErrors.nickName) && styles.inputError
                ]}
                placeholder={getInputPlaceholder(TextType.COMMON_NAME, t)}
                value={formData.nickName}
                onChangeText={(text) => {
                  handleNickNameChange(text, t);
                  updateFormData('nickName', text);
                }}
                placeholderTextColor={theme.colors.text.disabled}
              />
              {(errors.nickName || realtimeErrors.nickName) && (
                <Text style={styles.errorText}>
                  {errors.nickName || realtimeErrors.nickName}
                </Text>
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
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* 性别选择 */}
            {renderGenderSelector()}

            {/* 组织选择 */}
            {renderOrganizationSelector()}

            {/* 手机验证码 - 只在普通注册(非推荐码)时显示 */}
            {registrationType === 'phone' && (
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
                style={[
                  styles.registerButton, 
                  (loading || hasValidationErrors()) && styles.registerButtonDisabled
                ]}
                onPress={handleRegister}
                disabled={loading || hasValidationErrors()}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.text.inverse} />
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
      
      {/* 组织选择Modal */}
      {renderOrganizationModal()}
      
      {/* 🔧 成功Modal - 与Web端保持一致的体验 */}
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
    paddingVertical: theme.spacing[4], // 增加垂直内边距
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
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