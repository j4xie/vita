import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { getCurrentToken } from '../../services/authAPI';
import { UserIdentityData, ScannedUserInfo } from '../../types/userIdentity';
import {
  calculateUserPermissions,
  getPermissionLevel,
  getPermissionLevelFromRoleKey,
  getPermissionDescription,
  PermissionLevel
} from '../../utils/userPermissions';
import { getScanPermissions } from '../../types/userPermissions';

const { width: screenWidth } = Dimensions.get('window');

interface ScannedUserInfoModalProps {
  visible: boolean;
  onClose: () => void;
  scannedUserData: UserIdentityData;
}

export const ScannedUserInfoModal: React.FC<ScannedUserInfoModalProps> = ({
  visible,
  onClose,
  scannedUserData,
}) => {
  const { t } = useTranslation();
  const { user: currentUser } = useUser();

  const [userInfo, setUserInfo] = useState<ScannedUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 计算当前用户的权限等级
  const getCurrentUserPermissionLevel = (): PermissionLevel => {
    if (!currentUser) return PermissionLevel.GUEST;

    // 从当前用户的角色信息获取权限等级
    // 这里需要根据实际的用户数据结构来获取权限
    // 示例：假设用户数据中有roles字段
    const userRoles = (currentUser as any).roles;
    if (userRoles && userRoles.length > 0) {
      const primaryRole = userRoles[0];
      return getPermissionLevelFromRoleKey(primaryRole.roleKey || primaryRole.key);
    }

    // 临时返回员工权限用于演示，实际应该从用户数据获取
    return PermissionLevel.STAFF;
  };

  useEffect(() => {
    if (visible && scannedUserData) {
      setIsLoading(true);

      // 🆕 使用新的权限验证系统
      setTimeout(() => {
        const permissions = getScanPermissions(currentUser, scannedUserData);

        console.log('🔐 [权限验证] 新权限系统计算结果:', {
          canViewPersonalInfo: permissions.canViewPersonalInfo,
          canViewVolunteerHours: permissions.canViewVolunteerHours,
          canHelpActivityCheckIn: permissions.canHelpActivityCheckIn,
          canManageVolunteerHours: permissions.canManageVolunteerHours,
          scannerLevel: permissions.scannerLevel,
          scannedLevel: permissions.scannedLevel,
          isSameSchool: permissions.isSameSchool
        });

        // 🆕 构建显示的用户信息 - 基于新权限逻辑
        const info: ScannedUserInfo = {
          isValid: true,
          user: {
            userId: scannedUserData.userId,
            legalName: scannedUserData.legalName,
            nickName: scannedUserData.nickName,
            // 🆕 个人信息所有人可见
            email: scannedUserData.email,
            avatarUrl: scannedUserData.avatarUrl,
            studentId: scannedUserData.studentId,
            currentOrganization: scannedUserData.currentOrganization,
            // 🆕 志愿者时间统计 - 根据新权限显示
            activityStats: permissions.canViewVolunteerHours ? {
              totalParticipated: Math.floor(Math.random() * 50) + 10,
              volunteeredHours: Math.floor(Math.random() * 200) + 20,
              points: Math.floor(Math.random() * 1000) + 100,
            } : undefined,
          },
          // 🆕 映射到旧权限接口以保持兼容性
          permissions: {
            canViewDetails: permissions.canViewPersonalInfo,
            canViewContact: permissions.canViewPersonalInfo,
            canViewActivities: permissions.canViewVolunteerHours
          },
          // 🆕 最近活动 - 根据志愿者时间查看权限
          recentActivities: permissions.canViewVolunteerHours ? [
            {
              id: '1',
              title: '新生迎新活动',
              participatedAt: '2024-09-01T10:00:00Z',
              role: 'participant',
              organizationId: scannedUserData.currentOrganization?.id || '1'
            },
            {
              id: '2',
              title: '社区志愿服务',
              participatedAt: '2024-08-25T14:00:00Z',
              role: 'volunteer',
              organizationId: scannedUserData.currentOrganization?.id || '1'
            }
          ] : undefined,
        };

        setUserInfo(info);
        setIsLoading(false);
      }, 500);
    }
  }, [visible, scannedUserData]);

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setUserInfo(null);
    onClose();
  };

  const handleViewFullProfile = () => {
    Alert.alert(
      '查看完整档案',
      '是否跳转到用户的完整档案页面？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '查看',
          onPress: () => {
            // TODO: 导航到用户详情页面
            console.log('Navigate to full profile:', scannedUserData.userId);
            handleClose();
          }
        }
      ]
    );
  };


  // 活动签到功能已移除 - 活动签到应通过扫描活动二维码实现
  // 用户扫描活动二维码时，系统会自动为当前登录用户签到
  // 而不是通过扫描身份码来为他人签到

  // 🆕 活动签到帮助功能
  const handleActivityCheckIn = async () => {
    try {
      // 触觉反馈
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // 显示活动签到选择器
      Alert.alert(
        '活动签到帮助',
        `帮助 ${scannedUserData.legalName} 签到活动`,
        [
          {
            text: '扫描活动码',
            onPress: () => {
              Alert.alert(
                '功能说明',
                '活动签到需要扫描活动二维码。请引导用户扫描活动现场的二维码完成签到。',
                [{ text: '明白了' }]
              );
            }
          },
          {
            text: '手动选择活动',
            onPress: () => {
              Alert.alert(
                '开发中',
                '手动选择活动功能正在开发中，敬请期待。',
                [{ text: '确定' }]
              );
            }
          },
          {
            text: '取消',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('活动签到帮助失败:', error);
      Alert.alert(
        '操作失败',
        '无法执行活动签到帮助，请稍后重试。',
        [{ text: '确定' }]
      );
    }
  };

  // 管理操作菜单
  const showManagementActions = () => {
    const scannerLevel = getCurrentUserPermissionLevel();

    if (scannerLevel < PermissionLevel.STAFF) {
      Alert.alert(t('common.permission_denied'), t('volunteer.no_management_permission'));
      return;
    }

    const actions = [];

    // 🆕 活动签到帮助 - 根据新权限逻辑
    const permissions = getScanPermissions(currentUser, scannedUserData);
    if (permissions.canHelpActivityCheckIn) {
      actions.push(
        { text: '帮助签到活动', onPress: handleActivityCheckIn }
      );
    }

    // 移除志愿者工时签到/签退功能 - 无人有此权限

    if (actions.length === 0) {
      Alert.alert(
        '权限不足',
        `您没有权限管理${scannedUserData.legalName}。`
      );
      return;
    }

    actions.push({ text: '取消', style: 'cancel' });

    Alert.alert(
      `管理 ${scannedUserData.legalName}`,
      '选择要执行的操作:',
      actions
    );
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
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      maxWidth: screenWidth - 40,
      width: '100%',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    content: {
      padding: 20,
    },
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
      borderColor: '#FF6B35',
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
      textAlign: 'center',
    },
    userNickName: {
      fontSize: 16,
      color: '#6B7280',
      marginBottom: 8,
      textAlign: 'center',
    },
    positionBadge: {
      backgroundColor: '#FF6B35',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 8,
    },
    positionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    organizationText: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
    },
    infoSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 12,
    },
    infoItem: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    infoLabel: {
      fontSize: 14,
      color: '#6B7280',
      width: 80,
    },
    infoValue: {
      fontSize: 14,
      color: '#111827',
      flex: 1,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 4,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: '#FF6B35',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: 'center',
    },
    activitiesList: {
      marginBottom: 20,
    },
    activityItem: {
      backgroundColor: '#F9FAFB',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: '#111827',
      marginBottom: 4,
    },
    activityMeta: {
      fontSize: 12,
      color: '#6B7280',
    },
    permissionNote: {
      backgroundColor: '#FEF3CD',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    permissionText: {
      fontSize: 13,
      color: '#92400E',
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: '#FF6B35',
    },
    secondaryButton: {
      backgroundColor: '#F3F4F6',
    },
    managementButton: {
      backgroundColor: '#10B981', // 绿色 - 管理操作
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
    },
    managementButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: '#6B7280',
      marginTop: 16,
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
            <Text style={styles.title}>用户身份信息</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Ionicons
                  name="hourglass-outline"
                  size={32}
                  color="#6B7280"
                />
                <Text style={styles.loadingText}>正在验证权限...</Text>
              </View>
            ) : userInfo ? (
              <>
                {/* User Profile Section */}
                <View style={styles.userSection}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color="#9CA3AF" />
                  </View>
                  <Text style={styles.userName}>{userInfo.user?.legalName}</Text>
                  {userInfo.user?.nickName && (
                    <Text style={styles.userNickName}>{userInfo.user.nickName}</Text>
                  )}
                  {scannedUserData.position && (
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionText}>
                        {scannedUserData.position.displayName}
                      </Text>
                    </View>
                  )}
                  {userInfo.user?.currentOrganization && (
                    <Text style={styles.organizationText}>
                      {userInfo.user.currentOrganization.displayNameZh}
                      {scannedUserData.school && ` • ${scannedUserData.school.name}`}
                    </Text>
                  )}
                </View>

                {/* Permission Notice */}
                <View style={styles.permissionNote}>
                  <Text style={styles.permissionText}>
                    {getPermissionDescription({
                      canViewBasicInfo: userInfo.permissions?.canViewDetails || false,
                      canViewContactInfo: userInfo.permissions?.canViewContact || false,
                      canViewStudentId: userInfo.permissions?.canViewDetails || false,
                      canViewActivityStats: userInfo.permissions?.canViewActivities || false,
                      canViewRecentActivities: userInfo.permissions?.canViewActivities || false,
                      canViewSensitiveInfo: userInfo.permissions?.canViewActivities || false,
                      canViewFullProfile: userInfo.permissions?.canViewDetails || false,
                      isHigherAuthority: userInfo.permissions?.canViewActivities || false,
                      accessLevel: userInfo.permissions?.canViewActivities ? PermissionLevel.ADMIN : PermissionLevel.GUEST
                    })}
                  </Text>
                </View>

                {/* Basic Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>基本信息</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>用户ID</Text>
                    <Text style={styles.infoValue}>{userInfo.user?.userId}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>邮箱</Text>
                    <Text style={styles.infoValue}>{userInfo.user?.email}</Text>
                  </View>
                  {userInfo.permissions?.canViewDetails && userInfo.user?.studentId && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>学号</Text>
                      <Text style={styles.infoValue}>{userInfo.user.studentId}</Text>
                    </View>
                  )}
                </View>

                {/* Activity Stats */}
                {userInfo.user?.activityStats && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>活动统计</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {userInfo.user.activityStats.totalParticipated}
                        </Text>
                        <Text style={styles.statLabel}>参与活动</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {userInfo.user.activityStats.volunteeredHours}
                        </Text>
                        <Text style={styles.statLabel}>志愿时长</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {userInfo.user.activityStats.points}
                        </Text>
                        <Text style={styles.statLabel}>积分</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Recent Activities */}
                {userInfo.recentActivities && userInfo.recentActivities.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>最近活动</Text>
                    <View style={styles.activitiesList}>
                      {userInfo.recentActivities.map((activity) => (
                        <View key={activity.id} style={styles.activityItem}>
                          <Text style={styles.activityTitle}>{activity.title}</Text>
                          <Text style={styles.activityMeta}>
                            {new Date(activity.participatedAt).toLocaleDateString()} • {activity.role}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                  {userInfo.permissions?.canViewDetails && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryButton]}
                      onPress={handleViewFullProfile}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.primaryButtonText}>查看档案</Text>
                    </TouchableOpacity>
                  )}

                  {/* 管理操作按钮 - 员工及以上权限 */}
                  {getCurrentUserPermissionLevel() >= PermissionLevel.STAFF && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.managementButton]}
                      onPress={showManagementActions}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.managementButtonText}>管理操作</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryButtonText}>关闭</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ScannedUserInfoModal;