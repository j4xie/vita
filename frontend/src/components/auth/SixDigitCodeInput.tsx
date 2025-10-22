import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface SixDigitCodeInputProps {
  phoneNumber: string;
  areaCode: '86' | '1';
  onCodeChange: (code: string) => void;
  onResend: () => void;
  countdown: number;
  visible: boolean;
}

export const SixDigitCodeInput: React.FC<SixDigitCodeInputProps> = ({
  phoneNumber,
  areaCode,
  onCodeChange,
  onResend,
  countdown,
  visible,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 动画显示/隐藏
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleCodeChange = (index: number, value: string) => {
    // 只允许数字
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // 通知父组件
    onCodeChange(newCode.join(''));

    // 自动聚焦下一个输入框
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (!visible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* 标题 */}
      <Text style={styles.title}>
        {t('auth.verification.verify_phone')}
      </Text>

      {/* 副标题 */}
      <Text style={styles.subtitle}>
        {t('auth.verification.code_sent_to', {
          countryCode: areaCode,
          phone: phoneNumber,
        })}
      </Text>

      {/* 6位验证码输入框 */}
      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <View key={index} style={styles.codeInputWrapper}>
            <TextInput
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(index, value)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(index, nativeEvent.key)
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              autoFocus={index === 0}
              selectTextOnFocus
            />
            {/* 底部光标效果 */}
            {!digit && index === code.findIndex((d) => !d) && (
              <View style={styles.cursor} />
            )}
          </View>
        ))}
      </View>

      {/* 重新发送倒计时 */}
      <View style={styles.resendContainer}>
        {countdown > 0 ? (
          <Text style={styles.countdownText}>
            {t('auth.verification.resend_countdown', { seconds: countdown })}
          </Text>
        ) : (
          <TouchableOpacity onPress={onResend}>
            <Text style={styles.resendText}>
              {t('auth.verification.resend_code')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 32,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  codeInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  codeInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 56,
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    borderWidth: 0,
  },
  codeInputFilled: {
    backgroundColor: '#E5E7EB',
  },
  cursor: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 24,
    backgroundColor: theme.colors.primary,
  },
  resendContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
