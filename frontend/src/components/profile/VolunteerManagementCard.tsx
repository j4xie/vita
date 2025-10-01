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
        <View style={styles.iconContainer}>
          <Ionicons
            name="people-outline"
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </View>
        <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {t('profile.volunteer.management')}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDarkMode ? '#48484A' : '#C6C6C8'}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    marginTop: -8,
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
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
});

export default VolunteerManagementCard;
