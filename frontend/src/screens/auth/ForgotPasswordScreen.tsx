import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import emailAPI from '../../services/emailAPI';
import * as Haptics from 'expo-haptics';
import { LoaderOne } from '../../components/ui/LoaderOne';
import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../../components/common/KeyboardDismissWrapper';

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

  // Reset mode: phone or email
  const [resetMode, setResetMode] = useState<'phone' | 'email'>('phone');

  // Step 1: Phone + SMS
  const [phone, setPhone] = useState('');
  const [areaCode, setAreaCode] = useState('+86');
  const [verificationCode, setVerificationCode] = useState('');
  const [bizId, setBizId] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  // Email mode state
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [savedEmailCode, setSavedEmailCode] = useState('');

  // Step 2: New password (shown after code sent)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form state
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Refs
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const codeInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Cleanup
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
    };
  }, []);

  // --- Validators ---

  const validatePhone = useCallback((val: string) => {
    if (areaCode === '+86') {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(val)) return false;
      const prefix = val.substring(0, 3);
      const validPrefixes = [
        '134', '135', '136', '137', '138', '139',
        '150', '151', '152', '157', '158', '159',
        '182', '183', '184', '187', '188', '178', '198',
        '130', '131', '132', '133', '155', '156',
        '185', '186', '175', '176',
        '153', '180', '181', '189', '177', '199',
        '170', '171', '162', '163', '164', '165', '167'
      ];
      return validPrefixes.includes(prefix);
    } else {
      return /^[2-9]\d{2}[2-9]\d{6}$/.test(val);
    }
  }, [areaCode]);

  const validatePassword = useCallback((password: string) => {
    if (password.length < 6) return false;
    return /[a-zA-Z]/.test(password) && /\d/.test(password);
  }, []);

  const getPasswordStrength = useCallback((password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', color: theme.colors.danger, text: t('auth.password.strength.weak') };
    if (strength <= 4) return { level: 'medium', color: '#f59e0b', text: t('auth.password.strength.medium') };
    return { level: 'strong', color: theme.colors.success, text: t('auth.password.strength.strong') };
  }, [t]);

  // --- Derived state ---

  const isPhoneValid = useMemo(() => validatePhone(phone), [phone, validatePhone]);
  const isCodeValid = useMemo(() => resetMode === 'phone' ? /^\d{6}$/.test(verificationCode) : /^\d{6}$/.test(emailCode), [verificationCode, emailCode, resetMode]);
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const isPasswordValid = useMemo(() => validatePassword(newPassword), [newPassword, validatePassword]);
  const isConfirmValid = useMemo(() => newPassword === confirmPassword && confirmPassword.length > 0, [newPassword, confirmPassword]);
  const canSendCode = resetMode === 'phone'
    ? (isPhoneValid && countdown === 0 && !sendingCode)
    : (isEmailValid && countdown === 0 && !sendingCode);
  const canSubmit = codeSent && isCodeValid && isPasswordValid && isConfirmValid && !resetting;
  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword, getPasswordStrength]);

  // --- Countdown ---

  const startCountdown = useCallback(() => {
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
  }, []);

  // --- Switch reset mode ---
  const handleSwitchMode = useCallback((mode: 'phone' | 'email') => {
    if (mode === resetMode) return;
    setResetMode(mode);
    // Clear all state on mode switch
    setPhone('');
    setEmail('');
    setVerificationCode('');
    setEmailCode('');
    setSavedEmailCode('');
    setBizId('');
    setCodeSent(false);
    setCountdown(0);
    setSendingCode(false);
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, [resetMode]);

  // --- Send Email Code ---
  const handleSendEmailCode = async () => {
    if (!isEmailValid) {
      setErrors({ email: t('auth.forgot_password.email_invalid') });
      return;
    }
    setErrors({});
    setSendingCode(true);

    try {
      console.log('📧 发送忘记密码邮箱验证码:', { email });
      const response = await emailAPI.sendEmailVercode(email);
      console.log('📧 [ForgotPassword] Email code response:', response);

      if (response && response.code) {
        if (isMounted.current) {
          setSavedEmailCode(String(response.code));
          setCodeSent(true);
          startCountdown();
          codeInputRef.current?.focus();
        }
        await safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(t('common.error'), t('auth.forgot_password.send_code_failed'));
      }
    } catch (error) {
      console.error('发送邮箱验证码失败:', error);
      if (isMounted.current) {
        Alert.alert(t('common.error'), t('auth.forgot_password.send_code_error'));
      }
    } finally {
      if (isMounted.current) setSendingCode(false);
    }
  };

  // --- Send SMS Code ---

  const handleSendCode = async () => {
    if (!isPhoneValid) {
      setErrors({ phone: areaCode === '+86' ? t('auth.validation.phone_invalid_cn') : t('auth.validation.phone_invalid_us') });
      return;
    }
    setErrors({});
    setSendingCode(true);

    try {
      const apiAreaCode = areaCode === '+86' ? 'CN' : 'US';
      console.log('📱 发送忘记密码验证码:', { phone, areaCode: apiAreaCode });

      const result = await pomeloXAPI.sendPasswordResetCode(phone, apiAreaCode);

      if (String(result.code) === "OK" && (result as any).bizId) {
        if (isMounted.current) {
          setBizId((result as any).bizId);
          setCodeSent(true);
          startCountdown();
          codeInputRef.current?.focus();
        }
        await safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      } else {
        let errorMessage = result.msg || (result as any).message || t('auth.forgot_password.send_code_failed');
        if (errorMessage.includes('频率') || errorMessage.includes('limit') ||
            errorMessage.includes('流控') || errorMessage.includes('Permits') ||
            errorMessage.includes('BUSINESS_LIMIT_CONTROL')) {
          errorMessage = t('auth.forgot_password.rate_limit', '发送验证码过于频繁，请1小时后再试');
        }
        Alert.alert(t('common.error'), errorMessage);
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      if (isMounted.current) {
        Alert.alert(t('common.error'), t('auth.forgot_password.send_code_error'));
      }
    } finally {
      if (isMounted.current) setSendingCode(false);
    }
  };

  // --- Submit: verify code + reset password in one call ---

  const handleResetPassword = async () => {
    // Validate all fields
    const newErrors: Record<string, string | undefined> = {};
    if (!isCodeValid) newErrors.code = t('auth.validation.verification_code_format');
    if (!isPasswordValid) newErrors.newPassword = t('auth.validation.password_format');
    if (!isConfirmValid) newErrors.confirmPassword = newPassword !== confirmPassword
      ? t('auth.validation.password_mismatch')
      : t('auth.validation.confirm_password_required');
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setResetting(true);

    try {
      const apiAreaCode = areaCode === '+86' ? 'CN' : 'US';
      console.log('🔐 重置密码:', { phone, areaCode: apiAreaCode });

      const result = await pomeloXAPI.resetPassword({
        phonenumber: phone,
        verCode: verificationCode,
        bizId: bizId,
        password: newPassword,
        areaCode: apiAreaCode,
      });

      if (result.code === 200) {
        await safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
        console.log('✅ [ResetPassword] 成功响应:', JSON.stringify(result));
        const userName = (result as any).userName || (result as any).data?.userName || (result as any).user_name;
        const successMsg = userName
          ? `${t('auth.reset_password.success_message')}\n\n${t('auth.reset_password.login_account', { account: userName, defaultValue: '您的登录账号：{{account}}' })}`
          : `${t('auth.reset_password.success_message')}\n\n${t('auth.reset_password.use_email_login', { defaultValue: '请使用注册时的邮箱登录' })}`;
        Alert.alert(
          t('auth.reset_password.success_title'),
          successMsg,
          [{
            text: t('common.confirm'),
            onPress: () => {
              navigation.reset({ index: 0, routes: [{ name: 'Login', params: { prefillEmail: userName || '' } }] });
            }
          }]
        );
      } else {
        const msg = result.msg || '';
        console.error('❌ [ResetPassword] 后端返回失败:', {
          code: result.code,
          msg: msg,
          fullResult: JSON.stringify(result),
        });
        // Show the actual backend error to user for debugging
        Alert.alert(
          t('common.error'),
          `${msg || t('auth.reset_password.reset_failed')}\n\n(code: ${result.code})`,
        );
        await safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error('密码重置失败:', error);
      const errorMsg = error?.message || '';
      if (errorMsg.includes('Network') || errorMsg.includes('网络') || errorMsg.includes('timeout')) {
        Alert.alert(t('common.error'), t('common.network_error'));
      } else {
        Alert.alert(t('common.error'), errorMsg || t('auth.reset_password.reset_failed'));
      }
    } finally {
      if (isMounted.current) setResetting(false);
    }
  };

  // --- Email mode: verify code + reset password ---
  const handleResetPasswordByEmail = async () => {
    const newErrors: Record<string, string | undefined> = {};
    // Frontend code comparison (same as registration flow)
    if (emailCode !== savedEmailCode) {
      newErrors.code = t('auth.validation.verification_code_format');
    }
    if (!isPasswordValid) newErrors.newPassword = t('auth.validation.password_format');
    if (!isConfirmValid) newErrors.confirmPassword = newPassword !== confirmPassword
      ? t('auth.validation.password_mismatch')
      : t('auth.validation.confirm_password_required');
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setResetting(true);

    try {
      console.log('🔐 邮箱重置密码:', { email });
      const result = await pomeloXAPI.resetPasswordByEmail({
        email,
        password: newPassword,
      });

      if (result.code === 200) {
        await safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
        const userName = (result as any).userName || (result as any).data?.userName;
        const successMsg = userName
          ? `${t('auth.reset_password.success_message')}\n\n${t('auth.reset_password.login_account', { account: userName, defaultValue: '您的登录账号：{{account}}' })}`
          : `${t('auth.reset_password.success_message')}\n\n${t('auth.reset_password.use_email_login', { defaultValue: '请使用注册时的邮箱登录' })}`;
        Alert.alert(
          t('auth.reset_password.success_title'),
          successMsg,
          [{
            text: t('common.confirm'),
            onPress: () => {
              navigation.reset({ index: 0, routes: [{ name: 'Login', params: { prefillEmail: userName || email } }] });
            }
          }]
        );
      } else {
        const msg = result.msg || '';
        Alert.alert(t('common.error'), `${msg || t('auth.reset_password.reset_failed')}\n\n(code: ${result.code})`);
        await safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error('邮箱密码重置失败:', error);
      const errorMsg = error?.message || '';
      if (errorMsg.includes('Network') || errorMsg.includes('网络') || errorMsg.includes('timeout')) {
        Alert.alert(t('common.error'), t('common.network_error'));
      } else {
        Alert.alert(t('common.error'), errorMsg || t('auth.reset_password.reset_failed'));
      }
    } finally {
      if (isMounted.current) setResetting(false);
    }
  };

  // --- Button animation ---

  const handleButtonPressIn = useCallback(() => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95, useNativeDriver: true, tension: 150, friction: 8,
    }).start();
  }, [buttonScaleAnim]);

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1, useNativeDriver: true, tension: 150, friction: 8,
    }).start();
  }, [buttonScaleAnim]);

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
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('auth.forgot_password.title')}</Text>
            </View>

            {/* Main Content Card */}
            <View style={styles.contentCard}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>{t('auth.forgot_password.reset_password')}</Text>
                <Text style={styles.subtitle}>
                  {resetMode === 'phone'
                    ? t('auth.forgot_password.subtitle')
                    : t('auth.forgot_password.subtitle_email')}
                </Text>
              </View>

              {/* ===== Reset Mode Tabs (Email tab hidden until backend ready) ===== */}
              {/* 取消下面的注释以启用邮箱重置入口：
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.forgot_password.reset_mode_label')}</Text>
                <View style={styles.areaCodeContainer}>
                  <TouchableOpacity
                    style={[styles.areaCodeButton, resetMode === 'phone' && styles.areaCodeButtonActive]}
                    onPress={() => handleSwitchMode('phone')}
                  >
                    <Text style={[styles.areaCodeText, resetMode === 'phone' && styles.areaCodeTextActive]}>
                      {t('auth.forgot_password.reset_mode_phone')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.areaCodeButton, resetMode === 'email' && styles.areaCodeButtonActive]}
                    onPress={() => handleSwitchMode('email')}
                  >
                    <Text style={[styles.areaCodeText, resetMode === 'email' && styles.areaCodeTextActive]}>
                      {t('auth.forgot_password.reset_mode_email')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              */}

              {/* ===== Phone Mode ===== */}
              {resetMode === 'phone' && (<>
              {/* ===== Area Code ===== */}
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

              {/* ===== Phone Input ===== */}
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
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                    }}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.colors.text.disabled}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* ===== Send Code Button ===== */}
              <Animated.View style={[
                styles.sendButtonContainer,
                { backgroundColor: canSendCode ? theme.colors.primary : theme.colors.text.disabled },
                { transform: [{ scale: buttonScaleAnim }] },
              ]}>
                <TouchableOpacity
                  style={styles.sendButtonInner}
                  onPress={handleSendCode}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={!canSendCode}
                  activeOpacity={0.9}
                >
                  {sendingCode ? (
                    <LoaderOne size="small" color={theme.colors.text.inverse} />
                  ) : (
                    <Text style={styles.sendButtonText}>
                      {countdown > 0
                        ? t('auth.forgot_password.resend_after', { seconds: countdown })
                        : codeSent
                          ? t('auth.forgot_password.resend_code')
                          : t('auth.forgot_password.send_code')}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* ===== Below only shows after code sent ===== */}
              {codeSent && (
                <>
                  {/* SMS sent success hint */}
                  <View style={styles.successHint}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.successHintText}>
                      {t('auth.forgot_password.code_sent_success')}
                    </Text>
                  </View>

                  {/* Verification Code */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('auth.forgot_password.verification_code_label')}</Text>
                    <View style={[
                      styles.inputWrapper,
                      errors.code && styles.inputError,
                      focusedInput === 'code' && styles.inputFocused
                    ]}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text.disabled} />
                      <TextInput
                        ref={codeInputRef}
                        style={styles.input}
                        placeholder={t('auth.forgot_password.verification_code_placeholder')}
                        value={verificationCode}
                        onChangeText={(text) => {
                          const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                          setVerificationCode(numericText);
                          if (errors.code) setErrors(prev => ({ ...prev, code: undefined }));
                        }}
                        onFocus={() => setFocusedInput('code')}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholderTextColor={theme.colors.text.disabled}
                        returnKeyType="done"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                      />
                    </View>
                    {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
                  </View>

                  {/* New Password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('auth.reset_password.new_password_label')}</Text>
                    <View style={[
                      styles.inputWrapper,
                      errors.newPassword && styles.inputError,
                      focusedInput === 'newPassword' && styles.inputFocused
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.disabled} />
                      <TextInput
                        ref={passwordInputRef}
                        style={styles.input}
                        placeholder={t('auth.reset_password.new_password_placeholder')}
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
                        }}
                        onFocus={() => setFocusedInput('newPassword')}
                        onBlur={() => setFocusedInput(null)}
                        secureTextEntry={!showNewPassword}
                        placeholderTextColor={theme.colors.text.disabled}
                        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        <Ionicons
                          name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={theme.colors.text.disabled}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
                    <Text style={styles.hintText}>
                      {t('auth.reset_password.errors.password_format_details')}
                    </Text>
                    {/* Password Strength */}
                    {newPassword.length > 0 && (
                      <View style={styles.strengthContainer}>
                        <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                          {passwordStrength.text}
                        </Text>
                        <View style={styles.strengthBar}>
                          <View style={[
                            styles.strengthIndicator,
                            {
                              backgroundColor: passwordStrength.color,
                              width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%',
                            }
                          ]} />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('auth.reset_password.confirm_password_label')}</Text>
                    <View style={[
                      styles.inputWrapper,
                      errors.confirmPassword && styles.inputError,
                      focusedInput === 'confirmPassword' && styles.inputFocused
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.disabled} />
                      <TextInput
                        style={styles.input}
                        placeholder={t('auth.reset_password.confirm_password_placeholder')}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }}
                        onFocus={() => setFocusedInput('confirmPassword')}
                        onBlur={() => setFocusedInput(null)}
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={theme.colors.text.disabled}
                        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons
                          name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={theme.colors.text.disabled}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                  </View>

                  {/* Reset Password Button */}
                  <Animated.View style={[
                    styles.resetButtonContainer,
                    { backgroundColor: canSubmit ? theme.colors.primary : theme.colors.text.disabled },
                    { transform: [{ scale: buttonScaleAnim }] },
                  ]}>
                    <TouchableOpacity
                      style={styles.resetButtonInner}
                      onPress={handleResetPassword}
                      onPressIn={canSubmit ? handleButtonPressIn : undefined}
                      onPressOut={canSubmit ? handleButtonPressOut : undefined}
                      disabled={!canSubmit}
                      activeOpacity={0.9}
                    >
                      {resetting ? (
                        <LoaderOne size="small" color={theme.colors.text.inverse} />
                      ) : (
                        <Text style={styles.resetButtonText}>
                          {t('auth.reset_password.reset_button')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
              </>)}

              {/* ===== Email Mode ===== */}
              {resetMode === 'email' && (<>
              {/* ===== Email Input ===== */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.forgot_password.email_label')}</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.email && styles.inputError,
                  focusedInput === 'email' && styles.inputFocused
                ]}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.text.disabled} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.forgot_password.email_placeholder')}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text.trim());
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={theme.colors.text.disabled}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* ===== Send Email Code Button ===== */}
              <Animated.View style={[
                styles.sendButtonContainer,
                { backgroundColor: canSendCode ? theme.colors.primary : theme.colors.text.disabled },
                { transform: [{ scale: buttonScaleAnim }] },
              ]}>
                <TouchableOpacity
                  style={styles.sendButtonInner}
                  onPress={handleSendEmailCode}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={!canSendCode}
                  activeOpacity={0.9}
                >
                  {sendingCode ? (
                    <LoaderOne size="small" color={theme.colors.text.inverse} />
                  ) : (
                    <Text style={styles.sendButtonText}>
                      {countdown > 0
                        ? t('auth.forgot_password.resend_after', { seconds: countdown })
                        : codeSent
                          ? t('auth.forgot_password.resend_code')
                          : t('auth.forgot_password.send_code')}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* ===== Email code sent - verify + new password ===== */}
              {codeSent && (
                <>
                  <View style={styles.successHint}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.successHintText}>
                      {t('auth.forgot_password.email_code_sent')}
                    </Text>
                  </View>

                  {/* Email Verification Code */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('auth.forgot_password.verification_code_label')}</Text>
                    <View style={[
                      styles.inputWrapper,
                      errors.code && styles.inputError,
                      focusedInput === 'emailCodeInput' && styles.inputFocused
                    ]}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text.disabled} />
                      <TextInput
                        ref={codeInputRef}
                        style={styles.input}
                        placeholder={t('auth.forgot_password.verification_code_placeholder')}
                        value={emailCode}
                        onChangeText={(text) => {
                          const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                          setEmailCode(numericText);
                          if (errors.code) setErrors(prev => ({ ...prev, code: undefined }));
                        }}
                        onFocus={() => setFocusedInput('emailCodeInput')}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholderTextColor={theme.colors.text.disabled}
                        returnKeyType="done"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                      />
                    </View>
                    {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
                  </View>

                  {/* New Password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('auth.reset_password.new_password_label')}</Text>
                    <View style={[
                      styles.inputWrapper,
                      errors.newPassword && styles.inputError,
                      focusedInput === 'newPassword' && styles.inputFocused
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.disabled} />
                      <TextInput
                        ref={passwordInputRef}
                        style={styles.input}
                        placeholder={t('auth.reset_password.new_password_placeholder')}
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
                        }}
                        onFocus={() => setFocusedInput('newPassword')}
                        onBlur={() => setFocusedInput(null)}
                        secureTextEntry={!showNewPassword}
                        placeholderTextColor={theme.colors.text.disabled}
                        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        <Ionicons
                          name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={theme.colors.text.disabled}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
                    <Text style={styles.hintText}>
                      {t('auth.reset_password.errors.password_format_details')}
                    </Text>
                    {newPassword.length > 0 && (
                      <View style={styles.strengthContainer}>
                        <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                          {passwordStrength.text}
                        </Text>
                        <View style={styles.strengthBar}>
                          <View style={[
                            styles.strengthIndicator,
                            {
                              backgroundColor: passwordStrength.color,
                              width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%',
                            }
                          ]} />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('auth.reset_password.confirm_password_label')}</Text>
                    <View style={[
                      styles.inputWrapper,
                      errors.confirmPassword && styles.inputError,
                      focusedInput === 'confirmPassword' && styles.inputFocused
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.disabled} />
                      <TextInput
                        style={styles.input}
                        placeholder={t('auth.reset_password.confirm_password_placeholder')}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }}
                        onFocus={() => setFocusedInput('confirmPassword')}
                        onBlur={() => setFocusedInput(null)}
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={theme.colors.text.disabled}
                        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons
                          name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={theme.colors.text.disabled}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                  </View>

                  {/* Reset Password Button (Email) */}
                  <Animated.View style={[
                    styles.resetButtonContainer,
                    { backgroundColor: canSubmit ? theme.colors.primary : theme.colors.text.disabled },
                    { transform: [{ scale: buttonScaleAnim }] },
                  ]}>
                    <TouchableOpacity
                      style={styles.resetButtonInner}
                      onPress={handleResetPasswordByEmail}
                      onPressIn={canSubmit ? handleButtonPressIn : undefined}
                      onPressOut={canSubmit ? handleButtonPressOut : undefined}
                      disabled={!canSubmit}
                      activeOpacity={0.9}
                    >
                      {resetting ? (
                        <LoaderOne size="small" color={theme.colors.text.inverse} />
                      ) : (
                        <Text style={styles.resetButtonText}>
                          {t('auth.reset_password.reset_button')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
              </>)}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <KeyboardDoneAccessory />
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
    paddingBottom: 40,
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
  hintText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },

  // Send Code Button
  sendButtonContainer: {
    borderRadius: theme.borderRadius.button,
    marginBottom: theme.spacing.lg,
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

  // Success hint (code sent)
  successHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: theme.spacing.lg,
    gap: 8,
  },
  successHintText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },

  // Password Strength
  strengthContainer: {
    marginTop: theme.spacing.sm,
  },
  strengthText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  strengthBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthIndicator: {
    height: '100%',
    borderRadius: 2,
  },

  // Reset Button
  resetButtonContainer: {
    borderRadius: theme.borderRadius.button,
    marginTop: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  resetButtonInner: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.button,
  },
  resetButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
});
