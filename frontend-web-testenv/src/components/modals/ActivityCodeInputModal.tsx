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

interface ActivityCodeInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  title?: string;
  placeholder?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const ActivityCodeInputModal: React.FC<ActivityCodeInputModalProps> = ({
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

  // 验证活动码格式 - 支持1-6位数字
  const validateActivityCode = (inputCode: string): boolean => {
    const trimmedCode = inputCode.trim();

    // 支持1-6位数字
    return /^\d{1,6}$/.test(trimmedCode);
  };

  // 处理输入变化 - 只允许数字
  const handleCodeChange = (text: string) => {
    // 只允许数字输入
    const numericText = text.replace(/[^0-9]/g, '');
    // 限制最大长度为6
    const limitedText = numericText.slice(0, 6);

    setCode(limitedText);

    // 清除之前的错误
    if (error) {
      setError('');
    }
  };

  // 处理提交
  const handleSubmit = () => {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError(t('qr.scanning.activity.empty_code') || '请输入活动代码');
      return;
    }

    if (!validateActivityCode(trimmedCode)) {
      setError(t('qr.scanning.activity.invalid_format') || '请输入1-6位数字的活动代码');
      return;
    }

    // 提交活动码（纯数字格式，parseActivityQRCode会直接解析）
    onSubmit(trimmedCode);
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
                  <Ionicons name="keypad" size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.title}>
                  {title || t('qr.scanning.activity.manual_input_title') || '手动输入活动代码'}
                </Text>
                <Text style={styles.subtitle}>
                  {t('qr.scanning.activity.manual_input_desc') || '输入1-6位数字的活动代码'}
                </Text>
              </View>

              {/* Input Section */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>
                  {t('qr.scanning.activity.code_label') || '活动代码'}
                </Text>
                <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={code}
                    onChangeText={handleCodeChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder || t('qr.scanning.activity.code_placeholder') || '请输入1-6位数字'}
                    placeholderTextColor={theme.colors.text.disabled}
                    keyboardType="numeric" // 仅数字键盘
                    maxLength={6} // 最大6位
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
                  <View style={styles.hintSection}>
                    <Text style={styles.hintText}>
                      {t('qr.scanning.activity.format_hint') || '支持1-6位数字，例如：123 或 456789'}
                    </Text>
                    <Text style={styles.exampleText}>
                      {t('qr.scanning.activity.examples') || '示例：123、1234、123456'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Number Pad - Quick Input */}
              <View style={styles.quickInputSection}>
                <Text style={styles.quickInputLabel}>
                  {t('qr.scanning.activity.quick_input') || '快速输入'}
                </Text>
                <View style={styles.numberPad}>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <TouchableOpacity
                      key={num}
                      style={styles.numberButton}
                      onPress={() => handleCodeChange(code + num.toString())}
                      disabled={code.length >= 6}
                    >
                      <Text style={[
                        styles.numberButtonText,
                        code.length >= 6 && styles.numberButtonTextDisabled
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => handleCodeChange(code + '0')}
                    disabled={code.length >= 6}
                  >
                    <Text style={[
                      styles.numberButtonText,
                      code.length >= 6 && styles.numberButtonTextDisabled
                    ]}>
                      0
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.numberButton, styles.deleteButton]}
                    onPress={() => handleCodeChange(code.slice(0, -1))}
                    disabled={code.length === 0}
                  >
                    <Ionicons
                      name="backspace"
                      size={24}
                      color={code.length === 0 ? theme.colors.text.disabled : theme.colors.text.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>
                    {t('qr.scanning.cancel') || '取消'}
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
                    {t('qr.scanning.confirm') || '确认'}
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
    marginBottom: 20,
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
    fontSize: 18,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
    letterSpacing: 4,
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
  hintSection: {
    marginTop: 8,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.text.disabled,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 11,
    color: theme.colors.text.disabled,
    fontStyle: 'italic',
  },
  quickInputSection: {
    marginBottom: 24,
  },
  quickInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  numberButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  deleteButton: {
    backgroundColor: theme.colors.background.secondary,
  },
  numberButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  numberButtonTextDisabled: {
    color: theme.colors.text.disabled,
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