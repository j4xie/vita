// Web-compatible Haptics wrapper
import { Platform } from 'react-native';

// Web-compatible haptics interface
interface WebHaptics {
  impactAsync: (style: any) => Promise<void>;
  selectionAsync: () => Promise<void>;
  notificationAsync: (type: any) => Promise<void>;
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