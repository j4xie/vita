import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme, Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  changeThemeMode: (mode: ThemeMode) => Promise<void>;
  getThemeModeDisplayName: (mode: ThemeMode, t?: (key: string) => string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = '@pomelo_theme_mode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 初始化主题设置
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedThemeMode && ['light', 'dark', 'auto'].includes(savedThemeMode)) {
          setThemeMode(savedThemeMode as ThemeMode);
        } else {
          // 如果没有保存的主题设置，默认设置为浅色模式
          setThemeMode('light');
          await AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
        // 出错时也设置为浅色模式
        setThemeMode('light');
      }
    };

    initializeTheme();
  }, []);

  // 计算实际的深色模式状态
  useEffect(() => {
    let actualDarkMode = false;
    
    // 🌐 Web端强制使用浅色模式，移动端保持原有功能  
    if (Platform.OS === 'web') {
      actualDarkMode = false; // Force light mode on web
    } else {
      switch (themeMode) {
        case 'dark':
          actualDarkMode = true;
          break;
        case 'light':
          actualDarkMode = false;
          break;
        case 'auto':
        default:
          actualDarkMode = systemColorScheme === 'dark';
          break;
      }
    }
    
    setIsDarkMode(actualDarkMode);
  }, [themeMode, systemColorScheme]);

  // 更改主题模式
  const changeThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      console.log(`Theme mode changed to: ${mode}`);
    } catch (error) {
      console.error('Error saving theme mode:', error);
      throw error;
    }
  };

  // 获取主题模式显示名称 - 使用i18n国际化
  const getThemeModeDisplayName = (mode: ThemeMode, t?: (key: string) => string): string => {
    const modeKeys = {
      'light': 'profile.general.light_mode',
      'dark': 'profile.general.dark_mode', 
      'auto': 'profile.general.auto_mode',
    };
    
    if (t) {
      return t(modeKeys[mode]) || mode;
    }
    
    // Fallback when t function is not available
    const fallbackNames = {
      'light': '浅色模式',
      'dark': '深色模式', 
      'auto': '跟随系统',
    };
    
    return fallbackNames[mode] || mode;
  };

  const contextValue: ThemeContextType = {
    themeMode,
    isDarkMode,
    changeThemeMode,
    getThemeModeDisplayName,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for using theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;