import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { BlurView } from '../../components/web/WebBlurView';

import { theme } from '../../theme';
import { UserIdentityData } from '../../types/userIdentity';
import { getScanPermissions } from '../../types/userPermissions';
import { useUser } from '../../context/UserContext';

interface QRScanResultScreenParams {
  userData: string;  // JSON字符串
  permissions: string;  // JSON字符串
  returnScreen?: string;
}

export const QRScanResultScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const { userData: userDataString, permissions: permissionsString, returnScreen } = 
    (route.params as QRScanResultScreenParams) || {};

  // 解析JSON字符串
  let userData: UserIdentityData | null = null;
  let permissions: ReturnType<typeof getScanPermissions> | null = null;

  try {
    if (userDataString) {
      userData = JSON.parse(userDataString);
    }
    if (permissionsString) {
      permissions = JSON.parse(permissionsString);
    }
  } catch (error) {
    console.error('解析扫码参数失败:', error);
  }

  if (!userData) {
    // 如果没有用户数据，返回扫码页面
    navigation.goBack();
    return null;
  }

  const handleVolunteerAction = () => {
    console.log('🎯 [QR-RESULT] 志愿者操作被触发');
    // 导航回扫码页面，并传递用户数据以触发志愿者模态框
    navigation.navigate('QRScanner', { 
      triggerVolunteerAction: true,
      targetUserData: JSON.stringify(userData)
    });
  };

  const handleActivityAction = () => {
    console.log('🎯 [QR-RESULT] 活动操作被触发');
    // 导航回扫码页面，并传递用户数据以触发活动选择模态框
    navigation.navigate('QRScanner', {
      triggerActivityAction: true, 
      targetUserData: JSON.stringify(userData)
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinueScan = () => {
    // 返回扫码页面并重置扫描状态
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('qr.results.user_scan_result', '扫码结果')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 成功指示器 */}
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#4ade80" />
          </View>
          <Text style={styles.successText}>
            {t('qr.results.scan_success', '扫码成功')}
          </Text>
        </View>

        {/* 用户信息卡片 */}
        <View style={styles.userCard}>
          {/* 用户头像 */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={32} color={theme.colors.primary} />
            </View>
          </View>

          {/* 用户基本信息 */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData.legalName}</Text>
            <Text style={styles.userSubtitle}>{userData.nickName}</Text>
          </View>

          {/* 用户详细信息 */}
          <View style={styles.userDetailsContainer}>
            {userData.currentOrganization && (
              <View style={styles.userDetailRow}>
                <Ionicons name="business-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.userDetailText}>
                  {userData.currentOrganization.displayNameZh}
                </Text>
              </View>
            )}
            
            {userData.school && (
              <View style={styles.userDetailRow}>
                <Ionicons name="school-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.userDetailText}>
                  {userData.school.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 操作区域 */}
        {(permissions?.availableOptions.volunteerCheckin || permissions?.availableOptions.activityCheckin) && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>
              {t('qr.results.available_actions', '可用操作')}
            </Text>

            {permissions?.availableOptions.volunteerCheckin && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.volunteerButton]} 
                onPress={handleVolunteerAction}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>
                    {t('qr.results.volunteer_checkin_checkout', '志愿者签到/签退')}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {t('qr.results.manage_volunteer_hours', '管理志愿者工时')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}

            {permissions?.availableOptions.activityCheckin && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.activityButton]} 
                onPress={handleActivityAction}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="calendar" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>
                    {t('qr.results.activity_checkin', '活动签到')}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {t('qr.results.checkin_for_activity', '为用户签到活动')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {(!permissions?.availableOptions.volunteerCheckin && !permissions?.availableOptions.activityCheckin) && (
          <View style={styles.noActionsContainer}>
            <View style={styles.noActionsIconContainer}>
              <Ionicons name="information-circle-outline" size={48} color={theme.colors.text.disabled} />
            </View>
            <Text style={styles.noActionsText}>
              {t('qr.results.no_actions_available', '暂无可用操作')}
            </Text>
            <Text style={styles.noActionsSubtitle}>
              {t('qr.results.contact_admin_for_permissions', '如需更多权限，请联系管理员')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinueScan}>
          <Ionicons name="qr-code" size={20} color={theme.colors.primary} />
          <Text style={styles.continueButtonText}>
            {t('qr.results.continue_scanning', '继续扫描')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },

  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },

  // 成功指示器
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },

  successIconContainer: {
    marginRight: theme.spacing.sm,
  },

  successText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#4ade80',
  },

  // 用户信息卡片
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },

  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  userSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },

  userDetailsContainer: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  userDetailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // 操作区域
  actionsContainer: {
    marginBottom: theme.spacing.xl,
  },

  actionsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },

  volunteerButton: {
    backgroundColor: '#8B5CF6',
  },

  activityButton: {
    backgroundColor: '#10B981',
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  actionText: {
    flex: 1,
  },

  actionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },

  actionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },

  // 无操作状态
  noActionsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },

  noActionsIconContainer: {
    marginBottom: theme.spacing.md,
  },

  noActionsText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.disabled,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },

  noActionsSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.disabled,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 20,
  },

  // 底部操作
  bottomActions: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },

  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },

  continueButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
});