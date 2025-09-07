import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Vibration,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface RegistrationToggleProps {
  isActive: boolean;
  onToggle: (enabled: boolean) => void;
  style?: any;
  disabled?: boolean;
  showIcon?: boolean;
}

export const RegistrationToggle: React.FC<RegistrationToggleProps> = ({
  isActive,
  onToggle,
  style,
  disabled = false,
  showIcon = true,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  
  // 动画值
  const scaleAnim = useSharedValue(1);
  const backgroundOpacity = useSharedValue(isActive ? 1 : 0);
  
  useEffect(() => {
    backgroundOpacity.value = withTiming(isActive ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [isActive]);

  // 触觉反馈
  const triggerHapticFeedback = () => {
    if (Platform.OS === 'ios') {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(10);
    }
  };

  // 处理切换
  const handleToggle = () => {
    if (disabled) return;
    
    // 按压动画
    scaleAnim.value = withTiming(0.95, { duration: 100 }, () => {
      scaleAnim.value = withTiming(1, { duration: 100 });
    });
    
    runOnJS(triggerHapticFeedback)();
    onToggle(!isActive);
  };

  // 动画样式
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // 样式组合
  const containerStyles = [
    styles.container,
    isDarkMode ? styles.containerDark : styles.containerLight,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    isActive
      ? (isDarkMode ? styles.activeTextDark : styles.activeTextLight)
      : (isDarkMode ? styles.inactiveTextDark : styles.inactiveTextLight),
  ];

  return (
    <TouchableOpacity
      onPress={handleToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: isActive, disabled }}
      accessibilityLabel={t('activities.filters.availableOnly', '仅显示可报名活动')}
      testID="registration-toggle"
    >
      <Animated.View style={[containerStyles, containerAnimatedStyle]}>
        {/* 激活背景指示器 */}
        <Animated.View
          style={[
            styles.activeBackground,
            isDarkMode ? styles.activeBackgroundDark : styles.activeBackgroundLight,
            backgroundAnimatedStyle,
          ]}
        />
        
        {/* 内容 */}
        <Animated.View style={styles.content}>
          {showIcon && (
            <Ionicons
              name={isActive ? "checkmark-circle" : "ellipse-outline"}
              size={14}
              color={
                isActive
                  ? (isDarkMode ? '#FFFFFF' : '#FFFFFF')
                  : (isDarkMode ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)')
              }
              style={styles.icon}
            />
          )}
          <Text style={textStyles} numberOfLines={1}>
            {t('activities.filters.available', '可报名')}
          </Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 32, // 紧凑高度
    borderRadius: 16, // 胶囊形状
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72, // 确保最小宽度
    borderWidth: 1,
  },
  
  // 容器背景样式
  containerLight: {
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderColor: 'rgba(118, 118, 128, 0.2)',
  },
  containerDark: {
    backgroundColor: 'rgba(118, 118, 128, 0.24)',
    borderColor: 'rgba(118, 118, 128, 0.3)',
  },
  
  // 激活背景
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  
  activeBackgroundLight: {
    backgroundColor: theme.colors.success, // 使用成功色表示可报名
  },
  activeBackgroundDark: {
    backgroundColor: theme.colors.success,
  },
  
  // 内容容器
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  
  // 图标样式
  icon: {
    marginRight: 4,
  },
  
  // 文字样式
  text: {
    fontSize: 12, // 小型文字
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // 激活状态文字
  activeTextLight: {
    color: '#FFFFFF',
  },
  activeTextDark: {
    color: '#FFFFFF',
  },
  
  // 未激活状态文字
  inactiveTextLight: {
    color: 'rgba(60, 60, 67, 0.6)',
  },
  inactiveTextDark: {
    color: 'rgba(235, 235, 245, 0.6)',
  },
  
  // 禁用状态
  disabled: {
    opacity: 0.5,
  },
});