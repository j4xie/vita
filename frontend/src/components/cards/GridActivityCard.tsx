import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
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
import { LoaderOne } from '../ui/LoaderOne';

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
    organizerName?: string; // 组织者名称
    organizerAvatar?: string; // 组织者头像
  } | null;
  onPress: () => void;
  onBookmark?: (activity: any) => void;
  isBookmarked?: boolean;
  // 新增操作回调
  onShare?: () => void;
  onInterested?: () => void;
  onJoin?: () => void;
  isInterested?: boolean;
  isJoined?: boolean;
  onMoreOptions?: () => void;
}

const GridActivityCardComponent: React.FC<GridActivityCardProps> = ({
  activity,
  onPress,
  onBookmark,
  isBookmarked = false,
  onShare,
  onInterested,
  onJoin,
  isInterested = false,
  isJoined = false,
  onMoreOptions,
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

  // 动态计算卡片高度以精确匹配1200:675图片比例
  const screenWidth = Dimensions.get('window').width;
  const containerWidth = screenWidth - 8; // 减去waterfallContainer的paddingHorizontal: 4 (左右共8px)
  const cardWidth = containerWidth * 0.48; // 瀑布流布局，每列占48%
  const imageHeight = cardWidth * (675 / 1200); // 精确的图片高度
  const infoHeight = 90; // 底部信息区固定高度
  const cardHeight = imageHeight + infoHeight; // 动态卡片总高度，消除留白

  // 调试日志
  console.log('🎨 [GridActivityCard] 卡片尺寸计算:', {
    screenWidth,
    containerWidth,
    cardWidth,
    imageHeight,
    infoHeight,
    cardHeight,
    aspectRatio: 1200 / 675
  });
  
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
    <Animated.View style={[styles.container, { height: cardHeight }, animatedContainerStyle, animatedShadowStyle]}>
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
            <View style={[styles.imageContainer, { height: imageHeight }]}>
              <OptimizedImage
                source={{
                  uri: activity.image,
                  priority: 'normal'
                }}
                style={styles.image}
                resizeMode={'contain'}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </View>
            {imageLoading && (
              <View style={[styles.imageLoadingContainer, { height: imageHeight }]}>
                <LoaderOne size="small" color={theme.colors.primary} />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.imagePlaceholder, { height: imageHeight }]}>
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
          style={[styles.overlayGradient, { height: imageHeight }]}
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

        {/* 右上角三点菜单 */}
        {onMoreOptions && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              onMoreOptions();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.moreButtonCircle}>
              <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
            </View>
          </TouchableOpacity>
        )}


        {/* 底部信息区 - 重构布局 */}
        <View style={styles.infoContainer}>
          {/* 组织者信息行 */}
          <View style={styles.organizerRow}>
            <View style={styles.organizerInfo}>
              {activity.organizerAvatar ? (
                <Image
                  source={{ uri: activity.organizerAvatar }}
                  style={styles.organizerAvatar}
                />
              ) : (
                <View style={[styles.organizerAvatar, styles.organizerAvatarPlaceholder]}>
                  <Ionicons name="person" size={12} color="#999" />
                </View>
              )}
              <Text style={styles.organizerName} numberOfLines={1}>
                {activity.organizerName || t('activityCard.organizer.default', 'Organizer')}
              </Text>
            </View>
            <Text style={styles.attendeeCount}>
              {(activity.registeredCount || activity.attendees || 0)}/{activity.maxAttendees || 0}
            </Text>
          </View>

          {/* 活动标题 */}
          <Text
            style={styles.title}
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.85}
          >
            {String(activity?.title || '')}
          </Text>

          {/* 日期信息 */}
          <Text style={styles.time}>
            {formatActivityDateWithTimezone(activity as FrontendActivity, i18n.language as 'zh' | 'en')}
          </Text>

          {/* 底部操作按钮区 */}
          {(onShare || onInterested || onJoin) && (
            <View style={styles.actionButtonsContainer}>
              {/* Share按钮 */}
              {onShare && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons name="paper-plane-outline" size={18} color="#666" />
                  <Text style={styles.actionButtonText}>
                    {t('activityCard.actions.share', 'Share')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Interested按钮 */}
              {onInterested && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onInterested();
                  }}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons
                    name={isInterested ? "heart" : "heart-outline"}
                    size={18}
                    color={isInterested ? "#EF4444" : "#666"}
                  />
                  <Text style={[styles.actionButtonText, isInterested && styles.actionButtonTextActive]}>
                    {t('activityCard.actions.interested', 'Interested')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Join按钮 */}
              {onJoin && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onJoin();
                  }}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons
                    name={isJoined ? "checkmark-circle" : "checkmark-circle-outline"}
                    size={18}
                    color={isJoined ? "#10B981" : "#666"}
                  />
                  <Text style={[styles.actionButtonText, isJoined && styles.actionButtonTextActive]}>
                    {t('activityCard.actions.join', 'Join')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
    marginBottom: 8, // 方块布局：适中间距
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
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    // height通过inline style动态传递
    justifyContent: 'center', // 图片居中显示
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    // height通过inline style动态传递
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    // height通过inline style动态传递
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
  },
  
  // 遮罩层
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    // height通过inline style动态传递
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

  
  // 底部信息区 - 重构布局（参考IRL设计）
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: theme.borderRadius.card,
    borderBottomRightRadius: theme.borderRadius.card,
    zIndex: 2,
    minHeight: 90, // 增加最小高度以容纳新元素
  },
  title: {
    fontSize: 15, // 紧凑布局使用稍小字体
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20, // 优化行高，改善两行显示效果
    marginTop: 6, // 与组织者信息的间距
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
    fontSize: 12, // 紧凑布局使用更小字体
    color: '#666666', // 深灰色文字，更协调的视觉层级
    marginTop: 2,
    marginBottom: 6, // 与操作按钮的间距
  },

  // 右上角三点菜单
  moreButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 4,
  },
  moreButtonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  // 组织者信息行
  organizerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  organizerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: '#F0F0F0',
  },
  organizerAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  attendeeCount: {
    fontSize: 11,
    color: '#999',
    fontWeight: '400',
  },

  // 底部操作按钮
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#F8F8F8',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  actionButtonTextActive: {
    color: '#333',
    fontWeight: '600',
  },
});