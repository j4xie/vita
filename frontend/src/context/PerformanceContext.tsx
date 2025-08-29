import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// V1.1 规范: 性能模式配置
export interface PerformanceSettings {
  // 基础性能设置
  enableBlur: boolean;           // 模糊效果开关
  enableShadows: boolean;        // 阴影效果开关
  enableAnimations: boolean;     // 复杂动画开关
  enableGlassEffects: boolean;   // 液态玻璃效果开关
  
  // 渲染优化
  reducedMotion: boolean;        // 减少动效
  lowMemoryMode: boolean;        // 低内存模式
  simplifiedUI: boolean;         // 简化UI模式
  
  // 自动检测
  autoPerformanceMode: boolean;  // 自动性能模式
}

export interface PerformanceModeContextType {
  settings: PerformanceSettings;
  isPerformanceMode: boolean;
  updateSettings: (newSettings: Partial<PerformanceSettings>) => void;
  togglePerformanceMode: () => void;
  resetToDefaults: () => void;
}

// 默认性能设置
const DEFAULT_SETTINGS: PerformanceSettings = {
  enableBlur: true,
  enableShadows: true,
  enableAnimations: true,
  enableGlassEffects: true,
  reducedMotion: false,
  lowMemoryMode: false,
  simplifiedUI: false,
  autoPerformanceMode: false,
};

// 性能模式设置（禁用消耗性功能）
const PERFORMANCE_MODE_SETTINGS: PerformanceSettings = {
  enableBlur: false,
  enableShadows: false,
  enableAnimations: false,
  enableGlassEffects: false,
  reducedMotion: true,
  lowMemoryMode: true,
  simplifiedUI: true,
  autoPerformanceMode: false,
};

// Android 设备优化默认值
const ANDROID_OPTIMIZED_SETTINGS: PerformanceSettings = {
  enableBlur: false,          // Android blur performance hit
  enableShadows: true,        // Shadows work well on Android
  enableAnimations: true,
  enableGlassEffects: false,  // Heavy for some Android devices
  reducedMotion: false,
  lowMemoryMode: false,
  simplifiedUI: false,
  autoPerformanceMode: true,
};

const STORAGE_KEY = 'performanceSettings';

const PerformanceModeContext = createContext<PerformanceModeContextType | undefined>(undefined);

export const usePerformanceMode = (): PerformanceModeContextType => {
  const context = useContext(PerformanceModeContext);
  if (!context) {
    throw new Error('usePerformanceMode must be used within a PerformanceModeProvider');
  }
  return context;
};

interface PerformanceModeProviderProps {
  children: ReactNode;
}

export const PerformanceModeProvider: React.FC<PerformanceModeProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<PerformanceSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 判断是否为性能模式
  const isPerformanceMode = !settings.enableBlur && !settings.enableShadows && !settings.enableGlassEffects;

  // 初始化加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  // 加载保存的设置
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as PerformanceSettings;
        setSettings(parsed);
      } else {
        // 首次启动，根据平台设置默认值
        const platformDefaults = Platform.OS === 'android' 
          ? ANDROID_OPTIMIZED_SETTINGS 
          : DEFAULT_SETTINGS;
        setSettings(platformDefaults);
        await saveSettings(platformDefaults);
      }
      setIsLoaded(true);
    } catch (error) {
      console.warn('Failed to load performance settings:', error);
      setIsLoaded(true);
    }
  };

  // 保存设置
  const saveSettings = async (newSettings: PerformanceSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save performance settings:', error);
    }
  };

  // 更新设置
  const updateSettings = (newSettings: Partial<PerformanceSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  // 切换性能模式
  const togglePerformanceMode = () => {
    if (isPerformanceMode) {
      // 退出性能模式，恢复平台默认设置
      const defaultSettings = Platform.OS === 'android' 
        ? ANDROID_OPTIMIZED_SETTINGS 
        : DEFAULT_SETTINGS;
      setSettings(defaultSettings);
      saveSettings(defaultSettings);
    } else {
      // 进入性能模式
      setSettings(PERFORMANCE_MODE_SETTINGS);
      saveSettings(PERFORMANCE_MODE_SETTINGS);
    }
  };

  // 重置为默认设置
  const resetToDefaults = () => {
    const platformDefaults = Platform.OS === 'android' 
      ? ANDROID_OPTIMIZED_SETTINGS 
      : DEFAULT_SETTINGS;
    setSettings(platformDefaults);
    saveSettings(platformDefaults);
  };

  // 等待加载完成
  if (!isLoaded) {
    return null; // 或者显示加载指示器
  }

  const contextValue: PerformanceModeContextType = {
    settings,
    isPerformanceMode,
    updateSettings,
    togglePerformanceMode,
    resetToDefaults,
  };

  return (
    <PerformanceModeContext.Provider value={contextValue}>
      {children}
    </PerformanceModeContext.Provider>
  );
};

// 工具函数：根据性能设置调整主题
export const getPerformanceAdjustedTheme = (baseTheme: any, settings: PerformanceSettings) => {
  const adjustedTheme = { ...baseTheme };

  // 禁用阴影
  if (!settings.enableShadows) {
    adjustedTheme.shadows = {
      ...baseTheme.shadows,
      none: baseTheme.shadows.none,
      xs: baseTheme.shadows.none,
      sm: baseTheme.shadows.none,
      base: baseTheme.shadows.none,
      md: baseTheme.shadows.none,
      lg: baseTheme.shadows.none,
      xl: baseTheme.shadows.none,
      card: baseTheme.shadows.none,
      button: baseTheme.shadows.none,
      modal: baseTheme.shadows.none,
      floating: baseTheme.shadows.none,
      colored: baseTheme.shadows.none,
    };
  }

  // 禁用液态玻璃效果
  if (!settings.enableGlassEffects) {
    adjustedTheme.liquidGlass = {
      ...baseTheme.liquidGlass,
      tag: {
        // tag properties
        inactive: {
          background: 'rgba(255, 255, 255, 0.8)', // 不透明背景
          border: 'rgba(255, 255, 255, 0.30)',
          blur: 0,
        },
        active: {
          background: 'rgba(255, 107, 53, 0.15)', // PomeloX 橙色
          border: 'rgba(255, 107, 53, 0.30)', // PomeloX 橙色边框
          blur: 10,
        }, // 保持激活状态
      },
      card: {
        ...baseTheme.liquidGlass.card,
        background: 'rgba(248, 250, 255, 0.95)', // 更不透明
        blur: 0,
      },
      floating: {
        ...baseTheme.liquidGlass.floating,
        background: 'rgba(255, 255, 255, 0.95)',
        blur: 0,
      },
    };
  }

  // 简化动画时长
  if (settings.reducedMotion) {
    adjustedTheme.animations = {
      ...baseTheme.animations,
      durations: {
        ...baseTheme.animations.durations,
        micro: Math.min(50, baseTheme.animations.durations.micro),
        quick: Math.min(100, baseTheme.animations.durations.quick),
        short: Math.min(150, baseTheme.animations.durations.short),
        medium: Math.min(200, baseTheme.animations.durations.medium),
        long: Math.min(250, baseTheme.animations.durations.long),
        exit: Math.min(120, baseTheme.animations.durations.exit),
      },
    };
  }

  return adjustedTheme;
};