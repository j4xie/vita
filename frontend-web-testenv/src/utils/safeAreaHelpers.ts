/**
 * v1.2 安全区 & 动态岛适配工具
 * 基于 iPhone 16 Pro 优化，支持全设备适配
 */

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, Platform } from 'react-native';
// 稳健的主题获取，避免循环依赖
let _themeCache: any = null;
const getTheme = () => {
  if (_themeCache) return _themeCache;
  
  try {
    const { theme } = require('../theme');
    if (theme && typeof theme === 'object') {
      _themeCache = theme;
      return theme;
    }
  } catch (error) {
    console.warn('Theme loading failed, using core config:', error);
  }
  
  // 降级到核心配置
  try {
    const core = require('../theme/core');
    _themeCache = {
      spacing: core.CORE_SPACING || { '4': 16, '3': 12 },
      CORE_SPACING: core.CORE_SPACING || { '4': 16, '3': 12 },
      layout: core.CORE_LAYOUT || { margins: { compact: 12, default: 16 } },
      touchTarget: core.CORE_TOUCH_TARGET || { minimum: 48, fab: { size: 64, visibleWhenHidden: 8 } },
      CORE_TOUCH_TARGET: core.CORE_TOUCH_TARGET || { minimum: 48, fab: { size: 64, visibleWhenHidden: 8 } },
    };
    return _themeCache;
  } catch (coreError) {
    console.error('Core config loading also failed:', coreError);
    _themeCache = {
      spacing: { '4': 16, '3': 12 },
      layout: { margins: { compact: 12, default: 16 }, offset: { fabToast: 100, fabCTA: 160 }, bottomSheet: { collapsed: 0.66, expanded: 0.92, handle: { width: 36, height: 4 }, cornerRadius: 24 } },
      touchTarget: { minimum: 48, fab: { size: 64, visibleWhenHidden: 8 } },
      CORE_TOUCH_TARGET: { minimum: 48, fab: { size: 64, visibleWhenHidden: 8 } }
    };
    return _themeCache;
  }
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// iPhone 16 Pro 动态岛尺寸（参考值）
const DYNAMIC_ISLAND_HEIGHT = 32; // pt
const DYNAMIC_ISLAND_WIDTH = 126; // pt

/**
 * v1.2 安全区适配Hook
 * 返回优化后的安全区间距
 */
export const useSafeAreaAdaptation = () => {
  const insets = useSafeAreaInsets();
  
  // 检测是否有动态岛（通过顶部安全区高度判断）
  const hasDynamicIsland = Platform.OS === 'ios' && insets.top >= 44;
  
  // v1.2 适配规则
  return {
    // 原始安全区
    raw: insets,
    
    // 适配后的安全区
    top: Math.max(insets.top, getTheme().spacing?.[4] || 16), // 最小16pt
    bottom: Math.max(insets.bottom, getTheme().spacing?.[4] || 16), // 最小16pt
    left: Math.max(insets.left, getTheme().spacing?.[4] || 16), // 最小16pt
    right: Math.max(insets.right, getTheme().spacing?.[4] || 16), // 最小16pt
    
    // 动态岛信息
    dynamicIsland: {
      present: hasDynamicIsland,
      height: hasDynamicIsland ? DYNAMIC_ISLAND_HEIGHT : 0,
      width: hasDynamicIsland ? DYNAMIC_ISLAND_WIDTH : 0,
    },
    
    // 内容区域计算
    contentArea: {
      width: screenWidth - Math.max(insets.left, getTheme().spacing?.[4] || 16) - Math.max(insets.right, getTheme().spacing?.[4] || 16),
      height: screenHeight - Math.max(insets.top, getTheme().spacing?.[4] || 16) - Math.max(insets.bottom, getTheme().spacing?.[4] || 16),
    },
    
    // v1.2 边距系统
    margins: {
      // 紧凑屏幕（< 375pt）
      compact: screenWidth < 375 ? (getTheme().layout?.margins?.compact || 12) : (getTheme().layout?.margins?.default || 16),
      // 标准边距
      default: getTheme().layout?.margins?.default || 16,
    }
  };
};

/**
 * v1.2 FAB定位计算
 * 考虑安全区、动态岛、Toast等元素的冲突避免
 */
export const useFABPositioning = () => {
  const { bottom, dynamicIsland, margins } = useSafeAreaAdaptation();
  
  return {
    // FAB基础位置
    bottom: bottom + (getTheme().spacing?.[4] || 16), // 安全区 + 16pt
    right: margins.default, // 右边距
    
    // Toast冲突时的错位
    offsetForToast: {
      translateY: -(getTheme().layout?.offset?.fabToast || 100),
    },
    
    // CTA条冲突时的错位
    offsetForCTA: {
      translateY: -(getTheme().layout?.offset?.fabCTA || 160),
    },
    
    // 半隐藏状态的位置
    semiHiddenPosition: {
      translateX: (getTheme().touchTarget?.fab?.size || 64) - (getTheme().touchTarget?.fab?.visibleWhenHidden || 8),
    }
  };
};

/**
 * v1.2 BottomSheet定位计算
 * 考虑安全区适配和精确吸附点
 */
export const useBottomSheetPositioning = () => {
  const { bottom, contentArea } = useSafeAreaAdaptation();
  
  const largeHeight = contentArea.height * (getTheme().layout?.bottomSheet?.large || 0.75);
  const fullHeight = contentArea.height * (getTheme().layout?.bottomSheet?.full || 0.92);
  
  return {
    // 吸附点高度
    snapPoints: {
      large: largeHeight,
      full: fullHeight,
    },
    
    // 底部安全区适配
    paddingBottom: bottom,
    
    // 手柄区域
    handle: {
      width: getTheme().layout?.bottomSheet?.handle?.width || 36,
      height: getTheme().layout?.bottomSheet?.handle?.height || 4,
      marginTop: getTheme().spacing?.[3] || 12, // 12pt
    },
    
    // 圆角
    borderRadius: getTheme().layout?.bottomSheet?.cornerRadius || 24,
  };
};

/**
 * v1.2 响应式断点检测
 */
export const useResponsiveBreakpoint = () => {
  const breakpoint = screenWidth < 375 ? 'small' : 
                     screenWidth <= 414 ? 'medium' : 'large';
  
  return {
    breakpoint,
    isSmall: breakpoint === 'small',
    isMedium: breakpoint === 'medium', 
    isLarge: breakpoint === 'large',
    screenWidth,
    screenHeight,
  };
};

/**
 * v1.2 Dynamic Type 字体缩放支持
 * 未来扩展：集成系统字体缩放设置
 */
export const useDynamicTypeSupport = () => {
  // 暂时返回基础值，未来可集成 react-native-dynamic-fonts
  return {
    fontScale: 1.0,
    isLargeText: false,
    isXLText: false,
    
    // 按钮尺寸适配
    getButtonHeight: (baseHeight: number) => {
      // 未来根据 fontScale 调整
      return baseHeight;
    },
  };
};

/**
 * v1.2 触达标准检测
 * 检查元素是否符合最小触达面积标准
 */
export const validateTouchTarget = (width: number, height: number) => {
  const theme = getTheme();
  const minimumSize = theme.touchTarget?.minimum || theme.CORE_TOUCH_TARGET?.minimum || 48;
  
  return {
    isValid: width >= minimumSize && height >= minimumSize,
    recommendedHitSlop: {
      top: Math.max(0, (minimumSize - height) / 2),
      bottom: Math.max(0, (minimumSize - height) / 2),
      left: Math.max(0, (minimumSize - width) / 2),
      right: Math.max(0, (minimumSize - width) / 2),
    },
  };
};