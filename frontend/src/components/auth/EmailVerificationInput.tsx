import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { emailAPI } from '../../services/emailAPI';

interface EmailVerificationInputProps {
  email: string;
  onEmailChange: (email: string) => void;
  onVerificationCodeChange: (code: string) => void;
  onVerificationSuccess?: () => void;
  userId?: number;
  verificationType?: 'register' | 'reset_password' | 'verify_email';
  disabled?: boolean;
}

/**
 * 邮箱验证输入组件
 *
 * 功能：
 * - 邮箱输入框
 * - 验证码输入框
 * - 发送验证码按钮（带60秒倒计时）
 * - 验证码验证
 *
 * 用于：
 * - 注册流程
 * - 密码重置
 * - 邮箱绑定
 */
export const EmailVerificationInput: React.FC<EmailVerificationInputProps> = ({
  email,
  onEmailChange,
  onVerificationCodeChange,
  onVerificationSuccess,
  userId,
  verificationType = 'register',
  disabled = false,
}) => {
  const { t } = useTranslation();

  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 发送验证码
  const handleSendCode = async () => {
    // 验证邮箱格式
    if (!validateEmail(email)) {
      setEmailError(t('auth.email.invalid_format', 'Invalid email format'));
      return;
    }

    setEmailError('');
    setIsSendingCode(true);

    try {
      const response = await emailAPI.sendVerificationCodeWithCooldown({
        email,
        userId,
        type: verificationType,
      });

      if (response.success) {
        setCountdown(response.canResendAfter || 60);
        // Success message could be shown via toast
      } else {
        setEmailError(response.message);
      }
    } catch (error) {
      console.error('❌ 发送验证码失败:', error);
      setEmailError(t('auth.email.send_failed', 'Failed to send verification code'));
    } finally {
      setIsSendingCode(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (verificationCode.length < 4) {
      setCodeError(t('auth.email.code_too_short', 'Verification code too short'));
      return;
    }

    setCodeError('');
    setIsVerifying(true);

    try {
      const response = await emailAPI.verifyEmailCode({
        email,
        code: verificationCode,
        userId,
      });

      if (response.code === 200) {
        setIsVerified(true);
        onVerificationSuccess?.();
      } else {
        setCodeError(response.msg || t('auth.email.verify_failed', 'Verification failed'));
      }
    } catch (error) {
      console.error('❌ 验证失败:', error);
      setCodeError(t('auth.email.verify_error', 'Verification error'));
    } finally {
      setIsVerifying(false);
    }
  };

  // 验证码输入变化
  const handleCodeChange = (code: string) => {
    setVerificationCode(code);
    onVerificationCodeChange(code);
    setCodeError('');

    // 自动验证（当输入6位数字时）
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      handleVerifyCode();
    }
  };

  return (
    <View style={styles.container}>
      {/* 邮箱输入 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {t('auth.email.email_address', 'Email Address')}
        </Text>
        <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
          <Ionicons name="mail-outline" size={20} color="#86868B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              onEmailChange(text);
              setEmailError('');
            }}
            placeholder={t('auth.email.enter_email', 'Enter your email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled && !isVerified}
          />
          {isVerified && (
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          )}
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      {/* 验证码输入 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {t('auth.email.verification_code', 'Verification Code')}
        </Text>
        <View style={styles.codeInputRow}>
          <View style={[styles.inputContainer, styles.codeInput, codeError ? styles.inputError : null]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#86868B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={verificationCode}
              onChangeText={handleCodeChange}
              placeholder={t('auth.email.enter_code', 'Enter code')}
              keyboardType="number-pad"
              maxLength={6}
              editable={!disabled && !isVerified}
            />
            {isVerifying && (
              <ActivityIndicator size="small" color="#007AFF" />
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (countdown > 0 || isSendingCode || disabled || isVerified) && styles.sendButtonDisabled
            ]}
            onPress={handleSendCode}
            disabled={countdown > 0 || isSendingCode || disabled || isVerified}
          >
            {isSendingCode ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>
                {countdown > 0
                  ? `${countdown}s`
                  : t('auth.email.send_code', 'Send')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
      </View>

      {/* 验证成功提示 */}
      {isVerified && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.successText}>
            {t('auth.email.verified', 'Email verified successfully')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F4',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
});
