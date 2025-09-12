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

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { ParentStep1Data } from './ParentRegisterStep1Screen';
import { 
  sendSMSVerificationCode,
  registerUser
} from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RouteParams {
  step1Data: ParentStep1Data;
  referralCode?: string;
  hasReferralCode?: boolean;
  registrationType?: 'phone' | 'invitation';
  detectedRegion?: 'zh' | 'en';
  detectionResult?: any;
}

interface ParentStep2FormData {
  phoneNumber: string;
  verificationCode: string;
  agreedToSMS: boolean;
  agreedToTerms: boolean;
  bizId: string;
}

export const ParentRegisterStep2Screen: React.FC = () => {
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
  const [countdown, setCountdown] = useState(0);
  const [bizId, setBizId] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [formData, setFormData] = useState<ParentStep2FormData>({
    phoneNumber: '',
    verificationCode: '',
    agreedToSMS: false,
    agreedToTerms: false,
    bizId: '',
  });

  const [errors, setErrors] = useState<Partial<ParentStep2FormData>>({});

  const updateFormData = <K extends keyof ParentStep2FormData>(
    field: K, 
    value: ParentStep2FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ParentStep2FormData> = {};

    // 验证手机号（只支持中国手机号）
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t('validation.phone_required');
    } else if (!/^1[3-9]\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = t('validation.phone_china_invalid');
    }

    // 普通注册需要验证码
    if (!hasReferralCode) {
      if (!formData.verificationCode) {
        newErrors.verificationCode = t('validation.verification_code_required');
      } else if (!/^\d{6}$/.test(formData.verificationCode)) {
        newErrors.verificationCode = t('validation.verification_code_format');
      }
      
      // 普通注册需要完整的同意勾选
      if (!formData.agreedToTerms) {
        Alert.alert(t('common.error'), t('auth.register.sms.terms_privacy_required'));
        return false;
      }
      if (!formData.agreedToSMS) {
        Alert.alert(t('common.error'), t('auth.register.sms.sms_consent_checkbox'));
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 检查是否可以发送验证码
  const canSendCode = () => {
    return formData.phoneNumber && 
           /^1[3-9]\d{9}$/.test(formData.phoneNumber) &&
           formData.agreedToTerms && 
           formData.agreedToSMS &&
           countdown === 0 &&
           !loading;
  };

  const sendVerificationCode = async () => {
    if (!canSendCode()) {
      if (!formData.agreedToTerms || !formData.agreedToSMS) {
        Alert.alert(t('common.error'), t('auth.register.form.send_code_hint'));
        return;
      }
      return;
    }

    setLoading(true);
    try {
      const response = await sendSMSVerificationCode(formData.phoneNumber, '86');
      
      if (response.code === 'OK' && response.bizId) {
        setBizId(response.bizId);
        updateFormData('bizId', response.bizId);
        Alert.alert(
          t('auth.register.sms.code_sent_title'),
          t('auth.register.sms.code_sent_message', {
            countryCode: '86',
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
          response.message || t('auth.register.sms.send_failed_message')
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
    
    try {
      // 构建家长注册请求数据
      const registrationData = {
        identity: 2, // 家长身份
        userName: step1Data.email,
        legalName: `${step1Data.firstName} ${step1Data.lastName}`,
        nickName: step1Data.email.split('@')[0],
        password: step1Data.password,
        phonenumber: formData.phoneNumber,
        email: step1Data.email,
        sex: step1Data.sex,
        deptId: parseInt(step1Data.selectedSchool!.id),
        area: detectedRegion,
        areaCode: '86', // 固定为中国区号
        
        // 根据注册类型添加相应字段
        ...(hasReferralCode ? {
          invCode: referralCode,
        } : {
          verCode: formData.verificationCode,
          bizId: formData.bizId,
        }),
      };

      console.log('📋 家长注册数据:', {
        ...registrationData,
        password: '[HIDDEN]',
      });

      const response = await registerUser(registrationData);
      
      if (response.code === 200) {
        console.log('✅ 家长注册成功！开始自动登录...');
        
        try {
          const loginResult = await login({
            username: step1Data.email,
            password: step1Data.password,
          });
          
          if (loginResult.code === 200 && loginResult.data) {
            // 手动保存token到AsyncStorage
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());
            
            await userLogin(loginResult.data.token);
            console.log('✅ 家长账户自动登录成功！');
            
            setLoading(false);
            setShowSuccessModal(true);
          } else {
            // 注册成功但登录失败
            Alert.alert(
              t('auth.register.success.title'),
              t('auth.register.success.manual_login', { email: step1Data.email }),
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
            t('auth.register.success.title'),
            t('auth.register.success.manual_login', { email: step1Data.email }),
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
        Alert.alert(
          t('auth.register.parent.failed_title'),
          response.msg || t('auth.register.parent.failed_message'),
          [
            { text: t('common.retry'), onPress: () => setLoading(false) },
            { text: t('common.back'), style: 'cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ 家长注册网络错误:', error);
      Alert.alert(
        t('common.network_error'),
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

  // 处理条款和隐私政策点击
  const handleTermsPress = (type: 'terms' | 'privacy') => {
    // 根据detectedRegion显示对应地区的条款
    navigation.navigate('Terms', { 
      type, 
      area: detectedRegion || 'zh' 
    });
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
          <Text style={styles.headerTitle}>{t('auth.register.parent.title')}</Text>
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
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>{t('auth.register.form.phone_verification')}</Text>
              <Text style={styles.stepSubtitle}>{t('auth.register.form.phone_verification_desc')}</Text>

              {/* 推荐码提示 */}
              {hasReferralCode && (
                <View style={styles.referralBadge}>
                  <Ionicons name="gift" size={20} color={theme.colors.primary} />
                  <Text style={styles.referralText}>
                    {t('auth.register.form.referral_code', { code: referralCode })}
                  </Text>
                </View>
              )}

              {/* 中国手机号固定显示 */}
              <View style={styles.phoneHeaderContainer}>
                <View style={styles.phoneTypeIndicator}>
                  <Text style={styles.phoneTypeIndicatorText}>
                    🇨🇳 中国手机号
                  </Text>
                </View>
              </View>

              {/* 手机号输入 */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.register.parent.phone_label')} *</Text>
                <View style={styles.phoneInputWrapper}>
                  <Text style={styles.phonePrefix}>+86</Text>
                  <TextInput
                    style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
                    placeholder="13812345678"
                    value={formData.phoneNumber}
                    onChangeText={(text) => updateFormData('phoneNumber', text)}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                </View>
                {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
              </View>

              {/* 服务条款同意区域 - 普通注册时显示 */}
              {!hasReferralCode && (
                <View style={styles.termsAgreementContainer}>
                  {/* 服务条款勾选 - 只有点击勾选框才能勾选 */}
                  <View style={styles.checkboxContainer}>
                    <View style={styles.checkboxRow}>
                      <TouchableOpacity 
                        onPress={() => updateFormData('agreedToTerms', !formData.agreedToTerms)}
                        style={styles.checkboxOnly}
                      >
                        <View style={[styles.checkbox, formData.agreedToTerms && styles.checkboxChecked]}>
                          {formData.agreedToTerms && (
                            <Ionicons name="checkmark" size={16} color={theme.colors.text.inverse} />
                          )}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.checkboxTextContainer}>
                        <View style={styles.termsTextRow}>
                          <Text style={styles.checkboxText}>阅读并同意 </Text>
                          <TouchableOpacity onPress={() => handleTermsPress('terms')}>
                            <Text style={styles.termsLink}>《服务条款》</Text>
                          </TouchableOpacity>
                          <Text style={styles.checkboxText}> 和 </Text>
                          <TouchableOpacity onPress={() => handleTermsPress('privacy')}>
                            <Text style={styles.termsLink}>《隐私政策》</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {/* SMS同意勾选 - 只有点击勾选框才能勾选 */}
                  <View style={styles.checkboxContainer}>
                    <View style={styles.checkboxRow}>
                      <TouchableOpacity 
                        onPress={() => updateFormData('agreedToSMS', !formData.agreedToSMS)}
                        style={styles.checkboxOnly}
                      >
                        <View style={[styles.checkbox, formData.agreedToSMS && styles.checkboxChecked]}>
                          {formData.agreedToSMS && (
                            <Ionicons name="checkmark" size={16} color={theme.colors.text.inverse} />
                          )}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.checkboxTextContainer}>
                        <Text style={styles.checkboxText}>
                          我同意接收来自PomeloX的短信验证码
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.termsDescription}>
                    短信费用和数据费用可能适用。输入您的手机号码即可从PomeloX接收一次性密码短信到您的手机。短信内容可能有所不同。回复"HELP"获取帮助。回复"STOP"取消。
                  </Text>
                </View>
              )}

              {/* 验证码发送按钮 - 移到条款同意后 */}
              {!hasReferralCode && (
                <View style={styles.sendCodeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.sendCodeButtonLarge,
                      !canSendCode() && styles.sendCodeButtonDisabled
                    ]}
                    onPress={sendVerificationCode}
                    disabled={!canSendCode()}
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
                  {!canSendCode() && countdown === 0 && (
                    <Text style={styles.sendCodeHint}>
                      请先完成上方的条款同意
                    </Text>
                  )}
                </View>
              )}

              {/* 验证码输入 - 在发送验证码后显示 */}
              {!hasReferralCode && formData.bizId && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.register.form.verification_code_label')} *</Text>
                  <TextInput
                    style={[styles.verificationInput, errors.verificationCode && styles.inputError]}
                    placeholder={t('auth.register.form.verification_code_placeholder')}
                    value={formData.verificationCode}
                    onChangeText={(text) => updateFormData('verificationCode', text)}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                  {errors.verificationCode && <Text style={styles.errorText}>{errors.verificationCode}</Text>}
                </View>
              )}

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
      
      {/* 成功Modal */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('auth.register.parent.success_title')}
        message={t('auth.register.parent.success_message')}
        confirmText={t('auth.register.parent.start_using')}
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
  phoneHeaderContainer: {
    marginBottom: theme.spacing[4],
  },
  phoneTypeIndicator: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  phoneTypeIndicatorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
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
  phoneInputWrapper: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  phonePrefix: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.background.tertiary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  verificationInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sendCodeContainer: {
    marginBottom: theme.spacing[4],
    alignItems: 'center',
  },
  sendCodeButtonLarge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200,
  },
  sendCodeButtonDisabled: {
    opacity: 0.5,
  },
  sendCodeText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  sendCodeHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
    textAlign: 'center',
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  termsAgreementContainer: {
    marginBottom: theme.spacing[4],
  },
  checkboxContainer: {
    marginBottom: theme.spacing[3],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxOnly: {
    padding: theme.spacing[1],
    marginRight: theme.spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * 1.4,
  },
  termsTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsLink: {
    color: '#dc3545',
    fontWeight: theme.typography.fontWeight.medium,
  },
  termsDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[3],
    lineHeight: theme.typography.fontSize.xs * 1.4,
    textAlign: 'center',
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