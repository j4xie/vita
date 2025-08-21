import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../utils/i18n';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  changeThemeMode: (mode: ThemeMode) => Promise<void>;
  getThemeModeDisplayName: (mode: ThemeMode) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = '@pomelo_theme_mode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 初始化主题设置
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedThemeMode && ['light', 'dark', 'auto'].includes(savedThemeMode)) {
          setThemeMode(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };

    initializeTheme();
  }, []);

  // 计算实际的深色模式状态
  useEffect(() => {
    let actualDarkMode = false;
    
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

  // 获取主题模式显示名称
  const getThemeModeDisplayName = (mode: ThemeMode): string => {
    try {
      // Always try to use i18n first
      if (i18n.isInitialized && i18n.t) {
        const translationKey = `profile.general.${mode}_mode`;
        const translated = i18n.t(translationKey);
        // If translation exists and is not the same as key, use it
        if (translated && translated !== translationKey) {
          return translated;
        }
      }
      
      // Enhanced fallback that checks current language properly
      const currentLang = (i18n.language || i18n.resolvedLanguage || 'en-US').startsWith('zh') ? 'zh-CN' : 'en-US';
      
      const fallbacks = {
        'zh-CN': {
          'light': '浅色模式',
          'dark': '深色模式', 
          'auto': '跟随系统',
        },
        'en-US': {
          'light': 'Light Mode',
          'dark': 'Dark Mode',
          'auto': 'Follow System',
        }
      };
      
      return fallbacks[currentLang]?.[mode] || mode;
    } catch (error) {
      // Final fallback - assume English for international app
      const englishFallback = {
        'light': 'Light Mode',
        'dark': 'Dark Mode', 
        'auto': 'Follow System',
      };
      return englishFallback[mode] || mode;
    }
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