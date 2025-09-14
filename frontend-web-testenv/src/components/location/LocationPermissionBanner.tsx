/* Web端特定版本 - 与App端隔离 */
/**
 * 定位权限提示条 - L1玻璃风格
 * 当用户未授权定位时显示，引导用户开启权限
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { theme } from '../../theme';

interface LocationPermissionBannerProps {
  onEnableLocation: () => void;
  onDismiss: () => void;
  visible: boolean;
}

export const LocationPermissionBanner: React.FC<LocationPermissionBannerProps> = ({
  onEnableLocation,
  onDismiss,
  visible,
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location-outline" size={20} color="#F9A889" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('location.enable_location_service', '开启定位服务')}</Text>
          <Text style={styles.subtitle}>{t('location.get_nearby_activities', '获取附近的精彩活动')}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            onPress={onEnableLocation}
            style={styles.enableButton}
            activeOpacity={0.7}
          >
            <Text style={styles.enableButtonText}>{t('common.enable', '开启')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onDismiss}
            style={styles.dismissButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    // L1玻璃效果
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    // 微妙阴影
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 168, 137, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enableButton: {
    backgroundColor: '#F9A889',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  enableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 4,
  },
});