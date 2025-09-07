/* Web端特定版本 - 与App端隔离 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../../utils/i18n';
import { getLocalizedTextWidth } from '../../utils/i18n';

const { width, height } = Dimensions.get('window');

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

interface LanguageSwitcherProps {
  style?: object;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'dropdown' | 'minimal';
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  style,
  showLabel = true,
  size = 'medium',
  variant = 'button',
  onLanguageChange,
}) => {
  const { t } = useTranslation();
  const { 
    currentLanguage, 
    changeLanguage, 
    getLanguageDisplayName,
    isLoading 
  } = useLanguage();
  
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // 语言选项配置
  const languageOptions: LanguageOption[] = [
    {
      code: 'zh-CN',
      label: t('language.settings.chinese', 'Chinese'),
      nativeLabel: '中文',
      flag: '🇨🇳',
    },
    {
      code: 'en-US',
      label: t('language.settings.english', 'English'),
      nativeLabel: 'English',
      flag: '🇺🇸',
    },
  ];

  // 获取当前语言的选项
  const currentOption = languageOptions.find(option => option.code === currentLanguage);

  // 打开语言选择模态框
  const openLanguageModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 关闭语言选择模态框
  const closeLanguageModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  // 处理语言选择
  const handleLanguageSelect = async (language: SupportedLanguage) => {
    if (language === currentLanguage) {
      closeLanguageModal();
      return;
    }

    try {
      await changeLanguage(language);
      onLanguageChange?.(language);
      closeLanguageModal();
      
      // 显示成功提示
      Alert.alert(t('alerts.success'), t('alerts.languageSwitched'));
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('common.error'), 
        t('language.settings.change_error', 'Failed to change language')
      );
    }
  };

  // 获取尺寸样式
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: theme.spacing.sm,
          fontSize: theme.typography.fontSize.sm,
          iconSize: 16,
        };
      case 'large':
        return {
          padding: theme.spacing.lg,
          fontSize: theme.typography.fontSize.lg,
          iconSize: 24,
        };
      default:
        return {
          padding: theme.spacing.md,
          fontSize: theme.typography.fontSize.base,
          iconSize: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // 渲染主按钮
  const renderTriggerButton = () => {
    const buttonContent = (
      <View style={styles.buttonContent}>
        {currentOption && (
          <>
            <Text style={[styles.flag, { fontSize: sizeStyles.iconSize }]}>
              {currentOption.flag}
            </Text>
            {showLabel && (
              <Text style={[styles.buttonLabel, { fontSize: sizeStyles.fontSize }]}>
                {variant === 'minimal' ? currentOption.code : currentOption.nativeLabel}
              </Text>
            )}
          </>
        )}
        <Ionicons 
          name="chevron-down" 
          size={sizeStyles.iconSize} 
          color={theme.colors.text.secondary}
          style={styles.dropdownIcon}
        />
      </View>
    );

    if (variant === 'minimal') {
      return (
        <TouchableOpacity
          style={[styles.minimalButton, { padding: sizeStyles.padding }, style]}
          onPress={openLanguageModal}
          disabled={isLoading}
        >
          {buttonContent}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.button,
          variant === 'dropdown' && styles.dropdownButton,
          { padding: sizeStyles.padding },
          isLoading && styles.buttonDisabled,
          style,
        ]}
        onPress={openLanguageModal}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  };

  // 渲染语言选项
  const renderLanguageOption = (option: LanguageOption) => {
    const isSelected = option.code === currentLanguage;
    
    return (
      <TouchableOpacity
        key={option.code}
        style={[
          styles.optionItem,
          isSelected && styles.optionItemSelected,
        ]}
        onPress={() => handleLanguageSelect(option.code)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <Text style={styles.optionFlag}>{option.flag}</Text>
          <View style={styles.optionText}>
            <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
              {option.nativeLabel}
            </Text>
            <Text style={[styles.optionSubLabel, isSelected && styles.optionSubLabelSelected]}>
              {option.label}
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {renderTriggerButton()}
      
      {/* 语言选择模态框 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeLanguageModal}
        statusBarTranslucent
      >
        <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" />
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeLanguageModal}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* 模态框头部 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('language.settings.title', 'Language Settings')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeLanguageModal}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            {/* 语言选项列表 */}
            <View style={styles.optionsList}>
              {languageOptions.map(renderLanguageOption)}
            </View>
            
            {/* 提示文字 */}
            <Text style={styles.modalNote}>
              {t('language.settings.restart_note', 'Language change will take effect immediately')}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // 主按钮样式
  button: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    ...theme.shadows.button,
  },
  dropdownButton: {
    backgroundColor: theme.colors.background.primary,
  },
  minimalButton: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    marginRight: theme.spacing.sm,
  },
  buttonLabel: {
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  dropdownIcon: {
    marginLeft: 'auto',
  },

  // 模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.modal,
    maxWidth: 400,
    width: '100%',
    maxHeight: height * 0.6,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.secondary,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },

  // 选项列表样式
  optionsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.sm,
  },
  optionItemSelected: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionFlag: {
    fontSize: theme.typography.fontSize.xl,
    marginRight: theme.spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  optionLabelSelected: {
    color: theme.colors.primary,
  },
  optionSubLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  optionSubLabelSelected: {
    color: theme.colors.primary,
  },

  // 模态框底部
  modalNote: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
});