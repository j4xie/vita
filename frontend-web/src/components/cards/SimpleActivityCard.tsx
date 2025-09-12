import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { UltraFastImage } from '../common/UltraFastImage';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_OVERLAYS, RESTRAINED_COLORS } from '../../theme/core';
import { useCardPress } from '../../hooks/useCardPress';
import { useMemoizedDarkMode } from '../../hooks/useDarkMode';
import { useTheme } from '../../context/ThemeContext';
import { formatActivityDateWithTimezone, FrontendActivity } from '../../utils/activityAdapter';

interface SimpleActivityCardProps {
  activity: {
    id: string;
    title: string;
    location: string;
    date: string;
    endDate?: string; // 添加结束日期
    time: string;
    attendees: number;
    maxAttendees: number;
    registeredCount: number; // 已报名人数
    status?: string;
    image?: string;
    category?: string;
    timeZone?: string; // 时区
  } | null;
  onPress: () => void;
  // 滚动视差动画支持
  scrollY?: Animated.SharedValue<number>;
  index?: number;
  // 🚫 滚动保护支持
  isScrolling?: boolean;
  // 新增收藏功能
  onBookmark?: (activity: any) => void;
  isBookmarked?: boolean;
}

const SimpleActivityCardComponent: React.FC<SimpleActivityCardProps> = ({
  activity,
  onPress,
  scrollY,
  index = 0,
  onBookmark,
  isBookmarked = false,
  isScrolling = false, // 🚫 滚动状态
}) => {
  const { t, i18n } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // 🌙 Dark Mode Support
  const darkMode = useMemoizedDarkMode();
  const { isDarkMode } = darkMode;

  // 流畅动画系统
  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-200);
  const borderGlow = useSharedValue(0);
  const elevationScale = useSharedValue(1);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  if (!activity) {
    return null;
  }

  // 获取状态标签的样式和文本 - 与App端保持一致的状态映射
  const getStatusConfig = () => {
    switch (activity.status) {
      case 'available':
        return {
          label: t('activityCard.status.available'),
          color: '#10B981', // 绿色，表示可报名
        };
      case 'registered':
        return {
          label: t('activityCard.status.registered'),
          color: '#3B82F6', // 蓝色，表示已报名
        };
      case 'checked_in':
        return {
          label: t('activityCard.status.checked_in'),
          color: '#8B5CF6', // 紫色，表示已签到
        };
      case 'almost_full':
        return {
          label: t('activityCard.status.full'),
          color: '#F59E0B', // 橙色，表示即将满员
        };
      case 'full':
        return {
          label: t('activityCard.status.full'),
          color: '#6B7280', // 灰色，表示已满
        };
      case 'ended':
        return {
          label: t('activityCard.status.ended'),
          color: '#6B7280', // 灰色，表示已结束
        };
      case 'ended':
        return {
          label: t('activityCard.status.ended'),
          color: '#6B7280', // 灰色
        };
      default:
        return {
          label: t('activityCard.status.upcoming'),
          color: '#EF4444',
        };
    }
  };

  const { pressHandlers, animatedStyle } = useCardPress();

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={isScrolling}
        {...pressHandlers}
      >
        <View style={styles.card}>
          {/* Image */}
          {activity.image && !imageError ? (
            <UltraFastImage
              uri={activity.image}
              style={styles.image}
              resizeMode="contain"
              onLoadStart={() => setImageLoading(true)}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={24} color="#ccc" />
            </View>
          )}
          
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusConfig().color }]}>
            <Text style={styles.statusText}>{getStatusConfig().label}</Text>
          </View>

          {/* Bookmark Button */}
          {onBookmark && (
            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={() => onBookmark(activity)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color={isBookmarked ? "#FF6B6B" : "#666"}
              />
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {activity.title}
            </Text>
            
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.location} numberOfLines={1}>
                {activity.location}
              </Text>
            </View>
            
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.time}>
                {formatActivityDateWithTimezone(activity as FrontendActivity, i18n.language as 'zh' | 'en')}
              </Text>
            </View>

            <View style={styles.attendeesRow}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.attendees}>
                {activity.registeredCount || activity.attendees || 0}
                {activity.maxAttendees ? `/${activity.maxAttendees}` : ''}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160, // 增加图片高度以匹配App端比例
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 160, // 与图片高度保持一致
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160, // 与图片高度保持一致
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  time: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  attendees: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
});

export const SimpleActivityCard = memo(SimpleActivityCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.activity?.id === nextProps.activity?.id &&
    prevProps.activity?.attendees === nextProps.activity?.attendees &&
    prevProps.activity?.registeredCount === nextProps.activity?.registeredCount &&
    prevProps.activity?.status === nextProps.activity?.status &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.isScrolling === nextProps.isScrolling
  );
});
