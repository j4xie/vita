import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Glass } from './GlassTheme';
import { getSchoolLogo } from './schoolLogos';

interface LiquidGlassListItemProps {
  id: string;
  nameCN: string;
  nameEN: string;
  city: string;
  state: string;
  volunteers: number;
  tint: string;
  schoolId: string; // 新增schoolId获取校徽
  onPress: () => void;
  disabled?: boolean;
}

export const LiquidGlassListItem: React.FC<LiquidGlassListItemProps> = ({
  id,
  nameCN,
  nameEN,
  city,
  state,
  volunteers,
  tint,
  schoolId,
  onPress,
  disabled = false,
}) => {
  const pressed = useSharedValue(0);
  const logoSource = getSchoolLogo(schoolId);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.02 * pressed.value }], // scale 1 → 0.98
  }));

  const handlePressIn = () => {
    if (disabled) return;
    pressed.value = withTiming(1, { duration: Glass.animation.pressDuration });
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    pressed.value = withSpring(0, Glass.animation.springConfig);
    
    // iOS触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
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
            activeOpacity={1}
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

          {/* 中部信息 */}
          <View style={styles.infoContainer}>
            {/* 中英双行 */}
            <Text style={styles.primaryTitle} numberOfLines={1}>
              {nameCN}
            </Text>
            <Text style={styles.secondaryTitle} numberOfLines={1}>
              {nameEN}
            </Text>
            
            {/* 位置行 */}
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={Glass.textWeak}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {city}, {state}
              </Text>
            </View>
          </View>

          {/* 右侧徽章和chevron */}
          <View style={styles.rightSection}>
            {/* 人数徽章 */}
            <View style={[styles.badge, { backgroundColor: `rgba(100,120,160,0.18)` }]}>
              <Ionicons
                name="people"
                size={12}
                color={Glass.textMain}
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>{volunteers}</Text>
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