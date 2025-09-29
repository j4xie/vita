/**
 * 签到浮层 - L3玻璃效果
 * 当用户进入活动地理围栏时显示的签到提示
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { theme } from '../../theme';

interface CheckInFloatingLayerProps {
  visible: boolean;
  activityTitle: string;
  distance: string; // 例如："50m"
  onCheckIn: () => void;
  onDismiss: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const CheckInFloatingLayer: React.FC<CheckInFloatingLayerProps> = ({
  visible,
  activityTitle,
  distance,
  onCheckIn,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 隐藏动画
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity,
        transform: [{ translateY }],
      },
    ]}>
      <View style={styles.content}>
        {/* L3玻璃反光层 */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.3)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.05)',
          ]}
          style={styles.reflectionLayer}
          pointerEvents="none"
        />
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={20} color="#F9A889" />
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.body}>
          <Text style={styles.title}>{t('location.arrived_at_venue', '您已到达活动现场')}</Text>
          <Text style={styles.activityName} numberOfLines={1}>
            {activityTitle}
          </Text>
          <Text style={styles.distance}>{t('location.distance_from_venue', { distance })}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.checkInButton}
          onPress={onCheckIn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F9A889', '#E68956']}
            style={styles.checkInButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.checkInButtonText}>{t('location.check_in_now', '立即签到')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // 在TabBar上方
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  content: {
    borderRadius: 20,
    overflow: 'hidden',
    // L3玻璃效果
    backgroundColor: LIQUID_GLASS_LAYERS.L3.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L3.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L3.border.color.light,
    // 浮层阴影
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  reflectionLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 168, 137, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F9A889',
    textAlign: 'center',
    marginBottom: 4,
    maxWidth: screenWidth - 80,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  checkInButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 6,
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});