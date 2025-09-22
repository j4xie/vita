import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import {
  requestNotificationPermissions,
  hasRequestedNotificationPermission,
} from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme';

interface NotificationPermissionDialogProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

const NotificationPermissionDialog: React.FC<NotificationPermissionDialogProps> = ({
  visible,
  onClose,
  onPermissionGranted,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const handleAllow = async () => {
    const granted = await requestNotificationPermissions();

    // 记录用户选择
    await AsyncStorage.setItem('notificationPromptShown', 'true');

    if (granted) {
      onPermissionGranted?.();
    }

    onClose();
  };

  const handleLater = async () => {
    // 记录用户选择了稍后
    await AsyncStorage.setItem('notificationPromptShown', 'later');
    await AsyncStorage.setItem('notificationPromptLaterTime', Date.now().toString());
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleLater}
    >
      <View style={styles.backdrop}>
        <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />

        <Animated.View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          {/* 图标 */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor: '#FF950020' }]}>
              <Ionicons name="notifications" size={48} color="#FF9500" />
            </View>
          </View>

          {/* 标题 */}
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {t('notification.permission.title')}
          </Text>

          {/* 描述 */}
          <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
            {t('notification.permission.description')}
          </Text>

          {/* 好处列表 */}
          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={[styles.benefitText, { color: theme.colors.text.primary }]}>
                {t('notification.permission.benefit1')}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={[styles.benefitText, { color: theme.colors.text.primary }]}>
                {t('notification.permission.benefit2')}
              </Text>
            </View>
          </View>

          {/* 按钮 */}
          <TouchableOpacity
            style={[styles.allowButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAllow}
            activeOpacity={0.8}
          >
            <Text style={styles.allowButtonText}>
              {t('notification.permission.allow')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={handleLater}
            activeOpacity={0.8}
          >
            <Text style={[styles.laterButtonText, { color: theme.colors.text.secondary }]}>
              {t('notification.permission.later')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContainer: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  benefits: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  allowButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  allowButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
  },
});

export default NotificationPermissionDialog;