import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../../utils/i18n';

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

interface LanguageRowProps {
  language: LanguageOption;
  isSelected: boolean;
  onPress: () => void;
  isLast?: boolean;
}

const LanguageRow: React.FC<LanguageRowProps> = ({
  language,
  isSelected,
  onPress,
  isLast = false,
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
    languageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      minHeight: 60,
      borderBottomWidth: Platform.select({
        ios: StyleSheet.hairlineWidth,
        android: 0.5,
      }),
    },
    languageRowLast: {
      borderBottomWidth: 0,
    },
    languageRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    flagEmoji: {
      fontSize: 28,
      marginRight: 16,
    },
    languageTextContainer: {
      flex: 1,
    },
    nativeLabel: {
      fontSize: 17,
      fontWeight: '400',
      color: isDarkMode ? '#ffffff' : '#000000',
      marginBottom: 2,
    },
    nativeLabelDark: {
      color: '#ffffff',
    },
    englishLabel: {
      fontSize: 15,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
    },
    englishLabelDark: {
      color: '#8e8e93',
    },
  });

  return (
    <TouchableOpacity
      style={[
        rowStyles.languageRow,
        isLast && rowStyles.languageRowLast,
        { borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8' }
      ]}
      onPress={handlePress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${language.nativeLabel}, ${language.label}`}
      accessibilityState={{ selected: isSelected }}
      accessibilityHint="Double tap to select this language"
    >
      <View style={rowStyles.languageRowLeft}>
        <Text style={rowStyles.flagEmoji}>{language.flag}</Text>
        <View style={rowStyles.languageTextContainer}>
          <Text
            style={[
              rowStyles.nativeLabel,
              isDarkMode && rowStyles.nativeLabelDark,
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.4}
          >
            {language.nativeLabel}
          </Text>
          <Text
            style={[
              rowStyles.englishLabel,
              isDarkMode && rowStyles.englishLabelDark,
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
          >
            {language.label}
          </Text>
        </View>
      </View>
      {isSelected && (
        <Ionicons
          name="checkmark"
          size={20}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );
};

export const LanguageSelectionScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const insets = useSafeAreaInsets();
  const { currentLanguage, changeLanguage } = useLanguage();

  const [isChanging, setIsChanging] = useState(false);

  // Language options with flags and native names
  const languageOptions: LanguageOption[] = [
    {
      code: 'zh-CN',
      label: 'Chinese (Simplified)',
      nativeLabel: '简体中文',
      flag: '🇨🇳',
    },
    {
      code: 'en-US',
      label: 'English (United States)',
      nativeLabel: 'English',
      flag: '🇺🇸',
    },
  ];

  const handleLanguageSelect = async (languageCode: SupportedLanguage) => {
    if (languageCode === currentLanguage || isChanging) {
      return;
    }

    setIsChanging(true);

    try {
      await changeLanguage(languageCode);
      
      // Give a brief moment for UI to update
      setTimeout(() => {
        setIsChanging(false);
        navigation.goBack();
      }, 200);
      
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsChanging(false);
    }
  };

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
    headerText: {
      fontSize: 16,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      marginBottom: 20,
      paddingHorizontal: 16,
      lineHeight: 22,
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
    footer: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    footerText: {
      fontSize: 14,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      lineHeight: 20,
      textAlign: 'center',
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
          <Text style={styles.headerText}>
            {t('language.settings.description')}
          </Text>

          <View style={styles.listContainer}>
            {languageOptions.map((language, index) => (
              <LanguageRow
                key={language.code}
                language={language}
                isSelected={language.code === currentLanguage}
                onPress={() => handleLanguageSelect(language.code)}
                isLast={index === languageOptions.length - 1}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('language.settings.footerNote')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default LanguageSelectionScreen;