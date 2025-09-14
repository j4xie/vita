// Web-compatible Haptics wrapper (无expo-haptics依赖版本)
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
    Light: string;
    Medium: string;
    Heavy: string;
  };
  NotificationFeedbackType: {
    Success: string;
    Warning: string;
    Error: string;
  };
}

// Create web-compatible haptics (纯Web端实现，无expo依赖)
export const WebHaptics: WebHaptics = {
  impactAsync: async (style: any) => {
    // Web端无触觉反馈，静默处理
    console.debug('WebHaptics: impact feedback (web silent)');
    return Promise.resolve();
  },

  impact: (style: any) => {
    // Web端无触觉反馈，静默处理
    console.debug('WebHaptics: impact feedback (web silent)');
  },

  selectionAsync: async () => {
    // Web端无触觉反馈，静默处理
    console.debug('WebHaptics: selection feedback (web silent)');
    return Promise.resolve();
  },

  notificationAsync: async (type: any) => {
    // Web端无触觉反馈，静默处理
    console.debug('WebHaptics: notification feedback (web silent)');
    return Promise.resolve();
  },

  success: () => {
    // Web端无触觉反馈，静默处理
    console.debug('WebHaptics: success feedback (web silent)');
  },

  error: () => {
    // Web端无触觉反馈，静默处理
    console.debug('WebHaptics: error feedback (web silent)');
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