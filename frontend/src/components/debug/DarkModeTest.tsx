/**
 * Light Mode Test Component - Light mode only
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useMemoizedDarkMode } from '../../hooks/useDarkMode';

export const DarkModeTest: React.FC = () => {
  const themeContext = useTheme();
  const lightModeHook = useMemoizedDarkMode();

  console.log('☀️ Light Mode Debug:', {
    themeMode: themeContext.themeMode,
    contextIsDarkMode: themeContext.isDarkMode,
    hookIsDarkMode: lightModeHook.isDarkMode,
    status: 'Light mode only'
  });

  return (
    <View style={[
      styles.container,
      { backgroundColor: '#FFFFFF' }
    ]}>
      <Text style={[
        styles.title,
        { color: '#000000' }
      ]}>
        Light Mode Test
      </Text>

      <View style={styles.infoSection}>
        <Text style={[styles.infoText, { color: '#666666' }]}>
          Current Theme: {themeContext.themeMode}
        </Text>
        <Text style={[styles.infoText, { color: '#666666' }]}>
          Is Dark Mode: {themeContext.isDarkMode ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.infoText, { color: '#666666' }]}>
          Hook Dark Mode: {lightModeHook.isDarkMode ? 'Yes' : 'No'}
        </Text>
      </View>

      <View style={[
        styles.colorBox,
        { backgroundColor: lightModeHook.primaryBackground }
      ]}>
        <Text style={[
          styles.boxText,
          { color: lightModeHook.primaryText }
        ]}>
          Light Mode Background
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  colorBox: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  boxText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DarkModeTest;