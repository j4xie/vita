/**
 * 组织切换器状态管理Hook
 * 处理动画状态、手势识别、权限验证等逻辑
 */

import { useCallback, useRef, useEffect } from 'react';
import { Platform, Animated } from 'react-native';
import { useSharedValue, withSpring, withTiming, runOnJS, SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Organization, OrganizationSwitcherState } from '../types/organization';
import { useOrganization } from '../context/OrganizationContext';

// ==================== 动画配置 ====================

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 180,
  mass: 0.9,
};

const TIMING_CONFIG = {
  duration: 300,
};

// ==================== Hook定义 ====================

interface UseOrganizationSwitcherOptions {
  onSwitchStart?: () => void;
  onSwitchSuccess?: (organization: Organization) => void;
  onSwitchError?: (error: string) => void;
  disabled?: boolean;
}

interface UseOrganizationSwitcherReturn {
  // 状态
  isExpanded: boolean;
  isAnimating: boolean;
  canSwitch: boolean;
  
  // 动画值
  arcOpacity: SharedValue<number>;
  semicircleScale: SharedValue<number>;
  overlayOpacity: SharedValue<number>;
  blurIntensity: SharedValue<number>;
  
  // 操作方法
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  selectOrganization: (organization: Organization) => Promise<void>;
  
  // 状态检查
  hasMultipleOrganizations: boolean;
  currentOrganization: Organization | null;
  availableOrganizations: Organization[];
}

export const useOrganizationSwitcher = (
  options: UseOrganizationSwitcherOptions = {}
): UseOrganizationSwitcherReturn => {
  const {
    onSwitchStart,
    onSwitchSuccess,
    onSwitchError,
    disabled = false
  } = options;

  const {
    currentOrganization,
    organizations,
    isSwitching,
    switchOrganization,
    hasOrganizationAccess
  } = useOrganization();

  // ==================== 状态管理 ====================

  const isExpandedRef = useRef(false);
  const isAnimatingRef = useRef(false);

  // 动画共享值
  const arcOpacity = useSharedValue(1);
  const semicircleScale = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const blurIntensity = useSharedValue(0);

  // ==================== 状态计算 ====================

  const hasMultipleOrganizations = organizations.length > 1;
  const canSwitch = !disabled && !isSwitching && hasMultipleOrganizations && !!currentOrganization;

  // 获取可用的组织列表（排除当前组织，只显示有权限的）
  const availableOrganizations = organizations.filter(org => 
    org.id !== currentOrganization?.id && hasOrganizationAccess(org.id)
  );

  // ==================== 动画控制 ====================

  const expand = useCallback(() => {
    if (!canSwitch || isExpandedRef.current || isAnimatingRef.current) {
      return;
    }

    // 触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    isExpandedRef.current = true;
    isAnimatingRef.current = true;

    // 开始展开动画
    arcOpacity.value = withSpring(0, SPRING_CONFIG);
    semicircleScale.value = withSpring(1, SPRING_CONFIG);
    overlayOpacity.value = withSpring(1, SPRING_CONFIG);
    blurIntensity.value = withTiming(20, TIMING_CONFIG, () => {
      runOnJS(() => {
        isAnimatingRef.current = false;
      })();
    });
  }, [canSwitch, arcOpacity, semicircleScale, overlayOpacity, blurIntensity]);

  const collapse = useCallback(() => {
    if (!isExpandedRef.current || isAnimatingRef.current) {
      return;
    }

    isExpandedRef.current = false;
    isAnimatingRef.current = true;

    // 开始收起动画
    semicircleScale.value = withSpring(0, SPRING_CONFIG);
    overlayOpacity.value = withSpring(0, SPRING_CONFIG);
    blurIntensity.value = withTiming(0, TIMING_CONFIG);
    arcOpacity.value = withSpring(1, SPRING_CONFIG, () => {
      runOnJS(() => {
        isAnimatingRef.current = false;
      })();
    });
  }, [arcOpacity, semicircleScale, overlayOpacity, blurIntensity]);

  const toggle = useCallback(() => {
    if (isExpandedRef.current) {
      collapse();
    } else {
      expand();
    }
  }, [expand, collapse]);

  // ==================== 组织切换 ====================

  const selectOrganization = useCallback(async (organization: Organization) => {
    if (!canSwitch || isAnimatingRef.current) {
      return;
    }

    // 如果选择的是当前组织，直接收起
    if (organization.id === currentOrganization?.id) {
      collapse();
      return;
    }

    // 检查权限
    if (!hasOrganizationAccess(organization.id)) {
      onSwitchError?.('您没有权限访问此组织');
      collapse();
      return;
    }

    try {
      // 触觉反馈
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // 先收起界面
      collapse();

      // 通知切换开始
      onSwitchStart?.();

      // 延迟执行切换，让动画完成
      setTimeout(async () => {
        try {
          const result = await switchOrganization(organization.id);
          
          if (result.success) {
            onSwitchSuccess?.(organization);
          } else {
            onSwitchError?.(result.message);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '切换组织失败';
          onSwitchError?.(errorMessage);
        }
      }, 200);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换组织失败';
      onSwitchError?.(errorMessage);
      console.error('Organization switch error:', error);
    }
  }, [
    canSwitch, 
    currentOrganization, 
    hasOrganizationAccess, 
    switchOrganization,
    collapse,
    onSwitchStart,
    onSwitchSuccess,
    onSwitchError
  ]);

  // ==================== 效果处理 ====================

  // 当组织列表变化时，检查是否需要自动收起
  useEffect(() => {
    if (!hasMultipleOrganizations && isExpandedRef.current) {
      collapse();
    }
  }, [hasMultipleOrganizations, collapse]);

  // 当切换状态变化时的处理
  useEffect(() => {
    if (isSwitching && isExpandedRef.current) {
      // 如果正在切换且界面是展开的，强制收起
      collapse();
    }
  }, [isSwitching, collapse]);

  // ==================== 返回值 ====================

  return {
    // 状态
    isExpanded: isExpandedRef.current,
    isAnimating: isAnimatingRef.current,
    canSwitch,
    
    // 动画值
    arcOpacity,
    semicircleScale,
    overlayOpacity,
    blurIntensity,
    
    // 操作方法
    expand,
    collapse,
    toggle,
    selectOrganization,
    
    // 状态检查
    hasMultipleOrganizations,
    currentOrganization,
    availableOrganizations,
  };
};

// ==================== 辅助Hook：手势处理 ====================

interface UseOrganizationSwitcherGesturesOptions {
  onExpand: () => void;
  onCollapse: () => void;
  isExpanded: boolean;
  canSwitch: boolean;
}

export const useOrganizationSwitcherGestures = (
  options: UseOrganizationSwitcherGesturesOptions
) => {
  const { onExpand, onCollapse, isExpanded, canSwitch } = options;

  // 点击手势处理
  const handleTap = useCallback(() => {
    if (!canSwitch) return;
    
    if (isExpanded) {
      onCollapse();
    } else {
      onExpand();
    }
  }, [canSwitch, isExpanded, onExpand, onCollapse]);

  // 长按手势处理（可以用于快速切换到上一个组织）
  const handleLongPress = useCallback(() => {
    if (!canSwitch) return;
    
    // 触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    // TODO: 实现快速切换到上一个组织的逻辑
  }, [canSwitch]);

  return {
    handleTap,
    handleLongPress,
  };
};

// ==================== 辅助Hook：键盘快捷键 ====================

export const useOrganizationSwitcherKeyboard = (switcher: UseOrganizationSwitcherReturn) => {
  // 移动端不支持键盘快捷键
};

export default useOrganizationSwitcher;