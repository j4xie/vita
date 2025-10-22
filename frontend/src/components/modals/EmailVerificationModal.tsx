import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { sendEmailVerificationCode, verifyEmailCode } from '../../services/registrationAPI';
import { getCurrentToken } from '../../services/authAPI';

interface EmailVerificationModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onVerified: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  visible,
  email,
  onClose,
  onVerified,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

  const [verificationCode, setVerificationCode] = useState('');
  const [bizId, setBizId] = useState<string>('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setVerificationCode('');
      setBizId('');
      setCodeSent(false);
      setCountdown(0);
    }
  }, [visible]);

  const handleSendCode = async () => {
    if (isSendingCode || countdown > 0) return;

    try {
      setIsSendingCode(true);

      // Get token for authenticated request
      const token = await getCurrentToken();
      if (!token) {
        Alert.alert(
          t('common.error'),
          t('auth.login_required', '请先登录')
        );
        return;
      }

      console.log('🔐 [EmailVerificationModal] 发送验证码:', { email });

      const response = await sendEmailVerificationCode(email, token);

      if (response.code === 200 || response.code === 'OK') {
        // Extract bizId from response
        const newBizId = response.bizId || response.data?.bizId || '';
        setBizId(newBizId);
        setCodeSent(true);
        setCountdown(60);

        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert(
          t('common.success'),
          t('auth.verification_code_sent', '验证码已发送到您的邮箱')
        );
      } else {
        throw new Error(response.msg || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('❌ [EmailVerificationModal] 发送验证码失败:', error);

      let errorMessage = t('auth.send_code_failed', '发送验证码失败');
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = t('auth.login_required', '请先登录');
        } else if (error.message.includes('Network')) {
          errorMessage = t('common.network_error', '网络错误，请检查连接');
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert(
        t('common.error'),
        t('auth.verification_code_invalid', '请输入6位验证码')
      );
      return;
    }

    if (!bizId) {
      Alert.alert(
        t('common.error'),
        t('auth.send_code_first', '请先发送验证码')
      );
      return;
    }

    try {
      setIsVerifying(true);

      console.log('🔐 [EmailVerificationModal] 验证邮箱验证码:', {
        email,
        verCodeLength: verificationCode.length,
        bizId
      });

      const response = await verifyEmailCode({
        email,
        verCode: verificationCode,
        bizId,
      });

      if (response.code === 200) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert(
          t('common.success'),
          t('auth.email_verified_success', '邮箱认证成功'),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                onVerified();
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error(response.msg || 'Verification failed');
      }
    } catch (error) {
      console.error('❌ [EmailVerificationModal] 验证失败:', error);

      let errorMessage = t('auth.verification_failed', '验证失败');
      if (error instanceof Error) {
        if (error.message.includes('参数缺失')) {
          errorMessage = t('auth.verification_code_invalid', '验证码无效');
        } else if (error.message.includes('Network')) {
          errorMessage = t('common.network_error', '网络错误，请检查连接');
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert(t('common.error'), errorMessage);
      setVerificationCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '85%',
      maxWidth: 400,
      backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
      borderRadius: 16,
      padding: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#000000',
      flex: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      marginBottom: 24,
    },
    emailSection: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: '500',
      color: isDarkMode ? '#ffffff' : '#000000',
      marginBottom: 8,
    },
    emailText: {
      fontSize: 16,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      fontStyle: 'italic',
    },
    sendCodeSection: {
      marginBottom: 20,
    },
    sendCodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      minHeight: 44,
    },
    sendCodeButtonDisabled: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    sendCodeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 8,
    },
    sendCodeButtonTextDisabled: {
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
    },
    codeInputSection: {
      marginBottom: 20,
    },
    codeInput: {
      fontSize: 17,
      color: isDarkMode ? '#ffffff' : '#000000',
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      textAlign: 'center',
      letterSpacing: 8,
    },
    codeInputFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    hint: {
      fontSize: 13,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      marginTop: 8,
      textAlign: 'center',
    },
    verifyButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    verifyButtonDisabled: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    verifyButtonText: {
      fontSize: 17,
      fontWeight: '600',
      color: '#ffffff',
    },
    verifyButtonTextDisabled: {
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.email_verification', '邮箱认证')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={isDarkMode ? '#ffffff' : '#000000'}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Email Display */}
            <View style={styles.emailSection}>
              <Text style={styles.label}>{t('profile.edit.email', '邮箱地址')}</Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>

            {/* Send Code Button */}
            <View style={styles.sendCodeSection}>
              <TouchableOpacity
                style={[
                  styles.sendCodeButton,
                  (isSendingCode || countdown > 0) && styles.sendCodeButtonDisabled,
                ]}
                onPress={handleSendCode}
                disabled={isSendingCode || countdown > 0}
                activeOpacity={0.7}
              >
                {isSendingCode ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="mail"
                      size={20}
                      color={countdown > 0 ? (isDarkMode ? '#8e8e93' : '#8e8e93') : '#ffffff'}
                    />
                    <Text
                      style={[
                        styles.sendCodeButtonText,
                        countdown > 0 && styles.sendCodeButtonTextDisabled,
                      ]}
                    >
                      {countdown > 0
                        ? t('auth.resend_after_seconds', { seconds: countdown }, `${countdown}秒后重新发送`)
                        : codeSent
                        ? t('auth.resend_code', '重新发送验证码')
                        : t('auth.send_verification_code', '发送验证码')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Verification Code Input */}
            {codeSent && (
              <View style={styles.codeInputSection}>
                <Text style={styles.label}>{t('auth.verification_code', '验证码')}</Text>
                <TextInput
                  style={styles.codeInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="000000"
                  placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  editable={!isVerifying}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.4}
                />
                <Text style={styles.hint}>
                  {t('auth.enter_6_digit_code', '请输入邮箱收到的6位验证码')}
                </Text>
              </View>
            )}
          </View>

          {/* Verify Button */}
          {codeSent && (
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (isVerifying || verificationCode.length !== 6) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              activeOpacity={0.7}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text
                  style={[
                    styles.verifyButtonText,
                    verificationCode.length !== 6 && styles.verifyButtonTextDisabled,
                  ]}
                >
                  {t('auth.verify', '验证')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
