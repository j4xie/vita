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
  useColorScheme,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSelectionModal } from '../../components/common/ThemeSelectionModal';

interface SettingRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  value?: string;
  isLast?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  icon,
  onPress,
  value,
  isLast = false,
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
      color: isDarkMode ? '#ffffff' : '#000000',
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
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
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
          color={theme.colors.primary}
          style={rowStyles.settingIcon}
        />
        <Text
          style={[
            rowStyles.settingText,
            isDarkMode && rowStyles.settingTextDark,
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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { currentLanguage, getLanguageDisplayName } = useLanguage();
  const { themeMode, getThemeModeDisplayName } = useTheme();

  // Modal states
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Cache states
  const [cacheSize, setCacheSize] = useState('');

  // Accessibility states
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    const checkAccessibility = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReduceMotionEnabled(reduceMotion);
    };
    checkAccessibility();
    
    // Calculate cache size
    calculateCacheSize();
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

  const handleRegionPress = () => {
    Alert.alert(t('profile.general.regionAndTimezone'), t('profile.general.regionTimezoneMessage'));
  };

  const handleAppearancePress = () => {
    setShowThemeModal(true);
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

  const getAppearanceValue = () => {
    return getThemeModeDisplayName(themeMode);
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
      value: t('profile.general.chinaMainland'),
      onPress: handleRegionPress,
    },
    {
      id: 'appearance',
      title: t('profile.general.appearance'),
      icon: 'color-palette-outline' as keyof typeof Ionicons.glyphMap,
      value: getAppearanceValue(),
      onPress: handleAppearancePress,
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#f2f2f7',
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
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 16,
    },
    listContainer: {
      backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 显示与外观 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.general.sectionDisplayAppearance')}</Text>
            <View style={styles.listContainer}>
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
            <Text style={styles.groupTitle}>{t('profile.general.sectionStoragePerformance')}</Text>
            <View style={styles.listContainer}>
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
        </ScrollView>
      </SafeAreaView>

      {/* Theme Selection Modal */}
      <ThemeSelectionModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </View>
  );
};

export default GeneralScreen;