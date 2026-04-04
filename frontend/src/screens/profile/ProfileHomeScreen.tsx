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
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { ProfileInfoCard } from '../../components/profile/ProfileInfoCard';
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
import { useMembershipLevel } from '../../hooks/useMembershipLevel';

// Custom SVG icons extracted from Figma design
const NotificationIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
    />
    <Path
      d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeMiterlimit={10}
    />
  </Svg>
);

const ShippingIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 2H9C7 2 6 3 6 5V19C6 21 7 22 9 22H15C17 22 18 21 18 19V5C18 3 17 2 15 2Z" stroke="#FF7763" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 18.5H12.009" stroke="#FF7763" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.5 2V5.5" stroke="#FF7763" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.5 2V5.5" stroke="#FF7763" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GeneralIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AboutSupportIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 18.43H13L8.55 21.39C7.89 21.83 7 21.36 7 20.56V18.43C4 18.43 2 16.43 2 13.43V7.43C2 4.43 4 2.43 7 2.43H17C20 2.43 22 4.43 22 7.43V13.43C22 16.43 20 18.43 17 18.43Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 11.36V11.15C12 10.47 12.42 10.11 12.84 9.82C13.25 9.54 13.66 9.18 13.66 8.52C13.66 7.6 12.92 6.86 12 6.86C11.08 6.86 10.34 7.6 10.34 8.52"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.9955 13.75H12.0045"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface SettingRowProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  value?: string;
  badgeCount?: number;
  testID?: string;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  icon,
  onPress,
  value,
  badgeCount,
  testID,
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
      paddingHorizontal: 15,
      backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
      borderRadius: 70,
      height: 64,
      marginBottom: 10,
    },
    settingRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconBackground: {
      width: 48,
      height: 48,
      borderRadius: 54,
      backgroundColor: isDarkMode ? '#3A3A3C' : '#F8F8F8',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 7,
    },
    settingText: {
      fontSize: 15,
      fontWeight: '500',
      color: isDarkMode ? '#ffffff' : '#000000',
      flex: 1,
    },
    settingRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    arrowCircle: {
      width: 41,
      height: 41,
      borderRadius: 25.5,
      backgroundColor: isDarkMode ? '#3A3A3C' : '#F8F8F8',
      alignItems: 'center',
      justifyContent: 'center',
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
      testID={testID}
    >
      <View style={rowStyles.settingRowLeft}>
        <View style={rowStyles.iconBackground}>
          {icon}
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
        <View style={rowStyles.arrowCircle}>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
            style={{ transform: [{ rotate: '-45deg' }] }}
          />
        </View>
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
  const { user, isAuthenticated, logout, permissions, refreshUserInfo } = useUser();
  const { membershipLevel, loading: membershipLoading } = useMembershipLevel();

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
  const [emailVerifiedLocal, setEmailVerifiedLocal] = useState(false);

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
      console.log('📱 [PROFILE-FOCUS] 页面获得焦点，刷新统计数据和权限');
      // 检查邮箱验证本地标记（必须在弹窗逻辑之前完成）
      AsyncStorage.getItem('@email_verified_local').then((val) => {
        if (val === 'true') setEmailVerifiedLocal(true);
      });
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
        // ✅ 刷新用户权限（确保菜单显隐实时更新）
        refreshUserInfo();

        // 📧 邮箱验证提示：未验证用户每次启动弹一次
        // 先检查本地flag，再决定是否弹窗
        AsyncStorage.getItem('@email_verified_local').then((verifiedLocal) => {
          if ((user as any)?.isEmailVerify || verifiedLocal === 'true') return;
          AsyncStorage.getItem('@email_verify_prompt_dismissed').then((dismissed) => {
            if (!dismissed) {
              Alert.alert(
                t('profile.email_verify.prompt_title', '验证学校邮箱'),
                t('profile.email_verify.prompt_message', '验证.edu学校邮箱即可免费获取蓝卡会员，享受专属权益！'),
                [
                  {
                    text: t('profile.email_verify.prompt_later', '稍后再说'),
                    style: 'cancel',
                    onPress: () => AsyncStorage.setItem('@email_verify_prompt_dismissed', 'true'),
                  },
                  {
                    text: t('profile.email_verify.prompt_go', '去验证'),
                    onPress: () => navigation.navigate('EmailVerification'),
                  },
                ]
              );
            }
          });
        });
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
      // 清除邮箱验证提示标记，下次登录后重新提示
      await AsyncStorage.removeItem('@email_verify_prompt_dismissed');
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
      icon: <NotificationIcon />,
      badgeCount: 0, // 暂无通知API，显示真实的0状态
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'address',
      title: t('profile.menuItems.address', '收货地址'),
      icon: <ShippingIcon />,
      onPress: () => navigation.navigate('AddressList'),
    },
    // Certificate Application - 仅 staff 及以上权限可见
    ...(permissions.isAdmin() || permissions.isPartManager() || permissions.isStaff() ? [{
      id: 'certificate',
      title: t('profile.menuItems.certificate'),
      icon: <Ionicons name="document-text-outline" size={24} color="#FF7763" />,
      onPress: () => navigation.navigate('CertificateList'),
      testID: 'certificate-application-btn',
    }] : []),
    {
      id: 'general',
      title: t('profile.menuItems.general'),
      icon: <GeneralIcon />,
      onPress: () => navigation.navigate('General'),
    },
    {
      id: 'about-support',
      title: t('profile.menuItems.aboutSupport'),
      icon: <AboutSupportIcon />,
      onPress: () => navigation.navigate('AboutSupport'),
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#FAF3F1',
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

    // 邮箱验证横幅
    verifyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(164, 207, 223, 0.2)' : 'rgba(164, 207, 223, 0.3)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
      }),
    },
    verifyBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    verifyBannerText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
      flex: 1,
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
      fontSize: 15,
      fontWeight: '600',
      color: '#949494',
      marginBottom: 14,
      marginLeft: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      lineHeight: 20,
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
      marginTop: 6,
      marginBottom: 20, // 减少下边距，让退出按钮更靠近
    },
    settingsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginBottom: 0,
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
              onCardPress={() => {
                if (((user as any)?.isEmailVerify || emailVerifiedLocal)) {
                  navigation.navigate('MembershipPurchase');
                } else {
                  navigation.navigate('EmailVerification');
                }
              }}
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

          {/* 📧 邮箱验证横幅已整合到ProfileInfoCard内部，此处不再重复显示 */}

          {/* 志愿者管理卡片 - 仅staff及以上显示 */}
          {isAuthenticated && permissions.hasVolunteerManagementAccess() && (
            <VolunteerManagementCard
              onPress={handleVolunteerSectionPress}
              onRegisteredPress={() => {
                setActivityModalType('not_checked_in');
                setShowActivityModal(true);
              }}
              onAttendedPress={() => {
                setActivityModalType('checked_in');
                setShowActivityModal(true);
              }}
              hours={volunteerStats.volunteerHours}
              registered={activityStats.notParticipated}
              attended={activityStats.participated}
            />
          )}

          {/* 会员卡区域已合并到 ProfileInfoCard 中 */}

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
            {(settingItems || []).map((item) => (
              <SettingRow
                key={item.id}
                title={item.title}
                icon={item.icon}
                onPress={item.onPress}
                badgeCount={item.badgeCount}
                testID={(item as any).testID}
              />
            ))}
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