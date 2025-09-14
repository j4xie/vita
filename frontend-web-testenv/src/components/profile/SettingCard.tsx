import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';

interface SettingCardProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badgeCount?: number;
  hasNotification?: boolean;
  testID?: string;
}

export const SettingCard: React.FC<SettingCardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  badgeCount = 0,
  hasNotification = false,
  testID,
}) => {
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  const darkModeSystem = useAllDarkModeStyles();
  const { styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    // Press animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      aspectRatio: 1, // Square cards
      borderRadius: 18,
      padding: 16,
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.08 : 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDarkMode 
        ? 'rgba(255, 138, 101, 0.16)' 
        : 'rgba(255, 107, 53, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 4,
      numberOfLines: 1,
    },
    subtitle: {
      fontSize: 13,
      textAlign: 'center',
      numberOfLines: 1,
    },
    badge: {
      position: 'absolute',
      top: 12,
      right: 12,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    notificationDot: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.danger,
    },
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[styles.container, dmStyles.card.contentSection]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        accessibilityHint="Double tap to open settings"
        testID={testID}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={30}
            color={dmIcons.brand}
          />
        </Animated.View>
        
        <Text 
          style={[styles.title, dmStyles.text.primary]}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.4}
        >
          {title}
        </Text>
        
        {subtitle && (
          <Text 
            style={[styles.subtitle, dmStyles.text.secondary]}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
          >
            {subtitle}
          </Text>
        )}

        {/* Badge for notification count */}
        {badgeCount > 0 && (
          <Animated.View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </Animated.View>
        )}

        {/* Simple notification dot */}
        {hasNotification && badgeCount === 0 && (
          <Animated.View style={styles.notificationDot} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SettingCard;