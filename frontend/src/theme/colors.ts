export const colors = {
  // 西柚 主色系 - 橙红品牌色
  primary: '#FF6B35',      // CTA/活跃状态 - 活力橙色
  primaryPressed: '#E85A2F', // 主按钮按下状态
  primaryDisabled: '#FFB399', // 主按钮禁用状态
  primaryLight: '#FF8A65', // 浅橙色（兼容）
  primaryDark: '#E85A2F',  // 深橙色（兼容）
  
  // 西柚 辅色系 - 珊瑚红
  secondary: '#FF4757',    // 次操作按钮色 - 珊瑚红
  secondaryPressed: '#E83E4F', // 次按钮按下状态
  secondaryLight: '#FF8A80', // 浅珊瑚色（兼容）
  secondaryDark: '#E83E4F',  // 深珊瑚色（兼容）
  
  // 西柚 强调色
  accent: '#FF8A65',       // 强调色 - 浅橙色
  
  // 西柚 渐变色组合 - 橙红品牌风格
  gradients: {
    // 西柚 主题渐变
    vitaflow: ['#FF6B35', '#FF4757', '#FF8A65'] as const,      // 西柚主渐变：橙→珊瑚红→浅橙
    sunset: ['#FF8A65', '#FF6B35'] as const,                   // 日落渐变：浅橙→活力橙
    coral: ['#FF4757', '#FF6B35'] as const,                    // 珊瑚渐变：珊瑚红→活力橙
    dawn: ['#FF8A65', '#FF6B35', '#FFA726'] as const,          // 朝霞渐变：浅橙→活力橙→温暖琥珀
    
    // 现代UI渐变 - 西柚配色
    primary: ['#FF6B35', '#FF4757'] as const,                  // 主渐变：活力橙到珊瑚红
    secondary: ['#FF4757', '#FF8A65'] as const,                // 次渐变：珊瑚红到浅橙
    accent: ['#FF8A65', '#FFA726'] as const,                   // 强调渐变：浅橙到温暖琥珀
    
    // 卡片和背景渐变
    card: ['#ffffff', '#fff5f2'] as const,                     // 卡片渐变：白色到淡橙白
    glass: ['rgba(255,255,255,0.95)', 'rgba(255,245,242,0.8)'] as const, // 玻璃态渐变
    background: ['#fff5f2', '#ffffff'] as const,               // 背景渐变：淡橙白到白色
    
    // 情绪化渐变
    warm: ['#FF6B35', '#FF4757'] as const,                     // 暖色渐变：西柚主色
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
  
  // 西柚 功能色系
  success: '#2ED573',      // 成功色 - 清新绿
  warning: '#FFA726',      // 警告色 - 温暖琥珀色  
  error: '#EF4444',        // 严重错误色（保留标准红）
  danger: '#EF4444',       // 危险色（保留标准红）
  info: '#22D3EE',         // 现代青色（保留）
  
  // 背景色 - 西柚 温暖主题
  background: {
    primary: '#FFFFFF',      // 主背景 - 纯白
    secondary: '#fff5f2',    // 次背景 - 淡橙白色
    tertiary: '#fef2ef',     // 三级背景 - 更淡橙白色
    dawn: '#fef7f0',         // 朝霞背景 - 温暖色调
    gradient: 'linear-gradient(135deg, #fff5f2 0%, #ffffff 100%)', // CSS渐变背景
  },
  
  // 卡片和表面 - 西柚 Liquid Glass 设计
  surface: {
    primary: '#FFFFFF',      // 主卡片背景
    secondary: '#fff5f2',    // 次级卡片背景 - 淡橙白色
    elevated: '#FFFFFF',     // 悬浮卡片背景
    glass: 'rgba(255, 255, 255, 0.95)', // 玻璃态背景
    overlay: 'rgba(255, 245, 242, 0.95)', // 覆盖层背景 - 淡橙色调
    frosted: 'rgba(255, 255, 255, 0.8)', // 磨砂玻璃效果
    card: 'rgba(255, 255, 255, 0.98)', // 现代卡片背景
  },
  
  // 西柚 Liquid Glass 材质系统
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
  
  // 边框颜色 - 西柚 主题
  border: {
    primary: '#E0E0E0',      // 主边框
    secondary: '#EEEEEE',    // 次边框
    light: '#F5F5F5',        // 浅边框
    focus: '#FF6B35',        // 聚焦边框 - 活力橙
    error: '#FB5454',        // 错误边框
    vita: 'rgba(255, 107, 53, 0.3)',  // 西柚 品牌边框
  },
  
  // 阴影颜色 - 西柚 品牌阴影系统
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',   // 浅阴影
    medium: 'rgba(0, 0, 0, 0.1)',   // 中阴影
    heavy: 'rgba(0, 0, 0, 0.15)',   // 重阴影
    colored: 'rgba(255, 107, 53, 0.2)', // 西柚 有色阴影 - 橙色
    vitaOrange: 'rgba(255, 107, 53, 0.3)',    // 橙色阴影
    vitaCoral: 'rgba(255, 71, 87, 0.2)',      // 珊瑚色阴影
    vitaGlow: 'rgba(255, 138, 101, 0.4)',     // 发光阴影
    vitaLight: 'rgba(255, 107, 53, 0.1)',     // 轻橙色阴影
  },
};

export type Colors = typeof colors;