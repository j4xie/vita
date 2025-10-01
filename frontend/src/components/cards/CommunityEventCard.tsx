import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
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
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { useCardPress } from '../../hooks/useCardPress';
import { OptimizedImage } from '../common/OptimizedImage';
import { LoaderOne } from '../ui/LoaderOne';

const { width: screenWidth } = Dimensions.get('window');

interface CommunityEventCardProps {
  event: {
    id: string;
    title: string;
    location: string;
    dateRange: string;
    price?: number | string;
    currency?: string;
    image?: string;
    organizerName?: string;
    organizerAvatar?: string;
  };
  onPress: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

const CommunityEventCardComponent: React.FC<CommunityEventCardProps> = ({
  event,
  onPress,
  onBookmark,
  isBookmarked = false,
}) => {
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 动画值
  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-200);
  const borderGlow = useSharedValue(0);
  const elevationScale = useSharedValue(1);
  const bookmarkScale = useSharedValue(1);

  // 卡片尺寸 - 模仿 SeatGeek
  const cardHeight = 340;
  const imageHeight = 240;
  const infoHeight = 100;

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

  // 收藏按钮动画
  const handleBookmark = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    bookmarkScale.value = withSpring(1.2, {
      damping: 10,
      stiffness: 300,
    });

    setTimeout(() => {
      bookmarkScale.value = withSpring(1);
    }, 150);

    onBookmark?.();
  };

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

  // 动画样式定义
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(elevationScale.value, [1, 1.5], [0.1, 0.2]),
    shadowRadius: interpolate(elevationScale.value, [1, 1.5], [8, 16]),
    elevation: interpolate(elevationScale.value, [1, 1.5], [4, 8]),
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
    opacity: interpolate(shimmerX.value, [-200, 0, 200, 400], [0, 0.8, 0.8, 0]),
  }));

  const borderGlowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 107, 53, ${borderGlow.value * 0.6})`,
    shadowColor: '#FF6B35',
    shadowOpacity: borderGlow.value * 0.3,
    shadowRadius: borderGlow.value * 12,
  }));

  const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
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
        {/* 图片背景区域 */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {event.image && !imageError ? (
            <>
              <OptimizedImage
                source={{
                  uri: event.image,
                  priority: 'normal'
                }}
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
                  <LoaderOne size="small" color={theme.colors.primary} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={theme.colors.text.tertiary} />
            </View>
          )}

          {/* 渐变遮罩 - 底部加深 */}
          <LinearGradient
            colors={[
              'transparent',
              'rgba(0, 0, 0, 0.3)',
            ]}
            locations={[0.5, 1]}
            style={styles.overlayGradient}
          />

          {/* 价格标签 - 左下角 */}
          {event.price && (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>
                {event.currency || '$'}{typeof event.price === 'number' ? event.price : event.price}
              </Text>
            </View>
          )}

          {/* 收藏按钮 - 右上角 */}
          <Animated.View style={[styles.bookmarkButton, bookmarkAnimatedStyle]}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleBookmark();
              }}
              style={styles.bookmarkTouchArea}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isBookmarked ? "heart" : "heart-outline"}
                size={24}
                color={isBookmarked ? "#EF4444" : "#FFFFFF"}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* 底部信息区 */}
        <View style={[styles.infoContainer, { height: infoHeight }]}>
          {/* 活动标题 */}
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          {/* 日期和地点 */}
          <Text style={styles.dateRange} numberOfLines={1}>
            {event.dateRange}
          </Text>

          <Text style={styles.location} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// 性能优化：使用React.memo防止不必要的重新渲染
export const CommunityEventCard = memo(CommunityEventCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.isBookmarked === nextProps.isBookmarked
  );
});

const styles = StyleSheet.create({
  container: {
    width: screenWidth - 32,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'visible',
    backgroundColor: theme.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // 触摸区域
  touchableArea: {
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  // 边缘发光效果
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
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
    borderRadius: 16,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 10,
  },

  shimmerGradient: {
    flex: 1,
    borderRadius: 16,
  },

  // 图片区域
  imageContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: theme.colors.background.tertiary,
  },

  image: {
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
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
  },

  // 渐变遮罩
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },

  // 价格标签 - 左下角（模仿 SeatGeek）
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 3,
  },

  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 收藏按钮 - 右上角
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 3,
  },

  bookmarkTouchArea: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 22,
  },

  // 底部信息区
  infoContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
    lineHeight: 24,
  },

  dateRange: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },

  location: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
  },
});
