import { Platform } from 'react-native';

// 国际化字体配置
const fontFamily = Platform.select({
  ios: {
    // iOS系统字体对中英文都有很好的支持
    regular: 'SF Pro Text',
    medium: 'SF Pro Text',
    semibold: 'SF Pro Text',
    bold: 'SF Pro Text',
    // 中文优化字体
    chinese: 'PingFang SC',
  },
  android: {
    // Android Noto字体对中文有更好的支持
    regular: 'Noto Sans CJK SC',
    medium: 'Noto Sans CJK SC',
    semibold: 'Noto Sans CJK SC', 
    bold: 'Noto Sans CJK SC',
    // 英文字体
    english: 'Roboto',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
});

// 中英文字体大小映射（中文通常需要稍微大一点）
const fontSizeMultiplier = {
  chinese: 1.1,  // 中文字体大10%
  english: 1.0,  // 英文保持原始大小
};

// 字体大小计算函数（根据语言调整）
const calculateFontSize = (baseSize: number, language: 'chinese' | 'english' = 'chinese') => {
  return Math.round(baseSize * fontSizeMultiplier[language]);
};

export const typography = {
  // 字体家族
  fontFamily,
  fontSizeMultiplier,
  calculateFontSize,
  
  // 基础字体大小
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // 国际化字体大小（针对中文优化）
  fontSizeChinese: {
    xs: calculateFontSize(12),
    sm: calculateFontSize(14),
    base: calculateFontSize(16),
    lg: calculateFontSize(18),
    xl: calculateFontSize(20),
    '2xl': calculateFontSize(24),
    '3xl': calculateFontSize(30),
    '4xl': calculateFontSize(36),
    '5xl': calculateFontSize(48),
  },
  
  // 字重
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  
  // 行高（针对中英文优化）
  lineHeight: {
    tight: 1.2,     // 紧密行高，适合标题
    snug: 1.3,      // 稍紧行高
    normal: 1.5,    // 正常行高，适合正文
    relaxed: 1.65,  // 宽松行高，适合长文本
    loose: 1.8,     // 很宽松，适合阅读
  },
  
  // 字间距（中文通常不需要额外字间距）
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.2,
  },
  
  // 文本样式预设（国际化友好）
  styles: {
    // 标题样式
    h1: {
      fontSize: Platform.select({
        ios: calculateFontSize(32),
        android: calculateFontSize(30),
        default: calculateFontSize(32),
      }),
      fontWeight: '700' as const,
      lineHeight: 1.2,
      letterSpacing: Platform.select({
        ios: -0.4,
        android: 0,
        default: 0,
      }),
    },
    h2: {
      fontSize: calculateFontSize(28),
      fontWeight: '600' as const,
      lineHeight: 1.25,
    },
    h3: {
      fontSize: calculateFontSize(24),
      fontWeight: '600' as const,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: calculateFontSize(20),
      fontWeight: '600' as const,
      lineHeight: 1.35,
    },
    
    // 正文样式
    body: {
      fontSize: calculateFontSize(16),
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    bodyLarge: {
      fontSize: calculateFontSize(18),
      fontWeight: '400' as const,
      lineHeight: 1.55,
    },
    bodySmall: {
      fontSize: calculateFontSize(14),
      fontWeight: '400' as const,
      lineHeight: 1.4,
    },
    
    // 标签和说明文字
    caption: {
      fontSize: calculateFontSize(12),
      fontWeight: '400' as const,
      lineHeight: 1.35,
    },
    overline: {
      fontSize: calculateFontSize(10),
      fontWeight: '500' as const,
      lineHeight: 1.2,
      letterSpacing: 0.8,
    },
    
    // 按钮文字
    button: {
      fontSize: calculateFontSize(16),
      fontWeight: '600' as const,
      lineHeight: 1.2,
    },
    buttonSmall: {
      fontSize: calculateFontSize(14),
      fontWeight: '600' as const,
      lineHeight: 1.2,
    },
    buttonLarge: {
      fontSize: calculateFontSize(18),
      fontWeight: '600' as const,
      lineHeight: 1.2,
    },
  },
};

export type Typography = typeof typography;