import React, { useRef, useEffect } from 'react';
import { View, DeviceEventEmitter } from 'react-native';

interface GlobalTouchHandlerProps {
  children: React.ReactNode;
}

export const GlobalTouchHandler: React.FC<GlobalTouchHandlerProps> = ({ children }) => {
  const lastTouchTime = useRef(0);

  const emitGlobalTouch = () => {
    const now = Date.now();
    // 增强防抖处理，避免频繁触发AI按钮隐藏
    if (now - lastTouchTime.current > 300) {
      lastTouchTime.current = now;
      // 发送全局触摸事件
      DeviceEventEmitter.emit('globalTouch');
    }
  };

  // 使用onTouchStart监听触摸事件，不干扰正常的滚动和交互
  const handleTouchStart = () => {
    emitGlobalTouch();
  };

  // 监听滚动事件（由各个列表组件发出）
  useEffect(() => {
    const scrollListener = DeviceEventEmitter.addListener('globalScroll', () => {
      emitGlobalTouch();
    });

    return () => {
      scrollListener?.remove();
    };
  }, []);

  return (
    <View 
      style={{ flex: 1 }} 
      onTouchStart={handleTouchStart}
      // 设置为false确保不会阻止子组件的触摸事件
      
    >
      {children}
    </View>
  );
};