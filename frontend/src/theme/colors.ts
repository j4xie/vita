export const colors = {
  // PomeloX 主色系 - 橙红品牌色
  primary: '#FF6B35',      // CTA/活跃状态 - 活力橙色
  primaryPressed: '#E85A2F', // 主按钮按下状态
  primaryDisabled: '#FFB399', // 主按钮禁用状态
  primaryLight: '#FF8A65', // 浅橙色（兼容）
  primaryDark: '#E85A2F',  // 深橙色（兼容）
  
  // PomeloX 辅色系 - 珊瑚红
  secondary: '#FF4757',    // 次操作按钮色 - 珊瑚红
  secondaryPressed: '#E83E4F', // 次按钮按下状态
  secondaryLight: '#FF8A80', // 浅珊瑚色（兼容）
  secondaryDark: '#E83E4F',  // 深珊瑚色（兼容）
  
  // PomeloX 强调色
  accent: '#FF8A65',       // 强调色 - 浅橙色
  
  // PomeloX 渐变色组合 - 橙红品牌风格
  gradients: {
    // PomeloX 主题渐变
    vitaflow: ['#FF6B35', '#FF4757', '#FF8A65'] as const,      // PomeloX主渐变：橙→珊瑚红→浅橙
    sunset: ['#FF8A65', '#FF6B35'] as const,                   // 日落渐变：浅橙→活力橙
    coral: ['#FF4757', '#FF6B35'] as const,                    // 珊瑚渐变：珊瑚红→活力橙
    dawn: ['#FF8A65', '#FF6B35', '#FFA726'] as const,          // 朝霞渐变：浅橙→活力橙→温暖琥珀
    
    // 现代UI渐变 - PomeloX配色
    primary: ['#FF6B35', '#FF4757'] as const,                  // 主渐变：活力橙到珊瑚红
    secondary: ['#FF4757', '#FF8A65'] as const,                // 次渐变：珊瑚红到浅橙
    accent: ['#FF8A65', '#FFA726'] as const,                   // 强调渐变：浅橙到温暖琥珀
    
    // 卡片和背景渐变
    card: ['#ffffff', '#fff5f2'] as const,                     // 卡片渐变：白色到淡橙白
    glass: ['rgba(255,255,255,0.95)', 'rgba(255,245,242,0.8)'] as const, // 玻璃态渐变
    background: ['#fff5f2', '#ffffff'] as const,               // 背景渐变：淡橙白到白色
    
    // 情绪化渐变
    warm: ['#FF6B35', '#FF4757'] as const,                     // 暖色渐变：PomeloX主色
    cool: ['#4facfe', '#667eea'] as const,                     // 冷色渐变：保留蓝色系（对比色）
    success: ['#2ED573', '#22c55e'] as const,                  // 成功渐变：现代绿色系
    error: ['#FB5454', '#ef4444'] as const,                    // 错误渐变：现代红色系
    warning: ['#FFA726', '#f59e0b'] as const,                  // 警告渐变：温暖琥珀色系
  },
  
  // 中性色 - 浅色主题优化
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: {
    50: '#FAFAFA',   // 极浅灰
    100: '#F5F5F5',  // 很浅灰
    200: '#EEEEEE',  // 浅灰
    300: '#E0E0E0',  // 中浅灰
    400: '#BDBDBD',  // 中灰
    500: '#9E9E9E',  // 标准灰
    600: '#757575',  // 中深灰
    700: '#616161',  // 深灰
    800: '#424242',  // 很深灰
    900: '#212121',  // 极深灰
  },
  
  // PomeloX 功能色系
  success: '#2ED573',      // 成功色 - 清新绿
  warning: '#FFA726',      // 警告色 - 温暖琥珀色  
  error: '#EF4444',        // 严重错误色（保留标准红）
  danger: '#EF4444',       // 危险色（保留标准红）
  info: '#22D3EE',         // 现代青色（保留）
  
  // 背景色 - PomeloX 温暖主题
  background: {
    primary: '#FAF3F1',      // 主背景 - 温暖米色
    secondary: '#fff5f2',    // 次背景 - 淡橙白色
    tertiary: '#fef2ef',     // 三级背景 - 更淡橙白色
    dawn: '#fef7f0',         // 朝霞背景 - 温暖色调
    gradient: 'linear-gradient(135deg, #fff5f2 0%, #ffffff 100%)', // CSS渐变背景
  },
  
  // 卡片和表面 - PomeloX Liquid Glass 设计
  surface: {
    primary: '#FFFFFF',      // 主卡片背景
    secondary: '#fff5f2',    // 次级卡片背景 - 淡橙白色
    elevated: '#FFFFFF',     // 悬浮卡片背景
    glass: 'rgba(255, 255, 255, 0.95)', // 玻璃态背景
    overlay: 'rgba(255, 245, 242, 0.95)', // 覆盖层背景 - 淡橙色调
    frosted: 'rgba(255, 255, 255, 0.8)', // 磨砂玻璃效果
    card: 'rgba(255, 255, 255, 0.98)', // 现代卡片背景
  },
  
  // PomeloX Liquid Glass 材质系统
  liquidGlass: {
    primary: 'rgba(255, 107, 53, 0.85)',      // 主玻璃材质 - 活力橙
    secondary: 'rgba(255, 71, 87, 0.75)',     // 次级玻璃材质 - 珊瑚红
    accent: 'rgba(255, 138, 101, 0.65)',      // 强调玻璃材质 - 浅橙
    border: 'rgba(255, 255, 255, 0.2)',       // 玻璃边框
    highlight: 'rgba(255, 255, 255, 0.1)',    // 内高光
    glow: 'rgba(255, 107, 53, 0.4)',          // 发光效果
    shimmer: 'rgba(255, 255, 255, 0.3)',      // 流光效果
  },
  
  // v1.2 文字颜色系统
  text: {
    primary: '#111827',      // v1.2 主文本
    secondary: '#4B5563',    // v1.2 次文本
    tertiary: '#9CA3AF',     // v1.2 占位符/提示文本
    inverse: '#FFFFFF',      // 反色文字 - 白色
    disabled: '#D1D5DB',     // v1.2 禁用文本
    placeholder: '#9CA3AF',  // 占位符文字（与tertiary一致）
  },
  
  // 边框颜色 - PomeloX 主题
  border: {
    primary: '#E0E0E0',      // 主边框
    secondary: '#EEEEEE',    // 次边框
    light: '#F5F5F5',        // 浅边框
    focus: '#FF6B35',        // 聚焦边框 - 活力橙
    error: '#FB5454',        // 错误边框
    vita: 'rgba(255, 107, 53, 0.3)',  // PomeloX 品牌边框
  },
  
  // 阴影颜色 - PomeloX 品牌阴影系统
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',   // 浅阴影
    medium: 'rgba(0, 0, 0, 0.1)',   // 中阴影
    heavy: 'rgba(0, 0, 0, 0.15)',   // 重阴影
    colored: 'rgba(255, 107, 53, 0.2)', // PomeloX 有色阴影 - 橙色
    vitaOrange: 'rgba(255, 107, 53, 0.3)',    // 橙色阴影
    vitaCoral: 'rgba(255, 71, 87, 0.2)',      // 珊瑚色阴影
    vitaGlow: 'rgba(255, 138, 101, 0.4)',     // 发光阴影
    vitaLight: 'rgba(255, 107, 53, 0.1)',     // 轻橙色阴影
  },

  // ========================
  // 🌙 Dark Mode Color System - Apple HIG 2025标准
  // ========================
  
  // Dark Mode 系统背景色 - Apple标准6层分级
  darkBackground: {
    // Apple标准系统背景层级
    systemBackground: '#000000',           // L0: 系统级纯黑背景 - OLED优化
    secondarySystemBackground: '#1C1C1E',  // L1: 主要界面背景 - Apple系统深灰
    tertiarySystemBackground: '#2C2C2E',   // L2: 卡片/容器背景
    quaternarySystemBackground: '#3A3A3C', // L3: 浮动元素背景
    
    // Apple分组背景系统 (用于列表和分组内容)
    systemGroupedBackground: '#000000',           // 分组背景基础层
    secondarySystemGroupedBackground: '#1C1C1E',  // 分组二级背景
    tertiarySystemGroupedBackground: '#2C2C2E',   // 分组三级背景
    
    // 自定义语义化背景
    elevated: '#2C2C2E',          // 提升背景 (卡片、模态框)
    surface: '#1C1C1E',           // 表面背景 (导航栏、工具栏)
  },

  // Dark Mode 文本系统 - Apple标准透明度分级
  darkText: {
    // Apple HIG标准文本透明度系统
    primary: '#FFFFFF',           // 100% 主要文本 - 标题、重要内容
    secondary: '#EBEBF599',       // 60% alpha 次要文本 - 副标题、描述
    tertiary: '#EBEBF54D',        // 30% alpha 三级文本 - 辅助信息
    quaternary: '#EBEBF530',      // 18% alpha 四级文本 - 占位符、禁用状态
    
    // 特殊用途文本色
    inverse: '#000000',           // 反色文本 (用于浅色背景上)
    disabled: '#EBEBF540',        // 25% alpha 禁用文本
    placeholder: '#EBEBF54D',     // 占位符文本 (与tertiary一致)
    link: '#0A84FF',             // Apple标准链接色 (Dark Mode优化版)
    
    // 品牌文本色 (在深色背景上的优化版本)
    brand: '#FF8A65',             // PomeloX主品牌色深色适配版
    brandSecondary: '#FF6B75',    // 次品牌色深色适配版
  },

  // Dark Mode 边框和分隔符
  darkBorder: {
    primary: '#38383A',           // 主要分隔线色 - Apple标准
    secondary: '#48484A',         // 次要边框色
    tertiary: '#58585A',          // 三级边框色
    
    // 语义化边框色
    separator: '#38383A',         // 分隔线 (Apple系统标准)
    opaqueSeparator: '#38383A',   // 不透明分隔线
    outline: '#48484A',           // 轮廓边框
    
    // 交互状态边框
    focus: '#0A84FF',            // 聚焦边框 (Apple蓝色深色版)
    error: '#FF453A',            // 错误边框 (Apple红色深色版)
    success: '#30D158',          // 成功边框 (Apple绿色深色版)
    warning: '#FF9F0A',          // 警告边框 (Apple橙色深色版)
  },

  // Dark Mode PomeloX品牌色系 - 科学化适配
  darkBrand: {
    // 主品牌色 - 明度+15%, 饱和度-5% (科学调色公式)
    primary: '#FF8A65',          // #FF6B35 → 深色模式适配版
    primaryPressed: '#FFB299',   // 按压态 - 更亮
    primaryDisabled: '#8A5A42',  // 禁用态 - 降饱和度
    primaryLight: '#FFAB80',     // 浅色变体
    primaryDark: '#E56B47',      // 深色变体
    
    // 次品牌色适配
    secondary: '#FF6B75',        // #FF4757 → 珊瑚红适配版
    secondaryPressed: '#FF8A95', // 按压态
    secondaryDisabled: '#8A4B52', // 禁用态
    secondaryLight: '#FF8A95',   // 浅色变体
    secondaryDark: '#E8434F',    // 深色变体
    
    // 强调色
    accent: '#FFB399',           // #FF8A65 → 浅橙色适配版
    accentPressed: '#FFCCB3',    // 按压态
    accentDisabled: '#996B5C',   // 禁用态
  },

  // Dark Mode 功能色系 - Apple 2025标准
  darkFunctional: {
    // Apple标准系统功能色 (针对深色背景优化)
    success: '#30D158',          // Apple绿色 (比light mode更亮)
    warning: '#FF9F0A',          // Apple橙色警告
    error: '#FF453A',            // Apple红色 (比light mode更亮)
    info: '#64D2FF',             // Apple蓝色信息 (深色优化)
    
    // 次级功能色
    successSecondary: '#1F8A3F', // 成功色次级状态
    warningSecondary: '#BF7506', // 警告色次级状态
    errorSecondary: '#BF2E1F',   // 错误色次级状态
    infoSecondary: '#4A9FBF',    // 信息色次级状态
  },

  // Dark Mode 渐变色系统
  darkGradients: {
    // 品牌主渐变 - 深色模式适配
    vitaflow: ['#FF8A65', '#FF6B75', '#FFB399'] as const,      // 主渐变适配版
    sunset: ['#FFB399', '#FF8A65'] as const,                   // 日落渐变适配
    coral: ['#FF6B75', '#FF8A65'] as const,                    // 珊瑚渐变适配
    dawn: ['#FFB399', '#FF8A65', '#FFCCB3'] as const,          // 朝霞渐变适配
    
    // 系统背景渐变
    backgroundPrimary: ['#000000', '#1C1C1E'] as const,       // 主背景渐变
    backgroundSecondary: ['#1C1C1E', '#2C2C2E'] as const,     // 次背景渐变
    backgroundElevated: ['#2C2C2E', '#3A3A3C'] as const,      // 提升背景渐变
    
    // 卡片和表面渐变
    card: ['rgba(44, 44, 46, 0.95)', 'rgba(28, 28, 30, 0.85)'] as const,     // 卡片渐变
    glass: ['rgba(44, 44, 46, 0.85)', 'rgba(28, 28, 30, 0.75)'] as const,    // 玻璃态渐变
    surface: ['rgba(28, 28, 30, 0.95)', 'rgba(44, 44, 46, 0.85)'] as const,  // 表面渐变
    
    // 功能性渐变
    success: ['#30D158', '#28A745'] as const,                 // 成功渐变
    error: ['#FF453A', '#DC3545'] as const,                   // 错误渐变
    warning: ['#FF9F0A', '#FFC107'] as const,                 // 警告渐变
  },

  // Dark Mode 阴影色系
  darkShadows: {
    // 深色模式下阴影需要更强对比
    light: 'rgba(0, 0, 0, 0.3)',      // 浅阴影 (比light mode更强)
    medium: 'rgba(0, 0, 0, 0.4)',     // 中阴影
    heavy: 'rgba(0, 0, 0, 0.5)',      // 重阴影
    
    // 有色阴影系统 - 品牌色阴影
    brandPrimary: 'rgba(255, 138, 101, 0.3)',    // 主品牌色阴影
    brandSecondary: 'rgba(255, 107, 117, 0.25)', // 次品牌色阴影
    brandAccent: 'rgba(255, 179, 153, 0.2)',     // 强调色阴影
    
    // 功能性阴影
    success: 'rgba(48, 209, 88, 0.2)',           // 成功阴影
    error: 'rgba(255, 69, 58, 0.2)',             // 错误阴影
    warning: 'rgba(255, 159, 10, 0.2)',          // 警告阴影
  },
};

export type Colors = typeof colors;