import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Glass } from '../../ui/glass/GlassTheme';
import { getSchoolLogo } from '../../utils/schoolLogos';

interface LiquidGlassCardProps {
  title: string;
  badge: string;
  badgeTint: string;
  schoolId: string; // 新增schoolId用于获取校徽
  onPress?: () => void;
  width: number;
  height: number;
  isSelected?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  title,
  badge,
  badgeTint,
  schoolId,
  onPress,
  width,
  height,
  isSelected = false,
}) => {
  const pressed = useSharedValue(0);
  const logoSource = getSchoolLogo(schoolId);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.02 * pressed.value }], // scale 1 → 0.98
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: Glass.animation.pressDuration });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, Glass.animation.springConfig);
    
    // iOS触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress?.();
  };

  return (
    <Animated.View style={[
      { 
        width, 
        height, 
        borderRadius: Glass.radius.card, 
        overflow: 'visible', // 改为visible让阴影显示
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Solid background for efficient shadow calculation
        // 优化后的阴影效果
        ...Glass.shadows.sm.ios,
        elevation: Glass.shadows.sm.android.elevation,
      },
      animatedStyle,
      // 选中状态使用品牌色阴影
      isSelected && {
        ...Glass.shadows.brand.ios,
        elevation: Glass.shadows.brand.android.elevation,
      }
    ]}>
      <View style={{
        flex: 1,
        borderRadius: Glass.radius.card,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF', // 添加白色背景确保阴影正确渲染
      }}>
        <BlurView intensity={Glass.blur} tint="light" style={{ flex: 1 }}>
          <LinearGradient 
            colors={[Glass.hairlineFrom, Glass.hairlineTo]}
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={{ height: 1 }}
          />
          <LinearGradient 
            colors={[Glass.overlayTop, Glass.overlayBottom]}
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={{ flex: 1, padding: Glass.touch.spacing.cardPadding, justifyContent: 'space-between' }}
          >
            {/* 顶部圆形校徽 */}
            <View style={{
              width: 40, 
              height: 40, 
              borderRadius: 20,
              backgroundColor: logoSource ? '#FFFFFF' : (badgeTint || '#DDE3F0'), 
              alignItems: 'center', 
              justifyContent: 'center',
              // 校徽也有轻微阴影
              ...Glass.shadows.xs.ios,
              elevation: Glass.shadows.xs.android.elevation,
              overflow: 'hidden',
            }}>
              {logoSource ? (
                <Image 
                  source={logoSource}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ 
                  fontSize: 14, // 辅助信息最小14pt
                  fontWeight: '700', 
                  color: '#2B2B2B' 
                }}>
                  {badge}
                </Text>
              )}
            </View>
            
            {/* 学校名 */}
            <Text style={{ 
              fontSize: 14, // 辅助信息最小14pt
              color: Glass.textMain, 
              opacity: 0.85 
            }}>
              {title}
            </Text>
          </Pressable>
        </BlurView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  
  materialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },

  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  
  pressable: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  badgeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    fontSize: 14, // 辅助信息最小14pt
    fontWeight: '700',
  },
  
  titleText: {
    fontSize: 14, // 辅助信息最小14pt
    color: '#111',
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: 18, // 调整为合适的行高
  },

  titleTextSelected: {
    opacity: 1,
    fontWeight: '600',
    color: '#111',
  },
});

export default LiquidGlassCard;