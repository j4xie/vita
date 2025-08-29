/**
 * 统一的TabBar隐藏Hook
 * 
 * 解决TabBar隐藏机制不一致的问题，确保所有需要隐藏TabBar的页面使用相同的实现方式
 * 
 * 使用方式：
 * ```typescript
 * import { useTabBarHide } from '../hooks/useTabBarHide';
 * 
 * // 在需要隐藏TabBar的页面组件中调用
 * export const SomeScreen = () => {
 *   useTabBarHide(); // 自动处理TabBar的显示/隐藏
 *   // 其他组件逻辑...
 * }
 * ```
 */

import { useEffect } from 'react';
import { DeviceEventEmitter, Keyboard } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React from 'react';

export const useTabBarHide = (options?: {
  hideOnKeyboard?: boolean; // 是否在键盘弹出时隐藏，默认true
  debugLogs?: boolean; // 是否输出调试日志，默认true
}) => {
  const navigation = useNavigation();
  const { hideOnKeyboard = true, debugLogs = true } = options || {};

  // 主要的TabBar隐藏机制：使用DeviceEventEmitter + useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      // 进入页面时隐藏TabBar
      DeviceEventEmitter.emit('hideTabBar', true);
      if (debugLogs) {
        console.log('[TAB-HIDE] 进入页面，隐藏TabBar');
      }

      return () => {
        // 离开页面时显示TabBar
        DeviceEventEmitter.emit('hideTabBar', false);
        if (debugLogs) {
          console.log('[TAB-SHOW] 离开页面，显示TabBar');
        }
      };
    }, [debugLogs])
  );

  // 备用机制：通过navigation.setOptions隐藏TabBar（兼容某些edge case）
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' },
    });
  }, [navigation]);

  // 键盘监听机制（可选）
  useEffect(() => {
    if (!hideOnKeyboard) return;

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // 键盘弹出时确保TabBar保持隐藏
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
      DeviceEventEmitter.emit('hideTabBar', true);
      if (debugLogs) {
        console.log('[TAB-HIDE] 键盘弹出，保持TabBar隐藏');
      }
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // 键盘收起时在当前页面依然保持TabBar隐藏
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
      DeviceEventEmitter.emit('hideTabBar', true);
      if (debugLogs) {
        console.log('[TAB-HIDE] 键盘收起，保持TabBar隐藏');
      }
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [navigation, hideOnKeyboard, debugLogs]);
};

/**
 * 仅显示TabBar的Hook（用于主页面）
 * 在某些场景下需要确保TabBar显示
 */
export const useTabBarShow = (options?: {
  debugLogs?: boolean;
}) => {
  const { debugLogs = true } = options || {};

  useFocusEffect(
    React.useCallback(() => {
      // 进入页面时显示TabBar
      DeviceEventEmitter.emit('hideTabBar', false);
      if (debugLogs) {
        console.log('[TAB-SHOW] 进入主页面，显示TabBar');
      }

      // 主页面通常不需要在离开时隐藏TabBar
      return () => {
        if (debugLogs) {
          console.log('[TAB-SHOW] 离开主页面');
        }
      };
    }, [debugLogs])
  );
};