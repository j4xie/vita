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
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { UserIdentityData, ScannedUserInfo } from '../../types/userIdentity';
import { 
  calculateUserPermissions, 
  getPermissionLevel, 
  getPermissionLevelFromRoleKey,
  getPermissionDescription,
  PermissionLevel 
} from '../../utils/userPermissions';

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
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
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
      
      // 权限验证和数据获取
      setTimeout(() => {
        const scannerLevel = getCurrentUserPermissionLevel();
        const targetLevel = getPermissionLevel(scannedUserData.position);
        const permissions = calculateUserPermissions(scannerLevel, targetLevel);
        
        console.log('🔐 [权限验证] 权限计算结果:', {
          scannerLevel,
          targetLevel, 
          permissions: {
            canViewContactInfo: permissions.canViewContactInfo,
            canViewStudentId: permissions.canViewStudentId,
            canViewActivityStats: permissions.canViewActivityStats,
            canViewRecentActivities: permissions.canViewRecentActivities,
            isHigherAuthority: permissions.isHigherAuthority
          }
        });
        
        // 构建显示的用户信息
        const info: ScannedUserInfo = {
          isValid: true,
          user: {
            userId: scannedUserData.userId,
            legalName: scannedUserData.legalName,
            nickName: scannedUserData.nickName,
            email: permissions.canViewContactInfo ? scannedUserData.email : '***@***.com',
            avatarUrl: scannedUserData.avatarUrl,
            studentId: permissions.canViewStudentId ? scannedUserData.studentId : undefined,
            currentOrganization: scannedUserData.currentOrganization,
            activityStats: permissions.canViewActivityStats ? {
              totalParticipated: Math.floor(Math.random() * 50) + 10,
              volunteeredHours: Math.floor(Math.random() * 200) + 20,
              points: Math.floor(Math.random() * 1000) + 100,
            } : undefined,
          },
          permissions,
          recentActivities: permissions.canViewRecentActivities ? [
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

  // 志愿者签到管理
  const handleVolunteerSignIn = async () => {
    try {
      const response = await fetch('https://www.vitaglobal.icu/app/hour/signRecord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${currentUser?.token || ''}`,
        },
        body: new URLSearchParams({
          userId: scannedUserData.userId,
          type: '1', // 1-签到
          startTime: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          }).replace(/\//g, '-'),
          operateUserId: currentUser?.id || '',
          operateLegalName: currentUser?.legalName || '',
        }),
      });

      const result = await response.json();
      if (result.code === 200) {
        Alert.alert('签到成功', `${scannedUserData.legalName} 志愿者签到成功！`);
      } else {
        Alert.alert('签到失败', result.msg || '签到操作失败');
      }
    } catch (error) {
      console.error('志愿者签到失败:', error);
      Alert.alert('签到失败', '网络错误，请重试');
    }
  };

  // 志愿者签退管理
  const handleVolunteerSignOut = async () => {
    try {
      // 先获取最新的签到记录
      const statusResponse = await fetch(
        `https://www.vitaglobal.icu/app/hour/lastRecordList?userId=${scannedUserData.userId}`,
        {
          headers: {
            'Authorization': `Bearer ${currentUser?.token || ''}`,
          },
        }
      );

      const statusResult = await statusResponse.json();
      if (statusResult.code !== 200 || !statusResult.data || statusResult.data.length === 0) {
        Alert.alert('签退失败', '未找到有效的签到记录');
        return;
      }

      const lastRecord = statusResult.data[0];
      if (lastRecord.endTime) {
        Alert.alert('提示', '该用户已经签退过了');
        return;
      }

      // 执行签退
      const signOutResponse = await fetch('https://www.vitaglobal.icu/app/hour/signRecord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${currentUser?.token || ''}`,
        },
        body: new URLSearchParams({
          id: lastRecord.id.toString(),
          userId: scannedUserData.userId,
          type: '2', // 2-签退
          endTime: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          }).replace(/\//g, '-'),
          operateUserId: currentUser?.id || '',
          operateLegalName: currentUser?.legalName || '',
        }),
      });

      const result = await signOutResponse.json();
      if (result.code === 200) {
        Alert.alert('签退成功', `${scannedUserData.legalName} 志愿者签退成功！`);
      } else {
        Alert.alert('签退失败', result.msg || '签退操作失败');
      }
    } catch (error) {
      console.error('志愿者签退失败:', error);
      Alert.alert('签退失败', '网络错误，请重试');
    }
  };

  // 活动签到管理
  const handleActivitySignIn = () => {
    Alert.prompt(
      '活动签到',
      '请输入活动ID进行签到:',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '签到',
          onPress: async (activityId) => {
            if (!activityId) return;
            
            try {
              const response = await fetch(
                `https://www.vitaglobal.icu/app/activity/signIn?activityId=${activityId}&userId=${scannedUserData.userId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${currentUser?.token || ''}`,
                  },
                }
              );

              const result = await response.json();
              if (result.code === 200) {
                Alert.alert(
                  t('activities.checkin_success'), 
                  `${scannedUserData.legalName} ${t('activities.checkin_success')}！`
                );
              } else {
                Alert.alert(
                  t('activities.checkin_failed'), 
                  result.msg || t('activities.checkin_failed_message')
                );
              }
            } catch (error) {
              console.error('活动签到失败:', error);
              Alert.alert(
                t('activities.checkin_failed'), 
                t('activities.network_error')
              );
            }
          }
        }
      ],
      'plain-text'
    );
  };

  // 管理操作菜单
  const showManagementActions = () => {
    const scannerLevel = getCurrentUserPermissionLevel();
    
    if (scannerLevel < PermissionLevel.STAFF) {
      Alert.alert('权限不足', '您没有管理操作权限');
      return;
    }

    const actions = [];

    // 志愿者管理操作（员工及以上）
    if (scannerLevel >= PermissionLevel.STAFF) {
      actions.push(
        { text: '志愿者签到', onPress: handleVolunteerSignIn },
        { text: '志愿者签退', onPress: handleVolunteerSignOut }
      );
    }

    // 活动管理操作（分管理员及以上）
    if (scannerLevel >= PermissionLevel.PART_ADMIN) {
      actions.push(
        { text: '活动签到', onPress: handleActivitySignIn }
      );
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
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
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
      borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
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
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    infoSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#111827',
      marginBottom: 12,
    },
    infoItem: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    infoLabel: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      width: 80,
    },
    infoValue: {
      fontSize: 14,
      color: isDarkMode ? '#FFFFFF' : '#111827',
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
      backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
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
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    activitiesList: {
      marginBottom: 20,
    },
    activityItem: {
      backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#FFFFFF' : '#111827',
      marginBottom: 4,
    },
    activityMeta: {
      fontSize: 12,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    permissionNote: {
      backgroundColor: isDarkMode ? '#374151' : '#FEF3CD',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    permissionText: {
      fontSize: 13,
      color: isDarkMode ? '#D1D5DB' : '#92400E',
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
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
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
      color: isDarkMode ? '#FFFFFF' : '#374151',
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
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
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
                color={isDarkMode ? '#FFFFFF' : theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Ionicons 
                  name="hourglass-outline" 
                  size={32} 
                  color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
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
                    {getPermissionDescription(userInfo.permissions!)}
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
                  {userInfo.permissions?.canViewStudentId && userInfo.user?.studentId && (
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
                  {userInfo.permissions?.canViewFullProfile && (
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