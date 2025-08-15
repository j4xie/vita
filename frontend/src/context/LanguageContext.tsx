import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  detectDeviceLanguage,
  getSavedLanguage,
  saveLanguage,
  isFirstLaunch,
} from '../utils/i18n';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  availableLanguages: typeof SUPPORTED_LANGUAGES;
  isLoading: boolean;
  isFirstTime: boolean;
  deviceLanguage: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  markLanguageSelected: () => void;
  getLanguageDisplayName: (language: SupportedLanguage) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('zh-CN');
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [deviceLanguage] = useState<SupportedLanguage>(detectDeviceLanguage());

  // 初始化语言设置
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        setIsLoading(true);
        
        // 检查是否为首次启动
        const firstLaunch = await isFirstLaunch();
        setIsFirstTime(firstLaunch);
        
        // 获取已保存的语言偏好
        const savedLanguage = await getSavedLanguage();
        
        let targetLanguage: SupportedLanguage;
        
        if (firstLaunch && !savedLanguage) {
          // 首次启动，使用设备语言但不自动保存
          targetLanguage = deviceLanguage;
        } else if (savedLanguage) {
          // 使用已保存的语言偏好
          targetLanguage = savedLanguage;
        } else {
          // 回退到设备语言
          targetLanguage = deviceLanguage;
        }
        
        // 更新i18next和本地状态
        await i18n.changeLanguage(targetLanguage);
        setCurrentLanguage(targetLanguage);
        
      } catch (error) {
        console.error('Error initializing language:', error);
        // 出错时使用默认语言
        setCurrentLanguage('zh-CN');
        await i18n.changeLanguage('zh-CN');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, [i18n, deviceLanguage]);

  // 更改语言
  const changeLanguage = async (language: SupportedLanguage) => {
    try {
      setIsLoading(true);
      
      // 更新i18next
      await i18n.changeLanguage(language);
      
      // 保存到AsyncStorage
      await saveLanguage(language);
      
      // 更新本地状态
      setCurrentLanguage(language);
      
      console.log(`Language changed to: ${language}`);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 标记语言已选择（用于首次使用引导完成后）
  const markLanguageSelected = () => {
    setIsFirstTime(false);
  };

  // 获取语言显示名称
  const getLanguageDisplayName = (language: SupportedLanguage): string => {
    const displayNames = {
      'zh-CN': '中文',
      'en-US': 'English',
    };
    return displayNames[language] || language;
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
    isLoading,
    isFirstTime,
    deviceLanguage,
    changeLanguage,
    markLanguageSelected,
    getLanguageDisplayName,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook for using language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// HOC for components that need language context
export const withLanguage = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => (
    <LanguageProvider>
      <Component {...props} />
    </LanguageProvider>
  );
  
  WrappedComponent.displayName = `withLanguage(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default LanguageContext;