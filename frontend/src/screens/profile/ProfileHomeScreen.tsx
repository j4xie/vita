import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  DeviceEventEmitter,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { ProfileInfoCard } from '../../components/profile/ProfileInfoCard';
import { StatCard } from '../../components/profile/StatCard';
import { VolunteerManagementCard } from '../../components/profile/VolunteerManagementCard';
import { UserIdentityQRModal } from '../../components/modals/UserIdentityQRModal';
import { UserActivityModal } from '../../components/modals/UserActivityModal';
import { LoginRequiredModal } from '../../components/modals/LoginRequiredModal';
import { LogoutConfirmationModal } from '../../components/modals/LogoutConfirmationModal';
import { UserIdentityData } from '../../types/userIdentity';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
// import { getUserDisplayName, getUserAvatar } from '../../utils/userAdapter'; // 暂时注释，直接使用用户数据
import { mapUserToIdentityData } from '../../utils/userIdentityMapper';
import { activityStatsService, UserActivityStats } from '../../services/activityStatsService';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { getCurrentToken } from '../../services/authAPI';
import { getVolunteerHours, VolunteerHours, getPersonalVolunteerHours } from '../../services/volunteerAPI';
import { positionService } from '../../services/positionService';
import { apiCache } from '../../services/apiCache';

interface SettingRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  value?: string;
  isLast?: boolean;
  badgeCount?: number;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  icon,
  onPress,
  value,
  isLast = false,
  badgeCount,
}) => {
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  const rowStyles = StyleSheet.create({
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    },
    settingRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    // 简洁风格 - 移除图标背景
    iconBackground: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingText: {
      fontSize: 16,
      fontWeight: '400',
      color: isDarkMode ? '#ffffff' : '#000000',
      flex: 1,
    },
    settingRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingValue: {
      fontSize: 13,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginRight: 8,
    },
    badge: {
      backgroundColor: theme.colors.danger,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    badgeText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={rowStyles.settingRow}
      onPress={handlePress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
      accessibilityHint="Double tap to open"
    >
      <View style={rowStyles.settingRowLeft}>
        <View style={rowStyles.iconBackground}>
          <Ionicons
            name={icon}
            size={20}
            color={isDarkMode ? '#F9A889' : '#F9A889'}
          />
        </View>
        <Text
          style={rowStyles.settingText}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.4}
        >
          {typeof title === 'string' ? title : String(title)}
        </Text>
      </View>
      <View style={rowStyles.settingRowRight}>
        {typeof badgeCount === 'number' && badgeCount > 0 && (
          <View style={rowStyles.badge}>
            <Text style={rowStyles.badgeText}>
              {badgeCount > 9 ? '9+' : badgeCount}
            </Text>
          </View>
        )}
        {value && typeof value === 'string' && (
          <Text
            style={rowStyles.settingValue}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
          >
            {value}
          </Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDarkMode ? 'rgba(235, 235, 245, 0.3)' : '#c7c7cc'}
        />
      </View>
    </TouchableOpacity>
  );
};

export const ProfileHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout, permissions } = useUser();

  // 身份二维码状态
  const [showIdentityQR, setShowIdentityQR] = useState(false);

  // 活动统计状态
  const [activityStats, setActivityStats] = useState<UserActivityStats>({
    notParticipated: 0,
    participated: 0,
    bookmarked: 0,
    pendingReview: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // 志愿者统计状态
  const [volunteerStats, setVolunteerStats] = useState({
    volunteerHours: 0,
    points: 0, // 积分系统暂未实现
  });
  const [isLoadingVolunteerStats, setIsLoadingVolunteerStats] = useState(false);

  // ✅ 组织信息状态 - 存储异步获取的岗位信息
  const [organizationInfo, setOrganizationInfo] = useState({ school: '', organization: '', position: '' });

  // 用户活动模态框状态
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityModalType, setActivityModalType] = useState<'not_checked_in' | 'checked_in'>('not_checked_in');

  // 登录提示模态框状态
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 退出登录确认模态框状态
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);

  // 移除未使用的userStats变量

  // VIP状态 - 无权益暂时隐藏
  const hasVipBenefits = false; // 有权益才显示
  const membershipStatus = hasVipBenefits ? 'vip' : 'free';

  // 生成用户身份数据
  // 生成用户身份数据 - 使用真实的登录用户数据
  const generateUserIdentityData = (): UserIdentityData => {
    if (!user || !isAuthenticated) {
      // 如果用户未登录，返回访客数据
      return mapUserToIdentityData(null);
    }

    // 🌍 检测当前语言环境并传递给mapper
    const isEnglish = t('profile.organization.cu_headquarters', 'CU HQ') === 'CU HQ';
    // 使用真实的用户数据
    return mapUserToIdentityData(user, isEnglish);
  };

  // 生成显示名称：只显示nickname
  const getDisplayName = (): string => {
    if (!user || !isAuthenticated) {
      return t('userInfo.guest');
    }

    // 优先显示nickname，如果没有则回退到legalName或userName
    const displayName = user.nickName?.trim() || user.legalName?.trim() || user.userName || '用户';
    console.log('👤 [PROFILE] 显示名称:', displayName, '认证状态:', isAuthenticated);
    return displayName;
  };

  // 获取用户组织信息 - ✅ 使用positionService统一管理岗位
  const getUserOrganizationInfo = async () => {
    if (!user || !isAuthenticated) return { school: '', organization: '', position: '' };

    // 🆕 学校信息 - 支持完整的dept结构，并处理英文简称
    const rawSchool = user.school?.name || user.dept?.deptName || '';
    let school = rawSchool;

    // 英文环境下使用学校简称
    if (rawSchool.includes('CU总部') || rawSchool === 'CU总部') {
      school = t('profile.organization.cu_headquarters', 'CU HQ');
    }

    // 🆕 组织信息 - 统一显示为CU
    const organization = school ? 'CU' : '';

    // ✅ 使用positionService统一获取岗位信息（支持动态更新和i18n）
    let position = '';
    const permissionLevel = permissions.getPermissionLevel();

    // 只有管理员、分管理员、内部员工才显示职位
    if (['manage', 'part_manage', 'staff'].includes(permissionLevel)) {
      try {
        // 使用positionService动态获取岗位
        const positionInfo = await positionService.getUserPositionDisplay(user);

        if (positionInfo) {
          position = positionInfo.level || '';
          console.log('✅ [PROFILE] 从positionService获取岗位成功:', position);
        } else {
          console.log('⚠️ [PROFILE] positionService返回null，无岗位信息');
        }
      } catch (error) {
        console.error('❌ [PROFILE] 获取岗位信息失败:', error);
      }
    }

    console.log('👤 [PROFILE] 用户组织信息:', {
      rawSchool,
      school,
      organization,
      position,
      permissionLevel,
      rawRole: user.role,
      rawPost: user.post,
      rawDept: user.dept
    });

    return { school, organization, position };
  };

  const handleShowIdentityQR = () => {
    if (!user || !isAuthenticated) {
      // 如果用户未登录，引导用户登录
      Alert.alert(
        t('alerts.login_required_title', '需要登录'),
        t('alerts.login_required_message', '请先登录以查看您的身份码'),
        [{ text: t('common.got_it') }]
      );
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowIdentityQR(true);
  };

  // 处理未签到活动点击
  const handleNotCheckedInPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActivityModalType('not_checked_in');
    setShowActivityModal(true);
  };

  // 处理已签到活动点击
  const handleCheckedInPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActivityModalType('checked_in');
    setShowActivityModal(true);
  };

  // 处理未登录用户点击活动统计
  const handleUnauthenticatedPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setShowLoginModal(true);
  };

  // 处理登录模态框中的登录按钮点击
  const handleLoginFromModal = () => {
    setShowLoginModal(false);
    navigation.navigate('Login');
  };

  // 刷新活动统计数据回调
  const handleRefreshStats = () => {
    loadActivityStats();
  };

  // 处理编辑资料按钮点击
  const handleEditProfile = () => {
    if (!user || !isAuthenticated) {
      // 如果用户未登录，引导用户登录
      Alert.alert(
        t('alerts.login_required_title', '需要登录'),
        t('alerts.login_required_message', '请先登录以编辑您的资料'),
        [{ text: t('common.got_it') }]
      );
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    navigation.navigate('EditProfile');
  };


  // 加载活动统计数据
  const loadActivityStats = async () => {
    if (!isAuthenticated || !user?.id) {
      // 静默处理未登录状态，避免不必要的控制台警告
      return;
    }

    try {
      setIsLoadingStats(true);
      console.log('📊 正在加载活动统计，用户信息:', {
        userId: user.id,
        userName: user.userName,
        isAuthenticated
      });
      const stats = await activityStatsService.getUserActivityStats(user.id);
      setActivityStats(stats);
      console.log('📊 ✅ 活动统计加载成功');
    } catch (error) {
      console.error('📊 ❌ 加载活动统计失败:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // 加载志愿者统计数据
  const loadVolunteerStats = async () => {
    // 获取用户ID，支持不同的字段名，并转换为数字
    const userIdString = user?.userId || user?.id;
    const userIdToUse = userIdString ? parseInt(String(userIdString), 10) : undefined;

    if (!isAuthenticated || !userIdToUse || isNaN(userIdToUse)) {
      // 未登录或无有效用户ID，静默处理
      return;
    }

    // 🆕 权限检查：只有staff及以上权限才能访问志愿者功能
    if (!permissions.hasVolunteerManagementAccess()) {
      // 普通用户不显示志愿者统计，设置为默认值
      setVolunteerStats({
        volunteerHours: 0,
        points: 0,
      });
      return;
    }

    try {
      setIsLoadingVolunteerStats(true);

      // 🆕 使用接口19：个人工时统计API - 仅限staff及以上权限
      try {
        const personalResponse = await getPersonalVolunteerHours(userIdToUse);

        if (personalResponse.code === 200 && personalResponse.data) {
          const totalMinutes = personalResponse.data.totalMinutes || 0;

          // 数据验证：确保totalMinutes是合法数字
          const validMinutes = typeof totalMinutes === 'number' && !isNaN(totalMinutes) && totalMinutes >= 0 ? totalMinutes : 0;
          const hours = Math.floor(validMinutes / 60);

          setVolunteerStats({
            volunteerHours: hours,
            points: 0, // 积分接口暂无，保持为0
          });

          console.log('✅ [PERSONAL-HOURS] 个人工时统计加载成功:', { totalMinutes: validMinutes, hours });
          return;
        } else {
          throw new Error('个人工时API返回无效数据');
        }
      } catch (personalError: any) {
        console.log('ℹ️ [PERSONAL-HOURS] 个人工时API无数据或调用失败，使用管理员API:', personalError.message);

        // Fallback: 使用原来的管理员工时API（向后兼容）
        const response = await getVolunteerHours({ userId: userIdToUse });

        if (response.code === 200 && response.rows) {
          // 增强的类型验证
          const volunteerData = Array.isArray(response.rows) ? response.rows as VolunteerHours[] : [];

          // 计算当前用户的总工时，增加数据验证
          const userHours = volunteerData.find(v =>
            v &&
            typeof v === 'object' &&
            typeof v.userId === 'number' &&
            v.userId === userIdToUse
          );

          const totalMinutes = userHours?.totalMinutes || 0;

          // 数据验证：确保totalMinutes是合法数字
          const validMinutes = typeof totalMinutes === 'number' && !isNaN(totalMinutes) && totalMinutes >= 0 ? totalMinutes : 0;
          const hours = Math.floor(validMinutes / 60);

          setVolunteerStats({
            volunteerHours: hours,
            points: 0, // 积分接口暂无，保持为0
          });

          console.log('🔍 ✅ 志愿者统计加载成功(fallback):', { totalMinutes: validMinutes, hours });
        } else {
          console.log('🔍 志愿者统计无数据或接口失败:', response.msg || '未知错误');
          // API失败时重置为默认值，确保数据一致性
          setVolunteerStats({
            volunteerHours: 0,
            points: 0,
          });
        }
      } // 🔧 关闭personalError的catch块
    } catch (error) {
      console.error('🔍 ❌ 加载志愿者统计失败:', {
        error: error instanceof Error ? error.message : error,
        userId: userIdToUse,
        timestamp: new Date().toISOString()
      });
      // 发生错误时重置为默认值，确保数据一致性
      setVolunteerStats({
        volunteerHours: 0,
        points: 0,
      });
    } finally {
      setIsLoadingVolunteerStats(false);
    }
  };

  // ✅ 加载组织信息（包括岗位）
  const loadOrganizationInfo = async () => {
    if (!isAuthenticated || !user) {
      setOrganizationInfo({ school: '', organization: '', position: '' });
      return;
    }

    try {
      const info = await getUserOrganizationInfo();
      setOrganizationInfo(info);
      console.log('✅ [PROFILE] 组织信息加载成功:', info);
    } catch (error) {
      console.error('❌ [PROFILE] 加载组织信息失败:', error);
      setOrganizationInfo({ school: '', organization: '', position: '' });
    }
  };

  // 页面首次加载时获取统计数据
  useEffect(() => {
    console.log('🔄 [PROFILE-INIT] 页面首次加载，获取统计数据');
    const userIdString = user?.userId || user?.id;
    const userIdToUse = userIdString ? parseInt(String(userIdString), 10) : undefined;
    if (isAuthenticated && userIdToUse && !isNaN(userIdToUse)) {
      loadActivityStats();
      loadVolunteerStats();
      loadOrganizationInfo(); // ✅ 加载组织信息
    }
  }, []); // 空依赖数组，只在组件挂载时加载一次

  // 页面聚焦时刷新统计数据（用户从其他页面返回时）
  useFocusEffect(
    useCallback(() => {
      console.log('📱 [PROFILE-FOCUS] 页面获得焦点，刷新统计数据');
      const userIdString = user?.userId || user?.id;
      const userIdToUse = userIdString ? parseInt(String(userIdString), 10) : undefined;
      if (isAuthenticated && userIdToUse && !isNaN(userIdToUse)) {
        // ✅ 清空缓存，确保获取最新数据
        apiCache.clearByPattern('userInfo:');
        positionService.clearCache();
        console.log('🧹 [PROFILE-FOCUS] 已清空用户信息和岗位缓存');

        loadActivityStats();
        loadVolunteerStats();
        loadOrganizationInfo(); // ✅ 刷新组织信息
      }
    }, []) // 空依赖数组，只在页面聚焦时触发，避免无限刷新
  );

  // 监听活动报名成功事件
  useEffect(() => {
    const registrationListener = DeviceEventEmitter.addListener('activityRegistered', (data: { activityId: string }) => {
      console.log('📊 [ProfileHome] 收到活动报名成功事件，刷新统计数据:', {
        activityId: data?.activityId,
        isAuthenticated,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      if (isAuthenticated) {
        console.log('🔄 [ProfileHome] 开始刷新活动统计数据');
        loadActivityStats();
      } else {
        console.log('⚠️ [ProfileHome] 用户未认证，跳过统计数据刷新');
      }
    });

    return () => {
      registrationListener?.remove();
    };
  }, [isAuthenticated]);

  // 处理志愿者小时点击 - 导航到历史记录页面
  const handleVolunteerHoursPress = useCallback(() => {
    console.log('🔍 [VOLUNTEER-HOURS] 用户点击志愿者小时:', {
      用户: user?.userName,
      权限级别: permissions.getPermissionLevel(),
      志愿者小时: volunteerStats?.volunteerHours
    });

    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    // 导航到历史记录页面
    const userIdString = user?.userId || user?.id;
    const userIdToUse = userIdString ? parseInt(String(userIdString), 10) : undefined;

    if (userIdToUse && !isNaN(userIdToUse)) {
      navigation.navigate('VolunteerHistory', {
        userId: userIdToUse,
        userName: user?.nickName || user?.legalName || user?.userName || 'User',
        userPermission: permissions.getPermissionLevel() as 'manage' | 'part_manage' | 'staff',
      });
    }
  }, [user, permissions, volunteerStats, navigation]);

  // 处理志愿者功能区域点击
  const handleVolunteerSectionPress = useCallback(() => {
    console.log('🔍 [VOLUNTEER-SECTION] 用户点击志愿者功能区域:', {
      用户: user?.userName,
      权限级别: permissions.getPermissionLevel(),
      是否Staff: permissions.isStaff(),
      志愿者小时: volunteerStats?.volunteerHours
    });

    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    // 所有有志愿者权限的用户都跳转到志愿者管理页面
    navigation.navigate('VolunteerHome');
  }, [user, permissions, volunteerStats, navigation]);

  // Logout handling functions
  const handleLogout = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setShowLogoutModal(true);
  };

  const performLogout = async () => {
    try {
      // 使用 UserContext 的 logout 方法来正确清理所有状态
      await logout();

      // 在状态清理后，重置导航到认证页面
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  // 设置项
  const settingItems = [
    {
      id: 'notifications',
      title: t('profile.menuItems.notifications'),
      icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap,
      badgeCount: 0, // 暂无通知API，显示真实的0状态
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'address',
      title: t('profile.menuItems.address', '收货地址'),
      icon: 'location-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => navigation.navigate('AddressList'),
    },
    {
      id: 'general',
      title: t('profile.menuItems.general'),
      icon: 'settings-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => navigation.navigate('General'),
    },
    {
      id: 'about-support',
      title: t('profile.menuItems.aboutSupport'),
      icon: 'information-circle-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => navigation.navigate('AboutSupport'),
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#F5F5F5', // 浅灰背景
    },

    // V2.0 背景层设计 - 避免与容器冲突
    backgroundLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 100, // 80-120pt高度
      zIndex: -1, // 置于背景层
    },
    horizonBand: {
      flex: 1,
      marginTop: 12, // 8-12pt缓冲区，不贴容器边
    },
    mistOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.08)', // 8-10%白雾叠加
    },
    safeArea: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 56 + 12 + insets.bottom,
    },

    // 访客卡片样式
    guestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 24,
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    guestContent: {
      flex: 1,
    },
    guestTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: isDarkMode ? '#FFFFFF' : '#000000',
      marginBottom: 4,
    },
    guestSubtitle: {
      fontSize: 13,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },

    // 统计卡片网格样式
    statsGrid: {
      marginBottom: 20,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statCardWrapper: {
      flex: 1,
    },
    statCardThird: {
      flex: 1,
    },
    listContainer: {
      backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },

    // 小红书风格个人信息卡
    personalInfoShadowContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12, // 与设置卡片保持一致
      marginVertical: 8,
      // 小红书风格阴影
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
    },

    // 我的活动区 - 美团风格
    activitySection: {
      marginVertical: 8, // 恢复原来的间距
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#6B7280',
      marginBottom: 8,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // 区域标题头部
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      marginHorizontal: 4,
    },
    seeAllText: {
      fontSize: 13,
      color: '#6B7280', // 中性灰色
      fontWeight: '500',
    },

    activityContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)', // L1玻璃背景
      borderRadius: 20, // 20pt圆角统一
      padding: 16, // 内边距16-20pt
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)', // 中性描边1pt
      borderTopColor: 'rgba(255, 255, 255, 0.6)', // 1pt内侧高光≤8%
      // XS阴影
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 1,
    },
    activityItem: {
      alignItems: 'center',
      flex: 1,
    },
    activityDivider: {
      width: 1,
      height: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      marginHorizontal: 20,
    },
    // 中性图标圆点 - 统一灰色系
    activityIconL2: {
      width: 30, // 28-32pt标准
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(107, 114, 128, 0.15)', // 中性灰色背景
      borderWidth: 1,
      borderColor: 'rgba(107, 114, 128, 0.25)', // 中性灰边框
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },

    // 列间分隔线
    activitySeparator: {
      width: 1,
      height: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.6)', // 0.5-1pt半透明白分隔线
      marginHorizontal: 4,
    },
    activityInfo: {
      alignItems: 'center',
    },
    activityLabel: {
      fontSize: 13,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginBottom: 2,
    },
    activityCount: {
      fontSize: 22,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#000000',
    },

    // 会员卡L1玻璃设计
    membershipSection: {
      marginVertical: 8, // 恢复原来的间距
    },
    membershipCardL1: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)', // L1玻璃背景
      borderRadius: 20, // 20-24pt圆角
      padding: 16, // 16-20pt内边距
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)', // 中性描边1pt
      borderTopColor: 'rgba(255, 255, 255, 0.6)', // 1pt内侧高光
      // XS阴影
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 1,
    },
    membershipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    membershipTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#000000',
    },
    membershipBadge: {
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    membershipBadgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#6B7280',
    },
    upgradeButtonDawn: {
      backgroundColor: '#374151', // 中性深灰色
      paddingHorizontal: 18, // 16-20pt内距
      paddingVertical: 10,
      borderRadius: 20, // 高36-40pt
      alignItems: 'center',
      alignSelf: 'flex-end',
      borderWidth: 1,
      borderColor: 'rgba(55, 65, 81, 0.2)', // 深灰边框
    },
    upgradeTextDawn: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFF', // 白色文字
    },

    // 会员卡入口样式
    membershipActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    myCardsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(107, 114, 128, 0.1)', // 中性灰色背景
      borderWidth: 1,
      borderColor: 'rgba(107, 114, 128, 0.2)', // 中性灰边框
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      flex: 1,
      marginRight: 12,
    },

    myCardsText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#374151', // 深灰色文字
      marginLeft: 6,
      flex: 1,
    },

    cardCountBadge: {
      backgroundColor: '#FF6B35', // PomeloX橙色
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },

    cardCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    orgSwitchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(107, 114, 128, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      marginRight: 8,
    },

    orgSwitchText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#374151',
      marginLeft: 6,
    },

    // 核心服务区 - 2x2网格
    servicesSection: {
      marginVertical: 8,
    },
    servicesGrid: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      // 小红书风格阴影
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    serviceItem: {
      width: '50%',
      alignItems: 'center',
      paddingVertical: 16,
    },
    serviceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(107, 114, 128, 0.1)', // 中性灰色背景
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    serviceLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#000',
      marginBottom: 4,
    },
    serviceDesc: {
      fontSize: 12,
      color: '#666',
    },

    // 快捷工具网格 - 2x3网格
    toolsSection: {
      marginVertical: 8,
    },
    toolsGrid: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      // 小红书风格阴影
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    toolItem: {
      width: '33.33%', // 3列布局
      alignItems: 'center',
      paddingVertical: 12,
    },
    toolIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(107, 114, 128, 0.1)', // 中性灰色背景
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    toolLabel: {
      fontSize: 12,
      color: '#000',
      textAlign: 'center',
    },

    // 设置区域
    settingsSection: {
      marginTop: 12, // 🔧 增加上边距，与"我的活动"→"我的会员"间距保持一致
      marginBottom: 20, // 减少下边距，让退出按钮更靠近
    },
    settingsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginBottom: 2, // 🔧 从8减少到2，缩短标题与卡片的距离
    },

    // V2.0 中性写评价按钮
    writeReviewButtonL2: {
      backgroundColor: 'rgba(107, 114, 128, 0.15)', // 中性灰色背景
      borderWidth: 1,
      borderColor: 'rgba(107, 114, 128, 0.25)', // 中性灰边框
      paddingHorizontal: 16, // 16-20pt左右内距
      paddingVertical: 8,
      borderRadius: 18, // 高36-40pt的胶囊
      flexDirection: 'row',
      alignItems: 'center',
      height: 36, // 36-40pt高度
    },
    writeReviewTextL2: {
      fontSize: 13,
      fontWeight: '600',
      color: '#374151', // 深灰色文字
      marginLeft: 4,
    },

    // V2.0 评价卡片列表样式
    reviewList: {
      // 列表容器
    },
    reviewCardL1: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)', // L1玻璃背景
      borderRadius: 16, // 16-20pt圆角
      padding: 12, // 12-16pt内边距
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8, // 8-12pt条间距
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)', // 中性描边1pt
      borderTopColor: 'rgba(255, 255, 255, 0.6)', // 1pt内侧高光
      // XS阴影
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 1,
    },
    reviewThumbnail: {
      width: 48, // 48x48缩略图
      height: 48,
      borderRadius: 8,
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    reviewContent: {
      flex: 1,
    },
    reviewTitleL1: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
      lineHeight: 20,
    },
    reviewMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reviewMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },
    reviewMetaText: {
      fontSize: 12,
      color: '#9CA3AF',
      marginLeft: 4,
    },
    reviewDate: {
      fontSize: 12,
      color: '#9CA3AF',
      marginLeft: 'auto',
    },

    // 空状态样式
    emptyStateContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyStateText: {
      fontSize: 15,
      fontWeight: '500',
      color: '#6B7280',
      marginTop: 12,
      marginBottom: 4,
    },
    emptyStateSubtext: {
      fontSize: 13,
      color: '#9CA3AF',
      textAlign: 'center',
    },

    // Logout section styles
    logoutSection: {
      marginTop: 8, // 适当的上边距
      marginBottom: 100, // 为TabBar预留足够空间
      paddingHorizontal: 4,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderWidth: 1,
      borderColor: 'rgba(220, 38, 38, 0.2)',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      // Light shadow
      shadowColor: 'rgba(220, 38, 38, 0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '600',
      color: isDarkMode ? '#FF453A' : '#DC2626',
    },

  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScroll={() => { }} // Explicit empty handler to prevent propagation issues
          scrollEventThrottle={16}
        >
          {/* 个人信息卡片 - 仅登录用户显示 */}
          {isAuthenticated && user ? (
            <ProfileInfoCard
              userName={getDisplayName()}
              school={organizationInfo.school}
              position={organizationInfo.position}
              avatarUrl={user.avatar}
              onEditPress={() => navigation.navigate('EditProfile')}
              onQRCodePress={() => navigation.navigate('PersonalQR' as never)}
            />
          ) : (
            /* 访客状态：显示登录引导卡片 */
            <TouchableOpacity
              style={styles.guestCard}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <View style={styles.guestContent}>
                <Text style={styles.guestTitle}>{t('userInfo.guest')}</Text>
                <Text style={styles.guestSubtitle}>
                  {t('profile.login_to_view', 'Login to view your profile')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* 统计卡片 - 单行3列布局 */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statCardThird}>
                <StatCard
                  label={t('profile.volunteer_hours_short')}
                  value={isAuthenticated && user?.id ? volunteerStats.volunteerHours : '--'}
                  icon="time-outline"
                  iconColor="#FF6B35"
                  iconBackgroundColor="rgba(255, 107, 53, 0.1)"
                  onPress={isAuthenticated && user?.id ? handleVolunteerHoursPress : handleUnauthenticatedPress}
                />
              </View>
              <View style={styles.statCardThird}>
                <StatCard
                  label={t('profile.not_participated')}
                  value={isAuthenticated && user?.id ? activityStats.notParticipated : '--'}
                  icon="document-text-outline"
                  iconColor="#4A90E2"
                  iconBackgroundColor="rgba(74, 144, 226, 0.1)"
                  onPress={isAuthenticated && user?.id ? handleNotCheckedInPress : handleUnauthenticatedPress}
                />
              </View>
              <View style={styles.statCardThird}>
                <StatCard
                  label={t('profile.participated')}
                  value={isAuthenticated && user?.id ? activityStats.participated : '--'}
                  icon="checkmark-circle-outline"
                  iconColor="#FF6B6B"
                  iconBackgroundColor="rgba(255, 107, 107, 0.1)"
                  onPress={isAuthenticated && user?.id ? handleCheckedInPress : handleUnauthenticatedPress}
                />
              </View>
            </View>
          </View>

          {/* 志愿者管理卡片 - 仅staff及以上显示 */}
          {isAuthenticated && permissions.hasVolunteerManagementAccess() && (
            <VolunteerManagementCard onPress={handleVolunteerSectionPress} />
          )}

          {/* 会员卡区域已隐藏以通过App Store审核 */}
          {/* <View style={styles.membershipSection}>
            <Text style={styles.sectionTitle}>{t('profile.my_membership')}</Text>
            <View style={styles.membershipCardL1}>
              <View style={styles.membershipHeader}>
                <Text style={styles.membershipTitle}>{t('profile.membership_title')}</Text>
                <View style={styles.membershipBadge}>
                  <Text style={styles.membershipBadgeText}>{t('profile.membership_regular')}</Text>
                </View>
              </View>
              
              <View style={styles.membershipActions}>
                <TouchableOpacity 
                  style={styles.myCardsButton}
                  onPress={() => navigation.navigate('MyCards')}
                >
                  <Ionicons name="card-outline" size={16} color="#6B7280" />
                  <Text style={styles.myCardsText}>{t('profile.my_cards', '我的会员卡')}</Text>
                  <View style={styles.cardCountBadge}>
                    <Text style={styles.cardCountText}>0</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.upgradeButtonDawn}
                  onPress={() => {
                    Alert.alert(t('alerts.feature_not_implemented'), t('alerts.feature_under_development'));
                  }}
                >
                  <Text style={styles.upgradeTextDawn}>{t('profile.upgrade_membership')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View> */}

          {/* 我的评价/笔记区 - 暂时隐藏 */}
          {/* 
          <View style={styles.reviewSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('profile.my_reviews')}</Text>
              <TouchableOpacity 
                style={styles.writeReviewButtonL2}
                onPress={() => {
                  Alert.alert(t('alerts.feature_not_implemented'), t('alerts.feature_under_development'));
                }}
              >
                <Ionicons name="create-outline" size={16} color="#374151" />
                <Text style={styles.writeReviewTextL2}>{t('profile.write_review')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.reviewList}>
              <View style={styles.emptyStateContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>{t('profile.no_reviews', '暂无评价')}</Text>
                <Text style={styles.emptyStateSubtext}>{t('profile.review_after_activity', '参加活动后可以写评价')}</Text>
              </View>
            </View>
          </View>
          */}

          {/* 设置列表 - 收纳到底部 */}
          <View style={styles.settingsSection}>
            <View style={styles.settingsHeader}>
              <Text style={styles.sectionTitle}>{t('profile.settings_and_help', '设置与帮助')}</Text>
            </View>
            <View style={styles.listContainer}>
              {(settingItems || []).map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  onPress={item.onPress}
                  badgeCount={item.badgeCount}
                  isLast={index === settingItems.length - 1}
                />
              ))}
            </View>
          </View>

          {/* Logout Button - 只有登录用户才显示 */}
          {isAuthenticated && (
            <View style={styles.logoutSection}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="#DC2626"
                  style={styles.logoutIcon}
                />
                <Text style={styles.logoutText}>{t('profile.account.logout')}</Text>
              </TouchableOpacity>

            </View>
          )}

          {/* 未登录时显示登录按钮 */}
          {!isAuthenticated && (
            <View style={styles.logoutSection}>
              <TouchableOpacity
                style={[styles.logoutButton, { borderColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="log-in-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.logoutIcon}
                />
                <Text style={[styles.logoutText, { color: theme.colors.primary }]}>
                  {t('auth.login.login')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* 用户身份二维码模态框 */}
      <UserIdentityQRModal
        visible={showIdentityQR}
        onClose={() => setShowIdentityQR(false)}
        userData={generateUserIdentityData()}
      />

      {/* 用户活动列表模态框 */}
      <UserActivityModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        activityType={activityModalType}
        onRefreshStats={handleRefreshStats}
      />

      {/* 登录提示模态框 */}
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginFromModal}
      />

      {/* 退出登录确认模态框 */}
      <LogoutConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={performLogout}
      />
    </View>
  );
};

export default ProfileHomeScreen;