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
  
  // 获取活动状态标签 - 与GridActivityCard保持一致
  const getActivityLabel = () => {
    // 第一优先级：用户的报名/签到状态
    if (activity.status === 'registered') {
      return { type: 'registered', label: t('activities.status.registered', '已报名') };
    }
    if (activity.status === 'checked_in') {
      return { type: 'checked_in', label: t('activities.status.checked_in', '已签到') };
    }
    
    // 第二优先级：时间紧急程度
    const now = new Date();
    const activityStart = new Date(activity.date + ' ' + activity.time);
    const hoursToStart = (activityStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursToStart >= 0 && hoursToStart <= 24) {
      return { type: 'today', label: t('activities.urgency.today', '今日开始') };
    } else if (hoursToStart >= 0 && hoursToStart <= 168) {
      return { type: 'upcoming', label: t('activities.urgency.upcoming', '即将开始') };
    }
    
    return null; // 不显示标签
  };
  
  const activityLabel = getActivityLabel();

  // 手势开始动画
  const handleGestureStart = () => {
    // 流畅的按压动画 - Apple设计规范
    scale.value = withTiming(0.96, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
    
    // 边缘发光效果
    borderGlow.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.circle),
    });

    // 微妙3D倾斜效果
    tiltX.value = withTiming(2, { duration: 150 });
    tiltY.value = withTiming(-1, { duration: 150 });

    // 阴影深度动画
    elevationScale.value = withTiming(1.5, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  };

  // 手势结束恢复动画
  const handleGestureEnd = () => {
    // 弹性回弹动画
    scale.value = withSpring(1, {
      damping: 15,
      mass: 1,
      stiffness: 150,
    });

    borderGlow.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });

    // 恢复3D倾斜
    tiltX.value = withSpring(0, { damping: 20, stiffness: 200 });
    tiltY.value = withSpring(0, { damping: 20, stiffness: 200 });

    elevationScale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  // 简单的卡片点击检测 - 带滚动保护
  const cardPress = useCardPress({
    onPress: () => {
      // 🚫 滚动保护：如果正在滚动，忽略点击
      if (isScrolling) {
        console.log('🚫 [CARD-PROTECTION] 正在滚动，忽略卡片点击');
        return;
      }
      // 确认是真正的点击事件，执行导航
      console.log('✅ [CARD-PROTECTION] 静止状态下的有效卡片点击');
      onPress();
    },
    onPressIn: handleGestureStart,
    onPressOut: handleGestureEnd,
  }, {
    maxMoveThreshold: 10,      // 🔧 减少到10px，更严格的点击检测
    maxTimeThreshold: 300,     // 🔧 减少到300ms，避免长按误触
    enableHaptics: Platform.OS === 'ios',
    debug: false,
  });

  // 边缘光效动画（进入时触发）
  const triggerShimmer = React.useCallback(() => {
    shimmerX.value = -200;
    shimmerX.value = withTiming(400, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  }, [shimmerX]);

  // 滚动视差动画（如果提供了scrollY）
  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    const cardHeight = 240 + theme.spacing.md; // 卡片高度 + 边距
    const cardY = index * cardHeight;
    
    // 视差偏移：卡片进入和离开视口时的动画
    const translateY = interpolate(
      scrollY.value,
      [cardY - 400, cardY, cardY + 400],
      [50, 0, -50],
      'clamp'
    );

    // 透明度渐变：远离视口中心时稍微降低透明度
    const opacity = interpolate(
      scrollY.value,
      [cardY - 600, cardY - 200, cardY + 200, cardY + 600],
      [0.7, 1, 1, 0.7],
      'clamp'
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  // 组件挂载时触发光效
  React.useEffect(() => {
    const timer = setTimeout(triggerShimmer, Math.random() * 1000 + 500);
    return () => clearTimeout(timer);
  }, [triggerShimmer]);

  // 格式化日期区间显示
  const formatDateRange = React.useCallback(() => {
    const formatSingleDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-');
      return { month: parseInt(month), day: parseInt(day) };
    };
    
    const start = formatSingleDate(activity.date);
    
    // 格式化时间为12小时制
    const formatTime = (timeStr: string) => {
      if (!timeStr || timeStr === '00:00') return '';
      const [hours, minutes] = timeStr.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return ` ${hour12}:${minutes}${ampm}`;
    };
    
    // 构建日期显示 - 始终使用完整格式 月/日-月/日
    let dateDisplay = '';
    if (activity.endDate && activity.endDate !== activity.date) {
      const end = formatSingleDate(activity.endDate);
      // 始终显示完整格式: 09/11-09/17
      dateDisplay = `${start.month.toString().padStart(2, '0')}/${start.day.toString().padStart(2, '0')}-${end.month.toString().padStart(2, '0')}/${end.day.toString().padStart(2, '0')}`;
    } else {
      // 单日: 09/11
      dateDisplay = `${start.month.toString().padStart(2, '0')}/${start.day.toString().padStart(2, '0')}`;
    }
    
    // 添加时间（如果不是00:00）
    const timeDisplay = formatTime(activity.time) || '';
    return String(dateDisplay) + String(timeDisplay);
  }, [activity.date, activity.endDate, activity.time]);

  // 计算参与率 - 使用useMemo避免不必要的重新计算
  const isAlmostFull = React.useMemo(() => {
    const participationRate = (activity.attendees / activity.maxAttendees) * 100;
    return participationRate >= 80;
  }, [activity.attendees, activity.maxAttendees]);

  // 暂时禁用动画效果避免无限循环，保持功能正常
  /*
  React.useEffect(() => {
    if (isAlmostFull) {
      borderGlow.value = withSequence(
        withTiming(0.3, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      );
    }
  }, [isAlmostFull]);
  */

  // 动画样式定义
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { perspective: 1000 },
      { rotateX: `${tiltY.value}deg` },
      { rotateY: `${tiltX.value}deg` },
    ],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(elevationScale.value, [1, 1.5], [0.08, 0.15]),
    shadowRadius: interpolate(elevationScale.value, [1, 1.5], [3, 8]),
    elevation: interpolate(elevationScale.value, [1, 1.5], [2, 6]),
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
    opacity: interpolate(shimmerX.value, [-200, 0, 200, 400], [0, 0.8, 0.8, 0]),
  }));

  const borderGlowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 255, 255, ${borderGlow.value * 0.6})`,
    shadowColor: '#FFFFFF',
    shadowOpacity: borderGlow.value * 0.3,
    shadowRadius: borderGlow.value * 12,
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, animatedShadowStyle, parallaxStyle]}>
      {/* 边缘发光效果 */}
      <Animated.View style={[styles.glowBorder, borderGlowStyle, { pointerEvents: "none" }]} />
      
      {/* 光效扫过动画 */}
      <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle, { pointerEvents: "none" }]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.4)',
            'rgba(255, 255, 255, 0.8)',
            'rgba(255, 255, 255, 0.4)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>

      <Animated.View 
        style={styles.touchableArea} 
        {...cardPress.touchHandlers}
      >
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

      {/* V2.0 照片白字可读性遮罩 - 6-10%暗遮罩确保对比度≥4.5:1 */}
      <LinearGradient
        colors={[
          RESTRAINED_COLORS.PHOTO_OVERLAY.darkMask.medium, // 8%暗遮罩
          'transparent', 
          RESTRAINED_COLORS.PHOTO_OVERLAY.darkMask.strong  // 10%暗遮罩(底部文字区域)
        ]}
        locations={[0, 0.4, 1]}
        style={styles.overlayGradient}
      />

      {/* 活动状态标识 */}
      {activityLabel && (
        <View style={[
          styles.activityBadge,
          activityLabel.type === 'registered' ? styles.registeredBadge :
          activityLabel.type === 'checked_in' ? styles.checkedInBadge :
          activityLabel.type === 'today' ? styles.todayBadge : styles.upcomingBadge
        ]}>
          <Text style={styles.badgeText}>
            {activityLabel.label}
          </Text>
        </View>
      )}

      {/* 收藏按钮 */}
      {onBookmark && (
        <TouchableOpacity 
          style={styles.bookmarkButton}
          onPress={() => onBookmark(activity)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? "取消收藏活动" : "收藏活动"}
          accessibilityHint={isBookmarked ? "点击取消收藏此活动" : "点击收藏此活动"}
        >
          <Ionicons 
            name={isBookmarked ? "heart" : "heart-outline"} 
            size={20} 
            color={isBookmarked ? "#FF6B35" : "rgba(255, 255, 255, 0.8)"} 
          />
        </TouchableOpacity>
      )}

      {/* 参与人数指示器 - 暂时隐藏 */}
      {/*
      <View style={styles.attendeeBadge}>
        <Ionicons 
          name="people" 
          size={14} 
          color={theme.colors.text.inverse}
          style={{ marginRight: 4 }}
        />
        <Text style={styles.badgeText}>
          {activity.attendees}/{activity.maxAttendees}
        </Text>
      </View>
      */}

      {/* 底部信息区 - 压缩布局 */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {String(activity?.title || '')}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.locationRow}>
            <Ionicons 
              name="location-outline" 
              size={12} 
              color="#666666" 
              style={styles.locationIcon}
            />
            <Text style={styles.location} numberOfLines={1}>
              {String(activity?.location || '')}
            </Text>
          </View>
          
          <Text style={styles.time}>
            {formatActivityDateWithTimezone(activity as FrontendActivity, i18n.language as 'zh' | 'en')}
          </Text>
        </View>
      </View>
      </Animated.View>
    </Animated.View>
  );
};

// 🚀 性能优化：使用React.memo防止不必要的重新渲染
export const SimpleActivityCard = memo(SimpleActivityCardComponent, (prevProps, nextProps) => {
  // 仅在这些关键属性改变时才重新渲染
  return (
    prevProps.activity?.id === nextProps.activity?.id &&
    prevProps.activity?.attendees === nextProps.activity?.attendees &&
    prevProps.activity?.registeredCount === nextProps.activity?.registeredCount &&
    prevProps.activity?.status === nextProps.activity?.status &&
    prevProps.isBookmarked === nextProps.isBookmarked
  );
});

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderRadius: theme.borderRadius.card, // 使用新规范
    overflow: 'visible', // 改为visible让边缘效果显示
    backgroundColor: theme.colors.background.primary,
    ...theme.shadows.sm, // 使用sm阴影
    marginBottom: theme.spacing.md,
  },

  // 触摸区域
  touchableArea: {
    height: '100%',
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
  },

  // 边缘发光效果
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: theme.borderRadius.card + 2,
    borderWidth: 2,
    borderColor: 'transparent',
    pointerEvents: 'none',
  },

  // 光效扫过层
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    pointerEvents: 'none',
  },

  shimmerGradient: {
    flex: 1,
    borderRadius: theme.borderRadius.card,
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
  
  // V2.0 遮罩层
  overlayGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1, // 确保在图片上方，但在文字下方
  },
  
  
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },

  // 活动状态标识
  activityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 3,
  },
  registeredBadge: {
    backgroundColor: '#10B981', // 绿色：已报名
  },
  checkedInBadge: {
    backgroundColor: '#059669', // 深绿色：已签到
  },
  todayBadge: {
    backgroundColor: '#EF4444', // 红色：今日开始
  },
  upcomingBadge: {
    backgroundColor: '#F59E0B', // 橙色：即将开始
  },

  // 状态标签
  statusBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 24,
    borderRadius: 12,
    backgroundColor: LIQUID_GLASS_LAYERS.L2.background.light,
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light,
    borderWidth: LIQUID_GLASS_LAYERS.L2.border.width,
    top: 12,
    left: 12,
    zIndex: 3, // 确保在遮罩上方
  },
  
  // 参与人数
  attendeeBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 24,
    borderRadius: 12,
    backgroundColor: LIQUID_GLASS_LAYERS.L2.background.light,
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light,
    borderWidth: LIQUID_GLASS_LAYERS.L2.border.width,
    top: 12,
    right: 12,
    zIndex: 3, // 确保在遮罩上方
  },

  // 收藏按钮样式
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  
  // 底部信息区 - 压缩布局
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,  // 从16减少到12
    paddingTop: 12, // 从20减少到12，压缩高度
    backgroundColor: '#FFFFFF', // 纯白色背景
    borderBottomLeftRadius: theme.borderRadius.card,
    borderBottomRightRadius: theme.borderRadius.card,
    zIndex: 2, // 确保在遮罩上方
  },
  title: {
    fontSize: 16, // 从18减少到16
    fontWeight: '700',
    color: '#1A1A1A', // 小红书风格深色文字
    marginBottom: 6, // 从8减少到6
    // 移除阴影，在白色背景上不需要
  },
  // 新增：时间和地点同行布局
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    marginRight: 3, // 从4减少到3
  },
  location: {
    fontSize: 13, // 从14减少到13
    color: '#666666', // 小红书风格中灰色
    flex: 1,
    // 移除阴影和透明度，在白色背景上不需要
  },
  time: {
    fontSize: 12, // 从13减少到12
    color: '#666666', // 小红书风格中灰色
    marginLeft: 8, // 添加左边距，与地点分开
    // 移除阴影和透明度，在白色背景上不需要
  },
});