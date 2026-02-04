import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';

interface VolunteerManagementCardProps {
  onPress: () => void;
}

export const VolunteerManagementCard: React.FC<VolunteerManagementCardProps> = ({
  onPress,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('profile.volunteer.management')}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(249, 168, 137, 0.2)' : 'rgba(249, 168, 137, 0.1)' }]}>
          <Ionicons
            name="people-outline"
            size={22}
            color="#F9A889"
          />
        </View>
        <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {t('profile.volunteer.management')}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={isDarkMode ? '#9CA3AF' : '#6B7280'}
          style={{ transform: [{ rotate: '-45deg' }] }}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});

export default VolunteerManagementCard;
