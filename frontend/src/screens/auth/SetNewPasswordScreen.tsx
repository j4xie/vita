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
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import * as Haptics from 'expo-haptics';

interface RouteParams {
  phone: string;
  areaCode: string;
  verificationCode: string;
}

const SetNewPasswordScreenComponent: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode } = darkModeSystem;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 表单验证状态
  const [errors, setErrors] = useState<{newPassword?: string; confirmPassword?: string}>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [formValid, setFormValid] = useState(false);
  
  // 动画状态
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonColorAnim = useRef(new Animated.Value(0)).current;
  
  // 表单验证状态计算
  const isNewPasswordValid = useMemo(() => validatePassword(newPassword), [newPassword, validatePassword]);
  const isConfirmPasswordValid = useMemo(() =>
    newPassword === confirmPassword && confirmPassword.length > 0,
    [newPassword, confirmPassword]
  );
  const isFormValid = useMemo(() =>
    isNewPasswordValid && isConfirmPasswordValid,
    [isNewPasswordValid, isConfirmPasswordValid]
  );

  // 按钮动画（分离动画逻辑）
  React.useEffect(() => {
    Animated.timing(buttonColorAnim, {
      toValue: isFormValid ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFormValid, buttonColorAnim]);

  // 同步formValid状态
  React.useEffect(() => {
    setFormValid(isFormValid);
  }, [isFormValid]);

  const validatePassword = useCallback((password: string) => {
    // 匹配UI提示：至少6位，需包含字母和数字
    if (password.length < 6) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
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

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('🔐 重置密码:', { phone: params.phone, areaCode: params.areaCode });

      // 调用真实的密码重置API
      const result = await pomeloXAPI.resetPassword({
        phonenumber: params.phone,
        verCode: params.verificationCode,
        bizId: 'temp_biz_id', // 这里需要从前一步传递真实的bizId
        password: newPassword,
        areaCode: params.areaCode,
      });

      if (result.code === 200) {
        console.log('✅ 密码重置成功');

        // 重置成功
        Alert.alert(
          t('auth.reset_password.success_title'),
          t('auth.reset_password.success_message'),
          [{
            text: t('common.confirm'),
            onPress: () => {
              // 返回登录页面
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }]
        );

        // 触觉反馈
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // 根据错误代码提供具体错误信息
        const errorInfo = getResetErrorInfo(result.code, result.msg);
        throw new Error(errorInfo.message);
      }

    } catch (error) {
      console.error('密码重置失败:', error);

      // 解析错误并提供具体提示
      const errorInfo = parseResetError(error);

      Alert.alert(
        errorInfo.title,
        errorInfo.message,
        errorInfo.buttons
      );
    } finally {
      setLoading(false);
    }
  };

  // 解析API错误码并返回具体错误信息
  const getResetErrorInfo = useCallback((code: number, message: string) => {
    switch (code) {
      case 400:
        if (message?.includes('密码') || message?.includes('password')) {
          return {
            title: t('common.error'),
            message: `${t('auth.reset_password.errors.password_format_rejected')}\n${t('auth.reset_password.errors.password_format_details')}`,
            buttons: [
              { text: t('common.confirm'), style: 'default' as const }
            ]
          };
        }
        return {
          title: t('common.error'),
          message: t('auth.reset_password.errors.retry_suggestion'),
          buttons: [{ text: t('common.confirm'), style: 'default' as const }]
        };

      case 401:
      case 403:
        return {
          title: t('common.error'),
          message: `${t('auth.reset_password.errors.verification_code_invalid')}\n${t('auth.reset_password.errors.get_new_code')}`,
          buttons: [
            { text: t('common.cancel'), style: 'cancel' as const },
            {
              text: t('auth.forgot_password.resend_code'),
              style: 'default' as const,
              onPress: () => navigation.goBack()
            }
          ]
        };

      case 404:
        return {
          title: t('common.error'),
          message: t('auth.reset_password.errors.phone_not_found'),
          buttons: [{ text: t('common.confirm'), style: 'default' as const }]
        };

      case 410:
        return {
          title: t('common.error'),
          message: `${t('auth.reset_password.errors.verification_code_expired')}\n${t('auth.reset_password.errors.get_new_code')}`,
          buttons: [
            { text: t('common.cancel'), style: 'cancel' as const },
            {
              text: t('auth.forgot_password.resend_code'),
              style: 'default' as const,
              onPress: () => navigation.goBack()
            }
          ]
        };

      case 500:
        return {
          title: t('common.error'),
          message: `${t('auth.reset_password.errors.server_error')}\n${t('auth.reset_password.errors.contact_support')}`,
          buttons: [{ text: t('common.confirm'), style: 'default' as const }]
        };

      default:
        return {
          title: t('common.error'),
          message: message || t('auth.reset_password.errors.unknown_error'),
          buttons: [{ text: t('common.confirm'), style: 'default' as const }]
        };
    }
  }, [t, navigation]);

  // 解析网络错误和其他异常
  const parseResetError = useCallback((error: any) => {
    const errorMessage = error?.message || '';

    // 网络错误
    if (errorMessage.includes('Network') || errorMessage.includes('网络') ||
        errorMessage.includes('timeout') || errorMessage.includes('连接')) {
      return {
        title: t('common.error'),
        message: `${t('auth.reset_password.errors.network_error')}\n${t('auth.reset_password.errors.check_network')}`,
        buttons: [
          { text: t('common.cancel'), style: 'cancel' as const },
          {
            text: t('common.retry'),
            style: 'default' as const,
            onPress: () => handleResetPassword()
          }
        ]
      };
    }

    // 密码格式错误（前端验证通过但后端拒绝）
    if (errorMessage.includes('密码格式') || errorMessage.includes('password format') ||
        errorMessage.includes('密码不符合') || errorMessage.includes('format')) {
      return {
        title: t('common.error'),
        message: `${t('auth.reset_password.errors.password_format_rejected')}\n${t('auth.reset_password.errors.password_format_details')}`,
        buttons: [{ text: t('common.confirm'), style: 'default' as const }]
      };
    }

    // 验证码相关错误
    if (errorMessage.includes('验证码') || errorMessage.includes('verification') ||
        errorMessage.includes('过期') || errorMessage.includes('expired')) {
      return {
        title: t('common.error'),
        message: `${t('auth.reset_password.errors.verification_code_expired')}\n${t('auth.reset_password.errors.get_new_code')}`,
        buttons: [
          { text: t('common.cancel'), style: 'cancel' as const },
          {
            text: t('auth.forgot_password.resend_code'),
            style: 'default' as const,
            onPress: () => navigation.goBack()
          }
        ]
      };
    }

    // 默认错误
    return {
      title: t('common.error'),
      message: errorMessage || t('auth.reset_password.reset_failed'),
      buttons: [{ text: t('common.confirm'), style: 'default' as const }]
    };
  }, [t, navigation]);

  const validateForm = () => {
    const newErrors: {newPassword?: string; confirmPassword?: string} = {};
    
    if (!newPassword || newPassword.trim().length === 0) {
      newErrors.newPassword = t('auth.validation.password_required');
    } else if (!validatePassword(newPassword)) {
      newErrors.newPassword = t('auth.validation.password_format');
    }
    
    if (!confirmPassword || confirmPassword.trim().length === 0) {
      newErrors.confirmPassword = t('auth.validation.confirm_password_required');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.password_mismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleButtonPressIn = useCallback(() => {
    if (!formValid || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [formValid, loading, buttonScaleAnim]);

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [buttonScaleAnim]);

  const getButtonStyles = useMemo(() => {
    const backgroundColor = buttonColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.text.disabled, theme.colors.primary],
    });

    return {
      backgroundColor,
      transform: [{ scale: buttonScaleAnim }],
    };
  }, [buttonColorAnim]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword, getPasswordStrength]);

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
              <Text style={styles.headerTitle}>{t('auth.reset_password.title')}</Text>
            </View>

            {/* Main Content Card */}
            <View style={styles.contentCard}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>{t('auth.reset_password.set_new_password')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.reset_password.subtitle')}
                </Text>
              </View>

              {/* New Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.reset_password.new_password_label')}</Text>
                <View style={[
                  styles.inputWrapper, 
                  errors.newPassword && styles.inputError, 
                  focusedInput === 'newPassword' && styles.inputFocused
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.disabled} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.reset_password.new_password_placeholder')}
                    value={newPassword}
                    onChangeText={useCallback((text: string) => {
                      setNewPassword(text);
                      // 防抖清除错误，避免竞态条件
                      if (errors.newPassword) {
                        setTimeout(() => {
                          setErrors(prev => ({...prev, newPassword: undefined}));
                        }, 0);
                      }
                    }, [errors.newPassword])}
                    onFocus={() => setFocusedInput('newPassword')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showNewPassword}
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons
                      name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={theme.colors.text.disabled}
                    />
                  </TouchableOpacity>
                </View>
                {errors.newPassword && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}
                
                {/* Password Requirement Hint */}
                <Text style={styles.hintText}>
                  {t('auth.reset_password.errors.password_format_details')}
                </Text>
                
                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                      {passwordStrength.text}
                    </Text>
                    <View style={styles.strengthBar}>
                      <View 
                        style={[
                          styles.strengthIndicator, 
                          { backgroundColor: passwordStrength.color, width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%' }
                        ]} 
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
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
                    onChangeText={useCallback((text: string) => {
                      setConfirmPassword(text);
                      // 防抖清除错误，避免竞态条件
                      if (errors.confirmPassword) {
                        setTimeout(() => {
                          setErrors(prev => ({...prev, confirmPassword: undefined}));
                        }, 0);
                      }
                    }, [errors.confirmPassword])}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor={theme.colors.text.disabled}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={theme.colors.text.disabled}
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Reset Password Button */}
              <Animated.View style={[styles.resetButtonContainer, getButtonStyles()]}>
                <TouchableOpacity
                  style={styles.resetButtonInner}
                  onPress={handleResetPassword}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={!formValid || loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.text.inverse} />
                  ) : (
                    <Text style={styles.resetButtonText}>
                      {t('auth.reset_password.reset_button')}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export const SetNewPasswordScreen = React.memo(SetNewPasswordScreenComponent);

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
  input: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
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
    marginTop: theme.spacing.xl,
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