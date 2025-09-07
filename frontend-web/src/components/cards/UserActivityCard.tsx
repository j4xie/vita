import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';

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
}

export const UserActivityCard: React.FC<UserActivityCardProps> = ({
  activity,
  onScanPress,
}) => {
  const { t } = useTranslation();

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
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
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
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
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
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={handleScanPress}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>
              {t('profile.activity.scan_to_checkin', '去扫码签到')}
            </Text>
          </TouchableOpacity>
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
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  
  activityLocation: {
    fontSize: 13,
    color: '#9CA3AF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionContainer: {
    marginLeft: 12,
  },
  
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
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