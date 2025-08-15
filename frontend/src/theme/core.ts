/**
 * 核心主题配置 - v2.0 Hermes 优化版本
 * 充分利用 Hermes 引擎的性能优势，采用高效的数据结构和内存布局
 */

// 西柚 颜色系统 - 核心常量
export const CORE_COLORS = {
  // 西柚 主色系 - 橙红品牌色
  primary: '#FF6B35',
  primaryPressed: '#E85A2F',
  primaryDisabled: '#FFB399',
  
  // 西柚 辅色系 - 珊瑚红
  secondary: '#FF4757',
  secondaryPressed: '#E83E4F',
  
  // 西柚 状态色
  success: '#2ED573',
  warning: '#FFA726',
  danger: '#EF4444',
  
  // 文本色
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
  },
  
  // 玻璃暗层
  glass: {
    darkOverlay: 'rgba(0, 0, 0, 0.10)',
    darkOverlayMedium: 'rgba(0, 0, 0, 0.12)',
    darkOverlayHeavy: 'rgba(0, 0, 0, 0.14)',
  },
  
  // 背景色系
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  
  // 边框色系
  border: {
    primary: 'rgba(255, 255, 255, 0.30)',
    secondary: 'rgba(209, 213, 219, 0.50)',
    divider: 'rgba(255, 255, 255, 0.12)',
  }
} as const;

// v1.1 间距系统 - 核心常量
export const CORE_SPACING = {
  // 基础间距 - 优化的数字键结构，Hermes 高效处理
  '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20,
  '6': 24, '7': 28, '8': 32, '9': 36, '10': 40,
  '12': 48, '14': 56, '16': 64, '20': 80, '24': 96,
  
  // 语义化间距
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
  '2xl': 48, '3xl': 64,
} as const;

// v1.1 圆角系统 - 核心常量
export const CORE_BORDER_RADIUS = {
  none: 0, xs: 4, sm: 8, base: 12, md: 16,
  lg: 20, xl: 24, '2xl': 32, full: 9999,
  
  // 语义化圆角 - 匹配tokens
  card: 16, button: 12, input: 8, modal: 24,
  avatar: 9999, badge: 6, tag: 20,
} as const;

// v1.1 字体系统 - 核心常量
export const CORE_TYPOGRAPHY = {
  fontSize: {
    xs: 10, sm: 12, base: 14, lg: 16, xl: 18,
    '2xl': 20, '3xl': 24, '4xl': 32,
    
    // v1.1 语义化字体
    title: 20, section: 16, body: 16, bodySmall: 15,
    caption: 14, captionSmall: 13,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4, // 匹配tokens
    relaxed: 1.6, // 匹配tokens
  },
} as const;

// v1.1 触摸目标 - 核心常量
export const CORE_TOUCH_TARGET = {
  minimum: 48, // WCAG 2.1 最小触摸目标
  fab: {
    size: 64, // FAB标准尺寸
    visibleWhenHidden: 8, // 隐藏时可见部分
  },
  button: {
    minHeight: 48,
    minWidth: 80,
    largeHeight: 56,
    xlHeight: 64,
  },
} as const;

// v1.2 Glass效果 - 增强阴影优化策略
export const CORE_LIQUID_GLASS = {
  // Background system
  background: {
    primary: 'rgba(255, 255, 255, 0.95)',
  },
  
  // Border system
  border: {
    width: 1,
    color: 'rgba(255, 255, 255, 0.30)',
  },
  
  // v1.2 Shadow优化策略
  shadowStrategy: {
    // Solid backgrounds for shadow-optimized rendering
    solidBg: {
      card: '#FFFFFF',        // 卡片solid背景
      modal: '#FFFFFF',       // 弹层solid背景  
      floating: '#FFFFFF',    // 浮动元素solid背景
      button: '#FFFFFF',      // 按钮solid背景
    },
    // LinearGradient compatible backgrounds (no shadows)
    gradientBg: {
      card: 'rgba(255, 255, 255, 0.85)',
      modal: 'rgba(255, 255, 255, 0.90)', 
      floating: 'rgba(255, 255, 255, 0.75)',
      primaryGlass: 'rgba(255, 107, 53, 0.15)', // 西柚 橙色玻璃
    },
  },
  
  // 卡片 - v1.2 Shadow优化版本
  card: {
    background: 'rgba(255, 255, 255, 0.85)', // 常规透明背景
    backgroundShadowOptimized: 'rgba(255, 255, 255, 0.95)', // 阴影优化版本（高不透明度）
    backgroundSolid: '#FFFFFF', // Solid版本（用于shadow容器）
    border: 'rgba(255, 255, 255, 0.30)',
    shimmer: 'rgba(255, 255, 255, 0.4)', // 保留shimmer效果
  },
  
  // 弹层 - v1.2 Shadow优化版本
  modal: {
    background: 'rgba(255, 255, 255, 0.90)', // 常规透明背景
    backgroundShadowOptimized: 'rgba(255, 255, 255, 0.98)', // 阴影优化版本
    backgroundSolid: '#FFFFFF', // Solid版本（用于shadow容器）
    border: 'rgba(255, 255, 255, 0.30)',
  },
  
  // 浮动元素 - v1.2 Shadow优化版本
  floating: {
    background: 'rgba(255, 255, 255, 0.75)',
    backgroundShadowOptimized: 'rgba(255, 255, 255, 0.92)', // 阴影优化版本
    backgroundSolid: '#FFFFFF', // Solid版本（用于shadow容器）
    border: 'rgba(255, 255, 255, 0.30)',
  },
  
  // 西柚 主色玻璃 - 橙红品牌风格
  primaryGlass: {
    background: 'rgba(255, 107, 53, 0.15)', // 西柚 橙色玻璃
    backgroundShadowOptimized: 'rgba(255, 107, 53, 0.25)', // 阴影优化版本
    backgroundSolid: '#FFF2EE', // 淡橙色solid版本（用于shadow容器）
    border: 'rgba(255, 107, 53, 0.30)', // 西柚 橙色边框
  },
} as const;

// v1.1 简化阴影系统 - 核心常量
export const CORE_SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
  // 按钮专用阴影 - 优化性能
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

// v1.1 简化动效系统 - 移除复杂配置
export const CORE_ANIMATIONS = {
  // v1.1 简化的持续时间配置
  durations: {
    micro: 100,   // 微动画
    quick: 150,   // 快速
    normal: 300,  // 正常
    slow: 500,    // 缓慢
  },
  
  // Hermes 优化的高性能配置
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // v1.1 简化的弹簧配置
  springs: {
    appear: { stiffness: 280, damping: 22, mass: 1 },
  },
} as const;

// v1.1 手势系统 - 核心常量
export const CORE_GESTURES = {
  tap: {
    maxDuration: 300, // 点击最大时长
    maxDistance: 10,  // 点击最大移动距离
  },
  
  swipe: {
    minVelocity: 1200,    // 最小滑动速度
    minDistance: 50,      // 最小滑动距离
    revealThreshold: 88,  // 操作显示阈值
  },
  
  longPress: {
    duration: 500, // 长按触发时长
  },
  
  pan: {
    threshold: 10, // 拖拽开始阈值
  },
} as const;

// v1.1 布局系统 - 核心常量
export const CORE_LAYOUT = {
  margins: {
    compact: 12,  // 紧凑边距 (iPhone SE)
    default: 16,  // 标准边距
  },
  
  // 偏移量配置
  offset: {
    fabToast: 100,    // FAB到Toast的偏移
    fabCTA: 160,      // FAB到CTA按钮的偏移
  },
  
  // BottomSheet规范
  bottomSheet: {
    collapsed: 0.66,   // 66%屏幕高度
    expanded: 0.92,    // 92%屏幕高度
    cornerRadius: 24,  // 24pt圆角
    handle: {
      width: 36,
      height: 4,
    }
  },
  
  // Dynamic Type支持
  dynamicType: {
    button: {
      minWidth: 80,
      minHeight: 48,
      largeHeight: 56,  // 大号字体时
      xlHeight: 64,     // 特大号字体时
    },
  },
} as const;

// v1.1 简化平台优化 - 移除复杂策略
export const CORE_PLATFORM_OPTIMIZATIONS = {
  ios: {
    useNativeShadows: true,
  },
  android: {
    useElevation: true,
  }
} as const;

// 西柚 品牌渐变系统
export const BRAND_GRADIENT = ['#FF6B35', '#FF4D5E'] as const;

// 西柚 品牌玻璃系统
export const BRAND_GLASS = {
  // 玻璃染色层 - 用于选中态/高亮的玻璃背景
  tint: {
    primary: 'rgba(255, 107, 53, 0.14)',     // 主品牌色玻璃染色
    secondary: 'rgba(255, 77, 94, 0.12)',    // 次品牌色玻璃染色
    light: 'rgba(255, 107, 53, 0.08)',       // 轻微品牌色染色
  },
  
  // 玻璃描边系统
  border: {
    primary: 'rgba(255, 107, 53, 0.22)',     // 主品牌色描边
    secondary: 'rgba(255, 77, 94, 0.18)',    // 次品牌色描边
    light: 'rgba(255, 107, 53, 0.12)',       // 轻微品牌色描边
  },
  
  // 玻璃背景 - 用于卡片和面板
  background: {
    primary: 'rgba(255, 255, 255, 0.95)',   // 主玻璃背景
    brand: 'rgba(255, 107, 53, 0.06)',       // 品牌色玻璃背景
    overlay: 'rgba(255, 255, 255, 0.85)',    // 覆盖层玻璃
  },
  
  // 可读性增强 - 深色背景上的品牌色overlay
  readability: {
    darkOverlay: 'rgba(0, 0, 0, 0.05)',      // 轻微暗层
    mediumOverlay: 'rgba(0, 0, 0, 0.08)',    // 中等暗层
    strongOverlay: 'rgba(0, 0, 0, 0.12)',    // 强暗层
  },
} as const;

// 西柚 品牌交互系统
export const BRAND_INTERACTIONS = {
  // 按钮状态
  button: {
    primary: {
      default: BRAND_GRADIENT,
      pressed: ['#E85A2F', '#E8434C'] as const,
      disabled: ['#FFB399', '#FFA3A8'] as const,
    },
    secondary: {
      default: BRAND_GLASS.tint.primary,
      pressed: BRAND_GLASS.tint.secondary,
      border: BRAND_GLASS.border.primary,
    },
  },
  
  // Tab和导航状态
  navigation: {
    active: {
      background: BRAND_GLASS.tint.primary,
      border: BRAND_GLASS.border.primary,
      text: '#FF6B35',
    },
    inactive: {
      background: 'transparent',
      border: 'transparent',
      text: '#9CA3AF',
    },
  },
  
  // 状态徽章和Pills
  badge: {
    primary: BRAND_GRADIENT,
    text: '#FFFFFF',
    overlay: BRAND_GLASS.readability.lightOverlay,
  },
} as const;

// 导出类型定义
export type CoreColors = typeof CORE_COLORS;
export type CoreSpacing = typeof CORE_SPACING;
export type CoreBorderRadius = typeof CORE_BORDER_RADIUS;
export type CoreTypography = typeof CORE_TYPOGRAPHY;
export type CoreTouchTarget = typeof CORE_TOUCH_TARGET;
export type CoreLiquidGlass = typeof CORE_LIQUID_GLASS;
export type CoreShadows = typeof CORE_SHADOWS;
export type CoreAnimations = typeof CORE_ANIMATIONS;
export type CoreGestures = typeof CORE_GESTURES;
export type CoreLayout = typeof CORE_LAYOUT;
export type BrandGradient = typeof BRAND_GRADIENT;
export type BrandGlass = typeof BRAND_GLASS;
export type BrandInteractions = typeof BRAND_INTERACTIONS;