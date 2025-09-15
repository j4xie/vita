import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { AppearanceDevModal } from '../../components/modals/AppearanceDevModal';
import { RegionSwitchModal } from '../../components/modals/RegionSwitchModal';
import UserRegionPreferences, { UserRegionCode } from '../../services/UserRegionPreferences';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { getCurrentToken } from '../../services/authAPI';

interface SettingRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  value?: string;
  isLast?: boolean;
  isDangerous?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  icon,
  onPress,
  value,
  isLast = false,
  isDangerous = false,
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
      paddingVertical: 12,
      minHeight: 54,
      borderBottomWidth: Platform.select({
        ios: StyleSheet.hairlineWidth,
        android: 0.5,
      }),
    },
    settingRowLast: {
      borderBottomWidth: 0,
    },
    settingRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingText: {
      fontSize: 17,
      fontWeight: '400',
      color: '#000000', // Default light color
      flex: 1,
    },
    settingTextDark: {
      color: '#ffffff',
    },
    settingRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingValue: {
      fontSize: 15,
      color: '#8e8e93',
      marginRight: 8,
    },
    settingValueDark: {
      color: '#8e8e93',
    },
  });

  return (
    <TouchableOpacity
      style={[
        rowStyles.settingRow,
        isLast && rowStyles.settingRowLast,
        { borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8' }
      ]}
      onPress={handlePress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, current setting: ${value}` : title}
      accessibilityHint="Double tap to change setting"
    >
      <View style={rowStyles.settingRowLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={isDangerous ? '#DC2626' : theme.colors.primary}
          style={rowStyles.settingIcon}
        />
        <Text
          style={[
            rowStyles.settingText,
            isDarkMode && rowStyles.settingTextDark,
            { color: isDangerous ? '#DC2626' : (isDarkMode ? '#ffffff' : '#000000') }
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.4}
        >
          {title}
        </Text>
      </View>
      <View style={rowStyles.settingRowRight}>
        {value && (
          <Text
            style={[
              rowStyles.settingValue,
              isDarkMode && rowStyles.settingValueDark,
            ]}
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

export const GeneralScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients } = darkModeSystem;
  const insets = useSafeAreaInsets();
  const { currentLanguage, getLanguageDisplayName } = useLanguage();
  const { themeMode, getThemeModeDisplayName } = useTheme();
  const { user, logout } = useUser();

  // Modal states
  const [showAppearanceDevModal, setShowAppearanceDevModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  // Cache states
  const [cacheSize, setCacheSize] = useState('');

  // Region states
  const [currentRegion, setCurrentRegion] = useState<UserRegionCode>('china');

  // Accessibility states
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  
  // Activity layout preference state
  const [activityLayout, setActivityLayout] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const checkAccessibility = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReduceMotionEnabled(reduceMotion);
    };
    checkAccessibility();
    
    // Calculate cache size
    calculateCacheSize();
    
    // Load activity layout preference
    loadActivityLayoutPreference();
    
    // Load current region
    loadCurrentRegion();
    
    // 监听布局变化事件
    const layoutSubscription = DeviceEventEmitter.addListener('activityLayoutChanged', (newLayout: 'list' | 'grid') => {
      setActivityLayout(newLayout);
    });

    return () => {
      layoutSubscription?.remove();
    };
  }, []);

  const calculateCacheSize = async () => {
    try {
      // Calculate AsyncStorage size
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      // Convert bytes to MB
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);
      setCacheSize(`${sizeInMB} MB`);
    } catch (error) {
      console.error('Error calculating cache size:', error);
      setCacheSize(t('profile.general.cacheSizeFallback')); // Fallback
    }
  };

  const handleLanguagePress = () => {
    navigation.navigate('LanguageSelection');
  };

  // Load current region from preferences
  const loadCurrentRegion = async () => {
    try {
      // 确保偏好设置已初始化
      let preferences = await UserRegionPreferences.getPreferences();
      if (!preferences) {
        console.log('初始化区域偏好设置...');
        preferences = await UserRegionPreferences.initializePreferences();
      }
      
      const region = await UserRegionPreferences.getCurrentRegion();
      setCurrentRegion(region);
    } catch (error) {
      console.warn('Failed to load current region:', error);
      // 设置默认值
      setCurrentRegion('china');
    }
  };

  const handleRegionPress = () => {
    setShowRegionModal(true);
  };

  const handleRegionChanged = async (newRegion: UserRegionCode) => {
    try {
      setCurrentRegion(newRegion);
      
      // Show success message
      const languageCode = (typeof currentLanguage === 'string' && currentLanguage.startsWith('zh')) ? 'zh' : 'en';
      const regionName = UserRegionPreferences.getRegionDisplayName(newRegion, languageCode);
      Alert.alert(
        t('common.success'),
        t('profile.region_updated_successfully', { region: regionName }),
      );
    } catch (error) {
      console.error('Region change failed:', error);
      Alert.alert(
        t('common.error'),
        t('common.try_again_later')
      );
    }
  };

  const handleAppearancePress = () => {
    setShowAppearanceDevModal(true);
  };
  
  // Load activity layout preference
  const loadActivityLayoutPreference = async () => {
    try {
      const savedLayout = await AsyncStorage.getItem('activity_view_layout');
      if (savedLayout && (savedLayout === 'list' || savedLayout === 'grid')) {
        setActivityLayout(savedLayout);
      }
    } catch (error) {
      console.warn('Failed to load activity layout preference:', error);
    }
  };
  
  // Handle activity layout change - 导航到简洁的选择页面
  const handleActivityLayoutPress = () => {
    navigation.navigate('ActivityLayoutSelection', {
      currentLayout: activityLayout,
      // 不传递function，避免React Navigation warning
    });
  };
  
  const getActivityLayoutDisplayName = () => {
    return activityLayout === 'list' ? t('common.listView') : t('common.gridView');
  };

  const handleDataPress = () => {
    Alert.alert(
      t('profile.general.clearCacheTitle'),
      t('profile.general.clearCacheMessage'),
      [
        {
          text: t('profile.general.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.general.clear'),
          style: 'destructive',
          onPress: clearCache,
        },
      ]
    );
  };

  const clearCache = async () => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // 清理 AsyncStorage 中的非关键数据
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key => 
        !key.includes('language') && // 保留语言设置
        !key.includes('theme') && // 保留主题设置
        !key.includes('userToken') && // 保留登录状态
        !key.includes('user_') // 保留用户相关设置
      );
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      // 重新计算缓存大小
      await calculateCacheSize();

      Alert.alert(
        t('profile.general.clearSuccess'),
        t('profile.general.clearSuccessMessage')
      );
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert(
        t('profile.general.clearFailed'),
        t('profile.general.clearFailedMessage')
      );
    }
  };

  // Delete account functions
  const handleDeleteAccountPress = () => {
    Alert.alert(
      t('profile.account.deleteAccountConfirm'),
      t('profile.account.deleteAccountWarning'),
      [
        {
          text: t('profile.account.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.account.deleteAccount'),
          style: 'destructive',
          onPress: performDeleteAccount,
        },
      ]
    );
  };

  const performDeleteAccount = async () => {
    try {
      const token = await getCurrentToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // Call delete account API (接口20)  
      const response = await fetch(`${pomeloXAPI.baseURL}/user/logoff?userId=${user?.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Delete account failed: ${response.status}`);
      }

      // Clear all local data and logout
      await logout();
      
      // Show success message and navigate to auth
      Alert.alert(
        t('common.success'),
        'Account deleted successfully',
        [
          {
            text: t('common.confirm'),
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert(
        t('common.error'),
        'Failed to delete account. Please try again later.',
        [{ text: t('common.confirm') }]
      );
    }
  };

  const getAppearanceValue = () => {
    return getThemeModeDisplayName(themeMode, t);
  };

  const displayItems = [
    {
      id: 'language',
      title: t('profile.general.language'),
      icon: 'globe-outline' as keyof typeof Ionicons.glyphMap,
      value: getLanguageDisplayName(currentLanguage),
      onPress: handleLanguagePress,
    },
    {
      id: 'region',
      title: t('profile.general.regionAndTimezone'),
      icon: 'location-outline' as keyof typeof Ionicons.glyphMap,
      value: `${UserRegionPreferences.getRegionIcon(currentRegion)} ${UserRegionPreferences.getRegionDisplayName(currentRegion, (typeof currentLanguage === 'string' && currentLanguage.startsWith('zh')) ? 'zh' : 'en')}`,
      onPress: handleRegionPress,
    },
    // 外观设置已隐藏以通过App Store审核
    /* {
      id: 'appearance',
      title: t('profile.general.appearance'),
      icon: 'color-palette-outline' as keyof typeof Ionicons.glyphMap,
      value: getAppearanceValue(),
      onPress: handleAppearancePress,
    }, */
    {
      id: 'activity-layout',
      title: t('profile.general.activityLayout', '活动布局'),
      icon: 'grid-outline' as keyof typeof Ionicons.glyphMap,
      value: getActivityLayoutDisplayName(),
      onPress: handleActivityLayoutPress,
    },
  ];

  const storageItems = [
    {
      id: 'data-cache',
      title: t('profile.general.dataAndCache'),
      icon: 'server-outline' as keyof typeof Ionicons.glyphMap,
      value: cacheSize,
      onPress: handleDataPress,
    },
  ];

  // Account management items - only show for authenticated users
  const accountItems = user ? [
    {
      id: 'delete-account',
      title: t('profile.general.deleteAccount'),
      icon: 'trash-outline' as keyof typeof Ionicons.glyphMap,
      value: '',
      onPress: handleDeleteAccountPress,
      isDangerous: true, // Mark as dangerous action
    },
  ] : [];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f2f2f7', // Default light background
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
      paddingBottom: 56 + 12 + insets.bottom,
    },
    groupContainer: {
      marginBottom: 32,
    },
    groupTitle: {
      fontSize: 13,
      fontWeight: '400',
      color: '#8e8e93', // Default light color
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 16,
    },
    listContainer: {
      backgroundColor: '#ffffff', // Default white background
      borderRadius: 14,
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
  });

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? dmStyles.page.safeArea.backgroundColor : '#f2f2f7' }
    ]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 显示与外观 */}
          <View style={styles.groupContainer}>
            <Text style={[
              styles.groupTitle,
              { color: isDarkMode ? dmStyles.text.secondary.color : '#8e8e93' }
            ]}>{t('profile.general.sectionDisplayAppearance')}</Text>
            <View style={[
              styles.listContainer,
              { backgroundColor: isDarkMode ? dmStyles.card.contentSection.backgroundColor : '#ffffff' }
            ]}>
              {displayItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  value={item.value}
                  onPress={item.onPress}
                  isLast={index === displayItems.length - 1}
                />
              ))}
            </View>
          </View>

          {/* 存储与性能 */}
          <View style={styles.groupContainer}>
            <Text style={[
              styles.groupTitle,
              { color: isDarkMode ? dmStyles.text.secondary.color : '#8e8e93' }
            ]}>{t('profile.general.sectionStoragePerformance')}</Text>
            <View style={[
              styles.listContainer,
              { backgroundColor: isDarkMode ? dmStyles.card.contentSection.backgroundColor : '#ffffff' }
            ]}>
              {storageItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  value={item.value}
                  onPress={item.onPress}
                  isLast={index === storageItems.length - 1}
                />
              ))}
            </View>
          </View>

          {/* 账户管理 - 仅对已登录用户显示 */}
          {user && accountItems.length > 0 && (
            <View style={styles.groupContainer}>
              <Text style={[
                styles.groupTitle,
                { color: isDarkMode ? dmStyles.text.secondary.color : '#8e8e93' }
              ]}>{t('profile.general.sectionAccountManagement')}</Text>
              <View style={[
                styles.listContainer,
                { backgroundColor: isDarkMode ? dmStyles.card.contentSection.backgroundColor : '#ffffff' }
              ]}>
                {accountItems.map((item, index) => (
                  <SettingRow
                    key={item.id}
                    title={item.title}
                    icon={item.icon}
                    value={item.value}
                    onPress={item.onPress}
                    isLast={index === accountItems.length - 1}
                    isDangerous={item.isDangerous}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Appearance Development Modal - 已隐藏以通过App Store审核 */}
      {/* <AppearanceDevModal
        visible={showAppearanceDevModal}
        onClose={() => setShowAppearanceDevModal(false)}
      /> */}

      {/* Region Switch Modal */}
      <RegionSwitchModal
        visible={showRegionModal}
        onClose={() => setShowRegionModal(false)}
        onRegionChanged={handleRegionChanged}
      />
    </View>
  );
};

export default GeneralScreen;