import { i18n } from '../utils/i18n';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  detectDeviceLanguage,
  getSavedLanguage,
  saveLanguage,
  isFirstLaunch,
} from '../utils/i18n';

/**
 * 语言服务 - 提供语言管理的核心功能
 */
class LanguageService {
  private static instance: LanguageService;
  private currentLanguage: SupportedLanguage = 'zh-CN';
  private isInitialized = false;

  static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  /**
   * 初始化语言服务
   */
  async initialize(): Promise<{
    language: SupportedLanguage;
    isFirstTime: boolean;
    deviceLanguage: SupportedLanguage;
  }> {
    if (this.isInitialized) {
      return {
        language: this.currentLanguage,
        isFirstTime: false,
        deviceLanguage: detectDeviceLanguage(),
      };
    }

    try {
      // 检查首次启动
      const firstLaunch = await isFirstLaunch();
      
      // 获取设备语言
      const deviceLanguage = detectDeviceLanguage();
      
      // 获取保存的语言偏好
      const savedLanguage = await getSavedLanguage();
      
      // 确定使用的语言
      let targetLanguage: SupportedLanguage;
      
      if (savedLanguage) {
        // 优先使用已保存的语言偏好
        targetLanguage = savedLanguage;
      } else if (firstLaunch) {
        // 首次启动，使用设备语言但不保存
        targetLanguage = deviceLanguage;
      } else {
        // 其他情况使用设备语言
        targetLanguage = deviceLanguage;
      }

      // 应用语言设置
      await this.applyLanguage(targetLanguage);
      
      this.isInitialized = true;

      return {
        language: targetLanguage,
        isFirstTime: firstLaunch,
        deviceLanguage,
      };
    } catch (error) {
      console.error('Error initializing language service:', error);
      
      // 出错时使用默认设置
      const fallbackLanguage: SupportedLanguage = 'zh-CN';
      await this.applyLanguage(fallbackLanguage);
      this.isInitialized = true;

      return {
        language: fallbackLanguage,
        isFirstTime: false,
        deviceLanguage: detectDeviceLanguage(),
      };
    }
  }

  /**
   * 更改语言
   */
  async changeLanguage(language: SupportedLanguage): Promise<void> {
    if (!this.isValidLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      await this.applyLanguage(language);
      await saveLanguage(language);
      
      console.log(`Language changed to: ${language}`);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  }

  /**
   * 应用语言设置
   */
  private async applyLanguage(language: SupportedLanguage): Promise<void> {
    // 更新i18next
    await i18n.changeLanguage(language);
    
    // 更新当前语言状态
    this.currentLanguage = language;
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages(): typeof SUPPORTED_LANGUAGES {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * 获取语言显示名称
   */
  getLanguageDisplayName(language: SupportedLanguage): string {
    const displayNames = {
      'zh-CN': '中文',
      'en-US': 'English',
    };
    return displayNames[language] || language;
  }

  /**
   * 获取语言的本地化显示名称（用当前语言显示）
   */
  getLocalizedLanguageName(language: SupportedLanguage): string {
    const isCurrentChinese = this.currentLanguage.startsWith('zh');
    
    if (isCurrentChinese) {
      return language === 'zh-CN' ? '中文' : '英语';
    } else {
      return language === 'zh-CN' ? 'Chinese' : 'English';
    }
  }

  /**
   * 检查是否为有效的语言代码
   */
  isValidLanguage(language: string): language is SupportedLanguage {
    if (!SUPPORTED_LANGUAGES || typeof SUPPORTED_LANGUAGES !== 'object') {
      return false;
    }
    return Object.keys(SUPPORTED_LANGUAGES).includes(language);
  }

  /**
   * 获取设备推荐的语言
   */
  getRecommendedLanguage(): SupportedLanguage {
    return detectDeviceLanguage();
  }

  /**
   * 检查是否需要显示语言选择引导
   */
  async shouldShowLanguageSelection(): Promise<boolean> {
    try {
      const firstLaunch = await isFirstLaunch();
      const savedLanguage = await getSavedLanguage();
      
      // 首次启动且没有保存的语言偏好时显示选择界面
      return firstLaunch && !savedLanguage;
    } catch (error) {
      console.error('Error checking language selection requirement:', error);
      return false;
    }
  }

  /**
   * 批量获取翻译文本
   */
  getTranslations(keys: string[]): Record<string, string> {
    const translations: Record<string, string> = {};
    keys.forEach(key => {
      translations[key] = i18n.t(key);
    });
    return translations;
  }

  /**
   * 获取当前语言的文本方向
   */
  getTextDirection(): 'ltr' | 'rtl' {
    // 当前支持的语言都是从左到右
    return 'ltr';
  }

  /**
   * 检查当前语言是否为中文
   */
  isCurrentLanguageChinese(): boolean {
    return this.currentLanguage.startsWith('zh');
  }

  /**
   * 获取当前语言的字体配置
   */
  getCurrentLanguageFontConfig() {
    return {
      fontFamily: this.isCurrentLanguageChinese() 
        ? 'System' // 系统会自动选择合适的中文字体
        : 'System', // 英文也使用系统字体
      fontWeight: 'normal' as const,
    };
  }

  /**
   * 重置语言设置（仅供开发和测试使用）
   */
  async resetLanguageSettings(): Promise<void> {
    if (__DEV__) {
      try {
        await saveLanguage('zh-CN');
        await this.applyLanguage('zh-CN');
        this.isInitialized = false;
        console.log('Language settings reset to default');
      } catch (error) {
        console.error('Error resetting language settings:', error);
        throw error;
      }
    } else {
      console.warn('resetLanguageSettings is only available in development mode');
    }
  }
}

export default LanguageService;

// 导出单例实例
export const languageService = LanguageService.getInstance();