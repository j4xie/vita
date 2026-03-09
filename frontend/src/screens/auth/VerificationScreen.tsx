import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { login } from '../../services/authAPI';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoaderOne } from '../../components/ui/LoaderOne';

export const VerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { login: userLogin } = useUser();
  
  const { formData, phoneNumber, phoneType } = route.params;
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // 成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndRegister = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      Alert.alert(t('common.error'), t('validation.errors.verification_code_format'));
      return;
    }

    setLoading(true);
    try {
      // 构建注册数据
      const registerData = {
        userName: formData.userName,
        legalName: formData.legalName,
        nickName: formData.englishNickname,
        password: formData.password,
        phonenumber: formData.phoneNumber,
        email: formData.email,
        sex: formData.sex,
        deptId: formData.universityId, // 传递学校ID，确保用户关联正确的学校
        verCode: code,
        bizId: formData.bizId,
        ...(formData.referralCode && { invCode: formData.referralCode }),
        ...(formData.organizationId && { orgId: formData.organizationId }),
      };

      console.log('📋 短信验证码注册数据:', {
        ...registerData,
        password: '[HIDDEN]',
        selectedSchool: formData.university,
        deptId: formData.universityId
      });

      const result = await pomeloXAPI.register(registerData);
      
      console.log('🔍 [注册] API返回结果:', {
        code: result.code,
        msg: result.msg,
        hasData: !!result.data,
        fullResult: result
      });

      if (result.code === 200) {
        // 注册成功后自动登录
        try {
          console.log('注册成功，开始自动登录...');
          
          // 🔧 修复：使用与注册时相同的用户名（应为email）
          const loginUsername = formData.userName || formData.email; // 确保使用正确的用户名
          console.log('🔑 VerificationScreen登录参数:', {
            username: loginUsername,
            password: '[HIDDEN]',
            注册时的userName: formData.userName,
            注册时的email: formData.email
          });
          
          const loginResult = await login({
            username: loginUsername, // 使用email作为username
            password: formData.password,
          });
          
          if (loginResult.code === 200 && loginResult.data) {
            // 🔧 Web端解决方案：手动保存token到AsyncStorage
            console.log('💾 VerificationScreen开始手动保存token...');
            await AsyncStorage.setItem('@pomelox_token', loginResult.data.token);
            await AsyncStorage.setItem('@pomelox_user_id', loginResult.data.userId.toString());
            
            // 验证token保存
            const savedToken = await AsyncStorage.getItem('@pomelox_token');
            console.log('✅ VerificationScreen Token保存验证:', {
              tokenSaved: !!savedToken,
              tokenMatch: savedToken === loginResult.data.token
            });
            
            // 登录成功，更新用户状态
            await userLogin(loginResult.data.token);
            console.log('✅ VerificationScreen自动登录成功！');
            
            // 🔧 使用LiquidSuccessModal替代Alert
            setLoading(false);
            setShowSuccessModal(true);
          } else {
            // 登录失败，但注册成功
            console.log('❌ VerificationScreen自动登录失败:', loginResult);
            setLoading(false);
            Alert.alert(
              t('auth.register.success_title'),
              t('auth.register.success_please_login'),
              [{
                text: t('common.confirm'),
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
          console.error('自动登录失败:', loginError);
          // 登录失败，但注册成功
          Alert.alert(
            t('auth.register.success_title'),
            t('auth.register.success_please_login'),
            [{
              text: t('common.confirm'),
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
        console.error('❌ [注册] API返回错误:', {
          code: result.code,
          msg: result.msg,
          timestamp: new Date().toISOString()
        });
        Alert.alert(
          t('auth.register.errors.register_failed'), 
          `错误代码: ${result.code}\n${result.msg || t('auth.register.errors.register_failed_message')}`
        );
      }
    } catch (error: any) {
      console.error('❌ [注册] 网络/系统错误:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      Alert.alert(
        t('auth.register.errors.register_failed'), 
        `网络错误: ${error.message || t('common.network_error')}\n请检查网络连接后重试`
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔧 统一的成功弹窗处理函数
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // 🎯 跳转到Profile页面，与Web端保持一致
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

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    try {
      const areaCode = phoneType === 'CN' ? '86' : '1';

      const result = await pomeloXAPI.sendSMSVerification(phoneNumber, areaCode);
      
      if (result.code === 'OK') {
        Alert.alert(t('auth.register.sms.code_sent_title'), t('auth.register.sms.code_sent_message'));
        
        // 更新 bizId
        formData.bizId = result.bizId;
        
        // 开始倒计时
        setResendCountdown(60);
        const timer = setInterval(() => {
          setResendCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert(t('auth.register.sms.send_failed_title'), t('auth.register.sms.send_failed_message'));
      }
    } catch (error) {
      Alert.alert(t('auth.register.sms.send_failed_title'), t('common.network_error'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.verification.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>{t('auth.verification.verify_phone')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.verification.code_sent_to', { 
              countryCode: phoneType === 'CN' ? '86' : '1', 
              phone: phoneNumber 
            })}
          </Text>

          <View style={styles.codeContainer}>
            {verificationCode.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.codeInput}
                value={digit}
                onChangeText={(value) => handleCodeChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                returnKeyType="done"
                onSubmitEditing={() => {
                  // 最后一个输入框按完成时收起键盘
                  if (index === 5) {
                    Keyboard.dismiss();
                  }
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResendCode}
            disabled={resendCountdown > 0}
          >
            <Text style={[
              styles.resendText,
              resendCountdown > 0 && styles.resendTextDisabled
            ]}>
              {resendCountdown > 0 
                ? t('auth.verification.resend_countdown', { seconds: resendCountdown })
                : t('auth.verification.resend_code')
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerifyAndRegister}
            disabled={loading || verificationCode.join('').length !== 6}
          >
            {loading ? (
              <LoaderOne size="small" color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.verifyButtonText}>{t('auth.verification.verify_and_register')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 🔧 成功弹窗 - 与Web端保持一致的体验 */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('auth.register.success.title')}
        message={t('auth.register.success.message')}
        confirmText={t('auth.register.success.start_using')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[8],
  },
  formContainer: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    padding: theme.spacing.lg,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow.light],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[8],
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[6],
  },
  codeInput: {
    width: 50,
    height: 56,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  resendText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  resendTextDisabled: {
    color: theme.colors.text.disabled,
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});