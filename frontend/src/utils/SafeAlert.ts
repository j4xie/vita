/**
 * SafeAlert - React Native Alert wrapper
 * 移动端专用，直接使用React Native Alert
 */

import { Alert, AlertButton } from 'react-native';

export const SafeAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    Alert.alert(title, message, buttons);
  }
};