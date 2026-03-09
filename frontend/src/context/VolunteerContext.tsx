/**
 * 志愿者状态管理Context
 * 统一管理志愿者签到签退状态，解决UI刷新和时区问题
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { VolunteerRecord } from '../services/volunteerAPI';
import { useVolunteerAutoCheckout } from '../hooks/useVolunteerAutoCheckout';

// 志愿者状态类型
export type VolunteerStatus = 'not_signed_in' | 'signed_in' | 'signed_out';

// Context状态接口
interface VolunteerContextState {
  // 当前志愿者状态
  currentStatus: VolunteerStatus;
  // 最后的签到记录
  lastRecord: VolunteerRecord | null;
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
}

// Context操作接口
interface VolunteerContextActions {
  // 更新志愿者状态
  updateStatus: (status: VolunteerStatus, record?: VolunteerRecord | null) => void;
  // 设置最后记录
  setLastRecord: (record: VolunteerRecord | null) => void;
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  // 设置错误信息
  setError: (error: string | null) => void;
  // 清空状态
  clearState: () => void;
  // 强制刷新状态
  refreshStatus: () => Promise<void>;
  // 自动签退相关方法
  recordAutoCheckout: (userId: string, userName: string, recordId: number) => Promise<void>;
  clearAutoCheckout: (userId: string) => Promise<void>;
}

// 合并的Context类型
interface VolunteerContextType extends VolunteerContextState, VolunteerContextActions {}

// 创建Context
const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined);

// Provider组件属性
interface VolunteerProviderProps {
  children: ReactNode;
}

// 初始状态
const initialState: VolunteerContextState = {
  currentStatus: 'not_signed_in',
  lastRecord: null,
  loading: false,
  error: null,
};

/**
 * VolunteerProvider组件
 * 提供志愿者状态管理功能
 */
export const VolunteerProvider: React.FC<VolunteerProviderProps> = ({ children }) => {
  const [state, setState] = useState<VolunteerContextState>(initialState);

  // 集成自动签退功能
  const autoCheckout = useVolunteerAutoCheckout();

  // 更新志愿者状态
  const updateStatus = useCallback((status: VolunteerStatus, record?: VolunteerRecord | null) => {
    setState(prevState => ({
      ...prevState,
      currentStatus: status,
      lastRecord: record !== undefined ? record : prevState.lastRecord,
      error: null,
    }));

    if (__DEV__) {
      console.log('🔄 [VOLUNTEER-CONTEXT] 状态更新:', {
        newStatus: status,
        hasRecord: !!record,
        recordId: record?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  // 设置最后记录
  const setLastRecord = useCallback((record: VolunteerRecord | null) => {
    setState(prevState => ({
      ...prevState,
      lastRecord: record,
    }));

    // 根据记录自动更新状态
    if (record) {
      const newStatus: VolunteerStatus = record.endTime ? 'signed_out' : 'signed_in';
      setState(prevState => ({
        ...prevState,
        currentStatus: newStatus,
      }));
    } else {
      setState(prevState => ({
        ...prevState,
        currentStatus: 'not_signed_in',
      }));
    }
  }, []);

  // 设置加载状态
  const setLoading = useCallback((loading: boolean) => {
    setState(prevState => ({
      ...prevState,
      loading,
    }));
  }, []);

  // 设置错误信息
  const setError = useCallback((error: string | null) => {
    setState(prevState => ({
      ...prevState,
      error,
    }));
  }, []);

  // 清空状态
  const clearState = useCallback(() => {
    setState(initialState);
    if (__DEV__) {
      console.log('🧹 [VOLUNTEER-CONTEXT] 状态已清空');
    }
  }, []);

  // 强制刷新状态（暂时为空实现，可根据需要添加API调用）
  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 在这里可以添加重新获取志愿者状态的逻辑
      // 例如调用 getLastVolunteerRecord API
      if (__DEV__) {
        console.log('🔄 [VOLUNTEER-CONTEXT] 开始刷新状态...');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '刷新状态失败');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // 记录自动签退状态
  const recordAutoCheckout = useCallback(async (userId: string, userName: string, recordId: number) => {
    try {
      if (autoCheckout.isInitialized) {
        await autoCheckout.recordCheckin(userId, userName, recordId);
        if (__DEV__) {
          console.log('✅ [VOLUNTEER-CONTEXT] 已记录自动签退状态:', { userId, userName, recordId });
        }
      }
    } catch (error) {
      console.error('❌ [VOLUNTEER-CONTEXT] 记录自动签退状态失败:', error);
    }
  }, [autoCheckout]);

  // 清除自动签退状态
  const clearAutoCheckout = useCallback(async (userId: string) => {
    try {
      if (autoCheckout.isInitialized) {
        await autoCheckout.recordCheckout(userId);
        if (__DEV__) {
          console.log('✅ [VOLUNTEER-CONTEXT] 已清除自动签退状态:', { userId });
        }
      }
    } catch (error) {
      console.error('❌ [VOLUNTEER-CONTEXT] 清除自动签退状态失败:', error);
    }
  }, [autoCheckout]);

  // Context值
  const contextValue: VolunteerContextType = {
    // 状态
    ...state,
    // 操作方法
    updateStatus,
    setLastRecord,
    setLoading,
    setError,
    clearState,
    refreshStatus,
    // 自动签退方法
    recordAutoCheckout,
    clearAutoCheckout,
  };

  return (
    <VolunteerContext.Provider value={contextValue}>
      {children}
    </VolunteerContext.Provider>
  );
};

/**
 * 使用VolunteerContext的Hook
 * @returns VolunteerContext的值
 * @throws 如果在VolunteerProvider外部使用会抛出错误
 */
export const useVolunteerContext = (): VolunteerContextType => {
  const context = useContext(VolunteerContext);

  if (context === undefined) {
    throw new Error('useVolunteerContext必须在VolunteerProvider内部使用');
  }

  return context;
};

/**
 * 辅助函数：根据记录判断志愿者状态
 * @param record 志愿者记录
 * @returns 志愿者状态
 */
export const getStatusFromRecord = (record: VolunteerRecord | null): VolunteerStatus => {
  if (!record) {
    return 'not_signed_in';
  }

  // 如果有结束时间，说明已签退
  if (record.endTime) {
    return 'signed_out';
  }

  // 如果只有开始时间，说明已签到但未签退
  if (record.startTime) {
    return 'signed_in';
  }

  return 'not_signed_in';
};

export default VolunteerContext;