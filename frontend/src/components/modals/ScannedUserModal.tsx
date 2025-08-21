import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { ScannedUserModalProps, ScannedUserInfo } from '../../types/userIdentity';

const { width: screenWidth } = Dimensions.get('window');

export const ScannedUserModal: React.FC<ScannedUserModalProps> = ({
  visible,
  onClose,
  userInfo,
  scannerOrganization,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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
        <View style={styles.overlay}>
          <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={styles.header}>
              <Text style={[styles.title, isDarkMode && styles.titleDark]}>
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
                  color={isDarkMode ? '#FFFFFF' : theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>
              {userInfo.error || t('qr.user.unknown_error', '无法读取用户信息')}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      maxWidth: screenWidth - 40,
      width: '100%',
      maxHeight: '80%',
    },
    containerDark: {
      backgroundColor: '#1F2937',
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
      color: theme.colors.text.primary,
      flex: 1,
    },
    titleDark: {
      color: '#FFFFFF',
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 3,
      borderColor: 'rgba(255, 107, 53, 0.2)',
    },
    avatarDark: {
      backgroundColor: '#374151',
      borderColor: 'rgba(255, 107, 53, 0.3)',
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
      textAlign: 'center',
    },
    userNameDark: {
      color: '#FFFFFF',
    },
    userNickName: {
      fontSize: 16,
      color: '#6B7280',
      marginBottom: 8,
      textAlign: 'center',
    },
    userNickNameDark: {
      color: '#9CA3AF',
    },
    userEmail: {
      fontSize: 14,
      color: '#9CA3AF',
      textAlign: 'center',
    },
    userEmailDark: {
      color: '#D1D5DB',
    },
    
    // 组织信息
    organizationSection: {
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    organizationSectionDark: {
      backgroundColor: '#374151',
    },
    organizationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    },
    organizationTitleDark: {
      color: '#D1D5DB',
    },
    organizationName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#111827',
    },
    organizationNameDark: {
      color: '#FFFFFF',
    },
    
    // 统计数据
    statsSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 12,
    },
    sectionTitleDark: {
      color: '#FFFFFF',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      padding: 16,
    },
    statsGridDark: {
      backgroundColor: '#374151',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FF6B35',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: 'center',
    },
    statLabelDark: {
      color: '#9CA3AF',
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
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      marginBottom: 8,
    },
    activityItemDark: {
      backgroundColor: '#374151',
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
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
      color: '#111827',
      marginBottom: 2,
    },
    activityTitleDark: {
      color: '#FFFFFF',
    },
    activityDate: {
      fontSize: 12,
      color: '#6B7280',
    },
    activityDateDark: {
      color: '#9CA3AF',
    },
    
    // 权限提示
    permissionNotice: {
      backgroundColor: '#FEF3C7',
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    permissionNoticeDark: {
      backgroundColor: '#451A03',
    },
    permissionNoticeText: {
      fontSize: 14,
      color: '#92400E',
      textAlign: 'center',
    },
    permissionNoticeTextDark: {
      color: '#FCD34D',
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
      backgroundColor: '#FF6B35',
    },
    secondaryButton: {
      backgroundColor: '#F3F4F6',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    secondaryButtonDark: {
      backgroundColor: '#374151',
      borderColor: '#4B5563',
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
      color: '#374151',
    },
    secondaryButtonTextDark: {
      color: '#FFFFFF',
    },
    
    // 错误状态
    errorText: {
      fontSize: 16,
      color: '#DC2626',
      textAlign: 'center',
      marginBottom: 20,
    },
    errorTextDark: {
      color: '#F87171',
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
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, isDarkMode && styles.titleDark]}>
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
                  color={isDarkMode ? '#FFFFFF' : theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userSection}>
              <View style={[styles.avatar, isDarkMode && styles.avatarDark]}>
                {user.avatarUrl ? (
                  // TODO: 显示实际头像
                  <Ionicons name="person" size={32} color="#9CA3AF" />
                ) : (
                  <Ionicons name="person" size={32} color="#9CA3AF" />
                )}
              </View>
              <Text style={[styles.userName, isDarkMode && styles.userNameDark]}>
                {user.legalName}
              </Text>
              <Text style={[styles.userNickName, isDarkMode && styles.userNickNameDark]}>
                {user.nickName}
              </Text>
              {canViewContact && (
                <Text style={[styles.userEmail, isDarkMode && styles.userEmailDark]}>
                  {user.email}
                </Text>
              )}
            </View>

            {/* Organization Info */}
            {user.currentOrganization && (
              <View style={[styles.organizationSection, isDarkMode && styles.organizationSectionDark]}>
                <Text style={[styles.organizationTitle, isDarkMode && styles.organizationTitleDark]}>
                  {t('qr.user.organization', '所属组织')}
                </Text>
                <Text style={[styles.organizationName, isDarkMode && styles.organizationNameDark]}>
                  {user.currentOrganization.displayNameZh}
                </Text>
              </View>
            )}

            {/* Activity Stats */}
            {canViewDetails && user.activityStats && (
              <View style={styles.statsSection}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                  {t('qr.user.activity_stats', '活动统计')}
                </Text>
                <View style={[styles.statsGrid, isDarkMode && styles.statsGridDark]}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.activityStats.totalParticipated}</Text>
                    <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                      {t('qr.user.participated', '参与活动')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.activityStats.volunteeredHours}h</Text>
                    <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                      {t('qr.user.volunteer_hours', '志愿时长')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.activityStats.points}</Text>
                    <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                      {t('qr.user.points', '积分')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Recent Activities */}
            {canViewActivities && recentActivities && recentActivities.length > 0 && (
              <View style={styles.activitiesSection}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                  {t('qr.user.recent_activities', '最近活动')}
                </Text>
                {recentActivities.slice(0, 3).map((activity, index) => (
                  <View 
                    key={activity.id}
                    style={[styles.activityItem, isDarkMode && styles.activityItemDark]}
                  >
                    <View style={styles.activityIcon}>
                      <Ionicons 
                        name={activity.role === 'organizer' ? 'star' : 'calendar'} 
                        size={16} 
                        color="#FF6B35" 
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityTitle, isDarkMode && styles.activityTitleDark]}>
                        {activity.title}
                      </Text>
                      <Text style={[styles.activityDate, isDarkMode && styles.activityDateDark]}>
                        {new Date(activity.participatedAt).toLocaleDateString('zh-CN')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Permission Notice */}
            {!canViewDetails && (
              <View style={[styles.permissionNotice, isDarkMode && styles.permissionNoticeDark]}>
                <Text style={[styles.permissionNoticeText, isDarkMode && styles.permissionNoticeTextDark]}>
                  {t('qr.user.limited_access', '权限有限，部分信息不可见')}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {canViewContact && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]}
                onPress={handleViewContact}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="person-add-outline" 
                  size={16} 
                  color={isDarkMode ? '#FFFFFF' : '#374151'} 
                />
                <Text style={[styles.secondaryButtonText, isDarkMode && styles.secondaryButtonTextDark]}>
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