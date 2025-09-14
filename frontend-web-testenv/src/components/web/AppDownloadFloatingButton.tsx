/**
 * App下载浮动按钮组件 - iOS设备专用
 * 固定在Safari底部工具栏上方，监听视口变化自动调整位置
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import {
  detectDevice,
  shouldHideFloatingButton,
  createViewportListener,
  useViewportHeight
} from '../../utils/deviceDetection';
import { handleAppDownload, AppStoreRegion } from '../../utils/appPromoBanner';

interface AppDownloadFloatingButtonProps {
  style?: any;
}

export const AppDownloadFloatingButton: React.FC<AppDownloadFloatingButtonProps> = ({ style }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(useViewportHeight());
  const [isDetecting, setIsDetecting] = useState(false);

  // 监听路由变化
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e: any) => {
      if (e?.data?.state?.routes) {
        const route = e.data.state.routes[e.data.state.index];
        setCurrentRoute(route?.name || '');
      }
    });

    return unsubscribe;
  }, [navigation]);

  // 监听视口高度变化（iOS Safari专用）
  useEffect(() => {
    const device = detectDevice();

    if (!device.shouldShowAppBanner) {
      return;
    }

    // 创建视口监听器
    const cleanup = createViewportListener((height) => {
      setViewportHeight(height);
    });

    return cleanup;
  }, []);

  // 检查显示条件
  useEffect(() => {
    const device = detectDevice();

    const shouldShow = (
      device.shouldShowAppBanner && // 是iOS设备
      !shouldHideFloatingButton(currentRoute, modalVisible) // 不在排除页面
    );

    setIsVisible(shouldShow);
  }, [currentRoute, modalVisible]);

  // 处理点击事件（升级版 - 支持智能检测）
  const handlePress = useCallback(async () => {
    if (isDetecting) return; // 防止重复点击

    setIsDetecting(true);

    try {
      await handleAppDownload('floating_button');
    } catch (error) {
      console.error('❌ 浮动按钮下载失败:', error);
      // 这里可以添加错误处理逻辑，比如显示区域选择
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting]);

  // 不显示按钮
  if (!isVisible) {
    return null;
  }

  // 计算底部位置 - 适配iOS Safari地址栏变化
  const bottomOffset = Math.max(16, window.innerHeight - viewportHeight + 16);

  return (
    <View
      style={[
        styles.container,
        { bottom: bottomOffset },
        style
      ]}
    >
      <TouchableOpacity
        style={[styles.button, isDetecting && styles.buttonDetecting]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isDetecting}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            {isDetecting ? '⏳' : '🍊'}
          </Text>
        </View>

        {/* 文本 */}
        <Text style={styles.buttonText}>
          {isDetecting
            ? t('appDownload.floatingButton.detecting', '检测中...')
            : t('appDownload.floatingButton.text', 'APP内打开')
          }
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    position: 'fixed' as any,
    right: 16,
    zIndex: 9999,
    maxWidth: 200,
    // 确保不会被其他元素覆盖
    pointerEvents: 'auto' as any,
  },
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    // Web端特殊样式
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    }),
  },
  logoContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  logoText: {
    fontSize: 16,
    lineHeight: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  buttonDetecting: {
    opacity: 0.7,
    backgroundColor: theme.colors.text.secondary,
  },
};

// Web端CSS增强
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    .app-floating-button {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, opacity;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .app-floating-button:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
    }

    .app-floating-button:active {
      transform: translateY(0px) scale(0.98);
    }

    /* 适配不同屏幕尺寸 */
    @media (max-width: 480px) {
      .app-floating-button {
        right: 12px !important;
        bottom: 12px !important;
      }
    }

    @media (max-width: 320px) {
      .app-floating-button {
        padding: 8px 12px !important;
        font-size: 12px !important;
      }
    }

    /* 确保在所有浏览器中都有正确的堆叠顺序 */
    .app-floating-button {
      z-index: 999999 !important;
      position: fixed !important;
    }

    /* 处理与原生TabBar的层级关系 */
    .app-floating-button {
      pointer-events: auto !important;
    }

    /* iOS Safari特殊处理 */
    @supports (-webkit-appearance: none) {
      .app-floating-button {
        /* 在iOS Safari中确保不被底部工具栏覆盖 */
        bottom: max(16px, env(safe-area-inset-bottom, 16px)) !important;
      }
    }

    /* 暗色模式适配 */
    @media (prefers-color-scheme: dark) {
      .app-floating-button {
        background: rgba(255, 107, 44, 0.95) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
    }

    /* 减少动画，提升性能 */
    @media (prefers-reduced-motion: reduce) {
      .app-floating-button {
        transition: none !important;
      }
    }

    /* 高对比度模式支持 */
    @media (prefers-contrast: high) {
      .app-floating-button {
        border-width: 2px !important;
        border-color: #fff !important;
      }
    }
  `;

  // 添加样式到文档头部
  document.head.appendChild(style);

  // 监听DOM变化，确保样式类正确应用
  if (typeof window !== 'undefined') {
    const observer = new MutationObserver(() => {
      const buttons = document.querySelectorAll('[data-app-floating-button]');
      buttons.forEach(button => {
        if (!button.classList.contains('app-floating-button')) {
          button.classList.add('app-floating-button');
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 清理函数
    setTimeout(() => observer.disconnect(), 10000);
  }
}

export default AppDownloadFloatingButton;