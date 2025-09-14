import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from '../web/WebLinearGradient';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { theme } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LiquidSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const LiquidSuccessModal: React.FC<LiquidSuccessModalProps> = ({
  visible,
  onClose,
  title,
  message,
  confirmText = '确认',
  icon = 'checkmark-circle',
}) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 触发触觉反馈
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // 动画序列
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // 延迟显示图标动画
      setTimeout(() => {
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 150);
    } else {
      // 重置动画值
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      iconScaleAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    // 关闭动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* 液态玻璃背景 */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassBackground}
          >
            {/* 成功图标 */}
            <Animated.View 
              style={[
                styles.iconContainer,
                { transform: [{ scale: iconScaleAnim }] }
              ]}
            >
              <LinearGradient
                colors={[theme.colors.success, '#34D399']}
                style={styles.iconGradient}
              >
                <Ionicons 
                  name={icon} 
                  size={32} 
                  color="white" 
                />
              </LinearGradient>
            </Animated.View>

            {/* 标题 */}
            <Text style={styles.title}>{title}</Text>

            {/* 消息 */}
            <Text style={styles.message}>{message}</Text>

            {/* 确认按钮 */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, '#E55A2B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          {/* 玻璃边框效果 */}
          <View style={styles.glassBorder} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: screenWidth * 0.85,
    maxWidth: 340,
    borderRadius: theme.borderRadius.modal,
    overflow: 'hidden',
    // 阴影效果
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  glassBackground: {
    padding: theme.spacing[6],
    alignItems: 'center',
    // Web端添加CSS backdrop-filter效果
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', // Safari支持
    }),
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.borderRadius.modal,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none',
  },
  iconContainer: {
    marginBottom: theme.spacing[4],
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    // 内阴影效果
    shadowColor: theme.colors.success,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
    lineHeight: theme.typography.fontSize['2xl'] * 1.3,
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * 1.5,
    marginBottom: theme.spacing[6],
    paddingHorizontal: theme.spacing[2],
  },
  confirmButton: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    // 按钮阴影
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
    letterSpacing: 0.5,
  },
});

export default LiquidSuccessModal;