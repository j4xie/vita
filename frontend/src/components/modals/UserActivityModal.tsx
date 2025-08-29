import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
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
  const colorScheme = useColorScheme();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isDarkMode = colorScheme === 'dark';

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

  // 处理扫码签到
  const handleScanPress = (activityId: number) => {
    // 关闭modal
    onClose();
    
    // 延迟跳转，确保modal动画完成
    setTimeout(() => {
      navigation.navigate('QRScanner', {
        scanType: 'activity_signin',
        activityId: activityId.toString(),
        onScanSuccess: () => {
          // 签到成功后刷新统计
          if (onRefreshStats) {
            onRefreshStats();
          }
        }
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          isDarkMode && styles.containerDark,
          { paddingBottom: insets.bottom + 20 }
        ]}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>
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
                color={isDarkMode ? '#FFFFFF' : '#6B7280'}
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
                <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
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
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name={activityType === 'not_checked_in' ? 'time-outline' : 'checkmark-circle-outline'} 
                  size={48} 
                  color="#D1D5DB" 
                />
                <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                  {getEmptyMessage()}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.4,
  },
  
  containerDark: {
    backgroundColor: '#1F2937',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  
  titleDark: {
    color: '#FFFFFF',
  },
  
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  
  loadingTextDark: {
    color: '#9CA3AF',
  },
  
  activitiesContainer: {
    paddingVertical: 20,
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  
  emptyTextDark: {
    color: '#6B7280',
  },
});

export default UserActivityModal;