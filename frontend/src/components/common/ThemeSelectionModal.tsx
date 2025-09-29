import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { ThemeMode, useTheme } from '../../context/ThemeContext';

interface ThemeOptionProps {
  mode: ThemeMode;
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  isLast?: boolean;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({
  mode,
  title,
  description,
  isSelected,
  onPress,
  isLast = false,
}) => {
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  const optionStyles = StyleSheet.create({
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: isLast ? 0 : Platform.select({
        ios: StyleSheet.hairlineWidth,
        android: 0.5,
      }),
      borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
    },
    optionLeft: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 17,
      fontWeight: '400',
      color: isDarkMode ? '#ffffff' : '#000000',
      marginBottom: 2,
    },
    optionDescription: {
      fontSize: 13,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
    },
    checkmark: {
      marginLeft: 12,
    },
  });

  return (
    <TouchableOpacity
      style={optionStyles.optionRow}
      onPress={handlePress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${description}`}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={optionStyles.optionLeft}>
        <Text style={optionStyles.optionTitle}>{title}</Text>
        <Text style={optionStyles.optionDescription}>{description}</Text>
      </View>
      {isSelected && (
        <Ionicons
          name="checkmark"
          size={20}
          color={theme.colors.primary}
          style={optionStyles.checkmark}
        />
      )}
    </TouchableOpacity>
  );
};

interface ThemeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeSelectionModal: React.FC<ThemeSelectionModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const { themeMode, changeThemeMode } = useTheme();

  const themeOptions: {
    mode: ThemeMode;
    title: string;
    description: string;
  }[] = [
    {
      mode: 'light',
      title: t('profile.general.light_mode'),
      description: t('profile.general.light_description'),
    },
  ];

  const handleThemeSelect = async (mode: ThemeMode) => {
    try {
      await changeThemeMode(mode);
      setTimeout(() => {
        onClose();
      }, 200);
    } catch (error) {
      console.error('Failed to change theme:', error);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
      borderRadius: 14,
      width: '85%',
      maxWidth: 340,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: Platform.select({
        ios: StyleSheet.hairlineWidth,
        android: 0.5,
      }),
      borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#000000',
      textAlign: 'center',
    },
    optionsContainer: {
      // Options will be rendered here
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: Platform.select({
        ios: StyleSheet.hairlineWidth,
        android: 0.5,
      }),
      borderTopColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
    },
    cancelButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 17,
      color: theme.colors.primary,
      fontWeight: '400',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('ui.appearanceSettings')}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {themeOptions.map((option, index) => (
              <ThemeOption
                key={option.mode}
                mode={option.mode}
                title={option.title}
                description={option.description}
                isSelected={option.mode === themeMode}
                onPress={() => handleThemeSelect(option.mode)}
                isLast={index === themeOptions.length - 1}
              />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.6}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ThemeSelectionModal;