/**
 * Web端原生滚动容器
 * 
 * 完全绕过React Native Web的滚动限制
 * 使用原生HTML元素确保滚动正常工作
 */

import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

interface WebScrollContainerProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const WebScrollContainer: React.FC<WebScrollContainerProps> = ({
  children,
  style = {},
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    const container = containerRef.current;

    // 强制设置原生滚动属性
    const forceScrollable = () => {
      // 设置容器样式
      container.style.height = 'auto';
      container.style.minHeight = '100vh';
      container.style.overflow = 'visible';
      container.style.overflowY = 'auto';
      container.style.WebkitOverflowScrolling = 'touch';
      container.style.position = 'relative';
      
      // 确保父级也是可滚动的
      let parent = container.parentElement;
      while (parent && parent !== document.body) {
        if (parent.style.height === '100vh') {
          parent.style.height = 'auto';
          parent.style.minHeight = '100vh';
        }
        if (parent.style.overflow === 'hidden') {
          parent.style.overflow = 'visible';
        }
        parent = parent.parentElement;
      }
    };

    // 立即执行
    forceScrollable();

    // 监听DOM变化，确保样式不被覆盖
    const observer = new MutationObserver(forceScrollable);
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // 监听窗口大小变化
    const handleResize = () => {
      requestAnimationFrame(forceScrollable);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (Platform.OS !== 'web') {
    // 非Web平台返回children包装在View中
    return <>{children}</>;
  }

  const defaultStyle: React.CSSProperties = {
    width: '100%', // 🔧 使用100%而非100vw，避免水平滚动
    minHeight: '100vh',
    height: 'auto',
    overflowX: 'hidden', // 🔧 禁止水平滚动
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    position: 'relative',
    ...style,
  };

  return (
    <div
      ref={containerRef}
      style={defaultStyle}
      className={className}
      data-web-scroll-container="true"
    >
      {children}
    </div>
  );
};

export default WebScrollContainer;