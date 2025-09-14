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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { WebTextInput } from '../../components/web/WebTextInput';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

interface RouteParams {
  phone: string;
  areaCode: string;
  verificationCode: string;
}

export const SetNewPasswordScreen: React.FC = () => {
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
  
  // 表单验证
  React.useEffect(() => {
    const isNewPasswordValid = validatePassword(newPassword);
    const isConfirmPasswordValid = newPassword === confirmPassword && confirmPassword.length > 0;
    const isFormValid = isNewPasswordValid && isConfirmPasswordValid;
    
    if (isFormValid !== formValid) {
      setFormValid(isFormValid);
      
      // 按钮颜色动画
      Animated.timing(buttonColorAnim, {
        toValue: isFormValid ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [newPassword, confirmPassword, formValid]);

  const validatePassword = (password: string) => {
    // 简化验证：只要求至少6位字符（改善用户体验）
    return password.length >= 6;
  };

  const getPasswordStrength = (password: string) => {
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
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log('🔐 重置密码:', { phone: params.phone, areaCode: params.areaCode });
      
      // 这里应该调用密码重置API
      // TODO: 添加实际的密码重置API调用
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟网络延迟
      
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
      Haptics.notificationAsync('success');
      
    } catch (error) {
      console.error('密码重置失败:', error);
      Alert.alert(
        t('common.error'),
        t('auth.reset_password.reset_failed')
      );
    } finally {
      setLoading(false);
    }
  };

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

  const passwordStrength = getPasswordStrength(newPassword);

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
                  <WebTextInput
                    style={styles.input}
                    placeholder={t('auth.reset_password.new_password_placeholder')}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (errors.newPassword) setErrors({...errors, newPassword: undefined});
                    }}
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
                  {t('auth.reset_password.password_hint')}
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
                  <WebTextInput
                    style={styles.input}
                    placeholder={t('auth.reset_password.confirm_password_placeholder')}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({...errors, confirmPassword: undefined});
                    }}
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
    transition: 'width 0.3s ease',
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