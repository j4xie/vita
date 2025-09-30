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
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { 
  smartAlertSystem, 
  getAlertSettings, 
  saveAlertSettings,
  AlertSettings 
} from '../../services/smartAlertSystem';

interface SettingRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  value?: string;
  isLast?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  subtitle?: string;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  icon,
  onPress,
  value,
  isLast = false,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange,
  subtitle,
}) => {
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    if (onPress) {
      onPress();
    }
  };

  const handleSwitchChange = (value: boolean) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    if (onSwitchChange) {
      onSwitchChange(value);
    }
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
    settingTextContainer: {
      flex: 1,
    },
    settingText: {
      fontSize: 17,
      fontWeight: '400',
      color: '#000000', // Default light color
    },
    settingTextDark: {
      color: '#ffffff',
    },
    settingSubtitle: {
      fontSize: 13,
      color: '#8e8e93',
      marginTop: 2,
    },
    settingSubtitleDark: {
      color: '#8e8e93',
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
      onPress={hasSwitch ? undefined : handlePress}
      activeOpacity={hasSwitch ? 1 : 0.6}
      disabled={hasSwitch}
      accessibilityRole={hasSwitch ? "switch" : "button"}
      accessibilityLabel={value ? `${title}, ${value}` : title}
      accessibilityHint={hasSwitch ? "Double tap to toggle" : "Double tap to open"}
    >
      <View style={rowStyles.settingRowLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={theme.colors.primary}
          style={rowStyles.settingIcon}
        />
        <View style={rowStyles.settingTextContainer}>
          <Text
            style={[
              rowStyles.settingText,
              isDarkMode && rowStyles.settingTextDark,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.4}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                rowStyles.settingSubtitle,
                isDarkMode && rowStyles.settingSubtitleDark,
                { color: isDarkMode ? '#8e8e93' : '#8e8e93' }
              ]}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.3}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={rowStyles.settingRowRight}>
        {hasSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={handleSwitchChange}
            trackColor={{ 
              false: isDarkMode ? '#39393d' : '#767577', 
              true: theme.colors.primary 
            }}
            thumbColor={Platform.OS === 'ios' ? undefined : '#ffffff'}
            ios_backgroundColor={isDarkMode ? '#39393d' : '#767577'}
          />
        ) : (
          <>
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
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const NotificationScreen: React.FC = () => {
  const { t } = useTranslation();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients } = darkModeSystem;
  const insets = useSafeAreaInsets();

  // Alert settings state
  const [settings, setSettings] = useState<AlertSettings>({
    activityUpdates: true,
    registrationSuccess: true,
    comments: false,
    doNotDisturb: false,
    doNotDisturbStartTime: '22:00',
    doNotDisturbEndTime: '08:00',
  });
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('granted'); // JS系统默认有权限

  // 加载提醒设置
  useEffect(() => {
    const loadAlertData = async () => {
      try {
        // 加载用户设置
        const savedSettings = await getAlertSettings();
        setSettings(savedSettings);
        
        // 获取权限状态（JS系统默认有权限）
        const status = await smartAlertSystem.getPermissionStatus();
        setPermissionStatus(status);
      } catch (error) {
        console.error('加载提醒数据失败:', error);
      }
    };

    loadAlertData();
  }, []);

  // 处理设置变更
  const handleSettingChange = async (key: keyof AlertSettings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveAlertSettings(newSettings);
      
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      }
    } catch (error) {
      console.error('保存提醒设置失败:', error);
    }
  };

  const handleSystemSettings = async () => {
    try {
      // 尝试打开应用的系统设置页面
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        // Android
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Unable to open system settings:', error);
      Alert.alert(
        t('profile.notifications.cannotOpenSettings'),
        t('profile.notifications.cannotOpenSettingsMessage')
      );
    }
  };

  // 测试相关函数已移除
  /*
  const handleTestAlert = async () => {
    try {
      await smartAlertSystem.showSuccessAlert(
        t('profile.notifications.testAlertTitle', '🧪 Test Alert'),
        t('profile.notifications.testAlertMessage', 'Smart notification system is working! This is a test message.')
      );
    } catch (error) {
      console.error('测试提醒失败:', error);
    }
  };

  const pushItems = [
    {
      id: 'system-permission',
      title: t('profile.notifications.pushPermissions'),
      icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap,
      onPress: handleTestAlert,
    },
  ];
  */

  const notificationTypes = [
    {
      id: 'activity-updates',
      title: t('profile.notifications.activityUpdates'),
      icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
      hasSwitch: true,
      switchValue: settings.activityUpdates,
      onSwitchChange: (value: boolean) => handleSettingChange('activityUpdates', value),
    },
    {
      id: 'registration-success',
      title: t('profile.notifications.registrationSuccess'),
      icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
      hasSwitch: true,
      switchValue: settings.registrationSuccess,
      onSwitchChange: (value: boolean) => handleSettingChange('registrationSuccess', value),
    },
    {
      id: 'comments',
      title: t('profile.notifications.commentsMessages'),
      icon: 'chatbubble-outline' as keyof typeof Ionicons.glyphMap,
      hasSwitch: true,
      switchValue: settings.comments,
      onSwitchChange: (value: boolean) => handleSettingChange('comments', value),
    },
  ];


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
          {/* 推送权限 - 暂时隐藏测试功能 */}
          {/*
          <View style={styles.groupContainer}>
            <Text style={[
              styles.groupTitle,
              { color: isDarkMode ? dmStyles.text.secondary.color : '#8e8e93' }
            ]}>{t('profile.notifications.sectionPushPermissions')}</Text>
            <View style={[
              styles.listContainer,
              { backgroundColor: isDarkMode ? dmStyles.card.contentSection.backgroundColor : '#ffffff' }
            ]}>
              {pushItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  subtitle={item.subtitle}
                  onPress={item.onPress}
                  isLast={index === pushItems.length - 1}
                />
              ))}
            </View>
          </View>
          */}

          {/* 通知类型 */}
          <View style={styles.groupContainer}>
            <Text style={[
              styles.groupTitle,
              { color: isDarkMode ? dmStyles.text.secondary.color : '#8e8e93' }
            ]}>{t('profile.notifications.sectionNotificationTypes')}</Text>
            <View style={[
              styles.listContainer,
              { backgroundColor: isDarkMode ? dmStyles.card.contentSection.backgroundColor : '#ffffff' }
            ]}>
              {notificationTypes.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  hasSwitch={item.hasSwitch}
                  switchValue={item.switchValue}
                  onSwitchChange={item.onSwitchChange}
                  isLast={index === notificationTypes.length - 1}
                />
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default NotificationScreen;