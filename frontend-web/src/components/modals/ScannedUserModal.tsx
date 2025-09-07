import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { ScannedUserModalProps, ScannedUserInfo } from '../../types/userIdentity';

const { width: screenWidth } = Dimensions.get('window');

export const ScannedUserModal: React.FC<ScannedUserModalProps> = ({
  visible,
  onClose,
  userInfo,
  scannerOrganization,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleViewContact = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: 显示联系方式或添加联系人
  };

  const handleViewActivities = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: 显示用户活动详情
  };

  if (!userInfo.isValid || !userInfo.user) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={[styles.overlay, dmStyles.modal.overlay]}>
          <View style={[styles.container, dmStyles.modal.container]}>
            <View style={styles.header}>
              <Text style={[styles.title, dmStyles.text.title]}>
                {t('qr.user.error_title', '扫描失败')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={dmIcons.secondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.errorText, dmStyles.text.secondary]}>
              {userInfo.error || t('qr.user.unknown_error', '无法读取用户信息')}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, dmStyles.button.primary]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>
                {t('common.confirm', '确定')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const { user, permissions, recentActivities } = userInfo;
  const canViewDetails = permissions?.canViewDetails ?? false;
  const canViewContact = permissions?.canViewContact ?? false;
  const canViewActivities = permissions?.canViewActivities ?? false;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    container: {
      borderRadius: 20,
      padding: 24,
      maxWidth: screenWidth - 40,
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
      flex: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    
    // 用户信息区域
    userSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 3,
      borderColor: isDarkMode ? 'rgba(255, 138, 101, 0.3)' : 'rgba(255, 107, 53, 0.2)',
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#111827',
      marginBottom: 4,
      textAlign: 'center',
    },
    userNickName: {
      fontSize: 16,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
      textAlign: 'center',
    },
    userEmail: {
      fontSize: 14,
      color: isDarkMode ? '#D1D5DB' : '#9CA3AF',
      textAlign: 'center',
    },
    
    // 组织信息
    organizationSection: {
      backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    organizationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#D1D5DB' : '#374151',
      marginBottom: 8,
    },
    organizationName: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#FFFFFF' : '#111827',
    },
    
    // 统计数据
    statsSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#111827',
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
      borderRadius: 12,
      padding: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? dmIcons.brand : '#FF6B35',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    
    // 最近活动
    activitiesSection: {
      marginBottom: 20,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
      borderRadius: 8,
      marginBottom: 8,
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? 'rgba(255, 138, 101, 0.16)' : 'rgba(255, 107, 53, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    activityInfo: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#FFFFFF' : '#111827',
      marginBottom: 2,
    },
    activityDate: {
      fontSize: 12,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    
    // 权限提示
    permissionNotice: {
      backgroundColor: isDarkMode ? '#451A03' : '#FEF3C7',
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    permissionNoticeText: {
      fontSize: 14,
      color: isDarkMode ? '#FCD34D' : '#92400E',
      textAlign: 'center',
    },
    
    // 操作按钮
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 6,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
      borderWidth: 1,
      borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
    },
    disabledButton: {
      backgroundColor: '#F3F4F6',
      opacity: 0.5,
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#374151',
    },
    
    // 错误状态
    errorText: {
      fontSize: 16,
      color: isDarkMode ? '#F87171' : '#DC2626',
      textAlign: 'center',
      marginBottom: 20,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, dmStyles.modal.overlay]}>
        <View style={[styles.container, dmStyles.modal.container]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, dmStyles.text.title]}>
                {t('qr.user.profile_title', '用户信息')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={dmIcons.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userSection}>
              <View style={styles.avatar}>
                {user.avatarUrl ? (
                  // TODO: 显示实际头像
                  <Ionicons name="person" size={32} color={dmIcons.tertiary} />
                ) : (
                  <Ionicons name="person" size={32} color={dmIcons.tertiary} />
                )}
              </View>
              <Text style={styles.userName}>
                {user.legalName}
              </Text>
              <Text style={styles.userNickName}>
                {user.nickName}
              </Text>
              {canViewContact && (
                <Text style={styles.userEmail}>
                  {user.email}
                </Text>
              )}
            </View>

            {/* Organization Info */}
            {user.currentOrganization && (
              <View style={styles.organizationSection}>
                <Text style={styles.organizationTitle}>
                  {t('qr.user.organization', '所属组织')}
                </Text>
                <Text style={styles.organizationName}>
                  {user.currentOrganization.displayNameZh}
                </Text>
              </View>
            )}

            {/* Activity Stats */}
            {canViewDetails && user.activityStats && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>
                  {t('qr.user.activity_stats', '活动统计')}
                </Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.activityStats.totalParticipated}</Text>
                    <Text style={styles.statLabel}>
                      {t('qr.user.participated', '参与活动')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.activityStats.volunteeredHours}h</Text>
                    <Text style={styles.statLabel}>
                      {t('qr.user.volunteer_hours', '志愿时长')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.activityStats.points}</Text>
                    <Text style={styles.statLabel}>
                      {t('qr.user.points', '积分')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Recent Activities */}
            {canViewActivities && recentActivities && recentActivities.length > 0 && (
              <View style={styles.activitiesSection}>
                <Text style={styles.sectionTitle}>
                  {t('qr.user.recent_activities', '最近活动')}
                </Text>
                {recentActivities.slice(0, 3).map((activity, index) => (
                  <View 
                    key={activity.id}
                    style={styles.activityItem}
                  >
                    <View style={styles.activityIcon}>
                      <Ionicons 
                        name={activity.role === 'organizer' ? 'star' : 'calendar'} 
                        size={16} 
                        color={dmIcons.brand} 
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>
                        {activity.title}
                      </Text>
                      <Text style={styles.activityDate}>
                        {new Date(activity.participatedAt).toLocaleDateString('zh-CN')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Permission Notice */}
            {!canViewDetails && (
              <View style={styles.permissionNotice}>
                <Text style={styles.permissionNoticeText}>
                  {t('qr.user.limited_access', '权限有限，部分信息不可见')}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {canViewContact && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleViewContact}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="person-add-outline" 
                  size={16} 
                  color={dmIcons.primary} 
                />
                <Text style={styles.secondaryButtonText}>
                  {t('qr.user.add_contact', '添加联系')}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {t('common.confirm', '确定')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScannedUserModal;