import React, { useState, useEffect } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { 
  SchoolData, 
  createSchoolDataFromBackend 
} from '../../utils/schoolData';
import { 
  fetchSchoolList,
  validatePhoneNumber,
  sendSMSVerificationCode,
  registerUser
} from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';

interface RouteParams {
  registrationType?: 'phone' | 'invitation';
  referralCode?: string;
  hasReferralCode?: boolean;
  detectedRegion?: 'zh' | 'en';
  detectionResult?: any;
  identity: 2; // 家长
}

interface ParentFormData {
  legalName: string;           // 家长法定姓名
  email: string;              // 邮箱（同时作为用户名）
  phoneNumber: string;        // 手机号
  password: string;           // 密码
  confirmPassword: string;    // 确认密码
  sex: '0' | '1' | '2';      // 性别
  selectedSchool: SchoolData | null; // 孩子的学校
  areaCode: '86' | '1';      // 国际区号
  verificationCode: string;   // 验证码
}

interface ValidationErrors {
  legalName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  selectedSchool?: string;
  verificationCode?: string;
}

export const ParentRegisterFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { login: userLogin } = useUser();

  const {
    registrationType = 'phone',
    referralCode,
    hasReferralCode = false,
    detectedRegion = 'zh',
    detectionResult
  } = route.params as RouteParams || {};

  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [bizId, setBizId] = useState<string>('');

  const [formData, setFormData] = useState<ParentFormData>({
    legalName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    sex: '2', // 默认未知
    selectedSchool: null,
    areaCode: detectedRegion === 'zh' ? '86' : '1', // 根据地区设置默认区号
    verificationCode: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

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
        setSchools(schoolData);
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

  const updateFormData = <K extends keyof ParentFormData>(
    field: K, 
    value: ParentFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 验证家长法定姓名
    if (!formData.legalName.trim()) {
      newErrors.legalName = t('validation.parent_name_required');
    } else if (formData.legalName.length > 50) {
      newErrors.legalName = t('validation.name_too_long');
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

    // 验证手机号（普通注册时必填，邀请码注册时可选）
    if (registrationType === 'phone') {
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = t('validation.phone_required');
      } else if (!validatePhoneNumber(formData.phoneNumber, formData.areaCode)) {
        newErrors.phoneNumber = formData.areaCode === '86' 
          ? t('validation.phone_china_invalid')
          : t('validation.phone_us_invalid');
      }
    } else if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber, formData.areaCode)) {
      newErrors.phoneNumber = formData.areaCode === '86' 
        ? t('validation.phone_china_invalid')
        : t('validation.phone_us_invalid');
    }

    // 验证学校
    if (!formData.selectedSchool) {
      newErrors.selectedSchool = t('validation.child_school_required');
    }

    // 验证验证码（仅普通注册时需要）
    if (registrationType === 'phone' && formData.phoneNumber) {
      if (!formData.verificationCode.trim()) {
        newErrors.verificationCode = t('validation.verification_code_required');
      } else if (!/^\d{6}$/.test(formData.verificationCode)) {
        newErrors.verificationCode = t('validation.verification_code_format');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendVerificationCode = async () => {
    if (countdown > 0) return;
    if (!formData.phoneNumber) {
      Alert.alert(t('common.error'), t('validation.phone_required'));
      return;
    }

    setLoading(true);
    try {
      const response = await sendSMSVerificationCode(formData.phoneNumber, formData.areaCode);
      
      if (response.code === 'OK' && response.bizId) {
        setBizId(response.bizId);
        Alert.alert(
          t('auth.register.sms.code_sent_title'),
          t('auth.register.sms.code_sent_message', {
            countryCode: formData.areaCode,
            phoneNumber: formData.phoneNumber
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
        Alert.alert(
          t('auth.register.sms.send_failed_title'), 
          `${t('auth.register.sms.send_failed_message')}\n${response.message || ''}`
        );
      }
    } catch (error) {
      Alert.alert(
        t('auth.register.sms.send_failed_title'), 
        t('common.network_error')
      );
    } finally {
      setLoading(false);
    }
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
      // 构建家长注册请求数据
      const registrationData = {
        identity: 2, // 家长
        userName: formData.email, // 邮箱作为用户名
        legalName: formData.legalName,
        nickName: formData.email.split('@')[0], // 使用邮箱前缀作为昵称
        password: formData.password,
        email: formData.email,
        sex: formData.sex,
        deptId: parseInt(formData.selectedSchool!.id),
        areaCode: formData.areaCode,
        area: detectedRegion,
        
        // 条件字段
        ...(formData.phoneNumber && { phonenumber: formData.phoneNumber }),
        ...(registrationType === 'phone' && formData.verificationCode && {
          verCode: formData.verificationCode,
          bizId: bizId,
        }),
        ...(registrationType === 'invitation' && referralCode && {
          invCode: referralCode,
        }),
      };

      console.log('家长注册数据:', registrationData);

      const response = await registerUser(registrationData);
      
      if (response.code === 200) {
        console.log('✅ 家长注册成功！开始自动登录...');
        
        Alert.alert(''); // 关闭进度提示
        
        // 显示登录进度
        Alert.alert(
          '🔐 ' + t('auth.register.auto_login_title'),
          t('auth.register.auto_login_message'),
          [],
          { cancelable: false }
        );
        
        try {
          const loginResult = await login({
            username: formData.email,
            password: formData.password,
          });
          
          if (loginResult.code === 200 && loginResult.data) {
            await userLogin(loginResult.data.token);
            console.log('✅ 家长账户自动登录成功！');
            
            Alert.alert(
              '🎉 ' + t('auth.register.parent.success_title'),
              t('auth.register.parent.success_message'),
              [{
                text: t('auth.register.parent.start_using'),
                onPress: () => navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                  })
                )
              }],
              { cancelable: false }
            );
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
          console.error('❌ 自动登录失败:', loginError);
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
      console.error('❌ 家长注册网络错误:', error);
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
      <View style={[styles.pickerContainer, errors.selectedSchool && styles.inputError]}>
        {schoolsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('auth.register.form.loading_schools')}</Text>
          </View>
        ) : (
          <Picker
            selectedValue={formData.selectedSchool?.id || ''}
            onValueChange={(itemValue) => {
              if (itemValue) {
                const school = schools.find(s => s.id === itemValue);
                if (school) {
                  updateFormData('selectedSchool', school);
                }
              } else {
                updateFormData('selectedSchool', null);
              }
            }}
            style={styles.picker}
          >
            <Picker.Item 
              label={t('auth.register.parent.child_school_placeholder')} 
              value="" 
              color={theme.colors.text.disabled}
            />
            {schools.map((school) => (
              <Picker.Item
                key={school.id}
                label={`${school.abbreviation} - ${school.name}`}
                value={school.id}
                color={theme.colors.text.primary}
              />
            ))}
          </Picker>
        )}
      </View>
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
          <Text style={styles.headerTitle}>{t('auth.register.parent.title')}</Text>
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
              <Text style={styles.stepTitle}>{t('auth.register.parent.form_title')}</Text>
              <Text style={styles.stepSubtitle}>
                {registrationType === 'invitation' 
                  ? t('auth.register.parent.invitation_description')
                  : t('auth.register.parent.description')
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

              {/* 家长法定姓名 */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.parent.legal_name_label')}</Text>
                <TextInput
                  style={[styles.input, errors.legalName && styles.inputError]}
                  placeholder={t('auth.register.parent.legal_name_placeholder')}
                  value={formData.legalName}
                  onChangeText={(text) => updateFormData('legalName', text)}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {errors.legalName && <Text style={styles.errorText}>{errors.legalName}</Text>}
              </View>

              {/* 邮箱（作为用户名） */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.parent.email_label')}</Text>
                <TextInput
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

              {/* 手机号输入 */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {registrationType === 'invitation' 
                    ? t('auth.register.parent.phone_label_optional')
                    : t('auth.register.parent.phone_label')
                  }
                </Text>
                <View style={styles.phoneInputWrapper}>
                  <TouchableOpacity 
                    style={styles.areaCodeSelector}
                    onPress={() => {
                      Alert.alert(
                        t('auth.register.parent.select_area_code'),
                        '',
                        [
                          { text: t('auth.register.parent.area_code_china'), onPress: () => updateFormData('areaCode', '86') },
                          { text: t('auth.register.parent.area_code_usa'), onPress: () => updateFormData('areaCode', '1') },
                          { text: t('common.cancel'), style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.areaCodeText}>
                      {formData.areaCode === '86' ? t('auth.register.parent.area_code_china') : t('auth.register.parent.area_code_usa')}
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

              {/* 验证码（仅普通注册且填写了手机号时显示） */}
              {registrationType === 'phone' && formData.phoneNumber && (
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

              {/* 孩子学校选择 */}
              {renderSchoolPicker()}

              {/* 注册按钮 */}
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
                      {t('auth.register.parent.register_button')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
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
});