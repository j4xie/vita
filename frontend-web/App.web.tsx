// Web版本的App入口 - 移除不兼容的原生功能
import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme';
import initI18next from './src/utils/i18n';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ToastManager } from './src/components/common/ToastManager';

// Web端全局CSS样式注入 + 禁用浏览器扩展错误
if (Platform.OS === 'web') {
  // 禁用Chrome扩展错误日志
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    // 过滤扩展相关错误
    if (message.includes('chrome-extension://') ||
        message.includes('ERR_FILE_NOT_FOUND') ||
        message.includes('completion_list.html') ||
        message.includes('heuristicsRedefinitions.js')) {
      return; // 不显示扩展错误
    }
    originalConsoleError.apply(console, args);
  };

  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow-x: hidden; /* 禁用水平滚动 */
      overflow-y: auto; /* 允许垂直滚动 */
      background-color: #f8f9fa;
      font-size: 16px;
    }
    #root {
      width: 100vw;
      height: 100vh;
      overflow-x: hidden; /* 彻底禁用水平滚动 */
      overflow-y: auto; /* 只允许垂直滚动 */
      display: flex;
      flex-direction: column;
      max-width: 100vw; /* 防止内容超出视口 */
      position: relative;
    }
    
    /* 响应式断点 */
    @media (min-width: 768px) {
      #root {
        /* 平板端优化 */
        font-size: 18px;
      }
    }
    
    @media (min-width: 1024px) {
      #root {
        /* 桌面端优化 */
        font-size: 16px;
        background-color: #f5f6f8;
      }
    }
  `;
  document.head.appendChild(style);
}

// Web版本的简化App组件
export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 初始化国际化
        await initI18next();
        setIsI18nReady(true);
        
        console.log('🌐 PomeloX Web版本启动成功');
      } catch (error: any) {
        console.error('❌ 应用初始化失败:', error);
        setAppError(error.message || '应用启动失败');
      }
    };

    initializeApp();
  }, []);

  // 应用初始化错误
  if (appError) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>应用启动失败</Text>
          <Text style={styles.errorMessage}>{appError}</Text>
          <Text style={styles.errorHint}>请刷新页面重试</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // 国际化未就绪
  if (!isI18nReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>PomeloX 加载中...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <ToastManager />
    </SafeAreaProvider>
  );
}

const styles = {
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.danger,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
};