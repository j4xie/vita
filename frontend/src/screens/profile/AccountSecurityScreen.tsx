import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';

interface SettingRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  value?: string;
  isLast?: boolean;
  isDanger?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  icon,
  onPress,
  value,
  isLast = false,
  isDanger = false,
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
    settingTextDanger: {
      color: theme.colors.danger,
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
      accessibilityLabel={value ? `${title}, ${value}` : title}
      accessibilityHint="Double tap to open"
    >
      <View style={rowStyles.settingRowLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={isDanger ? theme.colors.danger : theme.colors.primary}
          style={rowStyles.settingIcon}
        />
        <Text
          style={[
            rowStyles.settingText,
            isDanger && rowStyles.settingTextDanger,
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
        {!isDanger && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isDarkMode ? 'rgba(235, 235, 245, 0.3)' : '#c7c7cc'}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export const AccountSecurityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Accessibility states
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    const checkAccessibility = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReduceMotionEnabled(reduceMotion);
    };
    checkAccessibility();
  }, []);

  const handleLogout = () => {
    // Haptic feedback
    if (Platform.OS === 'ios' && !isReduceMotionEnabled) {
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

  const accountItems = [
    {
      id: 'profile',
      title: t('profile.account.personalProfile'),
      icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => Alert.alert(t('profile.account.personalProfile'), t('profile.account.personalProfileMessage')),
    },
    {
      id: 'login-security',
      title: t('profile.account.loginSecurity'),
      icon: 'key-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => Alert.alert(t('profile.account.loginSecurity'), t('profile.account.loginSecurityMessage')),
    },
  ];

  const privacyItems = [
    {
      id: 'privacy-permissions',
      title: t('profile.account.privacyPermissions'),
      icon: 'lock-closed-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => Alert.alert(t('profile.account.privacyPermissions'), t('profile.account.privacyPermissionsMessage')),
    },
    {
      id: 'third-party',
      title: t('profile.account.thirdPartyAccounts'),
      icon: 'link-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => Alert.alert(t('profile.account.thirdPartyAccounts'), t('profile.account.thirdPartyAccountsMessage')),
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
    logoutContainer: {
      marginTop: 32,
    },
    logoutRow: {
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
          {/* 账户信息 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.account.sectionAccountInfo')}</Text>
            <View style={styles.listContainer}>
              {accountItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  onPress={item.onPress}
                  isLast={index === accountItems.length - 1}
                />
              ))}
            </View>
          </View>

          {/* 隐私与安全 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.account.sectionPrivacySecurity')}</Text>
            <View style={styles.listContainer}>
              {privacyItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  onPress={item.onPress}
                  isLast={index === privacyItems.length - 1}
                />
              ))}
            </View>
          </View>

          {/* 退出登录 */}
          <View style={styles.logoutContainer}>
            <View style={styles.logoutRow}>
              <SettingRow
                title={t('profile.account.logout')}
                icon="log-out-outline"
                onPress={handleLogout}
                isLast={true}
                isDanger={true}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AccountSecurityScreen;