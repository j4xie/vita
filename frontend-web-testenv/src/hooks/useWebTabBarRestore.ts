/**
 * Web端TabBar状态恢复钩子
 * 
 * 专门解决Web端点击活动卡片进入详情页后退出来TabBar无法恢复显示的问题
 * 
 * 🌐 Web端特殊处理：
 * - React Navigation在Web端对tabBarStyle的处理与原生不同
 * - 需要明确设置display: 'flex'而非undefined
 * - 需要处理导航状态更新的时序问题
 */

import { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { shouldShowTabBar, mustHideTabBar } from '../config/tabBarConfig';

interface WebTabBarRestoreOptions {
  routeName: string;
  forceRestore?: boolean; // 强制恢复TabBar显示
  debugLogs?: boolean;
}

export const useWebTabBarRestore = (options: WebTabBarRestoreOptions) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { routeName, forceRestore = false, debugLogs = false } = options;

  useEffect(() => {
    // 延迟执行以确保导航状态已完全更新
    const restoreTabBar = () => {
      try {
        const mustHide = mustHideTabBar(routeName);
        const shouldShow = !mustHide && shouldShowTabBar(routeName);
        
        // 如果设置了强制恢复，且页面应该显示TabBar，则强制恢复
        const finalShouldShow = forceRestore || shouldShow;
        
        if (debugLogs) {
          console.log('🌐 [WEB-TABBAR-RESTORE] 执行Web端TabBar恢复:', {
            routeName,
            mustHide,
            shouldShow,
            forceRestore,
            finalShouldShow,
            timestamp: new Date().toISOString()
          });
        }

        // 获取Tab导航器引用
        const tabNavigator = navigation.getParent();
        if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
          // 🌐 Web端关键修复：明确设置display属性
          tabNavigator.setOptions({
            tabBarStyle: {
              display: finalShouldShow ? 'flex' : 'none',
              // 添加其他必要的样式以确保正确显示
              ...(finalShouldShow && {
                position: 'absolute' as const,
                bottom: 0,
                left: 0,
                right: 0,
                elevation: 0,
                borderTopWidth: 0,
              })
            }
          });

          if (debugLogs) {
            console.log('✅ [WEB-TABBAR-RESTORE] TabBar状态已更新:', {
              display: finalShouldShow ? 'flex' : 'none'
            });
          }
        } else {
          if (debugLogs) {
            console.warn('⚠️ [WEB-TABBAR-RESTORE] 无法访问Tab导航器');
          }
        }
      } catch (error) {
        if (debugLogs) {
          console.error('🚨 [WEB-TABBAR-RESTORE] 恢复TabBar失败:', error);
        }
      }
    };

    // 立即执行一次
    restoreTabBar();

    // 监听路由焦点变化
    const focusUnsubscribe = navigation.addListener('focus', () => {
      if (debugLogs) {
        console.log('👁️ [WEB-TABBAR-RESTORE] 页面获得焦点，重新检查TabBar状态');
      }
      // 延迟执行以确保状态更新完成
      setTimeout(restoreTabBar, 100);
    });

    // 监听导航状态变化
    const stateUnsubscribe = navigation.addListener('state', () => {
      if (debugLogs) {
        console.log('🔄 [WEB-TABBAR-RESTORE] 导航状态变化，重新检查TabBar状态');
      }
      setTimeout(restoreTabBar, 50);
    });

    // 清理监听器
    return () => {
      focusUnsubscribe();
      stateUnsubscribe();
    };
  }, [navigation, routeName, forceRestore, debugLogs]);

  // 提供手动恢复函数
  const manualRestore = () => {
    try {
      const tabNavigator = navigation.getParent();
      if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
        tabNavigator.setOptions({
          tabBarStyle: {
            display: 'flex',
            position: 'absolute' as const,
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            borderTopWidth: 0,
          }
        });
        
        if (debugLogs) {
          console.log('🔧 [WEB-TABBAR-RESTORE] 手动恢复TabBar成功');
        }
      }
    } catch (error) {
      if (debugLogs) {
        console.error('🚨 [WEB-TABBAR-RESTORE] 手动恢复失败:', error);
      }
    }
  };

  return { manualRestore };
};