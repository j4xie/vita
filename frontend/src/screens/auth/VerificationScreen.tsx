import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { vitaGlobalAPI } from '../../services/VitaGlobalAPI';

export const VerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  const { formData, phoneNumber, phoneType } = route.params;
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

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
      Alert.alert('错误', '请输入6位验证码');
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
        deptId: formData.universityId,
        verCode: code,
        bizId: formData.bizId,
        ...(formData.referralCode && { invCode: formData.referralCode }),
        ...(formData.organizationId && { orgId: formData.organizationId }),
      };

      const result = await vitaGlobalAPI.register(registerData);

      if (result.code === 200) {
        Alert.alert(
          '注册成功',
          '恭喜您注册成功！',
          [
            {
              text: '确定',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('注册失败', result.msg || '注册过程中出现错误');
      }
    } catch (error) {
      console.error('注册错误:', error);
      Alert.alert('注册失败', '网络连接失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    try {
      const phoneNumberWithCode = phoneType === 'CN' 
        ? `86${phoneNumber}` 
        : `1${phoneNumber}`;
      
      const result = await vitaGlobalAPI.sendSMSVerification(phoneNumberWithCode);
      
      if (result.code === 'OK') {
        Alert.alert('验证码已发送', '请查看短信验证码');
        
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
        Alert.alert('发送失败', '验证码发送失败，请稍后重试');
      }
    } catch (error) {
      Alert.alert('发送失败', '网络连接失败');
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
        <Text style={styles.headerTitle}>短信验证</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>验证您的手机号</Text>
          <Text style={styles.subtitle}>
            我们已向 +{phoneType === 'CN' ? '86' : '1'} {phoneNumber} 发送验证码
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
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
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
                ? `重新发送 (${resendCountdown}s)`
                : '重新发送验证码'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerifyAndRegister}
            disabled={loading || verificationCode.join('').length !== 6}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.verifyButtonText}>验证并注册</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    borderBottomColor: theme.colors.border,
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
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
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
    borderColor: 'transparent',
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