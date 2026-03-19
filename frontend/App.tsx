import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_600SemiBold, IBMPlexMono_700Bold } from '@expo-google-fonts/ibm-plex-mono';
import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
// Stripe SDK 需要原生模块，在 Expo Go 中不可用，做懒加载
let StripeProvider: any = null;
try {
  StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
} catch (e) {
  console.log('[App] Stripe SDK 原生模块不可用，支付功能将禁用');
}
import { TextEncoder, TextDecoder } from 'text-encoding';

import { AppNavigator } from './src/navigation/AppNavigator';
import { LocationMismatchAlert } from './src/components/modals/LocationMismatchAlert';
import { ToastManager } from './src/components/common/ToastManager';
import { useLocationMismatchDetection } from './src/hooks/useLocationMismatchDetection';
import RegionDetectionService from './src/services/RegionDetectionService';
import { initializeSmartAlerts } from './src/services/smartAlertSystem';
import { timeManager, validateDeviceTime } from './src/services/timeManager';
import { theme } from './src/theme';
import initI18next, { i18n } from './src/utils/i18n';
import volunteerAutoCheckoutService from './src/services/volunteerAutoCheckoutService';
import { preloadSchoolData } from './src/hooks/useSchoolLogos';

// TextEncoder polyfill for react-native-qrcode-svg
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 🚀 尽早开始预加载学校数据（不等待，让缓存尽早可用）
preloadSchoolData().catch(() => {});

// 开发环境导入测试工具
if (__DEV__) {
  // 测试工具已移除，仅保留日志
  console.log('🧪 测试工具已加载');
}

function MainApp() {
  // 位置不匹配检测
  const {
    shouldShowAlert,
    currentRegion,
    settingsRegion,
    dismissAlert,
  } = useLocationMismatchDetection(true, true);

  const handleGoToSettings = () => {
    // TODO: 导航到设置页面的region设置
    // 这里需要与导航系统集成，暂时先输出日志
    console.log('用户选择去设置页面修改region');
  };

  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  const appContent = (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />

      {/* 🎨 全局Toast管理器 */}
      <ToastManager />

      {/* 📍 位置不匹配提醒 */}
      {shouldShowAlert && currentRegion && settingsRegion && (
        <LocationMismatchAlert
          visible={shouldShowAlert}
          onClose={dismissAlert}
          onGoToSettings={handleGoToSettings}
          currentRegion={currentRegion}
          settingsRegion={settingsRegion}
        />
      )}
    </SafeAreaProvider>
  );

  // Stripe 原生模块可用时包裹 StripeProvider，否则直接渲染
  if (StripeProvider && stripePublishableKey) {
    return (
      <StripeProvider
        publishableKey={stripePublishableKey}
        merchantIdentifier="merchant.com.pomelotech.pomelo"
        urlScheme="pomelox"
      >
        {appContent}
      </StripeProvider>
    );
  }

  return appContent;
}

export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [fontsLoaded] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[INIT] 初始化应用...');
        
        // 1. 验证设备时间（优化处理）
        const timeValidation = await validateDeviceTime();
        if (!timeValidation.isValid && timeValidation.warning) {
          // 🚨 只有真正的时间问题才显示警告
          console.warn('[TIME-WARNING]', timeValidation.warning);
        } else {
          console.log('[TIME] 设备时间验证通过:', timeValidation.info || '基础验证通过');
        }
        
        // 2. 初始化i18n系统
        console.log('[I18N] 初始化i18n系统...');
        await initI18next();
        console.log('[SUCCESS] i18n初始化完成，当前语言:', i18n.language);
        
        // 3. 确保时间管理器运行
        console.log('[TIME] 全局时间管理器已启用');
        
        // 4. 初始化智能提醒系统
        console.log('[ALERT] 初始化智能提醒系统...');
        const alertSystemInitialized = await initializeSmartAlerts();
        console.log('[ALERT]', alertSystemInitialized ? '✅ 智能提醒系统启用' : '❌ 智能提醒系统失败');

        // 5. 初始化志愿者自动签退服务
        console.log('[AUTO-CHECKOUT] 初始化志愿者自动签退服务...');
        try {
          await volunteerAutoCheckoutService.initialize();
          console.log('[AUTO-CHECKOUT] ✅ 志愿者自动签退服务启用');
        } catch (error) {
          console.error('[AUTO-CHECKOUT] ❌ 志愿者自动签退服务初始化失败:', error);
        }
        
        // 6. 请求定位权限（首次启动时）
        console.log('[LOCATION] 检查定位权限...');
        try {
          const { default: locationService, LocationPermissionStatus } = await import('./src/services/LocationService');
          // LocationService 默认导出已经是实例，不需要再调用 getInstance()
          const permissionStatus = await locationService.checkPermissionStatus();
          console.log('[LOCATION] 当前权限状态:', permissionStatus);

          // 如果权限未确定，请求权限
          if (permissionStatus === LocationPermissionStatus.NOT_DETERMINED) {
            console.log('[LOCATION] 首次启动，请求定位权限...');
            const granted = await locationService.requestForegroundPermission();
            console.log('[LOCATION] 权限请求结果:', granted ? '已授权' : '已拒绝');
          }
        } catch (error) {
          console.error('[LOCATION] 权限检查失败:', error);
        }

        // 7. 学校数据已在模块加载时开始预加载，这里只记录状态
        console.log('[SCHOOLS] ✅ 学校数据预加载已在模块加载时启动');

        // 8. 启动地理检测预检测（后台运行，不阻塞启动）
        console.log('[REGION] 启动地理检测预检测...');
        RegionDetectionService.preDetect().then(() => {
          console.log('[REGION] ✅ 地理检测预检测完成，结果已缓存');
        }).catch((error) => {
          console.warn('[REGION] ⚠️ 地理检测预检测失败，不影响主流程:', error.message);
        });

        setIsI18nReady(true);
      } catch (error) {
        console.error('[ERROR] 应用初始化失败:', error);
        // 即使失败也继续运行，保证应用可用性
        setIsI18nReady(true);
      }
    };

    initializeApp();
    
    // 应用退出时清理时间管理器和自动签退服务
    return () => {
      timeManager.cleanup();
      volunteerAutoCheckoutService.cleanup();
    };
  }, []);

  if (!isI18nReady || !fontsLoaded) {
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