import { Platform, I18nManager } from 'react-native';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Polyfill for Intl.PluralRules in Hermes
if (!global.Intl?.PluralRules) {
  require('intl-pluralrules');
}

// 静态导入语言资源
import zhCNTranslation from '../locales/zh-CN/translation.json';
import enUSTranslation from '../locales/en-US/translation.json';

// 语言存储键
const LANGUAGE_STORAGE_KEY = 'user_language_preference';
const FIRST_LAUNCH_KEY = 'is_first_launch';

// 支持的语言
export const SUPPORTED_LANGUAGES = {
  'zh-CN': 'Chinese',
  'en-US': 'English',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// 检测设备语言
export const detectDeviceLanguage = (): SupportedLanguage => {
  const locales = RNLocalize.getLocales();
  
  for (const locale of locales) {
    const languageTag = locale.languageTag;
    
    // 检查是否是支持的语言
    if (languageTag.startsWith('zh')) {
      return 'zh-CN';
    }
    if (languageTag.startsWith('en')) {
      return 'en-US';
    }
  }
  
  // 默认返回中文
  return 'zh-CN';
};

// 获取用户保存的语言偏好
export const getSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES && typeof SUPPORTED_LANGUAGES === 'object') {
      const supportedKeys = Object.keys(SUPPORTED_LANGUAGES) || [];
      if (Array.isArray(supportedKeys) && supportedKeys.includes(savedLanguage)) {
        return savedLanguage as SupportedLanguage;
      }
    }
  } catch (error) {
    console.warn('Error reading saved language:', error);
  }
  return null;
};

// 保存语言偏好
export const saveLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('Error saving language:', error);
  }
};

// 检查是否为首次启动
export const isFirstLaunch = async (): Promise<boolean> => {
  try {
    const firstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    if (firstLaunch === null) {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Error checking first launch:', error);
    return false;
  }
};

// 智能fallback翻译生成
const generateSmartFallback = (key: string, language: string = 'zh-CN'): string => {
  // 如果键名本身就是中文，直接返回
  if (/[\u4e00-\u9fff]/.test(key)) {
    return key;
  }
  
  // 基于键名语义生成友好的中文翻译
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  const semanticMap: Record<string, string> = {
    // 常用操作
    'login': '登录',
    'register': '注册', 
    'logout': '退出登录',
    'save': '保存',
    'cancel': '取消',
    'confirm': '确认',
    'submit': '提交',
    'delete': '删除',
    'edit': '编辑',
    'add': '添加',
    'remove': '移除',
    'search': '搜索',
    'filter': '筛选',
    'refresh': '刷新',
    'loading': '加载中...',
    'success': '成功',
    'error': '错误',
    'failed': '失败',
    'warning': '警告',
    
    // 表单相关
    'title': '标题',
    'name': '姓名',
    'email': '邮箱',
    'phone': '手机号',
    'password': '密码',
    'address': '地址',
    'description': '描述',
    'message': '消息',
    'content': '内容',
    'label': '标签',
    'placeholder': '请输入',
    'required': '必填',
    'optional': '选填',
    
    // 页面和组件
    'home': '首页',
    'profile': '个人中心',
    'settings': '设置',
    'activities': '活动',
    'community': '社区',
    'explore': '探索',
    'wellbeing': '安心服务',
    'volunteer': '志愿者',
    'consulting': '咨询服务',
    'cards': '会员卡',
    
    // 状态
    'active': '活跃',
    'inactive': '非活跃',
    'pending': '待处理',
    'completed': '已完成',
    'available': '可用',
    'unavailable': '不可用',
  };
  
  // 检查完整键名
  if (semanticMap[key]) {
    return semanticMap[key];
  }
  
  // 检查最后一部分
  if (semanticMap[lastPart]) {
    return semanticMap[lastPart];
  }
  
  // 检查包含模式
  for (const [pattern, translation] of Object.entries(semanticMap)) {
    if (lastPart.includes(pattern)) {
      return translation;
    }
  }
  
  // 生成基于键结构的友好名称
  const category = parts[0] || '';
  const categoryMap: Record<string, string> = {
    'auth': '认证',
    'profile': '个人',
    'activities': '活动', 
    'wellbeing': '安心',
    'community': '社区',
    'explore': '探索',
    'volunteer': '志愿',
    'consulting': '咨询',
    'validation': '验证',
    'common': '通用',
    'navigation': '导航',
  };
  
  const categoryName = categoryMap[category] || category;
  const elementName = lastPart.replace(/_/g, '').replace(/([A-Z])/g, ' $1').trim() || '内容';
  
  return `${categoryName}${elementName}`;
};

// 语言资源映射
const resources = {
  'zh-CN': {
    translation: zhCNTranslation,
  },
  'en-US': {
    translation: enUSTranslation,
  },
};

// 初始化i18next
const initI18next = async () => {
  // 🚨 防止重复初始化
  if (i18n.isInitialized) {
    console.log('[I18N] i18next已初始化，跳过重复初始化');
    return i18n;
  }
  
  // 尝试获取已保存的语言偏好
  const savedLanguage = await getSavedLanguage();
  const deviceLanguage = detectDeviceLanguage();
  // 使用保存的语言或设备语言
  const initialLanguage = savedLanguage || deviceLanguage;

  return i18n
    .use(initReactI18next)
    .init({
      lng: initialLanguage,
      fallbackLng: 'zh-CN',
      debug: __DEV__,
      
      // 使用兼容性格式，适配 Hermes 环境
      compatibilityJSON: 'v3',
      
      // 静态资源配置
      resources,
      
      // 命名空间配置
      ns: ['translation'],
      defaultNS: 'translation',
      
      // 插值配置
      interpolation: {
        escapeValue: false, // React已经处理了XSS
      },
      
      // React配置
      react: {
        useSuspense: false,
      },
      
      // 智能fallback配置 - 关键防护
      missingKeyHandler: (lng: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any) => {
        const smartFallback = generateSmartFallback(key, lng[0]);
        console.warn(`🔄 翻译键缺失，使用智能fallback: ${key} → ${smartFallback}`);
      },
    });
};

// 安全的翻译函数包装器
export const safeT = (key: string, options?: any): string => {
  try {
    const result = i18n.t(key, options);
    
    // 检查是否返回了键名（翻译失败的标志）
    if (typeof result === 'string' && (result === key || result.startsWith('translation:'))) {
      const fallback = generateSmartFallback(key);
      console.warn(`🛡️  翻译失败保护: ${key} → ${fallback}`);
      return fallback;
    }
    
    return typeof result === 'string' ? result : generateSmartFallback(key);
  } catch (error) {
    console.error(`❌ 翻译调用错误: ${key}`, error);
    return generateSmartFallback(key);
  }
};

// 导出i18n实例
export { i18n };
export default initI18next;

// 判断是否为中文
export const isChinese = (locale?: string) => {
  const currentLang = locale || i18n.language;
  return currentLang.startsWith('zh');
};

// 判断是否为RTL语言
export const isRTL = () => {
  return I18nManager.isRTL;
};

// 文本长度估算（中英文字符宽度不同）
export const estimateTextWidth = (text: string, fontSize: number = 16) => {
  if (!text) return 0;
  
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // 中文字符通常比英文字符宽
    if (/[\u4e00-\u9fff]/.test(char)) {
      width += fontSize * 1.0; // 中文字符宽度约等于字体大小
    } else {
      width += fontSize * 0.6; // 英文字符宽度约为字体大小的0.6倍
    }
  }
  return width;
};

// 获取针对当前语言优化的文本宽度估算
export const getLocalizedTextWidth = (text: string, fontSize: number = 16) => {
  const currentLang = i18n.language;
  const multiplier = isChinese(currentLang) ? 1.1 : 1.2; // 英文通常需要更多空间
  return estimateTextWidth(text, fontSize) * multiplier;
};

// 自适应布局参数计算
export const getFlexibleLayoutParams = (text: string, maxWidth: number, fontSize: number = 16) => {
  const estimatedWidth = estimateTextWidth(text, fontSize);
  
  return {
    estimatedWidth,
    needsFlexibleLayout: estimatedWidth > maxWidth,
    recommendedLines: Math.ceil(estimatedWidth / maxWidth),
    recommendedFontSize: estimatedWidth > maxWidth ? fontSize * 0.9 : fontSize,
  };
};

// 响应式间距（根据内容长度调整）
export const getResponsiveSpacing = (
  baseSpacing: number, 
  contentLength: number,
  multiplier: number = 1.2
) => {
  // 内容越长，间距适当增加以提高可读性
  if (contentLength > 50) return baseSpacing * multiplier;
  if (contentLength > 20) return baseSpacing * (1 + (multiplier - 1) * 0.5);
  return baseSpacing;
};

// 国际化样式辅助函数
export const i18nStyles = {
  // 文本对齐方式（支持RTL）
  textAlign: (align: 'left' | 'center' | 'right' = 'left') => {
    if (align === 'center') return 'center';
    if (isRTL()) {
      return align === 'left' ? 'right' : 'left';
    }
    return align;
  },
  
  // 边距方向（支持RTL）
  marginDirection: (direction: 'Left' | 'Right', value: number) => {
    const actualDirection = isRTL() ? 
      (direction === 'Left' ? 'Right' : 'Left') : direction;
    return { [`margin${actualDirection}`]: value };
  },
  
  // 内边距方向（支持RTL）
  paddingDirection: (direction: 'Left' | 'Right', value: number) => {
    const actualDirection = isRTL() ? 
      (direction === 'Left' ? 'Right' : 'Left') : direction;
    return { [`padding${actualDirection}`]: value };
  },
  
  // Flex方向（支持RTL）
  flexDirection: (direction: 'row' | 'row-reverse' | 'column' | 'column-reverse' = 'row') => {
    if (direction.includes('column')) return direction;
    if (isRTL()) {
      return direction === 'row' ? 'row-reverse' : 'row';
    }
    return direction;
  },
  
  // 文本输入方向
  writingDirection: () => isRTL() ? 'rtl' : 'ltr',
};

// 多语言文本处理
export const textUtils = {
  // 截断文本（考虑中英文差异）
  truncate: (text: string, maxLength: number, suffix: string = '...') => {
    if (text.length <= maxLength) return text;
    
    // 中文字符计算为1.5个长度单位
    let length = 0;
    let truncateIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charLength = /[\u4e00-\u9fff]/.test(char) ? 1.5 : 1;
      
      if (length + charLength > maxLength) {
        truncateIndex = i;
        break;
      }
      
      length += charLength;
      truncateIndex = i + 1;
    }
    
    return text.substring(0, truncateIndex) + suffix;
  },
  
  // 智能换行（避免在不合适的位置换行）
  smartLineBreak: (text: string, maxWidth: number, fontSize: number = 16) => {
    const words = text.split(/(\s+)/);
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + word;
      const lineWidth = estimateTextWidth(testLine, fontSize);
      
      if (lineWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine.trim());
          currentLine = word;
        } else {
          // 单词太长，强制换行
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  },
};

// 设备和平台适配
export const platformUtils = {
  // 获取平台特定的字体
  getPlatformFont: (weight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular') => {
    return Platform.select({
      ios: {
        fontFamily: isChinese() ? 'PingFang SC' : 'SF Pro Text',
        fontWeight: {
          regular: '400',
          medium: '500', 
          semibold: '600',
          bold: '700',
        }[weight],
      },
      android: {
        fontFamily: isChinese() ? 'Noto Sans CJK SC' : 'Roboto',
        fontWeight: {
          regular: 'normal',
          medium: '500',
          semibold: '600', 
          bold: 'bold',
        }[weight],
      },
    });
  },
  
  // 获取安全的触摸目标大小
  getTouchTargetSize: (minSize: number = 44) => ({
    minWidth: minSize,
    minHeight: minSize,
  }),
  
  // 获取适配的边距
  getAdaptiveMargin: (base: number) => {
    // iOS通常需要更多边距
    return Platform.select({
      ios: base,
      android: base * 0.9,
      default: base,
    });
  },
};