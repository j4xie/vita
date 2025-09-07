import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { BlurView } from '../../components/web/WebBlurView';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { Glass } from './GlassTheme';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { i18n } from '../../utils/i18n';

interface LiquidGlassListItemProps {
  id: string;
  nameCN: string;        // For backward compatibility 
  nameEN: string;        // For backward compatibility
  deptName?: string;     // API: Chinese full name
  engName?: string;      // API: English full name  
  aprName?: string;      // API: Abbreviation/short name
  city?: string;         // Will be removed from display
  state?: string;        // Will be removed from display
  volunteers: number;
  tint: string;
  schoolId: string;
  onPress: () => void;
  disabled?: boolean;
  isScrolling?: boolean; // 🚀 新增：滚动状态，用于防止滚动时误触
}

export const LiquidGlassListItem: React.FC<LiquidGlassListItemProps> = ({
  id,
  nameCN,
  nameEN,
  deptName,
  engName,
  aprName,
  city,
  state,
  volunteers,
  tint,
  schoolId,
  onPress,
  disabled = false,
  isScrolling = false, // 🚀 接收滚动状态
}) => {
  const pressed = useSharedValue(0);
  const logoSource = getSchoolLogo(schoolId);
  
  // 🌍 NEW: 根据用户要求和语言获取正确的标题和副标题
  const getDisplayInfo = () => {
    const isEnglish = i18n.language === 'en-US';
    
    if (isEnglish) {
      // 英文界面：标题=aprName(短名称)，副标题=engName(完整英文名)
      return {
        title: aprName || nameCN || deptName || '未知学校',
        subtitle: engName || nameEN || '学校'
      };
    } else {
      // 中文界面：标题=deptName(中文全名)，副标题=aprName(缩写)  
      return {
        title: deptName || nameCN || '未知学校',
        subtitle: aprName || nameEN || '学校'
      };
    }
  };
  
  const displayInfo = getDisplayInfo();
  
  // 添加滑动容忍度
  const [touchStart, setTouchStart] = React.useState<{x: number, y: number} | null>(null);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.02 * pressed.value }], // scale 1 → 0.98
  }));

  const handlePressIn = (event: any) => {
    if (disabled) return;
    
    // 记录触摸开始位置
    setTouchStart({
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY
    });
    
    pressed.value = withTiming(1, { duration: Glass.animation.pressDuration });
  };

  const handlePressOut = (event: any) => {
    if (disabled) return;
    
    pressed.value = withSpring(0, Glass.animation.springConfig);
    
    // 🚨 第一重保护：滚动状态检查
    if (isScrolling) {
      console.log('🚫 [SCROLL-GUARD] 滚动中拒绝点击，重置状态');
      setTouchStart(null);
      return;
    }
    
    // 🚨 第二重保护：滑动距离检查
    if (touchStart) {
      const deltaX = Math.abs(event.nativeEvent.pageX - touchStart.x);
      const deltaY = Math.abs(event.nativeEvent.pageY - touchStart.y);
      const threshold = 15; // 🚀 调整到15像素的滑动容忍度，平衡防误触和响应速度
      
      // 如果滑动距离超过阈值，不触发点击
      if (deltaX > threshold || deltaY > threshold) {
        console.log('🚫 [SWIPE-CANCEL] 检测到滑动操作，取消点击事件，距离:', Math.max(deltaX, deltaY));
        setTouchStart(null);
        return;
      } else {
        console.log('✅ [CLICK-VALID] 滑动距离在阈值内，确认点击，距离:', Math.max(deltaX, deltaY));
      }
    }
    
    // iOS触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    console.log('🎯 [LIQUID-GLASS] 确认触发点击事件');
    setTouchStart(null);
    onPress();
  };

  return (
    <Animated.View style={[
      styles.container,
      animatedStyle,
      // 增强阴影让列表项浮起来
      Glass.shadows.sm.ios,
      { elevation: Glass.shadows.sm.android.elevation }
    ]}>
      <View style={styles.shadowWrapper}>
        <BlurView intensity={Glass.blur} tint="light" style={styles.blurContainer}>
          {/* 顶部1px高光分隔线 */}
          <LinearGradient 
            colors={[Glass.hairlineFrom, Glass.hairlineTo]}
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={styles.hairline}
          />
          
          {/* 白系叠色渐变 */}
          <LinearGradient 
            colors={[Glass.overlayTop, Glass.overlayBottom]}
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }}
            style={styles.overlay}
          />

          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[styles.content, disabled && styles.disabledContent]}
            activeOpacity={0.95}
            delayLongPress={200}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
          {/* 左侧校徽 */}
          <View style={[
            styles.iconContainer, 
            { backgroundColor: logoSource ? '#FFFFFF' : tint }
          ]}>
            {logoSource ? (
              <Image 
                source={logoSource}
                style={styles.schoolLogo}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.iconText}>
                {nameCN.charAt(0)}{nameEN.split(' ').map(w => w.charAt(0)).join('').slice(0, 2)}
              </Text>
            )}
          </View>

          {/* 🌍 FIXED: 中部信息 - 使用新的显示逻辑，移除位置信息 */}
          <View style={styles.infoContainer}>
            {/* 标题和副标题 - 根据语言和用户要求显示 */}
            <Text style={styles.primaryTitle} numberOfLines={1}>
              {displayInfo.title}
            </Text>
            <Text style={styles.secondaryTitle} numberOfLines={1}>
              {displayInfo.subtitle}
            </Text>
            {/* 🗑️ REMOVED: 位置信息根据用户要求完全移除 */}
          </View>

          {/* 右侧徽章和chevron */}
          <View style={styles.rightSection}>
            {/* 志愿者数量徽章 */}
            <View style={[styles.badge, { backgroundColor: `${tint}20` }]}>
              <Ionicons
                name="people"
                size={12}
                color={Glass.textMain}
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>
                {volunteers}
              </Text>
            </View>
            
            {/* Chevron */}
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Glass.textWeak}
              style={styles.chevron}
            />
          </View>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Glass.radius.card,
    overflow: 'visible', // 改为visible让阴影显示
    marginBottom: Glass.touch.spacing.gridGutter,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },

  shadowWrapper: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // 白色背景确保阴影渲染
  },
  
  blurContainer: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
  },
  
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Glass.radius.card,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Glass.touch.spacing.cardPadding,
    minHeight: 72, // 列表行高64-72pt
  },

  disabledContent: {
    opacity: 0.5,
  },

  // 左侧方块标识 44x44pt
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  iconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B2B2B',
  },

  schoolLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  // 中部信息区
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  primaryTitle: {
    fontSize: 16, // 主标题16pt
    fontWeight: '600',
    color: Glass.textMain,
    marginBottom: 2,
  },

  secondaryTitle: {
    fontSize: 12, // 副标题12pt
    fontWeight: '500',
    color: Glass.textWeak,
    marginBottom: 4,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationIcon: {
    marginRight: 4,
  },

  locationText: {
    fontSize: 12,
    color: Glass.textWeak,
    flex: 1,
  },

  // 右侧区域
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 人数徽章
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    height: 24, // 徽章高度24pt
  },

  badgeIcon: {
    marginRight: 4,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Glass.textMain,
  },

  chevron: {
    marginLeft: 4,
  },
});

export default LiquidGlassListItem;