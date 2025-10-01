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
  icon?: keyof typeof Ionicons.glyphMap;
  showArrow?: boolean;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
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
      {/* 数值 - 居中显示 */}
      {value !== '' && value != null && (
        <Text
          style={[styles.value, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}

      {/* 底部行：标签 + 箭头 */}
      <View style={styles.bottomRow}>
        <Text
          style={[styles.label, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {showArrow && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isDarkMode ? '#48484A' : '#C6C6C8'}
          />
        )}
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    minHeight: 95,
    justifyContent: 'center',
    alignItems: 'center',
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default StatCard;
