/**
 * SafeAlert - 避免Text渲染错误的Alert替代方案
 * 开发环境使用console.log，生产环境使用原生Alert
 */

import { Alert, AlertButton } from 'react-native';

interface SafeAlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export const SafeAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (__DEV__) {
      // 开发环境：使用console.log，避免Text渲染错误
      console.log(`[ALERT] ${title}: ${message || ''}`);
      
      // 如果有按钮，自动执行第一个非取消按钮的onPress
      if (buttons && buttons.length > 0) {
        const actionButton = buttons.find(btn => btn.style !== 'cancel');
        if (actionButton && actionButton.onPress) {
          // 延迟执行，模拟用户点击
          setTimeout(() => {
            actionButton.onPress?.();
          }, 500);
        }
      }
    } else {
      // 生产环境：使用原生Alert
      Alert.alert(title, message, buttons);
    }
  }
};

export default SafeAlert;