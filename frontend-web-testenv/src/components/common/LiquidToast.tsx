/**
 * 🎨 Liquid Glass Toast 组件
 * 替换丑陋的系统Alert，符合应用设计系统
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from '../../components/web/WebBlurView';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { Glass } from '../../ui/glass/GlassTheme';

const { width: screenWidth } = Dimensions.get('window');

interface LiquidToastProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export const LiquidToast: React.FC<LiquidToastProps> = ({
  visible,
  title,
  message,
  type = 'success',
  duration = 3000,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          borderColor: '#10B981',
          backgroundColor: '#ECFDF5',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#F59E0B',
          borderColor: '#F59E0B',
          backgroundColor: '#FFFBEB',
        };
      case 'error':
        return {
          icon: 'close-circle',
          iconColor: '#EF4444',
          borderColor: '#EF4444',
          backgroundColor: '#FEF2F2',
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: '#3B82F6',
          borderColor: '#3B82F6',
          backgroundColor: '#EFF6FF',
        };
    }
  };

  const config = getToastConfig();

  useEffect(() => {
    if (visible) {
      // 触觉反馈
      if (Platform.OS === 'ios') {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      // 入场动画
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 180,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 180,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // 自动隐藏
      const hideTimer = setTimeout(() => {
        handleHide();
      }, duration);

      return () => clearTimeout(hideTimer);
    } else {
      // 重置动画值
      translateY.setValue(-200);
      opacity.setValue(0);
      scale.setValue(0.95);
    }
  }, [visible, duration, type]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
      
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleHide}
        style={styles.toastContainer}
      >
        <BlurView intensity={Glass.blur} tint="light" style={styles.blurContainer}>
          <LinearGradient 
            colors={[Glass.overlayTop, Glass.overlayBottom]}
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={[styles.toast, { borderLeftColor: config.borderColor }]}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={config.icon as any} 
                size={24} 
                color={config.iconColor} 
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleHide}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="close" 
                size={18} 
                color={Glass.textWeak} 
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // 状态栏下方
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  
  toastContainer: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  blurContainer: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
  },
  
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderLeftWidth: 4,
    minHeight: 80,
  },
  
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Glass.textMain,
    marginBottom: 4,
    lineHeight: 20,
  },
  
  message: {
    fontSize: 14,
    color: Glass.textWeak,
    lineHeight: 18,
  },
  
  closeButton: {
    padding: 4,
    marginTop: -2,
  },
});

export default LiquidToast;