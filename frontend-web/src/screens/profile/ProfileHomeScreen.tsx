import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView, // 改回原生SafeAreaView
  ScrollView,
  Platform,
  Alert,
  ActionSheetIOS,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/web/WebLinearGradient';
// import { WebSafeAreaView } from '../../components/web/WebSafeAreaView'; // 改回原生SafeAreaView
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { PersonalInfoCard } from '../../components/profile/PersonalInfoCard';
import { UserIdentityQRModal } from '../../components/modals/UserIdentityQRModal';
import { UserActivityModal } from '../../components/modals/UserActivityModal';
import { LoginRequiredModal } from '../../components/modals/LoginRequiredModal';
import { UserIdentityData } from '../../types/userIdentity';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
// import { getUserDisplayName, getUserAvatar } from '../../utils/userAdapter'; // 暂时注释，直接使用用户数据
import { mapUserToIdentityData } from '../../utils/userIdentityMapper';
import { activityStatsService, UserActivityStats } from '../../services/activityStatsService';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { getCurrentToken } from '../../services/authAPI';
import { getVolunteerHours, VolunteerHours, getPersonalVolunteerHours } from '../../services/volunteerAPI';
import VolunteerHistoryBottomSheet from '../../components/volunteer/VolunteerHistoryBottomSheet';

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
      paddingVertical: 14, // 使用垂直内边距替代固定高度
      borderBottomWidth: isLast ? 0 : 0.5,
      borderBottomColor: 'rgba(0, 0, 0, 0.06)', // 更淡的分割线，小红书风格
    },
    settingRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    // 小红书风格图标背景
    iconBackground: {
      width: 32,
      height: 32,
      borderRadius: 8, // 小红书使用的是圆角矩形，不是圆形
      backgroundColor: 'rgba(107, 114, 128, 0.1)', // 中性灰色背景 // 很淡的品牌色背景
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingText: {
      fontSize: 17,
      fontWeight: '400',
      color: isDarkMode ? '#ffffff' : '#000000',
      flex: 1,
    },
    settingRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingValue: {
      fontSize: 15,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
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
            size={20} // 稍微减小图标尺寸
            color="#F9A889" // 使用品牌橙色
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
  
  // 个人志愿者历史记录弹窗状态
  const [showPersonalHistoryModal, setShowPersonalHistoryModal] = useState(false);
  
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
  
  // 用户活动模态框状态
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityModalType, setActivityModalType] = useState<'not_checked_in' | 'checked_in'>('not_checked_in');
  
  // 登录提示模态框状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  
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

    // 使用真实的用户数据
    return mapUserToIdentityData(user);
  };

  // 获取用户组织信息 - 🆕 支持最新API的role和post字段
  const getUserOrganizationInfo = () => {
    if (!user || !isAuthenticated) return { school: '', organization: '', position: '' };
    
    // 🆕 学校信息 - 支持完整的dept结构
    const school = user.school?.name || user.dept?.deptName || '';
    const department = user.dept?.childrenDept?.deptName; // 🆕 子部门信息
    
    // 🆕 组织信息 - 基于学校信息设置
    let organization = '';
    if (school) {
      if (school.includes('CU总部') || school === 'CU总部') {
        organization = 'CU总部';
      } else {
        organization = '学联组织';
      }
    }
    
    // 🆕 完整的岗位信息显示 - 结合role和post
    let position = '';
    
    // 优先显示具体岗位(post)
    if (user.post?.postName) {
      position = user.post.postName;
    } else if (user.role?.roleName) {
      // 如果没有具体岗位，显示角色名称
      position = user.role.roleName;
    } else if (user.roles && user.roles.length > 0) {
      // 兼容旧格式：从roles数组获取
      position = user.roles[0].roleName;
    }
    
    // 🆕 如果有部门信息，添加到位置描述中
    if (department && position) {
      position = `${department} · ${position}`;
    }
    
    console.log('👤 [PROFILE] 用户组织信息:', {
      school,
      department, 
      organization,
      position,
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

  // 🚀 处理未签到活动点击 - 增强状态核对
  const handleNotCheckedInPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    console.log('📋 [Profile] 用户点击未签到活动统计，触发状态核对');
    
    // 🔍 打开前先核对状态数据准确性
    loadActivityStats(true).then(() => {
      setActivityModalType('not_checked_in');
      setShowActivityModal(true);
    });
  };

  // 🚀 处理已签到活动点击 - 增强状态核对
  const handleCheckedInPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    console.log('📋 [Profile] 用户点击已签到活动统计，触发状态核对');
    
    // 🔍 打开前先核对状态数据准确性
    loadActivityStats(true).then(() => {
      setActivityModalType('checked_in');
      setShowActivityModal(true);
    });
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


  // 🚀 加载活动统计数据 - 增强状态核对机制
  const loadActivityStats = async (forceRefresh: boolean = false) => {
    if (!isAuthenticated || !user?.id) {
      // 静默处理未登录状态，避免不必要的控制台警告
      return;
    }
    
    try {
      setIsLoadingStats(true);
      console.log('📊 [Profile] 正在加载活动统计，用户信息:', {
        userId: user.id,
        userName: user.userName,
        isAuthenticated,
        forceRefresh
      });

      // 🚀 获取活动统计数据
      const stats = await activityStatsService.getUserActivityStats(user.id);
      
      // 🔍 状态核对：验证统计数据的准确性
      if (stats && (stats.notCheckedInCount > 0 || stats.checkedInCount > 0) && forceRefresh) {
        console.log('🔍 [Profile] 开始验证活动统计数据准确性:', {
          notCheckedInCount: stats.notCheckedInCount,
          checkedInCount: stats.checkedInCount
        });

        try {
          // 通过活动列表API再次验证状态计数
          const activityListResponse = await pomeloXAPI.getActivityList({
            pageNum: 1,
            pageSize: 100, // 获取更多数据确保准确性
            userId: parseInt(user.id)
          });

          if (activityListResponse.code === 200 && activityListResponse.data?.rows) {
            const activities = activityListResponse.data.rows;
            const actualRegisteredCount = activities.filter(a => a.signStatus === -1).length;
            const actualCheckedInCount = activities.filter(a => a.signStatus === 1).length;

            console.log('✅ [Profile] 活动状态验证完成:', {
              统计服务数据: {
                未签到: stats.notCheckedInCount,
                已签到: stats.checkedInCount
              },
              活动列表验证: {
                已报名: actualRegisteredCount,
                已签到: actualCheckedInCount
              },
              数据一致性: {
                未签到一致: stats.notCheckedInCount === actualRegisteredCount,
                已签到一致: stats.checkedInCount === actualCheckedInCount
              }
            });

            // 如果检测到不一致，使用活动列表的真实数据
            if (stats.notCheckedInCount !== actualRegisteredCount || stats.checkedInCount !== actualCheckedInCount) {
              console.log('🔄 [Profile] 检测到统计数据不一致，使用活动列表的真实数据');
              const correctedStats = {
                ...stats,
                notCheckedInCount: actualRegisteredCount,
                checkedInCount: actualCheckedInCount
              };
              setActivityStats(correctedStats);
              console.log('✨ [Profile] 应用修正后的统计数据');
              return;
            }
          }
        } catch (verificationError) {
          console.warn('⚠️ [Profile] 状态验证失败，使用原始统计数据:', verificationError);
        }
      }
      
      setActivityStats(stats);
      console.log('📊 ✅ [Profile] 活动统计加载成功');
    } catch (error) {
      console.error('📊 ❌ [Profile] 加载活动统计失败:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // 加载志愿者统计数据
  const loadVolunteerStats = async () => {
    // 获取用户ID，支持不同的字段名，并转换为数字
    const userIdString = user?.userId || user?.id;
    const userIdToUse = userIdString ? parseInt(userIdString, 10) : undefined;
    
    if (!isAuthenticated || !userIdToUse || isNaN(userIdToUse)) {
      // 未登录或无有效用户ID，静默处理
      return;
    }
    
    // 🆕 权限检查：只有staff及以上权限才能访问志愿者功能
    if (!permissions.hasVolunteerManagementAccess()) {
      if (__DEV__) {
        console.log('ℹ️ [VOLUNTEER-STATS] 当前用户无志愿者权限，跳过志愿者数据加载');
      }
      // 普通用户不显示志愿者统计，设置为默认值
      setVolunteerStats({
        volunteerHours: 0,
        points: 0,
      });
      return;
    }
    
    try {
      setIsLoadingVolunteerStats(true);
      console.log('🔍 正在加载志愿者统计，用户信息:', {
        userId: userIdToUse,
        userName: user?.userName || 'unknown',
        isAuthenticated
      });
      
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

  // 页面加载时获取统计数据 - 只在已登录且有用户ID时调用
  useEffect(() => {
    const userIdString = user?.userId || user?.id;
    const userIdToUse = userIdString ? parseInt(userIdString, 10) : undefined;
    if (isAuthenticated && userIdToUse && !isNaN(userIdToUse)) {
      loadActivityStats();
      loadVolunteerStats();
    }
  }, [isAuthenticated, user?.userId, user?.id]);

  // 🚀 页面聚焦时刷新统计数据（用户从活动页面返回时）- 强制核对状态
  useFocusEffect(
    useCallback(() => {
      const userIdString = user?.userId || user?.id;
      const userIdToUse = userIdString ? parseInt(userIdString, 10) : undefined;
      if (isAuthenticated && userIdToUse && !isNaN(userIdToUse)) {
        console.log('📱 [Profile] 页面聚焦，开始强制状态核对');
        loadActivityStats(true); // 🔍 点击个人时强制核对状态
        loadVolunteerStats();
      }
    }, [isAuthenticated, user?.userId, user?.id])
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
        console.log('🔄 [ProfileHome] 活动状态变化，开始强制刷新统计数据');
        loadActivityStats(true); // 🔍 状态变化时强制核对
      } else {
        console.log('⚠️ [ProfileHome] 用户未认证，跳过统计数据刷新');
      }
    });

    // 🚀 监听签到成功事件
    const signInListener = DeviceEventEmitter.addListener('activitySignedIn', (data: { activityId: string, userId?: string }) => {
      console.log('📊 [ProfileHome] 收到活动签到成功事件，强制刷新统计数据:', {
        activityId: data?.activityId,
        userId: data?.userId,
        currentUserId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (isAuthenticated && (data?.userId === user?.id)) {
        console.log('🔄 [ProfileHome] 开始强制刷新活动统计数据（签到事件）');
        loadActivityStats(true); // 🔍 签到后强制核对统计数据
      }
    });

    // 🚀 监听活动状态变化事件
    const statusChangeListener = DeviceEventEmitter.addListener('activityStatusChanged', (data: { activityId: string, newStatus: string, userId?: string }) => {
      console.log('📊 [ProfileHome] 收到活动状态变化事件，强制刷新统计数据:', data);
      
      if (isAuthenticated && (data?.userId === user?.id)) {
        console.log('🔄 [ProfileHome] 开始强制刷新活动统计数据（状态变化）');
        loadActivityStats(true); // 🔍 状态变化后强制核对统计数据
      }
    });

    return () => {
      registrationListener?.remove();
      signInListener?.remove();
      statusChangeListener?.remove();
    };
  }, [isAuthenticated]);

  // 处理志愿者小时点击 - 弹出个人历史记录查询
  const handleVolunteerHoursPress = useCallback(() => {
    console.log('🔍 [VOLUNTEER-HOURS] 用户点击志愿者小时:', {
      用户: user?.userName,
      权限级别: permissions.getPermissionLevel(),
      志愿者小时: volunteerStats?.volunteerHours
    });
    
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    // 直接弹出个人历史记录弹窗，不进行页面跳转
    setShowPersonalHistoryModal(true);
  }, [user, permissions, volunteerStats]);

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
    navigation.navigate('Wellbeing', { 
      screen: 'VolunteerManagement'
    });
  }, [user, permissions, volunteerStats, navigation]);

  // Logout handling functions
  const handleLogout = () => {
    console.log('🔴 [ProfileHome] handleLogout被点击');
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('profile.account.logoutConfirm'),
          message: t('profile.account.logoutMessage'),
          options: [t('profile.account.cancel'), t('profile.account.logout')],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            performLogout();
          }
        }
      );
    } else if (Platform.OS === 'web') {
      // Web环境使用原生confirm对话框，因为Alert.alert在Web上可能不显示
      const confirmed = window.confirm(
        `${t('profile.account.logoutConfirm', '确认退出')}\n\n${t('profile.account.logoutMessage', '您确定要退出登录吗？')}`
      );
      console.log('🌐 [ProfileHome] Web confirm result:', confirmed);
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert(
        t('profile.account.logoutConfirm'),
        t('profile.account.logoutMessage'),
        [
          { text: t('profile.account.cancel'), style: 'cancel' },
          { text: t('profile.account.logout'), style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const performLogout = async () => {
    try {
      console.log('🔓 [ProfileHome] Starting logout process...');
      
      // 使用 UserContext 的 logout 方法来正确清理所有状态
      await logout();
      
      console.log('✅ [ProfileHome] Logout completed, resetting navigation...');
      
      // 在Web环境下，使用navigate而不是reset可能更可靠
      if (Platform.OS === 'web') {
        // Web环境下直接导航到登录页面
        navigation.navigate('Auth', { screen: 'Login' });
      } else {
        // 在状态清理后，重置导航到认证页面
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    } catch (error) {
      console.error('❌ [ProfileHome] Logout error:', error);
      // 如果出错，至少尝试导航到登录页面
      try {
        navigation.navigate('Auth', { screen: 'Login' });
      } catch (navError) {
        console.error('❌ [ProfileHome] Navigation error:', navError);
      }
    }
  };

  const settingItems = [
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
      backgroundColor: 'transparent', // 使用渐变背景
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
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 150, // 增加底部空白区域，让用户可以下滑查看Login按钮
    },
    userSection: {
      marginBottom: 16, // 减少间距，更符合小红书的紧凑设计
    },
    listContainer: {
      backgroundColor: '#FFFFFF', // 小红书风格的纯白背景
      borderRadius: 12, // 小红书使用的圆角大小
      marginTop: 0, // 🔧 设为0，让settingsHeader的marginBottom:2生效
      marginBottom: 8, // 保持下边距
      overflow: 'hidden',
      // 小红书风格的微妙阴影
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
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
      fontSize: 18,
      fontWeight: '600',
      color: '#000',
      marginBottom: 12,
      marginLeft: 4,
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
      fontSize: 14,
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
      fontSize: 13, // 13-14pt Secondary灰
      color: '#9CA3AF',
      marginBottom: 2,
    },
    activityCount: {
      fontSize: 20, // 20-22pt Semibold
      fontWeight: '600',
      color: '#111827', // #111级深色
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
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
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
      fontSize: 14,
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
      fontSize: 13,
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
      fontSize: 13,
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
      fontSize: 14,
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
      marginBottom: 100, // 为TabBar预留空间
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
      fontSize: 14,
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
      fontSize: 15, // 15-17pt Semibold
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
      lineHeight: 20, // 1-2行截断
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
      fontSize: 12, // 12-13pt Secondary灰
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
      fontSize: 16,
      fontWeight: '500',
      color: '#6B7280',
      marginTop: 12,
      marginBottom: 4,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: '#9CA3AF',
      textAlign: 'center',
    },
    
    // Logout section styles
    logoutSection: {
      marginTop: -30, // 适度减少上边距，平衡位置
      marginBottom: 40, // 增加下边距，为滑动留出更多空间
      paddingHorizontal: 4,
      // Web环境下确保section可接收点击事件
      pointerEvents: 'auto',
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
      // Web环境下确保按钮可点击
      pointerEvents: 'auto',
      zIndex: 999,
      position: 'relative',
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#DC2626',
    },
    
    // 志愿者功能区域样式
    volunteerSection: {
      marginVertical: 8,
    },
    volunteerCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      // 小红书风格阴影
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    volunteerIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(249, 168, 137, 0.1)', // 品牌橙色背景
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    volunteerContent: {
      flex: 1,
    },
    volunteerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#000000',
      marginBottom: 2,
    },
    volunteerSubtitle: {
      fontSize: 14,
      color: '#6B7280',
    },
    volunteerHours: {
      fontSize: 13,
      fontWeight: '500',
      color: '#F9A889', // 品牌橙色
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      {/* V2.0 背景层Horizon带 - 不贴容器边 */}
      <View style={styles.backgroundLayer}>
        <LinearGradient
          colors={[
            '#F8F9FA', // 顶部中性灰
            '#F5F6F7', // 轻微变化 
            '#FFFEF7', // 极淡奶色 (微弱温暖，蓝段≤10-12%)
            '#F8F9FA'  // 回到中性
          ]}
          style={styles.horizonBand}
          locations={[0, 0.4, 0.6, 1]} // 微弱温暖感
        />
        {/* 白雾叠加层 */}
        <View style={styles.mistOverlay} />
      </View>
      
      {/* 统一的应用背景渐变 */}
      <LinearGradient 
        colors={[
          '#F5F6F7', // 稍灰的顶部
          '#F1F2F3', // 中等灰度
          '#EDEEF0', // 更明显的底部灰色
        ]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* 用户信息卡片 */}
          <View style={styles.userSection}>
            {/* V2.0 双层结构：外层solid背景用于阴影，内层L2品牌玻璃 */}
            <View style={styles.personalInfoShadowContainer}>
              <PersonalInfoCard
                name={user ? (user.userName || user.nickName || '用户') : t('userInfo.guest')}
                {...getUserOrganizationInfo()}
                email={user?.email}
                avatarUrl={undefined}
                onPress={!isAuthenticated ? () => {
                  // 未登录用户点击个人信息卡片时跳转到登录页面
                  navigation.navigate('Login');
                } : () => {
                  // 已登录用户点击个人信息卡片时不执行任何操作（禁用跳转）
                }}
                membershipStatus={membershipStatus}
                onQRCodePress={user && isAuthenticated ? handleShowIdentityQR : undefined}
                stats={user && permissions.hasVolunteerManagementAccess() ? volunteerStats : undefined}
                onVolunteerHoursPress={user && isAuthenticated && permissions.hasVolunteerManagementAccess() ? handleVolunteerHoursPress : undefined}
                isGuest={!isAuthenticated}
              />
            </View>
          </View>

          {/* 志愿者功能区域 - 仅对有权限的用户显示 */}
          {isAuthenticated && permissions.hasVolunteerManagementAccess() && (
            <View style={styles.volunteerSection}>
              <TouchableOpacity 
                style={styles.volunteerCard}
                onPress={handleVolunteerSectionPress}
                activeOpacity={0.7}
              >
                <View style={styles.volunteerIconContainer}>
                  <Ionicons 
                    name="people-outline" 
                    size={20} 
                    color="#F9A889" 
                  />
                </View>
                <View style={styles.volunteerContent}>
                  <Text style={styles.volunteerTitle}>
                    {t('profile.volunteer.management', '志愿者管理')}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color="#c7c7cc" 
                />
              </TouchableOpacity>
            </View>
          )}

          {/* 我的活动区 - 统一显示活动统计布局 */}
          <View style={styles.activitySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('profile.my_activities')}</Text>
            </View>
            <View style={styles.activityContainer}>
              <TouchableOpacity 
                style={styles.activityItem} 
                onPress={isAuthenticated && user?.id ? handleNotCheckedInPress : handleUnauthenticatedPress}
              >
                <View style={styles.activityIconL2}>
                  <Ionicons name="time-outline" size={18} color="#6B7280" />
                </View>
                <View style={styles.activityInfo}>
                  <Text 
                    style={styles.activityLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {t('profile.not_participated')}
                  </Text>
                  <Text style={styles.activityCount}>
                    {isAuthenticated && user?.id ? activityStats.notParticipated : '--'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.activitySeparator} />
              
              <TouchableOpacity 
                style={styles.activityItem} 
                onPress={isAuthenticated && user?.id ? handleCheckedInPress : handleUnauthenticatedPress}
              >
                <View style={styles.activityIconL2}>
                  <Ionicons name="checkmark-circle" size={18} color="#6B7280" />
                </View>
                <View style={styles.activityInfo}>
                  <Text 
                    style={styles.activityLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {t('profile.participated')}
                  </Text>
                  <Text style={styles.activityCount}>
                    {isAuthenticated && user?.id ? activityStats.participated : '--'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.activitySeparator} />
              
              <TouchableOpacity 
                style={styles.activityItem}
                onPress={isAuthenticated && user?.id ? () => {} : handleUnauthenticatedPress}
              >
                <View style={styles.activityIconL2}>
                  <Ionicons name="heart-outline" size={18} color="#6B7280" />
                </View>
                <View style={styles.activityInfo}>
                  <Text 
                    style={styles.activityLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {t('profile.bookmarked')}
                  </Text>
                  <Text style={styles.activityCount}>
                    {isAuthenticated && user?.id ? activityStats.bookmarked : '--'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.activitySeparator} />
              
              <TouchableOpacity 
                style={styles.activityItem}
                onPress={isAuthenticated && user?.id ? () => {} : handleUnauthenticatedPress}
              >
                <View style={styles.activityIconL2}>
                  <Ionicons name="star-outline" size={18} color="#6B7280" />
                </View>
                <View style={styles.activityInfo}>
                  <Text 
                    style={styles.activityLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {t('profile.pending_review')}
                  </Text>
                  <Text style={styles.activityCount}>
                    {isAuthenticated && user?.id ? activityStats.pendingReview : '--'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 会员卡区域 - 替换核销服务 */}
          <View style={styles.membershipSection}>
            <Text style={styles.sectionTitle}>{t('profile.my_membership')}</Text>
            <View style={styles.membershipCardL1}>
              <View style={styles.membershipHeader}>
                <Text style={styles.membershipTitle}>{t('profile.membership_title')}</Text>
                <View style={styles.membershipBadge}>
                  <Text style={styles.membershipBadgeText}>{t('profile.membership_regular')}</Text>
                </View>
              </View>
              
              {/* 会员卡入口和升级按钮 */}
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

                {/* 组织切换按钮已移除 */}

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
          </View>

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
                onPressIn={() => console.log('🔴 [ProfileHome] Logout button pressed in')}
                onPressOut={() => console.log('🔴 [ProfileHome] Logout button pressed out')}
                {...(Platform.OS === 'web' && {
                  onClick: () => {
                    console.log('🌐 [ProfileHome] Web onClick triggered for logout');
                    handleLogout();
                  }
                })}
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

      {/* 个人志愿者历史记录弹窗 */}
      {showPersonalHistoryModal && user?.userId && (
        <VolunteerHistoryBottomSheet
          visible={showPersonalHistoryModal}
          onClose={() => setShowPersonalHistoryModal(false)}
          userId={parseInt(user.userId)}
          userName="我"
          userPermission="staff"
          currentUser={user}
          isPersonalView={true}
        />
      )}
    </View>
  );
};

export default ProfileHomeScreen;