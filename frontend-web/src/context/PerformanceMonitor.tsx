/**
 * v1.2 性能监控Context
 * 全局FPS监控、性能降级管理、性能指标收集
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 使用稳健的懒加载获取主题配置，避免循环依赖
let _themeCache: any = null;
const getTheme = () => {
  if (_themeCache) return _themeCache;
  
  try {
    const { theme } = require('../theme');
    if (theme && typeof theme === 'object') {
      _themeCache = theme;
      return theme;
    }
  } catch (error) {
    console.warn('Theme loading failed, using fallback config:', error);
  }
  
  // 降级到安全的默认配置
  _themeCache = {
    liquidGlass: { 
      degradation: { 
        fpsThreshold: 50, 
        scrollVelocityThreshold: 1500, 
        enable: true 
      } 
    }
  };
  return _themeCache;
};

interface PerformanceMetrics {
  currentFPS: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  degradationCount: number;
  lastDegradationTime: number | null;
  scrollVelocity: number;
  memoryWarnings: number;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  shouldDegrade: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  reportScrollVelocity: (velocity: number) => void;
  resetMetrics: () => void;
  getPerformanceReport: () => Promise<PerformanceReport>;
}

interface PerformanceReport {
  sessionDuration: number;
  averageFPS: number;
  degradationEvents: number;
  criticalEvents: CriticalEvent[];
}

interface CriticalEvent {
  timestamp: number;
  type: 'low_fps' | 'high_scroll_velocity' | 'memory_warning';
  value: number;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

const PERFORMANCE_STORAGE_KEY = '@pomelo_performance_metrics';
const FPS_SAMPLE_SIZE = 60; // 保留60个FPS样本
const CRITICAL_FPS_THRESHOLD = 30; // 严重卡顿阈值

export const PerformanceMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    currentFPS: 60,
    averageFPS: 60,
    minFPS: 60,
    maxFPS: 60,
    degradationCount: 0,
    lastDegradationTime: null,
    scrollVelocity: 0,
    memoryWarnings: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [shouldDegrade, setShouldDegrade] = useState(false);
  
  const frameTimeBuffer = useRef<number[]>([]);
  const lastFrameTime = useRef(Date.now());
  const animationId = useRef<number | null>(null);
  const sessionStartTime = useRef(Date.now());
  const criticalEvents = useRef<CriticalEvent[]>([]);

  /**
   * FPS测量循环
   */
  const measureFPS = useCallback(() => {
    const currentTime = Date.now();
    const frameDelta = currentTime - lastFrameTime.current;
    
    if (frameDelta > 0) {
      const currentFPS = Math.min(60, 1000 / frameDelta);
      
      // 更新FPS缓冲区
      frameTimeBuffer.current.push(currentFPS);
      if (frameTimeBuffer.current.length > FPS_SAMPLE_SIZE) {
        frameTimeBuffer.current.shift();
      }
      
      // 计算统计数据
      const samples = frameTimeBuffer.current;
      const averageFPS = samples.reduce((a, b) => a + b, 0) / samples.length;
      const minFPS = Math.min(...samples);
      const maxFPS = Math.max(...samples);
      
      // 检测严重卡顿
      if (currentFPS < CRITICAL_FPS_THRESHOLD) {
        criticalEvents.current.push({
          timestamp: currentTime,
          type: 'low_fps',
          value: currentFPS,
        });
      }
      
      // 更新metrics
      setMetrics(prev => ({
        ...prev,
        currentFPS: Math.round(currentFPS),
        averageFPS: Math.round(averageFPS),
        minFPS: Math.round(minFPS),
        maxFPS: Math.round(maxFPS),
      }));
      
      // v1.2 降级判断
      const shouldDegradeNow = averageFPS < (getTheme().liquidGlass?.degradation?.fpsThreshold || 50) ||
                               metrics.scrollVelocity > (getTheme().liquidGlass?.degradation?.scrollVelocityThreshold || 500);
      
      if (shouldDegradeNow !== shouldDegrade) {
        setShouldDegrade(shouldDegradeNow);
        if (shouldDegradeNow) {
          setMetrics(prev => ({
            ...prev,
            degradationCount: prev.degradationCount + 1,
            lastDegradationTime: currentTime,
          }));
        }
      }
    }
    
    lastFrameTime.current = currentTime;
    
    if (isMonitoring) {
      animationId.current = requestAnimationFrame(measureFPS);
    }
  }, [isMonitoring, shouldDegrade]);

  /**
   * 开始性能监控
   */
  const startMonitoring = useCallback(() => {
    if (!isMonitoring) {
      setIsMonitoring(true);
      sessionStartTime.current = Date.now();
      frameTimeBuffer.current = [];
      criticalEvents.current = [];
      
      // 开始FPS监控
      animationId.current = requestAnimationFrame(measureFPS);
    }
  }, [isMonitoring, measureFPS]);

  /**
   * 停止性能监控
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
      animationId.current = null;
    }
  }, []);

  /**
   * 报告滚动速度
   */
  const reportScrollVelocity = useCallback((velocity: number) => {
    setMetrics(prev => ({
      ...prev,
      scrollVelocity: velocity,
    }));
    
    // 记录高速滚动事件
    if (velocity > (getTheme().liquidGlass?.degradation?.scrollVelocityThreshold || 500)) {
      criticalEvents.current.push({
        timestamp: Date.now(),
        type: 'high_scroll_velocity',
        value: velocity,
      });
    }
  }, []);

  /**
   * 重置性能指标
   */
  const resetMetrics = useCallback(() => {
    setMetrics({
      currentFPS: 60,
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      degradationCount: 0,
      lastDegradationTime: null,
      scrollVelocity: 0,
      memoryWarnings: 0,
    });
    frameTimeBuffer.current = [];
    criticalEvents.current = [];
    setShouldDegrade(false);
  }, []);

  /**
   * 获取性能报告
   */
  const getPerformanceReport = useCallback(async (): Promise<PerformanceReport> => {
    const sessionDuration = Date.now() - sessionStartTime.current;
    
    const report: PerformanceReport = {
      sessionDuration,
      averageFPS: metrics.averageFPS,
      degradationEvents: metrics.degradationCount,
      criticalEvents: [...criticalEvents.current],
    };
    
    // 保存到本地存储
    try {
      const existingReports = await AsyncStorage.getItem(PERFORMANCE_STORAGE_KEY);
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.push({
        ...report,
        timestamp: Date.now(),
      });
      
      // 只保留最近10个会话的报告
      if (reports.length > 10) {
        reports.shift();
      }
      
      await AsyncStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
    
    return report;
  }, [metrics]);

  /**
   * 监听内存警告
   */
  useEffect(() => {
    const memoryWarningListener = DeviceEventEmitter.addListener('memoryWarning', () => {
      setMetrics(prev => ({
        ...prev,
        memoryWarnings: prev.memoryWarnings + 1,
      }));
      
      criticalEvents.current.push({
        timestamp: Date.now(),
        type: 'memory_warning',
        value: 1,
      });
      
      // 内存警告时自动触发降级
      setShouldDegrade(true);
    });

    return () => {
      memoryWarningListener.remove();
    };
  }, []);

  /**
   * 应用状态变化处理
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startMonitoring();
      } else if (nextAppState === 'background') {
        stopMonitoring();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // 启动时开始监控
    if (getTheme().liquidGlass?.degradation?.enable !== false) {
      startMonitoring();
    }
    
    return () => {
      subscription.remove();
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  const value: PerformanceContextType = {
    metrics,
    isMonitoring,
    shouldDegrade,
    startMonitoring,
    stopMonitoring,
    reportScrollVelocity,
    resetMetrics,
    getPerformanceReport,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

/**
 * Hook to use performance monitoring
 */
export const usePerformanceMonitor = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceMonitor must be used within PerformanceMonitorProvider');
  }
  return context;
};

/**
 * 性能调试组件（开发模式）
 */
export const PerformanceDebugOverlay: React.FC = () => {
  const { metrics, isMonitoring } = usePerformanceMonitor();
  
  if (!__DEV__ || !isMonitoring) {
    return null;
  }
  
  return (
    <View style={{
      position: 'absolute',
      top: 100,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 10,
      borderRadius: 8,
      zIndex: 10000,
    }}>
      <Text style={{ color: '#00FF00', fontSize: 12, fontFamily: 'monospace' }}>
        FPS: {metrics.currentFPS}
      </Text>
      <Text style={{ color: '#FFFF00', fontSize: 10, fontFamily: 'monospace' }}>
        AVG: {metrics.averageFPS}
      </Text>
      <Text style={{ color: metrics.degradationCount > 0 ? '#FF0000' : '#00FF00', fontSize: 10, fontFamily: 'monospace' }}>
        DEG: {metrics.degradationCount}
      </Text>
    </View>
  );
};

// 需要在渲染中导入的组件
import { View, Text } from 'react-native';

export default {
  PerformanceMonitorProvider,
  usePerformanceMonitor,
  PerformanceDebugOverlay,
};