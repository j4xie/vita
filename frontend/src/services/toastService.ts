/**
 * 🎨 Toast服务 - 替换系统Alert
 * 提供优雅的非阻塞通知体验
 */

import { DeviceEventEmitter } from 'react-native';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

class ToastService {
  private toastCounter = 0;

  /**
   * 显示成功Toast
   */
  success(title: string, message: string, duration?: number) {
    this.show({
      title,
      message,
      type: 'success',
      duration,
    });
  }

  /**
   * 显示警告Toast
   */
  warning(title: string, message: string, duration?: number) {
    this.show({
      title,
      message,
      type: 'warning',
      duration,
    });
  }

  /**
   * 显示错误Toast
   */
  error(title: string, message: string, duration?: number) {
    this.show({
      title,
      message,
      type: 'error',
      duration,
    });
  }

  /**
   * 显示信息Toast
   */
  info(title: string, message: string, duration?: number) {
    this.show({
      title,
      message,
      type: 'info',
      duration,
    });
  }

  /**
   * 显示Toast
   */
  private show(toast: Omit<ToastMessage, 'id'>) {
    const id = `toast_${++this.toastCounter}_${Date.now()}`;
    
    const toastMessage: ToastMessage = {
      id,
      ...toast,
      duration: toast.duration || 3000,
    };

    // 发送事件给Toast管理器
    DeviceEventEmitter.emit('showToast', toastMessage);
  }

  /**
   * 隐藏所有Toast
   */
  hideAll() {
    DeviceEventEmitter.emit('hideAllToasts');
  }
}

// 导出单例
export const toastService = new ToastService();
export default toastService;