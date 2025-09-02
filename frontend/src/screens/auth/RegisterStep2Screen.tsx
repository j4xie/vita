import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

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

interface RouteParams {
  step1Data: RegistrationStep1Data & { legalName: string };
  referralCode?: string;
  hasReferralCode?: boolean;
  registrationType?: 'phone' | 'invitation';
}

export const RegisterStep2Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  
  const { 
    step1Data, 
    referralCode, 
    hasReferralCode = false, 
    registrationType = 'phone' 
  } = route.params as RouteParams;

  const [loading, setLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [bizId, setBizId] = useState<string>('');
  
  // 实时验证状态
  const [userNameChecking, setUserNameChecking] = useState(false);
  const [userNameAvailable, setUserNameAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  
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

    // 验证用户名
    if (!formData.userName.trim()) {
      newErrors.userName = t('validation.username_required');
    } else if (formData.userName.length < 6 || formData.userName.length > 20) {
      newErrors.userName = t('validation.username_length');
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.userName)) {
      newErrors.userName = t('validation.username_format');
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
      console.log('🔥 开始发送验证码，手机号:', step1Data.phoneNumber);
      const response = await sendSMSVerificationCode(step1Data.phoneNumber);
      
      console.log('📱 短信接口响应:', response);
      
      if (response.code === 'OK' && response.bizId) {
        console.log('✅ 验证码发送成功, bizId:', response.bizId);
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

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 构建注册请求数据 - 根据注册类型决定字段
      let registrationData: RegistrationAPIRequest;

      if (registrationType === 'invitation') {
        // ②邀请码注册：手机号和邮箱可填可不填，verCode不填
        registrationData = {
          userName: formData.userName,
          legalName: step1Data.legalName,
          nickName: formData.nickName,
          password: formData.password,
          sex: formData.sex,
          deptId: parseInt(step1Data.selectedSchool!.id),
          orgId: formData.selectedOrganization!.id,
          invCode: referralCode!, // 邀请码注册必须有invCode
          // 可选字段
          ...(step1Data.phoneNumber && { phonenumber: step1Data.phoneNumber }),
          ...(formData.email && { email: formData.email }),
          // 不包含 verCode 和 bizId
        };
      } else {
        // ①手机验证码注册：invCode不填
        registrationData = {
          userName: formData.userName,
          legalName: step1Data.legalName,
          nickName: formData.nickName,
          password: formData.password,
          phonenumber: step1Data.phoneNumber, // 手机号必填
          email: formData.email, // 邮箱必填
          sex: formData.sex,
          deptId: parseInt(step1Data.selectedSchool!.id),
          orgId: formData.selectedOrganization!.id,
          // 注意：由于短信服务未配置，暂时不包含验证码
          // verCode: formData.verificationCode,
          // bizId: bizId,
          // 不包含 invCode
        };
      }

      console.log('发送注册数据:', registrationData); // 调试信息

      // 调用真实的注册API
      const response = await registerUser(registrationData);
      
      console.log('注册响应:', response); // 调试信息
      
      if (response.code === 200) {
        Alert.alert(
          t('auth.register.success.title'),
          t('auth.register.success.message'),
          [
            {
              text: t('common.confirm'),
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        // 详细的错误处理
        let errorMessage = response.msg || t('auth.register.errors.register_failed_message');
        
        // 如果msg为null或空，根据code处理
        if (!response.msg) {
          switch (response.code) {
            case 500:
              errorMessage = '服务器内部错误，请稍后重试或联系管理员';
              break;
            case 400:
              errorMessage = '注册信息格式不正确，请检查后重试';
              break;
            case 409:
              errorMessage = '用户名或邮箱已存在';
              break;
            default:
              errorMessage = `注册失败 (错误码: ${response.code})`;
          }
        } else {
          // 特殊错误消息处理
          if (errorMessage.includes('注册功能')) {
            errorMessage = '当前系统暂未开启注册功能，请联系管理员';
          } else if (errorMessage.includes('用户名')) {
            errorMessage = '用户名已存在或格式不正确';
          } else if (errorMessage.includes('验证码')) {
            errorMessage = '验证码错误或已过期';
          } else if (errorMessage.includes('邮箱')) {
            errorMessage = '邮箱格式不正确或已被使用';
          }
        }
        
        Alert.alert(
          t('auth.register.errors.register_failed'),
          errorMessage
        );
      }
    } catch (error) {
      console.error('注册失败:', error);
      
      // 网络错误的具体处理
      let errorMessage = t('auth.register.errors.register_failed_message');
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else if (error.message.includes('500')) {
          errorMessage = '服务器内部错误，请稍后重试';
        }
      }
      
      Alert.alert(
        t('auth.register.errors.register_failed'),
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderOrganizationPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.organization_label')}</Text>
      <View style={[styles.pickerContainer, errors.selectedOrganization && styles.inputError]}>
        {organizationsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('auth.register.form.loading_organizations')}</Text>
          </View>
        ) : (
          <Picker
            selectedValue={formData.selectedOrganization?.id || ''}
            onValueChange={(itemValue) => {
              if (itemValue) {
                const organization = organizations.find(org => org.id === itemValue);
                if (organization) {
                  updateFormData('selectedOrganization', organization);
                }
              } else {
                updateFormData('selectedOrganization', null);
              }
            }}
            style={styles.picker}
          >
            <Picker.Item 
              label={t('auth.register.form.organization_placeholder')} 
              value="" 
              color={theme.colors.text.disabled}
            />
            {organizations.map((org) => (
              <Picker.Item
                key={org.id}
                label={org.name}
                value={org.id}
                color={theme.colors.text.primary}
              />
            ))}
          </Picker>
        )}
      </View>
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
          <View style={styles.headerRight} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>{t('auth.register.form.progress', { current: 2, total: 2 })}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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

            {/* 用户名 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.username_label')}</Text>
              <TextInput
                style={[styles.input, errors.userName && styles.inputError]}
                placeholder={t('auth.register.form.username_placeholder')}
                value={formData.userName}
                onChangeText={(text) => updateFormData('userName', text)}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.text.disabled}
              />
              {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
            </View>

            {/* 昵称 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.nickname_label')}</Text>
              <TextInput
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
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* 性别选择 */}
            {renderGenderSelector()}

            {/* 组织选择 */}
            {renderOrganizationPicker()}

            {/* 手机验证码 - 暂时隐藏，因为短信服务未配置 */}
            {false && (
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
          </View>
        </ScrollView>

        {/* Bottom Button */}
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
      </KeyboardAvoidingView>
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
  pickerContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  picker: {
    color: theme.colors.text.primary,
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
    padding: theme.spacing[6],
    backgroundColor: theme.colors.text.inverse,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
});