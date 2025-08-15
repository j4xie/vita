import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { scaleIn, scaleOut, bounce } from '../../utils/animations';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { analytics, Events } from '../../analytics/EventTracker';

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
    subtitle?: string;
    location: string;
    date: string;
    time: string;
    image: string;
    attendees: number;
    maxAttendees: number;
    status: string;
    price?: number;
    isFree?: boolean;
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
  // 确保activity对象存在
  if (!activity || typeof activity !== 'object') {
    return null;
  }
  
  // 提前进行所有数据转换，避免在render中出现类型错误
  const safeActivity = {
    id: safeString(activity.id),
    title: safeString(activity.title, 'Activity'),
    subtitle: safeString(activity.subtitle),
    location: safeString(activity.location, 'TBD'),
    date: safeString(activity.date),
    time: safeString(activity.time, 'TBD'),
    image: safeString(activity.image),
    attendees: safeNumber(activity.attendees, 0),
    maxAttendees: safeNumber(activity.maxAttendees, 0),
    status: safeString(activity.status, 'upcoming'),
    price: safeNumber(activity.price, 0),
    isFree: Boolean(activity.isFree),
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
      case 'ongoing':
        return { text: t('activityCard.status.ongoing'), color: theme.colors.success };
      case 'upcoming':
        return { text: t('activityCard.status.upcoming'), color: theme.colors.primary };
      case 'almost_full':
        return { text: t('activityCard.status.full'), color: theme.colors.warning };
      case 'full':
        return { text: t('activityCard.status.full'), color: theme.colors.text.secondary };
      case 'ended':
        return { text: t('activityCard.status.ended'), color: theme.colors.text.disabled };
      default:
        return { text: t('activityCard.status.available'), color: theme.colors.primary };
    }
  };

  const statusConfig = getStatusConfig(safeActivity.status);
  const availableSpots = Math.max(0, safeActivity.maxAttendees - safeActivity.attendees);
  const isAlmostFull = availableSpots <= 5 && availableSpots > 0;

  // 优质的卡片按压动画 - iOS风格体验
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 2, // 轻微向下移动2px增强按压感
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0, // 弹回原位
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // v1.2: 卡片点击事件追踪
  const handleCardPress = () => {
    analytics.trackActivityEvent('press', safeActivity.id, {
      title: safeActivity.title,
      category: activity.category || 'unknown',
      status: safeActivity.status,
      attendees: safeActivity.attendees,
      maxAttendees: safeActivity.maxAttendees,
    });
    onPress?.();
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    // 收藏按钮点击动画
    bounce(favoriteScaleAnim).start();
    onFavorite?.();
  };

  const handleRegisterPress = (e: any) => {
    e.stopPropagation();
    onRegister?.();
  };

  // V1.1 规范: 滑动手势处理
  const resetSwipe = () => {
    Animated.parallel([
      Animated.spring(translateXAnim, {
        toValue: 0,
        ...SWIPE_CONFIG.SPRING_CONFIG,
        useNativeDriver: true,
      }),
      Animated.timing(actionOpacityAnim, {
        toValue: 0,
        duration: SWIPE_CONFIG.ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSwipeActive(false);
      setSwipeDirection(null);
    });
  };

  const revealActions = (direction: 'left' | 'right') => {
    const translateValue = direction === 'left' ? -SWIPE_CONFIG.REVEAL_WIDTH : SWIPE_CONFIG.REVEAL_WIDTH;
    setIsSwipeActive(true);
    setSwipeDirection(direction);
    
    Animated.parallel([
      Animated.spring(translateXAnim, {
        toValue: translateValue,
        ...SWIPE_CONFIG.SPRING_CONFIG,
        useNativeDriver: true,
      }),
      Animated.timing(actionOpacityAnim, {
        toValue: 1,
        duration: SWIPE_CONFIG.ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 滑动手势响应器
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        // React Native Reanimated 3 不支持直接访问 _value
        translateXAnim.setOffset(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // 限制滑动范围
        const clampedDx = Math.max(-SWIPE_CONFIG.REVEAL_WIDTH, Math.min(SWIPE_CONFIG.REVEAL_WIDTH, gestureState.dx));
        translateXAnim.setValue(clampedDx);
        
        // 动态调整操作按钮透明度
        const opacity = Math.min(1, Math.abs(gestureState.dx) / SWIPE_CONFIG.THRESHOLD);
        actionOpacityAnim.setValue(opacity);
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateXAnim.flattenOffset();
        
        if (Math.abs(gestureState.dx) > SWIPE_CONFIG.THRESHOLD) {
          // 触发显示操作
          const direction = gestureState.dx < 0 ? 'left' : 'right';
          revealActions(direction);
        } else {
          // 回弹到原位
          resetSwipe();
        }
      },
    })
  ).current;

  // 滑动操作处理函数
  const handleSwipeAction = (action: 'share' | 'bookmark' | 'notify', callback?: () => void) => {
    // v1.2: 追踪滑动操作
    analytics.trackActivityEvent(action, safeActivity.id, {
      swipe_action: action,
      title: safeActivity.title,
    });
    
    resetSwipe();
    setTimeout(() => {
      callback?.();
    }, 100);
  };

  // v1.2 动态样式计算 - 启用阴影优化
  const liquidGlassConfig = getLiquidGlassConfig('card', true); // 启用阴影优化
  const optimizedStyles = getOptimizedStyles();

  // 动画样式
  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { translateY: translateYAnim },
      { translateX: translateXAnim },
    ],
    opacity: opacityAnim,
  };

  const favoriteAnimatedStyle = {
    transform: [{ scale: favoriteScaleAnim }],
  };

  return (
    <View style={styles.swipeContainer}>
      {/* 左滑操作按钮 (右侧显示) */}
      {swipeDirection === 'left' && (
        <Animated.View style={[styles.leftActionsContainer, { opacity: actionOpacityAnim }]}>
          {onBookmark && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.bookmarkButton]}
              onPress={() => handleSwipeAction('bookmark', onBookmark)}
            >
              <Ionicons name="bookmark-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
          {onShare && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => handleSwipeAction('share', onShare)}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* 右滑操作按钮 (左侧显示) */}
      {swipeDirection === 'right' && (
        <Animated.View style={[styles.rightActionsContainer, { opacity: actionOpacityAnim }]}>
          {onNotifyMe && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.notifyButton]}
              onPress={() => handleSwipeAction('notify', onNotifyMe)}
            >
              <Ionicons name="notifications-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* 主卡片内容 - 使用Shadow包装器 */}
      <Animated.View 
        style={[styles.container, animatedStyle]}
        {...panResponder.panHandlers}
      >
        {/* Shadow容器 - solid background用于阴影优化 */}
        <View style={[
          styles.shadowContainer,
          isPerformanceDegraded && { ...theme.shadows.none } // 性能降级时移除阴影
        ]}>
          <TouchableOpacity
            style={[
              styles.touchableContainer,
              {
                backgroundColor: liquidGlassConfig.background,
                borderColor: liquidGlassConfig.border,
              }
            ]}
            onPress={handleCardPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
      {/* Hero Image Section with Modern Gradient Overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: safeActivity.image }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* VitaGlobal 对比度增强渐变遮罩 */}
        <LinearGradient
          colors={[
            'rgba(255, 107, 53, 0.05)',   // VitaGlobal 橙色轻微遮罩
            'rgba(255, 71, 87, 0.15)',    // VitaGlobal 珊瑚红深度
            'rgba(26, 26, 26, 0.75)'      // 底部暗层确保文字对比度
          ]}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Top Row - Status & Favorite */}
          <View style={styles.topRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusText}>{statusConfig.text}</Text>
            </View>
            
            {onFavorite && (
              <Animated.View style={favoriteAnimatedStyle}>
                <TouchableOpacity 
                  style={styles.favoriteButton}
                  onPress={handleFavoritePress}
                >
                  <Ionicons name="heart-outline" size={22} color="white" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Bottom Content */}
          <View style={styles.overlayContent}>
            {/* Organizer Info */}
            {safeActivity.organizer && (
              <View style={styles.organizerRow}>
                {safeActivity.organizer.avatar && (
                  <Image 
                    source={{ uri: safeActivity.organizer.avatar }} 
                    style={styles.organizerAvatar} 
                  />
                )}
                <Text style={styles.organizerName}>
                  {safeActivity.organizer.name}
                </Text>
                {safeActivity.organizer.verified && (
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                )}
              </View>
            )}
            
            {/* Activity Title */}
            <Text style={styles.title} numberOfLines={2}>
              {safeActivity.title}
            </Text>
            
            {safeActivity.subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {safeActivity.subtitle}
              </Text>
            )}

            {/* Meta Information */}
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.metaText}>{formatDate(safeActivity.date)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.metaText}>{safeActivity.time}</Text>
                </View>
              </View>
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.metaText} numberOfLines={1}>{safeActivity.location}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom Action Section */}
      <View style={styles.actionContainer}>
        {/* Glass Shimmer Effect */}
        <View style={styles.glassShimmer} />
        {/* v1.2 Dynamic Dark Overlay for Better Contrast */}
        <View style={[
          styles.darkOverlay,
          { opacity: isPerformanceDegraded ? 0 : 1 }
        ]} />
        <View style={styles.participantInfo}>
          <View style={styles.participantRow}>
            <Ionicons name="people-outline" size={18} color={theme.colors.text.secondary} />
            <Text style={styles.participantText}>
              {safeString(safeActivity.attendees)}/{safeString(safeActivity.maxAttendees)} people
            </Text>
            
            {safeActivity.isFree && (
              <View style={styles.freeTag}>
                <Text style={styles.freeText}>Free</Text>
              </View>
            )}
            
            {safeActivity.price && !safeActivity.isFree && (
              <Text style={styles.priceText}>¥{safeString(safeActivity.price)}</Text>
            )}
          </View>
          
          <Text style={[
            styles.availableText,
            isAlmostFull && styles.urgentText
          ]}>
            {availableSpots > 0 
              ? `${safeString(availableSpots)} spots left${isAlmostFull ? ' 🔥' : ''}`
              : 'Full'
            }
          </Text>
        </View>
        
        {onRegister && (
          <View style={[
            styles.registerButtonShadowWrapper,
            availableSpots === 0 && styles.disabledButtonWrapper
          ]}>
            <LinearGradient
              colors={availableSpots > 0 ? [theme.colors.primary, theme.colors.primaryPressed] : [theme.colors.text.disabled, theme.colors.text.tertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.registerButtonGradient}
            >
              {/* 玻璃高光效果 */}
              {availableSpots > 0 && <View style={styles.buttonGlassHighlight} />}
              <TouchableOpacity 
                onPress={handleRegisterPress}
                disabled={availableSpots === 0}
                style={styles.registerButtonInner}
              >
                <Text style={[
                  styles.registerText,
                  availableSpots === 0 && styles.disabledText
                ]}>
                  {availableSpots > 0 ? 'Register' : 'Full'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // V1.1 规范: 滑动操作容器
  swipeContainer: {
    position: 'relative',
    width: cardWidth,
    marginBottom: theme.spacing.lg,
  },
  
  // Main Container
  container: {
    width: cardWidth,
  },
  // Shadow容器 - 解决LinearGradient阴影冲突
  shadowContainer: {
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.primary, // solid background用于阴影优化
    ...theme.shadows.md,
  },
  
  // 基础容器样式 - 移除阴影到专用容器
  touchableContainer: {
    backgroundColor: theme.liquidGlass.card.background,
    borderRadius: theme.borderRadius.md, // v1.2 规范: 16pt 卡片圆角
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
  },
  
  // Image Section
  imageContainer: {
    width: '100%',
    height: 240, // 更大的图片高度，增强视觉冲击力
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  
  // Top Row (Status & Favorite)
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  favoriteButton: {
    padding: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.full,
  },
  
  // Overlay Content
  overlayContent: {
    alignItems: 'flex-start',
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  organizerAvatar: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.avatar,
    marginRight: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  organizerName: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing.xs,
  },
  
  // Title Section
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.fontSize['2xl'] * theme.typography.lineHeight.tight,
    // v1.2 文字描边增强对比度
    textShadowColor: 'rgba(0, 0, 0, 0.9)', // 更强的描边
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)', // v1.2: 提高对比度
    marginBottom: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
    // v1.2 文字描边增强对比度
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Meta Information
  metaContainer: {
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs / 2,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    minWidth: 0,
    flex: 1,
  },
  metaText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.95)', // v1.2: 略微增加透明度
    marginLeft: theme.spacing.xs / 2,
    fontWeight: theme.typography.fontWeight.medium,
    // v1.2 文字描边增强对比度
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // 深色描边
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Bottom Action Section - 液态玻璃设计
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.liquidGlass.floating.background,
    borderTopWidth: 1,
    borderTopColor: theme.liquidGlass.card.border,
    // 添加玻璃反光条
    position: 'relative',
  },
  participantInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs / 2,
  },
  participantText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  freeTag: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.badge,
  },
  freeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  priceText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  availableText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  urgentText: {
    color: theme.colors.warning,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  // Register Button Shadow Wrapper - 阴影优化包装器
  registerButtonShadowWrapper: {
    borderRadius: theme.borderRadius.button + 4,
    ...theme.shadows.sm, // v1.2 规范: 按钮使用 sm 级别阴影
    backgroundColor: theme.colors.background.primary, // solid background优化阴影渲染
  },
  disabledButtonWrapper: {
    ...theme.shadows.none,
    backgroundColor: theme.colors.background.primary,
  },
  // Register Button Gradient - LinearGradient样式
  registerButtonGradient: {
    borderRadius: theme.borderRadius.button + 4,
    minWidth: 100,
    borderWidth: 1.5,
    borderColor: theme.liquidGlass.primaryGlass.border,
    // 添加玻璃光泽效果
    position: 'relative',
    overflow: 'hidden',
  },
  registerButtonInner: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },
  
  // 液态玻璃特效
  glassShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.liquidGlass.card.shimmer,
    opacity: 0.6,
  },
  
  // v1.2 动态暗层样式
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // v1.2 规范: 黑 @10%
    pointerEvents: 'none',
  },
  
  buttonGlassHighlight: {
    position: 'absolute',
    top: 1,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: theme.borderRadius.button,
  },
  
  // V1.1 规范: 滑动操作按钮样式
  leftActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_CONFIG.REVEAL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  rightActionsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_CONFIG.REVEAL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: theme.colors.background.primary,
    ...theme.shadows.sm,
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
  },
  bookmarkButton: {
    backgroundColor: theme.colors.warning,
  },
  notifyButton: {
    backgroundColor: theme.colors.primary,
  },
});