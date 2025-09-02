import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { LIQUID_GLASS_LAYERS, CORE_COLORS, CORE_SPACING, CORE_BORDER_RADIUS, CORE_SHADOWS } from '../../theme/core';
import { useTheme } from '../../context/ThemeContext';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';

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
  const themeContext = useTheme();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;

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
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: CORE_SPACING['5'], // 20px
    },
    
    // Liquid Glass 容器
    container: {
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
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CORE_SPACING['4'], // 16px
    },
    
    // 标题文字
    title: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: CORE_SPACING['2'], // 8px
    },
    
    // 描述文字
    message: {
      fontSize: 15,
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
      borderRadius: CORE_BORDER_RADIUS.button, // 12px
      paddingVertical: CORE_SPACING['3'], // 12px
      paddingHorizontal: CORE_SPACING['6'], // 24px
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '500',
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
      <View style={[styles.overlay, dmStyles.modal.overlay]}>
        <View style={[
          styles.container,
          dmStyles.modal.container
        ]}>
          {/* 顶部图标 */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: isDarkMode ? 'rgba(255, 138, 101, 0.16)' : 'rgba(255, 107, 53, 0.10)' }
          ]}>
            <Ionicons 
              name="lock-closed-outline" 
              size={28} 
              color={dmIcons.brand} 
            />
          </View>
          
          {/* 标题 */}
          <Text style={[
            styles.title,
            dmStyles.text.title
          ]}>
            {title || t('alerts.login_required_title')}
          </Text>
          
          {/* 描述消息 */}
          <Text style={[
            styles.message,
            dmStyles.text.secondary
          ]}>
            {message || t('alerts.login_required_activity_message')}
          </Text>
          
          {/* 按钮组 */}
          <View style={styles.buttonContainer}>
            {/* 主按钮 - 去登录 */}
            <TouchableOpacity
              style={[styles.primaryButton, dmStyles.button.primary]}
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
                dmStyles.button.outline
              ]}
              onPress={handleClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text style={[
                styles.secondaryButtonText,
                dmStyles.text.primary
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