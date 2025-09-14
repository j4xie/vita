import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LinearGradient } from '../web/WebLinearGradient';
import { BlurView } from '../web/WebBlurView';
import { getWebInputStyles } from '../../utils/webInputStyles';

interface ReferralCodeInputSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string, setError: (error: string) => void) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ReferralCodeInputSheet: React.FC<ReferralCodeInputSheetProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  // 重置状态
  useEffect(() => {
    console.log('🎯 [ReferralCodeInputSheet] visible状态变化:', visible);
    if (visible) {
      console.log('✅ [ReferralCodeInputSheet] 显示推荐码输入Sheet');
      setCode('');
      setError('');
      
      // 延迟聚焦，确保Sheet动画完成
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      // 清理定时器，防止内存泄漏
      return () => {
        clearTimeout(focusTimer);
      };
    }
  }, [visible]);

  // 验证推荐码格式
  const validateReferralCode = (inputCode: string): boolean => {
    const trimmedCode = inputCode.trim();
    
    // 支持两种格式：
    // 1. VG_REF_XXXXXXXX
    // 2. 直接的8位码 XXXXXXXX
    if (trimmedCode.startsWith('VG_REF_')) {
      const extractedCode = trimmedCode.replace('VG_REF_', '');
      return /^[A-Z0-9]{8}$/.test(extractedCode);
    }
    
    return /^[A-Z0-9]{8}$/.test(trimmedCode);
  };

  // 处理输入变化
  const handleCodeChange = (text: string) => {
    // 转换为大写并过滤特殊字符
    const upperText = text.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setCode(upperText);
    
    // 清除之前的错误
    if (error) {
      setError('');
    }
  };

  // 处理提交
  const handleSubmit = () => {
    const trimmedCode = code.trim();
    
    if (!trimmedCode) {
      setError(t('qr.scanning.error.empty_code', '请输入推荐码'));
      return;
    }
    
    if (!validateReferralCode(trimmedCode)) {
      setError(t('qr.scanning.error.invalid_format', '推荐码格式不正确（8位字母数字组合）'));
      return;
    }
    
    // 提取纯推荐码
    let finalCode = trimmedCode;
    if (trimmedCode.startsWith('VG_REF_')) {
      finalCode = trimmedCode.replace('VG_REF_', '');
    }
    
    // 调用父组件的验证逻辑，传递setError函数
    onSubmit(finalCode, setError);
  };

  // 处理取消
  const handleCancel = () => {
    setCode('');
    setError('');
    onClose();
  };


  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.overlay, { zIndex: 99999 }]}>
      {/* 背景遮罩 */}
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleCancel}
      />
      
      {/* Bottom Sheet */}
      <KeyboardAvoidingView 
        style={styles.sheetContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <BlurView intensity={20} style={styles.blurContainer}>
          <LinearGradient
            colors={[
              theme.colors.background.primary + 'F0',
              theme.colors.background.secondary + 'F0'
            ]}
            style={styles.sheetContent}
          >
            {/* 拖拽指示器 */}
            <View style={styles.dragIndicator} />
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="keypad-outline" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.title}>
                  {t('qr.scanning.manual_input_title', '手动输入推荐码')}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>
                {t('qr.scanning.manual_input_desc', 'Enter referral code')}
              </Text>
            </View>

            {/* 输入区域 */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {t('qr.scanning.referral_code_label', 'Referral Code')}
              </Text>
              
              <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={code}
                  onChangeText={handleCodeChange}
                  placeholder={t('qr.scanning.input_placeholder', 'Enter referral code')}
                  placeholderTextColor={theme.colors.text.disabled}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={16}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  autoFocus={false}
                />
                {code.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => setCode('')}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.colors.text.disabled} />
                  </TouchableOpacity>
                )}
              </View>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <Text style={styles.hintText}>
                  {t('qr.scanning.format_hint', '8 characters (letters and numbers)')}
                </Text>
              )}
            </View>

            {/* 获取方式说明 - 简化版 */}
            <View style={styles.instructionSection}>
              <Text style={styles.instructionTitle}>{t('qr.scanning.how_to_get', 'How to get referral code')}</Text>
              <Text style={styles.instructionText}>
                {t('qr.scanning.get_from_organization', 'Get from your organization or official platform')}
              </Text>
            </View>

            {/* 底部按钮 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={handleCancel}
              >
                <Text style={styles.secondaryButtonText}>
                  {t('qr.scanning.cancel', '取消')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.primaryButton,
                  !code.trim() ? styles.primaryButtonDisabled : null
                ]}
                onPress={handleSubmit}
                disabled={!code.trim()}
              >
                <Text style={[
                  styles.primaryButtonText,
                  !code.trim() ? styles.primaryButtonTextDisabled : null
                ]}>
                  {t('qr.scanning.confirm', '确认')}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    ...(Platform.OS === 'web' && {
      position: 'fixed',
    }),
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: screenHeight * 0.8,
    zIndex: 100000,
  },
  blurContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheetContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Safe area
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.text.disabled,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginLeft: 52, // 对齐icon后的文本
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.primary,
    borderRadius: 12,
    backgroundColor: theme.colors.background.input,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
    // Web环境下的兼容性修复
    ...getWebInputStyles(),
  },
  clearButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginLeft: 6,
    flex: 1,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.text.disabled,
    marginTop: 8,
    marginLeft: 4,
  },
  instructionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  primaryButtonTextDisabled: {
    color: theme.colors.background.primary,
  },
});









