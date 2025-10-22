import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActionSheetIOS,
  Platform,
  useColorScheme,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { useLanguage } from '../../context/LanguageContext';
import { useUser } from '../../context/UserContext';
import { useTheme as useThemeContext } from '../../context/ThemeContext';
import { PermissionDebugModal } from '../../components/debug/PermissionDebugModal';
import UserRegionPreferences, { UserRegionCode } from '../../services/UserRegionPreferences';
import { RegionSwitchModal } from '../../components/modals/RegionSwitchModal';
import { DeleteAccountModal } from '../../components/modals/DeleteAccountModal';
import { orderAPI } from '../../services/orderAPI';
import { addressAPI } from '../../services/addressAPI';
// import { DarkModeTest } from '../../components/debug/DarkModeTest'; // 已注释以修复渲染错误

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { currentLanguage, getLanguageDisplayName } = useLanguage();
  const { logout } = useUser();
  const insets = useSafeAreaInsets();
  const themeContext = useThemeContext();
  const isDarkMode = themeContext.isDarkMode;
  
  // Accessibility states
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  
  // Debug modal state
  const [showPermissionDebug, setShowPermissionDebug] = useState(false);
  const [debugTapCount, setDebugTapCount] = useState(0);
  
  // Region states
  const [currentRegion, setCurrentRegion] = useState<UserRegionCode>('china');
  const [regionLoading, setRegionLoading] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  // Delete account state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Orders & Addresses states
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  useEffect(() => {
    const checkAccessibility = async () => {
      const [reduceMotion, screenReader] = await Promise.all([
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isScreenReaderEnabled(),
      ]);
      setIsReduceMotionEnabled(reduceMotion);
      setIsScreenReaderEnabled(screenReader);
    };
    checkAccessibility();
  }, []);

  // 加载用户区域设置
  useEffect(() => {
    loadCurrentRegion();
  }, []);

  const loadCurrentRegion = async () => {
    try {
      const region = await UserRegionPreferences.getCurrentRegion();
      setCurrentRegion(region);
    } catch (error) {
      console.error('加载用户区域设置失败:', error);
      // 使用默认值，不显示错误给用户
    }
  };

  // 获取待处理订单数量
  const fetchOrderCount = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const count = await orderAPI.getPendingOrderCount();
      setOrderCount(count);
    } catch (error) {
      console.error('获取订单数量失败:', error);
      setOrderCount(0);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // 获取地址数量
  const fetchAddressCount = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      const addresses = await addressAPI.getAddressList();
      setAddressCount(addresses.length);
    } catch (error) {
      console.error('获取地址数量失败:', error);
      setAddressCount(0);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  // 加载订单和地址数据
  useEffect(() => {
    fetchOrderCount();
    fetchAddressCount();
  }, [fetchOrderCount, fetchAddressCount]);

  const handleLogout = () => {
    // Haptic feedback
    if (Platform.OS === 'ios' && !isReduceMotionEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('alerts.logout_confirm'),
          message: t('alerts.logout_message'),
          options: [t('common.cancel'), t('profile.logout')],
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
        t('alerts.logout_confirm'),
        t('alerts.logout_message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.logout'), style: 'destructive', onPress: performLogout },
        ]
      );
    }
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

  // Haptic feedback helper
  const triggerHaptic = () => {
    if (Platform.OS === 'ios' && !isReduceMotionEnabled) {
      Haptics.selectionAsync();
    }
  };
  
  // Handle edit profile
  const handleEditProfile = () => {
    triggerHaptic();
    Alert.alert(
      t('common.feature_developing'), 
      '个人资料编辑功能正在开发中，请等待后续版本更新。',
      [{ text: t('common.got_it') }]
    );
  };
  
  // Handle language selection
  const handleLanguagePress = () => {
    triggerHaptic();
    Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
  };

  // Handle region selection
  const handleRegionPress = () => {
    triggerHaptic();
    setShowRegionModal(true);
  };

  // Handle region change
  const handleRegionChange = async (newRegion: UserRegionCode) => {
    try {
      setRegionLoading(true);
      await UserRegionPreferences.updateCurrentRegion(newRegion);
      setCurrentRegion(newRegion);
      setShowRegionModal(false);
      
      // 显示成功提示
      Alert.alert(
        t('common.success'),
        t('profile.region_updated_successfully', {
          region: UserRegionPreferences.getRegionDisplayName(newRegion, currentLanguage.startsWith('zh') ? 'zh' : 'en')
        })
      );
    } catch (error) {
      console.error('更新用户区域失败:', error);
      Alert.alert(t('common.error'), t('profile.region_update_failed'));
    } finally {
      setRegionLoading(false);
    }
  };

  // Debug permission trigger (hidden feature)
  const handleDebugTap = () => {
    setDebugTapCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 7) {
        setShowPermissionDebug(true);
        setDebugTapCount(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return newCount;
    });
  };
  
  // Handle delete account
  const handleDeleteAccountPress = () => {
    triggerHaptic();
    setShowDeleteAccountModal(true);
  };

  const handleDeleteAccountSuccess = () => {
    // 账号注销成功后，导航到认证页面
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  // Group 1: Account & Security
  const accountSecurityItems = [
    {
      id: 'account',
      title: t('profile.account'),
      icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        triggerHaptic();
        Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
      },
    },
    {
      id: 'privacy',
      title: t('profile.privacy'),
      icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        triggerHaptic();
        navigation.navigate('Terms', { type: 'privacy' });
      },
    },
    {
      id: 'deleteAccount',
      title: t('profile.delete_account.menu_title'),
      icon: 'trash-outline' as keyof typeof Ionicons.glyphMap,
      onPress: handleDeleteAccountPress,
      textColor: theme.colors.danger, // Red color for danger action
    },
  ];
  
  // Group 2: Notifications & General
  const notificationsGeneralItems = [
    {
      id: 'notifications',
      title: t('profile.notifications'),
      icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        triggerHaptic();
        Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
      },
    },
    {
      id: 'language',
      title: t('profile.language'),
      icon: 'globe-outline' as keyof typeof Ionicons.glyphMap,
      value: getLanguageDisplayName(currentLanguage),
      onPress: handleLanguagePress,
    },
    {
      id: 'region',
      title: t('profile.region'),
      icon: 'location-outline' as keyof typeof Ionicons.glyphMap,
      value: `${UserRegionPreferences.getRegionIcon(currentRegion)} ${UserRegionPreferences.getRegionDisplayName(currentRegion, currentLanguage.startsWith('zh') ? 'zh' : 'en')}`,
      onPress: handleRegionPress,
    },
    {
      id: 'appearance',
      title: t('profile.appearance'),
      icon: 'color-palette-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        triggerHaptic();
        Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
      },
    },
  ];
  
  // Group 2.5: Orders & Addresses (新增)
  const ordersAddressesItems = [
    {
      id: 'myOrders',
      title: t('profile.my_orders'),
      icon: 'receipt-outline' as keyof typeof Ionicons.glyphMap,
      badge: loadingOrders ? 'loading' : orderCount > 0 ? orderCount : null,
      onPress: () => {
        triggerHaptic();
        navigation.navigate('MyOrders');
      },
    },
    {
      id: 'addresses',
      title: t('profile.delivery_addresses'),
      icon: 'location-outline' as keyof typeof Ionicons.glyphMap,
      value: loadingAddresses ? '' : addressCount > 0 ? `${addressCount}` : t('profile.no_address'),
      onPress: () => {
        triggerHaptic();
        navigation.navigate('AddressList');
      },
    },
  ];

  // Group 3: About & Support
  const aboutSupportItems = [
    {
      id: 'about',
      title: t('profile.about'),
      icon: 'information-circle-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        triggerHaptic();
        Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
      },
    },
    {
      id: 'feedback',
      title: t('profile.feedback'),
      icon: 'chatbubble-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        triggerHaptic();
        Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
      },
    },
    {
      id: 'terms',
      title: t('profile.terms'),
      icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        triggerHaptic();
        navigation.navigate('Terms', { type: 'terms' });
      },
    },
  ];

  const renderMenuItem = (item: any, isLast: boolean = false) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        isLast && styles.menuItemLast
      ]}
      onPress={item.onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={
        item.value
          ? `${item.title}, ${item.value}`
          : item.title
      }
      accessibilityHint={item.value ? 'Double tap to change setting' : 'Double tap to open'}
      hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={item.icon}
          size={24}
          color={item.textColor || (isDarkMode ? theme.colors.primary : theme.colors.primary)}
          style={styles.menuIcon}
        />
        <Text
          style={[
            styles.menuItemText,
            isDarkMode && styles.menuItemTextDark,
            item.textColor && { color: item.textColor }
          ]}
          numberOfLines={1}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.4}
        >
          {item.title}
        </Text>
        {/* Badge (小红点) */}
        {item.badge === 'loading' ? (
          <ActivityIndicator size="small" color="#999999" style={{ marginLeft: 8 }} />
        ) : item.badge && typeof item.badge === 'number' ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{item.badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.menuItemRight}>
        {item.value && (
          <Text
            style={[
              styles.menuItemValue,
              isDarkMode && styles.menuItemValueDark
            ]}
            numberOfLines={1}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
          >
            {item.value}
          </Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDarkMode ? 'rgba(235, 235, 245, 0.3)' : theme.colors.text.tertiary}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
  
  const renderGroup = (title: string, items: any[]) => (
    <View style={styles.groupContainer}>
      <Text style={[
        styles.groupTitle,
        isDarkMode && styles.groupTitleDark
      ]}>
        {title}
      </Text>
      <View style={[
        styles.listContainer,
        styles.listContainerGlass
      ]}>
        {items.map((item, index) => 
          renderMenuItem(item, index === items.length - 1)
        )}
      </View>
    </View>
  );

  return (
    <View style={[
      styles.container,
      isDarkMode && styles.containerDark
    ]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: 56 + 12 + insets.bottom } // NavBar height + spacing + safe area
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={() => {}} // Explicit empty handler to prevent propagation issues
          scrollEventThrottle={16}
        >
        {/* 🌙 Dark Mode Debug Component - 临时调试 - 已注释以修复渲染错误 */}
        {/* <DarkModeTest /> */}
        
        {/* Avatar Card - Clickable for Edit Profile */}
        <TouchableOpacity 
          style={[
            styles.avatarCard,
            styles.avatarCardGlass
          ]}
          onPress={handleEditProfile}
          onLongPress={handleDebugTap}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          accessibilityHint="Double tap to edit your profile information"
        >
          <View style={[
            styles.avatar,
            isDarkMode && styles.avatarDark
          ]}>
            <Ionicons
              name="person"
              size={32}
              color={theme.colors.text.inverse}
            />
          </View>
          <View style={styles.avatarInfo}>
            <Text style={[
              styles.userName,
              isDarkMode && styles.userNameDark
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.4}
            >
              {t('profile.username')}
            </Text>
            <Text style={[
              styles.userEmail,
              isDarkMode && styles.userEmailDark
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
            >
              user@example.com
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isDarkMode ? 'rgba(235, 235, 245, 0.3)' : theme.colors.text.tertiary}
          />
        </TouchableOpacity>

        {/* Account & Security Group */}
        {renderGroup(t('profile.sections.accountSecurity'), accountSecurityItems)}

        {/* Orders & Addresses Group (新增) */}
        {renderGroup(t('profile.sections.ordersAddresses'), ordersAddressesItems)}

        {/* Notifications & General Group */}
        {renderGroup(t('profile.sections.notificationsGeneral'), notificationsGeneralItems)}

        {/* About & Support Group */}
        {renderGroup(t('profile.sections.aboutSupport'), aboutSupportItems)}
        
        {/* Logout Row */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[
              styles.logoutItem,
              isDarkMode && styles.logoutItemDark
            ]}
            onPress={handleLogout}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            accessibilityHint="Double tap to logout. This will clear all local data."
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={theme.colors.danger}
              style={styles.logoutIcon}
            />
            <Text style={styles.logoutText}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.4}
            >
              {t('profile.logout')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version Footer */}
        <View style={styles.versionFooter}>
          <Text style={[
            styles.versionText,
            isDarkMode && styles.versionTextDark
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.2}
          >
            PomeloX v1.0.24
          </Text>
        </View>
        </ScrollView>
      </SafeAreaView>
      
      {/* Permission Debug Modal */}
      <PermissionDebugModal 
        visible={showPermissionDebug}
        onClose={() => setShowPermissionDebug(false)}
      />
      
      {/* Region Switch Modal */}
      <RegionSwitchModal
        visible={showRegionModal}
        onClose={() => setShowRegionModal(false)}
        onRegionChanged={handleRegionChange}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onSuccess={handleDeleteAccountSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container - System Background
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7', // iOS systemBackground equivalent
  },
  containerDark: {
    backgroundColor: '#000000', // iOS systemBackground dark
  },
  
  safeArea: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  
  contentContainer: {
    paddingHorizontal: 16, // Match ProfileHomeScreen layout approach
    paddingTop: 20,
  },

  // Avatar Card - Clickable Profile Header
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // iOS secondarySystemGroupedBackground
    borderRadius: 14, // iOS inset grouped corner radius
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarCardDark: {
    backgroundColor: '#1c1c1e', // iOS secondarySystemGroupedBackground dark
  },
  
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarDark: {
    backgroundColor: theme.colors.primary,
  },
  
  avatarInfo: {
    flex: 1,
  },
  
  userName: {
    fontSize: 17, // iOS body text size
    fontWeight: '600', // iOS semibold
    color: '#000000', // iOS label
    marginBottom: 2,
  },
  userNameDark: {
    color: '#ffffff', // iOS label dark
  },
  
  userEmail: {
    fontSize: 15, // iOS callout size
    color: '#8e8e93', // iOS secondaryLabel
  },
  userEmailDark: {
    color: '#8e8e93', // iOS secondaryLabel dark (same)
  },

  // Group Containers
  groupContainer: {
    marginBottom: 24, // 20-24pt group spacing
  },
  
  groupTitle: {
    fontSize: 13, // iOS footnote size
    fontWeight: '400',
    color: '#8e8e93', // iOS secondaryLabel
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 16, // Align with content padding
  },
  groupTitleDark: {
    color: '#8e8e93', // iOS secondaryLabel dark
  },

  // iOS Inset Grouped List Container
  listContainer: {
    backgroundColor: '#ffffff', // iOS secondarySystemGroupedBackground
    borderRadius: 14, // iOS standard inset grouped radius
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listContainerDark: {
    backgroundColor: '#1c1c1e', // iOS secondarySystemGroupedBackground dark
  },

  // Menu Item Rows
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12, // ~54pt total height
    minHeight: 54,
    borderBottomWidth: Platform.select({
      ios: StyleSheet.hairlineWidth,
      android: 0.5,
    }),
    borderBottomColor: '#c6c6c8', // iOS separator
  },
  menuItemLast: {
    borderBottomWidth: 0, // No separator for last item
  },
  
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  menuIcon: {
    marginRight: 12, // 12pt spacing between icon and text
  },
  
  menuItemText: {
    fontSize: 17, // iOS body text
    fontWeight: '400',
    color: '#000000', // iOS label
    flex: 1,
  },
  menuItemTextDark: {
    color: '#ffffff', // iOS label dark
  },
  
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  menuItemValue: {
    fontSize: 15, // iOS callout
    color: '#8e8e93', // iOS secondaryLabel
    marginRight: 8,
  },
  menuItemValueDark: {
    color: '#8e8e93', // iOS secondaryLabel dark
  },
  
  chevron: {
    // Standard iOS chevron styling
  },

  // Logout Section
  logoutContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // iOS secondarySystemGroupedBackground
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 54,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutItemDark: {
    backgroundColor: '#1c1c1e', // iOS secondarySystemGroupedBackground dark
  },
  
  logoutIcon: {
    marginRight: 12,
  },
  
  logoutText: {
    fontSize: 17,
    fontWeight: '400',
    color: theme.colors.danger, // Red for danger action
  },

  // Version Footer
  versionFooter: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  
  versionText: {
    fontSize: 12, // iOS caption1
    color: '#8e8e93', // iOS secondaryLabel
    fontWeight: '400',
  },
  versionTextDark: {
    color: '#8e8e93', // iOS secondaryLabel dark
  },
  
  // V2.0 L1玻璃样式
  avatarCardGlass: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
  },
  
  listContainerGlass: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card, // 16pt圆角
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow.light],
  },

  // Badge Styles (小红点样式 - 参照PointsMallHomeScreen)
  countBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },

  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});