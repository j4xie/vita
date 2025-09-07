/**
 * 纯JavaScript智能提醒系统
 * 使用Alert + 定时器模拟推送通知体验
 */
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebHaptics as Haptics } from '../utils/WebHaptics';
import { toastService } from './toastService';
import { i18n } from '../utils/i18n';

export interface AlertSettings {
  activityUpdates: boolean;
  registrationSuccess: boolean;
  comments: boolean;
  doNotDisturb: boolean;
  doNotDisturbStartTime: string; // "22:00"
  doNotDisturbEndTime: string;   // "08:00"
}

export interface ScheduledAlert {
  id: string;
  title: string;
  message: string;
  scheduledTime: Date;
  type: 'activity_reminder' | 'registration_deadline' | 'volunteer_reminder';
  data?: any;
}

const DEFAULT_SETTINGS: AlertSettings = {
  activityUpdates: true,
  registrationSuccess: true,
  comments: false,
  doNotDisturb: false,
  doNotDisturbStartTime: '22:00',
  doNotDisturbEndTime: '08:00',
};

class SmartAlertSystem {
  private settings: AlertSettings = DEFAULT_SETTINGS;
  private scheduledAlerts: ScheduledAlert[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();

  // 初始化提醒系统
  async initialize(): Promise<boolean> {
    try {
      await this.loadSettings();
      await this.loadScheduledAlerts();
      await this.restoreTimers();
      console.log('✅ 智能提醒系统初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 智能提醒系统初始化失败:', error);
      return false;
    }
  }

  // === 即时提醒功能 ===

  // 🎨 显示优雅的成功Toast（替换丑陋的Alert）
  async showSuccessAlert(title: string, message: string, data?: any) {
    if (!this.shouldShowAlert('registration_success')) {
      return;
    }

    // 使用自定义Toast替换系统Alert
    toastService.success(title, message, 4000); // 4秒显示时间
  }

  // 显示活动相关提醒
  async showActivityAlert(title: string, message: string, data?: any) {
    if (!this.shouldShowAlert('activity_updates')) {
      return;
    }

    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    const isEnglish = i18n.language === 'en-US';
    Alert.alert(
      title,
      message,
      [
        {
          text: isEnglish ? 'Got it' : '知道了',
          style: 'default',
        },
        {
          text: isEnglish ? 'View Activity' : '查看活动',
          style: 'default',
          onPress: () => {
            // TODO: 导航到活动详情
            console.log('用户选择查看活动:', data);
          },
        },
      ],
      { cancelable: true }
    );
  }

  // === 定时提醒功能 ===

  // 安排活动开始提醒（1小时前）
  async scheduleActivityReminder(activity: any) {
    if (!this.shouldShowAlert('activity_updates')) {
      return;
    }

    try {
      const activityDate = new Date(activity.startTime || activity.createdAt);
      const reminderTime = new Date(activityDate.getTime() - 60 * 60 * 1000); // 提前1小时
      
      // 只安排未来的提醒
      if (reminderTime <= new Date()) {
        return;
      }

      const alertId = `activity_reminder_${activity.id}`;
      
      const scheduledAlert: ScheduledAlert = {
        id: alertId,
        title: '🎯 活动即将开始！',
        message: `「${activity.name}」将在1小时后开始，记得准时参加哦～`,
        scheduledTime: reminderTime,
        type: 'activity_reminder',
        data: { activityId: activity.id },
      };

      await this.scheduleAlert(scheduledAlert);
      console.log(`✅ 已安排活动提醒: ${activity.name} at ${reminderTime.toLocaleString()}`);
    } catch (error) {
      console.error('安排活动提醒失败:', error);
    }
  }

  // 🚨 2小时自动提醒功能已删除（用户要求移除）

  // 通用定时提醒调度器
  private async scheduleAlert(scheduledAlert: ScheduledAlert) {
    try {
      // 添加到待执行列表
      this.scheduledAlerts.push(scheduledAlert);
      await this.saveScheduledAlerts();

      // 计算延迟时间
      const now = Date.now();
      const scheduledTime = scheduledAlert.scheduledTime.getTime();
      const delay = scheduledTime - now;

      if (delay > 0) {
        // 设置定时器
        const timer = setTimeout(async () => {
          await this.executeAlert(scheduledAlert);
        }, delay);

        this.timers.set(scheduledAlert.id, timer);
        console.log(`⏰ 提醒已设置，${Math.round(delay / 60000)}分钟后执行`);
      }
    } catch (error) {
      console.error('安排提醒失败:', error);
    }
  }

  // 执行提醒
  private async executeAlert(scheduledAlert: ScheduledAlert) {
    try {
      // 检查是否在免打扰时间
      if (this.isInDoNotDisturbTime()) {
        console.log('当前处于免打扰时间，跳过提醒');
        return;
      }

      // 添加震动
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // 显示Alert
      Alert.alert(
        scheduledAlert.title,
        scheduledAlert.message,
        [
          {
            text: '知道了',
            style: 'default',
          },
          {
            text: '查看详情',
            style: 'default',
            onPress: () => {
              console.log('用户查看详情:', scheduledAlert.data);
              // TODO: 根据类型导航到相应页面
            },
          },
        ],
        { cancelable: true }
      );

      // 清理已执行的提醒
      this.removeAlert(scheduledAlert.id);
    } catch (error) {
      console.error('执行提醒失败:', error);
    }
  }

  // === 设置管理 ===

  async loadSettings(): Promise<AlertSettings> {
    try {
      const saved = await AsyncStorage.getItem('smartAlertSettings');
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
      return this.settings;
    } catch (error) {
      console.error('加载提醒设置失败:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(newSettings: Partial<AlertSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem('smartAlertSettings', JSON.stringify(this.settings));
      console.log('✅ 提醒设置已保存');
    } catch (error) {
      console.error('保存提醒设置失败:', error);
    }
  }

  getSettings(): AlertSettings {
    return this.settings;
  }

  // === 定时提醒管理 ===

  private async loadScheduledAlerts() {
    try {
      const saved = await AsyncStorage.getItem('scheduledAlerts');
      if (saved) {
        const alerts = JSON.parse(saved);
        // 过滤过期的提醒
        this.scheduledAlerts = alerts.filter((alert: any) => 
          new Date(alert.scheduledTime) > new Date()
        );
        await this.saveScheduledAlerts();
      }
    } catch (error) {
      console.error('加载定时提醒失败:', error);
    }
  }

  private async saveScheduledAlerts() {
    try {
      await AsyncStorage.setItem('scheduledAlerts', JSON.stringify(this.scheduledAlerts));
    } catch (error) {
      console.error('保存定时提醒失败:', error);
    }
  }

  private async restoreTimers() {
    for (const alert of this.scheduledAlerts) {
      const delay = new Date(alert.scheduledTime).getTime() - Date.now();
      if (delay > 0) {
        const timer = setTimeout(async () => {
          await this.executeAlert(alert);
        }, delay);
        this.timers.set(alert.id, timer);
      }
    }
    console.log(`✅ 已恢复${this.timers.size}个定时提醒`);
  }

  private removeAlert(alertId: string) {
    // 清除定时器
    const timer = this.timers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(alertId);
    }

    // 从列表中移除
    this.scheduledAlerts = this.scheduledAlerts.filter(alert => alert.id !== alertId);
    this.saveScheduledAlerts();
  }

  // === 智能判断逻辑 ===

  private shouldShowAlert(type: 'activity_updates' | 'registration_success' | 'comments'): boolean {
    if (this.isInDoNotDisturbTime()) {
      return false;
    }

    switch (type) {
      case 'activity_updates':
        return this.settings.activityUpdates;
      case 'registration_success':
        return this.settings.registrationSuccess;
      case 'comments':
        return this.settings.comments;
      default:
        return false;
    }
  }

  private isInDoNotDisturbTime(): boolean {
    if (!this.settings.doNotDisturb) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = this.settings.doNotDisturbStartTime.split(':').map(Number);
    const [endHour, endMinute] = this.settings.doNotDisturbEndTime.split(':').map(Number);

    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    // 处理跨天情况（如22:00到08:00）
    if (startTimeMinutes > endTimeMinutes) {
      return currentTime >= startTimeMinutes || currentTime <= endTimeMinutes;
    } else {
      return currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
    }
  }

  // === 清理功能 ===

  async clearAllAlerts() {
    // 清除所有定时器
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // 清空列表
    this.scheduledAlerts = [];
    await this.saveScheduledAlerts();
    
    console.log('✅ 已清除所有定时提醒');
  }

  // 获取权限状态（模拟）
  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    // 在纯JS系统中，我们假设总是有"权限"
    return 'granted';
  }

  // 获取已安排的提醒列表
  getScheduledAlerts(): ScheduledAlert[] {
    return this.scheduledAlerts;
  }
}

// 导出单例
export const smartAlertSystem = new SmartAlertSystem();

// === 便捷调用方法 ===

// 活动报名成功提醒
export const notifyRegistrationSuccess = async (activityName: string) => {
  await smartAlertSystem.showSuccessAlert(
    '🎉 报名成功！',
    `您已成功报名「${activityName}」，期待您的参与！`
  );
};

// 🌍 志愿者签到成功提醒（支持国际化）
export const notifyVolunteerCheckIn = async (location?: string) => {
  const isEnglish = i18n.language === 'en-US';
  
  const title = isEnglish ? '✅ Volunteer Check-in Successful' : '✅ 志愿者签到成功';
  const message = isEnglish 
    ? `Check-in successful${location ? `, location: ${location}` : ''}, keep up the good work!`
    : `签到成功${location ? `，地点：${location}` : ''}，加油！`;
  
  await smartAlertSystem.showSuccessAlert(title, message);
};

// 🌍 志愿者签退成功提醒（支持国际化）
export const notifyVolunteerCheckOut = async (duration: string) => {
  // 🚀 安全检查 - 支持中英文时长格式
  const isEnglish = i18n.language === 'en-US';
  let safeDuration;
  
  if (!duration || duration === 'NaN分钟' || duration === 'NaN minutes') {
    safeDuration = isEnglish ? 'unknown duration' : '未知时长';
  } else {
    safeDuration = duration;
  }
  
  const title = isEnglish ? '✅ Volunteer Check-out Successful' : '✅ 志愿者签退成功';
  const message = isEnglish 
    ? `Volunteer service duration: ${safeDuration}, thank you for your contribution!`
    : `本次志愿服务时长：${safeDuration}，感谢您的付出！`;
  
  await smartAlertSystem.showSuccessAlert(title, message);
};

// 安排活动提醒
export const scheduleActivityReminder = (activity: any) =>
  smartAlertSystem.scheduleActivityReminder(activity);

// 安排志愿者签退提醒  
// 🚨 scheduleVolunteerSignOutReminder 已删除

// 获取和保存设置
export const getAlertSettings = () => smartAlertSystem.getSettings();
export const saveAlertSettings = (settings: Partial<AlertSettings>) => 
  smartAlertSystem.saveSettings(settings);

// 初始化
export const initializeSmartAlerts = () => smartAlertSystem.initialize();