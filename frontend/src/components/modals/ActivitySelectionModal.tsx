import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { pomeloXAPI } from '../../services/PomeloXAPI';

// 活动数据类型
interface Activity {
  id: number;
  name: string;
  type: number;
  startTime: string;
  endTime: string;
  location?: string;
  signStatus: number; // -1已报名未签到 0未报名 1已签到
}

interface ActivitySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onActivitySelect: (activity: Activity) => Promise<void>;
  title?: string;
}

const ActivitySelectionModalComponent: React.FC<ActivitySelectionModalProps> = ({
  visible,
  onClose,
  userId,
  onActivitySelect,
  title = '选择活动签到'
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [processing, setProcessing] = useState(false);

  // 加载用户的活动列表
  useEffect(() => {
    if (visible && userId) {
      loadUserActivities();
    }
  }, [visible, userId]);

  const loadUserActivities = useCallback(async () => {
    setLoading(true);
    try {
      // 获取用户相关的活动 - 只获取已报名但未签到的活动
      const response = await pomeloXAPI.getUserActivityList(parseInt(userId), -1); // -1 表示已报名未签到
      
      if (response.code === 200 && response.rows) {
        const filteredActivities = response.rows.filter((activity: any) => 
          activity.signStatus === -1 // 只显示已报名未签到的活动
        );
        setActivities(filteredActivities);
        
        // 如果只有一个活动，预选中它
        if (filteredActivities.length === 1) {
          setSelectedActivity(filteredActivities[0]);
        }
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('加载用户活动列表失败:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleActivitySelect = useCallback((activity: Activity) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedActivity(activity);
  }, []);

  const handleConfirmSelection = useCallback(async () => {
    if (!selectedActivity) {
      Alert.alert(t('qr.results.select_activity_hint'), t('qr.results.select_activity_prompt'));
      return;
    }

    setProcessing(true);
    try {
      await onActivitySelect(selectedActivity);
      onClose();
    } catch (error) {
      console.error('活动签到失败:', error);
      // 错误处理已在父组件完成
    } finally {
      setProcessing(false);
    }
  }, [selectedActivity, onActivitySelect]);

  const handleClose = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedActivity(null);
    onClose();
  }, [onClose]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getActivityStatusText = useCallback((activity: Activity) => {
    switch (activity.signStatus) {
      case -1: return '已报名';
      case 0: return '未报名';
      case 1: return '已签到';
      default: return '未知状态';
    }
  }, []);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    container: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      maxWidth: 350,
      width: '100%',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : theme.colors.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : theme.colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      lineHeight: 20,
    },
    activityList: {
      maxHeight: 300,
    },
    activityItem: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    activityItemUnselected: {
      backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : '#F9FAFB',
    },
    activityItemSelected: {
      backgroundColor: isDarkMode ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 107, 53, 0.1)',
      borderColor: '#FF6B35',
    },
    activityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    activityIcon: {
      marginRight: 12,
    },
    activityName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : theme.colors.text.primary,
      flex: 1,
    },
    selectionIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#FF6B35',
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectionIndicatorSelected: {
      backgroundColor: '#FF6B35',
    },
    activityDetails: {
      marginLeft: 36,
    },
    activityDetail: {
      fontSize: 13,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: '#10B981',
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    statusText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    footer: {
      marginTop: 20,
      flexDirection: 'row',
      gap: 12,
    },
    footerButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
    },
    cancelButton: {
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    confirmButton: {
      backgroundColor: '#FF6B35',
    },
    disabledButton: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: isDarkMode ? '#FFFFFF' : '#374151',
    },
    confirmButtonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              accessibilityHint={t('accessibility.close_activity_selection')}
            >
              <Ionicons
                name="close"
                size={20}
                color={isDarkMode ? '#FFFFFF' : theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.loadingText}>加载活动列表中...</Text>
              </View>
            ) : activities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={isDarkMode ? '#6B7280' : '#9CA3AF'}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>暂无可签到的活动</Text>
                <Text style={styles.emptyMessage}>
                  该用户没有已报名但未签到的活动
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
                {activities.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.activityItem,
                      selectedActivity?.id === activity.id
                        ? styles.activityItemSelected
                        : styles.activityItemUnselected,
                    ]}
                    onPress={() => handleActivitySelect(activity)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('accessibility.select_activity', {name: activity.name})}
                    accessibilityHint={t('accessibility.tap_to_select_activity')}
                    accessibilityState={{ selected: selectedActivity?.id === activity.id }}
                  >
                    <View style={styles.activityHeader}>
                      <Ionicons
                        name="calendar"
                        size={20}
                        color="#FF6B35"
                        style={styles.activityIcon}
                      />
                      <Text style={styles.activityName} numberOfLines={1}>
                        {activity.name}
                      </Text>
                      <View
                        style={[
                          styles.selectionIndicator,
                          selectedActivity?.id === activity.id && styles.selectionIndicatorSelected,
                        ]}
                      >
                        {selectedActivity?.id === activity.id && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </View>

                    <View style={styles.activityDetails}>
                      <Text style={styles.activityDetail}>
                        时间：{formatDate(activity.startTime)}
                      </Text>
                      {activity.location && (
                        <Text style={styles.activityDetail}>
                          地点：{activity.location}
                        </Text>
                      )}
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                          {getActivityStatusText(activity)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Footer */}
          {activities.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.footerButton, styles.cancelButton]}
                onPress={handleClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('accessibility.cancel')}
                accessibilityHint={t('accessibility.close_and_return')}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  取消
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.confirmButton,
                  (!selectedActivity || processing) && styles.disabledButton,
                ]}
                onPress={handleConfirmSelection}
                disabled={!selectedActivity || processing}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('accessibility.confirm_signin')}
                accessibilityHint={selectedActivity ? `确认为${selectedActivity.name}活动签到` : "请先选择一个活动"}
                accessibilityState={{ disabled: !selectedActivity || processing }}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={[styles.buttonText, styles.confirmButtonText]}>
                      确认签到
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// 使用React.memo优化重新渲染
export const ActivitySelectionModal = memo(ActivitySelectionModalComponent, (prevProps, nextProps) => {
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.userId === nextProps.userId &&
    prevProps.title === nextProps.title
  );
});

export default ActivitySelectionModal;