import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import UserActivityCard from '../cards/UserActivityCard';

interface UserActivityModalProps {
  visible: boolean;
  onClose: () => void;
  activityType: 'not_checked_in' | 'checked_in'; // 未签到 | 已签到
  onRefreshStats?: () => void; // 刷新统计数据的回调
}

interface UserActivity {
  id: number;
  name: string;
  icon: string;
  startTime: string;
  endTime: string;
  address: string;
  signStatus: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const UserActivityModal: React.FC<UserActivityModalProps> = ({
  visible,
  onClose,
  activityType,
  onRefreshStats,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const themeContext = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 动画值
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;
  const { isDarkMode: legacyDarkMode } = themeContext;

  // 获取用户相关活动
  const fetchUserActivities = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // 根据活动类型调用不同的API参数
      const signStatusFilter = activityType === 'not_checked_in' ? -1 : 1;
      console.log('🔄 UserActivityModal调用API:', { activityType, signStatusFilter });
      
      // 直接使用userId参数（API需要明确的userId）
      const numericUserId = parseInt(user.id);
      console.log('🔄 调用API参数:', { userId: numericUserId, signStatusFilter });
      const response = await pomeloXAPI.getUserActivityList(numericUserId, signStatusFilter);
      
      if (response.code === 200) {
        // userActivitylist API的响应结构：{ total, rows, code, msg }
        const activities = response.rows || [];
        setActivities(activities);
        console.log('🔄 UserActivityModal获取到活动:', {
          activityType,
          signStatusFilter,
          activitiesCount: activities.length,
          activities: activities.map(a => ({ id: a.id, name: a.name, signStatus: a.signStatus }))
        });
      }
    } catch (error) {
      console.error('获取用户活动失败:', error);
      Alert.alert(t('activities.fetch_failed'), t('common.retry_later'));
    } finally {
      setLoading(false);
    }
  };

  // Modal显示时获取数据
  useEffect(() => {
    if (visible) {
      fetchUserActivities();
    }
  }, [visible, activityType]);

  // 显示/隐藏动画
  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 隐藏动画
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // 处理背景点击
  const handleBackdropPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onClose();
  };

  // Web端特有的取消报名处理
  const handleCancelRegistration = (activityId: number) => {
    console.log('🔄 [Web] UserActivityModal收到取消报名回调:', { activityId });
    
    // 从活动列表中移除该活动
    setActivities(prevActivities => 
      prevActivities.filter(activity => activity.id !== activityId)
    );
    
    // 刷新统计数据
    if (onRefreshStats) {
      onRefreshStats();
    }
  };

  // 处理扫码签到
  const handleScanPress = (activityId: number) => {
    // 关闭modal
    onClose();
    
    // 延迟跳转，确保modal动画完成
    setTimeout(() => {
      // 生成唯一的回调ID
      const callbackId = `user_activity_signin_${Date.now()}`;
      
      // 注册回调函数到导航状态 - Web端安全版本
      try {
        const parentNavigator = (navigation as any).getParent?.();
        if (!parentNavigator) {
          console.warn('⚠️ [UserActivityModal] 无法获取父导航器');
        } else {
          const state = parentNavigator.getState?.();
          if (state && typeof state === 'object') {
            // 确保qrScannerCallbacks存在且为对象
            if (!state.qrScannerCallbacks || typeof state.qrScannerCallbacks !== 'object') {
              state.qrScannerCallbacks = {};
            }
            
            // 设置回调函数
            state.qrScannerCallbacks[callbackId] = {
              onScanSuccess: () => {
                // 签到成功后刷新统计
                if (onRefreshStats) {
                  onRefreshStats();
                }
                // 清理回调函数
                try {
                  if (state?.qrScannerCallbacks?.[callbackId]) {
                    delete state.qrScannerCallbacks[callbackId];
                  }
                } catch (e) {
                  console.warn('清理回调函数失败:', e);
                }
              },
              onScanError: (error: string) => {
                console.error('扫码失败:', error);
                // 清理回调函数
                try {
                  if (state?.qrScannerCallbacks?.[callbackId]) {
                    delete state.qrScannerCallbacks[callbackId];
                  }
                } catch (e) {
                  console.warn('清理回调函数失败:', e);
                }
              }
            };
            console.log('✅ [UserActivityModal] 回调函数注册成功:', callbackId);
          } else {
            console.warn('⚠️ [UserActivityModal] 导航状态无效');
          }
        }
      } catch (error) {
        console.error('⚠️ [UserActivityModal] 注册回调函数失败:', error);
      }
      
      navigation.navigate('QRScanner', {
        purpose: 'activity_signin',
        activityId: activityId.toString(),
        callbackId: callbackId // 传递回调ID而不是函数
      });
    }, 300);
  };

  const getModalTitle = () => {
    if (activityType === 'not_checked_in') {
      return t('profile.activity.not_checked_in_title', '待签到活动');
    } else {
      return t('profile.activity.checked_in_title', '已签到活动');
    }
  };

  const getEmptyMessage = () => {
    if (activityType === 'not_checked_in') {
      return t('profile.activity.no_pending_checkin', '暂无待签到活动');
    } else {
      return t('profile.activity.no_checked_in', '暂无已签到活动');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* 背景遮罩 */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />
      </Animated.View>

      {/* 底部弹层 */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* 拖拽指示器 */}
        <View style={styles.dragIndicator}>
          <View
            style={[
              styles.dragBar,
              { backgroundColor: isDarkMode ? '#48484a' : '#c6c6c8' },
            ]}
          />
        </View>

        {/* 头部标题 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            {getModalTitle()}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={24}
              color={isDarkMode ? '#8e8e93' : '#8e8e93'}
            />
          </TouchableOpacity>
        </View>

        {/* 内容区域 */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
                {t('common.loading', '加载中...')}
              </Text>
            </View>
          ) : activities.length > 0 ? (
            <View style={styles.activitiesContainer}>
              {activities.map((activity) => (
                <UserActivityCard
                  key={activity.id}
                  activity={activity}
                  onScanPress={handleScanPress}
                  onCancelRegistration={handleCancelRegistration}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activityType === 'not_checked_in' ? 'time-outline' : 'checkmark-circle-outline'} 
                size={48} 
                color={isDarkMode ? '#48484a' : '#c6c6c8'} 
              />
              <Text style={[styles.emptyText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
                {getEmptyMessage()}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    minHeight: screenHeight * 0.4,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  
  dragIndicator: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  
  activitiesContainer: {
    paddingVertical: 20,
  },
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default UserActivityModal;