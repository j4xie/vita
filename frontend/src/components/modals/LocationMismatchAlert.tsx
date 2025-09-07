/**
 * 位置不匹配提醒组件
 * 当检测到的位置与用户设置不匹配时显示提醒
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import UserRegionPreferences, { UserRegionCode } from '../../services/UserRegionPreferences';

interface LocationMismatchAlertProps {
  visible: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
  currentRegion: UserRegionCode;
  settingsRegion: UserRegionCode;
}

export const LocationMismatchAlert: React.FC<LocationMismatchAlertProps> = ({
  visible,
  onClose,
  onGoToSettings,
  currentRegion,
  settingsRegion,
}) => {
  const { t } = useTranslation();

  const handleIgnore = () => {
    // 更新提醒时间，避免短时间内重复提醒
    UserRegionPreferences.updateMismatchAlertTime();
    onClose();
  };

  const handleGoToSettings = () => {
    onGoToSettings();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.container}>
          <View style={styles.overlay}>
            <View style={styles.alertContainer}>
              
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
                  <Ionicons 
                    name="location" 
                    size={32} 
                    color={theme.colors.warning}
                  />
                </View>
                <Text style={styles.title}>
                  {t('location.mismatch.title', '位置变化提醒')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('location.mismatch.subtitle', '检测到您的位置发生了变化')}
                </Text>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.regionComparison}>
                  
                  {/* Current Location */}
                  <View style={styles.regionItem}>
                    <View style={styles.regionHeader}>
                      <Ionicons 
                        name="location-outline" 
                        size={20} 
                        color={theme.colors.text.secondary} 
                      />
                      <Text style={styles.regionLabel}>
                        {t('location.mismatch.current_location', '检测到的位置')}
                      </Text>
                    </View>
                    <View style={styles.regionValue}>
                      <Text style={styles.regionIcon}>
                        {UserRegionPreferences.getRegionIcon(currentRegion)}
                      </Text>
                      <Text style={styles.regionName}>
                        {UserRegionPreferences.getRegionDisplayName(currentRegion, 'zh')}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <View style={styles.arrow}>
                    <Ionicons 
                      name="arrow-down" 
                      size={20} 
                      color={theme.colors.text.tertiary} 
                    />
                  </View>

                  {/* Settings Region */}
                  <View style={styles.regionItem}>
                    <View style={styles.regionHeader}>
                      <Ionicons 
                        name="settings-outline" 
                        size={20} 
                        color={theme.colors.text.secondary} 
                      />
                      <Text style={styles.regionLabel}>
                        {t('location.mismatch.settings_region', '当前设置')}
                      </Text>
                    </View>
                    <View style={styles.regionValue}>
                      <Text style={styles.regionIcon}>
                        {UserRegionPreferences.getRegionIcon(settingsRegion)}
                      </Text>
                      <Text style={styles.regionName}>
                        {UserRegionPreferences.getRegionDisplayName(settingsRegion, 'zh')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Recommendation */}
                <View style={styles.recommendation}>
                  <Ionicons 
                    name="information-circle" 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                  <Text style={styles.recommendationText}>
                    {t('location.mismatch.recommendation', '建议更新地区设置以获得最佳体验和相应的隐私保护')}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.ignoreButton]}
                  onPress={handleIgnore}
                  activeOpacity={0.8}
                >
                  <Text style={styles.ignoreButtonText}>
                    {t('location.mismatch.ignore', '先忽略')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.settingsButton]}
                  onPress={handleGoToSettings}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="settings" 
                    size={16} 
                    color={theme.colors.text.inverse} 
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.settingsButtonText}>
                    {t('location.mismatch.go_to_settings', '去设置')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  alertContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: theme.borderRadius.xl,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  content: {
    padding: theme.spacing[6],
  },
  regionComparison: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  regionItem: {
    width: '100%',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  regionLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
  },
  regionValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionIcon: {
    fontSize: 24,
    marginRight: theme.spacing[2],
  },
  regionName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  arrow: {
    paddingVertical: theme.spacing[3],
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '08',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  recommendationText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    marginLeft: theme.spacing[2],
  },
  actions: {
    flexDirection: 'row',
    padding: theme.spacing[6],
    paddingTop: 0,
    gap: theme.spacing[3],
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ignoreButton: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  ignoreButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  settingsButton: {
    backgroundColor: theme.colors.primary,
  },
  settingsButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  buttonIcon: {
    marginRight: theme.spacing[2],
  },
});