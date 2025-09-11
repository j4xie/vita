import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { LIQUID_GLASS_LAYERS, CORE_COLORS, CORE_SPACING, CORE_BORDER_RADIUS, CORE_SHADOWS } from '../../theme/core';
import { useTheme } from '../../context/ThemeContext';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';

interface SuccessNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onAction?: () => void;
  title: string;
  message: string;
  actionText?: string;
  icon?: string;
  duration?: number; // 自动关闭时间（毫秒），默认3000ms
}

export const SuccessNotificationModal: React.FC<SuccessNotificationModalProps> = ({
  visible,
  onClose,
  onAction,
  title,
  message,
  actionText,
  icon = "checkmark-circle",
  duration = 3000
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // 播放触觉反馈
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // 启动进入动画
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 设置自动关闭定时器
      if (duration > 0) {
        autoCloseTimer.current = setTimeout(() => {
          handleClose();
        }, duration);
      }
    } else {
      // 重置动画值
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      
      // 清理定时器
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = null;
      }
    }

    return () => {
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
      }
    };
  }, [visible]);

  const handleClose = () => {
    // 清理定时器
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }

    // 启动退出动画
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleAction = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // 清理定时器
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: CORE_SPACING['5'], // 20px
      backgroundColor: 'rgba(0, 0, 0, 0.4)', // 半透明遮罩
    },
    
    // Liquid Glass 容器
    container: {
      borderRadius: CORE_BORDER_RADIUS.modal, // 24px
      padding: CORE_SPACING['6'], // 24px
      maxWidth: 340,
      width: '100%',
      alignItems: 'center',
      // 应用 Liquid Glass 阴影
      ...CORE_SHADOWS.lg,
    },
    
    // 成功图标容器
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CORE_SPACING['4'], // 16px
      backgroundColor: 'rgba(34, 197, 94, 0.12)', // 绿色背景
    },
    
    // 标题文字
    title: {
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: CORE_SPACING['2'], // 8px
      color: CORE_COLORS.text.primary,
    },
    
    // 描述文字
    message: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: CORE_SPACING['6'], // 24px
      paddingHorizontal: CORE_SPACING['2'], // 8px
      color: CORE_COLORS.text.secondary,
    },
    
    // 按钮容器
    buttonContainer: {
      flexDirection: 'row',
      width: '100%',
      gap: CORE_SPACING['3'], // 12px
    },
    
    // 主按钮 (操作)
    primaryButton: {
      flex: 1,
      borderRadius: CORE_BORDER_RADIUS.button, // 12px
      paddingVertical: CORE_SPACING['3'], // 12px
      paddingHorizontal: CORE_SPACING['4'], // 16px
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CORE_COLORS.primary,
      // 按钮阴影
      ...CORE_SHADOWS.button,
    },
    
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: CORE_COLORS.text.inverse, // 白色
    },
    
    // 次要按钮 (关闭) - 只在有操作按钮时显示
    secondaryButton: {
      flex: 1,
      borderRadius: CORE_BORDER_RADIUS.button, // 12px
      paddingVertical: CORE_SPACING['3'], // 12px
      paddingHorizontal: CORE_SPACING['4'], // 16px
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    },
    
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: CORE_COLORS.text.secondary,
    },
    
    // 单按钮样式（没有操作按钮时）
    singleButton: {
      width: '100%',
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none" // 使用自定义动画
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Animated.View style={[
          styles.container,
          dmStyles.modal.container,
          {
            transform: [{ scale: scaleAnim }],
          }
        ]}>
          {/* 成功图标 */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={icon as any}
              size={36} 
              color="#22C55E" // 绿色
            />
          </View>
          
          {/* 标题 */}
          <Text style={[
            styles.title,
            dmStyles.text.title
          ]}>
            {title}
          </Text>
          
          {/* 描述消息 */}
          <Text style={[
            styles.message,
            dmStyles.text.secondary
          ]}>
            {message}
          </Text>
          
          {/* 按钮组 */}
          <View style={styles.buttonContainer}>
            {actionText && onAction ? (
              <>
                {/* 主按钮 - 操作 */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleAction}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={actionText}
                >
                  <Text style={styles.primaryButtonText}>
                    {actionText}
                  </Text>
                </TouchableOpacity>
                
                {/* 次要按钮 - 关闭 */}
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                >
                  <Text style={[
                    styles.secondaryButtonText,
                    dmStyles.text.primary
                  ]}>
                    {t('common.close')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* 单按钮 - 关闭 */
              <TouchableOpacity
                style={[styles.primaryButton, styles.singleButton]}
                onPress={handleClose}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Text style={styles.primaryButtonText}>
                  {t('common.close')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default SuccessNotificationModal;