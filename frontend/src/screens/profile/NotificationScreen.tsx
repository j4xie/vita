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
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';

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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    settingTextDark: {
      color: '#ffffff',
    },
    settingSubtitle: {
      fontSize: 13,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Notification settings state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [activityUpdates, setActivityUpdates] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(true);
  const [comments, setComments] = useState(false);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

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

  const handleDoNotDisturbSettings = () => {
    Alert.alert(t('profile.notifications.doNotDisturb'), t('profile.notifications.doNotDisturbMessage'));
  };

  const handleNotificationSummary = () => {
    Alert.alert(t('profile.notifications.notificationSummary'), t('profile.notifications.notificationSummaryMessage'));
  };

  const pushItems = [
    {
      id: 'system-permission',
      title: t('profile.notifications.pushPermissions'),
      icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap,
      subtitle: t('profile.notifications.pushPermissionsSubtitle'),
      onPress: handleSystemSettings,
    },
  ];

  const notificationTypes = [
    {
      id: 'activity-updates',
      title: t('profile.notifications.activityUpdates'),
      icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
      subtitle: t('profile.notifications.activityUpdatesSubtitle'),
      hasSwitch: true,
      switchValue: activityUpdates,
      onSwitchChange: setActivityUpdates,
    },
    {
      id: 'registration-success',
      title: t('profile.notifications.registrationSuccess'),
      icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
      subtitle: t('profile.notifications.registrationSuccessSubtitle'),
      hasSwitch: true,
      switchValue: registrationSuccess,
      onSwitchChange: setRegistrationSuccess,
    },
    {
      id: 'comments',
      title: t('profile.notifications.commentsMessages'),
      icon: 'chatbubble-outline' as keyof typeof Ionicons.glyphMap,
      subtitle: t('profile.notifications.commentsMessagesSubtitle'),
      hasSwitch: true,
      switchValue: comments,
      onSwitchChange: setComments,
    },
  ];

  const advancedItems = [
    {
      id: 'do-not-disturb',
      title: t('profile.notifications.doNotDisturb'),
      icon: 'moon-outline' as keyof typeof Ionicons.glyphMap,
      value: doNotDisturb ? t('profile.notifications.doNotDisturbTime') : t('profile.notifications.doNotDisturbOff'),
      onPress: handleDoNotDisturbSettings,
    },
    {
      id: 'summary',
      title: t('profile.notifications.notificationSummary'),
      icon: 'list-outline' as keyof typeof Ionicons.glyphMap,
      value: t('profile.notifications.notificationSummaryOff'),
      onPress: handleNotificationSummary,
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
          {/* 推送权限 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.notifications.sectionPushPermissions')}</Text>
            <View style={styles.listContainer}>
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

          {/* 通知类型 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.notifications.sectionNotificationTypes')}</Text>
            <View style={styles.listContainer}>
              {notificationTypes.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  subtitle={item.subtitle}
                  hasSwitch={item.hasSwitch}
                  switchValue={item.switchValue}
                  onSwitchChange={item.onSwitchChange}
                  isLast={index === notificationTypes.length - 1}
                />
              ))}
            </View>
          </View>

          {/* 高级设置 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.notifications.sectionAdvancedSettings')}</Text>
            <View style={styles.listContainer}>
              {advancedItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  value={item.value}
                  onPress={item.onPress}
                  isLast={index === advancedItems.length - 1}
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