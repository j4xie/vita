/**
 * Dark Mode 测试组件 - 用于调试主题切换
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useMemoizedDarkMode } from '../../hooks/useDarkMode';

export const DarkModeTest: React.FC = () => {
  const themeContext = useTheme();
  const darkModeHook = useMemoizedDarkMode();
  
  console.log('🌙 Dark Mode Debug:', {
    themeMode: themeContext.themeMode,
    contextIsDarkMode: themeContext.isDarkMode,
    hookIsDarkMode: darkModeHook.isDarkMode,
    systemTheme: 'checking...'
  });

  const toggleTheme = async () => {
    const newMode = themeContext.themeMode === 'dark' ? 'light' : 'dark';
    await themeContext.changeThemeMode(newMode);
    console.log('🔄 主题已切换到:', newMode);
  };

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: darkModeHook.isDarkMode ? '#1C1C1E' : '#FFFFFF',
      }
    ]}>
      <Text style={[
        styles.title,
        { color: darkModeHook.isDarkMode ? '#FFFFFF' : '#000000' }
      ]}>
        Dark Mode 测试
      </Text>
      
      <Text style={[
        styles.info,
        { color: darkModeHook.isDarkMode ? '#EBEBF599' : '#666666' }
      ]}>
        当前模式: {themeContext.themeMode}
      </Text>
      
      <Text style={[
        styles.info,
        { color: darkModeHook.isDarkMode ? '#EBEBF599' : '#666666' }
      ]}>
        isDarkMode: {darkModeHook.isDarkMode ? '是' : '否'}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: darkModeHook.isDarkMode ? '#0A84FF' : '#007AFF',
          }
        ]}
        onPress={toggleTheme}
      >
        <Text style={styles.buttonText}>
          切换到 {themeContext.themeMode === 'dark' ? '浅色' : '深色'}模式
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 84, 88, 0.4)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default DarkModeTest;