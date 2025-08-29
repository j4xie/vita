import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { LIQUID_GLASS_LAYERS, CORE_COLORS, CORE_SPACING, CORE_BORDER_RADIUS, CORE_SHADOWS } from '../../theme/core';

interface LoginRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  title?: string;
  message?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  visible,
  onClose,
  onLogin,
  title,
  message,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleLogin = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLogin();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: CORE_SPACING['5'], // 20px
    },
    
    // Liquid Glass 容器
    container: {
      backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
      borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
      borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
      borderRadius: CORE_BORDER_RADIUS.modal, // 24px
      padding: CORE_SPACING['6'], // 24px
      maxWidth: 320,
      width: '100%',
      alignItems: 'center',
      // 应用 Liquid Glass 阴影
      ...CORE_SHADOWS.md,
    },
    
    // 顶部图标
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255, 107, 53, 0.10)', // PomeloX 橙色背景，10% 透明度
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CORE_SPACING['4'], // 16px
    },
    
    // 标题文字
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: CORE_COLORS.text.primary,
      textAlign: 'center',
      marginBottom: CORE_SPACING['2'], // 8px
    },
    
    // 描述文字
    message: {
      fontSize: 15,
      color: CORE_COLORS.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: CORE_SPACING['6'], // 24px
      paddingHorizontal: CORE_SPACING['2'], // 8px
    },
    
    // 按钮容器
    buttonContainer: {
      flexDirection: 'column',
      width: '100%',
      gap: CORE_SPACING['3'], // 12px
    },
    
    // 主按钮 (登录)
    primaryButton: {
      backgroundColor: CORE_COLORS.primary, // PomeloX 橙色
      borderRadius: CORE_BORDER_RADIUS.button, // 12px
      paddingVertical: CORE_SPACING['3'], // 12px
      paddingHorizontal: CORE_SPACING['6'], // 24px
      alignItems: 'center',
      justifyContent: 'center',
      // 按钮阴影
      ...CORE_SHADOWS.button,
    },
    
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: CORE_COLORS.text.inverse, // 白色
    },
    
    // 次要按钮 (取消)
    secondaryButton: {
      backgroundColor: 'rgba(107, 114, 128, 0.1)', // 中性灰背景
      borderWidth: 1,
      borderColor: 'rgba(107, 114, 128, 0.2)', // 中性灰边框
      borderRadius: CORE_BORDER_RADIUS.button, // 12px
      paddingVertical: CORE_SPACING['3'], // 12px
      paddingHorizontal: CORE_SPACING['6'], // 24px
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: CORE_COLORS.text.secondary,
    },
    
    // 深色模式适配
    containerDark: {
      backgroundColor: LIQUID_GLASS_LAYERS.L1.background.dark,
      borderColor: LIQUID_GLASS_LAYERS.L1.border.color.dark,
    },
    
    titleDark: {
      color: '#FFFFFF',
    },
    
    messageDark: {
      color: '#D1D5DB',
    },
    
    secondaryButtonDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    
    secondaryButtonTextDark: {
      color: '#D1D5DB',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          isDarkMode && styles.containerDark
        ]}>
          {/* 顶部图标 */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name="lock-closed-outline" 
              size={28} 
              color={CORE_COLORS.primary} 
            />
          </View>
          
          {/* 标题 */}
          <Text style={[
            styles.title,
            isDarkMode && styles.titleDark
          ]}>
            {title || t('alerts.login_required_title')}
          </Text>
          
          {/* 描述消息 */}
          <Text style={[
            styles.message,
            isDarkMode && styles.messageDark
          ]}>
            {message || t('alerts.login_required_activity_message')}
          </Text>
          
          {/* 按钮组 */}
          <View style={styles.buttonContainer}>
            {/* 主按钮 - 去登录 */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('alerts.go_login')}
            >
              <Text style={styles.primaryButtonText}>
                {t('alerts.go_login')}
              </Text>
            </TouchableOpacity>
            
            {/* 次要按钮 - 取消 */}
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                isDarkMode && styles.secondaryButtonDark
              ]}
              onPress={handleClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text style={[
                styles.secondaryButtonText,
                isDarkMode && styles.secondaryButtonTextDark
              ]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LoginRequiredModal;