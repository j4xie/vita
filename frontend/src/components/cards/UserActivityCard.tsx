import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { CalendarIcon, LocationIcon } from '../icons/ActivityIcons';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { handleAPIError } from '../../utils/errorHandler';

interface UserActivityCardProps {
  activity: {
    id: number;
    name: string;
    icon: string;
    startTime: string;
    endTime: string;
    address: string;
    signStatus: number; // -1: 已报名未签到, 1: 已签到
  };
  onScanPress?: (activityId: number) => void;
  onCancelRegistration?: (activityId: number) => void; // 新增取消报名回调
}

export const UserActivityCard: React.FC<UserActivityCardProps> = ({
  activity,
  onScanPress,
  onCancelRegistration,
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const formatActivityTime = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const startStr = start.toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
      });
      
      const timeStr = start.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      return `${startStr} ${timeStr}`;
    } catch {
      return startTime;
    }
  };

  const handleScanPress = () => {
    if (onScanPress) {
      onScanPress(activity.id);
    }
  };

  // 取消报名处理函数
  const handleCancelRegistration = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      t('activities.cancel_registration', '取消报名'),
      t('activities.cancel_registration_confirm', '确定要取消报名这个活动吗？取消后如需重新报名，需要重新提交申请。'),
      [
        {
          text: t('common.cancel', '取消'),
          style: 'cancel',
        },
        {
          text: t('activities.confirm_cancel', '确定取消'),
          style: 'destructive',
          onPress: performCancelRegistration,
        },
      ],
      { cancelable: true }
    );
  };

  // 执行取消报名
  const performCancelRegistration = async () => {
    if (!user?.id) {
      Alert.alert(
        t('common.error', '错误'),
        t('common.user_info_incomplete', '用户信息不完整，请重新登录'),
        [{ text: t('common.ok', '确定') }]
      );
      return;
    }
    
    setIsLoading(true);
    try {
      // 改进的用户ID类型处理和验证
      const numericUserId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      
      if (!numericUserId || isNaN(numericUserId) || numericUserId <= 0) {
        Alert.alert(
          t('common.error', '错误'),
          t('common.user_info_incomplete', '用户信息不完整，请重新登录'),
          [{ text: t('common.ok', '确定') }]
        );
        return;
      }
      
      console.log('🔄 取消报名请求:', { activityId: activity.id, userId: numericUserId });
      
      const response = await pomeloXAPI.enrollActivity(activity.id, numericUserId, true);
      
      if (response.code === 200) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert(
          t('common.success', '成功'),
          t('activities.cancel_registration_success', '已成功取消报名'),
          [{ text: t('common.confirm', '确定') }]
        );
        
        // 调用回调通知父组件刷新数据
        if (onCancelRegistration) {
          onCancelRegistration(activity.id);
        }
        
        // 发送全局事件通知其他页面更新状态
        console.log('🔄 发送活动状态变化事件:', { activityId: activity.id, action: 'cancel_registration' });
        DeviceEventEmitter.emit('activityRegistrationChanged', {
          activityId: activity.id,
          action: 'cancel_registration',
          timestamp: Date.now()
        });
      } else {
        throw new Error(response.msg || '取消报名失败');
      }
    } catch (error: any) {
      console.error('取消报名失败:', error);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      // 使用统一的错误处理机制
      handleAPIError(error, { 
        action: '取消报名', 
        component: 'UserActivityCard' 
      }, Alert.alert);
    } finally {
      setIsLoading(false);
    }
  };

  const isCheckedIn = activity.signStatus === 1;
  const needsCheckIn = activity.signStatus === -1;

  return (
    <View style={styles.container}>
      {/* 左侧活动信息 */}
      <View style={styles.activityInfo}>
        {/* 活动图片 */}
        <View style={styles.imageContainer}>
          {activity.icon ? (
            <Image 
              source={{ uri: activity.icon }} 
              style={styles.activityImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <CalendarIcon size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        
        {/* 活动详情 */}
        <View style={styles.activityDetails}>
          <Text style={styles.activityName} numberOfLines={2}>
            {activity.name}
          </Text>
          <Text style={styles.activityTime}>
            {formatActivityTime(activity.startTime, activity.endTime)}
          </Text>
          <Text style={styles.activityLocation} numberOfLines={1}>
            <LocationIcon size={12} color="#9CA3AF" />
            {' '}{activity.address}
          </Text>
        </View>
      </View>

      {/* 右侧操作按钮 */}
      <View style={styles.actionContainer}>
        {isCheckedIn ? (
          <View style={styles.checkedInBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.checkedInText}>
              {t('profile.activity.checked_in', '已签到')}
            </Text>
          </View>
        ) : needsCheckIn ? (
          <View style={styles.buttonGroup}>
            {/* 扫码签到按钮 */}
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={handleScanPress}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Ionicons name="qr-code-outline" size={14} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>
                {t('profile.activity.scan_to_checkin', '扫码')}
              </Text>
            </TouchableOpacity>
            
            {/* 取消报名按钮 */}
            <TouchableOpacity 
              style={[styles.cancelButton, { opacity: isLoading ? 0.6 : 1 }]}
              onPress={handleCancelRegistration}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
              <Text style={styles.cancelButtonText}>
                {isLoading ? t('common.loading', '加载中...') : t('activities.cancel', '取消')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    // ...LIQUID_GLASS_LAYERS.card.light, // 临时注释，避免未定义错误
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  
  activityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  
  activityImage: {
    width: '100%',
    height: '100%',
  },
  
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  activityDetails: {
    flex: 1,
  },
  
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  
  activityTime: {
    fontSize: 16, // 提升至交互文字16pt
    color: '#6B7280',
    marginBottom: 2,
  },
  
  activityLocation: {
    fontSize: 14, // 提升至辅助信息最小14pt
    color: '#9CA3AF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionContainer: {
    marginLeft: 12,
  },
  
  buttonGroup: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
  },
  
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16, // 按钮文字最小16pt
    fontWeight: '500',
    marginLeft: 3,
  },
  
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    minWidth: 60,
  },
  
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16, // 按钮文字最小16pt
    fontWeight: '500',
    marginLeft: 3,
  },
  
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  
  checkedInText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default UserActivityCard;