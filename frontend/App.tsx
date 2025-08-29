import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme';
import initI18next, { i18n } from './src/utils/i18n';
import { AppNavigator } from './src/navigation/AppNavigator';

// 导入时间管理服务
import { timeManager, validateDeviceTime } from './src/services/timeManager';

// 开发环境导入测试工具
if (__DEV__) {
  // 导入志愿者测试套件
  require('./src/utils/volunteerTestSuite');
  // 导入时间冲突检测器
  require('./src/utils/timeConflictDetector');
  console.log('🧪 测试工具已加载');
}

function MainApp() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[INIT] 初始化应用...');
        
        // 1. 验证设备时间
        const timeValidation = await validateDeviceTime();
        if (!timeValidation.isValid) {
          console.warn('[TIME-WARNING]', timeValidation.warning);
          // TODO: 可以考虑显示用户警告弹窗
          // Alert.alert('时间警告', timeValidation.warning);
        } else {
          console.log('[TIME] 设备时间验证通过');
        }
        
        // 2. 初始化i18n系统
        console.log('[I18N] 初始化i18n系统...');
        await initI18next();
        console.log('[SUCCESS] i18n初始化完成，当前语言:', i18n.language);
        
        // 3. 确保时间管理器运行
        console.log('[TIME] 全局时间管理器已启用');
        
        setIsI18nReady(true);
      } catch (error) {
        console.error('[ERROR] 应用初始化失败:', error);
        // 即使失败也继续运行，保证应用可用性
        setIsI18nReady(true);
      }
    };

    initializeApp();
    
    // 应用退出时清理时间管理器
    return () => {
      timeManager.cleanup();
    };
  }, []);

  if (!isI18nReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
正在启动应用...
          </Text>
          <Text style={[styles.subtext, { color: theme.colors.text.secondary }]}>
            初始化国际化系统
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return <MainApp />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    marginBottom: 20,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '500',
  },
});