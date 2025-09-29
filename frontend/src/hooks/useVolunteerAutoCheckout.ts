/**
 * 志愿者自动签退Hook
 * 提供自动签退功能的React Hook接口
 */

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import volunteerAutoCheckoutService, { AutoCheckoutConfig } from '../services/volunteerAutoCheckoutService';

interface UseVolunteerAutoCheckoutReturn {
  // 状态
  isEnabled: boolean;
  isInitialized: boolean;
  config: AutoCheckoutConfig | null;
  currentCheckinState: any | null;

  // 操作方法
  initialize: () => Promise<void>;
  cleanup: () => void;
  updateConfig: (newConfig: Partial<AutoCheckoutConfig>) => Promise<void>;
  recordCheckin: (userId: string, userName: string, recordId: number) => Promise<void>;
  recordCheckout: (userId: string) => Promise<void>;

  // 配置快捷方法
  toggleEnabled: () => Promise<void>;
  setDelaySeconds: (seconds: number) => Promise<void>;
  setShowConfirmation: (show: boolean) => Promise<void>;
}

/**
 * 志愿者自动签退Hook
 */
export const useVolunteerAutoCheckout = (): UseVolunteerAutoCheckoutReturn => {
  const { user } = useUser();

  // 状态管理
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<AutoCheckoutConfig | null>(null);
  const [currentCheckinState, setCurrentCheckinState] = useState<any | null>(null);

  // 初始化服务
  const initialize = useCallback(async () => {
    try {
      console.log('🔄 [HOOK] 初始化自动签退Hook...');

      await volunteerAutoCheckoutService.initialize();

      // 获取初始配置和状态
      const currentConfig = volunteerAutoCheckoutService.getConfig();
      const checkinState = volunteerAutoCheckoutService.getCurrentCheckinState();

      setConfig(currentConfig);
      setCurrentCheckinState(checkinState);
      setIsInitialized(true);

      console.log('✅ [HOOK] 自动签退Hook初始化完成');

    } catch (error) {
      console.error('❌ [HOOK] 自动签退Hook初始化失败:', error);
      setIsInitialized(false);
    }
  }, []);

  // 清理服务
  const cleanup = useCallback(() => {
    console.log('🧹 [HOOK] 清理自动签退Hook...');

    volunteerAutoCheckoutService.cleanup();

    setIsInitialized(false);
    setConfig(null);
    setCurrentCheckinState(null);

    console.log('✅ [HOOK] 自动签退Hook清理完成');
  }, []);

  // 更新配置
  const updateConfig = useCallback(async (newConfig: Partial<AutoCheckoutConfig>) => {
    try {
      await volunteerAutoCheckoutService.updateConfig(newConfig);

      // 更新本地状态
      const updatedConfig = volunteerAutoCheckoutService.getConfig();
      setConfig(updatedConfig);

      console.log('⚙️ [HOOK] 配置已更新:', updatedConfig);

    } catch (error) {
      console.error('❌ [HOOK] 更新配置失败:', error);
      throw error;
    }
  }, []);

  // 记录签到
  const recordCheckin = useCallback(async (userId: string, userName: string, recordId: number) => {
    try {
      await volunteerAutoCheckoutService.recordCheckin(userId, userName, recordId);

      // 更新本地状态
      const checkinState = volunteerAutoCheckoutService.getCurrentCheckinState();
      setCurrentCheckinState(checkinState);

      console.log('📝 [HOOK] 已记录签到:', { userId, userName, recordId });

    } catch (error) {
      console.error('❌ [HOOK] 记录签到失败:', error);
      throw error;
    }
  }, []);

  // 记录签退
  const recordCheckout = useCallback(async (userId: string) => {
    try {
      await volunteerAutoCheckoutService.recordCheckout(userId);

      // 更新本地状态
      const checkinState = volunteerAutoCheckoutService.getCurrentCheckinState();
      setCurrentCheckinState(checkinState);

      console.log('📝 [HOOK] 已记录签退:', { userId });

    } catch (error) {
      console.error('❌ [HOOK] 记录签退失败:', error);
      throw error;
    }
  }, []);

  // 快捷方法：切换启用状态
  const toggleEnabled = useCallback(async () => {
    if (!config) return;

    await updateConfig({ enabled: !config.enabled });

    console.log(`🔄 [HOOK] 自动签退已${config.enabled ? '禁用' : '启用'}`);
  }, [config, updateConfig]);

  // 快捷方法：设置延迟时间
  const setDelaySeconds = useCallback(async (seconds: number) => {
    await updateConfig({ delaySeconds: Math.max(1, Math.min(300, seconds)) }); // 限制在1-300秒之间

    console.log(`⏰ [HOOK] 延迟时间已设置为${seconds}秒`);
  }, [updateConfig]);

  // 快捷方法：设置确认对话框
  const setShowConfirmation = useCallback(async (show: boolean) => {
    await updateConfig({ showConfirmation: show });

    console.log(`💬 [HOOK] 确认对话框已${show ? '启用' : '禁用'}`);
  }, [updateConfig]);

  // 用户登录状态变化时重新初始化
  useEffect(() => {
    if (user && !isInitialized) {
      initialize();
    } else if (!user && isInitialized) {
      cleanup();
    }
  }, [user, isInitialized, initialize, cleanup]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (isInitialized) {
        cleanup();
      }
    };
  }, [isInitialized, cleanup]);

  return {
    // 状态
    isEnabled: config?.enabled ?? false,
    isInitialized,
    config,
    currentCheckinState,

    // 操作方法
    initialize,
    cleanup,
    updateConfig,
    recordCheckin,
    recordCheckout,

    // 配置快捷方法
    toggleEnabled,
    setDelaySeconds,
    setShowConfirmation,
  };
};

export default useVolunteerAutoCheckout;