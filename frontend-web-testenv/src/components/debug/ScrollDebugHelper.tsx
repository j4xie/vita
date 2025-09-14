/**
 * Web端滚动调试助手
 * 
 * 在开发模式下显示页面滚动状态和调试信息
 * 帮助识别滚动问题的根源
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

interface ScrollDebugHelperProps {
  enabled?: boolean;
}

export const ScrollDebugHelper: React.FC<ScrollDebugHelperProps> = ({ 
  enabled = __DEV__ && Platform.OS === 'web' 
}) => {
  const [scrollInfo, setScrollInfo] = useState({
    windowHeight: 0,
    documentHeight: 0,
    scrollTop: 0,
    canScroll: false,
    webScrollContainers: 0,
    nativeScrollContainers: 0,
  });

  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    const updateScrollInfo = () => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const canScroll = documentHeight > windowHeight;

        // 检测我们的滚动容器
        const webScrollContainers = document.querySelectorAll('[data-web-scroll-container="true"]').length;
        const nativeScrollContainers = document.querySelectorAll('[class*="scrollView"], [class*="ScrollView"]').length;

        setScrollInfo({
          windowHeight,
          documentHeight,
          scrollTop,
          canScroll,
          webScrollContainers,
          nativeScrollContainers,
        });
      }
    };

    // 初始更新
    updateScrollInfo();

    // 监听滚动和窗口大小变化
    window.addEventListener('scroll', updateScrollInfo);
    window.addEventListener('resize', updateScrollInfo);

    // 定期更新（防止某些情况下事件不触发）
    const interval = setInterval(updateScrollInfo, 1000);

    return () => {
      window.removeEventListener('scroll', updateScrollInfo);
      window.removeEventListener('resize', updateScrollInfo);
      clearInterval(interval);
    };
  }, [enabled]);

  const applyScrollFix = () => {
    if (Platform.OS !== 'web') return;

    console.log('🔧 [SCROLL-DEBUG] 开始强制滚动修复...');

    // 修复根容器
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.height = 'auto';
      rootElement.style.minHeight = '100vh';
      rootElement.style.overflow = 'visible';
      console.log('✅ [SCROLL-DEBUG] 修复#root容器');
    }

    // 修复HTML和body
    document.documentElement.style.height = 'auto';
    document.documentElement.style.minHeight = '100vh';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    console.log('✅ [SCROLL-DEBUG] 修复html/body');

    // 查找并修复所有固定高度的容器
    const allDivs = document.querySelectorAll('div');
    let fixedCount = 0;
    allDivs.forEach(div => {
      const computedStyle = window.getComputedStyle(div);
      if (computedStyle.height === '100vh' || computedStyle.maxHeight === '100vh') {
        div.style.height = 'auto';
        div.style.minHeight = '100vh';
        div.style.overflow = 'visible';
        fixedCount++;
      }
    });
    
    console.log(`🔧 [SCROLL-DEBUG] 修复了${fixedCount}个固定高度容器`);
    
    // 强制重新计算布局
    document.body.style.display = 'none';
    document.body.offsetHeight; // 触发重新计算
    document.body.style.display = '';
    
    console.log('✅ [SCROLL-DEBUG] 滚动修复完成');
  };

  const addDebugStyles = () => {
    if (Platform.OS !== 'web') return;

    // 添加调试样式类
    document.body.classList.toggle('debug-scroll');
    console.log('🎨 [SCROLL-DEBUG] 切换调试样式');
  };

  if (!enabled) return null;

  return (
    <View style={{
      position: 'absolute' as const,
      top: 10,
      right: 10,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 8,
      borderRadius: 8,
    }}>
      <TouchableOpacity 
        onPress={() => setShowDebug(!showDebug)}
        style={{ marginBottom: 4 }}
      >
        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
          📊 滚动调试
        </Text>
      </TouchableOpacity>

      {showDebug && (
        <View style={{ minWidth: 200 }}>
          <Text style={{ color: 'white', fontSize: 10 }}>
            窗口高度: {scrollInfo.windowHeight}px
          </Text>
          <Text style={{ color: 'white', fontSize: 10 }}>
            文档高度: {scrollInfo.documentHeight}px
          </Text>
          <Text style={{ color: 'white', fontSize: 10 }}>
            滚动位置: {scrollInfo.scrollTop}px
          </Text>
          <Text style={{ 
            color: scrollInfo.canScroll ? 'green' : 'red', 
            fontSize: 10,
            fontWeight: 'bold'
          }}>
            可滚动: {scrollInfo.canScroll ? '是' : '否'}
          </Text>
          <Text style={{ color: 'cyan', fontSize: 10 }}>
            Web容器: {scrollInfo.webScrollContainers}个
          </Text>
          <Text style={{ color: 'yellow', fontSize: 10 }}>
            RN容器: {scrollInfo.nativeScrollContainers}个
          </Text>

          <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
            <TouchableOpacity 
              onPress={applyScrollFix}
              style={{ 
                backgroundColor: 'blue', 
                padding: 4, 
                borderRadius: 4,
                flex: 1,
              }}
            >
              <Text style={{ color: 'white', fontSize: 10, textAlign: 'center' }}>
                修复滚动
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={addDebugStyles}
              style={{ 
                backgroundColor: 'purple', 
                padding: 4, 
                borderRadius: 4,
                flex: 1,
              }}
            >
              <Text style={{ color: 'white', fontSize: 10, textAlign: 'center' }}>
                调试样式
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ScrollDebugHelper;