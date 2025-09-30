/**
 * 志愿者自动签退服务
 * 监听应用状态变化，在用户退出应用时自动签退已签到的志愿者
 */

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLastVolunteerRecord, performVolunteerCheckOut } from './volunteerAPI';
import { getCurrentToken, getUserInfo } from './authAPI';
import { timeService } from '../utils/UnifiedTimeService';

// 自动签退配置接口
export interface AutoCheckoutConfig {
  enabled: boolean;           // 是否启用自动签退
  delaySeconds: number;       // 延迟时间（秒）
  showConfirmation: boolean;  // 是否显示确认对话框
  maxWorkHours: number;       // 最大工作时长（小时）
}

// 默认配置
const DEFAULT_CONFIG: AutoCheckoutConfig = {
  enabled: true,
  delaySeconds: 5,           // 5秒延迟
  showConfirmation: false,   // 默认不显示确认对话框
  maxWorkHours: 24,         // 最大24小时
};

// 存储键名
const STORAGE_KEYS = {
  CONFIG: 'volunteer_auto_checkout_config',
  CHECKIN_STATE: 'volunteer_checkin_state',
  PENDING_CHECKOUT: 'volunteer_pending_checkout',
} as const;

// 签到状态接口
interface CheckinState {
  userId: string;
  userName: string;
  checkinTime: string;
  recordId: number;
  lastActiveTime: string;
}

class VolunteerAutoCheckoutService {
  private isInitialized = false;
  private appStateSubscription: any = null;
  private checkoutTimer: NodeJS.Timeout | null = null;
  private config: AutoCheckoutConfig = DEFAULT_CONFIG;
  private currentCheckinState: CheckinState | null = null;

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔄 [AUTO-CHECKOUT] 服务已经初始化');
      return;
    }

    try {
      console.log('🚀 [AUTO-CHECKOUT] 正在初始化自动签退服务...');

      // 加载配置
      await this.loadConfig();

      // 恢复签到状态
      await this.restoreCheckinState();

      // 处理未完成的签退
      await this.processPendingCheckouts();

      // 监听应用状态变化
      this.setupAppStateListener();

      this.isInitialized = true;
      console.log('✅ [AUTO-CHECKOUT] 自动签退服务初始化完成');

    } catch (error) {
      console.error('❌ [AUTO-CHECKOUT] 服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 清理服务
   */
  cleanup(): void {
    console.log('🧹 [AUTO-CHECKOUT] 清理自动签退服务...');

    // 移除应用状态监听
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // 清除定时器
    if (this.checkoutTimer) {
      clearTimeout(this.checkoutTimer);
      this.checkoutTimer = null;
    }

    this.isInitialized = false;
    console.log('✅ [AUTO-CHECKOUT] 服务清理完成');
  }

  /**
   * 记录用户签到
   */
  async recordCheckin(userId: string, userName: string, recordId: number): Promise<void> {
    const checkinState: CheckinState = {
      userId,
      userName,
      checkinTime: new Date().toISOString(),
      recordId,
      lastActiveTime: new Date().toISOString(),
    };

    this.currentCheckinState = checkinState;
    await AsyncStorage.setItem(STORAGE_KEYS.CHECKIN_STATE, JSON.stringify(checkinState));

    console.log('📝 [AUTO-CHECKOUT] 记录用户签到:', {
      userId,
      userName,
      recordId,
      time: checkinState.checkinTime
    });
  }

  /**
   * 记录用户签退
   */
  async recordCheckout(userId: string): Promise<void> {
    if (this.currentCheckinState?.userId === userId) {
      this.currentCheckinState = null;
      await AsyncStorage.removeItem(STORAGE_KEYS.CHECKIN_STATE);

      console.log('📝 [AUTO-CHECKOUT] 记录用户签退:', { userId });
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<AutoCheckoutConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));

    console.log('⚙️ [AUTO-CHECKOUT] 配置已更新:', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): AutoCheckoutConfig {
    return { ...this.config };
  }

  /**
   * 获取当前签到状态
   */
  getCurrentCheckinState(): CheckinState | null {
    return this.currentCheckinState ? { ...this.currentCheckinState } : null;
  }

  /**
   * 手动触发超时检查（公开方法）
   */
  async triggerOvertimeCheck(): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ [AUTO-CHECKOUT] 服务未初始化，无法执行超时检查');
      return;
    }

    await this.checkOvertimeSignin();
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (configStr) {
        const savedConfig = JSON.parse(configStr) as AutoCheckoutConfig;
        this.config = { ...DEFAULT_CONFIG, ...savedConfig };
        console.log('📋 [AUTO-CHECKOUT] 已加载配置:', this.config);
      } else {
        // 保存默认配置
        await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
        console.log('📋 [AUTO-CHECKOUT] 使用默认配置:', DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('❌ [AUTO-CHECKOUT] 加载配置失败:', error);
      this.config = DEFAULT_CONFIG;
    }
  }

  /**
   * 恢复签到状态
   */
  private async restoreCheckinState(): Promise<void> {
    try {
      const stateStr = await AsyncStorage.getItem(STORAGE_KEYS.CHECKIN_STATE);
      if (stateStr) {
        const state = JSON.parse(stateStr) as CheckinState;

        // 验证签到状态是否有效（24小时内）
        const checkinTime = new Date(state.checkinTime);
        const now = new Date();
        const hoursElapsed = (now.getTime() - checkinTime.getTime()) / (1000 * 60 * 60);

        if (hoursElapsed <= this.config.maxWorkHours) {
          this.currentCheckinState = state;
          console.log('🔄 [AUTO-CHECKOUT] 恢复签到状态:', {
            userId: state.userId,
            hoursElapsed: hoursElapsed.toFixed(2)
          });
        } else {
          // 超时状态，清除
          await AsyncStorage.removeItem(STORAGE_KEYS.CHECKIN_STATE);
          console.log('⏰ [AUTO-CHECKOUT] 签到状态已超时，自动清除');
        }
      }
    } catch (error) {
      console.error('❌ [AUTO-CHECKOUT] 恢复签到状态失败:', error);
    }
  }

  /**
   * 处理未完成的签退
   */
  private async processPendingCheckouts(): Promise<void> {
    try {
      const pendingStr = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHECKOUT);
      if (pendingStr) {
        const pendingData = JSON.parse(pendingStr);
        console.log('🔄 [AUTO-CHECKOUT] 发现未完成的签退，尝试重新执行...');

        // 尝试重新执行签退
        await this.executeAutoCheckout(pendingData.userId, true);

        // 清除pending记录
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_CHECKOUT);
      }
    } catch (error) {
      console.error('❌ [AUTO-CHECKOUT] 处理未完成签退失败:', error);
    }
  }

  /**
   * 检查超时签到状态（应用启动时调用）
   */
  async checkOvertimeSignin(): Promise<void> {
    console.log('🔍 [OVERTIME-CHECK] 检查超时签到状态...');

    if (!this.currentCheckinState) {
      console.log('ℹ️ [OVERTIME-CHECK] 无签到状态，跳过检查');
      return;
    }

    try {
      const checkinTime = new Date(this.currentCheckinState.checkinTime);
      const now = new Date();
      const hoursElapsed = (now.getTime() - checkinTime.getTime()) / (1000 * 60 * 60);

      console.log('📊 [OVERTIME-CHECK] 时间检查:', {
        checkinTime: this.currentCheckinState.checkinTime,
        hoursElapsed: hoursElapsed.toFixed(2),
        threshold: '12小时'
      });

      if (hoursElapsed > 12) {
        console.log('🚨 [OVERTIME-CHECK] 检测到超时签到，执行12小时自动签退...');

        // 计算12小时后的签退时间
        const autoSignoutTime = new Date(checkinTime.getTime() + 12 * 60 * 60 * 1000);
        const autoSignoutTimeString = timeService.formatLocalTime(autoSignoutTime);

        // 执行自动签退
        await this.executeOvertimeAutoCheckout(
          this.currentCheckinState.userId,
          autoSignoutTimeString,
          hoursElapsed
        );
      } else {
        console.log('✅ [OVERTIME-CHECK] 签到时间正常，无需自动签退');
      }

    } catch (error) {
      console.error('❌ [OVERTIME-CHECK] 超时检查失败:', error);
    }
  }

  /**
   * 执行超时自动签退
   */
  private async executeOvertimeAutoCheckout(
    userId: string,
    autoSignoutTimeString: string,
    originalHoursElapsed: number
  ): Promise<void> {
    try {
      console.log('🚀 [OVERTIME-CHECKOUT] 开始执行超时自动签退:', {
        userId,
        autoSignoutTime: autoSignoutTimeString,
        originalHours: originalHoursElapsed.toFixed(2)
      });

      // 检查网络和认证状态
      const token = await getCurrentToken();
      if (!token) {
        console.log('🔐 [OVERTIME-CHECKOUT] 用户未登录，无法执行自动签退');
        await this.savePendingCheckout(userId);
        return;
      }

      // 获取用户信息
      const userInfo = await getUserInfo();
      if (!userInfo || userInfo.code !== 200) {
        console.log('👤 [OVERTIME-CHECKOUT] 无法获取用户信息，延迟签退');
        await this.savePendingCheckout(userId);
        return;
      }

      // 验证最后记录
      const lastRecordResponse = await getLastVolunteerRecord(parseInt(userId));
      if (lastRecordResponse.code !== 200 || !lastRecordResponse.data) {
        console.log('📋 [OVERTIME-CHECKOUT] 无法获取签到记录，延迟签退');
        await this.savePendingCheckout(userId);
        return;
      }

      const lastRecord = lastRecordResponse.data;

      // 检查是否已经签退
      if (lastRecord.endTime) {
        console.log('✅ [OVERTIME-CHECKOUT] 用户已签退，清除本地状态');
        await this.recordCheckout(userId);
        return;
      }

      // 执行12小时限制的自动签退
      console.log('🎯 [OVERTIME-CHECKOUT] 执行12小时自动签退操作...');

      const operateUserId = typeof userInfo.data.userId === 'string' ? parseInt(userInfo.data.userId) : userInfo.data.userId;

      const checkoutResult = await performVolunteerCheckOut(
        parseInt(userId),
        operateUserId,
        userInfo.data.legalName,
        `【自动签退】超时签到，系统自动处理（原签到时间：${this.currentCheckinState.checkinTime}，实际工作：${originalHoursElapsed.toFixed(1)}小时）`
      );

      if (checkoutResult.code === 200) {
        console.log('✅ [OVERTIME-CHECKOUT] 超时自动签退成功');
        await this.recordCheckout(userId);

        console.log(`📊 [OVERTIME-CHECKOUT] 自动签退完成，限制工作时长为12小时`);
      } else {
        console.error('❌ [OVERTIME-CHECKOUT] 超时自动签退失败:', checkoutResult.msg);
        await this.savePendingCheckout(userId);
      }

    } catch (error) {
      console.error('❌ [OVERTIME-CHECKOUT] 超时自动签退异常:', error);
      await this.savePendingCheckout(userId);
    }
  }

  /**
   * 处理应用进入后台
   */
  private async handleAppGoingBackground(): Promise<void> {
    if (!this.config.enabled || !this.currentCheckinState) {
      console.log('🔇 [AUTO-CHECKOUT] 自动签退已禁用或无签到状态');
      return;
    }

    console.log('🌅 [AUTO-CHECKOUT] 应用进入后台，准备自动签退...');

    // 更新最后活跃时间
    if (this.currentCheckinState) {
      this.currentCheckinState.lastActiveTime = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.CHECKIN_STATE, JSON.stringify(this.currentCheckinState));
    }

    // 设置延迟签退
    if (this.checkoutTimer) {
      clearTimeout(this.checkoutTimer);
    }

    this.checkoutTimer = setTimeout(async () => {
      if (this.currentCheckinState) {
        await this.executeAutoCheckout(this.currentCheckinState.userId);
      }
    }, this.config.delaySeconds * 1000);

    console.log(`⏰ [AUTO-CHECKOUT] 已设置${this.config.delaySeconds}秒后自动签退`);
  }

  /**
   * 处理应用变为活跃
   */
  private handleAppBecomingActive(): void {
    console.log('🌞 [AUTO-CHECKOUT] 应用变为活跃');

    // 取消自动签退定时器
    if (this.checkoutTimer) {
      clearTimeout(this.checkoutTimer);
      this.checkoutTimer = null;
      console.log('❌ [AUTO-CHECKOUT] 已取消自动签退定时器');
    }
  }

  /**
   * 设置应用状态监听器
   */
  private setupAppStateListener(): void {
    console.log('🎧 [AUTO-CHECKOUT] 设置应用状态监听器...');

    // 移除已存在的监听器（防止重复）
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // 添加应用状态变化监听
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log(`📱 [AUTO-CHECKOUT] 应用状态变化: ${nextAppState}`);

      if (nextAppState === 'background') {
        // 应用进入后台
        this.handleAppGoingBackground();
      } else if (nextAppState === 'active') {
        // 应用变为活跃
        this.handleAppBecomingActive();
      }
      // 忽略 'inactive' 状态，因为它通常是过渡状态
    });

    console.log('✅ [AUTO-CHECKOUT] 应用状态监听器已设置');
  }

  /**
   * 执行自动签退
   */
  private async executeAutoCheckout(userId: string, isRetry: boolean = false): Promise<void> {
    try {
      console.log(`🚀 [AUTO-CHECKOUT] 开始执行自动签退: ${userId} ${isRetry ? '(重试)' : ''}`);

      // 检查用户是否还在签到状态
      if (!this.currentCheckinState || this.currentCheckinState.userId !== userId) {
        console.log('ℹ️ [AUTO-CHECKOUT] 用户已不在签到状态，跳过自动签退');
        return;
      }

      // 检查网络和认证状态
      const token = await getCurrentToken();
      if (!token) {
        console.log('🔐 [AUTO-CHECKOUT] 用户未登录，无法执行自动签退');
        await this.savePendingCheckout(userId);
        return;
      }

      // 获取用户信息
      const userInfo = await getUserInfo();
      if (!userInfo || userInfo.code !== 200) {
        console.log('👤 [AUTO-CHECKOUT] 无法获取用户信息，延迟签退');
        await this.savePendingCheckout(userId);
        return;
      }

      // 验证最后记录
      const lastRecordResponse = await getLastVolunteerRecord(parseInt(userId));
      if (lastRecordResponse.code !== 200 || !lastRecordResponse.data) {
        console.log('📋 [AUTO-CHECKOUT] 无法获取签到记录，延迟签退');
        await this.savePendingCheckout(userId);
        return;
      }

      const lastRecord = lastRecordResponse.data;

      // 检查是否已经签退
      if (lastRecord.endTime) {
        console.log('✅ [AUTO-CHECKOUT] 用户已签退，清除本地状态');
        await this.recordCheckout(userId);
        return;
      }

      // 执行自动签退
      console.log('🎯 [AUTO-CHECKOUT] 执行自动签退操作...');

      const operateUserId = typeof userInfo.data.userId === 'string' ? parseInt(userInfo.data.userId) : userInfo.data.userId;

      const checkoutResult = await performVolunteerCheckOut(
        parseInt(userId),
        operateUserId,
        userInfo.data.legalName,
        '【自动签退】应用退出时自动签退'
      );

      if (checkoutResult.code === 200) {
        console.log('✅ [AUTO-CHECKOUT] 自动签退成功');
        await this.recordCheckout(userId);

        // 计算工作时长
        const checkinTime = new Date(this.currentCheckinState.checkinTime);
        const checkoutTime = new Date();
        const duration = timeService.calculateDuration(checkinTime, checkoutTime);

        console.log(`📊 [AUTO-CHECKOUT] 工作时长: ${duration.display}`);

        // 可以在这里添加通知逻辑

      } else {
        console.error('❌ [AUTO-CHECKOUT] 自动签退失败:', checkoutResult.msg);
        await this.savePendingCheckout(userId);
      }

    } catch (error) {
      console.error('❌ [AUTO-CHECKOUT] 自动签退异常:', error);
      await this.savePendingCheckout(userId);
    }
  }

  /**
   * 保存待处理的签退
   */
  private async savePendingCheckout(userId: string): Promise<void> {
    try {
      const pendingData = {
        userId,
        timestamp: new Date().toISOString(),
        checkinState: this.currentCheckinState,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHECKOUT, JSON.stringify(pendingData));
      console.log('💾 [AUTO-CHECKOUT] 已保存待处理的签退');

    } catch (error) {
      console.error('❌ [AUTO-CHECKOUT] 保存待处理签退失败:', error);
    }
  }
}

// 创建单例实例
export const volunteerAutoCheckoutService = new VolunteerAutoCheckoutService();

// 默认导出服务实例
export default volunteerAutoCheckoutService;