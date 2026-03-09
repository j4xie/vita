import React, { useState, useRef } from 'react';
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
  Animated,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import * as Haptics from 'expo-haptics';
import { LoaderOne } from '../../components/ui/LoaderOne';

// 安全的Haptics封装
const safeHaptics = {
  impact: async (style: Haptics.ImpactFeedbackStyle) => {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(style);
      }
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  },
  notification: async (type: Haptics.NotificationFeedbackType) => {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(type);
      }
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }
};

export const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode } = darkModeSystem;

  const [phone, setPhone] = useState('');
  const [areaCode, setAreaCode] = useState('+86'); // 默认中国区号
  const [verificationCode, setVerificationCode] = useState('');
  const [bizId, setBizId] = useState(''); // 保存发送验证码返回的bizId
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // 表单验证状态
  const [errors, setErrors] = useState<{phone?: string; code?: string}>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [formValid, setFormValid] = useState(false);
  const [verifyFormValid, setVerifyFormValid] = useState(false);
  
  // 动画状态
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // 倒计时timer
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  // 组件挂载状态
  const isMounted = useRef(true);
  
  // 表单验证
  React.useEffect(() => {
    const isPhoneValid = validatePhone(phone);
    const isFormValid = isPhoneValid && countdown === 0;

    if (isFormValid !== formValid) {
      setFormValid(isFormValid);
    }
  }, [phone, countdown, formValid]);

  // 验证码表单验证
  React.useEffect(() => {
    const isCodeValid = validateCode(verificationCode);
    const isVerifyFormValid = isCodeValid && codeSent;
    
    if (isVerifyFormValid !== verifyFormValid) {
      setVerifyFormValid(isVerifyFormValid);
    }
  }, [verificationCode, codeSent, verifyFormValid]);

  const validatePhone = (phone: string) => {
    if (areaCode === '+86') {
      // 中国手机号验证 - 支持所有运营商号段
      // 移动: 134-139, 150-152, 157-159, 182-184, 187-188, 178, 198
      // 联通: 130-132, 155-156, 185-186, 175-176
      // 电信: 133, 153, 180-181, 189, 177, 199
      // 虚拟运营商: 170-171, 162-165, 167
      const phoneRegex = /^1[3-9]\d{9}$/;

      // 验证长度和基本格式
      if (!phoneRegex.test(phone)) {
        return false;
      }

      // 验证号段 - 包含所有已知的有效号段
      const prefix = phone.substring(0, 3);
      const validPrefixes = [
        // 移动
        '134', '135', '136', '137', '138', '139',
        '150', '151', '152', '157', '158', '159',
        '182', '183', '184', '187', '188',
        '178', '198',
        // 联通
        '130', '131', '132', '133', '155', '156',
        '185', '186', '175', '176',
        // 电信
        '153', '180', '181', '189', '177', '199',
        // 虚拟运营商
        '170', '171', '162', '163', '164', '165', '167'
      ];

      return validPrefixes.includes(prefix);
    } else {
      // 美国手机号验证 (简化验证)
      const phoneRegex = /^[2-9]\d{2}[2-9]\d{6}$/;
      return phoneRegex.test(phone);
    }
  };

  const validateCode = (code: string) => {
    // 验证码必须是6位数字
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  };

  const startCountdown = () => {
    let count = 60;
    setCountdown(count);
    
    countdownTimer.current = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        if (countdownTimer.current) {
          clearInterval(countdownTimer.current);
          countdownTimer.current = null;
        }
      }
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 根据区号确定areaCode参数
      const apiAreaCode = areaCode === '+86' ? 'CN' : 'US';
      
      console.log('📱 发送忘记密码验证码:', { phone, areaCode: apiAreaCode });
      
      const result = await pomeloXAPI.sendPasswordResetCode(phone, apiAreaCode);
      
      console.log('📊 [App-ForgotPassword] API返回结果分析:', {
        code: result.code,
        codeType: typeof result.code,
        isOK: String(result.code) === "OK",
        is200: result.code === 200,
        bizId: (result as any).bizId,
        message: (result as any).message
      });

      if (String(result.code) === "OK" && (result as any).bizId) {
        console.log('✅ [App-ForgotPassword] 验证码发送成功, bizId:', (result as any).bizId);

        if (isMounted.current) {
          setBizId((result as any).bizId); // 保存bizId用于后续重置密码
          setCodeSent(true);
          startCountdown();
        }

        // 不使用Alert，直接显示验证码输入框
        // 触觉反馈
        await safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      } else {
        console.log('❌ [App-ForgotPassword] API返回失败:', result);

        // 分析具体失败原因
        let errorMessage = result.msg || (result as any).message || t('auth.forgot_password.send_code_failed');

        // 根据错误信息提供更明确的提示
        if (errorMessage.includes('手机号') || errorMessage.includes('phone')) {
          errorMessage = `手机号码验证失败 (${phone})，请检查号码是否正确或联系客服`;
        } else if (errorMessage.includes('号段') || errorMessage.includes('segment')) {
          errorMessage = `号码段 ${phone.substring(0, 3)} 暂不支持，请使用其他号码或联系客服`;
        } else if (errorMessage.includes('频率') || errorMessage.includes('limit') ||
                   errorMessage.includes('流控') || errorMessage.includes('Permits') ||
                   errorMessage.includes('BUSINESS_LIMIT_CONTROL')) {
          errorMessage = '发送验证码过于频繁，请1小时后再试';
        }

        console.log('🔍 [App-ForgotPassword] 错误详情:', {
          originalError: result,
          processedMessage: errorMessage,
          phone: phone,
          prefix: phone.substring(0, 3)
        });

        Alert.alert(
          t('common.error'),
          errorMessage
        );
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      if (isMounted.current) {
        Alert.alert(
          t('common.error'),
          t('auth.forgot_password.send_code_error')
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!validateCodeForm()) return;
    
    setVerifyLoading(true);
    
    try {
      // 根据区号确定areaCode参数
      const apiAreaCode = areaCode === '+86' ? 'CN' : 'US';
      
      console.log('🔐 验证忘记密码验证码:', { phone, code: verificationCode, areaCode: apiAreaCode });
      
      // 这里应该调用验证码验证API，暂时模拟验证成功
      // TODO: 添加实际的验证码验证API调用
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
      
      // 验证成功，跳转到设置新密码页面
      // 确保参数都有值
      navigation.navigate('SetNewPassword', {
        phone: phone || '',
        areaCode: apiAreaCode || '',
        verificationCode: verificationCode || '',
        bizId: bizId || '', // 传递真实的bizId
      });

      // 触觉反馈
      await safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('验证码验证失败:', error);
      if (isMounted.current) {
        Alert.alert(
          t('common.error'),
          t('auth.forgot_password.verify_code_error')
        );
      }
    } finally {
      if (isMounted.current) {
        setVerifyLoading(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors: {phone?: string} = {};
    
    if (!phone || phone.trim().length === 0) {
      newErrors.phone = t('auth.validation.phone_required');
    } else if (!validatePhone(phone)) {
      newErrors.phone = areaCode === '+86' 
        ? t('auth.validation.phone_invalid_cn')
        : t('auth.validation.phone_invalid_us');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCodeForm = () => {
    const newErrors: {phone?: string; code?: string} = {};
    
    if (!verificationCode || verificationCode.trim().length === 0) {
      newErrors.code = t('auth.validation.verification_code_required');
    } else if (!validateCode(verificationCode)) {
      newErrors.code = t('auth.validation.verification_code_format');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleButtonPressIn = () => {
    if (!formValid || loading) return;

    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const getButtonStyles = () => {
    return {
      backgroundColor: formValid ? theme.colors.primary : theme.colors.text.disabled,
      transform: [{ scale: buttonScaleAnim }],
    };
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // 清理计时器和设置组件卸载状态
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
    };
  }, []);

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1C1C1E', '#2C2C2E', '#3A3A3C'] : DAWN_GRADIENTS.skyCool}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('auth.forgot_password.title')}</Text>
            </View>

            {/* Main Content Card */}
            <View style={styles.contentCard}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>{t('auth.forgot_password.reset_password')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.forgot_password.subtitle')}
                </Text>
              </View>

              {/* Area Code Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.forgot_password.area_code_label')}</Text>
                <View style={styles.areaCodeContainer}>
                  <TouchableOpacity 
                    style={[styles.areaCodeButton, areaCode === '+86' && styles.areaCodeButtonActive]}
                    onPress={() => setAreaCode('+86')}
                  >
                    <Text style={[styles.areaCodeText, areaCode === '+86' && styles.areaCodeTextActive]}>
                      🇨🇳 +86
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.areaCodeButton, areaCode === '+1' && styles.areaCodeButtonActive]}
                    onPress={() => setAreaCode('+1')}
                  >
                    <Text style={[styles.areaCodeText, areaCode === '+1' && styles.areaCodeTextActive]}>
                      🇺🇸 +1
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.forgot_password.phone_label')}</Text>
                <View style={[
                  styles.inputWrapper, 
                  errors.phone && styles.inputError, 
                  focusedInput === 'phone' && styles.inputFocused
                ]}>
                  <Ionicons name="phone-portrait-outline" size={20} color={theme.colors.text.disabled} />
                  <Text style={styles.areaCodePrefix}>{areaCode}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={areaCode === '+86' ? '请输入手机号码' : 'Enter phone number'}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (errors.phone) setErrors({...errors, phone: undefined});
                    }}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.colors.text.disabled}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                      setFocusedInput(null);
                    }}
                  />
                </View>
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* Send Code Button */}
              <Animated.View style={[styles.sendButtonContainer, getButtonStyles()]}>
                <TouchableOpacity
                  style={styles.sendButtonInner}
                  onPress={handleSendCode}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={!formValid || loading || countdown > 0}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <LoaderOne size="small" color={theme.colors.text.inverse} />
                  ) : (
                    <Text style={styles.sendButtonText}>
                      {countdown > 0
                        ? t('auth.forgot_password.resend_after', { seconds: countdown })
                        : codeSent
                          ? t('auth.forgot_password.resend_code')
                          : t('auth.forgot_password.send_code')
                      }
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Verification Code Input - 验证码发送成功后显示 */}
              {codeSent && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.forgot_password.verification_code_label')}</Text>
                  <View style={[
                    styles.inputWrapper, 
                    errors.code && styles.inputError, 
                    focusedInput === 'code' && styles.inputFocused
                  ]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text.disabled} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('auth.forgot_password.verification_code_placeholder')}
                      value={verificationCode}
                      onChangeText={(text) => {
                        // 限制只能输入6位数字
                        const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                        setVerificationCode(numericText);
                        if (errors.code) setErrors({...errors, code: undefined});
                      }}
                      onFocus={() => setFocusedInput('code')}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholderTextColor={theme.colors.text.disabled}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                        setFocusedInput(null);
                      }}
                    />
                  </View>
                  {errors.code && (
                    <Text style={styles.errorText}>{errors.code}</Text>
                  )}
                </View>
              )}

              {/* Verify Code Button - 验证码输入后显示 */}
              {codeSent && verificationCode.length > 0 && (
                <Animated.View style={[
                  styles.sendButtonContainer,
                  { backgroundColor: verifyFormValid ? theme.colors.primary : theme.colors.text.disabled }
                ]}>
                  <TouchableOpacity
                    style={styles.sendButtonInner}
                    onPress={handleVerifyCode}
                    disabled={!verifyFormValid || verifyLoading}
                    activeOpacity={0.9}
                  >
                    {verifyLoading ? (
                      <LoaderOne size="small" color={theme.colors.text.inverse} />
                    ) : (
                      <Text style={styles.sendButtonText}>
                        {t('auth.forgot_password.verify_code_button')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Success Message */}
              {codeSent && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                  <Text style={styles.successText}>
                    {t('auth.forgot_password.code_sent_success')}
                  </Text>
                  <Text style={styles.instructionText}>
                    {t('auth.forgot_password.check_sms_instruction')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  
  // Content Card
  contentCard: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow.light],
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
  },
  
  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  
  // Form
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  // Area Code Selection
  areaCodeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  areaCodeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: theme.borderRadius.base,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  areaCodeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 123, 0, 0.1)',
  },
  areaCodeText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  areaCodeTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing[4],
    borderWidth: 1.5,
    borderColor: theme.colors.border.primary,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowRadius: 8,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(251, 84, 84, 0.05)',
  },
  areaCodePrefix: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Send Button
  sendButtonContainer: {
    borderRadius: theme.borderRadius.button,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  sendButtonInner: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.button,
  },
  sendButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  
  // Success Message
  successContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: theme.borderRadius.base,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  successText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.success,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
});