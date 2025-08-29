/**
 * 核心主题配置 - v2.0 Hermes 优化版本
 * 充分利用 Hermes 引擎的性能优势，采用高效的数据结构和内存布局
 */

// 奶橘色系统 - 参考图同款柔和色调
export const CORE_COLORS = {
  // 主色系 - 适中橙色 (用户指定)
  primary: '#F9A889', // 适中饱和度的橙色
  primaryPressed: '#E68956', // 按压时稍深
  primaryDisabled: '#FCDBC8', // 禁用时变淡
  
  // 辅色系 - 温润奶茶色
  secondary: '#FFF8E1', // 极淡的奶色
  secondaryPressed: '#FFECB3', // 按压时的浅橘
  
  // PomeloX 状态色
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
      primaryGlass: 'rgba(255, 107, 53, 0.15)', // PomeloX 橙色玻璃
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
  
  // PomeloX 主色玻璃 - 橙红品牌风格
  primaryGlass: {
    background: 'rgba(255, 107, 53, 0.15)', // PomeloX 橙色玻璃
    backgroundShadowOptimized: 'rgba(255, 107, 53, 0.25)', // 阴影优化版本
    backgroundSolid: '#FFF2EE', // 淡橙色solid版本（用于shadow容器）
    border: 'rgba(255, 107, 53, 0.30)', // PomeloX 橙色边框
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
    shadowOffset: { width: 0, height: 1 }, // Reduced from 2 to 1
    shadowOpacity: 0.06, // Reduced from 0.08 to 0.06
    shadowRadius: 3, // Reduced from 6 to 3
    elevation: 1, // Reduced from 2 to 1
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 }, // Reduced from 4 to 2
    shadowOpacity: 0.08, // Reduced from 0.10 to 0.08
    shadowRadius: 6, // Reduced from 12 to 6
    elevation: 2, // Reduced from 4 to 2
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

// V2.0 极柔和朝霞渐变体系 - 微弱温暖色调
export const DAWN_GRADIENTS = {
  // Sky Cool (天际线) - 中性灰色系  
  skyCool: ['#F8F9FA', '#F1F3F4', '#E8EAED', '#D1D5DB'] as const,
  
  // Dawn Warm (品牌主渐变) - 奶橘色系，参考图饱和度
  dawnWarm: ['#FFFEF7', '#FFF8E1', '#FFE0B2'] as const, // 奶白到奶橘 (参考图色调)
  
  // Horizon Blend (过渡混合) - 上半部分微弱奶橘，参考图风格
  horizonBlend: ['#F8F9FA', '#F5F6F7', '#FFFEF7', '#FFF0DC'] as const, // 微妙奶橘过渡
  
  // 渐变方向统一
  direction: { x: 0.2, y: 0 }, // 225°角度对应的start/end坐标
  directionEnd: { x: 0.8, y: 1 },
} as const;

// 向后兼容 - 主品牌渐变改为Dawn Warm
export const BRAND_GRADIENT = DAWN_GRADIENTS.dawnWarm;

// V2.0 PomeloX 品牌玻璃系统 - 增强版
export const BRAND_GLASS = {
  // 玻璃染色层 - 用于选中态/高亮的玻璃背景
  tint: {
    primary: 'rgba(255, 107, 53, 0.14)',     // 主品牌色玻璃染色
    secondary: 'rgba(255, 77, 94, 0.12)',    // 次品牌色玻璃染色
    light: 'rgba(255, 107, 53, 0.08)',       // 轻微品牌色染色
    // V2.0 新增层级染色
    subtle: 'rgba(255, 107, 53, 0.06)',      // 极轻微染色
    medium: 'rgba(255, 107, 53, 0.18)',      // 中等染色
    strong: 'rgba(255, 107, 53, 0.22)',      // 强染色
  },
  
  // 玻璃描边系统
  border: {
    primary: 'rgba(255, 107, 53, 0.22)',     // 主品牌色描边
    secondary: 'rgba(255, 77, 94, 0.18)',    // 次品牌色描边
    light: 'rgba(255, 107, 53, 0.12)',       // 轻微品牌色描边
    // V2.0 新增层级描边
    subtle: 'rgba(255, 107, 53, 0.08)',      // 极轻微描边
    medium: 'rgba(255, 107, 53, 0.16)',      // 中等描边
    strong: 'rgba(255, 107, 53, 0.30)',      // 强描边
  },
  
  // 玻璃背景 - 用于卡片和面板
  background: {
    primary: 'rgba(255, 255, 255, 0.95)',   // 主玻璃背景
    brand: 'rgba(255, 107, 53, 0.06)',       // 品牌色玻璃背景
    overlay: 'rgba(255, 255, 255, 0.85)',    // 覆盖层玻璃
    // V2.0 新增深色模式支持
    darkPrimary: 'rgba(28, 28, 30, 0.95)',   // 深色主玻璃背景
    darkBrand: 'rgba(255, 107, 53, 0.08)',   // 深色品牌玻璃背景
    darkOverlay: 'rgba(28, 28, 30, 0.85)',   // 深色覆盖层玻璃
  },
  
  // 可读性增强 - 深色背景上的品牌色overlay
  readability: {
    darkOverlay: 'rgba(0, 0, 0, 0.05)',      // 轻微暗层
    mediumOverlay: 'rgba(0, 0, 0, 0.08)',    // 中等暗层
    strongOverlay: 'rgba(0, 0, 0, 0.12)',    // 强暗层
    // V2.0 新增白色overlay用于深色图片
    lightOverlay: 'rgba(255, 255, 255, 0.05)', // 轻微亮层
    mediumLightOverlay: 'rgba(255, 255, 255, 0.08)', // 中等亮层
    strongLightOverlay: 'rgba(255, 255, 255, 0.12)', // 强亮层
  },
  
  // V2.0 新增：品牌渐变阴影系统
  gradientShadows: {
    primary: {
      // iOS原生彩色阴影
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      // Android elevation-based彩色阴影
      android: {
        elevation: 4,
        shadowColor: '#FF6B35',
        backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
      },
    },
    secondary: {
      ios: {
        shadowColor: '#FF4D5E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
        shadowColor: '#FF4D5E',
        backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
      },
    },
    subtle: {
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
        shadowColor: '#FF6B35',
        backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
      },
    },
  },
  
  // V2.0 新增：品牌发光效果
  glow: {
    primary: {
      color: 'rgba(255, 107, 53, 0.4)',
      radius: 6,
      intensity: 'medium' as const,
    },
    secondary: {
      color: 'rgba(255, 77, 94, 0.3)',
      radius: 4,
      intensity: 'light' as const,
    },
    strong: {
      color: 'rgba(255, 107, 53, 0.6)',
      radius: 10,
      intensity: 'strong' as const,
    },
  },
} as const;

// V2.0 PomeloX 品牌交互系统 - 增强版
export const BRAND_INTERACTIONS = {
  // 按钮状态
  button: {
    primary: {
      default: BRAND_GRADIENT,
      pressed: ['#E85A2F', '#E8434C'] as const,
      disabled: ['#FFB399', '#FFA3A8'] as const,
      // V2.0 新增分层按钮
      L1: {
        background: BRAND_GLASS.tint.light,
        border: BRAND_GLASS.border.light,
        text: '#FF6B35',
      },
      L2: {
        background: BRAND_GLASS.tint.primary,
        border: BRAND_GLASS.border.primary,
        text: '#FFFFFF',
      },
      L3: {
        background: BRAND_GRADIENT,
        border: 'transparent',
        text: '#FFFFFF',
        shadow: BRAND_GLASS.gradientShadows.primary,
      },
    },
    secondary: {
      default: BRAND_GLASS.tint.primary,
      pressed: BRAND_GLASS.tint.secondary,
      border: BRAND_GLASS.border.primary,
      // V2.0 新增分层次级按钮
      L1: {
        background: 'transparent',
        border: BRAND_GLASS.border.subtle,
        text: '#FF6B35',
      },
      L2: {
        background: BRAND_GLASS.tint.subtle,
        border: BRAND_GLASS.border.light,
        text: '#FF6B35',
      },
    },
  },
  
  // Tab和导航状态
  navigation: {
    active: {
      background: BRAND_GLASS.tint.primary,
      border: BRAND_GLASS.border.primary,
      text: '#FF6B35',
      // V2.0 新增发光效果
      glow: BRAND_GLASS.glow.secondary,
    },
    inactive: {
      background: 'transparent',
      border: 'transparent',
      text: '#9CA3AF',
    },
    // V2.0 新增分层导航样式
    L1: {
      active: {
        background: BRAND_GLASS.tint.light,
        border: BRAND_GLASS.border.light,
        text: '#FF6B35',
      },
      inactive: {
        background: 'rgba(255, 255, 255, 0.5)',
        border: 'rgba(255, 255, 255, 0.3)',
        text: '#6B7280',
      },
    },
    L2: {
      active: {
        background: BRAND_GLASS.tint.primary,
        border: BRAND_GLASS.border.primary,
        text: '#FFFFFF',
        shadow: BRAND_GLASS.gradientShadows.subtle,
      },
      inactive: {
        background: 'transparent',
        border: BRAND_GLASS.border.subtle,
        text: '#9CA3AF',
      },
    },
  },
  
  // 状态徽章和Pills
  badge: {
    primary: BRAND_GRADIENT,
    text: '#FFFFFF',
    overlay: BRAND_GLASS.readability.lightOverlay,
    // V2.0 新增分层徽章
    L1: {
      background: BRAND_GLASS.tint.light,
      text: '#FF6B35',
      border: BRAND_GLASS.border.light,
    },
    L2: {
      background: BRAND_GLASS.tint.primary,
      text: '#FFFFFF',
      border: BRAND_GLASS.border.primary,
    },
    L3: {
      background: BRAND_GRADIENT,
      text: '#FFFFFF',
      border: 'transparent',
      shadow: BRAND_GLASS.gradientShadows.subtle,
    },
  },
  
  // V2.0 新增：卡片交互状态
  card: {
    default: {
      background: BRAND_GLASS.background.overlay,
      border: 'rgba(255, 255, 255, 0.3)',
      shadow: 'xs' as const,
    },
    hover: {
      background: BRAND_GLASS.background.primary,
      border: BRAND_GLASS.border.subtle,
      shadow: 'sm' as const,
      transform: 'scale(1.02)',
    },
    active: {
      background: BRAND_GLASS.tint.light,
      border: BRAND_GLASS.border.light,
      shadow: BRAND_GLASS.gradientShadows.subtle,
      transform: 'scale(0.98)',
    },
    selected: {
      background: BRAND_GLASS.tint.primary,
      border: BRAND_GLASS.border.primary,
      shadow: BRAND_GLASS.gradientShadows.primary,
      glow: BRAND_GLASS.glow.primary,
    },
  },
  
  // V2.0 新增：表单元素状态
  form: {
    default: {
      background: BRAND_GLASS.background.overlay,
      border: 'rgba(255, 255, 255, 0.3)',
      text: '#374151',
    },
    focus: {
      background: BRAND_GLASS.background.primary,
      border: BRAND_GLASS.border.primary,
      text: '#111827',
      glow: BRAND_GLASS.glow.secondary,
    },
    error: {
      background: 'rgba(239, 68, 68, 0.05)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#DC2626',
    },
    success: {
      background: 'rgba(46, 213, 115, 0.05)',
      border: 'rgba(46, 213, 115, 0.3)',
      text: '#059669',
    },
  },
} as const;

// V2.0 Liquid Glass 分层系统 - L1/L2/L3架构
export const LIQUID_GLASS_LAYERS = {
  // L0 基础背景层 - 系统级背景
  L0: {
    light: '#F2F2F7',      // 浅色模式系统浅灰
    dark: '#000000',       // 深色模式纯黑
    blur: 0,
    shadow: 'none' as const,
    borderRadius: 0,
  },
  
  // L1 玻璃面板层 - 卡片、导航栏、列表容器  
  L1: {
    background: {
      light: 'rgba(255, 255, 255, 0.85)',     // 浅色模式85%白玻璃
      dark: 'rgba(28, 28, 30, 0.55)',         // 深色模式55%黑玻璃 (按您的规范)
    },
    blur: {
      ios: 20,          // iOS原生模糊强度
      android: 12,      // Android优化模糊强度
      fallback: 0,      // 降级时无模糊
    },
    border: {
      color: {
        light: 'rgba(255, 255, 255, 0.30)',
        dark: 'rgba(255, 255, 255, 0.15)',
      },
      width: 1,
    },
    borderRadius: {
      card: 16,         // 卡片圆角
      surface: 20,      // 大型表面圆角
      compact: 12,      // 紧凑组件圆角
    },
    shadow: 'xs' as const,
    opacity: {
      normal: 0.85,     // 正常透明度
      high: 0.95,       // 高透明度(需要更好可读性时)
    },
  },
  
  // L2 品牌玻璃层 - 强调/选中状态 (在L1基础上+Dawn Warm轻染14%)
  L2: {
    background: {
      light: 'rgba(255, 107, 53, 0.14)',      // 浅色模式Dawn Warm轻染14%
      dark: 'rgba(255, 107, 53, 0.14)',       // 深色模式同样14%轻染 (在55%黑玻璃基础上)
      coral: 'rgba(255, 77, 94, 0.12)',       // 珊瑚红变体
    },
    blur: {
      ios: 20,
      android: 12,
      fallback: 0,
    },
    border: {
      color: {
        light: 'rgba(255, 107, 53, 0.22)',    // PomeloX橙色描边
        dark: 'rgba(255, 107, 53, 0.18)',
        coral: 'rgba(255, 77, 94, 0.18)',     // 珊瑚红描边
      },
      width: 1,
    },
    borderRadius: {
      card: 16,
      surface: 20,
      compact: 12,
      pill: 24,         // 药丸形状(如标签)
    },
    shadow: 'xs' as const,
    // 品牌色发光效果(iOS)
    glow: {
      color: 'rgba(255, 107, 53, 0.3)',
      radius: 4,
    },
  },
  
  // L3 浮层/弹窗层 - AI助手弹窗、模态框、工具提示
  L3: {
    background: {
      light: 'rgba(255, 255, 255, 0.90)',     // 浅色模式90%白玻璃
      dark: 'rgba(28, 28, 30, 0.65)',         // 深色模式65%黑玻璃 (按您的规范)
    },
    blur: {
      ios: 30,          // 更强模糊营造浮层感
      android: 18,
      fallback: 0,
    },
    border: {
      color: {
        light: 'rgba(255, 255, 255, 0.30)',
        dark: 'rgba(255, 255, 255, 0.20)',
      },
      width: 1,
    },
    borderRadius: {
      modal: 24,        // 模态框圆角
      tooltip: 16,      // 工具提示圆角
      fab: 28,          // 浮动按钮圆角
    },
    shadow: 'sm' as const,
    // 背景遮罩配置
    backdrop: {
      light: 'rgba(0, 0, 0, 0.15)',
      dark: 'rgba(0, 0, 0, 0.30)',
      blur: 15,
    },
  },
} as const;

// V2.0 朝霞Overlay系统 - 白字可读性保障
export const DAWN_OVERLAYS = {
  // 照片/强底白字保障 - 严格按照规范
  darkOverlay: {
    light: 'rgba(0, 0, 0, 0.06)',      // 6%暗遮罩 (最轻)
    medium: 'rgba(0, 0, 0, 0.08)',     // 8%暗遮罩 (常用)
    strong: 'rgba(0, 0, 0, 0.10)',     // 10%暗遮罩 (最强)
  },
  
  // 标题内阴影增强
  titleShadow: {
    color: 'rgba(0, 0, 0, 0.01)',      // 1%内阴影
    offset: { width: 0, height: 1 },
    radius: 1,
  },
  
  // 白字对比标准
  textContrast: {
    minimum: 4.5,                      // 最低对比度要求
    target: 6.0,                       // 目标对比度
  },
  
  // 朝霞雾气效果
  mistEffect: {
    light: 'rgba(255, 255, 255, 0.15)', // 轻雾气
    medium: 'rgba(255, 255, 255, 0.25)', // 中雾气
    strong: 'rgba(255, 255, 255, 0.35)', // 强雾气
  },
} as const;

// V2.0 跨平台模糊策略配置
export const BLUR_STRATEGIES = {
  // 性能等级定义
  performance: {
    high: {
      enableBlur: true,
      maxBlurIntensity: 30,
      enableAnimatedBlur: true,
    },
    medium: {
      enableBlur: true,
      maxBlurIntensity: 20,
      enableAnimatedBlur: false,
    },
    low: {
      enableBlur: false,
      maxBlurIntensity: 0,
      enableAnimatedBlur: false,
      fallbackToGradient: true,
    },
  },
  
  // 平台特定配置
  platform: {
    ios: {
      preferredBlurType: 'systemMaterial' as const,
      supportsVibrancy: true,
      maxIntensity: 100,
    },
    android: {
      preferredBlurType: 'custom' as const,
      supportsVibrancy: false,
      maxIntensity: 25,
      minVersion: 26, // Android 8.0+支持高质量模糊
    },
  },
  
  // 降级渐变配置(用于替代模糊)
  fallbackGradients: {
    L1: {
      light: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'],
      dark: ['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.85)'],
    },
    L2: {
      light: ['rgba(255, 107, 53, 0.18)', 'rgba(255, 107, 53, 0.12)'],
      dark: ['rgba(255, 107, 53, 0.15)', 'rgba(255, 107, 53, 0.10)'],
    },
    L3: {
      light: ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.90)'],
      dark: ['rgba(28, 28, 30, 0.98)', 'rgba(28, 28, 30, 0.90)'],
    },
  },
} as const;

// V2.0 克制化颜色系统 - 朝霞·Liquid Glass 规范
export const RESTRAINED_COLORS = {
  // L1 基础容器系统 (85%白玻璃 + 中性描边)
  L1_CONTAINER: {
    background: {
      light: 'rgba(255, 255, 255, 0.85)', // 浅色模式85%白玻璃
      dark: 'rgba(28, 28, 30, 0.55)',     // 深色模式55%黑玻璃
    },
    border: {
      color: {
        light: 'rgba(255, 255, 255, 0.30)',
        dark: 'rgba(255, 255, 255, 0.15)',
      },
      width: 1,
    },
    // 内侧rim效果 (225°方向，≤8%透明度)
    innerRim: {
      light: 'rgba(255, 107, 53, 0.08)',
      dark: 'rgba(255, 107, 53, 0.06)',
    },
    shadow: 'xs' as const, // 仅XS阴影
    borderRadius: {
      card: 16,
      surface: 20,
      compact: 12,
    },
  },
  
  // L2 品牌强调系统 (L1基础 + Dawn轻染14%)
  L2_EMPHASIS: {
    background: {
      light: 'rgba(255, 107, 53, 0.14)', // Dawn轻染14%
      dark: 'rgba(240, 90, 45, 0.14)',   // 深色模式降饱和6%
    },
    border: {
      color: {
        light: 'rgba(255, 107, 53, 0.22)', // Dawn描边22%
        dark: 'rgba(240, 90, 45, 0.22)',
      },
      width: 1,
    },
    textColor: {
      light: '#FFFFFF',
      dark: '#FFFFFF',
    },
    shadow: 'xs' as const,
    borderRadius: {
      button: 14,
      pill: 20,
      compact: 12,
    },
  },
  
  // Dawn胶囊系统 (CTA/选中/徽章专用)
  DAWN_PILL: {
    small: {
      background: 'rgba(255, 107, 53, 0.14)',
      border: 'rgba(255, 107, 53, 0.22)',
      height: 20,
      borderRadius: 10,
      textColor: '#FFFFFF',
      fontSize: 10,
    },
    medium: {
      background: 'rgba(255, 107, 53, 0.14)',
      border: 'rgba(255, 107, 53, 0.22)',
      height: 24,
      borderRadius: 12,
      textColor: '#FFFFFF',
      fontSize: 12,
    },
    large: {
      background: 'rgba(255, 107, 53, 0.14)',
      border: 'rgba(255, 107, 53, 0.22)',
      height: 32,
      borderRadius: 16,
      textColor: '#FFFFFF',
      fontSize: 14,
    },
  },
  
  // 照片遮罩系统 (保障白字可读性≥4.5:1)
  PHOTO_OVERLAY: {
    darkMask: {
      light: 'rgba(0, 0, 0, 0.06)',   // 6%暗遮罩(最轻)
      medium: 'rgba(0, 0, 0, 0.08)',  // 8%暗遮罩(常用)
      strong: 'rgba(0, 0, 0, 0.10)',  // 10%暗遮罩(最强)
    },
    textShadow: {
      color: 'rgba(0, 0, 0, 0.01)',
      offset: { width: 0, height: 1 },
      radius: 1,
    },
    contrastTarget: 4.5, // 最低对比度要求
  },
  
  // FAB系统 (56×56标准尺寸，禁用外发光)
  FAB_SYSTEM: {
    container: {
      size: 56,
      background: 'rgba(255, 255, 255, 0.85)', // L1容器
      border: 'rgba(255, 255, 255, 0.30)',
      borderRadius: 28,
      shadow: 'xs' as const,
    },
    icon: {
      background: 'rgba(255, 107, 53, 0.14)', // Dawn小圈圈
      border: 'rgba(255, 107, 53, 0.22)',
      size: 20,
      borderRadius: 6,
    },
    // 禁用项
    glow: false,
    externalShadow: false,
    rays: false,
  },
  
  // Android降级策略
  ANDROID_FALLBACK: {
    L2_SOLID: {
      background: '#FF6B35', // 纯色Dawn
      border: 'rgba(255, 107, 53, 0.22)',
      textColor: '#FFFFFF',
      pressEffect: -8, // 按压时亮度-8%
    },
    disableBlur: true,
    maxShadow: 'sm' as const,
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
export type LiquidGlassLayers = typeof LIQUID_GLASS_LAYERS;
export type BlurStrategies = typeof BLUR_STRATEGIES;