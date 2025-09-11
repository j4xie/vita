import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { WebTextInput } from '../../components/web/WebTextInput';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

export const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode } = darkModeSystem;
  
  console.log('📱 [ForgotPassword] 组件初始化');
  
  const [phone, setPhone] = useState('');
  const [areaCode, setAreaCode] = useState('+86'); // 默认中国区号
  
  // 调试手机号输入
  const handlePhoneChange = (text: string) => {
    console.log('📱 [ForgotPassword] 手机号输入变化:', { 
      oldPhone: phone, 
      newPhone: text, 
      length: text.length 
    });
    setPhone(text);
  };
  const [verificationCode, setVerificationCode] = useState('');
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
  const buttonColorAnim = useRef(new Animated.Value(0)).current;
  
  // 倒计时timer
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 表单验证
  React.useEffect(() => {
    const isPhoneValid = validatePhone(phone);
    const isFormValid = isPhoneValid && countdown === 0;
    
    console.log('🔄 [ForgotPassword] 实时验证:', {
      phone,
      phoneLength: phone.length,
      isPhoneValid,
      countdown,
      isFormValid,
      currentFormValid: formValid
    });
    
    if (isFormValid !== formValid) {
      setFormValid(isFormValid);
      console.log('✅ [ForgotPassword] 表单状态更新:', { formValid: isFormValid });
      
      // 按钮颜色动画
      Animated.timing(buttonColorAnim, {
        toValue: isFormValid ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
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
    const trimmedPhone = phone.trim();
    
    if (areaCode === '+86') {
      // 中国手机号验证：1开头，第二位3-9，总共11位
      const phoneRegex = /^1[3-9]\d{9}$/;
      const isValid = phoneRegex.test(trimmedPhone);
      
      console.log('🇨🇳 [ForgotPassword] 中国手机号验证:', {
        phone: trimmedPhone,
        length: trimmedPhone.length,
        pattern: '1[3-9]xxxxxxxxx',
        isValid
      });
      
      return isValid;
    } else {
      // 美国手机号验证：10位数字
      const phoneRegex = /^[2-9]\d{2}[2-9]\d{6}$/;
      const isValid = phoneRegex.test(trimmedPhone);
      
      console.log('🇺🇸 [ForgotPassword] 美国手机号验证:', {
        phone: trimmedPhone,
        length: trimmedPhone.length,
        pattern: '[2-9]xx[2-9]xxxxxx',
        isValid
      });
      
      return isValid;
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
    console.log('🔍 [ForgotPassword] 开始发送验证码:', { phone, areaCode });
    
    const isValid = validateForm();
    console.log('📋 [ForgotPassword] 表单验证结果:', { 
      isValid, 
      phone, 
      phoneLength: phone.length,
      areaCode,
      errors 
    });
    
    if (!isValid) {
      console.log('❌ [ForgotPassword] 表单验证失败，停止执行');
      return;
    }
    
    console.log('✅ [ForgotPassword] 表单验证通过，开始API调用');
    setLoading(true);
    
    try {
      // 根据区号确定areaCode参数
      const apiAreaCode = areaCode === '+86' ? 'CN' : 'US';
      
      console.log('📱 发送忘记密码验证码:', { phone, areaCode: apiAreaCode });
      
      const result = await pomeloXAPI.sendPasswordResetCode(phone, apiAreaCode);
      
      console.log('📊 [ForgotPassword] API返回结果分析:', {
        code: result.code,
        codeType: typeof result.code,
        isOK: result.code === 'OK',
        is200: result.code === 200,
        bizId: result.bizId,
        message: result.message
      });

      if (result.code === 'OK' && result.bizId) {
        console.log('✅ [ForgotPassword] 验证码发送成功，准备跳转');
        setCodeSent(true);
        startCountdown();
        
        Alert.alert(
          t('auth.forgot_password.code_sent_title'),
          t('auth.forgot_password.code_sent_message', { phone }),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                console.log('🔄 [ForgotPassword] 用户确认，跳转到验证码输入页面');
                // 这里应该跳转到验证码输入页面
                // navigation.navigate('VerifyResetCode', { phone, bizId: result.bizId });
              }
            }
          ]
        );
        
        // 触觉反馈
        Haptics.notificationAsync('success');
      } else {
        console.log('❌ [ForgotPassword] API返回失败:', result);
        Alert.alert(
          t('common.error'),
          result.msg || result.message || t('auth.forgot_password.send_code_failed')
        );
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      Alert.alert(
        t('common.error'),
        t('auth.forgot_password.send_code_error')
      );
    } finally {
      setLoading(false);
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
      navigation.navigate('SetNewPassword', {
        phone,
        areaCode: apiAreaCode,
        verificationCode
      });
      
      // 触觉反馈
      Haptics.notificationAsync('success');
      
    } catch (error) {
      console.error('验证码验证失败:', error);
      Alert.alert(
        t('common.error'),
        t('auth.forgot_password.verify_code_error')
      );
    } finally {
      setVerifyLoading(false);
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
    
    Haptics.impactAsync('light');
    
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: false,
      tension: 150,
      friction: 8,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 150,
      friction: 8,
    }).start();
  };

  const getButtonStyles = () => {
    const backgroundColor = buttonColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.text.disabled, theme.colors.primary],
    });

    return {
      backgroundColor,
      transform: [{ scale: buttonScaleAnim }],
    };
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // 清理计时器
  React.useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, []);

  return (
    <LinearGradient
      colors={isDarkMode ? DAWN_GRADIENTS.nightDeep : DAWN_GRADIENTS.skyCool}
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
                  <WebTextInput
                    style={styles.input}
                    placeholder={t('auth.forgot_password.phone_placeholder')}
                    value={phone}
                    onChangeText={(text) => {
                      handlePhoneChange(text);
                      if (errors.phone) setErrors({...errors, phone: undefined});
                    }}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.colors.text.disabled}
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
                  onPress={() => {
                    console.log('🔥 [ForgotPassword] 按钮被点击了！', {
                      formValid,
                      loading,
                      countdown,
                      phone,
                      phoneLength: phone.length,
                      disabled: !formValid || loading || countdown > 0
                    });
                    handleSendCode();
                  }}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={!formValid || loading || countdown > 0}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.text.inverse} />
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
                    <WebTextInput
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
                      keyboardType="numeric"
                      maxLength={6}
                      placeholderTextColor={theme.colors.text.disabled}
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
                      <ActivityIndicator color={theme.colors.text.inverse} />
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
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
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
    borderColor: 'transparent',
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