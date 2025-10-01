import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface ActionButtonGroupProps {
  registrationStatus: 'upcoming' | 'registered' | 'checked_in';
  isActivityEnded: boolean;
  loading: boolean;
  onRegister: () => void;
  onSignIn: () => void;
  onInvite?: () => void;
  onMore?: () => void;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  registrationStatus,
  isActivityEnded,
  loading,
  onRegister,
  onSignIn,
  onInvite,
  onMore,
}) => {
  const { t } = useTranslation();

  const getPrimaryButtonConfig = () => {
    if (loading) {
      return {
        text: t('common.loading'),
        icon: 'hourglass-outline' as const,
        disabled: true,
        backgroundColor: theme.colors.text.disabled,
      };
    }

    if (isActivityEnded) {
      return {
        text: t('activityDetail.activity_ended') || '活动已结束',
        icon: 'close-circle-outline' as const,
        disabled: true,
        backgroundColor: '#6B7280',
      };
    }

    switch (registrationStatus) {
      case 'upcoming':
        return {
          text: t('activityDetail.registerNow') || 'Register',
          icon: 'calendar-outline' as const,
          disabled: false,
          backgroundColor: '#FFFFFF',
          textColor: '#1A1A1A',
          onPress: onRegister,
        };
      case 'registered':
        return {
          text: t('activityDetail.checkin_now') || 'Check In',
          icon: 'qr-code-outline' as const,
          disabled: false,
          backgroundColor: '#FFFFFF',
          textColor: '#1A1A1A',
          onPress: onSignIn,
        };
      case 'checked_in':
        return {
          text: t('activityDetail.checked_in') || 'Checked In',
          icon: 'checkmark-circle' as const,
          disabled: true,
          backgroundColor: '#6B7280',
        };
      default:
        return {
          text: t('activityDetail.unavailable'),
          icon: 'close-outline' as const,
          disabled: true,
          backgroundColor: '#6B7280',
        };
    }
  };

  const primaryConfig = getPrimaryButtonConfig();

  return (
    <View style={styles.container}>
      {/* Primary Button - Register/Check In */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: primaryConfig.backgroundColor,
            opacity: primaryConfig.disabled ? 0.7 : 1,
          },
        ]}
        onPress={primaryConfig.onPress}
        disabled={primaryConfig.disabled}
        activeOpacity={0.8}
      >
        <Ionicons
          name={primaryConfig.icon}
          size={20}
          color={primaryConfig.textColor || theme.colors.text.inverse}
        />
        <Text
          style={[
            styles.primaryButtonText,
            { color: primaryConfig.textColor || theme.colors.text.inverse },
          ]}
        >
          {primaryConfig.text}
        </Text>
      </TouchableOpacity>

      {/* Glass Buttons - Invite & More */}
      <View style={styles.glassButtonsContainer}>
        {/* Invite Button */}
        {onInvite && (
          <BlurView intensity={30} tint="light" style={styles.glassButtonBlur}>
            <TouchableOpacity
              style={styles.glassButton}
              onPress={onInvite}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              <Text style={styles.glassButtonText}>
                {t('activityDetail.invite') || 'Invite'}
              </Text>
            </TouchableOpacity>
          </BlurView>
        )}

        {/* More Button */}
        {onMore && (
          <BlurView intensity={30} tint="light" style={styles.glassButtonBlur}>
            <TouchableOpacity
              style={styles.glassButton}
              onPress={onMore}
              activeOpacity={0.8}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
              <Text style={styles.glassButtonText}>
                {t('activityDetail.more') || 'More'}
              </Text>
            </TouchableOpacity>
          </BlurView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing[2],
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  glassButtonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  glassButtonBlur: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[3],
    gap: theme.spacing[1],
  },
  glassButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#FFFFFF',
  },
});
