/* Web端特定版本 - 与App端隔离 */
/**
 * 🎨 Toast管理器组件
 * 监听Toast事件并显示LiquidToast
 */

import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import LiquidToast from './LiquidToast';
import { ToastMessage } from '../../services/toastService';

export const ToastManager: React.FC = () => {
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    // 监听显示Toast事件
    const showToastListener = DeviceEventEmitter.addListener(
      'showToast',
      (toast: ToastMessage) => {
        setCurrentToast(toast);
      }
    );

    // 监听隐藏所有Toast事件
    const hideAllListener = DeviceEventEmitter.addListener(
      'hideAllToasts',
      () => {
        setCurrentToast(null);
      }
    );

    return () => {
      showToastListener.remove();
      hideAllListener.remove();
    };
  }, []);

  const handleToastHide = () => {
    setCurrentToast(null);
  };

  return (
    <LiquidToast
      visible={!!currentToast}
      title={currentToast?.title || ''}
      message={currentToast?.message || ''}
      type={currentToast?.type || 'info'}
      duration={currentToast?.duration}
      onHide={handleToastHide}
    />
  );
};

export default ToastManager;