import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LinearGradient } from '../web/WebLinearGradient';

interface ReferralCodeInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  title?: string;
  placeholder?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const ReferralCodeInputModal: React.FC<ReferralCodeInputModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title,
  placeholder
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  // 重置状态
  useEffect(() => {
    if (visible) {
      setCode('');
      setError('');
      // 延迟聚焦，确保Modal动画完成
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
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
    // 转换为大写
    const upperText = text.toUpperCase();
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
      setError(t('qr.scanning.error.empty_code'));
      return;
    }
    
    if (!validateReferralCode(trimmedCode)) {
      setError(t('qr.scanning.error.invalid_format'));
      return;
    }
    
    // 提取纯推荐码
    let finalCode = trimmedCode;
    if (trimmedCode.startsWith('VG_REF_')) {
      finalCode = trimmedCode.replace('VG_REF_', '');
    }
    
    onSubmit(finalCode);
    onClose();
  };

  // 处理取消
  const handleCancel = () => {
    setCode('');
    setError('');
    onClose();
  };

  // 处理键盘确认
  const handleKeyPress = ({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={[theme.colors.background.primary, theme.colors.background.secondary]}
              style={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="keypad-outline" size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.title}>
                  {title || t('qr.scanning.manual_input_title')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('qr.scanning.manual_input_desc')}
                </Text>
              </View>

              {/* Input Section */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>
                  {t('qr.scanning.referral_code_label')}
                </Text>
                <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={code}
                    onChangeText={handleCodeChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder || t('qr.scanning.input_placeholder')}
                    placeholderTextColor={theme.colors.text.disabled}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={16} // 支持 VG_REF_XXXXXXXX 格式
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    autoFocus={false} // 由useEffect控制聚焦时机
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
                  <Text style={styles.errorText}>{error}</Text>
                ) : (
                  <Text style={styles.hintText}>
                    {t('qr.scanning.format_hint')}
                  </Text>
                )}
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>
                    {t('qr.scanning.cancel')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    styles.confirmButton,
                    !code.trim() ? styles.confirmButtonDisabled : null
                  ]}
                  onPress={handleSubmit}
                  disabled={!code.trim()}
                >
                  <Text style={[
                    styles.confirmButtonText,
                    !code.trim() ? styles.confirmButtonTextDisabled : null
                  ]}>
                    {t('qr.scanning.confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Math.min(screenWidth * 0.9, 400),
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
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
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // 等宽字体便于输入
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 8,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.text.disabled,
    marginTop: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  confirmButtonTextDisabled: {
    color: theme.colors.background.primary,
  },
});








