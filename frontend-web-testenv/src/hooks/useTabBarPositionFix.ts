import { useEffect, useRef } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Web端TabBar位置修复Hook
 * 处理用户完成注册/报名等操作后的TabBar位置校准
 */
export const useTabBarPositionFix = () => {
  const lastScrollPosition = useRef(0);
  const positionFixTimeout = useRef<NodeJS.Timeout | null>(null);

  // 🔧 页面聚焦时校准TabBar位置
  useFocusEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // 延迟执行，确保页面完全加载
    const timeout = setTimeout(() => {
      console.log('🔧 [TABBAR-POSITION] 页面聚焦，校准TabBar位置');
      forceTabBarPositionFix();
    }, 300);
    
    return () => {
      clearTimeout(timeout);
    };
  });

  // 🎯 强制TabBar位置修复
  const forceTabBarPositionFix = () => {
    if (Platform.OS !== 'web') return;
    
    try {
      // 检查是否存在TabBar元素
      const tabBarElements = document.querySelectorAll('[data-testid="custom-tab-bar"]');
      
      tabBarElements.forEach((tabBar: any) => {
        if (tabBar && tabBar.style) {
          console.log('🔧 [TABBAR-POSITION] 强制修复TabBar位置样式');
          
          // 确保使用固定定位
          tabBar.style.position = 'fixed';
          tabBar.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
          tabBar.style.left = '16px';
          tabBar.style.right = '16px';
          tabBar.style.zIndex = '9999';
          
          // 强制重新渲染
          tabBar.style.transform = 'translateZ(0)';
          
          console.log('✅ [TABBAR-POSITION] TabBar位置已修复');
        }
      });
    } catch (error) {
      console.warn('⚠️ [TABBAR-POSITION] 修复TabBar位置时出错:', error);
    }
  };

  // 🌐 监听页面滚动，防止TabBar位置漂移
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleScroll = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      
      // 如果滚动距离变化很大，重新校准TabBar
      if (Math.abs(currentScroll - lastScrollPosition.current) > 100) {
        if (positionFixTimeout.current) {
          clearTimeout(positionFixTimeout.current);
        }
        
        positionFixTimeout.current = setTimeout(() => {
          forceTabBarPositionFix();
        }, 150);
        
        lastScrollPosition.current = currentScroll;
      }
    };
    
    // 使用被动监听器提高性能
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (positionFixTimeout.current) {
        clearTimeout(positionFixTimeout.current);
      }
    };
  }, []);

  // 🎬 监听用户操作完成事件
  useEffect(() => {
    const handleUserActionCompleted = (eventData: any) => {
      console.log('🎬 [TABBAR-POSITION] 用户操作完成，校准TabBar位置:', eventData);
      
      // 延迟执行，确保页面转换完成
      setTimeout(() => {
        forceTabBarPositionFix();
      }, 500);
    };
    
    // 监听注册完成事件
    const registrationCompleteSubscription = DeviceEventEmitter.addListener(
      'registrationCompleted',
      handleUserActionCompleted
    );
    
    // 监听活动报名完成事件
    const activityRegistrationSubscription = DeviceEventEmitter.addListener(
      'activityRegistrationCompleted',
      handleUserActionCompleted
    );
    
    // 监听页面跳转事件
    const navigationCompleteSubscription = DeviceEventEmitter.addListener(
      'navigationCompleted',
      handleUserActionCompleted
    );
    
    return () => {
      registrationCompleteSubscription?.remove();
      activityRegistrationSubscription?.remove();
      navigationCompleteSubscription?.remove();
    };
  }, []);

  return {
    forceTabBarPositionFix,
  };
};