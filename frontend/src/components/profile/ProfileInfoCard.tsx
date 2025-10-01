import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';

interface ProfileInfoCardProps {
  userName: string;
  school?: string;
  position?: string;
  avatarUrl?: string;
  onEditPress: () => void;
  onQRCodePress: () => void;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  userName,
  school,
  position,
  avatarUrl,
  onEditPress,
  onQRCodePress,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;

  const handleEditPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onEditPress();
  };

  const handleQRCodePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onQRCodePress();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}>
      <View style={styles.contentRow}>
        {/* Left side: User info */}
        <View style={styles.infoSection}>
          <Text style={[styles.userName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {userName}
          </Text>
          {school && (
            <Text style={[styles.school, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              {school}
            </Text>
          )}
          {position && (
            <Text style={[styles.position, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              {position}
            </Text>
          )}
        </View>

        {/* Right side: Avatar */}
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#3C3C3E' : '#E5E7EB' }]}>
              <Ionicons name="person" size={40} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </View>
          )}
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { borderColor: isDarkMode ? '#48484A' : '#D1D5DB' }]}
          onPress={handleEditPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('profile.edit_profile')}
        >
          <Ionicons name="create-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          <Text style={[styles.buttonText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {t('profile.edit_profile')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { borderColor: isDarkMode ? '#48484A' : '#D1D5DB' }]}
          onPress={handleQRCodePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('profile.qr_code')}
        >
          <Ionicons name="qr-code-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          <Text style={[styles.buttonText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {t('profile.qr_code')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoSection: {
    flex: 1,
    paddingRight: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 28,
  },
  school: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 2,
    lineHeight: 19,
  },
  position: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
  },
  avatarContainer: {
    width: 80,
    height: 80,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProfileInfoCard;
