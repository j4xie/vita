// Web-compatible Haptics wrapper
import { Platform } from 'react-native';

// Web-compatible haptics interface
interface WebHaptics {
  impactAsync: (style: any) => Promise<void>;
  impact: (style: any) => void; // 同步版本用于向后兼容
  selectionAsync: () => Promise<void>;
  notificationAsync: (type: any) => Promise<void>;
  success: () => void; // 成功反馈
  error: () => void; // 错误反馈
  ImpactFeedbackStyle: {
    Light: any;
    Medium: any;
    Heavy: any;
  };
  NotificationFeedbackType: {
    Success: any;
    Warning: any;
    Error: any;
  };
}

// Create web-compatible haptics
export const WebHaptics: WebHaptics = {
  impactAsync: async (style: any) => {
    if (Platform.OS === 'web') {
      // Web platform - no haptic feedback available
      return Promise.resolve();
    }
    
    try {
      const Haptics = require('expo-haptics');
      return await Haptics.impactAsync(style);
    } catch (error) {
      console.warn('Haptics not available:', error);
      return Promise.resolve();
    }
  },

  impact: (style: any) => {
    if (Platform.OS === 'web') {
      // Web platform - no haptic feedback available
      return;
    }
    
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(style).catch(() => {
        // Ignore errors in fire-and-forget mode
      });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  selectionAsync: async () => {
    if (Platform.OS === 'web') {
      return Promise.resolve();
    }
    
    try {
      const Haptics = require('expo-haptics');
      return await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptics not available:', error);
      return Promise.resolve();
    }
  },

  notificationAsync: async (type: any) => {
    if (Platform.OS === 'web') {
      return Promise.resolve();
    }
    
    try {
      const Haptics = require('expo-haptics');
      return await Haptics.notificationAsync(type);
    } catch (error) {
      console.warn('Haptics not available:', error);
      return Promise.resolve();
    }
  },

  success: () => {
    if (Platform.OS === 'web') {
      return;
    }
    
    try {
      const Haptics = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        // Ignore errors in fire-and-forget mode
      });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  error: () => {
    if (Platform.OS === 'web') {
      return;
    }
    
    try {
      const Haptics = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
        // Ignore errors in fire-and-forget mode
      });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  // Constants that work across platforms
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium', 
    Heavy: 'heavy',
  },

  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
};