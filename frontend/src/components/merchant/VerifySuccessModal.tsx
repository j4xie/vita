import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface VerifySuccessModalProps {
  visible: boolean;
  couponName?: string;
  couponPrice?: number;
  onClose: () => void;
}

/**
 * VerifySuccessModal - 核销成功弹窗
 *
 * 功能：
 * - 显示核销成功动画
 * - 显示优惠券信息
 * - 震动反馈
 * - 3秒后自动关闭
 */
export const VerifySuccessModal: React.FC<VerifySuccessModalProps> = ({
  visible,
  couponName,
  couponPrice,
  onClose,
}) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 触发震动反馈
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 启动动画
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 3秒后自动关闭
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // 重置动画
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* 成功图标 */}
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>

            {/* 成功标题 */}
            <Text style={styles.successTitle}>
              {t('merchant.verify.success', '核销成功')}
            </Text>

            {/* 优惠券信息 */}
            {couponName && (
              <View style={styles.couponInfo}>
                <Text style={styles.couponName} numberOfLines={2}>
                  {couponName}
                </Text>
                {couponPrice !== undefined && (
                  <View style={styles.priceRow}>
                    <Text style={styles.currencySymbol}>¥</Text>
                    <Text style={styles.priceValue}>{couponPrice}</Text>
                  </View>
                )}
              </View>
            )}

            {/* 自动关闭提示 */}
            <Text style={styles.autoCloseHint}>
              {t('merchant.verify.auto_close', '3秒后自动关闭')}
            </Text>

            {/* 关闭按钮 */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>
                {t('common.close', '关闭')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: width - 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },

  iconContainer: {
    marginBottom: 16,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },

  couponInfo: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },

  couponName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginRight: 2,
  },

  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
  },

  autoCloseHint: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 20,
  },

  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    minWidth: 120,
  },

  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
