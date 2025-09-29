import React, { createContext, useContext, ReactNode } from 'react';

export type ThemeMode = 'light';

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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always light mode - simplified implementation
  const themeMode: ThemeMode = 'light';
  const isDarkMode = false;

  // Simplified change function - only accepts light mode
  const changeThemeMode = async (mode: ThemeMode) => {
    // Only light mode is supported
    console.log('Light mode only - theme change ignored');
  };

  // Simplified display name function
  const getThemeModeDisplayName = (mode: ThemeMode, t?: (key: string) => string): string => {
    if (t) {
      return t('profile.general.light_mode') || 'Light Mode';
    }
    return '浅色模式';
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