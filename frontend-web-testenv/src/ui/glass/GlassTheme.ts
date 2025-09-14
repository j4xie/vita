export const Glass = {
  blur: 26,              // 24–30 之间可调
  radius: { card: 16, capsule: 18, tabbar: 20 },
  // 白系叠色（上浅下深）- 增强透明度一致性
  overlayTop: 'rgba(255,255,255,0.15)',    // 从10%增加到15%
  overlayBottom: 'rgba(255,255,255,0.25)',  // 从18%增加到25%
  // 高光分隔线 - 降低亮度避免抢视线
  hairlineFrom: 'rgba(255,255,255,0.25)',  // 从40%降到25%
  hairlineTo: 'rgba(255,255,255,0.00)',
  // 文案
  textMain: '#111111',
  textWeak: 'rgba(17,17,17,0.70)',
  // 页面暖色背景（增强对比）
  pageBgTop:  '#FFE4C4',    // 更深一点的暖色
  pageBgBottom:'#FFF0E6',   // 更明显的对比
  
  // 动画参数
  animation: {
    pressScale: 0.98,        // 按压缩放比例
    pressDuration: 130,      // 按压时长ms
    springConfig: {          // 回弹参数
      damping: 20,
      stiffness: 220,
    },
    sweepDuration: 250,      // 高光扫过时长
    opacityTransition: 180,  // 透明度切换时长
  },
  
  // 触摸规范
  touch: {
    minSize: 44,            // 最小触摸目标
    iconSize: 22,           // 标准图标尺寸
    spacing: {
      cardPadding: 14,      // 卡片内边距
      gridGutter: 12,       // 网格间距
      sectionMargin: 16,    // 区域边距
    },
  },
  
  // 系统颜色
  system: {
    iosBlue: '#007AFF',     // iOS系统蓝
    backgroundFallback: 'rgba(245,245,245,0.96)', // 降低透明度时的回退色
    borderFallback: '#E6E6E6', // 回退描边色
  },
  
  // 增强阴影系统 - 让卡片真正"浮起来"
  shadows: {
    // 轻微浮起 - 用于小组件
    xs: {
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 }, // Reduced from 2 to 1
        shadowOpacity: 0.06, // Reduced from 0.08 to 0.06
        shadowRadius: 4, // Reduced from 8 to 4
      },
      android: {
        elevation: 2, // Reduced from 3 to 2
      },
    },
    // 标准浮起 - 用于卡片 (优化性能)
    sm: {
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 }, // Reduced from 4 to 2
        shadowOpacity: 0.08, // Reduced from 0.12 to 0.08
        shadowRadius: 8, // Reduced from 12 to 8
      },
      android: {
        elevation: 3, // Reduced from 6 to 3
      },
    },
    // 明显浮起 - 用于重要元素 (适度优化)
    md: {
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 }, // Reduced from 6 to 3
        shadowOpacity: 0.12, // Reduced from 0.15 to 0.12
        shadowRadius: 10, // Reduced from 16 to 10
      },
      android: {
        elevation: 4, // Reduced from 8 to 4
      },
    },
    // 品牌色阴影 - 用于选中状态 (轻微优化)
    brand: {
      ios: {
        shadowColor: '#F9A889',
        shadowOffset: { width: 0, height: 2 }, // Reduced from 3 to 2
        shadowOpacity: 0.15, // Reduced from 0.18 to 0.15
        shadowRadius: 8, // Reduced from 10 to 8
      },
      android: {
        elevation: 3, // Reduced from 5 to 3
        shadowColor: '#F9A889',
      },
    },
  },
} as const;

export default Glass;