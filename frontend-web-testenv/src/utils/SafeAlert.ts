/**
 * SafeAlert - Web兼容的Alert替代方案
 * Web端使用浏览器原生alert/confirm，Native使用React Native Alert
 */

import { Alert, AlertButton, Platform } from 'react-native';

interface SafeAlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export const SafeAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (Platform.OS === 'web') {
      // Web端处理
      const fullMessage = message ? `${title}\n\n${message}` : title;
      
      if (!buttons || buttons.length === 0) {
        // 简单alert
        window.alert(fullMessage);
      } else if (buttons.length === 1) {
        // 单按钮alert
        window.alert(fullMessage);
        const button = buttons[0];
        if (button.onPress) {
          setTimeout(() => button.onPress?.(), 100);
        }
      } else {
        // 多按钮处理 - 使用confirm
        const confirmed = window.confirm(fullMessage);
        const actionButton = buttons.find(btn => btn.style !== 'cancel');
        const cancelButton = buttons.find(btn => btn.style === 'cancel');
        
        if (confirmed && actionButton?.onPress) {
          setTimeout(() => actionButton.onPress?.(), 100);
        } else if (!confirmed && cancelButton?.onPress) {
          setTimeout(() => cancelButton.onPress?.(), 100);
        }
      }
    } else {
      // Native端使用React Native Alert
      Alert.alert(title, message, buttons);
    }
  }
};

export default SafeAlert;