import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { UltraFastImage } from '../common/UltraFastImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { BRAND_GLASS, BRAND_INTERACTIONS, BRAND_GRADIENT } from '../../theme/core';
import { scaleIn, scaleOut, bounce } from '../../utils/animations';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useMemoizedDarkMode } from '../../hooks/useDarkMode';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useTheme } from '../../context/ThemeContext';
import { analytics, Events } from '../../analytics/EventTracker';
import { useSmartGesture } from '../../hooks/useSmartGesture';
import { useCardPress } from '../../hooks/useCardPress';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - theme.spacing.lg * 2; // 使用语义化间距

// V1.1 规范: 滑动操作配置
const SWIPE_CONFIG = {
  REVEAL_WIDTH: 100,        // 88-112px 显示宽度（取中值）
  THRESHOLD: 50,            // 触发阈值
  ANIMATION_DURATION: 200,  // V1.1 动画时长（进入）
  SPRING_CONFIG: {
    stiffness: 280,
    damping: 22,
    mass: 1,
  },
};

interface ActivityCardProps {
  activity: {
    id: string;
    title: string;
    location: string;
    date: string;
    time: string;
    image: string;
    attendees: number;
    maxAttendees: number;
    status: string;
    category?: string;
    organizer?: {
      name: string;
      avatar?: string;
      verified?: boolean;
    };
  } | null;
  onPress: () => void;
  onFavorite?: () => void;
  onRegister?: () => void;
  // 滑动操作回调
  onShare?: () => void;
  onBookmark?: () => void;
  onNotifyMe?: () => void;
}

// 安全字符串转换helper函数
const safeString = (value: any, fallback: string = ''): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  return String(value);
};

const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onPress,
  onFavorite,
  onRegister,
  onShare,
  onBookmark,
  onNotifyMe
}) => {
  const { t } = useTranslation();
  // v1.2 性能降级策略
  const { getLiquidGlassConfig, getOptimizedStyles, isPerformanceDegraded } = usePerformanceDegradation();
  
  // 🌙 Dark Mode Support - 使用全局样式管理器
  const darkModeStyles = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, icons: dmIcons } = darkModeStyles;
  // 确保activity对象存在
  if (!activity || typeof activity !== 'object') {
    return null;
  }
  
  // 提前进行所有数据转换，避免在render中出现类型错误
  const safeActivity = {
    id: safeString(activity.id),
    title: safeString(activity.title, 'Activity'),
    location: safeString(activity.location, 'TBD'),
    date: safeString(activity.date),
    time: safeString(activity.time, 'TBD'),
    image: safeString(activity.image),
    attendees: safeNumber(activity.attendees, 0),
    maxAttendees: safeNumber(activity.maxAttendees, 0),
    status: safeString(activity.status, 'upcoming'),
    organizer: activity.organizer ? {
      name: safeString(activity.organizer.name, 'Organizer'),
      avatar: safeString(activity.organizer.avatar),
      verified: Boolean(activity.organizer.verified)
    } : null
  };
  // 基础动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const favoriteScaleAnim = useRef(new Animated.Value(1)).current;
  
  // 滑动手势相关状态
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const actionOpacityAnim = useRef(new Animated.Value(0)).current;
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString || typeof dateString !== 'string') {
        return 'TBD';
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    } catch (error) {
      return '待定日期';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
