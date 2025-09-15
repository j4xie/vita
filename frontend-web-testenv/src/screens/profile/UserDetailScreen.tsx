import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../theme';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { UserIdentityData } from '../../types/userIdentity';
import { useUser } from '../../context/UserContext';
import { getScanPermissions } from '../../types/userPermissions';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { getVolunteerHours, formatVolunteerHours } from '../../services/volunteerAPI';

interface UserDetailScreenParams {
  userData: UserIdentityData;
  fromQRScan?: boolean;
}

export const UserDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useUser();
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles } = darkModeSystem;
  
  const { userData, fromQRScan } = (route.params as UserDetailScreenParams) || {};
  
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    if (userData && currentUser) {
      // 计算权限
      const scanPermissions = getScanPermissions(currentUser, {
        userId: userData.userId,
        deptId: userData.school?.id || userData.deptId
      });
      setPermissions(scanPermissions);
      
      // 加载用户统计数据
      loadUserStats();
    }
  }, [userData, currentUser]);

  const loadUserStats = async () => {
    if (!userData || !permissions?.canManageVolunteer) return;
    
    setLoading(true);
    try {
      // 获取志愿者工时数据
      const hoursResult = await getVolunteerHours({ userId: parseInt(userData.userId) });
      
      if (hoursResult.code === 200 && hoursResult.rows?.length > 0) {
        setUserStats(hoursResult.rows[0]);
      }
    } catch (error) {
      console.error('加载用户统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleVolunteerManage = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // 跳转到志愿者签到页面，自动搜索该用户
    navigation.navigate('Main', {
      screen: 'WellbeingTab',
      params: {
        screen: 'VolunteerCheckIn',
        params: {
          autoSearchPhone: userData.userId, // 使用userId作为搜索条件
          autoSearchUserId: userData.userId,
          fromUserDetail: true,
          preloadedUserData: userData
        }
      }
    });
  };

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.text.disabled} />
          <Text style={[styles.errorText, dmStyles.text.secondary]}>
            {t('userDetail.no_data', '无用户数据')}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dmStyles.text.title]}>
          {t('userDetail.title', '用户详情')}
        </Text>
        <View style={styles.headerBackButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={[styles.userCard, dmStyles.card.background]}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={theme.colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, dmStyles.text.title]}>
                {userData.legalName}
              </Text>
              <Text style={[styles.userNickName, dmStyles.text.secondary]}>
                {userData.nickName}
              </Text>
              <Text style={[styles.userEmail, dmStyles.text.tertiary]}>
                {userData.email}
              </Text>
            </View>
            {fromQRScan && (
              <View style={styles.qrBadge}>
                <Ionicons name="qr-code" size={16} color="#FFFFFF" />
                <Text style={styles.qrBadgeText}>{t('profile.qr_obtained')}</Text>
              </View>
            )}
          </View>

          {/* Organization & School */}
          {(userData.currentOrganization || userData.school) && (
            <View style={styles.affiliationSection}>
              {userData.currentOrganization && (
                <View style={styles.affiliationItem}>
                  <Ionicons name="business" size={16} color={theme.colors.text.secondary} />
                  <Text style={[styles.affiliationText, dmStyles.text.secondary]}>
                    {userData.currentOrganization.displayNameZh}
                  </Text>
                </View>
              )}
              
              {userData.school && (
                <View style={styles.affiliationItem}>
                  <Ionicons name="school" size={16} color={theme.colors.text.secondary} />
                  <Text style={[styles.affiliationText, dmStyles.text.secondary]}>
                    {userData.school.name}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Stats Section - 只有管理员权限才显示 */}
        {permissions?.canManageVolunteer && (
          <View style={[styles.statsCard, dmStyles.card.background]}>
            <Text style={[styles.sectionTitle, dmStyles.text.title]}>
              {t('userDetail.volunteer_stats', '志愿服务统计')}
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, dmStyles.text.secondary]}>
                  {t('common.loading', '加载中...')}
                </Text>
              </View>
            ) : userStats ? (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                    {formatVolunteerHours(userStats.totalMinutes || 0)}
                  </Text>
                  <Text style={[styles.statLabel, dmStyles.text.secondary]}>
                    {t('userDetail.total_hours', '总志愿时长')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                    {userStats.recordCount || 0}
                  </Text>
                  <Text style={[styles.statLabel, dmStyles.text.secondary]}>
                    {t('userDetail.total_records', '签到记录')}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.noDataText, dmStyles.text.tertiary]}>
                {t('userDetail.no_volunteer_data', '暂无志愿服务数据')}
              </Text>
            )}
          </View>
        )}

        {/* Permission Notice */}
        {!permissions?.canManageVolunteer && (
          <View style={styles.permissionNotice}>
            <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
            <Text style={styles.permissionNoticeText}>
              {t('userDetail.limited_access', '权限有限，仅显示基本信息')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {permissions?.canManageVolunteer && (
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleVolunteerManage}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {t('userDetail.manage_volunteer', '志愿者管理')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    textAlign: 'center',
    marginVertical: theme.spacing[4],
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  backButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  
  userCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[5],
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
    ...theme.shadows.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  userNickName: {
    fontSize: theme.typography.fontSize.lg,
    marginBottom: theme.spacing[1],
  },
  userEmail: {
    fontSize: theme.typography.fontSize.base,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.badge,
    gap: theme.spacing[1],
  },
  qrBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  affiliationSection: {
    gap: theme.spacing[2],
  },
  affiliationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  affiliationText: {
    fontSize: theme.typography.fontSize.base,
  },
  
  statsCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    ...theme.shadows.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[4],
  },
  loadingContainer: {
    paddingVertical: theme.spacing[6],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    paddingVertical: theme.spacing[4],
  },
  
  permissionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[4],
    gap: theme.spacing[2],
  },
  permissionNoticeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning,
    flex: 1,
  },
  
  bottomActions: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing[2],
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});