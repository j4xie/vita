/**
 * TabBar状态守护Hook
 * 
 * 防止在页面跳转、返回等场景中TabBar意外激活
 * 
 * 🛡️ 保护机制：
 * - 页面跳转时立即检查并强制隐藏TabBar
 * - 返回时验证目标页面是否应该显示TabBar
 * - 防止导航状态混乱导致的TabBar闪烁
 * 
 * 使用场景：
 * - 需要跳转到详情页的组件
 * - 需要保护TabBar状态的关键页面
 */

import { useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { shouldShowTabBar, mustHideTabBar } from '../config/tabBarConfig';

interface TabBarStateGuardOptions {
  currentRouteName: string;
  debugLogs?: boolean;
}

export const useTabBarStateGuard = (options: TabBarStateGuardOptions) => {
  const navigation = useNavigation();
  const { currentRouteName, debugLogs = true } = options;

  // 🛡️ 强制验证当前页面的TabBar状态
  const enforceTabBarState = useCallback(() => {
    const mustHide = mustHideTabBar(currentRouteName);
    const shouldShow = !mustHide && shouldShowTabBar(currentRouteName);
    
    if (debugLogs) {
      console.log('🛡️ [TAB-GUARD] 强制验证TabBar状态:', {
        currentRouteName,
        mustHide,
        shouldShow,
        action: shouldShow ? '确保显示' : '确保隐藏'
      });
    }

    // 🚨 关键：直接设置父级导航的tabBarStyle，确保状态正确
    try {
      const parentNav = navigation.getParent();
      if (parentNav && parentNav.setOptions) {
        parentNav.setOptions({
          tabBarStyle: { display: shouldShow ? 'flex' : 'none' }
        });
      }
    } catch (error) {
      console.warn('⚠️ [TAB-GUARD] 无法访问父级导航器:', error);
    }
  }, [currentRouteName, navigation, debugLogs]);

  // 🎯 安全跳转函数：跳转前验证TabBar状态
  const safeNavigate = useCallback((screenName: string, params?: any) => {
    if (debugLogs) {
      console.log('🚀 [TAB-GUARD] 安全跳转:', { from: currentRouteName, to: screenName });
    }

    // 1. 立即检查目标页面是否需要隐藏TabBar
    const targetMustHide = mustHideTabBar(screenName);
    if (targetMustHide) {
      try {
        const parentNav = navigation.getParent();
        if (parentNav && parentNav.setOptions) {
          parentNav.setOptions({
            tabBarStyle: { display: 'none' }
          });
        }
      } catch (error) {
        console.warn('⚠️ [TAB-GUARD] 无法访问父级导航器:', error);
      }
    }

    // 2. 执行跳转
    (navigation as any).navigate(screenName, params);
  }, [currentRouteName, navigation, debugLogs]);

  // 🔄 页面焦点时验证TabBar状态
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (debugLogs) {
        console.log('👁️ [TAB-GUARD] 页面获得焦点，验证TabBar状态');
      }
      
      // 延迟验证，确保导航状态已更新
      setTimeout(() => {
        enforceTabBarState();
      }, 50);
    });

    return unsubscribe;
  }, [navigation, enforceTabBarState, debugLogs]);

  // 📱 页面失去焦点时的清理
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (debugLogs) {
        console.log('🌫️ [TAB-GUARD] 页面失去焦点');
      }
    });

    return unsubscribe;
  }, [navigation, debugLogs]);

  return {
    enforceTabBarState,
    safeNavigate,
  };
};

/**
 * 轻量级TabBar状态验证Hook
 * 用于不需要完整守护功能的页面
 */
export const useTabBarVerification = (routeName: string, options?: {
  enabled?: boolean;
  debugLogs?: boolean;
}) => {
  const navigation = useNavigation();
  const { enabled = true, debugLogs = false } = options || {};

  useEffect(() => {
    // 如果被禁用，直接返回
    if (!enabled) return;
    
    let retryAttempts = 0;
    const maxRetries = 3;
    
    const verifyAndSetTabBarState = () => {
      const mustHide = mustHideTabBar(routeName);
      const shouldShow = !mustHide && shouldShowTabBar(routeName);
      
      if (debugLogs) {
        console.log('🚨 [TAB-VERIFY] 强制验证页面TabBar状态:', {
          routeName,
          mustHide,
          shouldShow,
          finalState: shouldShow ? 'flex' : 'none',
          attempt: retryAttempts + 1
        });
      }

      try {
        const parentNav = navigation.getParent();
        if (parentNav && typeof parentNav.setOptions === 'function') {
          if (debugLogs) {
            console.log('🛠️ [TAB-VERIFY] 设置父级导航TabBar样式:', {
              display: shouldShow ? 'flex' : 'none'
            });
          }
          
          // 🔄 Web端兼容性修复：明确设置TabBar显示状态
          if (shouldShow) {
            // Web端需要明确设置display: 'flex'，而非undefined
            parentNav.setOptions({
              tabBarStyle: { display: 'flex' }
            });
          } else {
            parentNav.setOptions({
              tabBarStyle: { display: 'none' }
            });
          }
          return true; // 成功
        } else {
          // 如果还有重试次数，则静默等待
          if (retryAttempts < maxRetries) {
            if (debugLogs) {
              console.log(`🔄 [TAB-VERIFY] 父级导航器未就绪，等待重试 (${retryAttempts + 1}/${maxRetries + 1})`);
            }
            return false; // 需要重试
          } else {
            // 只有在调试模式下才显示警告
            if (debugLogs) {
              console.warn('⚠️ [TAB-VERIFY] 父级导航器持续不可用，放弃设置');
            }
            return true; // 放弃重试
          }
        }
      } catch (error) {
        if (retryAttempts < maxRetries) {
          if (debugLogs) {
            console.log(`🔄 [TAB-VERIFY] 导航器访问异常，等待重试 (${retryAttempts + 1}/${maxRetries + 1})`);
          }
          return false; // 需要重试
        } else {
          // 只有在调试模式下才显示警告
          if (debugLogs) {
            console.warn('⚠️ [TAB-VERIFY] 导航器持续异常，放弃设置:', error);
          }
          return true; // 放弃重试
        }
      }
    };

    const attemptVerification = () => {
      const success = verifyAndSetTabBarState();
      
      if (!success && retryAttempts < maxRetries) {
        retryAttempts++;
        // 指数退避重试：100ms, 200ms, 400ms
        const delay = Math.pow(2, retryAttempts) * 50;
        setTimeout(attemptVerification, delay);
      }
    };

    // 立即验证
    if (debugLogs) {
      console.log('⚡ [TAB-VERIFY] 立即执行TabBar状态验证...');
    }
    attemptVerification();

    // 监听导航状态变化
    const unsubscribe = navigation.addListener('focus', () => {
      if (debugLogs) {
        console.log('👁️ [TAB-VERIFY] 页面获得焦点，重新验证TabBar状态...');
      }
      retryAttempts = 0; // 重置重试次数
      attemptVerification();
    });
    
    return () => {
      unsubscribe();
    };
  }, [routeName, navigation, enabled, debugLogs]);
};