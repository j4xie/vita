import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { i18n } from '../../utils/i18n';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { WebSchoolSelector } from '../../components/web/WebSchoolSelector';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { 
  SchoolData, 
  createSchoolDataFromBackend 
} from '../../utils/schoolData';
import { 
  fetchSchoolList,
  validatePhoneNumber,
  registerUser
} from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RouteParams {
  referralCode: string;
  hasReferralCode: boolean;
  detectedRegion?: 'zh' | 'en';
  detectionResult?: any;
}

interface InvitationParentFormData {
  firstName: string;          // 家长名
  lastName: string;           // 家长姓
  email: string;              // 邮箱（同时作为用户名）
  phoneNumber: string;        // 手机号（可选）
  password: string;           // 密码
  confirmPassword: string;    // 确认密码
  sex: '0' | '1' | '2';      // 性别
  selectedSchool: SchoolData | null; // 孩子的学校
  areaCode: '86' | '1';      // 国际区号
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  selectedSchool?: string;
}

export const InvitationParentRegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();

  // 智能输入组件选择器 - Web环境使用ForceNativeInput，保证输入正常工作
  const SmartTextInput = Platform.OS === 'web' ? ForceNativeInput : WebTextInput;

  // Web专用区号选择器组件
  const AreaCodeSelector = ({ areaCode, onPress, style, textStyle }: any) => {
    const displayText = areaCode === '86' ? t('auth.register.parent.area_code_china') : t('auth.register.parent.area_code_usa');
    
    if (Platform.OS === 'web') {
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Invitation Parent Native button clicked');
            onPress();
          }}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '16px',
            paddingBottom: '16px',
            backgroundColor: '#F9FAFB',
            borderTopWidth: '0px',
            borderRightWidth: '1px',
            borderBottomWidth: '0px',
            borderLeftWidth: '0px',
            borderRightColor: '#E5E7EB',
            borderStyle: 'solid',
            cursor: 'pointer',
            outline: 'none',
            border: 'none',
            borderRight: '1px solid #E5E7EB',
          }}
        >
          <span style={{ 
            fontSize: '14px',
            color: '#374151',
            fontWeight: '500',
            marginRight: '4px'
          }}>
            {displayText}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5z" fill="#6B7280"/>
          </svg>
        </button>
      );
    }
    
    return (
      <TouchableOpacity style={style} onPress={onPress}>
        <Text style={textStyle}>{displayText}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
      </TouchableOpacity>
    );
  };

  const {
    referralCode,
    hasReferralCode = false,
    detectedRegion = 'zh',
    detectionResult
  } = route.params as RouteParams || {};

  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);

  const [formData, setFormData] = useState<InvitationParentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    sex: '2', // 默认未知
    selectedSchool: null,
    areaCode: detectedRegion === 'zh' ? '86' : '1', // 根据地区设置默认区号
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // 成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // 加载学校列表
  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setSchoolsLoading(true);
      const response = await fetchSchoolList();
      
      if (response.code === 200 && response.data) {
        const schoolData = createSchoolDataFromBackend(response.data);
        // 过滤学校：排除非学校机构（CU总部等）
        const filteredSchools = schoolData.filter(school => {
          const name = school.name.toLowerCase();
          // 包含"university"或"校"的才是学校
          return name.includes('university') || name.includes('校');
        });
        setSchools(filteredSchools);
        console.log(`📚 已过滤学校列表: ${filteredSchools.length}/${schoolData.length} 所学校`);
      } else {
        Alert.alert(t('common.error'), t('auth.register.errors.school_load_failed'));
      }
    } catch (error) {
      console.error('加载学校列表失败:', error);
      Alert.alert(t('common.error'), t('auth.register.errors.school_load_failed'));
    } finally {
      setSchoolsLoading(false);
    }
  };

  const updateFormData = <K extends keyof InvitationParentFormData>(
    field: K, 
    value: InvitationParentFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  // 中文字符验证函数
  const isChineseCharacters = (text: string): boolean => {
    return /^[\u4e00-\u9fff]+$/.test(text);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const isChinese = i18n.language === 'zh-CN';

    // 验证家长法定姓名
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.first_name_required');
    } else if (isChinese && !isChineseCharacters(formData.firstName.trim())) {
      newErrors.firstName = t('validation.chinese_name_required');
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.last_name_required');
    } else if (isChinese && !isChineseCharacters(formData.lastName.trim())) {
      newErrors.lastName = t('validation.chinese_name_required');
    }

    // 验证邮箱
    if (!formData.email.trim()) {
      newErrors.email = t('validation.email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.email_invalid');
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = t('validation.password_required');
    } else if (formData.password.length < 6 || formData.password.length > 20) {
      newErrors.password = t('validation.password_length');
    }

    // 验证确认密码
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.password_mismatch');
    }

    // 验证手机号（推荐码家长注册时必填）
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t('validation.phone_required');
    } else if (!validatePhoneNumber(formData.phoneNumber, formData.areaCode)) {
      newErrors.phoneNumber = formData.areaCode === '86' 
        ? t('validation.phone_china_invalid')
        : t('validation.phone_us_invalid');
    }

    // 验证学校
    if (!formData.selectedSchool) {
      newErrors.selectedSchool = t('validation.child_school_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    Alert.alert(
      '⏳ ' + t('auth.register.parent.registering_title'),
      t('auth.register.parent.registering_message'),
      [],
      { cancelable: false }
    );

    try {
      // 构建推荐码家长注册请求数据
      const registrationData = {
        identity: 2, // 家长
        userName: formData.email, // 邮箱作为用户名
        legalName: `${formData.lastName} ${formData.firstName}`.trim(),
        nickName: formData.email.split('@')[0], // 使用邮箱前缀作为昵称
        password: formData.password,
        email: formData.email,
        sex: formData.sex,
        deptId: parseInt(formData.selectedSchool!.id),
        areaCode: formData.areaCode,
        area: detectedRegion,
        
        // 推荐码注册特有字段
        invCode: referralCode,
        
        // 条件字段：手机号（如果提供）
        ...(formData.phoneNumber && { phonenumber: formData.phoneNumber }),
      };

      console.log('Web端推荐码家长注册数据:', registrationData);

      const response = await registerUser(registrationData);
      
      if (response.code === 200) {
        console.log('✅ Web端推荐码家长注册成功！开始自动登录...');
        
        Alert.alert(''); // 关闭进度提示
        
        // 显示登录进度
        Alert.alert(
          '🔐 ' + t('auth.register.auto_login_title'),
          t('auth.register.auto_login_message'),
          [],
          { cancelable: false }
        );
        
        try {
          // 使用真实的登录API，直接调用${process.env.EXPO_PUBLIC_API_URL}/app/login
          const formData_login = new URLSearchParams();
          formData_login.append('username', formData.email);
          formData_login.append('password', formData.password);
          
          const loginResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/app/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData_login.toString(),
          });
          
          const loginResult = await loginResponse.json();
          
          console.log('🔐 推荐码家长自动登录响应:', {
            code: loginResult.code,
            msg: loginResult.msg,
            hasToken: !!loginResult.data?.token,
            hasUserId: !!loginResult.data?.userId
          });
          
          if (loginResult.code === 200 && loginResult.data) {
            // 手动保存token和userId到正确的存储位置
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());
            
            console.log('✅ 推荐码家长Token已保存到本地存储');
            
            await userLogin(loginResult.data.token);
            console.log('✅ Web端推荐码家长账户自动登录成功！');
            
            // 显示成功弹窗而不是Alert
            setLoading(false);
            setShowSuccessModal(true);
          } else {
            // 注册成功但登录失败
            Alert.alert(
              '✅ ' + t('auth.register.success.title'),
              t('auth.register.success.manual_login', { email: formData.email }),
              [{
                text: t('auth.login.go_login'),
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
          console.error('❌ Web端推荐码家长自动登录失败:', loginError);
          Alert.alert(
            '✅ ' + t('auth.register.success.title'),
            t('auth.register.success.manual_login', { email: formData.email }),
            [{
              text: t('auth.login.go_login'),
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
        Alert.alert(''); // 关闭进度提示
        Alert.alert(
          '❌ ' + t('auth.register.parent.failed_title'),
          response.msg || t('auth.register.parent.failed_message'),
          [
            { text: t('common.retry'), onPress: () => setLoading(false) },
            { text: t('common.back'), style: 'cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Web端推荐码家长注册网络错误:', error);
      Alert.alert(''); // 关闭进度提示
      Alert.alert(
        '🌐 ' + t('common.network_error'),
        t('auth.register.network_error_message'),
        [
          { text: t('common.retry'), onPress: () => setLoading(false) },
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

  const renderSchoolPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.parent.child_school_label')}</Text>
      <WebSchoolSelector
        schools={schools}
        selectedSchool={formData.selectedSchool}
        onSchoolSelect={(school) => updateFormData('selectedSchool', school)}
        placeholder={t('auth.register.parent.child_school_placeholder')}
        loading={schoolsLoading}
        error={!!errors.selectedSchool}
        accessibilityLabel={t('auth.register.parent.child_school_label')}
      />
      {errors.selectedSchool && <Text style={styles.errorText}>{errors.selectedSchool}</Text>}
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      
      <View style={styles.contentView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('auth.register.parent.invitation_title')}</Text>
          <View style={styles.headerRight} />
        </View>

        <Pressable onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>{t('auth.register.parent.invitation_form_title')}</Text>
              <Text style={styles.stepSubtitle}>
                {t('auth.register.parent.invitation_description')}
              </Text>

              {/* 推荐码提示 */}
              {hasReferralCode && (
                <View style={styles.referralBadge}>
                  <Ionicons name="gift" size={20} color={theme.colors.primary} />
                  <Text style={styles.referralText}>
                    {t('auth.register.form.referral_code', { code: referralCode })}
                  </Text>
                </View>
              )}

              {/* 家长姓名（分离字段） */}
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.nameInput]}>
                  <Text style={styles.label}>{t('auth.register.form.last_name_label')}</Text>
                  <SmartTextInput
                    style={[styles.input, errors.lastName && styles.inputError]}
                    placeholder={t('auth.register.form.last_name_placeholder')}
                    value={formData.lastName}
                    onChangeText={(text) => updateFormData('lastName', text)}
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>

                <View style={[styles.inputContainer, styles.nameInput]}>
                  <Text style={styles.label}>{t('auth.register.form.first_name_label')}</Text>
                  <SmartTextInput
                    style={[styles.input, errors.firstName && styles.inputError]}
                    placeholder={t('auth.register.form.first_name_placeholder')}
                    value={formData.firstName}
                    onChangeText={(text) => updateFormData('firstName', text)}
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>
              </View>

              {/* 邮箱（作为用户名） */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.parent.email_label')}</Text>
                <SmartTextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder={t('auth.register.parent.email_placeholder')}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                <Text style={styles.helpText}>{t('auth.register.parent.email_help')}</Text>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* 手机号输入（可选） */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {t('auth.register.parent.phone_label')}
                </Text>
                <View style={styles.phoneInputWrapper}>
                  <AreaCodeSelector
                    areaCode={formData.areaCode}
                    onPress={() => {
                      console.log('🖱️ Invitation Parent area code selector onPress triggered');
                      
                      // 推荐码注册允许切换区号
                      if (formData.areaCode === '86') {
                        // 切换到美国区号
                        updateFormData('areaCode', '1');
                        updateFormData('phoneNumber', ''); // 清空手机号
                        console.log('📱 Invitation Parent area code switched to: 1');
                      } else {
                        // 从美国切换回中国
                        updateFormData('areaCode', '86');
                        updateFormData('phoneNumber', ''); // 清空手机号
                        console.log('📱 Invitation Parent area code switched to: 86');
                      }
                    }}
                    style={styles.areaCodeSelector}
                    textStyle={styles.areaCodeText}
                  />
                  <SmartTextInput
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

              {/* 孩子学校选择 */}
              {renderSchoolPicker()}

              {/* 注册按钮 - 在表单内部 */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.text.inverse} />
                  ) : (
                    <Text style={styles.registerButtonText}>
                      {t('auth.register.parent.register_button')}
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
        title={t('auth.register.parent.success_title')}
        message={t('auth.register.parent.success_message')}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6], // 正常的底部间距
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
    lineHeight: theme.typography.fontSize.base * 1.4,
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
  helpText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
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
    borderRightColor: theme.colors.border,
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
  buttonContainer: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[6],
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
});