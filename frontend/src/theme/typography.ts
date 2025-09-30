import { Platform, Dimensions } from 'react-native';

// iPad检测和字体适配（使用更可靠的检测方法）
const { width, height } = Dimensions.get('window');
const screenData = Dimensions.get('screen');
const isIPad = Platform.OS === 'ios' && (
  width >= 768 || 
  height >= 768 || 
  screenData.width >= 768 ||
  screenData.height >= 768 ||
  Platform.isPad === true
);

// 调试信息：打印设备检测结果
console.log('🎯 [TYPOGRAPHY] Device Detection:', {
  width,
  height,
  screenWidth: screenData.width,
  screenHeight: screenData.height,
  isPad: isIPad,
  isIPad,
  deviceFontScale: isIPad ? 1.5 : 1.0
});

// iPad字体和按钮缩放系数（大屏幕需要更大字体和按钮确保Apple审核通过）
const deviceFontScale = isIPad ? 1.5 : 1.0;
const deviceButtonScale = isIPad ? 1.5 : 1.0;

// 设备适配字体计算函数
const adaptiveFontSize = (baseSize: number) => {
  return Math.round(baseSize * deviceFontScale);
};

// 设备适配按钮尺寸计算函数
const adaptiveButtonSize = (baseSize: number) => {
  return Math.round(baseSize * deviceButtonScale);
};

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

// 🎯 无障碍性优化 - 标准化字体尺寸系统
export const typeScale = {
  // 标题层级
  titleLg: { 
    fontSize: 24, 
    lineHeight: 30, 
    fontWeight: '700' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Noto Sans CJK SC'
  },
  titleMd: { 
    fontSize: 20, 
    lineHeight: 26, 
    fontWeight: '600' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Noto Sans CJK SC'
  },
  titleSm: { 
    fontSize: 18, 
    lineHeight: 24, 
    fontWeight: '600' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Noto Sans CJK SC'
  },
  
  // 正文系统 - 基线17pt
  body: { 
    fontSize: 17, 
    lineHeight: 24, 
    fontWeight: '400' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Noto Sans CJK SC'
  },
  bodyLarge: { 
    fontSize: 19, 
    lineHeight: 26, 
    fontWeight: '400' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Noto Sans CJK SC'
  },
  
  // 按钮文本 - 最小17pt
  button: { 
    fontSize: 17, 
    lineHeight: 22, 
    fontWeight: '600' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Noto Sans CJK SC'
  },
  buttonLarge: { 
    fontSize: 19, 
    lineHeight: 24, 
    fontWeight: '600' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Noto Sans CJK SC'
  },
  
  // 辅助信息 - 最小14pt
  small: { 
    fontSize: 14, 
    lineHeight: 20, 
    fontWeight: '400' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Noto Sans CJK SC'
  },
  
  // 徽标/标签 - 最小12pt，不可交互
  badge: { 
    fontSize: 12, 
    lineHeight: 16, 
    fontWeight: '600' as const,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Noto Sans CJK SC'
  },
};

export const typography = {
  // 字体家族
  fontFamily,
  fontSizeMultiplier,
  calculateFontSize,
  
  // iPad适配
  isIPad,
  deviceFontScale,
  deviceButtonScale,
  adaptiveFontSize,
  adaptiveButtonSize,
  
  // 基础字体大小（iPad自动放大1.5倍）
  fontSize: {
    xs: adaptiveFontSize(14), // iPad: 21pt, iPhone: 14pt
    sm: adaptiveFontSize(16), // iPad: 24pt, iPhone: 16pt
    base: adaptiveFontSize(17), // iPad: 26pt, iPhone: 17pt
    lg: adaptiveFontSize(18), // iPad: 27pt, iPhone: 18pt
    xl: adaptiveFontSize(20), // iPad: 30pt, iPhone: 20pt
    '2xl': adaptiveFontSize(24), // iPad: 36pt, iPhone: 24pt
    '3xl': adaptiveFontSize(30),
    '4xl': adaptiveFontSize(36),
    '5xl': adaptiveFontSize(48),
  },
  
  // 国际化字体大小（针对中文优化 + iPad适配）
  fontSizeChinese: {
    xs: adaptiveFontSize(calculateFontSize(14)), // iPad自动放大
    sm: adaptiveFontSize(calculateFontSize(16)), // iPad自动放大
    base: adaptiveFontSize(calculateFontSize(17)), // iPad自动放大
    lg: adaptiveFontSize(calculateFontSize(18)),
    xl: adaptiveFontSize(calculateFontSize(20)),
    '2xl': adaptiveFontSize(calculateFontSize(24)),
    '3xl': adaptiveFontSize(calculateFontSize(30)),
    '4xl': adaptiveFontSize(calculateFontSize(36)),
    '5xl': adaptiveFontSize(calculateFontSize(48)),
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
    
    // 正文样式 - 新基线17pt
    body: {
      fontSize: calculateFontSize(17),
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