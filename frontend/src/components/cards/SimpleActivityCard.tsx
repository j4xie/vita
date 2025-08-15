import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface SimpleActivityCardProps {
  activity: {
    id: string;
    title: string;
    location: string;
    date: string;
    time: string;
    attendees: number;
    maxAttendees: number;
    status?: string;
    image?: string;
    category?: string;
  } | null;
  onPress: () => void;
}

export const SimpleActivityCard: React.FC<SimpleActivityCardProps> = ({
  activity,
  onPress,
}) => {
  const { t, i18n } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!activity) {
    return null;
  }

  // 获取状态标签的样式和文本
  const getStatusConfig = () => {
    switch (activity.status) {
      case 'upcoming':
        return {
          label: t('activityCard.status.upcoming'),
          color: '#EF4444', // 红色
        };
      case 'ongoing':
        return {
          label: t('activityCard.status.ongoing'),
          color: '#10B981', // 绿色
        };
      case 'ended':
        return {
          label: t('activityCard.status.ended'),
          color: '#6B7280', // 灰色
        };
      default:
        return {
          label: t('activityCard.status.available'),
          color: theme.colors.primary,
        };
    }
  };

  const statusConfig = getStatusConfig();

  // 格式化日期显示
  const formatDate = () => {
    const date = new Date(activity.date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (i18n.language === 'zh-CN') {
      return `${month}月${day}日 ${activity.time}`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[month - 1]} ${day} ${activity.time}`;
    }
  };

  // 计算参与率
  const participationRate = (activity.attendees / activity.maxAttendees) * 100;
  const isAlmostFull = participationRate >= 80;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {/* 图片背景 */}
      {activity.image && !imageError ? (
        <>
          <Image
            source={{ uri: activity.image }}
            style={styles.image}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
          {imageLoading && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={48} color={theme.colors.text.tertiary} />
        </View>
      )}

      {/* 底部灰色背景层 */}
      <View style={styles.infoBackground} />

      {/* 底部渐变遮罩 */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.gradient}
      />

      {/* 状态标签 - 左上角 */}
      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
        <Text style={styles.statusText}>{statusConfig.label}</Text>
      </View>

      {/* 参与人数指示器 - 右下角 */}
      <View style={[
        styles.attendeeBadge,
        isAlmostFull && styles.attendeeBadgeAlmostFull
      ]}>
        <Ionicons 
          name="people" 
          size={14} 
          color={isAlmostFull ? '#FFF' : theme.colors.text.inverse} 
        />
        <Text style={[
          styles.attendeeText,
          isAlmostFull && styles.attendeeTextAlmostFull
        ]}>
          {activity.attendees}/{activity.maxAttendees}
        </Text>
      </View>

      {/* 底部信息区 */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {activity.title}
        </Text>
        
        <View style={styles.locationRow}>
          <Ionicons 
            name="location-outline" 
            size={14} 
            color={theme.colors.text.inverse} 
            style={styles.locationIcon}
          />
          <Text style={styles.location} numberOfLines={1}>
            {activity.location}
          </Text>
        </View>
        
        <Text style={styles.time}>
          {formatDate()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.primary,
    ...theme.shadows.md,
    marginBottom: theme.spacing.md,
  },
  
  // 图片相关
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  imagePlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
  },
  
  // 底部灰色背景层
  infoBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  
  // 渐变遮罩
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  
  // 状态标签
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.danger,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // 参与人数
  attendeeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  attendeeBadgeAlmostFull: {
    backgroundColor: theme.colors.warning,
  },
  attendeeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.inverse,
    marginLeft: 4,
  },
  attendeeTextAlmostFull: {
    color: '#FFFFFF',
  },
  
  // 底部信息区
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.inverse,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationIcon: {
    marginRight: 4,
  },
  location: {
    fontSize: 14,
    color: theme.colors.text.inverse,
    flex: 1,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  time: {
    fontSize: 13,
    color: theme.colors.text.inverse,
    opacity: 0.8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});