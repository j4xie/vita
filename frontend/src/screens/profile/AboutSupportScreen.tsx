import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface SettingRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  value?: string;
  isLast?: boolean;
  isExternal?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  icon,
  onPress,
  value,
  isLast = false,
  isExternal = false,
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
      accessibilityLabel={value ? `${title}, ${value}` : title}
      accessibilityHint={isExternal ? "Double tap to open in browser" : "Double tap to open"}
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
          name={isExternal ? "open-outline" : "chevron-forward"}
          size={16}
          color={isDarkMode ? 'rgba(235, 235, 245, 0.3)' : '#c7c7cc'}
        />
      </View>
    </TouchableOpacity>
  );
};

export const AboutSupportScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const insets = useSafeAreaInsets();

  const handleAppInfo = () => {
    Alert.alert(
      'PomeloX',
      t('profile.about.appInfoDetails'),
      [{ text: t('profile.about.confirmAppInfo'), style: 'default' }]
    );
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('Terms', { type: 'privacy' });
  };

  const handleTermsOfService = () => {
    navigation.navigate('Terms', { type: 'terms' });
  };

  const handleGitHub = () => {
    // Example external link
    const url = 'https://github.com/pomelox';
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('profile.about.error'), t('profile.about.cannotOpenLink'));
      }
    });
  };

  const appInfoItems = [
    {
      id: 'app-info',
      title: t('profile.about.aboutApp'),
      icon: 'information-circle-outline' as keyof typeof Ionicons.glyphMap,
      value: 'v1.0.24',
      onPress: handleAppInfo,
    },
  ];

  const supportItems = [
    {
      id: 'github',
      title: t('profile.about.githubRepo'),
      icon: 'logo-github' as keyof typeof Ionicons.glyphMap,
      onPress: handleGitHub,
      isExternal: true,
    },
  ];

  const legalItems = [
    {
      id: 'privacy',
      title: t('profile.about.privacyPolicy'),
      icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
      onPress: handlePrivacyPolicy,
      isExternal: false,
    },
    {
      id: 'terms',
      title: t('profile.about.termsOfService'),
      icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
      onPress: handleTermsOfService,
      isExternal: false,
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
    versionFooter: {
      alignItems: 'center',
      paddingVertical: 20,
      marginTop: 16,
    },
    versionText: {
      fontSize: 12,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      textAlign: 'center',
    },
    copyrightText: {
      fontSize: 12,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      textAlign: 'center',
      marginTop: 4,
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
          {/* 应用信息 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.about.sectionAppInfo')}</Text>
            <View style={styles.listContainer}>
              {appInfoItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  value={item.value}
                  onPress={item.onPress}
                  isLast={index === appInfoItems.length - 1}
                />
              ))}
            </View>
          </View>

          {/* 支持与反馈 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.about.sectionSupportFeedback')}</Text>
            <View style={styles.listContainer}>
              {supportItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  onPress={item.onPress}
                  isExternal={item.isExternal}
                  isLast={index === supportItems.length - 1}
                />
              ))}
            </View>
          </View>

          {/* 法律条款 */}
          <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{t('profile.about.sectionLegalTerms')}</Text>
            <View style={styles.listContainer}>
              {legalItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  onPress={item.onPress}
                  isExternal={item.isExternal}
                  isLast={index === legalItems.length - 1}
                />
              ))}
            </View>
          </View>


          {/* Version Footer */}
          <View style={styles.versionFooter}>
            <Text style={styles.versionText}>
              PomeloX v1.0.24 Build 25
            </Text>
            <Text style={styles.copyrightText}>
              © 2025 PomeloX. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AboutSupportScreen;