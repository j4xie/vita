import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { getLastVolunteerRecord, volunteerSignRecord } from '../../services/volunteerAPI';
import { UserIdentityData } from '../../types/userIdentity';
import { useUser } from '../../context/UserContext';

// 志愿者记录类型
interface VolunteerRecord {
  id: number;
  userId: number;
  startTime: string;
  endTime: string | null;
  type: number; // 1-签到 2-签退
  legalName: string;
}

interface VolunteerQuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  userData: UserIdentityData;
  onActionComplete?: (action: 'checkin' | 'checkout', success: boolean) => void;
}

const VolunteerQuickActionModalComponent: React.FC<VolunteerQuickActionModalProps> = ({
  visible,
  onClose,
  userData,
  onActionComplete
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const { user } = useUser(); // 当前登录用户（操作者）
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<VolunteerRecord | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // 加载志愿者状态
  useEffect(() => {
    if (visible && userData.userId) {
      loadVolunteerStatus();
    }
  }, [visible, userData.userId]);

  const loadVolunteerStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getLastVolunteerRecord(parseInt(userData.userId));
      
      if (response.code === 200 && response.data) {
        setCurrentRecord(response.data);
        // 如果endTime为null，说明已签到但未签退
        setHasActiveSession(response.data.endTime === null);
      } else {
        setCurrentRecord(null);
        setHasActiveSession(false);
      }
    } catch (error) {
      console.error('加载志愿者状态失败:', error);
      setCurrentRecord(null);
      setHasActiveSession(false);
    } finally {
      setLoading(false);
    }
  }, [userData.userId]);

  const handleCheckin = useCallback(async () => {
    if (!user || processing) return;
    
    if (hasActiveSession) {
      Alert.alert(t('qr.results.select_activity_hint'), t('qr.results.volunteer_already_checkedin'));
      return;
    }

    setProcessing(true);
    try {
      const now = new Date();
      const startTime = now.toISOString().replace('T', ' ').substring(0, 19);
      
      const response = await volunteerSignRecord(
        parseInt(userData.userId),
        1, // 签到
        parseInt(user.userId),
        user.legalName,
        startTime
      );

      if (response.code === 200) {
        // 签到成功
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert(
          t('qr.results.volunteer_checkin_success'),
          t('qr.results.volunteer_checkin_success_msg', { 
            name: userData.legalName, 
            time: formatTime(startTime) 
          }),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                onActionComplete?.('checkin', true);
                onClose();
              }
            }
          ]
        );
        
        // 重新加载状态
        await loadVolunteerStatus();
      } else {
        throw new Error(response.msg || t('qr.results.volunteer_checkin_failed'));
      }
    } catch (error: any) {
      console.error('志愿者签到失败:', error);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      Alert.alert(
        t('qr.results.volunteer_checkin_failed'),
        error.message || t('qr.results.network_error_retry'),
        [{ text: t('common.confirm') }]
      );
      
      onActionComplete?.('checkin', false);
    } finally {
      setProcessing(false);
    }
  }, [userData.userId, userData.legalName, user, hasActiveSession, onActionComplete, onClose, loadVolunteerStatus, t, formatTime]);

  const handleCheckout = useCallback(async () => {
    if (!user || !currentRecord || processing) return;
    
    if (!hasActiveSession) {
      Alert.alert(t('qr.results.select_activity_hint'), t('qr.results.volunteer_not_checkedin'));
      return;
    }

    setProcessing(true);
    try {
      const now = new Date();
      const endTime = now.toISOString().replace('T', ' ').substring(0, 19);
      
      const response = await volunteerSignRecord(
        parseInt(userData.userId),
        2, // 签退
        parseInt(user.userId),
        user.legalName,
        undefined, // 签到时间不需要
        endTime,
        currentRecord.id
      );

      if (response.code === 200) {
        // 签退成功
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        const workDuration = calculateWorkDuration(currentRecord.startTime, endTime);
        
        Alert.alert(
          t('qr.results.volunteer_checkout_success'),
          t('qr.results.volunteer_checkout_success_msg', {
            name: userData.legalName,
            duration: workDuration,
            time: formatTime(endTime)
          }),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                onActionComplete?.('checkout', true);
                onClose();
              }
            }
          ]
        );
        
        // 重新加载状态
        await loadVolunteerStatus();
      } else {
        throw new Error(response.msg || t('qr.results.volunteer_checkout_failed'));
      }
    } catch (error: any) {
      console.error('志愿者签退失败:', error);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      Alert.alert(
        t('qr.results.volunteer_checkout_failed'),
        error.message || t('qr.results.network_error_retry'),
        [{ text: t('common.confirm') }]
      );
      
      onActionComplete?.('checkout', false);
    } finally {
      setProcessing(false);
    }
  }, [userData.userId, userData.legalName, user, hasActiveSession, currentRecord, onActionComplete, onClose, loadVolunteerStatus, t, formatTime, calculateWorkDuration]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateWorkDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} ${t('common.time.hours', '小时')} ${minutes} ${t('common.time.minutes', '分钟')}`;
    } else {
      return `${minutes} ${t('common.time.minutes', '分钟')}`;
    }
  };

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

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
      maxWidth: 340,
      width: '100%',
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
      marginBottom: 20,
    },
    userInfo: {
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'rgba(255, 107, 53, 0.2)',
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : theme.colors.text.primary,
      marginBottom: 4,
    },
    userDetails: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    statusCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      alignItems: 'center',
    },
    statusCardActive: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 1,
      borderColor: '#10B981',
    },
    statusCardInactive: {
      backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#E5E7EB',
    },
    statusIcon: {
      marginBottom: 12,
    },
    statusTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    statusTitleActive: {
      color: '#10B981',
    },
    statusTitleInactive: {
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    statusDetails: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    statusDetailsActive: {
      color: '#059669',
    },
    statusDetailsInactive: {
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
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
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12, // 减少padding确保等宽
      borderRadius: 12,
      gap: 8,
      minWidth: 0, // 确保等宽分布
      width: '48%', // 强制各占48%，留4%给gap
    },
    checkinButton: {
      backgroundColor: '#10B981',
    },
    checkoutButton: {
      backgroundColor: '#EF4444',
    },
    disabledButton: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
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
            <Text style={styles.title}>志愿者管理</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              accessibilityHint="关闭志愿者管理对话框"
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
            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#9CA3AF" />
              </View>
              <Text style={styles.userName}>{userData.legalName}</Text>
              <Text style={styles.userDetails}>
                {userData.school?.name} • {userData.currentOrganization?.displayNameZh}
              </Text>
            </View>

            {/* Status */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.loadingText}>加载志愿者状态中...</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.statusCard,
                  hasActiveSession ? styles.statusCardActive : styles.statusCardInactive,
                ]}
              >
                <Ionicons
                  name={hasActiveSession ? "checkmark-circle" : "time-outline"}
                  size={32}
                  color={hasActiveSession ? "#10B981" : (isDarkMode ? "#9CA3AF" : "#6B7280")}
                  style={styles.statusIcon}
                />
                <Text
                  style={[
                    styles.statusTitle,
                    hasActiveSession ? styles.statusTitleActive : styles.statusTitleInactive,
                  ]}
                >
                  {hasActiveSession ? '已签到' : '未签到'}
                </Text>
                <Text
                  style={[
                    styles.statusDetails,
                    hasActiveSession ? styles.statusDetailsActive : styles.statusDetailsInactive,
                  ]}
                >
                  {hasActiveSession && currentRecord
                    ? `签到时间：${formatTime(currentRecord.startTime)}\n工作进行中...`
                    : '该志愿者尚未开始工作'}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          {!loading && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.checkinButton,
                  (hasActiveSession || processing) && styles.disabledButton,
                ]}
                onPress={handleCheckin}
                disabled={hasActiveSession || processing}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="志愿者签到"
                accessibilityHint={hasActiveSession ? "志愿者已签到，无法重复签到" : "为志愿者执行签到操作"}
                accessibilityState={{ disabled: hasActiveSession || processing }}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}>签到</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.checkoutButton,
                  (!hasActiveSession || processing) && styles.disabledButton,
                ]}
                onPress={handleCheckout}
                disabled={!hasActiveSession || processing}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="志愿者签退"
                accessibilityHint={!hasActiveSession ? "志愿者尚未签到，无法签退" : "为志愿者执行签退操作"}
                accessibilityState={{ disabled: !hasActiveSession || processing }}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}>签退</Text>
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
export const VolunteerQuickActionModal = memo(VolunteerQuickActionModalComponent, (prevProps, nextProps) => {
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.userData?.userId === nextProps.userData?.userId
  );
});

export default VolunteerQuickActionModal;