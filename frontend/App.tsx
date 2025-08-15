import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme';
import initI18next, { i18n } from './src/utils/i18n';
import { AppNavigator } from './src/navigation/AppNavigator';

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
    const initializeI18n = async () => {
      try {
        console.log('🚀 初始化VitaGlobal应用...');
        console.log('🌐 初始化i18n系统...');
        await initI18next();
        console.log('✅ i18n初始化完成，当前语言:', i18n.language);
        setIsI18nReady(true);
      } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        // 即使失败也继续运行，保证应用可用性
        setIsI18nReady(true);
      }
    };

    initializeI18n();
  }, []);

  if (!isI18nReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
            🔄 正在启动西柚...
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
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