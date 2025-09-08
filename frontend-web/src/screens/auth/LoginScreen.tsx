import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { fadeIn, slideInFromBottom } from '../../utils/animations';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { WebTextInput } from '../../components/web/WebTextInput';

const { width, height } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { login: userLogin } = useUser();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients } = darkModeSystem;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // 表单验证状态
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [formValid, setFormValid] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  
  // 动画状态
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonColorAnim = useRef(new Animated.Value(0)).current;
  
  
  // 入场动画
  useEffect(() => {
    Animated.parallel([
      fadeIn(fadeAnim, 600),
      slideInFromBottom(slideAnim, 600),
    ]).start();
  }, []);

  // 🟢 表单验证状态监听
  useEffect(() => {
    const isFormValid = email.trim().length >= 3 && password.length >= 6;
    
    if (isFormValid !== formValid) {
      setFormValid(isFormValid);
      
      // 🎨 按钮颜色动画
      Animated.timing(buttonColorAnim, {
        toValue: isFormValid ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [email, password, formValid]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = t('auth.validation.email_required');
    } else if (email.length < 3) {
      newErrors.email = t('auth.validation.username_min_length');
    }
    
    if (!password) {
      newErrors.password = t('auth.validation.password_required');
    } else if (password.length < 6) {
      newErrors.password = t('auth.validation.password_min_length');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🎨 动态按钮样式计算函数
  const getButtonStyles = () => {
    const backgroundColor = buttonColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.text.disabled, theme.colors.primary], // 从灰色到橙色
    });

    const shadowOpacity = buttonColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
    });

    return {
      backgroundColor,
      shadowOpacity,
      transform: [{ scale: buttonScaleAnim }],
    };
  };

  // 🔄 按钮点击动画和反馈
  const handleButtonPressIn = () => {
    if (!formValid || loading) return;
    
    setButtonPressed(true);
    
    // 🎵 触觉反馈
    Haptics.impactAsync('light');
    
    // 🎨 缩放动画
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const handleButtonPressOut = () => {
    setButtonPressed(false);
    
    // 恢复缩放
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log('尝试登录:', { userName: email, password: '[HIDDEN]' }); // 调试信息
      
      // 调用PomeloX登录API，后端需要username字段（注意不是userName）
      const result = await pomeloXAPI.login({
        userName: email, // PomeloXAPI会将此字段映射为username
        password: password,
      });
      
      console.log('登录响应:', result); // 调试信息
      
      if (result.code === 200 && result.data?.token) {
        // 登录成功，通过UserContext获取用户信息
        await userLogin(result.data.token);
        
        // 保存用户邮箱（如果选择记住我）
        if (rememberMe) {
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('rememberMe', 'true');
        } else {
          await AsyncStorage.removeItem('userEmail');
          await AsyncStorage.removeItem('rememberMe');
        }
        
        // 导航到主页或返回之前的页面
        const currentRoute = navigation.getState()?.routes?.[navigation.getState().index];
        const routeParams = currentRoute?.params as any;
        
        if (routeParams?.returnTo) {
          // 从活动详情页面登录的情况，返回活动详情
          if (routeParams.returnTo === 'ActivityDetail' && routeParams.activityId) {
            // 保持原有的activity数据（如果有的话），同时强制刷新
            const originalActivity = routeParams.originalActivity || { id: routeParams.activityId };
            navigation.reset({
              index: 0,
              routes: [
                { name: 'Main' },
                { 
                  name: 'ActivityDetail', 
                  params: { 
                    activity: originalActivity,
                    refreshOnReturn: true,
                    forceRefresh: true
                  }
                }
              ],
            });
          } else {
            navigation.navigate(routeParams.returnTo);
          }
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } else {
        // 详细的错误处理
        let errorMessage = result.msg || t('auth.errors.invalid_credentials');
        
        if (result.code === 500 && errorMessage.includes('用户不存在')) {
          errorMessage = t('auth.validation.user_not_exists');
        } else if (result.code === 500 && errorMessage.includes('密码错误')) {
          errorMessage = t('auth.validation.password_incorrect');
        }
        
        Alert.alert(t('auth.errors.login_failed'), errorMessage);
      }
    } catch (error) {
      console.error('登录错误:', error);
      
      let errorMessage = t('auth.errors.network_error');
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = t('auth.errors.network_connection_failed');
        } else if (error.message.includes('500')) {
          errorMessage = t('auth.errors.server_error');
        }
      }
      
      Alert.alert(t('auth.errors.login_failed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
  };

  const handleRegister = () => {
    navigation.navigate('RegisterChoice');
  };

  const handleSkip = () => {
    navigation.navigate('Main');
  };

  return (
    <LinearGradient
      colors={isDarkMode ? dmGradients.page.background : DAWN_GRADIENTS.skyCool}
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
            {/* Skip Button - L2 Outline */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>{t('auth.login.skip')}</Text>
            </TouchableOpacity>

            {/* Main Content Card - L1 Glass */}
            <Animated.View 
              style={[
                styles.contentCard, 
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Logo Section */}
              <View style={styles.logoSection}>
                {/* Shadow容器 - 使用solid background优化阴影渲染 */}
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../../../assets/logos/pomelo-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.welcomeText}>{t('auth.login.welcome')}</Text>
                <Text style={styles.subtitleText}>{t('auth.login.subtitle')}</Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.login.email_label')}</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError, focusedInput === 'email' && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.text.disabled} />
                <WebTextInput
                  style={styles.input}
                  placeholder={t('auth.login.email_placeholder')}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({...errors, email: undefined});
                  }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.login.password_label')}</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError, focusedInput === 'password' && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.disabled} />
                <WebTextInput
                  style={styles.input}
                  placeholder={t('auth.login.password_placeholder')}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({...errors, password: undefined});
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={theme.colors.text.disabled}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.text.inverse} />
                  )}
                </View>
                <Text style={styles.rememberText}>{t('auth.login.remember_me')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>{t('auth.login.forgot_password')}</Text>
              </TouchableOpacity>
            </View>

                {/* 🚀 Dynamic Login Button - 动态交互按钮 */}
                <Animated.View style={[
                  styles.loginButtonShadowContainer, 
                  getButtonStyles(),
                  (!formValid || loading) && styles.loginButtonDisabled
                ]}>
                  <TouchableOpacity
                    style={styles.loginButtonInner}
                    onPress={handleLogin}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                    disabled={!formValid || loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.colors.text.inverse} />
                    ) : (
                      <Text style={[
                        styles.loginButtonText,
                        !formValid && styles.loginButtonTextDisabled
                      ]}>
                        {t('auth.login.login_button')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Register Link */}
                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>{t('auth.login.register_text')}</Text>
                  <TouchableOpacity onPress={handleRegister}>
                    <Text style={styles.registerLink}>{t('auth.login.register_link')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Main Container
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
    justifyContent: 'center',
    minHeight: height * 0.9,
  },
  
  // Skip Button - V2.0 L2 Outline
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light,
  },
  skipText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  // Main Content Card - V2.0 L1 Glass
  contentCard: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
  },
  
  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  // Shadow容器 - 解决LinearGradient阴影冲突
  logoShadowContainer: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius['4xl'],
    backgroundColor: theme.colors.primary, // solid background用于阴影优化
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoText: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  logoImage: {
    width: 80,
    height: 80,
    // 移除tintColor，保持PomeloX logo原色
  },
  welcomeText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.relaxed,
  },
  
  // Form Section
  formSection: {
    width: '100%',
  },
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
    paddingVertical: theme.spacing[4], // 增加垂直内边距
    borderWidth: 1.5,
    borderColor: 'transparent', // Default state has no visible border
    transition: 'border-color 0.3s ease-in-out',
    minHeight: 52, // 设置最小高度，让输入框更舒适
  },
  inputFocused: {
    borderColor: theme.colors.primary, // Dawn Warm border
    // Rim highlight can be simulated with a shadow
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
  
  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.base,
    borderWidth: 2,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rememberText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  forgotText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary, // Changed from BRAND_INTERACTIONS
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  // 🚀 Dynamic Login Button Shadow容器 - 增强交互版
  loginButtonShadowContainer: {
    borderRadius: theme.borderRadius.button,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    // 背景色现在由 getButtonStyles() 动态计算
  },
  
  loginButtonInner: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.button,
  },
  
  loginButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  
  loginButtonText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  
  loginButtonTextDisabled: {
    color: theme.colors.text.secondary,
    opacity: 0.7,
  },
  
  // Register Link
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  registerLink: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary, // Changed from BRAND_INTERACTIONS
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: theme.spacing.xs,
  },
});