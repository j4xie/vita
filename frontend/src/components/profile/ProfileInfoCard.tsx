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
    <View style={styles.container}>
      {/* Main Info Row */}
      <View style={styles.headerRow}>
        {/* Left: Avatar */}
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#3C3C3E' : '#E5E7EB' }]}>
              {/* If it's a manager/admin, we could show a first character like in Figma, or stick to icon */}
              <Text style={[styles.avatarText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                {userName?.charAt(0) || '管'}
              </Text>
            </View>
          )}
        </View>

        {/* Middle: User Info & Badges */}
        <View style={styles.infoSection}>
          <Text style={[styles.userName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {userName}
          </Text>

          <View style={styles.badgeRow}>
            {school && (
              <View style={[styles.badge, { backgroundColor: isDarkMode ? '#3C3C3E' : '#F3F4F6' }]}>
                <Text style={[styles.badgeText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                  {school}
                </Text>
              </View>
            )}
            {position && (
              <View style={[styles.badge, { backgroundColor: isDarkMode ? '#3C3C3E' : '#F3F4F6' }]}>
                <Text style={[styles.badgeText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                  {position}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Action Icons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity onPress={handleQRCodePress} style={styles.iconButton}>
            <Ionicons name="scan-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#9CA3AF'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditPress} style={styles.iconButton}>
            <Ionicons name="create-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileInfoCard;
