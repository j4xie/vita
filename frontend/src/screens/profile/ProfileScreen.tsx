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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { currentLanguage, getLanguageDisplayName } = useLanguage();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Accessibility states
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  
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
      await AsyncStorage.clear();
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
    Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
  };
  
  // Handle language selection
  const handleLanguagePress = () => {
    triggerHaptic();
    Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
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
        Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
      },
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
      onPress: () => {
        triggerHaptic();
        Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
      },
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
        Alert.alert(t('common.confirm'), t('alerts.feature_not_implemented'));
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
          color={isDarkMode ? theme.colors.primary : theme.colors.primary}
          style={styles.menuIcon}
        />
        <Text 
          style={[
            styles.menuItemText,
            isDarkMode && styles.menuItemTextDark
          ]}
          numberOfLines={1}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.4}
        >
          {item.title}
        </Text>
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
        isDarkMode && styles.listContainerDark
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
        {/* Avatar Card - Clickable for Edit Profile */}
        <TouchableOpacity 
          style={[
            styles.avatarCard,
            isDarkMode && styles.avatarCardDark
          ]}
          onPress={handleEditProfile}
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
            西柚 v1.0.0
          </Text>
        </View>
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: 16, // Standard iOS margins
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
    marginLeft: 16, // Align with list content
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
});