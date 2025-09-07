import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, RESTRAINED_COLORS } from '../../theme/core';
import { useCardPress } from '../../hooks/useCardPress';
import { OptimizedImage } from '../common/OptimizedImage';
import { formatActivityDateWithTimezone, FrontendActivity } from '../../utils/activityAdapter';

const { width: screenWidth } = Dimensions.get('window');

interface GridActivityCardProps {
  activity: {
    id: string;
    title: string;
    location: string;
    date: string;
    endDate?: string;
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
  onBookmark?: (activity: any) => void;
  isBookmarked?: boolean;
}

const GridActivityCardComponent: React.FC<GridActivityCardProps> = ({
  activity,
  onPress,
  onBookmark,
  isBookmarked = false,
}) => {
  const { t, i18n } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 流畅动画系统
  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-200);
  const borderGlow = useSharedValue(0);
  const elevationScale = useSharedValue(1);

  if (!activity) {
    return null;
  }

  // 瀑布流布局：宽度由父容器决定，这里不需要计算
  
  // 根据内容计算动态高度 - 适中的瀑布流效果
  const calculateDynamicHeight = () => {
    const baseHeight = 180; // 适中的基础高度
    const titleLength = activity.title.length;
    const locationLength = activity.location.length;
    
    // 标题长度影响高度 - 适中变化
    const titleHeightAddition = titleLength > 20 ? 20 : 
                               titleLength > 15 ? 15 : 
                               titleLength > 10 ? 10 : 0;
    
    // 地点长度影响高度 - 适中变化
    const locationHeightAddition = locationLength > 15 ? 15 : 
                                  locationLength > 10 ? 10 : 0;
    
    // 适中的随机变化（基于活动ID）
    const seed1 = parseInt(activity.id) % 5; // 0-4
    const seed2 = (parseInt(activity.id) * 17) % 4; // 0-3
    const randomAddition = seed1 * 12 + seed2 * 8; // 0-80的适中范围
    
    // 图片比例影响 - 三种高度变化
    const imageRatio = (parseInt(activity.id) % 4) === 0 ? 20 : 
                      (parseInt(activity.id) % 4) === 1 ? 0 : 
                      (parseInt(activity.id) % 4) === 2 ? 10 : 15; // 四种变化
    
    return Math.min(280, Math.max(160, baseHeight + titleHeightAddition + locationHeightAddition + randomAddition + imageRatio));
  };
  
  const dynamicHeight = calculateDynamicHeight();
  
  // 获取活动状态标签 - 优先显示报名状态，其次是时间紧急程度
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
    scale.value = withTiming(0.96, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
    
    borderGlow.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.circle),
    });

    elevationScale.value = withTiming(1.5, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  };

  // 手势结束恢复动画
  const handleGestureEnd = () => {
    scale.value = withSpring(1, {
      damping: 15,
      mass: 1,
      stiffness: 150,
    });

    borderGlow.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });

    elevationScale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  // 卡片点击检测
  const cardPress = useCardPress({
    onPress: () => {
      onPress();
    },
    onPressIn: handleGestureStart,
    onPressOut: handleGestureEnd,
  }, {
    maxMoveThreshold: 15,
    maxTimeThreshold: 400,
    enableHaptics: Platform.OS === 'ios',
    debug: false,
  });

  // 边缘光效动画
  const triggerShimmer = () => {
    shimmerX.value = -200;
    shimmerX.value = withTiming(400, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  };

  // 组件挂载时触发光效
  React.useEffect(() => {
    const timer = setTimeout(triggerShimmer, Math.random() * 1000 + 500);
    return () => clearTimeout(timer);
  }, []);

  // 格式化日期区间显示 - 更紧凑的格式
  const formatDateRange = () => {
    const formatSingleDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-');
      return { month: parseInt(month), day: parseInt(day) };
    };
    
    const start = formatSingleDate(activity.date);
    
    // 构建日期显示 - 网格布局使用更简短格式
    let dateDisplay = '';
    if (activity.endDate && activity.endDate !== activity.date) {
      const end = formatSingleDate(activity.endDate);
      dateDisplay = `${start.month}/${start.day}-${end.month}/${end.day}`;
    } else {
      dateDisplay = `${start.month}/${start.day}`;
    }
    
    return String(dateDisplay || '');
  };

  // 动画样式定义
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
    <Animated.View style={[styles.container, { height: dynamicHeight }, animatedContainerStyle, animatedShadowStyle]}>
      {/* 边缘发光效果 */}
      <Animated.View style={[styles.glowBorder, borderGlowStyle]} pointerEvents="none" />
      
      {/* 光效扫过动画 */}
      <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]} pointerEvents="none">
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
            <OptimizedImage
              source={{ 
                uri: activity.image,
                priority: 'normal'
              }}
              style={styles.image}
              resizeMode={'cover'}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={theme.colors.text.tertiary} />
          </View>
        )}

        {/* 照片白字可读性遮罩 */}
        <LinearGradient
          colors={[
            RESTRAINED_COLORS.PHOTO_OVERLAY.darkMask.medium,
            'transparent', 
            RESTRAINED_COLORS.PHOTO_OVERLAY.darkMask.strong
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
              {String(activityLabel?.label || '')}
            </Text>
          </View>
        )}

        {/* 收藏按钮 */}
        {onBookmark && (
          <TouchableOpacity 
            style={styles.bookmarkButton}
            onPress={() => onBookmark(activity)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons 
              name={isBookmarked ? "heart" : "heart-outline"} 
              size={16} 
              color={isBookmarked ? "#FF6B35" : "rgba(255, 255, 255, 0.8)"} 
            />
          </TouchableOpacity>
        )}

        {/* 底部信息区 - 紧凑布局 */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={3}>
            {String(activity?.title || '')}
          </Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.locationRow}>
              <Ionicons 
                name="location-outline" 
                size={10} 
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
export const GridActivityCard = memo(GridActivityCardComponent, (prevProps, nextProps) => {
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
    // height: 移除固定高度，使用动态高度
    width: '100%', // 瀑布流：占满父容器宽度
    borderRadius: theme.borderRadius.card,
    overflow: 'visible',
    backgroundColor: theme.colors.background.primary,
    ...theme.shadows.sm,
    marginBottom: 2, // 瀑布流：极致紧凑的2px间距
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
  
  // 遮罩层
  overlayGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },

  // 活动状态标识
  activityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 收藏按钮样式 - 更小尺寸适配网格
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  
  // 底部信息区 - 更紧凑的网格布局
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8, // 更小的内边距适配变化高度
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: theme.borderRadius.card,
    borderBottomRightRadius: theme.borderRadius.card,
    zIndex: 2,
    minHeight: 60, // 确保最小高度
  },
  title: {
    fontSize: 14, // 更小的标题字体
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6, // 稍大间距适配3行
    lineHeight: 19, // 适配3行显示的行高
  },
  // 时间和地点布局
  detailsRow: {
    flexDirection: 'column', // 改为垂直布局节省空间
    alignItems: 'flex-start',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationIcon: {
    marginRight: 2,
  },
  location: {
    fontSize: 11, // 更小字体
    color: '#666666',
    flex: 1,
  },
  time: {
    fontSize: 11, // 更小字体
    color: '#666666',
    marginTop: 2,
  },
});