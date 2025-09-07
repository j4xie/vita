// Web版本的App入口 - 移除不兼容的原生功能
import React, { useEffect, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme';
import initI18next from './src/utils/i18n';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ToastManager } from './src/components/common/ToastManager';

// Web版本的简化App组件
export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 🌐 Web端CSS重置 - 禁用滚动和移动
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const style = document.createElement('style');
          style.textContent = `
            html, body, #root {
              margin: 0 !important;
              padding: 0 !important;
              height: 100% !important;
              overflow: hidden !important;
              position: fixed !important;
              width: 100% !important;
              top: 0 !important;
              left: 0 !important;
              touch-action: none !important;
              -webkit-overflow-scrolling: none !important;
            }
            
            /* 防止整个页面被拖拽 */
            * {
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
              user-select: none !important;
              -webkit-touch-callout: none !important;
              -webkit-tap-highlight-color: transparent !important;
            }
          `;
          document.head.appendChild(style);
        }
        
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
      <View style={styles.webContainer}>
        <AppNavigator />
        <ToastManager />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Web端固定容器 - 防止滚动和移动
  webContainer: {
    flex: 1,
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: theme.colors.background.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
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
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});