import React, { useState, useEffect } from 'react';
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
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import {
  SchoolData,
  createSchoolDataFromBackend
} from '../../utils/schoolData';
import {
  fetchSchoolList,
  fetchOrganizationList,
  registerUser,
  validatePhoneNumber
} from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import LiquidSuccessModal from '../../components/modals/LiquidSuccessModal';
import {
  validateTextByLanguage,
  TextType,
  generateBackendNameData,
  createRealtimeValidator,
  getInputPlaceholder
} from '../../utils/textValidation';
import { i18n } from '../../utils/i18n';

interface OrganizationData {
  id: number;
  name: string;
}

interface StudentInvitationFormData {
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  emailUsername: string; // 邮箱前缀部分
  generatedEmail: string; // 自动生成的完整邮箱
  password: string;
  confirmPassword: string;
  sex: '0' | '1' | '2';
  selectedSchool: SchoolData | null;
  selectedOrganization: OrganizationData | null;
  phoneNumber: string; // 手机号
  areaCode: '86' | '1'; // 区号
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  nickName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  selectedSchool?: string;
  selectedOrganization?: string;
  phoneNumber?: string;
}

interface RouteParams {
  registrationType: 'invitation';
  referralCode: string;
  hasReferralCode: boolean;
  detectedRegion: 'zh' | 'en';
  detectionResult?: any;
  identity: number;
}

export const StudentInvitationRegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();

  const {
    referralCode,
    detectedRegion,
    detectionResult
  } = route.params as RouteParams;

  // 注册页面保护机制
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    console.log('🛡️ [StudentInvitationRegister] Page protection activated');

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // 注册成功后或用户主动操作时允许离开
      if (registrationSuccess ||
          e.data.action.type === 'GO_BACK' ||
          e.data.action.type === 'NAVIGATE' &&
          e.data.action.payload?.name &&
          ['Login', 'RegisterChoice', 'IdentityChoice', 'Main'].includes(e.data.action.payload.name)) {
        console.log('✅ [StudentInvitationRegister] Allowed navigation:', e.data.action);
        return;
      }

      // 只在正在注册或非成功状态时阻止意外导航
      if (isRegistering || !registrationSuccess) {
        console.warn('🚫 [StudentInvitationRegister] Blocked unexpected navigation:', e.data.action);
        e.preventDefault();
      }
    });

    return unsubscribe;
  }, [navigation, isRegistering, registrationSuccess]);

  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [organizationModalVisible, setOrganizationModalVisible] = useState(false);
  const [schoolModalVisible, setSchoolModalVisible] = useState(false);

  const [formData, setFormData] = useState<StudentInvitationFormData>({
    firstName: '',
    lastName: '',
    nickName: '',
    email: '',
    emailUsername: '',
    generatedEmail: '',
    password: '',
    confirmPassword: '',
    sex: '2',
    selectedSchool: null,
    selectedOrganization: null,
    phoneNumber: '',
    areaCode: detectedRegion === 'zh' ? '86' : '1', // 根据地区设置默认区号
  });

  const [emailUsername, setEmailUsername] = useState('');

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [realtimeErrors, setRealtimeErrors] = useState<ValidationErrors>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 检查是否有任何验证错误
  const hasValidationErrors = () => {
    return Object.keys(realtimeErrors).some(key =>
      realtimeErrors[key as keyof ValidationErrors]
    ) || Object.keys(errors).some(key =>
      errors[key as keyof ValidationErrors]
    );
  };

  // 实时验证处理器
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

  const handleNickNameChange = createRealtimeValidator(
    TextType.COMMON_NAME,
    (isValid, message) => {
      setRealtimeErrors(prev => ({
        ...prev,
        nickName: isValid ? undefined : message
      }));
    }
  );

  // 监控 Provider 状态变化
  useEffect(() => {
    console.log('🔍 [StudentInvitationRegister] UserContext status check:', {
      hasUser: !!useUser,
      detectedRegion,
      timestamp: new Date().toISOString()
    });
  }, [useUser, detectedRegion]);

  // 加载数据
  useEffect(() => {
    loadSchools();
    loadOrganizations();
  }, []);

  // 邮箱自动生成逻辑
  useEffect(() => {
    if (emailUsername && formData.selectedSchool) {
      // 使用学校的邮箱域名生成完整邮箱
      // emailDomain 格式是 @berkeley.edu，直接拼接用户名
      const domain = formData.selectedSchool.emailDomain;
      const generatedEmail = domain ? `${emailUsername}${domain}` : '';

      setFormData(prev => ({
        ...prev,
        generatedEmail,
        email: generatedEmail // 同时更新email字段用于注册
      }));

      console.log('🎓 [StudentInvitation] Email auto-generated:', {
        username: emailUsername,
        school: formData.selectedSchool.name,
        domain: domain,
        generatedEmail: generatedEmail
      });
    } else {
      setFormData(prev => ({
        ...prev,
        generatedEmail: '',
        email: ''
      }));
    }
  }, [emailUsername, formData.selectedSchool]);

  const loadSchools = async (retryCount = 0) => {
    const maxRetries = 3;
    const cacheKey = '@pomelox_schools_cache';
    const cacheTimeKey = '@pomelox_schools_cache_time';
    const cacheValidTime = 24 * 60 * 60 * 1000; // 24小时缓存

    try {
      setSchoolsLoading(true);

      // 尝试从缓存加载
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        const cacheTime = await AsyncStorage.getItem(cacheTimeKey);

        if (cachedData && cacheTime) {
          const timeDiff = Date.now() - parseInt(cacheTime);
          if (timeDiff < cacheValidTime) {
            const schoolData = JSON.parse(cachedData);
            setSchools(schoolData);
            console.log(`📦 [StudentInvitationRegister] Loaded ${schoolData.length} schools from cache`);
            setSchoolsLoading(false);

            // 后台更新缓存（不影响UI）
            fetchAndCacheSchools();
            return;
          }
        }
      } catch (cacheError) {
        console.log('🔍 [StudentInvitationRegister] Cache read failed, fetching from network');
      }

      // 缓存失效或不存在，从网络获取
      await fetchAndCacheSchools(retryCount);

    } catch (error) {
      console.error(`❌ [StudentInvitationRegister] Failed to load schools (attempt ${retryCount + 1}):`, error);

      if (retryCount < maxRetries) {
        console.log(`🔄 [StudentInvitationRegister] Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          loadSchools(retryCount + 1);
        }, 2000);
        return;
      } else {
        Alert.alert(
          t('common.error'),
          t('auth.register.errors.school_load_failed') + '\n' + t('common.retry') + '?',
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('common.retry'),
              onPress: () => loadSchools(0),
            },
          ]
        );
      }
    } finally {
      if (retryCount >= maxRetries || schools.length > 0) {
        setSchoolsLoading(false);
      }
    }
  };

  const fetchAndCacheSchools = async (retryCount = 0) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000);
    });

    const response = await Promise.race([
      fetchSchoolList(),
      timeoutPromise
    ]);

    if (response.code === 200 && response.data) {
      const schoolData = createSchoolDataFromBackend(response.data);
      setSchools(schoolData);

      // 保存到缓存
      try {
        await AsyncStorage.setItem('@pomelox_schools_cache', JSON.stringify(schoolData));
        await AsyncStorage.setItem('@pomelox_schools_cache_time', Date.now().toString());
        console.log(`💾 [StudentInvitationRegister] Cached ${schoolData.length} schools`);
      } catch (cacheError) {
        console.warn('Failed to cache schools:', cacheError);
      }

      console.log(`✅ [StudentInvitationRegister] Successfully loaded ${schoolData.length} schools`);
    } else {
      throw new Error(`API returned code: ${response.code}`);
    }
  };

  const loadOrganizations = async () => {
    try {
      setOrganizationsLoading(true);
      const response = await fetchOrganizationList();

      if (response.code === 200 && response.data) {
        setOrganizations(response.data);
      }
    } catch (error) {
      console.error('[StudentInvitationRegister] Failed to load organizations:', error);
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const updateFormData = <K extends keyof StudentInvitationFormData>(
    field: K,
    value: StudentInvitationFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 验证名字
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

    // 验证昵称
    const nickNameValidation = validateTextByLanguage(
      formData.nickName,
      TextType.COMMON_NAME,
      t
    );
    if (!nickNameValidation.isValid) {
      newErrors.nickName = nickNameValidation.message;
    }

    // 额外检查昵称生成后的长度（预估）
    if (formData.nickName.length > 15) {
      newErrors.nickName = '昵称过长，请控制在15个字符以内';
    }

    // 验证邮箱（适配学校邮箱自动生成）
    if (formData.selectedSchool) {
      // 有选择学校时，验证邮箱前缀
      if (!emailUsername.trim()) {
        newErrors.email = t('validation.email_username_required');
      } else if (emailUsername.length < 3) {
        newErrors.email = t('validation.email_username_too_short');
      } else if (!/^[a-zA-Z0-9._-]+$/.test(emailUsername)) {
        newErrors.email = t('validation.email_username_invalid');
      } else if (!formData.generatedEmail) {
        newErrors.email = t('validation.email_generation_failed');
      }
    } else {
      // 没有选择学校时，验证完整邮箱
      if (!formData.email.trim()) {
        newErrors.email = t('validation.email_required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('validation.email_invalid');
      }
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

    // 验证组织
    if (!formData.selectedOrganization) {
      newErrors.selectedOrganization = t('validation.organization_required');
    }

    // 验证手机号
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t('validation.phone_required');
    } else if (!validatePhoneNumber(formData.phoneNumber, formData.areaCode)) {
      newErrors.phoneNumber = formData.areaCode === '86'
        ? t('validation.phone_invalid_china')
        : t('validation.phone_invalid_usa');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setIsRegistering(true);
    console.log('🚀 [StudentInvitationRegister] Starting invitation registration...');

    try {
      // 生成符合需求的姓名数据
      const nameData = generateBackendNameData(
        formData.firstName,
        formData.lastName,
        formData.nickName,
        true // 学生
      );

      // 验证和截断数据库字段长度限制
      const MAX_NICKNAME_LENGTH = 50; // 数据库 nick_name 字段限制
      const MAX_LEGAL_NAME_LENGTH = 100; // 数据库 legal_name 字段限制
      const MAX_EMAIL_LENGTH = 50; // 数据库 email 字段限制

      // 截断过长的字段
      if (nameData.nickName.length > MAX_NICKNAME_LENGTH) {
        nameData.nickName = nameData.nickName.substring(0, MAX_NICKNAME_LENGTH);
        console.warn(`⚠️ [StudentInvitationRegister] NickName truncated to ${MAX_NICKNAME_LENGTH} chars`);
      }

      if (nameData.legalName.length > MAX_LEGAL_NAME_LENGTH) {
        nameData.legalName = nameData.legalName.substring(0, MAX_LEGAL_NAME_LENGTH);
        console.warn(`⚠️ [StudentInvitationRegister] LegalName truncated to ${MAX_LEGAL_NAME_LENGTH} chars`);
      }

      if (formData.email.length > MAX_EMAIL_LENGTH) {
        console.error(`❌ [StudentInvitationRegister] Email too long: ${formData.email.length} chars`);
        Alert.alert(t('common.error'), '邮箱地址过长，请选择缩写更短的学校或缩短邮箱用户名');
        setLoading(false);
        return;
      }

      // 推荐码学生注册数据（无需验证码）
      const registrationData = {
        identity: 1, // 学生身份
        userName: formData.email,
        legalName: nameData.legalName,
        nickName: nameData.nickName,
        password: formData.password,
        email: formData.email,
        sex: formData.sex,
        deptId: parseInt(formData.selectedSchool!.id),
        orgId: formData.selectedOrganization!.id,
        invCode: referralCode, // 推荐码必须有
        area: detectedRegion,
        areaCode: formData.areaCode, // 使用用户选择的区号
        phonenumber: formData.phoneNumber, // 添加手机号
        // 推荐码注册不需要验证码相关参数
      };

      console.log('[StudentInvitationRegister] Registration data:', {
        ...registrationData,
        password: '[HIDDEN]',
        dataLengthCheck: {
          nickName: nameData.nickName.length,
          legalName: nameData.legalName.length,
          email: formData.email.length,
          phoneNumber: formData.phoneNumber.length
        }
      });

      const response = await registerUser(registrationData);

      if (response.code === 200) {
        console.log('✅ [StudentInvitationRegister] Registration successful! Starting auto login...');

        try {
          const loginResult = await login({
            username: registrationData.userName,
            password: formData.password,
          });

          if (loginResult.code === 200 && loginResult.data) {
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());

            await userLogin(loginResult.data.token);
            console.log('✅ [StudentInvitationRegister] Auto login successful!');

            setLoading(false);
            setIsRegistering(false);
            setRegistrationSuccess(true);
            setShowSuccessModal(true);
          } else {
            console.log('❌ [StudentInvitationRegister] Auto login failed:', loginResult);
            setLoading(false);
            setIsRegistering(false);
          }
        } catch (loginError) {
          console.error('❌ [StudentInvitationRegister] Auto login failed:', loginError);
          setLoading(false);
          setIsRegistering(false);
        }
      } else {
        console.error('❌ [StudentInvitationRegister] Registration failed:', response);
        setLoading(false);

        setIsRegistering(false);

        // 处理特定的错误类型
        const errorMsg = response.msg || '';
        if (errorMsg.includes('登录账号已存在') || errorMsg.includes('already exists')) {
          Alert.alert(
            t('common.error'),
            '该邮箱地址已被注册，请使用其他邮箱地址或联系管理员',
            [
              {
                text: t('common.confirm'),
                onPress: () => {
                  // 清空邮箱字段，让用户重新输入
                  setEmailUsername('');
                  updateFormData('email', '');
                  updateFormData('generatedEmail', '');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            t('common.error'),
            '注册失败，请稍后重试或联系管理员\n' + (errorMsg.length > 100 ? '服务器内部错误' : errorMsg)
          );
        }
      }
    } catch (error) {
      console.error('❌ [StudentInvitationRegister] Network error:', error);
      setLoading(false);
      setIsRegistering(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
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
            index: 3,
          }
        }],
      })
    );
  };

  const renderSchoolPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.university_label')}</Text>
      <View style={[styles.pickerContainer, errors.selectedSchool && styles.inputError]}>
        {schoolsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {schools.length > 0
                ? t('auth.register.form.updating_schools')
                : t('auth.register.form.loading_schools')
              }
            </Text>
          </View>
        ) : schools.length === 0 ? (
          <TouchableOpacity
            style={styles.retryContainer}
            onPress={() => loadSchools(0)}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.selector}
            onPress={() => {
              if (!schoolsLoading && schools.length > 0) {
                setSchoolModalVisible(true);
              }
            }}
          >
            <Text style={[styles.selectorText, !formData.selectedSchool && styles.placeholderText]}>
              {formData.selectedSchool?.name || t('auth.register.form.university_placeholder')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      {errors.selectedSchool && <Text style={styles.errorText}>{errors.selectedSchool}</Text>}
    </View>
  );

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
          <Text style={styles.headerTitle}>{t('auth.register.student.title')}</Text>
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
            <Text style={styles.stepTitle}>{t('auth.register.student.invitation_title')}</Text>
            <Text style={styles.stepSubtitle}>{t('auth.register.form.invitation_step1_description')}</Text>

            {/* 推荐码提示 */}
            <View style={styles.referralBadge}>
              <Ionicons name="gift" size={20} color={theme.colors.primary} />
              <Text style={styles.referralText}>
                {t('auth.register.form.referral_code', { code: referralCode })}
              </Text>
            </View>

            {/* 学生姓名 */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.last_name_label')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    (errors.lastName || realtimeErrors.lastName) && styles.inputError
                  ]}
                  placeholder={getInputPlaceholder(TextType.LAST_NAME, t)}
                  value={formData.lastName}
                  onChangeText={(text) => {
                    handleLastNameChange(text, t);
                    updateFormData('lastName', text);
                  }}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {(errors.lastName || realtimeErrors.lastName) && (
                  <Text style={styles.errorText}>
                    {errors.lastName || realtimeErrors.lastName}
                  </Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.first_name_label')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    (errors.firstName || realtimeErrors.firstName) && styles.inputError
                  ]}
                  placeholder={getInputPlaceholder(TextType.FIRST_NAME, t)}
                  value={formData.firstName}
                  onChangeText={(text) => {
                    handleFirstNameChange(text, t);
                    updateFormData('firstName', text);
                  }}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {(errors.firstName || realtimeErrors.firstName) && (
                  <Text style={styles.errorText}>
                    {errors.firstName || realtimeErrors.firstName}
                  </Text>
                )}
              </View>
            </View>

            {/* 常用名 */}
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

            {/* 学校选择 */}
            {renderSchoolPicker()}

            {/* 学校邮箱 - 只有选择学校后才显示 */}
            {formData.selectedSchool && formData.selectedSchool.emailDomain && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.form.school_email_label')}</Text>
                <View style={styles.emailInputWrapper}>
                  <TextInput
                    style={[styles.emailUsernameInput, errors.email && styles.inputError]}
                    placeholder={t('auth.register.form.email_username_placeholder')}
                    value={emailUsername}
                    onChangeText={setEmailUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                  <Text style={styles.emailDomain}>{formData.selectedSchool.emailDomain}</Text>
                </View>
                {formData.generatedEmail && (
                  <Text style={styles.emailPreview}>
                    {t('auth.register.form.complete_email')}: {formData.generatedEmail}
                  </Text>
                )}
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
            )}

            {/* 手机号输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t('auth.register.form.phone_label')}
              </Text>
              <View style={styles.phoneInputWrapper}>
                <TouchableOpacity
                  style={styles.areaCodeSelector}
                  onPress={() => {
                    const areaCodeTitle = t('auth.register.form.select_area_code');
                    console.log('🌍 Area code title:', areaCodeTitle);

                    Alert.alert(
                      areaCodeTitle || '选择区号', // 添加默认值
                      '',
                      [
                        {
                          text: t('auth.register.form.area_code_china') || '+86 中国',
                          onPress: () => updateFormData('areaCode', '86')
                        },
                        {
                          text: t('auth.register.form.area_code_usa') || '+1 美国',
                          onPress: () => updateFormData('areaCode', '1')
                        },
                        {
                          text: t('common.cancel') || '取消',
                          style: 'cancel'
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.areaCodeText}>
                    +{formData.areaCode}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
                  placeholder={formData.areaCode === '86' ? '13812345678' : '(555) 123-4567'}
                  value={formData.phoneNumber}
                  onChangeText={(text) => updateFormData('phoneNumber', text)}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
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
                autoComplete="off"
                textContentType="none"
                passwordRules=""
                placeholderTextColor={theme.colors.text.disabled}
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
                autoComplete="off"
                textContentType="none"
                passwordRules=""
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

            {/* 组织选择 */}
            {renderOrganizationSelector()}

            {/* 注册按钮 */}
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
                    {t('auth.register.student.register_button')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>

      {/* 学校选择Modal */}
      <Modal
        visible={schoolModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSchoolModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('auth.register.form.university_label')}</Text>
              <TouchableOpacity
                onPress={() => setSchoolModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={schools}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.organizationItem,
                    formData.selectedSchool?.id === item.id && styles.organizationItemSelected
                  ]}
                  onPress={() => {
                    updateFormData('selectedSchool', item);
                    setEmailUsername(''); // 清空邮箱用户名，让用户重新输入
                    setSchoolModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.organizationItemText,
                    formData.selectedSchool?.id === item.id && styles.organizationItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {formData.selectedSchool?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* 组织选择Modal */}
      {renderOrganizationModal()}

      {/* 成功Modal */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('auth.register.student.success_title')}
        message={t('auth.register.student.success_message')}
        confirmText={t('auth.register.student.start_using')}
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
  // 邮箱输入相关样式
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    minHeight: 52,
  },
  emailUsernameInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  emailDomain: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emailPreview: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    marginTop: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
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
  pickerContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: 48,
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
  // 手机号输入样式
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    minHeight: 52,
  },
  areaCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing[3],
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    marginRight: theme.spacing[3],
  },
  areaCodeText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing[1],
  },
  phoneInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  // 重试按钮样式
  retryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    marginLeft: theme.spacing[2],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});