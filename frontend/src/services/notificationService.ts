/**
 * 通知服务 - 处理志愿者工时审核状态通知
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { VolunteerRecord } from './volunteerAPI';
import { i18n } from '../utils/i18n';
import { Platform } from 'react-native';

// 条件导入 expo-notifications，避免在不支持的环境中报错
let Notifications: any = null;
let isNotificationsAvailable = false;

try {
  Notifications = require('expo-notifications');
  isNotificationsAvailable = true;

  // 配置通知处理
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.warn('expo-notifications not available in this environment');
}

/**
 * 请求通知权限
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!isNotificationsAvailable) {
    console.warn('Notifications not available in this environment');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 保存权限状态
    await AsyncStorage.setItem('notificationPermission', finalStatus);

    return finalStatus === 'granted';
  } catch (error) {
    console.error('请求通知权限失败:', error);
    return false;
  }
};

/**
 * 检查是否已经请求过通知权限
 */
export const hasRequestedNotificationPermission = async (): Promise<boolean> => {
  try {
    const status = await AsyncStorage.getItem('notificationPermission');
    return status !== null;
  } catch (error) {
    console.error('检查通知权限状态失败:', error);
    return false;
  }
};

/**
 * 发送志愿者状态变更通知
 */
export const sendVolunteerStatusNotification = async (record: VolunteerRecord): Promise<void> => {
  if (!isNotificationsAvailable) {
    console.warn('Notifications not available in this environment');
    return;
  }

  try {
    // 检查权限
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('用户未授权通知权限');
      return;
    }

    const { status, startTime } = record;

    // 格式化日期
    const date = new Date(startTime).toLocaleDateString(
      i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US',
      { month: '2-digit', day: '2-digit' }
    );

    // 计算工作时长
    let duration = '';
    if (record.endTime) {
      const start = new Date(startTime);
      const end = new Date(record.endTime);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (i18n.language === 'zh-CN') {
        duration = hours > 0 ? `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}` : `${minutes}分钟`;
      } else {
        duration = hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ' ' + minutes + ' min' : ''}` : `${minutes} min`;
      }
    }

    let title = '';
    let body = '';

    switch(status) {
      case 1: // 审核通过
        title = i18n.language === 'zh-CN' ? '✅ 志愿工时已通过审核' : '✅ Volunteer Hours Approved';
        body = i18n.language === 'zh-CN'
          ? `您${date}的${duration}志愿服务已通过审核`
          : `Your ${duration} volunteer service on ${date} has been approved`;
        break;

      case 2: // 审核拒绝
        title = i18n.language === 'zh-CN' ? '❌ 志愿工时审核未通过' : '❌ Volunteer Hours Not Approved';
        body = i18n.language === 'zh-CN'
          ? `您${date}的志愿服务审核未通过，请联系管理员了解详情`
          : `Your volunteer service on ${date} was not approved, please contact admin for details`;
        break;

      default:
        return; // 不发送通知
    }

    // 发送本地通知
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          recordId: record.id,
          type: 'volunteer_status',
          status: record.status
        },
        categoryIdentifier: 'volunteer_status',
      },
      trigger: null, // 立即发送
    });

    console.log('通知已发送:', { title, body });
  } catch (error) {
    console.error('发送通知失败:', error);
  }
};

/**
 * 检查并发送状态变更通知
 * @param oldRecords 旧记录列表
 * @param newRecords 新记录列表
 */
export const checkAndNotifyStatusChanges = async (
  oldRecords: VolunteerRecord[],
  newRecords: VolunteerRecord[]
): Promise<void> => {
  try {
    // 创建旧记录的映射
    const oldRecordMap = new Map<number, VolunteerRecord>();
    oldRecords.forEach(record => {
      oldRecordMap.set(record.id, record);
    });

    // 检查每条新记录的状态变化
    for (const newRecord of newRecords) {
      const oldRecord = oldRecordMap.get(newRecord.id);

      // 如果状态发生变化（从待审核变为通过或拒绝）
      if (oldRecord && oldRecord.status !== newRecord.status) {
        if (newRecord.status === 1 || newRecord.status === 2) {
          await sendVolunteerStatusNotification(newRecord);
        }
      }

      // 如果是新记录且已经有审核结果
      if (!oldRecord && (newRecord.status === 1 || newRecord.status === 2)) {
        // 检查是否是最近的记录（24小时内）
        const recordTime = new Date(newRecord.createTime || newRecord.startTime).getTime();
        const now = Date.now();
        const hoursDiff = (now - recordTime) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          await sendVolunteerStatusNotification(newRecord);
        }
      }
    }
  } catch (error) {
    console.error('检查并发送状态变更通知失败:', error);
  }
};

/**
 * 清除所有通知
 */
export const clearAllNotifications = async (): Promise<void> => {
  if (!isNotificationsAvailable) {
    console.warn('Notifications not available in this environment');
    return;
  }

  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('清除通知失败:', error);
  }
};

/**
 * 设置通知角标数量
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  if (!isNotificationsAvailable) {
    console.warn('Notifications not available in this environment');
    return;
  }

  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('设置角标失败:', error);
  }
};