import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
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
import { LIQUID_GLASS_LAYERS, DAWN_OVERLAYS, RESTRAINED_COLORS } from '../../theme/core';
import { useCardPress } from '../../hooks/useCardPress';

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
  // 滚动视差动画支持
  scrollY?: Animated.SharedValue<number>;
  index?: number;
}

export const SimpleActivityCard: React.FC<SimpleActivityCardProps> = ({
  activity,
  onPress,
  scrollY,
  index = 0,
}) => {
  const { t, i18n } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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

  // 简单的卡片点击检测 - 不干扰滚动
  const cardPress = useCardPress({
    onPress: () => {
      // 确认是真正的点击事件，执行导航
      onPress();
    },
    onPressIn: handleGestureStart,
    onPressOut: handleGestureEnd,
  }, {
    maxMoveThreshold: 15,      // 15px 内的移动仍视为点击
    maxTimeThreshold: 400,     // 400ms 内视为点击
    enableHaptics: Platform.OS === 'ios',
    debug: false,
  });

  // 边缘光效动画（进入时触发）
  const triggerShimmer = () => {
    shimmerX.value = -200;
    shimmerX.value = withTiming(400, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  };

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
  }, []);

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

  // 参与率接近满员时的特殊发光效果
  React.useEffect(() => {
    if (isAlmostFull) {
      // 缓慢的呼吸发光效果
      borderGlow.value = withSequence(
        withTiming(0.3, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      );
    }
  }, [isAlmostFull]);

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

      {/* 状态标签 - L2微型胶囊 */}
      <View style={styles.statusBadge}>
        <Text style={styles.badgeText}>{statusConfig.label}</Text>
      </View>

      {/* 参与人数指示器 - L2微型胶囊 */}
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

      {/* 底部信息区 */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {activity.title}
        </Text>
        
        <View style={styles.locationRow}>
          <Ionicons 
            name="location-outline" 
            size={14} 
            color="#666666" 
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
      </Animated.View>
    </Animated.View>
  );
};

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
  
  // 底部信息区 - 小红书风格纯色背景
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#FFFFFF', // 纯白色背景
    borderBottomLeftRadius: theme.borderRadius.card,
    borderBottomRightRadius: theme.borderRadius.card,
    zIndex: 2, // 确保在遮罩上方
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A', // 小红书风格深色文字
    marginBottom: 8,
    // 移除阴影，在白色背景上不需要
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
    color: '#666666', // 小红书风格中灰色
    flex: 1,
    // 移除阴影和透明度，在白色背景上不需要
  },
  time: {
    fontSize: 13,
    color: '#666666', // 小红书风格中灰色
    // 移除阴影和透明度，在白色背景上不需要
  },
});