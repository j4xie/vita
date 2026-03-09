import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { BRAND_GLASS, BRAND_INTERACTIONS, BRAND_GRADIENT } from '../../theme/core';
import { scaleIn, scaleOut, bounce } from '../../utils/animations';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useMemoizedDarkMode } from '../../hooks/useDarkMode';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useTheme } from '../../context/ThemeContext';
import EventTracker, { analytics, Events } from '../../analytics/EventTracker';
import { useSmartGesture } from '../../hooks/useSmartGesture';
import { useCardPress } from '../../hooks/useCardPress';
import { useSchoolLogos, getSchoolLogoSync } from '../../hooks/useSchoolLogos';

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
    endDate?: string;
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
    // 🔧 学校信息字段
    deptId?: number;
    deptName?: string;
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

  const { loading: schoolsLoading } = useSchoolLogos();

  // ========== ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS ==========
  // 基础动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // 滑动手势相关状态
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const actionOpacityAnim = useRef(new Animated.Value(0)).current;

  // 提前进行所有数据转换，避免在render中出现类型错误
  // Use safe defaults when activity is null/undefined
  const safeActivity = activity && typeof activity === 'object' ? {
    id: safeString(activity.id),
    title: safeString(activity.title, 'Activity'),
    location: safeString(activity.location, 'TBD'),
    date: safeString(activity.date),
    endDate: activity.endDate ? safeString(activity.endDate) : undefined,
    time: safeString(activity.time, 'TBD'),
    image: safeString(activity.image),
    attendees: safeNumber(activity.attendees, 0),
    maxAttendees: safeNumber(activity.maxAttendees, 0),
    status: safeString(activity.status, 'available'),
    category: activity.category || 'unknown',
    organizer: activity.organizer ? {
      name: safeString(activity.organizer.name, 'Organizer'),
      avatar: safeString(activity.organizer.avatar),
      verified: Boolean(activity.organizer.verified)
    } : null,
    // 🔧 学校信息
    deptId: safeNumber(activity.deptId, 0),
    deptName: safeString(activity.deptName, ''),
  } : {
    id: '',
    title: 'Activity',
    location: 'TBD',
    date: '',
    endDate: undefined,
    time: 'TBD',
    image: '',
    attendees: 0,
    maxAttendees: 0,
    status: 'available',
    category: 'unknown',
    organizer: null,
    deptId: 0,
    deptName: '',
  };

  // V1.1 规范: 滑动手势处理函数 - MUST be defined before useSmartGesture hook
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

  // 优质的卡片按压动画 - iOS风格体验 - MUST be defined before useCardPress hook
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
      category: safeActivity.category,
      status: safeActivity.status,
      attendees: safeActivity.attendees,
      maxAttendees: safeActivity.maxAttendees,
    });
    onPress?.();
  };

  // 使用简单的卡片点击检测 - 不干扰滚动
  const cardGesture = useCardPress({
    onPress: handleCardPress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  }, {
    maxMoveThreshold: 15,      // 15px 内的移动仍视为点击
    maxTimeThreshold: 400,     // 400ms 内视为点击
    enableHaptics: true,
    debug: false,
  });

  // 水平滑动检测 - 仅用于ActivityCard的滑动操作
  const swipeGesture = useSmartGesture({
    onSwipeStart: (direction) => {
      if (direction === 'horizontal') {
        setIsSwipeActive(true);
      }
    },
    onSwipeEnd: (direction, distance) => {
      if (direction === 'horizontal' && distance > SWIPE_CONFIG.THRESHOLD) {
        const swipeDir = distance > 0 ? 'right' : 'left';
        revealActions(swipeDir);
      } else {
        resetSwipe();
      }
    },
  }, {
    swipeThreshold: 8,         // 更低的阈值，优先捕获滑动
    velocityThreshold: 0.3,    // 更低的速度阈值
    timeThreshold: 200,        // 更短的时间阈值，快速响应
    enableHaptics: false,      // 关闭触觉反馈，避免冲突
    debug: false,
  });

  const schoolLogoUrl = useMemo(() => {
    if (!schoolsLoading) {
      const textLogo = getSchoolLogoSync(activity?.title || '', activity?.location || '');
      if (textLogo) return textLogo;
    }

    const avatar = activity?.organizer?.avatar;
    if (avatar && !avatar.includes('ui-avatars.com') && !avatar.includes('americanpromotioncompany.com')) {
      return avatar;
    }

    return null;
  }, [activity?.title, activity?.location, activity?.organizer?.avatar, schoolsLoading]);

  // ========== EARLY RETURN AFTER ALL HOOKS ==========
  // 确保activity对象存在 - must be AFTER all hooks to comply with rules-of-hooks
  if (!activity || typeof activity !== 'object') {
    return null;
  }

  // Helper functions that don't need to be before hooks
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
      return t('activities.date_tbd', '待定日期');
    }
  };

  // 格式化日期范围（与ActivityDetailScreen逻辑一致）
  const formatDateRange = (): string => {
    if (!safeActivity.date) return 'TBD';

    // 如果有endDate且与startDate不同，显示日期范围
    if (safeActivity.endDate && safeActivity.endDate !== safeActivity.date) {
      const startParts = safeActivity.date.split('-');
      const endParts = safeActivity.endDate.split('-');

      if (startParts.length === 3 && endParts.length === 3) {
        const startMonth = startParts[1].padStart(2, '0');
        const startDay = startParts[2].padStart(2, '0');
        const endMonth = endParts[1].padStart(2, '0');
        const endDay = endParts[2].padStart(2, '0');

        return `${startMonth}/${startDay}-${endMonth}/${endDay}`;
      }
    }

    // 否则只显示单个日期
    return formatDate(safeActivity.date);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { text: t('activityCard.status.available'), color: BRAND_INTERACTIONS.navigation.active.text };
      case 'registered':
        return { text: t('activityCard.status.registered'), color: theme.colors.success };
      case 'checked_in':
        return { text: t('activityCard.status.checked_in'), color: theme.colors.success };
      case 'almost_full':
        return { text: t('activityCard.status.full'), color: theme.colors.warning };
      case 'full':
        return { text: t('activityCard.status.full'), color: theme.colors.text.secondary };
      case 'ended':
        return { text: t('activityCard.status.ended'), color: theme.colors.text.disabled };
      default:
        return { text: t('activityCard.status.available'), color: BRAND_INTERACTIONS.navigation.active.text };
    }
  };

  const statusConfig = getStatusConfig(safeActivity.status);
  const availableSpots = Math.max(0, safeActivity.maxAttendees - safeActivity.attendees);
  const isAlmostFull = availableSpots <= 5 && availableSpots > 0;

  const handleRegisterPress = () => {
    onRegister?.();
  };

  // 移除了原有的PanResponder，使用新的智能手势检测系统

  // 滑动操作处理函数
  const handleSwipeAction = (action: 'share' | 'bookmark' | 'notify', callback?: () => void) => {
    // v1.2: 追踪滑动操作
    const trackingEvent = action === 'notify' ? 'view' : action; // 将notify映射到view事件
    analytics.trackActivityEvent(trackingEvent, safeActivity.id, {
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

  // 动画样式 - Fixed for React Native Reanimated 3 compatibility
  const animatedStyle: any = {
    transform: [
      { scale: scaleAnim },
      { translateY: translateYAnim },
      { translateX: translateXAnim },
    ],
    opacity: opacityAnim,
  };


  // Static styles (dynamic styles will be applied inline)
  const staticStyles = StyleSheet.create({
    shadowContainer: {
      borderRadius: theme.borderRadius.lg,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
    },
    
    touchableContainer: {
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden' as const,
      borderWidth: 1.5,
    },
    
    actionContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: theme.spacing.md,
      borderTopWidth: 1.5,
      borderBottomLeftRadius: theme.borderRadius.md,
      borderBottomRightRadius: theme.borderRadius.md,
    },
    
    titleText: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      lineHeight: 28,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    
    participantText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      marginLeft: theme.spacing.xs,
    },
    
    availableText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    },
    
    metaText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.regular,
      marginLeft: theme.spacing.xs,
    },
  });

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
              <Ionicons name="bookmark-outline" size={20} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          )}
          {onShare && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => handleSwipeAction('share', onShare)}
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.text.inverse} />
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
              <Ionicons name="notifications-outline" size={20} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* 主卡片内容 - 使用智能手势检测 */}
      <Animated.View 
        style={[styles.container, animatedStyle]}
        {...swipeGesture.panHandlers}
      >
        {/* Shadow容器 - solid background用于阴影优化 */}
        <View style={[
          dmStyles.card.shadowContainer,
          isPerformanceDegraded && { ...theme.shadows.none } // 性能降级时移除阴影
        ]}>
          <Animated.View
            style={[
              dmStyles.card.touchableContainer,
              {
                backgroundColor: liquidGlassConfig.background,
                borderColor: liquidGlassConfig.border,
              }
            ]}
            {...cardGesture.touchHandlers}
          >
      {/* Hero Image Section with Modern Gradient Overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: safeActivity.image }}
          style={styles.image}
          resizeMode="contain"
        />
        
        {/* PomeloX 对比度增强渐变遮罩 - 🌙 Dark Mode适配 */}
        <LinearGradient
          colors={dmGradients.overlayGradient}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Top Row - Status & School Logo */}
          <View style={styles.topRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusText}>{statusConfig.text}</Text>
            </View>

            {/* School Logo Badge - Right Aligned */}
            {schoolLogoUrl && (
              <View style={styles.schoolBadgeTop}>
                <Image
                  source={{ uri: schoolLogoUrl }}
                  style={styles.schoolLogoTop}
                  resizeMode="contain"
                />
              </View>
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
                  <Ionicons name="checkmark-circle" size={16} color={BRAND_INTERACTIONS.navigation.active.text} />
                )}
              </View>
            )}

            {/* Activity Title - 🌙 Dark Mode适配 */}
            <Text style={dmStyles.text.title} numberOfLines={2}>
              {safeActivity.title}
            </Text>
            

            {/* Meta Information */}
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={dmIcons.secondary} />
                  <Text style={[
                    staticStyles.metaText,
                    { color: isDarkMode ? dmStyles.text.secondary.color : theme.colors.text.secondary }
                  ]}>{formatDateRange()}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={dmIcons.secondary} />
                  <Text style={[
                    staticStyles.metaText,
                    { color: isDarkMode ? dmStyles.text.secondary.color : theme.colors.text.secondary }
                  ]}>{safeActivity.time}</Text>
                </View>
              </View>
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={dmIcons.secondary} />
                  <Text style={[
                    staticStyles.metaText,
                    { color: isDarkMode ? dmStyles.text.secondary.color : theme.colors.text.secondary }
                  ]} numberOfLines={1}>{safeActivity.location}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom Action Section - 🌙 Dark Mode适配 */}
      <View style={[
        staticStyles.actionContainer,
        {
          backgroundColor: isDarkMode ? dmStyles.card.contentSection.backgroundColor : 'rgba(255, 255, 255, 0.95)',
          borderTopColor: isDarkMode ? 'rgba(84, 84, 88, 0.4)' : 'rgba(255, 255, 255, 0.6)',
        }
      ]}>
        {/* Glass Shimmer Effect */}
        <View style={styles.glassShimmer} />
        {/* v1.2 Dynamic Dark Overlay for Better Contrast */}
        <View style={[
          styles.darkOverlay,
          { opacity: isPerformanceDegraded ? 0 : 1 }
        ]} />
        <View style={styles.participantInfo}>
          <View style={styles.participantRow}>
            <Ionicons name="people-outline" size={18} color={dmIcons.secondary} />
            <Text style={[
              staticStyles.participantText,
              { color: isDarkMode ? dmStyles.text.secondary.color : theme.colors.text.secondary }
            ]}>
              {safeString(safeActivity.attendees)}/{safeString(safeActivity.maxAttendees)} people
            </Text>
            
          </View>
          
          <Text style={[
            staticStyles.availableText,
            { color: isDarkMode ? dmStyles.text.tertiary.color : theme.colors.text.tertiary },
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
              colors={availableSpots > 0 ? BRAND_GRADIENT : [theme.colors.text.disabled, theme.colors.text.tertiary]}
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
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
          </Animated.View>
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
  // Shadow容器 - Liquid Glass 风格卡片设计
  shadowContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // 加强背景白色
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  // 基础容器样式 - 加强 Liquid Glass 效果
  touchableContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // 加强背景白色
    borderRadius: theme.borderRadius.lg, // 更大的圆角
    overflow: 'hidden',
    borderWidth: 1.5, // 添加清晰边框
    borderColor: 'rgba(255, 255, 255, 0.8)', // 明显的白色边框
  },
  
  // Image Section
  imageContainer: {
    width: '100%',
    height: 240, // 更大的图片高度，增强视觉冲击力
    position: 'relative',
    justifyContent: 'flex-start', // 图片向上对齐
    alignItems: 'center',
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
  
  // Top Row (Status & School Logo)
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
  schoolBadgeTop: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 50,
    padding: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  schoolLogoTop: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing.xs,
  },
  
  // Title Section
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.fontSize['2xl'] * theme.typography.lineHeight.tight,
    // 增强文字描边确保可读性
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
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
    color: 'rgba(255, 255, 255, 0.95)', // 恢复白色以适配深色背景
    marginLeft: theme.spacing.xs / 2,
    fontWeight: theme.typography.fontWeight.medium,
    // v1.2 文字描边增强对比度
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // 深色描边
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Bottom Action Section - Liquid Glass 风格背景
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    // Liquid Glass 风格的圆角
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
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
    color: '#1A1A1A', // 小红书风格深灰色
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  availableText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#666666', // 小红书风格中灰色
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
    backgroundColor: BRAND_INTERACTIONS.navigation.active.text,
  },
  bookmarkButton: {
    backgroundColor: theme.colors.warning,
  },
  notifyButton: {
    backgroundColor: BRAND_INTERACTIONS.navigation.active.text,
  },
});