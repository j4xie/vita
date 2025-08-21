import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { PersonalInfoCard } from '../../components/profile/PersonalInfoCard';
import { UserIdentityQRModal } from '../../components/modals/UserIdentityQRModal';
import { UserIdentityData } from '../../types/userIdentity';
import { useUser } from '../../context/UserContext';
import { getUserDisplayName, getUserAvatar } from '../../utils/userAdapter';

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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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
          {title}
        </Text>
      </View>
      <View style={rowStyles.settingRowRight}>
        {badgeCount && badgeCount > 0 && (
          <View style={rowStyles.badge}>
            <Text style={rowStyles.badgeText}>
              {badgeCount > 9 ? '9+' : badgeCount}
            </Text>
          </View>
        )}
        {value && (
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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useUser();
  
  // 身份二维码状态
  const [showIdentityQR, setShowIdentityQR] = useState(false);
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);
  
  // 精简统计数据 - 仅保留2项降低认知负荷
  const userStats = {
    volunteerHours: 24, // 保留：学生刚需
    points: 1680,       // 保留：积分进度
  };
  
  // VIP状态 - 无权益暂时隐藏
  const hasVipBenefits = false; // 有权益才显示
  const membershipStatus = hasVipBenefits ? 'vip' : 'free';

  // 生成用户身份数据
  const generateUserIdentityData = (): UserIdentityData => {
    return {
      userId: 'user_123', // TODO: 从实际用户数据获取
      userName: 'test007',
      legalName: '测试用户0017',
      nickName: 'testtest0017',
      email: 'user@example.com',
      avatarUrl: undefined, // TODO: 从用户数据获取
      studentId: '20240001',
      deptId: 'dept_001',
      currentOrganization: {
        id: 'org_columbia_cu',
        name: 'Columbia CU',
        displayNameZh: '哥大中国学生学者联谊会',
        displayNameEn: 'Columbia Chinese Union',
      },
      memberOrganizations: [
        {
          id: 'org_columbia_cu',
          role: 'member',
          isPrimary: true,
          joinedAt: '2024-01-15T10:00:00Z',
          status: 'active',
        },
      ],
      type: 'user_identity',
    };
  };

  const handleShowIdentityQR = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowIdentityQR(true);
  };

  // Logout handling functions
  const handleLogout = () => {
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
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const settingItems = [
    {
      id: 'account-security',
      title: t('profile.menuItems.accountSecurity'),
      icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => navigation.navigate('AccountSecurity'),
    },
    {
      id: 'notifications',
      title: t('profile.menuItems.notifications'),
      icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap,
      badgeCount: 3,
      onPress: () => navigation.navigate('Notifications'),
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
      paddingBottom: 56 + 12 + insets.bottom, // Tab bar height + margin + safe area
    },
    userSection: {
      marginBottom: 16, // 减少间距，更符合小红书的紧凑设计
    },
    listContainer: {
      backgroundColor: '#FFFFFF', // 小红书风格的纯白背景
      borderRadius: 12, // 小红书使用的圆角大小
      marginVertical: 8, // 上下间距
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
      marginVertical: 8,
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
      marginVertical: 8,
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
    benefitsList: {
      marginBottom: 16,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      minHeight: 22, // 行高20-22pt
    },
    benefitText: {
      fontSize: 14,
      color: '#6B7280',
      marginLeft: 8,
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
      backgroundColor: '#FF6B35', // 西柚橙色
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
    
    // 设置区域 - 折叠样式
    settingsSection: {
      marginVertical: 8,
      marginBottom: 100, // 为TabBar预留空间
    },
    settingsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginBottom: 8,
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
    
    // Logout section styles
    logoutSection: {
      marginTop: 24,
      marginBottom: 20,
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
      fontSize: 16,
      fontWeight: '600',
      color: '#DC2626',
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
          onScroll={() => {}} // Explicit empty handler to prevent propagation issues
          scrollEventThrottle={16}
        >
          {/* 用户信息卡片 */}
          <View style={styles.userSection}>
            {/* V2.0 双层结构：外层solid背景用于阴影，内层L2品牌玻璃 */}
            <View style={styles.personalInfoShadowContainer}>
              <PersonalInfoCard
                name={user ? getUserDisplayName(user) : t('userInfo.guest')}
                email={user?.email || t('userInfo.not_logged_in')}
                avatarUrl={user ? getUserAvatar(user) : undefined}
                onPress={() => {
                  if (isAuthenticated) {
                    navigation.navigate('EditProfile');
                  } else {
                    navigation.navigate('Login');
                  }
                }}
                membershipStatus={membershipStatus}
                onQRCodePress={handleShowIdentityQR}
                stats={user ? {
                  volunteerHours: 0, // 可以后续从志愿者API获取
                  points: user.roles.length * 100, // 基于角色计算积分
                } : undefined}
              />
            </View>
          </View>

          {/* 我的活动区 - 精简为2个Tab */}
          <View style={styles.activitySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('profile.my_activities')}</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>{t('profile.view_all')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContainer}>
              <TouchableOpacity style={styles.activityItem}>
                <View style={styles.activityIconL2}>
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel}>{t('profile.not_participated')}</Text>
                  <Text style={styles.activityCount}>3</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.activitySeparator} />
              
              <TouchableOpacity style={styles.activityItem}>
                <View style={styles.activityIconL2}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#6B7280" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel}>{t('profile.participated')}</Text>
                  <Text style={styles.activityCount}>8</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.activitySeparator} />
              
              <TouchableOpacity style={styles.activityItem}>
                <View style={styles.activityIconL2}>
                  <Ionicons name="heart-outline" size={18} color="#6B7280" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel}>{t('profile.bookmarked')}</Text>
                  <Text style={styles.activityCount}>5</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.activitySeparator} />
              
              <TouchableOpacity style={styles.activityItem}>
                <View style={styles.activityIconL2}>
                  <Ionicons name="star-outline" size={18} color="#6B7280" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel}>{t('profile.pending_review')}</Text>
                  <Text style={styles.activityCount}>2</Text>
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
              
              {/* 权益列表 - 统一图标列表 */}
              <View style={styles.benefitsList}>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#6B7280" />
                  <Text style={styles.benefitText}>{t('profile.exclusive_support')}</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#6B7280" />
                  <Text style={styles.benefitText}>{t('profile.birthday_privileges')}</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#6B7280" />
                  <Text style={styles.benefitText}>{t('profile.exclusive_activities')}</Text>
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
                    <Text style={styles.cardCountText}>3</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.orgSwitchButton}
                  onPress={() => {
                    // 临时在这里添加组织切换功能
                    console.log('Organization switch button pressed');
                  }}
                >
                  <Ionicons name="swap-horizontal-outline" size={16} color="#6B7280" />
                  <Text style={styles.orgSwitchText}>切换组织</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.upgradeButtonDawn}>
                  <Text style={styles.upgradeTextDawn}>{t('profile.upgrade_membership')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 我的评价/笔记区 - 大众点评+小红书风格 */}
          <View style={styles.reviewSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('profile.my_reviews')}</Text>
              <TouchableOpacity style={styles.writeReviewButtonL2}>
                <Ionicons name="create-outline" size={16} color="#FFF" />
                <Text style={styles.writeReviewTextL2}>{t('profile.write_review')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* 评价卡片列表 - L1容器结构化 */}
            <View style={styles.reviewList}>
              <View style={styles.reviewCardL1}>
                <View style={styles.reviewThumbnail}>
                  <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                </View>
                <View style={styles.reviewContent}>
                  <Text style={styles.reviewTitleL1} numberOfLines={2}>
                    CU春季迎新派对超棒！
                  </Text>
                  <View style={styles.reviewMeta}>
                    <View style={styles.reviewMetaItem}>
                      <Ionicons name="heart-outline" size={14} color="#6B7280" />
                      <Text style={styles.reviewMetaText}>24</Text>
                    </View>
                    <View style={styles.reviewMetaItem}>
                      <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
                      <Text style={styles.reviewMetaText}>5</Text>
                    </View>
                    <Text style={styles.reviewDate}>2天前</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.reviewCardL1}>
                <View style={styles.reviewThumbnail}>
                  <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                </View>
                <View style={styles.reviewContent}>
                  <Text style={styles.reviewTitleL1} numberOfLines={2}>
                    学术交流会收获很多
                  </Text>
                  <View style={styles.reviewMeta}>
                    <View style={styles.reviewMetaItem}>
                      <Ionicons name="heart-outline" size={14} color="#6B7280" />
                      <Text style={styles.reviewMetaText}>18</Text>
                    </View>
                    <View style={styles.reviewMetaItem}>
                      <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
                      <Text style={styles.reviewMetaText}>3</Text>
                    </View>
                    <Text style={styles.reviewDate}>1周前</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 设置列表 - 收纳到底部 */}
          <View style={styles.settingsSection}>
            <TouchableOpacity style={styles.settingsHeader}>
              <Text style={styles.sectionTitle}>{t('profile.settings_and_help', '设置与帮助')}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
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

          {/* Logout Button - Separated at bottom */}
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
        </ScrollView>
      </SafeAreaView>

      {/* 用户身份二维码模态框 */}
      <UserIdentityQRModal
        visible={showIdentityQR}
        onClose={() => setShowIdentityQR(false)}
        userData={generateUserIdentityData()}
      />
    </View>
  );
};

export default ProfileHomeScreen;