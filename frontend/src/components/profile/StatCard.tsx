import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackgroundColor: string;
  showArrow?: boolean;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconColor,
  iconBackgroundColor,
  showArrow = false,
  onPress,
}) => {
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onPress?.();
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' },
      ]}
      onPress={onPress ? handlePress : undefined}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
    >
      {/* Top Icon Section */}
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      {/* Numerics - Value Section */}
      <View style={styles.valueSection}>
        <Text
          style={[styles.value, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
          numberOfLines={1}
        >
          {value || '0'}
        </Text>
      </View>

      {/* Bottom Row - Label Section */}
      <View style={styles.bottomRow}>
        <Text
          style={[styles.label, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
    alignItems: 'center',
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
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default StatCard;
